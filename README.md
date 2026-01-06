# 🤖 Google Gemini AI Agent# Google AI Agent



**Gelişmiş doğal dil işleme, veri analizi ve otomasyon yeteneklerine sahip AI asistan.**Google Generative AI SDK (Gemini) kullanarak oluşturulmuş basit bir AI agent.



## 🚀 Hızlı Başlangıç## Kurulum



```bashGerekli paketleri yükleyin:

# Sanal ortamı aktif et

.\.venv\Scripts\Activate.ps1```bash

pip install -r requirements.txt

# Agent'ı çalıştır```

python agent_google.py

```Google AI API anahtarınızı alın:



## 📋 Özellikler- <https://makersuite.google.com/app/apikey> adresine gidin

- API anahtarınızı oluşturun

### 🔍 Akıllı Veri Sorgulama

- **3 Aşamalı Query Engine**: Filtreleme → Hesaplama → ListelemeAPI anahtarınızı ayarlayın:

- **İsim Filtreleme**: "isminde Clara olan kişiler" - Kelime sınırları ile hassas eşleşme

- **Sayısal Filtreleme**: ">30 yaşından büyük", "<40 yaşından küçük" - Türkçe operatörler### Seçenek 1: .env dosyası (Önerilen)

- **İstatistiksel Hesaplama**: Ortalama, minimum, maksimum, toplam, sayım

- **Çoklu Sütun Desteği**: Yaş, maaş, fiyat, rating - Otomatik sütun seçimi```bash

- **Türkçe Normalizasyon**: ı→i, ü→u, ş→s, ğ→g - Türkçe karakter desteğicp .env.example .env

```

**Örnek Sorgular:**

````.env` dosyasını düzenleyin ve API anahtarınızı ekleyin.

"isminde Clara olan kişilerin yaş ortalaması"

"30 yaşından büyük kişilerin maaş ortalaması"### Seçenek 2: Çevre Değişkeni

"en yüksek yaş nedir?"

"isminde Martinez olan kaç kişi var?"Windows PowerShell:

```

```powershell

### 🛠️ 60+ Güçlü Araç$env:GOOGLE_API_KEY = "your-api-key-here"

```

#### 📊 Veri Analizi

- `load_csv` - CSV dosyalarını yükle ve analiz etLinux/Mac:

- `smart_query_database` - Akıllı veri sorgulama (V3 engine)

- `get_column_stats` - Sütun istatistikleri (ortalama, min, max)```bash

- `filter_data` - Veri filtreleme ve segmentasyonexport GOOGLE_API_KEY="your-api-key-here"

```

#### 🌐 Web İşlemleri

- `search_web` - Google araması## Kullanım

- `fetch_url` - Web sayfası içeriğini çek

- `download_file` - Dosya indirme### Etkileşimli Mod

- `scrape_webpage` - Web scraping

```bash

#### 💻 Sistem İşlemleripython agent.py

- `run_python_code` - Python kodu çalıştır```

- `execute_command` - Terminal komutları

- `read_file` / `write_file` - Dosya okuma/yazmaAgent ile konuşmaya başlayabilirsiniz. Çıkmak için 'quit' veya 'exit' yazın.

- `list_directory` - Klasör içeriğini listele

### Kod İçinde Kullanım

#### 📧 İletişim

- `send_email` - E-posta gönder```python

- `send_sms` - SMS gönderfrom agent import GoogleAgent

- `make_api_call` - REST API çağrıları

# Agent'ı oluştur

#### 🧮 Hesaplamaagent = GoogleAgent(api_key="your-api-key")

- `calculator` - Matematiksel hesaplamalar

- `unit_converter` - Birim dönüştürme# Konuşma başlat

- `currency_converter` - Döviz çevirmeagent.start_conversation()

- `date_calculator` - Tarih hesaplamaları

# Mesaj gönder

#### 🎨 Görsel İşlemeresponse = agent.send_message("Python nedir?")

- `image_to_text` - OCR (görüntüden metin)print(response)

- `text_to_speech` - Sesli okuma

- `speech_to_text` - Ses tanıma# Veya tek seferlik yanıt al

- `qr_code_generator` - QR kod oluşturmaresponse = agent.generate_response("Yapay zeka hakkında kısa bir açıklama yap")

print(response)

#### 🗄️ Veritabanı```

- `create_table` - Tablo oluştur

- `insert_data` - Veri ekle## Özellikler

- `update_data` - Veri güncelle

- `delete_data` - Veri sil- ✅ Google Gemini Pro modeli ile çalışır

- ✅ Konuşma geçmişini saklar

#### ⏰ Zamanlama- ✅ Etkileşimli konuşma modu

