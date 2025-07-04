/**
 * Utility Functions for SDQ System with JSONP Support
 */

class Utils {
    /**
     * Show loading overlay with custom message
     * @param {boolean} show - Whether to show or hide loading
     * @param {string} message - Loading message
     */
    static showLoading(show = true, message = CONFIG.LOADING_MESSAGES.PROCESSING) {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        
        if (text && message) {
            text.textContent = message;
        }
        
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show success message using SweetAlert2
     * @param {string} title - Alert title
     * @param {string} text - Alert text
     */
    static showSuccess(title, text = '') {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: text,
            confirmButtonColor: CONFIG.SWAL_OPTIONS.confirmButtonColor,
            confirmButtonText: CONFIG.SWAL_OPTIONS.confirmButtonText
        });
    }

    /**
     * Show error message using SweetAlert2
     * @param {string} title - Alert title
     * @param {string} text - Alert text
     */
    static showError(title, text = '') {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: text,
            confirmButtonColor: CONFIG.SWAL_OPTIONS.confirmButtonColor,
            confirmButtonText: CONFIG.SWAL_OPTIONS.confirmButtonText
        });
    }

    /**
     * Show confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} text - Dialog text
     * @param {string} confirmText - Confirm button text
     * @param {string} cancelText - Cancel button text
     */
    static showConfirm(title, text = '', confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') {
        return Swal.fire({
            icon: 'question',
            title: title,
            text: text,
            showCancelButton: true,
            confirmButtonColor: CONFIG.SWAL_OPTIONS.confirmButtonColor,
            cancelButtonColor: CONFIG.SWAL_OPTIONS.cancelButtonColor,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText
        });
    }

    /**
     * Show warning message
     * @param {string} title - Alert title
     * @param {string} text - Alert text
     */
    static showWarning(title, text = '') {
        return Swal.fire({
            icon: 'warning',
            title: title,
            text: text,
            confirmButtonColor: CONFIG.SWAL_OPTIONS.confirmButtonColor,
            confirmButtonText: CONFIG.SWAL_OPTIONS.confirmButtonText
        });
    }

    /**
     * Show info message
     * @param {string} title - Alert title
     * @param {string} text - Alert text
     */
    static showInfo(title, text = '') {
        return Swal.fire({
            icon: 'info',
            title: title,
            text: text,
            confirmButtonColor: CONFIG.SWAL_OPTIONS.confirmButtonColor,
            confirmButtonText: CONFIG.SWAL_OPTIONS.confirmButtonText
        });
    }

    /**
     * Make JSONP request to Google Apps Script (solves CORS issues)
     * @param {string} action - Action name
     * @param {Object} data - Data to send
     * @returns {Promise} Response promise
     */
    static makeRequest(action, data = {}) {
        return new Promise((resolve, reject) => {
            try {
                // Generate unique callback name
                const callbackName = 'jsonp_callback_' + Math.random().toString(36).substr(2, 9);
                
                // Prepare request data
                const requestData = {
                    action: action,
                    callback: callbackName,
                    ...data
                };

                // Create callback function
                window[callbackName] = function(response) {
                    // Clean up
                    delete window[callbackName];
                    document.head.removeChild(script);
                    
                    // Resolve with response
                    resolve(response);
                };

                // Build URL with parameters
                const params = new URLSearchParams();
                Object.keys(requestData).forEach(key => {
                    if (typeof requestData[key] === 'object') {
                        params.append(key, JSON.stringify(requestData[key]));
                    } else {
                        params.append(key, requestData[key]);
                    }
                });

                const url = `${CONFIG.GAS_WEB_APP_URL}?${params.toString()}`;

                // Create script element for JSONP
                const script = document.createElement('script');
                script.src = url;
                
                // Handle errors
                script.onerror = function() {
                    delete window[callbackName];
                    document.head.removeChild(script);
                    reject(new Error('การเชื่อมต่อกับเซิร์ฟเวอร์ล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
                };

                // Set timeout
                const timeout = setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        document.head.removeChild(script);
                        reject(new Error('การร้องขอใช้เวลานานเกินไป กรุณาลองอีกครั้ง'));
                    }
                }, 30000); // 30 seconds timeout

                // Clear timeout when callback is called
                const originalCallback = window[callbackName];
                window[callbackName] = function(response) {
                    clearTimeout(timeout);
                    originalCallback(response);
                };

                // Add script to head to trigger request
                document.head.appendChild(script);

            } catch (error) {
                console.error('JSONP request failed:', error);
                reject(new Error('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message));
            }
        });
    }

    /**
     * Fallback function for non-JSONP requests (if needed)
     * @param {string} action - Action name
     * @param {Object} data - Data to send
     * @returns {Promise} Response promise
     */
    static async makePostRequest(action, data = {}) {
        try {
            const requestData = {
                action: action,
                ...data
            };

            const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }

    /**
     * Format date to Thai format
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    static formatDate(date = new Date()) {
        return date.toLocaleDateString('th-TH', CONFIG.PRINT.DATE_FORMAT);
    }

    /**
     * Get current screen size category
     * @returns {string} Screen size category (sm, md, lg, xl)
     */
    static getScreenSize() {
        const width = window.innerWidth;
        if (width < CONFIG.BREAKPOINTS.SM) return 'xs';
        if (width < CONFIG.BREAKPOINTS.MD) return 'sm';
        if (width < CONFIG.BREAKPOINTS.LG) return 'md';
        if (width < CONFIG.BREAKPOINTS.XL) return 'lg';
        return 'xl';
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return window.innerWidth < CONFIG.BREAKPOINTS.MD;
    }

    /**
     * Validate required fields in a form
     * @param {string} formType - Type of form (student, teacher, parent)
     * @returns {Object} Validation result
     */
    static validateForm(formType) {
        const requiredFields = CONFIG.VALIDATION.REQUIRED_FIELDS[formType] || [];
        const missing = [];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                missing.push(fieldId);
            }
        }

        return {
            isValid: missing.length === 0,
            missingFields: missing
        };
    }

    /**
     * Get selected student data from dropdown
     * @param {string} selectElementId - ID of select element
     * @returns {Object|null} Student data or null
     */
    static getSelectedStudentData(selectElementId) {
        const select = document.getElementById(selectElementId);
        if (select && select.value) {
            const selectedOption = select.options[select.selectedIndex];
            return {
                id: select.value,
                name: selectedOption.dataset.name,
                class: selectedOption.dataset.class
            };
        }
        return null;
    }

    /**
     * Get interpretation class for styling
     * @param {string} interpretationText - Interpretation text
     * @returns {string} CSS class name
     */
    static getInterpretationClass(interpretationText) {
        if (!interpretationText) return 'text-gray-500';
        
        const interpretation = interpretationText.toLowerCase();
        if (interpretation.includes('เสี่ยง')) return 'text-yellow-600 font-semibold';
        if (interpretation.includes('มีปัญหา')) return 'text-red-600 font-semibold';
        if (interpretation.includes('ปกติ') || interpretation.includes('จุดแข็ง')) {
            return 'text-green-600 font-semibold';
        }
        return 'text-gray-700';
    }

    /**
     * Sort classes in logical order
     * @param {string} className - Class name to sort
     * @returns {number} Sort value
     */
    static getClassSortValue(className) {
        if (!className || typeof className !== 'string') return 99999;
        
        let level = 9;
        let grade = 0;
        let room = 0;
        
        if (className.includes('อนุบาล') || className.startsWith('อ.')) level = 1;
        else if (className.includes('ประถม') || className.startsWith('ป.')) level = 2;
        else if (className.includes('มัธยม') || className.startsWith('ม.')) level = 3;
        
        const match = className.match(/(\d+)\/?(\d*)/);
        if (match) {
            grade = parseInt(match[1] || 0);
            room = parseInt(match[2] || 0);
        }
        
        return (level * 10000) + (grade * 100) + room;
    }

    /**
     * Sort students array
     * @param {Array} students - Array of student objects
     * @returns {Array} Sorted students array
     */
    static sortStudents(students) {
        return students.sort((a, b) => {
            const classA_value = this.getClassSortValue(a.class);
            const classB_value = this.getClassSortValue(b.class);
            if (classA_value !== classB_value) return classA_value - classB_value;
            return (a.name || "").localeCompare(b.name || "", 'th');
        });
    }

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Print page with custom title
     * @param {string} newTitle - New page title for printing
     */
    static printWithTitle(newTitle) {
        const originalTitle = document.title;
        document.title = CONFIG.PRINT.PAGE_TITLE_PREFIX + newTitle;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    }

    /**
     * Download data as JSON file
     * @param {Object} data - Data to download
     * @param {string} filename - Filename
     */
    static downloadJSON(data, filename = 'sdq_data.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @returns {boolean} True if in viewport
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Smooth scroll to element
     * @param {string|Element} target - Target element or selector
     * @param {number} offset - Offset from top
     */
    static scrollToElement(target, offset = 0) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Add fade-in animation to element
     * @param {Element} element - Element to animate
     */
    static fadeIn(element) {
        if (element) {
            element.classList.add('fade-in');
            setTimeout(() => {
                element.classList.remove('fade-in');
            }, 300);
        }
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Check if object is empty
     * @param {Object} obj - Object to check
     * @returns {boolean} True if empty
     */
    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Format number with Thai locale
     * @param {number} num - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    static formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    /**
     * Calculate percentage with fallback
     * @param {number} part - Part value
     * @param {number} total - Total value
     * @param {number} decimals - Decimal places
     * @returns {number} Percentage
     */
    static calculatePercentage(part, total, decimals = 1) {
        if (total === 0) return 0;
        return parseFloat(((part / total) * 100).toFixed(decimals));
    }

    /**
     * Add event listener with cleanup
     * @param {Element} element - Element to add listener to
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    static addEventListenerWithCleanup(element, event, handler) {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }

    /**
     * Test JSONP connection
     * @returns {Promise} Test result
     */
    static async testConnection() {
        try {
            this.showLoading(true, 'กำลังทดสอบการเชื่อมต่อ...');
            const response = await this.makeRequest('testConnection');
            this.showLoading(false);
            
            if (response && response.success) {
                this.showSuccess('การเชื่อมต่อสำเร็จ', 'ระบบพร้อมใช้งาน');
                return true;
            } else {
                throw new Error('การทดสอบการเชื่อมต่อล้มเหลว');
            }
        } catch (error) {
            this.showLoading(false);
            this.showError('การเชื่อมต่อล้มเหลว', 'กรุณาตรวจสอบการตั้งค่าและลองอีกครั้ง');
            return false;
        }
    }

    /**
     * Local storage helper with error handling
     */
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
                return false;
            }
        }
    };
}
