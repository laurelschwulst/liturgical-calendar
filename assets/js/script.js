/*
  Liturgical Calendar: the page
  Shows today's season (or red day) and changes it at local midnight
  with a 15-second fade that sweeps from right to left. The date math
  lives in calendar.js.

  Testing:
    ?date=2027-05-16         show any date
    ?date=2026-11-28&next    show that date, then after 5 seconds fade
                             to the next day, as it would at midnight
    the dot, top right       opens a dropdown of every season in the church
                             year; choosing one goes to its first day (?date=)
    ← / →                    previous / next season or red day
    m                        midnight mode: ← / → play the midnight fade
*/

$(function () {

  var FADE = 15 * 1000;            // length of the midnight fade
  var BAND = 25;                   // width of the soft edge, % of the screen
  var ALL_KEYS = Object.keys(LiturgicalCalendar.NAMES).join(" ");

  var $body = $("body");
  var $name = $("#time i");

  var params = new URLSearchParams(window.location.search);
  var fixedDate = parseDate(params.get("date"));   // null unless ?date= is given
  var shown = null;                                // the date currently on screen
  var shownKey = null;                             // and its season

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
    var oldKey = shownKey;

    // keep a copy of the old season on top before the page changes;
    // the favicon changes once the fade has finished
    if (fade && oldKey && oldKey !== season.key) {
      fadeOut(oldKey, $name.text(), function () { setFavicon(season.key); });
    } else {
      setFavicon(season.key);
    }

    // the page itself switches right away
    $body.removeClass(ALL_KEYS).addClass(season.key);
    $name.text(season.name);
    shownKey = season.key;

    shown = date;
    buildMenu(date);
  }

  // the midnight fade: a copy of the old season (name and dot) lies over
  // the page, and a gradient mask sweeps across it from right to left:
  // solid on the left, a soft edge BAND% wide, transparent on the right.
  // The edge moves from the right side of the screen to past the left,
  // then the copy is removed and `done` runs (it updates the favicon).
  function fadeOut(oldKey, oldName, done) {
    $(".fade-layer").remove();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();

    var layer = $('<div class="fade-layer">').addClass(oldKey)
      .append($('<div class="time">').append($("<i>").text(oldName)))
      .append('<span class="dot"></span>')
      .appendTo("body")[0];

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / FADE, 1);
      var edge = 100 - p * (100 + BAND);           // 100% → -BAND%
      var mask = "linear-gradient(to right, #000 " + edge + "%, transparent " + (edge + BAND) + "%)";
      if (!layer.isConnected) return;               // replaced by a newer fade
      layer.style.webkitMaskImage = mask;
      layer.style.maskImage = mask;
      if (p < 1) requestAnimationFrame(frame);
      else { $(layer).remove(); done(); }
    }
    requestAnimationFrame(frame);
  }

  // favicon: a plain square in the season's background color. The color
  // is read from style.css (an off-screen element with the season's class),
  // so it's never the halfway color of a fade, and the CSS stays the one
  // place colors are set.
  function setFavicon(key) {
    var probe = $("<span>").addClass(key).css({ position: "absolute", left: "-9999px", transition: "none" }).appendTo("body");
    var color = probe.css("background-color");
    probe.remove();

    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);

    var $icon = $("link[rel='icon']");
    if (!$icon.length) $icon = $('<link rel="icon" type="image/png">').appendTo("head");
    $icon.attr("href", canvas.toDataURL("image/png"));
  }

  // --- testing easter egg: the dot and its <select> ---

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function isoDate(n) {
    var d = LiturgicalCalendar.toDate(n);
    return d.year + "-" + String(d.month).padStart(2, "0") + "-" + String(d.day).padStart(2, "0");
  }

  // the red days, and the season each one falls in
  var RED_DAYS = { "palm-sunday": "lent", "good-friday": "triduum", "pentecost": "easter" };

  // "Nov 29 – Dec 24", or "Apr 2 – 4" within one month, or "Mar 29"
  function dateRange(a, b) {
    if (a === b) return shortDate(a);
    var da = LiturgicalCalendar.toDate(a), db = LiturgicalCalendar.toDate(b);
    return shortDate(a) + " – " + (da.month === db.month ? db.day : shortDate(b));
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
  // (Advent to the day before the next Advent), continued to at least
  // the end of the calendar year:
  //
  //   Viewing Tue, Nov 24, 2026 (today)      ← not choosable
  //   ← 2024–25
  //   ----- 2025 -----                        ← year divider, not choosable
  //   Advent ... Nov 30 – Dec 24
  //   ...
  //   Ordinary Time ... May 25 – Nov 28      ← the season being viewed (selected)
  //   ----------------                        ← plain divider, not choosable
  //   → 2026–27
  //   ↓ Today
  //
  // Each choosable option's value is a date to go to; "Today" has no value.
  function buildMenu(date) {
    var C = LiturgicalCalendar;
    var n = C.dayNumber(date.year, date.month, date.day);
    var startYear = n >= C.adventStart(date.year) ? date.year : date.year - 1;
    var start = C.adventStart(startYear);
    var next = C.adventStart(startYear + 1);
    var isToday = sameDay(date, today());

    // walk day by day from the start of the church year, grouping days into
    // seasons and red days. Keep going past the end of the church year until
    // the end of the calendar year too, so the coming Advent and Christmas
    // show up in the fall; a season that starts before Dec 31 is listed whole.
    //
    // Red days count as part of their season here, so Lent, the Triduum and
    // Easter show their full length; each red day is listed after its season.
    var yearEnd = C.dayNumber(date.year + 1, 1, 1);
    var ranges = [];
    for (var day = start; ; day++) {
      var d = C.toDate(day);
      var season = C.seasonFor(d.year, d.month, d.day);
      var parent = RED_DAYS[season.key];               // e.g. "lent" for Palm Sunday
      var key = parent || season.key;
      var last = ranges[ranges.length - 1];
      var sameSeason = last && last.key === key;
      if (day >= next && day >= yearEnd && !sameSeason) break;
      if (!sameSeason) {
        last = { key: key, name: C.NAMES[key], start: day, end: day, red: [] };
        ranges.push(last);
      }
      last.end = day;
      if (parent) last.red.push({ name: season.name, day: day });
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
      var onRedDay = r.red.some(function (x) { return x.day === n; });
      option(r.name + " ... " + dateRange(r.start, r.end), isoDate(r.start))
        .prop("selected", n >= r.start && n <= r.end && !onRedDay);
      r.red.forEach(function (x) {
        option("● " + x.name + " ... " + shortDate(x.day), isoDate(x.day))
          .prop("selected", x.day === n);
      });
    });

    option(DIVIDER, "", true);
    option("→ " + churchYear(startYear + 1), isoDate(next));
    option("↓ Today", "");
  }

  // choosing an option goes to that date (or back to today)
  $("#menu").on("change", function () {
    var value = $(this).val();
    window.location.href = window.location.pathname + (value ? "?date=" + value : "");
  });

  // 1. on load: show the date right away, no fade
  show(fixedDate || today(), false);

  // 2a. testing: ?date=…&next fades to the following day after 5 seconds
  if (fixedDate && params.has("next")) {
    setTimeout(function () {
      var n = LiturgicalCalendar.dayNumber(fixedDate.year, fixedDate.month, fixedDate.day);
      show(LiturgicalCalendar.toDate(n + 1), true);
    }, 5000);
  }

  // 2b. normally: check the clock every 15 seconds, and fade when the date
  //     has changed (this also catches a laptop waking up on a new day).
  //     Stops once the keyboard has been used to look at other dates.
  var browsing = false;
  if (!fixedDate) {
    setInterval(function () {
      if (browsing) return;
      var now = today();
      if (!sameDay(now, shown)) show(now, true);
    }, 15 * 1000);
  }

  // 3. testing with the keyboard
  //    ← / →  go to the previous / next season or red day: the same steps
  //           the page takes at real midnights
  //    m      midnight mode on/off: when on, ← / → play the midnight fade
  var midnightMode = false;
  var $label = $("<div>").css({
    position: "fixed", top: "20px", left: "20px", zIndex: 4,
    padding: "4px 10px", borderRadius: "4px",
    background: "rgba(0, 0, 0, .6)", color: "white",
    font: "14px -apple-system, system-ui, sans-serif",
    pointerEvents: "none", display: "none"
  }).appendTo("body");
  var labelTimer;

  function say(text) {
    $label.stop(true).css("opacity", 1).text(text).show();
    clearTimeout(labelTimer);
    labelTimer = setTimeout(function () { $label.fadeOut(400); }, 2500);
  }

  function keyOf(n) {
    var d = LiturgicalCalendar.toDate(n);
    return LiturgicalCalendar.seasonFor(d.year, d.month, d.day).key;
  }

  // first day of the next (+1) or previous (-1) season or red day
  function step(n, direction) {
    var key = keyOf(n);
    if (direction > 0) {
      while (keyOf(n) === key) n++;
      return n;
    }
    while (keyOf(n - 1) === key) n--;     // back to the start of this one
    n--;                                  // into the previous one
    var prev = keyOf(n);
    while (keyOf(n - 1) === prev) n--;    // and to its start
    return n;
  }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var C = LiturgicalCalendar;

    if (e.key === "m" || e.key === "M") {
      midnightMode = !midnightMode;
      say("Midnight mode " + (midnightMode ? "on: ← → play the fade" : "off"));
      return;
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    e.stopPropagation();   // never let the arrows change the dropdown itself

    var n = step(C.dayNumber(shown.year, shown.month, shown.day), e.key === "ArrowRight" ? 1 : -1);
    var date = C.toDate(n);
    browsing = true;
    show(date, midnightMode);
    history.replaceState(null, "", "?date=" + isoDate(n));
    say(longDate(n) + " · " + C.seasonFor(date.year, date.month, date.day).name + (midnightMode ? " · midnight" : ""));
  }, true);   // capture phase, before the dropdown sees the key

});
