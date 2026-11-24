# Liturgical Calendar

A single web page that tells you where you are in the liturgical year.

Right now it shows the name of the current season ("*Ordinary Time*"), very large, set in Garamond No. 8 italic, on a ground of the season's liturgical color.

> **Status:** parameters settled, ready for code. This file is the brief for anyone (human or agent) working on it. Anything still marked **❓ Open** needs a decision first.

---

## What it is

- A clock for the church year: it reads today's date and shows the current **season**.
- It's mostly typographic: one phrase, big, centered, in the season's color.
- The page is meant for **looking at**, not using. There's no interaction (`pointer-events: none`, no scrolling).

## What it is not (for now)

- Not a full calendar or lectionary browser.
- Not an app with settings, accounts or navigation.

---

## Parameters

### 1. Tradition ✅ Decided
**Roman Catholic** (General Roman Calendar), so the green seasons are called **Ordinary Time**.

Seasons, in order: Advent → Christmas (through the Baptism of the Lord) → Ordinary Time → Lent (Holy Week is its last week) → Paschal Triduum → Easter (50 days, ending at Pentecost) → Ordinary Time.

Uses the **US calendar**: Epiphany moves to the Sunday between Jan 2 and Jan 8, and the Baptism of the Lord (end of Christmas) is the following Sunday, or the Monday after Epiphany if Epiphany falls on Jan 7 or 8.

Colors: violet (Advent, Lent), rose (Gaudete and Laetare Sundays), white (Christmas, Easter, Holy Thursday, Easter Vigil, feasts of the Lord), red (Palm Sunday, Good Friday, Pentecost), green (Ordinary Time).

### 2. Granularity ✅ Decided (for now)
**Seasons only, seven of them:** Advent, Christmas, Ordinary Time, Lent, Triduum, Easter, Ordinary Time. Each season has one color: violet, white, green, violet, gold, white, green.

This is accurate as long as the page names the *season*, not the color of the day. Rose Sundays, red feast days and the Triduum's changing colors are a later layer. Gold for the Triduum is a design choice, since the real colors change each day.

Season boundaries (US calendar):
- Advent: 4th Sunday before Christmas → Dec 24
- Christmas: Dec 25 → Baptism of the Lord
- Ordinary Time: the day after the Baptism of the Lord → the day before Ash Wednesday
- Lent: Ash Wednesday (Easter − 46 days) → Wednesday of Holy Week
- Triduum: Holy Thursday → Holy Saturday
- Easter: Easter Sunday → Pentecost (Easter + 49 days)
- Ordinary Time: the day after Pentecost → the day before Advent

Original list of options, kept for later:
How much does the clock know?
- **Seasons only:** Advent, Christmas, Ordinary Time, Lent, (Holy Week / Triduum), Easter, Ordinary Time
- **Seasons + named Sundays:** e.g. "Second Sunday of Advent", "Twenty-third Sunday in Ordinary Time"
- **Seasons + major feasts / solemnities:** Epiphany, Ash Wednesday, Pentecost, Christ the King, All Saints…
- **Hours of the day:** the Liturgy of the Hours (Lauds, Terce, Sext, None, Vespers, Compline…). This would make it a *clock* in the literal sense.

### 3. Color ✅ Decided
Tone-on-tone: each season has a background color and slightly lighter (or, on white, gray) text.

**Seasons**

| Season | Color | Background | Text |
|---|---|---|---|
| Advent | violet | `#73137a` | `#8c2a93` |
| Christmas | white | `#ffffff` | `#d4d4d4` |
| Ordinary Time (winter) | green | `forestgreen` (`#228b22`) | `green` (`#008000`) |
| Lent | violet | `#73137a` | `#8c2a93` |
| Triduum | gold (design choice) | `#d3a24c` | `#b8873a` |
| Easter | white | `#ffffff` | `#cfcfcf` |
| Ordinary Time (summer–fall) | green | `forestgreen` (`#228b22`) | `green` (`#008000`) |

