// teacher-dashboard.js
// Mobile-Optimized Teacher Dashboard JavaScript

// ==================== CONFIGURATION ====================
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx-rfOnx5yh_XT0Kqx4cBkiCtQKZccRfdChhLrUYQIG7HPDfW8i6GwI4mdHBB5E9H87aA/exec';

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let currentSession = null;
let allStudents = [];
let assessmentData = [];
let currentClass = null;
let filteredStudents = [];
let assessmentAnswers = [];
let currentAssessmentStudent = null;

// ==================== SDQ QUESTIONS ====================
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

// ==================== UTILITY FUNCTIONS ====================

function isMobile() {
    return window.innerWidth < 768;
}

function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
}

function showLoading(show = true, message = "กำลังประมวลผล...") {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    
    if (text) text.textContent = message;
    if (overlay) overlay.classList.toggle('hidden', !show);
    
    // Prevent body scroll when loading
    document.body.style.overflow = show ? 'hidden' : 'auto';
}

function showSuccess(message, title = "สำเร็จ!") {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
        customClass: {
            container: 'swal-mobile'
        }
    });
}

function showError(message, title = "เกิดข้อผิดพลาด!") {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444',
        customClass: {
            container: 'swal-mobile'
        }
    });
}

function showConfirm(message, title = "ยืนยันการดำเนินการ") {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        customClass: {
            container: 'swal-mobile'
        }
    });
}

// Mobile-optimized notification
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed ${isMobile() ? 'top-4 left-4 right-4' : 'top-4 right-4'} z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        'bg-blue-500'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 
                    'info-circle'
                } mr-2"></i>
                <span class="text-sm">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200 focus:outline-none p-1">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds on mobile, 5 on desktop
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = isMobile() ? 'translateY(-100%)' : 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, isMobile() ? 4000 : 5000);
}

// JSONP helper function
function makeJSONPRequest(action, data = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        const params = new URLSearchParams({
            action: action,
            callback: callbackName,
            ...data
        });
        
        const script = document.createElement('script');
        script.src = `${GAS_WEB_APP_URL}?${params.toString()}`;
        
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Network request failed'));
        };
        
        document.body.appendChild(script);
        
        // Longer timeout for mobile
        const timeout = isMobile() ? 45000 : 30000;
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Request timeout'));
            }
        }, timeout);
    });
}

// ==================== AUTHENTICATION ====================

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

function redirectToLogin() {
    showError('กรุณาเข้าสู่ระบบใหม่').then(() => {
        window.location.href = 'login.html';
    });
}

// ==================== DATE FORMATTING ====================

function formatDate(dateString) {
    if (!dateString) return 'ไม่ทราบ';
    
    try {
        let date;
        
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string' && dateString.includes('กรกฎาคม')) {
            const thaiToEng = convertThaiDateToEnglish(dateString);
            date = new Date(thaiToEng);
        } else if (typeof dateString === 'string') {
            date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                const datePatterns = [
                    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                    /(\d{1,2})-(\d{1,2})-(\d{4})/,
                    /(\d{4})-(\d{1,2})-(\d{1,2})/
                ];
                
                for (let pattern of datePatterns) {
                    const match = dateString.match(pattern);
                    if (match) {
                        if (pattern === datePatterns[2]) {
                            date = new Date(match[1], match[2] - 1, match[3]);
                        } else {
                            date = new Date(match[3], match[2] - 1, match[1]);
                        }
                        break;
                    }
                }
            }
        } else if (typeof dateString === 'number') {
            date = new Date(dateString);
        } else {
            return 'รูปแบบวันที่ไม่รู้จัก';
        }
        
        if (!date || isNaN(date.getTime())) {
            return 'วันที่ไม่ถูกต้อง';
        }
        
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: isMobile() ? 'short' : 'long',
            day: 'numeric'
        });
        
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'ข้อผิดพลาดในการแปลงวันที่';
    }
}

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
        
        const christianYear = buddhistYear - 543;
        const englishDateString = `${englishMonth} ${day}, ${christianYear}`;
        
        return englishDateString;
        
    } catch (error) {
        console.error('Error converting Thai date:', error);
        return null;
    }
}

