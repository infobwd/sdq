// Admin Dashboard Main Application - Part 1
// ==========================================

/**
 * Main Application Class
 */
class AdminDashboard {
    constructor() {
        this.currentBookings = [];
        this.filteredBookings = [];
        this.currentPage = 1;
        this.itemsPerPage = CONFIG.UI.ITEMS_PER_PAGE;
        this.sortColumn = 'CreatedAt';
        this.sortDirection = 'desc';
        this.searchQuery = '';
        this.filters = {};
        this.selectedBookings = new Set();
        this.isLoading = false;
        
        // Modal states
        this.currentEditingId = null;
        this.currentDeletingId = null;
        
        // Initialize application
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            this.setupEventListeners();
            this.setupBookingManagerEvents();
            this.setupKeyboardShortcuts();
            this.setupAutoRefresh();
            
            // Initial data load
            await this.loadInitialData();
            
            // Setup connection monitoring
            this.setupConnectionMonitoring();
            
            console.log('🚀 Admin Dashboard initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize Admin Dashboard:', error);
            NotificationUtils.showError('ไม่สามารถเริ่มต้นระบบได้');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Header buttons
        DOMUtils.addEventListener(
            DOMUtils.getElementById('refreshBtn'),
            'click',
            () => this.handleRefresh()
        );

        // Action buttons
        DOMUtils.addEventListener(
            DOMUtils.getElementById('addBookingBtn'),
            'click',
            () => this.handleAddBooking()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('exportBtn'),
            'click',
            () => this.handleExport()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('printBtn'),
            'click',
            () => this.handlePrint()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('backupBtn'),
            'click',
            () => this.handleBackup()
        );

        // Search and filters
        DOMUtils.addEventListener(
            DOMUtils.getElementById('searchInput'),
            'input',
            this.debounce(() => this.handleSearch(), CONFIG.UI.DEBOUNCE_DELAY)
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('statusFilter'),
            'change',
            () => this.handleFilterChange()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('dateFilter'),
            'change',
            () => this.handleFilterChange()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('itemsPerPage'),
            'change',
            () => this.handleItemsPerPageChange()
        );

        // Table events
        DOMUtils.addEventListener(
            DOMUtils.getElementById('selectAll'),
            'change',
            (e) => this.handleSelectAll(e.target.checked)
        );

        // Setup table header sorting
        const sortableHeaders = document.querySelectorAll('[data-sort]');
        sortableHeaders.forEach(header => {
            DOMUtils.addEventListener(header, 'click', () => {
                const column = header.getAttribute('data-sort');
                this.handleSort(column);
            });
        });

        // Modal events
        this.setupModalEvents();

        // Form events
        this.setupFormEvents();

        // File upload events
        this.setupFileUploadEvents();

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
    }

