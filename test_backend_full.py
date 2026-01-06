import requests
import json
import time

BASE_URL = "http://localhost:5000"

def print_step(msg):
    print(f"\n{'='*50}\n{msg}\n{'='*50}")

def test_chat(query):
    print_step(f"Testing /chat with query: '{query}'")
    try:
        payload = {
            "message": query,
            "database": "phonetest",
            "model": "gemini-2.0-flash-exp"
        }
        start = time.time()
        res = requests.post(f"{BASE_URL}/chat", json=payload)
        duration = time.time() - start
        
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Success ({duration:.2f}s)")
            print(f"Response: {data.get('response')[:100]}...")
            if data.get('sql'):
                print(f"SQL: {data.get('sql')}")
            return data
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_history():
    print_step("Testing /api/history")
    try:
        res = requests.get(f"{BASE_URL}/api/history")
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Success. Found {len(data)} items.")
            if len(data) > 0:
                print(f"Sample: {data[0]}")
            return data
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_feedback(query, sql, rating):
    print_step(f"Testing /api/feedback for '{query}' with rating {rating}")
    try:
        payload = {
            "query": query,
            "sql": sql,
            "rating": rating
        }
        res = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        if res.status_code == 200:
            print("✅ Feedback submitted successfully")
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    # 1. Test Chat (Should trigger RAG save)
    chat_res = test_chat("Show me the top 3 users by id")
    
    if chat_res and chat_res.get('sql'):
        # 2. Test Feedback (Rate it up)
        test_feedback("Show me the top 3 users by id", chat_res['sql'], 1)
        
        # 3. Test History (Should see it now)
        history = test_history()
        
        # Verify it's there
        found = False
        for item in history:
            if item['query'] == "Show me the top 3 users by id":
                found = True
                print(f"✅ Verified: Query found in history with rating {item.get('rating')}")
                break
        if not found:
            print("❌ Warning: Query not found in history immediately (might be async or cached)")

    # 4. Test RAG Retrieval (Ask same thing again, check logs/response time)
    print_step("Testing RAG Retrieval (Asking same question)")
    test_chat("Show me the top 3 users by id")

if __name__ == "__main__":
    main()
