(() => {
    window.SAI = window.SAI || {};

    class AiUsageChart {
        constructor({
            chartSelector = '.js-ai-usage-chart',
            periodSelector = '.js-ai-usage-period',
        } = {}) {
            this.elChart = document.querySelector(chartSelector);
            this.elPeriod = document.querySelector(periodSelector);

            this.chart = null;
            this.resizeObserver = null;
            this.themeObserver = null;

            this.handlePeriodChange =
                this.handlePeriodChange.bind(this);

            this.init();
        }

        init() {
            if (!this.elChart) return;

            this.initChart();
            this.bindEvents();
            this.observeResize();
            this.observeTheme();
        }

        initChart() {
            const existingChart =
                echarts.getInstanceByDom(this.elChart);

            this.chart =
                existingChart ||
                echarts.init(this.elChart);

            const period = Number(
                this.elPeriod?.value || 7,
            );

            this.render(period);
        }

        bindEvents() {
            this.elPeriod?.addEventListener(
                'change',
                this.handlePeriodChange,
            );
        }

        handlePeriodChange() {
            const period = Number(this.elPeriod.value);

            this.render(period);
        }

        render(days) {
            if (!this.chart) return;

            const data = this.createUsageData(days);
            const theme = this.getThemeTokens();

            this.chart.setOption(
                this.createOption(data, theme),
                {
                    notMerge: true,
                    lazyUpdate: false,
                },
            );
        }

        createUsageData(days) {
            const result = [];
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            for (
                let index = days - 1;
                index >= 0;
                index -= 1
            ) {
                const date = new Date(today);

                date.setDate(today.getDate() - index);

                /*
                 * 현재는 포트폴리오용 샘플 데이터다.
                 * 실제 API 연동 시 아래 값만 서버 응답으로 교체하면 된다.
                 */
                const progression = days - index;
                const messages =
                    650 +
                    progression * 80 +
                    Math.round(Math.random() * 380);

                const tokens =
                    180000 +
                    progression * 24000 +
                    Math.round(Math.random() * 90000);

                const cost = Number(
                    (
                        18 +
                        progression * 2.7 +
                        Math.random() * 9
                    ).toFixed(2),
                );

                result.push({
                    date: date.getTime(),
                    messages,
                    tokens,
                    cost,
                });
            }

            return result;
        }

        createOption(data, theme) {
            return {
                animationDuration: 700,
                animationEasing: 'cubicOut',

                grid: {
                    top: 54,
                    right: 24,
                    bottom: 34,
                    left: 52,
                    containLabel: false,
                },

                tooltip: {
                    trigger: 'axis',
                    confine: true,

                    axisPointer: {
                        type: 'line',

                        lineStyle: {
                            color: theme.axisPointer,
                            width: 1,
                            type: 'dashed',
                        },
                    },

                    backgroundColor: theme.tooltipBackground,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,

                    textStyle: {
                        color: theme.textPrimary,
                        fontSize: 12,
                    },

                    formatter: (params) => {
                        const date = new Date(
                            params[0].value[0],
                        );

                        const dateLabel =
                            new Intl.DateTimeFormat('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short',
                            }).format(date);

                        const rows = params
                            .map((param) => {
                                const value = param.value[1];

                                let formattedValue = value;

                                if (
                                    param.seriesName ===
                                    'Tokens'
                                ) {
                                    formattedValue =
                                        new Intl.NumberFormat(
                                            'en-US',
                                            {
                                                notation:
                                                    'compact',
                                                maximumFractionDigits:
                                                    1,
                                            },
                                        ).format(value);
                                }

                                if (
                                    param.seriesName ===
                                    'Cost'
                                ) {
                                    formattedValue =
                                        `$${Number(value).toFixed(2)}`;
                                }

                                if (
                                    param.seriesName ===
                                    'Messages'
                                ) {
                                    formattedValue =
                                        Number(
                                            value,
                                        ).toLocaleString();
                                }

                                return `
                                    <div class="chart-tooltip__row">
                                        <span>
                                            ${param.marker}
                                            ${param.seriesName}
                                        </span>
                                        <strong>
                                            ${formattedValue}
                                        </strong>
                                    </div>
                                `;
                            })
                            .join('');

                        return `
                            <div class="chart-tooltip">
                                <div class="chart-tooltip__date">
                                    ${dateLabel}
                                </div>
                                ${rows}
                            </div>
                        `;
                    },
                },

                legend: {
                    top: 0,
                    right: 0,
                    itemWidth: 8,
                    itemHeight: 8,
                    icon: 'circle',

                    textStyle: {
                        color: theme.textSecondary,
                        fontSize: 11,
                    },

                    data: [
                        'Messages',
                        'Tokens',
                        'Cost',
                    ],
                },

                xAxis: {
                    type: 'time',
                    boundaryGap: false,

                    axisLine: {
                        show: false,
                    },

                    axisTick: {
                        show: false,
                    },

                    axisLabel: {
                        color: theme.textSecondary,
                        fontSize: 10,
                        margin: 14,

                        formatter: (value) => {
                            return new Intl.DateTimeFormat(
                                'en-US',
                                {
                                    month: 'short',
                                    day: 'numeric',
                                },
                            ).format(new Date(value));
                        },
                    },

                    splitLine: {
                        show: false,
                    },
                },

                yAxis: [
                    {
                        type: 'value',
                        name: 'Usage',
                        min: 0,

                        nameTextStyle: {
                            color: theme.textSecondary,
                            fontSize: 10,
                            padding: [0, 0, 8, 0],
                        },

                        axisLine: {
                            show: false,
                        },

                        axisTick: {
                            show: false,
                        },

                        axisLabel: {
                            color: theme.textSecondary,
                            fontSize: 10,

                            formatter: (value) =>
                                new Intl.NumberFormat(
                                    'en-US',
                                    {
                                        notation: 'compact',
                                        maximumFractionDigits: 1,
                                    },
                                ).format(value),
                        },

                        splitLine: {
                            lineStyle: {
                                color: theme.grid,
                            },
                        },
                    },

                    {
                        type: 'value',
                        name: 'Cost',
                        min: 0,

                        nameTextStyle: {
                            color: theme.textSecondary,
                            fontSize: 10,
                            padding: [0, 0, 8, 0],
                        },

                        axisLine: {
                            show: false,
                        },

                        axisTick: {
                            show: false,
                        },

                        axisLabel: {
                            color: theme.textSecondary,
                            fontSize: 10,

                            formatter: (value) =>
                                `$${value}`,
                        },

                        splitLine: {
                            show: false,
                        },
                    },
                ],

                series: [
                    {
                        name: 'Messages',
                        type: 'line',
                        smooth: 0.35,
                        showSymbol: true,
                        symbol: 'circle',
                        symbolSize: 7,
                        emphasis: {
                            focus: 'series',
                            scale: true,
                        },

                        lineStyle: {
                            width: 2,
                            color: '#8b5cf6',
                        },

                        itemStyle: {
                            color: '#8b5cf6',
                        },

                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(
                                0,
                                0,
                                0,
                                1,
                                [
                                    {
                                        offset: 0,
                                        color:
                                            'rgba(139, 92, 246, 0.28)',
                                    },
                                    {
                                        offset: 1,
                                        color:
                                            'rgba(139, 92, 246, 0)',
                                    },
                                ],
                            ),
                        },

                        data: data.map((item) => [
                            item.date,
                            item.messages,
                        ]),
                    },

                    {
                        name: 'Tokens',
                        type: 'line',
                        smooth: 0.35,
                        showSymbol: true,
                        symbol: 'circle',
                        symbolSize: 7,
                        emphasis: {
                            focus: 'series',
                            scale: true,
                        },

                        lineStyle: {
                            width: 2,
                            color: '#38bdf8',
                        },

                        itemStyle: {
                            color: '#38bdf8',
                        },

                        data: data.map((item) => [
                            item.date,
                            item.tokens,
                        ]),
                    },

                    {
                        name: 'Cost',
                        type: 'line',
                        yAxisIndex: 1,
                        smooth: 0.35,
                        showSymbol: true,
                        symbol: 'circle',
                        symbolSize: 7,
                        emphasis: {
                            focus: 'series',
                            scale: true,
                        },

                        lineStyle: {
                            width: 2,
                            color: '#34d399',
                        },

                        itemStyle: {
                            color: '#34d399',
                        },

                        data: data.map((item) => [
                            item.date,
                            item.cost,
                        ]),
                    },
                ],
            };
        }

        getThemeTokens() {
            const rootStyles = getComputedStyle(
                document.documentElement,
            );

            const getVariable = (
                name,
                fallback,
            ) => {
                return (
                    rootStyles
                        .getPropertyValue(name)
                        .trim() || fallback
                );
            };

            return {
                textPrimary: getVariable(
                    '--text-primary',
                    '#f4f4f5',
                ),

                textSecondary: getVariable(
                    '--text-secondary',
                    '#a1a1aa',
                ),

                grid: getVariable(
                    '--chart-grid',
                    'rgba(255, 255, 255, 0.06)',
                ),

                axisPointer: getVariable(
                    '--chart-axis-pointer',
                    'rgba(255, 255, 255, 0.24)',
                ),

                tooltipBackground: getVariable(
                    '--chart-tooltip-background',
                    '#111218',
                ),

                tooltipBorder: getVariable(
                    '--chart-tooltip-border',
                    'rgba(255, 255, 255, 0.10)',
                ),
            };
        }

        observeResize() {
            this.resizeObserver = new ResizeObserver(
                () => {
                    this.chart?.resize();
                },
            );

            this.resizeObserver.observe(this.elChart);
        }

        observeTheme() {
            this.themeObserver = new MutationObserver(
                (mutations) => {
                    const hasThemeChanged =
                        mutations.some(
                            (mutation) =>
                                mutation.type ===
                                'attributes' &&
                                mutation.attributeName ===
                                'data-theme',
                        );

                    if (!hasThemeChanged) return;

                    const period = Number(
                        this.elPeriod?.value || 7,
                    );

                    this.render(period);
                },
            );

            this.themeObserver.observe(
                document.documentElement,
                {
                    attributes: true,
                    attributeFilter: ['data-theme'],
                },
            );
        }

        destroy() {
            this.elPeriod?.removeEventListener(
                'change',
                this.handlePeriodChange,
            );

            this.resizeObserver?.disconnect();
            this.themeObserver?.disconnect();

            if (
                this.chart &&
                !this.chart.isDisposed()
            ) {
                this.chart.dispose();
            }

            this.chart = null;
        }
    }

    window.addEventListener(
        'DOMContentLoaded',
        () => {
            window.SAI.aiUsageChart =
                new AiUsageChart();
        },
    );
})();