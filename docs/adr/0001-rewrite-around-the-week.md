# 1. Rewrite around the week, keeping the data

Date: 2026-10-27. Status: accepted.

## Context

The first version was generated with Antigravity. Its data model fitted the domain, and the
Spelthorne listings were real work, but the app didn't typecheck, two pages were placeholders with
made-up content, the detail page was never built, and the admin page and its server functions had
no authentication. A design review ("Compass design review", October 2026) recommended a rewrite.

John's feedback on the review shaped it:
- Current users want to know what happens on each day of the week so they can plan around it.
  "Today and tomorrow" suits one-off events, not regular sessions.
- People use Google Maps already, so keep it.
- Compass will expand to other areas and kinds of event.
- Listings will be crowd-sourced, so checking accuracy has to work for that.

## Decision

Rebuild from scratch on the same stack as Wordball and Nudge, with the week as the home page, a
separate "coming up" page for one-off events, search with a Google map, and a page per listing.
Keep the leaflet data and convert it again from the original source, rather than from the earlier
conversion, which had invented map positions.

## Consequences

Areas, categories, regular and one-off listings are in the model from the start. The week is
computed from pure functions in `src/core/schedule.ts`, which the browser and server share and
which are tested against Surrey's real term dates.
