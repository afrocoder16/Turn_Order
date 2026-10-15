// Static site builder: node src/build.mjs
// Reads data/*.json, writes the HTML pages into the project root. No dependencies.
// Optional: SITE_URL=https://example.com node src/build.mjs  (adds absolute URLs for sharing + sitemap)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const site = read("data/site.json");
const events = read("data/events.json");
const games = read("data/games.json");
const promos = read("data/promos.json");
const credits = read("data/image-credits.json");
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");

const A = site.address;
const addressLine = `${A.street}, ${A.city}, ${A.region} ${A.zip}`;
const CONFIRM = `<span class="confirm" title="Not yet confirmed with the owners">Confirm with store</span>`;

const DIMS = { "hero-table": [1920, 1440], chess: [1920, 1280], commander: [1920, 1280], dice: [1920, 1034], carcassonne: [1920, 1277], meeples: [1920, 1440], "magic-players": [1920, 1278], "rpg-group": [1000, 749] };
function img(name, alt, { sizes = "(max-width: 920px) 100vw, 560px", eager = false, cls = "" } = {}) {
  const [w, h] = DIMS[name];
  const big = name === "rpg-group" ? 1000 : 1200; // the rpg-group source is only 1000px wide
  return `<img src="assets/img/${name}-640.webp" srcset="assets/img/${name}-640.webp 640w, assets/img/${name}-${name === "hero-table" ? 900 : 1200}.webp ${name === "hero-table" ? 900 : big}w" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}${cls ? ` class="${cls}"` : ""}>`;
}

const ICONS = {
  pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>',
};

const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#2a62b8"/><polygon points="20,8 31,14 31,26 20,32 9,26 9,14" fill="#0b1226"/><circle cx="15" cy="15.5" r="2.4" fill="#5db7f2"/><circle cx="20" cy="20" r="2.4" fill="#5db7f2"/><circle cx="25" cy="24.5" r="2.4" fill="#5db7f2"/></svg>`;

const NAV = [
  ["play.html", "Play & Shop"],
  ["events.html", "Events"],
  ["rooms.html", "Private rooms"],
  ["visit.html", "Visit"],
];

