// Admin Dashboard Configuration
// ===============================

// Main Configuration Object
const CONFIG = {
    // Google Apps Script Configuration
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxPaR53rVdlRUT9Z-UthI5lgR6jFttgmtryBR9NKLNz_KMH7My6DV-HMlSzptQpKU4sfg/exec', // ⚠️ ใส่ URL ของ Apps Script
    
    // API Configuration
    API: {
        TIMEOUT: 30000,         // 30 seconds timeout
        RETRY_ATTEMPTS: 3,      // Number of retry attempts
        RETRY_DELAY: 1000,      // Initial retry delay in milliseconds
        MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB max file size
        ALLOWED_FILE_TYPES: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'application/pdf'
        ]
    },
    
    // UI Configuration
    UI: {
        ITEMS_PER_PAGE: 25,     // Default items per page
        MAX_ITEMS_PER_PAGE: 100, // Maximum items per page
        AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes auto refresh
        ANIMATION_DURATION: 300,  // Animation duration in milliseconds
        DEBOUNCE_DELAY: 300,     // Debounce delay for search
        TOAST_DURATION: 3000,    // Toast notification duration
        
        // Table Configuration
        TABLE: {
            SORTABLE_COLUMNS: ['ID', 'Name', 'Phone', 'Amount', 'CreatedAt'],
            DEFAULT_SORT: 'CreatedAt',
            DEFAULT_SORT_ORDER: 'desc'
        },
        
        // Modal Configuration
        MODAL: {
            ANIMATION_DURATION: 300,
            BACKDROP_BLUR: true,
            CLOSE_ON_BACKDROP_CLICK: true,
            CLOSE_ON_ESCAPE: true
        }
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_BULK_ACTIONS: true,
        ENABLE_EXPORT: true,
        ENABLE_PRINT: true,
        ENABLE_BACKUP: true,
        ENABLE_SEARCH: true,
        ENABLE_FILTERS: true,
        ENABLE_PAGINATION: true,
        ENABLE_SORTING: true,
        ENABLE_AUTO_REFRESH: true,
        ENABLE_TOAST_NOTIFICATIONS: true,
        ENABLE_DARK_MODE: false, // Not implemented yet
        ENABLE_OFFLINE_MODE: false // Not implemented yet
    },
    
    // Validation Rules
    VALIDATION: {
        NAME: {
            MIN_LENGTH: 2,
            MAX_LENGTH: 100,
            REQUIRED: true
        },
        PHONE: {
            MIN_LENGTH: 10,
            MAX_LENGTH: 15,
            PATTERN: /^[0-9\-\+\(\)\s]+$/,
            REQUIRED: true
        },
        EMAIL: {
            PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            REQUIRED: false
        },
        AMOUNT: {
            MIN_VALUE: 0,
            MAX_VALUE: 999999999,
            REQUIRED: true
        },
        TOTAL_SEATS: {
            MIN_VALUE: 1,
            MAX_VALUE: 1000,
            REQUIRED: true
        },
        TABLES: {
            MAX_ITEMS: 100,
            REQUIRED: false
        }
    },
    
    // Status Configuration
    STATUS: {
        TYPES: {
            SUCCESS: 'success',
            PENDING: 'pending',
            ERROR: 'error'
        },
        LABELS: {
            SUCCESS: 'สำเร็จ',
            PENDING: 'รอดำเนินการ',
            ERROR: 'ผิดพลาด'
        },
        COLORS: {
            SUCCESS: '#10b981',
            PENDING: '#f59e0b',
            ERROR: '#ef4444'
        }
    },
    
    // Date/Time Configuration
    DATETIME: {
        FORMAT: {
            DATE: 'th-TH',
            TIME: '24-hour',
            FULL: 'dd/MM/yyyy HH:mm'
        },
        TIMEZONE: 'Asia/Bangkok'
    },
    
    // Export Configuration
    EXPORT: {
        FORMATS: ['csv', 'json'],
        DEFAULT_FORMAT: 'csv',
        FILENAME_PREFIX: 'booking_data_',
        INCLUDE_HEADERS: true,
        DATE_FORMAT: 'YYYY-MM-DD'
    },
    
    // Print Configuration
    PRINT: {
        PAPER_SIZE: 'A4',
        ORIENTATION: 'portrait',
        MARGINS: '20mm',
        INCLUDE_LOGO: true,
        INCLUDE_TIMESTAMP: true
    },
    
    // Cache Configuration
    CACHE: {
        ENABLED: true,
        TTL: 5 * 60 * 1000, // 5 minutes cache TTL
        MAX_SIZE: 100,       // Maximum cache entries
        KEYS: {
            BOOKINGS: 'bookings',
            STATS: 'stats',
            FILTERS: 'filters'
        }
    },
    
    // Error Messages
    MESSAGES: {
        ERROR: {
            NETWORK: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
            TIMEOUT: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง',
            UNAUTHORIZED: 'ไม่มีสิทธิ์เข้าถึงข้อมูล',
            NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
            VALIDATION: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
            FILE_TOO_LARGE: 'ขนาดไฟล์เกินกำหนด',
            FILE_TYPE_NOT_ALLOWED: 'ประเภทไฟล์ไม่รองรับ',
            GENERIC: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
        },
        SUCCESS: {
            CREATE: 'เพิ่มข้อมูลสำเร็จ',
            UPDATE: 'อัปเดตข้อมูลสำเร็จ',
            DELETE: 'ลบข้อมูลสำเร็จ',
            EXPORT: 'ส่งออกข้อมูลสำเร็จ',
            BACKUP: 'สำรองข้อมูลสำเร็จ',
            GENERIC: 'ดำเนินการสำเร็จ'
        },
        LOADING: {
            GENERIC: 'กำลังโหลด...',
            SAVING: 'กำลังบันทึก...',
            DELETING: 'กำลังลบ...',
            EXPORTING: 'กำลังส่งออก...',
            PRINTING: 'กำลังเตรียมการพิมพ์...'
        }
    },
    
    // Keyboard Shortcuts
    SHORTCUTS: {
        REFRESH: 'F5',
        ADD_NEW: 'Ctrl+N',
        SEARCH: 'Ctrl+F',
        EXPORT: 'Ctrl+E',
        PRINT: 'Ctrl+P',
        SAVE: 'Ctrl+S',
        CANCEL: 'Escape'
    },
    
    // Theme Configuration
    THEME: {
        PRIMARY_COLOR: '#3b82f6',
        SECONDARY_COLOR: '#6b7280',
        SUCCESS_COLOR: '#10b981',
        WARNING_COLOR: '#f59e0b',
        ERROR_COLOR: '#ef4444',
        INFO_COLOR: '#06b6d4',
        
        // Font Configuration
        FONT_FAMILY: 'Kanit',
        FONT_SIZES: {
            SMALL: '12px',
            NORMAL: '14px',
            MEDIUM: '16px',
            LARGE: '18px',
            XLARGE: '20px'
        }
    },
    
    // Security Configuration
    SECURITY: {
        ENABLE_CSRF_PROTECTION: false, // Not implemented yet
        ENABLE_XSS_PROTECTION: true,
        SANITIZE_INPUT: true,
        ENCRYPT_SENSITIVE_DATA: false // Not implemented yet
    },
    
    // Development Configuration
    DEV: {
        ENABLE_DEBUG: false,
        ENABLE_CONSOLE_LOGS: true,
        ENABLE_PERFORMANCE_MONITORING: false,
        MOCK_API_RESPONSES: false,
        SIMULATE_SLOW_NETWORK: false
    }
};

