import tkinter as tk
from PIL import Image, ImageTk
import json
import os

coords = []
boxes = []
current_clicks = []
template_name = "boardroom_meeting_suggestion"   # change or pass as arg
template_file = r"C:\Users\prof1\Masaüstü\AI\Meme Generator\Memes\Boardroom-Meeting-Suggestion.jpg"
json_file = r"C:\Users\prof1\Masaüstü\AI\Meme Generator\Generate\templates.json"

def click(event):
    global current_clicks
    x, y = event.x, event.y
    current_clicks.append((x, y))
    print(f"Clicked at: {x}, {y}")

    # Once we have 2 clicks, record rectangle
    if len(current_clicks) == 2:
        (x1, y1), (x2, y2) = current_clicks
        rect = {
            "x": min(x1, x2),
            "y": min(y1, y2),
            "width": abs(x2 - x1),
            "height": abs(y2 - y1)
        }
        boxes.append(rect)
        print("Box saved:", rect)
        current_clicks = []

def save():
    # Load existing JSON
    if os.path.exists(json_file):
        with open(json_file, "r") as f:
            templates = json.load(f)
    else:
        templates = {}
    tags = templates.get(template_name, {}).get("tags", [])
    # Update or create template entry
    templates[template_name] = {
        "name": template_name.replace("_", " ").title(),
        "file": template_file,
        "tags": tags,  # you can fill later
        "captions": {},
        "explanation":templates.get(template_name, {}).get("explanation", ""),
        "examples":templates.get(template_name, {}).get("examples", [])
    }

    # Assign captions sequentially
    for i, box in enumerate(boxes, start=1):
        templates[template_name]["captions"][f"caption{i}"] = box

    # Save JSON back
    with open(json_file, "w") as f:
        json.dump(templates, f, indent=4)

    print(f"Saved {len(boxes)} caption areas to {json_file}")
    root.destroy()

root = tk.Tk()
img = Image.open(template_file)
tk_img = ImageTk.PhotoImage(img)

canvas = tk.Canvas(root, width=img.width, height=img.height)
canvas.pack()
canvas.create_image(0, 0, anchor="nw", image=tk_img)
canvas.bind("<Button-1>", click)

button = tk.Button(root, text="Save", command=save)
button.pack()

root.mainloop()
