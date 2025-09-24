from flask import Blueprint,request
from config import config
import os
from auth import token_required
from flask import Flask, jsonify
from transformers import pipeline
from Generate.Helpers import load_templates
from Generate.caption_ai import generate_chat
from Generate.meme_generator import create_meme

chat_bp = Blueprint('chat', __name__)
current_config = config[os.environ.get('FLASK_ENV', 'default')]


@chat_bp.route('/chat', methods=['POST'])
@token_required
def chat(current_user):
    data = request.get_json()
    topic = data.get('topic')
    language = data.get('lang', 'en')
    language = "tr" if language == "tr-TR" else "en"
    templates_dict = load_templates()
    classifier = pipeline("zero-shot-classification", model="tasksource/deberta-small-long-nli")
    best_label = None
    best_score = -1

    for template_name, template in templates_dict.items():
        # Build a description string for the template
        description = f"Template: {template['name']}. "
        description += f"Tags: {', '.join(template['tags'])}. "
        description += f"Explanation: {template['explanation']} "
        example_texts = [f'{ex.get("caption1","")} / {ex.get("caption2","")} / {ex.get("caption3","")} / {ex.get("caption4","")} / {ex.get("caption5","")}' for ex in template["examples"]]
        description += "Examples: " + "; ".join(example_texts)
        
        # Create the statement for suitability
        statement = f"Topic: '{topic}'. Template description: {description}."
        
        # Zero-shot classification: binary labels
        result = classifier(statement, candidate_labels=["available", "not available"])
        
        score_available = result["scores"][result["labels"].index("available")]

        if score_available > best_score:
            best_score = score_available
            best_label = template_name

    # Get template info
    template_info = templates_dict[best_label]
    meme_name = template_info["name"]
    template_tags = template_info["tags"]
    caption_count = len(template_info.get("captions", {}))
    # 🔹 Call your generate_caption function
    generated = generate_chat(
        topic=topic,
        template=template_info,
        template_tags=template_tags,
        meme_name=meme_name,
        num_captions=caption_count,
        lang=language
    )

    # Add to response
    return jsonify({
            'success': True,
            'chat_response': generated,
            'topic': topic,
            'template': template_info['name']
        })
