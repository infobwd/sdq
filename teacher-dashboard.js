// Teacher Dashboard JavaScript - Part 1: Configuration & Global Variables

// ============================
// CONFIGURATION
// ============================
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx-rfOnx5yh_XT0Kqx4cBkiCtQKZccRfdChhLrUYQIG7HPDfW8i6GwI4mdHBB5E9H87aA/exec';

// ============================
// GLOBAL VARIABLES
// ============================
let currentUser = null;              // ข้อมูลผู้ใช้ปัจจุบัน
let currentSession = null;           // Session ID
let allStudents = [];               // รายชื่อนักเรียนทั้งหมด
let filteredStudents = [];          // นักเรียนที่กรองแล้ว
let currentClass = null;            // ชั้นเรียนที่เลือก
let assessmentAnswers = [];         // คำตอบการประเมิน
let currentAssessmentStudent = null; // นักเรียนที่กำลังประเมิน

// ============================
// SDQ QUESTIONS DATA
// ============================
const SDQ_QUESTIONS = [
    "มีความพิจารณาใส่ใจความรู้สึกของผู้อื่น",
    "กระสับกระส่าย ไม่สามารถอยู่นิ่งๆ ได้นาน",
    "บ่นบอกว่าปวดหัว ปวดท้อง หรือไม่สบายบ่อยๆ",
    "เต็มใจแบ่งปันของกับเด็กอื่นๆ (ขนม ของเล่น ดินสอ เป็นต้น)",
    "มักจะโกรธหรือดุร้ายมาก",
    "ค่อนข้างจะอยู่คนเดียว มักจะเล่นคนเดียวหรือเข้าหาผู้อื่นน้อย",
    "โดยทั่วไปจะเชื่อฟัง มักจะทำตามที่ผู้ใหญ่ขอให้ทำ",
    "มีความกังวลหรือกลุ้มใจหลายเรื่อง",
    "พร้อมที่จะช่วยเหลือผู้อื่นที่เจ็บ อารมณ์เสีย หรือไม่สบายใจ",
    "คอยอยู่ไม่นิ่ง มีแต่ไม่หยุดเคลื่อนไหว หรือดิ้นรนอยู่เรื่อยๆ",
    "มีเพื่อนสนิทอย่างน้อยหนึ่งคน",
    "มักจะทะเลาะหรือผลักดันเด็กอื่นๆ",
    "มักจะไม่มีความสุข ท้อแท้ หรือร้องไห้",
    "โดยทั่วไปเด็กคนอื่นๆ จะชอบเขา",
    "เสียสมาธิง่าย วอกแวกง่าย",
    "ประหม่าหรือยึดติดกับผู้ใหญ่เมื่ออยู่ในสถานการณ์ใหม่ๆ",
    "มีความเมตตากรุณาต่อเด็กที่เล็กกว่า",
    "มักจะพูดปด หรือใส่ร้ายผู้อื่น",
    "เด็กคนอื่นๆ มักจะกลั่นแกล้งหรือรังแกเขา",
    "มักจะอาสาช่วยเหลือผู้อื่น (พ่อแม่ ครู เด็กคนอื่นๆ)",
    "คิดก่อนทำ",
    "เอาของของผู้อื่นจากบ้าน โรงเรียน หรือที่อื่นๆ",
    "เข้ากับผู้ใหญ่ได้ดีกว่าเด็กคนอื่นๆ",
    "มีความกลัวหลายๆ อย่าง ตกใจง่าย",
    "ทำกิจกรรมต่างๆ ให้สำเร็จ สามารถจดจ่อความสนใจได้นาน"
];

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * แสดง/ซ่อน Loading Overlay
 * @param {boolean} show - แสดงหรือซ่อน
 * @param {string} message - ข้อความที่จะแสดง
 */
function showLoading(show = true, message = "กำลังประมวลผล...") {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    if (text) text.textContent = message;
    if (overlay) overlay.classList.toggle('hidden', !show);
}

/**
 * แสดงข้อความสำเร็จ
 * @param {string} message - ข้อความ
 * @param {string} title - หัวข้อ
 */
function showSuccess(message, title = "สำเร็จ!") {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981'
    });
}

/**
 * แสดงข้อความข้อผิดพลาด
 * @param {string} message - ข้อความ
 * @param {string} title - หัวข้อ
 */
function showError(message, title = "เกิดข้อผิดพลาด!") {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444'
    });
}

/**
 * แสดงข้อความยืนยัน
 * @param {string} message - ข้อความ
 * @param {string} title - หัวข้อ
 */
function showConfirm(message, title = "ยืนยันการดำเนินการ") {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280'
    });
}

/**
 * ส่งคำขอแบบ JSONP
 * @param {string} action - Action ที่ต้องการ
 * @param {object} data - ข้อมูลที่จะส่ง
 * @returns {Promise} - Promise ที่จะคืนผลลัพธ์
 */
function makeJSONPRequest(action, data = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        
        // สร้างฟังก์ชัน callback
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        // สร้าง URL พร้อม parameters
        const params = new URLSearchParams({
            action: action,
            callback: callbackName,
            ...data
        });
        
        // สร้าง script tag
        const script = document.createElement('script');
        script.src = `${GAS_WEB_APP_URL}?${params.toString()}`;
        
        // จัดการ error
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
        };
        
        document.body.appendChild(script);
        
        // Timeout หลัง 30 วินาที
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Request timeout'));
            }
        }, 30000);
    });
}
// Teacher Dashboard JavaScript - Part 2: Authentication & Data Loading

// ============================
// AUTHENTICATION FUNCTIONS
// ============================

/**
 * ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน
 * @returns {boolean} - true ถ้ามี session, false ถ้าไม่มี
 */
function getCurrentUser() {
    const userData = localStorage.getItem('sdq_user') || sessionStorage.getItem('sdq_user');
    const sessionId = localStorage.getItem('sdq_session') || sessionStorage.getItem('sdq_session');
    
    if (userData && sessionId) {
        currentUser = JSON.parse(userData);
        currentSession = sessionId;
        return true;
    }
    return false;
}

/**
 * เปลี่ยนเส้นทางไปหน้า login
 */
function redirectToLogin() {
    showError('กรุณาเข้าสู่ระบบใหม่').then(() => {
        window.location.href = 'login.html';
    });
}

// ============================
// DATE FORMATTING FUNCTIONS
// ============================

/**
 * จัดรูปแบบวันที่เป็นภาษาไทย
 * @param {string|Date} dateString - วันที่ที่ต้องการจัดรูปแบบ
 * @returns {string} - วันที่ในรูปแบบภาษาไทย
 */
