import random
from flask import Flask, request, jsonify
from openai import OpenAI
import faiss
import numpy as np
import json
from sentence_transformers import SentenceTransformer
import os
from deep_translator import (GoogleTranslator)
from pathlib import Path

# --------------------------
# CONFIG
# --------------------------
DATA_FILE = "MemesRagData/Batman-Slapping-Robin.json"   
DATA_FILE2 = "MemesRagData/Drake-Hotline-Bling.json"   
DATA_FILE3 = "MemesRagData/Two-Buttons.json"
DATA_FILE4 = "MemesRagData/UNO-Draw-25-Cards.json"   
DATA_FILE5 = "MemesRagData/Left-Exit-12-Off-Ramp.json"   
EMB_MODEL = "all-MiniLM-L6-v2"  # CPU-friendly embedding model
INDEX_FILE = "faiss.index"  # optional if you want persistence
TOP_K = 10 # number of docs to retrieve

# --------------------------
# LOAD EMBEDDING MODEL
# --------------------------
embed_model = SentenceTransformer(EMB_MODEL)

# --------------------------
# LOAD DATA
# --------------------------
with open(DATA_FILE, "r", encoding="utf-8") as f:
    dataset = json.load(f)
with open(DATA_FILE2, "r", encoding="utf-8") as f:
    dataset2 = json.load(f)
with open(DATA_FILE3, "r", encoding="utf-8") as f:
    dataset3 = json.load(f)
with open(DATA_FILE4, "r", encoding="utf-8") as f:
    dataset4 = json.load(f)
with open(DATA_FILE5, "r", encoding="utf-8") as f:
    dataset5 = json.load(f)
# Convert dataset objects into strings for embedding
def serialize_doc(obj,capcount):
    parts = []
    if "boxes" in obj:
        if len(obj["boxes"])==capcount:
            caption_str = " | ".join(
                f"caption{i}: {text}" for i, text in enumerate(obj["boxes"], start=1)
            )
            parts.append(caption_str)
    return " | ".join(parts)

documents = [serialize_doc(d,2) for d in dataset]
documents2 = [serialize_doc(d,2) for d in dataset2]
documents3 = [serialize_doc(d,3) for d in dataset3]
# --------------------------
# BUILD OR LOAD FAISS INDEX
# --------------------------
doc_embeddings = embed_model.encode(documents, convert_to_numpy=True)
doc_embeddings2 = embed_model.encode(documents2, convert_to_numpy=True)
doc_embeddings3 = embed_model.encode(documents3, convert_to_numpy=True)

dimension = doc_embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(doc_embeddings)

dimension2 = doc_embeddings2.shape[1]
index2 = faiss.IndexFlatL2(dimension2)
index2.add(doc_embeddings2)

dimension3 = doc_embeddings3.shape[1]
index3 = faiss.IndexFlatL2(dimension3)
index3.add(doc_embeddings3)


# --------------------------
# HELPER: SEARCH
# --------------------------
def search(query, k=TOP_K):
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    distances, indices = index.search(q_emb, k)
    results = []
    for idx in indices[0]:
        results.append(dataset[idx])
    return results

def search2(query, k=TOP_K):
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    distances, indices = index2.search(q_emb, k)
    results = []
    for idx in indices[0]:
        results.append(dataset2[idx])
    return results

def search3(query, k=TOP_K):
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    distances, indices = index3.search(q_emb, k)
    results = []
    for idx in indices[0]:
        results.append(dataset3[idx])
    return results
def searchreusable(query,templateobject,template:str,capcount:int,k=TOP_K):
    if template=="Uno Card":
        datasetnew=dataset4
        documentsnew = [serialize_doc(d,capcount) for d in datasetnew]
        doc_embeddingsnew = embed_model.encode(documentsnew, convert_to_numpy=True)
        dimensionnew = doc_embeddingsnew.shape[1]
        indexnew = faiss.IndexFlatL2(dimensionnew)
        indexnew.add(doc_embeddingsnew)
    elif template=="Road Division":
        datasetnew=dataset5
        documentsnew = [serialize_doc(d,capcount) for d in datasetnew]
        doc_embeddingsnew = embed_model.encode(documentsnew, convert_to_numpy=True)
        dimensionnew = doc_embeddingsnew.shape[1]
        indexnew = faiss.IndexFlatL2(dimensionnew)
        indexnew.add(doc_embeddingsnew)
    else:
        filename=Path(templateobject["file"]).stem
        DATA_FILENEW = f"MemesRagData/{filename}.json"   
        with open(DATA_FILENEW, "r", encoding="utf-8") as f:
            datasetnew = json.load(f)
        documentsnew = [serialize_doc(d,capcount) for d in datasetnew]
        doc_embeddingsnew = embed_model.encode(documentsnew, convert_to_numpy=True)
        dimensionnew = doc_embeddingsnew.shape[1]
        indexnew = faiss.IndexFlatL2(dimensionnew)
        indexnew.add(doc_embeddingsnew)
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    distances, indices = indexnew.search(q_emb, k)
    results = []
    for idx in indices[0]:
        results.append(datasetnew[idx])
    return results