// Environment Detection
const ENVIRONMENT = {
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_PRODUCTION: window.location.protocol === 'https:' && !window.location.hostname.includes('localhost'),
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    IS_TABLET: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
    IS_DESKTOP: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
};

// Browser Feature Detection
const BROWSER_SUPPORT = {
    FETCH: typeof fetch !== 'undefined',
    LOCAL_STORAGE: typeof localStorage !== 'undefined',
    SESSION_STORAGE: typeof sessionStorage !== 'undefined',
    FILE_API: typeof FileReader !== 'undefined',
    DRAG_DROP: 'draggable' in document.createElement('div'),
    TOUCH_EVENTS: 'ontouchstart' in window,
    NOTIFICATIONS: 'Notification' in window,
    SERVICE_WORKER: 'serviceWorker' in navigator
};

// Utility Functions for Configuration
const ConfigUtils = {
    /**
     * Get configuration value with fallback
     * @param {string} path - Dot notation path (e.g., 'API.TIMEOUT')
     * @param {any} fallback - Fallback value if path not found
     * @returns {any} Configuration value or fallback
     */
    get(path, fallback = null) {
        const keys = path.split('.');
        let current = CONFIG;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return fallback;
            }
        }
        
        return current;
    },
    
    /**
     * Set configuration value
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = CONFIG;
        
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    },
    
    /**
     * Merge configuration with custom config
     * @param {object} customConfig - Custom configuration object
     */
    merge(customConfig) {
        Object.assign(CONFIG, customConfig);
    },
    
    /**
     * Validate configuration
     * @returns {boolean} True if configuration is valid
     */
    validate() {
        const errors = [];
        
        // Validate required fields
        if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            errors.push('APPS_SCRIPT_URL is required and must be updated');
        }
        
        if (CONFIG.API.TIMEOUT <= 0) {
            errors.push('API.TIMEOUT must be greater than 0');
        }
        
        if (CONFIG.UI.ITEMS_PER_PAGE <= 0) {
            errors.push('UI.ITEMS_PER_PAGE must be greater than 0');
        }
        
        if (errors.length > 0) {
            console.error('Configuration validation errors:', errors);
            return false;
        }
        
        return true;
    },
    
    /**
     * Get environment-specific configuration
     * @returns {object} Environment configuration
     */
    getEnvironmentConfig() {
        const baseConfig = { ...CONFIG };
        
        if (ENVIRONMENT.IS_DEVELOPMENT) {
            baseConfig.DEV.ENABLE_DEBUG = true;
            baseConfig.DEV.ENABLE_CONSOLE_LOGS = true;
        }
        
        if (ENVIRONMENT.IS_MOBILE) {
            baseConfig.UI.ITEMS_PER_PAGE = 10;
            baseConfig.UI.ANIMATION_DURATION = 200;
            baseConfig.UI.MODAL.ANIMATION_DURATION = 200;
        }
        
        return baseConfig;
    },
    
    /**
     * Export configuration for debugging
     * @returns {string} JSON string of configuration
     */
    export() {
        return JSON.stringify(CONFIG, null, 2);
    },
    
    /**
     * Import configuration from JSON string
     * @param {string} jsonString - JSON configuration string
     */
    import(jsonString) {
        try {
            const importedConfig = JSON.parse(jsonString);
            this.merge(importedConfig);
            return true;
        } catch (error) {
            console.error('Failed to import configuration:', error);
            return false;
        }
    }
};

