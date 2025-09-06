# Activity Management System v3

ระบบจัดการกิจกรรมที่ครบถ้วน พร้อมระบบ check-in แบบ public, การยืนยันการเข้าร่วม, และการส่ง serial ชั่วโมงทางอีเมล

## 🎯 ฟีเจอร์หลัก

- **จัดการผู้ใช้**: Admin/Staff/Student roles พร้อม CRUD operations
- **สมัครสมาชิก**: เฉพาะนักศึกษาเท่านั้น
- **Login หลากหลาย**: รองรับ email, username, หรือ student_code
- **กิจกรรม**: สร้าง/แก้/ลบกิจกรรม พร้อม QR code สำหรับ public check-in
- **Public Check-in**: กรอกข้อมูลเข้าร่วมโดยไม่ต้องล็อกอิน
- **ป้องกันซ้ำ**: ระบบป้องกันการกรอกข้อมูลซ้ำต่อกิจกรรมเดียวกัน
- **ยืนยันการเข้าร่วม**: Admin/Staff ยืนยันการเข้าร่วมได้
- **Serial ชั่วโมง**: สร้างและส่ง serial ทางอีเมล
- **ผูก Serial**: นักศึกษาสามารถผูก serial เข้าบัญชีได้
- **Google Mail**: ตั้งค่าและส่งอีเมลผ่าน Google OAuth2

## 🗄️ Database Structure

### ตารางหลัก
- **users**: ข้อมูลผู้ใช้ (Admin/Staff/Student)
- **activities**: ข้อมูลกิจกรรม
- **checkins**: ข้อมูลการกรอกข้อมูล (ยังไม่ยืนยัน)
- **attendance**: ข้อมูลการเข้าร่วม (ยืนยันแล้ว)
- **serials**: โค้ดชั่วโมง
- **mail_settings**: ตั้งค่าอีเมล Google
- **email_queue**: คิวอีเมล
- **notifications**: แจ้งเตือน (optional)

## 🚀 การติดตั้ง

### 1. Database Setup
```bash
# รัน SQL script
mysql -u root -p < back/scripts/setup-app-db-v3-correct.sql
```

### 2. Backend Setup
```bash
cd back
npm install
# คัดลอก env-v3-template.txt เป็น .env และแก้ไขค่า
cp env-v3-template.txt .env
# แก้ไขค่าใน .env
npm run dev
```

### 3. Frontend Setup
```bash
cd front
npm install
# สร้างไฟล์ .env
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=4000
JWT_SECRET=your-secret-key
DB_NAME=app_db
DB_USER=root
DB_PASSWORD=your-password
MAIL_METHOD=GMAIL_API
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก (Student เท่านั้น)
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ข้อมูลผู้ใช้ปัจจุบัน

### Users (Admin)
- `GET /api/users` - รายการผู้ใช้
- `POST /api/users` - สร้างผู้ใช้
- `PUT /api/users/:id` - แก้ไขผู้ใช้
- `DELETE /api/users/:id` - ลบผู้ใช้

### Activities
- `GET /api/activities` - รายการกิจกรรม
- `POST /api/activities` - สร้างกิจกรรม
- `GET /api/activities/:id/qr` - สร้าง QR code

### Public Check-in
- `GET /api/public/activities/:slug` - ข้อมูลกิจกรรมสาธารณะ
- `POST /api/public/activities/:slug/checkin` - กรอกข้อมูลเข้าร่วม

### Attendance
- `GET /api/activities/:id/checkins` - รายการ check-in
- `POST /api/activities/:id/confirm` - ยืนยันการเข้าร่วม

### Serials
- `POST /api/serials/redeem` - ใช้ serial

### Mail Settings (Admin)
- `GET /api/admin/mail/settings` - ตั้งค่าอีเมล
- `PUT /api/admin/mail/settings` - บันทึกการตั้งค่า
- `GET /api/admin/mail/oauth2/authorize` - Google OAuth2
- `POST /api/admin/mail/test` - ทดสอบส่งอีเมล

## 🎨 Frontend Pages

### Guest (ไม่ต้องล็อกอิน)
- `/` - หน้าแรก
- `/a/:slug` - หน้า check-in สาธารณะ

### Student
- `/student` - หน้าหลัก
- `/student/serials` - ใช้ serial

### Staff
- `/staff` - หน้าหลัก
- `/staff/activities` - จัดการกิจกรรม
- `/staff/activities/:id/checkins` - ยืนยันการเข้าร่วม

### Admin
- `/admin` - หน้าหลัก
- `/admin/users` - จัดการผู้ใช้
- `/admin/activities` - จัดการกิจกรรม
- `/admin/settings/mail` - ตั้งค่าอีเมล

## 🔐 Role-based Access

### Admin
- จัดการผู้ใช้ทุกประเภท
- จัดการกิจกรรม
- ตั้งค่าอีเมล Google
- ยืนยันการเข้าร่วม
- ส่ง serial

### Staff
- จัดการกิจกรรม
- ยืนยันการเข้าร่วม
- ส่ง serial (ถ้าได้รับสิทธิ)

### Student
- สมัครสมาชิก
- เข้าระบบ
- ดูกิจกรรม
- ใช้ serial

## 📧 Google Mail Setup

### 1. สร้าง Google Cloud Project
1. เข้า [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง project ใหม่
3. เปิดใช้ Gmail API

### 2. สร้าง OAuth2 Credentials
1. ไปที่ APIs & Services > Credentials
2. สร้าง OAuth client ID
3. ตั้งค่า redirect URI: `http://localhost:4000/api/admin/mail/oauth2/callback`

