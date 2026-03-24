/* ========================================
   Dashboard Manager
   Handles mood analytics and chart rendering
   ======================================== */

class DashboardManager {
    constructor() {
        this.moodTimeChart = null;
        this.moodDistChart = null;
        this.moodColors = {
            happy: '#F59E0B',
            sad: '#6366F1',
            anxious: '#EC4899',
            angry: '#EF4444',
            stressed: '#F97316',
            grateful: '#10B981',
            lonely: '#8B5CF6',
            confused: '#06B6D4',
            neutral: '#9CA3AF',
            hopeful: '#84CC16'
        };
        this.moodEmojis = {
            happy: '😊',
            sad: '😢',
            anxious: '😰',
            angry: '😠',
            stressed: '😫',
            grateful: '🙏',
            lonely: '😔',
            confused: '🤔',
            neutral: '😐',
            hopeful: '🌟'
        };
    }

    /**
     * Update the dashboard with analytics data
     */
    update(analytics) {
        if (!analytics) {
            this.showEmpty();
            return;
        }

        this.hideEmpty();
        this.updateStats(analytics);
        this.renderMoodTimeChart(analytics.timeline);
        this.renderMoodDistChart(analytics.moodDistribution);
    }

    /**
     * Update stat cards
     */
    updateStats(analytics) {
        const totalEl = document.getElementById('totalEntries');
        const streakEl = document.getElementById('currentStreak');
        const avgEl = document.getElementById('avgMood');
        const topEl = document.getElementById('topMood');

        if (totalEl) totalEl.textContent = analytics.totalEntries;
        if (streakEl) streakEl.textContent = analytics.streak;
        if (avgEl) avgEl.textContent = analytics.averageMood + '/10';
        if (topEl) {
            const emoji = this.moodEmojis[analytics.topMood] || '😐';
            topEl.textContent = emoji + ' ' + this.capitalize(analytics.topMood);
        }
    }

    /**
     * Render mood over time line chart
     */
    renderMoodTimeChart(timeline) {
        const ctx = document.getElementById('moodTimeChart');
        if (!ctx) return;

        if (this.moodTimeChart) {
            this.moodTimeChart.destroy();
        }

        const labels = timeline.map(t => t.date);
        const data = timeline.map(t => t.score);
        const colors = timeline.map(t => this.moodColors[t.mood] || '#9CA3AF');

        this.moodTimeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.slice(-20), // Last 20 entries
                datasets: [{
                    label: 'Mood Score',
                    data: data.slice(-20),
                    borderColor: '#5B8A72',
                    backgroundColor: 'rgba(91, 138, 114, 0.1)',
                    borderWidth: 2.5,
                    pointBackgroundColor: colors.slice(-20),
                    pointBorderColor: colors.slice(-20),
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const entry = timeline[context.dataIndex];
                                const emoji = entry ? (entry.mood || 'neutral') : 'neutral';
                                return `Mood: ${emoji} | Score: ${context.parsed.y}/10`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 10,
                        ticks: {
                            stepSize: 2,
                            color: '#9CA3AF',
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9CA3AF',
                            font: { size: 11 },
                            maxRotation: 45
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Render mood distribution doughnut chart
     */
    renderMoodDistChart(distribution) {
        const ctx = document.getElementById('moodDistChart');
        if (!ctx) return;

        if (this.moodDistChart) {
            this.moodDistChart.destroy();
        }

        const labels = Object.keys(distribution).map(m => {
            const emoji = this.moodEmojis[m] || '😐';
            return `${emoji} ${this.capitalize(m)}`;
        });
        const data = Object.values(distribution);
        const colors = Object.keys(distribution).map(m => this.moodColors[m] || '#9CA3AF');

        this.moodDistChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return ` ${context.label}: ${context.parsed} entries (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    showEmpty() {
        const empty = document.getElementById('dashboardEmpty');
        const charts = document.querySelector('.charts-grid');
        const stats = document.querySelector('.stats-grid');
        if (empty) empty.classList.remove('hidden');
        if (charts) charts.style.display = 'none';
        if (stats) stats.style.display = 'none';
    }

    hideEmpty() {
        const empty = document.getElementById('dashboardEmpty');
        const charts = document.querySelector('.charts-grid');
        const stats = document.querySelector('.stats-grid');
        if (empty) empty.classList.add('hidden');
        if (charts) charts.style.display = '';
        if (stats) stats.style.display = '';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