// Default Column Configuration for Table
const TABLE_COLUMNS = [
    {
        key: 'ID',
        label: 'ID',
        sortable: true,
        width: '100px',
        align: 'left'
    },
    {
        key: 'Name',
        label: 'ชื่อ',
        sortable: true,
        width: '150px',
        align: 'left'
    },
    {
        key: 'Phone',
        label: 'โทรศัพท์',
        sortable: true,
        width: '120px',
        align: 'left'
    },
    {
        key: 'Amount',
        label: 'จำนวนเงิน',
        sortable: true,
        width: '100px',
        align: 'right',
        format: 'currency'
    },
    {
        key: 'Tables',
        label: 'โต๊ะ',
        sortable: false,
        width: '100px',
        align: 'left',
        format: 'array'
    },
    {
        key: 'TotalSeats',
        label: 'ที่นั่ง',
        sortable: false,
        width: '80px',
        align: 'right',
        format: 'number'
    },
    {
        key: 'CreatedAt',
        label: 'วันที่',
        sortable: true,
        width: '120px',
        align: 'left',
        format: 'datetime'
    },
    {
        key: 'Status',
        label: 'สถานะ',
        sortable: false,
        width: '80px',
        align: 'center',
        format: 'status'
    },
    {
        key: 'Actions',
        label: 'การดำเนินการ',
        sortable: false,
        width: '120px',
        align: 'center',
        format: 'actions'
    }
];

// Filter Configuration
const FILTER_CONFIG = {
    status: {
        type: 'select',
        label: 'สถานะ',
        options: [
            { value: '', label: 'ทั้งหมด' },
            { value: 'success', label: 'สำเร็จ' },
            { value: 'pending', label: 'รอดำเนินการ' },
            { value: 'error', label: 'ผิดพลาด' }
        ],
        default: ''
    },
    dateRange: {
        type: 'select',
        label: 'ช่วงวันที่',
        options: [
            { value: '', label: 'ทุกวัน' },
            { value: 'today', label: 'วันนี้' },
            { value: 'week', label: 'สัปดาห์นี้' },
            { value: 'month', label: 'เดือนนี้' },
            { value: 'year', label: 'ปีนี้' }
        ],
        default: ''
    },
    amountRange: {
        type: 'range',
        label: 'ช่วงจำนวนเงิน',
        min: 0,
        max: 999999,
        step: 100,
        default: { min: 0, max: 999999 }
    }
};

// Action Buttons Configuration
const ACTION_BUTTONS = [
    {
        key: 'view',
        label: 'ดูรายละเอียด',
        icon: '👁️',
        className: 'action-btn view',
        permission: 'read'
    },
    {
        key: 'edit',
        label: 'แก้ไข',
        icon: '✏️',
        className: 'action-btn edit',
        permission: 'update'
    },
    {
        key: 'delete',
        label: 'ลบ',
        icon: '🗑️',
        className: 'action-btn delete',
        permission: 'delete'
    },
    {
        key: 'duplicate',
        label: 'ทำซ้ำ',
        icon: '📋',
        className: 'action-btn duplicate',
        permission: 'create',
        enabled: false // Disabled by default
    }
];

