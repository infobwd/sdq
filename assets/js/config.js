// Configuration for SDQ System with JSONP Support
const CONFIG = {
    // Google Apps Script Web App URL
    // ใส่ URL ของ Google Apps Script Web App ที่คุณ Deploy แล้ว
    // สำคัญ: ต้อง Deploy เป็น "Execute as: Me" และ "Who has access: Anyone"
    GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbx-rfOnx5yh_XT0Kqx4cBkiCtQKZccRfdChhLrUYQIG7HPDfW8i6GwI4mdHBB5E9H87aA/exec',
    
    // JSONP Configuration
    JSONP_TIMEOUT: 30000, // 30 seconds timeout
    MAX_RETRIES: 3, // Maximum retry attempts
    
    // API Endpoints
    ENDPOINTS: {
        GET_STUDENTS: 'getStudents',
        SAVE_ASSESSMENT: 'saveAssessment',
        GET_ASSESSMENT_RESULTS: 'getAssessmentResults',
        GET_SUMMARY_RESULTS: 'getSummaryResults',
        IMPORT_STUDENTS: 'importStudents',
        ADD_STUDENT_MANUAL: 'addStudentManual',
        TEST_CONNECTION: 'testConnection'
    },
    
    // SweetAlert2 Default Options
    SWAL_OPTIONS: {
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ตกลง',
        cancelButtonText: 'ยกเลิก',
        showCancelButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            popup: 'font-sarabun'
        }
    },
    
    // Chart.js Default Options
    CHART_OPTIONS: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        family: 'Sarabun',
                        size: 12
                    },
                    padding: 20,
                    usePointStyle: true
                }
            }
        }
    },
    
    // Loading Messages
    LOADING_MESSAGES: {
        LOADING_STUDENTS: 'กำลังโหลดรายชื่อนักเรียน...',
        SAVING_ASSESSMENT: 'กำลังบันทึกการประเมิน...',
        LOADING_RESULTS: 'กำลังโหลดผลการประเมิน...',
        LOADING_SUMMARY: 'กำลังโหลดข้อมูลสรุป...',
        IMPORTING_STUDENTS: 'กำลังนำเข้าข้อมูลนักเรียน...',
        ADDING_STUDENT: 'กำลังเพิ่มข้อมูลนักเรียน...',
        PROCESSING: 'กำลังประมวลผล...',
        CONNECTING: 'กำลังเชื่อมต่อ...',
        TESTING_CONNECTION: 'กำลังทดสอบการเชื่อมต่อ...'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        CONNECTION_FAILED: 'การเชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว',
        TIMEOUT: 'การร้องขอใช้เวลานานเกินไป',
        INVALID_RESPONSE: 'ได้รับข้อมูลที่ไม่ถูกต้องจากเซิร์ฟเวอร์',
        NETWORK_ERROR: 'เกิดข้อผิดพลาดเครือข่าย',
        PERMISSION_DENIED: 'ไม่มีสิทธิ์เข้าถึงข้อมูล'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        CONNECTION_SUCCESS: 'เชื่อมต่อสำเร็จ',
        DATA_LOADED: 'โหลดข้อมูลเรียบร้อย',
        ASSESSMENT_SAVED: 'บันทึกการประเมินเรียบร้อย',
        STUDENT_ADDED: 'เพิ่มนักเรียนเรียบร้อย',
        DATA_IMPORTED: 'นำเข้าข้อมูลเรียบร้อย'
    },
    
    // Form Validation
    VALIDATION: {
        REQUIRED_FIELDS: {
            student: ['student-name-s'],
            teacher: ['teacher-name-t', 'teacher-student-name-t'],
            parent: ['parent-name-p', 'parent-student-name-p', 'parent-relation-p']
        }
    },
    
    // Mobile Breakpoints
    BREAKPOINTS: {
        SM: 640,
        MD: 768,
        LG: 1024,
        XL: 1280
    },
    
    // Assessment Categories
    CATEGORIES: {
        emotional: {
            name: 'ด้านอารมณ์',
            color: '#f59e0b',
            questions: [0, 1, 2, 3, 4]
        },
        conduct: {
            name: 'ด้านความประพฤติ',
            color: '#ef4444',
            questions: [5, 6, 7, 8, 9]
        },
        hyperactivity: {
            name: 'ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น',
            color: '#10b981',
            questions: [10, 11, 12, 13, 14]
        },
        peer: {
            name: 'ด้านความสัมพันธ์กับเพื่อน',
            color: '#3b82f6',
            questions: [15, 16, 17, 18, 19]
        },
        prosocial: {
            name: 'ด้านสัมพันธภาพทางสังคม (จุดแข็ง)',
            color: '#8b5cf6',
            questions: [20, 21, 22, 23, 24]
        }
    },
    
    // Score Interpretation Thresholds
    THRESHOLDS: {
        emotional: { normal: 4, borderline: 5, abnormal: 6 },
        conduct: { normal: 2, borderline: 3, abnormal: 4 },
        hyperactivity: { normal: 5, borderline: 6, abnormal: 7 },
        peerProblems: { normal: 2, borderline: 3, abnormal: 4 },
        totalDifficulties: { normal: 11, borderline: 15, abnormal: 16},
        prosocial: { normal: 6, borderline: 5, abnormal: 4 }
    },
    
    // Answer Labels
    ANSWER_LABELS: ['ไม่จริง', 'จริงบางครั้ง', 'จริงแน่นอน'],
    
    // Print Settings
    PRINT: {
        PAGE_TITLE_PREFIX: 'SDQ Assessment - ',
        DATE_FORMAT: {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Bangkok'
        }
    },
    
    // Connection Settings
    CONNECTION: {
        RETRY_DELAY: 2000, // 2 seconds between retries
        HEALTH_CHECK_INTERVAL: 300000, // 5 minutes
        ENABLE_HEALTH_CHECK: true
    },
    
    // Cache Settings
    CACHE: {
        STUDENTS_TTL: 600000, // 10 minutes
        RESULTS_TTL: 300000,  // 5 minutes
        ENABLE_CACHE: true
    },
    
    // Debug Settings
    DEBUG: {
        ENABLE_LOGGING: true,
        LOG_REQUESTS: true,
        LOG_RESPONSES: true,
        SHOW_TECHNICAL_ERRORS: false // Set to true for development
    },
    
    // Auto-save Settings
    AUTO_SAVE_ENABLED: true,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    
    // Progressive Web App Settings
    PWA: {
        ENABLE_SERVICE_WORKER: true,
        CACHE_STRATEGY: 'cache-first',
        OFFLINE_FALLBACK: true
    }
};

