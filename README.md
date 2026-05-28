# MC Production Planner

เว็บกลางสำหรับวางแผน MC Production ให้หลายเครื่องใช้งานร่วมกัน

## Deploy ด้วย GitHub + Render

1. สร้าง repository ใน GitHub เช่น `mc-production-planner`
2. push ไฟล์ทั้งหมดในโฟลเดอร์ `render-app` เข้า repository
3. เข้า Render Dashboard แล้วเลือก `New` > `Blueprint`
4. เลือก GitHub repository นี้
5. Render จะอ่าน `render.yaml` แล้วสร้าง Web Service และ PostgreSQL ให้อัตโนมัติ

## การเก็บข้อมูล

- ถ้าอยู่บน Render และมี `DATABASE_URL` ระบบจะบันทึกข้อมูลลง PostgreSQL
- ถ้ารันในเครื่องโดยไม่มี `DATABASE_URL` ระบบจะ fallback ลงไฟล์ `app-data.json`
- Browser ยังเก็บ localStorage ไว้เป็น cache เผื่อเน็ต/เซิร์ฟเวอร์หลุดชั่วคราว

## รันในเครื่อง

```bash
npm install
npm start
```

เปิด:

```text
http://localhost:3000
```
