/**
 * Main Application Controller for SDQ System
 */

class App {
    static currentPage = 'home';
    static isInitialized = false;

    /**
     * Initialize the application
     */
    static async init() {
        try {
            Utils.showLoading(true, 'กำลังเริ่มต้นระบบ...');
            
            // Set up basic event listeners
            this.setupBasicEventListeners();
            
            // Initialize components
            await this.initializeComponents();
            
            // Set initial page
            this.showPage('page-home');
            
            // Set current year in footer
            this.updateFooter();
            
            this.isInitialized = true;
            
            Utils.showLoading(false);
            
            // Show welcome message
            setTimeout(() => {
                Utils.showSuccess(
                    'ระบบพร้อมใช้งาน',
                    'ระบบประเมิน SDQ โหลดเสร็จสมบูรณ์แล้ว'
                );
            }, 500);
            
        } catch (error) {
            console.error('App initialization failed:', error);
            Utils.showLoading(false);
            Utils.showError(
                'ไม่สามารถเริ่มต้นระบบได้',
                'กรุณารีเฟรชหน้าเว็บและลองอีกครั้ง'
            );
        }
    }

    /**
     * Initialize all components
     */
    static async initializeComponents() {
        try {
            // Initialize students data first
            await Students.init();
            
            // Initialize other components
            Questions.init();
            Assessment.init();
            
            // Initialize results and charts if on results pages
            if (window.Results) {
                Results.init();
            }
            
            if (window.Charts) {
                Charts.init();
            }
            
        } catch (error) {
            console.error('Component initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup basic event listeners
     */
    static setupBasicEventListeners() {
        // Navigation event listeners
        this.setupNavigation();
        
        // Quick action button
        const startBtn = document.getElementById('start-assessment');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.showPage('page-student');
            });
        }

        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Page visibility change handler
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Error handlers
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.handleUnhandledRejection(e);
        });
    }

    /**
     * Setup navigation event listeners
     */
    static setupNavigation() {
        // Desktop navigation tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = `page-${e.target.id.replace('tab-', '')}`;
                this.showPage(pageId);
            });
        });

        // Mobile navigation dropdown
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) {
            mobileNav.addEventListener('change', (e) => {
                const pageId = `page-${e.target.value}`;
                this.showPage(pageId);
            });
        }
    }

    /**
     * Show specific page
     * @param {string} pageId - Page ID to show
     */
    static showPage(pageId) {
        try {
            // Hide all pages
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.classList.add('hidden');
            });

            // Show target page
            const targetPage = document.getElementById(pageId);
            if (!targetPage) {
                console.error(`Page not found: ${pageId}`);
                return;
            }

            targetPage.classList.remove('hidden');
            Utils.fadeIn(targetPage);

            // Update navigation state
            this.updateNavigationState(pageId);

            // Handle page-specific logic
            this.handlePageChange(pageId);

            // Update current page
            this.currentPage = pageId.replace('page-', '');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error showing page:', error);
            Utils.showError('ไม่สามารถแสดงหน้าได้', 'กรุณาลองอีกครั้ง');
        }
    }

    /**
     * Update navigation state
     * @param {string} pageId - Current page ID
     */
    static updateNavigationState(pageId) {
        const pageName = pageId.replace('page-', '');

        // Update desktop tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
            btn.classList.add('text-gray-500');
        });

        const activeTab = document.getElementById(`tab-${pageName}`);
        if (activeTab) {
            activeTab.classList.add('active', 'text-blue-600', 'border-blue-600');
            activeTab.classList.remove('text-gray-500');
        }

        // Update mobile navigation
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) {
            mobileNav.value = pageName;
        }

        // Update page title
        this.updatePageTitle(pageName);
    }

    /**
     * Handle page-specific logic when changing pages
     * @param {string} pageId - Page ID
     */
    static handlePageChange(pageId) {
        switch (pageId) {
            case 'page-results':
                this.handleResultsPage();
                break;
            
            case 'page-summary':
                this.handleSummaryPage();
                break;
            
            case 'page-student':
            case 'page-teacher':
            case 'page-parent':
                this.handleAssessmentPage();
                break;
            
            default:
                // No specific handling needed
                break;
        }
    }

    /**
     * Handle results page logic
     */
    static handleResultsPage() {
        if (Students.isDataLoaded()) {
            Students.populateDropdowns();
        }

        if (window.Results) {
            Results.setupEventListeners();
            
            // Load results if student is selected
            const studentSelect = document.getElementById('result-student-name');
            if (studentSelect && studentSelect.value) {
                Results.loadIndividualResult();
            }
        }
    }

    /**
     * Handle summary page logic
     */
    static handleSummaryPage() {
        if (Students.isDataLoaded()) {
            Students.populateDropdowns();
        }

        if (window.Results) {
            Results.loadSummaryData();
        }
    }

    /**
     * Handle assessment page logic
     */
    static handleAssessmentPage() {
        if (Students.isDataLoaded()) {
            Students.populateDropdowns();
        }

        // Ensure questions are generated for current screen size
        if (Questions) {
            Questions.generateForms();
        }
    }

    /**
     * Handle window resize
     */
    static handleResize() {
        // Regenerate questions if screen size category changed
        if (Questions) {
            Questions.generateForms();
        }

        // Update charts if they exist
        if (window.Charts) {
            Charts.updateAllCharts();
        }
    }

    /**
     * Handle page visibility change
     */
    static handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - can pause unnecessary operations
            this.pauseOperations();
        } else {
            // Page is visible - resume operations
            this.resumeOperations();
        }
    }

    /**
     * Pause unnecessary operations when page is hidden
     */
    static pauseOperations() {
        // Can be used to pause auto-save, polling, etc.
        console.log('App paused - page hidden');
    }

    /**
     * Resume operations when page becomes visible
     */
    static resumeOperations() {
        // Resume operations and refresh data if needed
        console.log('App resumed - page visible');
        
        // Optionally refresh data if it's been a while
        const lastUpdate = Utils.storage.get('lastDataUpdate', 0);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - lastUpdate > fiveMinutes) {
            this.refreshData();
        }
    }

    /**
     * Refresh application data
     */
    static async refreshData() {
        try {
            if (Students.isDataLoaded()) {
                await Students.refresh();
                Utils.storage.set('lastDataUpdate', Date.now());
            }
        } catch (error) {
            console.warn('Failed to refresh data:', error);
        }
    }

    /**
     * Handle global errors
     * @param {ErrorEvent} event - Error event
     */
    static handleGlobalError(event) {
        console.error('Global error:', event.error);
        
        // Don't show alert for minor errors
        if (event.error && event.error.name !== 'TypeError') {
            Utils.showError(
                'เกิดข้อผิดพลาด',
                'ระบบพบข้อผิดพลาด กรุณารีเฟรชหน้าเว็บหากปัญหายังคงมีอยู่'
            );
        }
    }

    /**
     * Handle unhandled promise rejections
     * @param {PromiseRejectionEvent} event - Promise rejection event
     */
    static handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Log for debugging but don't show to user unless critical
        if (event.reason && event.reason.message && event.reason.message.includes('critical')) {
            Utils.showError(
                'เกิดข้อผิดพลาดร้ายแรง',
                'กรุณารีเฟรชหน้าเว็บและลองอีกครั้ง'
            );
        }
    }

    /**
     * Update page title
     * @param {string} pageName - Current page name
     */
    static updatePageTitle(pageName) {
        const pageTitles = {
            home: 'หน้าหลัก',
            student: 'นักเรียนประเมินตนเอง',
            teacher: 'ครูประเมินนักเรียน',
            parent: 'ผู้ปกครองประเมินนักเรียน',
            results: 'ผลการประเมินรายบุคคล',
            summary: 'สรุปผลการประเมินภาพรวม'
        };

        const title = pageTitles[pageName] || 'ระบบประเมิน SDQ';
        document.title = `${title} | ระบบประเมินพฤติกรรมนักเรียน SDQ`;
    }

    /**
     * Update footer with current year
     */
    static updateFooter() {
        const yearElement = document.getElementById('current-year-footer');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    /**
     * Get current page name
     * @returns {string} Current page name
     */
    static getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Check if app is initialized
     * @returns {boolean} True if initialized
     */
    static isReady() {
        return this.isInitialized;
    }

    /**
     * Show loading state for the entire app
     * @param {boolean} show - Whether to show loading
     * @param {string} message - Loading message
     */
    static showGlobalLoading(show = true, message = 'กำลังโหลด...') {
        Utils.showLoading(show, message);
    }

    /**
     * Export app data for backup
     * @returns {Object} App data
     */
    static exportAppData() {
        return {
            version: '1.0',
            timestamp: Utils.formatDate(),
            currentPage: this.currentPage,
            students: Students.exportData(),
            questions: Questions.exportData(),
            userPreferences: this.getUserPreferences()
        };
    }

    /**
     * Get user preferences from localStorage
     * @returns {Object} User preferences
     */
    static getUserPreferences() {
        return {
            theme: Utils.storage.get('theme', 'light'),
            autoSave: Utils.storage.get('autoSave', true),
            notifications: Utils.storage.get('notifications', true),
            language: Utils.storage.get('language', 'th')
        };
    }

    /**
     * Set user preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    static setUserPreference(key, value) {
        Utils.storage.set(key, value);
        this.applyUserPreferences();
    }

    /**
     * Apply user preferences to the app
     */
    static applyUserPreferences() {
        const prefs = this.getUserPreferences();
        
        // Apply theme
        if (prefs.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Configure auto-save
        CONFIG.AUTO_SAVE_ENABLED = prefs.autoSave;
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    static handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
            return;
        }

        // Ctrl/Cmd + shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.showPage('page-home');
                    break;
                case '2':
                    event.preventDefault();
                    this.showPage('page-student');
                    break;
                case '3':
                    event.preventDefault();
                    this.showPage('page-teacher');
                    break;
                case '4':
                    event.preventDefault();
                    this.showPage('page-parent');
                    break;
                case '5':
                    event.preventDefault();
                    this.showPage('page-results');
                    break;
                case '6':
                    event.preventDefault();
                    this.showPage('page-summary');
                    break;
                case 'p':
                    event.preventDefault();
                    window.print();
                    break;
            }
        }

        // Escape key - close modals
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
            modals.forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    }

    /**
     * Setup accessibility features
     */
    static setupAccessibility() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Focus management
        this.setupFocusManagement();

        // ARIA labels and roles
        this.setupAriaLabels();
    }

    /**
     * Setup focus management for accessibility
     */
    static setupFocusManagement() {
        // Focus trap for modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocus(e, modal);
                }
            });
        });
    }

    /**
     * Trap focus within an element
     * @param {KeyboardEvent} event - Keyboard event
     * @param {Element} container - Container element
     */
    static trapFocus(event, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    /**
     * Setup ARIA labels for accessibility
     */
    static setupAriaLabels() {
        // Add ARIA labels to navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach((btn, index) => {
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-label', `แท็บที่ ${index + 1}: ${btn.textContent.trim()}`);
        });

        // Add ARIA labels to form controls
        const radioOptions = document.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.setAttribute('role', 'radio');
            option.setAttribute('aria-label', `ตัวเลือก: ${option.dataset.value}`);
        });
    }

    /**
     * Setup service worker for offline support (if available)
     */
    static async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Check network status and show appropriate messages
     */
    static setupNetworkStatusMonitoring() {
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                // Online
                const offlineMessage = document.getElementById('offline-message');
                if (offlineMessage) {
                    offlineMessage.remove();
                }
            } else {
                // Offline
                this.showOfflineMessage();
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial check
        updateOnlineStatus();
    }

    /**
     * Show offline message
     */
    static showOfflineMessage() {
        // Remove existing message
        const existingMessage = document.getElementById('offline-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create offline message
        const offlineDiv = document.createElement('div');
        offlineDiv.id = 'offline-message';
        offlineDiv.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50';
        offlineDiv.innerHTML = '⚠️ ไม่มีการเชื่อมต่ointernet ระบบจะทำงานในโหมดออฟไลน์';
        
        document.body.insertBefore(offlineDiv, document.body.firstChild);
    }

    /**
     * Initialize performance monitoring
     */
    static initPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        });

        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected');
                }
            }, 30000); // Check every 30 seconds
        }
    }

    /**
     * Setup progressive web app features
     */
    static setupPWA() {
        // Add to home screen prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            Utils.showSuccess('ติดตั้งสำเร็จ', 'แอปพลิเคชันได้ถูกติดตั้งบนอุปกรณ์แล้ว');
        });
    }

    /**
     * Show install app button
     */
    static showInstallButton() {
        // Can add an install button to the UI
        console.log('App can be installed');
    }

    /**
     * Cleanup and destroy app instance
     */
    static destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        
        // Clear any intervals or timeouts
        // Clear storage if needed
        
        this.isInitialized = false;
        console.log('App destroyed');
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for global access
window.App = App;