// Set SweetAlert2 default options
if (typeof Swal !== 'undefined') {
    Swal.mixin(CONFIG.SWAL_OPTIONS);
}

// Global error handler for JSONP
window.addEventListener('error', function(e) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
        console.error('Global error:', e.error);
    }
});

// Configuration validation
(function validateConfig() {
    const requiredSettings = [
        'GAS_WEB_APP_URL',
        'ENDPOINTS',
        'CATEGORIES',
        'THRESHOLDS'
    ];
    
    const missingSettings = requiredSettings.filter(setting => !CONFIG[setting]);
    
    if (missingSettings.length > 0) {
        console.error('Missing required configuration:', missingSettings);
    }
    
    // Check if GAS_WEB_APP_URL is still placeholder
    if (CONFIG.GAS_WEB_APP_URL.includes('YOUR_SCRIPT_ID')) {
        console.warn('⚠️ กรุณาแก้ไข GAS_WEB_APP_URL ในไฟล์ config.js');
        
        // Show warning to user if in browser
        if (typeof document !== 'undefined') {
            setTimeout(() => {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'การตั้งค่าไม่สมบูรณ์',
                        html: `
                            <p>กรุณาแก้ไข <code>GAS_WEB_APP_URL</code> ในไฟล์ <code>config.js</code></p>
                            <p class="text-sm text-gray-600 mt-2">ใส่ URL ของ Google Apps Script Web App ที่ Deploy แล้ว</p>
                        `,
                        confirmButtonText: 'เข้าใจแล้ว'
                    });
                }
            }, 2000);
        }
    }
})();

// Export for Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Freeze configuration to prevent accidental modifications
if (typeof Object.freeze === 'function') {
    Object.freeze(CONFIG);
}
