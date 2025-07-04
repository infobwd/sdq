/**
 * Chart Management for SDQ System
 */

class Charts {
    static resultChartInstance = null;
    static summaryChartInstance = null;

    /**
     * Initialize charts
     */
    static init() {
        this.initResultChart();
        this.initSummaryChart();
        this.setupResponsiveHandler();
    }

    /**
     * Initialize individual result chart (radar chart)
     */
    static initResultChart() {
        const resultCtx = document.getElementById('result-chart');
        if (!resultCtx) return;

        const ctx = resultCtx.getContext('2d');
        
        // Destroy existing chart if exists
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
                            font: {
                                size: 10,
                                family: 'Sarabun'
                            },
                            color: '#6b7280'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: {
                                size: 10,
                                family: 'Sarabun'
                            },
                            color: '#6b7280',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'ร้อยละ (%)',
                            font: {
                                size: 12,
                                family: 'Sarabun',
                                weight: '500'
                            },
                            color: '#374151'
                        },
                        grid: {
                            color: '#f3f4f6'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12,
                                family: 'Sarabun'
                            },
                            color: '#374151',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            family: 'Sarabun',
                            size: 14
                        },
                        bodyFont: {
                            family: 'Sarabun',
                            size: 12
                        },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        this.summaryChartInstance = new Chart(ctx, chartConfig);
    }

    /**
     * Update individual result chart with new data
     * @param {Object} scores - Score data
     */
    static updateResultChart(scores) {
        if (!this.resultChartInstance || !scores) return;

        try {
            const data = [
                scores.emotional || 0,
                scores.conduct || 0,
                scores.hyperactivity || 0,
                scores.peerProblems || 0,
                scores.prosocial || 0
            ];

            this.resultChartInstance.data.datasets[0].data = data;
            this.resultChartInstance.update('active');

        } catch (error) {
            console.error('Error updating result chart:', error);
        }
    }

    /**
     * Update summary chart with new data
     * @param {Object} summaryData - Summary data
     */
    static updateSummaryChart(summaryData) {
        if (!this.summaryChartInstance || !summaryData) return;

        try {
            const aspects = ['emotional', 'conduct', 'hyperactivity', 'peerProblems', 'prosocial'];
            const datasets = this.summaryChartInstance.data.datasets;

            aspects.forEach((aspectKey, i) => {
                const aspect = summaryData[aspectKey];
                const total = (aspect && aspect.total > 0) ? aspect.total : 0;

                let normalCount = 0;
                let riskCount = 0;
                let problemCount = 0;

                if (aspectKey === 'prosocial') {
                    // For prosocial: combine 'จุดแข็ง' and 'ปกติ' as normal
                    normalCount = ((aspect && aspect['จุดแข็ง']) || 0) + ((aspect && aspect['ปกติ']) || 0);
                    riskCount = 0; // Prosocial doesn't have 'เสี่ยง'
                    problemCount = (aspect && aspect['ควรปรับปรุง']) || 0;
                } else {
                    normalCount = (aspect && aspect['ปกติ']) || 0;
                    riskCount = (aspect && aspect['เสี่ยง']) || 0;
                    problemCount = (aspect && aspect['มีปัญหา']) || 0;
                }

                // Calculate percentages
                datasets[0].data[i] = total > 0 ? Utils.calculatePercentage(normalCount, total, 1) : 0;
                datasets[1].data[i] = total > 0 ? Utils.calculatePercentage(riskCount, total, 1) : 0;
                datasets[2].data[i] = total > 0 ? Utils.calculatePercentage(problemCount, total, 1) : 0;
            });

            this.summaryChartInstance.update('active');

        } catch (error) {
            console.error('Error updating summary chart:', error);
        }
    }

    /**
     * Reset result chart to default state
     */
    static resetResultChart() {
        if (this.resultChartInstance) {
            this.resultChartInstance.data.datasets[0].data = [0, 0, 0, 0, 0];
            this.resultChartInstance.update();
        }
    }

    /**
     * Reset summary chart to default state
     */
    static resetSummaryChart() {
        if (this.summaryChartInstance) {
            this.summaryChartInstance.data.datasets.forEach(dataset => {
                dataset.data = [0, 0, 0, 0, 0];
            });
            this.summaryChartInstance.update();
        }
    }

    /**
     * Update all charts (useful for responsive handling)
     */
    static updateAllCharts() {
        if (this.resultChartInstance) {
            this.resultChartInstance.resize();
        }
        if (this.summaryChartInstance) {
            this.summaryChartInstance.resize();
        }
    }

    /**
     * Setup responsive handler for window resize
     */
    static setupResponsiveHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateAllCharts();
            }, 250);
        });
    }

    /**
     * Destroy all chart instances
     */
    static destroyCharts() {
        if (this.resultChartInstance) {
            this.resultChartInstance.destroy();
            this.resultChartInstance = null;
        }
        if (this.summaryChartInstance) {
            this.summaryChartInstance.destroy();
            this.summaryChartInstance = null;
        }
    }

    /**
     * Reinitialize charts (useful when switching themes or layouts)
     */
    static reinitializeCharts() {
        this.destroyCharts();
        setTimeout(() => {
            this.init();
        }, 100);
    }

    /**
     * Get chart image data for export
     * @param {string} chartType - 'result' or 'summary'
     * @returns {string} Base64 image data
     */
    static getChartImage(chartType) {
        const chart = chartType === 'result' ? this.resultChartInstance : this.summaryChartInstance;
        if (chart) {
            return chart.toBase64Image();
        }
        return null;
    }

    /**
     * Download chart as image
     * @param {string} chartType - 'result' or 'summary'
     * @param {string} filename - Filename for download
     */
    static downloadChartImage(chartType, filename = 'chart.png') {
        const imageData = this.getChartImage(chartType);
        if (imageData) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = imageData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Update chart colors based on theme
     * @param {string} theme - 'light' or 'dark'
     */
    static updateChartTheme(theme = 'light') {
        const textColor = theme === 'dark' ? '#f3f4f6' : '#374151';
        const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

        // Update result chart
        if (this.resultChartInstance) {
            this.resultChartInstance.options.scales.r.ticks.color = textColor;
            this.resultChartInstance.options.scales.r.pointLabels.color = textColor;
            this.resultChartInstance.options.scales.r.grid.color = gridColor;
            this.resultChartInstance.options.scales.r.angleLines.color = gridColor;
            this.resultChartInstance.options.plugins.legend.labels.color = textColor;
            this.resultChartInstance.update();
        }

        // Update summary chart
        if (this.summaryChartInstance) {
            this.summaryChartInstance.options.scales.x.ticks.color = textColor;
            this.summaryChartInstance.options.scales.y.ticks.color = textColor;
            this.summaryChartInstance.options.scales.y.title.color = textColor;
            this.summaryChartInstance.options.scales.y.grid.color = gridColor;
            this.summaryChartInstance.options.plugins.legend.labels.color = textColor;
            this.summaryChartInstance.update();
        }
    }

    /**
     * Create mini chart for dashboard
     * @param {HTMLElement} canvas - Canvas element
     * @param {Array} data - Chart data
     * @param {string} type - Chart type
     */
    static createMiniChart(canvas, data, type = 'line') {
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        
        const config = {
            type: type,
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
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    /**
     * Get chart statistics
     * @returns {Object} Chart statistics
     */
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

    /**
     * Handle chart click events
     * @param {Event} event - Click event
     * @param {Array} activeElements - Active chart elements
     * @param {Object} chart - Chart instance
     */
    static handleChartClick(event, activeElements, chart) {
        if (activeElements.length > 0) {
            const element = activeElements[0];
            const datasetIndex = element.datasetIndex;
            const index = element.index;
            
            console.log('Chart clicked:', {
                dataset: chart.data.datasets[datasetIndex].label,
                label: chart.data.labels[index],
                value: chart.data.datasets[datasetIndex].data[index]
            });
        }
    }
}
                                size: 10,
                                family: 'Sarabun'
                            },
                            color: '#6b7280'
                        },
                        pointLabels: {
                            font: {
                                size: 11,
                                family: 'Sarabun',
                                weight: '500'
                            },
                            color: '#374151'
                        },
                        grid: {
                            color: '#e5e7eb'
                        },
                        angleLines: {
                            color: '#e5e7eb'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12,
                                family: 'Sarabun'
                            },
                            color: '#374151',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            family: 'Sarabun',
                            size: 14
                        },
                        bodyFont: {
                            family: 'Sarabun',
                            size: 12
                        },
                        callbacks: {
                            label: function(context) {
                                return `คะแนน: ${context.parsed.r}/10`;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.2
                    }
                }
            }
        };

        this.resultChartInstance = new Chart(ctx, chartConfig);
    }

    /**
     * Initialize summary chart (bar chart)
     */
    static initSummaryChart() {
        const summaryCtx = document.getElementById('summary-chart');
        if (!summaryCtx) return;

        const ctx = summaryCtx.getContext('2d');

        // Destroy existing chart if exists
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
                        borderWidth: 1
                    },
                    {
                        label: 'เสี่ยง',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'มีปัญหา',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            font: {
