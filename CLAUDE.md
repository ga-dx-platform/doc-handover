# Doc Handover — Project Context

## ภาพรวม
Web app สำหรับ GA (General Affairs) ส่ง-รับเอกสารไปหน่วยงานต่างๆ แทนสมุดลงทะเบียนกระดาษ

## Tech Stack
- **Frontend:** HTML single file, Tailwind CSS 3.4, Lucide icons, Chart.js
- **Backend:** Supabase (PostgreSQL + REST API)
- **Database:** Supabase
- **Hosting:** GitHub Pages → https://mickyzek.github.io/doc-handover

## Supabase Config
```
URL:  https://npxbjktnxqycmifyrwrb.supabase.co
ANON KEY: sb_publishable_LbcwYbfDXmBrRJ6lFe9eHQ_mK3oNyL1
```

### API Adapter (index.html)
API ทั้งหมดเรียกผ่านฟังก์ชัน `api(action, params)` ใน index.html ซึ่ง map ไปยัง Supabase SDK โดยตรง (ไม่มี backend server แยก)

### Actions ที่มี
| action | params | response |
|--------|--------|----------|
| `getUsers` | — | `{ ga: [{name, role}], mgr: [{name, role}] }` |
| `verifyPin` | `{name, pin, role}` | `{ ok: true/false }` |
| `changePin` | `{name, newPin, role}` | `{ ok: true/false }` |
| `getPlans` | `{name, role}` | `[{plan_id, name, date, dept, created_by, status, signer, signed_at}]` |
| `getSign` | `{plan_id}` | `string (base64 JPEG)` |
| `createPlan` | `{name, date, dept, created_by, docs:[{no,vendor,desc,amount}]}` | `{ ok: true, plan_id: 'P...' }` |
| `getDocs` | `{plan_id}` | `[{doc_id, plan_id, doc_no, vendor, description, amount, is_received}]` |
| `receipt` | `{plan_id, status, signer, sign_img, signed_at, checked:[{no, received}]}` | `{ ok: true }` |
| `deletePlan` | `{plan_id}` | `{ ok: true }` |
| `addUser` | `{name, role, pin}` | `{ ok: true }` |

## Supabase Tables

### ga_staff
| name | pin | role |
|------|-----|------|
| Poonpeim Sae-pueng | sha256(123456) | ga |
| Sunthorn Bunnag | sha256(123456) | ga |
| Phanchita Jitphiriyaphon | sha256(123456) | ga |
| Patchara Paksa | sha256(123456) | ga |

### managers
| name | pin | role |
|------|-----|------|
| Sekson Nilertram | sha256(123456) | mgr |

- PIN เก็บเป็น SHA-256 hash, auto-upgrade จาก plain text เมื่อ login ครั้งแรก
- **PIN default = `123456` ทุกคน**

### plans
`p_id | name | date | dept | created_by | status | signer | sign_img | signed_at`

- `status`: `ready` / `partial` / `done`
- `p_id` format: `P` + timestamp เช่น `P1718123456789`
- `sign_img` ไม่ถูก fetch ใน getPlans (เรียกแยกผ่าน getSign เพื่อ performance)

### documents
`doc_id | plan_id | doc_no | vendor | description | amount | is_received`

- `is_received`: boolean

## App State & Logic

### Users
- GA: เห็นแค่แผนของตัวเอง
- Manager (Sekson): เห็นทุกคน, มี Dashboard overview

### Plan Status
- `ready` = รอรับทุกรายการ
- `partial` = รับบางรายการแล้ว
- `done` = รับครบทุกรายการ

### Screens
1. **Loading** → ดึง getUsers
2. **Login** → เลือกชื่อ → tap ไป PIN ทันที
3. **PIN** → verify กับ API (6 หลัก, lock 5 ครั้ง/60 วินาที)
4. **Main (GA):** ส่งเอกสาร | รับเอกสาร | ประวัติ
5. **Main (MGR):** Dashboard | ประวัติ
6. **Receive Detail** → checklist + signature canvas + ยืนยัน
7. **Batch Detail** → read-only รายละเอียด + ลายเซ็น

### Receive Tab
- Strip filter แบบ Airbnb แสดงเฉพาะแผนกที่มีเอกสารรอรับ
- แสดงเฉพาะ status `ready` และ `partial`

### History Tab (GA)
- Dashboard: stat cards + donut chart + bar chart ตามแผนก
- รายการ: filter ตามแผนก + search (debounce 250ms)
- รหัสของฉัน: เปลี่ยน PIN

### History Tab (MGR)
- เห็นทุกคน, filter ตาม GA ได้
- จัดการสมาชิก: เพิ่ม/ลบ GA และ Manager

## Files
```
doc-handover/
├── index.html      ← ทุกอย่างอยู่ที่นี่ (HTML + CSS + JS)
├── migration.gs    ← script สำหรับ migrate ข้อมูลจาก Google Sheets → Supabase (ใช้ครั้งเดียว)
├── CLAUDE.md       ← ไฟล์นี้
└── README.md
```

## Known Issues / TODO
- [ ] UX/UI polish (ยังไม่ได้ทำ ทำทีหลัง)
- [ ] ยังไม่มี pagination สำหรับ plan list จำนวนมาก
- [ ] Offline / error state ยังไม่ครบ

## Design System (จาก Canva)
```css
brand: #185FA5        /* primary blue */
brand-light: #E8F0FA
success: #0F6E56      /* green */
success-light: #E6F5F0
warn: #D97706         /* amber */
warn-light: #FEF3C7
surface: #F7F7F5      /* background */
card: #FFFFFF
```
Font: Noto Sans Thai
Icons: Lucide 0.263.0
Charts: Chart.js 4.4.0

## Deploy
```bash
git add .
git commit -m "update"
git push origin main
# GitHub Pages auto-deploy ใน 1-2 นาที
```
