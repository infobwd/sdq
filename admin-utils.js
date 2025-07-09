// Admin Dashboard Utility Functions
// ==================================

/**
 * DOM Utilities
 */
const DOMUtils = {
    /**
     * Get element by ID with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null
     */
    getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    },

    /**
     * Get elements by class name
     * @param {string} className - Class name
     * @returns {NodeList} Elements
     */
    getElementsByClassName(className) {
        return document.getElementsByClassName(className);
    },

    /**
     * Get elements by query selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} Elements
     */
    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Create element with attributes
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Attributes object
     * @param {string} innerHTML - Inner HTML
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attributes = {}, innerHTML = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'style') {
                Object.assign(element.style, attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (innerHTML) {
            element.innerHTML = innerHTML;
        }
        
        return element;
    },

    /**
     * Add event listener with error handling
     * @param {HTMLElement} element - Element
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} options - Event options
     */
    addEventListener(element, event, callback, options = {}) {
        if (!element) {
            console.warn('Cannot add event listener to null element');
            return;
        }
        
        const wrappedCallback = (e) => {
            try {
                callback(e);
            } catch (error) {
                console.error('Event callback error:', error);
                NotificationUtils.showError('เกิดข้อผิดพลาดในการดำเนินการ');
            }
        };
        
        element.addEventListener(event, wrappedCallback, options);
    },

    /**
     * Remove element safely
     * @param {HTMLElement} element - Element to remove
     */
    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    /**
     * Show element
     * @param {HTMLElement} element - Element to show
     * @param {string} display - Display style
     */
    showElement(element, display = 'block') {
        if (element) {
            element.style.display = display;
            element.classList.add('fade-in');
        }
    },

    /**
     * Hide element
     * @param {HTMLElement} element - Element to hide
     */
    hideElement(element) {
        if (element) {
            element.style.display = 'none';
            element.classList.remove('fade-in');
        }
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Element to toggle
     * @param {string} display - Display style when shown
     */
    toggleElement(element, display = 'block') {
        if (element) {
            if (element.style.display === 'none') {
                this.showElement(element, display);
            } else {
                this.hideElement(element);
            }
        }
    },

    /**
     * Get form data as object
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Form data object
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },

    /**
     * Set form data from object
     * @param {HTMLFormElement} form - Form element
     * @param {Object} data - Data object
     */
    setFormData(form, data) {
        Object.keys(data).forEach(key => {
            const element = form.elements[key];
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = Boolean(data[key]);
                } else if (element.type === 'radio') {
                    const radioButton = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                    if (radioButton) {
                        radioButton.checked = true;
                    }
                } else {
                    element.value = data[key] || '';
                }
            }
        });
    },

    /**
     * Clear form
     * @param {HTMLFormElement} form - Form element
     */
    clearForm(form) {
        if (form) {
            form.reset();
            
            // Clear validation messages
            const errorElements = form.querySelectorAll('.error-message');
            errorElements.forEach(element => {
                this.removeElement(element);
            });
            
            // Remove error classes
            const inputElements = form.querySelectorAll('.form-input');
            inputElements.forEach(element => {
                element.classList.remove('error', 'success');
            });
        }
    }
};

/**
 * Data Utilities
 */
const DataUtils = {
    /**
     * Deep clone object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        
        return obj;
    },

    /**
     * Check if object is empty
     * @param {Object} obj - Object to check
     * @returns {boolean} True if empty
     */
    isEmpty(obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        
        if (typeof obj === 'string' || Array.isArray(obj)) {
            return obj.length === 0;
        }
        
        if (typeof obj === 'object') {
            return Object.keys(obj).length === 0;
        }
        
        return false;
    },

    /**
     * Merge objects deeply
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = this.deepClone(target);
        
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });
        
        return result;
    },

    /**
     * Get nested property value
     * @param {Object} obj - Object
     * @param {string} path - Property path (dot notation)
     * @param {any} defaultValue - Default value
     * @returns {any} Property value
     */
    getNestedProperty(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    },

    /**
     * Set nested property value
     * @param {Object} obj - Object
     * @param {string} path - Property path (dot notation)
     * @param {any} value - Value to set
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    },

    /**
     * Sort array by property
     * @param {Array} array - Array to sort
     * @param {string} property - Property to sort by
     * @param {string} direction - Sort direction (asc/desc)
     * @returns {Array} Sorted array
     */
    sortBy(array, property, direction = 'asc') {
        return array.slice().sort((a, b) => {
            const aValue = this.getNestedProperty(a, property);
            const bValue = this.getNestedProperty(b, property);
            
            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    },

    /**
     * Filter array by multiple criteria
     * @param {Array} array - Array to filter
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered array
     */
    filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = this.getNestedProperty(item, key);
                
                if (filterValue === null || filterValue === undefined || filterValue === '') {
                    return true;
                }
                
                if (typeof filterValue === 'string') {
                    return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
                }
                
                if (typeof filterValue === 'object' && filterValue.min !== undefined && filterValue.max !== undefined) {
                    return itemValue >= filterValue.min && itemValue <= filterValue.max;
                }
                
                return itemValue === filterValue;
            });
        });
    },

    /**
     * Group array by property
     * @param {Array} array - Array to group
     * @param {string} property - Property to group by
     * @returns {Object} Grouped object
     */
    groupBy(array, property) {
        return array.reduce((grouped, item) => {
            const key = this.getNestedProperty(item, property);
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
            return grouped;
        }, {});
    },

    /**
     * Paginate array
     * @param {Array} array - Array to paginate
     * @param {number} page - Current page (1-based)
     * @param {number} pageSize - Items per page
     * @returns {Object} Pagination result
     */
    paginate(array, page, pageSize) {
        const total = array.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = array.slice(start, end);
        
        return {
            items,
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }
};

