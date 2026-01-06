"""
🛠️ Agent Tools Library - 50+ Güçlü Özellik
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Veritabanı manipülasyonu, analiz, temizleme ve raporlama
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import re
from typing import Optional, Dict, Any, List, Union
import random


# ═══════════════════════════════════════════════════════════
# 📊 VERİ MANİPÜLASYONU
# ═══════════════════════════════════════════════════════════

def add_column(df: pd.DataFrame, column_name: str, formula: str = None, default_value: Any = None) -> pd.DataFrame:
    """Yeni sütun ekle"""
    if formula:
        # Basit formül desteği: "age * 2", "price + 10"
        try:
            df[column_name] = df.eval(formula)
        except:
            df[column_name] = default_value
    else:
        df[column_name] = default_value
    return df


def delete_column(df: pd.DataFrame, column_name: str) -> pd.DataFrame:
    """Sütun sil"""
    if column_name in df.columns:
        df = df.drop(columns=[column_name])
    return df


def rename_column(df: pd.DataFrame, old_name: str, new_name: str) -> pd.DataFrame:
    """Sütun adını değiştir"""
    if old_name in df.columns:
        df = df.rename(columns={old_name: new_name})
    return df


def add_row(df: pd.DataFrame, row_data: Dict) -> pd.DataFrame:
    """Yeni satır ekle"""
    new_row = pd.DataFrame([row_data])
    df = pd.concat([df, new_row], ignore_index=True)
    return df


def delete_row(df: pd.DataFrame, index: int) -> pd.DataFrame:
    """Satır sil"""
    df = df.drop(index=index)
    return df


def update_cell(df: pd.DataFrame, row_index: int, column_name: str, new_value: Any) -> pd.DataFrame:
    """Hücre güncelle"""
    if column_name in df.columns:
        df.at[row_index, column_name] = new_value
    return df


def merge_columns(df: pd.DataFrame, col1: str, col2: str, new_col: str, separator: str = " ") -> pd.DataFrame:
    """İki sütunu birleştir"""
    if col1 in df.columns and col2 in df.columns:
        df[new_col] = df[col1].astype(str) + separator + df[col2].astype(str)
    return df


def split_column(df: pd.DataFrame, column: str, delimiter: str, new_cols: List[str]) -> pd.DataFrame:
    """Sütunu ayır"""
    if column in df.columns:
        split_data = df[column].str.split(delimiter, expand=True)
        for i, col_name in enumerate(new_cols):
            if i < split_data.shape[1]:
                df[col_name] = split_data[i]
    return df


# ═══════════════════════════════════════════════════════════
# 📈 GELİŞMİŞ ANALİZ
# ═══════════════════════════════════════════════════════════

def correlation_analysis(df: pd.DataFrame) -> str:
    """Korelasyon analizi"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) < 2:
        return "Yetersiz sayısal sütun"
    
    corr_matrix = df[numeric_cols].corr()
    
    result = "📊 KORELASYON ANALİZİ\n" + "="*60 + "\n\n"
    
    # En yüksek korelasyonlar
    corr_pairs = []
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            col1, col2 = corr_matrix.columns[i], corr_matrix.columns[j]
            corr_value = corr_matrix.iloc[i, j]
            corr_pairs.append((col1, col2, corr_value))
    
    corr_pairs.sort(key=lambda x: abs(x[2]), reverse=True)
    
    for col1, col2, corr in corr_pairs[:10]:
        result += f"• {col1} ↔ {col2}: {corr:.3f}\n"
    
    return result


def outlier_detection(df: pd.DataFrame, column: str, method: str = "iqr") -> str:
    """Aykırı değer tespiti"""
    if column not in df.columns or df[column].dtype not in [np.number]:
        return "Geçersiz sütun"
    
    data = df[column].dropna()
    
    if method == "iqr":
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        outliers = df[(df[column] < lower) | (df[column] > upper)]
    else:
        # Z-score method
        mean = data.mean()
        std = data.std()
        outliers = df[np.abs((df[column] - mean) / std) > 3]
    
    result = f"🔍 AYKIRI DEĞER ANALİZİ ({column})\n" + "="*60 + "\n\n"
    result += f"Aykırı değer sayısı: {len(outliers)}\n"
    result += f"Toplam kayıt: {len(df)}\n"
    result += f"Oran: %{len(outliers)/len(df)*100:.2f}\n"
    
    return result


