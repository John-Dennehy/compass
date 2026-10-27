# 2. Crowd-sourced accuracy: freshness, quick taps and a moderation queue

Date: 2026-10-27. Status: accepted.

## Context

Out-of-date information is the problem Compass exists to solve, and the listings will come from
the public. Anything that makes reporting hard means fewer reports; anything that lets anyone
publish means spam and mistakes.

## Decision

- Every listing shows when it was last confirmed, and by whom.
- "Still on" and "it's stopped" are one tap and need no account. A cookie limits each browser to
  one answer per listing per week. Two different people saying "stopped" shows a warning.
- Changes and new listings need an email-link sign-in, and go to a moderation queue. A change
  stores only the fields that differ from the version the person was looking at, so it can't undo
  someone else's change, and the moderator sees exactly what would change.
- Trusted contributors go to the front of the queue. Organisers update their own listing
  directly. Moderators publish directly.
- Every applied change is a revision. The public history says what changed and what kind of
  person changed it, never who.
- Spam: rate limits (three waiting suggestions for new contributors, ten a day for anyone), a
  hidden form field, and a links check.

## Consequences

A wrong "still on" tap can make a listing look fresher than it is. The label says it came from
"someone who went", and organiser and moderator confirmations are labelled as such, so people can
weigh it. If abuse appears, taps can be limited by IP as well.