function layout({ file, title, desc, body, schema = [], ogImage = "og.jpg", preloadHero = false }) {
  const preload = preloadHero ? '<link rel="preload" as="image" href="assets/img/hero-table-640.webp" imagesrcset="assets/img/hero-table-640.webp 640w, assets/img/hero-table-900.webp 900w" imagesizes="(max-width: 920px) 90vw, 470px" fetchpriority="high">' : "";
  const abs = (p) => (SITE_URL ? `${SITE_URL}/${p}` : p);
  const canonical = SITE_URL ? `<link rel="canonical" href="${SITE_URL}/${file === "index.html" ? "" : file}">` : "";
  const ld = schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n");
  return finish(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#0b1226">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Turn Order">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${abs("assets/img/" + ogImage)}">
<meta name="twitter:card" content="summary_large_image">
${canonical}
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
${preload}
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/styles.css">
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<aside class="concept" aria-label="Concept notice">Unofficial <b>Midvora</b> concept: a sample design, not the shop's official website.</aside>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="index.html" aria-label="Turn Order, home">${LOGO}<span>Turn Order</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">
      ${NAV.map(([h, l]) => `<a href="${h}"${h === file ? ' aria-current="page"' : ""}>${l}</a>`).join("\n      ")}
      <a class="btn btn-primary btn-sm" href="visit.html">Plan a visit</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="footer">
  <div class="wrap">
    <div class="cols">
      <div>
        <a class="brand" href="index.html" style="color:#fff">${LOGO}<span>Turn Order</span></a>
        <p style="margin-top:.8rem">${site.tagline}</p>
      </div>
      <div>
        <span class="fh">Visit</span>
        <p>${A.street}<br>${A.city}, ${A.region} ${A.zip}<br><a href="${site.phoneHref}">${site.phone}</a></p>
        <p><span class="status" data-status data-state="closed">Hours</span></p>
      </div>
      <div>
        <span class="fh">Explore</span>
        <ul>
          <li><a href="play.html">Play &amp; Shop</a></li>
          <li><a href="events.html">Events</a></li>
          <li><a href="rooms.html">Private rooms</a></li>
          <li><a href="visit.html">Hours &amp; directions</a></li>
        </ul>
      </div>
      <div>
        <span class="fh">Community</span>
        <ul>
          <li><a href="${site.socials.facebook}" rel="noopener" target="_blank">Facebook</a></li>
          <li><a href="${site.socials.instagram}" rel="noopener" target="_blank">Instagram</a></li>
          <li><a href="${site.socials.tiktok}" rel="noopener" target="_blank">TikTok</a></li>
          <li><a href="${site.socials.discord}" rel="noopener" target="_blank">Discord</a></li>
        </ul>
      </div>
    </div>
    <p class="fine">Unofficial Midvora sample concept. Hours from the Marshall Area Chamber listing; events from the shop's public October 2026 schedule. Photos are licensed placeholders from Wikimedia Commons (<a href="credits.html">credits</a>) to be replaced with the shop's own. Facebook, Instagram, TikTok and Discord are separate services.</p>
  </div>
</footer>
<nav class="actionbar" aria-label="Quick actions">
  <a href="${site.phoneHref}">Call</a>
  <a href="${site.mapsUrl}" rel="noopener" target="_blank">Directions</a>
  <a href="events.html">Events</a>
</nav>
<script type="application/json" id="site-data">${JSON.stringify({ site, events, games, promos }).replace(/</g, "\\u003c")}</script>
<script src="assets/js/main.js" defer></script>
</body>
</html>
`);
}

// Encode stray "&" in markup (not inside <script> blocks, where JSON must stay untouched).
function finish(html) {
  return html
    .split(/(<script[\s\S]*?<\/script>)/)
    .map((part) => (part.startsWith("<script") ? part : part.replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, "&amp;")))
    .join("");
}

function pageHead(kicker, h, lead) {
  return `<section class="hero" style="background:linear-gradient(180deg,var(--navy-900),var(--navy-950))">
  <div class="wrap" style="grid-template-columns:1fr;padding-block:clamp(2.2rem,5vw,4rem)">
    <div><p class="eyebrow">${kicker}</p><h1 style="font-size:clamp(2.2rem,5.5vw,4rem)">${h}</h1><p class="lead">${lead}</p></div>
  </div>
</section>`;
}

const hoursRows = "<tbody>" + site.hours
  .map((h, i) => `<tr data-dow="${i}"><th scope="row">${h.day}</th><td>${h.open ? `${fmt(h.open)} – ${fmt(h.close)}` : '<span class="closed">Closed</span>'}</td></tr>`)
  .join("\n") + "</tbody>";
function fmt(t) {
  let h = +t.slice(0, 2);
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h} ${ap}`;
}

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HobbyShop",
  name: "Turn Order",
  description: "Board-game shop and play space with open tables, events and two private rooms.",
  telephone: "+1-507-401-3888",
  address: { "@type": "PostalAddress", streetAddress: A.street, addressLocality: A.city, addressRegion: A.region, postalCode: A.zip, addressCountry: "US" },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Wednesday", "Thursday", "Sunday"], opens: "12:00", closes: "20:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday", "Saturday"], opens: "12:00", closes: "22:00" },
  ],
  sameAs: Object.values(site.socials),
  ...(SITE_URL ? { url: SITE_URL, image: `${SITE_URL}/assets/img/hero-table-1200.webp` } : {}),
};
const werewolf = events.find((e) => e.type === "special");
const werewolfLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: werewolf.title,
  startDate: `${werewolf.date}T${werewolf.start}:00-05:00`,
  endDate: `${werewolf.date}T${werewolf.end}:00-05:00`,
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  description: werewolf.desc,
  location: { "@type": "Place", name: "Turn Order", address: localBusiness.address },
  organizer: { "@type": "Organization", name: "Turn Order" },
};

const pages = {};

