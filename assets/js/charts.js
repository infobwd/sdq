/**
 * Chart Management for SDQ System
 */
class Charts {
    static resultChartInstance = null;
    static summaryChartInstance = null;

    static init() {
        this.initResultChart();
        this.initSummaryChart();
        this.setupResponsiveHandler();
    }

    static initResultChart() {
        const resultCtx = document.getElementById('result-chart');
        if (!resultCtx) return;

        const ctx = resultCtx.getContext('2d');

        if (this.resultChartInstance) {
            this.resultChartInstance.destroy();
        }

        const chartConfig = {
            type: 'radar',
            data: {
                labels: [
                    'ด้านอารมณ์',
                    'ด้านความประพฤติ',
                    'ด้านสมาธิสั้น',
                    'ด้านเพื่อน',
                    'ด้านสังคม (จุดแข็ง)'
                ],
                datasets: [{
                    label: 'คะแนน',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        min: 0,
                        ticks: {
                            stepSize: 2,
                            backdropColor: 'transparent',
                            font: { size: 10, family: 'Sarabun' },
                            color: '#6b7280'
                        },
                        pointLabels: {
                            font: { size: 11, family: 'Sarabun', weight: '500' },
                            color: '#374151'
                        },
                        grid: { color: '#e5e7eb' },
                        angleLines: { color: '#e5e7eb' }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: { size: 12, family: 'Sarabun' },
                            color: '#374151',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: 'Sarabun', size: 14 },
                        bodyFont: { family: 'Sarabun', size: 12 },
                        callbacks: {
                            label: function (context) {
                                return `คะแนน: ${context.parsed.r}/10`;
                            }
                        }
                    }
                },
                elements: {
                    line: { tension: 0.2 }
                }
            }
        };

