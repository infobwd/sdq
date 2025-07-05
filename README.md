# ระบบประเมินพฤติกรรมนักเรียน SDQ - GitHub Version

ระบบประเมินแบบจุดแข็งและจุดอ่อน (Strengths and Difficulties Questionnaire) เวอร์ชัน GitHub ที่รองรับมือถือและใช้ SweetAlert2

## 🌟 คุณสมบัติ

- ✅ **Mobile-First Design** - ออกแบบให้เหมาะกับมือถือเป็นหลัก
- ✅ **SweetAlert2** - การแสดงข้อความแจ้งเตือนที่สวยงาม
- ✅ **JSONP Integration** - เชื่อมต่อกับ Google Apps Script ผ่าน JSONP
- ✅ **Responsive UI** - ปรับตัวให้เหมาะกับทุกขนาดหน้าจอ
- ✅ **Touch-Friendly** - สัมผัสง่ายบนอุปกรณ์ touch
- ✅ **Compatible** - ใช้งานร่วมกับระบบ Google Apps Script เดิมได้

## 📱 การรองรับอุปกรณ์

- 📱 Mobile (iOS, Android)
- 💻 Tablet
- 🖥️ Desktop
- 🌐 ทุก Web Browser สมัยใหม่

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: ตั้งค่า Google Apps Script

