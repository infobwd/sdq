// Teacher Dashboard JavaScript - Improved Part 1: Performance & Loading Optimizations

// ============================
// CONFIGURATION & PERFORMANCE
// ============================
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx-rfOnx5yh_XT0Kqx4cBkiCtQKZccRfdChhLrUYQIG7HPDfW8i6GwI4mdHBB5E9H87aA/exec';

// Performance optimization constants
const DEBOUNCE_DELAY = 300;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================
// GLOBAL VARIABLES WITH CACHING
// ============================
let currentUser = null;
let currentSession = null;
let allStudents = [];
let filteredStudents = [];
let currentClass = null;
let assessmentAnswers = [];
let currentAssessmentStudent = null;

// Performance caches
const dataCache = new Map();
const requestQueue = new Map();
let isOffline = false;

// Draft storage for auto-save
let assessmentDraft = {
    studentId: null,
    answers: [],
    lastSaved: null
};
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
// PERFORMANCE UTILITIES
// ============================

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, delay = DEBOUNCE_DELAY) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle function for scroll/resize events
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, delay = 100) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

/**
 * Cache management with expiration
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} duration - Cache duration in milliseconds
 */
function setCache(key, data, duration = CACHE_DURATION) {
    dataCache.set(key, {
        data,
        timestamp: Date.now(),
        duration
    });
}

/**
 * Get cached data if not expired
 * @param {string} key - Cache key
 * @returns {*} - Cached data or null
 */
function getCache(key) {
    const cached = dataCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.duration) {
        dataCache.delete(key);
        return null;
    }
    
    return cached.data;
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of dataCache.entries()) {
        if (now - value.timestamp > value.duration) {
            dataCache.delete(key);
        }
    }
}

// ============================
// ENHANCED LOADING STATES
// ============================

/**
 * Enhanced loading overlay with better UX
 * @param {boolean} show - Show or hide loading
 * @param {string} message - Loading message
 * @param {string} type - Loading type ('default', 'data', 'saving')
 */
function showLoading(show = true, message = "กำลังประมวลผล...", type = 'default') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    
    if (!overlay || !text) return;
    
    if (show) {
        // Add fade-in class
        overlay.classList.remove('hidden', 'fade-out');
        overlay.classList.add('fade-in');
        
        // Update message and icon based on type
        const icons = {
            'default': 'fas fa-spinner',
            'data': 'fas fa-download',
            'saving': 'fas fa-save'
        };
        
        text.innerHTML = `
            <i class="${icons[type]} mr-2"></i>
            ${message}
        `;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    } else {
        // Add fade-out animation
        overlay.classList.remove('fade-in');
        overlay.classList.add('fade-out');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('fade-out');
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

/**
 * Show skeleton loading for specific containers
 * @param {string} containerId - Container element ID
 * @param {number} count - Number of skeleton items
 */
function showSkeletonLoading(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton skeleton-card';
        skeleton.innerHTML = `
            <div class="p-4">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 skeleton rounded-full"></div>
                    <div class="flex-1">
                        <div class="skeleton skeleton-text short mb-2"></div>
                        <div class="skeleton skeleton-text medium"></div>
                    </div>
                </div>
                <div class="skeleton skeleton-text long mb-2"></div>
                <div class="skeleton skeleton-text medium"></div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

/**
 * Progressive content loading
 * @param {string} containerId - Container element ID
 */
function showProgressiveLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.classList.add('content-loading');
    
    // Simulate progressive loading
    setTimeout(() => {
        container.classList.remove('content-loading');
        container.classList.add('content-loaded');
    }, 100);
}

// ============================
// ENHANCED API FUNCTIONS
// ============================

/**
 * Enhanced JSONP with retry logic and caching
 * @param {string} action - API action
 * @param {object} data - Request data
 * @param {boolean} useCache - Whether to use cache
 * @returns {Promise} - Promise with response
 */
async function makeJSONPRequest(action, data = {}, useCache = true) {
    const cacheKey = `${action}_${JSON.stringify(data)}`;
    
    // Check cache first
    if (useCache) {
        const cached = getCache(cacheKey);
        if (cached) {
            console.log(`Using cached data for ${action}`);
            return cached;
        }
    }
    
    // Check if request is already in progress
    if (requestQueue.has(cacheKey)) {
        console.log(`Request already in progress for ${action}`);
        return requestQueue.get(cacheKey);
    }
    
    // Create request promise with retry logic
    const requestPromise = performRequestWithRetry(action, data);
    requestQueue.set(cacheKey, requestPromise);
    
    try {
        const response = await requestPromise;
        
        // Cache successful responses
        if (useCache && response && response.success) {
            setCache(cacheKey, response);
        }
        
        return response;
    } catch (error) {
        console.error(`Request failed for ${action}:`, error);
        throw error;
    } finally {
        requestQueue.delete(cacheKey);
    }
}

/**
 * Perform request with retry logic
 * @param {string} action - API action
 * @param {object} data - Request data
 * @param {number} attempt - Current attempt number
 * @returns {Promise} - Promise with response
 */
async function performRequestWithRetry(action, data, attempt = 1) {
    return new Promise((resolve, reject) => {
        const callbackName = `jsonp_callback_${Math.round(100000 * Math.random())}_${attempt}`;
        
        // Create callback function
        window[callbackName] = function(response) {
            cleanup();
            resolve(response);
        };
        
        // Create script element
        const script = document.createElement('script');
        const params = new URLSearchParams({
            action: action,
            callback: callbackName,
            ...data
        });
        
        script.src = `${GAS_WEB_APP_URL}?${params.toString()}`;
        
        // Handle errors and timeouts
        const timeoutId = setTimeout(() => {
            cleanup();
            
            if (attempt < RETRY_ATTEMPTS) {
                console.log(`Retrying request ${action} (attempt ${attempt + 1})`);
                setTimeout(() => {
                    performRequestWithRetry(action, data, attempt + 1)
                        .then(resolve)
                        .catch(reject);
                }, RETRY_DELAY * attempt);
            } else {
                reject(new Error(`Request timeout after ${RETRY_ATTEMPTS} attempts`));
            }
        }, 30000);
        
        script.onerror = function() {
            cleanup();
            
            if (attempt < RETRY_ATTEMPTS) {
                console.log(`Retrying request ${action} due to error (attempt ${attempt + 1})`);
                setTimeout(() => {
                    performRequestWithRetry(action, data, attempt + 1)
                        .then(resolve)
                        .catch(reject);
                }, RETRY_DELAY * attempt);
            } else {
                reject(new Error(`Request failed after ${RETRY_ATTEMPTS} attempts`));
            }
        };
        
        function cleanup() {
            clearTimeout(timeoutId);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }
        
        document.body.appendChild(script);
    });
}

// ============================
// OFFLINE SUPPORT
// ============================

/**
 * Check online status
 */
function checkOnlineStatus() {
    const wasOffline = isOffline;
    isOffline = !navigator.onLine;
    
    if (wasOffline && !isOffline) {
        showNotification('กลับมาออนไลน์แล้ว กำลังซิงค์ข้อมูล...', 'success');
        syncOfflineData();
    } else if (!wasOffline && isOffline) {
        showNotification('ออฟไลน์ ข้อมูลจะถูกบันทึกในเครื่อง', 'warning');
    }
}

/**
 * Save data for offline use
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
function saveOfflineData(key, data) {
    try {
        localStorage.setItem(`sdq_offline_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Failed to save offline data:', error);
    }
}

/**
 * Get offline data
 * @param {string} key - Storage key
 * @returns {*} - Offline data or null
 */
function getOfflineData(key) {
    try {
        const stored = localStorage.getItem(`sdq_offline_${key}`);
        if (!stored) return null;
        
        const parsed = JSON.parse(stored);
        return parsed.data;
    } catch (error) {
        console.error('Failed to get offline data:', error);
        return null;
    }
}

/**
 * Sync offline data when back online
 */
async function syncOfflineData() {
    const draft = getOfflineData('assessment_draft');
    if (draft && draft.studentId && draft.answers.length > 0) {
        try {
            await saveAssessment();
            localStorage.removeItem('sdq_offline_assessment_draft');
            showNotification('ข้อมูลการประเมินถูกซิงค์แล้ว', 'success');
        } catch (error) {
            console.error('Failed to sync assessment data:', error);
        }
    }
}

// ============================
// AUTO-SAVE FUNCTIONALITY
// ============================

/**
 * Auto-save assessment draft
 */
function autoSaveAssessment() {
    if (currentAssessmentStudent && assessmentAnswers.length > 0) {
        assessmentDraft = {
            studentId: currentAssessmentStudent,
            answers: [...assessmentAnswers],
            lastSaved: Date.now()
        };
        
        saveOfflineData('assessment_draft', assessmentDraft);
        
        // Show subtle indication
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.textContent = 'บันทึกอัตโนมัติแล้ว';
            indicator.classList.add('opacity-100');
            setTimeout(() => {
                indicator.classList.remove('opacity-100');
            }, 2000);
        }
    }
}

// Debounced auto-save
const debouncedAutoSave = debounce(autoSaveAssessment, 2000);

/**
 * Load assessment draft
 */
function loadAssessmentDraft() {
    const draft = getOfflineData('assessment_draft');
    if (draft && draft.studentId && draft.answers.length > 0) {
        const student = allStudents.find(s => s.id === draft.studentId);
        if (student) {
            const shouldLoad = confirm(
                `พบแบบประเมินที่ยังไม่ได้บันทึกสำหรับ ${student.name}\nต้องการโหลดข้อมูลต่อหรือไม่?`
            );
            
            if (shouldLoad) {
                currentAssessmentStudent = draft.studentId;
                assessmentAnswers = [...draft.answers];
                
                // Switch to assessment tab and load the form
                switchTab('assessment');
                document.getElementById('student-select').value = draft.studentId;
                showAssessmentQuestions(draft.studentId);
                
                // Restore answers
                restoreAssessmentAnswers();
            }
        }
    }
}

/**
 * Restore assessment answers from draft
 */
function restoreAssessmentAnswers() {
    assessmentAnswers.forEach((answer, index) => {
        if (answer !== undefined) {
            const radioItem = document.querySelector(`[data-question="${index}"][data-value="${answer}"]`);
            if (radioItem) {
                radioItem.click();
            }
        }
    });
}

// ============================
// ENHANCED ERROR HANDLING
// ============================

/**
 * Enhanced error handling with user-friendly messages
 * @param {Error} error - Error object
 * @param {string} context - Error context
 */
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    let message = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    
    if (error.message.includes('timeout')) {
        message = 'การเชื่อมต่อล่าช้า กรุณาลองใหม่อีกครั้ง';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
        message = 'ปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    } else if (error.message.includes('Session หมดอายุ')) {
        message = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
        setTimeout(() => {
            redirectToLogin();
        }, 2000);
    }
    
    showError(message);
}

// ============================
// INITIALIZATION WITH PERFORMANCE
// ============================

// Initialize online/offline listeners
window.addEventListener('online', checkOnlineStatus);
window.addEventListener('offline', checkOnlineStatus);

// Clear cache periodically
setInterval(clearExpiredCache, 60000); // Every minute

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
            month: 'short',
            day: 'numeric'
        });
        
    } catch (error) {
        console.error('Error formatting date:', error);
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
        
        const christianYear = buddhistYear - 543;
        return `${englishMonth} ${day}, ${christianYear}`;
        
    } catch (error) {
        console.error('Error converting Thai date:', error);
        return null;
    }
}

// Monitor performance
const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
            console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
        }
    }
});

try {
    perfObserver.observe({ entryTypes: ['measure'] });
} catch (error) {
    console.log('Performance observer not supported');
}

console.log('🚀 Performance optimizations loaded');


// Teacher Dashboard JavaScript - Improved Part 2: Enhanced UI Functions & Smart Data Management

// ============================
// ENHANCED UTILITY FUNCTIONS
// ============================

/**
 * Enhanced SweetAlert with consistent styling
 * @param {string} message - Message to display
 * @param {string} title - Alert title
 * @param {string} icon - Alert icon
 * @param {object} options - Additional options
 */
function showAlert(message, title = "", icon = "info", options = {}) {
    const defaultOptions = {
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
        allowOutsideClick: false,
        allowEscapeKey: true,
        showCloseButton: true,
        customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-semibold',
            content: 'text-gray-600',
            confirmButton: 'rounded-lg px-6 py-2 font-medium'
        }
    };
    
    return Swal.fire({
        icon,
        title,
        text: message,
        ...defaultOptions,
        ...options
    });
}

/**
 * Enhanced success notification
 */
