from PIL import Image, ImageDraw, ImageFont
import textwrap
from uuid import uuid4
from transformers import BlipProcessor, BlipForConditionalGeneration
def load_font(font_size=32, font_path=None):
    """
    Load a TrueType font with the requested size if available.
    Falls back to a default bitmap font if TTF is unavailable.
    """
    # Try an explicit path first
    if font_path:
        try:
            return ImageFont.truetype(font_path, font_size)
        except Exception:
            pass

    # Try common system fonts
    for candidate in ["arial.ttf", "DejaVuSans.ttf", "Impact.ttf"]:
        try:
            return ImageFont.truetype(candidate, font_size)
        except Exception:
            continue

    # Final fallback: default bitmap font (fixed size)
    return ImageFont.load_default()
def draw_text(draw, text, box, font, image_width):
    x, y, w, h = box["x"], box["y"], box["width"], box["height"]

    # Wrap text
    lines = textwrap.wrap(text, width=20)
    line_height = font.getbbox("A")[3]  # font height
    total_height = len(lines) * line_height

    # Center vertically
    y_offset = y + (h - total_height) // 2

    for line in lines:
        lw = draw.textlength(line, font=font)
        lh=draw.textlength(line, font=font)
        x_offset = x + (w - lw) // 2
        draw.text((x_offset, y_offset), line, font=font,
                  fill="black", stroke_width=2, stroke_fill="black")
        y_offset += line_height

def create_meme(template, captions, font_size=32, font_path=None):
    img = Image.open(template["file"])
    draw = ImageDraw.Draw(img)
    font = load_font(font_size=font_size, font_path=font_path)
    for i, (cap_name, box) in enumerate(template["captions"].items()):
        if i < len(captions):
            draw_text(draw, captions[i], box, font, img.width)

    output_path =     "GeneratedMemes/"+str(uuid4())+".png"
    img.save(output_path)
    return output_path


def create_meme_from_file(uploaded_file, captions, caption_locations, font_size=32, font_path=None):
    """
    Create a meme from an uploaded image file using given caption locations.

    uploaded_file: werkzeug FileStorage object from request.files
    captions: list of text captions
    caption_locations: list of dicts like [{"x": 10, "y": 20, "w": 200, "h": 50}, ...] for each caption
    """
    # Open the uploaded image
    img = Image.open(uploaded_file)
    draw = ImageDraw.Draw(img)
    font = load_font(font_size=font_size, font_path=font_path)

    # Draw each caption
    for i, box in enumerate(caption_locations):
        if i < len(captions):
            x, y, w, h = box.get('x'), box.get('y'), box.get('width'), box.get('height')
            draw_text_new(draw, captions[i], (x, y, w, h), font, img.width)

    # Save the output
    output_path = "GeneratedMemes/"+str(uuid4())+".png"
    img.save(output_path)
    return output_path


def draw_text_new(draw, text, box, font, image_width):
    if isinstance(box, dict):
        x, y, w, h = box["x"], box["y"], box["width"], box["height"]
    # If box is a tuple/list in the order (id, x, y, width, height, label)
    elif isinstance(box, (tuple, list)):
        # Adjust indices according to your structure
        x, y, w, h = box[0], box[1], box[2], box[3]

    # Wrap text
    lines = textwrap.wrap(text, width=20)
    line_height = font.getbbox("A")[3]  # font height
    total_height = len(lines) * line_height

    # Center vertically
    y_offset = y - (h - total_height) // 2

    for line in lines:
        lw = draw.textlength(line, font=font)
        lh=draw.textlength(line, font=font)
        x_offset = x - (w - lw) // 2
        draw.text((x_offset, y_offset), line, font=font,
                  fill="black", stroke_width=2, stroke_fill="black")
        y_offset += line_height


def describe_image(file):

    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base",use_fast=True)
    model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

    raw_image = Image.open(file).convert('RGB')
    prompt = "an empty meme photo of"
    # conditional image captioning
    inputs = processor(raw_image,text=prompt, return_tensors="pt")

    out = model.generate(**inputs)
    return processor.decode(out[0], skip_special_tokens=True)