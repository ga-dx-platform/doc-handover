# Doc Handover — Project Context

## ภาพรวม
Web app สำหรับ GA (General Affairs) ส่ง-รับเอกสารไปหน่วยงานต่างๆ แทนสมุดลงทะเบียนกระดาษ

## Tech Stack
- **Frontend:** HTML single file, Tailwind CSS 3.4, Lucide icons, Chart.js
- **Backend:** Google Apps Script (Web App)
- **Database:** Google Sheets
- **Hosting:** GitHub Pages → https://mickyzek.github.io/doc-handover

## API Endpoint
```
https://script.google.com/macros/s/AKfycbxfR20dqavySzLA6shr-4mAeVXqMxYp59H_VuMbgc_BpSB5wRNl9p4h8Owm1NPBVref/exec
```

### วิธีเรียก API
```javascript
// POST เท่านั้น, body เป็น JSON, Content-Type: text/plain
const res = await fetch(API, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'getUsers', ...params })
});
const data = await res.json();
```

### Actions ที่มี
| action | params | response |
|--------|--------|----------|
| `getUsers` | — | `{ ga: [{name, pin, role}], mgr: [{name, pin, role}] }` |
| `verifyPin` | `{name, pin, role}` | `{ ok: true/false }` |
| `changePin` | `{name, newPin, role}` | `{ ok: true/false }` |
| `getPlans` | `{name, role}` | `[{plan_id, name, date, dept, created_by, status, signer, sign_img, signed_at}]` |
| `createPlan` | `{name, date, dept, created_by, docs:[{no,vendor,desc,amount}]}` | `{ ok: true, plan_id: 'P...' }` |
| `getDocs` | `{plan_id}` | `[{doc_id, plan_id, doc_no, vendor, description, amount, is_received}]` |
| `receipt` | `{plan_id, status, signer, sign_img, signed_at, checked:[{no, received}]}` | `{ ok: true }` |

## Google Sheets Structure
Sheet ชื่อ: `DocHandover`

### GA_Staff
| name | pin | role |
|------|-----|------|
| Poonpeim Sae-pueng | 1234 | ga |
| Sunthorn Bunnag | 1234 | ga |
| Phanchita Jitphiriyaphon | 1234 | ga |
| Patchara Paksa | 1234 | ga |

### Managers
| name | pin | role |
|------|-----|------|
| Sekson Nilertram | 4813 | mgr |

### Plans
`plan_id | name | date | dept | created_by | status | signer | sign_img | signed_at`

- `status`: `ready` / `partial` / `done`
- `plan_id` format: `P` + timestamp เช่น `P1718123456789`

### Documents
`doc_id | plan_id | doc_no | vendor | description | amount | is_received`

- `is_received`: string `"true"` / `"false"`

## App State & Logic

### Users
- GA: เห็นแค่แผนของตัวเอง
- Manager (Sekson): เห็นทุกคน, มี Dashboard overview
- PIN default = `1234` ทุกคน (ยกเว้น Sekson = `4813`)

### Plan Status
- `ready` = รอรับทุกรายการ
- `partial` = รับบางรายการแล้ว
- `done` = รับครบทุกรายการ

### Screens
1. **Loading** → ดึง getUsers
2. **Login** → เลือกชื่อ → tap ไป PIN ทันที
3. **PIN** → verify กับ API
4. **Main (GA):** ส่งเอกสาร | รับเอกสาร | ประวัติ
5. **Main (MGR):** Dashboard | ประวัติ
6. **Receive Detail** → checklist + signature canvas + ยืนยัน
7. **Batch Detail** → read-only รายละเอียด + ลายเซ็น

### Receive Tab
- Strip filter แบบ Airbnb แสดงเฉพาะแผนกที่มีเอกสารรอรับ
- แสดงเฉพาะ status `ready` และ `partial`

### History Tab (GA)
- Dashboard: stat cards + donut chart + bar chart ตามแผนก
- รายการ: filter ตามแผนก + search
- รหัสของฉัน: เปลี่ยน PIN

### History Tab (MGR)
- เห็นทุกคน, filter ตาม GA ได้
- ไม่มีแท็บ "รหัสของฉัน" แยก (อยู่ใน History)

## Files
```
doc-handover/
├── index.html      ← ทุกอย่างอยู่ที่นี่ (HTML + CSS + JS)
├── CLAUDE.md       ← ไฟล์นี้
└── README.md
```

## Known Issues / TODO
- [ ] UX/UI polish (ยังไม่ได้ทำ ทำทีหลัง)
- [ ] sign_img ที่บันทึกใน Sheets เป็น base64 ยาวมาก อาจต้องตัดออกถ้า Sheets limit
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
