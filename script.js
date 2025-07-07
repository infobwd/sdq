// ===== CONFIGURATION =====
// URL ของ Google Apps Script Web App ที่ deploy แล้ว
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx-rfOnx5yh_XT0Kqx4cBkiCtQKZccRfdChhLrUYQIG7HPDfW8i6GwI4mdHBB5E9H87aA/exec'; // ⚠️ ต้องเปลี่ยนเป็น URL จริง

// ===== GLOBAL VARIABLES =====
const questionsData = [
    { text: "1. มักจะมีอาการปวดศีรษะ ปวดท้อง หรือไม่สบาย", category: "emotional" },
    { text: "2. กังวลใจหลายเรื่อง ดูเหมือนกังวลเสมอ", category: "emotional" },
    { text: "3. ไม่มีความสุข ท้อแท้ ร้องไห้บ่อย", category: "emotional" },
    { text: "4. วิตกกังวลหรือติดแจเมื่ออยู่ในสถานการณ์ใหม่ เสียความมั่นใจง่าย", category: "emotional" },
    { text: "5. มีความกลัวหลายเรื่อง หวาดกลัวง่าย", category: "emotional" },
    { text: "6. แผลงฤทธิ์บ่อย หรืออารมณ์ร้อน", category: "conduct" },
    { text: "7. โดยปกติแล้ว เชื่อฟัง ทำตามที่ผู้ใหญ่บอก", category: "conduct", reverseScoreDifficulties: true },
    { text: "8. มีเรื่องต่อสู้หรือรังแกเด็กอื่นบ่อยๆ", category: "conduct" },
    { text: "9. พูดปดหรือขี้โกงบ่อยๆ", category: "conduct" },
    { text: "10. ขโมยของที่บ้าน ที่โรงเรียน หรือที่อื่น", category: "conduct" },
    { text: "11. อยู่ไม่สุข เคลื่อนไหวมาก ไม่สามารถอยู่นิ่งได้นาน", category: "hyperactivity" },
    { text: "12. หยุกหยิก หรือดิ้นไปดิ้นมาตลอดเวลา", category: "hyperactivity" },
    { text: "13. วอกแวกง่าย ไม่มีสมาธิ", category: "hyperactivity" },
    { text: "14. คิดก่อนทำ", category: "hyperactivity", reverseScoreDifficulties: true },
    { text: "15. มีสมาธิในการติดตามทำงานจนเสร็จ", category: "hyperactivity", reverseScoreDifficulties: true },
    { text: "16. ค่อนข้างอยู่โดดเดี่ยว มักเล่นตามลำพัง", category: "peer" },
    { text: "17. มีเพื่อนสนิทอย่างน้อยหนึ่งคน", category: "peer", reverseScoreDifficulties: true },
    { text: "18. โดยทั่วไปเป็นที่ชอบพอของเด็กอื่น", category: "peer", reverseScoreDifficulties: true },
    { text: "19. ถูกเด็กคนอื่นแกล้งหรือรังแก", category: "peer" },
    { text: "20. เข้ากับผู้ใหญ่ได้ดีกว่าเข้ากับเด็กอื่น", category: "peer" },
    { text: "21. ใส่ใจความรู้สึกของผู้อื่น", category: "prosocial" },
    { text: "22. เต็มใจแบ่งปันกับผู้อื่น (ขนม ของเล่น ดินสอ ฯลฯ)", category: "prosocial" },
    { text: "23. ช่วยเหลือถ้ามีใครบาดเจ็บ ไม่สบายใจ หรือเจ็บป่วย", category: "prosocial" },
    { text: "24. ใจดีกับเด็กที่อายุน้อยกว่า", category: "prosocial" },
    { text: "25. มักอาสาช่วยเหลือผู้อื่น (พ่อแม่ ครู เด็กอื่น)", category: "prosocial" }
];

let allStudents = [];
let resultChartInstance = null;
let summaryChartInstance = null;

// ===== UTILITY FUNCTIONS =====

// Show loading overlay with SweetAlert2
function showLoading(show = true, message = "กำลังประมวลผล...") {
    if (show) {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    } else {
        Swal.close();
    }
}

// Show success message
function showSuccess(message, title = "สำเร็จ!") {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981'
    });
}

// Show error message
function showError(message, title = "เกิดข้อผิดพลาด!") {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444'
    });
}

// Show confirmation dialog
function showConfirm(message, title = "ยืนยันการดำเนินการ") {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280'
    });
}

// JSONP helper function
function makeJSONPRequest(action, data = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        
        // Create callback function
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        // Prepare URL with parameters
        const params = new URLSearchParams({
            action: action,
            callback: callbackName,
            ...data
        });
        
        // Create script element
        const script = document.createElement('script');
        script.src = `${GAS_WEB_APP_URL}?${params.toString()}`;
        
        // Handle errors
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
        };
        
        // Add script to DOM
        document.body.appendChild(script);
        
        // Timeout after 30 seconds
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Request timeout'));
            }
        }, 30000);
    });
}

// Get selected student data
function getSelectedStudentData(selectElementId) {
    const select = document.getElementById(selectElementId);
    if (select && select.value) {
        const selectedOption = select.options[select.selectedIndex];
        return {
            id: select.value,
            name: selectedOption.dataset.name,
            class: selectedOption.dataset.class
        };
    }
    return null;
}

