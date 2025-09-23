import requests
import json
from datetime import datetime
import os
def main():
    endpoint = "https://www.meme-generator-backend.com/api/reddit/process"  # change if hosted remotely
    storage_path = "/memes_storage"  # ✅ root-level storage

    os.makedirs(storage_path, exist_ok=True)

    try:
        response = requests.get(endpoint)

        if response.status_code == 200:
            data = response.json()

            # Save with timestamp
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(storage_path, f"memes_{timestamp}.json")

            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"[{timestamp}] ✅ JSON saved to {filename}")
        else:
            print("❌ Failed:", response.status_code, response.text)

    except Exception as e:
        print("🔥 Error:", e)

if __name__ == "__main__":
    main()
