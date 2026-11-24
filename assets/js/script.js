/*
  Liturgical Calendar: the page
  Shows today's season (or red day) and changes it at local midnight
  with a slow fade. The date math lives in calendar.js.

  Testing:
    ?date=2027-05-16         show any date
    ?date=2026-11-28&next    show that date, then after 5 seconds fade
                             to the next day, as it would at midnight
    the dot, top right       opens a dropdown of every season in the church
                             year; choosing one goes to its first day (?date=)
*/

$(function () {

  var FADE = 60 * 1000;            // matches the 60s CSS transition in style.css
  var ALL_KEYS = Object.keys(LiturgicalCalendar.NAMES).join(" ");

  var $body = $("body");
  var $name = $("#time i");

  var params = new URLSearchParams(window.location.search);
  var fixedDate = parseDate(params.get("date"));   // null unless ?date= is given
  var shown = null;                                // the date currently on screen

  // "2027-05-16" → { year, month, day }, or null
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? { year: +m[1], month: +m[2], day: +m[3] } : null;
  }

  // the viewer's local date
  function today() {
    var now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }

  function sameDay(a, b) {
    return a && b && a.year === b.year && a.month === b.month && a.day === b.day;
  }

  function show(date, fade) {
    var season = LiturgicalCalendar.seasonFor(date.year, date.month, date.day);
    var nameChanges = $name.text() !== season.name;

    // colors: swapping the class is enough; CSS does the 60s fade
    $body.removeClass(ALL_KEYS).addClass(season.key);

    // name: fade the old one out, swap it, fade the new one in
    if (fade && nameChanges) {
      $name.stop(true).animate({ opacity: 0 }, FADE / 2, function () {
        $name.text(season.name).animate({ opacity: 1 }, FADE / 2);
      });
    } else {
      $name.stop(true).css("opacity", 1).text(season.name);
    }

    shown = date;
    buildMenu(date);
  }

  // --- testing easter egg: the dot and its <select> ---

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function isoDate(n) {
    var d = LiturgicalCalendar.toDate(n);
    return d.year + "-" + String(d.month).padStart(2, "0") + "-" + String(d.day).padStart(2, "0");
  }

  function shortDate(n) {
    var d = LiturgicalCalendar.toDate(n);
    return MONTHS[d.month - 1] + " " + d.day;
  }

  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function longDate(n) {
    var d = LiturgicalCalendar.toDate(n);
    return WEEKDAYS[new Date(n * 864e5).getUTCDay()] + ", " + MONTHS[d.month - 1] + " " + d.day + ", " + d.year;
  }

  // plain divider before the next-year row
  var DIVIDER = "----------------";

  function churchYear(startYear) {
    return startYear + "–" + String(startYear + 1).slice(2);   // e.g. 2025–26
  }

  // Fills the dropdown for the church year that contains `date`
  // (Advent to the day before the next Advent):
  //
  //   Viewing Tue, Nov 24, 2026 (today)      ← not choosable
  //   ← 2024–25
  //   ----- 2025 -----                        ← year divider, not choosable
  //   Advent ... Nov 30 – Dec 24
  //   ...
  //   Ordinary Time ... May 25 – Nov 28      ← the season being viewed (selected)
  //   ----------------                        ← plain divider, not choosable
  //   → 2026–27
  //   → Today
  //
  // Each choosable option's value is a date to go to; "Today" has no value.
  function buildMenu(date) {
    var C = LiturgicalCalendar;
    var n = C.dayNumber(date.year, date.month, date.day);
    var startYear = n >= C.adventStart(date.year) ? date.year : date.year - 1;
    var start = C.adventStart(startYear);
    var next = C.adventStart(startYear + 1);
    var isToday = sameDay(date, today());

    // walk the church year day by day, grouping days into seasons and red days
    var ranges = [];
    for (var day = start; day < next; day++) {
      var d = C.toDate(day);
      var season = C.seasonFor(d.year, d.month, d.day);
      var last = ranges[ranges.length - 1];
      if (last && last.key === season.key) last.end = day;
      else ranges.push({ key: season.key, name: season.name, start: day, end: day });
    }

    var $menu = $("#menu").empty();
    function option(text, value, disabled) {
      return $("<option>").text(text).val(value).prop("disabled", !!disabled).appendTo($menu);
    }

    option("Viewing " + longDate(n) + (isToday ? " (today)" : ""), "", true);
    option("← " + churchYear(startYear - 1), isoDate(C.adventStart(startYear - 1)));

    var year = null;
    ranges.forEach(function (r) {
      var startsIn = C.toDate(r.start).year;
      if (startsIn !== year) {
        option("----- " + startsIn + " -----", "", true);
        year = startsIn;
      }
      var current = n >= r.start && n <= r.end;
      var range = r.start === r.end ? shortDate(r.start) : shortDate(r.start) + " – " + shortDate(r.end);
      option(r.name + " ... " + range, isoDate(r.start))
        .prop("selected", current);
    });

    option(DIVIDER, "", true);
    option("→ " + churchYear(startYear + 1), isoDate(next));
    option("→ Today", "");
  }

  // choosing an option goes to that date (or back to today)
  $("#menu").on("change", function () {
    var value = $(this).val();
    window.location.href = window.location.pathname + (value ? "?date=" + value : "");
  });

  // 1. on load: show the date right away, no fade
  show(fixedDate || today(), false);

  // 2. turn the CSS fade on only after that first paint
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      $body.addClass("can-fade");
    });
  });

  // 3a. testing: ?date=…&next fades to the following day after 5 seconds
  if (fixedDate && params.has("next")) {
    setTimeout(function () {
      var n = LiturgicalCalendar.dayNumber(fixedDate.year, fixedDate.month, fixedDate.day);
      show(LiturgicalCalendar.toDate(n + 1), true);
    }, 5000);
  }

  // 3b. normally: check the clock every 15 seconds, and fade when the date
  //     has changed (this also catches a laptop waking up on a new day)
  if (!fixedDate) {
    setInterval(function () {
      var now = today();
      if (!sameDay(now, shown)) show(now, true);
    }, 15 * 1000);
  }

});