// Get interpretation CSS class
function getInterpretationClass(interpretationText) {
    if (!interpretationText) return 'text-gray-500';
    const interpretation = interpretationText.toLowerCase();
    if (interpretation.includes('เสี่ยง')) return 'text-yellow-600 font-semibold';
    if (interpretation.includes('มีปัญหา')) return 'text-red-600 font-semibold';
    if (interpretation.includes('ปกติ') || interpretation.includes('จุดแข็ง')) return 'text-green-600 font-semibold';
    return 'text-gray-700';
}

// ===== PAGE MANAGEMENT =====

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-100', 'text-indigo-700', 'border-indigo-300');
        btn.classList.add('text-gray-600');
    });
    
    const activeTabId = `tab-${pageId.replace('page-', '')}`;
    const activeTab = document.getElementById(activeTabId);
    if (activeTab) {
        activeTab.classList.add('bg-indigo-100', 'text-indigo-700', 'border-indigo-300');
        activeTab.classList.remove('text-gray-600');
    }
    
    // Page-specific actions
    if (pageId === 'page-results') {
        updateStudentDropdowns(allStudents);
        loadIndividualResult();
    } else if (pageId === 'page-summary') {
        loadSummaryData();
    }
}

// ===== STUDENT MANAGEMENT =====

async function loadStudents() {
    try {
        showLoading(true, "กำลังโหลดรายชื่อนักเรียน...");
        const response = await makeJSONPRequest('getStudents');
        
        if (response && response.length > 0) {
            // Sort students
            response.sort((a, b) => {
                const classA = getClassSortValue(a.class);
                const classB = getClassSortValue(b.class);
                if (classA !== classB) return classA - classB;
                return (a.name || "").localeCompare(b.name || "", 'th');
            });
            
            allStudents = response;
            updateClassFilters();
            updateStudentDropdowns(allStudents);
            attachStudentSelectChangeHandlers();
        }
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถโหลดรายชื่อนักเรียนได้: ${error.message}`);
        console.error('Error loading students:', error);
    }
}

function getClassSortValue(className) {
    if (!className || typeof className !== 'string') return 99999;
    let level = 9, grade = 0, room = 0;
    
    if (className.includes('อนุบาล') || className.startsWith('อ.')) level = 1;
    else if (className.includes('ประถม') || className.startsWith('ป.')) level = 2;
    else if (className.includes('มัธยม') || className.startsWith('ม.')) level = 3;
    
    const match = className.match(/(\d+)\/?(\d*)/);
    if (match) {
        grade = parseInt(match[1] || 0);
        room = parseInt(match[2] || 0);
    }
    
    return (level * 10000) + (grade * 100) + room;
}

function updateClassFilters() {
    const uniqueClasses = [...new Set(allStudents.map(s => s.class).filter(c => c))];
    
    const classFilterSelects = [
        'student-class-filter-s',
        'teacher-class-filter-t', 
        'parent-class-filter-p',
        'summary-class'
    ];
    
    classFilterSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Clear existing options except first one
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
    });
}

function updateStudentDropdowns(students) {
    const studentSelects = [
        'student-name-s',
        'teacher-student-name-t',
        'parent-student-name-p',
        'result-student-name'
    ];
    
    studentSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        
        // Clear existing options except first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add student options
        students.forEach(student => {
            if (!student || !student.id || !student.name) return;
            
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class || 'ไม่มีข้อมูลชั้น'})`;
            option.dataset.name = student.name;
            option.dataset.class = student.class || 'ไม่มีข้อมูลชั้น';
            select.appendChild(option);
        });
        
        // Restore previous value
        select.value = currentValue;
    });
}

function attachStudentSelectChangeHandlers() {
    const studentSelectsInfo = [
        { id: 'student-name-s', classDisplayId: 'student-class-s' },
        { id: 'teacher-student-name-t', classDisplayId: null }
    ];
    
    studentSelectsInfo.forEach(info => {
        const select = document.getElementById(info.id);
        if (!select) return;
        
        const changeHandler = function() {
            if (info.classDisplayId) {
                const classDisplayField = document.getElementById(info.classDisplayId);
                if (this.value && classDisplayField) {
                    classDisplayField.value = this.options[this.selectedIndex].dataset.class;
                } else if (classDisplayField) {
                    classDisplayField.value = '';
                }
            }
        };
        
        // Remove existing handler if any
        if (select._changeHandler) {
            select.removeEventListener('change', select._changeHandler);
        }
        
        select.addEventListener('change', changeHandler);
        select._changeHandler = changeHandler;
        
        // Trigger change event if value exists
        if (select.value) {
            select.dispatchEvent(new Event('change'));
        }
    });
}

// ===== QUESTION GENERATION =====

