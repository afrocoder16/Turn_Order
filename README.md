# Turn Order: unofficial Midvora sample site

A fast, static website concept for Turn Order (board-game shop and play space, 1113 E College Dr, Suite 6, Marshall, MN). Not the shop's official site. Built from public sources only. See `evidence/claims-ledger.md` for where every fact comes from.

## Pages and features

- **Home**: hero, **weekly promo strip**, "three ways to play", this week's events, Game Finder, story, hours.
- **Play & Shop**: open play, premium library, shop, **game request builder**, FAQ.
- **Events**: weekly rhythm, filterable calendar, expandable **"What to expect"** details, "Add to calendar" per event and **"Add all"** (.ics), RSVP link. Past events hide automatically.
- **Private rooms**: request builder that writes a text message. Nothing is collected or sent by the site.
- **Visit**: hours, directions, contact, community links.
- Live "Open now / Closed" badge (Central time), mobile Call / Directions bar, FAQ accordions.
- No tracking, no cookies, no third-party requests. Fonts are self-hosted.

## Update content (no coding)

Everything the owners change lives in `data/`:

| File | What it holds |
|---|---|
| `data/events.json` | Events. Copy a block, change `date`, `start`, `end`, `title`, `type` (`ltp`, `magic`, `villainous`, `chess`, `special`). Optional `details` (a list of bullets shown under "What to expect"), `rsvp` (link), `unconfirmed` (adds a Confirm flag). |
| `data/promos.json` | Weekly promos under the hero. Each has `from` and `until` dates (inclusive). It appears on `from`, disappears after `until`, and the whole strip hides when nothing is live. Shows up to 3, soonest-ending first. `tag` is the badge ("10% off"), `icon` is an emoji, `cta` is the button. |
| `data/site.json` | Phone, address, hours, social links, seasonal note. |
| `data/games.json` | Games the Game Finder can suggest. |

Weekly routine: add next week's promo and events to the two JSON files, then rebuild.

To rebuild: `node src/build.mjs` (Node 18+, no installs). The pages are regenerated in the project root.

Demo any moment: add `?now=2026-10-24T18:30` to a page URL to see it as if it were then.

## Before sharing publicly

1. Replace the Wikimedia placeholder photos in `assets/img/` with the shop's own (see `data/image-credits.json`, `credits.html`).
2. Replace each "Confirm with store" marker with the owners' answer: open-play fee, premium-library price, room rates, parking and accessibility, age guidance. Room capacity (tables seat 6 to 8) is already confirmed.
3. Confirm the owners' names and the story paragraph with them. It paraphrases a pre-opening newspaper article.
4. Confirm the Werewolf Night end time: the event post says 8:30 pm, the October calendar graphic says 8 pm. The site uses 8:30 pm.
5. Choose the Discord invite. Two different ones appear on the shop's Facebook page.
6. Build with the real address so sharing previews and the sitemap work: `SITE_URL=https://example.com node src/build.mjs`.
7. Keep the "Unofficial Midvora concept" strip until the owners approve.

## Publish

Static files, so any host works. For GitHub Pages: push to `main`, then Settings → Pages → Deploy from branch → `/ (root)`.

## Checks run (2026-10-15)

Lighthouse mobile 94-99 performance, 100 accessibility, 100 best practices, 100 SEO. axe-core: 0 violations at 360 and 1280 px. HTML validator: 0 errors. No horizontal scroll at 360, 390, 768, 1280 px. Not yet checked: real phones, Facebook's in-app browser, the Rich Results Test, and any owner or local-user testing.