/* ---------------- HOME ---------------- */
pages["index.html"] = layout({
  file: "index.html",
  title: "Turn Order | Board games and open play in Marshall, MN",
  desc: "Board-game shop and play space on College Drive in Marshall, MN. Open tables, Learn to Play Thursdays, Friday Night Magic, chess and private rooms.",
  schema: [localBusiness],
  preloadHero: true,
  body: `
<section class="hero">
  <div class="wrap">
    <div>
      <p class="eyebrow">Board games · Open tables · Marshall, MN</p>
      <h1>Your next game night starts <em>here.</em></h1>
      <p class="lead">Turn Order is a board-game shop and play space on College Drive. Grab an open table, learn something new on Thursdays, or come see what's on the shelves.</p>
      <div class="actions">
        <a class="btn btn-primary" href="events.html">See what's on</a>
        <a class="btn btn-ghost" href="visit.html">Plan your visit</a>
      </div>
      <span class="status" data-status data-state="closed">Checking hours…</span>
      <div class="next-card" id="hero-next" aria-live="polite"><small>Next up</small><strong>See the full schedule</strong><span><a href="events.html" style="color:inherit">Events →</a></span></div>
    </div>
    <div class="hex-frame">
      <div class="hex hex-bg"></div>
      <div class="hex hex-img">${img("hero-table", "A sprawling board game laid out across a wooden table, seen from above", { sizes: "(max-width: 920px) 90vw, 470px", eager: true })}</div>
      <div class="hex-chip c1" style="--r:-4deg">Open tables</div>
      <div class="hex-chip c2" style="--r:3deg">2 private rooms</div>
    </div>
  </div>
</section>

<section class="promos" id="promos" aria-labelledby="promos-h" hidden>
  <div class="wrap">
    <div class="promos-head"><h2 id="promos-h">This week at the shop</h2><span>Updated weekly</span></div>
    <div class="promo-list" id="promo-list"></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Three ways to play</p>
      <h2>Come solo, bring friends, or book a room.</h2>
    </div>
    <div class="grid g3">
      <article class="card reveal"><div class="num">1</div><h3>Drop in</h3><p>Open tables for board games, card games and dice, with light snacks on hand. Open play is free or a small fee. ${CONFIRM}</p><a class="more" href="play.html">How open play works →</a></article>
      <article class="card reveal"><div class="num">2</div><h3>Join an event</h3><p>Learn to Play Thursdays, Friday Night Magic, Sunday Villainous, chess nights, and special nights like Halloween Werewolf.</p><a class="more" href="events.html">See the calendar →</a></article>
      <article class="card reveal"><div class="num">3</div><h3>Book a room</h3><p>Two private rooms, rented by the hour, for your group's own session. Write your request in 30 seconds.</p><a class="more" href="rooms.html">Plan a private game →</a></article>
    </div>
  </div>
</section>

<section class="section cream2">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Coming up</p>
      <h2>What's on this week.</h2>
      <p>Every event is free to browse. Tap "Add to calendar" to save one to your phone.</p>
    </div>
    <div id="next-events"><noscript><div class="empty"><p>See the schedule on <a href="${site.socials.facebook}">our Facebook page</a>.</p></div></noscript></div>
    <p style="margin-top:1.4rem"><a class="btn btn-outline" href="events.html">Full schedule</a></p>
  </div>
</section>

<section class="section dark" id="finder-section">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">Game finder</p>
      <h2>Not sure what to play?</h2>
      <p>Tell us who's coming and what mood you're in. We'll suggest three games from the ones we've been running at events.</p>
    </div>
    <div class="panel reveal">
      <form id="finder" aria-label="Game finder">
        <div class="fields">
          <div class="field"><label for="players">How many players?</label><input id="players" name="players" type="number" min="1" max="20" value="4"></div>
          <div class="field"><label for="time">How long have you got?</label>
            <select id="time" name="time"><option value="30">About 30 minutes</option><option value="60" selected>About an hour</option><option value="120">All evening</option></select></div>
          <div class="field"><fieldset><legend>Mood</legend>
            <div class="pills">
              <label><input type="radio" name="vibe" value="any" checked><span>Surprise me</span></label>
              <label><input type="radio" name="vibe" value="coop"><span>Co-op</span></label>
              <label><input type="radio" name="vibe" value="competitive"><span>Competitive</span></label>
              <label><input type="radio" name="vibe" value="party"><span>Party</span></label>
              <label><input type="radio" name="vibe" value="spooky"><span>Spooky</span></label>
            </div></fieldset></div>
        </div>
        <button class="btn btn-primary" type="submit"><span id="roll-die" aria-hidden="true">🎲</span> Roll for suggestions</button>
      </form>
      <div class="results" id="finder-out" aria-live="polite"></div>
      <p class="finder-note">A sampler, not the full shelf. Ask at the counter about the premium library too.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Why Turn Order</p>
      <h2>A place to find your people.</h2>
      <p>Owners Ana and Marcos Marrero moved to Marshall from Florida about four years ago. Marcos hadn't found a regular gaming group, so they opened a place where local players can find each other.</p>
      <p>Marcos describes Turn Order as a clean, comfortable space built by someone who actually plays the games, not a corporate chain. Whether you've played for years or have never rolled a die, there's a table with room for you.</p>
      <p style="font-size:.85rem;color:var(--ink-soft)">Open since September 2, 2026. Sources: Marshall Independent, Aug. 28, 2026; Turn Order on Facebook.</p>
      <a class="btn btn-dark" href="${site.socials.discord}" rel="noopener" target="_blank">Join the Discord</a>
    </div>
    <figure class="photo reveal" style="margin:0">${img("magic-players", "Two players holding fanned-out trading cards over a wooden table")}<figcaption>Sample photo, to be replaced with the shop's own.</figcaption></figure>
  </div>
</section>

<section class="section dark">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Visit</p>
      <h2>Find us on College Drive.</h2>
      <p>${A.street}<br>${A.city}, ${A.region} ${A.zip}</p>
      <p><span class="status" data-status data-state="closed">Checking hours…</span></p>
      <div class="actions"><a class="btn btn-primary" href="${site.mapsUrl}" rel="noopener" target="_blank">Get directions</a><a class="btn btn-ghost" href="${site.phoneHref}">Call ${site.phone}</a></div>
    </div>
    <table class="hours reveal" style="color:var(--ink)"><caption class="sr-only">Opening hours</caption>${hoursRows}</table>
  </div>
</section>
`,
});