function generateQuestionForms() {
    const containers = [
        { id: 'questions-container-student', formType: 'student' },
        { id: 'questions-container-teacher', formType: 'teacher' },
        { id: 'questions-container-parent', formType: 'parent' }
    ];
    
    const categoryLabels = {
        emotional: "ด้านอารมณ์",
        conduct: "ด้านความประพฤติ", 
        hyperactivity: "ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น",
        peer: "ด้านความสัมพันธ์กับเพื่อน",
        prosocial: "ด้านสัมพันธภาพทางสังคม (จุดแข็ง)"
    };
    
    containers.forEach(containerInfo => {
        const container = document.getElementById(containerInfo.id);
        if (!container) return;
        
        container.innerHTML = '';
        
        let currentCategory = null;
        
        questionsData.forEach((questionObj, index) => {
            // Add category header if new category
            if (questionObj.category !== currentCategory) {
                currentCategory = questionObj.category;
                
                const categoryHeader = document.createElement('div');
                categoryHeader.className = `category-header category-${currentCategory}`;
                categoryHeader.textContent = categoryLabels[currentCategory];
                container.appendChild(categoryHeader);
            }
            
            // Create question card
            const questionCard = document.createElement('div');
            questionCard.className = 'bg-white border border-gray-200 rounded-lg p-4';
            
            const radioName = `q${index}_${containerInfo.formType}`;
            
            questionCard.innerHTML = `
                <div class="mb-3">
                    <p class="text-sm font-medium text-gray-800">${questionObj.text}</p>
                </div>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <input type="radio" name="${radioName}" value="0" class="hidden radio-input" id="${radioName}_0" required>
                        <label for="${radioName}_0" class="radio-option mx-auto mb-1" data-value="0"></label>
                        <div class="text-xs text-gray-600">ไม่จริง</div>
                    </div>
                    <div>
                        <input type="radio" name="${radioName}" value="1" class="hidden radio-input" id="${radioName}_1">
                        <label for="${radioName}_1" class="radio-option mx-auto mb-1" data-value="1"></label>
                        <div class="text-xs text-gray-600">จริงบางครั้ง</div>
                    </div>
                    <div>
                        <input type="radio" name="${radioName}" value="2" class="hidden radio-input" id="${radioName}_2">
                        <label for="${radioName}_2" class="radio-option mx-auto mb-1" data-value="2"></label>
                        <div class="text-xs text-gray-600">จริงแน่นอน</div>
                    </div>
                </div>
            `;
            
            container.appendChild(questionCard);
        });
    });
    
    // Attach radio button click handlers
    document.querySelectorAll('.radio-option').forEach(label => {
        label.addEventListener('click', function() {
            const questionCard = this.closest('.bg-white');
            questionCard.querySelectorAll('.radio-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
}

// ===== CHART MANAGEMENT =====

function initCharts() {
    const defaultChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { font: { size: 10 } }
            }
        }
    };
    
    const radarChartOptions = {
        ...defaultChartOptions,
        scales: {
            r: {
                beginAtZero: true,
                max: 10,
                ticks: {
                    stepSize: 2,
                    backdropColor: 'transparent',
                    font: { size: 9 }
                },
                pointLabels: { font: { size: 10 } }
            }
        }
    };
    
    const barChartOptions = {
        ...defaultChartOptions,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'ร้อยละ (%)',
                    font: { size: 10 }
                },
                ticks: { font: { size: 9 } }
            },
            x: { ticks: { font: { size: 9 } } }
        }
    };
    
    // Initialize result chart
    const resultCtx = document.getElementById('result-chart')?.getContext('2d');
    if (resultCtx) {
        if (resultChartInstance) resultChartInstance.destroy();
        resultChartInstance = new Chart(resultCtx, {
            type: 'radar',
            data: {
                labels: ['อารมณ์', 'ความประพฤติ', 'สมาธิสั้น', 'เพื่อน', 'สังคม (จุดแข็ง)'],
                datasets: [{
                    label: 'คะแนน',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)'
                }]
            },
            options: radarChartOptions
        });
    }
    
    // Initialize summary chart
    const summaryCtx = document.getElementById('summary-chart')?.getContext('2d');
    if (summaryCtx) {
        if (summaryChartInstance) summaryChartInstance.destroy();
        summaryChartInstance = new Chart(summaryCtx, {
            type: 'bar',
            data: {
                labels: ['อารมณ์', 'ความประพฤติ', 'สมาธิสั้น', 'เพื่อน', 'สังคม'],
                datasets: [
                    { label: 'ปกติ', data: [0, 0, 0, 0, 0], backgroundColor: 'rgba(16, 185, 129, 0.7)' },
                    { label: 'เสี่ยง', data: [0, 0, 0, 0, 0], backgroundColor: 'rgba(245, 158, 11, 0.7)' },
                    { label: 'มีปัญหา', data: [0, 0, 0, 0, 0], backgroundColor: 'rgba(239, 68, 68, 0.7)' }
                ]
            },
            options: barChartOptions
        });
    }
}

function updateResultChart(scores) {
    if (resultChartInstance && scores) {
        resultChartInstance.data.datasets[0].data = [
            scores.emotional,
            scores.conduct, 
            scores.hyperactivity,
            scores.peerProblems,
            scores.prosocial
        ];
        resultChartInstance.update();
    }
}

function updateSummaryChart(summaryData) {
    if (summaryChartInstance && summaryData) {
        const aspects = ['emotional', 'conduct', 'hyperactivity', 'peerProblems', 'prosocial'];
        const datasets = summaryChartInstance.data.datasets;
        
        aspects.forEach((aspectKey, i) => {
            const aspect = summaryData[aspectKey];
            const total = (aspect && aspect.total > 0) ? aspect.total : 0;
            
            let normalCount = 0;
            let riskCount = 0; 
            let problemCount = 0;
            
            if (aspectKey === 'prosocial') {
                normalCount = ((aspect && aspect['จุดแข็ง']) || 0) + ((aspect && aspect['ปกติ']) || 0);
                riskCount = 0;
                problemCount = (aspect && aspect['ควรปรับปรุง']) || 0;
            } else {
                normalCount = (aspect && aspect['ปกติ']) || 0;
                riskCount = (aspect && aspect['เสี่ยง']) || 0;
                problemCount = (aspect && aspect['มีปัญหา']) || 0;
            }
            
            datasets[0].data[i] = total > 0 ? (normalCount / total * 100) : 0;
            datasets[1].data[i] = total > 0 ? (riskCount / total * 100) : 0;
            datasets[2].data[i] = total > 0 ? (problemCount / total * 100) : 0;
        });
        
        summaryChartInstance.update();
    }
}

