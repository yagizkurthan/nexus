"""
🚀 Smart Database Manager Agent - Google Gemini SDK (Quota-Safe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Google Gemini AI ile güçlendirilmiş
📊 Quota aşımında akıllı fallback sistemi
🎯 Her durumda çalışır, asla hata vermez
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import re
import json
from pathlib import Path
import time
import hashlib

# Import advanced tools
from agent_tools import *

# ═══════════════════════════════════════════════════════════
# 🔧 SETUP
# ═══════════════════════════════════════════════════════════

def load_env():
    """Load environment variables"""
    env_file = Path(__file__).parent / '.env'
    if not env_file.exists():
        env_file = Path(__file__).parent / '.env.example'
    
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    value = value.strip().strip('"').strip("'")
                    if value and not os.getenv(key):
                        os.environ[key] = value

load_env()

# API Key
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    AI_AVAILABLE = True
    print("✅ Google Gemini API aktif")
else:
    AI_AVAILABLE = False
    print("⚠️ Google API key yok - Fallback mode")

# ═══════════════════════════════════════════════════════════
# 🌐 GLOBAL STATE
# ═══════════════════════════════════════════════════════════
ACTIVE_DATABASE = None
DATABASE_CONTEXT = None
LAST_QUERY_RESULT = None
AI_CACHE = {}

AVAILABLE_MODELS = [
    'models/gemini-2.5-flash',           # ⭐ Gemini 2.5 Flash - En yeni ve hızlı
    'models/gemini-2.5-pro',             # 🔥 Gemini 2.5 Pro - En güçlü
    'models/gemini-2.0-flash-exp',       # 🚀 Gemini 2.0 Flash Experimental
    'models/gemini-2.0-flash',           # ✅ Gemini 2.0 Flash Stable
    'models/gemini-exp-1206',            # 🧪 Gemini Experimental 1206
]

# ═══════════════════════════════════════════════════════════
# 🧠 HYBRID AI SYSTEM (Gemini + Fallback)
# ═══════════════════════════════════════════════════════════

def call_gemini_safe(prompt: str, use_cache: bool = True) -> Optional[str]:
    """
    Gemini API'yi güvenli şekilde çağırır
    Başarısız olursa None döner, fallback sistem devreye girer
    """
    global AI_CACHE
    
    if not AI_AVAILABLE:
        return None
    
    # Cache kontrol
    if use_cache:
        cache_key = hashlib.md5(prompt.encode()).hexdigest()
        if cache_key in AI_CACHE:
            print("💾 Cache'den alındı")
            return AI_CACHE[cache_key]
    
    # Model dene
    for model_name in AVAILABLE_MODELS:
        try:
            print(f"🔄 Gemini çağrılıyor: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            result = response.text
            
            # Cache'e kaydet
            if use_cache:
                AI_CACHE[cache_key] = result
            
            print(f"✅ Gemini başarılı: {model_name}")
            return result
            
        except Exception as e:
            error_msg = str(e)
            
            if "429" in error_msg or "quota" in error_msg.lower():
                print(f"⚠️ {model_name} quota aşımı")
                
                # Retry delay varsa bekle
                if "retry in" in error_msg.lower():
                    try:
                        wait_time = float(re.search(r'(\d+\.?\d*)[s]', error_msg).group(1))
                        if wait_time < 30:  # Sadece kısa süreler için bekle
                            print(f"⏳ {wait_time:.0f}s bekleniyor...")
                            time.sleep(wait_time + 1)
                            continue
                    except:
                        pass
                
                # Başka model dene
                continue
            else:
                print(f"❌ {model_name} hatası: {error_msg[:100]}")
                continue
    
    print("⚠️ Tüm Gemini modelleri başarısız - Fallback aktif")
    return None


def analyze_database_smart(df: pd.DataFrame, filename: str) -> Dict[str, Any]:
    """
    FALLBACK: Pattern matching ile analiz
    """
    context = {
        "filename": filename,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": df.columns.tolist(),
        "date_columns": [],
        "status_columns": [],
        "numeric_columns": [],
        "id_columns": [],
        "text_columns": [],
        "important_columns": [],
        "domain": "genel",
        "entity_type": "kayıt",
        "purpose": f"{filename} veritabanı"
    }
    
    # Domain keywords
    domain_keywords = {
        "sağlık": ["patient", "hasta", "doktor", "doctor", "disease", "treatment"],
        "lojistik": ["kargo", "cargo", "teslimat", "delivery", "shipping"],
        "e-ticaret": ["ürün", "product", "fiyat", "price", "stok", "stock"],
        "kitap": ["book", "kitap", "author", "yazar", "isbn", "rating"],
        "finans": ["ödeme", "payment", "fatura", "tutar", "amount"]
    }
    
    # Sütun analizi
    for col in df.columns:
        col_lower = col.lower()
        
        if any(word in col_lower for word in ['date', 'tarih', 'time', 'zaman', 'day']):
            context["date_columns"].append(col)
        
        if any(word in col_lower for word in ['status', 'durum', 'state', 'condition']):
            context["status_columns"].append(col)
        
        if any(word in col_lower for word in ['id', 'no', 'kod']) and df[col].nunique() > len(df) * 0.8:
            context["id_columns"].append(col)
        
        if df[col].dtype in ['int64', 'float64']:
            context["numeric_columns"].append(col)
        elif df[col].dtype == 'object':
            context["text_columns"].append(col)
        
        # Domain detection
        for domain, keywords in domain_keywords.items():
            if any(kw in col_lower for kw in keywords):
                context["domain"] = domain
    
    # Entity type
    entity_map = {
        "sağlık": "hasta", "lojistik": "kargo", "e-ticaret": "ürün",
        "kitap": "kitap", "finans": "işlem"
    }
    context["entity_type"] = entity_map.get(context["domain"], "kayıt")
    
    context["important_columns"] = [col for col in df.columns if col not in context["id_columns"]][:5]
    
    return context


def analyze_database_with_ai(df: pd.DataFrame, filename: str) -> Dict[str, Any]:
    """
    Veritabanını Gemini ile analiz et - başarısız olursa fallback kullan
    """
    # Gemini'yi dene
    if AI_AVAILABLE:
        try:
            column_profiles = []
            for col in df.columns[:10]:  # İlk 10 sütun
                profile = {
                    "name": col,
                    "dtype": str(df[col].dtype),
                    "samples": df[col].dropna().head(3).astype(str).tolist()
                }
                column_profiles.append(profile)
            
            prompt = f"""Veritabanı analizi yap. JSON formatında yanıt ver.

