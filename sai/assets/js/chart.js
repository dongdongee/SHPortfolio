/* ========================================
   Chart Theme
======================================== */

function getChartTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';


    return {
        isDark,

        primary:
            isDark
                ? '#9b7cff'
                : '#773df9',

        primaryFill:
            isDark
                ? 'rgba(155, 124, 255, 0.14)'
                : 'rgba(119, 61, 249, 0.08)',

        textPrimary:
            isDark
                ? '#f5f7fb'
                : '#202126',

        textSecondary:
            isDark
                ? '#b8c0d0'
                : '#686b73',

        textTertiary:
            isDark
                ? '#7f8aa3'
                : '#98a2b3',

        grid:
            isDark
                ? 'rgba(127, 138, 163, 0.14)'
                : 'rgba(152, 162, 179, 0.16)',

        pointBackground:
            isDark
                ? '#151c2d'
                : '#ffffff',

        doughnut:
            isDark
                ? [
                    '#9b7cff',
                    '#b39aff',
                    '#c9b8ff',
                    '#ded5ff',
                    '#f0ecff'
                ]
                : [
                    '#773df9',
                    '#9b72fa',
                    '#b69afb',
                    '#d2c4fd',
                    '#ece7ff'
                ]
    };
}


/* *********************************
 * KPI
 * ********************************* */

class Kpi {
    constructor() {
        this.container = document.querySelector('.sai-kpi');
        this.primaryColor = '#8b5cf6';

        this.data = [
            {
                id: 'users',
                title: 'Total Users',
                value: '12,728',
                change: '12.4%',
                period: 'vs last 7 days',
                type: 'line',
                chartData: [42, 48, 46, 54, 51, 61, 58, 70]
            },
            {
                id: 'requests',
                title: 'AI Requests',
                value: '98,346',
                change: '18.7%',
                period: 'vs last 7 days',
                type: 'line',
                chartData: [52, 59, 57, 64, 61, 73, 68, 79]
            },
            {
                id: 'projects',
                title: 'Projects',
                value: '2,156',
                change: '8.1%',
                period: 'vs last 7 days',
                type: 'line',
                chartData: [38, 44, 42, 53, 49, 46, 57, 55, 66]
            },
            {
                id: 'status',
                title: 'System Status',
                value: '99.9%',
                change: '0.1%',
                period: 'vs last 7 days',
                type: 'bar',
                chartData: [6, 9, 12, 8, 14, 10, 16, 11, 15]
            }
        ];

        if (!this.container) return;

        this.init();
    }

    init() {
        this.render();
        this.createCharts();
    }

    render() {
        this.container.innerHTML = this.data
            .map((item) => `
                <article class="sai-kpi__card">
                    <div class="sai-kpi__content">
                        <span class="sai-kpi__title">
                            ${item.title}
                        </span>

                        <strong class="sai-kpi__value">
                            ${item.value}
                        </strong>

                        <p class="sai-kpi__change">
                            <span>↑ ${item.change}</span>
                            ${item.period}
                        </p>
                    </div>

                    <div class="sai-kpi__chart">
                        <canvas id="${item.id}Chart"></canvas>
                    </div>
                </article>
            `)
            .join('');
    }

    createCharts() {
        this.data.forEach((item) => {
            const canvas = document.querySelector(`#${item.id}Chart`);

            if (!canvas) return;

            if (item.type === 'bar') {
                this.createBarChart(canvas, item.chartData);
                return;
            }

            this.createLineChart(canvas, item.chartData);
        });
    }

    createLineChart(canvas, data) {
        new Chart(canvas, {
            type: 'line',

            data: {
                labels: data.map((_, index) => index + 1),

                datasets: [{
                    data,
                    borderColor: this.primaryColor,
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false
                }]
            },

            options: this.getOptions()
        });
    }

    createBarChart(canvas, data) {
        new Chart(canvas, {
            type: 'bar',

            data: {
                labels: data.map((_, index) => index + 1),

                datasets: [{
                    data,
                    backgroundColor: this.primaryColor,
                    borderRadius: 2,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    categoryPercentage: 1
                }]
            },

            options: this.getOptions()
        });
    }

    getOptions() {
        return {
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
                    beginAtZero: true
                }
            }
        };
    }
}