    /**
     * Setup modal events
     */
    setupModalEvents() {
        // Booking modal
        DOMUtils.addEventListener(
            DOMUtils.getElementById('closeModalBtn'),
            'click',
            () => this.closeBookingModal()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('cancelBtn'),
            'click',
            () => this.closeBookingModal()
        );

        // Delete modal
        DOMUtils.addEventListener(
            DOMUtils.getElementById('cancelDeleteBtn'),
            'click',
            () => this.closeDeleteModal()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('confirmDeleteBtn'),
            'click',
            () => this.confirmDelete()
        );

        // Bulk actions modal
        DOMUtils.addEventListener(
            DOMUtils.getElementById('cancelBulkBtn'),
            'click',
            () => this.closeBulkModal()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('bulkExportBtn'),
            'click',
            () => this.handleBulkExport()
        );

        DOMUtils.addEventListener(
            DOMUtils.getElementById('bulkDeleteBtn'),
            'click',
            () => this.handleBulkDelete()
        );

        // Close modals on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'bookingModal') {
                    this.closeBookingModal();
                } else if (e.target.id === 'deleteModal') {
                    this.closeDeleteModal();
                } else if (e.target.id === 'bulkActionsModal') {
                    this.closeBulkModal();
                }
            }
        });
    }

    /**
     * Setup form events
     */
    setupFormEvents() {
        const bookingForm = DOMUtils.getElementById('bookingForm');
        
        DOMUtils.addEventListener(bookingForm, 'submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Phone number formatting
        DOMUtils.addEventListener(
            DOMUtils.getElementById('modalPhone'),
            'input',
            (e) => this.formatPhoneNumber(e.target)
        );

        // Amount formatting
        DOMUtils.addEventListener(
            DOMUtils.getElementById('modalAmount'),
            'input',
            (e) => this.formatAmount(e.target)
        );

        // Real-time validation
        const formFields = ['modalName', 'modalPhone', 'modalEmail', 'modalAmount', 'modalTotalSeats'];
        formFields.forEach(fieldId => {
            const field = DOMUtils.getElementById(fieldId);
            if (field) {
                DOMUtils.addEventListener(field, 'blur', () => this.validateField(field));
            }
        });
    }

    /**
     * Setup file upload events
     */
    setupFileUploadEvents() {
        const fileInput = DOMUtils.getElementById('modalFiles');
        const fileUploadArea = DOMUtils.getElementById('fileUploadArea');

        if (fileInput && fileUploadArea) {
            // File input change
            DOMUtils.addEventListener(fileInput, 'change', (e) => {
                this.handleFileSelection(e.target.files);
            });

            // Drag and drop
            DOMUtils.addEventListener(fileUploadArea, 'dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });

            DOMUtils.addEventListener(fileUploadArea, 'dragleave', () => {
                fileUploadArea.classList.remove('dragover');
            });

            DOMUtils.addEventListener(fileUploadArea, 'drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                this.handleFileSelection(e.dataTransfer.files);
            });
        }
    }

    /**
     * Setup booking manager events
     */
    setupBookingManagerEvents() {
        bookingManager.addEventListener('bookingCreated', (data) => {
            NotificationUtils.showSuccess('เพิ่มการจองสำเร็จ');
            this.loadBookings();
            this.loadStats();
        });

        bookingManager.addEventListener('bookingUpdated', (data) => {
            NotificationUtils.showSuccess('อัปเดตการจองสำเร็จ');
            this.loadBookings();
            this.loadStats();
        });

        bookingManager.addEventListener('bookingDeleted', (data) => {
            NotificationUtils.showSuccess('ลบการจองสำเร็จ');
            this.loadBookings();
            this.loadStats();
        });

        bookingManager.addEventListener('bookingCreateError', (error) => {
            NotificationUtils.showError('ไม่สามารถเพิ่มการจองได้: ' + error.message);
        });

        bookingManager.addEventListener('bookingUpdateError', (error) => {
            NotificationUtils.showError('ไม่สามารถอัปเดตการจองได้: ' + error.message);
        });

        bookingManager.addEventListener('bookingDeleteError', (error) => {
            NotificationUtils.showError('ไม่สามารถลบการจองได้: ' + error.message);
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // This will be handled in handleKeyboardShortcuts method
    }

    /**
     * Setup auto refresh
     */
    setupAutoRefresh() {
        if (CONFIG.FEATURES.ENABLE_AUTO_REFRESH) {
            setInterval(() => {
                if (!this.isLoading) {
                    this.loadBookings();
                    this.loadStats();
                }
            }, CONFIG.UI.AUTO_REFRESH_INTERVAL);
        }
    }

    /**
     * Setup connection monitoring
     */
    setupConnectionMonitoring() {
        setInterval(async () => {
            try {
                const status = await bookingManager.getAPI().getConnectionStatus();
                this.updateConnectionStatus(status);
            } catch (error) {
                this.updateConnectionStatus({
                    status: 'error',
                    message: 'ไม่สามารถตรวจสอบการเชื่อมต่อได้'
                });
            }
        }, 30000); // Check every 30 seconds
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        this.showLoading();
        
        try {
            await Promise.all([
                this.loadBookings(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            NotificationUtils.showError('ไม่สามารถโหลดข้อมูลเริ่มต้นได้');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Load bookings data
     */
    async loadBookings() {
        try {
            this.currentBookings = await bookingManager.getBookings();
            this.applyFiltersAndSort();
            this.renderTable();
            this.updateLastUpdateTime();
        } catch (error) {
            console.error('Failed to load bookings:', error);
            NotificationUtils.showError('ไม่สามารถโหลดข้อมูลการจองได้');
            this.showEmptyTable();
        }
    }

    /**
     * Load statistics data
     */
    async loadStats() {
        try {
            const stats = await bookingManager.getStats();
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.updateStatsDisplay({
                totalBookings: 0,
                totalRevenue: 0,
                totalSeats: 0,
                recentBookings: 0
            });
        }
    }

    /**
     * Apply filters and sorting
     */
    applyFiltersAndSort() {
        let filtered = [...this.currentBookings];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(booking => 
                (booking.Name || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (booking.Phone || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (booking.ID || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (booking.Organization || '').toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (this.filters.status) {
            filtered = filtered.filter(booking => booking.Status === this.filters.status);
        }

        // Apply date filter
        if (this.filters.dateRange) {
            const now = new Date();
            let startDate;

            switch (this.filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                filtered = filtered.filter(booking => {
                    const bookingDate = new Date(booking.CreatedAt);
                    return bookingDate >= startDate;
                });
            }
        }

        // Apply sorting
        if (this.sortColumn) {
            filtered.sort((a, b) => {
                let aValue = DataUtils.getNestedProperty(a, this.sortColumn);
                let bValue = DataUtils.getNestedProperty(b, this.sortColumn);

                // Handle different data types
                if (this.sortColumn === 'Amount') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                } else if (this.sortColumn === 'CreatedAt') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (aValue < bValue) {
                    return this.sortDirection === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return this.sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        this.filteredBookings = filtered;
        this.currentPage = 1; // Reset to first page
    }

    /**
     * Render table
     */
    renderTable() {
        const tbody = DOMUtils.getElementById('bookingsTable');
        
        if (this.filteredBookings.length === 0) {
            this.showEmptyTable();
            this.updatePagination();
            return;
        }

        // Paginate data
        const paginatedData = DataUtils.paginate(
            this.filteredBookings,
            this.currentPage,
            this.itemsPerPage
        );

        // Render rows
        tbody.innerHTML = paginatedData.items.map(booking => this.renderTableRow(booking)).join('');

        // Update pagination
        this.updatePagination(paginatedData);

        // Update selection checkboxes
        this.updateSelectionCheckboxes();
    }

    /**
     * Render table row
     */
    renderTableRow(booking) {
        const isSelected = this.selectedBookings.has(booking.ID);
        
        return `
            <tr class="hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" 
                           class="row-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           value="${booking.ID}" 
                           ${isSelected ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${booking.ID || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${booking.Name || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${FormatUtils.formatPhoneNumber(booking.Phone) || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${FormatUtils.formatNumber(booking.Amount || 0)} บาท
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${FormatUtils.formatTables(booking.Tables)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${booking.TotalSeats || 0} ที่นั่ง
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${FormatUtils.formatDate(booking.CreatedAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-success">สำเร็จ</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="action-btn view" 
                                onclick="dashboard.handleViewBooking('${booking.ID}')" 
                                title="ดูรายละเอียด">
                            👁️
                        </button>
                        <button class="action-btn edit" 
                                onclick="dashboard.handleEditBooking('${booking.ID}')" 
                                title="แก้ไข">
                            ✏️
                        </button>
                        <button class="action-btn delete" 
                                onclick="dashboard.handleDeleteBooking('${booking.ID}', '${booking.Name}', '${booking.Phone}')" 
                                title="ลบ">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Show empty table
     */
    showEmptyTable() {
        const tbody = DOMUtils.getElementById('bookingsTable');
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center space-y-2">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-5 5-5-5m12 8l-5 5-5-5"></path>
                        </svg>
                        <span>ไม่พบข้อมูลการจอง</span>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Update pagination
     */
    updatePagination(paginatedData = null) {
        if (!paginatedData) {
            paginatedData = DataUtils.paginate(this.filteredBookings, this.currentPage, this.itemsPerPage);
        }

        // Update pagination info
        const showingFrom = DOMUtils.getElementById('showingFrom');
        const showingTo = DOMUtils.getElementById('showingTo');
        const totalItems = DOMUtils.getElementById('totalItems');

        if (showingFrom) showingFrom.textContent = paginatedData.items.length > 0 ? 
            ((paginatedData.page - 1) * paginatedData.pageSize + 1) : 0;
        if (showingTo) showingTo.textContent = 
            Math.min(paginatedData.page * paginatedData.pageSize, paginatedData.total);
        if (totalItems) totalItems.textContent = paginatedData.total;

        // Update pagination buttons
        this.renderPaginationButtons(paginatedData);
    }

    /**
     * Render pagination buttons
     */
    renderPaginationButtons(paginatedData) {
        const pagination = DOMUtils.getElementById('pagination');
        if (!pagination) return;

        const buttons = [];
        
        // Previous button
        buttons.push(`
            <button class="relative inline-flex items-center px-2 py-2 border border-gray-300 rounded-l-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${!paginatedData.hasPrev ? 'cursor-not-allowed opacity-50' : ''}"
                    onclick="dashboard.changePage(${paginatedData.page - 1})"
                    ${!paginatedData.hasPrev ? 'disabled' : ''}>
                <span class="sr-only">Previous</span>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </button>
        `);

        // Page numbers
        const maxPages = Math.min(paginatedData.totalPages, 7);
        let startPage = Math.max(1, paginatedData.page - Math.floor(maxPages / 2));
        let endPage = Math.min(paginatedData.totalPages, startPage + maxPages - 1);

        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(`
                <button class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === paginatedData.page ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
                        onclick="dashboard.changePage(${i})">
                    ${i}
                </button>
            `);
        }

        // Next button
        buttons.push(`
            <button class="relative inline-flex items-center px-2 py-2 border border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${!paginatedData.hasNext ? 'cursor-not-allowed opacity-50' : ''}"
                    onclick="dashboard.changePage(${paginatedData.page + 1})"
                    ${!paginatedData.hasNext ? 'disabled' : ''}>
                <span class="sr-only">Next</span>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
            </button>
        `);

        pagination.innerHTML = buttons.join('');
    }

    // ... Continue with more methods in next part
    
    /**
     * Debounce utility
     */
    debounce(func, wait) {
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
     * Show loading overlay
     */
    showLoading(message = 'กำลังโหลด...') {
        const overlay = DOMUtils.getElementById('loadingOverlay');
        const loadingText = DOMUtils.getElementById('loadingText');
        
        if (overlay) {
            if (loadingText) {
                loadingText.textContent = message;
            }
            overlay.classList.remove('hidden');
        }
        
        this.isLoading = true;
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = DOMUtils.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        this.isLoading = false;
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        const statusElement = DOMUtils.getElementById('connectionStatus');
        const textElement = DOMUtils.getElementById('connectionText');
        
        if (statusElement) {
            statusElement.className = `w-3 h-3 rounded-full connection-dot ${status.status === 'connected' ? 'connected' : 'disconnected'}`;
        }
        
        if (textElement) {
            textElement.textContent = status.message;
        }
    }

    /**
     * Update last update time
     */
    updateLastUpdateTime() {
        const lastUpdateElement = DOMUtils.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = 'อัปเดตล่าสุด: ' + FormatUtils.formatDate(now, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    /**
     * Update stats display
     */
    updateStatsDisplay(stats) {
        const elements = {
            totalBookings: DOMUtils.getElementById('totalBookings'),
            totalRevenue: DOMUtils.getElementById('totalRevenue'),
            totalSeats: DOMUtils.getElementById('totalSeats'),
            recentBookings: DOMUtils.getElementById('recentBookings')
        };

        if (elements.totalBookings) {
            elements.totalBookings.textContent = FormatUtils.formatNumber(stats.totalBookings);
        }
        
        if (elements.totalRevenue) {
            elements.totalRevenue.textContent = FormatUtils.formatNumber(stats.totalRevenue) + ' บาท';
        }
        
        if (elements.totalSeats) {
            elements.totalSeats.textContent = FormatUtils.formatNumber(stats.totalSeats);
        }
        
        if (elements.recentBookings) {
            elements.recentBookings.textContent = FormatUtils.formatNumber(stats.recentBookings);
        }
    }
}

// Initialize dashboard when DOM is ready
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
    window.dashboard = dashboard; // Make available globally
});

console.log('📱 Admin Dashboard Main Application Part 1 loaded successfully!');
// Admin Dashboard Main Application - Part 2 (Event Handlers)
// ==============================================================

// Extend AdminDashboard class with event handlers
Object.assign(AdminDashboard.prototype, {
    
    /**
     * Handle refresh button click
     */
    async handleRefresh() {
        this.showLoading('กำลังรีเฟรชข้อมูล...');
        
        try {
            await Promise.all([
                this.loadBookings(),
                this.loadStats()
            ]);
            
            NotificationUtils.showSuccess('รีเฟรชข้อมูลสำเร็จ');
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถรีเฟรชข้อมูลได้');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Handle add booking button click
     */
    handleAddBooking() {
        this.currentEditingId = null;
        this.showBookingModal('เพิ่มการจอง');
    },

    /**
     * Handle export button click
     */
    async handleExport() {
        if (this.currentBookings.length === 0) {
            NotificationUtils.showWarning('ไม่มีข้อมูลให้ส่งออก');
            return;
        }

        try {
            this.showLoading('กำลังส่งออกข้อมูล...');
            
            const csvData = await bookingManager.getAPI().exportData('csv');
            
            // Create and download file
            const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `booking_data_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            NotificationUtils.showSuccess('ส่งออกข้อมูลสำเร็จ');
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถส่งออกข้อมูลได้');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Handle print button click
     */
    handlePrint() {
        if (this.currentBookings.length === 0) {
            NotificationUtils.showWarning('ไม่มีข้อมูลให้พิมพ์');
            return;
        }

        const printContent = this.generatePrintContent();
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    },

    /**
     * Handle backup button click
     */
    async handleBackup() {
        try {
            this.showLoading('กำลังสำรองข้อมูล...');
            
            const jsonData = await bookingManager.getAPI().exportData('json');
            
            const blob = new Blob([jsonData], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `booking_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            NotificationUtils.showSuccess('สำรองข้อมูลสำเร็จ');
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถสำรองข้อมูลได้');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Handle search input
     */
    handleSearch() {
        const searchInput = DOMUtils.getElementById('searchInput');
        this.searchQuery = searchInput.value.trim();
        this.applyFiltersAndSort();
        this.renderTable();
    },

    /**
     * Handle filter change
     */
    handleFilterChange() {
        const statusFilter = DOMUtils.getElementById('statusFilter');
        const dateFilter = DOMUtils.getElementById('dateFilter');
        
        this.filters = {
            status: statusFilter.value,
            dateRange: dateFilter.value
        };
        
        this.applyFiltersAndSort();
        this.renderTable();
    },

    /**
     * Handle items per page change
     */
    handleItemsPerPageChange() {
        const itemsPerPageSelect = DOMUtils.getElementById('itemsPerPage');
        this.itemsPerPage = parseInt(itemsPerPageSelect.value);
        this.currentPage = 1;
        this.renderTable();
    },

    /**
     * Handle sort column click
     */
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.applyFiltersAndSort();
        this.renderTable();
        this.updateSortIndicators();
    },

    /**
     * Handle select all checkbox
     */
    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const bookingId = checkbox.value;
            
            if (checked) {
                this.selectedBookings.add(bookingId);
            } else {
                this.selectedBookings.delete(bookingId);
            }
        });
        
        this.updateBulkActionsVisibility();
        this.renderTable(); // Re-render to update row highlighting
    },

    /**
     * Handle row checkbox change
     */
    handleRowCheckboxChange(bookingId, checked) {
        if (checked) {
            this.selectedBookings.add(bookingId);
        } else {
            this.selectedBookings.delete(bookingId);
        }
        
        this.updateSelectAllCheckbox();
        this.updateBulkActionsVisibility();
        this.renderTable();
    },

    /**
     * Handle view booking
     */
    async handleViewBooking(bookingId) {
        try {
            const booking = await bookingManager.getAPI().getBookingById(bookingId);
            this.showBookingDetailsModal(booking);
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถโหลดข้อมูลการจองได้');
        }
    },

    /**
     * Handle edit booking
     */
    async handleEditBooking(bookingId) {
        try {
            const booking = await bookingManager.getAPI().getBookingById(bookingId);
            this.currentEditingId = bookingId;
            this.showBookingModal('แก้ไขการจอง', booking);
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถโหลดข้อมูลการจองได้');
        }
    },

    /**
     * Handle delete booking
     */
    handleDeleteBooking(bookingId, name, phone) {
        this.currentDeletingId = bookingId;
        this.showDeleteModal(bookingId, name, phone);
    },

    /**
     * Handle form submission
     */
    async handleFormSubmit() {
        const form = DOMUtils.getElementById('bookingForm');
        const formData = DOMUtils.getFormData(form);
        const files = DOMUtils.getElementById('modalFiles').files;
        
        // Validate form
        const validationResult = this.validateBookingForm(formData);
        if (!validationResult.isValid) {
            ValidationUtils.showFormErrors(form, validationResult.errors);
            return;
        }
        
        // Prepare booking data
        const bookingData = {
            name: formData.modalName,
            phone: formData.modalPhone,
            email: formData.modalEmail,
            organization: formData.modalOrganization,
            amount: parseFloat(formData.modalAmount) || 0,
            totalSeats: parseInt(formData.modalTotalSeats) || 0,
            tables: this.parseTables(formData.modalTables),
            notes: formData.modalNotes || ''
        };
        
        try {
            const submitBtn = DOMUtils.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading"></div> กำลังบันทึก...';
            
            if (this.currentEditingId) {
                await bookingManager.updateBooking(this.currentEditingId, bookingData, files);
            } else {
                await bookingManager.createBooking(bookingData, files);
            }
            
            this.closeBookingModal();
            
        } catch (error) {
            console.error('Form submission error:', error);
            // Error handling is done in booking manager events
        } finally {
            const submitBtn = DOMUtils.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'บันทึก';
        }
    },

    /**
     * Handle file selection
     */
    handleFileSelection(files) {
        const filePreview = DOMUtils.getElementById('filePreview');
        filePreview.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const validationError = ValidationUtils.validateFile(file);
            if (validationError) {
                NotificationUtils.showError(validationError);
                return;
            }
            
            const fileItem = this.createFilePreviewItem(file);
            filePreview.appendChild(fileItem);
        });
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Check if user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement.tagName === 'INPUT' || 
                         activeElement.tagName === 'TEXTAREA' || 
                         activeElement.contentEditable === 'true';
        
        if (isTyping) return;
        
        switch (e.key) {
            case 'F5':
                e.preventDefault();
                this.handleRefresh();
                break;
            case 'Escape':
                this.closeAllModals();
                break;
        }
        
        // Ctrl combinations
        if (e.ctrlKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.handleAddBooking();
                    break;
                case 'f':
                    e.preventDefault();
                    DOMUtils.getElementById('searchInput').focus();
                    break;
                case 'e':
                    e.preventDefault();
                    this.handleExport();
                    break;
                case 'p':
                    e.preventDefault();
                    this.handlePrint();
                    break;
                case 's':
                    e.preventDefault();
                    if (this.currentEditingId !== null) {
                        this.handleFormSubmit();
                    }
                    break;
            }
        }
    },

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust table layout for mobile
        const table = document.querySelector('.table-container');
        if (table) {
            if (window.innerWidth < 768) {
                table.classList.add('mobile-table');
            } else {
                table.classList.remove('mobile-table');
            }
        }
    },

    /**
     * Handle page change
     */
    changePage(page) {
        const totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
        }
    },

    /**
     * Handle bulk export
     */
    async handleBulkExport() {
        if (this.selectedBookings.size === 0) {
            NotificationUtils.showWarning('กรุณาเลือกข้อมูลที่ต้องการส่งออก');
            return;
        }
        
        try {
            this.showLoading('กำลังส่งออกข้อมูลที่เลือก...');
            
            const selectedData = this.currentBookings.filter(booking => 
                this.selectedBookings.has(booking.ID)
            );
            
            const csvData = this.generateCSVFromData(selectedData);
            
            const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `selected_bookings_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            this.closeBulkModal();
            NotificationUtils.showSuccess('ส่งออกข้อมูลที่เลือกสำเร็จ');
            
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถส่งออกข้อมูลได้');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Handle bulk delete
     */
    async handleBulkDelete() {
        if (this.selectedBookings.size === 0) {
            NotificationUtils.showWarning('กรุณาเลือกข้อมูลที่ต้องการลบ');
            return;
        }
        
        const result = await Swal.fire({
            title: 'ยืนยันการลบข้อมูล',
            text: `คุณต้องการลบข้อมูล ${this.selectedBookings.size} รายการหรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });
        
        if (!result.isConfirmed) return;
        
        try {
            this.showLoading('กำลังลบข้อมูล...');
            
            const selectedIds = Array.from(this.selectedBookings);
            const results = await bookingManager.getAPI().batchDelete(selectedIds);
            
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            
            if (successCount > 0) {
                NotificationUtils.showSuccess(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
                this.selectedBookings.clear();
                this.loadBookings();
                this.loadStats();
            }
            
            if (failCount > 0) {
                NotificationUtils.showWarning(`ลบข้อมูลไม่สำเร็จ ${failCount} รายการ`);
            }
            
            this.closeBulkModal();
            
        } catch (error) {
            NotificationUtils.showError('ไม่สามารถลบข้อมูลได้');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Confirm delete single booking
     */
    async confirmDelete() {
        if (!this.currentDeletingId) return;
        
        try {
            const confirmBtn = DOMUtils.getElementById('confirmDeleteBtn');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<div class="loading"></div> กำลังลบ...';
            
            await bookingManager.deleteBooking(this.currentDeletingId);
            this.closeDeleteModal();
            
        } catch (error) {
            // Error handling is done in booking manager events
        } finally {
            const confirmBtn = DOMUtils.getElementById('confirmDeleteBtn');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'ลบข้อมูล';
        }
    },

    /**
     * Format phone number input
     */
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d+)/, '$1-$2');
        }
        
        input.value = value;
    },

    /**
     * Format amount input
     */
    formatAmount(input) {
        let value = input.value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        if (parts[1] && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }
        
        input.value = value;
    },

    /**
     * Validate field on blur
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id.replace('modal', '');
        let error = null;
        
        switch (field.id) {
            case 'modalName':
                error = ValidationUtils.validateRequired(value, 'ชื่อ-สกุล') ||
                        ValidationUtils.validateTextLength(value, 2, 100, 'ชื่อ-สกุล');
                break;
            case 'modalPhone':
                error = ValidationUtils.validateRequired(value, 'เบอร์โทรศัพท์') ||
                        ValidationUtils.validatePhone(value);
                break;
            case 'modalEmail':
                error = ValidationUtils.validateEmail(value);
                break;
            case 'modalAmount':
                error = ValidationUtils.validateRequired(value, 'จำนวนเงิน') ||
                        ValidationUtils.validateNumberRange(value, 0, 999999999, 'จำนวนเงิน');
                break;
            case 'modalTotalSeats':
                error = ValidationUtils.validateRequired(value, 'จำนวนที่นั่ง') ||
                        ValidationUtils.validateNumberRange(value, 1, 1000, 'จำนวนที่นั่ง');
                break;
        }
        
        // Clear previous error
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            DOMUtils.removeElement(existingError);
        }
        
        field.classList.remove('error', 'success');
        
        if (error) {
            field.classList.add('error');
            const errorElement = DOMUtils.createElement('div', {
                className: 'error-message text-red-500 text-sm mt-1'
            }, error);
            field.parentNode.appendChild(errorElement);
        } else if (value) {
            field.classList.add('success');
        }
    },

    /**
     * Update selection checkboxes
     */
    updateSelectionCheckboxes() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        
        checkboxes.forEach(checkbox => {
            // Remove existing event listeners to avoid duplicates
            checkbox.replaceWith(checkbox.cloneNode(true));
        });
        
        // Add event listeners to new checkboxes
        const newCheckboxes = document.querySelectorAll('.row-checkbox');
        newCheckboxes.forEach(checkbox => {
            DOMUtils.addEventListener(checkbox, 'change', (e) => {
                this.handleRowCheckboxChange(checkbox.value, e.target.checked);
            });
        });
        
        this.updateSelectAllCheckbox();
    },

    /**
     * Update select all checkbox
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = DOMUtils.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.row-checkbox');
        
        if (selectAllCheckbox && checkboxes.length > 0) {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            selectAllCheckbox.checked = checkedCount === checkboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }
    },

    /**
     * Update bulk actions visibility
     */
    updateBulkActionsVisibility() {
        if (this.selectedBookings.size > 0) {
            // Show bulk actions button or modal trigger
            // This can be implemented based on UI requirements
            const selectedCount = DOMUtils.getElementById('selectedCount');
            if (selectedCount) {
                selectedCount.textContent = this.selectedBookings.size;
            }
        }
    },

    /**
     * Update sort indicators
     */
    updateSortIndicators() {
        const sortableHeaders = document.querySelectorAll('[data-sort]');
        
        sortableHeaders.forEach(header => {
            const column = header.getAttribute('data-sort');
            const indicator = header.querySelector('span');
            
            if (column === this.sortColumn) {
                indicator.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
                header.classList.add('bg-gray-100');
            } else {
                indicator.textContent = '↕️';
                header.classList.remove('bg-gray-100');
            }
        });
    },

    /**
     * Parse tables string to array
     */
    parseTables(tablesString) {
        if (!tablesString) return [];
        
        return tablesString.split(',')
            .map(table => table.trim())
            .filter(table => table !== '')
            .map(table => {
                // Handle ranges like "1-5"
                if (table.includes('-')) {
                    const [start, end] = table.split('-').map(n => parseInt(n.trim()));
                    if (!isNaN(start) && !isNaN(end) && start <= end) {
                        const range = [];
                        for (let i = start; i <= end; i++) {
                            range.push(i.toString());
                        }
                        return range;
                    }
                }
                return [table];
            })
            .flat();
    },

    /**
     * Create file preview item
     */
    createFilePreviewItem(file) {
        const fileItem = DOMUtils.createElement('div', {
            className: 'file-preview bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between'
        });
        
        const fileInfo = DOMUtils.createElement('div', {
            className: 'flex items-center gap-3'
        });
        
        const fileIcon = DOMUtils.createElement('div', {
            className: 'file-icon text-2xl'
        }, file.type.includes('pdf') ? '📄' : '🖼️');
        
        const fileDetails = DOMUtils.createElement('div', {}, `
            <div class="file-name text-sm font-medium text-gray-900">${file.name}</div>
            <div class="file-size text-xs text-gray-500">${FormatUtils.formatFileSize(file.size)}</div>
        `);
        
        const removeBtn = DOMUtils.createElement('button', {
            className: 'remove-btn text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors'
        }, '🗑️');
        
        DOMUtils.addEventListener(removeBtn, 'click', () => {
            DOMUtils.removeElement(fileItem);
        });
        
        fileInfo.appendChild(fileIcon);
        fileInfo.appendChild(fileDetails);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        
        return fileItem;
    },

    /**
     * Generate CSV from data
     */
    generateCSVFromData(data) {
        const headers = ['ID', 'ชื่อ', 'โทรศัพท์', 'อีเมล', 'หน่วยงาน', 'จำนวนเงิน', 'โต๊ะ', 'ที่นั่ง', 'หมายเหตุ', 'วันที่สร้าง'];
        
        const csvContent = [
            headers.join(','),
            ...data.map(booking => [
                booking.ID,
                `"${(booking.Name || '').replace(/"/g, '""')}"`,
                booking.Phone || '',
                booking.Email || '',
                `"${(booking.Organization || '').replace(/"/g, '""')}"`,
                booking.Amount || 0,
                `"${FormatUtils.formatTables(booking.Tables)}"`,
                booking.TotalSeats || 0,
                `"${(booking.Notes || '').replace(/"/g, '""')}"`,
                FormatUtils.formatDate(booking.CreatedAt)
            ].join(','))
        ].join('\n');
        
        return csvContent;
    },

    /**
     * Cleanup method
     */
    cleanup() {
        // Clear any intervals or timeouts
        // Remove event listeners if needed
        // Clean up any resources
    }
});

console.log('📱 Admin Dashboard Event Handlers loaded successfully!');
// Admin Dashboard Main Application - Part 3 (Modal Management)
// ==============================================================

// Extend AdminDashboard class with modal management methods
Object.assign(AdminDashboard.prototype, {
    
    /**
     * Show booking modal
     */
    showBookingModal(title, bookingData = null) {
        const modal = DOMUtils.getElementById('bookingModal');
        const modalTitle = DOMUtils.getElementById('modalTitle');
        const form = DOMUtils.getElementById('bookingForm');
        
        modalTitle.textContent = title;
        
        if (bookingData) {
            this.populateBookingForm(bookingData);
        } else {
            DOMUtils.clearForm(form);
        }
        
        modal.classList.add('active');
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = form.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    },

    /**
     * Close booking modal
     */
    closeBookingModal() {
        const modal = DOMUtils.getElementById('bookingModal');
        const form = DOMUtils.getElementById('bookingForm');
        
        modal.classList.remove('active');
        DOMUtils.clearForm(form);
        
        // Clear file preview
        const filePreview = DOMUtils.getElementById('filePreview');
        if (filePreview) {
            filePreview.innerHTML = '';
        }
        
        this.currentEditingId = null;
    },

    /**
     * Show delete modal
     */
    showDeleteModal(bookingId, name, phone) {
        const modal = DOMUtils.getElementById('deleteModal');
        
        DOMUtils.getElementById('deleteId').textContent = bookingId;
        DOMUtils.getElementById('deleteName').textContent = name;
        DOMUtils.getElementById('deletePhone').textContent = phone;
        
        modal.classList.add('active');
    },

    /**
     * Close delete modal
     */
    closeDeleteModal() {
        const modal = DOMUtils.getElementById('deleteModal');
        modal.classList.remove('active');
        this.currentDeletingId = null;
    },

    /**
     * Show bulk actions modal
     */
    showBulkModal() {
        const modal = DOMUtils.getElementById('bulkActionsModal');
        const selectedCount = DOMUtils.getElementById('selectedCount');
        
        selectedCount.textContent = this.selectedBookings.size;
        modal.classList.add('active');
    },

    /**
     * Close bulk actions modal
     */
    closeBulkModal() {
        const modal = DOMUtils.getElementById('bulkActionsModal');
        modal.classList.remove('active');
    },

    /**
     * Show booking details modal
     */
    showBookingDetailsModal(booking) {
        const fileLinks = Array.isArray(booking.FileURLs) ? 
            booking.FileURLs.map(url => `<a href="${url}" target="_blank" class="text-blue-600 hover:underline">ดูไฟล์</a>`).join('<br>') : 
            'ไม่มีไฟล์';
        
        Swal.fire({
            title: 'รายละเอียดการจอง',
            html: `
                <div class="text-left space-y-3">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">ID</p>
                            <p class="font-medium">${booking.ID}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">วันที่สร้าง</p>
                            <p class="font-medium">${FormatUtils.formatDate(booking.CreatedAt)}</p>
                        </div>
                    </div>
                    
                    <div class="border-t pt-3">
                        <h4 class="font-medium mb-2">ข้อมูลผู้จอง</h4>
                        <div class="space-y-2">
                            <div>
                                <p class="text-sm text-gray-600">ชื่อ-สกุล</p>
                                <p class="font-medium">${booking.Name || '-'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                                <p class="font-medium">${FormatUtils.formatPhoneNumber(booking.Phone) || '-'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">อีเมล</p>
                                <p class="font-medium">${booking.Email || '-'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">หน่วยงาน</p>
                                <p class="font-medium">${booking.Organization || '-'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t pt-3">
                        <h4 class="font-medium mb-2">รายละเอียดการจอง</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">จำนวนเงิน</p>
                                <p class="font-medium text-green-600">${FormatUtils.formatNumber(booking.Amount || 0)} บาท</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">จำนวนที่นั่ง</p>
                                <p class="font-medium">${booking.TotalSeats || 0} ที่นั่ง</p>
                            </div>
                        </div>
                        <div class="mt-2">
                            <p class="text-sm text-gray-600">โต๊ะที่จอง</p>
                            <p class="font-medium">${FormatUtils.formatTables(booking.Tables)}</p>
                        </div>
                        ${booking.Notes ? `
                            <div class="mt-2">
                                <p class="text-sm text-gray-600">หมายเหตุ</p>
                                <p class="font-medium">${booking.Notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="border-t pt-3">
                        <h4 class="font-medium mb-2">ไฟล์แนบ</h4>
                        <div class="text-sm">${fileLinks}</div>
                    </div>
                    
                    <div class="border-t pt-3">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600">วันที่สร้าง</p>
                                <p class="font-medium">${FormatUtils.formatDate(booking.CreatedAt)}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">อัปเดตล่าสุด</p>
                                <p class="font-medium">${FormatUtils.formatDate(booking.UpdatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'ปิด',
            width: '600px',
            showCloseButton: true,
            customClass: {
                popup: 'text-left'
            }
        });
    },

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Close SweetAlert modals
        if (window.Swal) {
            Swal.close();
        }
        
        // Reset states
        this.currentEditingId = null;
        this.currentDeletingId = null;
    },

    /**
     * Populate booking form with data
     */
    populateBookingForm(booking) {
        const form = DOMUtils.getElementById('bookingForm');
        
        // Clear form first
        DOMUtils.clearForm(form);
        
        // Set form values
        const formData = {
            modalName: booking.Name || '',
            modalPhone: booking.Phone || '',
            modalEmail: booking.Email || '',
            modalOrganization: booking.Organization || '',
            modalAmount: booking.Amount || '',
            modalTotalSeats: booking.TotalSeats || '',
            modalTables: Array.isArray(booking.Tables) ? booking.Tables.join(',') : '',
            modalNotes: booking.Notes || ''
        };
        
        DOMUtils.setFormData(form, formData);
        
        // Set booking ID for editing
        DOMUtils.getElementById('bookingId').value = booking.ID;
        
        // Display existing files if any
        if (Array.isArray(booking.FileURLs) && booking.FileURLs.length > 0) {
            this.displayExistingFiles(booking.FileURLs);
        }
    },

    /**
     * Display existing files in form
     */
    displayExistingFiles(fileUrls) {
        const filePreview = DOMUtils.getElementById('filePreview');
        
        fileUrls.forEach((url, index) => {
            const fileName = this.extractFileNameFromUrl(url);
            const fileType = this.getFileTypeFromUrl(url);
            
            const fileItem = DOMUtils.createElement('div', {
                className: 'file-preview bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between'
            });
            
            const fileInfo = DOMUtils.createElement('div', {
                className: 'flex items-center gap-3'
            });
            
            const fileIcon = DOMUtils.createElement('div', {
                className: 'file-icon text-2xl'
            }, fileType === 'pdf' ? '📄' : '🖼️');
            
            const fileDetails = DOMUtils.createElement('div', {}, `
                <div class="file-name text-sm font-medium text-gray-900">${fileName}</div>
                <div class="file-size text-xs text-gray-500">ไฟล์ที่มีอยู่แล้ว</div>
            `);
            
            const viewBtn = DOMUtils.createElement('a', {
                href: url,
                target: '_blank',
                className: 'text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors'
            }, '👁️');
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileDetails);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(viewBtn);
            
            filePreview.appendChild(fileItem);
        });
    },

    /**
     * Extract file name from URL
     */
    extractFileNameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            return pathSegments[pathSegments.length - 1] || 'ไฟล์';
        } catch (error) {
            return 'ไฟล์';
        }
    },

    /**
     * Get file type from URL
     */
    getFileTypeFromUrl(url) {
        const extension = url.split('.').pop().toLowerCase();
        return extension === 'pdf' ? 'pdf' : 'image';
    },

    /**
     * Validate booking form
     */
    validateBookingForm(formData) {
        const errors = {};
        
        // Required fields validation
        if (!formData.modalName || formData.modalName.trim() === '') {
            errors.modalName = 'ชื่อ-สกุลจำเป็นต้องกรอก';
        }
        
        if (!formData.modalPhone || formData.modalPhone.trim() === '') {
            errors.modalPhone = 'เบอร์โทรศัพท์จำเป็นต้องกรอก';
        }
        
        if (!formData.modalAmount || formData.modalAmount.trim() === '') {
            errors.modalAmount = 'จำนวนเงินจำเป็นต้องกรอก';
        }
        
        if (!formData.modalTotalSeats || formData.modalTotalSeats.trim() === '') {
            errors.modalTotalSeats = 'จำนวนที่นั่งจำเป็นต้องกรอก';
        }
        
        // Format validation
        if (formData.modalPhone) {
            const phoneError = ValidationUtils.validatePhone(formData.modalPhone);
            if (phoneError) {
                errors.modalPhone = phoneError;
            }
        }
        
        if (formData.modalEmail) {
            const emailError = ValidationUtils.validateEmail(formData.modalEmail);
            if (emailError) {
                errors.modalEmail = emailError;
            }
        }
        
        // Range validation
        if (formData.modalAmount) {
            const amount = parseFloat(formData.modalAmount);
            if (isNaN(amount) || amount < 0) {
                errors.modalAmount = 'จำนวนเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0';
            }
        }
        
        if (formData.modalTotalSeats) {
            const seats = parseInt(formData.modalTotalSeats);
            if (isNaN(seats) || seats < 1) {
                errors.modalTotalSeats = 'จำนวนที่นั่งต้องเป็นตัวเลขที่มากกว่า 0';
            }
        }
        
        // Length validation
        if (formData.modalName && formData.modalName.length > 100) {
            errors.modalName = 'ชื่อ-สกุลต้องมีความยาวไม่เกิน 100 ตัวอักษร';
        }
        
        if (formData.modalNotes && formData.modalNotes.length > 500) {
            errors.modalNotes = 'หมายเหตุต้องมีความยาวไม่เกิน 500 ตัวอักษร';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Generate print content
     */
    generatePrintContent() {
        const now = new Date();
        const stats = {
            totalBookings: this.currentBookings.length,
            totalRevenue: this.currentBookings.reduce((sum, booking) => sum + (parseFloat(booking.Amount) || 0), 0),
            totalSeats: this.currentBookings.reduce((sum, booking) => sum + (parseInt(booking.TotalSeats) || 0), 0)
        };
        
        return `
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>รายงานการจอง</title>
                <style>
                    body {
                        font-family: 'Kanit', Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #333;
                    }
                    .header h1 {
                        font-size: 24px;
                        margin: 0;
                        color: #2c3e50;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                        padding: 20px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    }
                    .stat-item {
                        text-align: center;
                        padding: 10px;
                    }
                    .stat-item h3 {
                        font-size: 20px;
                        margin: 0;
                        color: #2c3e50;
                    }
                    .stat-item p {
                        margin: 5px 0 0 0;
                        color: #666;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }
                    @media print {
                        body { margin: 0; }
                        .header { page-break-after: avoid; }
                        table { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>รายงานการจองโต๊ะ</h1>
                    <p>งานเกษียณอายุราชการครู</p>
                    <p>วันที่พิมพ์: ${FormatUtils.formatDate(now)}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-item">
                        <h3>${FormatUtils.formatNumber(stats.totalBookings)}</h3>
                        <p>การจองทั้งหมด</p>
                    </div>
                    <div class="stat-item">
                        <h3>${FormatUtils.formatNumber(stats.totalRevenue)} บาท</h3>
                        <p>รายได้รวม</p>
                    </div>
                    <div class="stat-item">
                        <h3>${FormatUtils.formatNumber(stats.totalSeats)}</h3>
                        <p>ที่นั่งรวม</p>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ชื่อ</th>
                            <th>โทรศัพท์</th>
                            <th>หน่วยงาน</th>
                            <th>จำนวนเงิน</th>
                            <th>โต๊ะ</th>
                            <th>ที่นั่ง</th>
                            <th>วันที่</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.currentBookings.map(booking => `
                            <tr>
                                <td>${booking.ID}</td>
                                <td>${booking.Name || ''}</td>
                                <td>${FormatUtils.formatPhoneNumber(booking.Phone) || ''}</td>
                                <td>${booking.Organization || ''}</td>
                                <td>${FormatUtils.formatNumber(booking.Amount || 0)} บาท</td>
                                <td>${FormatUtils.formatTables(booking.Tables)}</td>
                                <td>${booking.TotalSeats || 0}</td>
                                <td>${FormatUtils.formatDate(booking.CreatedAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>สร้างโดยระบบจัดการการจอง | ${FormatUtils.formatDate(now)}</p>
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Show confirmation dialog
     */
    showConfirmDialog(title, message, confirmText = 'ตกลง', cancelText = 'ยกเลิก') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText
        });
    },

    /**
     * Show success dialog
     */
    showSuccessDialog(title, message) {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonColor: '#10b981'
        });
    },

    /**
     * Show error dialog
     */
    showErrorDialog(title, message) {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
    },

    /**
     * Show loading dialog
     */
    showLoadingDialog(message = 'กำลังประมวลผล...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    /**
     * Hide loading dialog
     */
    hideLoadingDialog() {
        Swal.close();
    },

    /**
     * Show input dialog
     */
    showInputDialog(title, inputPlaceholder, inputType = 'text') {
        return Swal.fire({
            title: title,
            input: inputType,
            inputPlaceholder: inputPlaceholder,
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
            inputValidator: (value) => {
                if (!value) {
                    return 'กรุณากรอกข้อมูล';
                }
            }
        });
    },

    /**
     * Show multi-step dialog
     */
    showMultiStepDialog(steps) {
        // This would be implemented for complex multi-step processes
        // For now, it's a placeholder for future enhancement
        console.log('Multi-step dialog not implemented yet');
    },

    /**
     * Check if any modal is open
     */
    isModalOpen() {
        const modals = document.querySelectorAll('.modal.active');
        return modals.length > 0 || document.querySelector('.swal2-container') !== null;
    },

    /**
     * Setup modal keyboard navigation
     */
    setupModalKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.isModalOpen()) {
                switch (e.key) {
                    case 'Escape':
                        this.closeAllModals();
                        break;
                    case 'Tab':
                        this.handleModalTabNavigation(e);
                        break;
                    case 'Enter':
                        if (e.target.type === 'submit' || e.target.classList.contains('btn-primary')) {
                            e.preventDefault();
                            e.target.click();
                        }
                        break;
                }
            }
        });
    },

    /**
     * Handle modal tab navigation
     */
    handleModalTabNavigation(e) {
        const activeModal = document.querySelector('.modal.active');
        if (!activeModal) return;
        
        const focusableElements = activeModal.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    },

    /**
     * Auto-save form data
     */
    autoSaveFormData() {
        const form = DOMUtils.getElementById('bookingForm');
        if (!form) return;
        
        const formData = DOMUtils.getFormData(form);
        const autoSaveKey = `booking_form_${this.currentEditingId || 'new'}`;
        
        try {
            localStorage.setItem(autoSaveKey, JSON.stringify(formData));
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    },

    /**
     * Restore form data from auto-save
     */
    restoreFormData() {
        const autoSaveKey = `booking_form_${this.currentEditingId || 'new'}`;
        
        try {
            const savedData = localStorage.getItem(autoSaveKey);
            if (savedData) {
                const formData = JSON.parse(savedData);
                const form = DOMUtils.getElementById('bookingForm');
                DOMUtils.setFormData(form, formData);
            }
        } catch (error) {
            console.warn('Restore form data failed:', error);
        }
    },

    /**
     * Clear auto-saved form data
     */
    clearAutoSavedData() {
        const autoSaveKey = `booking_form_${this.currentEditingId || 'new'}`;
        
        try {
            localStorage.removeItem(autoSaveKey);
        } catch (error) {
            console.warn('Clear auto-save failed:', error);
        }
    }
});

// Initialize modal keyboard navigation
document.addEventListener('DOMContentLoaded', () => {
    if (window.dashboard) {
        dashboard.setupModalKeyboardNavigation();
    }
});

console.log('📱 Admin Dashboard Modal Management loaded successfully!');