**Red days** (one day each; they replace the season's name and color, then the season returns the next day)

| Day | Date rule | Inside | Background | Text |
|---|---|---|---|---|
| Palm Sunday | Easter − 7 | Lent | `#941d14` | `#ab271f` |
| Good Friday | Easter − 2 | Triduum | `#941d14` | `#ab271f` |
| Pentecost | Easter + 49 | Easter (its last day) | `#941d14` | `#ab271f` |

Because Good Friday falls inside the Triduum, the Triduum shows gold, then red, then gold.

Check the colors full-screen on a few displays once coded; they look different at full size than as swatches.

Later, maybe: rose (Gaudete, Laetare), white feast days, fixed-date red feasts (e.g. Holy Cross, Sep 14).

Original notes, kept for reference:
Liturgical colors are the main visual system. Western usage, roughly:

| Season / day | Color |
|---|---|
| Advent | violet (or blue) |
| Gaudete Sunday (Advent 3), Laetare Sunday (Lent 4) | rose |
| Christmas, Easter, many feasts | white / gold |
| Ordinary Time | green |
| Lent | violet |
| Palm Sunday, Good Friday, Pentecost, martyrs | red |

Questions:
- Use literal liturgical colors, or a designed interpretation of each one?
- The current Ordinary Time pairs a `forestgreen` background with `green` text, which is low contrast. Is that tone-on-tone effect intentional?

### 4. Text ✅ Decided
Only the name of the current season or red day (e.g. *Advent*, *Ordinary Time*, *Pentecost*), in italic. Nothing else on the page.

### 5. Time ✅ Decided
- Uses the **viewer's local date**.
- If the page is left open, it changes at local midnight with a **slow fade of about 60 seconds**:
  - the background and text colors fade from the old season's colors to the new ones (CSS `transition`);
  - if the name changes too, the old name fades out and the new one fades in partway through.
- On page load there is no fade; it simply shows today.
- A hidden `?date=YYYY-MM-DD` URL parameter shows any other date, for testing.

### 6. Computing the calendar ✅ Decided
All dates are **calculated in JavaScript** for whatever year it is. There's no data file and nothing to update each year.
- Easter Sunday comes from the standard Gregorian Easter formula (the Computus).
- Ash Wednesday, Palm Sunday, the Triduum, Good Friday and Pentecost are counted from Easter.
- Advent starts on the 4th Sunday before Christmas; the end of Christmas comes from the US Epiphany rule above.

---

## Technical constraints

- Plain HTML, CSS and JavaScript. No build step, no framework.
- Uses jQuery (already in `assets/js/`).
- Fonts are self-hosted in `assets/fonts/` (Garamond No. 8: regular, italic, bold, bold italic).
- The project is called **Liturgical Calendar**, matching the repo `laurelschwulst/liturgical-calendar`. (The local folder is still named `liturgical-clock`.)
- Hosted on **GitHub Pages**.

## File structure

```
index.html              the page
preview.html            every season full-screen, for checking colors (design tool)
test.html               checks the date logic against published dates
journal.html            "Coding & prompt journal": a summary of each coding day and the prompts
                        from each session (layout and styles credited to Celine Nguyen)
assets/css/style.css    fonts, layout, one class per season / red day, 60s fade
assets/js/calendar.js   date logic only (Easter, seasons, red days); no page code
assets/js/script.js     the page: shows today, ?date= testing, midnight fade
assets/js/jquery.min.js
assets/fonts/           Garamond No. 8 webfonts
```

The season's key is set as a class on `<body>` (`advent`, `christmas`, `ordinary-time`, `lent`, `palm-sunday`, `triduum`, `good-friday`, `easter`, `pentecost`), and the CSS gives each class its colors.

## Testing

- **test.html**: open it after any change to `calendar.js`. It checks Easter dates (including the earliest and latest possible), Advent start dates, about 30 specific days (including the USCCB 2028 calendar, the 2028 leap day, and 2029's Monday Baptism of the Lord), and every day from 1900 to 2200 for gaps or seasons out of order.
- **`?date=YYYY-MM-DD`**: shows the page for any date, e.g. `index.html?date=2027-05-16` (Pentecost).
- **The dot** (testing easter egg): a 16px circle 20px from the top right, the same color as the season name. An invisible native `<select>` sits on top of it, so clicking it opens a dropdown for the church year being viewed:
  - first row (not choosable): the date being viewed, e.g. "Viewing Tue, Nov 24, 2026 (today)"
  - "← 2024–25": jumps to the start of the previous church year
  - "----- 2025 -----" dividers where the calendar year changes (not choosable)
  - every season and red day, e.g. "Advent ... Nov 30 – Dec 24"; the one being viewed is selected; choosing one goes to its first day (`?date=`)
  - a plain "----------------" divider, then "→ 2026–27": jumps to the next church year
  - "→ Today": back to the real date
- **`?date=YYYY-MM-DD&next`**: shows that date, then after 5 seconds plays the 60-second midnight fade to the next day, e.g. `index.html?date=2026-11-28&next` (Ordinary Time → Advent).

## Favicon

A plain square in the current season's background color, drawn by `script.js` (no image file). It changes with the season, straight to the new color at midnight. On Christmas and Easter it's white, which can be hard to see on a light tab bar.

## Link previews

When the site is texted or posted, the preview image shows today's season, like the page itself.

- `assets/social/` has one 1200×630 image per look: `advent`, `christmas`, `ordinary-time`, `lent`, `palm-sunday`, `triduum`, `good-friday`, `easter`, `pentecost`. Each is a screenshot of the real page, without the dot. If a color or the type changes, these need to be remade.
- `index.html` has the preview tags (`og:image`, `twitter:image`, `og:description`).
- `scripts/update-social-image.js` points those tags at today's season, using the date in **Chicago** (previews can't know the viewer's time zone).
- `.github/workflows/publish.yml` publishes the site on every push to `main`, and every night just after midnight Chicago time, running the script first. It needs repo **Settings → Pages → Source: GitHub Actions**.
- Some apps (Slack, Facebook) cache a preview for a while, so a link shared there just after midnight may still show yesterday's season.

## Known issues

- None right now. (The italic font name in `style.css` has been fixed.)

---

## For agents and collaborators

- Read this file first. Don't make choices on anything marked **❓ Open**; ask instead.
- Keep it small and hand-written. Prefer readable code over clever code: this is a site someone will view source on.
- Don't add dependencies, build tools or frameworks without asking.
- Test any date logic against known dates, e.g. Easter 2026 = April 5, Ash Wednesday 2026 = February 18, First Sunday of Advent 2026 = November 29.