// ===== FORM HANDLING =====

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formId = form.id;
    let assessmentData = { answers: [] };
    let isValid = true;
    let studentInfoFromForm;
    
    // เพิ่มการตรวจสอบ session สำหรับครูและผู้ปกครอง
    const sessionId = localStorage.getItem('sdq_session') || sessionStorage.getItem('sdq_session');
    
    // Determine form type and get student info
    if (formId === 'student-assessment-form') {
        // นักเรียนไม่ต้องล็อกอิน (เหมือนเดิม)
        studentInfoFromForm = getSelectedStudentData('student-name-s');
        if (!studentInfoFromForm) {
            showError('กรุณาเลือกชื่อนักเรียน');
            return;
        }
        assessmentData.studentId = studentInfoFromForm.id;
        assessmentData.studentName = studentInfoFromForm.name;
        assessmentData.studentClass = studentInfoFromForm.class;
        assessmentData.evaluatorType = 'student';
    } else if (formId === 'teacher-assessment-form') {
        // ครูต้องล็อกอิน (ถ้าต้องการ)
        if (sessionId) {
            assessmentData.sessionId = sessionId; // เพิ่ม sessionId
        }
        
        studentInfoFromForm = getSelectedStudentData('teacher-student-name-t');
        if (!studentInfoFromForm) {
            showError('กรุณาเลือกชื่อนักเรียน');
            return;
        }
        assessmentData.studentId = studentInfoFromForm.id;
        assessmentData.studentName = studentInfoFromForm.name;
        assessmentData.studentClass = studentInfoFromForm.class;
        assessmentData.evaluatorType = 'teacher';
        assessmentData.evaluatorName = form.querySelector('#teacher-name-t').value.trim();
        if (!assessmentData.evaluatorName) {
            showError('กรุณาระบุชื่อครูผู้ประเมิน');
            return;
        }
    } else if (formId === 'parent-assessment-form') {
        // ผู้ปกครองต้องล็อกอิน (ถ้าต้องการ)
        if (sessionId) {
            assessmentData.sessionId = sessionId; // เพิ่ม sessionId
        }
        
        studentInfoFromForm = getSelectedStudentData('parent-student-name-p');
        if (!studentInfoFromForm) {
            showError('กรุณาเลือกชื่อนักเรียน');
            return;
        }
        assessmentData.studentId = studentInfoFromForm.id;
        assessmentData.studentName = studentInfoFromForm.name; 
        assessmentData.studentClass = studentInfoFromForm.class;
        assessmentData.evaluatorType = 'parent';
        assessmentData.evaluatorName = form.querySelector('#parent-name-p').value.trim();
        assessmentData.relation = form.querySelector('#parent-relation-p').value;
        if (!assessmentData.evaluatorName) {
            showError('กรุณาระบุชื่อผู้ปกครอง');
            return;
        }
        if (!assessmentData.relation) {
            showError('กรุณาระบุความสัมพันธ์กับนักเรียน');
            return;
        }
    }
    
    // Collect answers
    const formType = formId.split('-')[0];
    for (let i = 0; i < questionsData.length; i++) {
        const radioName = `q${i}_${formType}`;
        const checkedRadio = form.querySelector(`input[name="${radioName}"]:checked`);
        if (checkedRadio) {
            assessmentData.answers.push(parseInt(checkedRadio.value));
        } else {
            showError(`กรุณาตอบคำถามข้อที่ ${i + 1}`);
            isValid = false;
            break;
        }
    }
    
    if (!isValid) return;
    
    try {
        showLoading(true, "กำลังบันทึกการประเมิน...");
        
        const response = await makeJSONPRequest('saveAssessment', {
            data: JSON.stringify(assessmentData)
        });
        
        showLoading(false);
        
        if (response && response.success) {
            await showSuccess(response.message || 'บันทึกการประเมินเรียบร้อยแล้ว');
            
            // Update dropdowns and show results
            const resultStudentSelect = document.getElementById('result-student-name');
            if (resultStudentSelect && response.studentInfo && response.studentInfo.id) {
                updateStudentDropdowns(allStudents);
                resultStudentSelect.value = response.studentInfo.id;
            }
            
            const resultEvaluatorSelect = document.getElementById('result-evaluator-type');
            if (resultEvaluatorSelect && response.studentInfo && response.studentInfo.evaluatorType) {
                resultEvaluatorSelect.value = response.studentInfo.evaluatorType;
            }
            
            displayIndividualResultsData(response);
            showPage('page-results');
            
            // Reset form
            form.reset();
            form.querySelectorAll('.radio-option.selected').forEach(el => el.classList.remove('selected'));
            
            // Reset class filters
            const formPrefix = formType.charAt(0);
            const classFilter = document.getElementById(`${formType}-class-filter-${formPrefix}`);
            if (classFilter) {
                classFilter.value = 'all';
                handleClassFilterChange({ target: classFilter });
            }
        } else {
            showError('เกิดข้อผิดพลาดในการบันทึก: ' + (response ? response.message : 'ไม่ได้รับข้อมูลตอบกลับที่ถูกต้อง'));
        }
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถบันทึกการประเมินได้: ${error.message}`);
        console.error('Error saving assessment:', error);
    }
}

// ===== CLASS FILTER HANDLING =====

function handleClassFilterChange(event) {
    const selectedClass = event.target.value;
    const filterId = event.target.id;
    
    let studentsToDisplay;
    if (selectedClass === 'all') {
        studentsToDisplay = allStudents;
    } else {
        studentsToDisplay = allStudents.filter(student => student.class === selectedClass);
    }
    
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
        const currentValue = select.value;
        
        // Clear options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add filtered students
        studentsToDisplay.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class || 'ไม่มีข้อมูลชั้น'})`;
            option.dataset.name = student.name;
            option.dataset.class = student.class || 'ไม่มีข้อมูลชั้น';
            select.appendChild(option);
        });
        
        // Restore value if still available
        select.value = currentValue;
        if (select.value !== currentValue) {
            select.value = '';
            select.dispatchEvent(new Event('change'));
        }
    }
}

