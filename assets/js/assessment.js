/**
 * Assessment Management for SDQ System - Final Fixed Version
 */

class Assessment {
    /**
     * Handle form submission - COMPLETELY FIXED
     * @param {Event} event - Form submit event
     */
    static async handleFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formId = form.id;
        const formType = this.getFormType(formId);
        
        console.log('Form submission started:', { formId, formType });
        
        if (!formType) {
            Utils.showError('ข้อผิดพลาด', 'ไม่สามารถระบุประเภทแบบฟอร์มได้');
            return;
        }

        try {
            // Step 1: Validate form data
            console.log('Step 1: Validating form data...');
            const validation = this.validateAssessmentForm(formType);
            console.log('Validation result:', validation);
            
            if (!validation.isValid) {
                if (validation.missingStudent) {
                    Utils.showWarning('ข้อมูลไม่สมบูรณ์', 'กรุณาเลือกชื่อนักเรียน');
                    return;
                }
                
                if (validation.missingEvaluator) {
                    Utils.showWarning('ข้อมูลไม่สมบูรณ์', validation.missingEvaluator);
                    return;
                }
                
                if (validation.firstUnanswered) {
                    Utils.showWarning(
                        'คำถามยังไม่ครบ', 
                        `กรุณาตอบคำถามข้อที่ ${validation.firstUnanswered}: ${validation.questionText?.substring(0, 50)}...`
                    );
                    Questions.scrollToQuestion(formType, validation.firstUnanswered - 1);
                    return;
                }
                
                Utils.showWarning('ข้อมูลไม่สมบูรณ์', 'กรุณาตรวจสอบข้อมูลและคำตอบให้ครบถ้วน');
                return;
            }

            // Step 2: Show confirmation
            console.log('Step 2: Showing confirmation dialog...');
            const confirmResult = await Utils.showConfirm(
                'ยืนยันการบันทึก',
                'คุณต้องการบันทึกการประเมินนี้หรือไม่?',
                'บันทึกการประเมิน',
                'ยกเลิก'
            );

            if (!confirmResult.isConfirmed) {
                console.log('User cancelled submission');
                return;
            }

            // Step 3: Prepare assessment data - CRITICAL FIX
            console.log('Step 3: Preparing assessment data...');
            const assessmentData = this.prepareAssessmentData(formType, validation);
            console.log('Assessment data prepared:', assessmentData);
            
            // Validate the prepared data before sending
            if (!this.validatePreparedData(assessmentData)) {
                Utils.showError('ข้อผิดพลาด', 'ข้อมูลการประเมินที่เตรียมไว้ไม่สมบูรณ์');
                return;
            }

            // Step 4: Save assessment using JSONP - FIXED FORMAT
            console.log('Step 4: Saving assessment via JSONP...');
            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.SAVING_ASSESSMENT);
            
                // Debug: แสดงข้อมูลก่อนส่ง
                console.log('Data to send:', {
                    studentId: assessmentData.studentId,
                    studentName: assessmentData.studentName,
                    studentClass: assessmentData.studentClass,
                    evaluatorType: assessmentData.evaluatorType,
                    evaluatorName: assessmentData.evaluatorName || '',
                    relation: assessmentData.relation || '',
                    answersArray: assessmentData.answers,
                    answersString: JSON.stringify(assessmentData.answers)
                });
                
                // ส่งข้อมูลในรูปแบบที่ Google Apps Script เข้าใจ
                const response = await Utils.makeRequest(CONFIG.ENDPOINTS.SAVE_ASSESSMENT, {
                    studentId: assessmentData.studentId,
                    studentName: assessmentData.studentName,
                    studentClass: assessmentData.studentClass,
                    evaluatorType: assessmentData.evaluatorType,
                    evaluatorName: assessmentData.evaluatorName || '',
                    relation: assessmentData.relation || '',
                    answers: JSON.stringify(assessmentData.answers)
                });
                
                console.log('Server response:', response);
                
                // เพิ่มการแสดง debug info ถ้า response มี error
                if (response && !response.success && response.debug) {
                    console.log('Debug info from server:', response.debug);
                    console.log('Server received data:', response.debug.receivedData);
                }
            