function formatDate(dateString) {
    if (!dateString) return 'ไม่ทราบ';
    
    try {
        let date;
        
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string' && dateString.includes('กรกฎาคม')) {
            // แปลงเดือนภาษาไทยเป็นภาษาอังกฤษ
            const thaiToEng = convertThaiDateToEnglish(dateString);
            date = new Date(thaiToEng);
        } else if (typeof dateString === 'string') {
            date = new Date(dateString);
            
            // ถ้าแปลงไม่ได้ ลอง parse รูปแบบอื่น
            if (isNaN(date.getTime())) {
                const datePatterns = [
                    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
                    /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
                    /(\d{4})-(\d{1,2})-(\d{1,2})/    // YYYY-MM-DD
                ];
                
                for (let pattern of datePatterns) {
                    const match = dateString.match(pattern);
                    if (match) {
                        if (pattern === datePatterns[2]) { // YYYY-MM-DD
                            date = new Date(match[1], match[2] - 1, match[3]);
                        } else { // DD/MM/YYYY or DD-MM-YYYY
                            date = new Date(match[3], match[2] - 1, match[1]);
                        }
                        break;
                    }
                }
            }
        } else if (typeof dateString === 'number') {
            date = new Date(dateString);
        } else {
            console.warn('Unknown date format:', dateString);
            return 'รูปแบบวันที่ไม่รู้จัก';
        }
        
        // ตรวจสอบว่าเป็น valid date หรือไม่
        if (!date || isNaN(date.getTime())) {
            console.warn('Invalid date after parsing:', dateString);
            return 'วันที่ไม่ถูกต้อง';
        }
        
        // แปลงเป็นรูปแบบภาษาไทย
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
    } catch (error) {
        console.error('Error formatting date:', error, 'Input:', dateString);
        return 'ข้อผิดพลาดในการแปลงวันที่';
    }
}

/**
 * แปลงวันที่ภาษาไทยเป็นภาษาอังกฤษ
 * @param {string} thaiDateString - วันที่ภาษาไทย
 * @returns {string|null} - วันที่ภาษาอังกฤษ หรือ null ถ้าแปลงไม่ได้
 */
function convertThaiDateToEnglish(thaiDateString) {
    try {
        const thaiMonths = {
            'มกราคม': 'January', 'กุมภาพันธ์': 'February', 'มีนาคม': 'March',
            'เมษายน': 'April', 'พฤษภาคม': 'May', 'มิถุนายน': 'June',
            'กรกฎาคม': 'July', 'สิงหาคม': 'August', 'กันยายน': 'September',
            'ตุลาคม': 'October', 'พฤศจิกายน': 'November', 'ธันวาคม': 'December'
        };
        
        const parts = thaiDateString.trim().split(' ');
        if (parts.length !== 3) {
            throw new Error('Invalid Thai date format');
        }
        
        const day = parseInt(parts[0]);
        const thaiMonth = parts[1];
        const buddhistYear = parseInt(parts[2]);
        
        const englishMonth = thaiMonths[thaiMonth];
        if (!englishMonth) {
            throw new Error('Unknown Thai month: ' + thaiMonth);
        }
        
        // แปลงปีพุทธศักราชเป็นคริสต์ศักราช
        const christianYear = buddhistYear - 543;
        
        const englishDateString = `${englishMonth} ${day}, ${christianYear}`;
        console.log('Converted Thai date:', thaiDateString, '->', englishDateString);
        return englishDateString;
        
    } catch (error) {
        console.error('Error converting Thai date:', error, 'Input:', thaiDateString);
        return null;
    }
}

// ============================
// DATA LOADING FUNCTIONS
// ============================

/**
 * โหลดข้อมูลนักเรียน
 */
