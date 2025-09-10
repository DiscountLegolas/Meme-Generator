import time
from deep_translator import (GoogleTranslator)
from openai import OpenAI
from sentence_transformers import SentenceTransformer, util
import re
import json
from pydantic import ValidationError
import os
from Generate.Models import MemeCaption1,MemeCaption2,MemeCaption3,MemeCaption4,MemeCaption5
from Generate.rag import *
import langid
TOKEN1=os.environ.get("TOKEN1")
TOKEN2=os.environ.get("TOKEN2")
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=TOKEN2,
)



def build_meme_recommender(memes: dict):
    """
    Prepares meme embeddings and returns a function to query them.
    """

    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Build embeddings for each meme template
    meme_embeddings = {}
    for key, meme in memes.items():
        examples_text = " ".join(
            [" ".join([f"{k}: {v}" for k, v in ex.items()]) for ex in meme["examples"]]
        )
        text_repr = " ".join(meme["tags"]) + " " + meme["explanation"] + " " + examples_text
        meme_embeddings[key] = model.encode(text_repr, convert_to_tensor=True)

    def find_similar_memes(query: str, top_n: int = None):
        """
        Given a query, return all meme templates ranked by similarity.
        Each result is the full template object with an extra similarity_score.
        """
        query_emb = model.encode(query, convert_to_tensor=True)
        results = []

        for key, emb in meme_embeddings.items():
            score = util.cos_sim(query_emb, emb).item()
            meme_with_score = dict(memes[key])  # shallow copy of template
            meme_with_score["similarity_score"] = round(score, 3)
            meme_with_score["id"] = key
            results.append(meme_with_score)

        # sort descending
        results = sorted(results, key=lambda x: x["similarity_score"], reverse=True)

        if top_n:
            results = results[:top_n]

        return results

    return find_similar_memes

def clean_caption_text(caption_text):
    """
    Clean up caption text by removing markdown formatting and panel labels.
    Extracts only the actual caption content.
    """
    # Remove markdown formatting like ** and *
    cleaned = re.sub(r'\*\*(.*?)\*\*', r'\1', caption_text)
    cleaned = re.sub(r'\*(.*?)\*', r'\1', caption_text)
    
    # Remove panel labels like "Panel 1 (Drake ❌ – "No thanks")" or similar
    cleaned = re.sub(r'Panel \d+.*?["\']', '', cleaned)
    cleaned = re.sub(r'\([^)]*\)', '', cleaned)
    
    # Remove any remaining quotes and clean up whitespace
    cleaned = re.sub(r'^["\']\s*', '', cleaned)
    cleaned = re.sub(r'\s*["\']$', '', cleaned)
    cleaned = cleaned.strip()
    
    return cleaned