/* *********************************
 * KPI
 * ********************************* */
class SystemStatus {
    constructor() {
        this.container = document.querySelector('.sai-system');

        this.data = [
            {
                id: 'ai-service',
                title: 'AI Service',
                status: 'outage',
                chartData: [8, 10, 9, 12, 10, 13, 11, 12]
            },
            {
                id: 'database',
                title: 'Database',
                status: 'operational',
                chartData: [10, 12, 11, 14, 12, 15, 13, 16]
            },
            {
                id: 'storage',
                title: 'Storage',
                status: 'operational',
                chartData: [9, 11, 10, 13, 11, 14, 12, 13]
            },
            {
                id: 'api-gateway',
                title: 'API Gateway',
                status: 'outage',
                chartData: [12, 10, 13, 9, 12, 11, 14, 10]
            },
            {
                id: 'web-application',
                title: 'Web Application',
                status: 'operational',
                chartData: [10, 11, 10, 13, 11, 14, 12, 15]
            }
        ];

        if (!this.container) return;

        this.init();
    }

    init() {
        this.render();
        this.createCharts();
    }

    render() {
        this.container.innerHTML = this.data
            .map((item) => {
                const isOperational = item.status === 'operational';

                const statusText = isOperational
                    ? 'Operational'
                    : 'Non-operational';

                const markClass = isOperational
                    ? 'sai-mark--green'
                    : 'sai-mark--red';
                    
                const txtClass = isOperational
                    ? 'operating'
                    : 'non-operating';

                return `
                    <li class="sai-content-card__item">
                        <span class="sai-mark sai-mark--sm ${markClass}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-circle-check"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                        </span>

                        <span class="sai-content-card__info">
                            ${item.title}
                        </span>

                        <span class="sai-content-card__status ${txtClass}">
                            ${statusText}
                        </span>

                        <div class="sai-content-card__chart">
                            <canvas id="${item.id}-chart"></canvas>
                        </div>
                    </li>
                `;
            })
            .join('');
    }

    createCharts() {
        this.data.forEach((item) => {
            const canvas = this.container.querySelector(
                `#${item.id}-chart`
            );

            if (!canvas) return;

            this.createLineChart(
                canvas,
                item.chartData,
                item.status
            );
        });
    }

    createLineChart(canvas, data, status) {
        const color = status === 'operational'
            ? '#22c55e'
            : '#ef4444';

        new Chart(canvas, {
            type: 'line',

            data: {
                labels: data.map((_, index) => index + 1),

                datasets: [{
                    data,
                    borderColor: color,
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false
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
                }
            }
        });
    }
}


/* ========================================
   Doughnut Center Text Plugin
======================================== */
const centerTextPlugin = {
    id: 'centerText',

    afterDraw(chart) {
        const options =
            chart.options.plugins.centerText;

        if (!options?.display) return;


        const { ctx } = chart;

        const meta =
            chart.getDatasetMeta(0);

        const element =
            meta.data[0];

        if (!element) return;


        const theme =
            getChartTheme();


        const x =
            element.x;

        const y =
            element.y;


        ctx.save();


        /* =========================
           Total Number
        ========================= */

        ctx.font =
            '700 24px Inter';

        ctx.fillStyle =
            theme.textPrimary;

        ctx.textAlign =
            'center';

        ctx.textBaseline =
            'middle';


        ctx.fillText(
            options.text,
            x,
            y - 9
        );


        /* =========================
           Total Requests
        ========================= */

        ctx.font =
            '400 12px Inter';

        ctx.fillStyle =
            theme.textTertiary;


        ctx.fillText(
            options.label,
            x,
            y + 15
        );


        ctx.restore();
    }
};


Chart.register(centerTextPlugin);


/* ========================================
   Dashboard Chart
======================================== */

class DashboardChart {
    constructor() {
        this.requestCanvas =
            document.querySelector('#requestChart');

        this.modelCanvas =
            document.querySelector('#modelChart');

        this.periodSelect =
            document.querySelector('#periodSelect');

        this.modelPeriodSelect =
            document.querySelector('#modelPeriodSelect');

        this.requestTotal =
            document.querySelector('#requestTotal');

        // AI Requests 증감률
        this.requestChange =
            document.querySelector('#requestChange');


        this.requestChart = null;
        this.modelChart = null;

        this.primaryColor = '#8b5cf6';


        /* =========================
           Request Data
        ========================= */

        this.requestData = {
            daily: [
                18340,
                16200,
                19500,
                21300,
                18700,
                22600,
                28560
            ],

            weekly: [
                98200,
                115400,
                108600,
                132800
            ],

            monthly: [
                382000,
                415000,
                398000,
                462000,
                518000,
                547000
            ]
        };


        /* =========================
           Previous Request Data
        ========================= */

        this.previousRequestData = {
            daily: [
                15200,
                16800,
                17100,
                18500,
                19200,
                20100,
                21300
            ],

            weekly: [
                86400,
                102300,
                97800,
                112500
            ],

            monthly: [
                351000,
                368000,
                382000,
                401000,
                438000,
                472000
            ]
        };


        /* =========================
           Model Data
        ========================= */
        this.modelData = {
            7: {
                data: [
                    51238,
                    23996,
                    15342,
                    6196,
                    1574
                ]
            },

            30: {
                data: [
                    202241,
                    111295,
                    68106,
                    25332,
                    8306
                ]
            },

            90: {
                data: [
                    573126,
                    352116,
                    213517,
                    81162,
                    28719
                ]
            }
        };


        this.currentModelPeriod = '7';


        if (
            !this.requestCanvas &&
            !this.modelCanvas
        ) return;


        this.init();
    }


