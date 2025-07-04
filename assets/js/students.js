/**
 * Student Management for SDQ System
 */

class Students {
    static allStudents = [];
    static isLoaded = false;

    /**
     * Load students from Google Apps Script
     */
    static async loadStudents() {
        try {
            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.LOADING_STUDENTS);
            
            const response = await Utils.makeRequest(CONFIG.ENDPOINTS.GET_STUDENTS);
            
            if (response && Array.isArray(response)) {
                this.allStudents = Utils.sortStudents(response);
                this.isLoaded = true;
                this.populateDropdowns();
                this.populateClassFilters();
                Utils.showSuccess('โหลดข้อมูลนักเรียนเรียบร้อย', `พบนักเรียนทั้งหมด ${this.allStudents.length} คน`);
            } else {
                throw new Error('ไม่พบข้อมูลนักเรียนหรือรูปแบบข้อมูลไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            Utils.showError('ไม่สามารถโหลดข้อมูลนักเรียนได้', error.message);
            this.allStudents = [];
            this.isLoaded = false;
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * Populate all student dropdowns
     * @param {Array} students - Optional students array, uses all students if not provided
     */
    static populateDropdowns(students = null) {
        const studentsToUse = students || this.allStudents;
        
        const dropdownIds = [
            'student-name-s',
            'teacher-student-name-t',
            'parent-student-name-p',
            'result-student-name'
        ];

        dropdownIds.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            // Store current selection
            const currentValue = select.value;
            
            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add student options
            studentsToUse.forEach(student => {
                if (!student || !student.id || !student.name) return;
                
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (${student.class || 'ไม่มีข้อมูลชั้น'})`;
                option.dataset.name = student.name;
                option.dataset.class = student.class || 'ไม่มีข้อมูลชั้น';
                select.appendChild(option);
            });

            // Restore selection if still valid
            if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
            } else {
                select.value = '';
            }

            // Trigger change event to update related fields
            select.dispatchEvent(new Event('change'));
        });
    }

    /**
     * Populate class filter dropdowns
     */
    static populateClassFilters() {
        const uniqueClasses = [...new Set(this.allStudents.map(s => s.class).filter(c => c))];
        
        const filterIds = [
            'student-class-filter-s',
            'teacher-class-filter-t',
            'parent-class-filter-p',
            'summary-class'
        ];

        filterIds.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            // Store current selection
            const currentValue = select.value;
            
            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add class options
            uniqueClasses.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                select.appendChild(option);
            });

            // Restore selection if still valid
            if (currentValue !== 'all' && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
            }
        });
    }

    /**
     * Handle class filter change
     * @param {Event} event - Change event
     */
    static handleClassFilterChange(event) {
        const selectedClass = event.target.value;
        const filterId = event.target.id;
        
        let studentsToDisplay;
        if (selectedClass === 'all') {
            studentsToDisplay = this.allStudents;
        } else {
            studentsToDisplay = this.allStudents.filter(student => student.class === selectedClass);
        }

        // Determine target dropdown
        let targetDropdownId;
        if (filterId.includes('student')) {
            targetDropdownId = 'student-name-s';
        } else if (filterId.includes('teacher')) {
            targetDropdownId = 'teacher-student-name-t';
        } else if (filterId.includes('parent')) {
            targetDropdownId = 'parent-student-name-p';
        }

        if (targetDropdownId) {
            const select = document.getElementById(targetDropdownId);
            if (select) {
                // Clear and repopulate specific dropdown
                while (select.options.length > 1) {
                    select.remove(1);
                }

                studentsToDisplay.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = `${student.name} (${student.class || 'ไม่มีข้อมูลชั้น'})`;
                    option.dataset.name = student.name;
                    option.dataset.class = student.class || 'ไม่มีข้อมูลชั้น';
                    select.appendChild(option);
                });

                select.dispatchEvent(new Event('change'));
            }
        }
    }

    /**
     * Setup student select change handlers
     */
    static setupChangeHandlers() {
        const handlers = [
            {
                selectId: 'student-name-s',
                classDisplayId: 'student-class-s'
            },
            {
                selectId: 'teacher-student-name-t',
                classDisplayId: 'teacher-student-class-t'
            }
        ];

        handlers.forEach(handler => {
            const select = document.getElementById(handler.selectId);
            const classDisplay = document.getElementById(handler.classDisplayId);
            
            if (!select || !classDisplay) return;

            // Remove existing handler if any
            if (select._changeHandler) {
                select.removeEventListener('change', select._changeHandler);
            }

            // Create new handler
            const changeHandler = function() {
                if (this.value && this.selectedIndex > 0) {
                    const selectedOption = this.options[this.selectedIndex];
                    classDisplay.value = selectedOption.dataset.class;
                } else {
                    classDisplay.value = '';
                }
            };

            // Add handler
            select.addEventListener('change', changeHandler);
            select._changeHandler = changeHandler;

            // Trigger initial change if there's a value
            if (select.value) {
                select.dispatchEvent(new Event('change'));
            }
        });

        // Setup class filter handlers
        const filterIds = [
            'student-class-filter-s',
            'teacher-class-filter-t',
            'parent-class-filter-p'
        ];

        filterIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', (e) => this.handleClassFilterChange(e));
            }
        });
    }

    /**
     * Add student manually
     * @param {Object} studentData - Student data {name, class}
     */
    static async addStudent(studentData) {
        try {
            if (!studentData.name || !studentData.class) {
                throw new Error('ข้อมูลไม่สมบูรณ์');
            }

            // Check for duplicates
            const isDuplicate = this.allStudents.some(student => 
                student.name.trim().toLowerCase() === studentData.name.trim().toLowerCase() &&
                student.class.trim().toLowerCase() === studentData.class.trim().toLowerCase()
            );

            if (isDuplicate) {
                Utils.showWarning('พบข้อมูลซ้ำ', `มีนักเรียน "${studentData.name}" ในชั้น "${studentData.class}" อยู่แล้ว`);
                return false;
            }

            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.ADDING_STUDENT);

            const response = await Utils.makeRequest(CONFIG.ENDPOINTS.ADD_STUDENT_MANUAL, studentData);

            if (response && response.success) {
                Utils.showSuccess('เพิ่มนักเรียนสำเร็จ', response.message);
                await this.loadStudents(); // Reload students
                return true;
            } else {
                throw new Error(response?.message || 'ไม่สามารถเพิ่มนักเรียนได้');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            Utils.showError('ไม่สามารถเพิ่มนักเรียนได้', error.message);
            return false;
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * Import students from Excel
     * @param {Array} studentsData - Array of student objects
     */
    static async importStudents(studentsData) {
        try {
            if (!Array.isArray(studentsData) || studentsData.length === 0) {
                throw new Error('ไม่มีข้อมูลนักเรียนให้นำเข้า');
            }

            // Validate data format
            const invalidData = studentsData.filter(student => !student.name || !student.class);
            if (invalidData.length > 0) {
                throw new Error(`พบข้อมูลไม่สมบูรณ์ ${invalidData.length} รายการ`);
            }

            const result = await Utils.showConfirm(
                'ยืนยันการนำเข้าข้อมูล',
                `คุณต้องการนำเข้าข้อมูลนักเรียน ${studentsData.length} คน หรือไม่?\n\n⚠️ การดำเนินการนี้จะแทนที่ข้อมูลนักเรียนเดิมทั้งหมด`,
                'ยืนยันการนำเข้า',
                'ยกเลิก'
            );

            if (!result.isConfirmed) {
                return false;
            }

            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.IMPORTING_STUDENTS);

            const response = await Utils.makeRequest(CONFIG.ENDPOINTS.IMPORT_STUDENTS, studentsData);

            if (response && response.success) {
                Utils.showSuccess('นำเข้าข้อมูลสำเร็จ', response.message);
                await this.loadStudents(); // Reload students
                return true;
            } else {
                throw new Error(response?.message || 'ไม่สามารถนำเข้าข้อมูลได้');
            }
        } catch (error) {
            console.error('Error importing students:', error);
            Utils.showError('ไม่สามารถนำเข้าข้อมูลได้', error.message);
            return false;
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * Handle Excel file import
     * @param {Event} event - File input change event
     */
    static async handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            Utils.showError('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Utils.showError('ไฟล์ใหญ่เกินไป', 'ขนาดไฟล์ต้องไม่เกิน 5MB');
            event.target.value = '';
            return;
        }

        try {
            Utils.showLoading(true, 'กำลังอ่านไฟล์ Excel...');

            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            if (workbook.SheetNames.length === 0) {
                throw new Error('ไม่พบแผ่นงานในไฟล์ Excel');
            }

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                throw new Error('ไม่พบข้อมูลในไฟล์ Excel');
            }

            // Validate required columns
            const requiredColumns = ['ชื่อ-นามสกุล', 'ชั้นเรียน'];
            const firstRow = jsonData[0];
            const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));

            if (missingColumns.length > 0) {
                throw new Error(`ไฟล์ Excel ต้องมีคอลัมน์: ${missingColumns.join(', ')}`);
            }

            // Process data
            const studentsData = jsonData.map((row, index) => {
                const name = String(row['ชื่อ-นามสกุล'] || '').trim();
                const className = String(row['ชั้นเรียน'] || '').trim();

                if (!name || !className) {
                    console.warn(`Row ${index + 2}: Missing required data`, row);
                    return null;
                }

                return { name, class: className };
            }).filter(student => student !== null);

            if (studentsData.length === 0) {
                throw new Error('ไม่พบข้อมูลนักเรียนที่ถูกต้องในไฟล์');
            }

            // Show preview and confirm
            const previewText = studentsData.slice(0, 5).map(s => `• ${s.name} (${s.class})`).join('\n');
            const moreText = studentsData.length > 5 ? `\n... และอีก ${studentsData.length - 5} คน` : '';

            const result = await Swal.fire({
                title: 'ตรวจสอบข้อมูลก่อนนำเข้า',
                html: `
                    <div class="text-left">
                        <p class="mb-3">พบข้อมูลนักเรียน <strong>${studentsData.length}</strong> คน:</p>
                        <div class="bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-line">
${previewText}${moreText}
                        </div>
                        <p class="mt-3 text-red-600 text-sm">
                            ⚠️ การนำเข้าจะแทนที่ข้อมูลนักเรียนเดิมทั้งหมด
                        </p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'นำเข้าข้อมูล',
                cancelButtonText: 'ยกเลิก',
                customClass: {
                    htmlContainer: 'text-left'
                }
            });

            if (result.isConfirmed) {
                await this.importStudents(studentsData);
            }

        } catch (error) {
            console.error('Excel import error:', error);
            Utils.showError('เกิดข้อผิดพลาด', `ไม่สามารถประมวลผลไฟล์ Excel ได้: ${error.message}`);
        } finally {
            Utils.showLoading(false);
            event.target.value = ''; // Clear file input
        }
    }

    /**
     * Read file as ArrayBuffer
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} File content as ArrayBuffer
     */
    static readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Get student by ID
     * @param {string} studentId - Student ID
     * @returns {Object|null} Student object or null
     */
    static getStudentById(studentId) {
        return this.allStudents.find(student => student.id === studentId) || null;
    }

    /**
     * Search students by name or class
     * @param {string} query - Search query
     * @returns {Array} Filtered students
     */
    static searchStudents(query) {
        if (!query.trim()) return this.allStudents;

        const searchTerm = query.toLowerCase().trim();
        return this.allStudents.filter(student => 
            student.name.toLowerCase().includes(searchTerm) ||
            student.class.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get students by class
     * @param {string} className - Class name
     * @returns {Array} Students in the class
     */
    static getStudentsByClass(className) {
        return this.allStudents.filter(student => student.class === className);
    }

    /**
     * Get all unique classes
     * @returns {Array} Array of unique class names
     */
    static getAllClasses() {
        return [...new Set(this.allStudents.map(s => s.class).filter(c => c))];
    }

    /**
     * Get statistics
     * @returns {Object} Student statistics
     */
    static getStatistics() {
        const classes = this.getAllClasses();
        const classCounts = {};
        
        classes.forEach(className => {
            classCounts[className] = this.getStudentsByClass(className).length;
        });

        return {
            totalStudents: this.allStudents.length,
            totalClasses: classes.length,
            classCounts: classCounts,
            averageStudentsPerClass: Math.round(this.allStudents.length / classes.length)
        };
    }

    /**
     * Export students data
     * @returns {Object} Export data
     */
    static exportData() {
        return {
            version: '1.0',
            timestamp: Utils.formatDate(),
            totalStudents: this.allStudents.length,
            students: this.allStudents,
            statistics: this.getStatistics()
        };
    }

    /**
     * Initialize students management
     */
    static async init() {
        try {
            await this.loadStudents();
            this.setupChangeHandlers();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize students:', error);
        }
    }

    /**
     * Setup event listeners
     */
    static setupEventListeners() {
        // Excel import
        const excelInput = document.getElementById('excel-file-input');
        if (excelInput) {
            excelInput.addEventListener('change', (e) => this.handleExcelImport(e));
        }

        // Manual add student
        const manualAddBtn = document.getElementById('manual-add-student-btn');
        const manualAddModal = document.getElementById('manual-add-modal');
        const cancelBtn = document.getElementById('cancel-add-btn');
        const manualAddForm = document.getElementById('manual-add-form');

        if (manualAddBtn && manualAddModal) {
            manualAddBtn.addEventListener('click', () => {
                manualAddModal.classList.remove('hidden');
                Utils.fadeIn(manualAddModal);
            });
        }

        if (cancelBtn && manualAddModal) {
            cancelBtn.addEventListener('click', () => {
                manualAddModal.classList.add('hidden');
            });
        }

        if (manualAddForm) {
            manualAddForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const nameInput = document.getElementById('manual-student-name');
                const classInput = document.getElementById('manual-student-class');
                
                const studentData = {
                    name: nameInput.value.trim(),
                    class: classInput.value.trim()
                };

                const success = await this.addStudent(studentData);
                if (success && manualAddModal) {
                    manualAddModal.classList.add('hidden');
                    manualAddForm.reset();
                }
            });
        }

        // Close modal on outside click
        if (manualAddModal) {
            manualAddModal.addEventListener('click', (e) => {
                if (e.target === manualAddModal) {
                    manualAddModal.classList.add('hidden');
                }
            });
        }
    }

    /**
     * Check if students are loaded
     * @returns {boolean} True if loaded
     */
    static isDataLoaded() {
        return this.isLoaded && this.allStudents.length > 0;
    }

    /**
     * Refresh student data
     */
    static async refresh() {
        await this.loadStudents();
    }
}
