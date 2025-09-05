import uuid


def generate_captions(image_width, image_height, caption_width, caption_height, margin=50):
    # Center captions horizontally
    center_x = (image_width - caption_width) // 2

    # Top caption
    caption1 = {
        "x": center_x,
        "y": margin,
        "width": caption_width,
        "height": caption_height
    }

    # Bottom caption
    caption2 = {
        "id":f"{uuid.uuid4()}",
        "x": center_x,
        "y": image_height - caption_height - margin,
        "width": caption_width,
        "height": caption_height
    }

    return {
        "captions": {
            "caption1": caption1,
            "caption2": caption2
        }
    }