/* ---------------- PLAY ---------------- */
const faqPlay = [
  ["Is open play free?", `<p>Open tables are free or carry a small fee. ${CONFIRM}</p><p>Trying a game from the premium library, which has 100+ titles, was planned at $5 to $10 when the shop announced its opening in August 2026. ${CONFIRM}</p>`],
  ["I've never played a modern board game. Where do I start?", `<p>Thursday evenings are Learn to Play nights, 6 to 7 pm, where a different game is taught each week. The Halloween Werewolf night on October 24 is also beginner-friendly. Or <a href="index.html#finder-section">try the game finder</a>.</p>`],
  ["Is there food?", `<p>Yes. There's a snack bar and cooler with sodas, energy drinks and snacks, for purchase.</p>`],
  ["Can kids play?", `<p>Monday's Kids Chess hour runs 5 to 6 pm. For other events, ask us about age suitability. ${CONFIRM}</p>`],
  ["Do I need to reserve a table?", `<p>Reservations for open tables aren't posted. Call ${site.phone} to ask. If you want a guaranteed space for a group, look at the <a href="rooms.html">private rooms</a>. ${CONFIRM}</p>`],
];
pages["play.html"] = layout({
  file: "play.html",
  title: "Play & Shop | Turn Order, Marshall MN",
  desc: "Open tables, a premium game library and a shelf of board games, card games and dice at Turn Order in Marshall, MN.",
  schema: [localBusiness, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqPlay.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) }],
  body: `
${pageHead("Play & Shop", "Sit down. Play something.", "Open tables, a game library to borrow from, and shelves of games to take home.")}
<section class="section">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Open play</p>
      <h2>Tables are waiting.</h2>
      <ul class="ticks">
        <li><span>Grab a table, pick a game from the dedicated library, and start playing.</span></li>
        <li><span>Open play is free or a small fee. ${CONFIRM}</span></li>
        <li><span>A premium library of 100+ games to try, planned at $5 to $10. ${CONFIRM}</span></li>
        <li><span>A snack bar and cooler with sodas, energy drinks and snacks, for purchase.</span></li>
      </ul>
      <a class="btn btn-dark" href="index.html#finder-section">Not sure what to play? Try the finder</a>
    </div>
    <figure class="photo reveal" style="margin:0">${img("meeples", "A board game in progress on a wooden coffee table, with colorful pawns on the board")}<figcaption>Sample photo, to be replaced with the shop's own.</figcaption></figure>
  </div>
</section>

<section class="section cream2" id="shop">
  <div class="wrap split">
    <figure class="photo reveal" style="margin:0">${img("carcassonne", "Tile-laying board game spread across a table with small wooden figures")}<figcaption>Sample photo, to be replaced with the shop's own.</figcaption></figure>
    <div class="reveal">
      <p class="kicker">The shop</p>
      <h2>Take the fun home.</h2>
      <p>Turn Order stocks modern board games, card games, tabletop RPGs and gaming accessories, from first-game-night picks to things for the long-time hobbyist.</p>
      <p><b>Seasonal pick (${site.seasonal.asOf}):</b> ${site.seasonal.text}</p>
      <p>Shopping is in store. There's no online checkout in this concept, and stock changes, so call ${site.phone} to ask whether something's on the shelf.</p>
      <a class="btn btn-dark" href="${site.phoneHref}">Call the shop</a>
    </div>
  </div>
</section>

<section class="section dark" id="request">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Game requests</p>
      <h2>Tell us what to stock next.</h2>
      <p>The shelves are still filling up, and the owners are leaving room for what you want to see. Send a request from here, or post it in the Discord.</p>
      <ul class="ticks">
        <li><span>Missing a favorite? Ask us to stock it.</span></li>
        <li><span>Want to try before you buy? Ask about the library.</span></li>
      </ul>
      <a class="btn btn-ghost" href="${site.socials.discord}" rel="noopener" target="_blank">Post in the Discord</a>
    </div>
    <div class="panel reveal">
      <form class="composer" data-kind="game" aria-label="Game request builder">
        <div class="field" style="margin-bottom:1rem"><label for="g-game">Which game?</label><input id="g-game" name="game" type="text" maxlength="80" placeholder="e.g. Wingspan" autocomplete="off"></div>
        <div class="field" style="margin-bottom:1.2rem"><label for="g-why">Why this one? (optional)</label><textarea id="g-why" name="why" placeholder="Great with two players, our group loves it…"></textarea></div>
        <div class="actions" style="margin:0">
          <a class="btn btn-primary" data-sms href="${site.smsHref}">Text it to the shop</a>
          <button type="submit" class="btn btn-ghost" data-copy>Copy message</button>
        </div>
        <div class="composer-out" data-out tabindex="-1" aria-live="polite"></div>
        <p class="finder-note">Nothing is sent from this site. It opens your own messaging app, or you can copy the text.</p>
      </form>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap" style="max-width:820px">
    <div class="section-head reveal"><p class="kicker">Good to know</p><h2>Open play questions.</h2></div>
    <div class="faq">
${faqPlay.map(([q, a]) => `      <details><summary>${q}</summary><div class="ans">${a}</div></details>`).join("\n")}
    </div>
  </div>
</section>
`,
});

