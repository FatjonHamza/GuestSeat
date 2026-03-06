# GuestSeat

Event and guest management app: create events, manage guest lists, seating plans, invitations, and check-in.

## Features

- **Events** — Create events with name, date, time, venue, and theme
- **Guest list** — Add guests, assign tables, view RSVP status, edit or delete guest groups
- **Seating plan** — Drag-and-drop guests to tables; add tables and guests from the sidebar
- **Invitations** — Create invitations with unique RSVP links; copy link with feedback animation
- **Invitation template** — Customize invitation text, theme, and event details
- **Check-in** — Search guests by name for quick lookup at the door
- **RSVP** — Public RSVP page per invitation (token-based link)

## Tech stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS, Motion
- **Backend:** Express, better-sqlite3
- **Data:** SQLite (`guestseat.db`)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

## Run locally

1. **Clone and install**
   ```bash
   git clone https://github.com/FatjonHamza/GuestSeat.git
   cd GuestSeat
   npm install
   ```

2. **Environment (optional)**  
   Copy `.env.example` to `.env` and set variables if needed (e.g. `GEMINI_API_KEY`). For production builds that talk to a separate API, set `VITE_API_BASE` to your backend URL.

3. **Start the app**
   ```bash
   npm run dev
   ```
   Opens the app and API (e.g. http://localhost:5173). The dev server runs both the Vite frontend and the Express API.

## Deploy (e.g. Vercel)

Vercel serves only the **frontend** (static build). The **API** (Express + SQLite in `server.ts`) does not run on Vercel, so `/api/*` will 404 and the app will fail when creating events or loading data.

**Option A – Backend on another host (recommended)**  
1. Deploy the **backend** to a Node host (e.g. [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io)) by running `server.ts` (and serving the built frontend from it, or only the API).  
2. In your **Vercel** project, add an environment variable:  
   **`VITE_API_BASE`** = your backend URL (e.g. `https://your-app.railway.app`).  
   No trailing slash.  
3. Redeploy the frontend on Vercel. The built app will call `VITE_API_BASE` for all API requests.

**Option B – Single server (simplest)**  
Deploy the whole app (Express + Vite build) to a single Node server so the same origin serves both the app and `/api`. No `VITE_API_BASE` needed.

### Deploy on Railway (one app, one URL)

The repo includes **`railway.toml`** so Railway runs the full Node server (API + frontend) with the right build and start commands.

1. Push your code to GitHub (including `railway.toml`).
2. Go to [railway.app](https://railway.app), sign in, and **New Project** → **Deploy from GitHub repo** → choose `FatjonHamza/GuestSeat`.
3. Railway will use `railway.toml`: **Build** = `npm install && npm run build`, **Start** = `NODE_ENV=production npm start`. No need to set these in the dashboard unless you want to override.
4. Deploy. You’ll get a public URL (e.g. `https://guestseat-production-xxx.up.railway.app`). Open it: the app and API both work from that URL.
5. If you see **405 on POST /api/events**, the service was likely started without `NODE_ENV=production` (so the wrong code path ran). Redeploy after `railway.toml` is in the repo, or in the service **Settings** set **Start Command** to `NODE_ENV=production npm start` and add variable **`NODE_ENV`** = `production`.

**Note:** SQLite stores data in `guestseat.db` on the server. On Railway the filesystem can be ephemeral, so the DB may reset on redeploy unless you add a **volume** for the project root in Railway’s settings.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server (API + frontend) |
| `npm run build`| Production build (Vite)  |
| `npm start`    | Run production server (after build) |
| `npm run preview` | Preview production build |
| `npm run lint` | Type-check (tsc --noEmit) |

## Project structure

```
├── server.ts          # Express API + SQLite
├── index.html
├── src/
│   ├── App.tsx        # Main app, routing, sidebar
│   ├── main.tsx
│   ├── types.ts
│   ├── services/api.ts
│   ├── constants.tsx
│   └── components/
│       └── screens/   # Dashboard, GuestList, SeatingPlan, Invitations, etc.
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## License

Private / unlicensed. All rights reserved.
