
/* *********************************
 * Overview Common
 * ********************************* */

/** Overview 데이터 경로 */
const OVERVIEW_DATA_URL = '/sai/assets/data/dataList.json';

/**
 * 서울 기준 오늘 날짜를 반환한다.
 * 데이터의 날짜와 문자열로 비교할 수 있도록
 * sv-SE 로케일로 형식을 맞춘다.
 *
 * @returns {string} YYYY-MM-DD 형식의 날짜
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
 * 기준 날짜에서 지정한 일수만큼 이동한다.
 *
 * @param {string} date - 기준 날짜 (YYYY-MM-DD)
 * @param {number} days - 이동할 일수
 * @returns {string} 이동한 날짜 (YYYY-MM-DD)
 */
function shiftDate(date, days) {
    const result = new Date(`${date}T00:00:00Z`);

    result.setUTCDate(result.getUTCDate() + days);

    return result.toISOString().slice(0, 10);
}


/* *********************************
 * Overview KPI
 * ********************************* */

/**
 * Overview KPI 클래스
 *
 * @description
 * - 오늘의 KPI 값 표시
 * - 7일 전 대비 증감률 계산
 * - 최근 7일 미니차트 렌더링
 * - 공통 SaiMiniChart 클래스 사용
 */
class OverviewKpi {
    /**
     * @param {HTMLElement} section - KPI 카드 영역
     */
    constructor(section) {
        this.section = section;
    }

    /**
     * KPI 데이터 계산 및 렌더링
     *
     * @param {Array<Object>} daily - 일별 데이터
     * @returns {void}
     */
    render(daily) {
        const today = getToday();

        // 오늘 포함 최근 7일 날짜 생성
        const dates = Array.from({ length: 7 }, (_, index) =>
            shiftDate(today, index - 6)
        );

        // 날짜를 키로 사용하는 Map 생성
        const daysByDate = new Map(
            daily.map((day) => [day.date, day])
        );

        // 오늘 데이터
        const todayDay = daysByDate.get(today);

        // 정확히 7일 전 데이터
        const previousDay = daysByDate.get(
            shiftDate(today, -7)
        );

        // 오늘 데이터가 없으면 종료
        if (!todayDay) return;

        // KPI별 데이터 추출 방법
        const getMetric = {
            total: (day) => day.users.total,

            requests: (day) => day.requests.total,

            projects: (day) => Object.values(day.projects)
                .filter((project) => project.requests > 0).length,

            status: (day) => day.status.uptime
        };

        // KPI 카드 조회
        const cards = this.section.querySelectorAll('.kpi-card');

        for (const card of cards) {
            const metric = card.dataset.metric;
            const readValue = getMetric[metric];

            // 정의되지 않은 지표는 건너뛰기
            if (typeof readValue !== 'function') continue;

            const isStatus = metric === 'status';

            // 오늘과 7일 전의 KPI 값
            const current = readValue(todayDay);

            const previous = previousDay
                ? readValue(previousDay)
                : null;

            // KPI 대표값 표시
            const valueEl = card.querySelector('.kpi-card__value');

            if (valueEl) {
                valueEl.textContent =
                    `${current.toLocaleString('ko-KR')}${isStatus ? '%' : ''}`;
            }

            // 증감률 렌더링
            this.renderChange(
                card,
                current,
                previous,
                isStatus
            );

            // 최근 7일 차트 데이터 생성
            const values = dates.map((date) => {
                const day = daysByDate.get(date);

                return day ? readValue(day) : null;
            });

            // 공통 미니차트 클래스 호출
            const canvas = card.querySelector(
                '.kpi-card__chart canvas'
            );

            if (canvas) {
                new SaiMiniChart(canvas).renderMini(values);
            }
        }
    }

    /**
     * 7일 전 대비 KPI 증감률 표시
     *
     * @param {HTMLElement} card - KPI 카드
     * @param {number} current - 오늘 값
     * @param {number|null} previous - 7일 전 값
     * @param {boolean} isStatus - 가동률 지표 여부
     * @returns {void}
     */
    renderChange(card, current, previous, isStatus) {
        const changeEl = card.querySelector('.kpi-card__change');

        if (!changeEl) return;

        // 기존 증감 상태 클래스 제거
        changeEl.classList.remove(
            'is-up',
            'is-down',
            'is-flat'
        );

        // 비교 데이터가 없거나 분모가 0인 경우
        if (
            previous === null ||
            (!isStatus && previous === 0)
        ) {
            changeEl.textContent = '—';
            return;
        }

        // 오늘과 7일 전의 차이
        const difference = current - previous;

        // 일반 지표는 변화율(%)
        // 가동률은 차이(%p)
        const change = isStatus
            ? difference
            : (difference / previous) * 100;

        // 소수점 자리 처리
        const rounded = Number(
            change.toFixed(isStatus ? 3 : 2)
        );

        // 증감률 텍스트
        const sign = rounded > 0 ? '+' : '';
        const unit = isStatus ? '%p' : '%';

        changeEl.textContent = `${sign}${rounded}${unit}`;

        // 증감 상태 클래스
        const trend = rounded > 0
            ? 'is-up'
            : rounded < 0
                ? 'is-down'
                : 'is-flat';

        changeEl.classList.add(trend);
    }
}




