import json

from pymongo import MongoClient


def load_templates():
    import os
    from config import config
    current_config = config[os.environ.get('FLASK_ENV', 'default')]
    mongo_client = MongoClient(current_config.MONGODB_URI)
    mongo_db = mongo_client[current_config.MONGODB_DB]
    meme_templates_collection = mongo_db['meme_templates']
    """Return templates as {template_key: template_dict} from MongoDB."""
    if meme_templates_collection is None:
        # Fallback to file for safety in dev
        with open("Generate/templates.json", "r") as f:
            return json.load(f)
    merged = {}
    try:
        for doc in meme_templates_collection.find({}):
            # Each document may contain multiple template keys besides _id
            for key, value in doc.items():
                if key == '_id':
                    continue
                merged[key] = value
        return merged
    except Exception as e:
        print(f"Error loading templates from MongoDB: {e}")
        # Fallback to file in case of query error
        with open("Generate/templates.json", "r") as f:
            return json.load(f)