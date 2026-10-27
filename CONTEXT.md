# Compass: context

Words used in the code and on the site, and what they mean.
- **Area**: a place Compass covers, like Spelthorne. It has towns, a map centre and the school
  term dates its groups follow. Everything is listed in exactly one area.
- **Listing**: one thing people can go to. Either **regular** (sessions that repeat) or
  **one-off** (an event on one or more dates). Both have a category, who it's for, a venue, cost,
  contacts, links and notes.
- **Session**: one regular time slot: a day, a start and maybe an end, every week, every other
  week (from a known date) or once a month (the nth or last weekday). It can be **term time
  only**, and can have a label when a group splits, like Jingle Tots' "babies" and "confident
  movers".
- **The week**: Monday to Sunday for a given week, with every session and event that day. A
  term-time session in the holidays shows as **off**, and outside the known term dates as
  **check**, rather than vanishing.
- **Category**: the kind of thing, like "Stay and play". Categories are data, not code, so new
  kinds of event don't need a release.
- **Who it's for**: the organiser's own words ("0 to 4 years"), plus **ages** in months for
  filtering (the upper age is "under"), and whether **expectant parents** are welcome.
- **Freshness**: when a listing was last confirmed and by whom: the source leaflet, a visitor,
  a contributor, the organiser or a moderator. **Recent** up to 90 days, **check** to 180, then
  **stale**.
- **Still on / stopped**: anonymous taps from people who went. One per browser per listing per
  week. "Still on" refreshes freshness; two different people saying "stopped" warns everyone and
  puts the listing in front of a moderator.
- **Contributor**: someone signed in by email link. Their **trust** is **new**, or **trusted**
  after three approved suggestions with at most one in five rejected.
- **Suggestion**: a proposed **new** listing, a **change** (only the fields that differ from the
  version they were looking at), or a **claim** to be a listing's organiser.
- **Organiser**: a contributor a moderator has linked to a listing. Their changes go live
  directly and the listing is **verified**.
- **Moderator**: anyone whose email is in `MODERATOR_EMAILS`, checked on every request.
- **Revision**: a saved version of a listing, with what changed and a public description of who
  (never their name). The history is every revision.
