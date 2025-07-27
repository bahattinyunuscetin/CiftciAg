# ÇiftciAg 🌾 – Akıllı Tarım Yönetim Sistemi

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" />
</div>

---

## 🌱 Genel Bakış

**ÇiftciAg**, çiftçiliği dijitalleştirmek ve verimliliği artırmak amacıyla geliştirilmiş uçtan uca bir akıllı tarım yönetim sistemidir. Gerçek zamanlı hava durumu verisi, ürün hastalık uyarıları, sulama takibi ve daha fazlasıyla tarımsal karar süreçlerini destekler.

---

## ✨ Temel Özellikler

### 🌾 Tarımsal Yönetim
- **Akıllı Sulama**
  - Hava durumu verisine dayalı otomatik planlama  
  - Su tüketiminin optimize edilmesi  
  - Bölgesel hava tahmin entegrasyonu  

- **Ürün Takibi ve Hastalık Yönetimi**
  - Ürün öneri sistemi  
  - Hastalık ve zararlı tespiti  
  - Erken uyarı bildirimleri  

- **Hava Durumu Entegrasyonu**
  - Anlık hava durumu verileri  
  - 5-7 günlük tahminler  
  - İklim analizi ve uyarılar  

### 👥 Kullanıcı Özellikleri
- **Rol Tabanlı Erişim**
  - Çiftçi paneli  
  - Ziraat mühendisi ve uzman portalı  
  - Yönetici kontrolleri ve özel izinler  

- **Bilgi Tabanı**
  - Tarımda en iyi uygulamalar  
  - Uzman makaleleri  
  - Etkileşimli rehberler  

---

## 🚀 Başlarken

### Gereksinimler
- Node.js (v14+)
- MongoDB (v4.4+)
- npm veya yarn
- Git

### Kurulum Adımları

1. Repoyu klonlayın:
```bash
git clone https://github.com/bahattinyunuscetin/CiftciAg.git
cd CiftciAg
Frontend ve backend bağımlılıklarını yükleyin:

bash
Kopyala
Düzenle
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
Ortam değişkenlerini ayarlayın:

bash
Kopyala
Düzenle
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
Sunucuları başlatın:

bash
Kopyala
Düzenle
# Backend
cd backend
npm run dev

# Yeni terminalde frontend
cd frontend
npm start
Uygulama:

Frontend: http://localhost:3000

API: http://localhost:5000

🧪 Test Süreci
bash
Kopyala
Düzenle
# Frontend testleri
cd frontend
npm test

# Backend testleri
cd backend
npm test
🔒 Güvenlik
JWT tabanlı kimlik doğrulama

Rol tabanlı erişim denetimi

Giriş doğrulama ve XSS koruması

CORS politikası

Rate Limiting

Şifre hashleme (bcrypt, scrypt, vs.)

📝 Lisans
Bu proje MIT lisansı ile lisanslanmıştır – detaylar için LICENSE dosyasına bakınız.

⚠️ Bu proje eğitim amaçlı geliştirilmiştir. Yetkisiz ticari kullanım yasaktır.

<div align="center"> <p>© 2024 ÇiftciAg – Türkiye’nin Tarımsal Dijitalleşme Projesi</p> </div> ```
