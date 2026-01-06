import requests
import json

url = 'http://localhost:5000/api/generate_report'
data = {
    "database": "phonetest",
    "model": "gemini-2.0-flash-exp"
}

try:
    print("Sending request...")
    response = requests.post(url, json=data, timeout=60)
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print(f"Error Response: {response.text}")
    else:
        print("Success!")
        # print(response.json())
except Exception as e:
    print(f"Error: {e}")