async function loadStudents() {
    try {
        showLoading(true, "กำลังโหลดข้อมูลนักเรียน...");
        
        const response = await makeJSONPRequest('getStudentsForUser', {
            sessionId: currentSession,
            academicYear: new Date().getFullYear() + 543
        });
        
        if (response && response.success) {
            allStudents = response.students || [];
            console.log(`Loaded ${allStudents.length} students from server`);
            
            // อัปเดต Class Selector
            updateClassSelector();
            
            // ตั้งค่า default class ถ้ายังไม่มี
            if (!currentClass && allStudents.length > 0) {
                const firstClass = allStudents[0].class;
                if (firstClass) {
                    currentClass = firstClass;
                    document.getElementById('class-selector').value = firstClass;
                }
            }
            
            // กรองนักเรียนตามชั้นที่เลือก
            filterStudentsByClass();
            
            // โหลดข้อมูลการประเมิน
            await loadIndividualAssessments();
            
            // อัปเดต UI
            updateStatistics();
            populateStudentSelect();
            displayStudents();
            
        } else {
            if (response && response.message === 'Session หมดอายุ') {
                redirectToLogin();
                return;
            }
            allStudents = [];
            filteredStudents = [];
            updateStatistics();
        }
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถโหลดข้อมูลนักเรียนได้: ${error.message}`);
        console.error('Load students error:', error);
    }
}

/**
 * โหลดข้อมูลการประเมินรายบุคคล
 */
async function loadIndividualAssessments() {
    try {
        console.log('Loading individual assessments for filtered students...');
        
        if (filteredStudents.length === 0) {
            console.log('No students to load assessments for');
            return;
        }
        
        // ล้างข้อมูลการประเมินเดิม
        filteredStudents.forEach(student => {
            delete student.latestAssessment;
        });
        
        // โหลดการประเมินสำหรับนักเรียนที่กรองแล้ว
        const assessmentPromises = filteredStudents.map(async (student) => {
            try {
                console.log(`Loading assessment for student: ${student.name} (${student.id})`);
                
                const response = await makeJSONPRequest('getAssessmentResultsForUser', {
                    sessionId: currentSession,
                    studentId: student.id,
                    evaluatorType: 'all'
                });
                
                if (response && response.success && response.data) {
                    student.latestAssessment = response.data;
                    console.log(`✅ Assessment loaded for ${student.name}`);
                } else {
                    console.log(`❌ No assessment found for ${student.name}`);
                    student.latestAssessment = null;
                }
            } catch (error) {
                console.error(`Error loading assessment for student ${student.id}:`, error);
                student.latestAssessment = null;
            }
        });
        
        // รอให้โหลดเสร็จทั้งหมด
        await Promise.all(assessmentPromises);
        
        console.log('✅ Individual assessments loaded for all filtered students');
        
        // อัปเดต allStudents ด้วยข้อมูลใหม่
        filteredStudents.forEach(filteredStudent => {
            const studentInAll = allStudents.find(s => s.id === filteredStudent.id);
            if (studentInAll) {
                studentInAll.latestAssessment = filteredStudent.latestAssessment;
            }
        });
        
    } catch (error) {
        console.error('Error loading individual assessments:', error);
    }
}
// Teacher Dashboard JavaScript - Part 3: UI Update & Helper Functions

// ============================
// UI UPDATE FUNCTIONS
// ============================

/**
 * อัปเดต Class Selector dropdown
 */
function updateClassSelector() {
    const selector = document.getElementById('class-selector');
    const classes = [...new Set(allStudents.map(s => s.class).filter(c => c))];
    
    selector.innerHTML = '<option value="">ทุกชั้นเรียน</option>';
    classes.sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
    
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        selector.appendChild(option);
    });
    
    // ตั้งค่า default เป็นชั้นแรกที่ได้รับมอบหมาย
    if (currentUser.assignedClasses && currentUser.assignedClasses.length > 0) {
        const firstClass = currentUser.assignedClasses[0];
        if (classes.includes(firstClass)) {
            selector.value = firstClass;
            currentClass = firstClass;
        }
    }
}

/**
 * กรองนักเรียนตามชั้นเรียนที่เลือก
 */
function filterStudentsByClass() {
    console.log(`Filtering students by class: ${currentClass || 'ทุกชั้น'}`);
    
    if (!currentClass) {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => student.class === currentClass);
    }
    
    console.log(`Filtered ${filteredStudents.length} students from ${allStudents.length} total`);
    displayStudents();
}

/**
 * แสดงรายการนักเรียน
 */
function displayStudents() {
    const container = document.getElementById('students-grid');
    const emptyState = document.getElementById('students-empty');
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    
    let studentsToShow = filteredStudents;
    
    // กรองตามคำค้นหา
    if (searchTerm) {
        studentsToShow = filteredStudents.filter(student => 
            student.name.toLowerCase().includes(searchTerm) ||
            (student.class && student.class.toLowerCase().includes(searchTerm))
        );
    }
    
    // แสดง empty state ถ้าไม่มีนักเรียน
    if (studentsToShow.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // สร้าง student cards
    container.innerHTML = studentsToShow.map(student => createStudentCard(student)).join('');
}

/**
 * สร้าง Student Card HTML
 * @param {object} student - ข้อมูลนักเรียน
 * @returns {string} - HTML string
 */
function createStudentCard(student) {
    const assessment = getLatestAssessment(student.id);
    const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
    const statusInfo = getStatusInfo(status);
    
    return `
        <div class="student-card ${status}" data-student-id="${student.id}">
            <div class="p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-user-graduate text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${highlightSearchTerm(student.name)}</h4>
                            <p class="text-sm text-gray-600">${student.class || 'ไม่มีข้อมูลชั้น'}</p>
                        </div>
                    </div>
                    <span class="status-badge status-${status}">
                        <i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}
                    </span>
                </div>
                
                ${assessment ? `
                    <div class="mb-3 text-sm">
                        <p class="text-gray-600">ประเมินล่าสุด: ${formatDate(assessment.timestamp)}</p>
                        <p class="text-gray-600">คะแนนรวม: ${assessment.scores.totalDifficulties || 0}/40</p>
                        <p class="text-gray-600">ประเมินโดย: ${assessment.evaluatorName || 'ไม่ระบุ'}</p>
                        <div class="mt-2">
                            <div class="text-xs">
                                <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                                    อารมณ์: ${assessment.scores.emotional || 0}
                                </span>
                                <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1">
                                    ความประพฤติ: ${assessment.scores.conduct || 0}
                                </span>
                                <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-1">
                                    สมาธิ: ${assessment.scores.hyperactivity || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="mb-3 text-sm text-gray-500">
                        <p>ยังไม่ได้ประเมิน</p>
                        <p class="text-xs">กรุณาทำการประเมินเพื่อดูรายละเอียด</p>
                    </div>
                `}
                
                <div class="flex gap-2">
                    <button onclick="assessStudent('${student.id}')" class="btn-success flex-1">
                        <i class="fas fa-clipboard-check mr-1"></i>
                        ${assessment ? 'ประเมินใหม่' : 'ประเมิน'}
                    </button>
                    ${assessment ? `
                        <button onclick="viewResults('${student.id}')" class="btn-secondary">
                            <i class="fas fa-eye"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * อัปเดตสถิติ
 */
function updateStatistics() {
    const totalStudents = filteredStudents.length;
    
    let assessedStudents = 0;
    let riskStudents = 0;
    let problemStudents = 0;
    
    console.log(`Calculating statistics for ${totalStudents} students...`);
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        
        if (assessment && assessment.scores) {
            assessedStudents++;
            const status = getAssessmentStatus(assessment);
            
            if (status === 'risk') {
                riskStudents++;
            } else if (status === 'problem') {
                problemStudents++;
            }
        }
    });
    
    // อัปเดต UI
    document.getElementById('total-students').textContent = totalStudents;
    document.getElementById('assessed-students').textContent = assessedStudents;
    document.getElementById('risk-students').textContent = riskStudents;
    document.getElementById('problem-students').textContent = problemStudents;
    
    console.log(`Statistics updated: Total=${totalStudents}, Assessed=${assessedStudents}, Risk=${riskStudents}, Problem=${problemStudents}`);
}

/**
 * เติมข้อมูลใน Student Select dropdown
 */
function populateStudentSelect() {
    const select = document.getElementById('student-select');
    select.innerHTML = '<option value="">-- เลือกนักเรียนที่ต้องการประเมิน --</option>';
    
    filteredStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.class})`;
        select.appendChild(option);
    });
}

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * ดึงข้อมูลการประเมินล่าสุดของนักเรียน
 * @param {string} studentId - รหัสนักเรียน
 * @returns {object|null} - ข้อมูลการประเมิน หรือ null
 */
function getLatestAssessment(studentId) {
    // หาจาก filteredStudents ก่อน
    const filteredStudent = filteredStudents.find(s => s.id === studentId);
    if (filteredStudent && filteredStudent.latestAssessment) {
        return filteredStudent.latestAssessment;
    }
    
    // หาจาก allStudents เป็นทางเลือกสำรอง
    const student = allStudents.find(s => s.id === studentId);
    return student ? student.latestAssessment : null;
}

/**
 * กำหนดสถานะการประเมินตามคะแนน
 * @param {object} assessment - ข้อมูลการประเมิน
 * @returns {string} - สถานะ ('normal', 'risk', 'problem', 'not-assessed')
 */
function getAssessmentStatus(assessment) {
    if (!assessment) return 'not-assessed';
    
    const totalScore = assessment.scores.totalDifficulties;
    if (totalScore <= 11) return 'normal';
    if (totalScore <= 15) return 'risk';
    return 'problem';
}

/**
 * ดึงข้อมูลสถานะเพื่อแสดงผล
 * @param {string} status - สถานะ
 * @returns {object} - ข้อมูลสำหรับแสดงผล
 */
function getStatusInfo(status) {
    const statusMap = {
        'normal': { label: 'ปกติ', icon: 'fas fa-check-circle' },
        'risk': { label: 'เสี่ยง', icon: 'fas fa-exclamation-triangle' },
        'problem': { label: 'มีปัญหา', icon: 'fas fa-exclamation-circle' },
        'not-assessed': { label: 'ยังไม่ประเมิน', icon: 'fas fa-clock' }
    };
    return statusMap[status] || statusMap['not-assessed'];
}

/**
 * กำหนดสถานะจากการแปลผล
 * @param {string} interpretation - ผลการแปลผล
 * @returns {string} - สถานะ
 */
function getInterpretationStatus(interpretation) {
    if (interpretation === 'ปกติ' || interpretation === 'จุดแข็ง') return 'normal';
    if (interpretation === 'เสี่ยง') return 'risk';
    if (interpretation === 'มีปัญหา' || interpretation === 'ควรปรับปรุง') return 'problem';
    return 'normal';
}

/**
 * ไฮไลต์คำค้นหาในข้อความ
 * @param {string} text - ข้อความ
 * @returns {string} - ข้อความที่มีการไฮไลต์
 */
function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('student-search').value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}
// Teacher Dashboard JavaScript - Part 4: Assessment Functions

// ============================
// ASSESSMENT FUNCTIONS
// ============================

/**
 * แสดงคำถามการประเมิน SDQ
 * @param {string} studentId - รหัสนักเรียน
 * @returns {boolean} - true ถ้าแสดงสำเร็จ
 */