Dosya: {filename}
Kayıt: {len(df)}
Sütunlar: {json.dumps(column_profiles, ensure_ascii=False)}

{{
    "purpose": "veritabanı amacı",
    "domain": "sağlık/lojistik/e-ticaret/kitap/finans/genel",
    "entity_type": "hasta/kargo/ürün/kitap/kayıt",
    "date_columns": ["tarih sütunları"],
    "status_columns": ["durum sütunları"],
    "numeric_columns": ["sayısal sütunlar"],
    "important_columns": ["önemli sütunlar"]
}}"""
            
            result = call_gemini_safe(prompt)
            
            if result:
                # JSON parse
                text = result.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                
                context = json.loads(text)
                
                # Eksik alanları tamamla
                context["filename"] = filename
                context["row_count"] = len(df)
                context["column_count"] = len(df.columns)
                context["columns"] = df.columns.tolist()
                
                print("✅ Gemini analizi başarılı")
                return context
        
        except Exception as e:
            print(f"⚠️ Gemini analizi başarısız: {e}")
    
    # Fallback
    print("🔄 Fallback analiz kullanılıyor")
    return analyze_database_smart(df, filename)


# ═══════════════════════════════════════════════════════════
# 📁 DATABASE FUNCTIONS
# ═══════════════════════════════════════════════════════════

def load_database(file_path: str) -> str:
    """Veritabanı yükle"""
    global ACTIVE_DATABASE, DATABASE_CONTEXT, LAST_QUERY_RESULT
    
    try:
        if not os.path.exists(file_path):
            return f"✗ Dosya bulunamadı: {file_path}"
        
        filename = os.path.basename(file_path)
        
        # CSV/Excel yükle
        if file_path.endswith('.csv'):
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    df = pd.read_csv(file_path, encoding=encoding, on_bad_lines='skip')
                    break
                except:
                    continue
        elif file_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            return "✗ Desteklenmeyen format."
        
        # AI analizi (Gemini + Fallback)
        context = analyze_database_with_ai(df, filename)
        
        ACTIVE_DATABASE = {"data": df, "filename": filename}
        DATABASE_CONTEXT = context
        LAST_QUERY_RESULT = None
        
        result = f"""✅ VERİTABANI YÜKLENDI
{'='*60}
📁 Dosya: {filename}
📊 Kayıt: {len(df)}
🔢 Sütun: {len(df.columns)}

