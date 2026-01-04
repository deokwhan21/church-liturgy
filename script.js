/**
 * Liturgical Calendar Logic
 */

// Colors
const COLORS = {
    PURPLE: '#6b21a8', // Advent, Lent
    WHITE: '#f0f9ff',  // Christmas, Easter (using a very light blue/white for text contrast or handling inverse) - actually for background we need a rich color. 
                       // Let's use Gold/Yellow/White theme. For 'White' seasons, usually Gold or White is used.
                       // Since we want dynamic background, a Light Gold or Pure White might be too bright.
                       // Maybe a rich Gold or Off-White. Let's define CSS variables mapping later.
    GREEN: '#15803d',  // Ordinary Time
    RED: '#dc2626',    // Pentecost
    ROSE: '#be123c',   // Gaudete/Laetare (Optional, staying simple first)
};

const SEASON_CONFIG = {
    ADVENT: { name: '대림절', color: 'purple', desc: '기다림, 회개, 왕의 오심' },
    CHRISTMAS: { name: '성탄절', color: 'white', desc: '기쁨, 빛, 순결, 축제' },
    EPIPHANY: { name: '주현절', color: 'green', desc: '세상에 나타나심, 성장과 선교' }, // Weekdays are green usually after baptism of Lord
    LENT: { name: '사순절', color: 'purple', desc: '회개, 절제, 고난' },
    EASTER: { name: '부활절', color: 'white', desc: '승리, 기쁨, 영생' },
    PENTECOST: { name: '성령강림절', color: 'red', desc: '성령의 불, 열정, 순교, 교회' },
    ORDINARY: { name: '창조절 (평주일)', color: 'green', desc: '신앙의 성장, 소망, 성숙' },
};

/**
 * Calculates Easter date for a given year using computus algorithm
 * @param {number} year 
 * @returns {Date} Easter Sunday
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

/**
 * Helper to add days to a date
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Helper to get Sunday before a date (or today if Sunday)
 * Actually Liturgical weeks usually start on Sunday.
 */
function getLiturgicalDetails(date) {
    const year = date.getFullYear();
    const easter = getEasterDate(year);
    const christmas = new Date(year, 11, 25); // Dec 25
    
    // Advent Calculation: 4 Sundays before Christmas
    // Find Christmas day of week
    const christmasDay = christmas.getDay(); // 0 is Sunday
    // if Christmas is Sunday, 4th Sunday of Advent is Dec 18? No, Dec 25 is Christmas.
    // Advent 1 is 4 Sundays before Dec 25.
    // Simplest: Find Sunday closest to Nov 30 (St Andrew).
    // Actually: Count back 4 Sundays from Dec 25.
    // If Dec 25 is Sunday, Advent 4 is Dec 18.
    // If Dec 25 is Monday, Advent 4 is Dec 24 (Sunday).
    // Formula: Christmas - (Christmas.day + 21 or something?)
    // Let's rely on comparisons for now.
    
    // Significant dates relative to Easter
    const ashWednesday = addDays(easter, -46);
    const pentecost = addDays(easter, 49);
    
    const time = date.getTime();
    
    // 1. Advent & Christmas (Late Year)
    // Calculate First Sunday of Advent for THIS year
    // Nov 27 is earliest possible Advent 1, Dec 3 is latest.
    const nov27 = new Date(year, 10, 27);
    const diff = (7 - nov27.getDay()) % 7; // days to next Sunday
    const advent1 = addDays(nov27, diff); // This is Advent 1
    
    if (time >= advent1.getTime() && time < new Date(year, 11, 24, 18).getTime()) { // Until Christmas Eve
        return {
            ...SEASON_CONFIG.ADVENT,
            detail: '대림절 기간' // Could calculate specific week
        };
    }
    
    if (time >= new Date(year, 11, 25).getTime() || (date.getMonth() === 0 && date.getDate() <= 5)) {
        // Christmas Season (Dec 25 - Jan 5)
        // Handled carefully across year boundary
        // If Jan, we are in year X, checking year X Christmas (Dec). Wait.
        // If date is Jan 2024, year is 2024.
        // The check above (Dec 25) works for Late 2024.
        // The check (Jan <= 5) works for Early 2024.
        // BUT, Jan 2024 needs to check Epiphany of 2024.
        return SEASON_CONFIG.CHRISTMAS;
    }
    
    // 2. Epiphany (Jan 6 onwards)
    const epiphany = new Date(year, 0, 6);
    if (time >= epiphany.getTime() && time < ashWednesday.getTime()) {
        if (time === epiphany.getTime()) return { ...SEASON_CONFIG.EPIPHANY, color: 'white', detail: '주현절 당일' };
        return SEASON_CONFIG.EPIPHANY; // Ordinary time after Baptism actually, but often lumped or distinct. Simplified to Green/Epiphany season.
    }
    
    // 3. Lent
    if (time >= ashWednesday.getTime() && time < easter.getTime()) {
         return SEASON_CONFIG.LENT;
    }
    
    // 4. Easter Season
    if (time >= easter.getTime() && time <= pentecost.getTime()) { // Inclusive of Pentecost? Pentecost is Red.
        if (date.getDate() === pentecost.getDate() && date.getMonth() === pentecost.getMonth()) {
            return SEASON_CONFIG.PENTECOST;
        }
        return SEASON_CONFIG.EASTER;
    }
    
    // 5. Pentecost (Day only) - Covered above if exact match, but let's be safe
    // Actually Pentecost season? No, usually Ordinary time follows.
    
    // 6. Ordinary Time (The rest)
    // After Pentecost, before Advent
    // And Before Lent (After Epiphany) - covered by Epiphany 'season' logic above generally green
    
    return SEASON_CONFIG.ORDINARY;
}

// Export for usage
window.LiturgicalApp = {
    getLiturgicalDetails
};
