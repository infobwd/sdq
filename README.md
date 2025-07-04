# ระบบประเมินพฤติกรรมนักเรียน SDQ

## 📋 คำอธิบายโครงการ

ระบบประเมินพฤติกรรมนักเรียน SDQ (Strengths and Difficulties Questionnaire) เป็นแอปพลิเคชันเว็บที่ใช้สำหรับประเมินพฤติกรรม อารมณ์ และทักษะทางสังคมของเด็กและวัยรุ่น โดยใช้แบบประเมินมาตรฐาน SDQ ที่ประกอบด้วย 25 คำถาม ครอบคลุม 5 ด้านหลัก

### ✨ ฟีเจอร์หลัก

- 📱 **Mobile-Responsive Design** - ใช้งานได้ดีบนทุกอุปกรณ์
- 👨‍🎓 **3 ประเภทผู้ประเมิน** - นักเรียน, ครู, ผู้ปกครอง
- 📊 **รายงานแบบเรียลไทม์** - ผลการประเมินรายบุคคลและภาพรวม
- 📈 **กราฟและแผนภูมิ** - แสดงผลด้วย Chart.js
- 🖨️ **พิมพ์รายงาน** - รองรับการพิมพ์แบบฟอร์มและผลการประเมิน
- 💾 **Google Sheets Integration** - จัดเก็บข้อมูลใน Google Sheets
- 🎨 **SweetAlert2** - การแจ้งเตือนที่สวยงาม
- ⚡ **Performance Optimized** - โหลดเร็วและใช้งานลื่น

### 🎯 ด้านการประเมิน SDQ

1. **ด้านอารมณ์** (Emotional Symptoms)
2. **ด้านความประพฤติ** (Conduct Problems)
3. **ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น** (Hyperactivity/Inattention)
4. **ด้านความสัมพันธ์กับเพื่อน** (Peer Relationship Problems)
5. **ด้านสัมพันธภาพทางสังคม** (Prosocial Behaviour - จุดแข็ง)

## 🚀 การติดตั้งและใช้งาน

### ขั้นตอนที่ 1: เตรียม Google Sheets

1. สร้าง Google Sheets ใหม่
2. คัดลอก ID ของ Google Sheets จาก URL
3. เปิด Google Apps Script (script.google.com)
4. สร้างโปรเจคใหม่และวางโค้ดจากไฟล์ `Code.gs`
5. แก้ไข `SPREADSHEET_ID` ในไฟล์ `Code.gs`

```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
```

6. Deploy เป็น Web App และคัดลอก URL

### ขั้นตอนที่ 2: ตั้งค่าไฟล์ Frontend

1. แก้ไขไฟล์ `assets/js/config.js`
2. ใส่ URL ของ Google Apps Script Web App

```javascript
GAS_WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
```

### ขั้นตอนที่ 3: Upload ไฟล์ไปยัง GitHub Pages

1. สร้าง Repository ใหม่บน GitHub
2. Upload ไฟล์ทั้งหมด
3. เปิดใช้งาน GitHub Pages ใน Settings
4. เข้าใช้งานผ่าน URL ที่ GitHub ให้

## 📁 โครงสร้างไฟล์

```
sdq-system/
├── index.html                 # หน้าหลัก
├── assets/
│   ├── css/
│   │   └── style.css         # สไตล์ CSS เพิ่มเติม
│   └── js/
│       ├── config.js         # การตั้งค่าระบบ
│       ├── utils.js          # ฟังก์ชันยูทิลิตี้
│       ├── questions.js      # จัดการคำถาม SDQ
│       ├── students.js       # จัดการข้อมูลนักเรียน
│       ├── assessment.js     # จัดการการประเมิน
│       ├── results.js        # จัดการผลการประเมิน
│       ├── charts.js         # จัดการกราฟและแผนภูมิ
│       └── app.js           # ตัวควบคุมหลัก
├── Code.gs                   # Backend Google Apps Script
└── README.md                # เอกสารประกอบ
```

## 🔧 การกำหนดค่า

### ไฟล์ `config.js`

```javascript
const CONFIG = {
    // URL ของ Google Apps Script
    GAS_WEB_APP_URL: 'YOUR_WEB_APP_URL',
    
    // การตั้งค่า SweetAlert2
    SWAL_OPTIONS: {
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        // ...
    },
    
    // เกณฑ์การแปลผล SDQ
    THRESHOLDS: {
        emotional: { normal: 4, borderline: 5, abnormal: 6 },
        // ...
    }
};
```

### การปรับแต่งธีม

แก้ไขไฟล์ `style.css` เพื่อปรับธีมสี:

