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
 * Analytics 캘린더를 연결하고 선택일이 바뀔 때마다 조회 기간을 전달한다.
 *
 * @param {Function} render - 현재 기간과 비교 기간을 받아 화면을 갱신하는 함수
 * @returns {Promise<void>}
 */

async function initAnalyticsCalendar(render) {
    const calendar = document.querySelector('.js-analytics-date');
    const periodEl = document.querySelector('.js-analytics-period');
    if (!calendar) return;

    const response = await fetch('/sai/assets/data/dataList.json');
    if (!response.ok) {
        throw new Error(`Analytics 데이터 요청 실패 (${response.status})`);
    }

    const { daily } = await response.json();
    const days = [...daily].sort((a, b) => a.date.localeCompare(b.date));
    if (!days.length) return;

    calendar.min = days[0].date;
    calendar.max = days[days.length - 1].date;

    const today = getToday();
    if (today < calendar.min) {
        calendar.value = calendar.min;
    } else if (today > calendar.max) {
        calendar.value = calendar.max;
    } else {
        calendar.value = today;
    }

    function update() {
        const endDate = calendar.value;
        if (!endDate || !calendar.validity.valid) return;

        const startDate = shiftDate(endDate, -6);
        const previousStart = shiftDate(endDate, -13);
        const previousEnd = shiftDate(endDate, -7);

        const currentDays = days.filter(
            ({ date }) => date >= startDate && date <= endDate
        );

        const previousDays = days.filter(
            ({ date }) => date >= previousStart && date <= previousEnd
        );

        if (periodEl) {
            periodEl.textContent = `${startDate} ~ ${endDate}`;
        }

        render({ startDate, endDate, currentDays, previousDays, canCompare: currentDays.length === 7 && previousDays.length === 7, });
    }
    calendar.dispatchEvent(new Event('change', { bubbles: true }));
    calendar.addEventListener('change', update);
    update();
}

initAnalyticsCalendar(({ currentDays, previousDays, canCompare }) => {
    console.log('현재 기간', currentDays.map((day) => day.date));
    console.log('비교 기간', previousDays.map((day) => day.date));
    console.log('증감률 표시 가능', canCompare);
}).catch(console.error);

