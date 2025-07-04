/**
 * Results Management for SDQ System
 */

class Results {
    static currentIndividualResult = null;
    static currentSummaryData = null;

    /**
     * Initialize results management
     */
    static init() {
        this.setupEventListeners();
        this.setCurrentDates();
    }

    /**
     * Setup event listeners for results pages
     */
    static setupEventListeners() {
        // Individual results
        const resultStudentSelect = document.getElementById('result-student-name');
        const resultEvaluatorSelect = document.getElementById('result-evaluator-type');
        
        if (resultStudentSelect) {
            resultStudentSelect.addEventListener('change', () => this.loadIndividualResult());
        }
        
        if (resultEvaluatorSelect) {
            resultEvaluatorSelect.addEventListener('change', () => this.loadIndividualResult());
        }

        // Summary results
        const summaryClassSelect = document.getElementById('summary-class');
        const summaryEvaluatorSelect = document.getElementById('summary-evaluator-type');
        
        if (summaryClassSelect) {
            summaryClassSelect.addEventListener('change', () => this.loadSummaryData());
        }
        
        if (summaryEvaluatorSelect) {
            summaryEvaluatorSelect.addEventListener('change', () => this.loadSummaryData());
        }

        // Print buttons
        const printResultsBtn = document.getElementById('print-results');
        const printSummaryBtn = document.getElementById('print-summary');
        
        if (printResultsBtn) {
            printResultsBtn.addEventListener('click', () => this.printIndividualResults());
        }
        
        if (printSummaryBtn) {
            printSummaryBtn.addEventListener('click', () => this.printSummaryResults());
        }
    }

