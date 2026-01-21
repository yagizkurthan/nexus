import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def test_chat_and_metrics():
    print("1. Sending Chat Request...")
    payload = {
        "message": "Show me all tables",
        "database": "phonetest"
    }
    try:
        start = time.time()
        res = requests.post(f"{BASE_URL}/api/chat", json=payload)
        duration = time.time() - start
        
        if res.status_code == 200:
            print(f"   Success! Response time: {duration:.2f}s")
            data = res.json()
            sql = data.get('sql')
            print(f"   SQL Generated: {sql}")
            return sql
        else:
            print(f"   Failed: {res.text}")
            return None
    except Exception as e:
        print(f"   Error: {e}")
        return None

def verify_memory_update(expected_sql):
    print("\n2. Verifying memory.json update...")
    try:
        with open("memory.json", "r") as f:
            memory = json.load(f)
            
        # Get latest entry
        latest = memory[-1]
        
        has_time = 'execution_time' in latest
        matches_sql = latest.get('sql') == expected_sql
        
        if has_time:
            print(f"   PASS: 'execution_time' found in memory ({latest['execution_time']:.4f}s)")
        else:
            print("   FAIL: 'execution_time' MISSING in memory")
            
        if matches_sql:
             print("   PASS: SQL matches")
        else:
             print("   FAIL: SQL mismatch")
             
        return latest['query'], latest['sql']
        
    except Exception as e:
        print(f"   Error reading memory.json: {e}")
        return None, None

def test_feedback(query, sql):
    print("\n3. Testing Feedback API...")
    payload = {
        "query": query,
        "sql": sql,
        "rating": 1
    }
    try:
        res = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        if res.status_code == 200:
            print("   Feedback sent successfully")
        else:
            print(f"   Feedback failed: {res.text}")
            
        # Verify
        with open("memory.json", "r") as f:
            memory = json.load(f)
            latest = memory[-1]
            
        if latest.get('rating') == 1:
            print("   PASS: Rating updated in memory")
        else:
            print(f"   FAIL: Rating not updated (Current: {latest.get('rating')})")
            
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    sql = test_chat_and_metrics()
    if sql:
        time.sleep(1) # Wait for file write
        q, s = verify_memory_update(sql)
        if q and s:
            test_feedback(q, s)