function showSuccess(message, title = "สำเร็จ!") {
    return showAlert(message, title, 'success', {
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

/**
 * Enhanced error notification
 */
function showError(message, title = "เกิดข้อผิดพลาด!") {
    return showAlert(message, title, 'error', {
        confirmButtonColor: '#ef4444'
    });
}

/**
 * Enhanced confirmation dialog
 */
function showConfirm(message, title = "ยืนยันการดำเนินการ", options = {}) {
    return showAlert(message, title, 'question', {
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        ...options
    });
}

// ============================
// SMART DATA MANAGEMENT
// ============================

/**
 * Enhanced student data loading with smart caching
 */
async function loadStudents() {
    try {
        performance.mark('loadStudents-start');
        showSkeletonLoading('students-grid', 6);
        showLoading(true, "กำลังโหลดข้อมูลนักเรียน...", 'data');
        
        // Check cache first
        const cacheKey = `students_${currentUser.id}_${new Date().getFullYear() + 543}`;
        let studentsData = getCache(cacheKey);
        
        if (!studentsData) {
            const response = await makeJSONPRequest('getStudentsForUser', {
                sessionId: currentSession,
                academicYear: new Date().getFullYear() + 543
            });
            
            if (response && response.success) {
                studentsData = response.students || [];
                setCache(cacheKey, studentsData, 10 * 60 * 1000); // Cache for 10 minutes
            } else {
                throw new Error(response?.message || 'Failed to load students');
            }
        }
        
        allStudents = studentsData;
        console.log(`Loaded ${allStudents.length} students`);
        
        // Smart class selector update
        await updateClassSelectorSmart();
        
        // Initialize with first available class if none selected
        if (!currentClass && allStudents.length > 0) {
            const availableClasses = getAvailableClasses();
            if (availableClasses.length > 0) {
                currentClass = availableClasses[0];
                document.getElementById('class-selector').value = currentClass;
            }
        }
        
        // Progressive data loading
        filterStudentsByClass();
        await loadIndividualAssessmentsSmart();
        
        // Update UI with animation
        updateStatisticsAnimated();
        populateStudentSelectSmart();
        displayStudentsAnimated();
        
        performance.mark('loadStudents-end');
        performance.measure('loadStudents', 'loadStudents-start', 'loadStudents-end');
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        handleError(error, 'loadStudents');
        
        // Show offline data if available
        const offlineData = getOfflineData('students');
        if (offlineData) {
            allStudents = offlineData;
            filterStudentsByClass();
            displayStudentsAnimated();
            showNotification('แสดงข้อมูลออฟไลน์', 'warning');
        }
    }
}

/**
 * Smart class selector update with user preferences
 */
async function updateClassSelectorSmart() {
    const selector = document.getElementById('class-selector');
    const availableClasses = getAvailableClasses();
    
    // Save current selection
    const currentSelection = selector.value;
    
    // Update options with animation
    selector.style.opacity = '0.5';
    
    setTimeout(() => {
        selector.innerHTML = '<option value="">ทุกชั้นเรียน</option>';
        
        availableClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            
            // Mark assigned classes
            if (currentUser.assignedClasses?.includes(className)) {
                option.textContent += ' ⭐';
            }
            
            selector.appendChild(option);
        });
        
        // Restore selection or use smart default
        if (availableClasses.includes(currentSelection)) {
            selector.value = currentSelection;
        } else if (currentUser.assignedClasses?.length > 0) {
            const firstAssigned = currentUser.assignedClasses.find(c => availableClasses.includes(c));
            if (firstAssigned) {
                selector.value = firstAssigned;
                currentClass = firstAssigned;
            }
        }
        
        selector.style.opacity = '1';
    }, 150);
}

/**
 * Get available classes with sorting
 */
function getAvailableClasses() {
    const classes = [...new Set(allStudents.map(s => s.class).filter(c => c))];
    return classes.sort((a, b) => {
        // Prioritize assigned classes
        const aAssigned = currentUser.assignedClasses?.includes(a);
        const bAssigned = currentUser.assignedClasses?.includes(b);
        
        if (aAssigned && !bAssigned) return -1;
        if (!aAssigned && bAssigned) return 1;
        
        // Then sort naturally
        return a.localeCompare(b, 'th', { numeric: true });
    });
}

/**
 * Smart individual assessments loading with batching
 */
async function loadIndividualAssessmentsSmart() {
    if (filteredStudents.length === 0) return;
    
    console.log('Loading assessments for', filteredStudents.length, 'students');
    
    // Clear existing assessments
    filteredStudents.forEach(student => {
        delete student.latestAssessment;
    });
    
    // Batch loading for better performance
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < filteredStudents.length; i += batchSize) {
        batches.push(filteredStudents.slice(i, i + batchSize));
    }
    
    let loadedCount = 0;
    
    for (const batch of batches) {
        const promises = batch.map(async (student) => {
            try {
                const cacheKey = `assessment_${student.id}`;
                let assessmentData = getCache(cacheKey);
                
                if (!assessmentData) {
                    const response = await makeJSONPRequest('getAssessmentResultsForUser', {
                        sessionId: currentSession,
                        studentId: student.id,
                        evaluatorType: 'all'
                    }, false); // Don't cache empty results
                    
                    if (response && response.success && response.data) {
                        assessmentData = response.data;
                        setCache(cacheKey, assessmentData, 5 * 60 * 1000);
                    }
                }
                
                student.latestAssessment = assessmentData;
                loadedCount++;
                
                // Update progress
                const progress = Math.round((loadedCount / filteredStudents.length) * 100);
                const loadingText = document.getElementById('loading-text');
                if (loadingText) {
                    loadingText.innerHTML = `
                        <i class="fas fa-download mr-2"></i>
                        กำลังโหลดข้อมูลการประเมิน... ${progress}%
                    `;
                }
                
            } catch (error) {
                console.error(`Failed to load assessment for student ${student.id}:`, error);
                student.latestAssessment = null;
            }
        });
        
        await Promise.all(promises);
        
        // Small delay between batches to prevent overwhelming
        if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // Update allStudents with new data
    filteredStudents.forEach(filteredStudent => {
        const studentInAll = allStudents.find(s => s.id === filteredStudent.id);
        if (studentInAll) {
            studentInAll.latestAssessment = filteredStudent.latestAssessment;
        }
    });
    
    console.log(`✅ Assessments loaded for ${loadedCount} students`);
}

// ============================
// ENHANCED UI FUNCTIONS
// ============================

/**
 * Animated statistics update
 */
function updateStatisticsAnimated() {
    const totalStudents = filteredStudents.length;
    let assessedStudents = 0;
    let riskStudents = 0;
    let problemStudents = 0;
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        if (assessment && assessment.scores) {
            assessedStudents++;
            const status = getAssessmentStatus(assessment);
            if (status === 'risk') riskStudents++;
            else if (status === 'problem') problemStudents++;
        }
    });
    
    // Animate numbers
    animateNumber('total-students', totalStudents);
    animateNumber('assessed-students', assessedStudents);
    animateNumber('risk-students', riskStudents);
    animateNumber('problem-students', problemStudents);
    
    console.log(`Statistics: Total=${totalStudents}, Assessed=${assessedStudents}, Risk=${riskStudents}, Problem=${problemStudents}`);
}

/**
 * Animate number counting
 * @param {string} elementId - Element ID
 * @param {number} targetValue - Target number
 */
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Smart student selector population
 */
function populateStudentSelectSmart() {
    const select = document.getElementById('student-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- เลือกนักเรียนที่ต้องการประเมิน --</option>';
    
    // Group students by assessment status
    const groups = {
        notAssessed: [],
        problem: [],
        risk: [],
        normal: []
    };
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
        
        if (status === 'not-assessed') groups.notAssessed.push(student);
        else if (status === 'problem') groups.problem.push(student);
        else if (status === 'risk') groups.risk.push(student);
        else groups.normal.push(student);
    });
    
    // Add grouped options
    const addGroup = (groupName, students, emoji) => {
        if (students.length === 0) return;
        
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${emoji} ${groupName} (${students.length} คน)`;
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class})`;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    };
    
    addGroup('ต้องการความสนใจ', groups.problem, '🚨');
    addGroup('เสี่ยง', groups.risk, '⚠️');
    addGroup('ยังไม่ได้ประเมิน', groups.notAssessed, '📝');
    addGroup('ปกติ', groups.normal, '✅');
}

/**
 * Enhanced animated student display
 */