    /* ========================================
       Init
    ======================================== */

    init() {
        this.createRequestChart();
        this.createModelChart();

        this.updateRequestTotal('daily');

        this.bindEvents();
    }


    /* ========================================
       Events
    ======================================== */

    bindEvents() {
        this.periodSelect?.addEventListener(
            'change',
            (e) => {
                this.updateRequestChart(
                    e.target.value
                );
            }
        );


        this.modelPeriodSelect?.addEventListener(
            'change',
            (e) => {
                this.updateModelChart(
                    e.target.value
                );
            }
        );


        const themeObserver =
            new MutationObserver(
                (mutations) => {
                    const themeChanged =
                        mutations.some(
                            (mutation) =>
                                mutation.attributeName ===
                                'data-theme'
                        );


                    if (!themeChanged) return;


                    this.updateChartTheme();
                }
            );


        themeObserver.observe(
            document.documentElement,
            {
                attributes: true,

                attributeFilter: [
                    'data-theme'
                ]
            }
        );
    }


    /* ========================================
       Total Requests + Change
    ======================================== */

    updateRequestTotal(period) {
        const currentData =
            this.requestData[period];

        const previousData =
            this.previousRequestData[period];

        if (!currentData) return;


        /* 현재 기간 합계 */

        const currentTotal = currentData.reduce(
            (sum, value) => sum + value,
            0
        );


        /* 총 Requests 출력 */

        if (this.requestTotal) {
            this.requestTotal.textContent =
                currentTotal.toLocaleString();
        }


        /* 이전 기간 데이터가 없으면 종료 */

        if (
            !previousData ||
            !this.requestChange
        ) return;


        /* 이전 기간 합계 */

        const previousTotal = previousData.reduce(
            (sum, value) => sum + value,
            0
        );


        /* 증감률 계산 */

        const change =
            previousTotal === 0
                ? 0
                : (
                    (currentTotal - previousTotal) /
                    previousTotal
                ) * 100;


        const isIncrease = change >= 0;


        /* 증감률 출력 */

        this.requestChange.textContent =
            `${isIncrease ? '↑' : '↓'} ${Math.abs(change).toFixed(1)} vs last 7 days`;


        /* 상태 클래스 */

        this.requestChange.classList.toggle(
            'is-increase',
            isIncrease
        );

        this.requestChange.classList.toggle(
            'is-decrease',
            !isIncrease
        );
    }


    /* ========================================
       Labels
    ======================================== */