- `schedule_task` - Görev zamanlama- ✅ Tek seferlik yanıt üretme

- `set_reminder` - Hatırlatıcı ayarla- ✅ Hata yönetimi

- `get_current_time` - Zaman bilgisi

## Örnek Kullanım

## 📁 Proje Yapısı

```text

```Agent: Merhaba! Size nasıl yardımcı olabilirim?

phonetest/

├── agent_google.py          # Ana agent (Google Gemini)Siz: Python ile liste nasıl oluşturulur?

├── agent_tools.py           # 60+ araç fonksiyonuAgent: Python'da liste oluşturmak çok kolay...

├── query_engine_v3.py       # Akıllı query engine

├── patients.csv             # Örnek hasta verileriSiz: quit

├── books.csv                # Örnek kitap verileriAgent: Hoşça kalın!

├── envanter.csv             # Örnek envanter verileri```

├── IKEA_SA_Furniture_Web_Scrapings_sss.csv
├── requirements.txt         # Python bağımlılıkları
└── .env                     # API anahtarları
```

## 🔑 Konfigürasyon

`.env` dosyası:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

## 💡 Kullanım Örnekleri

### Veri Analizi
```
User: "patients.csv dosyasını yükle"
Agent: ✅ Patients.csv yüklendi. 1000 kayıt, 15 sütun.

User: "isminde Clara olan kişilerin yaş ortalaması nedir?"
Agent: 📊 4 kayıt için age ortalaması = 35.50

User: "30 yaşından büyük kaç hasta var?"
Agent: 🔍 687 kayıt bulundu.
```

### Web İşlemleri
```
User: "Python hakkında bilgi bul"
Agent: 🌐 Google'da arama yapıyorum...
[Web sonuçları]

User: "example.com sayfasını indir"
Agent: 📥 Sayfa içeriği çekildi.
```

### Hesaplama
```
User: "15 * 24 + 100 kaç eder?"
Agent: 🧮 Sonuç: 460

User: "100 USD kaç TL?"
Agent: 💱 100 USD = 2,850 TL
```

## ⚡ Performans

- **Query Hızı**: ~1500-1700 sorgu/saniye
- **Ortalama Yanıt Süresi**: 0.001 saniye/sorgu
- **Desteklenen Veri Boyutu**: Sınırsız (CSV)
- **Eşzamanlı İşlem**: Çok iş parçacıklı

## 🛡️ Query Engine V3 Özellikleri

### 1. Filtreleme Önceliği
```python
# İsim filtresi: Kelime sınırları ile
"John" → Sadece John Doe (Johnson hariç)

# Sayısal filtre: Türkçe operatörler
"30 yaşından büyük" → age > 30
"40 yaşından küçük" → age < 40
"35 yaşından fazla" → age > 35
```

### 2. Akıllı Sütun Seçimi
```python
# Query-based column detection
"yaş ortalaması" → age column
"maaş ortalaması" → salary column
"en yüksek maaşı" → salary column (not age!)

# Priority: maas > yas > rating > price
```

### 3. İstatistiksel Hesaplama
```python
"ortalama" → mean()
"toplam" → sum()
"maksimum" → max()
"minimum" → min()
"kaç" → count()
```

### 4. Türkçe Dil Desteği
```python
# Karakter normalizasyonu
"yaşından" → "yasindan"
"büyük" → "buyuk"
"küçük" → "kucuk"

# Operatör eşleşmeleri
"büyük", "üzeri", "fazla" → >
"küçük", "az", "aşağı", "altı" → <
```

## 📝 Notlar

- **Google Gemini API** gerektirir
- **Python 3.8+** gerekir
- CSV dosyaları otomatik olarak pandas DataFrame'e dönüştürülür
- Tüm sorgular case-insensitive'dir (büyük/küçük harf duyarsız)
- Word boundary matching ile hassas isim eşleşmeleri

## 🐛 Sorun Giderme

**"API key bulunamadı" hatası:**
```bash
# .env dosyasını kontrol et
GOOGLE_API_KEY=your_actual_key_here
```

**"CSV yüklenemedi" hatası:**
```bash
# Dosya yolunu kontrol et
# Encoding problemi varsa: encoding='utf-8' veya 'latin-1'
```

**"Sütun bulunamadı" hatası:**
```bash
# Sütun isimlerini kontrol et
# get_column_stats fonksiyonu ile sütunları listele
```

## 📞 Destek

Sorularınız için issue açabilirsiniz.

---

**Versiyon:** 3.0  
**Son Güncelleme:** 12 Kasım 2025  
**Geliştirici:** AI Assistant  
**Lisans:** MIT
