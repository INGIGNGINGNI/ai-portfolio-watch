# คอร์ส AI เฝ้าพอร์ต — efin.finance

หน้าเว็บคอร์ส 1 หน้า เขียนด้วย HTML / CSS / JS ล้วน ใช้ design system เดียวกับ RoboLab (ดู [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md))
ไม่มี framework ไม่ต้อง build ไม่ต้อง `npm install` อัปโหลดทั้งโฟลเดอร์ขึ้น hosting ไหนก็ได้ หรือดับเบิลคลิก `index.html` เปิดดูในเครื่อง

```
├── index.html             หน้าคอร์ส
└── assets/
    ├── css/tokens.css     design tokens (สี ฟอนต์ ระยะ radius shadow gradient) — ใช้ร่วมกับเว็บ efin อื่นได้
    ├── css/style.css      คอมโพเนนต์ + responsive (โหลดหลัง tokens.css เสมอ)
    ├── js/main.js         navbar, เมนูมือถือ, animation ตอนเลื่อน, จุดลอยพื้นหลัง hero, ปุ่มขึ้นบน, countdown, ลิงก์ที่ยังไม่มีปลายทาง
    ├── images/            รูปจาก RoboLab (โลโก้ efin, รูปผู้สอนแบบไดคัต, texture) + แผนที่
    ├── logos/             โลโก้เครื่องมือใต้ hero
    └── icon.svg
```

ดูในเครื่องผ่าน server (แนะนำ):

```bash
python3 -m http.server 4317
```

## หมายเหตุสำหรับทีม Dev

- **ลิงก์ที่ยังไม่มีปลายทาง:** ปุ่ม "จองที่นั่ง" (6 จุด) และเมนู "ดูย้อนหลัง" (2 จุด ใน navbar และเมนูมือถือ) ตอนนี้เป็น `href="#" data-link="pending"` กดแล้วไม่ไปไหน
  เมื่อมีหน้าจริง ให้ค้นหา `data-link="pending"` ใน `index.html` แล้วใส่ URL ใน `href` และลบ `data-link="pending"` ออก
- ข้อความทั้งหมดแก้ใน `index.html` โดยตรง
- ฟอนต์ (Noto Sans Thai, Inter, Material Symbols Rounded) โหลดจาก Google Fonts
- Animation: ใส่ `data-anim="fade-up | fade-left | fade-right"` ที่ element ไหนก็ได้
- Countdown: `<div class="cd-row" data-countdown="2026-12-14T10:00:00+07:00">`
- ข้อมูล SEO (meta, Open Graph, JSON-LD Course + FAQPage) อยู่ใน `<head>` / ต้น `<body>` ของ `index.html`
- โลโก้เครื่องมือ: n8n จาก repo ทางการ `n8n-io/n8n` (โลโก้ชุดปัจจุบันบน n8n.io), Settrade จาก settrade.com (ตัดบรรทัด www ออก), Telegram / ChatGPT (OpenAI) / Claude จาก Simple Icons ใส่สีตามแบรนด์
