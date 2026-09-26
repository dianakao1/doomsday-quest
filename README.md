# Doomsday Quest

A small browser game that teaches the **Doomsday method**, John Conway's trick for working out the day of the week of any date in your head. It explains every step so simply that a child could follow along.

## What's inside

Eight short levels, each with a few lesson cards and a quiz:

1. **Days are numbers** – Sunday is 0, Monday is 1, and so on.
2. **Hop by sevens** – drop the 7s to make big jumps small.
3. **Doomsday dates** – 4/4, 6/6, 8/8, 10/10, 12/12, "9 to 5 at the 7-Eleven", and the tricky three.
4. **Any date in a year** – find the nearest doomsday date and hop.
5. **Century anchors** – the anchor loop (Tue, Sun, Fri, Wed).
6. **The year's doomsday** – choose the *Odd + 11* or *Twelves* method.
7. **Time machine** – dates in the Julian calendar before October 15, 1582.
8. **Grand master** – any date in history.

It also has:

- A weekday dial for answering.
- Hints after a wrong answer, and a **Show me the steps** button that walks through the full solution.
- Stars, XP and a streak counter.
- A **Practice arena** with random dates and a best-time record.
- Progress saved in your browser.
- Light and dark themes, and a layout that works on phones.

## Run it

No build step and no dependencies. Open `index.html` in a browser, or publish the repo with **GitHub Pages** (Settings → Pages → deploy from the `main` branch, root folder).

## Project structure

```
index.html            page shell
css/styles.css        styles and light/dark theme tokens
js/calendar.js        date math: Gregorian/Julian, anchors, doomsdays
js/app.js             levels, lessons, quiz flow, practice arena
tests/calendar.test.js
```

## Tests

```
node tests/calendar.test.js
```

The tests check the Doomsday shortcut against a Julian Day Number calculation for every year from 1 to 9999 in both calendars. They also check a handful of known historical dates.

## Notes

- The game switches from the Julian to the Gregorian calendar on October 15, 1582. Britain and its colonies switched later, in 1752.
- Fonts (Fredoka, Nunito) load from Google Fonts. The game falls back to system fonts when offline.
