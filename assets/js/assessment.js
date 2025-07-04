/**
 * Assessment Management for SDQ System - Fixed Version
 */

class Assessment {
    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    static async handleFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formId = form.id;
        const formType = this.getFormType(formId);
        
        if (!formType) {
            Utils.showError('ข้อผิดพลาด', 'ไม่สามารถระบุประเภทแบบฟอร์มได้');
            return;
        }

        try {
            // Validate form data
            const validation = this.validateAssessmentForm(formType);
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

            // Show confirmation before saving
            const confirmResult = await Utils.showConfirm(
                'ยืนยันการบันทึก',
                'คุณต้องการบันทึกการประเมินนี้หรือไม่?',
                'บันทึกการประเมิน',
                'ยกเลิก'
            );

            if (!confirmResult.isConfirmed) {
                return;
            }

            // Prepare assessment data - THIS IS THE KEY FIX
            const assessmentData = this.prepareAssessmentData(formType, validation);
            
            // Save assessment using JSONP
            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.SAVING_ASSESSMENT);
            
            // Pass assessmentData as a parameter, not nested
            const response = await Utils.makeRequest(CONFIG.ENDPOINTS.SAVE_ASSESSMENT, {
                assessmentData: assessmentData
            });
            
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
            Utils.showError('ไม่สามารถบันทึกได้', error.message);
        } finally {
            Utils.showLoading(false);
        }
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
     * Prepare assessment data for saving - FIXED VERSION
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
                form.addEventListener('submit', (e) => this.handleFormSubmit(e));
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

    /**
     * Validate single question answer
     * @param {string} formType - Form type
     * @param {number} questionIndex - Question index
     * @returns {boolean} True if answered
     */
    static isQuestionAnswered(formType, questionIndex) {
        const form = document.getElementById(`${formType}-assessment-form`);
        if (!form) return false;

        if (Utils.isMobile()) {
            const input = form.querySelector(`input[name="q${questionIndex}_${formType}"]`);
            return input && input.value !== '';
        } else {
            const radio = form.querySelector(`input[name="q${questionIndex}_${formType}"]:checked`);
            return !!radio;
        }
    }

    /**
     * Highlight unanswered questions
     * @param {string} formType - Form type
     */
    static highlightUnansweredQuestions(formType) {
        const totalQuestions = Questions.getTotal();
        
        for (let i = 0; i < totalQuestions; i++) {
            const isAnswered = this.isQuestionAnswered(formType, i);
            
            if (Utils.isMobile()) {
                const questionCard = document.getElementById(`question-card-${formType}-${i}`);
                if (questionCard) {
                    if (isAnswered) {
                        questionCard.classList.remove('border-red-300', 'bg-red-50');
                        questionCard.classList.add('border-green-300', 'bg-green-50');
                    } else {
                        questionCard.classList.remove('border-green-300', 'bg-green-50');
                        questionCard.classList.add('border-red-300', 'bg-red-50');
                    }
                }
            } else {
                const radioName = `q${i}_${formType}`;
                const firstRadio = document.getElementById(`${radioName}_0`);
                if (firstRadio) {
                    const row = firstRadio.closest('tr');
                    if (row) {
                        if (isAnswered) {
                            row.classList.remove('bg-red-50');
                            row.classList.add('bg-green-50');
                        } else {
                            row.classList.remove('bg-green-50');
                            row.classList.add('bg-red-50');
                        }
                    }
                }
            }
        }
    }

    /**
     * Show assessment summary before submission
     * @param {string} formType - Form type
     * @param {Object} validation - Validation data
     */
    static async showAssessmentSummary(formType, validation) {
        const progress = this.getAssessmentProgress(formType);
        const studentName = validation.studentData.name;
        const evaluatorInfo = this.getEvaluatorDisplayText(validation.evaluatorData);
        
        const summaryHtml = `
            <div class="text-left">
                <h3 class="text-lg font-semibold mb-3">สรุปการประเมิน</h3>
                <div class="mb-4">
                    <p><strong>นักเรียน:</strong> ${studentName}</p>
                    <p><strong>ผู้ประเมิน:</strong> ${evaluatorInfo}</p>
                    <p><strong>ความครบถ้วน:</strong> ${progress.answered}/${progress.total} คำถาม (${progress.percentage}%)</p>
                </div>
                <div class="bg-blue-50 p-3 rounded">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle"></i>
                        คุณได้ตอบคำถามครบถ้วนแล้ว พร้อมบันทึกการประเมินหรือไม่?
                    </p>
                </div>
            </div>
        `;

        return Swal.fire({
            title: 'ยืนยันการบันทึก',
            html: summaryHtml,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'บันทึกการประเมิน',
            cancelButtonText: 'ตรวจสอบอีกครั้ง',
            customClass: {
                htmlContainer: 'text-left'
            }
        });
    }

    /**
     * Get evaluator display text
     * @param {Object} evaluatorData - Evaluator data
     * @returns {string} Display text
     */
    static getEvaluatorDisplayText(evaluatorData) {
        switch (evaluatorData.type) {
            case 'student':
                return 'นักเรียนประเมินตนเอง';
            case 'teacher':
                return `ครู (${evaluatorData.name || 'ไม่ระบุชื่อ'})`;
            case 'parent':
                return `ผู้ปกครอง (${evaluatorData.name || 'ไม่ระบุชื่อ'}, ${evaluatorData.relation || 'ไม่ระบุความสัมพันธ์'})`;
            default:
                return 'ไม่ระบุ';
        }
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
     * Export assessment data for debugging
     * @param {string} formType - Form type
     * @returns {Object} Assessment debug data
     */
    static exportDebugData(formType) {
        const validation = this.validateAssessmentForm(formType);
        const progress = this.getAssessmentProgress(formType);
        
        return {
            formType: formType,
            timestamp: new Date().toISOString(),
            validation: validation,
            progress: progress,
            autoSaveData: Utils.storage.get(`sdq_autosave_${formType}`)
        };
    }
} return;

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
    }
}