function showAssessmentQuestions(studentId) {
    console.log('Showing assessment questions for student:', studentId);
    
    const questionsSection = document.getElementById('assessment-questions');
    const questionsContainer = document.getElementById('questions-container');
    
    if (!questionsSection || !questionsContainer) {
        console.error('Assessment elements not found');
        return false;
    }
    
    // แสดงส่วนคำถาม
    questionsSection.classList.remove('hidden');
    
    // ล้างคำถามเดิม
    questionsContainer.innerHTML = '';
    
    // สร้างคำถามใหม่
    createAssessmentQuestions();
    
    // รีเซ็ตคำตอบ
    assessmentAnswers = new Array(25).fill(undefined);
    currentAssessmentStudent = studentId;
    
    // อัปเดต progress
    updateAssessmentProgress();
    
    // เลื่อนไปยังส่วนคำถาม
    setTimeout(() => {
        questionsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
    
    console.log('Assessment questions displayed successfully');
    return true;
}

/**
 * สร้างคำถามการประเมิน SDQ
 */
function createAssessmentQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) {
        console.error('Questions container not found');
        return;
    }
    
    // ล้างเนื้อหาเดิม
    container.innerHTML = '';
    
    // เพิ่ม header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200';
    headerDiv.innerHTML = `
        <h4 class="text-lg font-semibold text-blue-800 mb-2">
            <i class="fas fa-clipboard-list mr-2"></i>
            แบบประเมินพฤติกรรม SDQ (Strengths and Difficulties Questionnaire)
        </h4>
        <p class="text-blue-700 text-sm">
            กรุณาเลือกคำตอบที่ตรงกับพฤติกรรมของนักเรียนคนนี้ในช่วง 6 เดือนที่ผ่านมา
        </p>
        <div class="mt-3 flex items-center text-blue-600 text-sm">
            <i class="fas fa-info-circle mr-2"></i>
            <span>มีคำถามทั้งหมด 25 ข้อ กรุณาตอบให้ครบทุกข้อ</span>
        </div>
    `;
    container.appendChild(headerDiv);
    
    // สร้างคำถาม
    SDQ_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item mb-4';
        questionDiv.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                    ${index + 1}
                </div>
                <div class="flex-1">
                    <p class="text-gray-800 font-medium mb-4 leading-relaxed">${question}</p>
                    <div class="radio-group">
                        <div class="radio-item" data-question="${index}" data-value="0">
                            <input type="radio" name="q${index}" value="0" class="hidden">
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                    <div class="w-2 h-2 bg-gray-400 rounded-full hidden radio-dot"></div>
                                </div>
                                <span class="text-sm font-medium">ไม่จริง</span>
                            </div>
                        </div>
                        <div class="radio-item" data-question="${index}" data-value="1">
                            <input type="radio" name="q${index}" value="1" class="hidden">
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                    <div class="w-2 h-2 bg-blue-500 rounded-full hidden radio-dot"></div>
                                </div>
                                <span class="text-sm font-medium">ค่อนข้างจริง</span>
                            </div>
                        </div>
                        <div class="radio-item" data-question="${index}" data-value="2">
                            <input type="radio" name="q${index}" value="2" class="hidden">
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                    <div class="w-2 h-2 bg-green-500 rounded-full hidden radio-dot"></div>
                                </div>
                                <span class="text-sm font-medium">จริงแน่นอน</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(questionDiv);
    });
    
    // เพิ่ม footer
    const footerDiv = document.createElement('div');
    footerDiv.className = 'mt-6 p-4 bg-gray-50 rounded-lg border';
    footerDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
                <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
                หลังจากตอบครบทุกข้อ กรุณากดปุ่ม "บันทึกการประเมิน"
            </div>
            <button id="save-assessment-btn" class="quick-action-btn" disabled>
                <i class="fas fa-save mr-2"></i>บันทึกการประเมิน
            </button>
        </div>
    `;
    container.appendChild(footerDiv);
    
    // เพิ่ม event listeners สำหรับ radio buttons
    addRadioEventListeners();
    
    console.log('Assessment questions created:', SDQ_QUESTIONS.length);
}

/**
 * เพิ่ม Event Listeners สำหรับ Radio Buttons
 */
function addRadioEventListeners() {
    document.querySelectorAll('.radio-item').forEach(item => {
        item.addEventListener('click', function() {
            const question = this.dataset.question;
            const value = this.dataset.value;
            
            console.log(`Question ${parseInt(question) + 1} answered:`, value);
            
            // ลบการเลือกจากตัวเลือกอื่นในคำถามเดียวกัน
            document.querySelectorAll(`[data-question="${question}"]`).forEach(option => {
                option.classList.remove('selected');
                option.querySelector('input').checked = false;
                option.querySelector('.radio-dot').classList.add('hidden');
                option.querySelector('.w-4').classList.remove('border-blue-500', 'border-green-500');
                option.querySelector('.w-4').classList.add('border-gray-300');
            });
            
            // เลือกตัวเลือกนี้
            this.classList.add('selected');
            this.querySelector('input').checked = true;
            this.querySelector('.radio-dot').classList.remove('hidden');
            this.querySelector('.w-4').classList.remove('border-gray-300');
            
            // เปลี่ยนสีขอบตามค่า
            if (value === '0') {
                this.querySelector('.w-4').classList.add('border-gray-400');
            } else if (value === '1') {
                this.querySelector('.w-4').classList.add('border-blue-500');
            } else {
                this.querySelector('.w-4').classList.add('border-green-500');
            }
            
            // อัปเดต answers array
            assessmentAnswers[parseInt(question)] = parseInt(value);
            
            // อัปเดต progress
            updateAssessmentProgress();
            
            // เปิดใช้งานปุ่มบันทึกเมื่อตอบครบ
            checkAssessmentCompletion();
        });
    });
}

/**
 * ตรวจสอบความสมบูรณ์ของการประเมิน
 */
function checkAssessmentCompletion() {
    const answeredQuestions = assessmentAnswers.filter(answer => answer !== undefined).length;
    const saveButton = document.getElementById('save-assessment-btn');
    
    if (saveButton) {
        if (answeredQuestions === 25) {
            saveButton.disabled = false;
            saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
            saveButton.classList.add('hover:shadow-lg');
        } else {
            saveButton.disabled = true;
            saveButton.classList.add('opacity-50', 'cursor-not-allowed');
            saveButton.classList.remove('hover:shadow-lg');
        }
    }
}

/**
 * อัปเดตความคืบหน้าการประเมิน
 */
function updateAssessmentProgress() {
    const answeredQuestions = assessmentAnswers.filter(answer => answer !== undefined).length;
    const progress = (answeredQuestions / 25) * 100;
    
    let progressBar = document.getElementById('assessment-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'assessment-progress';
        progressBar.className = 'mb-6 p-4 bg-white rounded-lg border shadow-sm';
        progressBar.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="text-sm font-medium text-gray-700">ความคืบหน้าการประเมิน</span>
                <span id="progress-text" class="text-sm font-bold text-blue-600">0/25 ข้อ</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div id="progress-fill" class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
            </div>
            <div class="mt-2 text-xs text-gray-500 text-center" id="progress-message">
                กรุณาตอบคำถามให้ครบทุกข้อ
            </div>
        `;
        
        const questionsSection = document.getElementById('assessment-questions');
        const questionsContainer = document.getElementById('questions-container');
        if (questionsSection && questionsContainer) {
            questionsSection.insertBefore(progressBar, questionsContainer);
        }
    }
    
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const progressMessage = document.getElementById('progress-message');
    
    if (progressText) {
        progressText.textContent = `${answeredQuestions}/25 ข้อ`;
    }
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
        
        if (progress === 100) {
            progressFill.className = 'bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out';
            if (progressMessage) {
                progressMessage.textContent = '✅ ตอบครบทุกข้อแล้ว พร้อมบันทึกการประเมิน';
                progressMessage.className = 'mt-2 text-xs text-green-600 text-center font-medium';
            }
        } else if (progress >= 80) {
            progressFill.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out';
            if (progressMessage) {
                progressMessage.textContent = `เหลืออีก ${25 - answeredQuestions} ข้อ`;
                progressMessage.className = 'mt-2 text-xs text-orange-600 text-center';
            }
        } else {
            progressFill.className = 'bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out';
            if (progressMessage) {
                progressMessage.textContent = `เหลืออีก ${25 - answeredQuestions} ข้อ`;
                progressMessage.className = 'mt-2 text-xs text-gray-500 text-center';
            }
        }
    }
}

