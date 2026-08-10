(() => {
    window.SAI = window.SAI || {};

    /*
     * ============================================================
     * AI Usage Chart
     * ============================================================
     */
    class AiUsageChart {
        constructor({
            chartSelector = '.js-ai-usage-chart',
            periodSelector = '.js-ai-usage-period',
        } = {}) {
            this.elChart =
                document.querySelector(
                    chartSelector,
                );

            this.elPeriod =
                document.querySelector(
                    periodSelector,
                );

            this.chart = null;
            this.data = [];

            this.resizeObserver = null;
            this.themeObserver = null;

            this.handlePeriodChange =
                this.handlePeriodChange.bind(
                    this,
                );

            this.init();
        }

        init() {
            if (!this.elChart) {
                return;
            }

            this.initChart();
            this.bindEvents();
            this.observeResize();
            this.observeTheme();
        }

        /*
         * ========================================================
         * Init
         * ========================================================
         */
        initChart() {
            const existingChart =
                echarts.getInstanceByDom(
                    this.elChart,
                );

            this.chart =
                existingChart ||
                echarts.init(
                    this.elChart,
                );

            const period =
                Number(
                    this.elPeriod?.value ||
                    7,
                );

            this.render(
                period,
            );
        }

        /*
         * ========================================================
         * Events
         * ========================================================
         */
        bindEvents() {
            this.elPeriod?.addEventListener(
                'change',
                this.handlePeriodChange,
            );
        }

        handlePeriodChange() {
            const period =
                Number(
                    this.elPeriod.value,
                );

            this.render(
                period,
            );
        }

        /*
         * ========================================================
         * Render
         * ========================================================
         */
        render(days) {
            if (!this.chart) {
                return;
            }

            /*
             * 현재는 Mock 데이터.
             *
             * 실제 API 연동 시에는 이 부분을
             *
             * this.data =
             *     await this.fetchUsageData(days);
             *
             * 형태로 교체하면 된다.
             */
            this.data =
                this.createUsageData(
                    days,
                );

            this.renderChart();

            /*
             * 메인 차트와 동일한 데이터를
             * KPI 영역에도 전달한다.
             */
            this.dispatchUsageData(
                days,
            );
        }

        /*
         * 데이터는 다시 만들지 않고
         * 저장된 데이터로 차트만 다시 그린다.
         *
         * Dark / Light 변경 시 사용.
         */
        renderChart() {
            if (!this.chart) {
                return;
            }

            const theme =
                this.getThemeTokens();

            this.chart.setOption(
                this.createOption(
                    this.data,
                    theme,
                ),
                {
                    notMerge: true,
                    lazyUpdate: false,
                },
            );
        }

        /*
         * ========================================================
         * Mock Data
         * ========================================================
         */
        createUsageData(days) {
            const result = [];

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0,
            );

            for (
                let index =
                    days - 1;
                index >= 0;
                index -= 1
            ) {
                const date =
                    new Date(
                        today,
                    );

                date.setDate(
                    today.getDate() -
                    index,
                );

                const progression =
                    days - index;

                /*
                 * AI Messages
                 */
                const messages =
                    126250 +
                    progression *
                    80 +
                    Math.round(
                        Math.random() *
                        38000,
                    );

                /*
                 * Tokens
                 */
                const tokens =
                    180000 +
                    progression *
                    24000 +
                    Math.round(
                        Math.random() *
                        90000,
                    );

                /*
                 * Cost
                 */
                const cost =
                    Number(
                        (
                            18 +
                            progression *
                            2.7 +
                            Math.random() *
                            9
                        ).toFixed(
                            2,
                        ),
                    );

                /*
                 * Success Rate
                 */
                const successRate =
                    Number(
                        (
                            96.5 +
                            Math.random() *
                            2.5
                        ).toFixed(
                            1,
                        ),
                    );

                result.push({
                    date:
                        date.getTime(),

                    messages,
                    tokens,
                    cost,
                    successRate,
                });
            }

            return result;
        }

        /*
         * ========================================================
         * Main Chart Option
         * ========================================================
         */
        createOption(
            data,
            theme,
        ) {
            return {
                animationDuration:
                    700,

                animationEasing:
                    'cubicOut',

                grid: {
                    top: 54,
                    right: 24,
                    bottom: 34,
                    left: 52,

                    containLabel:
                        false,
                },

                /*
                 * ------------------------------------------------
                 * Tooltip
                 * ------------------------------------------------
                 */
                tooltip: {
                    trigger:
                        'axis',

                    confine:
                        true,

                    axisPointer: {
                        type:
                            'line',

                        lineStyle: {
                            color:
                                theme.axisPointer,

                            width:
                                1,

                            type:
                                'dashed',
                        },
                    },

                    backgroundColor:
                        theme.tooltipBackground,

                    borderColor:
                        theme.tooltipBorder,

                    borderWidth:
                        1,

                    padding:
                        12,

                    textStyle: {
                        color:
                            theme.textPrimary,

                        fontSize:
                            12,
                    },

                    formatter:
                        (
                            params,
                        ) => {
                            const date =
                                new Date(
                                    params[0]
                                        .value[0],
                                );

                            const dateLabel =
                                new Intl.DateTimeFormat(
                                    'ko-KR',
                                    {
                                        month:
                                            'short',

                                        day:
                                            'numeric',

                                        weekday:
                                            'short',
                                    },
                                ).format(
                                    date,
                                );

                            const rows =
                                params
                                    .map(
                                        (
                                            param,
                                        ) => {
                                            const value =
                                                param
                                                    .value[
                                                1
                                                ];

                                            let formattedValue =
                                                value;

                                            if (
                                                param.seriesName ===
                                                'Messages'
                                            ) {
                                                formattedValue =
                                                    Number(
                                                        value,
                                                    ).toLocaleString();
                                            }

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
                                                    ).format(
                                                        value,
                                                    );
                                            }

                                            if (
                                                param.seriesName ===
                                                'Cost'
                                            ) {
                                                formattedValue =
                                                    `$${Number(
                                                        value,
                                                    ).toFixed(
                                                        2,
                                                    )}`;
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
                                        },
                                    )
                                    .join(
                                        '',
                                    );

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

                /*
                 * ------------------------------------------------
                 * Legend
                 * ------------------------------------------------
                 */
                legend: {
                    top:
                        0,

                    right:
                        0,

                    itemWidth:
                        8,

                    itemHeight:
                        8,

                    icon:
                        'circle',

                    textStyle: {
                        color:
                            theme.textSecondary,

                        fontSize:
                            11,
                    },

                    data: [
                        'Messages',
                        'Tokens',
                        'Cost',
                    ],
                },

                /*
                 * ------------------------------------------------
                 * X Axis
                 * ------------------------------------------------
                 */
                xAxis: {
                    type:
                        'time',

                    boundaryGap:
                        false,

                    axisLine: {
                        show:
                            false,
                    },

                    axisTick: {
                        show:
                            false,
                    },

                    axisLabel: {
                        color:
                            theme.textSecondary,

                        fontSize:
                            10,

                        margin:
                            14,

                        formatter:
                            (
                                value,
                            ) => {
                                return new Intl.DateTimeFormat(
                                    'en-US',
                                    {
                                        month:
                                            'short',

                                        day:
                                            'numeric',
                                    },
                                ).format(
                                    new Date(
                                        value,
                                    ),
                                );
                            },
                    },

                    splitLine: {
                        show:
                            false,
                    },
                },

                /*
                 * ------------------------------------------------
                 * Y Axis
                 * ------------------------------------------------
                 */
                yAxis: [
                    {
                        type:
                            'value',

                        name:
                            'Usage',

                        min:
                            0,

                        nameTextStyle: {
                            color:
                                theme.textSecondary,

                            fontSize:
                                10,

                            padding: [
                                0,
                                0,
                                8,
                                0,
                            ],
                        },

                        axisLine: {
                            show:
                                false,
                        },

                        axisTick: {
                            show:
                                false,
                        },

                        axisLabel: {
                            color:
                                theme.textSecondary,

                            fontSize:
                                10,

                            formatter:
                                (
                                    value,
                                ) =>
                                    new Intl.NumberFormat(
                                        'en-US',
                                        {
                                            notation:
                                                'compact',

                                            maximumFractionDigits:
                                                1,
                                        },
                                    ).format(
                                        value,
                                    ),
                        },

                        splitLine: {
                            lineStyle: {
                                color:
                                    theme.grid,
                            },
                        },
                    },

                    {
                        type:
                            'value',

                        name:
                            'Cost',

                        min:
                            0,

                        nameTextStyle: {
                            color:
                                theme.textSecondary,

                            fontSize:
                                10,

                            padding: [
                                0,
                                0,
                                8,
                                0,
                            ],
                        },

                        axisLine: {
                            show:
                                false,
                        },

                        axisTick: {
                            show:
                                false,
                        },

                        axisLabel: {
                            color:
                                theme.textSecondary,

                            fontSize:
                                10,

                            formatter:
                                (
                                    value,
                                ) =>
                                    `$${value}`,
                        },

                        splitLine: {
                            show:
                                false,
                        },
                    },
                ],

                /*
                 * ------------------------------------------------
                 * Series
                 * ------------------------------------------------
                 */
                series: [
                    /*
                     * Messages
                     */
                    {
                        name:
                            'Messages',

                        type:
                            'line',

                        smooth:
                            0.35,

                        showSymbol:
                            true,

                        symbol:
                            'circle',

                        symbolSize:
                            7,

                        emphasis: {
                            focus:
                                'series',

                            scale:
                                true,
                        },

                        lineStyle: {
                            width:
                                2,

                            color:
                                '#8b5cf6',
                        },

                        itemStyle: {
                            color:
                                '#8b5cf6',
                        },

                        data:
                            data.map(
                                (
                                    item,
                                ) => [
                                        item.date,
                                        item.messages,
                                    ],
                            ),
                    },

                    /*
                     * Tokens
                     */
                    {
                        name:
                            'Tokens',

                        type:
                            'line',

                        smooth:
                            0.35,

                        showSymbol:
                            true,

                        symbol:
                            'circle',

                        symbolSize:
                            7,

                        emphasis: {
                            focus:
                                'series',

                            scale:
                                true,
                        },

                        lineStyle: {
                            width:
                                2,

                            color:
                                '#38bdf8',
                        },

                        itemStyle: {
                            color:
                                '#38bdf8',
                        },

                        data:
                            data.map(
                                (
                                    item,
                                ) => [
                                        item.date,
                                        item.tokens,
                                    ],
                            ),
                    },

                    /*
                     * Cost
                     */
                    {
                        name:
                            'Cost',

                        type:
                            'line',

                        yAxisIndex:
                            1,

                        smooth:
                            0.35,

                        showSymbol:
                            true,

                        symbol:
                            'circle',

                        symbolSize:
                            7,

                        emphasis: {
                            focus:
                                'series',

                            scale:
                                true,
                        },

                        lineStyle: {
                            width:
                                2,

                            color:
                                '#34d399',
                        },

                        itemStyle: {
                            color:
                                '#34d399',
                        },

                        data:
                            data.map(
                                (
                                    item,
                                ) => [
                                        item.date,
                                        item.cost,
                                    ],
                            ),
                    },
                ],
            };
        }

        /*
         * ========================================================
         * Theme
         * ========================================================
         */
        getThemeTokens() {
            const rootStyles =
                getComputedStyle(
                    document.documentElement,
                );

            const getVariable =
                (
                    name,
                    fallback,
                ) => {
                    return (
                        rootStyles
                            .getPropertyValue(
                                name,
                            )
                            .trim() ||
                        fallback
                    );
                };

            return {
                textPrimary:
                    getVariable(
                        '--text-primary',
                        '#f4f4f5',
                    ),

                textSecondary:
                    getVariable(
                        '--text-secondary',
                        '#a1a1aa',
                    ),

                grid:
                    getVariable(
                        '--chart-grid',
                        'rgba(255, 255, 255, 0.06)',
                    ),

                axisPointer:
                    getVariable(
                        '--chart-axis-pointer',
                        'rgba(255, 255, 255, 0.24)',
                    ),

                tooltipBackground:
                    getVariable(
                        '--chart-tooltip-background',
                        '#111218',
                    ),

                tooltipBorder:
                    getVariable(
                        '--chart-tooltip-border',
                        'rgba(255, 255, 255, 0.10)',
                    ),
            };
        }

        /*
         * ========================================================
         * Data Share
         * ========================================================
         */
        dispatchUsageData(
            days,
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    'sai:usage-data-change',
                    {
                        detail: {
                            days,

                            data:
                                this.data,
                        },
                    },
                ),
            );
        }

        /*
         * ========================================================
         * Resize
         * ========================================================
         */
        observeResize() {
            this.resizeObserver =
                new ResizeObserver(
                    () => {
                        this.chart?.resize();
                    },
                );

            this.resizeObserver.observe(
                this.elChart,
            );
        }

        /*
         * ========================================================
         * Theme Observer
         * ========================================================
         */
        observeTheme() {
            this.themeObserver =
                new MutationObserver(
                    (
                        mutations,
                    ) => {
                        const hasThemeChanged =
                            mutations.some(
                                (
                                    mutation,
                                ) =>
                                    mutation.type ===
                                    'attributes' &&
                                    mutation.attributeName ===
                                    'data-theme',
                            );

                        if (
                            !hasThemeChanged
                        ) {
                            return;
                        }

                        /*
                         * 테마 변경에서는
                         * 데이터를 새로 만들지 않는다.
                         */
                        this.renderChart();
                    },
                );

            this.themeObserver.observe(
                document.documentElement,
                {
                    attributes:
                        true,

                    attributeFilter: [
                        'data-theme',
                    ],
                },
            );
        }

        /*
         * ========================================================
         * Destroy
         * ========================================================
         */
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
            this.data = [];
        }
    }


    /*
     * ============================================================
     * KPI Chart
     * ============================================================
     *
     * KPI 영역 전체 담당.
     *
     * - 현재 KPI 값
     * - 전일 대비 증감률
     * - Sparkline
     */
    class KpiChart {
        constructor({
            chartSelector = '.js-kpi-chart',
            kpiSelector = '[data-kpi-type]',
        } = {}) {
            this.elCharts = [
                ...document.querySelectorAll(
                    chartSelector,
                ),
            ];

            this.elKpis = [
                ...document.querySelectorAll(
                    kpiSelector,
                ),
            ];

            this.charts = [];
            this.data = [];

            this.resizeObserver = null;

            this.handleUsageDataChange =
                this.handleUsageDataChange.bind(
                    this,
                );

            this.init();
        }

        init() {
            if (
                !this.elCharts.length &&
                !this.elKpis.length
            ) {
                return;
            }

            this.initCharts();
            this.bindEvents();
            this.observeResize();
        }

        /*
         * ========================================================
         * Init Charts
         * ========================================================
         */
        initCharts() {
            this.charts =
                this.elCharts.map(
                    (
                        elChart,
                    ) => {
                        const existingChart =
                            echarts.getInstanceByDom(
                                elChart,
                            );

                        const chart =
                            existingChart ||
                            echarts.init(
                                elChart,
                            );

                        return {
                            el:
                                elChart,

                            chart,

                            type:
                                elChart
                                    .dataset
                                    .chartType,
                        };
                    },
                );
        }

        /*
         * ========================================================
         * Events
         * ========================================================
         */
        bindEvents() {
            window.addEventListener(
                'sai:usage-data-change',
                this.handleUsageDataChange,
            );
        }

        handleUsageDataChange(
            event,
        ) {
            const data =
                event.detail?.data;

            if (
                !Array.isArray(
                    data,
                )
            ) {
                return;
            }

            this.data =
                data;

            /*
             * 동일 데이터를 사용하여
             *
             * 1. Sparkline
             * 2. KPI 값
             *
             * 둘 다 업데이트한다.
             */
            this.renderCharts();
            this.renderValues();
        }

        /*
         * ========================================================
         * Sparkline Render
         * ========================================================
         */
        renderCharts() {
            if (
                !this.data.length
            ) {
                return;
            }

            this.charts.forEach(
                ({
                    chart,
                    type,
                }) => {
                    const config =
                        this.getChartConfig(
                            type,
                        );

                    if (
                        !config
                    ) {
                        return;
                    }

                    chart.setOption(
                        this.createChartOption(
                            config,
                        ),
                        {
                            notMerge:
                                true,

                            lazyUpdate:
                                false,
                        },
                    );
                },
            );
        }

        /*
         * ========================================================
         * KPI Value Render
         * ========================================================
         *
         * 현재 날짜 = 배열 마지막 값
         * 전일 = 배열 마지막에서 두 번째 값
         */
        renderValues() {
            if (
                !this.data.length
            ) {
                return;
            }

            const current =
                this.data[
                this.data.length -
                1
                ];

            const previous =
                this.data[
                Math.max(
                    this.data.length -
                    2,
                    0,
                )
                ];

            this.elKpis.forEach(
                (
                    elKpi,
                ) => {
                    const type =
                        elKpi.dataset
                            .kpiType;

                    const config =
                        this.getValueConfig(
                            type,
                        );

                    if (
                        !config
                    ) {
                        return;
                    }

                    const elValue =
                        elKpi.querySelector(
                            '.js-kpi-value',
                        );

                    const elChange =
                        elKpi.querySelector(
                            '.js-kpi-change',
                        );

                    const elChangeValue =
                        elKpi.querySelector(
                            '.js-kpi-change-value',
                        );

                    const currentValue =
                        current[
                        config.key
                        ];

                    const previousValue =
                        previous[
                        config.key
                        ];

                    /*
                     * 현재 KPI 값
                     */
                    if (
                        elValue
                    ) {
                        elValue.textContent =
                            config.formatValue(
                                currentValue,
                            );
                    }

                    /*
                     * 이전 데이터가 없을 경우
                     */
                    if (
                        previousValue ==
                        null ||
                        currentValue ==
                        null
                    ) {
                        if (
                            elChangeValue
                        ) {
                            elChangeValue.textContent =
                                '-';
                        }

                        return;
                    }

                    const changeRate =
                        previousValue ===
                            0
                            ? 0
                            : (
                                (
                                    currentValue -
                                    previousValue
                                ) /
                                previousValue
                            ) *
                            100;

                    const isUp =
                        changeRate >
                        0;

                    const isDown =
                        changeRate <
                        0;

                    const arrow =
                        isUp
                            ? '↑'
                            : isDown
                                ? '↓'
                                : '→';

                    if (
                        elChangeValue
                    ) {
                        elChangeValue.textContent =
                            `${arrow} ${Math.abs(
                                changeRate,
                            ).toFixed(
                                1,
                            )}%`;
                    }

                    if (
                        elChange
                    ) {
                        elChange.classList.toggle(
                            'sai-kpi__change--up',
                            isUp,
                        );

                        elChange.classList.toggle(
                            'sai-kpi__change--down',
                            isDown,
                        );
                    }
                },
            );
        }

        /*
         * ========================================================
         * KPI Value Config
         * ========================================================
         */
        getValueConfig(
            type,
        ) {
            const configs = {
                messages: {
                    key:
                        'messages',

                    formatValue(
                        value,
                    ) {
                        return Number(
                            value,
                        ).toLocaleString(
                            'en-US',
                        );
                    },
                },

                tokens: {
                    key:
                        'tokens',

                    formatValue(
                        value,
                    ) {
                        return new Intl.NumberFormat(
                            'en-US',
                            {
                                notation:
                                    'compact',

                                maximumFractionDigits:
                                    1,
                            },
                        ).format(
                            value,
                        );
                    },
                },

                cost: {
                    key:
                        'cost',

                    formatValue(
                        value,
                    ) {
                        return `$${Number(
                            value,
                        ).toFixed(
                            2,
                        )}`;
                    },
                },

                successRate: {
                    key:
                        'successRate',

                    formatValue(
                        value,
                    ) {
                        return `${Number(
                            value,
                        ).toFixed(
                            1,
                        )}%`;
                    },
                },
            };

            return (
                configs[
                type
                ] || null
            );
        }

        /*
         * ========================================================
         * Sparkline Config
         * ========================================================
         */
        getChartConfig(
            type,
        ) {
            const configs = {
                messages: {
                    key:
                        'messages',

                    color:
                        '#8b5cf6',
                },

                tokens: {
                    key:
                        'tokens',

                    color:
                        '#38bdf8',
                },

                cost: {
                    key:
                        'cost',

                    color:
                        '#34d399',
                },

                successRate: {
                    key:
                        'successRate',

                    color:
                        '#8b5cf6',
                },
            };

            return (
                configs[
                type
                ] || null
            );
        }

        /*
         * ========================================================
         * Sparkline Option
         * ========================================================
         */
        createChartOption(
            config,
        ) {
            return {
                animationDuration:
                    500,

                animationEasing:
                    'cubicOut',

                grid: {
                    top:
                        3,

                    right:
                        2,

                    bottom:
                        3,

                    left:
                        2,

                    containLabel:
                        false,
                },

                tooltip: {
                    show:
                        false,
                },

                xAxis: {
                    type:
                        'category',

                    show:
                        false,

                    boundaryGap:
                        false,

                    data:
                        this.data.map(
                            (
                                item,
                            ) =>
                                item.date,
                        ),
                },

                /*
                 * 0부터 시작하지 않고
                 * 해당 KPI 데이터 범위로 확대.
                 */
                yAxis: {
                    type:
                        'value',

                    show:
                        false,

                    scale:
                        true,
                },

                series: [
                    {
                        type:
                            'line',

                        data:
                            this.data.map(
                                (
                                    item,
                                ) =>
                                    item[
                                    config
                                        .key
                                    ],
                            ),

                        smooth:
                            0.25,

                        showSymbol:
                            false,

                        symbol:
                            'none',

                        silent:
                            true,

                        connectNulls:
                            true,

                        lineStyle: {
                            width:
                                2,

                            color:
                                config.color,
                        },

                        emphasis: {
                            disabled:
                                true,
                        },
                    },
                ],
            };
        }

        /*
         * ========================================================
         * Resize
         * ========================================================
         */
        observeResize() {
            if (
                !this.elCharts.length
            ) {
                return;
            }

            this.resizeObserver =
                new ResizeObserver(
                    (
                        entries,
                    ) => {
                        entries.forEach(
                            (
                                entry,
                            ) => {
                                const target =
                                    entry.target;

                                const item =
                                    this.charts.find(
                                        (
                                            chartItem,
                                        ) =>
                                            chartItem.el ===
                                            target,
                                    );

                                item?.chart.resize();
                            },
                        );
                    },
                );

            this.elCharts.forEach(
                (
                    elChart,
                ) => {
                    this.resizeObserver.observe(
                        elChart,
                    );
                },
            );
        }

        /*
         * ========================================================
         * Destroy
         * ========================================================
         */
        destroy() {
            window.removeEventListener(
                'sai:usage-data-change',
                this.handleUsageDataChange,
            );

            this.resizeObserver?.disconnect();

            this.charts.forEach(
                ({
                    chart,
                }) => {
                    if (
                        chart &&
                        !chart.isDisposed()
                    ) {
                        chart.dispose();
                    }
                },
            );

            this.charts =
                [];

            this.data =
                [];
        }
    }


    /*
     * ============================================================
     * Initialize
     * ============================================================
     */
    window.addEventListener(
        'DOMContentLoaded',
        () => {
            /*
             * KPI가 먼저 이벤트를 듣도록 초기화.
             */
            window.SAI.kpiChart =
                new KpiChart();

            /*
             * 이후 메인 Chart가 데이터를 생성하고
             * sai:usage-data-change 이벤트 발생.
             */
            window.SAI.aiUsageChart =
                new AiUsageChart();
        },
    );
})();