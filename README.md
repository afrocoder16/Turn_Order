# Turn Order: concept preview by Midvora

A fast, static website concept for Turn Order (board-game shop and play space, 1113 E College Dr, Suite 6, Marshall, MN). Not the shop's official site. Built from public sources only. See `evidence/claims-ledger.md` for where every fact comes from.

## What's in it

**Look:** built on the hexagon from the shop's logo. Sections alternate light and dark, with one "pop" colour for buttons and highlights. The default palette is Coral Dusk (slate, steel, sky, ice and coral). Self-hosted fonts (Chakra Petch, DM Sans). No tracking, no cookies, no third-party requests, apart from the Midvora sample gate described below.

**Colour schemes:** the palette button in the header switches the whole site live between Coral Dusk, Ember, Meeple Forest and Arcade Violet. The choice is remembered in the visitor's browser. Open any page with `?theme=ember` (or `forest`, `arcade`, `coral`) to link straight to one. Each theme is five hex codes at the top of `assets/css/styles.css` (search for `data-theme`), plus a matching entry in `THEMES` in `assets/js/main.js`. Set the default in `data/site.json` (`"theme"`).

**Pages:** Home, Play & Shop, Events, Private rooms, Visit (plus photo credits and a 404).

**Features**

| Feature | Where | What it does |
|---|---|---|
| Honeycomb board + d20 | Home hero | Hex tiles link to each section. The d20 picks "tonight's game" from the games the shop has run. A natural 20 throws hex confetti. |
| Live hex field | Home hero | A grid that lights up under the cursor. Off for reduced-motion users. |
| Next-event countdown | Home hero | "Starts in 4h 0m", "Happening now", "Tomorrow at 6 pm". |
| Weekly promo strip | Home, under hero | Promos switch on and off by date, with "Ends tonight" badges. |
| Weekly turn order | Home | Seven-day tracker. Pick a day to see its events. Arrow keys work. |
| Event cards | Home, Events | "What to expect" details, Share, Add to calendar, and Add all (.ics). Past events hide themselves. Links like `events.html#chess` open pre-filtered. |
| Game finder | Home | Players, time and mood give three suggestions. |
| Request builders | Rooms, Play | Write a text for a private-room or game request. Nothing is sent by the site. |
| Open now badge | Everywhere | Live open/closed in Central time. |
| Motion | Home | Hero intro, scroll parallax, crossing tape bands, magnetic buttons, cursor spotlight on cards, scroll progress bar. All off for reduced-motion users. |
| Mobile bar | Phones | Call, Directions, Events always in reach. |

## Update content (no coding)

Everything the owners change lives in `data/`:

| File | What it holds |
|---|---|
| `data/events.json` | Events. Copy a block, change `date`, `start`, `end`, `title`, `type` (`ltp`, `magic`, `villainous`, `chess`, `special`). Optional `details` (bullets under "What to expect") and `rsvp` (link). |
| `data/promos.json` | Weekly promos under the hero. Each has `from` and `until` dates (inclusive). It appears on `from`, disappears after `until`, and the strip hides when nothing is live. Shows up to 3, soonest-ending first. `tag` is the badge, `icon` an emoji, `cta` the button. |
| `data/site.json` | Phone, address, hours, social links, seasonal note, default theme. |
| `data/games.json` | Games the finder and the d20 can suggest. |

Weekly routine: add next week's promo and events to the two JSON files, then rebuild.

To rebuild: `node src/build.mjs` (Node 18+, no installs). The pages are regenerated in the project root. For the live site use `SITE_URL=https://afrocoder16.github.io/Turn_Order node src/build.mjs`.

Demo any moment: add `?now=2026-10-24T18:30` to a page URL to see the site as if it were then (promos, countdown, open/closed, tracker all follow it).

## Midvora sample gate

