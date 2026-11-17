
/* *********************************
 * Chart Defaults
 * ********************************* */

// Chart.js 공통 기본 설정
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = 'Poppins, Pretendard, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.font.weight = '600';
    Chart.defaults.color = '#9699a2';
}


/* *********************************
 * SAI Common Mini Chart
 * ********************************* */

/**
 * KPI 미니차트 공통 클래스
 *
 * @description
 * - 데이터 계산은 각 페이지 JS에서 담당한다.
 * - 전달받은 데이터로 미니 막대차트를 생성한다.
 * - HTML의 data-color 속성으로 색상을 결정한다.
 * - 재렌더링 시 기존 Chart.js 인스턴스를 제거한다.
 */
class SaiMiniChart {
    /**
     * @param {HTMLCanvasElement} canvas - 차트를 표시할 canvas 요소
     */
    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * KPI 미니 막대차트 렌더링
     *
     * @param {Array<number|null>} values - 날짜별 KPI 값
     * @returns {void}
     */
    renderMini(values) {
        // Canvas 또는 Chart.js가 없으면 종료
        if (!this.canvas || typeof Chart === 'undefined') return;

        // 기존 차트 제거 (날짜 변경 시 중복 생성 방지)
        Chart.getChart(this.canvas)?.destroy();

        // 배열이 아니거나 데이터가 비어 있으면 종료
        if (!Array.isArray(values) || !values.length) return;

        // null을 제외하고 실제 숫자만 추출
        const numbers = values.filter(Number.isFinite);

        // 표시할 숫자가 없으면 종료
        if (!numbers.length) return;

        // KPI 카드의 data-color 속성 읽기
        const card = this.canvas.closest('.kpi-card');
        const color = card?.dataset.color ?? 'purple';

        // 차트 색상 정의
        const colors = {
            purple: [119, 61, 249],
            blue: [89, 152, 255],
            orange: [255, 164, 81],
            green: [66, 214, 195]
        };

        // 선택한 색상의 RGB 값 추출
        const [r, g, b] = colors[color] ?? colors.purple;

        // 유효한 숫자를 기준으로 최소·최댓값 계산
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);

        // 값의 크기에 따라 막대 투명도 계산
        const backgroundColors = values.map((value) => {
            // 데이터가 없는 날짜는 투명 처리
            if (!Number.isFinite(value)) return 'transparent';

            const ratio = min === max
                ? 1
                : (value - min) / (max - min);

            const opacity = 0.25 + ratio * 0.75;

            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        });

        // 미니 막대차트 생성
        new Chart(this.canvas, {
            type: 'bar',

            data: {
                labels: values.map((_, index) => index + 1),

                datasets: [{
                    data: values,
                    borderWidth: 0,
                    borderRadius: 3,
                    maxBarThickness: 12,
                    backgroundColor: backgroundColors
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
                        beginAtZero: true
                    }
                }
            }
        });
    }
}


/* *********************************
 * SAI Common Progress
 * ********************************* */

/**
 * 프로그레스 바 공통 클래스
 *
 * @description
 * - 전달받은 비율을 CSS 변수에 적용한다.
 * - 비율을 텍스트로 표시한다.
 * - 100%를 초과하더라도 막대 너비는 100%로 제한한다.
 */
class SaiProgress {
    /**
     * @param {HTMLElement} container - 프로그레스 영역
     * @param {string} textSelector - 비율 텍스트 선택자
     */
    constructor(container, textSelector) {
        this.container = container;
        this.textSelector = textSelector;
    }

    /**
     * 프로그레스 바 렌더링
     *
     * @param {number|null} percent - 사용 비율
     * @returns {void}
     */
    render(percent) {
        if (!this.container) return;

        const bar = this.container.querySelector('.sai-progress__bar');
        const text = this.container.querySelector(this.textSelector);

        const isValid = Number.isFinite(percent);

        const width = isValid ? Math.max(0, Math.min(percent, 100)) : 0;

        bar?.style.setProperty('--progress', `${width}%`);

        if (text) {
            text.textContent = isValid ? `${percent.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%` : '—'; }
    }
}




/* *********************************
 * Common Line Chart
 * ********************************* */