/**
 * บันทึกการประเมิน
 */
async function saveAssessment() {
    if (!currentAssessmentStudent) {
        showError('กรุณาเลือกนักเรียนที่ต้องการประเมิน');
        return;
    }
    
    if (assessmentAnswers.length !== 25 || assessmentAnswers.some(answer => answer === undefined)) {
        showError('กรุณาตอบคำถามให้ครบทุกข้อ');
        return;
    }
    
    const result = await showConfirm('คุณต้องการบันทึกผลการประเมินนี้หรือไม่?');
    if (!result.isConfirmed) return;
    
    try {
        showLoading(true, "กำลังบันทึกการประเมิน...");
        
        const student = allStudents.find(s => s.id === currentAssessmentStudent);
        const assessmentData = {
            studentId: student.id,
            studentName: student.name,
            studentClass: student.class,
            evaluatorType: 'teacher',
            evaluatorName: currentUser.fullName,
            relation: 'ครูประจำชั้น',
            answers: assessmentAnswers,
            sessionId: currentSession
        };
        
        const response = await makeJSONPRequest('saveAssessment', {
            data: JSON.stringify(assessmentData)
        });
        
        showLoading(false);
        
        if (response && response.success) {
            await showSuccess('บันทึกการประเมินเรียบร้อยแล้ว!');
            
            // แสดงผลการประเมิน
            showAssessmentResults(response);
            
            // รีเซ็ตฟอร์ม
            clearAssessmentForm();
            
            // โหลดข้อมูลใหม่
            await loadStudents();
            
        } else {
            showError(response ? response.message : 'ไม่สามารถบันทึกการประเมินได้');
        }
        
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถบันทึกการประเมินได้: ${error.message}`);
        console.error('Save assessment error:', error);
    }
}

/**
 * ล้างฟอร์มการประเมิน
 */
function clearAssessmentForm() {
    document.getElementById('student-select').value = '';
    document.getElementById('assessment-questions').classList.add('hidden');
    assessmentAnswers = [];
    currentAssessmentStudent = null;
    
    // ล้างการเลือกทั้งหมด
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('selected');
        const input = item.querySelector('input');
        if (input) input.checked = false;
    });
    
    // ลบ progress bar
    const progressBar = document.getElementById('assessment-progress');
    if (progressBar) {
        progressBar.remove();
    }
}
// Teacher Dashboard JavaScript - Part 5: Modal Functions & Tab Management

// ============================
// MODAL FUNCTIONS
// ============================

/**
 * แสดงผลการประเมิน SDQ ใน Modal
 * @param {object} results - ผลการประเมิน
 */
function showAssessmentResults(results) {
    const modal = document.getElementById('results-modal');
    const content = document.getElementById('results-content');
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-semibold text-blue-800 mb-2">ข้อมูลนักเรียน</h3>
                <p><strong>ชื่อ:</strong> ${results.studentInfo.name}</p>
                <p><strong>ชั้น:</strong> ${results.studentInfo.class}</p>
                <p><strong>ประเมินโดย:</strong> ${results.studentInfo.evaluatorName}</p>
                <p><strong>วันที่ประเมิน:</strong> ${results.studentInfo.timestamp}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">คะแนนดิบ</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>ด้านอารมณ์:</span>
                            <span class="font-medium">${results.scores.emotional}/10</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านความประพฤติ:</span>
                            <span class="font-medium">${results.scores.conduct}/10</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านสมาธิ:</span>
                            <span class="font-medium">${results.scores.hyperactivity}/10</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านเพื่อน:</span>
                            <span class="font-medium">${results.scores.peerProblems}/10</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านสังคม:</span>
                            <span class="font-medium">${results.scores.prosocial}/10</span>
                        </div>
                        <hr>
                        <div class="flex justify-between font-semibold">
                            <span>คะแนนรวมปัญหา:</span>
                            <span>${results.scores.totalDifficulties}/40</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">การแปลผล</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>ด้านอารมณ์:</span>
                            <span class="status-badge status-${getInterpretationStatus(results.interpretations.emotional)}">
                                ${results.interpretations.emotional}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านความประพฤติ:</span>
                            <span class="status-badge status-${getInterpretationStatus(results.interpretations.conduct)}">
                                ${results.interpretations.conduct}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านสมาธิ:</span>
                            <span class="status-badge status-${getInterpretationStatus(results.interpretations.hyperactivity)}">
                                ${results.interpretations.hyperactivity}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านเพื่อน:</span>
                            <span class="status-badge status-${getInterpretationStatus(results.interpretations.peerProblems)}">
                                ${results.interpretations.peerProblems}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>ด้านสังคม:</span>
                            <span class="status-badge status-${getInterpretationStatus(results.interpretations.prosocial)}">
                                ${results.interpretations.prosocial}
                            </span>
                        </div>
                        <hr>
                        <div class="flex justify-between font-semibold">
                            <span>สรุปรวม:</span>
                            <span class="status-badge status-${getInterpretationStatus(results.interpretations.total)}">
                                ${results.interpretations.total}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${results.interpretations.total !== 'ปกติ' ? `
                <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 class="font-semibold text-yellow-800 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>ข้อแนะนำ
                    </h4>
                    <p class="text-yellow-700 text-sm">
                        นักเรียนคนนี้ควรได้รับการดูแลเป็นพิเศษ กรุณาติดตามและให้การช่วยเหลือตามความเหมาะสม
                        อาจพิจารณาส่งต่อให้ผู้เชี่ยวชาญเพื่อการประเมินและช่วยเหลือเพิ่มเติม
                    </p>
                </div>
            ` : `
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-800 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>ผลการประเมิน
                    </h4>
                    <p class="text-green-700 text-sm">
                        นักเรียนคนนี้มีพัฒนาการทางจิตใจและพฤติกรรมในระดับปกติ ควรส่งเสริมให้คงไว้ซึ่งจุดแข็งที่มีอยู่
                    </p>
                </div>
            `}
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * ปิด Modal ผลการประเมิน
 */
function closeResultsModal() {
    document.getElementById('results-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/**
 * พิมพ์ผลการประเมิน
 */
function printResults() {
    const printContent = document.getElementById('results-content').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ผลการประเมิน SDQ</title>
            <style>
                body { font-family: 'Sarabun', sans-serif; margin: 20px; }
                .status-badge { 
                    display: inline-block; 
                    padding: 2px 8px; 
                    border-radius: 4px; 
                    font-size: 12px;
                    font-weight: bold;
                }
                .status-normal { background: #dcfce7; color: #166534; }
                .status-risk { background: #fef3c7; color: #92400e; }
                .status-problem { background: #fef2f2; color: #dc2626; }
                .bg-blue-50 { background: #eff6ff; padding: 16px; border-radius: 8px; }
                .bg-gray-50 { background: #f9fafb; padding: 16px; border-radius: 8px; }
                .bg-yellow-50 { background: #fefce8; border: 1px solid #fde047; padding: 16px; border-radius: 8px; }
                .bg-green-50 { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .space-y-6 > * + * { margin-top: 24px; }
                .space-y-2 > * + * { margin-top: 8px; }
                h3, h4 { margin: 0 0 8px 0; }
                hr { margin: 8px 0; border: none; border-top: 1px solid #e5e7eb; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>ผลการประเมิน SDQ</h1>
            <div class="space-y-6">
                ${printContent}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// ============================
// TAB MANAGEMENT
// ============================

/**
 * เปลี่ยน Tab
 * @param {string} tabName - ชื่อ tab
 */
function switchTab(tabName) {
    // ซ่อน content ทุก tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // ลบ active class จาก tab ทั้งหมด
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // แสดง tab ที่เลือก
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // เพิ่ม active class ใน tab ที่เลือก
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // โหลดข้อมูลเฉพาะ tab
    if (tabName === 'reports') {
        // ใช้ setTimeout เพื่อให้ tab แสดงผลก่อน
        setTimeout(() => {
            updateCharts();
        }, 100);
    } else if (tabName === 'priority') {
        updatePriorityStudents();
    } else if (tabName === 'students') {
        // รีเฟรช student cards
        displayStudents();
    }
}

// ============================
// NOTIFICATION SYSTEM
// ============================

/**
 * แสดง Notification Toast
 * @param {string} message - ข้อความ
 * @param {string} type - ประเภท ('info', 'success', 'error', 'warning')
 */
function showNotification(message, type = 'info') {
    // ลบ notification เดิม (ถ้ามี)
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        'bg-blue-500'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${
                type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' : 
                type === 'warning' ? 'exclamation-triangle' : 
                'info-circle'
            } mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200 focus:outline-none">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // ลบอัตโนมัติหลัง 5 วินาที
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// ============================
// STUDENT ASSESSMENT HANDLERS
// ============================

/**
 * จัดการการเลือกนักเรียนสำหรับประเมิน
 * @param {Event} e - Event object
 */
function handleStudentSelection(e) {
    const studentId = e.target.value;
    console.log('Student selection changed:', studentId);
    
    if (studentId) {
        const success = showAssessmentQuestions(studentId);
        if (success) {
            showNotification('เลือกนักเรียนเรียบร้อย กรุณาทำการประเมิน', 'success');
        }
    } else {
        // ซ่อนส่วนคำถาม
        const questionsSection = document.getElementById('assessment-questions');
        if (questionsSection) {
            questionsSection.classList.add('hidden');
        }
        currentAssessmentStudent = null;
        assessmentAnswers = [];
    }
}

// ============================
// GLOBAL WINDOW FUNCTIONS
// ============================

/**
 * ประเมินนักเรียน (เรียกจาก onClick)
 * @param {string} studentId - รหัสนักเรียน
 */
window.assessStudent = function(studentId) {
    currentAssessmentStudent = studentId;
    const student = allStudents.find(s => s.id === studentId);
    
    if (student) {
        document.getElementById('student-select').value = studentId;
        showAssessmentQuestions(studentId);
        switchTab('assessment');
        
        // เลื่อนไปยังฟอร์มประเมิน
        document.getElementById('assessment-tab').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
};

/**
 * ดูผลการประเมิน (เรียกจาก onClick)
 * @param {string} studentId - รหัสนักเรียน
 */
window.viewResults = function(studentId) {
    const assessment = getLatestAssessment(studentId);
    
    if (!assessment) {
        showError('ไม่พบข้อมูลการประเมินสำหรับนักเรียนคนนี้');
        return;
    }
    
    // แสดงผลการประเมินใน modal
    showAssessmentResults({
        success: true,
        assessmentId: `existing_${studentId}`,
        scores: assessment.scores,
        interpretations: assessment.interpretations,
        studentInfo: {
            id: assessment.studentId,
            name: assessment.studentName,
            class: assessment.studentClass,
            evaluatorType: assessment.evaluatorType,
            evaluatorName: assessment.evaluatorName,
            relation: assessment.relation,
            timestamp: formatDate(assessment.timestamp)
        },
        answers: assessment.answers
    });
};

/**
 * จัดการ resize window สำหรับ charts
 */
window.addEventListener('resize', function() {
    if (window.pieChart) {
        window.pieChart.resize();
    }
    if (window.barChart) {
        window.barChart.resize();
    }
    if (window.lineChart) {
        window.lineChart.resize();
    }
});

// Teacher Dashboard JavaScript - Part 6: Charts, Export & Initialization

// ============================
// CHARTS FUNCTIONS
// ============================

/**
 * อัปเดตกราฟทั้งหมด
 */
function updateCharts() {
    console.log('Updating charts with assessment data...');
    
    try {
        // ตรวจสอบว่าอยู่ในแท็บ Reports หรือไม่
        const reportsTab = document.getElementById('reports-tab');
        if (reportsTab.classList.contains('hidden')) {
            console.log('Reports tab is hidden, skipping chart update');
            return;
        }
        
        // สร้าง/อัปเดตกราฟทั้งหมด
        createAssessmentPieChart();
        createAspectsBarChart();
        createTrendLineChart();
        
        console.log('Charts updated successfully');
        
    } catch (error) {
        console.error('Error updating charts:', error);
        createEmptyCharts();
    }
}

/**
 * สร้างกราฟวงกลมแสดงสัดส่วนผลการประเมิน
 */
function createAssessmentPieChart() {
    const ctx = document.getElementById('assessment-pie-chart');
    if (!ctx) {
        console.error('Assessment pie chart canvas not found');
        return;
    }
    
    // คำนวณข้อมูลจากนักเรียนที่กรองแล้ว
    const normalStudents = filteredStudents.filter(s => {
        const assessment = getLatestAssessment(s.id);
        return assessment && getAssessmentStatus(assessment) === 'normal';
    }).length;
    
    const riskStudents = filteredStudents.filter(s => {
        const assessment = getLatestAssessment(s.id);
        return assessment && getAssessmentStatus(assessment) === 'risk';
    }).length;
    
    const problemStudents = filteredStudents.filter(s => {
        const assessment = getLatestAssessment(s.id);
        return assessment && getAssessmentStatus(assessment) === 'problem';
    }).length;
    
    const notAssessed = filteredStudents.length - normalStudents - riskStudents - problemStudents;
    
    // ทำลาย chart เดิม (ถ้ามี)
    if (window.pieChart) {
        window.pieChart.destroy();
    }
    
    window.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['ปกติ', 'เสี่ยง', 'มีปัญหา', 'ยังไม่ประเมิน'],
            datasets: [{
                data: [normalStudents, riskStudents, problemStudents, notAssessed],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        usePointStyle: true,
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.raw} คน (${percentage}%)`;
                        }
                    }
                }
            },
            layout: {
                padding: 10
            }
        }
    });
    
    console.log('Pie chart created with data:', [normalStudents, riskStudents, problemStudents, notAssessed]);
}