/* ---------------- EVENTS ---------------- */
pages["events.html"] = layout({
  file: "events.html",
  title: "Events | Turn Order, Marshall MN",
  desc: "Learn to Play Thursdays, Friday Night Magic, Sunday Villainous, chess nights and special events at Turn Order in Marshall, MN.",
  
  schema: [localBusiness, werewolfLd],
  body: `
${pageHead("Events", "Always something on the table.", "A regular rhythm all week, plus special nights. Past events hide themselves automatically.")}
<section class="section dark">
  <div class="wrap">
    <div class="section-head reveal"><p class="kicker">The weekly rhythm</p><h2>Your week at Turn Order.</h2><p>Based on the shop's October 2026 schedule. Later months will be posted on Facebook.</p></div>
    <div class="rhythm reveal">
      <div><b>Monday</b><span>Kids Chess 5 to 6 pm, then Open Chess 6 to 8 pm.</span></div>
      <div><b>Thursday</b><span>Learn to Play, 6 to 7 pm. A new game each week.</span></div>
      <div><b>Friday</b><span>Friday Night Magic, 6 to 9 pm.</span></div>
      <div><b>Sunday</b><span>Villainous at 4 pm.</span></div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap" style="max-width:900px">
    <div class="section-head reveal"><p class="kicker">Calendar</p><h2>Upcoming events.</h2></div>
    <div class="filter-row"><div class="filters" role="group" aria-label="Filter events by type">
      <button type="button" data-filter="all" aria-pressed="true">All</button>
      <button type="button" data-filter="ltp" aria-pressed="false">Learn to Play</button>
      <button type="button" data-filter="magic" aria-pressed="false">Magic</button>
      <button type="button" data-filter="villainous" aria-pressed="false">Villainous</button>
      <button type="button" data-filter="chess" aria-pressed="false">Chess</button>
      <button type="button" data-filter="special" aria-pressed="false">Special</button>
    </div><button type="button" class="btn btn-outline btn-sm" id="add-all" hidden>Add all to calendar</button></div>
    <div id="event-list" aria-live="polite"><noscript><div class="empty"><p>JavaScript shows the live calendar. Until then, see <a href="${site.socials.facebook}">our Facebook page</a>.</p></div></noscript></div>
    <p style="color:var(--ink-soft);font-size:.9rem;margin-top:2rem">Fees and age guidance aren't posted for most events. Ask at the shop. ${CONFIRM} Times are Central. RSVP links go to Facebook.</p>
  </div>
</section>
`,
});

