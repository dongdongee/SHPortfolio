/* *********************************
 * Chart Defaults
 * ********************************* */

Chart.defaults.font.family = 'Poppins, Pretendard, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.font.weight = '600';
Chart.defaults.color = '#9699a2';


/* *********************************
 * KPI Chart
 * ********************************* */
const kpiColors = [
    [119, 61, 249],  // Purple
    [89, 152, 255],  // Blue
    [255, 164, 81],  // Orange
    [66, 214, 195]   // Mint
];
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

        this.trend = this.changeRate > 0
            ? 'up'
            : this.changeRate < 0
                ? 'down'
                : 'same';

        this.renderInfo();
    }

    renderInfo() {
        const valueEl = this.el.querySelector('.kpi-card__value');
        const changeEl = this.el.querySelector('.kpi-card__change');
        const compareEl = this.el.querySelector('.kpi-card__compare');

        if (valueEl) {
            valueEl.textContent = this.value.toLocaleString();
        }

        if (changeEl) {
            const arrow = this.trend === 'up'
                ? '↑'
                : this.trend === 'down'
                    ? '↓'
                    : '–';

            changeEl.textContent =
                `${arrow} ${Math.abs(this.changeRate).toFixed(1)}%`;

            changeEl.classList.remove('is-up', 'is-down', 'is-same');
            changeEl.classList.add(`is-${this.trend}`);
        }

        if (compareEl) {
            compareEl.textContent = this.compareText;
        }
    }

    renderChart() {
        const canvas = this.el.querySelector('.kpi-card__chart canvas');
        if (!canvas) return;

        const min = Math.min(...this.data);
        const max = Math.max(...this.data);

        const index = [...document.querySelectorAll('.kpi-card')]
    .indexOf(this.el);

const [r, g, b] = kpiColors[index % kpiColors.length];

const colors = this.data.map(value => {
    const ratio = max === min
        ? 1
        : (value - min) / (max - min);

    return `rgba(${r}, ${g}, ${b}, ${0.25 + ratio * 0.75})`;
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
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        display: false,
                        beginAtZero: true,
                        max
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
        data: [400, 242, 367, 800, 820, 898, 923]
    },
    {
        selector: '#kpiRequests',
        data: [20, 50, 54, 82, 88, 92, 98]
    },
    {
        selector: '#kpiProjects',
        data: [2, 2, 5, 8, 14, 4, 6]
    },
    {
        selector: '#kpiStatus',
        data: [89.2, 99.4, 79.3, 99.6, 99.7, 79.8, 99.9]
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
        this.selectedDate = this.parseDate(new Date());

        this.minDate = null;
        this.maxDate = this.formatDate(new Date());

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
                .filter(item =>
                    typeof item.date === 'string' &&
                    Number.isFinite(item.requests) &&
                    Number.isFinite(item.users)
                )
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
                    item.setAttribute(
                        'aria-pressed',
                        String(isActive)
                    );
                });
            });
        });
    }

    setPeriod(period) {
        if (!['day', 'week', 'month'].includes(period)) return;

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
        } else if (this.period === 'week') {
            this.filteredData = this.getWeeklyData();
        } else {
            this.filteredData = this.getMonthlyData();
        }
    }

    getDailyData() {
        const endDate = new Date(this.selectedDate);
        const startDate = new Date(endDate);

        startDate.setDate(startDate.getDate() - 6);

        return this.getDataByRange(startDate, endDate);
    }

    getWeeklyData() {
        const result = [];

        for (let i = 4; i >= 0; i--) {
            const endDate = new Date(this.selectedDate);
            endDate.setDate(endDate.getDate() - i * 7);

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

    getMonthlyData() {
        const result = [];

        for (let i = 2; i >= 0; i--) {
            const year = this.selectedDate.getFullYear();
            const month = this.selectedDate.getMonth() - i;

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

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

        return this.data.filter(item =>
            item.date >= start && item.date <= end
        );
    }

    sumRequests(rows) {
        return rows.reduce(
            (total, item) => total + item.requests,
            0
        );
    }

    averageUsers(rows) {
        const total = rows.reduce(
            (sum, item) => sum + item.users,
            0
        );

        return rows.length
            ? Math.round(total / rows.length)
            : 0;
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

        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Requests',
                        data: requests,
                        borderColor: '#773df9',
                        borderWidth: 2,
                        tension: 0.4,
                        backgroundColor: 'rgba(119, 61, 249, 0.08)',
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#773df9',
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: '#773df9',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Users',
                        data: users,
                        borderColor: '#b8a0fa',
                        borderWidth: 2,
                        tension: 0.4,
                        backgroundColor: 'rgba(184, 160, 250, 0.08)',
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#b8a0fa',
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: '#b8a0fa',
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
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 7,
                            boxHeight: 7,
                            padding: 16,
                            color: '#636363',
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxTicksLimit: 8 }
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

        this.chart.data.labels =
            this.filteredData.map(item => item.date);

        this.chart.data.datasets[0].data =
            this.filteredData.map(item => item.requests);

        this.chart.data.datasets[1].data =
            this.filteredData.map(item => item.users);

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
        if (!this.input) return;

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
    }

    setRange(minDate, maxDate) {
        const min = this.parseDate(minDate);
        const max = this.parseDate(maxDate);

        if (!min || !max || min > max) return;

        const today = this.parseDate(new Date());
        const allowedMax = max < today ? max : today;

        if (min > allowedMax) return;

        this.minDate = min;
        this.maxDate = allowedMax;
        this.selectedDate = new Date(this.maxDate);

        this.updateInput();
        this.notifyChange();
    }

    setDate(date) {
        const selectedDate = this.parseDate(date);

        if (
            !selectedDate ||
            (this.minDate && selectedDate < this.minDate) ||
            selectedDate > this.maxDate
        ) {
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
        if (!this.input) return;

        this.input.min = this.minDate
            ? this.formatDate(this.minDate)
            : '';

        this.input.max = this.formatDate(this.maxDate);
        this.input.value = this.formatDate(this.selectedDate);
    }
}


/* *********************************
 * Model Usage Chart
 * ********************************* */

class ModelUsageChart {
    constructor(selector, options = {}) {
        this.el = document.querySelector(selector);
        if (!this.el) return;

        this.canvas = this.el.querySelector('canvas');
        this.legend = this.el.querySelector('.model-usage__legend');
        this.totalEl = this.el.querySelector('.js-model-usage-total');
        this.labelEl = this.el.querySelector('.js-model-usage-label');
        this.select = this.el.querySelector('.js-model-usage-type');

        if (!this.canvas) {
            console.warn('ModelUsageChart: canvas not found');
            return;
        }

        this.dataUrl = options.dataUrl;
        this.data = [];
        this.rows = [];
        this.type = 'requests';
        this.selectedDate = null;
        this.chart = null;

        this.models = [
            {
                key: 'gemini',
                name: 'Gemini',
                color: '#773df9'
            },
            {
                key: 'gpt4o',
                name: 'GPT-4o',
                color: '#5998ff'
            },
            {
                key: 'claude',
                name: 'Claude',
                color: '#ffa451'
            },
            {
                key: 'midjourney',
                name: 'Midjourney',
                color: '#42d6c3'
            },
            {
                key: 'dalle',
                name: 'DALL·E',
                color: '#b8a0fa'
            }
        ];

        this.renderChart();
        this.bindEvents();
        this.ready = this.loadData();
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
                throw new Error('Invalid model usage data format');
            }

            this.data = rows
                .filter(item => typeof item.date === 'string')
                .sort((a, b) => a.date.localeCompare(b.date));

            if (!this.data.length) {
                console.warn('ModelUsageChart: no data');
                return;
            }

            const today = this.formatDate(new Date());
            const latestDate = this.data[this.data.length - 1].date;

            this.setDate(
                this.selectedDate ||
                (today < latestDate ? today : latestDate)
            );

        } catch (error) {
            console.error('Model usage data load failed:', error);
        }
    }

    bindEvents() {
        if (!this.select) return;

        this.select.addEventListener('change', () => {
            if (!['requests', 'tokens'].includes(this.select.value)) {
                return;
            }

            this.type = this.select.value;
            this.update();
        });
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    setDate(date) {
        if (!date) return;

        const selectedDate = date instanceof Date
            ? this.formatDate(date)
            : date;

        this.selectedDate = selectedDate;

        this.rows = this.data.filter(item =>
            item.date === selectedDate
        );

        this.update();
    }

    getValues() {
        return this.models.map(model => {
            return this.rows.reduce((sum, row) => {
                const value = row.models?.[model.key]?.[this.type];

                return sum + (
                    Number.isFinite(value) ? value : 0
                );
            }, 0);
        });
    }

    renderChart() {
        this.chart = new Chart(this.canvas, {
            type: 'doughnut',
            data: {
                labels: this.models.map(model => model.name),
                datasets: [{
                    data: this.models.map(() => 0),
                    backgroundColor: this.models.map(model => model.color),
                    borderWidth: 0,
                    hoverOffset: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                return `${context.label}: ${context.parsed.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    update() {
        const values = this.getValues();

        const total = values.reduce(
            (sum, value) => sum + value,
            0
        );

        if (this.chart) {
            this.chart.data.datasets[0].data = values;
            this.chart.update();
        }

        if (this.totalEl) {
            this.totalEl.textContent = total.toLocaleString();
        }

        if (this.labelEl) {
            this.labelEl.textContent = this.type === 'requests'
                ? 'Total Requests'
                : 'Total Tokens';
        }

        if (!this.legend) return;

        this.legend.replaceChildren();

        const labels = this.chart.data.labels;

        this.models.forEach((model, index) => {
            const item = document.createElement('li');
            item.className = 'model-usage__item';

            const name = document.createElement('span');
            name.className = 'model-usage__name';

            const swatch = document.createElement('i');
            swatch.className = 'model-usage__color';
            swatch.style.backgroundColor = model.color;

            name.append(
                swatch,
                document.createTextNode(labels[index])
            );

            const value = document.createElement('strong');
            value.className = 'model-usage__value';
            value.textContent = values[index].toLocaleString();

            const percent = document.createElement('span');
            percent.className = 'model-usage__percent';

            percent.textContent = total
                ? `${(values[index] / total * 100).toFixed(1)}%`
                : '0.0%';

            item.append(name, value, percent);
            this.legend.append(item);
        });
    }
}

/* *********************************
 * Weekly Token Budget
 * ********************************* */

function calculateWeeklyTokenBudget(data, latest, weeks = 8) {
    const [year, month, day] = latest.split('-').map(Number);

    const latestDate = new Date(year, month - 1, day);

    const weeklyTotals = [];

    // 현재 주간을 제외한 직전 8주
    for (let i = 1; i <= weeks; i++) {
        const endDate = new Date(latestDate);
        endDate.setDate(endDate.getDate() - (i * 7));

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const formatDate = date => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        };

        const start = formatDate(startDate);
        const end = formatDate(endDate);

        const rows = data.filter(row =>
            row.date >= start && row.date <= end
        );

        // 7일치 데이터가 모두 있는 주간만 사용
        if (rows.length !== 7) continue;

        const total = rows.reduce((sum, row) => {
            const tokens = Object.values(row.models || {})
                .reduce((modelSum, model) => {
                    return modelSum + (Number(model?.tokens) || 0);
                }, 0);

            return sum + tokens;
        }, 0);

        weeklyTotals.push(total);
    }

    if (!weeklyTotals.length) return 0;

    // 과거 8주 중 최대 사용량
    const maxWeeklyTokens = Math.max(...weeklyTotals);

    // 최대 사용량에 20% 여유 추가
    const budget = maxWeeklyTokens * 1.2;

    // 100만 단위 올림
    return Math.ceil(budget / 1_000_000) * 1_000_000;
}


/* *********************************
 * Overview
 * ********************************* */

async function initOverview() {
    const root = document.querySelector('.js-ai-usage-overview');

    const hasKpi = document.querySelector(
        '#kpiUsers, #kpiRequests'
    );

    if (!root && !hasKpi) return;

    try {
        const response = await fetch(
            '/sai/assets/data/usage.json'
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        const rows = Array.isArray(json)
            ? json
            : json.daily;

        if (!Array.isArray(rows)) {
            throw new Error('Invalid usage data format');
        }

        const data = rows
            .filter(row => typeof row.date === 'string')
            .sort((a, b) => a.date.localeCompare(b.date));

        if (!data.length) return;

        // JSON에 기록된 최신 날짜
        const latest = data[data.length - 1].date;

        // 최신 날짜 포함 최근 7일
        const [year, month, day] = latest
            .split('-')
            .map(Number);

        const fromDate = new Date(
            year,
            month - 1,
            day - 6
        );

        const from = [
            fromDate.getFullYear(),
            String(fromDate.getMonth() + 1).padStart(2, '0'),
            String(fromDate.getDate()).padStart(2, '0')
        ].join('-');

        const week = data.filter(row =>
            row.date >= from &&
            row.date <= latest
        );


        /* *********************************
         * Overview KPI
         * ********************************* */

        const overviewKpis = [
            {
                selector: '#kpiUsers',
                key: 'users'
            },
            {
                selector: '#kpiRequests',
                key: 'requests'
            }
        ];

        overviewKpis.forEach(item => {
            const values = week.map(row => row[item.key]);

            if (
                values.length &&
                values.every(Number.isFinite)
            ) {
                new KpiChart(item.selector, {
                    data: values,
                    compareText: 'vs 7 days ago'
                });
            }
        });

        if (!root) return;


        /* *********************************
         * Weekly Token Data
         * ********************************* */

        const keys = [
            'gpt4o',
            'claude',
            'gemini',
            'midjourney'
        ];

        const totals = Object.fromEntries(
            keys.map(key => [key, 0])
        );

        let tokenTotal = 0;

        // 최신 날짜를 포함한 최근 7일 토큰 합산
        week.forEach(row => {
            Object.entries(row.models || {}).forEach(
                ([key, model]) => {
                    const tokens = Number(model?.tokens) || 0;

                    tokenTotal += tokens;

                    if (Object.prototype.hasOwnProperty.call(totals, key)) {
                        totals[key] += tokens;
                    }
                }
            );
        });


        /* *********************************
         * Token Usage
         * ********************************* */

        // HTML의 data-token-quota 값을 사용
        // 주간 예산은 별도로 산정한 뒤 HTML에서 설정
        const quota = calculateWeeklyTokenBudget(data, latest);

        const percentage = quota > 0
            ? (tokenTotal / quota) * 100
            : 0;

        const currentEl = root.querySelector(
            '.sai-card__value--current'
        );

        const quotaEl = root.querySelector(
            '.sai-card__value--total'
        );

        const progressEl = root.querySelector(
            '.sai-progress__main .sai-progress__bar'
        );

        const percentEl = root.querySelector(
            '.sai-progress__text'
        );

        if (currentEl) {
            currentEl.textContent = tokenTotal.toLocaleString();
        }

        if (quotaEl) {
            quotaEl.textContent = quota.toLocaleString();
        }

        if (progressEl) {
            progressEl.style.setProperty(
                '--progress',
                `${Math.min(percentage, 100).toFixed(1)}%`
            );
        }

        if (percentEl) {
            percentEl.textContent = `${percentage.toFixed(1)}%`;
        }


        /* *********************************
         * Model Usage
         * ********************************* */

        Object.entries(totals).forEach(([key, tokens]) => {
            const bar = root.querySelector(
                `[data-model="${key}"] .sai-progress__bar`
            );

            if (!bar) return;

            const percent = tokenTotal
                ? (tokens / tokenTotal) * 100
                : 0;

            bar.style.setProperty(
                '--progress',
                `${percent.toFixed(1)}%`
            );
        });

    } catch (error) {
        console.error(
            'Overview usage data load failed:',
            error
        );
    }
}


/* *********************************
 * Init
 * ********************************* */

// Projects / Status는 기존 예시 데이터 사용
kpiData
    .filter(item =>
        ['#kpiProjects', '#kpiStatus'].includes(item.selector)
    )
    .forEach(item => {
        new KpiChart(item.selector, {
            data: item.data
        });
    });

// Overview 데이터 로드
initOverview();

// Analytics Usage Chart
const usageChart = new UsageChart('#usageChart', {
    dataUrl: '/sai/assets/data/usage.json'
});

// Analytics Model Usage Chart
const modelUsageChart = new ModelUsageChart('#modelUsageChart', {
    dataUrl: '/sai/assets/data/usage.json'
});

// Analytics Date Picker
const datePicker = new DatePicker('.js-date-picker', {
    onChange: date => {
        usageChart?.setDate(date);
        modelUsageChart?.setDate(date);
    }
});

// 데이터 로드 후 날짜 범위 설정
usageChart?.ready?.then(() => {
    if (!usageChart.data.length || !datePicker?.input) {
        return;
    }

    datePicker.setRange(
        usageChart.minDate,
        usageChart.maxDate
    );
});