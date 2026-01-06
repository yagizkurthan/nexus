import requests
import json

url = "http://localhost:5000/chat"
payload = {
    "message": "How many users are there?",
    "database": "phonetest",
    "model": "gemini-2.0-flash-exp"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
