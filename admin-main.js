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