While this is a sample, a first-time visitor sees a Midvora page asking for their name and email. Submitting it emails Midvora (through [Web3Forms](https://web3forms.com)) with the name, email, time, referring page and browser, then reloads into the site. The visitor is remembered in their browser (`localStorage`, key `midvora-sample-visitor:turn-order`), so they see it once per browser.

- Settings are in `data/gate.json`: `enabled`, the Web3Forms `accessKey` (public by design: it only lets a page send mail to Midvora) and the `business` name used on the page and in the email subject. With an empty `accessKey` nothing is sent and the visitor just goes through, which is handy for a local preview.
- It is a soft gate: it records who looked, it does not hide anything. The pages and files are still public.
- How it loads: a small snippet that `src/build.mjs` writes into every page's `<head>` checks the browser's storage. A visitor already on record loads nothing more. Anyone else has the page hidden and `assets/js/gate.js` loaded.
- It never traps a visitor. If the browser blocks storage, or the gate has not drawn itself within 6 seconds, the site opens. If sending fails, the visitor sees "try again in 5 minutes" and can retry.
- Built to survive stale caches (GitHub Pages lets browsers keep files for 10 minutes). `gate.js` carries its own styling inside a shadow root, so the site's CSS cannot reach it and an old copy of `styles.css` cannot leave it half-styled. Its address carries a version tag made from the gate's files (`gate.js?v=…`), so an edited gate is never served from an old copy. Keep it that way: do not move the gate's styling into `assets/css/styles.css`.
- The heading uses Fraunces (`assets/fonts/fraunces-700.woff2`, SIL OFL), fetched only when the gate shows.
- Before handing the site to the shop, set `"enabled": false` in `data/gate.json` and rebuild. The pages then come out exactly as they were before the gate existed.

Rebuild after any change with `SITE_URL=https://afrocoder16.github.io/Turn_Order node src/build.mjs`. To see the gate again in a browser, clear the site's storage (or delete the `midvora-sample-visitor:turn-order` key).

## Third-party code

GSAP 3.15 and its ScrollTrigger plugin (`assets/js/vendor/`) drive the hero intro and scroll effects. They are self-hosted and used under GSAP's standard "no charge" licence (https://gsap.com/standard-license). The site works without them: if they fail to load, everything is simply static. Only the home page loads them.

## Before sharing publicly

1. Replace the Wikimedia placeholder photos in `assets/img/` with the shop's own (see `data/image-credits.json`, `credits.html`).
2. The shop hasn't published a few details, so the site says "ask at the counter" or "we'll confirm". Swap in real answers when the owners give them: the open-play fee, the game library's pricing, private-room rates.
3. Confirm the owners' names and the story paragraph with them.
4. Confirm the Werewolf Night end time: the event post says 8:30 pm, the October calendar graphic says 8 pm. The site uses 8:30 pm.
5. Choose the Discord invite. Two different ones appear on the shop's Facebook page.
6. Keep the "Concept preview by Midvora" strip until the owners approve.

## Publish

Static files, so any host works. For GitHub Pages: push to `main`, then Settings → Pages → Deploy from branch → `/ (root)`.

## Checks run (2026-10-15)

- axe-core: 0 violations on all 7 pages in all 4 themes, at 360 px and 1280 px (56 combinations). HTML validator: 0 errors.
- Lighthouse mobile (standard simulated throttling): 100 accessibility, 100 best practices, 100 SEO on every page. Performance 93-99 on inner pages and about 87-89 on the home page, which carries the most motion. Real-browser first paint is under half a second; under heavy CPU throttling the home page's main thread is busy for a couple of seconds.
- Interactions tested in headless Chrome: theme switch and persistence, hero intro, d20 and confetti, countdown states, tracker, filters, calendar export, request builders, promo expiry by date, reduced motion.
- Sample gate (added after the checks above, which were run without it; tested in Chrome on 2026-10-16): reproduced the earlier failure (new pages while the browser still held the previous stylesheet) and ran the same steps on this version; every page and a deep link; three phone sizes; sending with no connection, a rejected key, a server error and no answer for 15 seconds, plus success, with the network faked; a returning visitor loading nothing extra (`index.html` grows by about 0.5 KB); the site opening when `gate.js` is missing or storage is blocked; nothing behind the gate reachable by keyboard; an edited gate being picked up after the next deploy; axe-core 4.13 (WCAG 2.2 AA plus best practice) with 0 violations, and the gradient button's text at 4.7:1 and 6.3:1 by calculation.
- Not yet checked: Safari and Firefox, real phones, Facebook's in-app browser, and owner or local-user testing.