function displayStudentsAnimated() {
    const container = document.getElementById('students-grid');
    const emptyState = document.getElementById('students-empty');
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    
    let studentsToShow = filteredStudents;
    
    // Smart search with multiple criteria
    if (searchTerm) {
        studentsToShow = filteredStudents.filter(student => {
            const matchName = student.name.toLowerCase().includes(searchTerm);
            const matchClass = student.class?.toLowerCase().includes(searchTerm);
            const matchId = student.id?.toLowerCase().includes(searchTerm);
            
            // Search in assessment status
            const assessment = getLatestAssessment(student.id);
            const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
            const statusInfo = getStatusInfo(status);
            const matchStatus = statusInfo.label.toLowerCase().includes(searchTerm);
            
            return matchName || matchClass || matchId || matchStatus;
        });
    }
    
    // Handle empty state
    if (studentsToShow.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-500 mb-2">
                    ${searchTerm ? 'ไม่พบผลการค้นหา' : 'ไม่พบนักเรียน'}
                </h3>
                <p class="text-gray-400">
                    ${searchTerm ? `ไม่พบนักเรียนที่ตรงกับ "${searchTerm}"` : 'ยังไม่มีนักเรียนในชั้นเรียนที่เลือก'}
                </p>
                ${searchTerm ? '<button onclick="document.getElementById(\'student-search\').value=\'\'; displayStudentsAnimated();" class="mt-4 btn-secondary">ล้างการค้นหา</button>' : ''}
            </div>
        `;
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Sort students intelligently
    studentsToShow.sort((a, b) => {
        const aAssessment = getLatestAssessment(a.id);
        const bAssessment = getLatestAssessment(b.id);
        
        const aStatus = aAssessment ? getAssessmentStatus(aAssessment) : 'not-assessed';
        const bStatus = bAssessment ? getAssessmentStatus(bAssessment) : 'not-assessed';
        
        // Priority order: problem > risk > not-assessed > normal
        const statusPriority = { 'problem': 0, 'risk': 1, 'not-assessed': 2, 'normal': 3 };
        
        const aPriority = statusPriority[aStatus];
        const bPriority = statusPriority[bStatus];
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // Then sort by name
        return a.name.localeCompare(b.name, 'th');
    });
    
    // Clear and rebuild with animation
    container.innerHTML = '';
    
    studentsToShow.forEach((student, index) => {
        const cardElement = document.createElement('div');
        cardElement.innerHTML = createEnhancedStudentCard(student);
        cardElement.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(cardElement.firstElementChild);
    });
    
    // Trigger animation
    showProgressiveLoading('students-grid');
}

/**
 * Enhanced student card with better information
 */
function createEnhancedStudentCard(student) {
    const assessment = getLatestAssessment(student.id);
    const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
    const statusInfo = getStatusInfo(status);
    
    // Calculate days since last assessment
    let daysSinceAssessment = '';
    if (assessment && assessment.timestamp) {
        const assessmentDate = new Date(assessment.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - assessmentDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) daysSinceAssessment = 'วันนี้';
        else if (diffDays === 1) daysSinceAssessment = 'เมื่อวาน';
        else daysSinceAssessment = `${diffDays} วันที่แล้ว`;
    }
    
    return `
        <div class="student-card ${status} smooth-transition" data-student-id="${student.id}">
            <div class="p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative">
                            <i class="fas fa-user-graduate text-white text-lg"></i>
                            ${status === 'problem' ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>' : ''}
                            ${status === 'risk' ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>' : ''}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-lg">${highlightSearchTerm(student.name)}</h4>
                            <p class="text-sm text-gray-600 flex items-center">
                                <i class="fas fa-school mr-1"></i>
                                ${student.class || 'ไม่มีข้อมูลชั้น'}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="status-badge status-${status} mb-1 block">
                            <i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}
                        </span>
                        ${daysSinceAssessment ? `<p class="text-xs text-gray-500">${daysSinceAssessment}</p>` : ''}
                    </div>
                </div>
                
                ${assessment ? `
                    <div class="mb-4 bg-gray-50 rounded-lg p-3">
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-600">คะแนนรวม:</span>
                                <span class="font-semibold ${status === 'problem' ? 'text-red-600' : status === 'risk' ? 'text-yellow-600' : 'text-green-600'}">
                                    ${assessment.scores.totalDifficulties || 0}/40
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">ประเมินโดย:</span>
                                <span class="font-medium">${assessment.evaluatorName?.split(' ')[0] || 'ไม่ระบุ'}</span>
                            </div>
                        </div>
                        <div class="mt-2 grid grid-cols-3 gap-1">
                            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs text-center">
                                อารมณ์: ${assessment.scores.emotional || 0}
                            </span>
                            <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs text-center">
                                ประพฤติ: ${assessment.scores.conduct || 0}
                            </span>
                            <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs text-center">
                                สมาธิ: ${assessment.scores.hyperactivity || 0}
                            </span>
                        </div>
                    </div>
                ` : `
                    <div class="mb-4 bg-gray-50 rounded-lg p-3 text-center">
                        <i class="fas fa-clipboard-list text-gray-400 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-600 font-medium">ยังไม่ได้ประเมิน</p>
                        <p class="text-xs text-gray-500">กรุณาทำการประเมินเพื่อดูรายละเอียด</p>
                    </div>
                `}
                
                <div class="flex gap-2">
                    <button onclick="assessStudent('${student.id}')" class="btn-success flex-1 text-sm">
                        <i class="fas fa-clipboard-check mr-1"></i>
                        ${assessment ? 'ประเมินใหม่' : 'ประเมิน'}
                    </button>
                    ${assessment ? `
                        <button onclick="viewResults('${student.id}')" class="btn-secondary text-sm">
                            <i class="fas fa-eye mr-1"></i>
                            ดูผล
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================
// SMART HELPER FUNCTIONS
// ============================

/**
 * Enhanced search term highlighting with fuzzy matching
 */
function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('student-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.split('').join('.*?')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Teacher Dashboard JavaScript - Improved Part 2: Enhanced UI Functions & Smart Data Management

// ============================
// ENHANCED UTILITY FUNCTIONS
// ============================

/**
 * Enhanced SweetAlert with consistent styling
 * @param {string} message - Message to display
 * @param {string} title - Alert title
 * @param {string} icon - Alert icon
 * @param {object} options - Additional options
 */
function showAlert(message, title = "", icon = "info", options = {}) {
    const defaultOptions = {
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
        allowOutsideClick: false,
        allowEscapeKey: true,
        showCloseButton: true,
        customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-semibold',
            content: 'text-gray-600',
            confirmButton: 'rounded-lg px-6 py-2 font-medium'
        }
    };
    
    return Swal.fire({
        icon,
        title,
        text: message,
        ...defaultOptions,
        ...options
    });
}

/**
 * Enhanced success notification
 */
function showSuccess(message, title = "สำเร็จ!") {
    return showAlert(message, title, 'success', {
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

/**
 * Enhanced error notification
 */
function showError(message, title = "เกิดข้อผิดพลาด!") {
    return showAlert(message, title, 'error', {
        confirmButtonColor: '#ef4444'
    });
}

/**
 * Enhanced confirmation dialog
 */
function showConfirm(message, title = "ยืนยันการดำเนินการ", options = {}) {
    return showAlert(message, title, 'question', {
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        ...options
    });
}

// ============================
// SMART DATA MANAGEMENT
// ============================

/**
 * Enhanced student data loading with smart caching
 */
async function loadStudents() {
    try {
        performance.mark('loadStudents-start');
        showSkeletonLoading('students-grid', 6);
        showLoading(true, "กำลังโหลดข้อมูลนักเรียน...", 'data');
        
        // Check cache first
        const cacheKey = `students_${currentUser.id}_${new Date().getFullYear() + 543}`;
        let studentsData = getCache(cacheKey);
        
        if (!studentsData) {
            const response = await makeJSONPRequest('getStudentsForUser', {
                sessionId: currentSession,
                academicYear: new Date().getFullYear() + 543
            });
            
            if (response && response.success) {
                studentsData = response.students || [];
                setCache(cacheKey, studentsData, 10 * 60 * 1000); // Cache for 10 minutes
            } else {
                throw new Error(response?.message || 'Failed to load students');
            }
        }
        
        allStudents = studentsData;
        console.log(`Loaded ${allStudents.length} students`);
        
        // Smart class selector update
        await updateClassSelectorSmart();
        
        // Initialize with first available class if none selected
        if (!currentClass && allStudents.length > 0) {
            const availableClasses = getAvailableClasses();
            if (availableClasses.length > 0) {
                currentClass = availableClasses[0];
                document.getElementById('class-selector').value = currentClass;
            }
        }
        
        // Progressive data loading
        filterStudentsByClass();
        await loadIndividualAssessmentsSmart();
        
        // Update UI with animation
        updateStatisticsAnimated();
        populateStudentSelectSmart();
        displayStudentsAnimated();
        
        performance.mark('loadStudents-end');
        performance.measure('loadStudents', 'loadStudents-start', 'loadStudents-end');
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        handleError(error, 'loadStudents');
        
        // Show offline data if available
        const offlineData = getOfflineData('students');
        if (offlineData) {
            allStudents = offlineData;
            filterStudentsByClass();
            displayStudentsAnimated();
            showNotification('แสดงข้อมูลออฟไลน์', 'warning');
        }
    }
}

/**
 * Smart class selector update with user preferences
 */
async function updateClassSelectorSmart() {
    const selector = document.getElementById('class-selector');
    const availableClasses = getAvailableClasses();
    
    // Save current selection
    const currentSelection = selector.value;
    
    // Update options with animation
    selector.style.opacity = '0.5';
    
    setTimeout(() => {
        selector.innerHTML = '<option value="">ทุกชั้นเรียน</option>';
        
        availableClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            
            // Mark assigned classes
            if (currentUser.assignedClasses?.includes(className)) {
                option.textContent += ' ⭐';
            }
            
            selector.appendChild(option);
        });
        
        // Restore selection or use smart default
        if (availableClasses.includes(currentSelection)) {
            selector.value = currentSelection;
        } else if (currentUser.assignedClasses?.length > 0) {
            const firstAssigned = currentUser.assignedClasses.find(c => availableClasses.includes(c));
            if (firstAssigned) {
                selector.value = firstAssigned;
                currentClass = firstAssigned;
            }
        }
        
        selector.style.opacity = '1';
    }, 150);
}

/**
 * Get available classes with sorting
 */
function getAvailableClasses() {
    const classes = [...new Set(allStudents.map(s => s.class).filter(c => c))];
    return classes.sort((a, b) => {
        // Prioritize assigned classes
        const aAssigned = currentUser.assignedClasses?.includes(a);
        const bAssigned = currentUser.assignedClasses?.includes(b);
        
        if (aAssigned && !bAssigned) return -1;
        if (!aAssigned && bAssigned) return 1;
        
        // Then sort naturally
        return a.localeCompare(b, 'th', { numeric: true });
    });
}

/**
 * Smart individual assessments loading with batching
 */
async function loadIndividualAssessmentsSmart() {
    if (filteredStudents.length === 0) return;
    
    console.log('Loading assessments for', filteredStudents.length, 'students');
    
    // Clear existing assessments
    filteredStudents.forEach(student => {
        delete student.latestAssessment;
    });
    
    // Batch loading for better performance
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < filteredStudents.length; i += batchSize) {
        batches.push(filteredStudents.slice(i, i + batchSize));
    }
    
    let loadedCount = 0;
    
    for (const batch of batches) {
        const promises = batch.map(async (student) => {
            try {
                const cacheKey = `assessment_${student.id}`;
                let assessmentData = getCache(cacheKey);
                
                if (!assessmentData) {
                    const response = await makeJSONPRequest('getAssessmentResultsForUser', {
                        sessionId: currentSession,
                        studentId: student.id,
                        evaluatorType: 'all'
                    }, false); // Don't cache empty results
                    
                    if (response && response.success && response.data) {
                        assessmentData = response.data;
                        setCache(cacheKey, assessmentData, 5 * 60 * 1000);
                    }
                }
                
                student.latestAssessment = assessmentData;
                loadedCount++;
                
                // Update progress
                const progress = Math.round((loadedCount / filteredStudents.length) * 100);
                const loadingText = document.getElementById('loading-text');
                if (loadingText) {
                    loadingText.innerHTML = `
                        <i class="fas fa-download mr-2"></i>
                        กำลังโหลดข้อมูลการประเมิน... ${progress}%
                    `;
                }
                
            } catch (error) {
                console.error(`Failed to load assessment for student ${student.id}:`, error);
                student.latestAssessment = null;
            }
        });
        
        await Promise.all(promises);
        
        // Small delay between batches to prevent overwhelming
        if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // Update allStudents with new data
    filteredStudents.forEach(filteredStudent => {
        const studentInAll = allStudents.find(s => s.id === filteredStudent.id);
        if (studentInAll) {
            studentInAll.latestAssessment = filteredStudent.latestAssessment;
        }
    });
    
    console.log(`✅ Assessments loaded for ${loadedCount} students`);
}

// ============================
// ENHANCED UI FUNCTIONS
// ============================

/**
 * Animated statistics update
 */
function updateStatisticsAnimated() {
    const totalStudents = filteredStudents.length;
    let assessedStudents = 0;
    let riskStudents = 0;
    let problemStudents = 0;
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        if (assessment && assessment.scores) {
            assessedStudents++;
            const status = getAssessmentStatus(assessment);
            if (status === 'risk') riskStudents++;
            else if (status === 'problem') problemStudents++;
        }
    });
    
    // Animate numbers
    animateNumber('total-students', totalStudents);
    animateNumber('assessed-students', assessedStudents);
    animateNumber('risk-students', riskStudents);
    animateNumber('problem-students', problemStudents);
    
    console.log(`Statistics: Total=${totalStudents}, Assessed=${assessedStudents}, Risk=${riskStudents}, Problem=${problemStudents}`);
}

/**
 * Animate number counting
 * @param {string} elementId - Element ID
 * @param {number} targetValue - Target number
 */
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Smart student selector population
 */
function populateStudentSelectSmart() {
    const select = document.getElementById('student-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- เลือกนักเรียนที่ต้องการประเมิน --</option>';
    
    // Group students by assessment status
    const groups = {
        notAssessed: [],
        problem: [],
        risk: [],
        normal: []
    };
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
        
        if (status === 'not-assessed') groups.notAssessed.push(student);
        else if (status === 'problem') groups.problem.push(student);
        else if (status === 'risk') groups.risk.push(student);
        else groups.normal.push(student);
    });
    
    // Add grouped options
    const addGroup = (groupName, students, emoji) => {
        if (students.length === 0) return;
        
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${emoji} ${groupName} (${students.length} คน)`;
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class})`;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    };
    
    addGroup('ต้องการความสนใจ', groups.problem, '🚨');
    addGroup('เสี่ยง', groups.risk, '⚠️');
    addGroup('ยังไม่ได้ประเมิน', groups.notAssessed, '📝');
    addGroup('ปกติ', groups.normal, '✅');
}

/**
 * Enhanced animated student display
 */
function displayStudentsAnimated() {
    const container = document.getElementById('students-grid');
    const emptyState = document.getElementById('students-empty');
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    
    let studentsToShow = filteredStudents;
    
    // Smart search with multiple criteria
    if (searchTerm) {
        studentsToShow = filteredStudents.filter(student => {
            const matchName = student.name.toLowerCase().includes(searchTerm);
            const matchClass = student.class?.toLowerCase().includes(searchTerm);
            const matchId = student.id?.toLowerCase().includes(searchTerm);
            
            // Search in assessment status
            const assessment = getLatestAssessment(student.id);
            const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
            const statusInfo = getStatusInfo(status);
            const matchStatus = statusInfo.label.toLowerCase().includes(searchTerm);
            
            return matchName || matchClass || matchId || matchStatus;
        });
    }
    
    // Handle empty state
    if (studentsToShow.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-500 mb-2">
                    ${searchTerm ? 'ไม่พบผลการค้นหา' : 'ไม่พบนักเรียน'}
                </h3>
                <p class="text-gray-400">
                    ${searchTerm ? `ไม่พบนักเรียนที่ตรงกับ "${searchTerm}"` : 'ยังไม่มีนักเรียนในชั้นเรียนที่เลือก'}
                </p>
                ${searchTerm ? '<button onclick="document.getElementById(\'student-search\').value=\'\'; displayStudentsAnimated();" class="mt-4 btn-secondary">ล้างการค้นหา</button>' : ''}
            </div>
        `;
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Sort students intelligently
    studentsToShow.sort((a, b) => {
        const aAssessment = getLatestAssessment(a.id);
        const bAssessment = getLatestAssessment(b.id);
        
        const aStatus = aAssessment ? getAssessmentStatus(aAssessment) : 'not-assessed';
        const bStatus = bAssessment ? getAssessmentStatus(bAssessment) : 'not-assessed';
        
        // Priority order: problem > risk > not-assessed > normal
        const statusPriority = { 'problem': 0, 'risk': 1, 'not-assessed': 2, 'normal': 3 };
        
        const aPriority = statusPriority[aStatus];
        const bPriority = statusPriority[bStatus];
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // Then sort by name
        return a.name.localeCompare(b.name, 'th');
    });
    
    // Clear and rebuild with animation
    container.innerHTML = '';
    
    studentsToShow.forEach((student, index) => {
        const cardElement = document.createElement('div');
        cardElement.innerHTML = createEnhancedStudentCard(student);
        cardElement.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(cardElement.firstElementChild);
    });
    
    // Trigger animation
    showProgressiveLoading('students-grid');
}

/**
 * Enhanced student card with better information
 */
function createEnhancedStudentCard(student) {
    const assessment = getLatestAssessment(student.id);
    const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
    const statusInfo = getStatusInfo(status);
    
    // Calculate days since last assessment
    let daysSinceAssessment = '';
    if (assessment && assessment.timestamp) {
        const assessmentDate = new Date(assessment.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - assessmentDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) daysSinceAssessment = 'วันนี้';
        else if (diffDays === 1) daysSinceAssessment = 'เมื่อวาน';
        else daysSinceAssessment = `${diffDays} วันที่แล้ว`;
    }
    
    return `
        <div class="student-card ${status} smooth-transition" data-student-id="${student.id}">
            <div class="p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative">
                            <i class="fas fa-user-graduate text-white text-lg"></i>
                            ${status === 'problem' ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>' : ''}
                            ${status === 'risk' ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>' : ''}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-lg">${highlightSearchTerm(student.name)}</h4>
                            <p class="text-sm text-gray-600 flex items-center">
                                <i class="fas fa-school mr-1"></i>
                                ${student.class || 'ไม่มีข้อมูลชั้น'}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="status-badge status-${status} mb-1 block">
                            <i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}
                        </span>
                        ${daysSinceAssessment ? `<p class="text-xs text-gray-500">${daysSinceAssessment}</p>` : ''}
                    </div>
                </div>
                
                ${assessment ? `
                    <div class="mb-4 bg-gray-50 rounded-lg p-3">
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-600">คะแนนรวม:</span>
                                <span class="font-semibold ${status === 'problem' ? 'text-red-600' : status === 'risk' ? 'text-yellow-600' : 'text-green-600'}">
                                    ${assessment.scores.totalDifficulties || 0}/40
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">ประเมินโดย:</span>
                                <span class="font-medium">${assessment.evaluatorName?.split(' ')[0] || 'ไม่ระบุ'}</span>
                            </div>
                        </div>
                        <div class="mt-2 grid grid-cols-3 gap-1">
                            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs text-center">
                                อารมณ์: ${assessment.scores.emotional || 0}
                            </span>
                            <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs text-center">
                                ประพฤติ: ${assessment.scores.conduct || 0}
                            </span>
                            <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs text-center">
                                สมาธิ: ${assessment.scores.hyperactivity || 0}
                            </span>
                        </div>
                    </div>
                ` : `
                    <div class="mb-4 bg-gray-50 rounded-lg p-3 text-center">
                        <i class="fas fa-clipboard-list text-gray-400 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-600 font-medium">ยังไม่ได้ประเมิน</p>
                        <p class="text-xs text-gray-500">กรุณาทำการประเมินเพื่อดูรายละเอียด</p>
                    </div>
                `}
                
                <div class="flex gap-2">
                    <button onclick="assessStudent('${student.id}')" class="btn-success flex-1 text-sm">
                        <i class="fas fa-clipboard-check mr-1"></i>
                        ${assessment ? 'ประเมินใหม่' : 'ประเมิน'}
                    </button>
                    ${assessment ? `
                        <button onclick="viewResults('${student.id}')" class="btn-secondary text-sm">
                            <i class="fas fa-eye mr-1"></i>
                            ดูผล
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================
// SMART HELPER FUNCTIONS
// ============================

/**
 * Enhanced search term highlighting with fuzzy matching
 */
function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('student-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.split('').join('.*?')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Teacher Dashboard JavaScript - Improved Part 2: Enhanced UI Functions & Smart Data Management

// ============================
// ENHANCED UTILITY FUNCTIONS
// ============================

/**
 * Enhanced SweetAlert with consistent styling
 * @param {string} message - Message to display
 * @param {string} title - Alert title
 * @param {string} icon - Alert icon
 * @param {object} options - Additional options
 */
function showAlert(message, title = "", icon = "info", options = {}) {
    const defaultOptions = {
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
        allowOutsideClick: false,
        allowEscapeKey: true,
        showCloseButton: true,
        customClass: {
            popup: 'rounded-xl shadow-2xl',
            title: 'text-lg font-semibold',
            content: 'text-gray-600',
            confirmButton: 'rounded-lg px-6 py-2 font-medium'
        }
    };
    
    return Swal.fire({
        icon,
        title,
        text: message,
        ...defaultOptions,
        ...options
    });
}

/**
 * Enhanced success notification
 */
function showSuccess(message, title = "สำเร็จ!") {
    return showAlert(message, title, 'success', {
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

/**
 * Enhanced error notification
 */
function showError(message, title = "เกิดข้อผิดพลาด!") {
    return showAlert(message, title, 'error', {
        confirmButtonColor: '#ef4444'
    });
}

/**
 * Enhanced confirmation dialog
 */
function showConfirm(message, title = "ยืนยันการดำเนินการ", options = {}) {
    return showAlert(message, title, 'question', {
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        ...options
    });
}

// ============================
// SMART DATA MANAGEMENT
// ============================

/**
 * Enhanced student data loading with smart caching
 */
async function loadStudents() {
    try {
        performance.mark('loadStudents-start');
        showSkeletonLoading('students-grid', 6);
        showLoading(true, "กำลังโหลดข้อมูลนักเรียน...", 'data');
        
        // Check cache first
        const cacheKey = `students_${currentUser.id}_${new Date().getFullYear() + 543}`;
        let studentsData = getCache(cacheKey);
        
        if (!studentsData) {
            const response = await makeJSONPRequest('getStudentsForUser', {
                sessionId: currentSession,
                academicYear: new Date().getFullYear() + 543
            });
            
            if (response && response.success) {
                studentsData = response.students || [];
                setCache(cacheKey, studentsData, 10 * 60 * 1000); // Cache for 10 minutes
            } else {
                throw new Error(response?.message || 'Failed to load students');
            }
        }
        
        allStudents = studentsData;
        console.log(`Loaded ${allStudents.length} students`);
        
        // Smart class selector update
        await updateClassSelectorSmart();
        
        // Initialize with first available class if none selected
        if (!currentClass && allStudents.length > 0) {
            const availableClasses = getAvailableClasses();
            if (availableClasses.length > 0) {
                currentClass = availableClasses[0];
                document.getElementById('class-selector').value = currentClass;
            }
        }
        
        // Progressive data loading
        filterStudentsByClass();
        await loadIndividualAssessmentsSmart();
        
        // Update UI with animation
        updateStatisticsAnimated();
        populateStudentSelectSmart();
        displayStudentsAnimated();
        
        performance.mark('loadStudents-end');
        performance.measure('loadStudents', 'loadStudents-start', 'loadStudents-end');
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        handleError(error, 'loadStudents');
        
        // Show offline data if available
        const offlineData = getOfflineData('students');
        if (offlineData) {
            allStudents = offlineData;
            filterStudentsByClass();
            displayStudentsAnimated();
            showNotification('แสดงข้อมูลออฟไลน์', 'warning');
        }
    }
}

/**
 * Smart class selector update with user preferences
 */
async function updateClassSelectorSmart() {
    const selector = document.getElementById('class-selector');
    const availableClasses = getAvailableClasses();
    
    // Save current selection
    const currentSelection = selector.value;
    
    // Update options with animation
    selector.style.opacity = '0.5';
    
    setTimeout(() => {
        selector.innerHTML = '<option value="">ทุกชั้นเรียน</option>';
        
        availableClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            
            // Mark assigned classes
            if (currentUser.assignedClasses?.includes(className)) {
                option.textContent += ' ⭐';
            }
            
            selector.appendChild(option);
        });
        
        // Restore selection or use smart default
        if (availableClasses.includes(currentSelection)) {
            selector.value = currentSelection;
        } else if (currentUser.assignedClasses?.length > 0) {
            const firstAssigned = currentUser.assignedClasses.find(c => availableClasses.includes(c));
            if (firstAssigned) {
                selector.value = firstAssigned;
                currentClass = firstAssigned;
            }
        }
        
        selector.style.opacity = '1';
    }, 150);
}

/**
 * Get available classes with sorting
 */
function getAvailableClasses() {
    const classes = [...new Set(allStudents.map(s => s.class).filter(c => c))];
    return classes.sort((a, b) => {
        // Prioritize assigned classes
        const aAssigned = currentUser.assignedClasses?.includes(a);
        const bAssigned = currentUser.assignedClasses?.includes(b);
        
        if (aAssigned && !bAssigned) return -1;
        if (!aAssigned && bAssigned) return 1;
        
        // Then sort naturally
        return a.localeCompare(b, 'th', { numeric: true });
    });
}

/**
 * Smart individual assessments loading with batching
 */
async function loadIndividualAssessmentsSmart() {
    if (filteredStudents.length === 0) return;
    
    console.log('Loading assessments for', filteredStudents.length, 'students');
    
    // Clear existing assessments
    filteredStudents.forEach(student => {
        delete student.latestAssessment;
    });
    
    // Batch loading for better performance
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < filteredStudents.length; i += batchSize) {
        batches.push(filteredStudents.slice(i, i + batchSize));
    }
    
    let loadedCount = 0;
    
    for (const batch of batches) {
        const promises = batch.map(async (student) => {
            try {
                const cacheKey = `assessment_${student.id}`;
                let assessmentData = getCache(cacheKey);
                
                if (!assessmentData) {
                    const response = await makeJSONPRequest('getAssessmentResultsForUser', {
                        sessionId: currentSession,
                        studentId: student.id,
                        evaluatorType: 'all'
                    }, false); // Don't cache empty results
                    
                    if (response && response.success && response.data) {
                        assessmentData = response.data;
                        setCache(cacheKey, assessmentData, 5 * 60 * 1000);
                    }
                }
                
                student.latestAssessment = assessmentData;
                loadedCount++;
                
                // Update progress
                const progress = Math.round((loadedCount / filteredStudents.length) * 100);
                const loadingText = document.getElementById('loading-text');
                if (loadingText) {
                    loadingText.innerHTML = `
                        <i class="fas fa-download mr-2"></i>
                        กำลังโหลดข้อมูลการประเมิน... ${progress}%
                    `;
                }
                
            } catch (error) {
                console.error(`Failed to load assessment for student ${student.id}:`, error);
                student.latestAssessment = null;
            }
        });
        
        await Promise.all(promises);
        
        // Small delay between batches to prevent overwhelming
        if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // Update allStudents with new data
    filteredStudents.forEach(filteredStudent => {
        const studentInAll = allStudents.find(s => s.id === filteredStudent.id);
        if (studentInAll) {
            studentInAll.latestAssessment = filteredStudent.latestAssessment;
        }
    });
    
    console.log(`✅ Assessments loaded for ${loadedCount} students`);
}

// ============================
// ENHANCED UI FUNCTIONS
// ============================

/**
 * Animated statistics update
 */
function updateStatisticsAnimated() {
    const totalStudents = filteredStudents.length;
    let assessedStudents = 0;
    let riskStudents = 0;
    let problemStudents = 0;
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        if (assessment && assessment.scores) {
            assessedStudents++;
            const status = getAssessmentStatus(assessment);
            if (status === 'risk') riskStudents++;
            else if (status === 'problem') problemStudents++;
        }
    });
    
    // Animate numbers
    animateNumber('total-students', totalStudents);
    animateNumber('assessed-students', assessedStudents);
    animateNumber('risk-students', riskStudents);
    animateNumber('problem-students', problemStudents);
    
    console.log(`Statistics: Total=${totalStudents}, Assessed=${assessedStudents}, Risk=${riskStudents}, Problem=${problemStudents}`);
}

/**
 * Animate number counting
 * @param {string} elementId - Element ID
 * @param {number} targetValue - Target number
 */
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Smart student selector population
 */
function populateStudentSelectSmart() {
    const select = document.getElementById('student-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- เลือกนักเรียนที่ต้องการประเมิน --</option>';
    
    // Group students by assessment status
    const groups = {
        notAssessed: [],
        problem: [],
        risk: [],
        normal: []
    };
    
    filteredStudents.forEach(student => {
        const assessment = getLatestAssessment(student.id);
        const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
        
        if (status === 'not-assessed') groups.notAssessed.push(student);
        else if (status === 'problem') groups.problem.push(student);
        else if (status === 'risk') groups.risk.push(student);
        else groups.normal.push(student);
    });
    
    // Add grouped options
    const addGroup = (groupName, students, emoji) => {
        if (students.length === 0) return;
        
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${emoji} ${groupName} (${students.length} คน)`;
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class})`;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    };
    
    addGroup('ต้องการความสนใจ', groups.problem, '🚨');
    addGroup('เสี่ยง', groups.risk, '⚠️');
    addGroup('ยังไม่ได้ประเมิน', groups.notAssessed, '📝');
    addGroup('ปกติ', groups.normal, '✅');
}


function filterStudentsByClass() {
    console.log(`Filtering students by class: ${currentClass || 'ทุกชั้น'}`);
    
    if (!currentClass) {
        filteredStudents = [...allStudents];
    } else {
        filteredStudents = allStudents.filter(student => student.class === currentClass);
    }
    
    console.log(`Filtered ${filteredStudents.length} students from ${allStudents.length} total`);
    displayStudentsAnimated();
}

/**
 * Enhanced animated student display
 */
function displayStudentsAnimated() {
    const container = document.getElementById('students-grid');
    const emptyState = document.getElementById('students-empty');
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    
    let studentsToShow = filteredStudents;
    
    // Smart search with multiple criteria
    if (searchTerm) {
        studentsToShow = filteredStudents.filter(student => {
            const matchName = student.name.toLowerCase().includes(searchTerm);
            const matchClass = student.class?.toLowerCase().includes(searchTerm);
            const matchId = student.id?.toLowerCase().includes(searchTerm);
            
            // Search in assessment status
            const assessment = getLatestAssessment(student.id);
            const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
            const statusInfo = getStatusInfo(status);
            const matchStatus = statusInfo.label.toLowerCase().includes(searchTerm);
            
            return matchName || matchClass || matchId || matchStatus;
        });
    }
    
    // Handle empty state
    if (studentsToShow.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-500 mb-2">
                    ${searchTerm ? 'ไม่พบผลการค้นหา' : 'ไม่พบนักเรียน'}
                </h3>
                <p class="text-gray-400">
                    ${searchTerm ? `ไม่พบนักเรียนที่ตรงกับ "${searchTerm}"` : 'ยังไม่มีนักเรียนในชั้นเรียนที่เลือก'}
                </p>
                ${searchTerm ? '<button onclick="document.getElementById(\'student-search\').value=\'\'; displayStudentsAnimated();" class="mt-4 btn-secondary">ล้างการค้นหา</button>' : ''}
            </div>
        `;
        return;
    }
    
    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Sort students intelligently
    studentsToShow.sort((a, b) => {
        const aAssessment = getLatestAssessment(a.id);
        const bAssessment = getLatestAssessment(b.id);
        
        const aStatus = aAssessment ? getAssessmentStatus(aAssessment) : 'not-assessed';
        const bStatus = bAssessment ? getAssessmentStatus(bAssessment) : 'not-assessed';
        
        // Priority order: problem > risk > not-assessed > normal
        const statusPriority = { 'problem': 0, 'risk': 1, 'not-assessed': 2, 'normal': 3 };
        
        const aPriority = statusPriority[aStatus];
        const bPriority = statusPriority[bStatus];
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        
        // Then sort by name
        return a.name.localeCompare(b.name, 'th');
    });
    
    // Clear and rebuild with animation
    container.innerHTML = '';
    
    studentsToShow.forEach((student, index) => {
        const cardElement = document.createElement('div');
        cardElement.innerHTML = createEnhancedStudentCard(student);
        cardElement.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(cardElement.firstElementChild);
    });
    
    // Trigger animation
    showProgressiveLoading('students-grid');
}

/**
 * Enhanced student card with better information
 */
function createEnhancedStudentCard(student) {
    const assessment = getLatestAssessment(student.id);
    const status = assessment ? getAssessmentStatus(assessment) : 'not-assessed';
    const statusInfo = getStatusInfo(status);
    
    // Calculate days since last assessment
    let daysSinceAssessment = '';
    if (assessment && assessment.timestamp) {
        const assessmentDate = new Date(assessment.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - assessmentDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) daysSinceAssessment = 'วันนี้';
        else if (diffDays === 1) daysSinceAssessment = 'เมื่อวาน';
        else daysSinceAssessment = `${diffDays} วันที่แล้ว`;
    }
    
    return `
        <div class="student-card ${status} smooth-transition" data-student-id="${student.id}">
            <div class="p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative">
                            <i class="fas fa-user-graduate text-white text-lg"></i>
                            ${status === 'problem' ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>' : ''}
                            ${status === 'risk' ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>' : ''}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-lg">${highlightSearchTerm(student.name)}</h4>
                            <p class="text-sm text-gray-600 flex items-center">
                                <i class="fas fa-school mr-1"></i>
                                ${student.class || 'ไม่มีข้อมูลชั้น'}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="status-badge status-${status} mb-1 block">
                            <i class="${statusInfo.icon} mr-1"></i>${statusInfo.label}
                        </span>
                        ${daysSinceAssessment ? `<p class="text-xs text-gray-500">${daysSinceAssessment}</p>` : ''}
                    </div>
                </div>
                
                ${assessment ? `
                    <div class="mb-4 bg-gray-50 rounded-lg p-3">
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-600">คะแนนรวม:</span>
                                <span class="font-semibold ${status === 'problem' ? 'text-red-600' : status === 'risk' ? 'text-yellow-600' : 'text-green-600'}">
                                    ${assessment.scores.totalDifficulties || 0}/40
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">ประเมินโดย:</span>
                                <span class="font-medium">${assessment.evaluatorName?.split(' ')[0] || 'ไม่ระบุ'}</span>
                            </div>
                        </div>
                        <div class="mt-2 grid grid-cols-3 gap-1">
                            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs text-center">
                                อารมณ์: ${assessment.scores.emotional || 0}
                            </span>
                            <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs text-center">
                                ประพฤติ: ${assessment.scores.conduct || 0}
                            </span>
                            <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs text-center">
                                สมาธิ: ${assessment.scores.hyperactivity || 0}
                            </span>
                        </div>
                    </div>
                ` : `
                    <div class="mb-4 bg-gray-50 rounded-lg p-3 text-center">
                        <i class="fas fa-clipboard-list text-gray-400 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-600 font-medium">ยังไม่ได้ประเมิน</p>
                        <p class="text-xs text-gray-500">กรุณาทำการประเมินเพื่อดูรายละเอียด</p>
                    </div>
                `}
                
                <div class="flex gap-2">
                    <button onclick="assessStudent('${student.id}')" class="btn-success flex-1 text-sm">
                        <i class="fas fa-clipboard-check mr-1"></i>
                        ${assessment ? 'ประเมินใหม่' : 'ประเมิน'}
                    </button>
                    ${assessment ? `
                        <button onclick="viewResults('${student.id}')" class="btn-secondary text-sm">
                            <i class="fas fa-eye mr-1"></i>
                            ดูผล
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================
// SMART HELPER FUNCTIONS
// ============================

/**
 * Enhanced search term highlighting with fuzzy matching
 */
function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('student-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.split('').join('.*?')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

/**
 * Get latest assessment with caching
 */
function getLatestAssessment(studentId) {
    const filteredStudent = filteredStudents.find(s => s.id === studentId);
    if (filteredStudent && filteredStudent.latestAssessment) {
        return filteredStudent.latestAssessment;
    }
    
    const student = allStudents.find(s => s.id === studentId);
    return student ? student.latestAssessment : null;
}

/**
 * Enhanced assessment status with detailed criteria
 */
function getAssessmentStatus(assessment) {
    if (!assessment || !assessment.scores) return 'not-assessed';
    
    const totalScore = assessment.scores.totalDifficulties;
    
    // More nuanced scoring
    if (totalScore <= 11) return 'normal';
    if (totalScore <= 15) return 'risk';
    if (totalScore <= 20) return 'problem';
    return 'severe'; // For very high scores
}

/**
 * Enhanced status information
 */
function getStatusInfo(status) {
    const statusMap = {
        'normal': { label: 'ปกติ', icon: 'fas fa-check-circle', color: 'green' },
        'risk': { label: 'เสี่ยง', icon: 'fas fa-exclamation-triangle', color: 'yellow' },
        'problem': { label: 'มีปัญหา', icon: 'fas fa-exclamation-circle', color: 'red' },
        'severe': { label: 'ต้องการความช่วยเหลือ', icon: 'fas fa-heart-broken', color: 'red' },
        'not-assessed': { label: 'ยังไม่ประเมิน', icon: 'fas fa-clock', color: 'gray' }
    };
    return statusMap[status] || statusMap['not-assessed'];
}

console.log('✨ Enhanced UI functions loaded');

/**
 * Get latest assessment with caching
 */
function getLatestAssessment(studentId) {
    const filteredStudent = filteredStudents.find(s => s.id === studentId);
    if (filteredStudent && filteredStudent.latestAssessment) {
        return filteredStudent.latestAssessment;
    }
    
    const student = allStudents.find(s => s.id === studentId);
    return student ? student.latestAssessment : null;
}

/**
 * Enhanced assessment status with detailed criteria
 */
function getAssessmentStatus(assessment) {
    if (!assessment || !assessment.scores) return 'not-assessed';
    
    const totalScore = assessment.scores.totalDifficulties;
    
    // More nuanced scoring
    if (totalScore <= 11) return 'normal';
    if (totalScore <= 15) return 'risk';
    if (totalScore <= 20) return 'problem';
    return 'severe'; // For very high scores
}

/**
 * Enhanced status information
 */
function getStatusInfo(status) {
    const statusMap = {
        'normal': { label: 'ปกติ', icon: 'fas fa-check-circle', color: 'green' },
        'risk': { label: 'เสี่ยง', icon: 'fas fa-exclamation-triangle', color: 'yellow' },
        'problem': { label: 'มีปัญหา', icon: 'fas fa-exclamation-circle', color: 'red' },
        'severe': { label: 'ต้องการความช่วยเหลือ', icon: 'fas fa-heart-broken', color: 'red' },
        'not-assessed': { label: 'ยังไม่ประเมิน', icon: 'fas fa-clock', color: 'gray' }
    };
    return statusMap[status] || statusMap['not-assessed'];
}

console.log('✨ Enhanced UI functions loaded');

/**
 * Get latest assessment with caching
 */
function getLatestAssessment(studentId) {
    const filteredStudent = filteredStudents.find(s => s.id === studentId);
    if (filteredStudent && filteredStudent.latestAssessment) {
        return filteredStudent.latestAssessment;
    }
    
    const student = allStudents.find(s => s.id === studentId);
    return student ? student.latestAssessment : null;
}

/**
 * Enhanced assessment status with detailed criteria
 */
function getAssessmentStatus(assessment) {
    if (!assessment || !assessment.scores) return 'not-assessed';
    
    const totalScore = assessment.scores.totalDifficulties;
    
    // More nuanced scoring
    if (totalScore <= 11) return 'normal';
    if (totalScore <= 15) return 'risk';
    if (totalScore <= 20) return 'problem';
    return 'severe'; // For very high scores
}

/**
 * Enhanced status information
 */
function getStatusInfo(status) {
    const statusMap = {
        'normal': { label: 'ปกติ', icon: 'fas fa-check-circle', color: 'green' },
        'risk': { label: 'เสี่ยง', icon: 'fas fa-exclamation-triangle', color: 'yellow' },
        'problem': { label: 'มีปัญหา', icon: 'fas fa-exclamation-circle', color: 'red' },
        'severe': { label: 'ต้องการความช่วยเหลือ', icon: 'fas fa-heart-broken', color: 'red' },
        'not-assessed': { label: 'ยังไม่ประเมิน', icon: 'fas fa-clock', color: 'gray' }
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

console.log('✨ Enhanced UI functions loaded');
// Teacher Dashboard JavaScript - Improved Part 3: Enhanced Assessment Functions & Advanced Charts

// ============================
// ENHANCED ASSESSMENT FUNCTIONS
// ============================

/**
 * Enhanced assessment questions display with progress tracking
 * @param {string} studentId - Student ID
 */
function showAssessmentQuestions(studentId) {
    console.log('Showing enhanced assessment questions for student:', studentId);
    
    const questionsSection = document.getElementById('assessment-questions');
    const questionsContainer = document.getElementById('questions-container');
    
    if (!questionsSection || !questionsContainer) {
        console.error('Assessment elements not found');
        return false;
    }
    
    // Show section with animation
    questionsSection.classList.remove('hidden');
    questionsSection.style.opacity = '0';
    questionsSection.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        questionsSection.style.opacity = '1';
        questionsSection.style.transform = 'translateY(0)';
        questionsSection.style.transition = 'all 0.4s ease-out';
    }, 100);
    
    // Clear and rebuild
    questionsContainer.innerHTML = '';
    createEnhancedAssessmentQuestions();
    
    // Initialize assessment
    assessmentAnswers = new Array(25).fill(undefined);
    currentAssessmentStudent = studentId;
    
    // Load draft if exists
    loadExistingDraft(studentId);
    
    // Create progress tracker
    createAssessmentProgressTracker();
    
    // Smooth scroll to questions
    setTimeout(() => {
        questionsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 200);
    
    return true;
}

/**
 * Create enhanced assessment questions with better UX
 */
function createEnhancedAssessmentQuestions() {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Enhanced header with student info
    const student = allStudents.find(s => s.id === currentAssessmentStudent);
    const headerDiv = document.createElement('div');
    headerDiv.className = 'mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200';
    headerDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <h4 class="text-xl font-bold text-blue-800 mb-2">
                    <i class="fas fa-clipboard-list mr-2"></i>
                    แบบประเมินพฤติกรรม SDQ
                </h4>
                <p class="text-blue-700 mb-1">
                    <strong>นักเรียน:</strong> ${student?.name || 'ไม่ทราบชื่อ'} 
                    <span class="mx-2">|</span> 
                    <strong>ชั้น:</strong> ${student?.class || 'ไม่ทราบชั้น'}
                </p>
                <p class="text-blue-600 text-sm">
                    กรุณาเลือกคำตอบที่ตรงกับพฤติกรรมของนักเรียนในช่วง 6 เดือนที่ผ่านมา
                </p>
            </div>
            <div class="text-right">
                <div class="bg-blue-100 rounded-lg p-3">
                    <div class="text-blue-800 font-semibold">คำถามทั้งหมด</div>
                    <div class="text-2xl font-bold text-blue-900">25 ข้อ</div>
                </div>
            </div>
        </div>
        
        <!-- Auto-save indicator -->
        <div class="mt-4 flex items-center justify-between text-sm">
            <div class="flex items-center text-blue-600">
                <i class="fas fa-info-circle mr-2"></i>
                <span>คำตอบจะถูกบันทึกอัตโนมัติ</span>
            </div>
            <div id="auto-save-indicator" class="text-green-600 opacity-0 transition-opacity duration-300">
                <i class="fas fa-check-circle mr-1"></i>
                <span></span>
            </div>
        </div>
    `;
    container.appendChild(headerDiv);
    
    // Create questions with categories
    const questionCategories = [
        { start: 0, end: 4, name: 'ด้านอารมณ์และความรู้สึก', color: 'blue', icon: 'fas fa-heart' },
        { start: 5, end: 9, name: 'ด้านความประพฤติ', color: 'green', icon: 'fas fa-users' },
        { start: 10, end: 14, name: 'ด้านสมาธิและกิจกรรม', color: 'yellow', icon: 'fas fa-bolt' },
        { start: 15, end: 19, name: 'ด้านการเข้าสังคมกับเพื่อน', color: 'purple', icon: 'fas fa-handshake' },
        { start: 20, end: 24, name: 'ด้านความเข้าใจและช่วยเหลือ', color: 'pink', icon: 'fas fa-hands-helping' }
    ];
    
    questionCategories.forEach((category, categoryIndex) => {
        // Category header
        const categoryDiv = document.createElement('div');
        categoryDiv.className = `mb-6 p-4 bg-${category.color}-50 rounded-lg border border-${category.color}-200`;
        categoryDiv.innerHTML = `
            <h5 class="text-lg font-semibold text-${category.color}-800 mb-2">
                <i class="${category.icon} mr-2"></i>
                ${category.name} (ข้อ ${category.start + 1}-${category.end + 1})
            </h5>
            <div class="w-full bg-${category.color}-200 rounded-full h-2">
                <div id="category-progress-${categoryIndex}" class="bg-${category.color}-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
        `;
        container.appendChild(categoryDiv);
        
        // Questions in this category
        for (let i = category.start; i <= category.end; i++) {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item mb-4';
            questionDiv.setAttribute('data-category', categoryIndex);
            questionDiv.innerHTML = createQuestionHTML(i);
            container.appendChild(questionDiv);
        }
    });
    
    // Enhanced footer with save button
    const footerDiv = document.createElement('div');
    footerDiv.className = 'mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border';
    footerDiv.innerHTML = `
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="text-sm text-gray-600 flex items-center">
                <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
                <span>หลังจากตอบครบทุกข้อ กรุณากดปุ่ม "บันทึกการประเมิน"</span>
            </div>
            <div class="flex gap-3">
                <button id="save-draft-btn" class="btn-secondary">
                    <i class="fas fa-save mr-2"></i>บันทึกแบบร่าง
                </button>
                <button id="save-assessment-btn" class="quick-action-btn" disabled>
                    <i class="fas fa-check-circle mr-2"></i>บันทึกการประเมิน
                </button>
            </div>
        </div>
        
        <!-- Assessment summary -->
        <div id="assessment-summary" class="mt-4 p-4 bg-white rounded-lg border hidden">
            <h6 class="font-semibold text-gray-800 mb-2">สรุปการตอบ</h6>
            <div class="grid grid-cols-5 gap-2 text-xs">
                <div class="text-center">
                    <div class="text-blue-600 font-semibold">อารมณ์</div>
                    <div id="summary-emotional" class="text-lg font-bold">0/5</div>
                </div>
                <div class="text-center">
                    <div class="text-green-600 font-semibold">ประพฤติ</div>
                    <div id="summary-conduct" class="text-lg font-bold">0/5</div>
                </div>
                <div class="text-center">
                    <div class="text-yellow-600 font-semibold">สมาธิ</div>
                    <div id="summary-hyperactivity" class="text-lg font-bold">0/5</div>
                </div>
                <div class="text-center">
                    <div class="text-purple-600 font-semibold">เพื่อน</div>
                    <div id="summary-peer" class="text-lg font-bold">0/5</div>
                </div>
                <div class="text-center">
                    <div class="text-pink-600 font-semibold">สังคม</div>
                    <div id="summary-prosocial" class="text-lg font-bold">0/5</div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(footerDiv);
    
    // Add event listeners
    addEnhancedRadioEventListeners();
    addDraftSaveListener();
}

/**
 * Create individual question HTML with enhanced styling
 * @param {number} index - Question index
 */
function createQuestionHTML(index) {
    const question = SDQ_QUESTIONS[index];
    
    return `
        <div class="flex items-start space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                ${index + 1}
            </div>
            <div class="flex-1">
                <p class="text-gray-800 font-medium mb-4 leading-relaxed text-lg">${question}</p>
                <div class="radio-group">
                    ${createRadioOption(index, 0, 'ไม่จริง', 'text-gray-600', 'border-gray-300')}
                    ${createRadioOption(index, 1, 'ค่อนข้างจริง', 'text-blue-600', 'border-blue-300')}
                    ${createRadioOption(index, 2, 'จริงแน่นอน', 'text-green-600', 'border-green-300')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Create radio option with enhanced styling
 */
function createRadioOption(questionIndex, value, label, textColor, borderColor) {
    return `
        <div class="radio-item" data-question="${questionIndex}" data-value="${value}">
            <input type="radio" name="q${questionIndex}" value="${value}" class="hidden">
            <div class="flex items-center space-x-3">
                <div class="w-5 h-5 border-2 ${borderColor} rounded-full flex items-center justify-center transition-all duration-200">
                    <div class="w-3 h-3 bg-current rounded-full hidden radio-dot"></div>
                </div>
                <span class="text-sm font-medium ${textColor}">${label}</span>
            </div>
        </div>
    `;
}

/**
 * Enhanced radio button event listeners with auto-save
 */
function addEnhancedRadioEventListeners() {
    document.querySelectorAll('.radio-item').forEach(item => {
        item.addEventListener('click', function() {
            const question = parseInt(this.dataset.question);
            const value = parseInt(this.dataset.value);
            
            // Clear other selections in this question
            document.querySelectorAll(`[data-question="${question}"]`).forEach(option => {
                option.classList.remove('selected');
                option.querySelector('input').checked = false;
                option.querySelector('.radio-dot').classList.add('hidden');
            });
            
            // Select this option
            this.classList.add('selected');
            this.querySelector('input').checked = true;
            this.querySelector('.radio-dot').classList.remove('hidden');
            
            // Update answers array
            assessmentAnswers[question] = value;
            
            // Auto-save draft
            debouncedAutoSave();
            
            // Update progress
            updateEnhancedAssessmentProgress();
            
            // Update category progress
            updateCategoryProgress();
            
            // Update summary
            updateAssessmentSummary();
            
            // Check completion
            checkAssessmentCompletion();
            
            // Add completion animation
            this.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
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
 * Create assessment progress tracker
 */
function createAssessmentProgressTracker() {
    const questionsSection = document.getElementById('assessment-questions');
    
    let progressTracker = document.getElementById('assessment-progress-tracker');
    if (!progressTracker) {
        progressTracker = document.createElement('div');
        progressTracker.id = 'assessment-progress-tracker';
        progressTracker.className = 'sticky top-4 z-10 mb-6';
        
        progressTracker.innerHTML = `
            <div class="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-semibold text-gray-700">ความคืบหน้า</span>
                    <span id="progress-fraction" class="text-sm font-bold text-blue-600">0/25 ข้อ</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div id="main-progress-fill" class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <div class="mt-3 grid grid-cols-5 gap-2">
                    <div class="text-center">
                        <div class="w-full bg-blue-200 rounded-full h-2">
                            <div id="cat-progress-0" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <span class="text-xs text-gray-600 mt-1 block">อารมณ์</span>
                    </div>
                    <div class="text-center">
                        <div class="w-full bg-green-200 rounded-full h-2">
                            <div id="cat-progress-1" class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <span class="text-xs text-gray-600 mt-1 block">ประพฤติ</span>
                    </div>
                    <div class="text-center">
                        <div class="w-full bg-yellow-200 rounded-full h-2">
                            <div id="cat-progress-2" class="bg-yellow-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <span class="text-xs text-gray-600 mt-1 block">สมาธิ</span>
                    </div>
                    <div class="text-center">
                        <div class="w-full bg-purple-200 rounded-full h-2">
                            <div id="cat-progress-3" class="bg-purple-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <span class="text-xs text-gray-600 mt-1 block">เพื่อน</span>
                    </div>
                    <div class="text-center">
                        <div class="w-full bg-pink-200 rounded-full h-2">
                            <div id="cat-progress-4" class="bg-pink-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <span class="text-xs text-gray-600 mt-1 block">สังคม</span>
                    </div>
                </div>
                <div class="mt-2 text-center">
                    <span id="progress-message" class="text-xs text-gray-500">เริ่มต้นการประเมิน</span>
                </div>
            </div>
        `;
        
        questionsSection.insertBefore(progressTracker, questionsSection.firstChild);
    }
}

/**
 * Update enhanced assessment progress
 */
function updateEnhancedAssessmentProgress() {
    const answeredQuestions = assessmentAnswers.filter(answer => answer !== undefined).length;
    const progress = (answeredQuestions / 25) * 100;
    
    // Update main progress
    const progressFraction = document.getElementById('progress-fraction');
    const mainProgressFill = document.getElementById('main-progress-fill');
    const progressMessage = document.getElementById('progress-message');
    
    if (progressFraction) progressFraction.textContent = `${answeredQuestions}/25 ข้อ`;
    
    if (mainProgressFill) {
        mainProgressFill.style.width = `${progress}%`;
        
        // Change color based on progress
        if (progress === 100) {
            mainProgressFill.className = 'bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500';
        } else if (progress >= 80) {
            mainProgressFill.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500';
        } else {
            mainProgressFill.className = 'bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500';
        }
    }
    
    if (progressMessage) {
        if (progress === 100) {
            progressMessage.textContent = '✅ ตอบครบแล้ว! พร้อมบันทึก';
            progressMessage.className = 'text-xs text-green-600 font-semibold';
        } else if (progress >= 80) {
            progressMessage.textContent = `เหลืออีก ${25 - answeredQuestions} ข้อ`;
            progressMessage.className = 'text-xs text-orange-600';
        } else if (progress > 0) {
            progressMessage.textContent = `กำลังดำเนินการ... ${progress.toFixed(0)}%`;
            progressMessage.className = 'text-xs text-blue-600';
        } else {
            progressMessage.textContent = 'เริ่มต้นการประเมิน';
            progressMessage.className = 'text-xs text-gray-500';
        }
    }
}

/**
 * Update category progress
 */
function updateCategoryProgress() {
    const categories = [
        { start: 0, end: 4 },   // อารมณ์
        { start: 5, end: 9 },   // ประพฤติ
        { start: 10, end: 14 }, // สมาธิ
        { start: 15, end: 19 }, // เพื่อน
        { start: 20, end: 24 }  // สังคม
    ];
    
    categories.forEach((category, index) => {
        const answered = assessmentAnswers.slice(category.start, category.end + 1)
            .filter(answer => answer !== undefined).length;
        const progress = (answered / 5) * 100;
        
        const progressBar = document.getElementById(`cat-progress-${index}`);
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    });
}

/**
 * Update assessment summary
 */
function updateAssessmentSummary() {
    const answeredQuestions = assessmentAnswers.filter(answer => answer !== undefined).length;
    const summaryDiv = document.getElementById('assessment-summary');
    
    if (answeredQuestions >= 5 && summaryDiv) {
        summaryDiv.classList.remove('hidden');
        
        // Update category summaries
        const categories = [
            { start: 0, end: 4, id: 'summary-emotional' },
            { start: 5, end: 9, id: 'summary-conduct' },
            { start: 10, end: 14, id: 'summary-hyperactivity' },
            { start: 15, end: 19, id: 'summary-peer' },
            { start: 20, end: 24, id: 'summary-prosocial' }
        ];
        
        categories.forEach(category => {
            const answered = assessmentAnswers.slice(category.start, category.end + 1)
                .filter(answer => answer !== undefined).length;
            const element = document.getElementById(category.id);
            if (element) {
                element.textContent = `${answered}/5`;
                element.className = answered === 5 ? 'text-lg font-bold text-green-600' : 'text-lg font-bold';
            }
        });
    }
}

/**
 * Load existing draft if available
 */
function loadExistingDraft(studentId) {
    const draft = getOfflineData('assessment_draft');
    if (draft && draft.studentId === studentId && draft.answers.length > 0) {
        const shouldLoad = confirm('พบแบบร่างที่บันทึกไว้ ต้องการโหลดข้อมูลหรือไม่?');
        if (shouldLoad) {
            assessmentAnswers = [...draft.answers];
            
            // Show loading animation
            setTimeout(() => {
                restoreAssessmentAnswers();
                updateEnhancedAssessmentProgress();
                updateCategoryProgress();
                updateAssessmentSummary();
                checkAssessmentCompletion();
            }, 100);
        }
    }
}

/**
 * Add draft save listener
 */
function addDraftSaveListener() {
    const draftBtn = document.getElementById('save-draft-btn');
    if (draftBtn) {
        draftBtn.addEventListener('click', function() {
            autoSaveAssessment();
            showNotification('บันทึกแบบร่างแล้ว', 'success');
        });
    }
}

/**
 * Enhanced save assessment with validation
 */
async function saveAssessmentEnhanced() {
    if (!currentAssessmentStudent) {
        showError('กรุณาเลือกนักเรียนที่ต้องการประเมิน');
        return;
    }
    
    const answeredCount = assessmentAnswers.filter(answer => answer !== undefined).length;
    if (answeredCount !== 25) {
        const result = await showConfirm(
            `คุณตอบไปแล้ว ${answeredCount} จาก 25 ข้อ\nต้องการบันทึกแบบร่างหรือต้องการตอบให้ครบก่อน?`,
            'การประเมินยังไม่เสร็จสมบูรณ์',
            {
                confirmButtonText: 'บันทึกแบบร่าง',
                cancelButtonText: 'ตอบให้ครบก่อน'
            }
        );
        
        if (result.isConfirmed) {
            autoSaveAssessment();
            showNotification('บันทึกแบบร่างแล้ว', 'success');
        }
        return;
    }
    
    const confirmResult = await showConfirm(
        'คุณต้องการบันทึกผลการประเมินนี้หรือไม่?\nหลังจากบันทึกแล้วจะไม่สามารถแก้ไขได้',
        'ยืนยันการบันทึก'
    );
    
    if (!confirmResult.isConfirmed) return;
    
    try {
        showLoading(true, "กำลังบันทึกการประเมิน...", 'saving');
        
        const student = allStudents.find(s => s.id === currentAssessmentStudent);
        const assessmentData = {
            studentId: student.id,
            studentName: student.name,
            studentClass: student.class,
            evaluatorType: 'teacher',
            evaluatorName: currentUser.fullName,
            relation: 'ครูประจำชั้น',
            answers: assessmentAnswers,
            sessionId: currentSession,
            timestamp: new Date().toISOString()
        };
        
        const response = await makeJSONPRequest('saveAssessment', {
            data: JSON.stringify(assessmentData)
        }, false);
        
        showLoading(false);
        
        if (response && response.success) {
            // Clear draft
            localStorage.removeItem('sdq_offline_assessment_draft');
            
            // Show success with animation
            await showSuccess('บันทึกการประเมินเรียบร้อยแล้ว!', 'สำเร็จ!');
            
            // Show results
            showEnhancedAssessmentResults(response);
            
            // Clear form
            clearAssessmentForm();
            
            // Reload data
            await loadStudents();
            
        } else {
            showError(response?.message || 'ไม่สามารถบันทึกการประเมินได้');
        }
        
    } catch (error) {
        showLoading(false);
        handleError(error, 'saveAssessment');
    }
}

console.log('📋 Enhanced assessment functions loaded');
// Teacher Dashboard JavaScript - Improved Part 4: Advanced Charts, Export & Complete Initialization

// ============================
// ADVANCED CHARTS WITH LAZY LOADING
// ============================

/**
 * Lazy load charts when Reports tab is opened
 */
const chartsLoader = {
    loaded: false,
    loading: false,
    
    async loadCharts() {
        if (this.loaded || this.loading) return;
        
        this.loading = true;
        
        try {
            // Show loading state for charts
            this.showChartLoading();
            
            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Create charts with data
            await this.createAllCharts();
            
            this.loaded = true;
            this.loading = false;
            
        } catch (error) {
            console.error('Error loading charts:', error);
            this.showChartError();
            this.loading = false;
        }
    },
    
    showChartLoading() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.classList.add('loading');
            const canvas = container.querySelector('canvas');
            if (canvas) canvas.style.opacity = '0.3';
        });
    },
    
    async createAllCharts() {
        await Promise.all([
            this.createEnhancedPieChart(),
            this.createEnhancedBarChart(),
            this.createEnhancedLineChart()
        ]);
        
        // Remove loading state
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.classList.remove('loading');
            const canvas = container.querySelector('canvas');
            if (canvas) canvas.style.opacity = '1';
        });
    },
    
    showChartError() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-2 text-red-400"></i>
                    <p class="font-medium">ไม่สามารถโหลดกราฟได้</p>
                    <button onclick="chartsLoader.retryLoad()" class="mt-2 btn-secondary text-sm">
                        <i class="fas fa-redo mr-1"></i>ลองใหม่
                    </button>
                </div>
            `;
        });
    },
    
    async retryLoad() {
        this.loaded = false;
        this.loading = false;
        await this.loadCharts();
    },
    
    /**
     * Enhanced pie chart with animations and interactions
     */
    async createEnhancedPieChart() {
        const ctx = document.getElementById('assessment-pie-chart');
        if (!ctx) return;
        
        // Calculate data with detailed breakdown
        const stats = this.calculateDetailedStats();
        
        // Destroy existing chart
        if (window.pieChart) {
            window.pieChart.destroy();
        }
        
        window.pieChart = new Chart(ctx, {
            type: 'doughnut', // Changed to doughnut for modern look
            data: {
                labels: ['ปกติ', 'เสี่ยง', 'มีปัญหา', 'ยังไม่ประเมิน'],
                datasets: [{
                    data: [stats.normal, stats.risk, stats.problem, stats.notAssessed],
                    backgroundColor: [
                        '#10B981', // Green
                        '#F59E0B', // Yellow  
                        '#EF4444', // Red
                        '#6B7280'  // Gray
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 5,
                    hoverOffset: 10
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
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12, weight: '500' },
                            generateLabels: (chart) => {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                
                                labels.forEach((label, index) => {
                                    const value = chart.data.datasets[0].data[index];
                                    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    label.text = `${label.text}: ${value} คน (${percentage}%)`;
                                });
                                
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} คน (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: 20
                }
            }
        });
    },
    
    /**
     * Enhanced bar chart with gradient and animations
     */
    async createEnhancedBarChart() {
        const ctx = document.getElementById('aspects-bar-chart');
        if (!ctx) return;
        
        const stats = this.calculateAspectAverages();
        
        if (window.barChart) {
            window.barChart.destroy();
        }
        
        // Create gradients
        const gradients = stats.aspects.map((_, index) => {
            const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
            const colors = [
                ['#3B82F6', '#1D4ED8'], // Blue
                ['#10B981', '#047857'], // Green
                ['#F59E0B', '#D97706'], // Yellow
                ['#EF4444', '#DC2626'], // Red
                ['#8B5CF6', '#7C3AED']  // Purple
            ];
            gradient.addColorStop(0, colors[index][0]);
            gradient.addColorStop(1, colors[index][1]);
            return gradient;
        });
        
        window.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.labels,
                datasets: [{
                    label: 'คะแนนเฉลี่ย',
                    data: stats.averages,
                    backgroundColor: gradients,
                    borderColor: gradients,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'คะแนนเฉลี่ย',
                            font: { size: 14, weight: '600' },
                            color: '#374151'
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'ด้านการประเมิน',
                            font: { size: 14, weight: '600' },
                            color: '#374151'
                        },
                        ticks: {
                            font: { size: 11, weight: '500' },
                            color: '#374151'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                return `คะแนนเฉลี่ย: ${context.raw.toFixed(1)}/10`;
                            },
                            afterLabel: (context) => {
                                const interpretation = this.getScoreInterpretation(context.raw);
                                return `ระดับ: ${interpretation}`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: 15
                }
            }
        });
    },
    
    /**
     * Enhanced line chart with multiple datasets
     */
    async createEnhancedLineChart() {
        const ctx = document.getElementById('trend-line-chart');
        if (!ctx) return;
        
        const trendData = this.generateTrendData();
        
        if (window.lineChart) {
            window.lineChart.destroy();
        }
        
        window.lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.months,
                datasets: [
                    {
                        label: 'นักเรียนที่ประเมินแล้ว',
                        data: trendData.assessed,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'กลุ่มเสี่ยง',
                        data: trendData.risk,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#F59E0B',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'กลุ่มมีปัญหา',
                        data: trendData.problem,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#EF4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(filteredStudents.length + 5, 15),
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'จำนวนนักเรียน (คน)',
                            font: { size: 14, weight: '600' },
                            color: '#374151'
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'เดือน',
                            font: { size: 14, weight: '600' },
                            color: '#374151'
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#374151'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: { size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        multiKeyBackground: 'transparent'
                    }
                },
                animation: {
                    duration: 2500,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: 20
                }
            }
        });
    },
    
    // Helper methods for chart data
    calculateDetailedStats() {
        const total = filteredStudents.length;
        let normal = 0, risk = 0, problem = 0, notAssessed = 0;
        
        filteredStudents.forEach(student => {
            const assessment = getLatestAssessment(student.id);
            if (!assessment) {
                notAssessed++;
            } else {
                const status = getAssessmentStatus(assessment);
                if (status === 'normal') normal++;
                else if (status === 'risk') risk++;
                else problem++; // includes 'problem' and 'severe'
            }
        });
        
        return { normal, risk, problem, notAssessed, total };
    },
    
    calculateAspectAverages() {
        const aspects = ['emotional', 'conduct', 'hyperactivity', 'peerProblems', 'prosocial'];
        const labels = ['อารมณ์', 'ความประพฤติ', 'สมาธิ', 'เพื่อน', 'สังคม'];
        const averages = [];
        
        aspects.forEach(aspect => {
            const scores = [];
            filteredStudents.forEach(student => {
                const assessment = getLatestAssessment(student.id);
                if (assessment && assessment.scores && assessment.scores[aspect] !== undefined) {
                    scores.push(assessment.scores[aspect]);
                }
            });
            
            const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            averages.push(Number(average.toFixed(1)));
        });
        
        return { aspects, labels, averages };
    },
    
    generateTrendData() {
        const months = [];
        const assessed = [];
        const risk = [];
        const problem = [];
        
        // Generate last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
            months.push(monthName);
            
            if (i === 0) {
                // Current month - use real data
                const stats = this.calculateDetailedStats();
                assessed.push(stats.normal + stats.risk + stats.problem);
                risk.push(stats.risk);
                problem.push(stats.problem);
            } else {
                // Previous months - simulate data with realistic trends
                const baseAssessed = Math.max(1, Math.floor(filteredStudents.length * (0.6 + Math.random() * 0.3)));
                const baseRisk = Math.floor(baseAssessed * (0.1 + Math.random() * 0.15));
                const baseProblem = Math.floor(baseAssessed * (0.05 + Math.random() * 0.1));
                
                assessed.push(baseAssessed);
                risk.push(baseRisk);
                problem.push(baseProblem);
            }
        }
        
        return { months, assessed, risk, problem };
    },
    
    getScoreInterpretation(score) {
        if (score <= 3) return 'ปกติ';
        if (score <= 5) return 'เล็กน้อย';
        if (score <= 7) return 'ปานกลาง';
        return 'สูง';
    }
};


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
// ENHANCED EXPORT FUNCTIONS
// ============================

/**
 * Advanced export with multiple formats and options
 */
const exportManager = {
    async exportData(format = 'csv', options = {}) {
        try {
            showLoading(true, "กำลังเตรียมข้อมูลสำหรับส่งออก...", 'data');
            
            const data = this.prepareExportData(options);
            
            switch (format) {
                case 'csv':
                    await this.exportToCSV(data, options);
                    break;
                case 'excel':
                    await this.exportToExcel(data, options);
                    break;
                case 'pdf':
                    await this.exportToPDF(data, options);
                    break;
                default:
                    throw new Error('Unsupported export format');
            }
            
            showLoading(false);
            showSuccess('ส่งออกข้อมูลเรียบร้อยแล้ว');
            
        } catch (error) {
            showLoading(false);
            handleError(error, 'exportData');
        }
    },
    
    prepareExportData(options = {}) {
        const includeDetails = options.includeDetails !== false;
        const includeCharts = options.includeCharts === true;
        const selectedStudents = options.selectedStudents || filteredStudents;
        
        const exportData = selectedStudents.map((student, index) => {
            const assessment = getLatestAssessment(student.id);
            
            const baseData = {
                'ลำดับ': index + 1,
                'รหัสนักเรียน': student.id || '-',
                'ชื่อ-นามสกุล': student.name || '-',
                'ชั้นเรียน': student.class || '-',
                'สถานะการประเมิน': assessment ? 'ประเมินแล้ว' : 'ยังไม่ประเมิน'
            };
            
            if (assessment) {
                baseData['วันที่ประเมิน'] = this.formatDateForExport(assessment.timestamp);
                baseData['ผู้ประเมิน'] = assessment.evaluatorName || 'ไม่ระบุ';
                baseData['ประเภทผู้ประเมิน'] = this.getEvaluatorTypeText(assessment.evaluatorType);
                
                if (includeDetails) {
                    baseData['คะแนนด้านอารมณ์'] = assessment.scores.emotional || 0;
                    baseData['คะแนนด้านความประพฤติ'] = assessment.scores.conduct || 0;
                    baseData['คะแนนด้านสมาธิ'] = assessment.scores.hyperactivity || 0;
                    baseData['คะแนนด้านเพื่อน'] = assessment.scores.peerProblems || 0;
                    baseData['คะแนนด้านสังคม'] = assessment.scores.prosocial || 0;
                    baseData['คะแนนรวมปัญหา'] = assessment.scores.totalDifficulties || 0;
                    baseData['ผลการแปลผลรวม'] = assessment.interpretations.total || '-';
                    baseData['ข้อแนะนำ'] = this.getRecommendation(assessment);
                }
            } else {
                baseData['วันที่ประเมิน'] = '-';
                baseData['ผู้ประเมิน'] = '-';
                baseData['ประเภทผู้ประเมิน'] = '-';
                
                if (includeDetails) {
                    ['คะแนนด้านอารมณ์', 'คะแนนด้านความประพฤติ', 'คะแนนด้านสมาธิ', 
                     'คะแนนด้านเพื่อน', 'คะแนนด้านสังคม', 'คะแนนรวมปัญหา', 
                     'ผลการแปลผลรวม', 'ข้อแนะนำ'].forEach(field => {
                        baseData[field] = '-';
                    });
                }
            }
            
            return baseData;
        });
        
        return exportData;
    },
    
    async exportToCSV(data, options = {}) {
        const csvContent = '\ufeff' + this.convertToCSV(data);
        const filename = this.generateFilename('csv', options);
        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    },
    
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                let value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    },
    
    generateFilename(format, options = {}) {
        const date = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
        
        const className = currentClass || 'ทุกชั้น';
        const prefix = options.prefix || 'รายงานการประเมิน_SDQ';
        
        return `${prefix}_${className}_${date}.${format}`;
    },
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    
    formatDateForExport(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return '-';
        }
    },
    
    getEvaluatorTypeText(type) {
        const types = {
            'teacher': 'ครู',
            'parent': 'ผู้ปกครอง',
            'student': 'นักเรียน (ประเมินตนเอง)'
        };
        return types[type] || type;
    },
    
    getRecommendation(assessment) {
        if (!assessment) return '-';
        
        const status = getAssessmentStatus(assessment);
        const recommendations = {
            'normal': 'ส่งเสริมให้คงไว้ซึ่งพฤติกรรมที่ดี',
            'risk': 'ควรติดตามและให้การช่วยเหลือเพิ่มเติม',
            'problem': 'ควรได้รับการดูแลเป็นพิเศษ และพิจารณาส่งต่อผู้เชี่ยวชาญ',
            'severe': 'ต้องการการช่วยเหลือและการดูแลเป็นพิเศษอย่างเร่งด่วน'
        };
        
        return recommendations[status] || 'ควรติดตามและประเมินซ้ำ';
    }
};

// ============================
// ENHANCED INITIALIZATION
// ============================

/**
 * Complete initialization with performance monitoring
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Enhanced Teacher Dashboard...');
    performance.mark('dashboard-init-start');
    
    try {
        // 1. Authentication & User Setup
        if (!getCurrentUser()) {
            redirectToLogin();
            return;
        }
        
        if (currentUser.role !== 'TEACHER') {
            await showError('หน้านี้สำหรับครูเท่านั้น');
            window.location.href = 'index.html';
            return;
        }
        
        // 2. Initialize UI
        initializeUI();
        
        // 3. Setup Event Listeners
        setupEventListeners();
        
        // 4. Load Initial Data
        await initializeData();
        
        // 5. Setup Auto-save and Offline Support
        initializeAutoSave();
        
        // 6. Load Draft if Available
        setTimeout(() => {
            loadAssessmentDraft();
        }, 1000);
        
        performance.mark('dashboard-init-end');
        performance.measure('dashboard-initialization', 'dashboard-init-start', 'dashboard-init-end');
        
        console.log('✅ Enhanced Teacher Dashboard initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
        handleError(error, 'initialization');
    }
});

function initializeUI() {
    // Update user information
    document.getElementById('teacher-name').textContent = currentUser.fullName || currentUser.username;
    document.getElementById('school-name').textContent = currentUser.school || 'โรงเรียน';
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    // Initialize tooltips and other UI components
    initializeTooltips();
}

function setupEventListeners() {
    // Class selector with debouncing
    document.getElementById('class-selector').addEventListener('change', 
        debounce(handleClassChange, 300)
    );
    
    // Student search with debouncing
    document.getElementById('student-search').addEventListener('input', 
        debounce(displayStudentsAnimated, 200)
    );
    
    // Refresh button
    document.getElementById('refresh-students-btn').addEventListener('click', handleRefresh);
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });
    
    // Quick actions
    document.getElementById('quick-assess-btn').addEventListener('click', () => switchTab('assessment'));
    document.getElementById('view-reports-btn').addEventListener('click', () => switchTab('reports'));
    document.getElementById('export-data-btn').addEventListener('click', () => exportManager.exportData('csv'));
    
    // Assessment form
    setupAssessmentEventListeners();
    
    // Modal events
    setupModalEventListeners();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    // Window resize for charts
    window.addEventListener('resize', throttle(handleWindowResize, 250));
}

async function initializeData() {
    try {
        // Load students with caching
        await loadStudents();
        
        // Initialize charts loader
        chartsLoader.loaded = false;
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
        throw error;
    }
}

function initializeAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
        if (currentAssessmentStudent && assessmentAnswers.some(a => a !== undefined)) {
            debouncedAutoSave();
        }
    }, 30000);
}

// Event handlers
async function handleClassChange(e) {
    const newClass = e.target.value || null;
    console.log('Class changed to:', newClass);
    
    showLoading(true, "กำลังโหลดข้อมูลชั้นเรียน...", 'data');
    
    try {
        currentClass = newClass;
        filterStudentsByClass();
        await loadIndividualAssessmentsSmart();
        updateStatisticsAnimated();
        populateStudentSelectSmart();
        displayStudentsAnimated();
        
        // Reset charts if in reports tab
        if (!document.getElementById('reports-tab').classList.contains('hidden')) {
            chartsLoader.loaded = false;
            await chartsLoader.loadCharts();
        }
        
        console.log(`Loaded ${filteredStudents.length} students for class: ${currentClass || 'ทุกชั้น'}`);
        
    } catch (error) {
        console.error('Error changing class:', error);
        showError('เกิดข้อผิดพลาดในการเปลี่ยนชั้นเรียน');
    }
    
    showLoading(false);
}

async function handleRefresh() {
    const refreshBtn = document.getElementById('refresh-students-btn');
    refreshBtn.classList.add('loading');
    
    try {
        // Clear cache to force refresh
        dataCache.clear();
        await loadStudents();
        
        showNotification('รีเฟรชข้อมูลเรียบร้อยแล้ว', 'success');
        
    } catch (error) {
        handleError(error, 'refresh');
    } finally {
        refreshBtn.classList.remove('loading');
    }
}

function handleTabSwitch() {
    const tabName = this.dataset.tab;
    switchTab(tabName);
    
    // Lazy load charts when reports tab is opened
    if (tabName === 'reports') {
        setTimeout(() => {
            chartsLoader.loadCharts();
        }, 300);
    }
}

function setupAssessmentEventListeners() {
    // Student selection
    setTimeout(() => {
        const studentSelect = document.getElementById('student-select');
        if (studentSelect) {
            studentSelect.removeEventListener('change', handleStudentSelection);
            studentSelect.addEventListener('change', handleStudentSelection);
        }
    }, 1000);
    
    // Save assessment
    document.addEventListener('click', function(e) {
        if (e.target.id === 'save-assessment-btn' || e.target.closest('#save-assessment-btn')) {
            saveAssessmentEnhanced();
        }
    });
    
    // Clear assessment
    document.getElementById('clear-assessment-btn').addEventListener('click', async function() {
        const result = await showConfirm('คุณต้องการล้างข้อมูลการประเมินหรือไม่?');
        if (result.isConfirmed) {
            clearAssessmentForm();
            showNotification('ล้างฟอร์มเรียบร้อยแล้ว', 'info');
        }
    });
}

function setupModalEventListeners() {
    // Modal close buttons
    document.getElementById('close-results-btn').addEventListener('click', closeResultsModal);
    document.getElementById('close-results-modal-btn').addEventListener('click', closeResultsModal);
    document.getElementById('print-results-btn').addEventListener('click', printResults);
    
    // Close modal when clicking outside
    document.getElementById('results-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeResultsModal();
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            closeResultsModal();
        }
        
        // Ctrl/Cmd + S to save assessment
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (!document.getElementById('assessment-tab').classList.contains('hidden')) {
                saveAssessmentEnhanced();
            }
        }
        
        // Ctrl/Cmd + R to refresh (prevent default and use our refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            handleRefresh();
        }
        
        // Number keys for quick tab switching
        if (e.key >= '1' && e.key <= '4' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const tabNames = ['students', 'assessment', 'reports', 'priority'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabNames[tabIndex]) {
                switchTab(tabNames[tabIndex]);
            }
        }
    });
}

function handleWindowResize() {
    // Resize charts if they exist
    if (window.pieChart) window.pieChart.resize();
    if (window.barChart) window.barChart.resize();
    if (window.lineChart) window.lineChart.resize();
}

function initializeTooltips() {
    // Add tooltips to buttons and important elements
    const tooltipElements = [
        { id: 'refresh-students-btn', text: 'รีเฟรชข้อมูลนักเรียน (Ctrl+R)' },
        { id: 'export-data-btn', text: 'ส่งออกข้อมูลเป็นไฟล์ CSV' },
        { id: 'quick-assess-btn', text: 'ไปยังหน้าประเมินนักเรียน (Ctrl+1)' },
        { id: 'view-reports-btn', text: 'ดูรายงานและกราฟ (Ctrl+3)' }
    ];
    
    tooltipElements.forEach(({ id, text }) => {
        const element = document.getElementById(id);
        if (element) {
            element.title = text;
        }
    });
}

// ============================
// ENHANCED TAB MANAGEMENT
// ============================

/**
 * Enhanced tab switching with lazy loading
 */
function switchTab(tabName) {
    performance.mark(`tab-switch-${tabName}-start`);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(`${tabName}-tab`);
    const targetTabButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetTab) targetTab.classList.remove('hidden');
    if (targetTabButton) targetTabButton.classList.add('active');
    
    // Tab-specific loading
    switch (tabName) {
        case 'reports':
            setTimeout(() => chartsLoader.loadCharts(), 300);
            break;
        case 'priority':
            updatePriorityStudents();
            break;
        case 'students':
            displayStudentsAnimated();
            break;
        case 'assessment':
            // Scroll to student selector if no student is selected
            if (!currentAssessmentStudent) {
                setTimeout(() => {
                    document.getElementById('student-select').focus();
                }, 300);
            }
            break;
    }
    
    performance.mark(`tab-switch-${tabName}-end`);
    performance.measure(`tab-switch-${tabName}`, `tab-switch-${tabName}-start`, `tab-switch-${tabName}-end`);
}

// ============================
// ENHANCED MODAL FUNCTIONS
// ============================

/**
 * Enhanced assessment results modal
 */
function showEnhancedAssessmentResults(results) {
    const modal = document.getElementById('results-modal');
    const content = document.getElementById('results-content');
    
    // Add enhanced styling and animations
    content.innerHTML = createEnhancedResultsHTML(results);
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Add entrance animation
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 50);
}

function createEnhancedResultsHTML(results) {
    const status = getAssessmentStatus({ scores: results.scores });
    const statusInfo = getStatusInfo(status);
    
    return `
        <div class="space-y-6">
            <!-- Header with status -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-xl font-bold text-blue-800 mb-2">ข้อมูลนักเรียน</h3>
                        <div class="space-y-1 text-blue-700">
                            <p><strong>ชื่อ:</strong> ${results.studentInfo.name}</p>
                            <p><strong>ชั้น:</strong> ${results.studentInfo.class}</p>
                            <p><strong>ประเมินโดย:</strong> ${results.studentInfo.evaluatorName}</p>
                            <p><strong>วันที่ประเมิน:</strong> ${results.studentInfo.timestamp}</p>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="status-badge status-${status} text-lg px-4 py-2 mb-2">
                            <i class="${statusInfo.icon} mr-2"></i>${statusInfo.label}
                        </div>
                        <div class="text-2xl font-bold text-gray-800">${results.scores.totalDifficulties}/40</div>
                        <div class="text-sm text-gray-600">คะแนนรวม</div>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Scores Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gray-50 p-6 rounded-xl">
                    <h4 class="font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-chart-bar mr-2 text-blue-600"></i>คะแนนรายด้าน
                    </h4>
                    <div class="space-y-3">
                        ${createScoreItem('อารมณ์', results.scores.emotional, 'blue')}
                        ${createScoreItem('ความประพฤติ', results.scores.conduct, 'green')}
                        ${createScoreItem('สมาธิ', results.scores.hyperactivity, 'yellow')}
                        ${createScoreItem('เพื่อน', results.scores.peerProblems, 'red')}
                        ${createScoreItem('สังคม', results.scores.prosocial, 'purple')}
                    </div>
                    <hr class="my-4">
                    <div class="flex justify-between items-center font-bold text-lg">
                        <span>คะแนนรวมปัญหา:</span>
                        <span class="text-2xl ${status === 'problem' ? 'text-red-600' : status === 'risk' ? 'text-yellow-600' : 'text-green-600'}">
                            ${results.scores.totalDifficulties}/40
                        </span>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-6 rounded-xl">
                    <h4 class="font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-clipboard-check mr-2 text-green-600"></i>การแปลผล
                    </h4>
                    <div class="space-y-3">
                        ${createInterpretationItem('อารมณ์', results.interpretations.emotional)}
                        ${createInterpretationItem('ความประพฤติ', results.interpretations.conduct)}
                        ${createInterpretationItem('สมาธิ', results.interpretations.hyperactivity)}
                        ${createInterpretationItem('เพื่อน', results.interpretations.peerProblems)}
                        ${createInterpretationItem('สังคม', results.interpretations.prosocial)}
                    </div>
                    <hr class="my-4">
                    <div class="flex justify-between items-center font-bold">
                        <span>สรุปรวม:</span>
                        <span class="status-badge status-${getInterpretationStatus(results.interpretations.total)} text-lg px-3 py-1">
                            ${results.interpretations.total}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Recommendations -->
            ${createRecommendationSection(results.interpretations.total, status)}
        </div>
    `;
}

function createScoreItem(label, score, color) {
    const percentage = (score / 10) * 100;
    return `
        <div class="flex justify-between items-center">
            <span class="text-gray-700">${label}:</span>
            <div class="flex items-center space-x-2">
                <div class="w-20 bg-gray-200 rounded-full h-2">
                    <div class="bg-${color}-500 h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                <span class="font-semibold text-${color}-600 w-8 text-right">${score}/10</span>
            </div>
        </div>
    `;
}

function createInterpretationItem(label, interpretation) {
    const status = getInterpretationStatus(interpretation);
    return `
        <div class="flex justify-between items-center">
            <span class="text-gray-700">${label}:</span>
            <span class="status-badge status-${status} text-sm">
                ${interpretation}
            </span>
        </div>
    `;
}

function createRecommendationSection(totalInterpretation, status) {
    const isNormal = totalInterpretation === 'ปกติ';
    const bgColor = isNormal ? 'green' : status === 'risk' ? 'yellow' : 'red';
    const icon = isNormal ? 'check-circle' : 'exclamation-triangle';
    
    return `
        <div class="bg-${bgColor}-50 border border-${bgColor}-200 p-6 rounded-xl">
            <h4 class="font-bold text-${bgColor}-800 mb-3 flex items-center">
                <i class="fas fa-${icon} mr-2"></i>
                ${isNormal ? 'ผลการประเมิน' : 'ข้อแนะนำ'}
            </h4>
            <p class="text-${bgColor}-700 leading-relaxed">
                ${exportManager.getRecommendation({ scores: { totalDifficulties: 0 }, interpretations: { total: totalInterpretation } })}
            </p>
            ${!isNormal ? `
                <div class="mt-4 p-4 bg-white rounded-lg border border-${bgColor}-200">
                    <h5 class="font-semibold text-${bgColor}-800 mb-2">ขั้นตอนที่แนะนำ:</h5>
                    <ul class="text-sm text-${bgColor}-700 space-y-1">
                        <li>• สังเกตพฤติกรรมของนักเรียนอย่างใกล้ชิด</li>
                        <li>• ปรึกษาผู้ปกครองเพื่อแลกเปลี่ยนข้อมูล</li>
                        <li>• พิจารณาส่งต่อนักจิตวิทยาโรงเรียนหรือผู้เชี่ยวชาญ</li>
                        <li>• ติดตามและประเมินผลอย่างต่อเนื่อง</li>
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
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
// GLOBAL WINDOW FUNCTIONS (Updated)
// ============================

/**
 * Enhanced global functions with better error handling
 */
window.assessStudent = function(studentId) {
    try {
        const student = allStudents.find(s => s.id === studentId);
        if (!student) {
            showError('ไม่พบข้อมูลนักเรียน');
            return;
        }
        
        currentAssessmentStudent = studentId;
        document.getElementById('student-select').value = studentId;
        showAssessmentQuestions(studentId);
        switchTab('assessment');
        
        // Smooth scroll to assessment tab
        setTimeout(() => {
            document.getElementById('assessment-tab').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
        
    } catch (error) {
        handleError(error, 'assessStudent');
    }
};

window.viewResults = function(studentId) {
    try {
        const assessment = getLatestAssessment(studentId);
        
        if (!assessment) {
            showError('ไม่พบข้อมูลการประเมินสำหรับนักเรียนคนนี้');
            return;
        }
        
        // Create enhanced results object
        const enhancedResults = {
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
        };
        
        showEnhancedAssessmentResults(enhancedResults);
        
    } catch (error) {
        handleError(error, 'viewResults');
    }
};

// Enhanced modal close function
function closeResultsModal() {
    const modal = document.getElementById('results-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Add exit animation
    modalContent.style.transform = 'scale(0.9)';
    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset transform for next open
        modalContent.style.transform = 'scale(1)';
        modalContent.style.opacity = '1';
    }, 200);
}

// Enhanced print function
function printResults() {
    try {
        const printContent = document.getElementById('results-content').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ผลการประเมิน SDQ</title>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: 'Sarabun', Arial, sans-serif; 
                        margin: 20px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .status-badge { 
                        display: inline-block; 
                        padding: 4px 12px; 
                        border-radius: 6px; 
                        font-size: 12px;
                        font-weight: bold;
                        margin: 2px;
                    }
                    .status-normal { background: #dcfce7; color: #166534; }
                    .status-risk { background: #fef3c7; color: #92400e; }
                    .status-problem { background: #fef2f2; color: #dc2626; }
                    .bg-blue-50, .bg-gray-50, .bg-green-50, .bg-yellow-50, .bg-red-50 { 
                        background: #f9fafb; 
                        padding: 16px; 
                        border-radius: 8px; 
                        margin: 8px 0;
                        border: 1px solid #e5e7eb;
                    }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .space-y-6 > * + * { margin-top: 24px; }
                    .space-y-3 > * + * { margin-top: 12px; }
                    h3, h4, h5 { margin: 0 0 12px 0; color: #1f2937; }
                    hr { margin: 16px 0; border: none; border-top: 1px solid #e5e7eb; }
                    .text-2xl { font-size: 1.5rem; }
                    .font-bold { font-weight: bold; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                        .grid { grid-template-columns: 1fr; }
                    }
                </style>
            </head>
            <body>
                <h1 style="text-align: center; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">
                    ผลการประเมิน SDQ
                </h1>
                <div class="space-y-6">
                    ${printContent}
                </div>
                <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280;">
                    พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        
    } catch (error) {
        handleError(error, 'printResults');
    }
}

// Performance monitoring
setInterval(() => {
    const performanceEntries = performance.getEntriesByType('measure');
    const recentEntries = performanceEntries.slice(-5);
    
    recentEntries.forEach(entry => {
        if (entry.duration > 1000) {
            console.warn(`⚠️ Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
    });
}, 30000);

console.log('🎉 Complete Enhanced Teacher Dashboard loaded successfully!');
