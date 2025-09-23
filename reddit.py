from flask import Blueprint
from config import config
from collections import Counter
import os
from auth import token_required
import requests
from pathlib import Path
from flask import Flask, jsonify
from PIL import Image
import pytesseract
from transformers import pipeline
import praw
import glob
import json
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
from Generate.Helpers import load_templates
from Generate.caption_ai import generate_caption
from Generate.meme_generator import create_meme
# Create Blueprint for admin routes
reddit_bp = Blueprint('reddit', __name__)

# Get configuration
current_config = config[os.environ.get('FLASK_ENV', 'default')]
SUBREDDITS = ["memes", "dankmemes"]
EMBED_MODEL = "all-MiniLM-L6-v2"
IMAGES_DIR="Memes"
# ========== Utils ==========
def get_reddit_client():
    return praw.Reddit(
        client_id=os.environ.get("REDDIT_CLIENT_ID","7giKev-KvdPcQY75FhWHLg"),
        client_secret=os.environ.get("REDDIT_CLIENT_SECRET","31Tn8BqseWmLjg9y2yojxgDCh4nhoQ"),
        user_agent=os.environ.get("REDDIT_USER_AGENT", "meme_topic_scraper"),
        check_for_async=False,
    )

def download_memes(limit=50):
    reddit = get_reddit_client()
    posts = []
    for sub in SUBREDDITS:
        subreddit = reddit.subreddit(sub)
        for post in subreddit.hot(limit=limit):
            url = post.url.lower()
            if any(url.endswith(ext) for ext in (".jpg", ".png", ".jpeg")) or "i.redd.it" in url:
                filename =os.path.join(IMAGES_DIR,f"{post.id}.jpg")
                try:
                    resp = requests.get(post.url, timeout=10)
                    resp.raise_for_status()
                    with open(filename, "wb") as f:
                        f.write(resp.content)
                    posts.append({"id": post.id, "title": post.title, "path": str(filename)})
                except Exception as e:
                    print(f"Download failed {post.url}: {e}")
    return posts

def extract_text(image_path: str) -> str:
    try:
        img = Image.open(image_path)
        if img.mode != "RGB":
            img = img.convert("RGB")
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        print(f"OCR failed for {image_path}: {e}")
        return ""

@reddit_bp.route('/process', methods=['GET'])
def reddit_get():
    results = []
    posts = download_memes(limit=100)
    if not posts:
        return jsonify({"status": "error", "message": "No memes scraped"}), 400

    # 2. OCR text extraction
    texts = []
    for p in posts:
        extracted = extract_text(p["path"])
        if extracted:
            texts.append(extracted)
        else:
            texts.append(p["title"]) 
        try:
            os.remove(p["path"])
        except Exception as e:
            print(f"Could not delete {p['path']}: {e}")        

    # 3. Topic modeling with BERTopic
    model = SentenceTransformer(EMBED_MODEL)
    topic_model = BERTopic(embedding_model=model)
    topics, _ = topic_model.fit_transform(texts)

    topic_info = topic_model.get_topic_info().to_dict(orient="records")

    # 4. Get first 10 most popular topics (excluding -1 = outliers)
    filtered = [t for t in topic_info if t["Topic"] != -1]
    top_10 = filtered[:2]
    classifier = pipeline("zero-shot-classification", model="tasksource/deberta-small-long-nli")

    # Example template dict (replace with your own)
    templates_dict = load_templates()
    keys = list(templates_dict.keys())
    # 5. Placeholder for caption generation
    for t in top_10:
        topic_desc = t.get("Name") or " ".join(t.get("Representative_Docs", [])[:1])
        if not topic_desc.strip():
            topic_desc = "generic meme"

        # Run zero-shot classification
        result = classifier(topic_desc, keys)
        best_label = result["labels"][0]

        # Get template info
        template_info = templates_dict[best_label]
        meme_name = template_info["name"]
        template_tags = template_info["tags"]
        caption_count = len(template_info.get("captions", {}))
        # 🔹 Call your generate_caption function
        generated = generate_caption(
            topic=topic_desc,
            template=template_info,
            template_tags=template_tags,
            meme_name=meme_name,
            num_captions=caption_count,
            lang="en"
        )

        # Add to response
        t["matched_template"] = best_label
        t["template_name"] = meme_name
        t["generated_caption"] = generated
        output_path = create_meme(template_info, generated)

        if output_path and os.path.exists(output_path):
            # Update user's meme count

            # Append result instead of returning
            results.append({
                'success': True,
                'meme_path': output_path,
                'topic': topic_desc,
                'template': template_info['name']
            })
        else:
            results.append({
                'success': False,
                'error': 'Meme generation failed',
                'topic': topic_desc,
                'template': template_info['name']
            })

    return jsonify({
        "status": "ok",
        "results": results
    })



STORAGE_PATH = "/memes_storage"  # ✅ root-level storage

def get_latest_json():
    files = sorted(glob.glob(f"{STORAGE_PATH}/memes_*.json"))
    if not files:
        return None
    latest = files[-1]
    with open(latest, "r", encoding="utf-8") as f:
        return json.load(f)

@reddit_bp.route("/latest", methods=["GET"])
@token_required
def get_latest_memes():
    data = get_latest_json()
    if data is None:
        return jsonify({"status": "error", "message": "No meme JSON found"}), 404
    return jsonify(data)