### 3. ตั้งค่าในระบบ
1. เข้าหน้า Admin > Settings > Mail
2. ใส่ Client ID และ Client Secret
3. กด "Connect Google"
4. อนุญาตการเข้าถึง
5. ทดสอบส่งอีเมล

## 🔄 Workflow

### 1. สร้างกิจกรรม
1. Admin/Staff สร้างกิจกรรม
2. ระบบสร้าง public_slug และ QR code
3. แชร์ QR code หรือลิงก์ public

### 2. Public Check-in
1. ผู้เข้าร่วมสแกน QR หรือเข้าลิงก์
2. กรอกข้อมูล (email/username/student_code)
3. ระบบป้องกันการกรอกซ้ำ

### 3. ยืนยันการเข้าร่วม
1. Admin/Staff ดูรายการ check-in
2. เลือกผู้เข้าร่วมที่ต้องการยืนยัน
3. ระบบสร้าง serial และส่งอีเมล

### 4. ใช้ Serial
1. นักศึกษาได้รับอีเมล serial
2. เข้าระบบและไปหน้า Redeem Serial
3. กรอก serial code
4. ระบบเพิ่มชั่วโมงให้

## 🧪 Testing

### Backend Tests
```bash
cd back
npm test
```

### Frontend Tests
```bash
cd front
npm test
```

### Manual Testing
1. ทดสอบ register/login
2. ทดสอบ public check-in
3. ทดสอบ confirmation flow
4. ทดสอบ email sending
5. ทดสอบ serial redemption

## 🚀 Deployment

### Production Environment
1. เปลี่ยน database เป็น production
2. ตั้งค่า Google OAuth2 redirect URI
3. ใช้ HTTPS
4. ตั้งค่า environment variables
5. ใช้ PM2 หรือ Docker

### Security
- JWT secret ต้องแข็งแกร่ง
- Google credentials ต้องเข้ารหัส
- Rate limiting สำหรับ public endpoints
- Input validation
- SQL injection prevention

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [User Guide](docs/user-guide.md)
- [Admin Guide](docs/admin-guide.md)

## 🤝 Contributing

1. Fork repository
2. สร้าง feature branch
3. Commit changes
4. Push to branch
5. สร้าง Pull Request

## 📄 License

ISC License

## 🆘 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ [Issues](https://github.com/your-repo/issues)
2. สร้าง issue ใหม่
3. ติดต่อทีมพัฒนา

---

**Version**: 3.0.0  
**Last Updated**: 2024  
**Compatibility**: Node.js 16+, MySQL 8.0+
