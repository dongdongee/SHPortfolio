/* *********************************
 * KPI Chart
 * ********************************* */

class KpiChart {
    constructor(selector, options = {}) {
        this.el = document.querySelector(selector);

        if (!this.el) return;

        this.data = options.data || [];
        this.compareText = options.compareText || 'vs last 7 days';

        this.init();
    }

    init() {
        if (!this.data.length) return;

        this.setData();
        this.renderChart();
    }

    setData() {
        const first = this.data[0];
        const last = this.data[this.data.length - 1];

        this.value = last;

        this.changeRate = first !== 0
            ? ((last - first) / first) * 100
            : 0;

        this.trend =
            this.changeRate > 0
                ? 'up'
                : this.changeRate < 0
                    ? 'down'
                    : 'same';

        this.renderInfo();
    }

    renderInfo() {
        const valueEl =
            this.el.querySelector('.kpi-card__value');

        const changeEl =
            this.el.querySelector('.kpi-card__change');

        const compareEl =
            this.el.querySelector('.kpi-card__compare');

        if (valueEl) {
            valueEl.textContent =
                this.value.toLocaleString();
        }

        if (changeEl) {
            const arrow =
                this.trend === 'up'
                    ? '↑'
                    : this.trend === 'down'
                        ? '↓'
                        : '–';

            changeEl.textContent =
                `${arrow} ${Math.abs(this.changeRate).toFixed(1)}%`;

            changeEl.classList.remove(
                'is-up',
                'is-down',
                'is-same'
            );

            changeEl.classList.add(`is-${this.trend}`);
        }

        if (compareEl) {
            compareEl.textContent = this.compareText;
        }
    }

    renderChart() {
        const canvas =
            this.el.querySelector('.kpi-card__chart canvas');

        if (!canvas) return;

        const min = Math.min(...this.data);
        const max = Math.max(...this.data);

        const colors = this.data.map((value) => {
            const ratio = max === min
                ? 1
                : (value - min) / (max - min);

            const opacity = 0.25 + (ratio * 0.75);

            return `rgba(124, 58, 237, ${opacity})`;
        });

        new Chart(canvas, {
            type: 'bar',

            data: {
                labels: this.data.map((_, index) => index + 1),

                datasets: [{
                    data: this.data,
                    borderWidth: 0,
                    borderRadius: 2,
                    backgroundColor: colors
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
                        display: false,
                        beginAtZero: true,
                        max: max
                    }
                }
            }
        });
    }
}


/* *********************************
 * KPI Data
 * ********************************* */

const kpiData = [
    {
        selector: '#kpiUsers',
        data: [
            400,
            242,
            367,
            800,
            820,
            898,
            923
        ]
    },
    {
        selector: '#kpiRequests',
        data: [
            20,
            50,
            54,
            82,
            88,
            92,
            98
        ]
    },
    {
        selector: '#kpiProjects',
        data: [
            2,
            2,
            5,
            8,
            14,
            4,
            6
        ]
    },
    {
        selector: '#kpiStatus',
        data: [
            89.2,
            99.4,
            79.3,
            99.6,
            99.7,
            79.8,
            99.9
        ]
    }
];




/* *********************************
 * Usage Chart
 * ********************************* */

class UsageChart {
    constructor(selector, options = {}) {
        this.el = document.querySelector(selector);

        if (!this.el) return;

        this.dataUrl = options.dataUrl;
        this.data = [];
        this.chart = null;

        this.init();
    }

    async init() {
        await this.loadData();

        if (!this.data.length) return;

        this.renderChart();
    }

    async loadData() {
        try {
            const response = await fetch(this.dataUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();

            const rows = Array.isArray(json) ? json : json.daily;

            if (!Array.isArray(rows)) {
                throw new Error('Invalid usage data format');
            }

            this.data = rows;

        } catch (error) {
            console.error('Usage data load failed:', error);
            this.data = [];
        }
    }

    renderChart() {
        const canvas = this.el.querySelector('canvas');

        if (!canvas) return;

        const labels = this.data.map(item => item.date);
        const requests = this.data.map(item => item.requests);
        const users = this.data.map(item => item.users);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(canvas, {
            type: 'line',

            data: {
                labels,

                datasets: [
                    {
                        label: 'Requests',
                        data: requests,
                        borderColor: '#773df9',
                        backgroundColor: 'rgba(119, 61, 249, 0.08)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Users',
                        data: users,
                        borderColor: '#b8a0fa',
                        backgroundColor: '#b8a0fa',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        yAxisID: 'y1'
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },

                plugins: {
                    legend: {
                        position: 'bottom'
                    },

                    tooltip: {
                        enabled: true
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },

                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true
                    },

                    y1: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
}



/* *********************************
 * Init
 * ********************************* */

kpiData.forEach((item) => {
    new KpiChart(item.selector, {
        data: item.data
    });
});


new UsageChart('#usageChart', {
    dataUrl: '/sai/assets/data/usage.json'
});