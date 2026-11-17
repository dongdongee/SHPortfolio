
/* *********************************
 * Analytics Common
 * ********************************* */

/** Analytics 데이터 경로 */
const ANALYTICS_DATA_URL = '/sai/assets/data/dataList.json';

/**
 * 서울 기준 오늘 날짜 반환
 *
 * @returns {string} YYYY-MM-DD
 */
function getToday() {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

/**
 * 기준 날짜에서 지정한 일수만큼 이동
 *
 * @param {string} date - YYYY-MM-DD
 * @param {number} days - 이동할 일수
 * @returns {string} YYYY-MM-DD
 */
function shiftDate(date, days) {
    const result = new Date(`${date}T00:00:00Z`);

    result.setUTCDate(result.getUTCDate() + days);

    return result.toISOString().slice(0, 10);
}


/* *********************************
 * Analytics Calendar
 * ********************************* */

/**
 * Analytics 캘린더 초기화
 *
 * @description
 * - JSON 데이터 요청
 * - Flatpickr 초기화
 * - 선택일 포함 최근 7일 데이터 추출
 * - 선택일 및 정확히 7일 전 데이터 추출
 * - 날짜 변경 시 render 콜백 실행
 *
 * @param {Function} render - 날짜 변경 시 실행할 함수
 * @returns {Promise<Object|null>} Flatpickr 인스턴스
 */
async function initAnalyticsCalendar(render) {
    const calendar = document.querySelector('.sai-datepicker__date');
    const dateTrigger = document.querySelector('.sai-datepicker__trigger');
    const dateText = document.querySelector('.sai-datepicker__text');
    const periodEl = document.querySelector('.sai-datepicker__period');

    if (!calendar || !dateTrigger) return null;

    // Flatpickr 라이브러리 로드 확인
    if (typeof flatpickr === 'undefined') {
        throw new Error('Flatpickr 라이브러리가 로드되지 않았습니다.');
    }

    // 1. JSON 데이터 요청
    const response = await fetch(ANALYTICS_DATA_URL);

    if (!response.ok) {
        throw new Error(
            `Analytics 데이터 요청 실패 (${response.status})`
        );
    }

    const { daily } = await response.json();

    // 2. 날짜 오름차순 정렬
    const days = [...daily].sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    if (!days.length) return null;

    // 날짜별 데이터 검색을 위한 Map
    const daysByDate = new Map(
        days.map((day) => [day.date, day])
    );

    // 3. 선택 가능한 날짜 범위
    const minDate = days[0].date;
    const maxDate = days[days.length - 1].date;
    const today = getToday();

    // 오늘이 JSON 범위를 벗어나면 가장 가까운 날짜 선택
    const initialDate =
        today < minDate ? minDate :
        today > maxDate ? maxDate :
        today;

    /**
     * 선택일 기준 데이터 계산 및 화면 갱신
     *
     * @param {string} endDate - YYYY-MM-DD
     * @returns {void}
     */
    function update(endDate) {
        if (!endDate) return;

        // 4. 선택일 포함 최근 7일
        const startDate = shiftDate(endDate, -6);

        // 5. 증감률 비교를 위한 정확히 7일 전
        const previousDate = shiftDate(endDate, -6);

        // 최근 7일 데이터
        const currentDays = days.filter(
            ({ date }) =>
                date >= startDate && date <= endDate
        );

        // 선택일 하루 데이터
        const currentDay = daysByDate.get(endDate) ?? null;

        // 7일 전 하루 데이터
        const previousDay = daysByDate.get(previousDate) ?? null;

        // 6. 선택 날짜 표시
        if (dateText) {
            dateText.textContent = endDate;
        }

        // 7. 조회 기간 표시
        if (periodEl) {
            periodEl.textContent = `${startDate} ~ ${endDate}`;
        }

        // 8. Analytics 화면 갱신
        render({
            startDate,
            endDate,
            currentDays,
            currentDay,
            previousDay,
            canCompare:
                currentDay !== null &&
                previousDay !== null
        });
    }

    // 9. Flatpickr 초기화
    const picker = flatpickr(calendar, {
        locale: 'ko',
        dateFormat: 'Y-m-d',

        defaultDate: initialDate,
        minDate,
        maxDate,

        disableMobile: true,
        clickOpens: false,

        // 날짜 버튼을 기준으로 달력 위치 설정
        positionElement: dateTrigger,
        position: 'below left',

        monthSelectorType: 'static',

        // 날짜를 선택했을 때
        onChange(selectedDates, dateStr) {
            update(dateStr);
        }
    });

    // 10. 버튼 클릭 시 달력 열기
    dateTrigger.addEventListener('click', () => {
        picker.open();
    });

    // 11. 초기 날짜 데이터 표시
    update(initialDate);

    return picker;
}


/* *********************************
 * Analytics Usage KPI
 * ********************************* */

/**
 * Analytics Usage KPI 클래스
 *
 * @description
 * - 선택일 포함 최근 7일 KPI 집계
 * - 선택일과 7일 전의 증감률 계산
 * - 공통 SaiMiniChart 클래스 호출
 */
class AnalyticsUsageKpi {
    /**
     * @param {HTMLElement} section - Usage KPI 영역
     */
    constructor(section) {
        this.section = section;
    }

    /**
     * 기간별 KPI 지표 집계
     *
     * @description
     * - Requests, Tokens: 기간 합계
     * - Response Time: 요청 수를 반영한 평균
     * - Success Rate: 전체 성공 요청 비율
     *
     * @param {Array<Object>} days - 일별 데이터 배열
     * @returns {Object} 집계된 KPI 값
     */
    getMetrics(days) {
        const totals = days.reduce((result, day) => {
            result.requests += day.requests?.total ?? 0;
            result.tokens += day.tokens?.total ?? 0;
            result.success += day.requests?.success ?? 0;
            result.responseTimeSumMs +=
                day.status?.responseTimeSumMs ?? 0;
            result.responseCount +=
                day.status?.requestCount ?? 0;

            return result;
        }, {
            requests: 0,
            tokens: 0,
            success: 0,
            responseTimeSumMs: 0,
            responseCount: 0
        });

        return {
            requests: totals.requests,
            tokens: totals.tokens,

            responseTime: totals.responseCount > 0
                ? totals.responseTimeSumMs / totals.responseCount / 1000
                : null,

            successRate: totals.requests > 0
                ? totals.success / totals.requests * 100
                : null
        };
    }

    /**
     * 하루의 KPI 지표값 반환
     *
     * @description
     * - 미니차트의 일별 값 계산
     * - 선택일과 7일 전의 증감률 계산에 사용
     *
     * @param {Object|null} day - 하루 데이터
     * @param {string} metric - KPI 지표명
     * @returns {number|null} 해당 지표값
     */
    getDailyValue(day, metric) {
        if (!day) return null;

        switch (metric) {
            case 'requests':
                return day.requests?.total ?? null;

            case 'tokens':
                return day.tokens?.total ?? null;

            case 'responseTime': {
                const totalMs = day.status?.responseTimeSumMs;
                const count = day.status?.requestCount;

                return totalMs != null && count > 0
                    ? totalMs / count / 1000
                    : null;
            }

            case 'successRate': {
                const total = day.requests?.total;
                const success = day.requests?.success;

                return total > 0 && success != null
                    ? success / total * 100
                    : null;
            }

            default:
                return null;
        }
    }

    /**
     * Usage KPI 렌더링
     *
     * @param {Array<Object>} currentDays - 선택일 포함 최근 7일
     * @param {Object|null} currentDay - 선택일 하루 데이터
     * @param {Object|null} previousDay - 7일 전 하루 데이터
     * @param {boolean} canCompare - 증감률 비교 가능 여부
     * @returns {void}
     */
    render(currentDays, currentDay, previousDay, canCompare) {
        // 최근 7일 KPI 집계
        const current = this.getMetrics(currentDays);

        const cards = this.section.querySelectorAll('.kpi-card');

        for (const card of cards) {
            const metric = card.dataset.metric;

            if (!Object.hasOwn(current, metric)) continue;

            // 최근 7일 집계값
            const value = current[metric];

            // 선택일 하루와 7일 전 하루의 값
            const todayValue = this.getDailyValue(
                currentDay,
                metric
            );

            const previousValue = this.getDailyValue(
                previousDay,
                metric
            );

            const isRate = metric === 'successRate';
            const isTime = metric === 'responseTime';

            // 1. KPI 대표값 표시
            const valueEl = card.querySelector('.kpi-card__value');

            if (valueEl) {
                if (value === null) {
                    valueEl.textContent = '—';
                } else if (isRate) {
                    valueEl.textContent = `${value.toFixed(2)}%`;
                } else if (isTime) {
                    valueEl.textContent = `${value.toFixed(2)}s`;
                } else {
                    valueEl.textContent = value.toLocaleString('ko-KR');
                }
            }

            // 2. 선택일 vs 7일 전 증감률
            const changeEl = card.querySelector('.kpi-card__change');

            if (changeEl) {
                changeEl.classList.remove(
                    'is-up',
                    'is-down',
                    'is-flat'
                );

                if (
                    !canCompare ||
                    todayValue === null ||
                    previousValue === null ||
                    (!isRate && previousValue === 0)
                ) {
                    changeEl.textContent = '—';
                } else {
                    // Success Rate는 %p, 나머지는 변화율 %
                    const change = isRate
                        ? todayValue - previousValue
                        : (todayValue - previousValue) /
                            previousValue * 100;

                    const rounded = Number(change.toFixed(2));

                    const sign = rounded > 0 ? '+' : '';
                    const unit = isRate ? '%p' : '%';

                    changeEl.textContent =
                        `${sign}${rounded}${unit}`;

                    changeEl.classList.add(
                        rounded > 0
                            ? 'is-up'
                            : rounded < 0
                                ? 'is-down'
                                : 'is-flat'
                    );
                }
            }

            // 3. 최근 7일 미니차트 데이터
            const values = currentDays.map((day) =>
                this.getDailyValue(day, metric)
            );

            // 4. 공통 SaiMiniChart 호출
            const canvas = card.querySelector(
                '.kpi-card__chart canvas'
            );

            if (canvas) {
                new SaiMiniChart(canvas).renderMini(values);
            }
        }
    }
}



/* *********************************
 * Analytics Usage Trend
 * ********************************* */

/**
 * Requests & Tokens Trend
 *
 * @description
 * - 선택일 포함 최근 7일 데이터 사용
 * - 날짜별 Requests / Tokens 추출
 * - 공통 SaiLineChart 호출
 */
class AnalyticsUsageTrend {
    /**
     * @param {HTMLElement} section - 차트 영역
     */
    constructor(section) {
        this.section = section;
    }

    /**
     * Requests & Tokens 차트 렌더링
     *
     * @param {Array<Object>} currentDays - 최근 7일 데이터
     * @returns {void}
     */
    render(currentDays) {
        const canvas = this.section.querySelector('canvas');

        if (!canvas) return;

        // X축 날짜 (MM-DD)
        const labels = currentDays.map((day) =>
            day.date.slice(5)
        );

        // 날짜별 요청 수
        const requests = currentDays.map((day) =>
            day.requests?.total ?? null
        );

        // 날짜별 토큰 수
        const tokens = currentDays.map((day) =>
            day.tokens?.total ?? null
        );

        // 공통 이중 Y축 차트 실행
        new SaiLineChart(canvas).render(labels, [
            {
                label: 'Requests',
                data: requests,
                color: '#7C3AED'
            },
            {
                label: 'Tokens',
                data: tokens,
                color: '#3B82F6'
            }
        ]);
    }
}




/* *********************************
 * Analytics Initialize
 * ********************************* */

/**
 * Analytics Usage 초기화
 *
 * @description
 * - KPI 및 Trend 영역 확인
 * - 캘린더 날짜 변경 시 함께 갱신
 *
 * @returns {void}
 */


/* *********************************
 * Analytics Usage by Model
 * ********************************* */

/**
 * Usage by Model 클래스
 *
 * @description
 * - 선택일 포함 최근 7일 모델별 요청 수 합산
 * - 모델별 요청 비율 계산
 * - 공통 SaiDoughnutChart 호출
 * - 도넛과 연동된 HTML 라벨 렌더링
 */
class AnalyticsUsageModel {
    /**
     * @param {HTMLElement} section - 도넛 차트 영역
     */
    constructor(section) {
        this.section = section;
    }

    /**
     * 모델별 사용량 데이터 가공
     *
     * @param {Array<Object>} currentDays - 최근 7일 데이터
     * @returns {Array<Object>} 모델별 요청 수 및 비율
     */
    getModelData(currentDays) {
        // 모델별 요청 수 누적
        const requestsByModel = new Map();

        for (const day of currentDays) {
            for (const [modelId, usage] of Object.entries(day.models ?? {})) {
                const previous = requestsByModel.get(modelId) ?? 0;

                requestsByModel.set(
                    modelId,
                    previous + (usage.requests ?? 0)
                );
            }
        }

        // 전체 모델 요청 수 합계
        const totalRequests = [...requestsByModel.values()].reduce(
            (sum, value) => sum + value,
            0
        );

        // 모델별 색상
        const palette = [
            '#7C3AED',
            '#2563EB',
            '#EA580C',
            '#16A34A',
            '#DB2777',
            '#0891B2'
        ];

        // 도넛과 라벨에서 공통으로 사용할 데이터
        return [...requestsByModel.entries()].map(
            ([name, requests], index) => ({
                name,
                requests,

                percent: totalRequests > 0
                    ? requests / totalRequests * 100
                    : 0,

                color: palette[index % palette.length]
            })
        );
    }

    /**
     * 모델별 HTML 라벨 렌더링
     *
     * @param {Array<Object>} modelData - 모델별 집계 데이터
     * @returns {void}
     */
    renderLegend(modelData) {
        const legend = this.section.querySelector(
            '.js-usage-model-legend'
        );

        if (!legend) return;

        // 기존 목록 제거 (날짜 변경 시 중복 방지)
        legend.replaceChildren();

        for (const model of modelData) {
            // 모델별 목록 아이템
            const item = document.createElement('li');
            item.className = 'sai-chart-legend__item';

            // 색상 + 모델명
            const name = document.createElement('span');
            name.className = 'sai-chart-legend__name';

            const color = document.createElement('span');
            color.className = 'sai-chart-legend__color';
            color.style.backgroundColor = model.color;

            const label = document.createElement('span');
            label.textContent = model.name;

            name.append(color, label);

            // 요청 수
            const requests = document.createElement('span');
            requests.className = 'sai-chart-legend__requests';
            requests.textContent = model.requests.toLocaleString('ko-KR');

            // 사용 비율
            const percent = document.createElement('span');
            percent.className = 'sai-chart-legend__percent';
            percent.textContent = `${model.percent.toFixed(1)}%`;

            item.append(name, requests, percent);
            legend.append(item);
        }
    }

    /**
     * Usage by Model 렌더링
     *
     * @param {Array<Object>} currentDays - 최근 7일 데이터
     * @returns {void}
     */
    render(currentDays) {
        const canvas = this.section.querySelector('canvas');

        if (!canvas) return;

        // 1. 선택 기간의 모델별 데이터 계산
        const modelData = this.getModelData(currentDays);

        // 2. 공통 도넛 차트에 전달할 데이터 추출
        const labels = modelData.map((model) => model.name);
        const values = modelData.map((model) => model.requests);
        const colors = modelData.map((model) => model.color);

        // 3. 공통 도넛 차트 렌더링
        new SaiDoughnutChart(canvas).render(
            labels,
            values,
            colors
        );

        // 4. 동일한 데이터로 HTML 라벨 렌더링
        this.renderLegend(modelData);
    }
}




/* *********************************
 * Analytics Initialize
 * ********************************* */

/**
 * Analytics Usage 초기화
 *
 * @description
 * - KPI, Trend, Model 영역 확인
 * - 각 클래스 인스턴스 생성
 * - 캘린더를 한 번만 초기화
 * - 날짜 변경 시 모든 차트 갱신
 *
 * @returns {void}
 */
function initUsage() {
    // KPI 영역
    const kpiSection = document.querySelector(
        '.kpi-card'
    );

    // Requests & Tokens Trend 영역
    const trendSection = document.querySelector(
        '.js-analytics-usage-trend'
    );

    // Usage by Model 영역
    const modelSection = document.querySelector(
        '.js-analytics-usage-model'
    );

    // KPI 인스턴스
    const usageKpi = kpiSection
        ? new AnalyticsUsageKpi(kpiSection)
        : null;

    // 꺾은선 차트 인스턴스
    const usageTrend = trendSection
        ? new AnalyticsUsageTrend(trendSection)
        : null;

    // 도넛 차트 인스턴스
    const usageModel = modelSection
        ? new AnalyticsUsageModel(modelSection)
        : null;

    // 표시할 영역이 없다면 초기화 중단
    if (!usageKpi && !usageTrend && !usageModel) return;

    // 공통 캘린더 초기화
    initAnalyticsCalendar(({
        currentDays,
        currentDay,
        previousDay,
        canCompare
    }) => {
        // KPI 렌더링
        usageKpi?.render(
            currentDays,
            currentDay,
            previousDay,
            canCompare
        );

        // 이중축 꺾은선 차트 렌더링
        usageTrend?.render(currentDays);

        // 모델별 도넛 차트 렌더링
        usageModel?.render(currentDays);

    }).catch(console.error);
}

// Analytics Usage 실행
initUsage();