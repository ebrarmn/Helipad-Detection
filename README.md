# Helikopter Pisti Algılama ve Mesafe Tahmini Sistemi

**yolo26s** mimarisiyle görüntüler üzerinden anlık heliped tespiti ve matematiksel formüllerle mesafe ölçümü yapan modüler bir bilgisayarlı görü sistemidir. Otonom navigasyondan akıllı şehirlere kadar nesne konumlandırma gerektiren tüm kamera tabanlı platformlar için ölçeklenebilir bir yazılım mimarisi sunar.

### Teknolojiler
* **AI/Vision:** YOLO26s, OpenCV
* **Backend:** FastAPI (Python 3.12), Uvicorn
* **Frontend:** React.js, Tailwind CSS, Recharts (Real-time Analytics)
* **Reporting:** FPDF2

### Öne Çıkan Özellikler
* **Real-Time Inference:** Video akışı üzerinden düşük gecikmeli (low-latency) nesne tespiti.
* **Mathematical Distance Estimation:** Pinhole Kamera Modeli prensibiyle fiziksel mesafe kestirimi.
* **Descent Profile Graph:** `Recharts` entegrasyonu ile hedefe yaklaşma profilinin canlı takibi.
* **Vision Filters:** Operasyonel simülasyon için Termal ve Gece Görüşü modları.
* **Mission Reporting:** Analiz verilerini ve son kareyi içeren otomatik PDF rapor üretimi.

### Matematiksel Model
Sistem, mesafe kestirimi için aşağıdaki optik geometri formülünü kullanmaktadır:

$$D = \frac{W \cdot f}{P}$$

*(W: Nesnenin Gerçek Genişliği, f: Kameranın Odak Uzaklığı, P: Nesnenin Piksel Genişliği)*

---

### Kurulum ve Çalıştırma

#### 1. Backend (Sunucu) Kurulumu
Backend dizinine gidin, gerekli kütüphaneleri yükleyin ve sunucuyu başlatın:
```bash
cd backend
pip install -r requirements.txt
python3.12 -m uvicorn main:app --reload
```
#### 2. Frontend (Arayüz) Kurulumu

```bash
cd frontend
npm install
npm install recharts
npm start
```
