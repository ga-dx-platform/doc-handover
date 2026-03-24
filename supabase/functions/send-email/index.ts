import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'GA Doc-Handover <noreply@doc-handover.app>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ===== Types =====
type NotifyType = 'plan_created' | 'plan_received' | 'plan_left'

interface NotifyPayload {
  type: NotifyType
  plan_id: string
  plan_name: string
  dept: string
  created_by: string
  date?: string
  doc_count?: number
  signer?: string
  signed_at?: string
  left_location?: string
  left_with?: string
}

// ===== Resend =====
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  return res.json()
}

async function sendToList(emails: string[], subject: string, html: string) {
  const results = await Promise.allSettled(emails.map(e => sendEmail(e, subject, html)))
  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length > 0) console.error('Some emails failed:', failed)
}

// ===== HTML Templates =====
const base = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#F7F7F5; font-family:'Noto Sans Thai',Arial,sans-serif; }
  .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .header { background:#185FA5; padding:24px 28px; }
  .header h1 { margin:0; color:#fff; font-size:18px; font-weight:700; }
  .header p { margin:4px 0 0; color:#b3d0f0; font-size:13px; }
  .body { padding:28px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:600; }
  .badge-blue { background:#E8F0FA; color:#185FA5; }
  .badge-green { background:#E6F5F0; color:#0F6E56; }
  .badge-amber { background:#FEF3C7; color:#D97706; }
  .info-table { width:100%; border-collapse:collapse; margin:16px 0; }
  .info-table td { padding:8px 0; border-bottom:1px solid #F0F0EE; font-size:14px; }
  .info-table td:first-child { color:#888; width:110px; }
  .info-table td:last-child { color:#1a1a1a; font-weight:500; }
  .btn { display:inline-block; margin-top:20px; padding:12px 24px; background:#185FA5; color:#fff; border-radius:10px; text-decoration:none; font-size:14px; font-weight:600; }
  .footer { padding:16px 28px; background:#F7F7F5; text-align:center; font-size:11px; color:#aaa; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>📄 GA Doc-Handover</h1>
    <p>${title}</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">ระบบจัดการการส่งมอบเอกสาร GA · อีเมลนี้สร้างโดยระบบอัตโนมัติ</div>
</div>
</body>
</html>`

function tplPlanCreated(d: NotifyPayload) {
  const dateStr = d.date ? new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
  return base('แจ้งเตือน: มีแผนงานใหม่', `
    <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px">แผนงานใหม่รอดำเนินการ</p>
    <p style="font-size:13px;color:#666;margin:0 0 20px"><span class="badge badge-blue">รอรับ</span></p>
    <table class="info-table">
      <tr><td>ชื่อแผนงาน</td><td>${esc(d.plan_name)}</td></tr>
      <tr><td>แผนก</td><td>${esc(d.dept)}</td></tr>
      <tr><td>ผู้จัดส่ง (GA)</td><td>${esc(d.created_by)}</td></tr>
      <tr><td>วันที่</td><td>${dateStr}</td></tr>
      <tr><td>จำนวนเอกสาร</td><td>${d.doc_count ?? '-'} รายการ</td></tr>
    </table>
    <p style="font-size:13px;color:#555;margin:16px 0 0">กรุณาเตรียมรับเอกสารที่ระบุ</p>
  `)
}

function tplPlanReceived(d: NotifyPayload) {
  return base('แจ้งเตือน: เอกสารได้รับครบแล้ว', `
    <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px">เอกสารได้รับครบทุกรายการ</p>
    <p style="font-size:13px;color:#666;margin:0 0 20px"><span class="badge badge-green">ครบแล้ว</span></p>
    <table class="info-table">
      <tr><td>ชื่อแผนงาน</td><td>${esc(d.plan_name)}</td></tr>
      <tr><td>แผนก</td><td>${esc(d.dept)}</td></tr>
      <tr><td>ผู้รับเอกสาร</td><td>${esc(d.signer ?? '-')}</td></tr>
      <tr><td>เวลาที่รับ</td><td>${esc(d.signed_at ?? '-')}</td></tr>
    </table>
    <p style="font-size:13px;color:#555;margin:16px 0 0">แผนงานนี้เสร็จสมบูรณ์แล้ว ✓</p>
  `)
}

function tplPlanLeft(d: NotifyPayload) {
  return base('แจ้งเตือน: ฝากเอกสารไว้แล้ว', `
    <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 4px">GA ฝากเอกสารไว้รอรับ</p>
    <p style="font-size:13px;color:#666;margin:0 0 20px"><span class="badge badge-amber">ฝากไว้</span></p>
    <table class="info-table">
      <tr><td>ชื่อแผนงาน</td><td>${esc(d.plan_name)}</td></tr>
      <tr><td>แผนก</td><td>${esc(d.dept)}</td></tr>
      <tr><td>ผู้จัดส่ง (GA)</td><td>${esc(d.created_by)}</td></tr>
      <tr><td>สถานที่ฝาก</td><td>${esc(d.left_location ?? '-')}</td></tr>
      <tr><td>ฝากกับ</td><td>${esc(d.left_with ?? '-')}</td></tr>
    </table>
    <p style="font-size:13px;color:#555;margin:16px 0 0">ผู้รับสามารถยืนยันการรับด้วย Token ที่ได้รับจาก GA</p>
  `)
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ===== Main Handler =====
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  if (!RESEND_API_KEY) return json({ ok: false, error: 'RESEND_API_KEY not set' }, 500)

  let payload: NotifyPayload
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const { type } = payload
  if (!type) return json({ ok: false, error: 'Missing type' }, 400)

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    if (type === 'plan_created') {
      // แจ้ง Manager ทุกคน
      const { data: mgrs } = await db.from('managers').select('email').not('email', 'is', null)
      const emails = (mgrs ?? []).map((r: { email: string }) => r.email).filter(Boolean)
      if (emails.length > 0) {
        await sendToList(emails, `[GA] แผนงานใหม่: ${payload.plan_name}`, tplPlanCreated(payload))
      }
    } else if (type === 'plan_received') {
      // แจ้ง GA creator
      const { data: ga } = await db.from('ga_staff').select('email').eq('name', payload.created_by).maybeSingle()
      if (ga?.email) {
        await sendEmail(ga.email, `[GA] เอกสารได้รับครบ: ${payload.plan_name}`, tplPlanReceived(payload))
      }
    } else if (type === 'plan_left') {
      // แจ้ง Manager ทุกคน
      const { data: mgrs } = await db.from('managers').select('email').not('email', 'is', null)
      const emails = (mgrs ?? []).map((r: { email: string }) => r.email).filter(Boolean)
      if (emails.length > 0) {
        await sendToList(emails, `[GA] ฝากเอกสารแล้ว: ${payload.plan_name}`, tplPlanLeft(payload))
      }
    } else {
      return json({ ok: false, error: `Unknown type: ${type}` }, 400)
    }

    return json({ ok: true })
  } catch (err) {
    console.error('send-email error:', err)
    return json({ ok: false, error: String(err) }, 500)
  }
})
