# Turn Order: concept preview by Midvora

A fast, static website concept for Turn Order (board-game shop and play space, 1113 E College Dr, Suite 6, Marshall, MN). Not the shop's official site. Built from public sources only. See `evidence/claims-ledger.md` for where every fact comes from.

## What's in it

**Look:** dark "tabletop at night" theme built on the hexagon from the shop's logo. Self-hosted fonts (Chakra Petch, DM Sans). No tracking, no cookies, no third-party requests.

**Pages:** Home, Play & Shop, Events, Private rooms, Visit (plus photo credits and a 404).

**Features**

| Feature | Where | What it does |
|---|---|---|
| Honeycomb board + d20 | Home hero | Hex tiles link to each section. The d20 picks "tonight's game" from the games the shop has run. |
| Live hex field | Home hero | A grid that lights up under the cursor. Off for reduced-motion users. |
| Next-event countdown | Home hero | "Starts in 4h 0m", "Happening now", "Tomorrow at 6 pm". |
| Weekly promo strip | Home, under hero | Promos switch on and off by date, with "Ends tonight" badges. |
| Weekly turn order | Home | Seven-day tracker. Pick a day to see its events. Arrow keys work. |
| Event cards | Home, Events | "What to expect" details, Share, Add to calendar, and Add all (.ics). Past events hide themselves. Links like `events.html#chess` open pre-filtered. |
| Game finder | Home | Players, time and mood give three suggestions. |
| Request builders | Rooms, Play | Write a text for a private-room or game request. Nothing is sent by the site. |
| Open now badge | Everywhere | Live open/closed in Central time. |
| Mobile bar | Phones | Call, Directions, Events always in reach. |

## Update content (no coding)

Everything the owners change lives in `data/`:

| File | What it holds |
|---|---|
| `data/events.json` | Events. Copy a block, change `date`, `start`, `end`, `title`, `type` (`ltp`, `magic`, `villainous`, `chess`, `special`). Optional `details` (bullets under "What to expect") and `rsvp` (link). |
| `data/promos.json` | Weekly promos under the hero. Each has `from` and `until` dates (inclusive). It appears on `from`, disappears after `until`, and the strip hides when nothing is live. Shows up to 3, soonest-ending first. `tag` is the badge, `icon` an emoji, `cta` the button. |
| `data/site.json` | Phone, address, hours, social links, seasonal note. |
| `data/games.json` | Games the finder and the d20 can suggest. |

Weekly routine: add next week's promo and events to the two JSON files, then rebuild.

To rebuild: `node src/build.mjs` (Node 18+, no installs). The pages are regenerated in the project root.

Demo any moment: add `?now=2026-10-24T18:30` to a page URL to see the site as if it were then (promos, countdown, open/closed, tracker all follow it).

## Before sharing publicly

1. Replace the Wikimedia placeholder photos in `assets/img/` with the shop's own (see `data/image-credits.json`, `credits.html`).
2. The shop hasn't published a few details, so the site says "ask at the counter" or "we'll confirm". Swap in real answers when the owners give them: the open-play fee, the game library's pricing, private-room rates.
3. Confirm the owners' names and the story paragraph with them.
4. Confirm the Werewolf Night end time: the event post says 8:30 pm, the October calendar graphic says 8 pm. The site uses 8:30 pm.
5. Choose the Discord invite. Two different ones appear on the shop's Facebook page.
6. Build with the real address so sharing previews and the sitemap work: `SITE_URL=https://example.com node src/build.mjs`.
7. Keep the "Concept preview by Midvora" strip until the owners approve.

## Publish

Static files, so any host works. For GitHub Pages: push to `main`, then Settings → Pages → Deploy from branch → `/ (root)`.

## Checks run (2026-10-15)

Lighthouse mobile: 95-99 performance, 100 accessibility, 100 best practices, 100 SEO on every page. axe-core: 0 violations at 360 and 1280 px. HTML validator: 0 errors. No horizontal scroll at 360, 390, 768, 1280 px. Layout shift 0. Interactions tested in headless Chrome: countdown states, tracker, d20, filters, calendar export, request builders, promo expiry by date. Not yet checked: real phones, Facebook's in-app browser, and owner or local-user testing.