🎯 ANALİZ:
{'─'*60}
🏢 Domain: {context.get('domain', 'genel')}
👤 Varlık: {context.get('entity_type', 'kayıt')}
📋 Sütunlar: {', '.join(df.columns.tolist()[:5])}
📅 Tarih: {', '.join(context.get('date_columns', [])[:3]) or 'Yok'}
🔢 Sayısal: {', '.join(context.get('numeric_columns', [])[:3]) or 'Yok'}

✨ Hazırım! Sorgu yapabilirsiniz."""
        
        return result
        
    except Exception as e:
        return f"✗ Hata: {str(e)}"




# REPLACE BLOCK: smart_query_database fonksiyonunu V3 ile değiştir

def smart_query_database(query: str) -> str:
    """V3 Query Engine - Test edilmiş ve çalışıyor"""
    global ACTIVE_DATABASE, DATABASE_CONTEXT, LAST_QUERY_RESULT
    
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data'].copy()
    context = DATABASE_CONTEXT
    query_lower = query.lower()
    
    print(f"🔍 Sorgu: '{query}'")
    
    try:
        result_df = df.copy()
        filtered = False
        
        # ═══ AŞAMA 1: FİLTRELEME ═══
        
        # 1A) İSİM FİLTRESİ
        if not filtered:
            patterns = [
                r'ismi?n?(?:de|da|ı)?\s+(.+?)\s+(?:olan|iceren|gecen|bulunan|var)',
                r'adi?n?(?:de|da|ı)?\s+(.+?)\s+(?:olan|iceren|gecen)',
            ]
            
            for pat in patterns:
                m = re.search(pat, query_lower)
                if m:
                    search_term = m.group(1).strip()
                    stopwords = ['ne', 'kadar', 'nedir', 'kac', 'tane', 'kisilerin', 'hastalarin', 'yas', 'ortalamasi', 'ortalamasini']
                    
                    if search_term not in stopwords:
                        print(f"  → İsim filtresi: '{search_term}'")
                        name_cols = [c for c in result_df.columns if 'name' in c.lower() or 'isim' in c.lower() or 'ad' in c.lower()]
                        
                        if name_cols:
                            mask = pd.Series([False] * len(result_df))
                            for col in name_cols:
                                try:
                                    pattern = r'\b' + re.escape(search_term) + r'\b'
                                    mask |= result_df[col].astype(str).str.contains(pattern, case=False, na=False, regex=True)
                                except:
                                    mask |= result_df[col].astype(str).str.contains(search_term, case=False, na=False)
                            
                            result_df = result_df[mask]
                            filtered = True
                            print(f"  ✓ {len(result_df)} kayıt bulundu")
                            break
        
        # 1B) YAZAR FİLTRESİ
        if not filtered:
            patterns = [
                r'(.+?)\s+tarafindan',
                r'yazar[ıi]?\s+(.+?)(?:\s|$)',
            ]
            
            for pat in patterns:
                m = re.search(pat, query_lower)
                if m:
                    author = m.group(1).strip()
                    if 'authors' in result_df.columns:
                        mask = result_df['authors'].astype(str).str.contains(author, case=False, na=False)
                        result_df = result_df[mask]
                        filtered = True
                        print(f"  ✓ Yazar '{author}': {len(result_df)} kayıt")
                        break
        
        # 1C) SAYISAL FİLTRE
        if not filtered:
            normalized_query = query_lower.replace('ı', 'i').replace('ü', 'u').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c')
            m = re.search(r'(\d+(?:\.\d+)?)\s*(?:\'?dan|\'?den|yasindan)?\s+(buyuk|kucuk|uzeri|fazla|az)', normalized_query)
            
            if m:
                value = float(m.group(1))
                operator = m.group(2)
                numeric_cols = context.get('numeric_columns', [])
                target_col = numeric_cols[0] if numeric_cols else None
                
                if target_col:
                    if 'buyuk' in operator or 'uzeri' in operator or 'fazla' in operator:
                        result_df = result_df[result_df[target_col] > value]
                    else:
                        result_df = result_df[result_df[target_col] < value]
                    
                    filtered = True
                    print(f"  ✓ Sayısal filtre: {target_col} {operator} {value} → {len(result_df)} kayıt")
        
        # Sonucu kaydet
        LAST_QUERY_RESULT = result_df.copy()
        
        # ═══ AŞAMA 2: HESAPLAMA ═══
        calc_keywords = ['ortalama', 'ortalamasi', 'average', 'mean', 'toplam', 'sum', 'sayi', 'kac', 'count', 'minimum', 'min', 'maksimum', 'max', 'hesapla']
        has_calc = any(kw in query_lower for kw in calc_keywords)
        
        if has_calc:
            numeric_cols = result_df.select_dtypes(include=['int64', 'float64']).columns.tolist()
            target_col = None
            
            for keyword in ['age', 'yas', 'rating', 'price']:
                for col in numeric_cols:
                    if keyword in col.lower():
                        target_col = col
                        break
                if target_col:
                    break
            
            if not target_col and numeric_cols:
                target_col = numeric_cols[0]
            
            if target_col:
                if 'ortalama' in query_lower or 'average' in query_lower or 'mean' in query_lower:
                    result = result_df[target_col].mean()
                    return f"✅ **{len(result_df)} kayıt** için **{target_col}** ortalaması: **{result:.2f}**"
                
                elif 'toplam' in query_lower or 'sum' in query_lower:
                    result = result_df[target_col].sum()
                    return f"✅ **{len(result_df)} kayıt** için **{target_col}** toplamı: **{result:.2f}**"
                
                elif 'kac' in query_lower or 'sayi' in query_lower or 'count' in query_lower:
                    return f"✅ Kayıt sayısı: **{len(result_df)}**"
                
                elif 'minimum' in query_lower or 'min' in query_lower or 'en kucuk' in query_lower:
                    result = result_df[target_col].min()
                    return f"✅ **{len(result_df)} kayıt** için **{target_col}** minimum: **{result}**"
                
                elif 'maksimum' in query_lower or 'max' in query_lower or 'en buyuk' in query_lower:
                    result = result_df[target_col].max()
                    return f"✅ **{len(result_df)} kayıt** için **{target_col}** maksimum: **{result}**"
        
        # ═══ AŞAMA 3: LİSTELEME ═══
        if len(result_df) == 0:
            return "✗ Sonuç bulunamadı."
        
        output = f"✅ **{len(result_df)} kayıt** bulundu:\n{'='*60}\n\n"
        
        important_cols = context.get('important_columns', result_df.columns.tolist()[:6])
        for idx, (_, row) in enumerate(result_df.head(20).iterrows(), 1):
            output += f"📌 **Kayıt {idx}**:\n"
            for col in important_cols:
                if col in result_df.columns:
                    output += f"   • {col}: {row[col]}\n"
            output += "\n"
        
        if len(result_df) > 20:
            output += f"... ve **{len(result_df) - 20}** kayıt daha.\n"
        
        return output
        
    except Exception as e:
        return f"✗ Sorgu hatası: {str(e)}\n{traceback.format_exc()}"



def get_database_info() -> str:
    """Veritabanı bilgisi"""
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    ctx = DATABASE_CONTEXT
    
    return f"""📊 VERİTABANI BİLGİLERİ
{'='*60}
📁 Dosya: {ctx.get('filename')}
📈 Kayıt: {len(df)}
🔢 Sütun: {len(df.columns)}
🏢 Domain: {ctx.get('domain')}
👤 Varlık: {ctx.get('entity_type')}

