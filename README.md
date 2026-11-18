# EventEase

A web app for creating and managing events, from a small meeting to a wedding or a webinar. Create events, customize their page, invite co-organizers, apply templates, clone events, set visibility, track RSVPs and analytics, and promote them with share links, a QR code and hashtags.

It started as a plain HTML/CSS/JavaScript project and was rebuilt as a full-stack app:

| Part | Tech | Folder |
|---|---|---|
| Frontend | React 19, Vite, React Router | [`client/`](client) |
| Backend API | Node.js, Express 5 | [`server/`](server) |
| Database | MongoDB (Mongoose), with a JSON-file fallback for quick tries | [`server/src/store`](server/src/store) |
| Original version | Vanilla HTML, CSS, JS (+ unfinished Flask) | [`legacy/`](legacy) |

## How it fits together

```
 Browser (React app, :5173)  --fetch /api-->  Express server (:4000)  -->  MongoDB
```

- The React app shows the pages and sends requests to the API.
- The server checks every request (never trusts the browser), then saves or loads events.
- The database holds one document per event. Co-organizers, RSVPs, share counts, visibility and theme are stored inside the event they belong to.

## Run it locally

Requires Node 22.9 or newer. Use two terminals.

**1. API server** (`http://localhost:4000`)

```bash
cd server
npm install
npm run dev
```

With no setup it saves to a JSON file. To use MongoDB (for example a free MongoDB Atlas cluster), copy `server/.env.example` to `server/.env` and set `MONGODB_URI`. The steps are in [server/README.md](server/README.md).

**2. React app** (`http://localhost:5173`)

```bash
cd client
npm install
npm run dev
```

If the server is not running, the app shows "Could not load events" with a **Try again** button.

## Pages

| URL | What it does |
|---|---|
| `/` | Create, edit, search, filter and delete events |
| `/customize` | Title, location, description, color theme, cover image, live preview |
| `/co-organizers` | Add and remove people for the selected event |
| `/templates` | Search, filter, apply (changes the theme) and favorite templates |
| `/clone` | Copy a real event with a new title and date |
| `/visibility` | Public / unlisted / private, joining rules, role access |
| `/analytics` | Real counts, charts, RSVP list, CSV export |
| `/promotions` | Share links, copy link, QR code, hashtags, badge designer |
| `/event/:id` | Public page of one event |

## Tests

```bash
cd server
npm test
```

15 automated tests cover validation, all endpoints, cloning and saving. Set `TEST_MONGODB_URI` in `server/.env` to run the same tests against MongoDB.

## Status and next steps

Working: everything above, end to end, with the JSON store. The MongoDB store is written and shares the same tests, but is still being verified against a live Atlas cluster.

Not done yet:
- User accounts and login (anyone who can reach the server can change any event, and visibility settings are saved but not enforced)
- Real email invitations
- Deployment (share links and QR codes use `localhost` until the app is hosted)

## Author

Muhammad Sohail, Software Engineering student at COMSATS Islamabad.
