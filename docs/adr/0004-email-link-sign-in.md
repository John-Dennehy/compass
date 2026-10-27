# 4. Email-link sign-in, and moderators from configuration

Date: 2026-10-27. Status: accepted.

## Decision

Contributors sign in with a one-time link sent by Resend. Only a hash of the token is stored, it
expires after 30 minutes, and the link opens a page with a button rather than signing in on load,
because some email scanners open links. The session is an HMAC-signed cookie. Moderators are the
addresses in `MODERATOR_EMAILS`, checked on every request, so removing someone takes effect at
once. Without an email key, local and test runs show the link on the page.

## Consequences

No passwords to store or reset, and no third-party account system. Names and emails are visible
only to moderators.