# Hugging Face text generator (change model if needed)
def generate_caption(topic,template, template_tags,meme_name, num_captions=2):
    lang, confidence = langid.classify(topic)
    topicen=GoogleTranslator(source='auto', target='en').translate(text=topic)
    # Load examples for the given meme template (if available)
    explanation=""
    examples_text = ""
    
    # First try to get RAG data examples (real meme examples)
    rag_examples = get_rag_examples_for_prompt(meme_name,template)
    if rag_examples:
        examples_text = rag_examples




    # Get explanation from templates file
    try:
        example_pairs = template['examples']
        explanation=template['explanation']
        if isinstance(example_pairs, list) and len(example_pairs) > 0:
            # Show up to 5 concise example pairs
            formatted = []
            for ex in example_pairs[:5]:
                c1 = ex.get("caption1", "").strip()
                c2 = ex.get("caption2", "").strip()
                #if c1 or c2:
                    #formatted.append(f'- caption1: "{c1}" | caption2: "{c2}"')
            if formatted:
                examples_text = "\n".join(formatted)
    except Exception:
        # If anything goes wrong loading examples, proceed without them
        examples_text = ""
    explanationtr=GoogleTranslator(source='auto', target='tr').translate(text=explanation)
    # Build the main prompt (EN default)
    prompt_en = f"""Create {num_captions} funny captions about '{topicen}'.

    IMPORTANT: You must return a valid JSON object with the following structure:
    - For 1 caption: {{ "caption1": "your caption here"}}
    - For 2 captions: {{ "caption1": "first caption", "caption2": "second caption"}}
    - For 3 captions: {{ "caption1": "first caption", "caption2": "second caption", "caption3": "third caption"}}
    - For 4 captions: {{ "caption1": "first caption", "caption2": "second caption", "caption3": "third caption","caption4": "fourth caption"}}
    - For 5 captions: {{ "caption1": "first caption", "caption2": "second caption", "caption3": "third caption","caption4": "fourth caption","caption5": "fifth caption"}}

    Use the following template: {explanation}
    Make the captions short and memorable.
    Return ONLY the JSON object, no additional text or formatting."""

    # Full Turkish prompt when input language is Turkish
    prompt_tr = f"""'{topic}' hakkında {num_captions} komik altyazı oluştur.

    ÖNEMLİ: Aşağıdaki yapıda GEÇERLİ bir JSON nesnesi döndürmelisin:
    - 1 altyazı için: {{ "caption1": "altyazın burada" }}
    - 2 altyazı için: {{ "caption1": "ilk altyazı", "caption2": "ikinci altyazı" }}
    - 3 altyazı için: {{ "caption1": "ilk altyazı", "caption2": "ikinci altyazı", "caption3": "üçüncü altyazı" }}
    - 4 altyazı için: {{ "caption1": "ilk altyazı", "caption2": "ikinci altyazı", "caption3": "üçüncü altyazı", "caption4": "dördüncü altyazı" }}
    - 5 altyazı için: {{ "caption1": "ilk altyazı", "caption2": "ikinci altyazı", "caption3": "üçüncü altyazı", "caption4": "dördüncü altyazı", "caption5": "beşinci altyazı" }}

    Aşağıdaki şablonu kullan: {explanationtr}
    Altyazılar kısa, doğal ve akılda kalıcı olsun.
    SADECE JSON nesnesini döndür; ek açıklama veya biçimlendirme ekleme."""

    # Choose prompt based on detected language
    prompt = prompt_tr if lang == "tr" else prompt_en

    # Add examples section in the appropriate language
    if examples_text:
        if lang == "tr":
            prompt += f"\n\nÖNEMLİ: Bu şablon için örnek altyazı çiftleri:\n{examples_text}"
        else:
            prompt += f"\n\nIMPORTANT: Example caption pairs for this template:\n{examples_text}"
    if lang=="tr":
        prompt += f"\n\nYukarıda belirtilen JSON formatına uygun şekilde tam olarak {num_captions} altyazı üret."
    else:
        prompt += f"\n\nGenerate exactly {num_captions} captions in the JSON format specified above."
    if meme_name=="Batman Slap":
        retrieved = search(topicen, TOP_K)
        context = format_context(retrieved)
    elif meme_name=="Drake Hotline":
        retrieved = search2(topicen, TOP_K)

        context = format_context(retrieved)
    elif meme_name=="Two Buttons":
        retrieved = search3(topicen, TOP_K)

        context = format_context(retrieved)
    else:
        if meme_name!="Distracted Bf":
            retrieved = searchreusable(topicen,template,meme_name,num_captions, TOP_K)
            context = format_context(retrieved)
    if meme_name!="Distracted Bf":
        if lang == "tr":
            messages=[
                {"role": "system", "content": "Bir RAG asistanısın. Sağlanan bağlamı kullan."},
                {"role": "assistant", "content": f"Bağlam:\n{context}"},
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        else:
            messages=[
                {"role": "system", "content": "You are a RAG assistant. Use the provided context."},
                {"role": "assistant", "content": f"Context:\n{context}"},
                {
                    "role": "user",
                    "content": prompt
                }
            ]
                
    else:
        messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]

    # Choose the appropriate model based on number of captions
    if num_captions == 1:
        response_model = MemeCaption1
    elif num_captions == 2:
        response_model = MemeCaption2
    elif num_captions == 3:
        response_model = MemeCaption3
    elif num_captions == 4:
        response_model = MemeCaption4
    elif num_captions == 5:
        response_model = MemeCaption5
    else:
        raise ValueError("num_captions must be 1, 2, or 3")
    # Retry system with max 5 attempts
    max_retries = 5
    retry_count = 0
    while retry_count < max_retries:
        try:
            if lang=="tr":
                completion = client.beta.chat.completions.parse(
                    model="deepseek-ai/DeepSeek-V3.1:novita",
                    messages=messages,
                    response_format=response_model,
                    temperature=0.6,
                    
                )
                caption = completion.choices[0].message.parsed
                break;
            else:
                completion = client.beta.chat.completions.parse(
                    model="deepseek-ai/DeepSeek-V3.1:novita",
                    messages=messages,
                    response_format=response_model,
                    temperature=0.6,
                    
                )
                caption = completion.choices[0].message.parsed
                break;
        except ValidationError as e:
            try:
                error=e.errors(include_url=False,include_context=False)[0]
                clean = error.get("input").strip().strip("```json").strip("```")
                data = json.loads(clean)
                caption = response_model(**data)
                break;
            except Exception as e:
                print(f"{str(e)}")
                raise Exception(f"Failed to generate caption after {max_retries} attempts. Last error: {str(e)}")
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                # If we've exhausted all retries, raise the last error

                raise Exception(f"Failed to generate caption after {max_retries} attempts. Last error: {str(e)}")
            
            # Wait a bit before retrying (exponential backoff)
            import time
            wait_time = min(2 ** retry_count, 10)  # Max 10 seconds wait
            time.sleep(wait_time)
            print(f"Attempt {retry_count} failed: {str(e)}. Retrying in {wait_time} seconds...")
    
    # Extract captions based on the model used
    if num_captions == 1:
        captions = [caption.caption1]
    elif num_captions == 2:
        captions = [caption.caption1, caption.caption2]
    elif num_captions == 3:
        captions = [caption.caption1, caption.caption2, caption.caption3]
    elif num_captions == 4:
        captions = [caption.caption1, caption.caption2, caption.caption3,caption.caption4]
    elif num_captions == 5:
        captions = [caption.caption1, caption.caption2, caption.caption3,caption.caption4,caption.caption5]
    # Clean up each caption to remove any remaining formatting
    cleaned_captions = [clean_caption_text(cap) for cap in captions]
    #for caption in cleaned_captions:
    #    trs=GoogleTranslator(source='en', target='tr').translate(text=caption)
    #    cleaned_captions_tr.append(trs)
    return cleaned_captions



