/**
 * Liturgical Calendar Logic
 */

// Colors Mapping for display
const COLOR_INFO = {
    purple: { name: '보라색 (Purple)', meaning: '기다림, 회개, 절제, 고난, 왕의 오심' },
    white: { name: '흰색 (White)', meaning: '성결, 기쁨, 빛, 순결, 축제, 그리스도의 영광' },
    green: { name: '초록색 (Green)', meaning: '생명, 희망, 평화, 신앙의 성장, 성숙' },
    red: { name: '빨간색 (Red)', meaning: '성령의 불, 열정, 사랑, 순교, 교회의 탄생' },
};

// Season Display Names & Colors (Logic Mapping)
const SEASON_CONFIG = {
    ADVENT: { name: '대림절', color: 'purple', title: '대림절기\n(Advent)' },
    CHRISTMAS: { name: '성탄절', color: 'white', title: '성탄절기\n(Christmastide)' },
    EPIPHANY: { name: '주현절', color: 'green', title: '주현절기\n(Epiphany)' }, // Usually Green after Baptism
    LENT: { name: '사순절', color: 'purple', title: '사순절기\n(Lent)' },
    EASTER: { name: '부활절', color: 'white', title: '부활절기\n(Eastertide)' },
    PENTECOST: { name: '성령강림절', color: 'red', title: '성령강림절\n(Pentecost)' },
    ORDINARY: { name: '창조절 (평주일)', color: 'green', title: '평주 (창조절기)\n(Ordinary Time)' },
};

/**
 * Calculates Easter date for a given year using computus algorithm
 */
function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get Liturgical Details
 */