    getLabels(period) {
        const today = new Date();


        /* Daily - 최근 7일 */

        if (period === 'daily') {
            return Array.from(
                { length: 7 },
                (_, index) => {

                    const date = new Date(today);

                    date.setDate(
                        today.getDate() -
                        (6 - index)
                    );


                    return date.toLocaleDateString(
                        'en-US',
                        {
                            month: 'short',
                            day: 'numeric'
                        }
                    );
                }
            );
        }


        /* Weekly - 최근 4주 */

        if (period === 'weekly') {
            return Array.from(
                { length: 4 },
                (_, index) => {

                    const date = new Date(today);

                    date.setDate(
                        today.getDate() -
                        ((3 - index) * 7)
                    );


                    return date.toLocaleDateString(
                        'en-US',
                        {
                            month: 'short',
                            day: 'numeric'
                        }
                    );
                }
            );
        }


        /* Monthly - 최근 6개월 */

        if (period === 'monthly') {
            return Array.from(
                { length: 6 },
                (_, index) => {

                    const date = new Date(
                        today.getFullYear(),
                        today.getMonth() -
                        (5 - index),
                        1
                    );


                    return date.toLocaleDateString(
                        'en-US',
                        {
                            month: 'short'
                        }
                    );
                }
            );
        }


        return [];
    }


    /* ========================================
       Request Line Chart
    ======================================== */

