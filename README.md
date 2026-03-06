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
   Copy `.env.example` to `.env` and set variables if you use features that need them (e.g. `GEMINI_API_KEY` for AI-related features).

3. **Start the app**
   ```bash
   npm run dev
   ```
   Opens the app and API (e.g. http://localhost:5173). The dev server runs both the Vite frontend and the Express API.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server (API + frontend) |
| `npm run build`| Production build (Vite)  |
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