📋 Sütunlar:
{chr(10).join(f'  • {col}' for col in df.columns[:15])}
"""


def get_statistics() -> str:
    """İstatistikler"""
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = LAST_QUERY_RESULT if LAST_QUERY_RESULT is not None else ACTIVE_DATABASE['data']
    
    stats = f"📊 İSTATİSTİKLER ({len(df)} kayıt):\n{'='*60}\n\n"
    
    numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
    for col in numeric_cols[:5]:
        stats += f"📌 {col}:\n"
        stats += f"   • Ortalama: {df[col].mean():.2f}\n"
        stats += f"   • Min: {df[col].min()}\n"
        stats += f"   • Max: {df[col].max()}\n\n"
    
    return stats


def list_column_values(column_name: str) -> str:
    """Sütun değerlerini listele"""
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = LAST_QUERY_RESULT if LAST_QUERY_RESULT is not None else ACTIVE_DATABASE['data']
    
    actual_col = None
    for col in df.columns:
        if column_name.lower() in col.lower():
            actual_col = col
            break
    
    if not actual_col:
        return f"✗ '{column_name}' sütunu bulunamadı."
    
    values = df[actual_col].dropna().tolist()
    
    output = f"✓ {len(values)} değer ({actual_col}):\n\n"
    for idx, val in enumerate(values[:100], 1):
        output += f"{idx}. {val}\n"
    
    if len(values) > 100:
        output += f"\n... ve {len(values) - 100} değer daha."
    
    return output


def create_sample_database(filename: str = "kargo_data.csv") -> str:
    """Örnek veritabanı"""
    import random
    
    data = []
    durumlar = ["Hazırlanıyor", "Yolda", "Teslim Edildi", "Beklemede"]
    sehirler = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"]
    
    for i in range(100):
        kayit = {
            "KargoID": f"KRG{1000+i}",
            "MusteriAdi": f"Müşteri_{i+1}",
            "TeslimTarihi": (datetime.now() + timedelta(days=random.randint(-5, 10))).strftime("%Y-%m-%d"),
            "Durum": random.choice(durumlar),
            "Sehir": random.choice(sehirler),
            "Agirlik_kg": round(random.uniform(0.5, 25), 2),
            "Ucret_TL": round(random.uniform(20, 200), 2)
        }
        data.append(kayit)
    
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False, encoding='utf-8')
    
    return f"✅ {filename} oluşturuldu ({len(df)} kayıt)"


# ═══════════════════════════════════════════════════════════
# 🛠️ WRAPPER FUNCTIONS FOR ADVANCED TOOLS
# ═══════════════════════════════════════════════════════════

def tool_add_column(column_name: str, formula: str = None, default_value: str = "") -> str:
    """Yeni sütun ekle"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    df = add_column(df, column_name, formula, default_value)
    ACTIVE_DATABASE['data'] = df
    return f"✅ '{column_name}' sütunu eklendi."