/**
 * สร้างกราฟแท่งแสดงคะแนนเฉลี่ยแต่ละด้าน
 */
function createAspectsBarChart() {
    const ctx = document.getElementById('aspects-bar-chart');
    if (!ctx) {
        console.error('Aspects bar chart canvas not found');
        return;
    }
    
    // คำนวณคะแนนเฉลี่ยแต่ละด้าน
    const aspects = ['emotional', 'conduct', 'hyperactivity', 'peerProblems', 'prosocial'];
    const aspectLabels = ['อารมณ์', 'ความประพฤติ', 'สมาธิ', 'เพื่อน', 'สังคม'];
    const aspectAverages = [];
    
    aspects.forEach(aspect => {
        const scores = [];
        filteredStudents.forEach(student => {
            const assessment = getLatestAssessment(student.id);
            if (assessment && assessment.scores && assessment.scores[aspect] !== undefined) {
                scores.push(assessment.scores[aspect]);
            }
        });
        
        const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        aspectAverages.push(Number(average.toFixed(1)));
    });
    
    // ทำลาย chart เดิม (ถ้ามี)
    if (window.barChart) {
        window.barChart.destroy();
    }
    
    window.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aspectLabels,
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: aspectAverages,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderColor: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.8,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'คะแนน',
                        font: { size: 12 }
                    },
                    ticks: { font: { size: 10 } }
                },
                x: {
                    title: {
                        display: true,
                        text: 'ด้านการประเมิน',
                        font: { size: 12 }
                    },
                    ticks: { font: { size: 10 } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `คะแนนเฉลี่ย: ${context.raw}/10`;
                        }
                    }
                }
            },
            layout: { padding: 10 }
        }
    });
    
    console.log('Bar chart created with data:', aspectAverages);
}