def generate_captions_no_template(topic: str,blip_caption:str, num_captions: int = 1):
    """
    Generate funny captions based only on a topic, without using templates.
    """
    # Translate topic to English for better caption generation
    topic_en = GoogleTranslator(source='auto', target='en').translate(text=topic)
    prompt = f"""
        Here is a factual description of the image: "{blip_caption}".

        Your task is to turn this description into {num_captions} funny meme-style captions.
        IMPORTANT:
            - The captions must be connected to each other like a sequence:
            - For 2 captions: the second one should feel like a direct response to the first.
            - For 3 captions: each caption should feel like a continuation of the previous one
                (like a back-and-forth conversation, reaction, or chain of events).
            - They must form a coherent mini-story or dialogue.

        IMPORTANT: You must return a valid JSON object with the following structure:
        - For 1 caption: {{ "caption1": "your caption here" }}
        - For 2 captions: {{ "caption1": "first caption", "caption2": "second caption" }}
        - For 3 captions: {{ "caption1": "first caption", "caption2": "second caption", "caption3": "third caption" }}

        CRITICAL RULES:
        - Each field must contain **exactly one caption**.
        - Return ONLY the JSON object, no extra text.
        - Generate exactly {num_captions} captions, following the JSON format above.
        """

    # Choose the appropriate response model
    if num_captions == 1:
        response_model = MemeCaption1
    elif num_captions == 2:
        response_model = MemeCaption2
    elif num_captions == 3:
        response_model = MemeCaption3
    else:
        raise ValueError("num_captions must be 1, 2, or 3")
    retrieved = searchall(topic, TOP_K)
    context = format_context(retrieved)
    messages=[
                    {"role": "system", "content": "You are a RAG assistant. Use the provided context."},
                    {"role": "assistant", "content": f"Context:\n{context}"},
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
    max_retries = 5
    retry_count = 0
    while retry_count < max_retries:
        try:
            completion = client.beta.chat.completions.parse(
                model="deepseek-ai/DeepSeek-V3.1:novita",
                messages=messages,
                response_format=response_model,
                temperature=0.7,
            )
            caption = completion.choices[0].message.parsed
            break
        except ValidationError as e:
            try:
                error=e.errors(include_url=False,include_context=False)[0]
                clean = error.get("input").strip().strip("```json").strip("```")
                data = json.loads(clean)
                caption = response_model(**data)
                break;
            except Exception as e:
                print(f"{str(e)}")
                raise Exception(f"Failed to generate caption after {max_retries} attempts. Last error: {str(e)}")
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                print(f"{str(e)}")
                raise Exception(f"Failed after {max_retries} attempts. Last error: {str(e)}")
            wait_time = min(2 ** retry_count, 10)
            time.sleep(wait_time)

    # Extract and clean captions
    if num_captions == 1:
        captions = [caption.caption1]
    elif num_captions == 2:
        captions = [caption.caption1, caption.caption2]
    elif num_captions == 3:
        captions = [caption.caption1, caption.caption2, caption.caption3]

    cleaned_captions = [clean_caption_text(c) for c in captions]

    return cleaned_captions