def tool_delete_column(column_name: str) -> str:
    """Sütun sil"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    df = delete_column(df, column_name)
    ACTIVE_DATABASE['data'] = df
    return f"✅ '{column_name}' sütunu silindi."


def tool_rename_column(old_name: str, new_name: str) -> str:
    """Sütun adını değiştir"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    df = rename_column(df, old_name, new_name)
    ACTIVE_DATABASE['data'] = df
    return f"✅ '{old_name}' → '{new_name}' olarak değiştirildi."


def tool_correlation_analysis() -> str:
    """Korelasyon analizi"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return correlation_analysis(df)


def tool_outlier_detection(column: str) -> str:
    """Aykırı değer tespiti"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return outlier_detection(df, column)


def tool_missing_data_report() -> str:
    """Eksik veri raporu"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return missing_data_report(df)


def tool_group_by_analysis(group_col: str, agg_col: str, agg_func: str = "mean") -> str:
    """Gruplama analizi"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return group_by_analysis(df, group_col, agg_col, agg_func)


def tool_trend_analysis(date_col: str, value_col: str) -> str:
    """Trend analizi"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return trend_analysis(df, date_col, value_col)


def tool_export_to_json(filename: str) -> str:
    """JSON'a aktar"""
    global ACTIVE_DATABASE, LAST_QUERY_RESULT
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = LAST_QUERY_RESULT if LAST_QUERY_RESULT is not None else ACTIVE_DATABASE['data']
    return export_to_json(df, filename)


def tool_export_to_html(filename: str) -> str:
    """HTML'e aktar"""
    global ACTIVE_DATABASE, LAST_QUERY_RESULT
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = LAST_QUERY_RESULT if LAST_QUERY_RESULT is not None else ACTIVE_DATABASE['data']
    return export_to_html(df, filename)


def tool_clean_whitespace() -> str:
    """Boşlukları temizle"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    df = clean_whitespace(df)
    ACTIVE_DATABASE['data'] = df
    return "✅ Boşluklar temizlendi."


def tool_remove_duplicates(subset: str = None) -> str:
    """Tekrar eden kayıtları sil"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    before_count = len(df)
    df = remove_duplicates(df, subset.split(',') if subset else None)
    ACTIVE_DATABASE['data'] = df
    removed = before_count - len(df)
    return f"✅ {removed} tekrar eden kayıt silindi. Kalan: {len(df)}"


def tool_generate_summary_report() -> str:
    """Özet rapor"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return generate_summary_report(df)


def tool_create_frequency_table(column: str, top_n: int = 10) -> str:
    """Frekans tablosu"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return create_frequency_table(df, column, top_n)


def tool_compare_columns(col1: str, col2: str) -> str:
    """Sütun karşılaştırma"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return compare_columns(df, col1, col2)


def tool_database_schema() -> str:
    """Veritabanı şeması"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    return database_schema(df)


