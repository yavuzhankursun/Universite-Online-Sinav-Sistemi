# Üniversite Online Sınav Sistemi

Kocaeli Sağlık ve Teknoloji Üniversitesi için geliştirilmiş web tabanlı online sınav yönetim sistemi. Bu sistem, öğrencilerin online sınavlara katılmasını, öğretim üyelerinin sınav oluşturmasını ve yönetmesini, bölüm başkanlarının istatistikleri görüntülemesini ve adminlerin sistem yönetimini sağlar.

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Geliştirici](#geliştirici)

## ✨ Özellikler

### 👨‍💼 Admin Paneli
- Kullanıcı yönetimi (ekleme, düzenleme, silme)
- Departman yönetimi
- Ders yönetimi ve atama işlemleri
- Kullanıcı-rol yönetimi

### 👨‍🏫 Öğretim Üyesi Paneli
- Ders yönetimi
- Sınav oluşturma ve düzenleme
- Soru bankası yönetimi (çoktan seçmeli sorular)
- Sınav sonuçlarını görüntüleme ve değerlendirme
- Otomatik not hesaplama

### 🎓 Öğrenci Paneli
- Aktif sınavları görüntüleme
- Online sınavlara katılma
- Geri sayım sayacı ile sınav süresi takibi
- Sınav sonuçlarını görüntüleme
- Ders listesi görüntüleme

### 📊 Bölüm Başkanı Paneli
- Tüm dersleri görüntüleme
- Tüm öğrencileri görüntüleme
- Departman istatistikleri
- Genel sistem istatistikleri

## 🛠 Teknolojiler

### Backend
- **Python 3.12+**
- **Flask 3.0.0** - Web framework
- **Flask-SQLAlchemy 3.1.1** - ORM
- **Flask-JWT-Extended 4.6.0** - JWT tabanlı kimlik doğrulama
- **Flask-CORS 4.0.0** - Cross-Origin Resource Sharing
- **PostgreSQL** - İlişkisel veritabanı
- **psycopg2-binary 2.9.9** - PostgreSQL adapter
- **bcrypt 4.1.2** - Şifre hashleme

### Frontend
- **React 18.2.0** - UI kütüphanesi
- **React Router DOM 6.20.0** - Routing
- **Axios 1.6.2** - HTTP client
- **Webpack 5.89.0** - Module bundler
- **Babel** - JavaScript transpiler

## 📁 Proje Yapısı

```
/
├── backend/                    # Flask API sunucusu
│   ├── routes/                 # API endpoint'leri
│   │   ├── admin.py           # Admin işlemleri
│   │   ├── auth.py            # Kimlik doğrulama
│   │   ├── department_head.py # Bölüm başkanı işlemleri
│   │   ├── instructor.py      # Öğretim üyesi işlemleri
│   │   └── student.py         # Öğrenci işlemleri
│   ├── services/               # İş mantığı servisleri
│   │   ├── exam_service.py    # Sınav servisi
│   │   ├── grade_service.py   # Not hesaplama servisi
│   │   └── question_service.py # Soru servisi
│   ├── utils/                  # Yardımcı fonksiyonlar
│   │   └── timezone.py        # Zaman dilimi işlemleri
│   ├── models.py               # Veritabanı modelleri
│   ├── config.py              # Konfigürasyon
│   ├── app.py                 # Flask uygulaması
│   ├── middleware.py          # Middleware'ler
│   ├── requirements.txt       # Python bağımlılıkları
│   └── create_comprehensive_test.py # Test verisi oluşturma scripti
│
├── frontend/                   # React uygulaması
│   ├── src/
│   │   ├── components/        # React bileşenleri
│   │   │   ├── admin/         # Admin bileşenleri
│   │   │   ├── auth/          # Kimlik doğrulama bileşenleri
│   │   │   ├── department-head/ # Bölüm başkanı bileşenleri
│   │   │   ├── instructor/    # Öğretim üyesi bileşenleri
│   │   │   ├── student/       # Öğrenci bileşenleri
│   │   │   └── shared/        # Ortak bileşenler
│   │   ├── context/           # React Context API
│   │   ├── services/          # API servisleri
│   │   └── styles/            # CSS dosyaları
│   ├── public/                # Statik dosyalar
│   ├── package.json           # Node.js bağımlılıkları
│   └── webpack.config.js      # Webpack konfigürasyonu
│
├── database/                   # Veritabanı migration dosyaları
│   └── migrations/            # SQL migration scriptleri
│
└── README.md                   # Proje dokümantasyonu
```

## 🚀 Kurulum

### Gereksinimler

- Python 3.12 veya üzeri
- Node.js 16 veya üzeri
- PostgreSQL 12 veya üzeri
- npm veya yarn

### 1. Veritabanı Kurulumu

PostgreSQL veritabanını oluşturun:

**Windows (PowerShell/CMD):**
```bash
psql -U postgres
CREATE DATABASE exam_system;
\q
```

**pgAdmin kullanarak:**
1. pgAdmin'i açın
2. Servers > PostgreSQL > Databases'e sağ tıklayın
3. "Create" > "Database" seçin
4. Database name: `exam_system` yazın
5. "Save" butonuna tıklayın

### 2. Backend Kurulumu

```bash
# Backend klasörüne gidin
cd backend

# Virtual environment oluşturun
python -m venv venv

# Virtual environment'ı aktifleştirin
# Windows PowerShell:
venv\Scripts\activate

# Windows CMD:
venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt
```

### 3. Backend Konfigürasyonu

Backend klasöründe `.env` dosyası oluşturun:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exam_system
JWT_SECRET_KEY=your-secret-key-change-this-in-production-12345
JWT_ACCESS_TOKEN_EXPIRES=86400
FLASK_ENV=development
FLASK_DEBUG=True
```

**Not:** `DATABASE_URL` formatı: `postgresql://kullanici_adi:sifre@localhost:port/veritabani_adi`

### 4. Veritabanı Tablolarını Oluşturma

Backend uygulamasını ilk kez çalıştırdığınızda, tablolar otomatik olarak oluşturulacaktır.

**Manuel migration için:**
```bash
psql -U postgres -d exam_system -f database/migrations/001_initial_schema.sql
```

### 5. Backend'i Başlatma

```bash
cd backend
python app.py
```

Backend başarıyla çalışıyorsa şu mesajı göreceksiniz:
```
 * Running on http://127.0.0.1:5000
```

### 6. İlk Admin Kullanıcısını Oluşturma

```bash
cd backend
python
```

Python shell'de:
```python
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    admin = User(email='admin@university.edu', role='admin', name='Sistem Yöneticisi')
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    print('Admin kullanıcısı oluşturuldu!')
    print('Email: admin@university.edu')
    print('Şifre: admin123')
```

### 7. Frontend Kurulumu

**Yeni bir terminal açın:**

```bash
cd frontend
npm install
```

### 8. Frontend'i Başlatma

```bash
npm start
```

Frontend başarıyla çalışıyorsa tarayıcıda otomatik olarak `http://localhost:3000` açılacaktır.

## 📝 Kullanım

### Test Verileri Oluşturma

Sistemi test etmek için hazır test verileri oluşturabilirsiniz:

```bash
cd backend
venv\Scripts\activate  # Windows
# veya
source venv/bin/activate  # Linux/Mac

python create_comprehensive_test.py
```

Bu script şunları oluşturur:
- **Departmanlar**: Bilgisayar Mühendisliği, Yazılım Mühendisliği
- **Bölüm Başkanı**: Prof. Dr. Ahmet Yılmaz
- **Admin**: Sistem Yöneticisi
- **Öğretim Üyeleri**: 2 adet
- **Öğrenciler**: 10 adet
- **Dersler**: 4 adet
- **Sınavlar**: Her ders için vize ve final
- **Sorular**: Her sınav için 5 soru

**Test Kullanıcı Bilgileri:**
- Admin: `admin@university.edu / admin123`
- Bölüm Başkanı: `bolumbaskani@university.edu / bolumbaskani123`
- Öğretim Üyesi 1: `ogretimuyesi1@university.edu / ogretimuyesi123`
- Öğretim Üyesi 2: `ogretimuyesi2@university.edu / ogretimuyesi123`
- Öğrenciler: `ogrenci1@university.edu` - `ogrenci10@university.edu / ogrenci123`

### İlk Giriş

1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Login sayfasında admin kullanıcısı ile giriş yapın
3. Admin panelinden yeni kullanıcılar, dersler ve atamalar oluşturabilirsiniz

## 🔐 Roller ve Yetkiler

### Admin
- Tüm kullanıcıları yönetme
- Departman oluşturma ve yönetme
- Ders oluşturma ve öğretim üyesine atama
- Öğrenci-ders atama işlemleri
- Sistem genelinde tam yetki

### Bölüm Başkanı
- Tüm dersleri görüntüleme
- Tüm öğrencileri görüntüleme
- Departman istatistiklerini görüntüleme
- Genel sistem istatistikleri

### Öğretim Üyesi
- Kendi derslerini görüntüleme
- Sınav oluşturma ve düzenleme
- Soru bankası yönetimi
- Sınav sonuçlarını görüntüleme
- Otomatik not hesaplama

### Öğrenci
- Aktif sınavları görüntüleme
- Online sınavlara katılma
- Sınav sonuçlarını görüntüleme
- Ders listesini görüntüleme

## 📡 API Dokümantasyonu

### Kimlik Doğrulama Endpoint'leri

- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Kullanıcı çıkışı
- `GET /api/auth/me` - Mevcut kullanıcı bilgileri

### Admin Endpoint'leri

- `GET /api/admin/users` - Tüm kullanıcıları listele
- `POST /api/admin/users` - Yeni kullanıcı oluştur
- `PUT /api/admin/users/<id>` - Kullanıcı güncelle
- `DELETE /api/admin/users/<id>` - Kullanıcı sil
- `GET /api/admin/departments` - Tüm departmanları listele
- `POST /api/admin/departments` - Yeni departman oluştur
- `GET /api/admin/courses` - Tüm dersleri listele
- `POST /api/admin/courses` - Yeni ders oluştur
- `POST /api/admin/assignments` - Öğrenci-ders ataması yap

### Öğretim Üyesi Endpoint'leri

- `GET /api/instructor/courses` - Kendi derslerini listele
- `POST /api/instructor/exams` - Yeni sınav oluştur
- `GET /api/instructor/exams/<id>` - Sınav detaylarını getir
- `POST /api/instructor/questions` - Yeni soru ekle
- `GET /api/instructor/results/<exam_id>` - Sınav sonuçlarını getir

### Öğrenci Endpoint'leri

- `GET /api/student/courses` - Derslerini listele
- `GET /api/student/exams` - Aktif sınavları listele
- `GET /api/student/exams/<id>` - Sınav detaylarını getir
- `POST /api/student/exams/<id>/start` - Sınavı başlat
- `POST /api/student/exams/<id>/submit` - Sınavı gönder
- `GET /api/student/results` - Sınav sonuçlarını listele

### Bölüm Başkanı Endpoint'leri

- `GET /api/department-head/courses` - Tüm dersleri listele
- `GET /api/department-head/students` - Tüm öğrencileri listele
- `GET /api/department-head/statistics` - İstatistikleri getir

## 🗄 Veritabanı Şeması

Sistem aşağıdaki ana tabloları içerir:

- **users** - Kullanıcı bilgileri (admin, bölüm başkanı, öğretim üyesi, öğrenci)
- **departments** - Departman bilgileri
- **courses** - Ders bilgileri
- **student_courses** - Öğrenci-ders ilişkisi
- **exams** - Sınav bilgileri
- **questions** - Soru bilgileri
- **answer_options** - Cevap seçenekleri
- **exam_attempts** - Öğrenci sınav girişleri ve sonuçları

Detaylı şema için `database/migrations/001_initial_schema.sql` dosyasına bakabilirsiniz.

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Bcrypt ile şifre hashleme
- Role-based access control (RBAC)
- CORS koruması
- SQL injection koruması (SQLAlchemy ORM)

## 🐛 Bilinen Sorunlar ve Çözümler

### Veritabanı Bağlantı Hatası
- PostgreSQL servisinin çalıştığından emin olun
- `.env` dosyasındaki `DATABASE_URL` değerini kontrol edin

### Token Süresi Doldu Hatası
- Token süresi 24 saattir
- Süre dolduğunda tekrar giriş yapmanız gerekir

### CORS Hatası
- Backend'in `http://localhost:5000` adresinde çalıştığından emin olun
- Frontend'in `http://localhost:3000` adresinde çalıştığından emin olun

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 👨‍💻 Geliştirici

**Yavuzhan Kurşun**
- Kocaeli Sağlık ve Teknoloji Üniversitesi
- Proje Tarihi: 2024

## 📞 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

---

**Not:** Bu proje eğitim amaçlı geliştirilmiştir ve production ortamında kullanılmadan önce güvenlik kontrolleri yapılmalıdır.
