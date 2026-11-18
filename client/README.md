# EventEase (React)

A rebuild of the original EventEase project in **React**. You can create events, customize their page, invite co-organizers, apply templates, clone events, set visibility, see analytics and promote them. Events are stored by the **EventEase server** (`../server`).

## Run it (two terminals)

The app needs the API server running, or it shows "Could not load events".

```bash
# Terminal 1: the API (http://localhost:4000)
cd ../server
npm install
npm run dev

# Terminal 2: this React app
npm install
npm run dev      # open http://localhost:5173
```

Other commands: `npm run build` (production build into dist/), `npm run lint`. Requires Node 20 or newer.

If the server runs somewhere else, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Tech

React 19, Vite, React Router. No other libraries.

## How it is organized

```
src/
  main.jsx                entry point, wraps the app in Router + providers
  App.jsx                 header, navigation, route table
  index.css               all styles (colors are CSS variables)
  api/client.js           the one fetch() wrapper (errors, JSON, base URL)
  api/events.js           one small function per server endpoint
  data/constants.js       event types, themes, templates, option lists
  utils/format.js         date formatting and CSV export
  hooks/useLocalStorage.js  useState that also saves to localStorage
  context/
    EventsContext.jsx     THE shared data: loads events from the server, calls the API for every change
    ToastContext.jsx      the success / error message banner
  components/             Navbar, CurrentEventBar, EventBanner, NoEvent
  pages/                  one file per page
```

## The data model

One list of events. Everything belongs to an event (stored inside it):

```js
{
  id, title, date, type, host,
  description, location, theme, image, template, tag, clonedFrom,
  visibility: { visibility, joining, inviteControl, expiration, roles },
  coOrganizers: [{ id, email, role, notify, access, invitedAt }],
  rsvps:        [{ id, name, status }],
  shares:       { Facebook: 2, Twitter: 1 },
  createdAt
}
```

Events live on the server. Only two browser-specific preferences stay in localStorage: `eventease.favoriteTemplates` and `eventease.selectedEventId`. (Events saved by the earlier localStorage-only version, key `eventease.events`, are not imported.)

How a change flows: page calls an action in `EventsContext` → it calls the API → the server validates, saves and answers with the saved event → we put that answer in React state → the screen redraws. If the server says no, a ⚠️ message is shown and nothing changes.

## Pages

| URL | Page | What it does |
|---|---|---|
| `/` | Create Event | Create, edit, search, filter, delete events |
| `/customize` | Customize | Title, location, description, theme, cover image, live preview |
| `/co-organizers` | Co-Organizers | Add and remove people for the selected event |
| `/templates` | Templates | Search, filter, apply (changes the theme), favorite |
| `/clone` | Clone Event | Copy a real event with a new title and date |
| `/visibility` | Visibility | Public/unlisted/private, joining rules, role access |
| `/analytics` | Analytics | Real counts, bars, RSVP list, CSV export |
| `/promotions` | Promotions | Share links, copy link, QR code, hashtags, badge designer |
| `/event/:id` | Event page | Public page of one event (target of the share link and QR) |

## Not done yet

- The server stores events in a JSON file, not a real database yet (next: MongoDB).
- No login. Anyone can change any event, and visibility settings are saved but not enforced.
- No email is really sent to co-organizers.
- Share links and QR codes use `localhost`, so they only work on this computer until the app is deployed.
