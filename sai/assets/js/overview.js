/** Overview 데이터 경로 */
const OVERVIEW_DATA_URL = '/sai/assets/data/dataList.json';

/**
 * 서울 기준 오늘 날짜를 반환한다.
 * 데이터의 날짜와 문자열로 비교할 수 있도록 sv-SE 로케일로 형식을 맞춘다.
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
 * 기준 날짜에서 지정한 일수만큼 이동한 날짜를 반환함
 * @param {string} date - 기준 날짜 문자열 (YYYY-MM-DD)
 * @param {number} days - 이동할 일수 (양수: 이후, 음수: 이전)
 * @returns {string} 이동한 날짜 문자열 (YYYY-MM-DD)
 */


function shiftDate(date, days) {
    const result = new Date(`${date}T00:00:00Z`);

    result.setUTCDate(result.getUTCDate() + days);

    return result.toISOString().slice(0, 10);
}


/**
 * Overview KPI 카드의 최신 값, 7일 전 대비 증감, 최근 7일 미니차트를 표시한다.
 *
 * @param {HTMLElement} section - KPI 카드를 포함하는 영역
 *
 * @description
 * - render(daily): 날짜 오름차순으로 정렬된 일별 데이터를 받아 카드를 갱신한다.
 * - renderChange(): 일반 지표는 변화율(%), 가동률은 차이(%p)를 표시한다.
 * - renderChart(): 최신 데이터 날짜를 포함한 최근 7일 값을 막대차트로 표시한다.
 */

class OverviewKpi {
    constructor(section) {
        this.section = section;
    }

    render(daily) {
        const latestDay = daily[daily.length - 1];
        if (!latestDay) return;

        const dates = Array.from({ length: 7 }, (_, index) =>
            shiftDate(latestDay.date, index - 6)
        );

        const daysByDate = new Map(daily.map((day) => [day.date, day]));
        const previousDate = shiftDate(latestDay.date, -7);
        const previousDay = daysByDate.get(previousDate);

        const getMetric = {
            total: (day) => day.users.total,
            requests: (day) => day.requests.total,

            projects: (day) => Object.values(day.projects)
                .filter((project) => project.requests > 0).length,

            status: (day) => day.status.uptime,
        };

        const cards = this.section.querySelectorAll('.kpi-card');

        for (const card of cards) {
            const metric = card.dataset.metric;
            const readValue = getMetric[metric];

            if (typeof readValue !== 'function') continue;

            const isStatus = metric === 'status';
            const latest = readValue(latestDay);
            const previous = previousDay ? readValue(previousDay) : null;

            const valueEl = card.querySelector('.kpi-card__value');
            if (valueEl) {
                const unit = isStatus ? '%' : '';
                valueEl.textContent = `${latest.toLocaleString('ko-KR')}${unit}`;
            }

            this.renderChange(card, latest, previous, isStatus);

            const values = dates.map((date) => {
                const day = daysByDate.get(date);
                return day ? readValue(day) : null;
            });

            this.renderChart(card, dates, values);
        }
    }

    renderChange(card, latest, previous, isStatus) {
        const changeEl = card.querySelector('.kpi-card__change');
        if (!changeEl) return;

        changeEl.classList.remove('is-up', 'is-down', 'is-flat');

        if (previous === null || (!isStatus && previous === 0)) {
            changeEl.textContent = '—';
            return;
        }

        const difference = latest - previous;
        const change = isStatus ? difference : (difference / previous) * 100;

        const rounded = Number(change.toFixed(isStatus ? 3 : 2));
        const sign = rounded > 0 ? '+' : '';
        const unit = isStatus ? '%p' : '%';

        changeEl.textContent = `${sign}${rounded}${unit}`;

        let trend = 'is-flat';
        if (rounded > 0) trend = 'is-up';
        if (rounded < 0) trend = 'is-down';

        changeEl.classList.add(trend);
    }

    renderChart(card, dates, values) {
        const canvas = card.querySelector('.kpi-card__chart canvas');
        if (!canvas || typeof Chart === 'undefined') return;

        const colors = {
            purple: '124, 58, 237',
            blue: '37, 99, 235',
            orange: '234, 88, 12',
            green: '22, 163, 74',
        };

        const rgb = colors[card.dataset.color] ?? colors.purple;

        const numbers = values.filter(Number.isFinite);
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);