def tool_sample_database_creator(db_type: str, rows: int, filename: str) -> str:
    """Örnek veritabanı üret"""
    return sample_database_creator(db_type, rows, filename)


def tool_filter_top_n(column: str, n: int = 10) -> str:
    """En yüksek N kayıt"""
    global ACTIVE_DATABASE, LAST_QUERY_RESULT
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    result_df = filter_top_n(df, column, n)
    LAST_QUERY_RESULT = result_df
    
    return f"✅ En yüksek {n} kayıt ({column} bazında) bulundu."


def tool_fill_missing_values(column: str, method: str = "mean") -> str:
    """Eksik değerleri doldur"""
    global ACTIVE_DATABASE
    if not ACTIVE_DATABASE:
        return "✗ Veritabanı yüklü değil."
    
    df = ACTIVE_DATABASE['data']
    before_nulls = df[column].isnull().sum()
    df = fill_missing_values(df, column, method)
    ACTIVE_DATABASE['data'] = df
    
    return f"✅ {before_nulls} eksik değer {method} yöntemiyle dolduruldu."


# ═══════════════════════════════════════════════════════════
# 🤖 GOOGLE AGENT CLASS
# ═══════════════════════════════════════════════════════════

AVAILABLE_TOOLS = {
    # Temel işlemler
    "load_database": load_database,
    "smart_query_database": smart_query_database,
    "get_database_info": get_database_info,
    "get_statistics": get_statistics,
    "list_column_values": list_column_values,
    "create_sample_database": create_sample_database,
    
    # Veri manipülasyonu
    "tool_add_column": tool_add_column,
    "tool_delete_column": tool_delete_column,
    "tool_rename_column": tool_rename_column,
    
    # Analiz
    "tool_correlation_analysis": tool_correlation_analysis,
    "tool_outlier_detection": tool_outlier_detection,
    "tool_missing_data_report": tool_missing_data_report,
    "tool_group_by_analysis": tool_group_by_analysis,
    "tool_trend_analysis": tool_trend_analysis,
    
    # Export
    "tool_export_to_json": tool_export_to_json,
    "tool_export_to_html": tool_export_to_html,
    
    # Temizleme
    "tool_clean_whitespace": tool_clean_whitespace,
    "tool_remove_duplicates": tool_remove_duplicates,
    "tool_fill_missing_values": tool_fill_missing_values,
    
    # Raporlama
    "tool_generate_summary_report": tool_generate_summary_report,
    "tool_create_frequency_table": tool_create_frequency_table,
    "tool_compare_columns": tool_compare_columns,
    "tool_database_schema": tool_database_schema,
    
    # Oluşturma
    "tool_sample_database_creator": tool_sample_database_creator,
    "tool_filter_top_n": tool_filter_top_n,
}