            if (response && response.success) {
                Utils.showSuccess('บันทึกเรียบร้อย', 'การประเมินถูกบันทึกเรียบร้อยแล้ว');
                
                // Reset form
                this.resetForm(formType);
                
                // Navigate to results page
                await this.showResults(response);
                
            } else {
                throw new Error(response?.message || 'ไม่สามารถบันทึกการประเมินได้');
            }
            
        } catch (error) {
            console.error('Assessment save error:', error);
            Utils.showError('ไม่สามารถบันทึกได้', 'เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * Validate prepared assessment data before sending
     * @param {Object} data - Prepared assessment data
     * @returns {boolean} True if valid
     */
    static validatePreparedData(data) {
        const required = ['studentId', 'studentName', 'studentClass', 'evaluatorType', 'answers'];
        
        for (const field of required) {
            if (!data[field]) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }
        
        if (!Array.isArray(data.answers) || data.answers.length !== 25) {
            console.error(`Invalid answers array:`, data.answers);
            return false;
        }
        
        // Check if all answers are valid numbers (0, 1, or 2)
        for (let i = 0; i < data.answers.length; i++) {
            const answer = parseInt(data.answers[i]);
            if (isNaN(answer) || answer < 0 || answer > 2) {
                console.error(`Invalid answer at index ${i}:`, data.answers[i]);
                return false;
            }
        }
        
        console.log('Assessment data validation passed');
        return true;
    }

    /**
     * Get form type from form ID
     * @param {string} formId - Form ID
     * @returns {string|null} Form type
     */
    static getFormType(formId) {
        if (formId.includes('student')) return 'student';
        if (formId.includes('teacher')) return 'teacher';
        if (formId.includes('parent')) return 'parent';
        return null;
    }

    /**
     * Validate assessment form
     * @param {string} formType - Type of form
     * @returns {Object} Validation result
     */
    static validateAssessmentForm(formType) {
        const result = {
            isValid: false,
            studentData: null,
            evaluatorData: null,
            answers: null,
            missingStudent: false,
            missingEvaluator: null,
            firstUnanswered: null,
            questionText: null
        };

        // Validate student selection
        const studentSelectId = this.getStudentSelectId(formType);
        result.studentData = Utils.getSelectedStudentData(studentSelectId);
        
        if (!result.studentData) {
            result.missingStudent = true;
            return result;
        }

        // Validate evaluator data
        const evaluatorValidation = this.validateEvaluatorData(formType);
        if (!evaluatorValidation.isValid) {
            result.missingEvaluator = evaluatorValidation.message;
            return result;
        }
        result.evaluatorData = evaluatorValidation.data;

        // Validate answers
        const answersValidation = Questions.validateAnswers(formType);
        if (!answersValidation.isValid) {
            result.firstUnanswered = answersValidation.firstUnanswered;
            result.questionText = answersValidation.questionText;
            return result;
        }
        result.answers = answersValidation.answers;

        result.isValid = true;
        return result;
    }

    /**
     * Get student select ID for form type
     * @param {string} formType - Form type
     * @returns {string} Select element ID
     */
    static getStudentSelectId(formType) {
        const selectIds = {
            student: 'student-name-s',
            teacher: 'teacher-student-name-t',
            parent: 'parent-student-name-p'
        };
        return selectIds[formType];
    }

    /**
     * Validate evaluator specific data
     * @param {string} formType - Form type
     * @returns {Object} Validation result
     */
    static validateEvaluatorData(formType) {
        const result = { isValid: false, data: {}, message: '' };

        switch (formType) {
            case 'student':
                result.isValid = true;
                result.data = { type: 'student' };
                break;

            case 'teacher':
                const teacherNameInput = document.getElementById('teacher-name-t');
                if (!teacherNameInput || !teacherNameInput.value.trim()) {
                    result.message = 'กรุณาระบุชื่อครูผู้ประเมิน';
                    return result;
                }
                result.isValid = true;
                result.data = {
                    type: 'teacher',
                    name: teacherNameInput.value.trim()
                };
                break;

            case 'parent':
                const parentNameInput = document.getElementById('parent-name-p');
                const relationSelect = document.getElementById('parent-relation-p');
                
                if (!parentNameInput || !parentNameInput.value.trim()) {
                    result.message = 'กรุณาระบุชื่อผู้ปกครอง';
                    return result;
                }
                
                if (!relationSelect || !relationSelect.value) {
                    result.message = 'กรุณาระบุความสัมพันธ์กับนักเรียน';
                    return result;
                }
                
                result.isValid = true;
                result.data = {
                    type: 'parent',
                    name: parentNameInput.value.trim(),
                    relation: relationSelect.value
                };
                break;

            default:
                result.message = 'ประเภทผู้ประเมินไม่ถูกต้อง';
        }

        return result;
    }

    /**
     * Prepare assessment data for saving - COMPLETELY FIXED
     * @param {string} formType - Form type
     * @param {Object} validation - Validation result
     * @returns {Object} Assessment data
     */
    static prepareAssessmentData(formType, validation) {
        const data = {
            studentId: validation.studentData.id,
            studentName: validation.studentData.name,
            studentClass: validation.studentData.class,
            evaluatorType: validation.evaluatorData.type,
            answers: validation.answers
        };

        // Add evaluator specific data
        if (validation.evaluatorData.name) {
            data.evaluatorName = validation.evaluatorData.name;
        }
        
        if (validation.evaluatorData.relation) {
            data.relation = validation.evaluatorData.relation;
        }

        return data;
    }

    /**
     * Reset assessment form
     * @param {string} formType - Form type
     */
    static resetForm(formType) {
        const form = document.getElementById(`${formType}-assessment-form`);
        if (!form) return;

        // Reset form fields
        form.reset();
        
        // Reset questions
        Questions.resetForm(formType);
        
        // Reset class display fields
        const classDisplayIds = {
            student: 'student-class-s',
            teacher: 'teacher-student-class-t'
        };
        
        const classDisplayId = classDisplayIds[formType];
        if (classDisplayId) {
            const classDisplay = document.getElementById(classDisplayId);
            if (classDisplay) {
                classDisplay.value = '';
            }
        }

        // Reset class filters
        const filterIds = {
            student: 'student-class-filter-s',
            teacher: 'teacher-class-filter-t',
            parent: 'parent-class-filter-p'
        };
        
        const filterId = filterIds[formType];
        if (filterId) {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.value = 'all';
                filter.dispatchEvent(new Event('change'));
            }
        }

        // Clear auto-saved data
        this.clearAutoSavedData(formType);

        // Show success message briefly for mobile
        if (Utils.isMobile()) {
            const container = document.getElementById(`questions-container-${formType}`);
            if (container) {
                const successMsg = document.createElement('div');
                successMsg.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
                successMsg.innerHTML = '✅ แบบฟอร์มถูกรีเซ็ตแล้ว พร้อมสำหรับการประเมินครั้งต่อไป';
                container.insertBefore(successMsg, container.firstChild);
                
                setTimeout(() => {
                    if (successMsg.parentNode) {
                        successMsg.parentNode.removeChild(successMsg);
                    }
                }, 3000);
            }
        }
    }

    /**
     * Show assessment results
     * @param {Object} response - Server response
     */
    static async showResults(response) {
        try {
            // Update results dropdowns
            if (Students.isDataLoaded()) {
                Students.populateDropdowns();
            }

            // Set result filters
            const resultStudentSelect = document.getElementById('result-student-name');
            const resultEvaluatorSelect = document.getElementById('result-evaluator-type');
            
            if (resultStudentSelect && response.studentInfo?.id) {
                resultStudentSelect.value = response.studentInfo.id;
            }
            
            if (resultEvaluatorSelect && response.studentInfo?.evaluatorType) {
                resultEvaluatorSelect.value = response.studentInfo.evaluatorType;
            }

            // Show results page
            if (window.App) {
                App.showPage('page-results');
            }
            
            // Display results
            if (window.Results) {
                Results.displayIndividualResults(response);
            }
            
        } catch (error) {
            console.error('Error showing results:', error);
            // Still navigate to results page even if there's an error
            if (window.App) {
                App.showPage('page-results');
            }
        }
    }

    /**
     * Handle print form button
     * @param {string} formType - Form type
     */
    static handlePrintForm(formType) {
        const studentData = Utils.getSelectedStudentData(this.getStudentSelectId(formType));
        
        if (!studentData) {
            Utils.showWarning('ไม่สามารถพิมพ์ได้', 'กรุณาเลือกนักเรียนก่อนพิมพ์แบบฟอร์ม');
            return;
        }

        let title = `แบบประเมิน SDQ - ${studentData.name}`;
        
        switch (formType) {
            case 'teacher':
                title += ' (ประเมินโดยครู)';
                break;
            case 'parent':
                title += ' (ประเมินโดยผู้ปกครอง)';
                break;
        }

        Utils.printWithTitle(title);
    }

    /**
     * Setup event listeners for assessment forms
     */
    static setupEventListeners() {
        // Form submit handlers
        const formIds = [
            'student-assessment-form',
            'teacher-assessment-form', 
            'parent-assessment-form'
        ];

        formIds.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                // Remove existing listeners to prevent duplicates
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                // Add new listener
                newForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
            }
        });

        // Print form button handlers
        document.querySelectorAll('.print-form-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const form = e.target.closest('.page');
                let formType = '';
                
                if (form.id.includes('student')) formType = 'student';
                else if (form.id.includes('teacher')) formType = 'teacher';
                else if (form.id.includes('parent')) formType = 'parent';
                
                if (formType) {
                    this.handlePrintForm(formType);
                }
            });
        });

        // Auto-save functionality (optional)
        if (CONFIG.AUTO_SAVE_ENABLED) {
            this.setupAutoSave();
        }
    }

    /**
     * Setup auto-save functionality
     */
    static setupAutoSave() {
        const forms = ['student', 'teacher', 'parent'];
        
        forms.forEach(formType => {
            const form = document.getElementById(`${formType}-assessment-form`);
            if (!form) return;

            // Save form data to localStorage on input change
            const debouncedSave = Utils.debounce(() => {
                this.autoSaveFormData(formType);
            }, 2000);

            form.addEventListener('input', debouncedSave);
            form.addEventListener('change', debouncedSave);

            // Load saved data on page load
            this.loadAutoSavedData(formType);
        });
    }

    /**
     * Auto-save form data to localStorage
     * @param {string} formType - Form type
     */
    static autoSaveFormData(formType) {
        try {
            const form = document.getElementById(`${formType}-assessment-form`);
            if (!form) return;

            const data = {
                timestamp: Date.now(),
                formType: formType,
                studentId: '',
                evaluatorData: {},
                answers: []
            };

            // Save student selection
            const studentData = Utils.getSelectedStudentData(this.getStudentSelectId(formType));
            if (studentData) {
                data.studentId = studentData.id;
            }

            // Save evaluator data
            const evaluatorValidation = this.validateEvaluatorData(formType);
            if (evaluatorValidation.isValid) {
                data.evaluatorData = evaluatorValidation.data;
            }

            // Save answers
            const answers = Questions.getAnswers(formType);
            if (answers) {
                data.answers = answers;
            }

            Utils.storage.set(`sdq_autosave_${formType}`, data);
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    /**
     * Load auto-saved form data
     * @param {string} formType - Form type
     */
    static loadAutoSavedData(formType) {
        try {
            const savedData = Utils.storage.get(`sdq_autosave_${formType}`);
            if (!savedData) return;

            // Check if data is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000;
            if (Date.now() - savedData.timestamp > maxAge) {
                Utils.storage.remove(`sdq_autosave_${formType}`);
                return;
            }

            // Ask user if they want to restore
            Utils.showConfirm(
                'พบข้อมูลที่บันทึกไว้',
                'มีข้อมูลการประเมินที่บันทึกไว้อัตโนมัติ ต้องการกู้คืนหรือไม่?',
                'กู้คืนข้อมูล',
                'เริ่มใหม่'
            ).then(result => {
                if (result.isConfirmed) {
                    this.restoreAutoSavedData(formType, savedData);
                } else {
                    Utils.storage.remove(`sdq_autosave_${formType}`);
                }
            });

        } catch (error) {
            console.warn('Failed to load auto-saved data:', error);
            Utils.storage.remove(`sdq_autosave_${formType}`);
        }
    }

    /**
     * Restore auto-saved form data
     * @param {string} formType - Form type
     * @param {Object} savedData - Saved data
     */
    static restoreAutoSavedData(formType, savedData) {
        try {
            const form = document.getElementById(`${formType}-assessment-form`);
            if (!form) return;

            // Restore student selection
            if (savedData.studentId) {
                const studentSelect = document.getElementById(this.getStudentSelectId(formType));
                if (studentSelect) {
                    studentSelect.value = savedData.studentId;
                    studentSelect.dispatchEvent(new Event('change'));
                }
            }

            // Restore evaluator data
            if (savedData.evaluatorData) {
                const evaluatorData = savedData.evaluatorData;
                
                if (evaluatorData.name) {
                    const nameField = document.getElementById(`${formType}-name-${formType.charAt(0)}`);
                    if (nameField) {
                        nameField.value = evaluatorData.name;
                    }
                }
                
                if (evaluatorData.relation) {
                    const relationField = document.getElementById(`${formType}-relation-${formType.charAt(0)}`);
                    if (relationField) {
                        relationField.value = evaluatorData.relation;
                    }
                }
            }

            // Restore answers
            if (savedData.answers && savedData.answers.length === Questions.getTotal()) {
                savedData.answers.forEach((answer, index) => {
                    if (Utils.isMobile()) {
                        // Mobile form
                        const hiddenInput = form.querySelector(`input[name="q${index}_${formType}"]`);
                        if (hiddenInput) {
                            hiddenInput.value = answer;
                            
                            // Update visual state
                            const questionCard = document.getElementById(`question-card-${formType}-${index}`);
                            if (questionCard) {
                                const answerBtns = questionCard.querySelectorAll('.answer-btn');
                                answerBtns.forEach(btn => btn.classList.remove('selected'));
                                
                                const selectedBtn = questionCard.querySelector(`[data-value="${answer}"]`);
                                if (selectedBtn) {
                                    selectedBtn.classList.add('selected');
                                }
                                
                                questionCard.classList.add('answered');
                            }
                        }
                    } else {
                        // Desktop form
                        const radio = form.querySelector(`input[name="q${index}_${formType}"][value="${answer}"]`);
                        if (radio) {
                            radio.checked = true;
                            const label = radio.nextElementSibling;
                            if (label && label.classList.contains('radio-option')) {
                                label.classList.add('selected');
                            }
                        }
                    }
                });

                // Update progress for mobile
                if (Utils.isMobile()) {
                    Questions.updateProgress(formType);
                }
            }

            Utils.showSuccess('กู้คืนข้อมูลสำเร็จ', 'ข้อมูลการประเมินที่บันทึกไว้ถูกกู้คืนแล้ว');
            
        } catch (error) {
            console.error('Failed to restore auto-saved data:', error);
            Utils.showError('ไม่สามารถกู้คืนข้อมูลได้', 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
        }
    }

    /**
     * Clear auto-saved data
     * @param {string} formType - Form type
     */
    static clearAutoSavedData(formType) {
        Utils.storage.remove(`sdq_autosave_${formType}`);
    }

    /**
     * Initialize assessment module
     */
    static init() {
        this.setupEventListeners();
        
        // Set up form validation on page load
        setTimeout(() => {
            this.setupFormValidation();
        }, 1000);
    }

    /**
     * Setup real-time form validation
     */
    static setupFormValidation() {
        const forms = ['student', 'teacher', 'parent'];
        
        forms.forEach(formType => {
            const form = document.getElementById(`${formType}-assessment-form`);
            if (!form) return;

            // Add validation on form change
            form.addEventListener('change', Utils.debounce(() => {
                this.validateFormRealTime(formType);
            }, 500));
        });
    }

    /**
     * Real-time form validation
     * @param {string} formType - Form type
     */
    static validateFormRealTime(formType) {
        const progress = this.getAssessmentProgress(formType);
        
        // Update progress display if exists
        const progressElement = document.getElementById(`progress-text-${formType}`);
        if (progressElement) {
            progressElement.textContent = `${progress.answered} / ${progress.total} คำถาม`;
        }
        
        const progressBar = document.getElementById(`progress-${formType}`);
        if (progressBar) {
            progressBar.style.width = `${progress.percentage}%`;
        }
    }

    /**
     * Get assessment progress
     * @param {string} formType - Form type
     * @returns {Object} Progress information
     */
    static getAssessmentProgress(formType) {
        const answers = Questions.getAnswers(formType);
        const totalQuestions = Questions.getTotal();
        
        if (!answers) {
            // Count answered questions manually
            const form = document.getElementById(`${formType}-assessment-form`);
            if (!form) return { answered: 0, total: totalQuestions, percentage: 0 };
            
            let answeredCount = 0;
            for (let i = 0; i < totalQuestions; i++) {
                if (Utils.isMobile()) {
                    const input = form.querySelector(`input[name="q${i}_${formType}"]`);
                    if (input && input.value !== '') answeredCount++;
                } else {
                    const radio = form.querySelector(`input[name="q${i}_${formType}"]:checked`);
                    if (radio) answeredCount++;
                }
            }
            
            return {
                answered: answeredCount,
                total: totalQuestions,
                percentage: Math.round((answeredCount / totalQuestions) * 100)
            };
        }
        
        return {
            answered: answers.length,
            total: totalQuestions,
            percentage: Math.round((answers.length / totalQuestions) * 100)
        };
    }
}
