/*
  Points the link-preview tags in index.html at today's season.

  Run by the daily publish job (.github/workflows/publish.yml) just
  before the site is published. "Today" is the date in Chicago.

    node scripts/update-social-image.js              today
    node scripts/update-social-image.js 2027-05-16   any date, for testing
*/

var fs = require("fs");
var path = require("path");
var C = require("../assets/js/calendar.js");

var date = process.argv[2] || new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date());   // e.g. "2026-11-24"

var parts = date.split("-").map(Number);
var season = C.seasonFor(parts[0], parts[1], parts[2]);

var file = path.join(__dirname, "..", "index.html");
var html = fs.readFileSync(file, "utf8")
  .replace(/assets\/social\/[a-z-]+\.png/g, "assets/social/" + season.key + ".png")
  .replace(/(<meta property="og:description" content=")[^"]*(")/, "$1" + season.name + "$2");
fs.writeFileSync(file, html);

console.log(date + ": " + season.name + " (assets/social/" + season.key + ".png)");
