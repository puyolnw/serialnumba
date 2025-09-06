# Ngrok Configuration Guide

## วิธีตั้งค่า Ngrok

### 1. สร้างไฟล์ .env.local
สร้างไฟล์ `.env.local` ในโฟลเดอร์ `front/` ด้วยเนื้อหาดังนี้:

```env
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=ระบบจัดการกิจกรรม
VITE_APP_VERSION=1.0.0

# Ngrok Configuration (update this when you get new ngrok URL)
VITE_NGROK_URL=https://your-ngrok-url.ngrok-free.app

# Development Settings
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false
```

### 2. รัน Ngrok
```bash
# รัน ngrok สำหรับ frontend
ngrok http 3000

# หรือรัน ngrok สำหรับ backend
ngrok http 4000
```

### 3. อัปเดต .env.local
เมื่อได้ ngrok URL ใหม่ ให้อัปเดต `VITE_NGROK_URL` ในไฟล์ `.env.local`

### 4. รีสตาร์ท Development Server
```bash
npm run dev
```

## ตัวอย่าง Ngrok URLs
- Frontend: `https://abc123.ngrok-free.app`
- Backend: `https://def456.ngrok-free.app`

## หมายเหตุ
- ไฟล์ `.env.local` จะไม่ถูก commit เข้า git
- Ngrok free plan จะเปลี่ยน URL ทุกครั้งที่ restart
- ใช้ ngrok pro เพื่อได้ static URL