// ==================== DATA LOADING FUNCTIONS ====================

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
            
            updateClassSelector();
            
            // Set default class if none selected
            if (!currentClass && allStudents.length > 0) {
                const firstClass = allStudents[0].class;
                if (firstClass) {
                    currentClass = firstClass;
                    document.getElementById('class-selector').value = firstClass;
                }
            }
            
            filterStudentsByClass();
            await loadIndividualAssessments();
            
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

async function loadIndividualAssessments() {
    try {
        if (filteredStudents.length === 0) return;
        
        // Clear existing assessments
        filteredStudents.forEach(student => {
            delete student.latestAssessment;
        });
        
        // Load assessments with better error handling for mobile
        const assessmentPromises = filteredStudents.map(async (student) => {
            try {
                const response = await makeJSONPRequest('getAssessmentResultsForUser', {
                    sessionId: currentSession,
                    studentId: student.id,
                    evaluatorType: 'all'
                });
                
                if (response && response.success && response.data) {
                    student.latestAssessment = response.data;
                } else {
                    student.latestAssessment = null;
                }
            } catch (error) {
                console.error(`Error loading assessment for student ${student.id}:`, error);
                student.latestAssessment = null;
            }
        });
        
        await Promise.all(assessmentPromises);
        
        // Update allStudents with new assessment data
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

// ==================== UI UPDATE FUNCTIONS ====================

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
    
    if (currentUser.assignedClasses && currentUser.assignedClasses.length > 0) {
        const firstClass = currentUser.assignedClasses[0];
        if (classes.includes(firstClass)) {
            selector.value = firstClass;
            currentClass = firstClass;
        }
    }
}

function filterStudentsByClass() {
    if (!currentClass) {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => student.class === currentClass);
    }
    
    displayStudents();
}

