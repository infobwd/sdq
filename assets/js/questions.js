/**
 * Questions Data and Management for SDQ System
 */

class Questions {
    static data = [
        { text: "1. มักจะมีอาการปวดศีรษะ ปวดท้อง หรือไม่สบาย", category: "emotional" },
        { text: "2. กังวลใจหลายเรื่อง ดูเหมือนกังวลเสมอ", category: "emotional" },
        { text: "3. ไม่มีความสุข ท้อแท้ ร้องไห้บ่อย", category: "emotional" },
        { text: "4. วิตกกังวลหรือติดแจเมื่ออยู่ในสถานการณ์ใหม่ เสียความมั่นใจง่าย", category: "emotional" },
        { text: "5. มีความกลัวหลายเรื่อง หวาดกลัวง่าย", category: "emotional" },
        
        { text: "6. แผลงฤทธิ์บ่อย หรืออารมณ์ร้อน", category: "conduct" },
        { text: "7. โดยปกติแล้ว เชื่อฟัง ทำตามที่ผู้ใหญ่บอก", category: "conduct", reverseScore: true },
        { text: "8. มีเรื่องต่อสู้หรือรังแกเด็กอื่นบ่อยๆ", category: "conduct" },
        { text: "9. พูดปดหรือขี้โกงบ่อยๆ", category: "conduct" },
        { text: "10. ขโมยของที่บ้าน ที่โรงเรียน หรือที่อื่น", category: "conduct" },
        
        { text: "11. อยู่ไม่สุข เคลื่อนไหวมาก ไม่สามารถอยู่นิ่งได้นาน", category: "hyperactivity" },
        { text: "12. หยุกหยิก หรือดิ้นไปดิ้นมาตลอดเวลา", category: "hyperactivity" },
        { text: "13. วอกแวกง่าย ไม่มีสมาธิ", category: "hyperactivity" },
        { text: "14. คิดก่อนทำ", category: "hyperactivity", reverseScore: true },
        { text: "15. มีสมาธิในการติดตามทำงานจนเสร็จ", category: "hyperactivity", reverseScore: true },
        
        { text: "16. ค่อนข้างอยู่โดดเดี่ยว มักเล่นตามลำพัง", category: "peer" },
        { text: "17. มีเพื่อนสนิทอย่างน้อยหนึ่งคน", category: "peer", reverseScore: true },
        { text: "18. โดยทั่วไปเป็นที่ชอบพอของเด็กอื่น", category: "peer", reverseScore: true },
        { text: "19. ถูกเด็กคนอื่นแกล้งหรือรังแก", category: "peer" },
        { text: "20. เข้ากับผู้ใหญ่ได้ดีกว่าเข้ากับเด็กอื่น", category: "peer" },
        
        { text: "21. ใส่ใจความรู้สึกของผู้อื่น", category: "prosocial" },
        { text: "22. เต็มใจแบ่งปันกับผู้อื่น (ขนม ของเล่น ดินสอ ฯลฯ)", category: "prosocial" },
        { text: "23. ช่วยเหลือถ้ามีใครบาดเจ็บ ไม่สบายใจ หรือเจ็บป่วย", category: "prosocial" },
        { text: "24. ใจดีกับเด็กที่อายุน้อยกว่า", category: "prosocial" },
        { text: "25. มักอาสาช่วยเหลือผู้อื่น (พ่อแม่ ครู เด็กอื่น)", category: "prosocial" }
    ];

    /**
     * Generate question forms for assessment pages
     */
    static generateForms() {
        const formTypes = ['student', 'teacher', 'parent'];
        
        formTypes.forEach(formType => {
            if (Utils.isMobile()) {
                this.generateMobileForm(formType);
            } else {
                this.generateDesktopForm(formType);
            }
        });
    }