/* *********************************
 * Overview AI Usage
 * ********************************* */

/**
 * AI Usage Overview 클래스
 *
 * @description
 * - 최근 7일 토큰 사용량 합산
 * - 전체 토큰 한도 대비 사용률 계산
 * - 모델별 요청 비중 계산
 * - 공통 SaiProgress 클래스 호출
 */
class AiUsageOverview {
    /**
     * @param {HTMLElement} section - AI Usage 영역
     */
    constructor(section) {
        this.section = section;
    }

    /**
     * AI Usage 데이터 계산 및 렌더링
     *
     * @param {Array<Object>} days - 최근 7일 데이터
     * @returns {void}
     */
    render(days) {
        if (!days.length) return;

        let totalTokens = 0;
        let totalRequests = 0;

        const requestsByModel = new Map();

        // 최근 7일 데이터 합산
        for (const day of days) {
            totalTokens += day.tokens.total;
            totalRequests += day.requests.total;

            // 모델별 요청 수 합산
            for (const [modelId, usage] of Object.entries(day.models)) {
                const previous = requestsByModel.get(modelId) ?? 0;

                requestsByModel.set(
                    modelId,
                    previous + usage.requests
                );
            }
        }

        // HTML의 토큰 한도 읽기
        const quota = Number(this.section.dataset.tokenQuota);

        const hasQuota = Number.isFinite(quota) && quota > 0;

        // 전체 토큰 사용량 표시
        const currentEl = this.section.querySelector(
            '.sai-card__value--current'
        );

        const totalEl = this.section.querySelector(
            '.sai-card__value--total'
        );

        if (currentEl) {
            currentEl.textContent = totalTokens.toLocaleString('ko-KR');
        }

        if (totalEl) {
            totalEl.textContent = hasQuota
                ? quota.toLocaleString('ko-KR')
                : '—';
        }

        // 전체 토큰 사용률 계산
        const tokenPercent = hasQuota
            ? (totalTokens / quota) * 100
            : null;

        // 공통 Progress Bar 호출
        const mainProgress = this.section.querySelector(
            '.sai-progress__main'
        );

        new SaiProgress(
            mainProgress,
            '.sai-progress__text'
        ).render(tokenPercent);

        // 모델별 사용 비중 계산
        const modelRows = this.section.querySelectorAll(
            '.sai-progress__sub[data-model]'
        );

        for (const row of modelRows) {
            const modelId = row.dataset.model;

            const modelRequests = requestsByModel.get(modelId) ?? 0;

            const percent = totalRequests > 0
                ? (modelRequests / totalRequests) * 100
                : null;

            // 공통 Progress Bar 호출
            new SaiProgress(
                row,
                '.sai-progress__model-percent'
            ).render(percent);
        }
    }
}



/* *********************************
 * Overview KPI Initialize
 * ********************************* */

/**
 * Overview KPI 초기화
 *
 * @description
 * - KPI 영역 확인
 * - JSON 데이터 불러오기
 * - OverviewKpi 클래스 실행
 *
 * @returns {Promise<void>}
 */
async function initKpi() {
    const section = document.querySelector('.sai-content-grid--kpi');

    if (!section) return;

    const response = await fetch(OVERVIEW_DATA_URL);

    if (!response.ok) {
        throw new Error(
            `KPI 데이터 요청 실패 (${response.status})`
        );
    }

    const { daily } = await response.json();
    new OverviewKpi(section).render(daily);
}


/* *********************************
 * Overview AI Usage Initialize
 * ********************************* */

/**
 * AI Usage 초기화
 *
 * @description
 * - JSON 데이터 불러오기
 * - 오늘 포함 최근 7일 데이터 추출
 * - AiUsageOverview 클래스 실행
 *
 * @returns {Promise<void>}
 */
async function initAiUsage() {
    const section = document.querySelector('.js-ai-usage-overview');

    if (!section) return;

    const response = await fetch(OVERVIEW_DATA_URL);

    if (!response.ok) {
        throw new Error(
            `AI Usage 데이터 요청 실패 (${response.status})`
        );
    }

    const { daily } = await response.json();

    // 오늘 포함 최근 7일
    const today = getToday();
    const start = shiftDate(today, -6);

    const recentDays = daily.filter((day) =>
        day.date >= start && day.date <= today
    );

    // AI Usage 렌더링
    new AiUsageOverview(section).render(recentDays);
}




// KPI 초기화 실행
initKpi().catch(console.error);
initAiUsage().catch(console.error);