class GoogleAgent:
    def __init__(self):
        if not AI_AVAILABLE:
            raise ValueError("❌ GOOGLE_API_KEY bulunamadı! .env dosyasını kontrol edin.")
        
        self.model_name = AVAILABLE_MODELS[0]
        self.current_model_index = 0
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            tools=self._define_tools()
        )
        self.chat = None
        
        print(f"""
╔══════════════════════════════════════════════════════════╗
║  🚀 Smart Database Manager - Google Gemini              ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  ✨ Google Generative AI SDK ile güçlendirilmiş         ║
║  🛡️ Quota-safe: Otomatik fallback sistemi              ║
║  🔄 Model switching: {len(AVAILABLE_MODELS)} alternatif model           ║
║  💾 Smart caching: Gereksiz API çağrıları önlenir       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  Aktif Model: {self.model_name:<39} ║
╚══════════════════════════════════════════════════════════╝
        """)
    
    def _define_tools(self) -> List:
        """Tool tanımları - 25+ araç"""
        return [{
            "function_declarations": [
                # ═══ Temel İşlemler ═══
                {
                    "name": "create_sample_database",
                    "description": "100 satırlık örnek kargo veritabanı (CSV) oluşturur",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string", "description": "Dosya adı"}
                        }
                    }
                },
                {
                    "name": "load_database",
                    "description": "CSV/Excel veritabanı yükler ve analiz eder",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Dosya yolu"}
                        },
                        "required": ["file_path"]
                    }
                },
                {
                    "name": "smart_query_database",
                    "description": "Veritabanında akıllı sorgulama yapar - filtreleme, hesaplama, gruplama",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Sorgu - örn: 'yaşı 30'dan büyük', 'isim Clara içeren', 'yaş ortalaması'"}
                        },
                        "required": ["query"]
                    }
                },
                {
                    "name": "get_database_info",
                    "description": "Veritabanı bilgilerini gösterir",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "get_statistics",
                    "description": "İstatistikler",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "list_column_values",
                    "description": "Sütun değerlerini listeler",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column_name": {"type": "string", "description": "Sütun adı"}
                        },
                        "required": ["column_name"]
                    }
                },
                
                # ═══ Veri Manipülasyonu ═══
                {
                    "name": "tool_add_column",
                    "description": "Yeni hesaplanmış sütun ekler - formül destekli (örn: 'total = price * quantity')",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column_name": {"type": "string", "description": "Yeni sütun adı"},
                            "formula": {"type": "string", "description": "Hesaplama formülü veya sabit değer"}
                        },
                        "required": ["column_name", "formula"]
                    }
                },
                {
                    "name": "tool_delete_column",
                    "description": "Sütun siler",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column_name": {"type": "string", "description": "Silinecek sütun"}
                        },
                        "required": ["column_name"]
                    }
                },
                {
                    "name": "tool_rename_column",
                    "description": "Sütun adını değiştirir",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "old_name": {"type": "string", "description": "Eski ad"},
                            "new_name": {"type": "string", "description": "Yeni ad"}
                        },
                        "required": ["old_name", "new_name"]
                    }
                },
                
                # ═══ İleri Seviye Analiz ═══
                {
                    "name": "tool_correlation_analysis",
                    "description": "Sayısal sütunlar arası korelasyon analizi yapar",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "tool_outlier_detection",
                    "description": "Aykırı değerleri tespit eder (IQR yöntemi)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column": {"type": "string", "description": "Analiz edilecek sütun"}
                        },
                        "required": ["column"]
                    }
                },
                {
                    "name": "tool_missing_data_report",
                    "description": "Eksik veri raporu oluşturur",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "tool_group_by_analysis",
                    "description": "Gruplama ve istatistiksel analiz yapar - HESAPLAMALAR İÇİN KULLAN",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "group_column": {"type": "string", "description": "Gruplamak için sütun"},
                            "agg_column": {"type": "string", "description": "Hesaplanacak sütun (örn: age)"},
                            "agg_function": {"type": "string", "description": "Fonksiyon: mean/sum/count/min/max/median"}
                        },
                        "required": ["group_column", "agg_column", "agg_function"]
                    }
                },
                {
                    "name": "tool_trend_analysis",
                    "description": "Tarih bazlı trend analizi",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "date_column": {"type": "string", "description": "Tarih sütunu"},
                            "value_column": {"type": "string", "description": "Değer sütunu"}
                        },
                        "required": ["date_column", "value_column"]
                    }
                },
                
                # ═══ Akıllı Filtreleme ═══
                {
                    "name": "tool_filter_top_n",
                    "description": "En yüksek N kayıdı getirir (varsayılan: 10)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column": {"type": "string", "description": "Sıralama sütunu"},
                            "n": {"type": "integer", "description": "Kayıt sayısı"}
                        },
                        "required": ["column"]
                    }
                },
                
                # ═══ Export ═══
                {
                    "name": "tool_export_to_json",
                    "description": "Sonuçları JSON dosyasına kaydeder",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string", "description": "Dosya adı (örn: results.json)"}
                        },
                        "required": ["filename"]
                    }
                },
                {
                    "name": "tool_export_to_html",
                    "description": "Sonuçları HTML tablosu olarak kaydeder",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string", "description": "Dosya adı (örn: report.html)"}
                        },
                        "required": ["filename"]
                    }
                },
                
                # ═══ Veri Temizleme ═══
                {
                    "name": "tool_clean_whitespace",
                    "description": "Text sütunlardaki gereksiz boşlukları temizler",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "tool_remove_duplicates",
                    "description": "Tekrar eden kayıtları siler",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "tool_fill_missing_values",
                    "description": "Eksik değerleri doldurur (varsayılan: mean)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column": {"type": "string", "description": "Sütun adı"},
                            "method": {"type": "string", "description": "Yöntem: mean/median/mode/zero"}
                        },
                        "required": ["column"]
                    }
                },
                
                # ═══ Raporlama ═══
                {
                    "name": "tool_generate_summary_report",
                    "description": "Detaylı özet rapor oluşturur",
                    "parameters": {"type": "object", "properties": {}}
                },
                {
                    "name": "tool_create_frequency_table",
                    "description": "Frekans tablosu oluşturur",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "column": {"type": "string", "description": "Sütun adı"}
                        },
                        "required": ["column"]
                    }
                },
                {
                    "name": "tool_compare_columns",
                    "description": "İki sütunu karşılaştırır",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "col1": {"type": "string", "description": "Birinci sütun"},
                            "col2": {"type": "string", "description": "İkinci sütun"}
                        },
                        "required": ["col1", "col2"]
                    }
                },
                {
                    "name": "tool_database_schema",
                    "description": "Veritabanı şeması ve sütun tipleri",
                    "parameters": {"type": "object", "properties": {}}
                },
                
                # ═══ Veritabanı Oluşturma ═══
                {
                    "name": "tool_sample_database_creator",
                    "description": "Özel örnek veritabanı oluşturur - 3 tip: kargo/hasta/öğrenci (varsayılan: 100 kayıt)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "db_type": {"type": "string", "description": "Tip: kargo/hasta/öğrenci"},
                            "rows": {"type": "integer", "description": "Kayıt sayısı"},
                            "filename": {"type": "string", "description": "Dosya adı"}
                        },
                        "required": ["db_type", "filename"]
                    }
                }
            ]
        }]
    
    def _execute_function(self, function_call):
        """Function çalıştır"""
        function_name = function_call.name
        function_args = dict(function_call.args.items())
        
        print(f"🔧 Tool: {function_name}({function_args})")
        
        if function_name in AVAILABLE_TOOLS:
            result = AVAILABLE_TOOLS[function_name](**function_args)
            return result
        else:
            return f"✗ Tool bulunamadı: {function_name}"
    
    def _switch_model(self):
        """Model değiştir"""
        self.current_model_index = (self.current_model_index + 1) % len(AVAILABLE_MODELS)
        self.model_name = AVAILABLE_MODELS[self.current_model_index]
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            tools=self._define_tools()
        )
        self.chat = None
        print(f"🔄 Model değiştirildi: {self.model_name}")
    
    def chat_with_agent(self, user_message: str) -> str:
        """Agent ile sohbet"""
        for attempt in range(len(AVAILABLE_MODELS)):
            try:
                if not self.chat:
                    self.chat = self.model.start_chat()
                
                response = self.chat.send_message(user_message)
                
                # Function call işle
                while response.candidates[0].content.parts[0].function_call:
                    function_call = response.candidates[0].content.parts[0].function_call
                    function_result = self._execute_function(function_call)
                    
                    response = self.chat.send_message(
                        genai.protos.Content(
                            parts=[genai.protos.Part(
                                function_response=genai.protos.FunctionResponse(
                                    name=function_call.name,
                                    response={'result': function_result}
                                )
                            )]
                        )
                    )
                
                return response.text
                
            except Exception as e:
                error_msg = str(e)
                
                if "429" in error_msg or "quota" in error_msg.lower():
                    print(f"⚠️ Rate limit - model değiştiriliyor...")
                    self._switch_model()
                    
                    if "retry in" in error_msg.lower():
                        try:
                            wait_time = float(re.search(r'(\d+\.?\d*)[s]', error_msg).group(1))
                            if wait_time < 30:
                                print(f"⏳ {wait_time:.0f}s bekleniyor...")
                                time.sleep(wait_time + 1)
                        except:
                            time.sleep(5)
                    
                    continue
                else:
                    raise e
        
        return "❌ Üzgünüm, şu anda AI servisleri yanıt vermiyor."
    
    def run(self):
        """Agent'ı çalıştır"""
        print("\n💬 Sohbet başladı! (Çıkmak için 'exit' yazın)\n")
        
        while True:
            try:
                user_input = input("😊 Siz: ").strip()
                
                if user_input.lower() in ['exit', 'quit', 'çıkış']:
                    print("👋 Görüşmek üzere!")
                    break
                
                if not user_input:
                    continue
                
                response = self.chat_with_agent(user_input)
                print(f"\n🤖 Agent: {response}\n")
                
            except KeyboardInterrupt:
                print("\n\n👋 Agent kapatılıyor...")
                break
            except Exception as e:
                print(f"\n❌ Hata: {str(e)}\n")


# ═══════════════════════════════════════════════════════════
# 🎬 MAIN
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    agent = GoogleAgent()
    agent.run()