def searchall(query,capcount:int,k=TOP_K):
    for file in os.listdir("Generate/MemesRagData"):
        if file.endswith(".json"):
            with open(os.path.join("Generate/MemesRagData", file), "r", encoding="utf-8") as f:
                datasetnew = json.load(f)
                for item in datasetnew:
                    if "metadata" in item and "img-votes" in item["metadata"]:
                        item["metadata"]["img-votes"] = int(item["metadata"]["img-votes"])
                datasetnew.sort(key=lambda x: x["metadata"].get("img-votes", 0), reverse=True)
                datasetnew.extend(datasetnew[:10])
    print(len(datasetnew))
    documentsnew = [serialize_doc(d,capcount) for d in datasetnew]
    doc_embeddingsnew = embed_model.encode(documentsnew, convert_to_numpy=True)
    dimensionnew = doc_embeddingsnew.shape[1]
    indexnew = faiss.IndexFlatL2(dimensionnew)
    indexnew.add(doc_embeddingsnew) 
    q_emb = embed_model.encode([query], convert_to_numpy=True)
    distances, indices = indexnew.search(q_emb, k)
    results = []
    for idx in indices[0]:
        results.append(datasetnew[idx])
    return results
# --------------------------
# HELPER: FORMAT CONTEXT
# --------------------------
def format_context(results):
    formatted = []
    for r in results:
        formatted.append(json.dumps(r, ensure_ascii=False))
    return "\n".join(formatted)

def format_context_tr(results):
    translator = GoogleTranslator(source='auto', target='tr')

    formatted = []
    for r in results:
        translated_r = r.copy()

        # translate metadata.title
        if "metadata" in r and "title" in r["metadata"]:
            translated_r["metadata"]["title"] = translator.translate(r["metadata"]["title"])

        # translate metadata.author
        if "metadata" in r and "author" in r["metadata"]:
            translated_r["metadata"]["author"] = translator.translate(r["metadata"]["author"])

        # translate each box
        if "boxes" in r:
            translated_r["boxes"] = [translator.translate(b) for b in r["boxes"]]

        formatted.append(json.dumps(translated_r, ensure_ascii=False))

        output = "\n".join(formatted)
        return output


def get_filtered_rag_data(meme_name, max_entries=500):
    """
    Read RAG data JSON files and return entries where boxes count matches caption count.
    Returns the first max_entries such entries.
    
    Args:
        meme_name (str): Name of the meme template (e.g., "Two Buttons", "Drake Hotline Bling", "Batman Slapping Robin")
        max_entries (int): Maximum number of entries to return (default: 500)
    
    Returns:
        list: List of filtered meme entries
    """
    try:
        repo_root = os.path.dirname(os.path.abspath(__file__))
        
        # Map meme names to their JSON file names
        meme_file_mapping = {
            "Two Buttons": "Two-Buttons.json",
            "Drake Hotline": "Drake-Hotline-Bling.json", 
            "Batman Slap": "Batman-Slapping-Robin.json",
            "Uno Card":"UNO-Draw-25-Cards.json",
            "Road Division": "Left-Exit-12-Off-Ramp.json"
        }
        
        if meme_name not in meme_file_mapping:
            print(f"Warning: No RAG data file found for meme '{meme_name}'")
            return []
        
        file_path = os.path.join(repo_root, "MemesRagData", meme_file_mapping[meme_name])
        
        if not os.path.exists(file_path):
            print(f"Warning: RAG data file not found: {file_path}")
            return []
        
        # Read the JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            print(f"Warning: Invalid JSON structure in {file_path}")
            return []
        
        # Filter entries where boxes count matches expected caption count
        filtered_entries = []
        expected_caption_count = get_expected_caption_count(meme_name)
        
        for entry in data:
            if isinstance(entry, dict) and 'boxes' in entry:
                boxes = entry.get('boxes', [])
                if isinstance(boxes, list) and len(boxes) == expected_caption_count:
                    filtered_entries.append(entry)
                    
                    # Stop when we reach max_entries
                    if len(filtered_entries) >= max_entries:
                        break
        
        return filtered_entries
        
    except Exception as e:
        print(f"Error reading RAG data for {meme_name}: {str(e)}")
        return []

def get_expected_caption_count(meme_name):
    """
    Get the expected caption count for a given meme template.
    
    Args:
        meme_name (str): Name of the meme template
    
    Returns:
        int: Expected number of captions
    """
    caption_counts = {
        "Two Buttons": 3,
        "Drake Hotline": 2, 
        "Batman Slap": 2,
        "Uno Card":2,
        "Road Division": 3,
        "Distracted Bf":3,
    }
    
    return caption_counts.get(meme_name, 2)

def get_rag_examples_for_prompt(meme_name, max_examples=500):
    """
    Get RAG examples for use in caption generation prompts.
    
    Args:
        meme_name (str): Name of the meme template
        max_examples (int): Maximum number of examples to return
    
    Returns:
        str: Formatted examples text for prompt
    """
    rag_entries = get_filtered_rag_data(meme_name, max_entries=max_examples)
    rag_entries=random.shuffle(rag_entries)
    if not rag_entries:
        return ""
    
    formatted_examples = []
    for entry in rag_entries:
        boxes = entry.get('boxes', [])
        if len(boxes) >= 2:
            formatted_examples.append(f'- caption1: "{boxes[0]}" | caption2: "{boxes[1]}"')
    return "\n".join(formatted_examples)