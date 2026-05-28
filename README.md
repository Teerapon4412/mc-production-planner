# MC Production Planner

เว็บกลางสำหรับวางแผน MC Production ให้หลายเครื่องใช้งานร่วมกัน

## Deploy ด้วย GitHub + Render แบบเริ่มต้น $0

1. สร้าง repository ใน GitHub เช่น `mc-production-planner`
2. push ไฟล์ทั้งหมดในโฟลเดอร์ `render-app` เข้า repository
3. สร้าง Supabase project แบบ Free
4. ใน Supabase SQL Editor ให้รัน:

```sql
create table if not exists planner_kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
```

5. ไปที่ Supabase Project Settings > API แล้ว copy:
   - Project URL
   - service_role key
6. เข้า Render Dashboard แล้วเลือก `New` > `Blueprint`
7. เลือก GitHub repository นี้
8. Render จะอ่าน `render.yaml` แล้วสร้าง Web Service แบบ Free
9. ตอน Render ถามค่า Environment Variables ให้ใส่:
   - `SUPABASE_URL` = Project URL จาก Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key จาก Supabase

## การเก็บข้อมูล

- ถ้าอยู่บน Render และมี `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` ระบบจะบันทึกข้อมูลลง Supabase
- ถ้าอยู่บน Render และมี `DATABASE_URL` ระบบยังรองรับ PostgreSQL โดยตรง
- ถ้ารันในเครื่องโดยไม่มี database env ระบบจะ fallback ลงไฟล์ `app-data.json`
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
