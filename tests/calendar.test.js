// Run with: node tests/calendar.test.js
const assert = require('assert');
const { weekday, jdn, yearDD, ddDate, isLeap, mod } = require('../js/calendar.js');

// Doomsday shortcut matches the reference day count for every year in both calendars.
for (let y = 1; y <= 9999; y++) {
  for (const cal of ['J', 'G']) {
    assert.strictEqual(yearDD(y, cal), mod(jdn(y, 4, 4, cal) + 1, 7), `year ${y} ${cal}`);
    for (let m = 1; m <= 12; m++) {
      const d = ddDate(m, isLeap(y, cal));
      assert.strictEqual(mod(jdn(y, m, d, cal) + 1, 7), yearDD(y, cal), `${y}-${m} ${cal}`);
    }
  }
}

// Known historical dates (0 = Sunday).
const known = [
  [[1066, 10, 14], 6], // Battle of Hastings, Saturday (Julian)
  [[1582, 10, 4], 4],  // last Julian day, Thursday
  [[1582, 10, 15], 5], // first Gregorian day, Friday
  [[1776, 7, 4], 4],   // Thursday
  [[1969, 7, 20], 0],  // Moon landing, Sunday
  [[2000, 1, 1], 6],   // Saturday
];
for (const [[y, m, d], w] of known) assert.strictEqual(weekday(y, m, d), w, `${y}-${m}-${d}`);

console.log('All calendar tests passed.');
