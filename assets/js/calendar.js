/*
  Liturgical Calendar: date logic
  Roman Catholic calendar, US rules. See README.md.

  No page code here, only dates, so test.html can check it on its own.

  Dates are handled as "day numbers" (whole days since 1970-01-01,
  counted in UTC) so that daylight saving time can never shift a day.
*/

var LiturgicalCalendar = (function () {

  var DAY = 24 * 60 * 60 * 1000;

  // year, month (1–12), day → day number
  function dayNumber(year, month, day) {
    return Math.round(Date.UTC(year, month - 1, day) / DAY);
  }

  // day number → 0 (Sunday) … 6 (Saturday)
  function weekday(n) {
    return new Date(n * DAY).getUTCDay();
  }

  // day number → { year, month, day }
  function toDate(n) {
    var d = new Date(n * DAY);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }

  // Easter Sunday (Gregorian), the "Anonymous Gregorian" Computus
  function easter(year) {
    var a = year % 19,
        b = Math.floor(year / 100),
        c = year % 100,
        d = Math.floor(b / 4),
        e = b % 4,
        f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4),
        k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31),
        day = ((h + l - 7 * m + 114) % 31) + 1;
    return dayNumber(year, month, day);
  }

  // First Sunday of Advent: the 4th Sunday before Christmas
  function adventStart(year) {
    var christmas = dayNumber(year, 12, 25);
    var sundayBefore = christmas - (weekday(christmas) || 7); // the last Sunday before Dec 25
    return sundayBefore - 21;
  }

  // US: Epiphany is the Sunday between Jan 2 and Jan 8
  function epiphany(year) {
    var jan2 = dayNumber(year, 1, 2);
    return jan2 + ((7 - weekday(jan2)) % 7);
  }

  // Baptism of the Lord, the last day of the Christmas season.
  // The Sunday after Epiphany, or the Monday right after it
  // when Epiphany falls on Jan 7 or 8.
  function baptismOfTheLord(year) {
    var e = epiphany(year);
    return toDate(e).day >= 7 ? e + 1 : e + 7;
  }

  var NAMES = {
    "advent": "Advent",
    "christmas": "Christmas",
    "ordinary-time": "Ordinary Time",
    "lent": "Lent",
    "palm-sunday": "Palm Sunday",
    "triduum": "Triduum",
    "good-friday": "Good Friday",
    "easter": "Easter",
    "pentecost": "Pentecost"
  };

  // The heart of it: which season (or red day) is this date?
  // Returns { key: "lent", name: "Lent" }
  function seasonFor(year, month, day) {
    var d = dayNumber(year, month, day);
    var E = easter(year);
    var key;

    if (d >= dayNumber(year, 12, 25)) key = "christmas";
    else if (d >= adventStart(year)) key = "advent";
    else if (d <= baptismOfTheLord(year)) key = "christmas";
    else if (d < E - 46) key = "ordinary-time";   // before Ash Wednesday
    else if (d === E - 7) key = "palm-sunday";
    else if (d < E - 3) key = "lent";             // until Holy Thursday
    else if (d === E - 2) key = "good-friday";
    else if (d < E) key = "triduum";              // Holy Thursday, Holy Saturday
    else if (d === E + 49) key = "pentecost";
    else if (d < E + 49) key = "easter";
    else key = "ordinary-time";                   // until Advent

    return { key: key, name: NAMES[key] };
  }

  return {
    seasonFor: seasonFor,
    easter: easter,
    adventStart: adventStart,
    epiphany: epiphany,
    baptismOfTheLord: baptismOfTheLord,
    dayNumber: dayNumber,
    toDate: toDate,
    NAMES: NAMES
  };

})();

// lets the tests also run outside a browser (Node)
if (typeof module !== "undefined") module.exports = LiturgicalCalendar;