    /**
     * Load individual assessment result
     */
    static async loadIndividualResult() {
        const studentId = document.getElementById('result-student-name')?.value;
        const evaluatorType = document.getElementById('result-evaluator-type')?.value || 'all';

        if (!studentId) {
            this.clearIndividualResultsDisplay();
            return;
        }

        try {
            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.LOADING_RESULTS);

            const response = await Utils.makeRequest(CONFIG.ENDPOINTS.GET_ASSESSMENT_RESULTS, {
                studentId: studentId,
                evaluatorTypeFilter: evaluatorType
            });

            if (response && response.success) {
                this.displayIndividualResults(response);
                this.currentIndividualResult = response;
            } else {
                this.clearIndividualResultsDisplay();
                const message = response?.message || 'ไม่พบผลการประเมินสำหรับนักเรียนนี้';
                this.showNoResultsMessage(message);
            }

        } catch (error) {
            console.error('Error loading individual result:', error);
            this.clearIndividualResultsDisplay();
            Utils.showError('ไม่สามารถโหลดผลการประเมินได้', error.message);
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * Display individual assessment results
     * @param {Object} data - Assessment result data
     */
    static displayIndividualResults(data) {
        const contentDiv = document.getElementById('individual-result-content');
        const placeholderDiv = document.getElementById('individual-result-placeholder');

        if (!contentDiv || !placeholderDiv) return;

        try {
            // Show content, hide placeholder
            contentDiv.classList.remove('hidden');
            placeholderDiv.classList.add('hidden');

            // Update student info
            this.updateStudentInfo(data);

            // Update scores table and chart
            this.updateScoresDisplay(data);

            // Update interpretation summary
            this.updateInterpretationSummary(data);

            // Update answers summary
            this.updateAnswersSummary(data);

            // Update chart
            if (window.Charts && data.scores) {
                Charts.updateResultChart(data.scores);
            }

        } catch (error) {
            console.error('Error displaying individual results:', error);
            this.clearIndividualResultsDisplay();
        }
    }

    /**
     * Update student information display
     * @param {Object} data - Assessment data
     */
    static updateStudentInfo(data) {
        const elements = {
            'result-info-name': data.studentName || '-',
            'result-info-class': data.studentClass || data.class || '-',
            'result-info-date': data.timestamp || '-'
        };

        // Format evaluator type display
        let evaluatorDisplay = data.evaluatorType || '-';
        if (data.evaluatorType === 'student') {
            evaluatorDisplay = 'นักเรียนประเมินตนเอง';
        } else if (data.evaluatorType === 'teacher') {
            evaluatorDisplay = `ครู${data.evaluatorName ? ` (${data.evaluatorName})` : ''}`;
        } else if (data.evaluatorType === 'parent') {
            evaluatorDisplay = `ผู้ปกครอง${data.evaluatorName ? ` (${data.evaluatorName})` : ''}${data.relation ? `, ${data.relation}` : ''}`;
        }
        
        elements['result-info-evaluator-type'] = evaluatorDisplay;

        // Update DOM elements
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    /**
     * Update scores display table
     * @param {Object} data - Assessment data
     */
    static updateScoresDisplay(data) {
        const tableBody = document.getElementById('result-table-body');
        if (!tableBody || !data.scores || !data.interpretations) return;

        const aspectMap = [
            { key: 'emotional', label: 'ด้านอารมณ์' },
            { key: 'conduct', label: 'ด้านความประพฤติ' },
            { key: 'hyperactivity', label: 'ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น' },
            { key: 'peerProblems', label: 'ด้านความสัมพันธ์กับเพื่อน' },
            { key: 'prosocial', label: 'ด้านสัมพันธภาพทางสังคม (จุดแข็ง)' },
            { key: 'totalDifficulties', label: 'รวมปัญหา (4 ด้านแรก)', isTotal: true }
        ];

        const rows = aspectMap.map(aspect => {
            const score = data.scores[aspect.key];
            const interpretation = data.interpretations[aspect.key === 'totalDifficulties' ? 'total' : aspect.key];
            const interpretationClass = Utils.getInterpretationClass(interpretation);

            return `
                <tr class="${aspect.isTotal ? 'bg-gray-50 font-semibold' : ''}">
                    <td class="border border-gray-300 p-3">${aspect.label}</td>
                    <td class="border border-gray-300 p-3 text-center">${score !== undefined ? score : '-'}</td>
                    <td class="border border-gray-300 p-3 text-center ${interpretationClass}">
                        ${interpretation || '-'}
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows.join('');
    }

    /**
     * Update interpretation summary
     * @param {Object} data - Assessment data
     */
    static updateInterpretationSummary(data) {
        const summaryDiv = document.getElementById('result-interpretation-summary');
        if (!summaryDiv || !data.interpretations) return;

        const overallInterpretation = data.interpretations.total || 'ไม่พบข้อมูล';
        const interpretationClass = Utils.getInterpretationClass(overallInterpretation);

        let summaryHtml = `
            <p class="mb-3">
                <strong>สรุปผลการประเมิน:</strong> 
                นักเรียนมีผลรวมปัญหาอยู่ในเกณฑ์ 
                <strong class="${interpretationClass}">${overallInterpretation}</strong>
            </p>
        `;

        summaryHtml += `<p><strong>ข้อเสนอแนะเบื้องต้น:</strong> `;
        
        if (overallInterpretation.includes('มีปัญหา') || overallInterpretation.includes('เสี่ยง')) {
            summaryHtml += `ควรให้ความสนใจและติดตามพฤติกรรมนักเรียนอย่างใกล้ชิด โดยเฉพาะในด้านที่พบความเสี่ยงหรือปัญหา อาจพิจารณาให้คำปรึกษาหรือส่งต่อผู้เชี่ยวชาญหากจำเป็น`;
        } else {
            const prosocialInterpretation = data.interpretations.prosocial || '-';
            const prosocialClass = Utils.getInterpretationClass(prosocialInterpretation);
            summaryHtml += `นักเรียนมีพฤติกรรมโดยรวมอยู่ในเกณฑ์ปกติ ควรส่งเสริมจุดแข็ง (ด้านสัมพันธภาพทางสังคม: <span class="${prosocialClass}">${prosocialInterpretation}</span>) และดูแลช่วยเหลือในด้านอื่นๆ ตามความเหมาะสมต่อไป`;
        }
        
        summaryHtml += `</p>`;

        summaryDiv.innerHTML = summaryHtml;
    }

    /**
     * Update answers summary table
     * @param {Object} data - Assessment data
     */
    static updateAnswersSummary(data) {
        const answersBody = document.getElementById('result-answers-body');
        if (!answersBody || !data.answers) return;

        const answerLabels = CONFIG.ANSWER_LABELS;
        
        if (Array.isArray(data.answers) && data.answers.length === 25) {
            const rows = Questions.data.map((question, index) => {
                const answerValue = data.answers[index];
                const answerText = answerLabels[answerValue] || 'N/A';
                const questionText = question.text.substring(question.text.indexOf('.') + 2);

                return `
                    <tr class="border-b">
                        <td class="p-3 align-top">${index + 1}.</td>
                        <td class="p-3 align-top">${questionText}</td>
                        <td class="p-3 align-top font-medium">${answerText}</td>
                    </tr>
                `;
            });

            answersBody.innerHTML = rows.join('');
        } else {
            answersBody.innerHTML = '<tr><td colspan="3" class="text-center p-4">ไม่มีข้อมูลคำตอบ</td></tr>';
        }
    }

    /**
     * Load summary data
     */
    static async loadSummaryData() {
        const classFilter = document.getElementById('summary-class')?.value || 'all';
        const evaluatorTypeFilter = document.getElementById('summary-evaluator-type')?.value || 'all';

        try {
            Utils.showLoading(true, CONFIG.LOADING_MESSAGES.LOADING_SUMMARY);

            const response = await Utils.makeRequest(CONFIG.ENDPOINTS.GET_SUMMARY_RESULTS, {
                classFilter: classFilter,
                evaluatorTypeFilter: evaluatorTypeFilter
            });

            if (response && response.success) {
                this.displaySummaryData(response);
                this.currentSummaryData = response;
            } else {
                this.clearSummaryDisplay();
                Utils.showWarning('ไม่พบข้อมูลสรุป', response?.message || 'ยังไม่มีข้อมูลการประเมินตามตัวกรอง');
            }

        } catch (error) {
            console.error('Error loading summary data:', error);
            this.clearSummaryDisplay();
            Utils.showError('ไม่สามารถโหลดข้อมูลสรุปได้', error.message);
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * Display summary data
     * @param {Object} data - Summary data
     */
    static displaySummaryData(data) {
        try {
            // Update overview info
            this.updateSummaryOverview(data);

            // Update summary table
            this.updateSummaryTable(data);

            // Update special care students
            this.updateSpecialCareStudents(data);

            // Update chart
            if (window.Charts && data.summaryData) {
                Charts.updateSummaryChart(data.summaryData);
            }

        } catch (error) {
            console.error('Error displaying summary data:', error);
            this.clearSummaryDisplay();
        }
    }

    /**
     * Update summary overview information
     * @param {Object} data - Summary data
     */
    static updateSummaryOverview(data) {
        const elements = {
            'summary-total-students': data.totalStudentsInSystem || '0',
            'summary-assessed-students': data.assessedStudents || '0',
            'summary-date': data.date || Utils.formatDate()
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    /**
     * Update summary table
     * @param {Object} data - Summary data
     */
    static updateSummaryTable(data) {
        const tableBody = document.getElementById('summary-table-body');
        if (!tableBody || !data.summaryData) return;

        const aspectMap = [
            { key: 'emotional', label: 'ด้านอารมณ์' },
            { key: 'conduct', label: 'ด้านความประพฤติ' },
            { key: 'hyperactivity', label: 'ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น' },
            { key: 'peerProblems', label: 'ด้านความสัมพันธ์กับเพื่อน' },
            { key: 'prosocial', label: 'ด้านสัมพันธภาพทางสังคม (จุดแข็ง)' },
            { key: 'totalDifficulties', label: 'รวมปัญหา (4 ด้านแรก)', isTotal: true }
        ];

        const rows = aspectMap.map(aspect => {
            const aspectData = data.summaryData[aspect.key];
            
            let normalCount = 0;
            let riskCount = 0;
            let problemCount = 0;

            if (aspectData) {
                if (aspect.key === 'prosocial') {
                    normalCount = (aspectData['ปกติ'] || 0) + (aspectData['จุดแข็ง'] || 0);
                    riskCount = 0;
                    problemCount = aspectData['ควรปรับปรุง'] || 0;
                } else {
                    normalCount = aspectData['ปกติ'] || 0;
                    riskCount = aspectData['เสี่ยง'] || 0;
                    problemCount = aspectData['มีปัญหา'] || 0;
                }
            }

            const total = aspectData ? (aspectData.total || 0) : 0;

            return `
                <tr class="${aspect.isTotal ? 'bg-gray-50 font-semibold' : ''}">
                    <td class="border border-gray-300 p-3">${aspect.label}</td>
                    <td class="border border-gray-300 p-3 text-center">
                        ${total > 0 ? Utils.calculatePercentage(normalCount, total, 1) : '0.0'} (${normalCount})
                    </td>
                    <td class="border border-gray-300 p-3 text-center">
                        ${total > 0 ? Utils.calculatePercentage(riskCount, total, 1) : '0.0'} (${riskCount})
                    </td>
                    <td class="border border-gray-300 p-3 text-center">
                        ${total > 0 ? Utils.calculatePercentage(problemCount, total, 1) : '0.0'} (${problemCount})
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows.join('');
    }

    /**
     * Update special care students table
     * @param {Object} data - Summary data
     */
    static updateSpecialCareStudents(data) {
        const tableBody = document.getElementById('summary-special-care-body');
        if (!tableBody) return;

        if (data.studentsForSpecialCare && data.studentsForSpecialCare.length > 0) {
            const rows = data.studentsForSpecialCare.map(student => {
                const severityClass = Utils.getInterpretationClass(student.severity);
                
                return `
                    <tr>
                        <td class="border border-gray-300 p-3">${student.name}</td>
                        <td class="border border-gray-300 p-3 text-center">${student.class}</td>
                        <td class="border border-gray-300 p-3">${student.problemAspects || 'N/A'}</td>
                        <td class="border border-gray-300 p-3 text-center ${severityClass}">${student.severity}</td>
                    </tr>
                `;
            });

            tableBody.innerHTML = rows.join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4 text-green-600">
                        🎉 ไม่พบนักเรียนที่ควรได้รับการดูแลเป็นพิเศษ ตามเกณฑ์ที่กำหนด
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Clear individual results display
     */
    static clearIndividualResultsDisplay() {
        const contentDiv = document.getElementById('individual-result-content');
        const placeholderDiv = document.getElementById('individual-result-placeholder');

        if (contentDiv) contentDiv.classList.add('hidden');
        if (placeholderDiv) {
            placeholderDiv.classList.remove('hidden');
            placeholderDiv.innerHTML = `
                <div class="text-center py-16 text-gray-500">
                    <div class="text-6xl mb-4">📋</div>
                    <p class="text-lg">โปรดเลือกนักเรียนเพื่อดูผลลัพธ์</p>
                </div>
            `;
        }

        this.currentIndividualResult = null;
    }

    /**
     * Clear summary display
     */
    static clearSummaryDisplay() {
        const elements = {
            'summary-total-students': '-',
            'summary-assessed-students': '-',
            'summary-date': '-'
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });

        const summaryTableBody = document.getElementById('summary-table-body');
        if (summaryTableBody) {
            summaryTableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">ไม่มีข้อมูล</td></tr>';
        }

        const specialCareBody = document.getElementById('summary-special-care-body');
        if (specialCareBody) {
            specialCareBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">ไม่มีข้อมูล</td></tr>';
        }

        this.currentSummaryData = null;
    }

    /**
     * Show no results message
     * @param {string} message - Message to display
     */
    static showNoResultsMessage(message) {
        const placeholderDiv = document.getElementById('individual-result-placeholder');
        if (placeholderDiv) {
            placeholderDiv.innerHTML = `
                <div class="text-center py-16 text-gray-500">
                    <div class="text-6xl mb-4">❌</div>
                    <p class="text-lg">${message}</p>
                    <p class="text-sm mt-2">ลองเปลี่ยนตัวกรองการประเมินหรือเลือกนักเรียนคนอื่น</p>
                </div>
            `;
        }
    }

    /**
     * Print individual results
     */
    static printIndividualResults() {
        if (!this.currentIndividualResult) {
            Utils.showWarning('ไม่สามารถพิมพ์ได้', 'กรุณาเลือกนักเรียนและโหลดผลการประเมินก่อน');
            return;
        }

        const studentName = this.currentIndividualResult.studentName || 'นักเรียน';
        Utils.printWithTitle(`รายงานผลรายบุคคล - ${studentName}`);
    }

    /**
     * Print summary results
     */
    static printSummaryResults() {
        if (!this.currentSummaryData) {
            Utils.showWarning('ไม่สามารถพิมพ์ได้', 'กรุณาโหลดข้อมูลสรุปก่อน');
            return;
        }

        Utils.printWithTitle('สรุปผลการประเมินภาพรวม SDQ');
    }

    /**
     * Set current dates in footer
     */
    static setCurrentDates() {
        const currentDate = Utils.formatDate();
        
        const printDateElement = document.getElementById('print-date');
        if (printDateElement) {
            printDateElement.textContent = currentDate;
        }

        const summaryPrintDateElement = document.getElementById('summary-print-date');
        if (summaryPrintDateElement) {
            summaryPrintDateElement.textContent = currentDate;
        }
    }

    /**
     * Export individual result data
     * @returns {Object} Export data
     */
    static exportIndividualResult() {
        if (!this.currentIndividualResult) {
            return null;
        }

        return {
            type: 'individual_result',
            timestamp: new Date().toISOString(),
            data: this.currentIndividualResult
        };
    }

    /**
     * Export summary data
     * @returns {Object} Export data
     */
    static exportSummaryData() {
        if (!this.currentSummaryData) {
            return null;
        }

        return {
            type: 'summary_data',
            timestamp: new Date().toISOString(),
            data: this.currentSummaryData
        };
    }
}