        const backgroundColors = values.map((value) => {
            if (!Number.isFinite(value)) return 'transparent';

            const ratio = min === max ? 1 : (value - min) / (max - min);
            const opacity = 0.25 + ratio * 0.75;

            return `rgba(${rgb}, ${opacity})`;
        });

        Chart.getChart(canvas)?.destroy();

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: dates.map((date) => date.slice(5)),
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderRadius: 3,
                    maxBarThickness: 12,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { display: false, beginAtZero: true },
                },
                plugins: {
                    legend: { display: false },
                },
            },
        });
    }
}


/**
 * 최근 7일간의 AI 사용량을 집계해 토큰 사용량, 한도 대비 사용률,
 * 모델별 요청 비중을 표시한다.
 *
 * @param {HTMLElement} section - AI 사용량 카드와 진행 막대를 포함하는 영역
 *
 * @description
 * - render(days): 최근 7일로 필터링된 일별 데이터를 받아 토큰과 요청 수를 합산한다.
 * - renderProgress(container, textSelector, percent): 대상 영역의 막대와
 *   비율 텍스트를 갱신한다. 100%를 넘으면 막대 너비만 100%로 제한하며,
 *   비율을 계산할 수 없으면 텍스트에 '—'를 표시한다.
 * - 두 메서드는 화면을 갱신하며 반환값은 없다.
 */

class AiUsageOverview {
    constructor(section) {
        this.section = section;
    }

    render(days) {
        if (!days.length) return;

        let totalTokens = 0;
        let totalRequests = 0;
        const requestsByModel = new Map();

        for (const day of days) {

            totalTokens += day.tokens.total;
            totalRequests += day.requests.total;

            for (const [modelId, usage] of Object.entries(day.models)) {
                const previous = requestsByModel.get(modelId) ?? 0;
                requestsByModel.set(modelId, previous + usage.requests);
            }
        }

        const quota = Number(this.section.dataset.tokenQuota);
        const hasQuota = Number.isFinite(quota) && quota > 0;

        this.section.querySelector('.sai-card__value--current').textContent =
            totalTokens.toLocaleString('ko-KR');

        this.section.querySelector('.sai-card__value--total').textContent =
            hasQuota ? quota.toLocaleString('ko-KR') : '—';

        const tokenPercent = hasQuota ? (totalTokens / quota) * 100 : null;

        this.renderProgress(
            this.section.querySelector('.sai-progress__main'),
            '.sai-progress__text',
            tokenPercent
        );

        const modelRows = this.section.querySelectorAll('.sai-progress__sub[data-model]');

        for (const row of modelRows) {
            const modelRequests = requestsByModel.get(row.dataset.model) ?? 0;
            const percent = totalRequests > 0
                ? (modelRequests / totalRequests) * 100
                : null;

            this.renderProgress(row, '.sai-progress__model-percent', percent);
        }
    }

    renderProgress(container, textSelector, percent) {
        const bar = container.querySelector('.sai-progress__bar');
        const text = container.querySelector(textSelector);

        const width = Math.min(percent ?? 0, 100);
        bar.style.setProperty('--progress', `${width}%`);

        text.textContent = percent === null
            ? '—'
            : `${percent.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`;
    }
}


/* ==================================================
 * Overview 실행
 * ================================================== */

async function initOverview() {
    const kpiSection = document.querySelector('.sai-content-grid--kpi');
    const usageSection = document.querySelector('.js-ai-usage-overview');

    if (!kpiSection && !usageSection) return;

    const response = await fetch(OVERVIEW_DATA_URL);
    if (!response.ok) {
        throw new Error(`Overview 데이터 요청 실패 (${response.status})`);
    }

    const { daily } = await response.json();
    const today = getToday();

    // console.log(`오늘은 ${today}`);

    const availableDays = daily.filter((day) => day.date <= today);

    if (kpiSection) {
        const sortedDays = [...availableDays].sort((a, b) =>
            a.date.localeCompare(b.date)
        );
        new OverviewKpi(kpiSection).render(sortedDays);
    }

    if (usageSection) {
        const start = shiftDate(today, -6);
        const recentDays = availableDays.filter((day) => day.date >= start);

        new AiUsageOverview(usageSection).render(recentDays);
    }
}

initOverview().catch((error) => console.error(error));