// ===== EXCEL IMPORT =====

async function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        showError('กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น');
        event.target.value = '';
        return;
    }
    
    showLoading(true, "กำลังอ่านไฟล์ Excel...");
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            if (json.length === 0) {
                showLoading(false);
                showError("ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์อาจจะว่างเปล่า");
                return;
            }
            
            // Validate required columns
            const requiredColumns = ['ชื่อ-นามสกุล', 'ชั้นเรียน'];
            const firstRow = json[0];
            const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
            
            if (missingColumns.length > 0) {
                showLoading(false);
                showError(`ไฟล์ Excel ต้องมีคอลัมน์: ${missingColumns.join(', ')}`);
                return;
            }
            
            const studentData = json.map(row => ({
                name: String(row['ชื่อ-นามสกุล'] || '').trim(),
                class: String(row['ชั้นเรียน'] || '').trim()
            })).filter(s => s.name && s.class);
            
            if (studentData.length === 0) {
                showLoading(false);
                showError("ไม่พบข้อมูลนักเรียนที่ถูกต้องในไฟล์");
                return;
            }
            
            showLoading(true, `กำลังนำเข้าข้อมูลนักเรียน ${studentData.length} คน...`);
            
            const response = await makeJSONPRequest('importStudents', {
                data: JSON.stringify(studentData)
            });
            
            showLoading(false);
            
            if (response && response.success) {
                await showSuccess(response.message);
                await loadStudents(); // Reload students
            } else {
                showError('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (response ? response.message : 'ไม่ทราบสาเหตุ'));
            }
            
        } catch (error) {
            showLoading(false);
            showError("เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel: " + error.message);
            console.error("Excel parsing error:", error);
        }
    };
    
    reader.onerror = function() {
        showLoading(false);
        showError("เกิดข้อผิดพลาดในการอ่านไฟล์");
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

// ===== MANUAL STUDENT ADD =====

async function handleManualAddSubmit(e) {
    e.preventDefault();
    
    const studentNameInput = document.getElementById('manual-student-name');
    const studentClassInput = document.getElementById('manual-student-class');
    const studentName = studentNameInput.value.trim();
    const studentClass = studentClassInput.value.trim();
    
    if (!studentName || !studentClass) {
        showError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    try {
        showLoading(true, `กำลังเพิ่มนักเรียน "${studentName}"...`);
        
        const response = await makeJSONPRequest('addStudentManual', {
            data: JSON.stringify({ name: studentName, class: studentClass })
        });
        
        showLoading(false);
        
        if (response && response.success) {
            await showSuccess(response.message);
            document.getElementById('manual-add-modal').classList.add('hidden');
            document.getElementById('manual-add-form').reset();
            await loadStudents(); // Reload students
        } else {
            showError('เกิดข้อผิดพลาดในการเพิ่มนักเรียน: ' + (response ? response.message : 'ไม่ทราบสาเหตุ'));
        }
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถเพิ่มนักเรียนได้: ${error.message}`);
        console.error('Error adding student:', error);
    }
}


// ===== SESSION MANAGEMENT (ใหม่) =====
function checkUserSession() {
    const userData = localStorage.getItem('sdq_user') || sessionStorage.getItem('sdq_user');
    const sessionId = localStorage.getItem('sdq_session') || sessionStorage.getItem('sdq_session');
    
    if (userData && sessionId) {
        try {
            const user = JSON.parse(userData);
            showUserInfo(user);
        } catch (error) {
            console.log('Session data invalid');
        }
    }
}

function showUserInfo(user) {
    // เพิ่ม banner แสดงข้อมูลผู้ใช้ที่ล็อกอินอยู่
    const header = document.querySelector('header');
    if (header && user) {
        const userBanner = document.createElement('div');
        userBanner.className = 'bg-green-600 text-white text-center py-2 text-sm';
        userBanner.innerHTML = `
            <span>ผู้ใช้งาน: ${user.fullName || user.username} (${getRoleDisplayName(user.role)})</span>
            <button onclick="goToDashboard()" class="ml-4 bg-green-700 px-3 py-1 rounded text-xs hover:bg-green-800">
                ไปยัง Dashboard
            </button>
            <button onclick="logout()" class="ml-2 bg-red-600 px-3 py-1 rounded text-xs hover:bg-red-700">
                ออกจากระบบ
            </button>
        `;
        header.appendChild(userBanner);
    }
}

function getRoleDisplayName(role) {
    const roleMap = {
        'SUPER_ADMIN': 'ผู้ดูแลระบบสูงสุด',
        'SCHOOL_ADMIN': 'ผู้บริหารโรงเรียน',
        'TEACHER': 'ครู',
        'PARENT': 'ผู้ปกครอง'
    };
    return roleMap[role] || role;
}

function goToDashboard() {
    const userData = localStorage.getItem('sdq_user') || sessionStorage.getItem('sdq_user');
    if (userData) {
        const user = JSON.parse(userData);
        if (user.role === 'TEACHER') {
            window.location.href = 'teacher-dashboard3.html';
        } else {
            window.location.href = 'login.html';
        }
    }
}

function logout() {
    localStorage.removeItem('sdq_user');
    localStorage.removeItem('sdq_session');
    sessionStorage.removeItem('sdq_user');
    sessionStorage.removeItem('sdq_session');
    location.reload();
}

// ===== RESULTS MANAGEMENT =====

async function loadIndividualResult() {
    const studentId = document.getElementById('result-student-name').value;
    const evaluatorType = document.getElementById('result-evaluator-type').value;
    
    if (!studentId) {
        clearIndividualResultsDisplay();
        return;
    }
    
    try {
        showLoading(true, "กำลังโหลดผลการประเมิน...");
        
        const response = await makeJSONPRequest('getAssessmentResults', {
            studentId: studentId,
            evaluatorType: evaluatorType
        });
        
        showLoading(false);
        displayIndividualResultsData(response);
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถโหลดผลการประเมินได้: ${error.message}`);
        clearIndividualResultsDisplay();
        console.error('Error loading individual results:', error);
    }
}

function displayIndividualResultsData(dataFromServer) {
    const contentDiv = document.getElementById('individual-result-content');
    const placeholderDiv = document.getElementById('individual-result-placeholder');
    
    let data = {};
    if (dataFromServer && dataFromServer.studentInfo) {
        data = { ...dataFromServer.studentInfo, ...dataFromServer };
    } else if (dataFromServer && dataFromServer.studentId) {
        data = dataFromServer;
    }
    
    if (data.studentName && data.scores && data.interpretations) {
        contentDiv.classList.remove('hidden');
        placeholderDiv.classList.add('hidden');
        
        // Update student info
        document.getElementById('result-info-name').textContent = data.studentName || '-';
        document.getElementById('result-info-class').textContent = data.class || data.studentClass || '-';
        document.getElementById('result-info-date').textContent = data.timestamp || '-';
        
        let evaluatorDisplay = data.evaluatorType || '-';
        let evaluatorNameDetail = data.evaluatorName || '';
        if (evaluatorDisplay === 'student') evaluatorDisplay = 'นักเรียนประเมินตนเอง';
        else if (evaluatorDisplay === 'teacher') evaluatorDisplay = `ครู (${evaluatorNameDetail})`;
        else if (evaluatorDisplay === 'parent') evaluatorDisplay = `ผู้ปกครอง (${evaluatorNameDetail}, ${data.relation || 'ไม่ระบุ'})`;
        
        document.getElementById('result-info-evaluator-type').textContent = evaluatorDisplay;
        
        // Update scores table
        const scores = data.scores;
        const interpretations = data.interpretations;
        const tableBody = document.getElementById('result-table-body');
        
        const aspectMap = [
            { key: 'emotional', label: 'ด้านอารมณ์' },
            { key: 'conduct', label: 'ด้านความประพฤติ' },
            { key: 'hyperactivity', label: 'ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น' },
            { key: 'peerProblems', label: 'ด้านความสัมพันธ์กับเพื่อน' },
            { key: 'prosocial', label: 'ด้านสัมพันธภาพทางสังคม (จุดแข็ง)' },
            { key: 'totalDifficulties', label: 'รวมปัญหา (4 ด้านแรก)', isTotal: true }
        ];
        
        tableBody.innerHTML = aspectMap.map(aspect => `
            <tr class="${aspect.isTotal ? 'bg-gray-50 font-semibold' : ''}">
                <td class="border border-gray-300 px-3 py-2">${aspect.label}</td>
                <td class="border border-gray-300 px-3 py-2 text-center">${scores[aspect.key] !== undefined ? scores[aspect.key] : '-'}</td>
                <td class="border border-gray-300 px-3 py-2 text-center ${getInterpretationClass(interpretations[aspect.key === 'totalDifficulties' ? 'total' : aspect.key])}">
                    ${interpretations[aspect.key === 'totalDifficulties' ? 'total' : aspect.key] || '-'}
                </td>
            </tr>
        `).join('');
        
        // Update interpretation summary
        const overallInterpretation = interpretations.total || 'ไม่พบข้อมูล';
        let summaryHtml = `<p class="mb-1"><strong>สรุปผลการประเมิน:</strong> นักเรียนมีผลรวมปัญหาอยู่ในเกณฑ์ <strong class="${getInterpretationClass(overallInterpretation)}">${overallInterpretation}</strong></p>`;
        summaryHtml += `<p><strong>ข้อเสนอแนะเบื้องต้น:</strong> `;
        
        if (overallInterpretation.includes('มีปัญหา') || overallInterpretation.includes('เสี่ยง')) {
            summaryHtml += `ควรให้ความสนใจและติดตามพฤติกรรมนักเรียนอย่างใกล้ชิด โดยเฉพาะในด้านที่พบความเสี่ยงหรือปัญหา อาจพิจารณาให้คำปรึกษาหรือส่งต่อผู้เชี่ยวชาญหากจำเป็น`;
        } else {
            summaryHtml += `นักเรียนมีพฤติกรรมโดยรวมอยู่ในเกณฑ์ปกติ ควรส่งเสริมจุดแข็ง (ด้านสัมพันธภาพทางสังคม: <span class="${getInterpretationClass(interpretations.prosocial)}">${interpretations.prosocial || '-'}</span>) และดูแลช่วยเหลือในด้านอื่นๆ ตามความเหมาะสมต่อไป`;
        }
        summaryHtml += `</p>`;
        
        document.getElementById('result-interpretation-summary').innerHTML = summaryHtml;
        
        // Update detailed answers
        const answersBody = document.getElementById('result-answers-body');
        const answerLabels = ["ไม่จริง", "จริงบางครั้ง", "จริงแน่นอน"];
        answersBody.innerHTML = '';
        
        if (data.answers && data.answers.length === 25) {
            questionsData.forEach((question, index) => {
                const answerValue = data.answers[index];
                const answerText = answerLabels[answerValue] || 'N/A';
                const row = document.createElement('tr');
                row.className = 'border-b';
                row.innerHTML = `
                    <td class="border border-gray-300 px-3 py-2 align-top">${index + 1}.</td>
                    <td class="border border-gray-300 px-3 py-2 align-top">${question.text.substring(question.text.indexOf('.') + 2)}</td>
                    <td class="border border-gray-300 px-3 py-2 align-top font-medium">${answerText}</td>
                `;
                answersBody.appendChild(row);
            });
        }
        
        updateResultChart(scores);
    } else {
        clearIndividualResultsDisplay();
        if (dataFromServer && dataFromServer.message) {
            placeholderDiv.innerHTML = `<div class="text-6xl mb-4">⚠️</div><p>${dataFromServer.message}</p>`;
        } else if (dataFromServer === null && document.getElementById('result-student-name').value !== "") {
            placeholderDiv.innerHTML = '<div class="text-6xl mb-4">❌</div><p>ไม่พบผลการประเมินสำหรับนักเรียนนี้</p>';
        }
    }
}

function clearIndividualResultsDisplay() {
    document.getElementById('individual-result-content').classList.add('hidden');
    document.getElementById('individual-result-placeholder').classList.remove('hidden');
    document.getElementById('individual-result-placeholder').innerHTML = '<div class="text-6xl mb-4">📊</div><p>โปรดเลือกนักเรียนเพื่อดูผลการประเมิน</p>';
    
    ['result-info-name', 'result-info-class', 'result-info-evaluator-type', 'result-info-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '-';
    });
    
    const resultTableBody = document.getElementById('result-table-body');
    if (resultTableBody) resultTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-3">ไม่มีข้อมูล</td></tr>';
    
    updateResultChart({ emotional: 0, conduct: 0, hyperactivity: 0, peerProblems: 0, prosocial: 0 });
}