/* ---------------- ROOMS ---------------- */
const faqRooms = [
  ["How do I book a room?", `<p>Text or call ${site.phone}. The request builder above writes the message for you. Nothing is sent from this website; it opens your own messaging app, or you can copy the text.</p>`],
  ["How much does a room cost?", `<p>Two private rooms are rented by the hour. Rates aren't posted yet. ${CONFIRM}</p>`],
  ["How many people fit?", `<p>The private rooms have custom gaming tables that seat 6 to 8 players.</p>`],
  ["What can I do in a room?", `<p>Rooms are for your group's own game session: board games, card games, a campaign or a birthday. Ask about using the shop's library.</p>`],
];
pages["rooms.html"] = layout({
  file: "rooms.html",
  title: "Private rooms | Turn Order, Marshall MN",
  desc: "Rent one of two private rooms by the hour at Turn Order in Marshall, MN for your group's own game session.",
  
  schema: [localBusiness],
  body: `
${pageHead("Private rooms", "Your table. Your rules.", "Two private rooms, rented by the hour, for the group that needs its own space.")}
<section class="section">
  <div class="wrap split">
    <div class="reveal">
      <p class="kicker">Good for</p>
      <h2>Campaigns, birthdays and big game days.</h2>
      <ul class="ticks">
        <li><span>Long sessions that shouldn't be interrupted.</span></li>
        <li><span>A group that wants to stay together and loud.</span></li>
        <li><span>Custom gaming tables that seat 6 to 8 players.</span></li>
        <li><span>Rates: ask when you request. ${CONFIRM}</span></li>
      </ul>
    </div>
    <figure class="photo reveal" style="margin:0">${img("rpg-group", "Four people gathered around a table playing a tabletop role-playing game", { sizes: "(max-width: 920px) 100vw, 560px" })}<figcaption>Sample photo, to be replaced with the shop's own.</figcaption></figure>
  </div>
</section>
<section class="section dark">
  <div class="wrap">
    <div class="section-head reveal"><p class="kicker">Request builder</p><h2>Write your request in 30 seconds.</h2><p>Fill in what you know. We'll write the message, and you send it from your own phone.</p></div>
    <div class="panel reveal">
      <form class="composer" data-kind="room" aria-label="Private room request builder">
        <div class="fields" style="grid-template-columns:repeat(4,1fr)">
          <div class="field"><label for="r-date">Date</label><input id="r-date" name="date" type="date"></div>
          <div class="field"><label for="r-time">Start time</label><input id="r-time" name="time" type="time" step="900"></div>
          <div class="field"><label for="r-hours">Hours</label><select id="r-hours" name="hours"><option value="">Not sure</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div class="field"><label for="r-size">Group size</label><input id="r-size" name="size" type="number" min="1" max="40" placeholder="e.g. 6"></div>
        </div>
        <div class="field" style="margin-bottom:1.2rem"><label for="r-note">What are you playing? (optional)</label><textarea id="r-note" name="note" placeholder="Birthday party, D&amp;D campaign, a new board game…"></textarea></div>
        <div class="actions" style="margin:0">
          <a class="btn btn-primary" data-sms href="${site.smsHref}">Text this to the shop</a>
          <button type="submit" class="btn btn-ghost" data-copy>Copy message</button>
          <a class="btn btn-ghost" href="${site.phoneHref}">Call ${site.phone}</a>
        </div>
        <div class="composer-out" data-out tabindex="-1" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap" style="max-width:820px">
    <div class="section-head reveal"><p class="kicker">Questions</p><h2>Room details.</h2></div>
    <div class="faq">
${faqRooms.map(([q, a]) => `      <details><summary>${q}</summary><div class="ans">${a}</div></details>`).join("\n")}
    </div>
  </div>
</section>
`,
});

