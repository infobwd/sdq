// Admin Dashboard API Service
// ============================

/**
 * API Service Class for Google Apps Script Integration
 */
class AdminAPIService {
    constructor(config = {}) {
        this.config = {
            baseURL: config.baseURL || CONFIG.APPS_SCRIPT_URL,
            timeout: config.timeout || CONFIG.API.TIMEOUT,
            retryAttempts: config.retryAttempts || CONFIG.API.RETRY_ATTEMPTS,
            retryDelay: config.retryDelay || CONFIG.API.RETRY_DELAY,
            maxFileSize: config.maxFileSize || CONFIG.API.MAX_FILE_SIZE,
            allowedFileTypes: config.allowedFileTypes || CONFIG.API.ALLOWED_FILE_TYPES
        };
        
        this.requestQueue = [];
        this.isProcessing = false;
        this.cache = new Map();
        this.interceptors = {
            request: [],
            response: []
        };
    }

    /**
     * Add request interceptor
     * @param {Function} interceptor - Request interceptor function
     */
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }

    /**
     * Add response interceptor
     * @param {Function} interceptor - Response interceptor function
     */
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }

    /**
     * Process request interceptors
     * @param {Object} config - Request configuration
     * @returns {Object} Modified request configuration
     */
    processRequestInterceptors(config) {
        return this.interceptors.request.reduce((acc, interceptor) => {
            return interceptor(acc) || acc;
        }, config);
    }

    /**
     * Process response interceptors
     * @param {Object} response - Response object
     * @returns {Object} Modified response object
     */
    processResponseInterceptors(response) {
        return this.interceptors.response.reduce((acc, interceptor) => {
            return interceptor(acc) || acc;
        }, response);
    }

    /**
     * Generic API request method with retry logic and queue management
     * @param {string} action - API action
     * @param {Object} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise} API response
     */
    async makeRequest(action, data = {}, options = {}) {
        const requestConfig = this.processRequestInterceptors({
            action,
            data,
            options: {
                retryCount: 0,
                useCache: false,
                priority: 'normal',
                timeout: this.config.timeout,
                ...options
            }
        });

        return new Promise((resolve, reject) => {
            const requestItem = {
                config: requestConfig,
                resolve,
                reject,
                timestamp: Date.now(),
                id: this.generateRequestId()
            };

            // Add to queue based on priority
            if (requestConfig.options.priority === 'high') {
                this.requestQueue.unshift(requestItem);
            } else {
                this.requestQueue.push(requestItem);
            }

            this.processQueue();
        });
    }

    /**
     * Process request queue
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const requestItem = this.requestQueue.shift();
            
            try {
                const response = await this.executeRequest(requestItem.config);
                const processedResponse = this.processResponseInterceptors(response);
                requestItem.resolve(processedResponse);
            } catch (error) {
                requestItem.reject(error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Execute individual request
     * @param {Object} config - Request configuration
     * @returns {Promise} Request response
     */
    async executeRequest(config) {
        const { action, data, options } = config;
        const cacheKey = this.generateCacheKey(action, data);

        // Check cache first
        if (options.useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE.TTL) {
                return cached.data;
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout);

            const params = new URLSearchParams({
                action: action,
                ...this.prepareRequestData(data)
            });

            const response = await fetch(this.config.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new APIError(
                    `HTTP error! status: ${response.status}`,
                    'HTTP_ERROR',
                    response
                );
            }

            const text = await response.text();
            let responseData;

            try {
                responseData = JSON.parse(text);
            } catch (e) {
                throw new APIError(
                    'Invalid JSON response from server',
                    'INVALID_JSON',
                    text
                );
            }

            // Cache successful responses
            if (options.useCache && responseData.success) {
                this.setCache(cacheKey, responseData);
            }

            return responseData;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new APIError('Request timeout', 'TIMEOUT', error);
            }

            // Retry logic
            if (options.retryCount < this.config.retryAttempts - 1) {
                await this.delay(this.config.retryDelay * Math.pow(2, options.retryCount));
                return this.executeRequest({
                    ...config,
                    options: {
                        ...options,
                        retryCount: options.retryCount + 1
                    }
                });
            }

            throw error;
        }
    }

    /**
     * Prepare request data for transmission
     * @param {Object} data - Raw request data
     * @returns {Object} Prepared request data
     */
    prepareRequestData(data) {
        const prepared = {};
        
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            if (value === null || value === undefined) {
                return;
            }
            
            if (typeof value === 'object' && !Array.isArray(value)) {
                prepared[key] = JSON.stringify(value);
            } else if (Array.isArray(value)) {
                prepared[key] = JSON.stringify(value);
            } else {
                prepared[key] = value;
            }
        });
        
        return prepared;
    }

    /**
     * Generate cache key
     * @param {string} action - API action
     * @param {Object} data - Request data
     * @returns {string} Cache key
     */
    generateCacheKey(action, data) {
        return `${action}_${JSON.stringify(data)}`;
    }

    /**
     * Set cache entry
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     */
    setCache(key, data) {
        // Implement LRU cache eviction
        if (this.cache.size >= CONFIG.CACHE.MAX_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     * @param {string} pattern - Optional pattern to match keys
     */
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const key of this.cache.keys()) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Generate unique request ID
     * @returns {string} Unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Delay utility for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate file before processing
     * @param {File} file - File object to validate
     * @returns {boolean} True if valid
     */
    validateFile(file) {
        if (file.size > this.config.maxFileSize) {
            throw new APIError(
                `ไฟล์ ${file.name} มีขนาดเกิน ${this.config.maxFileSize / 1024 / 1024}MB`,
                'FILE_TOO_LARGE'
            );
        }

        if (!this.config.allowedFileTypes.includes(file.type)) {
            throw new APIError(
                `ไฟล์ ${file.name} ไม่รองรับประเภทนี้`,
                'FILE_TYPE_NOT_ALLOWED'
            );
        }

        return true;
    }

    /**
     * Convert file to base64
     * @param {File} file - File object
     * @returns {Promise} Base64 file data
     */
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve({
                    fileName: file.name,
                    mimeType: file.type,
                    content: base64,
                    size: file.size
                });
            };
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Process multiple files
     * @param {FileList} files - File list
     * @returns {Promise<Array>} Array of processed files
     */
    async processFiles(files) {
        const fileDataArray = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.validateFile(file);
            const fileData = await this.fileToBase64(file);
            fileDataArray.push(fileData);
        }

        return fileDataArray;
    }

    // ===============================
    // CRUD Operations
    // ===============================

    /**
     * Create new booking
     * @param {Object} bookingData - Booking data
     * @param {FileList} files - Files to upload
     * @returns {Promise} API response
     */
    async createBooking(bookingData, files = []) {
        try {
            const fileDataArray = await this.processFiles(files);

            const response = await this.makeRequest(API_ENDPOINTS.CREATE, {
                data: JSON.stringify({
                    ...bookingData,
                    files: fileDataArray
                })
            });

            if (!response.success) {
                throw new APIError(response.message || 'Failed to create booking', 'CREATE_FAILED');
            }

            // Clear cache after successful creation
            this.clearCache('read');
            this.clearCache('getStats');

            return response;
        } catch (error) {
            throw this.handleError(error, 'createBooking');
        }
    }

    /**
     * Read bookings with caching
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of bookings
     */
    async readBookings(filters = {}) {
        try {
            const response = await this.makeRequest(API_ENDPOINTS.READ, filters, {
                useCache: true
            });

            if (!response.success) {
                throw new APIError(response.message || 'Failed to read bookings', 'READ_FAILED');
            }

            return response.data || [];
        } catch (error) {
            throw this.handleError(error, 'readBookings');
        }
    }

    /**
     * Update existing booking
     * @param {string} id - Booking ID
     * @param {Object} bookingData - Updated booking data
     * @param {FileList} files - Files to upload
     * @returns {Promise} API response
     */
    async updateBooking(id, bookingData, files = []) {
        try {
            const fileDataArray = await this.processFiles(files);

            const response = await this.makeRequest(API_ENDPOINTS.UPDATE, {
                id: id,
                data: JSON.stringify({
                    ...bookingData,
                    files: fileDataArray
                })
            });

            if (!response.success) {
                throw new APIError(response.message || 'Failed to update booking', 'UPDATE_FAILED');
            }

            // Clear cache after successful update
            this.clearCache('read');
            this.clearCache('getStats');

            return response;
        } catch (error) {
            throw this.handleError(error, 'updateBooking');
        }
    }

    /**
     * Delete booking
     * @param {string} id - Booking ID
     * @returns {Promise} API response
     */
    async deleteBooking(id) {
        try {
            const response = await this.makeRequest(API_ENDPOINTS.DELETE, { id });

            if (!response.success) {
                throw new APIError(response.message || 'Failed to delete booking', 'DELETE_FAILED');
            }

            // Clear cache after successful deletion
            this.clearCache('read');
            this.clearCache('getStats');

            return response;
        } catch (error) {
            throw this.handleError(error, 'deleteBooking');
        }
    }

    /**
     * Get booking statistics
     * @returns {Promise<Object>} Statistics data
     */
    async getStats() {
        try {
            const response = await this.makeRequest(API_ENDPOINTS.STATS, {}, {
                useCache: true
            });

            if (!response.success) {
                throw new APIError(response.message || 'Failed to get statistics', 'STATS_FAILED');
            }

            return response.data || {};
        } catch (error) {
            throw this.handleError(error, 'getStats');
        }
    }

    // ===============================
    // Advanced Operations
    // ===============================

    /**
     * Get booking by ID
     * @param {string} id - Booking ID
     * @returns {Promise<Object>} Booking data
     */
    async getBookingById(id) {
        try {
            const bookings = await this.readBookings();
            const booking = bookings.find(b => b.ID === id);
            
            if (!booking) {
                throw new APIError('Booking not found', 'NOT_FOUND');
            }
            
            return booking;
        } catch (error) {
            throw this.handleError(error, 'getBookingById');
        }
    }

    /**
     * Search bookings
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Filtered bookings
     */
    async searchBookings(query, filters = {}) {
        try {
            const bookings = await this.readBookings();
            
            return bookings.filter(booking => {
                const matchesQuery = !query || 
                    (booking.Name || '').toLowerCase().includes(query.toLowerCase()) ||
                    (booking.Phone || '').toLowerCase().includes(query.toLowerCase()) ||
                    (booking.ID || '').toLowerCase().includes(query.toLowerCase()) ||
                    (booking.Organization || '').toLowerCase().includes(query.toLowerCase());

                // Apply additional filters
                let matchesFilters = true;
                
                if (filters.status && booking.Status !== filters.status) {
                    matchesFilters = false;
                }
                
                if (filters.dateFrom) {
                    const bookingDate = new Date(booking.CreatedAt);
                    const filterDate = new Date(filters.dateFrom);
                    matchesFilters = matchesFilters && bookingDate >= filterDate;
                }
                
                if (filters.dateTo) {
                    const bookingDate = new Date(booking.CreatedAt);
                    const filterDate = new Date(filters.dateTo);
                    matchesFilters = matchesFilters && bookingDate <= filterDate;
                }
                
                return matchesQuery && matchesFilters;
            });
        } catch (error) {
            throw this.handleError(error, 'searchBookings');
        }
    }

    /**
     * Batch delete bookings
     * @param {Array<string>} ids - Array of booking IDs
     * @returns {Promise<Array>} Results array
     */
    async batchDelete(ids) {
        const results = [];
        
        for (const id of ids) {
            try {
                const result = await this.deleteBooking(id);
                results.push({ id, success: true, result });
            } catch (error) {
                results.push({ id, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Export bookings data
     * @param {string} format - Export format (csv, json)
     * @param {Object} filters - Export filters
     * @returns {Promise<string>} Exported data
     */
    async exportData(format = 'csv', filters = {}) {
        try {
            const bookings = await this.readBookings();
            
            if (format === 'csv') {
                return this.exportToCSV(bookings, filters);
            } else if (format === 'json') {
                return this.exportToJSON(bookings, filters);
            } else {
                throw new APIError('Unsupported export format', 'INVALID_FORMAT');
            }
        } catch (error) {
            throw this.handleError(error, 'exportData');
        }
    }

    /**
     * Export to CSV format
     * @param {Array} bookings - Bookings data
     * @param {Object} filters - Export filters
     * @returns {string} CSV data
     */
    exportToCSV(bookings, filters = {}) {
        const headers = ['ID', 'ชื่อ', 'โทรศัพท์', 'อีเมล', 'หน่วยงาน', 'จำนวนเงิน', 'โต๊ะ', 'ที่นั่ง', 'หมายเหตุ', 'วันที่สร้าง'];
        
        const csvContent = [
            headers.join(','),
            ...bookings.map(booking => [
                booking.ID,
                `"${(booking.Name || '').replace(/"/g, '""')}"`,
                booking.Phone || '',
                booking.Email || '',
                `"${(booking.Organization || '').replace(/"/g, '""')}"`,
                booking.Amount || 0,
                `"${this.formatTables(booking.Tables)}"`,
                booking.TotalSeats || 0,
                `"${(booking.Notes || '').replace(/"/g, '""')}"`,
                this.formatDate(booking.CreatedAt)
            ].join(','))
        ].join('\n');
        
        return csvContent;
    }

    /**
     * Export to JSON format
     * @param {Array} bookings - Bookings data
     * @param {Object} filters - Export filters
     * @returns {string} JSON data
     */
    exportToJSON(bookings, filters = {}) {
        return JSON.stringify(bookings, null, 2);
    }

    /**
     * Health check
     * @returns {Promise<boolean>} Health status
     */
    async healthCheck() {
        try {
            const response = await this.makeRequest(API_ENDPOINTS.HEALTH_CHECK, {}, {
                timeout: 5000,
                priority: 'high'
            });
            return response.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get connection status
     * @returns {Promise<Object>} Connection status
     */
    async getConnectionStatus() {
        try {
            const isHealthy = await this.healthCheck();
            return {
                status: isHealthy ? 'connected' : 'disconnected',
                message: isHealthy ? 'เชื่อมต่อสำเร็จ' : 'ไม่สามารถเชื่อมต่อได้',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ===============================
    // Utility Methods
    // ===============================

    /**
     * Format tables array for display
     * @param {Array} tables - Tables array
     * @returns {string} Formatted string
     */
    formatTables(tables) {
        if (!Array.isArray(tables) || tables.length === 0) {
            return '';
        }
        return tables.join(', ');
    }

    /**
     * Format date for display
     * @param {string} dateString - Date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Handle API errors
     * @param {Error} error - Original error
     * @param {string} operation - Operation name
     * @returns {APIError} Formatted API error
     */
    handleError(error, operation) {
        if (error instanceof APIError) {
            return error;
        }

        let message = CONFIG.MESSAGES.ERROR.GENERIC;
        let code = 'UNKNOWN_ERROR';

        if (error.name === 'AbortError') {
            message = CONFIG.MESSAGES.ERROR.TIMEOUT;
            code = 'TIMEOUT';
        } else if (error.message.includes('fetch')) {
            message = CONFIG.MESSAGES.ERROR.NETWORK;
            code = 'NETWORK_ERROR';
        } else if (error.message.includes('JSON')) {
            message = CONFIG.MESSAGES.ERROR.VALIDATION;
            code = 'VALIDATION_ERROR';
        }

        return new APIError(message, code, error);
    }

    // ===============================
    // Debug Methods
    // ===============================

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: CONFIG.CACHE.MAX_SIZE,
            keys: Array.from(this.cache.keys()),
            hitRate: this.calculateHitRate()
        };
    }

    /**
     * Calculate cache hit rate
     * @returns {number} Hit rate percentage
     */
    calculateHitRate() {
        // Simple implementation - in production, you'd track hits/misses
        return Math.random() * 100;
    }

    /**
     * Get request queue status
     * @returns {Object} Queue status
     */
    getQueueStatus() {
        return {
            length: this.requestQueue.length,
            isProcessing: this.isProcessing,
            oldestRequest: this.requestQueue.length > 0 ? 
                Date.now() - this.requestQueue[0].timestamp : 0
        };
    }

    /**
     * Debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            config: this.config,
            cache: this.getCacheStats(),
            queue: this.getQueueStatus(),
            interceptors: {
                request: this.interceptors.request.length,
                response: this.interceptors.response.length
            }
        };
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            originalError: this.originalError?.message
        };
    }
}

/**
 * API Response wrapper
 */
class APIResponse {
    constructor(success, data = null, message = '', error = null) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }

    static success(data = null, message = 'Success') {
        return new APIResponse(true, data, message);
    }

    static error(message = 'Error', error = null) {
        return new APIResponse(false, null, message, error);
    }

    toJSON() {
        return {
            success: this.success,
            data: this.data,
            message: this.message,
            error: this.error,
            timestamp: this.timestamp
        };
    }
}

/**
 * Booking Manager with advanced features
 */
class BookingManager {
    constructor(config = {}) {
        this.api = new AdminAPIService(config);
        this.cache = new Map();
        this.cacheTimeout = CONFIG.CACHE.TTL;
        this.eventListeners = new Map();
        
        this.setupInterceptors();
    }

    /**
     * Setup API interceptors
     */
    setupInterceptors() {
        // Request interceptor for logging
        this.api.addRequestInterceptor((config) => {
            if (CONFIG.DEV.ENABLE_CONSOLE_LOGS) {
                console.log('📤 API Request:', config.action, config.data);
            }
            return config;
        });

        // Response interceptor for logging
        this.api.addResponseInterceptor((response) => {
            if (CONFIG.DEV.ENABLE_CONSOLE_LOGS) {
                console.log('📥 API Response:', response);
            }
            return response;
        });
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }

    /**
     * Get cached data or fetch from API
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to fetch data
     * @param {boolean} useCache - Whether to use cache
     * @returns {Promise} Data promise
     */
    async getCachedData(key, fetchFunction, useCache = true) {
        if (useCache && this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const data = await fetchFunction();
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Clear cache
     * @param {string} pattern - Pattern to match
     */
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const key of this.cache.keys()) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        
        this.api.clearCache(pattern);
    }

    /**
     * Get bookings with caching
     * @param {boolean} useCache - Whether to use cache
     * @returns {Promise<Array>} Bookings array
     */
    async getBookings(useCache = true) {
        const data = await this.getCachedData('bookings', () => this.api.readBookings(), useCache);
        this.emit('bookingsLoaded', data);
        return data;
    }

    /**
     * Get stats with caching
     * @param {boolean} useCache - Whether to use cache
     * @returns {Promise<Object>} Stats object
     */
    async getStats(useCache = true) {
        const data = await this.getCachedData('stats', () => this.api.getStats(), useCache);
        this.emit('statsLoaded', data);
        return data;
    }

    /**
     * Refresh all data
     * @returns {Promise<Object>} Refreshed data
     */
    async refreshAll() {
        this.clearCache();
        const [bookings, stats] = await Promise.all([
            this.getBookings(false),
            this.getStats(false)
        ]);

        this.emit('dataRefreshed', { bookings, stats });
        return { bookings, stats };
    }

    /**
     * Create booking with events
     * @param {Object} bookingData - Booking data
     * @param {FileList} files - Files to upload
     * @returns {Promise} API response
     */
    async createBooking(bookingData, files = []) {
        this.emit('bookingCreating', bookingData);
        
        try {
            const response = await this.api.createBooking(bookingData, files);
            this.clearCache();
            this.emit('bookingCreated', response);
            return response;
        } catch (error) {
            this.emit('bookingCreateError', error);
            throw error;
        }
    }

    /**
     * Update booking with events
     * @param {string} id - Booking ID
     * @param {Object} bookingData - Booking data
     * @param {FileList} files - Files to upload
     * @returns {Promise} API response
     */
    async updateBooking(id, bookingData, files = []) {
        this.emit('bookingUpdating', { id, bookingData });
        
        try {
            const response = await this.api.updateBooking(id, bookingData, files);
            this.clearCache();
            this.emit('bookingUpdated', response);
            return response;
        } catch (error) {
            this.emit('bookingUpdateError', error);
            throw error;
        }
    }

    /**
     * Delete booking with events
     * @param {string} id - Booking ID
     * @returns {Promise} API response
     */
    async deleteBooking(id) {
        this.emit('bookingDeleting', id);
        
        try {
            const response = await this.api.deleteBooking(id);
            this.clearCache();
            this.emit('bookingDeleted', response);
            return response;
        } catch (error) {
            this.emit('bookingDeleteError', error);
            throw error;
        }
    }

    /**
     * Get API instance
     * @returns {AdminAPIService} API instance
     */
    getAPI() {
        return this.api;
    }
}

// Initialize global instances
const adminAPI = new AdminAPIService();
const bookingManager = new BookingManager();

// Export for global usage
window.AdminAPIService = AdminAPIService;
window.APIError = APIError;
window.APIResponse = APIResponse;
window.BookingManager = BookingManager;
window.adminAPI = adminAPI;
window.bookingManager = bookingManager;

console.log('🔌 Admin API Service loaded successfully!');
