# 3. Google Maps, with links out to the app

Date: 2026-10-27. Status: accepted.

## Context

The review suggested an open map to avoid a billed browser key. John's users already use Google
Maps on their phones and are familiar with it.

## Decision

Use Google Maps (`@vis.gl/react-google-maps`) for the search map and listing pages. Every listing
also has "Open in Google Maps" and "Directions" links, which work without any key and hand over to
the app people already have. The key is restricted to the site's domains and the Maps JavaScript
API, with a budget alert. Everything on the map is also in the list, for screen reader users.

Positions come from postcodes via postcodes.io (free, no key). The launch data's positions were
guesses, so they're marked approximate until a moderator looks them up.

## Consequences

Without a key the site still works, just without the map. Links out use the venue name and address,
so they're right even when a pin is approximate.
