from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse # PDF göndermek için
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import os
from fpdf import FPDF # PDF kütüphanesi

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

model = YOLO("best.pt")
KNOWN_WIDTH, FOCAL_LENGTH = 12.0, 800

# Son analizi PDF için hafızada tutalım (Basit bir yöntem)
last_analysis = {"distance": 0, "confidence": 0, "img_path": "last_frame.jpg"}

@app.post("/analyze")
async def analyze_mission(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model.predict(img, conf=0.4)
    distance, confidence = 0.0, 0.0
    
    if len(results[0].boxes) > 0:
        res_img = results[0].plot()
        box = results[0].boxes[0]
        x1, _, x2, _ = box.xyxy[0].cpu().numpy()
        distance = (KNOWN_WIDTH * FOCAL_LENGTH) / float(x2 - x1)
        confidence = float(box.conf[0])
        cv2.imwrite("last_frame.jpg", res_img) # Rapor için kaydet
    else:
        res_img = img

    _, buffer = cv2.imencode('.jpg', res_img)
    img_str = base64.b64encode(buffer).decode('utf-8')

    last_analysis["distance"] = round(distance, 2)
    last_analysis["confidence"] = round(confidence, 2)

    return {
        "image": img_str,
        "distance": float(round(distance, 2)),
        "confidence": float(round(confidence, 2)),
        "status": "TARGET_LOCKED" if distance > 0 else "SEARCHING"
    }

@app.get("/generate-report")
async def generate_report():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(40, 10, "MISSION CONTROL - FINAL REPORT")
    pdf.ln(20)
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Target Distance: {last_analysis['distance']}m", ln=True)
    pdf.cell(200, 10, txt=f"Confidence Score: %{int(last_analysis['confidence']*100)}", ln=True)
    
    if os.path.exists("last_frame.jpg"):
        pdf.image("last_frame.jpg", x=10, y=50, w=180)
    
    pdf.output("report.pdf")
    return FileResponse("report.pdf", filename="mission_report.pdf")