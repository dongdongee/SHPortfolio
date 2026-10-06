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
                        beginAtZero: false
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
            9800,
            10100,
            10500,
            11000,
            11400,
            11900,
            12728
        ]
    },
    {
        selector: '#kpiRequests',
        data: [
            72100,
            75800,
            79400,
            82100,
            88600,
            92300,
            98346
        ]
    },
    {
        selector: '#kpiProjects',
        data: [
            1810,
            1890,
            1930,
            2010,
            2050,
            2110,
            2156
        ]
    },
    {
        selector: '#kpiStatus',
        data: [
            99.2,
            99.4,
            99.3,
            99.6,
            99.7,
            99.8,
            99.9
        ]
    }
];


/* *********************************
 * Init
 * ********************************* */

kpiData.forEach((item) => {
    new KpiChart(item.selector, {
        data: item.data
    });
});