/**
 * สร้างกราฟเส้นแสดงแนวโน้มการประเมินรายเดือน
 */
function createTrendLineChart() {
    const ctx = document.getElementById('trend-line-chart');
    if (!ctx) {
        console.error('Trend line chart canvas not found');
        return;
    }
    
    // สร้างข้อมูลแนวโน้ม (6 เดือนล่าสุด)
    const months = [];
    const assessedData = [];
    const riskData = [];
    const problemData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
        months.push(monthName);
        
        // ใช้ข้อมูลจริงจากเดือนปัจจุบัน ส่วนอื่นใช้จำลอง
        if (i === 0) {
            const assessed = filteredStudents.filter(s => getLatestAssessment(s.id)).length;
            const risk = filteredStudents.filter(s => {
                const assessment = getLatestAssessment(s.id);
                return assessment && getAssessmentStatus(assessment) === 'risk';
            }).length;
            const problem = filteredStudents.filter(s => {
                const assessment = getLatestAssessment(s.id);
                return assessment && getAssessmentStatus(assessment) === 'problem';
            }).length;
            
            assessedData.push(assessed);
            riskData.push(risk);
            problemData.push(problem);
        } else {
            // ข้อมูลจำลองสำหรับเดือนก่อนหน้า
            assessedData.push(Math.floor(Math.random() * filteredStudents.length * 0.8) + 1);
            riskData.push(Math.floor(Math.random() * 3) + 1);
            problemData.push(Math.floor(Math.random() * 2) + 1);
        }
    }
    
    // ทำลาย chart เดิม (ถ้ามี)
    if (window.lineChart) {
        window.lineChart.destroy();
    }
    
    window.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'นักเรียนที่ประเมินแล้ว',
                    data: assessedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'กลุ่มเสี่ยง',
                    data: riskData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'กลุ่มมีปัญหา',
                    data: problemData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(filteredStudents.length, 10),
                    title: {
                        display: true,
                        text: 'จำนวนนักเรียน (คน)',
                        font: { size: 12 }
                    },
                    ticks: { font: { size: 10 } }
                },
                x: {
                    title: {
                        display: true,
                        text: 'เดือน',
                        font: { size: 12 }
                    },
                    ticks: { font: { size: 10 } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                }
            },
            layout: { padding: 15 }
        }
    });
    
    console.log('Line chart created');
}

/**
 * สร้างกราฟว่างเปล่าเมื่อไม่มีข้อมูล
 */
function createEmptyCharts() {
    console.log('Creating empty charts...');
    
    // ลบข้อความ no-data เดิม
    document.querySelectorAll('.no-data-message').forEach(msg => msg.remove());
    
    // แสดงข้อความว่าไม่มีข้อมูล
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas && !container.querySelector('.no-data-message')) {
            const message = document.createElement('div');
            message.className = 'no-data-message text-center py-8 text-gray-500';
            message.innerHTML = `
                <i class="fas fa-chart-bar text-4xl mb-2"></i>
                <p class="font-medium">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
                <p class="text-sm">กรุณาประเมินนักเรียนก่อนเพื่อดูกราฟ</p>
            `;
            container.appendChild(message);
            canvas.style.display = 'none';
        }
    });
}

/**
 * อัปเดตรายการนักเรียนที่ต้องดูแลเป็นพิเศษ
 */