// Notification Templates
const NOTIFICATION_TEMPLATES = {
    success: {
        title: 'สำเร็จ',
        icon: '✅',
        duration: 3000,
        position: 'top-right'
    },
    error: {
        title: 'ข้อผิดพลาด',
        icon: '❌',
        duration: 5000,
        position: 'top-right'
    },
    warning: {
        title: 'คำเตือน',
        icon: '⚠️',
        duration: 4000,
        position: 'top-right'
    },
    info: {
        title: 'ข้อมูล',
        icon: 'ℹ️',
        duration: 3000,
        position: 'top-right'
    }
};

// API Endpoints Configuration
const API_ENDPOINTS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    STATS: 'getStats',
    EXPORT: 'export',
    BACKUP: 'backup',
    HEALTH_CHECK: 'healthCheck'
};

// Permission System Configuration
const PERMISSIONS = {
    ADMIN: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        backup: true,
        bulk_actions: true
    },
    EDITOR: {
        create: true,
        read: true,
        update: true,
        delete: false,
        export: true,
        backup: false,
        bulk_actions: false
    },
    VIEWER: {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: true,
        backup: false,
        bulk_actions: false
    }
};

// Current User Configuration (default to ADMIN)
const CURRENT_USER = {
    role: 'ADMIN',
    permissions: PERMISSIONS.ADMIN,
    name: 'Admin User',
    email: 'admin@example.com'
};

// Validation Rules Functions
const VALIDATION_RULES = {
    required: (value, message = 'ฟิลด์นี้จำเป็นต้องกรอก') => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return message;
        }
        return null;
    },
    
    minLength: (value, min, message = `ต้องมีความยาวอย่างน้อย ${min} ตัวอักษร`) => {
        if (value && value.length < min) {
            return message;
        }
        return null;
    },
    
    maxLength: (value, max, message = `ความยาวต้องไม่เกิน ${max} ตัวอักษร`) => {
        if (value && value.length > max) {
            return message;
        }
        return null;
    },
    
    pattern: (value, pattern, message = 'รูปแบบไม่ถูกต้อง') => {
        if (value && !pattern.test(value)) {
            return message;
        }
        return null;
    },
    
    email: (value, message = 'รูปแบบอีเมลไม่ถูกต้อง') => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return message;
        }
        return null;
    },
    
    phone: (value, message = 'รูปแบบเบอร์โทรไม่ถูกต้อง') => {
        if (value && !/^[0-9\-\+\(\)\s]+$/.test(value)) {
            return message;
        }
        return null;
    },
    
    number: (value, message = 'ต้องเป็นตัวเลขเท่านั้น') => {
        if (value && isNaN(Number(value))) {
            return message;
        }
        return null;
    },
    
    min: (value, min, message = `ค่าต้องไม่น้อยกว่า ${min}`) => {
        if (value && Number(value) < min) {
            return message;
        }
        return null;
    },
    
    max: (value, max, message = `ค่าต้องไม่เกิน ${max}`) => {
        if (value && Number(value) > max) {
            return message;
        }
        return null;
    }
};

// Initialize Configuration
(function initializeConfig() {
    // Validate configuration on load
    if (!ConfigUtils.validate()) {
        console.warn('Configuration validation failed. Please check the configuration.');
    }
    
    // Apply environment-specific configuration
    const envConfig = ConfigUtils.getEnvironmentConfig();
    ConfigUtils.merge(envConfig);
    
    // Log configuration status
    if (CONFIG.DEV.ENABLE_CONSOLE_LOGS) {
        console.log('📝 Configuration loaded:', {
            environment: ENVIRONMENT,
            browserSupport: BROWSER_SUPPORT,
            features: CONFIG.FEATURES,
            version: '1.0.0'
        });
    }
})();

// Export for global usage
window.CONFIG = CONFIG;
window.ENVIRONMENT = ENVIRONMENT;
window.BROWSER_SUPPORT = BROWSER_SUPPORT;
window.ConfigUtils = ConfigUtils;
window.TABLE_COLUMNS = TABLE_COLUMNS;
window.FILTER_CONFIG = FILTER_CONFIG;
window.ACTION_BUTTONS = ACTION_BUTTONS;
window.NOTIFICATION_TEMPLATES = NOTIFICATION_TEMPLATES;
window.API_ENDPOINTS = API_ENDPOINTS;
window.PERMISSIONS = PERMISSIONS;
window.CURRENT_USER = CURRENT_USER;
window.VALIDATION_RULES = VALIDATION_RULES;

console.log('⚙️ Admin Configuration loaded successfully!');
