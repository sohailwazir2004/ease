# EventEase Server

The REST API for EventEase, built with **Node.js + Express 5** and **MongoDB (Mongoose)**. If you do not set `MONGODB_URI`, it falls back to saving in a JSON file (`data/events.json`), which is handy for quick tries. Both storages offer the same functions, so the routes do not know or care which one is used.

## Run it

```bash
npm install
npm run dev      # restarts automatically when you edit files
npm start        # plain start
npm test         # 15 automated tests
```

Runs on `http://localhost:4000`. The first line it prints tells you where data is saved ("MongoDB" or "JSON file").

Settings are environment variables. Put them in a `.env` file (copy `.env.example` to `.env`). `.env` is private and ignored by git.

| Variable | Default | Meaning |
|---|---|---|
| `MONGODB_URI` | (not set) | MongoDB connection string. Set = use MongoDB. Not set = JSON file |
| `PORT` | `4000` | Port to listen on |
| `DATA_FILE` | `data/events.json` | JSON file path (only without MongoDB) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | The React app's address, allowed by CORS |
| `TEST_MONGODB_URI` | (not set) | Only for `npm test`: run the tests on MongoDB instead of a temp file |

## Set up MongoDB Atlas (free cloud database)

1. Sign up at https://www.mongodb.com/cloud/atlas and create a **free (M0)** cluster. Pick a region close to you.
2. **Database Access → Add New Database User.** Choose a username and a password. Prefer a password with only letters and numbers. Symbols like `@ : / ? #` must be URL-encoded inside the connection string.
3. **Network Access → Add IP Address → Add Current IP Address.** Without this, Atlas refuses your connection. (If your IP changes, add the new one. `0.0.0.0/0` allows everyone, so use it only for quick tests.)
4. **Database → Connect → Drivers → Node.js.** Copy the `mongodb+srv://...` string.
5. In this folder, create your private settings file:
   ```bash
   copy .env.example .env
   ```
   Open `.env`, paste the string as `MONGODB_URI`, replace `<password>` (or `PASSWORD`) with your real password, and put the database name `eventease` right before the `?`:
   `mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/eventease?retryWrites=true&w=majority`
6. `npm run dev`. You should see `Saving data to: MongoDB`. Create an event in the app, then look in Atlas under **Browse Collections** (`eventease → events`) to see it.

**Never share or upload your connection string.** It contains your password. `.env` is in `.gitignore` for that reason.

### Run the tests on MongoDB too

Add a second line to `.env` with a **different** database name so the tests never touch your real events:

```
TEST_MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/eventease_test?retryWrites=true&w=majority
```

Then `npm test` runs the same 15 tests on MongoDB. Each run uses a temporary collection and deletes it at the end.

### Common problems

| Message | Meaning |
|---|---|
| `Could not connect to MongoDB: ... ENOTFOUND` | The host in the string is wrong, or no internet |
| `... Server selection timed out` | Your IP is not in Network Access |
| `... bad auth` | Wrong username or password (or a symbol that must be URL-encoded) |

## Folder layout

```
src/
  index.js              starts the server (reads settings, opens the store)
  app.js                builds the Express app (middleware + routes)
  routes/events.js      every /api/events route
  models/event.js       what an event is + validation rules
  store/mongoStore.js   saves/loads events in MongoDB (schema + Mongoose)
  store/jsonStore.js    saves/loads events in a JSON file (fallback, no database needed)
  middleware/errors.js  ApiError class, 404 and error handlers
test/api.test.js        automated tests (node:test, no extra libraries)
```

## API

All bodies are JSON. Errors look like `{ "error": "message" }`.

| Method | URL | Body | Result |
|---|---|---|---|
| GET | `/api/health` | | `{ status: "ok" }` |
| GET | `/api/events?search=&type=` | | list of events, sorted by date |
| GET | `/api/events/:id` | | one event, or 404 |
| POST | `/api/events` | `title, date, type, host` | 201 + the new event |
| PUT | `/api/events/:id` | any of `title, date, type, host, description, location, theme, image, template, tag, visibility` | updated event |
| DELETE | `/api/events/:id` | | 204 |
| POST | `/api/events/:id/clone` | `title, date, tag?` | 201 + the copy |
| POST | `/api/events/:id/co-organizers` | `email, role, notify?, access?` | 201 + event (409 if duplicate) |
| DELETE | `/api/events/:id/co-organizers/:coId` | | event |
| POST | `/api/events/:id/rsvps` | `name, status?` | 201 + event |
| PATCH | `/api/events/:id/rsvps/:rsvpId` | `status` | event |
| DELETE | `/api/events/:id/rsvps/:rsvpId` | | event |
| POST | `/api/events/:id/share` | `platform` | event (count + 1) |

Status codes used: `200` OK, `201` created, `204` deleted, `400` invalid input, `404` not found, `409` conflict, `413` body too large, `500` server bug.

Allowed values: `type` = Meeting, Workshop, Wedding, Party, Webinar, Other. `theme` = Purple, Yellow, Green, Red, Blue. `role` = Co-organizer, Moderator, Live Streamer. RSVP `status` = Confirmed, Pending, Declined. `platform` = Facebook, Twitter, Instagram.

### Try it

```bash
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Product Launch","date":"2027-03-10T18:00","type":"Webinar","host":"Sohail"}'

curl http://localhost:4000/api/events
```

## Design notes

- **Validation lives on the server.** The browser can be bypassed, so every route cleans and checks its input. A `PUT` only accepts a fixed list of fields, so a client cannot overwrite `id`, `createdAt`, RSVPs or share counts.
- **Same data shape as the React app**, so connecting them is mostly replacing localStorage calls with `fetch`.
- **Swappable storage.** `jsonStore.js` and `mongoStore.js` both provide `list, get, insert, replace, remove, flush, close`. `index.js` picks one. The same test file runs against both.
- **Same ids as before.** MongoDB's own `_id` holds our UUID, and the store converts back, so the API and the React app see exactly the same event shape.
- **Safe file writes** (JSON store). Writes are queued one at a time and go to a temp file first, then get renamed.

## Not done yet

- No login or users, so anyone who can reach the server can change any event.
- Changes are "read the event, change it, write it back". Two people editing the same event at the same instant could overwrite each other. Fine for now; later we can use MongoDB's atomic updates.
- The MongoDB store has not been run against a real MongoDB yet in this project (needs your Atlas connection string). The JSON store passes all 15 tests.
- No email sending, rate limiting, or image upload to disk (images are stored inside the event as text).