/**
 * 공통 이중 Y축 꺾은선 차트
 *
 * @description
 * - Chart.js 기반 Line Chart
 * - 왼쪽 / 오른쪽 Y축 개별 사용
 * - 여러 데이터셋 렌더링
 * - 기존 차트 제거 후 재생성
 * - 날짜 변경 시 차트 갱신
 */
class SaiLineChart {
    /**
     * @param {HTMLCanvasElement} canvas - 차트 canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * 이중 Y축 차트 렌더링
     *
     * @param {Array<string>} labels - X축 날짜
     * @param {Array<Object>} datasets - 차트 데이터
     * @returns {void}
     */
    render(labels, datasets) {
        if (!this.canvas) return;

        // 기존 차트 제거
        Chart.getChart(this.canvas)?.destroy();

        new Chart(this.canvas, {
            type: 'line',

            data: {
                labels,
                datasets: datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,

                    // 첫 번째는 왼쪽, 두 번째는 오른쪽 Y축
                    yAxisID: index === 0 ? 'y' : 'y1',

                    // 꺾은선 색상
                    borderColor: dataset.color,

                    // 선 아래 그라데이션 배경
                    backgroundColor(context) {
                        const { chart } = context;
                        const { ctx, chartArea } = chart;

                        // 차트 영역이 계산되기 전에는 기본색 사용
                        if (!chartArea) return dataset.color;

                        const gradient = ctx.createLinearGradient(
                            0,
                            chartArea.top,
                            0,
                            chartArea.bottom
                        );

                        // 위쪽은 선 색상에 가까운 반투명 배경
                        gradient.addColorStop(
                            0,
                            index === 0
                                ? 'rgba(124, 58, 237, 0.18)'
                                : 'rgba(59, 130, 246, 0.12)'
                        );

                        // 아래쪽으로 갈수록 투명해짐
                        gradient.addColorStop(
                            1,
                            index === 0
                                ? 'rgba(124, 58, 237, 0)'
                                : 'rgba(59, 130, 246, 0)'
                        );

                        return gradient;
                    },

                    borderWidth: 2,
                    tension: 0.35,

                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: dataset.color,

                    // 선 아래 영역 채우기
                    fill: 'origin'
                }))

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
                        display: true,
                        position: 'top',
                        align: 'end',

                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            boxHeight: 8
                        }
                    },

                    tooltip: {
                        callbacks: {
                            label(context) {
                                const value = context.parsed.y;

                                return `${context.dataset.label}: ${value.toLocaleString('ko-KR')}`;
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },

                    // 왼쪽 Y축: Requests
                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,

                        title: {
                            display: true,
                            text: 'Requests'
                        },

                        ticks: {
                            callback(value) {
                                return Number(value).toLocaleString('ko-KR');
                            }
                        }
                    },

                    // 오른쪽 Y축: Tokens
                    y1: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,

                        title: {
                            display: true,
                            text: 'Tokens'
                        },

                        grid: {
                            drawOnChartArea: false
                        },

                        ticks: {
                            callback(value) {
                                const number = Number(value);

                                if (number >= 1000000) {
                                    return `${number / 1000000}M`;
                                }

                                if (number >= 1000) {
                                    return `${number / 1000}K`;
                                }

                                return number;
                            }
                        }
                    }
                }
            }
        });
    }
}







/* *********************************
 * Common Doughnut Chart
 * ********************************* */

/**
 * 공통 도넛 차트 클래스
 *
 * @description
 * - Chart.js 기반 Doughnut Chart
 * - 모델별 비율 표시
 * - 데이터에 따라 색상 적용
 * - 기존 차트 제거 후 재생성
 */
class SaiDoughnutChart {
    /**
     * @param {HTMLCanvasElement} canvas - 차트 canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * 도넛 차트 렌더링
     *
     * @param {Array<string>} labels - 항목 이름
     * @param {Array<number>} values - 항목별 값
     * @param {Array<string>} colors - 항목별 색상
     * @returns {void}
     */
    render(labels, values, colors) {
        if (!this.canvas) return;

        // 기존 차트 제거
        Chart.getChart(this.canvas)?.destroy();

        new Chart(this.canvas, {
            type: 'doughnut',

            data: {
                labels,

                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                // 도넛 중앙 구멍 크기
                cutout: '72%',

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce(
                                    (sum, item) => sum + item,
                                    0
                                );

                                const percent = total > 0
                                    ? value / total * 100
                                    : 0;

                                return `${context.label}: ${percent.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
}
