import json
import sys
import random
from Generate.caption_ai import generate_caption
from Generate.meme_generator import create_meme

def load_templates():
    with open("Generate/templates.json", "r") as f:
        return json.load(f)

def find_template(topic, templates):
    topic_lower = topic.lower()
    for name, data in templates.items():
        if data.get("name", "").lower() == "uno CARD":
            return data
    # fallback random
    return random.choice(list(templates.values()))

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py '<topic>'")
        sys.exit(1)

    topic = sys.argv[1]
    templates = load_templates()
    template = find_template(topic, templates)
    print(template)
    # INSERT_YOUR_CODE
    # Get the number of captions for the selected template
    caption_count = len(template.get("captions", {}))
    captions = generate_caption(topic, template["tags"],template["name"],num_captions=caption_count)
    output = create_meme(template, captions)

    print(f"Meme generated: {output}")

if __name__ == "__main__":
    main()