function displayStudents() {
    const container = document.getElementById('students-grid');
    const emptyState = document.getElementById('students-empty');
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    
    let studentsToShow = filteredStudents;
    
    if (searchTerm) {
        studentsToShow = filteredStudents.filter(student => 
            student.name.toLowerCase().includes(searchTerm) ||
            (student.class && student.class.toLowerCase().includes(searchTerm))
        );
    }
    
    if (studentsToShow.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    container.innerHTML = studentsToShow.map(student => createStudentCard(student)).join('');
}

function createStudentCard(student) {
    const assessment = getLatestAssessment(student.id);
    const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
    const statusInfo = getStatusInfo(status);
    
    return `
        <div class="student-card ${status}" data-student-id="${student.id}">
            <div class="p-3 sm:p-4">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-user-graduate text-white text-sm"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm sm:text-base truncate">${highlightSearchTerm(student.name)}</h4>
                            <p class="text-xs sm:text-sm text-gray-600">${student.class || 'ไม่มีข้อมูลชั้น'}</p>
                        </div>
                    </div>
                    <span class="status-badge status-${status} self-start">
                        <i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}
                    </span>
                </div>
                
                ${assessment ? `
                    <div class="mb-3 text-xs sm:text-sm">
                        <p class="text-gray-600 mb-1">ประเมินล่าสุด: ${formatDate(assessment.timestamp)}</p>
                        <p class="text-gray-600 mb-1">คะแนนรวม: ${assessment.scores.totalDifficulties || 0}/40</p>
                        <p class="text-gray-600 mb-2">ประเมินโดย: ${assessment.evaluatorName || 'ไม่ระบุ'}</p>
                        ${!isMobile() ? `
                        <div class="flex flex-wrap gap-1">
                            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                อารมณ์: ${assessment.scores.emotional || 0}
                            </span>
                            <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                ความประพฤติ: ${assessment.scores.conduct || 0}
                            </span>
                            <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                สมาธิ: ${assessment.scores.hyperactivity || 0}
                            </span>
                        </div>
                        ` : ''}
                    </div>
                ` : `
                    <div class="mb-3 text-xs sm:text-sm text-gray-500">
                        <p>ยังไม่ได้ประเมิน</p>
                        <p class="text-xs">กรุณาทำการประเมินเพื่อดูรายละเอียด</p>
                    </div>
                `}
                
                <div class="flex gap-2">
                    <button onclick="assessStudent('${student.id}')" class="btn-success flex-1 text-xs sm:text-sm">
                        <i class="fas fa-clipboard-check mr-1"></i>
                        ${assessment ? 'ประเมินใหม่' : 'ประเมิน'}
                    </button>
                    ${assessment ? `
                        <button onclick="viewResults('${student.id}')" class="btn-secondary text-xs sm:text-sm">
                            <i class="fas fa-eye"></i>
                            <span class="hidden sm:inline ml-1">ดูผล</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function updateStatistics() {
    const totalStudents = filteredStudents.length;
    
    let assessedStudents = 0;
    let riskStudents = 0;
    let problemStudents = 0;
    
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
    
    document.getElementById('total-students').textContent = totalStudents;
    document.getElementById('assessed-students').textContent = assessedStudents;
    document.getElementById('risk-students').textContent = riskStudents;
    document.getElementById('problem-students').textContent = problemStudents;
}

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

// ==================== HELPER FUNCTIONS ====================

function getLatestAssessment(studentId) {
    const filteredStudent = filteredStudents.find(s => s.id === studentId);
    if (filteredStudent && filteredStudent.latestAssessment) {
        return filteredStudent.latestAssessment;
    }
    
    const student = allStudents.find(s => s.id === studentId);
    return student ? student.latestAssessment : null;
}

function getAssessmentStatus(assessment) {
    if (!assessment) return 'not-assessed';
    
    const totalScore = assessment.scores.totalDifficulties;
    if (totalScore <= 11) return 'normal';
    if (totalScore <= 15) return 'risk';
    return 'problem';
}

function getStatusInfo(status) {
    const statusMap = {
        'normal': { label: 'ปกติ', icon: 'fas fa-check-circle' },
        'risk': { label: 'เสี่ยง', icon: 'fas fa-exclamation-triangle' },
        'problem': { label: 'มีปัญหา', icon: 'fas fa-exclamation-circle' },
        'not-assessed': { label: 'ยังไม่ประเมิน', icon: 'fas fa-clock' }
    };
    return statusMap[status] || statusMap['not-assessed'];
}

function getInterpretationStatus(interpretation) {
    if (interpretation === 'ปกติ' || interpretation === 'จุดแข็ง') return 'normal';
    if (interpretation === 'เสี่ยง') return 'risk';
    if (interpretation === 'มีปัญหา' || interpretation === 'ควรปรับปรุง') return 'problem';
    return 'normal';
}

function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('student-search').value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// ==================== MOBILE OPTIMIZATIONS ====================

// Touch gesture support for mobile
function addMobileGestures() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        
        // Pull to refresh gesture
        if (currentY - startY > 150 && window.scrollY === 0) {
            // Trigger refresh
            if (!document.querySelector('.loading-overlay:not(.hidden)')) {
                showNotification('กำลังรีเฟรชข้อมูล...', 'info');
                location.reload();
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function() {
        isDragging = false;
    });
}

// Optimize scroll performance
function optimizeScrolling() {
    let ticking = false;
    
    function updateScrollPosition() {
        // Add scroll-based optimizations here
        ticking = false;
    }
    
    document.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollPosition);
            ticking = true;
        }
    }, { passive: true });
}

// ==================== WINDOW EVENT HANDLERS ====================

window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(function() {
        // Resize charts if they exist
        if (window.pieChart) window.pieChart.resize();
        if (window.barChart) window.barChart.resize();
        if (window.lineChart) window.lineChart.resize();
        
        // Update mobile-specific UI
        if (isMobile()) {
            // Adjust any mobile-specific elements
            document.querySelectorAll('.quick-action-btn').forEach(btn => {
                btn.style.fontSize = '0.8rem';
            });
        }
    }, 250);
});

// Online/Offline detection
window.addEventListener('online', function() {
    showNotification('เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
});

window.addEventListener('offline', function() {
    showNotification('ไม่มีการเชื่อมต่ออินเทอร์เน็ต', 'warning');
});

// Prevent zoom on double tap (iOS)
document.addEventListener('touchend', function(e) {
    const now = new Date().getTime();
    const timeSince = now - (window.lastTouch || now);
    
    if (timeSince < 500 && timeSince > 0) {
        e.preventDefault();
    }
    
    window.lastTouch = now;
});

console.log('🎓 Teacher Dashboard Mobile JavaScript loaded successfully!');