```css
.category-emotional {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.category-conduct {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}
```

## 📱 Mobile Optimization

ระบบได้รับการออกแบบมาให้ใช้งานได้ดีบนมือถือ:

- **Responsive Design** - ปรับตัวอัตโนมัติตามขนาดหน้าจอ
- **Touch-Friendly Interface** - ปุ่มและการควบคุมเหมาะสำหรับการสัมผัส
- **Mobile Navigation** - เมนูแบบ dropdown สำหรับมือถือ
- **Progressive Questions** - แสดงความคืบหน้าการตอบคำถาม

## 📊 การรายงานผล

### รายงานรายบุคคล
- ข้อมูลนักเรียนและผู้ประเมิน
- คะแนนรายด้านพร้อมการแปลผล
- กราฟแสดงผลภาพรวม
- สรุปคำตอบทั้ง 25 ข้อ
- ข้อเสนอแนะเพิ่มเติม

### รายงานภาพรวม
- สถิติการประเมินทั้งหมด
- ผลการประเมินแยกตามด้าน (ร้อยละ)
- รายชื่อนักเรียนกลุ่มเสี่ยง/มีปัญหา
- แผนภูมิแท่งแสดงสัดส่วน

## 🛠️ การพัฒนาเพิ่มเติม

### เพิ่มฟีเจอร์ใหม่

1. สร้างไฟล์ JavaScript ใหม่ใน `assets/js/`
2. เพิ่ม script tag ในไฟล์ `index.html`
3. เรียกใช้งานใน `app.js`

### การปรับแต่งการแปลผล

แก้ไขฟังก์ชัน `interpretScores()` ในไฟล์ `Code.gs`:

```javascript
function interpretScores(scores) {
    const thresholds = {
        emotional: { normal: 4, borderline: 5 },
        // ปรับเกณฑ์ตามความเหมาะสม
    };
    // ...
}
```

### การเพิ่มภาษา

1. เพิ่มไฟล์ `assets/js/i18n.js`
2. สร้างอ็อบเจกต์แปล
3. อัปเดตข้อความในระบบ

## 🔐 ความปลอดภัย

- ข้อมูลจัดเก็บใน Google Sheets ที่ปลอดภัย
- ไม่มีการจัดเก็บข้อมูลส่วนบุคคลในเบราว์เซอร์
- การเข้าถึงข้อมูลผ่าน Google Apps Script
- รองรับ HTTPS

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

**1. ไม่สามารถโหลดข้อมูลนักเรียนได้**
- ตรวจสอบ `SPREADSHEET_ID` ในไฟล์ `Code.gs`
- ตรวจสอบสิทธิ์การเข้าถึง Google Sheets
- ตรวจสอบ URL ของ Web App ในไฟล์ `config.js`

**2. การบันทึกการประเมินไม่สำเร็จ**
- ตรวจสอบ Console ใน Developer Tools
- ตรวจสอบการตั้งค่า CORS ใน Google Apps Script
- ตรวจสอบการ Deploy Web App เป็น "Anyone"

**3. หน้าเว็บโหลดไม่เสร็จ**
- ตรวจสอบ Network ใน Developer Tools
- ตรวจสอบไฟล์ JavaScript ทั้งหมดโหลดสำเร็จ
- ลองรีเฟรชแคช (Ctrl+F5)

### การ Debug

เปิด Developer Tools (F12) และตรวจสอบ:
- **Console** - ข้อผิดพลาด JavaScript
- **Network** - การเรียก API
- **Application** - Local Storage

## 📞 การสนับสนุน

หากพบปัญหาการใช้งาน:

1. ตรวจสอบเอกสารนี้ก่อน
2. ตรวจสอบ Console logs
3. ตรวจสอบการตั้งค่า Google Apps Script
4. ติดต่อผู้พัฒนาระบบ

## 📄 ลิขสิทธิ์

โครงการนี้ได้รับการพัฒนาโดย:
- **Design & Original Development**: Kruthee
- **Enhancement & Mobile Optimization**: AI Assistant
- **SDQ Questionnaire**: Based on original SDQ by Prof. Robert Goodman

## 🔄 การอัปเดต

### Version 2.0 (Current)
- ✅ Mobile-responsive design
- ✅ SweetAlert2 integration
- ✅ Enhanced error handling
- ✅ Progressive Web App features
- ✅ Improved accessibility

### Version 1.0
- ✅ Basic SDQ assessment
- ✅ Google Sheets integration
- ✅ Desktop interface
- ✅ PDF export

---

**สำหรับข้อมูลเพิ่มเติมเกี่ยวกับ SDQ**: [Official SDQ Website](https://www.sdqinfo.org/)
