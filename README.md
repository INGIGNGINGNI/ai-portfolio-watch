# คอร์ส AI เฝ้าพอร์ต — efin.finance

หน้าเว็บคอร์ส 1 หน้า เขียนด้วย HTML / CSS / JS ล้วน ใช้ design system เดียวกับ RoboLab (ดู [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md))
ไม่มี framework ไม่ต้อง build ไม่ต้อง `npm install` อัปโหลดทั้งโฟลเดอร์ขึ้น hosting ไหนก็ได้ หรือดับเบิลคลิก `index.html` เปิดดูในเครื่อง

```
├── index.html             หน้าคอร์ส
└── assets/
    ├── css/tokens.css     design tokens (สี ฟอนต์ ระยะ radius shadow gradient) — ใช้ร่วมกับเว็บ efin อื่นได้
    ├── css/style.css      คอมโพเนนต์ + responsive (โหลดหลัง tokens.css เสมอ)
    ├── js/main.js         navbar, เมนูมือถือ, animation ตอนเลื่อน, จุดลอยพื้นหลัง hero, ปุ่มขึ้นบน, ลิงก์ที่ยังไม่มีปลายทาง, dataLayer event, จัดตำแหน่งตารางไอคอน hero มือถือ
    ├── images/            รูปจาก RoboLab (โลโก้ efin, รูปผู้สอนแบบไดคัต, texture) + แผนที่
    ├── logos/             โลโก้เครื่องมือใต้ hero
    ├── icons/lucide/      ไอคอน Lucide 8 ตัวในตาราง hero (SVG)
    └── icon.svg           (ไม่ได้ใช้แล้ว หน้าใช้ favicon ของ efin.finance)
```

ดูในเครื่องผ่าน server (แนะนำ):

```bash
python3 -m http.server 4317
```

## หมายเหตุสำหรับทีม Dev

- **ปุ่ม "จองที่นั่ง" (5 จุด):** navbar, hero, กล่องราคา, ส่วนปิดท้าย และแถบจองล่างจอมือถือ ชี้ไป `https://www.efin.finance/th/efincourse/ai-portfolio-watch-dec2026/payment`
- **ลิงก์ที่ยังไม่มีปลายทาง:** เมนู "ดูย้อนหลัง" (2 จุด ใน navbar และเมนูมือถือ) ยังเป็น `href="#" data-link="pending"` กดแล้วไม่ไปไหน
  ปลายทางคือ `/learning` และต้องแสดงเฉพาะคนที่ซื้อแล้วและล็อกอินอยู่ (ฝั่งเซิร์ฟเวอร์ทำ) เมื่อพร้อมให้ใส่ URL ใน `href` และลบ `data-link="pending"` ออก
- **GTM:** container `GTM-WSRTCKZF` และ `GTM-PSM4BRWX` อยู่บนสุดของ `<head>` (+ noscript ใต้ `<body>`) โหลดเฉพาะเมื่อโดเมนเป็น `efin.finance` เพื่อไม่ให้ยอดจาก localhost / Vercel preview ปนใน GA4
  ถ้าหน้าถูกวางใน template ที่โหลด GTM 2 ตัวนี้อยู่แล้ว ให้ลบทั้ง 2 บล็อกออก ห้ามติดซ้ำ
- **dataLayer** (`assets/js/main.js` ส่วน "วัดผล"): `view_item` ตอนเปิดหน้า และ `select_item` + `button_location` (`nav` / `hero` / `price` / `closing` / `mobile_bar` จาก `data-book`) ตอนกดปุ่มจอง ไม่มีข้อมูลส่วนตัวของผู้ซื้อ
  ครบ 10 ที่นั่งแล้วต้องแก้ `courseItem` เป็น `item_variant: 'ราคาปกติ'`, `price: 9000`
- **แท็กปุ่ม `data-gtm`** 12 ชื่อตามเอกสาร (`cta_aipw_*`) ลิงก์ในเมนูมือถือใช้ชื่อเดียวกับเมนูบน (รวม 18 จุด) ต้องตั้ง trigger ใน GTM ให้ส่ง event `cta_click` + `button_name` เอง สคริปต์ในหน้าไม่ได้ส่ง
- ข้อความทั้งหมดแก้ใน `index.html` โดยตรง
- ฟอนต์ (Noto Sans Thai, Inter, Material Symbols Rounded) โหลดจาก Google Fonts · ไอคอนโหลดเฉพาะ 45 ตัวที่ใช้ (`icon_names` ใน `<head>`) ใส่ไอคอนใหม่ต้องเพิ่มชื่อในรายการนั้นด้วย เรียงตามตัวอักษร
- ไอคอนในตาราง hero ใช้ Lucide (`assets/icons/lucide/*.svg` จาก lucide-static 1.70.0 · ISC) ระบายสีด้วย CSS mask · เพิ่มไอคอน: ดาวน์โหลดไฟล์จาก lucide.dev ใส่โฟลเดอร์นี้ แล้วเพิ่มคลาส `.hg-ico--ชื่อ` ใน style.css
- Animation: ใส่ `data-anim="fade-up | fade-left | fade-right"` ที่ element ไหนก็ได้
- ข้อมูล SEO (meta, Open Graph, JSON-LD Course + FAQPage) อยู่ใน `<head>` / ต้น `<body>` ของ `index.html`
- โลโก้เครื่องมือ: n8n จาก repo ทางการ `n8n-io/n8n` (โลโก้ชุดปัจจุบันบน n8n.io), Telegram / ChatGPT (OpenAI) / Claude จาก Simple Icons ใส่สีตามแบรนด์
