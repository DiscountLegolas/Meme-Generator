import requests
import json
from datetime import datetime

def main():
    endpoint = "http://localhost:5000/reddit/process"  # change if hosted remotely
    try:
        response = requests.post(endpoint)

        if response.status_code == 200:
            data = response.json()

            # Save to timestamped file
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"/path/to/storage/memes_{timestamp}.json"

            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"[{timestamp}] ✅ JSON saved to {filename}")
        else:
            print("❌ Failed:", response.status_code, response.text)

    except Exception as e:
        print("🔥 Error:", e)

if __name__ == "__main__":
    main()