    createRequestChart() {
    if (!this.requestCanvas) return;


    const theme =
        getChartTheme();


    this.requestChart = new Chart(
        this.requestCanvas,
        {
            type: 'line',


            data: {
                labels:
                    this.getLabels('daily'),


                datasets: [{
                    data:
                        this.requestData.daily,


                    borderColor:
                        theme.primary,

                    backgroundColor:
                        theme.primaryFill,


                    borderWidth: 2,

                    tension: 0.4,


                    /* 꼭지점 항상 노출 */

                    pointRadius: 3,

                    pointHoverRadius: 5,

                    pointBackgroundColor:
                        theme.pointBackground,

                    pointBorderColor:
                        theme.primary,

                    pointBorderWidth: 2,


                    fill: true
                }]
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
                        display: false
                    },

                    tooltip: {
                        enabled: false,

                        external:
                            externalChartTooltip
                    }
                },


                scales: {
                    x: {
                        grid: {
                            display: false
                        },

                        ticks: {
                            color:
                                theme.textTertiary
                        }
                    },


                    y: {
                        beginAtZero: true,

                        grid: {
                            color:
                                theme.grid
                        },

                        ticks: {
                            color:
                                theme.textTertiary,

                            callback: (value) => {
                                return value >= 1000
                                    ? `${value / 1000}K`
                                    : value;
                            }
                        }
                    }
                }
            }
        }
    );
}


    /* ========================================
       Model Doughnut Chart
    ======================================== */
    createModelChart() {
        if (!this.modelCanvas) return;

        const model =
            this.modelData[this.currentModelPeriod];

        const total =
            model.data.reduce(
                (sum, value) => sum + value,
                0
            );


        this.modelChart = new Chart(
            this.modelCanvas,
            {
                type: 'doughnut',

                data: {
                    labels: [
                        'SAI GPT-4o',
                        'SAI Claude 3.5',
                        'SAI Gemini 1.5',
                        'SAI Vision',
                        'Other'
                    ],

                    datasets: [{
                        data: model.data,

                        backgroundColor: [
                            '#8b5cf6',
                            '#a78bfa',
                            '#c4b5fd',
                            '#ddd6fe',
                            '#ede9fe'
                        ],

                        borderWidth: 0,

                        hoverOffset: 8
                    }]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: '70%',

                    plugins: {
                        centerText: {
                            display: true,

                            text:
                                total.toLocaleString(),

                            label:
                                'Total Requests'
                        },


                        legend: {
                            position: 'right',

                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 8,
                                boxHeight: 8,
                                padding: 16
                            },


                            /* =========================
                            Legend Click
                            ========================= */

                            onClick: (
                                event,
                                legendItem,
                                legend
                            ) => {
                                const chart =
                                    legend.chart;

                                const index =
                                    legendItem.index;


                                /* 해당 도넛 숨김 / 표시 */

                                chart.toggleDataVisibility(
                                    index
                                );


                                /* 현재 보이는 데이터만 합계 */

                                const visibleTotal =
                                    chart
                                        .data
                                        .datasets[0]
                                        .data
                                        .reduce(
                                            (
                                                sum,
                                                value,
                                                dataIndex
                                            ) => {
                                                return chart.getDataVisibility(
                                                    dataIndex
                                                )
                                                    ? sum + value
                                                    : sum;
                                            },

                                            0
                                        );


                                /* 가운데 Total 변경 */

                                const currentTotal =
                                    Number(
                                        String(
                                            chart.options.plugins.centerText.text
                                        ).replaceAll(',', '')
                                    );


                                animateCenterTotal(
                                    chart,
                                    currentTotal,
                                    visibleTotal
                                );


                                chart.update();
                            },


                            /* =========================
                            Legend Hover
                            ========================= */

                            onHover: (
                                event,
                                legendItem,
                                legend
                            ) => {
                                const chart =
                                    legend.chart;

    chart.canvas.style.cursor =
        'pointer';
                                const index =
                                    legendItem.index;


                                /* 숨겨진 항목이면 hover 안 함 */

                                if (
                                    !chart.getDataVisibility(
                                        index
                                    )
                                ) {
                                    return;
                                }


                                const meta =
                                    chart.getDatasetMeta(0);

                                const arc =
                                    meta.data[index];


                                if (!arc) return;


                                /* 실제 도넛 hover 효과 */

                                chart.setActiveElements([
                                    {
                                        datasetIndex: 0,
                                        index
                                    }
                                ]);


                                /* 해당 arc 기준 tooltip 위치 */

                                const position =
                                    arc.tooltipPosition();


                                chart.tooltip.setActiveElements(
                                    [
                                        {
                                            datasetIndex: 0,
                                            index
                                        }
                                    ],

                                    position
                                );


                                chart.update('none');
                            },


                            /* =========================
                            Legend Leave
                            ========================= */

                            onLeave: (
                                event,
                                legendItem,
                                legend
                            ) => {
                                const chart =
                                    legend.chart;


                                chart.setActiveElements([]);


                                chart.tooltip.setActiveElements(
                                    [],

                                    {
                                        x: 0,
                                        y: 0
                                    }
                                );


                                chart.update('none');
                            }
                        },


                        tooltip: {
                            enabled: false,

                            external:
                                externalChartTooltip
                        }
                    }
                }
            }
        );


        /* External Tooltip에서 사용 */

        this.modelChart.$modelData =
            this.modelData;

        this.modelChart.$currentModelPeriod =
            this.currentModelPeriod;
    }

    /* ========================================
       Update Request Chart
    ======================================== */

    updateRequestChart(period) {
        if (!this.requestChart) return;


        const data =
            this.requestData[period];

        if (!data) return;


        this.requestChart.data.labels =
            this.getLabels(period);


        this.requestChart
            .data
            .datasets[0]
            .data = data;


        this.requestChart.update();


        // Total + 증감률 같이 업데이트
        this.updateRequestTotal(period);
    }


    /* ========================================
       Update Model Chart
    ======================================== */
    updateModelChart(period) {
        if (!this.modelChart) return;


        const model =
            this.modelData[period];

        if (!model) return;


        this.currentModelPeriod =
            period;


        this.modelChart.$currentModelPeriod =
            period;


        this.modelChart
            .data
            .datasets[0]
            .data =
                model.data;


        /* 기간 변경 시 숨겨둔 모델 다시 표시 */

        model.data.forEach(
            (_, index) => {
                this.modelChart.setDataVisibility(
                    index,
                    true
                );
            }
        );


        /* 전체 합계 */

        const total =
            model.data.reduce(
                (sum, value) =>
                    sum + value,

                0
            );


        this.modelChart
            .options
            .plugins
            .centerText
            .text =
                total.toLocaleString();


        this.modelChart.update();
    }

    /* ========================================
    Update Chart Theme
    ======================================== */

    updateChartTheme() {
        const theme =
            getChartTheme();


        /* =========================
        Request Chart
        ========================= */

        if (this.requestChart) {
            const dataset =
                this.requestChart
                    .data
                    .datasets[0];


            dataset.borderColor =
                theme.primary;

            dataset.backgroundColor =
                theme.primaryFill;

            dataset.pointBackgroundColor =
                theme.pointBackground;

            dataset.pointBorderColor =
                theme.primary;


            this.requestChart
                .options
                .scales
                .x
                .ticks
                .color =
                    theme.textTertiary;


            this.requestChart
                .options
                .scales
                .y
                .ticks
                .color =
                    theme.textTertiary;


            this.requestChart
                .options
                .scales
                .y
                .grid
                .color =
                    theme.grid;


            this.requestChart.update(
                'none'
            );
        }


        /* =========================
        Doughnut
        ========================= */

        if (this.modelChart) {
            this.modelChart
                .data
                .datasets[0]
                .backgroundColor =
                    theme.doughnut;


            /* 오른쪽 Legend 글자 */

            this.modelChart
                .options
                .plugins
                .legend
                .labels
                .color =
                    theme.textSecondary;


            /*
                update()가 실행되면
                centerTextPlugin도 다시 그려지기 때문에

                중앙 Total / Total Requests 색도
                getChartTheme() 기준으로 바뀜
            */

            this.modelChart.update(
                'none'
            );
        }
    }
}

