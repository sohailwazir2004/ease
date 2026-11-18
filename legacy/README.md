# EventEase (legacy version)

> **Legacy version.** This folder keeps the original vanilla HTML/CSS/JavaScript project (with an unfinished Flask backend) exactly as it was. The current app is in [`../client`](../client) and [`../server`](../server). This README documents how the legacy version worked.

EventEase is a single-page web app for planning and managing events, from a small meeting to a wedding or a webinar. This version is plain **HTML + CSS + vanilla JavaScript**. All data is saved in the browser's `localStorage`. A small Flask backend exists but is **not finished and not connected**.

> This README documents the project **as it currently is**. That includes what works, what is only a demo, and what is broken. It is the baseline for the planned rewrite in React.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Project structure](#project-structure)
3. [How the app works (big picture)](#how-the-app-works-big-picture)
4. [Feature walkthrough](#feature-walkthrough)
5. [Data storage reference (localStorage)](#data-storage-reference-localstorage)
6. [JavaScript function reference](#javascript-function-reference)
7. [Styling](#styling)
8. [Backend (Flask)](#backend-flask)
9. [What is real vs. fake](#what-is-real-vs-fake)
10. [Known bugs and issues](#known-bugs-and-issues)
11. [React migration plan](#react-migration-plan)

---

## Quick start

No build step and no dependencies.

```bash
git clone https://github.com/sohailwazir2004/ease.git
cd ease
```

Open `index.html` in a browser (double-click it, or use a tool like VS Code Live Server). The app works fully offline except for the QR code image, which is loaded from `api.qrserver.com`.

To reset all saved data, open the browser DevTools, go to **Application → Local Storage**, and clear the keys listed below. You can also run `localStorage.clear()` in the console.

---

## Project structure

```
index.html   Page layout: header, nav, and 8 <section> blocks (one per feature)
ftend.css    Main stylesheet (loaded via <link>)
ft.js        All frontend logic (about 650 lines, no frameworks, no modules)
backend.py   Flask API snippets (incomplete, see Backend section)
README.md    This file
```

| File | Lines | Role |
|---|---|---|
| `index.html` | ~290 | Markup + a small inline `<style>` block |
| `ftend.css` | ~160 | Layout, colors, buttons, form controls, responsive rules |
| `ft.js` | ~650 | Event handlers, localStorage read/write, rendering lists |
| `backend.py` | ~57 | Two Flask route functions |

---

## How the app works (big picture)

**One page, eight sections, one visible at a time.**

1. `index.html` contains eight `<section class="page-section">` elements: `create`, `customize`, `coorganizer`, `template`, `clone`, `visibility`, `analytics`, `promotions`.
2. The `<nav>` has one link per section (`href="#create"` and so on).
3. `ft.js` intercepts nav clicks (`preventDefault`), then calls `showSection(id)`. That sets `display: block` on the chosen section and `display: none` on the others. It is a hand-made "router" with no URL change.
4. On page load (`DOMContentLoaded`) it shows the `create` section.
5. Buttons use inline `onclick="someFunction()"`. For that to work, every handler is attached to `window` (`window.saveEvent = function () {...}`).
6. Each feature follows the same pattern:
   - read values from inputs with `document.getElementById(...)`
   - validate (show a ⚠️ message and stop if invalid)
   - build an object with `id: Date.now()` and a timestamp
   - read the matching array from `localStorage`, push, write it back
   - show a ✅ message and clear the form
   - re-render a list by building an HTML string and assigning it to `innerHTML`
7. Some "list" containers do not exist in the HTML. Helper functions such as `createCustomizationContainer()` create the `<div>` on first use and append it to the section.
8. User feedback uses one shared **confirmation banner** (`showConfirmation(msg)`) that appears for 3 seconds.

```
 Nav click ──► showSection(id) ──► show one section, hide the rest
                     │
                     └──► (after 100ms) call that section's display...() function

 Button click ──► handler (saveEvent, addCoOrganizer, ...)
                     │
                     ├──► read inputs ─► validate ─► build object
                     ├──► localStorage (JSON array) ─► push ─► save
                     ├──► showConfirmation("✅ ...")
                     └──► re-render list (innerHTML)
```

---

## Feature walkthrough

### 1. Create Event (`#create`)

- **Fields:** Title, Date & time (`datetime-local`), Event type (Meeting, Workshop, Wedding, Party, Webinar, Other), Host.
- **Save Event** (`saveEvent`): all four fields are required. The type must not be the placeholder "Select Event Type". It saves `{ id, title, date, type, host, created }` into `eventData`, then clears the form.
- **View Saved Events** (`fetchEvents`): renders every saved event as a card with index, title, type, host, date, created date, and a **Delete** button.
- **Delete** (`deleteEvent(id)`): removes the event by `id` and re-renders.
- This is the only feature where the data is actually usable elsewhere. Analytics export and social sharing read from `eventData`.

### 2. Customize Event Page (`#customize`)

- **Fields:** image upload, custom title, location, color theme (Purple, Yellow, Green, Red, Blue).
- **Save and Continue** (`saveCustomization`): title and location are required. It saves `{ id, title, location, theme, hasImage, imageName, created }` into `customizations`.
- The image itself is **not stored**. Only the file name and a `hasImage` flag are kept.
- `displayCustomizations()` shows the saved items. Each card has a gradient background based on its theme color (`getThemeColor`).
- The customization is **not linked to any event**. It is just a standalone list.

### 3. Co-Organizer Management (`#coorganizer`)

- **Fields:** email, role (Co-organizer, Moderator, Live Streamer), checkboxes "Notify Organizer" and "Grant Access".
- **Invite** (`addCoOrganizer`): needs an email (must contain `@`) and a role. Duplicate emails are rejected. It saves `{ id, email, role, notify, access, status: "Invited", invitedDate }` into `coOrganizers`.
- **View Co-Organizers** (`displayCoOrganizers`): cards with a role badge, status, notification setting, access state, and a **Remove** button (`removeCoOrganizer(id)`).
- No email is actually sent. "Invited" is only a label.

### 4. Template (`#template`)

- Three hard-coded templates: **Webinar Pro**, **Modern Wedding**, **Minimal Talk**.
- **Selecting** (`selectTemplate(name)`): updates the "Template:" preview text and stores one object in `selectedTemplate` (it overwrites the previous one).
- **Apply Design** (`applyTemplate`): appends the selected template, marked `Applied`, to `appliedTemplates`.
- **Save as Favorite** (`saveAsFavorite`): appends to `favoriteTemplates` unless a template with the same name is already there.
- `displaySelectedTemplates()` lists applied templates (green cards) and favorites (yellow cards with ⭐).
- The **search box** and **category filter** are decorative. They have no logic.
- Applying a template changes nothing visually. It only records that it was applied.

### 5. Clone Event (`#clone`)

- **Fields:** "Search Past Events" text, a "Recently Used" dropdown, new title, new date, optional tag.
- The dropdown has three hard-coded names (Launch 2023, Design Sprint, All Hands). Picking one calls `prefillClone(name)`, which fills the title with `"<name> - Copy"` and the date with today.
- **Save Cloned Event** (`cloneEvent`): title and date are required. It saves `{ id, title, date, tag, type: "Cloned Event", host: "Current User", clonedDate, originalEvent }` into `clonedEvents`.
- It does **not** clone a real saved event. The dropdown is not populated from `eventData`, and the search box value is just stored as text in `originalEvent`.
- `displayClonedEvents()` lists the clones.

### 6. Visibility (`#visibility`)

- **Fields:** Visibility (Public, Unlisted, Private), Joining permission (Anyone, Approval required, Invited only), Invite control (Email only, .edu domain, Link sharing), Access expiration (`datetime-local`), and role checkboxes (Organizer, Co-host, Viewer, Moderator).
- **Save Visibility Settings** (`saveVisibilitySettings`): stores a **single** settings object (not an array) under `visibilitySettings`, overwriting any previous one.
- `displayVisibilitySettings()` shows the current settings, including a comma-separated list of the active roles.
- Settings are stored only. Nothing enforces them.

### 7. Analytics (`#analytics`)

- The **Visitor Traffic** numbers (Google 2,500, Facebook 1,800, LinkedIn 1,200) and the **RSVP list** (Alice, Bob, Charlie) are **hard-coded HTML**, not real data.
- The "Time Range" dropdown does nothing. The "Toggle RSVP List" button only shows an `alert`.
- **Export as CSV** (`exportAnalytics`) is the one real part. It builds a summary of your saved data, `{ totalEvents, totalCoOrganizers, totalCustomizations, exportDate, events, coOrganizers }`, and downloads it as `event-ease-analytics-YYYY-MM-DD.json`.
- The button says CSV, but the file is **JSON**.

### 8. Promotions (`#promotions`)

- **Social sharing** (`shareToSocial(platform)`): for Facebook, Twitter and Instagram. It needs at least one saved event. It takes the most recent event, builds the text `"Join me at <title> on <date>! 🎉"`, logs the share in `socialShares`, and shows a confirmation. It does **not** open any social site.
- **Copy Link**: just an `alert`. Nothing is copied.
- **Badge designer** (shape and color selects): decorative only.
- **Hashtag generator** (`generateHashtags`): takes a topic, lowercases it, removes spaces, and produces 7 hashtags (`#<topic>2025`, `#<topic>event`, `#join<topic>`, `#<topic>live`, `#eventease<topic>`, `#<topic>community`, `#<topic>experience`). It shows them and logs the result in `generatedHashtags`.
- **QR code**: a fixed image from `api.qrserver.com` that encodes `https://eventease.com/my-event`. It never changes.

---

## Data storage reference (localStorage)

| Key | Type | Written by | Shape |
|---|---|---|---|
| `eventData` | array | `saveEvent` | `{ id, title, date, type, host, created }` |
| `customizations` | array | `saveCustomization` | `{ id, title, location, theme, hasImage, imageName, created }` |
| `coOrganizers` | array | `addCoOrganizer` | `{ id, email, role, notify, access, status, invitedDate }` |
| `selectedTemplate` | object | `selectTemplate` | `{ id, name, selectedDate, status }` |
| `appliedTemplates` | array | `applyTemplate` | template + `{ status: "Applied", appliedDate }` |
| `favoriteTemplates` | array | `saveAsFavorite` | template + `{ favorite: true, favoriteDate }` |
| `clonedEvents` | array | `cloneEvent` | `{ id, title, date, tag, type, host, clonedDate, originalEvent }` |
| `visibilitySettings` | object | `saveVisibilitySettings` | `{ id, visibility, joining, inviteControl, expiration, roles: {organizer, cohost, viewer, moderator}, savedDate }` |
| `generatedHashtags` | array | `generateHashtags` | `{ topic, hashtags[], generatedDate }` |
| `socialShares` | array | `shareToSocial` | `{ platform, eventTitle, sharedDate }` |

Notes:
- IDs are `Date.now()` (milliseconds since 1970). That is fine for a demo, but two items created in the same millisecond would collide.
- Nothing links one record to another. There is no `eventId` on customizations, co-organizers, templates, or visibility settings. Everything is global.

---

## JavaScript function reference

All in `ft.js`.

**Core / navigation**
| Function | What it does |
|---|---|
| `showConfirmation(msg)` | Shows the banner with `msg` for 3 seconds |
| `showSection(id)` | Shows one `.page-section`, hides the rest, then loads that section's list after 100 ms |
| nav click listeners | Prevent default link jump and call `showSection` |
| `DOMContentLoaded` listener | Shows `create` on load |

**Events:** `saveEvent`, `fetchEvents`, `deleteEvent(id)`

**Customize:** `saveCustomization`, `displayCustomizations`, `createCustomizationContainer`, `getThemeColor(theme)`

**Co-organizers:** `addCoOrganizer`, `displayCoOrganizers`, `removeCoOrganizer(id)`, `createCoOrganizerContainer`

**Templates:** `selectTemplate(name)`, `applyTemplate`, `saveAsFavorite`, `displaySelectedTemplates`, `createTemplateContainer`

**Clone:** `prefillClone(name)`, `cloneEvent`, `displayClonedEvents`, `createClonedEventsContainer`

**Visibility:** `saveVisibilitySettings`, `displayVisibilitySettings`, `createVisibilityContainer`

**Analytics:** `exportAnalytics`

**Promotions:** `generateHashtags`, `shareToSocial(platform)`

---

## Styling

- `index.html` links `ftend.css` and also has a small inline `<style>` block. The inline block comes later, so it overrides `ftend.css` where both set the same property. The two blocks partly duplicate each other. The inline `input, select, textarea, button { max-width: 400px; display: block }` rule is the main overlap.
- **Look:** purple theme (`#6200ea` / `#3700b3`), white rounded "card" sections on a light grey page (`#f9f9fb`), a gradient header, and a wrapping nav bar.
- **Responsive:** one breakpoint at 600px. The nav becomes a column and the section padding shrinks.
- Many cards in `ft.js` use **inline `style="..."` strings** instead of CSS classes.

---

## Backend (Flask)

`backend.py` contains two route functions, but the file is **not runnable as it is**:

- It is missing `from flask import Flask, request, jsonify`, `import datetime`, `app = Flask(__name__)`, an `events = []` list, and `app.run(...)`.
- Nothing in `ft.js` calls these endpoints. There is no `fetch()` anywhere.

What the routes are meant to do:

| Endpoint | Method | Body | Behavior |
|---|---|---|---|
| `/api/save-event` | POST | `{ title, date, type, host }` | Validates the required fields, adds `timestamp` and `id = len(events)+1`, appends to the in-memory list, returns the event |
| `/api/clone-event` | POST | `{ event_id, new_title, new_date }` | Validates, copies the event at that index, applies the new title/date, assigns a new id, sets `cloned_from`, and returns it |

Storage is a Python list in memory, so everything is lost when the server restarts. There is no database, CORS setup, or authentication.

---

## What is real vs. fake

| Feature | Status |
|---|---|
| Create / list / delete events | ✅ Real (localStorage) |
| Co-organizer add / list / remove | ✅ Real (localStorage), no actual invite email |
| Customization save | ⚠️ Partial (image not stored, not tied to an event) |
| Template select / apply / favorite | ⚠️ Records only, no visual effect; search and filter do nothing |
| Clone event | ⚠️ Fake source (hard-coded names), not a real copy of a saved event |
| Visibility settings | ⚠️ Stored only, not enforced |
| Analytics numbers and RSVP list | ❌ Hard-coded sample data |
| Analytics export | ⚠️ Works, but exports JSON, not CSV |
| Social share | ⚠️ Logs only, does not open any platform |
| Copy Link, badge designer, time range | ❌ Decorative / alert only |
| Hashtags | ✅ Works (year is hard-coded as 2025) |
| QR code | ⚠️ Static image of a placeholder URL |
| Flask backend | ❌ Incomplete and unused |

---

## Known bugs and issues

1. **Confirmation banner is invisible on most pages.** The id `confirmation` is used twice: once for a `<div>` *inside* the Create section, and once for a `<section>` at the bottom of the page. `getElementById` returns the first one, which lives inside `#create`. When another section is shown, `#create` is hidden, so ✅/⚠️ messages from other sections never appear. The same duplicate applies to `confirmationMessage`.
2. **Backend can't run** and the frontend never calls it (see above).
3. **Possible XSS.** User text (titles, hosts, emails, location) is inserted into the page with `innerHTML` and template strings without escaping. Saving `<img src=x onerror=alert(1)>` as a title would run code.
4. **"Export as CSV" exports JSON.**
5. **Clone doesn't clone.** It never reads from `eventData`.
6. **Clones, customizations, and co-organizers are not tied to events.** There is no data relationship.
7. **Hard-coded values:** hashtag year `2025`, QR URL, analytics numbers, and the clone dropdown.
8. **No edit feature.** Records can only be created, listed, and (for some) deleted.
9. **Duplicate and inline styles** in `index.html` and `ft.js`.
10. **Accessibility:** several inputs have no label (the template search, hashtag topic, and the filter and time-range selects have none or only a wrapping label), and emoji are the only icons.
11. **Minor:** `showSection` waits 100 ms through `setTimeout` before loading lists, which causes a brief empty flash. `saveCustomization(event)` accepts an `event` argument that is never passed.

---

## React migration plan

Planned next. Rough mapping from this version to React:

| Current | React equivalent |
|---|---|
| 8 `<section>`s toggled by `showSection` | Pages/routes with **React Router** (`/create`, `/customize`, ...) |
| `window.fooHandler` + `onclick` | Component functions + `onClick={...}` |
| `getElementById(...).value` | Controlled inputs with `useState` |
| `localStorage` get/set everywhere | A `useLocalStorage` hook or a Context/store, later an API |
| `innerHTML` strings | JSX components (`EventCard`, `CoOrganizerCard`, ...), which are escaped by default |
| `showConfirmation` | A `Toast` component with a context provider (fixes bug #1) |
| Hard-coded analytics/clone data | Derived from real saved events |
| Flask routes | A real API (Flask or Node/Express + a database) called with `fetch`/axios |

Suggested component layout:

```
src/
  components/  Navbar, Toast, EventCard, CoOrganizerCard, TemplateCard ...
  pages/       CreateEvent, Customize, CoOrganizers, Templates,
               CloneEvent, Visibility, Analytics, Promotions
  hooks/       useLocalStorage
  context/     EventsContext, ToastContext
```

Planned improvements during the rewrite: link everything to an event (`eventId`), make Clone work on real events, make Analytics reflect real data, add edit support, and finish and connect the backend.

---

## Author

Original project: Muhammad Sohail (COMSATS Islamabad), https://github.com/sohailwazir2004/ease
