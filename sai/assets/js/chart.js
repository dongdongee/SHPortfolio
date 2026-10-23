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
        this.filteredData = [];

        this.period = 'day';
        this.selectedDate = new Date();

        this.minDate = null;
        this.maxDate = null;

        this.chart = null;

        this.ready = this.init();
    }

    async init() {
        await this.loadData();

        if (!this.data.length) return;

        this.setInitialDate();
        this.filterData();
        this.renderChart();
        this.bindEvents();
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

            this.data = rows
                .filter(item => {
                    return (
                        typeof item.date === 'string' &&
                        Number.isFinite(item.requests) &&
                        Number.isFinite(item.users)
                    );
                })
                .sort((a, b) => a.date.localeCompare(b.date));

            if (!this.data.length) return;

            this.minDate = this.data[0].date;
            this.maxDate = this.data[this.data.length - 1].date;

        } catch (error) {
            console.error('Usage data load failed:', error);
            this.data = [];
        }
    }

    setInitialDate() {
        const today = this.formatDate(new Date());

        const selectedDate = today > this.maxDate
            ? this.maxDate
            : today < this.minDate
                ? this.minDate
                : today;

        this.selectedDate = this.parseDate(selectedDate);
    }

    bindEvents() {
        const buttons = this.el.querySelectorAll('[data-period]');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const period = button.dataset.period;

                if (this.period === period) return;

                this.setPeriod(period);

                buttons.forEach(item => {
                    const isActive = item === button;

                    item.classList.toggle('is-active', isActive);
                    item.setAttribute('aria-pressed', String(isActive));
                });
            });
        });
    }

    setPeriod(period) {
        const validPeriods = ['day', 'week', 'month'];

        if (!validPeriods.includes(period)) return;

        this.period = period;

        this.filterData();
        this.updateChart();
    }

    setDate(date) {
        const selectedDate = this.parseDate(date);

        if (!selectedDate) return;

        this.selectedDate = selectedDate;

        this.filterData();
        this.updateChart();
    }

    filterData() {
        if (this.period === 'day') {
            this.filteredData = this.getDailyData();
        }

        if (this.period === 'week') {
            this.filteredData = this.getWeeklyData();
        }

        if (this.period === 'month') {
            this.filteredData = this.getMonthlyData();
        }
    }

    // 최근 7일의 일별 데이터
    getDailyData() {
        const endDate = new Date(this.selectedDate);
        const startDate = new Date(endDate);

        startDate.setDate(startDate.getDate() - 6);

        return this.data.filter(item => {
            return (
                item.date >= this.formatDate(startDate) &&
                item.date <= this.formatDate(endDate)
            );
        });
    }

    getWeeklyData() {
        const result = [];

        for (let i = 4; i >= 0; i--) {
            const endDate = new Date(this.selectedDate);
            endDate.setDate(endDate.getDate() - (i * 4));

            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            const rows = this.getDataByRange(startDate, endDate);

            if (!rows.length) continue;

            result.push({
                date: this.formatDate(startDate),
                requests: this.sumRequests(rows),
                users: this.averageUsers(rows)
            });
        }

        return result;
    }

    // 선택 날짜가 속한 월까지 최근 6개월 집계
    getMonthlyData() {
        const result = [];

        for (let i = 2; i >= 0; i--) {
            const year = this.selectedDate.getFullYear();
            const month = this.selectedDate.getMonth() - i;

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            // 현재 선택한 월은 선택 날짜까지만 집계
            if (i === 0) {
                endDate.setTime(this.selectedDate.getTime());
            }

            const rows = this.getDataByRange(startDate, endDate);

            if (!rows.length) continue;

            result.push({
                date: this.formatMonth(startDate),
                requests: this.sumRequests(rows),
                users: this.averageUsers(rows)
            });
        }

        return result;
    }

    getDataByRange(startDate, endDate) {
        const start = this.formatDate(startDate);
        const end = this.formatDate(endDate);

        return this.data.filter(item => {
            return item.date >= start && item.date <= end;
        });
    }

    sumRequests(rows) {
        return rows.reduce((total, item) => {
            return total + item.requests;
        }, 0);
    }

    averageUsers(rows) {
        const total = rows.reduce((sum, item) => {
            return sum + item.users;
        }, 0);

        return Math.round(total / rows.length);
    }

    parseDate(value) {
        if (value instanceof Date) {
            return Number.isNaN(value.getTime())
                ? null
                : new Date(
                    value.getFullYear(),
                    value.getMonth(),
                    value.getDate()
                );
        }

        if (typeof value !== 'string') return null;

        const [year, month, day] = value.split('-').map(Number);

        const date = new Date(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    formatMonth(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        return `${year}-${month}`;
    }

    renderChart() {
        const canvas = this.el.querySelector('canvas');

        if (!canvas) return;

        const labels = this.filteredData.map(item => item.date);
        const requests = this.filteredData.map(item => item.requests);
        const users = this.filteredData.map(item => item.users);

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

    updateChart() {
        if (!this.chart) return;

        const labels = this.filteredData.map(item => item.date);
        const requests = this.filteredData.map(item => item.requests);
        const users = this.filteredData.map(item => item.users);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = requests;
        this.chart.data.datasets[1].data = users;

        this.chart.update();
    }
}


/* *********************************
 * Date Picker
 * ********************************* */

class DatePicker {
    constructor(selector, options = {}) {
        this.el = document.querySelector(selector);

        if (!this.el) return;

        this.input = this.el.querySelector('input[type="date"]');
        this.prevButton = this.el.querySelector('[data-date-nav="prev"]');
        this.nextButton = this.el.querySelector('[data-date-nav="next"]');

        if (!this.input || !this.prevButton || !this.nextButton) return;

        this.selectedDate = new Date();

        this.minDate = null;
        this.maxDate = new Date();

        this.onChange = options.onChange || null;

        this.init();
    }

    init() {
        this.updateInput();
        this.bindEvents();
    }

    bindEvents() {
        this.input.addEventListener('change', () => {
            if (!this.input.value) return;

            this.setDate(this.input.value);
        });

        this.prevButton.addEventListener('click', () => {
            this.changeDate(-1);
        });

        this.nextButton.addEventListener('click', () => {
            this.changeDate(1);
        });
    }

    setRange(minDate, maxDate) {
        const min = this.parseDate(minDate);
        const max = this.parseDate(maxDate);

        if (!min || !max || min > max) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allowedMax = max < today ? max : today;

        if (min > allowedMax) return;

        this.minDate = min;
        this.maxDate = allowedMax;

        if (this.selectedDate < this.minDate) {
            this.selectedDate = new Date(this.minDate);
        }

        if (this.selectedDate > this.maxDate) {
            this.selectedDate = new Date(this.maxDate);
        }

        this.updateInput();
        this.notifyChange();
    }

    setDate(date) {
        const selectedDate = this.parseDate(date);

        if (!selectedDate) {
            this.updateInput();
            return;
        }

        if (this.minDate && selectedDate < this.minDate) {
            this.updateInput();
            return;
        }

        if (selectedDate > this.maxDate) {
            this.updateInput();
            return;
        }

        this.selectedDate = selectedDate;

        this.updateInput();
        this.notifyChange();
    }

    changeDate(direction) {
        const date = new Date(this.selectedDate);

        date.setDate(date.getDate() + direction);

        this.setDate(date);
    }

    notifyChange() {
        if (typeof this.onChange === 'function') {
            this.onChange(new Date(this.selectedDate));
        }
    }

    parseDate(value) {
        if (value instanceof Date) {
            return Number.isNaN(value.getTime())
                ? null
                : new Date(
                    value.getFullYear(),
                    value.getMonth(),
                    value.getDate()
                );
        }

        if (typeof value !== 'string') return null;

        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    updateInput() {
        this.input.min = this.minDate
            ? this.formatDate(this.minDate)
            : '';

        this.input.max = this.formatDate(this.maxDate);
        this.input.value = this.formatDate(this.selectedDate);

        this.prevButton.disabled = this.minDate
            ? this.selectedDate <= this.minDate
            : false;

        this.nextButton.disabled =
            this.selectedDate >= this.maxDate;
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


const usageChart = new UsageChart('#usageChart', {
    dataUrl: '/sai/assets/data/usage.json'
});

new DatePicker('.js-date-picker', {
    onChange: (date) => {
        usageChart.setDate(date);
    }
});