// ===== SUMMARY MANAGEMENT =====

async function loadSummaryData() {
    const classFilter = document.getElementById('summary-class').value;
    const evaluatorTypeFilter = document.getElementById('summary-evaluator-type').value;
    
    try {
        showLoading(true, "กำลังโหลดข้อมูลสรุป...");
        
        const response = await makeJSONPRequest('getSummaryResults', {
            classFilter: classFilter,
            evaluatorTypeFilter: evaluatorTypeFilter,
            aspectFilter: 'all'
        });
        
        showLoading(false);
        displaySummaryData(response);
    } catch (error) {
        showLoading(false);
        showError(`ไม่สามารถโหลดข้อมูลสรุปได้: ${error.message}`);
        console.error('Error loading summary data:', error);
    }
}

function displaySummaryData(data) {
    if (!data || !data.summaryData) {
        showError('ไม่สามารถโหลดข้อมูลสรุปได้ หรือยังไม่มีข้อมูลการประเมินตามตัวกรอง');
        
        ['summary-total-students', 'summary-assessed-students', 'summary-date'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });
        
        const summaryTableBody = document.getElementById('summary-table-body');
        if (summaryTableBody) summaryTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-3">ไม่มีข้อมูล</td></tr>';
        
        const specialCareBody = document.getElementById('summary-special-care-body');
        if (specialCareBody) specialCareBody.innerHTML = '<tr><td colspan="4" class="text-center py-3">ไม่มีข้อมูล</td></tr>';
        
        updateSummaryChart(null);
        return;
    }
    
    // Update overview info
    document.getElementById('summary-total-students').textContent = data.totalStudentsInSystem !== undefined ? data.totalStudentsInSystem : (data.totalStudents || '-');
    document.getElementById('summary-assessed-students').textContent = data.assessedStudents || '0';
    document.getElementById('summary-date').textContent = data.date || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Update summary table
    const summaryTableBody = document.getElementById('summary-table-body');
    const aspectMap = [
        { key: 'emotional', label: 'ด้านอารมณ์' },
        { key: 'conduct', label: 'ด้านความประพฤติ' },
        { key: 'hyperactivity', label: 'ด้านพฤติกรรมอยู่ไม่นิ่ง/สมาธิสั้น' },
        { key: 'peerProblems', label: 'ด้านความสัมพันธ์กับเพื่อน' },
        { key: 'prosocial', label: 'ด้านสัมพันธภาพทางสังคม (จุดแข็ง)' },
        { key: 'totalDifficulties', label: 'รวมปัญหา (4 ด้านแรก)', isTotal: true }
    ];
    
    summaryTableBody.innerHTML = aspectMap.map(aspect => {
        const aspectData = data.summaryData[aspect.key];
        const normalCount = (aspectData && (aspectData['ปกติ'] || aspectData['จุดแข็ง'])) || 0;
        const riskCount = (aspectData && aspectData['เสี่ยง']) || 0;
        const problemCount = (aspectData && (aspectData['มีปัญหา'] || aspectData['ควรปรับปรุง'])) || 0;
        const total = aspectData ? (aspectData.total || 0) : 0;
        
        return `
            <tr class="${aspect.isTotal ? 'bg-gray-50 font-semibold' : ''}">
                <td class="border border-gray-300 px-3 py-2">${aspect.label}</td>
                <td class="border border-gray-300 px-3 py-2 text-center">${total > 0 ? (normalCount/total*100).toFixed(1) : '0.0'} (${normalCount})</td>
                <td class="border border-gray-300 px-3 py-2 text-center">${total > 0 ? (riskCount/total*100).toFixed(1) : '0.0'} (${riskCount})</td>
                <td class="border border-gray-300 px-3 py-2 text-center">${total > 0 ? (problemCount/total*100).toFixed(1) : '0.0'} (${problemCount})</td>
            </tr>`;
    }).join('');
    
    // Update special care table
    const specialCareTableBody = document.getElementById('summary-special-care-body');
    if (data.studentsForSpecialCare && data.studentsForSpecialCare.length > 0) {
        specialCareTableBody.innerHTML = data.studentsForSpecialCare.map(student => `
            <tr>
                <td class="border border-gray-300 px-3 py-2">${student.name}</td>
                <td class="border border-gray-300 px-3 py-2 text-center">${student.class}</td>
                <td class="border border-gray-300 px-3 py-2">${student.problemAspects || 'N/A'}</td>
                <td class="border border-gray-300 px-3 py-2 text-center ${getInterpretationClass(student.severity)}">${student.severity}</td>
            </tr>`).join('');
    } else {
        specialCareTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">ไม่พบนักเรียนที่ควรได้รับการดูแลเป็นพิเศษตามเกณฑ์ที่กำหนด</td></tr>';
    }
    
    updateSummaryChart(data.summaryData);
}