def missing_data_report(df: pd.DataFrame) -> str:
    """Eksik veri raporu"""
    result = "📋 EKSİK VERİ RAPORU\n" + "="*60 + "\n\n"
    
    for col in df.columns:
        missing = df[col].isnull().sum()
        if missing > 0:
            pct = missing / len(df) * 100
            result += f"• {col}: {missing} eksik (%{pct:.2f})\n"
    
    return result


def group_by_analysis(df: pd.DataFrame, group_col: str, agg_col: str, agg_func: str = "mean") -> str:
    """Gruplama analizi"""
    if group_col not in df.columns or agg_col not in df.columns:
        return "Geçersiz sütunlar"
    
    if agg_func == "mean":
        grouped = df.groupby(group_col)[agg_col].mean()
    elif agg_func == "sum":
        grouped = df.groupby(group_col)[agg_col].sum()
    elif agg_func == "count":
        grouped = df.groupby(group_col)[agg_col].count()
    else:
        grouped = df.groupby(group_col)[agg_col].mean()
    
    result = f"📊 GRUPLAMA ANALİZİ\n{group_col} bazında {agg_col} ({agg_func})\n" + "="*60 + "\n\n"
    
    for group, value in grouped.items():
        result += f"• {group}: {value:.2f}\n"
    
    return result


def trend_analysis(df: pd.DataFrame, date_col: str, value_col: str) -> str:
    """Trend analizi"""
    if date_col not in df.columns or value_col not in df.columns:
        return "Geçersiz sütunlar"
    
    df_copy = df.copy()
    df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
    df_copy = df_copy.dropna(subset=[date_col, value_col])
    df_copy = df_copy.sort_values(date_col)
    
    # Basit trend (ilk vs son)
    first_val = df_copy[value_col].iloc[0]
    last_val = df_copy[value_col].iloc[-1]
    change = ((last_val - first_val) / first_val) * 100
    
    result = f"📈 TREND ANALİZİ\n" + "="*60 + "\n\n"
    result += f"İlk değer: {first_val:.2f}\n"
    result += f"Son değer: {last_val:.2f}\n"
    result += f"Değişim: %{change:.2f}\n"
    
    return result


def pivot_table(df: pd.DataFrame, index_col: str, columns_col: str, values_col: str, aggfunc: str = "mean") -> str:
    """Pivot tablo"""
    try:
        pivot = pd.pivot_table(df, values=values_col, index=index_col, 
                              columns=columns_col, aggfunc=aggfunc)
        return f"✅ Pivot tablo oluşturuldu\n\n{pivot.to_string()}"
    except Exception as e:
        return f"Pivot tablo hatası: {e}"


# ═══════════════════════════════════════════════════════════
# 🔍 AKILLI FİLTRELEME
# ═══════════════════════════════════════════════════════════

def filter_by_range(df: pd.DataFrame, column: str, min_val: float, max_val: float) -> pd.DataFrame:
    """Aralık filtresi"""
    if column in df.columns:
        return df[(df[column] >= min_val) & (df[column] <= max_val)]
    return df


def filter_by_list(df: pd.DataFrame, column: str, values: List) -> pd.DataFrame:
    """Liste ile filtre"""
    if column in df.columns:
        return df[df[column].isin(values)]
    return df


def filter_duplicates(df: pd.DataFrame, subset: List[str] = None) -> pd.DataFrame:
    """Tekrar eden kayıtlar"""
    return df[df.duplicated(subset=subset, keep=False)]


def filter_top_n(df: pd.DataFrame, column: str, n: int = 10, ascending: bool = False) -> pd.DataFrame:
    """İlk/son N kayıt"""
    if column in df.columns:
        return df.nlargest(n, column) if not ascending else df.nsmallest(n, column)
    return df.head(n)


