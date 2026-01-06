import requests
import json

url = 'http://localhost:5000/api/feedback'
data = {
    "query": "Show me the top 5 sales",
    "sql": "SELECT title, ratings_count FROM data ORDER BY ratings_count DESC LIMIT 5",
    "rating": 1
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
