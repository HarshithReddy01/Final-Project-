# Vitrine

A quiet reading room for The Metropolitan Museum of Art's Open Access collection. Search more than 470,000 works, read any record as a museum wall label, and keep a private collection with your own notes.

**Live site:** https://harshithreddy01.github.io/Final-Project-/

The API runs on Render's free plan, which sleeps when idle. Searching works instantly because it talks to The Met directly; the first sign-in after a quiet period can take up to a minute while the server wakes up.

## Features

- **Explore** — keyword search across all fields, titles, artists or subjects, with department, date-range, highlights and on-view filters. Results are paginated and every filter lives in the URL, so searches can be shared and the back button works.
- **Artwork pages** — the full wall label (date, medium, dimensions, credit line, accession number, gallery), alternate views, a full-size viewer, and subject tags that lead back into search.
- **Accounts** — register and sign in with a username and password. Passwords are hashed with bcrypt.
- **Your collection** — save works, write private notes, then filter and sort what you've saved. Everything is stored in SQLite (Turso in production).

## Tech stack

| Part | Technology |
| --- | --- |
| Client | Vite 8, React 19, TypeScript 7, React Router 8, TanStack Query 5, CSS Modules |
| Server | Node.js 26, Express 5, libSQL / SQLite, bcrypt, zod, helmet, express-rate-limit |
| Data | The Met Collection API (artworks), Turso (users, sessions, saved works) |
| Quality | Vitest, Supertest, oxlint, strict TypeScript |
| Hosting | GitHub Pages (client), Render (API), Turso (database) |

## Architecture

```
Browser (GitHub Pages)
 ├─▶ The Met Collection API ── search, object records, departments
 └─▶ Vitrine API (Express on Render) ──▶ Turso (libSQL)
```

Both halves are object-oriented. Every piece of non-visual logic is a class with a single job, and dependencies are passed in through constructors.

**Server.** `App` is the composition root that wires everything together:

- `AppConfig` validates the environment once at startup.
- `Database` wraps the libSQL client; `RowReader` type-checks every column it reads; versioned migrations are recorded in a `schema_migrations` table.
- Repositories own the SQL: `UserRepository`, `SessionRepository`, `FavoriteRepository`.
- Services own the rules: `AuthService`, `FavoriteService`, `PasswordHasher`, `SessionTokens`.
- The HTTP layer is made of `AuthController`, `FavoriteController`, `AuthMiddleware`, `BearerToken`, `CorsPolicy`, `RequestValidator`, `ErrorHandler` and `HttpError`.
- `HttpServer` handles listening and graceful shutdown.

**Client.** React components are function components that stay focused on rendering. They reach the logic through thin hooks over classes in `client/src/lib`:

- `HttpClient` and `ApiError` handle transport and errors.
- `MetMuseumClient` talks to The Met.
- `Artwork`, `ArtworkImage`, `SearchQuery`, `Pagination` and `Period` model the collection.
- `AuthApi`, `FavoritesApi`, `SessionTokenStore`, `Favorite` and `FavoriteCollection` cover accounts and saved works.
- `SafeRedirect` and `AuthPaths` keep redirects safe.

## Security

- Passwords are hashed with bcrypt (cost 12), and the 72-byte bcrypt limit is enforced. Unknown usernames are checked against a dummy hash, so a failed login takes the same time either way.
- Sessions use 256-bit random tokens. Only their SHA-256 hash is stored. Sessions expire after 14 days and are revoked on sign-out.
- Because the site and the API live on different domains, the client sends the session as a bearer token rather than relying on third-party cookies.
- The API enforces a CORS allowlist and rate-limits sign-in and registration. It sends helmet security headers and marks every response `no-store`.
- Every request body and parameter is validated with zod, and all SQL uses bound parameters.

## Running locally

Requires Node.js 22.22 or newer (developed on Node 26).

```bash
npm install
npm run dev
```

- Client: http://localhost:5173. The Vite dev server proxies `/api` to the API.
- API: http://localhost:3001

With no configuration, the API stores data in a local SQLite file at `server/data/vitrine.db`. To use a Turso database instead, create `server/.env`:

```
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

To run the production build as a single site, use `npm run build` and then `npm start`. The API serves the built client on http://localhost:3001.

### Server environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port to listen on |
| `NODE_ENV` | `development` | `development`, `production` or `test` |
| `TURSO_DATABASE_URL` | local file `data/vitrine.db` | A `libsql://` or `https://` URL, a `file:` URL, `:memory:`, or a path |
| `TURSO_AUTH_TOKEN` | — | Turso token (only used for remote URLs) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Comma-separated origins allowed to call the API; required in production |
| `SESSION_TTL_DAYS` | `14` | Session lifetime |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |
| `TRUST_PROXY` | `1` in production | Proxy hops to trust for client IPs |
| `CLIENT_DIST_PATH` | `../client/dist` | Built client to serve from the API |

The client reads one optional build-time variable: `VITE_API_URL`, the origin of the API. When it is empty, the client calls `/api` on the same origin.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the client with live reload |
| `npm test` | Runs the server and client test suites |
| `npm run lint` | Runs oxlint on both packages |
| `npm run typecheck` | Type-checks both packages |
| `npm run check` | Runs type-checking, linting and tests |
| `npm run build` | Builds the client and the server |
| `npm start` | Starts the built server |

## Deployment

- **Database:** a Turso database. Migrations run automatically when the API starts.
- **API:** `render.yaml` is a Render Blueprint for a free Node web service. `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are entered in Render's dashboard and never committed.
- **Client:** `.github/workflows/deploy-pages.yml` type-checks, lints and tests the client. It then builds with the `/Final-Project-/` base path and the API origin, adds a `404.html` fallback for deep links, and publishes to GitHub Pages on every push to `master`.

## API

All responses are JSON. Errors have the shape `{ "error": { "code", "message", "fields"? } }`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/auth/session` | optional | Returns `{ user }`, or `{ user: null }` when signed out |
| `POST` | `/api/auth/register` | — | `{ username, password }` → `201 { user, session: { token, expiresAt } }` |
| `POST` | `/api/auth/login` | — | `{ username, password }` → `{ user, session }` |
| `POST` | `/api/auth/logout` | bearer | Revokes the session → `204` |
| `GET` | `/api/favorites` | bearer | `{ favorites }`, newest first |
| `PUT` | `/api/favorites/:objectId` | bearer | Saves a work (idempotent) → `201` or `200 { favorite }` |
| `PATCH` | `/api/favorites/:objectId` | bearer | `{ note }` → `{ favorite }` |
| `DELETE` | `/api/favorites/:objectId` | bearer | Removes a saved work → `204` |

## Project structure

```
client/                 Vite + React app
  src/app/              router, layout, header, footer, query client
  src/components/       shared UI (frames, cards, grid, forms, buttons)
  src/hooks/            hooks over the lib classes
  src/lib/              HTTP, The Met client, domain models, Vitrine API
  src/pages/            explore, artwork, collection, auth, not found
  src/styles/           design tokens and base styles
server/                 Express API
  src/                  config, database, users, auth, favorites, http
  test/                 Vitest + Supertest suites
render.yaml             Render Blueprint for the API
.github/workflows/      GitHub Pages deployment
```

## Credits

Collection data and images come from [The Metropolitan Museum of Art Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) program (CC0). Typefaces: Instrument Serif, Instrument Sans and IBM Plex Mono, under the SIL Open Font License.

Built by Harshith Reddy Nalla as a final project.