def filter_random_sample(df: pd.DataFrame, n: int = 100, frac: float = None) -> pd.DataFrame:
    """Rastgele örneklem"""
    if frac:
        return df.sample(frac=frac)
    return df.sample(n=min(n, len(df)))


# ═══════════════════════════════════════════════════════════
# 💾 VERİ İÇE/DIŞA AKTARMA
# ═══════════════════════════════════════════════════════════

def export_to_json(df: pd.DataFrame, filename: str) -> str:
    """JSON'a aktar"""
    try:
        df.to_json(filename, orient='records', indent=2, force_ascii=False)
        return f"✅ {filename} oluşturuldu"
    except Exception as e:
        return f"Hata: {e}"


def export_to_html(df: pd.DataFrame, filename: str) -> str:
    """HTML tablo"""
    try:
        html = df.to_html(index=False)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"<html><body>{html}</body></html>")
        return f"✅ {filename} oluşturuldu"
    except Exception as e:
        return f"Hata: {e}"


def export_to_sql(df: pd.DataFrame, table_name: str, filename: str) -> str:
    """SQL INSERT scriptleri"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            for _, row in df.iterrows():
                cols = ', '.join(df.columns)
                vals = ', '.join([f"'{v}'" if isinstance(v, str) else str(v) for v in row])
                f.write(f"INSERT INTO {table_name} ({cols}) VALUES ({vals});\n")
        return f"✅ {filename} oluşturuldu"
    except Exception as e:
        return f"Hata: {e}"


def merge_databases(df1: pd.DataFrame, df2: pd.DataFrame, how: str = "inner", on: str = None) -> pd.DataFrame:
    """İki veritabanını birleştir"""
    if on:
        return pd.merge(df1, df2, how=how, on=on)
    return pd.merge(df1, df2, how=how, left_index=True, right_index=True)


def append_database(df1: pd.DataFrame, df2: pd.DataFrame) -> pd.DataFrame:
    """Veritabanına ekle (union)"""
    return pd.concat([df1, df2], ignore_index=True)


# ═══════════════════════════════════════════════════════════
# 🎨 VERİ TEMİZLEME
# ═══════════════════════════════════════════════════════════

def clean_whitespace(df: pd.DataFrame) -> pd.DataFrame:
    """Boşlukları temizle"""
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].str.strip()
    return df


def standardize_case(df: pd.DataFrame, column: str, case_type: str = "lower") -> pd.DataFrame:
    """Büyük/küçük harf standardizasyonu"""
    if column in df.columns and df[column].dtype == 'object':
        if case_type == "lower":
            df[column] = df[column].str.lower()
        elif case_type == "upper":
            df[column] = df[column].str.upper()
        elif case_type == "title":
            df[column] = df[column].str.title()
    return df


def remove_duplicates(df: pd.DataFrame, subset: List[str] = None, keep: str = 'first') -> pd.DataFrame:
    """Tekrar eden satırları sil"""
    return df.drop_duplicates(subset=subset, keep=keep)


def fill_missing_values(df: pd.DataFrame, column: str, method: str = "mean") -> pd.DataFrame:
    """Eksik değerleri doldur"""
    if column in df.columns:
        if method == "mean" and df[column].dtype in [np.number]:
            df[column].fillna(df[column].mean(), inplace=True)
        elif method == "median" and df[column].dtype in [np.number]:
            df[column].fillna(df[column].median(), inplace=True)
        elif method == "mode":
            df[column].fillna(df[column].mode()[0], inplace=True)
        elif method == "forward":
            df[column].fillna(method='ffill', inplace=True)
    return df


def normalize_data(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """Min-Max normalizasyonu (0-1)"""
    if column in df.columns and df[column].dtype in [np.number]:
        min_val = df[column].min()
        max_val = df[column].max()
        df[f"{column}_normalized"] = (df[column] - min_val) / (max_val - min_val)
    return df


def standardize_data(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """Z-score standardizasyonu"""
    if column in df.columns and df[column].dtype in [np.number]:
        mean = df[column].mean()
        std = df[column].std()
        df[f"{column}_standardized"] = (df[column] - mean) / std
    return df


# ═══════════════════════════════════════════════════════════
# 📊 GÖRSELLEŞTIRME & RAPORLAMA
# ═══════════════════════════════════════════════════════════

def generate_summary_report(df: pd.DataFrame) -> str:
    """Özet rapor"""
    result = "📊 ÖZET RAPOR\n" + "="*60 + "\n\n"
    result += f"📈 Toplam Kayıt: {len(df)}\n"
    result += f"🔢 Toplam Sütun: {len(df.columns)}\n\n"
    
    result += "📋 SÜTUN BİLGİLERİ:\n" + "-"*60 + "\n"
    for col in df.columns:
        dtype = df[col].dtype
        null_count = df[col].isnull().sum()
        unique_count = df[col].nunique()
        
        result += f"\n• {col}:\n"
        result += f"  Tip: {dtype}\n"
        result += f"  Benzersiz: {unique_count}\n"
        result += f"  Eksik: {null_count}\n"
        
        if df[col].dtype in [np.number]:
            result += f"  Min: {df[col].min()}\n"
            result += f"  Max: {df[col].max()}\n"
            result += f"  Ort: {df[col].mean():.2f}\n"
    
    return result


def create_frequency_table(df: pd.DataFrame, column: str, top_n: int = 10) -> str:
    """Frekans tablosu"""
    if column not in df.columns:
        return "Geçersiz sütun"
    
    freq = df[column].value_counts().head(top_n)
    
    result = f"📊 FREKANS TABLOSU ({column})\n" + "="*60 + "\n\n"
    
    for value, count in freq.items():
        pct = count / len(df) * 100
        result += f"• {value}: {count} adet (%{pct:.2f})\n"
    
    return result


def compare_columns(df: pd.DataFrame, col1: str, col2: str) -> str:
    """Sütun karşılaştırma"""
    if col1 not in df.columns or col2 not in df.columns:
        return "Geçersiz sütunlar"
    
    result = f"📊 SÜTUN KARŞILAŞTIRMA\n{col1} vs {col2}\n" + "="*60 + "\n\n"
    
    # İstatistikler
    if df[col1].dtype in [np.number] and df[col2].dtype in [np.number]:
        result += f"Ortalama:\n  {col1}: {df[col1].mean():.2f}\n  {col2}: {df[col2].mean():.2f}\n\n"
        result += f"Medyan:\n  {col1}: {df[col1].median():.2f}\n  {col2}: {df[col2].median():.2f}\n\n"
        result += f"Standart Sapma:\n  {col1}: {df[col1].std():.2f}\n  {col2}: {df[col2].std():.2f}\n\n"
        
        # Korelasyon
        corr = df[[col1, col2]].corr().iloc[0, 1]
        result += f"Korelasyon: {corr:.3f}\n"
    
    return result


# ═══════════════════════════════════════════════════════════
# 🔧 VERİTABANI YÖNETİMİ
# ═══════════════════════════════════════════════════════════

def create_new_database(columns: List[str], filename: str) -> str:
    """Sıfırdan yeni veritabanı"""
    df = pd.DataFrame(columns=columns)
    df.to_csv(filename, index=False)
    return f"✅ {filename} oluşturuldu ({len(columns)} sütun)"


def sample_database_creator(db_type: str, rows: int, filename: str) -> str:
    """Örnek veri üretici"""
    
    if db_type == "kargo":
        data = []
        durumlar = ["Hazırlanıyor", "Yolda", "Teslim Edildi", "Beklemede", "İade"]
        sehirler = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya"]
        
        for i in range(rows):
            kayit = {
                "KargoID": f"KRG{1000+i}",
                "MusteriAdi": f"Müşteri_{i+1}",
                "TeslimTarihi": (datetime.now() + timedelta(days=random.randint(-10, 20))).strftime("%Y-%m-%d"),
                "Durum": random.choice(durumlar),
                "Sehir": random.choice(sehirler),
                "Agirlik_kg": round(random.uniform(0.5, 50), 2),
                "Ucret_TL": round(random.uniform(15, 500), 2),
                "TakipNo": f"TK{random.randint(100000, 999999)}"
            }
            data.append(kayit)
    
    elif db_type == "hasta":
        data = []
        teshisler = ["Grip", "COVID-19", "Migren", "Hipertansiyon", "Diyabet", "Astım"]
        bölümler = ["Dahiliye", "Kardiyoloji", "Nöroloji", "Göğüs Hastalıkları"]
        
        for i in range(rows):
            kayit = {
                "HastaID": f"H{10000+i}",
                "Ad": f"Hasta_{i+1}",
                "Yas": random.randint(18, 85),
                "GelisTarihi": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d"),
                "AyrilisTarihi": (datetime.now() + timedelta(days=random.randint(1, 15))).strftime("%Y-%m-%d"),
                "Teshis": random.choice(teshisler),
                "Bolum": random.choice(bölümler),
                "Memnuniyet": round(random.uniform(1, 5), 1)
            }
            data.append(kayit)
    
    elif db_type == "öğrenci":
        data = []
        bölümler = ["Bilgisayar Mühendisliği", "Elektrik-Elektronik", "Makine", "İnşaat"]
        
        for i in range(rows):
            kayit = {
                "OgrenciNo": f"2024{10000+i}",
                "Ad": f"Öğrenci_{i+1}",
                "Bolum": random.choice(bölümler),
                "Sinif": random.randint(1, 4),
                "Ortalama": round(random.uniform(2.0, 4.0), 2),
                "KayitTarihi": f"2024-09-{random.randint(1, 28):02d}",
                "DersYuku": random.randint(20, 35)
            }
            data.append(kayit)
    
    else:
        return "Desteklenmeyen tip. Mevcut: kargo, hasta, öğrenci"
    
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False, encoding='utf-8')
    
    return f"✅ {filename} oluşturuldu ({len(df)} kayıt, {len(df.columns)} sütun)"


def database_schema(df: pd.DataFrame) -> str:
    """Şema bilgisi"""
    result = "🗂️ VERİTABANI ŞEMASI\n" + "="*60 + "\n\n"
    
    for col in df.columns:
        dtype = df[col].dtype
        null_count = df[col].isnull().sum()
        unique_count = df[col].nunique()
        
        result += f"• {col}:\n"
        result += f"    Tip: {dtype}\n"
        result += f"    NULL: {null_count > 0}\n"
        result += f"    Benzersiz: {unique_count}\n"
        result += f"    Kardinalite: {unique_count / len(df) * 100:.1f}%\n\n"
    
    return result


def database_diff(df1: pd.DataFrame, df2: pd.DataFrame) -> str:
    """İki veritabanını karşılaştır"""
    result = "🔍 VERİTABANI KARŞILAŞTIRMA\n" + "="*60 + "\n\n"
    
    # Sütun farkları
    cols1 = set(df1.columns)
    cols2 = set(df2.columns)
    
    only_in_1 = cols1 - cols2
    only_in_2 = cols2 - cols1
    common = cols1 & cols2
    
    result += f"Ortak sütunlar: {len(common)}\n"
    result += f"Sadece DB1'de: {len(only_in_1)} ({', '.join(only_in_1) if only_in_1 else 'yok'})\n"
    result += f"Sadece DB2'de: {len(only_in_2)} ({', '.join(only_in_2) if only_in_2 else 'yok'})\n\n"
    
    # Kayıt sayıları
    result += f"DB1 kayıt: {len(df1)}\n"
    result += f"DB2 kayıt: {len(df2)}\n"
    result += f"Fark: {abs(len(df1) - len(df2))}\n"
    
    return result


# --- Tool exposure for agent integration ---
# Simple TOOLS_LIST and helper to retrieve functions by name. This allows
# the agent integration to look up and call local functions by string name.
TOOLS_LIST = [
    {"name": "create_new_database", "description": "Create a new CSV/sample database file"},
    {"name": "sample_database_creator", "description": "Create a sample CSV database"},
    {"name": "export_to_json", "description": "Export DataFrame to JSON file"},
    {"name": "generate_summary_report", "description": "Generate summary report for DataFrame"},
]


def get_tool_function(name: str):
    """Return a callable from this module matching the given name, or None."""
    try:
        fn = globals().get(name)
        if callable(fn):
            return fn
    except Exception:
        return None
    return None