// ===== PRINT FUNCTIONALITY =====

function printWithTitle(newTitle) {
    const originalTitle = document.title;
    document.title = newTitle;
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showPage(`page-${this.id.replace('tab-', '')}`);
        });
    });
    
    // Quick navigation buttons
    document.getElementById('quick-student')?.addEventListener('click', () => showPage('page-student'));
    document.getElementById('quick-teacher')?.addEventListener('click', () => showPage('page-teacher'));
    document.getElementById('quick-parent')?.addEventListener('click', () => showPage('page-parent'));
    
    // Form submissions
    document.getElementById('student-assessment-form')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('teacher-assessment-form')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('parent-assessment-form')?.addEventListener('submit', handleFormSubmit);
    
    // Result controls
    document.getElementById('result-student-name')?.addEventListener('change', loadIndividualResult);
    document.getElementById('result-evaluator-type')?.addEventListener('change', loadIndividualResult);
    
    // Summary controls
    document.getElementById('summary-class')?.addEventListener('change', loadSummaryData);
    document.getElementById('summary-evaluator-type')?.addEventListener('change', loadSummaryData);
    
    // Class filters
    document.getElementById('student-class-filter-s')?.addEventListener('change', handleClassFilterChange);
    document.getElementById('teacher-class-filter-t')?.addEventListener('change', handleClassFilterChange);
    document.getElementById('parent-class-filter-p')?.addEventListener('change', handleClassFilterChange);
    
    // Student management
    document.getElementById('excel-file-input')?.addEventListener('change', handleExcelImport);
    document.getElementById('manual-add-student-btn')?.addEventListener('click', () => {
        document.getElementById('manual-add-modal').classList.remove('hidden');
    });
    document.getElementById('cancel-add-btn')?.addEventListener('click', () => {
        document.getElementById('manual-add-modal').classList.add('hidden');
    });
    document.getElementById('manual-add-form')?.addEventListener('submit', handleManualAddSubmit);
    
    // Print buttons
    document.getElementById('print-results')?.addEventListener('click', () => {
        const studentName = document.getElementById('result-info-name').textContent;
        printWithTitle(`รายงานผลรายบุคคล - ${studentName}`);
    });
    document.getElementById('print-summary')?.addEventListener('click', () => {
        printWithTitle('สรุปผลการประเมินภาพรวม SDQ');
    });
    
    // Print form buttons
    document.querySelectorAll('.print-form-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const currentPage = document.querySelector('.page:not(.hidden)');
            let studentName = "นักเรียน";
            
            if (currentPage.id === 'page-student') {
                const studentData = getSelectedStudentData('student-name-s');
                studentName = studentData?.name || "นักเรียน";
                printWithTitle(`แบบประเมิน SDQ - ${studentName}`);
            } else if (currentPage.id === 'page-teacher') {
                const studentData = getSelectedStudentData('teacher-student-name-t');
                studentName = studentData?.name || "นักเรียน";
                printWithTitle(`แบบประเมิน SDQ - ${studentName} (โดยครู)`);
            } else if (currentPage.id === 'page-parent') {
                const studentData = getSelectedStudentData('parent-student-name-p');
                studentName = studentData?.name || "นักเรียน";
                printWithTitle(`แบบประเมิน SDQ - ${studentName} (โดยผู้ปกครอง)`);
            }
        });
    });
    
    // Close modal when clicking outside
    document.getElementById('manual-add-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบ session
        checkUserSession(); 
    // Check if GAS_WEB_APP_URL is configured
    if (GAS_WEB_APP_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        showError('กรุณาตั้งค่า URL ของ Google Apps Script ในไฟล์ script.js', 'ยังไม่ได้ตั้งค่า');
        return;
    }
    
    // Set current year in footer
    document.getElementById('current-year-footer').textContent = new Date().getFullYear();
    
    // Initialize components
    generateQuestionForms();
    initCharts();
    setupEventListeners();
    
    // Load initial data
    loadStudents();
    
    // Show home page
    showPage('page-home');
});
