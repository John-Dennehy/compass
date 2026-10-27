# Compass

**What's on for families, week by week.** Compass is a local guide to playgroups, baby groups,
rhymetime, classes and one-off family events, kept up to date by the people who go.

It starts in Spelthorne (Staines, Ashford, Stanwell, Sunbury, Shepperton and Laleham) with the
council's playgroups leaflet, and is built to grow into other areas and other kinds of event.

## What it does

- **The week first.** Most families plan around a regular week, so the home page is Monday to
  Sunday with every session in time order. Groups that only run in term time know the Surrey
  school holidays, and show as "not on in half term" instead of quietly disappearing.
- **Coming up.** One-off events (fairs, open days, holiday activities) in date order.
- **Search and map.** Words, age, town, kind and cost, sorted by distance from a postcode, with
  Google Maps alongside because it's the map people already use on their phones. Every listing
  links straight to Google Maps and directions.
- **Honest about freshness.** Every listing says when it was last checked and by whom. Anyone can
  tap "still on" or "it's stopped" without signing in; two "stopped" reports warn everyone.
- **Crowd-sourced, with moderation.** Signed-in contributors (email link, no passwords) suggest
  new listings and changes, which go to a moderation queue. Contributors with a good record go to
  the front. Organisers can claim their listing and update it directly, and get a badge. Every
  change is kept in a public history that never shows who made it.

## How it's built

|         |                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------- |
| App     | TanStack Start (React 19, server functions, SSR so shared links preview properly)                  |
| Data    | Neon Postgres through Drizzle, or an in-memory store when there's no database                      |
| Rules   | A pure TypeScript core in `src/core`, shared by the browser and the server                         |
| Checks  | zod schemas for every listing, on both sides                                                       |
| Styling | Tailwind 4, colours checked for WCAG AA contrast in light and dark                                 |
| Tests   | Vitest for the core, the server rules and real Postgres (PGlite); Playwright on desktop and mobile |

```
src/core      Listing schema, dates, term times, the week, filters, freshness, trust, changes
src/data      The launch data (from src/data/sources) and Surrey term dates
src/server    Storage, sign-in, the service rules, and the server functions pages call
src/routes    Pages: the week, coming up, search, a listing, add, change, moderate
```

The design notes are in [CONTEXT.md](CONTEXT.md) and [docs/adr](docs/adr).

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000, with in-memory data
pnpm test         # unit and Postgres tests
pnpm test:e2e     # browser tests (builds first)
pnpm lint && pnpm typecheck
```

Locally there's no email, so the sign-in page shows the link instead. To moderate, put your
email in `MODERATOR_EMAILS`. See [.env.example](.env.example) for every setting.

## Deploying

1. Import the repo in Vercel and add a Neon database through the integration (it sets
   `DATABASE_URL`). Migrations run on each deploy, and an empty database fills itself with the
   launch listings on first use.
2. Set `SESSION_SECRET` (32+ random characters), `MODERATOR_EMAILS`, `RESEND_API_KEY`,
   `EMAIL_FROM` and `SITE_URL`.
3. For the map, create a Google Maps JavaScript API key and set `VITE_GOOGLE_MAPS_API_KEY`.
   **Restrict it**: in Google Cloud, limit it to HTTP referrers `https://your-domain/*` and to the
   Maps JavaScript API only, and set a budget alert. The key is visible in the browser, so the
   restriction is what keeps it safe. Without a key the site works; the map just isn't shown.
4. Sign in as a moderator and press "Look up map positions" on the moderation page, which
   replaces the launch data's rough pins with positions from each postcode.

## Data

The launch listings come from Spelthorne's playgroups leaflet (September 2025), kept unchanged in
[src/data/sources](src/data/sources). Term dates come from
[Surrey County Council](https://www.surreycc.gov.uk/schools-and-learning/schools/term-dates).