/**
 * Format Utilities
 */
const FormatUtils = {
    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'THB') {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    /**
     * Format number
     * @param {number} number - Number to format
     * @param {number} decimals - Number of decimals
     * @returns {string} Formatted number
     */
    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },

    /**
     * Format date
     * @param {Date|string} date - Date to format
     * @param {Object} options - Format options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        return dateObj.toLocaleDateString('th-TH', formatOptions);
    },

    /**
     * Format relative time
     * @param {Date|string} date - Date to format
     * @returns {string} Relative time
     */
    formatRelativeTime(date) {
        const dateObj = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diff = now - dateObj;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} วันที่แล้ว`;
        } else if (hours > 0) {
            return `${hours} ชั่วโมงที่แล้ว`;
        } else if (minutes > 0) {
            return `${minutes} นาทีที่แล้ว`;
        } else {
            return 'เพิ่งเกิดขึ้น';
        }
    },

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, i);
        
        return `${size.toFixed(2)} ${sizes[i]}`;
    },

    /**
     * Format phone number
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone number
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (cleaned.length === 9) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        
        return phone;
    },

    /**
     * Format tables array
     * @param {Array} tables - Tables array
     * @returns {string} Formatted tables string
     */
    formatTables(tables) {
        if (!Array.isArray(tables) || tables.length === 0) {
            return '-';
        }
        
        return tables.join(', ');
    },

    /**
     * Truncate text
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength, suffix = '...') {
        if (!text || text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * Capitalize first letter
     * @param {string} text - Text to capitalize
     * @returns {string} Capitalized text
     */
    capitalize(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    },

    /**
     * Convert to title case
     * @param {string} text - Text to convert
     * @returns {string} Title case text
     */
    titleCase(text) {
        if (!text) return '';
        return text.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
};

/**
 * Validation Utilities
 */
const ValidationUtils = {
    /**
     * Validate required field
     * @param {any} value - Value to validate
     * @param {string} fieldName - Field name
     * @returns {string|null} Error message or null
     */
    validateRequired(value, fieldName) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return `${fieldName} จำเป็นต้องกรอก`;
        }
        return null;
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {string|null} Error message or null
     */
    validateEmail(email) {
        if (!email) return null;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        
        return null;
    },

    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @returns {string|null} Error message or null
     */
    validatePhone(phone) {
        if (!phone) return null;
        
        const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
        if (!phoneRegex.test(phone)) {
            return 'รูปแบบเบอร์โทรไม่ถูกต้อง';
        }
        
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 9 || cleaned.length > 15) {
            return 'เบอร์โทรต้องมี 9-15 หลัก';
        }
        
        return null;
    },

    /**
     * Validate number range
     * @param {number} value - Value to validate
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {string} fieldName - Field name
     * @returns {string|null} Error message or null
     */
    validateNumberRange(value, min, max, fieldName) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        const numValue = Number(value);
        if (isNaN(numValue)) {
            return `${fieldName} ต้องเป็นตัวเลข`;
        }
        
        if (numValue < min || numValue > max) {
            return `${fieldName} ต้องอยู่ระหว่าง ${min} - ${max}`;
        }
        
        return null;
    },

    /**
     * Validate text length
     * @param {string} text - Text to validate
     * @param {number} minLength - Minimum length
     * @param {number} maxLength - Maximum length
     * @param {string} fieldName - Field name
     * @returns {string|null} Error message or null
     */
    validateTextLength(text, minLength, maxLength, fieldName) {
        if (!text) return null;
        
        if (text.length < minLength) {
            return `${fieldName} ต้องมีความยาวอย่างน้อย ${minLength} ตัวอักษร`;
        }
        
        if (text.length > maxLength) {
            return `${fieldName} ต้องมีความยาวไม่เกิน ${maxLength} ตัวอักษร`;
        }
        
        return null;
    },

    /**
     * Validate file
     * @param {File} file - File to validate
     * @returns {string|null} Error message or null
     */
    validateFile(file) {
        if (!file) return null;
        
        const maxSize = CONFIG.API.MAX_FILE_SIZE;
        const allowedTypes = CONFIG.API.ALLOWED_FILE_TYPES;
        
        if (file.size > maxSize) {
            return `ขนาดไฟล์ต้องไม่เกิน ${FormatUtils.formatFileSize(maxSize)}`;
        }
        
        if (!allowedTypes.includes(file.type)) {
            return 'ประเภทไฟล์ไม่รองรับ';
        }
        
        return null;
    },

    /**
     * Validate form
     * @param {HTMLFormElement} form - Form to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateForm(form, rules) {
        const errors = {};
        const formData = DOMUtils.getFormData(form);
        
        Object.keys(rules).forEach(fieldName => {
            const fieldRules = rules[fieldName];
            const fieldValue = formData[fieldName];
            
            fieldRules.forEach(rule => {
                if (errors[fieldName]) return; // Skip if already has error
                
                let error = null;
                
                if (rule.type === 'required') {
                    error = this.validateRequired(fieldValue, rule.message || fieldName);
                } else if (rule.type === 'email') {
                    error = this.validateEmail(fieldValue);
                } else if (rule.type === 'phone') {
                    error = this.validatePhone(fieldValue);
                } else if (rule.type === 'range') {
                    error = this.validateNumberRange(fieldValue, rule.min, rule.max, rule.message || fieldName);
                } else if (rule.type === 'length') {
                    error = this.validateTextLength(fieldValue, rule.min, rule.max, rule.message || fieldName);
                } else if (rule.type === 'custom' && typeof rule.validator === 'function') {
                    error = rule.validator(fieldValue);
                }
                
                if (error) {
                    errors[fieldName] = error;
                }
            });
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Show validation errors in form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} errors - Validation errors
     */
    showFormErrors(form, errors) {
        // Clear previous errors
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            DOMUtils.removeElement(element);
        });
        
        const inputElements = form.querySelectorAll('.form-input');
        inputElements.forEach(element => {
            element.classList.remove('error');
        });
        
        // Show new errors
        Object.keys(errors).forEach(fieldName => {
            const field = form.elements[fieldName];
            if (field) {
                field.classList.add('error');
                
                const errorElement = DOMUtils.createElement('div', {
                    className: 'error-message text-red-500 text-sm mt-1'
                }, errors[fieldName]);
                
                field.parentNode.appendChild(errorElement);
            }
        });
    }
};

/**
 * Notification Utilities
 */
const NotificationUtils = {
    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Notification type
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            DOMUtils.removeElement(toast);
        });
        
        const toast = DOMUtils.createElement('div', {
            className: `toast toast-${type}`,
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '1001',
                minWidth: '300px',
                maxWidth: '500px'
            }
        }, `
            <div class="flex items-center">
                <div class="mr-3">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button class="ml-3 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `);
        
        document.body.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                DOMUtils.removeElement(toast);
            }
        }, duration);
    },

    /**
     * Get notification icon
     * @param {string} type - Notification type
     * @returns {string} Icon HTML
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        return icons[type] || icons.info;
    },

    /**
     * Show success notification
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    showError(message) {
        this.showToast(message, 'error', 5000);
    },

    /**
     * Show warning notification
     * @param {string} message - Warning message
     */
    showWarning(message) {
        this.showToast(message, 'warning', 4000);
    },

    /**
     * Show info notification
     * @param {string} message - Info message
     */
    showInfo(message) {
        this.showToast(message, 'info');
    }
};

// Export utilities to global scope
window.DOMUtils = DOMUtils;
window.DataUtils = DataUtils;
window.FormatUtils = FormatUtils;
window.ValidationUtils = ValidationUtils;
window.NotificationUtils = NotificationUtils;

console.log('🔧 Admin Utils loaded successfully!');