    /**
     * Generate mobile-optimized question form
     * @param {string} formType - Type of form (student, teacher, parent)
     */
    static generateMobileForm(formType) {
        const container = document.getElementById(`questions-container-${formType}`);
        if (!container) return;

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar mb-6';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: 0%" id="progress-${formType}"></div>
        `;
        container.appendChild(progressBar);

        // Create progress text
        const progressText = document.createElement('div');
        progressText.className = 'text-center text-sm text-gray-600 mb-6';
        progressText.innerHTML = `<span id="progress-text-${formType}">0 / 25 คำถาม</span>`;
        container.appendChild(progressText);

        let currentCategory = null;
        let answeredCount = 0;

        this.data.forEach((questionObj, index) => {
            // Add category header
            if (questionObj.category !== currentCategory) {
                currentCategory = questionObj.category;
                const categoryHeader = document.createElement('div');
                categoryHeader.className = `category-header category-${currentCategory} mb-4`;
                categoryHeader.textContent = CONFIG.CATEGORIES[currentCategory].name;
                container.appendChild(categoryHeader);
            }

            // Create question card
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.id = `question-card-${formType}-${index}`;

            const questionText = questionObj.text.substring(questionObj.text.indexOf('.') + 2);
            const radioName = `q${index}_${formType}`;

            questionCard.innerHTML = `
                <div class="text-sm font-medium text-gray-800 mb-3">
                    ${questionObj.text}
                </div>
                <div class="answer-buttons">
                    <button type="button" class="answer-btn" data-question="${index}" data-value="0" data-form="${formType}">
                        ไม่จริง
                    </button>
                    <button type="button" class="answer-btn" data-question="${index}" data-value="1" data-form="${formType}">
                        จริงบางครั้ง
                    </button>
                    <button type="button" class="answer-btn" data-question="${index}" data-value="2" data-form="${formType}">
                        จริงแน่นอน
                    </button>
                </div>
                <input type="hidden" name="${radioName}" id="${radioName}" data-question="${index}" required>
            `;

            container.appendChild(questionCard);
        });

        // Add event listeners for answer buttons
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('answer-btn')) {
                const questionIndex = e.target.dataset.question;
                const value = e.target.dataset.value;
                const form = e.target.dataset.form;
                
                // Remove selection from other buttons in same question
                const questionCard = document.getElementById(`question-card-${form}-${questionIndex}`);
                questionCard.querySelectorAll('.answer-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Select clicked button
                e.target.classList.add('selected');
                
                // Set hidden input value
                const hiddenInput = questionCard.querySelector('input[type="hidden"]');
                hiddenInput.value = value;
                
                // Mark question card as answered
                questionCard.classList.add('answered');
                
                // Update progress
                this.updateProgress(formType);
                
                // Smooth scroll to next question if exists
                const nextCard = document.getElementById(`question-card-${form}-${parseInt(questionIndex) + 1}`);
                if (nextCard && !Utils.isInViewport(nextCard)) {
                    Utils.scrollToElement(nextCard, 100);
                }
            }
        });
    }

    /**
     * Generate desktop table-based question form
     * @param {string} formType - Type of form (student, teacher, parent)
     */
    static generateDesktopForm(formType) {
        const container = document.getElementById(`questions-container-${formType}`);
        if (!container) return;

        const table = document.createElement('table');
        table.className = 'w-full border-collapse border border-gray-300';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="bg-gray-100">
                <th class="border border-gray-300 p-4 text-left font-medium">พฤติกรรม</th>
                <th class="border border-gray-300 p-4 text-center font-medium">ไม่จริง</th>
                <th class="border border-gray-300 p-4 text-center font-medium">จริงบางครั้ง</th>
                <th class="border border-gray-300 p-4 text-center font-medium">จริงแน่นอน</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        let currentCategory = null;

        this.data.forEach((questionObj, index) => {
            // Add category header row
            if (questionObj.category !== currentCategory) {
                currentCategory = questionObj.category;
                const categoryRow = document.createElement('tr');
                categoryRow.innerHTML = `
                    <td colspan="4" class="category-header category-${currentCategory}">
                        ${CONFIG.CATEGORIES[currentCategory].name}
                    </td>
                `;
                tbody.appendChild(categoryRow);
            }

            // Create question row
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            const radioName = `q${index}_${formType}`;

            row.innerHTML = `
                <td class="border border-gray-300 p-4">${questionObj.text}</td>
                <td class="border border-gray-300 p-4 text-center">
                    <input type="radio" name="${radioName}" value="0" class="hidden radio-input" id="${radioName}_0" required>
                    <label for="${radioName}_0" class="radio-option inline-block cursor-pointer" data-value="0"></label>
                </td>
                <td class="border border-gray-300 p-4 text-center">
                    <input type="radio" name="${radioName}" value="1" class="hidden radio-input" id="${radioName}_1">
                    <label for="${radioName}_1" class="radio-option inline-block cursor-pointer" data-value="1"></label>
                </td>
                <td class="border border-gray-300 p-4 text-center">
                    <input type="radio" name="${radioName}" value="2" class="hidden radio-input" id="${radioName}_2">
                    <label for="${radioName}_2" class="radio-option inline-block cursor-pointer" data-value="2"></label>
                </td>
            `;

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        // Add event listeners for radio buttons
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('radio-option')) {
                const questionRow = e.target.closest('tr');
                questionRow.querySelectorAll('.radio-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.classList.add('selected');
            }
        });
    }

    /**
     * Update progress for mobile forms
     * @param {string} formType - Type of form
     */
    static updateProgress(formType) {
        const form = document.getElementById(`${formType}-assessment-form`);
        if (!form) return;

        const totalQuestions = this.data.length;
        const answeredInputs = form.querySelectorAll('input[type="hidden"][value]');
        const answeredCount = Array.from(answeredInputs).filter(input => input.value !== '').length;
        
        const progressFill = document.getElementById(`progress-${formType}`);
        const progressText = document.getElementById(`progress-text-${formType}`);
        
        if (progressFill) {
            const percentage = (answeredCount / totalQuestions) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${answeredCount} / ${totalQuestions} คำถาม`;
        }
    }

    /**
     * Get all answers from a form
     * @param {string} formType - Type of form
     * @returns {Array} Array of answer values
     */
    static getAnswers(formType) {
        const answers = [];
        const form = document.getElementById(`${formType}-assessment-form`);
        
        if (!form) return answers;

        for (let i = 0; i < this.data.length; i++) {
            if (Utils.isMobile()) {
                // Mobile form uses hidden inputs
                const input = form.querySelector(`input[name="q${i}_${formType}"]`);
                if (input && input.value !== '') {
                    answers.push(parseInt(input.value));
                } else {
                    return null; // Missing answer
                }
            } else {
                // Desktop form uses radio buttons
                const checkedRadio = form.querySelector(`input[name="q${i}_${formType}"]:checked`);
                if (checkedRadio) {
                    answers.push(parseInt(checkedRadio.value));
                } else {
                    return null; // Missing answer
                }
            }
        }
        
        return answers;
    }

    /**
     * Validate all questions are answered
     * @param {string} formType - Type of form
     * @returns {Object} Validation result
     */
    static validateAnswers(formType) {
        const answers = this.getAnswers(formType);
        
        if (!answers) {
            // Find first unanswered question
            const form = document.getElementById(`${formType}-assessment-form`);
            for (let i = 0; i < this.data.length; i++) {
                let isAnswered = false;
                
                if (Utils.isMobile()) {
                    const input = form.querySelector(`input[name="q${i}_${formType}"]`);
                    isAnswered = input && input.value !== '';
                } else {
                    const checkedRadio = form.querySelector(`input[name="q${i}_${formType}"]:checked`);
                    isAnswered = !!checkedRadio;
                }
                
                if (!isAnswered) {
                    return {
                        isValid: false,
                        firstUnanswered: i + 1,
                        questionText: this.data[i].text
                    };
                }
            }
        }
        
        return {
            isValid: true,
            answers: answers
        };
    }

    /**
     * Reset form answers
     * @param {string} formType - Type of form
     */
    static resetForm(formType) {
        const form = document.getElementById(`${formType}-assessment-form`);
        if (!form) return;

        if (Utils.isMobile()) {
            // Reset mobile form
            form.querySelectorAll('.answer-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            form.querySelectorAll('input[type="hidden"]').forEach(input => {
                input.value = '';
            });
            form.querySelectorAll('.question-card').forEach(card => {
                card.classList.remove('answered');
            });
            this.updateProgress(formType);
        } else {
            // Reset desktop form
            form.querySelectorAll('.radio-option').forEach(option => {
                option.classList.remove('selected');
            });
            form.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.checked = false;
            });
        }
    }

    /**
     * Scroll to first unanswered question
     * @param {string} formType - Type of form
     * @param {number} questionIndex - Index of question to scroll to
     */
    static scrollToQuestion(formType, questionIndex) {
        if (Utils.isMobile()) {
            const questionCard = document.getElementById(`question-card-${formType}-${questionIndex}`);
            if (questionCard) {
                Utils.scrollToElement(questionCard, 100);
                // Add pulse animation to highlight the question
                questionCard.classList.add('pulse');
                setTimeout(() => {
                    questionCard.classList.remove('pulse');
                }, 2000);
            }
        } else {
            // For desktop, scroll to the table row
            const radioName = `q${questionIndex}_${formType}`;
            const firstRadio = document.getElementById(`${radioName}_0`);
            if (firstRadio) {
                const row = firstRadio.closest('tr');
                if (row) {
                    Utils.scrollToElement(row, 100);
                    // Add highlight animation
                    row.style.backgroundColor = '#fef3c7';
                    setTimeout(() => {
                        row.style.backgroundColor = '';
                    }, 2000);
                }
            }
        }
    }

    /**
     * Get question data by index
     * @param {number} index - Question index
     * @returns {Object} Question data
     */
    static getQuestion(index) {
        return this.data[index];
    }

    /**
     * Get questions by category
     * @param {string} category - Category name
     * @returns {Array} Array of questions in category
     */
    static getQuestionsByCategory(category) {
        return this.data.filter(q => q.category === category);
    }

    /**
     * Get category for question index
     * @param {number} index - Question index
     * @returns {string} Category name
     */
    static getCategoryForQuestion(index) {
        return this.data[index]?.category;
    }

    /**
     * Check if question should be reverse scored
     * @param {number} index - Question index
     * @returns {boolean} True if should be reverse scored
     */
    static shouldReverseScore(index) {
        return this.data[index]?.reverseScore === true;
    }

    /**
     * Get total number of questions
     * @returns {number} Total questions
     */
    static getTotal() {
        return this.data.length;
    }

    /**
     * Initialize questions for all forms
     */
    static init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.generateForms();
            });
        } else {
            this.generateForms();
        }

        // Regenerate forms on window resize if switching between mobile/desktop
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentIsMobile = Utils.isMobile();
                const containers = [
                    'questions-container-student',
                    'questions-container-teacher', 
                    'questions-container-parent'
                ];
                
                // Check if we need to regenerate forms
                const needsRegeneration = containers.some(id => {
                    const container = document.getElementById(id);
                    if (!container) return false;
                    
                    const hasMobileElements = container.querySelector('.question-card');
                    const hasDesktopElements = container.querySelector('table');
                    
                    return (currentIsMobile && hasDesktopElements) || 
                           (!currentIsMobile && hasMobileElements);
                });
                
                if (needsRegeneration) {
                    this.clearForms();
                    this.generateForms();
                }
            }, 250);
        });
    }

    /**
     * Clear all question forms
     */
    static clearForms() {
        const containers = [
            'questions-container-student',
            'questions-container-teacher',
            'questions-container-parent'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
            }
        });
    }

    /**
     * Export questions data for backup
     * @returns {Object} Questions data with metadata
     */
    static exportData() {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            questions: this.data,
            categories: CONFIG.CATEGORIES,
            totalQuestions: this.data.length
        };
    }
}

// Auto-initialize when script loads
Questions.init();