1. เปิด [Google Apps Script](https://script.google.com)
2. สร้างโปรเจกต์ใหม่
3. แทนที่โค้ดใน `Code.gs` ด้วยโค้ดจากไฟล์ `Code.gs` ในนี้
4. ตั้งค่า `SPREADSHEET_ID` ในตัวแปร configuration
5. Deploy เป็น Web App:
   - คลิก **Deploy** > **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - คัดลอก URL ที่ได้

### ขั้นตอนที่ 2: ตั้งค่า GitHub Pages

1. Fork หรือ clone repository นี้
2. แก้ไขไฟล์ `script.js` บรรทัดที่ 4:
   ```javascript
   const GAS_WEB_APP_URL = 'YOUR_GAS_WEB_APP_URL_HERE';
   ```
   เปลี่ยนเป็น URL ที่ได้จาก Google Apps Script

3. Push ไปยัง GitHub repository
4. เปิดใช้งาน GitHub Pages:
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Save

### ขั้นตอนที่ 3: การใช้งาน

1. เข้าถึงระบบผ่าน GitHub Pages URL
2. นำเข้าข้อมูลนักเรียนจากไฟล์ Excel หรือเพิ่มทีละคน
3. เริ่มใช้งานระบบประเมิน

## 📋 โครงสร้างไฟล์

```
├── index.html          # หน้าหลักของระบบ (Mobile-Optimized)
├── script.js           # JavaScript สำหรับ GitHub version
├── Code.gs             # Google Apps Script (Backend)
├── README.md           # คู่มือนี้
└── docs/               # เอกสารประกอบ (ถ้ามี)
```

## 🔧 การตั้งค่า

### ไฟล์ Excel สำหรับนำเข้าข้อมูลนักเรียน

สร้างไฟล์ Excel ที่มีคอลัมน์:
- `ชื่อ-นามสกุล`: ชื่อเต็มของนักเรียน
- `ชั้นเรียน`: ชั้นเรียนของนักเรียน (เช่น ม.1/1, ป.6/2)

### Google Sheets Structure

ระบบจะสร้างชีตอัตโนมัติ:
- **นักเรียน**: เก็บข้อมูลนักเรียน
- **ผลการประเมิน**: เก็บผลการประเมิน SDQ

## 📊 การใช้งาน

### การประเมิน
1. **นักเรียนประเมินตนเอง**: นักเรียนทำแบบประเมินเอง
2. **ครูประเมิน**: ครูประเมินพฤติกรรมนักเรียน
3. **ผู้ปกครองประเมิน**: ผู้ปกครองประเมินบุตรหลาน

### การดูผล
- **ผลรายบุคคล**: ดูผลการประเมินของนักเรียนแต่ละคน
- **สรุปภาพรวม**: ดูสถิติภาพรวมของทั้งโรงเรียน

### การพิมพ์
- พิมพ์แบบฟอร์มว่าง
- พิมพ์ผลการประเมิน
- พิมพ์รายงานสรุป

## 🎨 UI/UX Features

### Mobile-First Design
- ปุ่มขนาดใหญ่เหมาะกับการสัมผัส
- เมนูแบบ tab ที่เลื่อนได้บนมือถือ
- ฟอร์มที่จัดเรียงเหมาะกับหน้าจอเล็ก

### SweetAlert2 Integration
```javascript
// ตัวอย่างการใช้งาน
showSuccess('บันทึกเรียบร้อย!');
showError('เกิดข้อผิดพลาด');
showConfirm('ยืนยันการลบข้อมูล?');
```

### Responsive Components
- Cards ที่ปรับขนาดตามหน้าจอ
- ตารางที่เลื่อนได้แนวนอน
- กราฟที่ปรับขนาดอัตโนมัติ

## 🔗 API Integration

### JSONP Communication
```javascript
// การเรียกใช้ JSONP
makeJSONPRequest('getStudents')
  .then(response => {
    console.log('Students:', response);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Available Actions
- `getStudents` - ดึงรายชื่อนักเรียน
- `saveAssessment` - บันทึกการประเมิน
- `getAssessmentResults` - ดึงผลการประเมิน
- `getSummaryResults` - ดึงข้อมูลสรุป
- `importStudents` - นำเข้าข้อมูลนักเรียน
- `addStudentManual` - เพิ่มนักเรียนทีละคน

## 📈 การแปลผล SDQ

### เกณฑ์การแปลผล
- **ปกติ**: พฤติกรรมอยู่ในเกณฑ์ปกติ
- **เสี่ยง**: มีความเสี่ยงต่อการเกิดปัญหา
- **มีปัญหา**: พบปัญหาที่ควรได้รับการช่วยเหลือ

### 5 ด้านการประเมิน
1. **ด้านอารมณ์** (Emotional Symptoms)
2. **ด้านความประพฤติ** (Conduct Problems)
3. **ด้านสมาธิสั้น/อยู่ไม่นิ่ง** (Hyperactivity/Inattention)
4. **ด้านความสัมพันธ์กับเพื่อน** (Peer Relationship Problems)
5. **ด้านสัมพันธภาพทางสังคม** (Prosocial Behaviour - จุดแข็ง)

## 🛠️ Troubleshooting

### ปัญหาที่พบบ่อย

**1. ไม่สามารถเชื่อมต่อ Google Apps Script**
```javascript
// ตรวจสอบ URL ใน script.js
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/.../exec';
```

**2. การ Deploy Google Apps Script**
- ตรวจสอบว่า Deploy เป็น Web App แล้ว
- ตั้งค่า "Who has access" เป็น "Anyone"
- ตรวจสอบ SPREADSHEET_ID ถูกต้อง

**3. ปัญหาการแสดงผลบนมือถือ**
- ล้าง cache บน browser
- ตรวจสอบ viewport meta tag
- ทดสอบบน browser อื่น

**4. ข้อมูลไม่บันทึก**
- ตรวจสอบ permission ของ Google Sheets
- ตรวจสอบ console log สำหรับ error
- ตรวจสอบการตั้งค่า CORS

## 📞 การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ console log ใน browser
2. ตรวจสอบ execution log ใน Google Apps Script
3. อ่านคู่มือนี้อีกครั้ง
4. สร้าง issue ใน GitHub repository

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ

## 🙏 Credits

- **Design**: Mobile-First Responsive Design
- **Libraries**: Tailwind CSS, SweetAlert2, Chart.js
- **Backend**: Google Apps Script
- **Original System**: โรงเรียนบ้านวังด้ง SDQ System

---

**หมายเหตุ**: ระบบนี้เป็นเวอร์ชัน GitHub ที่พัฒนาขึ้นเพื่อให้ใช้งานง่ายขึ้นและรองรับมือถือ แต่ยังคงความเข้ากันได้กับระบบ Google Apps Script เดิม