        this.resultChartInstance = new Chart(ctx, chartConfig);
    }

    static initSummaryChart() {
        const summaryCtx = document.getElementById('summary-chart');
        if (!summaryCtx) return;

        const ctx = summaryCtx.getContext('2d');

        if (this.summaryChartInstance) {
            this.summaryChartInstance.destroy();
        }

        const chartConfig = {
            type: 'bar',
            data: {
                labels: [
                    'ด้านอารมณ์',
                    'ด้านความประพฤติ',
                    'ด้านสมาธิสั้น',
                    'ด้านเพื่อน',
                    'ด้านสังคม'
                ],
                datasets: [
                    {
                        label: 'ปกติ',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'เสี่ยง',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'มีปัญหา',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                scales: {
                    x: {
                        ticks: {
                            font: { size: 10, family: 'Sarabun', weight: '500' },
                            color: '#6b7280',
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: { size: 10, family: 'Sarabun' },
                            color: '#6b7280',
                            callback: value => `${value}%`,
                            stepSize: 20
                        },
                        title: {
                            display: true,
                            text: 'ร้อยละ (%)',
                            font: { size: 12, family: 'Sarabun', weight: '600' },
                            color: '#374151'
                        },
                        grid: { color: '#f3f4f6', lineWidth: 1 }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: { size: 12, family: 'Sarabun', weight: '500' },
                            color: '#374151',
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'rect'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: 'Sarabun', size: 14, weight: '600' },
                        bodyFont: { family: 'Sarabun', size: 12 },
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: context => context[0].label,
                            label: context => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
                            afterBody: context => {
                                const i = context[0].dataIndex;
                                const total = context[0].chart.data.datasets.reduce((sum, d) => sum + d.data[i], 0);
                                return [`รวม: ${total.toFixed(1)}%`];
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    bar: {
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        };

        this.summaryChartInstance = new Chart(ctx, chartConfig);

        // Add click handler
        this.summaryChartInstance.options.onClick = (event, activeElements) => {
            this.handleChartClick(event, activeElements, this.summaryChartInstance);
        };
    }

    static updateResultChart(scores) {
        if (!this.resultChartInstance || !scores) return;
        const data = [
            scores.emotional || 0,
            scores.conduct || 0,
            scores.hyperactivity || 0,
            scores.peerProblems || 0,
            scores.prosocial || 0
        ];
        this.resultChartInstance.data.datasets[0].data = data;
        this.resultChartInstance.update();
    }

    static updateSummaryChart(summaryData) {
        if (!this.summaryChartInstance || !summaryData) return;

        const aspects = ['emotional', 'conduct', 'hyperactivity', 'peerProblems', 'prosocial'];
        const datasets = this.summaryChartInstance.data.datasets;

        aspects.forEach((key, i) => {
            const aspect = summaryData[key];
            const total = (aspect && aspect.total > 0) ? aspect.total : 0;
            let normal = 0, risk = 0, problem = 0;

            if (key === 'prosocial') {
                normal = (aspect?.['จุดแข็ง'] || 0) + (aspect?.['ปกติ'] || 0);
                problem = aspect?.['ควรปรับปรุง'] || 0;
            } else {
                normal = aspect?.['ปกติ'] || 0;
                risk = aspect?.['เสี่ยง'] || 0;
                problem = aspect?.['มีปัญหา'] || 0;
            }

            datasets[0].data[i] = total ? Utils.calculatePercentage(normal, total, 1) : 0;
            datasets[1].data[i] = total ? Utils.calculatePercentage(risk, total, 1) : 0;
            datasets[2].data[i] = total ? Utils.calculatePercentage(problem, total, 1) : 0;
        });

        this.summaryChartInstance.update();
    }

    static resetResultChart() {
        if (this.resultChartInstance) {
            this.resultChartInstance.data.datasets[0].data = [0, 0, 0, 0, 0];
            this.resultChartInstance.update();
        }
    }

    static resetSummaryChart() {
        if (this.summaryChartInstance) {
            this.summaryChartInstance.data.datasets.forEach(ds => ds.data = [0, 0, 0, 0, 0]);
            this.summaryChartInstance.update();
        }
    }

    static updateAllCharts() {
        this.resultChartInstance?.resize();
        this.summaryChartInstance?.resize();
    }

    static setupResponsiveHandler() {
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.updateAllCharts(), 250);
        });
    }

    static destroyCharts() {
        this.resultChartInstance?.destroy();
        this.summaryChartInstance?.destroy();
        this.resultChartInstance = null;
        this.summaryChartInstance = null;
    }

    static reinitializeCharts() {
        this.destroyCharts();
        setTimeout(() => this.init(), 100);
    }

    static getChartImage(chartType) {
        const chart = chartType === 'result' ? this.resultChartInstance : this.summaryChartInstance;
        return chart?.toBase64Image() || null;
    }

    static downloadChartImage(chartType, filename = 'chart.png') {
        const image = this.getChartImage(chartType);
        if (image) {
            const link = document.createElement('a');
            link.href = image;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    static updateChartTheme(theme = 'light') {
        const textColor = theme === 'dark' ? '#f3f4f6' : '#374151';
        const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

        if (this.resultChartInstance) {
            const r = this.resultChartInstance.options.scales.r;
            r.ticks.color = textColor;
            r.pointLabels.color = textColor;
            r.grid.color = gridColor;
            r.angleLines.color = gridColor;
            this.resultChartInstance.options.plugins.legend.labels.color = textColor;
            this.resultChartInstance.update();
        }

        if (this.summaryChartInstance) {
            const x = this.summaryChartInstance.options.scales.x;
            const y = this.summaryChartInstance.options.scales.y;
            x.ticks.color = textColor;
            y.ticks.color = textColor;
            y.title.color = textColor;
            y.grid.color = gridColor;
            this.summaryChartInstance.options.plugins.legend.labels.color = textColor;
            this.summaryChartInstance.update();
        }
    }

    static createMiniChart(canvas, data, type = 'line') {
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');

        return new Chart(ctx, {
            type,
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: { x: { display: false }, y: { display: false } },
                elements: { point: { radius: 0 } }
            }
        });
    }

    static getChartStats() {
        return {
            resultChart: {
                exists: !!this.resultChartInstance,
                type: this.resultChartInstance?.config?.type || null,
                dataPoints: this.resultChartInstance?.data?.datasets?.[0]?.data?.length || 0
            },
            summaryChart: {
                exists: !!this.summaryChartInstance,
                type: this.summaryChartInstance?.config?.type || null,
                datasets: this.summaryChartInstance?.data?.datasets?.length || 0
            }
        };
    }

    static handleChartClick(event, activeElements, chart) {
        if (activeElements.length > 0) {
            const el = activeElements[0];
            const dataset = chart.data.datasets[el.datasetIndex];
            const label = chart.data.labels[el.index];
            const value = dataset.data[el.index];
            console.log('Chart clicked:', { dataset: dataset.label, label, value });
        }
    }
}