function getLiturgicalDetails(date) {
    const year = date.getFullYear();
    const easter = getEasterDate(year);
    const christmas = new Date(year, 11, 25);
    const time = date.getTime();

    // Helper to format season Sunday name
    // e.g., "Easter + 2 weeks" -> "Easter 3rd Sunday"?
    // For MVP, we adhere to the basic mapping and improving names if possible.

    // Helper for Korean Ordinals (Covering enough weeks for Pentecost season)
    function getKoreanOrdinal(num) {
        const ordinals = [
            '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째',
            '열한째', '열두째', '열셋째', '열넷째', '열다섯째', '열여섯째', '열일곱째', '열여덟째', '열아홉째', '스무째',
            '스물한째', '스물두째', '스물셋째', '스물넷째', '스물다섯째', '스물여섯째', '스물일곱째', '스물여덟째', '스물아홉째', '서른째'
        ];
        return ordinals[num - 1] || `${num}째`;
    }

    // 1. Advent (Nov/Dec)
    const nov27 = new Date(year, 10, 27);
    const diff = (7 - nov27.getDay()) % 7;
    const advent1 = addDays(nov27, diff); // Advent 1st Sunday

    if (time >= advent1.getTime() && time < new Date(year, 11, 24, 18).getTime()) {
        const weekNum = Math.floor((time - advent1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return {
            ...SEASON_CONFIG.ADVENT,
            fullName: `대림절 ${getKoreanOrdinal(weekNum)} 주일`
        };
    }

    // 2. Christmas Season (Dec 25 - Jan 5) -- Fixed Logic
    // We need to check if the current date is in the Christmas season relative to Dec 25.
    // Christmas Season ends on Epiphany (Jan 6).
    // If we are in Jan, we check previous year's Christmas.
    // If we are in Dec, we check this year's Christmas.

    let christmasStartYear = year;
    if (date.getMonth() === 0) { // January
        christmasStartYear = year - 1;
    }

    // Check if within Christmas Season (Dec 25 of startYear to Jan 5 of startYear+1)
    const christmasDate = new Date(christmasStartYear, 11, 25);
    const epiphanyDate = new Date(christmasStartYear + 1, 0, 6); // Jan 6

    if (time >= christmasDate.getTime() && time < epiphanyDate.getTime()) {
        // Calculate weeks from Dec 25
        // "First Sunday after Christmas"
        // If Dec 25 is Sunday, the next Sunday is "First Sunday after Christmas"? 
        // Usually, if Christmas is Sunday, that IS Christmas Sunday.
        // The one AFTER is First Sunday AFTER Christmas.

        // Logic: Find the FIRST Sunday after ChristmasDay.
        let firstSundayAfterChristmas = new Date(christmasDate);
        while (firstSundayAfterChristmas.getDay() !== 0) {
            firstSundayAfterChristmas.setDate(firstSundayAfterChristmas.getDate() + 1);
        }
        // If Dec 25 IS Sunday, strict "After" means +7 days? 
        // Liturgically: "Sunday After Christmas". If Christmas is Sunday, the Feast of Holy Family is usually next Friday or Dec 30?
        // Simplified: If Dec 25 is Sunday, that is Christmas Day. The NEXT Sunday is 1st Sunday after.
        // If Dec 25 is not Sunday, the immediate next Sunday is 1st Sunday after.
        if (firstSundayAfterChristmas.getTime() === christmasDate.getTime()) {
            firstSundayAfterChristmas.setDate(firstSundayAfterChristmas.getDate() + 7);
        }

        if (time < firstSundayAfterChristmas.getTime()) {
            // Before the first Sunday: "성탄절 후" (Days between Christmas and 1st Sunday)
            // Or if it IS Christmas day?
            if (date.getMonth() === 11 && date.getDate() === 25) return { ...SEASON_CONFIG.CHRISTMAS, fullName: '성탄절' };
            return { ...SEASON_CONFIG.CHRISTMAS, fullName: '성탄절 후 평일' };
        }

        // Calculate week number from First Sunday After Christmas
        const daysDiff = (time - firstSundayAfterChristmas.getTime()) / (1000 * 60 * 60 * 24);
        const weekNum = Math.floor(daysDiff / 7) + 1;

        return {
            ...SEASON_CONFIG.CHRISTMAS,
            fullName: `성탄절 후 ${getKoreanOrdinal(weekNum)} 주일`
        };
    }

    // 3. Epiphany (Jan 6)
    // Epiphany usually Jan 6.
    // Season after Epiphany (Ordinary Time) starts after Baptism of Lord (Sunday after Epiphany).
    // User request context implies checking Jan 11 is "주현절 후 제1주일" from previous test?
    // Let's stick to standard map but apply ordinals.
    const ashWednesday = addDays(easter, -46);
    const epiphany = new Date(year, 0, 6);

    if (time >= epiphany.getTime() && time < ashWednesday.getTime()) {
        if (date.getMonth() === 0 && date.getDate() === 6) {
            return { ...SEASON_CONFIG.EPIPHANY, color: 'white', fullName: '주현절 (Epiphany)' };
        }
        // Count weeks after Epiphany
        const weekNum = Math.floor((time - epiphany.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return { ...SEASON_CONFIG.EPIPHANY, fullName: `주현절 후 ${getKoreanOrdinal(weekNum)} 주일` };
    }

    // 4. Lent
    if (time >= ashWednesday.getTime() && time < easter.getTime()) {
        const weekNum = Math.floor((time - ashWednesday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return { ...SEASON_CONFIG.LENT, fullName: `사순절 ${getKoreanOrdinal(weekNum)} 주일` };
    }

    // 5. Easter
    const pentecost = addDays(easter, 49);
    if (time >= easter.getTime() && time <= pentecost.getTime()) {
        if (time === easter.getTime()) return { ...SEASON_CONFIG.EASTER, fullName: '부활절 (Easter)' };
        if (time === pentecost.getTime()) return { ...SEASON_CONFIG.PENTECOST, fullName: '성령강림절' };

        const weekNum = Math.floor((time - easter.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return { ...SEASON_CONFIG.EASTER, fullName: `부활절 ${getKoreanOrdinal(weekNum)} 주일` };
    }

    // 6. Season After Pentecost (Ordinary Time)
    // Starts after Pentecost Sunday.
    // Trinity Sunday is the 1st Sunday after Pentecost (White).
    // Subsequent Sundays are "2nd Sunday after Pentecost", etc. (Green).

    const trinitySunday = addDays(pentecost, 7);

    // Check if it's Season After Pentecost (up to Advent)
    // Note: Advent logic is at the top, but we need to ensure we don't overlap if we iterate.
    // The main flow returns early if Advent, so we are safe to assume if we reached here, it's not Advent yet?
    // Wait, getLiturgicalDetails implementation has Advent check at step 1.
    // But Advent check is based on "Is it Nov/Dec and close to Christmas?".
    // We should double check bounds: > Pentecost AND < Advent.

    // Recalculate Advent1 for safety in this block scope if needed, or rely on flow.
    // The function returns early. If we are here, we passed Advent check?
    // NO. Advent check is specific to late year.
    // If date is in October, Step 1 returns false. We fall through.
    // We passed Christmas, Epiphany, Lent, Easter.
    // So we are likely in Ordinary Time (or pre-Lent if logic failed, but Epiphany covers pre-Lent).
    // The only gap is "Summer/Fall".

    if (time > pentecost.getTime()) {
        const weekNum = Math.floor((time - pentecost.getTime()) / (7 * 24 * 60 * 60 * 1000));
        // weekNum=1 means 1 week after (Trinity).

        // Trinity Sunday (1st Sunday after Pentecost)
        if (weekNum === 1) {
            return {
                ...SEASON_CONFIG.ORDINARY,
                color: 'white', // Trinity is White
                fullName: '성령강림 후 첫째 주일 (삼위일체 주일)',
                title: '성령강림절기\n(Season after Pentecost)' // Updating title context
            };
        }

        // Other Sundays
        return {
            ...SEASON_CONFIG.ORDINARY,
            fullName: `성령강림 후 ${getKoreanOrdinal(weekNum)} 주일`,
            title: '성령강림절기\n(Season after Pentecost)'
        };
    }

    // Fallback (Should be covered by Epiphany or Pentecost logic, but just in case)
    return { ...SEASON_CONFIG.ORDINARY, fullName: '평주일' };
}


/**
 * Date Logic: Get N-th Sunday of Month
 */
function getNthSunday(year, month, n) {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    let day = firstDayOfMonth.getDay();
    // 0 = Sunday.
    // Days to add to reach first Sunday:
    let diff = (7 - day) % 7; // if day is 0(Sun), diff is 0. If day is 1(Mon), diff is 6.

    let firstSunday = firstDayOfMonth.getDate() + diff;

    // Nth Sunday
    let targetDate = firstSunday + (n - 1) * 7;

    // Check overflow
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    if (targetDate > lastDayOfMonth) {
        return null; // The month doesn't have an N-th Sunday
    }

    return new Date(year, month - 1, targetDate);
}


// Application Logic
document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const yearInput = document.getElementById('yearInput');
    const monthInput = document.getElementById('monthInput');
    const weekBtns = document.querySelectorAll('.week-btn');

    // Output Elements
    const seasonNameEl = document.getElementById('seasonName');
    const dateDisplayEl = document.getElementById('dateDisplay');
    const colorNameEl = document.getElementById('colorName');
    const seasonTitleEl = document.getElementById('seasonTitle');
    const colorMeaningEl = document.getElementById('colorMeaning');
    const rootEl = document.documentElement;

    // State
    let state = {
        year: 2026,
        month: 1,
        week: 1
    };

    function render() {
        const date = getNthSunday(state.year, state.month, state.week);

        if (!date) {
            seasonNameEl.textContent = "해당 주가 없습니다";
            dateDisplayEl.textContent = "-";
            return;
        }

        const season = getLiturgicalDetails(date);
        const colorInfo = COLOR_INFO[season.color];

        // Update Text
        seasonNameEl.textContent = season.fullName;
        seasonTitleEl.innerHTML = season.title.replace('\n', '<br/>');

        // Date Format: "2026년 1월 4일" (Removed weekday as requested)
        dateDisplayEl.textContent = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

        // Color Info
        colorNameEl.textContent = colorInfo.name;
        colorMeaningEl.textContent = colorInfo.meaning;

        // CSS Variable Update for Background Blur
        // User Request: Christmas/Easter must be WHITE, not Yellow/Gold.
        const hexMap = { purple: '#6b21a8', white: '#ffffff', green: '#15803d', red: '#dc2626' };
        const color = hexMap[season.color];

        rootEl.style.setProperty('--liturgy-color', color);

        // Apply to Card Background
        const seasonCard = seasonTitleEl.closest('.info-card');
        seasonCard.style.backgroundColor = color;
        seasonCard.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';

        // Adjust Text Color for Contrast & Borders
        const labelEl = seasonCard.querySelector('.card-label');

        if (season.color === 'white') {
            // White Background -> Dark Text
            seasonCard.style.color = '#1e293b'; // Slate-800
            labelEl.style.color = '#64748b'; // Slate-500
            // Add a subtle border or strong shadow for White card specifically so it doesn't disappear
            seasonCard.style.border = '2px solid #e2e8f0';
            seasonCard.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
        } else {
            // Dark Background -> White Text
            seasonCard.style.color = '#ffffff';
            labelEl.style.color = 'rgba(255, 255, 255, 0.8)';
            seasonCard.style.border = 'none'; // Remove border for colored cards
            seasonCard.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)'; // Slightly stronger shadow
        }

        // Reset local color override if any
        seasonTitleEl.style.color = 'inherit';
    }

    // Listeners
    yearInput.addEventListener('input', (e) => {
        state.year = parseInt(e.target.value);
        render();
    });

    monthInput.addEventListener('change', (e) => {
        state.month = parseInt(e.target.value);
        render();
    });

    weekBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Toggle
            weekBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // State Update
            state.week = parseInt(btn.dataset.week);
            render();
        });
    });

    // Initial Render
    render();
});