function updatePriorityStudents() {
    const container = document.getElementById('priority-students');
    const emptyState = document.getElementById('priority-empty');
    
    // กรองนักเรียนที่ต้องดูแลเป็นพิเศษ
    const priorityStudents = filteredStudents.filter(student => {
        const assessment = getLatestAssessment(student.id);
        if (!assessment) return false;
        
        const status = getAssessmentStatus(assessment);
        return status === 'risk' || status === 'problem';
    });
    
    if (priorityStudents.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    container.innerHTML = priorityStudents.map(student => {
        const assessment = getLatestAssessment(student.id);
        const status = getAssessmentStatus(assessment);
        const statusInfo = getStatusInfo(status);
        
        // สร้างรายการด้านที่มีปัญหา
        const problemAspects = [];
        if (assessment.interpretations.emotional !== 'ปกติ') problemAspects.push('ด้านอารมณ์');
        if (assessment.interpretations.conduct !== 'ปกติ') problemAspects.push('ด้านความประพฤติ');
        if (assessment.interpretations.hyperactivity !== 'ปกติ') problemAspects.push('ด้านสมาธิ');
        if (assessment.interpretations.peerProblems !== 'ปกติ') problemAspects.push('ด้านเพื่อน');
        if (assessment.interpretations.prosocial !== 'ปกติ' && assessment.interpretations.prosocial !== 'จุดแข็ง') {
            problemAspects.push('ด้านสังคม');
        }
        
        return `
            <div class="bg-white p-4 rounded-lg border-l-4 ${status === 'problem' ? 'border-red-500' : 'border-yellow-500'} shadow-sm">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br ${status === 'problem' ? 'from-red-500 to-pink-600' : 'from-yellow-500 to-orange-600'} rounded-full flex items-center justify-center">
                            <i class="fas fa-user-graduate text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${student.name}</h4>
                            <p class="text-sm text-gray-600">${student.class}</p>
                            <p class="text-sm text-gray-500">คะแนนรวม: ${assessment.scores.totalDifficulties}/40</p>
                            ${problemAspects.length > 0 ? `<p class="text-xs text-red-600 mt-1">⚠️ ${problemAspects.join(', ')}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="status-badge status-${status} mb-2 block">
                            <i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}
                        </span>
                        <div class="flex gap-2">
                            <button onclick="viewResults('${student.id}')" class="btn-secondary text-xs">
                                <i class="fas fa-eye mr-1"></i>ดูผล
                            </button>
                            <button onclick="assessStudent('${student.id}')" class="btn-success text-xs">
                                <i class="fas fa-clipboard-check mr-1"></i>ประเมินใหม่
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================
// EXPORT FUNCTIONS
// ============================

/**
 * ส่งออกข้อมูลเป็นไฟล์ CSV
 */
async function exportData() {
    try {
        showLoading(true, "กำลังเตรียมข้อมูลสำหรับส่งออก...");
        
        // เตรียมข้อมูลสำหรับส่งออก
        const exportData = filteredStudents.map(student => {
            const assessment = getLatestAssessment(student.id);
            return {
                'ลำดับ': filteredStudents.indexOf(student) + 1,
                'รหัสนักเรียน': student.id || '-',
                'ชื่อ-นามสกุล': student.name || '-',
                'ชั้นเรียน': student.class || '-',
                'สถานะการประเมิน': assessment ? 'ประเมินแล้ว' : 'ยังไม่ประเมิน',
                'วันที่ประเมิน': assessment ? formatDate(assessment.timestamp) : '-',
                'ผู้ประเมิน': assessment ? (assessment.evaluatorName || 'ไม่ระบุ') : '-',
                'คะแนนด้านอารมณ์': assessment ? assessment.scores.emotional : '-',
                'คะแนนด้านความประพฤติ': assessment ? assessment.scores.conduct : '-',
                'คะแนนด้านสมาธิ': assessment ? assessment.scores.hyperactivity : '-',
                'คะแนนด้านเพื่อน': assessment ? assessment.scores.peerProblems : '-',
                'คะแนนด้านสังคม': assessment ? assessment.scores.prosocial : '-',
                'คะแนนรวมปัญหา': assessment ? assessment.scores.totalDifficulties : '-',
                'สรุปผลรวม': assessment ? assessment.interpretations.total : '-'
            };
        });
        
        // แปลงเป็น CSV พร้อม BOM สำหรับ UTF-8
        const csvContent = '\ufeff' + convertToCSV(exportData);
        
        // ดาวน์โหลดไฟล์
        const thaiDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
        
        const filename = `รายงานการประเมิน_SDQ_${currentClass || 'ทุกชั้น'}_${thaiDate}.csv`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showLoading(false);
        showSuccess('ส่งออกข้อมูลเรียบร้อยแล้ว');
        
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถส่งออกข้อมูลได้: ${error.message}`);
        console.error('Export data error:', error);
    }
}

/**
 * แปลงข้อมูลเป็น CSV format
 * @param {Array} data - ข้อมูลที่จะแปลง
 * @returns {string} - CSV string
 */
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            let value = row[header];
            // จัดการค่าที่มี comma หรือ quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// ============================
// INITIALIZATION
// ============================

/**
 * เริ่มต้นระบบเมื่อ DOM พร้อม
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Initializing Teacher Dashboard...');
    
    // ตรวจสอบการเข้าสู่ระบบ
    if (!getCurrentUser()) {
        redirectToLogin();
        return;
    }
    
    // ตรวจสอบสิทธิ์ครู
    if (currentUser.role !== 'TEACHER') {
        showError('หน้านี้สำหรับครูเท่านั้น').then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    
    // อัปเดต UI ด้วยข้อมูลผู้ใช้
    document.getElementById('teacher-name').textContent = currentUser.fullName || currentUser.username;
    document.getElementById('school-name').textContent = currentUser.school || 'โรงเรียน';
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    // สร้างคำถามการประเมิน
    createAssessmentQuestions();
    
    // โหลดข้อมูลเริ่มต้น
    loadStudents();
    
    // ============================
    // EVENT LISTENERS
    // ============================
    
    // Class selector
    document.getElementById('class-selector').addEventListener('change', async function(e) {
        const newClass = e.target.value || null;
        console.log('Class changed to:', newClass);
        
        showLoading(true, "กำลังโหลดข้อมูลชั้นเรียน...");
        
        try {
            currentClass = newClass;
            filterStudentsByClass();
            await loadIndividualAssessments();
            updateStatistics();
            populateStudentSelect();
            updateCharts();
            updatePriorityStudents();
            displayStudents();
            
            console.log(`Loaded ${filteredStudents.length} students for class: ${currentClass || 'ทุกชั้น'}`);
        } catch (error) {
            console.error('Error changing class:', error);
            showError('เกิดข้อผิดพลาดในการเปลี่ยนชั้นเรียน');
        }
        
        showLoading(false);
    });
    
    // Student search
    document.getElementById('student-search').addEventListener('input', displayStudents);
    
    // Refresh button
    document.getElementById('refresh-students-btn').addEventListener('click', function() {
        loadStudents();
    });
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Quick action buttons
    document.getElementById('quick-assess-btn').addEventListener('click', () => switchTab('assessment'));
    document.getElementById('view-reports-btn').addEventListener('click', () => switchTab('reports'));
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    
    // Student selection for assessment
    setTimeout(() => {
        const studentSelect = document.getElementById('student-select');
        if (studentSelect) {
            studentSelect.removeEventListener('change', handleStudentSelection);
            studentSelect.addEventListener('change', handleStudentSelection);
            console.log('Student select event listener added');
        }
    }, 1000);
    
    // Assessment buttons
    document.addEventListener('click', function(e) {
        if (e.target.id === 'save-assessment-btn' || e.target.closest('#save-assessment-btn')) {
            saveAssessment();
        }
    });
    
    document.getElementById('clear-assessment-btn').addEventListener('click', function() {
        showConfirm('คุณต้องการล้างข้อมูลการประเมินหรือไม่?').then((result) => {
            if (result.isConfirmed) {
                clearAssessmentForm();
            }
        });
    });
    
    // Modal buttons
    document.getElementById('close-results-btn').addEventListener('click', closeResultsModal);
    document.getElementById('close-results-modal-btn').addEventListener('click', closeResultsModal);
    document.getElementById('print-results-btn').addEventListener('click', printResults);
    
    // Close modal when clicking outside
    document.getElementById('results-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeResultsModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            closeResultsModal();
        }
        
        // Ctrl/Cmd + S to save assessment
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (!document.getElementById('assessment-tab').classList.contains('hidden')) {
                saveAssessment();
            }
        }
    });
    
    console.log('🎓 Teacher Dashboard initialized successfully!');
});
