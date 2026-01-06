# coding: utf-8
"""
SON QUERY ENGINE - Tüm eksikleri düzeltilmiş
"""

import pandas as pd
import re
from datetime import datetime


def smart_query_database_v3(query: str, df: pd.DataFrame, context: dict) -> tuple:
    """
    3 Aşamalı Query Engine: Filtrele -> Hesapla -> Göster
    Returns: (result_dataframe, message_string)
    """
    print(f"[QUERY] '{query}'")
    
    result_df = df.copy()
    query_lower = query.lower()
    filtered = False
    
    # ═══════════════════════════════════════════════════════════
    # AŞAMA 1: FİLTRELEME
    # ═══════════════════════════════════════════════════════════
    
    # 1A) İSİM FİLTRESİ
    # Patterns: "isminde Clara olan", "adinda John iceren"
    if not filtered:
        # Önce arama terimini yakalayalım
        patterns = [
            r'ismi?n?(?:de|da|ı)?\s+(.+?)\s+(?:olan|iceren|gecen|bulunan|var)',
            r'adi?n?(?:de|da|ı)?\s+(.+?)\s+(?:olan|iceren|gecen)',
        ]
        
        for pat in patterns:
            m = re.search(pat, query_lower)
            if m:
                search_term = m.group(1).strip()
                
                # Stop-words filtrele
                stopwords = ['ne', 'kadar', 'nedir', 'kac', 'tane', 'kisilerin', 'hastalarin', 'yas', 'ortalamasi', 'ortalamasini']
                if search_term not in stopwords:
                    print(f"[NAME FILTER] '{search_term}'")
                    
                    # Name sütunları bul
                    name_cols = [c for c in result_df.columns if 'name' in c.lower() or 'isim' in c.lower() or 'ad' in c.lower()]
                    
                    if name_cols:
                        mask = pd.Series([False] * len(result_df))
                        for col in name_cols:
                            # Kelime sınırıyla arama yap (\b word boundary)
                            try:
                                pattern = r'\b' + re.escape(search_term) + r'\b'
                                mask |= result_df[col].astype(str).str.contains(pattern, case=False, na=False, regex=True)
                            except:
                                # Regex başarısız olursa basit contains kullan
                                mask |= result_df[col].astype(str).str.contains(search_term, case=False, na=False)
                        
                        result_df = result_df[mask]
                        filtered = True
                        print(f"[FILTERED] {len(result_df)} records with '{search_term}'")
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
                    print(f"[AUTHOR FILTER] {len(result_df)} records with author '{author}'")
                    break
    
    # 1C) SAYISAL FİLTRE  
    if not filtered:
        # Türkçe normalize: ı->i, ü->u, ş->s, ğ->g
        normalized_query = query_lower.replace('ı', 'i').replace('ü', 'u').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c')
        
        m = re.search(r'(\d+(?:\.\d+)?)\s*(?:\'?dan|\'?den|yasindan)?\s+(buyuk|kucuk|uzeri|fazla|az|asagi|alti)', normalized_query)
        if m:
            value = float(m.group(1))
            operator = m.group(2)
            
            numeric_cols = context.get('numeric_columns', [])
            target_col = numeric_cols[0] if numeric_cols else None
            
            if target_col:
                # DÜZELTME: fazla, uzeri, buyuk = BÜYÜK (>)
                # DÜZELTME: az, kucuk, asagi, alti = KÜÇÜK (<)
                if any(w in operator for w in ['buyuk', 'uzeri', 'fazla']):
                    result_df = result_df[result_df[target_col] > value]
                    filtered = True
                    print(f"[NUMERIC FILTER] {len(result_df)} records where {target_col} > {value}")
                elif any(w in operator for w in ['kucuk', 'az', 'asagi', 'alti']):
                    result_df = result_df[result_df[target_col] < value]
                    filtered = True
                    print(f"[NUMERIC FILTER] {len(result_df)} records where {target_col} < {value}")
    
    # ═══════════════════════════════════════════════════════════
    # AŞAMA 2: HESAPLAMA
    # ═══════════════════════════════════════════════════════════
    
    # Hesaplama keyword var mı?
    calc_keywords = ['ortalama', 'ortalamasi', 'average', 'mean', 'toplam', 'sum', 'sayi', 'kac', 'count', 'minimum', 'min', 'maksimum', 'max', 'hesapla', 'yuksek', 'dusuk', 'en']
    has_calc = any(kw in query_lower for kw in calc_keywords)
    
    if has_calc:
        numeric_cols = result_df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        
        # DÜZELTME: Sütun tespiti - sorguda geçen keyword'e göre
        target_col = None
        
        # Önce sorguda açıkça hangi sütun istendiğini bul
        # Türkçe karakterleri normalize et
        query_normalized = query_lower.replace('ı', 'i').replace('ü', 'u').replace('ş', 's').replace('ğ', 'g').replace('ç', 'c')
        
        column_keywords = {
            'maas': ['salary', 'maas', 'ucret', 'maaş'],  # ÖNCELİK: maas ("maasi"de "yas" var!)
            'yas': ['age', 'yas'],
            'fiyat': ['price', 'fiyat'],
            'rating': ['rating', 'puan'],
        }
        
        for query_term, col_names in column_keywords.items():
            # Kelime sınırları ile kontrol (maasi içinde yas olmasın)
            pattern = r'\b' + re.escape(query_term)  # Başlangıç sınırı
            if re.search(pattern, query_normalized):
                for col in numeric_cols:
                    if any(cn in col.lower() for cn in col_names):
                        target_col = col
                        break
                if target_col:
                    break
        
        # Bulunamadıysa genel kontrol
        if not target_col:
            for col in numeric_cols:
                col_keywords_lower = col.lower().replace('_', '')
                if any(kw in query_normalized for kw in [col_keywords_lower, col.lower()]):
                    target_col = col
                    break
        
        # Hala bulunamadıysa öncelik sırası: age > salary > diğerleri
        if not target_col:
            priority_order = ['age', 'yas', 'salary', 'maas', 'rating', 'puan', 'price', 'fiyat']
            for keyword in priority_order:
                for col in numeric_cols:
                    if keyword in col.lower():
                        target_col = col
                        break
                if target_col:
                    break
        
        # Hala bulunamadıysa ilk sayısal sütun
        if not target_col and numeric_cols:
            target_col = numeric_cols[0]
        
        if target_col:
            # İşlem türünü belirle
            if 'ortalama' in query_lower or 'average' in query_lower or 'mean' in query_lower:
                result = result_df[target_col].mean()
                msg = f"SONUC: {len(result_df)} kayit icin {target_col} ortalamasi = {result:.2f}"
                return result_df, msg
            
            elif 'toplam' in query_lower or 'sum' in query_lower:
                result = result_df[target_col].sum()
                msg = f"SONUC: {len(result_df)} kayit icin {target_col} toplami = {result:.2f}"
                return result_df, msg
            
            elif 'kac' in query_lower or 'sayi' in query_lower or 'count' in query_lower:
                msg = f"SONUC: {len(result_df)} kayit"
                return result_df, msg
            
            # ÖNCE MAKSIMUM kontrol et (yoksa "minimum" ile karışır)
            elif 'maksimum' in query_lower or 'max' in query_lower or 'en buyuk' in query_lower or 'en yuksek' in query_lower:
                result = result_df[target_col].max()
                msg = f"SONUC: {len(result_df)} kayit icin {target_col} maksimum = {result}"
                return result_df, msg
            
            # SONRA MINIMUM kontrol et
            elif 'minimum' in query_lower or 'min' in query_lower or 'en kucuk' in query_lower or 'en dusuk' in query_lower:
                result = result_df[target_col].min()
                msg = f"SONUC: {len(result_df)} kayit icin {target_col} minimum = {result}"
                return result_df, msg
            
            elif 'minimum' in query_lower or 'min' in query_lower or 'en kucuk' in query_lower:
                result = result_df[target_col].min()
                msg = f"SONUC: {len(result_df)} kayit icin {target_col} minimum = {result}"
                return result_df, msg
            
            elif 'maksimum' in query_lower or 'max' in query_lower or 'en buyuk' in query_lower:
                result = result_df[target_col].max()
                msg = f"SONUC: {len(result_df)} kayit icin {target_col} maksimum = {result}"
                return result_df, msg
    
    # ═══════════════════════════════════════════════════════════
    # AŞAMA 3: LİSTELEME
    # ═══════════════════════════════════════════════════════════
    
    if len(result_df) == 0:
        return result_df, "SONUC: Hic kayit bulunamadi"
    
    output = f"SONUC: {len(result_df)} kayit bulundu\n" + "="*60 + "\n\n"
    
    important_cols = context.get('important_columns', result_df.columns.tolist()[:6])
    for idx, (_, row) in enumerate(result_df.head(20).iterrows(), 1):
        output += f"[{idx}]\n"
        for col in important_cols:
            if col in result_df.columns:
                output += f"  {col}: {row[col]}\n"
        output += "\n"
    
    if len(result_df) > 20:
        output += f"... ve {len(result_df) - 20} kayit daha\n"
    
    return result_df, output
