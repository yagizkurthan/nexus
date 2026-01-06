# 🚀 Render.com Deployment Guide

## Adım Adım Kurulum

### 1. GitHub'a Yükle

```bash
# Git repository oluştur
git init
git add .
git commit -m "Google Gemini AI Agent Web App"

# GitHub'da yeni repo oluştur: https://github.com/new
# Sonra push et
git remote add origin https://github.com/USERNAME/gemini-ai-agent.git
git branch -M main
git push -u origin main
```

### 2. Render.com'a Deploy Et

1. **Render.com'a Git**: https://render.com
2. **Kaydol/Giriş Yap** (GitHub ile)
3. **New +** → **Web Service**
4. **GitHub repo'nuzu seçin**
5. **Ayarları yapın:**
   - **Name**: `gemini-ai-agent` (veya istediğiniz isim)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: `Free` (ücretsiz)

6. **Environment Variables ekle:**
   - Key: `GOOGLE_API_KEY`
   - Value: `your_google_api_key_here`
   
7. **Create Web Service** butonuna tıkla

### 3. Deploy Tamamlandı! 🎉

- URL: `https://gemini-ai-agent.onrender.com` (otomatik verilir)
- İlk deploy 2-3 dakika sürebilir
- Her GitHub push otomatik deploy tetikler

## 📱 Kullanım

1. Render URL'inizi açın
2. Chat kutusuna mesaj yazın
3. AI agent tüm araçlarla yanıt verir!

## 🔧 Özellikler

✅ **60+ Araç**: CSV analizi, web search, calculator, vb.  
✅ **Query Engine V3**: Akıllı veri sorgulama  
✅ **Responsive Design**: Mobil uyumlu  
✅ **Real-time Chat**: Anlık yanıtlar  
✅ **Session Management**: Konuşma geçmişi  

## 💡 Örnek Sorgular

```
"patients.csv dosyasını yükle ve analiz et"
"isminde Clara olan kişilerin yaş ortalaması nedir?"
"Python hakkında web'de arama yap"
"15 * 24 + 100 kaç eder?"
"100 USD kaç TL?"
```

## ⚠️ Önemli Notlar

### Ücretsiz Plan Limitleri:
- ✅ 750 saat/ay çalışma süresi
- ⚠️ 15 dakika inaktif sonra sleep mode
- ⚠️ İlk istek sonrası 30-60 saniye yavaş başlatma
- ✅ Otomatik HTTPS
- ✅ Otomatik deploy (GitHub push)

### Sleep Mode'dan Kurtulma:
1. Ücretli plan ($7/ay) - Recommended
2. Cron job ile ping (UptimeRobot, cron-job.org)
3. Başka bir servisten her 10 dakikada health check

### CSV Dosyaları:
- Render.com'da CSV dosyaları geçici
- Her deploy'da sıfırlanır
- Çözüm: Google Drive/Dropbox entegrasyonu veya database kullan

## 🔄 Güncelleme

```bash
# Kod değiştir
git add .
git commit -m "Update: new feature"
git push

# Render otomatik deploy eder!
```

## 🐛 Sorun Giderme

### Deploy Failed:
```bash
# Logs kontrol et: Render dashboard → Logs
# requirements.txt kontrol et
# Python version uyumluluğu kontrol et
```

### Environment Variable Hatası:
```
# Render dashboard → Environment
# GOOGLE_API_KEY doğru girilmiş mi kontrol et
# Save changes sonrası manual deploy
```

### Timeout Hatası:
```
# Procfile'da timeout artır:
web: gunicorn app:app --timeout 120
```

## 📞 Destek

- Render Docs: https://render.com/docs
- GitHub Issues: Repo'nuzda issue açın
- Community: https://community.render.com

---

**Not**: İlk deploy sonrası URL'nizi kaydedin! Her yerden erişebilirsiniz! 🌍
