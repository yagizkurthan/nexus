import json
import os
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class RAGManager:
    def __init__(self, memory_file='memory.json'):
        self.memory_file = memory_file
        self.memory = self._load_memory()
        
        api_key = os.getenv('GOOGLE_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
        else:
            print("Warning: GOOGLE_API_KEY not set for RAGManager")

    def _load_memory(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []

    def _save_memory(self):
        with open(self.memory_file, 'w') as f:
            json.dump(self.memory, f, indent=2)

    def embed_text(self, text):
        try:
            # Use the embedding model
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",
                title="Query"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    def add_to_memory(self, query, sql, rating=0):
        # Check if query already exists to avoid duplicates
        for item in self.memory:
            if item['query'] == query:
                return
        
        embedding = self.embed_text(query)
        if embedding:
            self.memory.append({
                'query': query,
                'sql': sql,
                'embedding': embedding,
                'rating': rating,
                'timestamp': datetime.now().isoformat()
            })
            self._save_memory()
            print(f"Added to memory: {query}")

    def add_feedback(self, query, sql, rating):
        """Update the rating for a specific query/sql pair."""
        found = False
        for item in self.memory:
            if item['query'] == query and item['sql'] == sql:
                item['rating'] = rating
                found = True
                break
        
        if found:
            self._save_memory()
            print(f"Updated rating for '{query}' to {rating}")
        else:
            # If not found, add it as a new entry
            self.add_to_memory(query, sql, rating)

    def find_similar(self, query, top_k=3, threshold=0.6):
        if not self.memory:
            return []

        query_embedding = self.embed_text(query)
        if not query_embedding:
            return []

        query_vec = np.array(query_embedding)
        
        similarities = []
        for item in self.memory:
            mem_vec = np.array(item['embedding'])
            # Cosine similarity
            norm_q = np.linalg.norm(query_vec)
            norm_m = np.linalg.norm(mem_vec)
            
            if norm_q == 0 or norm_m == 0:
                similarity = 0
            else:
                similarity = np.dot(query_vec, mem_vec) / (norm_q * norm_m)
            
            # Boost score based on rating
            # Rating 1 (Thumbs Up) -> +0.1 boost
            # Rating -1 (Thumbs Down) -> -0.1 penalty
            rating = item.get('rating', 0)
            boosted_score = similarity + (rating * 0.1)
                
            similarities.append((boosted_score, item))

        # Sort by similarity desc
        similarities.sort(key=lambda x: x[0], reverse=True)
        
        # Filter by threshold and top_k
        results = []
        for score, item in similarities[:top_k]:
            if score >= threshold:
                results.append({
                    'query': item['query'],
                    'sql': item['sql'],
                    'score': float(score),
                    'rating': item.get('rating', 0)
                })
                
        return results