function animateCenterTotal(
    chart,
    from,
    to,
    duration = 350
) {
    const startTime =
        performance.now();


    function animate(currentTime) {
        const elapsed =
            currentTime - startTime;


        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        /*
            easeOutCubic

            처음엔 빠르게,
            끝으로 갈수록 천천히
        */
        const ease =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const value =
            Math.round(
                from +
                (to - from) * ease
            );


        chart.options
            .plugins
            .centerText
            .text =
                value.toLocaleString();


        /*
            데이터 재계산 없이
            화면만 다시 그림
        */
        chart.draw();


        if (progress < 1) {
            requestAnimationFrame(
                animate
            );
        }
    }


    requestAnimationFrame(
        animate
    );
}


function externalChartTooltip(context) {
    const {
        chart,
        tooltip
    } = context;


    /* =========================
       Tooltip Element
    ========================= */

    let tooltipEl =
        document.querySelector(
            '.sai-chart-tooltip'
        );


    if (!tooltipEl) {
        tooltipEl =
            document.createElement('div');


        tooltipEl.className =
            'sai-chart-tooltip';


        document.body.appendChild(
            tooltipEl
        );
    }


    /* =========================
       Hide
    ========================= */

    if (
        tooltip.opacity === 0 ||
        !tooltip.dataPoints?.length
    ) {
        tooltipEl.style.opacity = 0;

        return;
    }


    /* =========================
       Current Item
    ========================= */

    const item =
        tooltip.dataPoints[0];


    const label =
        item.label;


    /*
        차트 종류 확인

        line
        doughnut
    */

    const type =
        chart.config.type;


    let valueHTML = '';


    /* =========================
       Request Chart
    ========================= */

    if (type === 'line') {
        const value =
            Number(item.raw);


        valueHTML = `
            <div class="sai-chart-tooltip__title">
                ${label}
            </div>

            <div class="sai-chart-tooltip__content">
                <strong>
                    ${value.toLocaleString()}
                </strong>

                <span>
                    requests
                </span>
            </div>
        `;
    }


    /* =========================
       Model Doughnut Chart
    ========================= */

    if (type === 'doughnut') {
    const requests =
        Number(item.raw);


    const visibleTotal =
        chart
            .data
            .datasets[0]
            .data
            .reduce(
                (
                    sum,
                    value,
                    index
                ) => {
                    return chart.getDataVisibility(
                        index
                    )
                        ? sum + value
                        : sum;
                },

                0
            );


    const percent =
        visibleTotal === 0
            ? 0
            : (
                requests /
                visibleTotal
            ) * 100;


    valueHTML = `
        <div class="sai-chart-tooltip__title">
            ${label}
        </div>

        <div class="sai-chart-tooltip__content">
            <strong>
                ${percent.toFixed(1)}%
            </strong>

            <span>
                ${requests.toLocaleString()} requests
            </span>
        </div>
    `;
}

    tooltipEl.innerHTML =
        valueHTML;


    /* =========================
       Position
    ========================= */

    const rect =
        chart.canvas.getBoundingClientRect();


    const left =
        rect.left +
        tooltip.caretX;


    const top =
        rect.top +
        tooltip.caretY;


    tooltipEl.style.left =
        `${left}px`;


    tooltipEl.style.top =
        `${top}px`;


    tooltipEl.style.opacity = 1;
}
/* *********************************
 * INIT
 * ********************************* */

new SystemStatus();
new Kpi();
new DashboardChart();