/* ---------------- VISIT ---------------- */
pages["visit.html"] = layout({
  file: "visit.html",
  title: "Visit | Turn Order, Marshall MN",
  desc: "Hours, address and directions for Turn Order, 1113 E College Dr, Suite 6, Marshall, MN. Open daily except Tuesday.",
  
  schema: [localBusiness],
  body: `
${pageHead("Visit", "Come say hi.", "Open every day except Tuesday. Walk in, grab a table, ask us anything.")}
<section class="section">
  <div class="wrap split" style="align-items:start">
    <div class="reveal">
      <h2>Hours</h2>
      <p><span class="status" data-status data-state="closed">Checking hours…</span></p>
      <table class="hours"><caption class="sr-only">Opening hours</caption>${hoursRows}</table>
      <p style="font-size:.88rem;color:var(--ink-soft);margin-top:.8rem">Hours from the ${site.hoursSource}. For holidays or changes, check <a href="${site.socials.facebook}" rel="noopener" target="_blank">Facebook</a>.</p>
    </div>
    <div class="reveal">
      <h2>Find us</h2>
      <ul class="facts">
        <li><span class="ico">${ICONS.pin}</span><div><b>Address</b>${A.street}<br>${A.city}, ${A.region} ${A.zip}<br><a href="${site.mapsUrl}" rel="noopener" target="_blank">Open in Google Maps →</a></div></li>
        <li><span class="ico">${ICONS.phone}</span><div><b>Call or text</b><a href="${site.phoneHref}">${site.phone}</a></div></li>
        <li><span class="ico">${ICONS.clock}</span><div><b>Parking &amp; access</b>Not yet posted. ${CONFIRM}</div></li>
        <li><span class="ico">${ICONS.chat}</span><div><b>Community</b><a href="${site.socials.discord}" rel="noopener" target="_blank">Discord</a> · <a href="${site.socials.facebook}" rel="noopener" target="_blank">Facebook</a> · <a href="${site.socials.instagram}" rel="noopener" target="_blank">Instagram</a> · <a href="${site.socials.tiktok}" rel="noopener" target="_blank">TikTok</a></div></li>
      </ul>
    </div>
  </div>
</section>
<section class="section dark">
  <div class="wrap reveal" style="text-align:center;max-width:700px">
    <h2>First time? Here's the plan.</h2>
    <p class="lead" style="color:#c3d1ef">Come in, find an open table, and ask us what's good. On Thursdays from 6 pm we'll teach you a new game.</p>
    <div class="actions" style="justify-content:center"><a class="btn btn-primary" href="events.html">See events</a><a class="btn btn-ghost" href="play.html">How open play works</a></div>
  </div>
</section>
`,
});

/* ---------------- CREDITS + 404 ---------------- */
pages["credits.html"] = layout({
  file: "credits.html",
  title: "Photo credits | Turn Order concept",
  desc: "Credits for the placeholder photos used in this unofficial sample website.",
  body: `
${pageHead("Credits", "Photo credits.", "Placeholder photos for this unofficial concept. Replace them with the shop's own before sharing publicly.")}
<section class="section"><div class="wrap" style="max-width:820px">
<ul style="padding-left:1.1rem;display:grid;gap:.8rem">
${credits.map((c) => `<li><a href="${c.page}" rel="noopener">${c.title.replace("File:", "")}</a> by ${c.artist || "unknown"}, ${c.license}.</li>`).join("\n")}
</ul></div></section>`,
});
pages["404.html"] = layout({
  file: "404.html",
  title: "Page not found | Turn Order",
  desc: "That page wandered off. Head back to the table.",
  body: `${pageHead("404", "That page rolled off the table.", "Let's get you back to the game.")}
<section class="section"><div class="wrap"><a class="btn btn-dark" href="index.html">Back to home</a></div></section>`,
});

for (const [f, html] of Object.entries(pages)) fs.writeFileSync(path.join(root, f), html);

const urls = ["index.html", "play.html", "events.html", "rooms.html", "visit.html"];
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ""}`);
if (SITE_URL) {
  fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}/${u === "index.html" ? "" : u}</loc></url>`).join("\n")}\n</urlset>\n`);
}
console.log(`built ${Object.keys(pages).length} pages`);
