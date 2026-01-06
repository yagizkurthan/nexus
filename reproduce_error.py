import requests
import json

BASE_URL = "http://localhost:5000"

def test_chat(query):
    print(f"Testing /chat with query: '{query}'")
    try:
        payload = {
            "message": query,
            "database": "phonetest",
            "model": "gemini-2.0-flash-exp"
        }
        res = requests.post(f"{BASE_URL}/chat", json=payload)
        
        if res.status_code == 200:
            print("✅ Success")
            print(res.json())
        else:
            print(f"❌ Failed: {res.status_code}")
            print(res.text)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Sequence from the screenshot
    test_chat("list the patients who have cancer and are age>60")
    test_chat("patient diagnosis is cancer")
