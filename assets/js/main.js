/* Turn Order concept site. No dependencies. Data is inlined by src/build.mjs. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var DATA = {};
  try { DATA = JSON.parse(document.getElementById("site-data").textContent); } catch (e) { /* page still works without data */ }
  var SITE = DATA.site || {}, EVENTS = DATA.events || [], GAMES = DATA.games || [], PROMOS = DATA.promos || [];
  var TZ = SITE.timezone || "America/Chicago";
  var TYPE_LABEL = { ltp: "Learn to Play", magic: "Magic", villainous: "Villainous", chess: "Chess", special: "Special event" };
  var TYPE_COLOR = { ltp: "var(--t-ltp)", magic: "var(--t-magic)", villainous: "var(--t-villainous)", chess: "var(--t-chess)", special: "var(--c-pop)" };
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- time in the shop's timezone. "?now=2026-10-24T18:30" overrides it for demos. ---- */
  function chicagoNow() {
    var q = new URLSearchParams(location.search).get("now");
    if (q && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(q)) {
      var d = new Date(q + ":00");
      return { date: q.slice(0, 10), time: q.slice(11), dow: d.getDay() };
    }
    var p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { date: p.year + "-" + p.month + "-" + p.day, time: p.hour + ":" + p.minute, dow: DAYS.indexOf(p.weekday) };
  }
  function fmtTime(t) {
    var h = +t.slice(0, 2), m = t.slice(3, 5), ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (m === "00" ? "" : ":" + m) + " " + ap;
  }
  function parseDate(s) { var a = s.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function stamp(date, time) { var a = date.split("-"), t = time.split(":"); return new Date(+a[0], +a[1] - 1, +a[2], +t[0], +t[1]).getTime(); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---- nav ---- */
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
      btn.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---- colour themes: five hex codes each, saved in localStorage ---- */
  var THEMES = [
    { id: "coral", name: "Coral Dusk", colors: ["#293241", "#3d5a80", "#98c1d9", "#e0fbfc", "#ee6c4d"] },
    { id: "ember", name: "Ember", colors: ["#2b1d18", "#74402a", "#e6c79c", "#fff4e2", "#f08a24"] },
    { id: "forest", name: "Meeple Forest", colors: ["#17302b", "#2f6b57", "#a8d5b8", "#effaf1", "#f4c430"] },
    { id: "arcade", name: "Arcade Violet", colors: ["#231942", "#5e548e", "#be95c4", "#f5eaff", "#ff5d8f"] }
  ];
  var themeBtn = document.getElementById("theme-btn"), themePop = document.getElementById("theme-pop");
  function setTheme(id, save) {
    var t = THEMES.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    document.documentElement.dataset.theme = id;
    if (save) { try { localStorage.setItem("to-theme", id); } catch (e) { /* private mode */ } }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.colors[0];
    if (themePop) themePop.querySelectorAll(".theme-opt").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.theme === id); });
    document.dispatchEvent(new Event("themechange"));
  }
  if (themeBtn && themePop) {
    themePop.innerHTML = "<p>Colour scheme</p>" + THEMES.map(function (t) {
      return '<button type="button" class="theme-opt" data-theme="' + t.id + '" aria-pressed="false"><b>' + t.name + '</b><span class="tick"></span><span class="swatches">' +
        t.colors.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + "</span></button>";
    }).join("");
    var closePop = function () { themePop.hidden = true; themeBtn.setAttribute("aria-expanded", "false"); };
    themeBtn.addEventListener("click", function (e) { e.stopPropagation(); var open = themePop.hidden; themePop.hidden = !open; themeBtn.setAttribute("aria-expanded", open); });
    themePop.addEventListener("click", function (e) { var b = e.target.closest(".theme-opt"); if (b) setTheme(b.dataset.theme, true); });
    document.addEventListener("click", function (e) { if (!themePop.hidden && !e.target.closest(".theme")) closePop(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !themePop.hidden) { closePop(); themeBtn.focus(); } });
    var fromUrl = new URLSearchParams(location.search).get("theme");
    setTheme(THEMES.some(function (t) { return t.id === fromUrl; }) ? fromUrl : (document.documentElement.dataset.theme || "coral"), !!fromUrl);
  }

  /* ---- open now ---- */
  function statusText(now) {
    var hrs = SITE.hours || [], today = hrs[now.dow];
    if (today && today.open) {
      if (now.time >= today.open && now.time < today.close) return { state: "open", text: "Open now · until " + fmtTime(today.close) };
      if (now.time < today.open) return { state: "closed", text: "Closed · opens today at " + fmtTime(today.open) };
    }
    for (var i = 1; i <= 7; i++) {
      var d = hrs[(now.dow + i) % 7];
      if (d && d.open) return { state: "closed", text: "Closed · opens " + (i === 1 ? "tomorrow" : d.day) + " at " + fmtTime(d.open) };
    }
    return { state: "closed", text: "Closed" };
  }
  function renderStatus() {
    var now = chicagoNow(), s = statusText(now);
    document.querySelectorAll("[data-status]").forEach(function (n) { n.dataset.state = s.state; n.textContent = s.text; });
    document.querySelectorAll("tr[data-dow]").forEach(function (tr) { tr.classList.toggle("today", +tr.dataset.dow === now.dow); });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ---- weekly promos: shown only between "from" and "until" (inclusive), soonest-ending first ---- */
  var promoBox = document.getElementById("promos");
  if (promoBox) {
    var pToday = chicagoNow().date;
    var live = PROMOS.filter(function (p) { return p.from <= pToday && pToday <= p.until; })
      .sort(function (a, b) { return a.until < b.until ? -1 : a.until > b.until ? 1 : 0; }).slice(0, 3);
    if (live.length) {
      var pList = document.getElementById("promo-list");
      live.forEach(function (p) {
        var days = Math.round((parseDate(p.until) - parseDate(pToday)) / 86400000), u = parseDate(p.until);
        var ends = days === 0 ? "Ends tonight" : days === 1 ? "Ends tomorrow" : days <= 6 ? "Ends in " + days + " days" : "Ends " + MONTHS[u.getMonth()] + " " + u.getDate();
        var ext = p.cta && p.cta.external ? ' target="_blank" rel="noopener"' : "";
        pList.appendChild(el("article", "promo", '<div class="promo-top"><span class="promo-icon" aria-hidden="true">' + esc(p.icon || "★") + '</span><span class="promo-tag">' + esc(p.tag) + "</span></div>" +
          "<h3>" + esc(p.title) + "</h3><p>" + esc(p.body) + '</p><div class="promo-foot"><span class="promo-ends">' + ends + "</span>" +
          (p.cta ? '<a class="more" href="' + esc(p.cta.href) + '"' + ext + ">" + esc(p.cta.label) + " →</a>" : "") + "</div>"));
      });
      promoBox.hidden = false;
    }
  }

  /* ---- events ---- */
  function upcoming() {
    var now = chicagoNow();
    return EVENTS.filter(function (e) { return e.date + "T" + (e.end || e.start) >= now.date + "T" + now.time; });
  }
  function eventLine(e) { return fmtTime(e.start) + (e.end ? " – " + fmtTime(e.end) : ""); }
  function icsEscape(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
  function veventLines(e) {
    var d = e.date.replace(/-/g, ""), s = e.start.replace(":", "") + "00";
    var endT = e.end || (String(+e.start.slice(0, 2) + 2).padStart(2, "0") + e.start.slice(3));
    var desc = e.desc + (e.details ? " " + e.details.join(". ") + "." : "");
    return ["BEGIN:VEVENT", "UID:" + e.id + "@turnorder-concept", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d{3}/g, ""),
      "DTSTART:" + d + "T" + s, "DTEND:" + d + "T" + endT.replace(":", "") + "00",
      "SUMMARY:" + icsEscape(e.title + " at Turn Order"), "DESCRIPTION:" + icsEscape(desc),
      "LOCATION:" + icsEscape("Turn Order, " + SITE.address.street + ", " + SITE.address.city + ", " + SITE.address.region + " " + SITE.address.zip), "END:VEVENT"];
  }
  function downloadIcs(list, name) {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Turn Order concept//EN", "CALSCALE:GREGORIAN"];
    list.forEach(function (e) { lines = lines.concat(veventLines(e)); });
    lines.push("END:VCALENDAR");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })); a.download = name + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function shareEvent(e, button) {
    var d = parseDate(e.date);
    var text = e.title + " at Turn Order, " + DAYS[d.getDay()] + " " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + eventLine(e) + ". " + SITE.address.street + ", " + SITE.address.city + ".";
    var url = /^https?:/.test(location.href) ? location.href.split("#")[0].replace(/[^/]*$/, "events.html") : "";
    var copied = function () { var old = button.textContent; button.textContent = "Copied!"; setTimeout(function () { button.textContent = old; }, 1800); };
    if (navigator.share) { navigator.share({ title: e.title, text: text, url: url || undefined }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text + (url ? " " + url : "")).then(copied, function () {});
  }

  function eventCard(e, today, h) {
    h = h || "h4";
    var d = parseDate(e.date);
    var card = el("article", "event" + (e.date === today ? " is-today" : ""));
    card.dataset.type = e.type;
    card.appendChild(el("div", "when", "<span><small>" + DAYS[d.getDay()] + "</small><b>" + MONTHS[d.getMonth()] + " " + d.getDate() + "</b></span>"));
    var mid = el("div", "", '<span class="chip t-' + e.type + '">' + TYPE_LABEL[e.type] + "</span><" + h + ">" + esc(e.title) + "</" + h + "><p>" + eventLine(e) + " · " + esc(e.desc) + "</p>");
    if (e.details && e.details.length) {
      mid.appendChild(el("details", "ev-details", "<summary>What to expect</summary><ul>" + e.details.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"));
    }
    card.appendChild(mid);
    var acts = el("div", "acts");
    if (e.rsvp) { var r = el("a", "btn btn-primary btn-sm", "RSVP on Facebook"); r.href = e.rsvp; r.rel = "noopener"; r.target = "_blank"; acts.appendChild(r); }
    var s = el("button", "btn btn-ghost btn-sm", "Share"); s.type = "button";
    s.setAttribute("aria-label", "Share " + e.title);
    s.addEventListener("click", function () { shareEvent(e, s); });
    acts.appendChild(s);
    var c = el("button", "btn btn-outline btn-sm", "Add to calendar"); c.type = "button";
    c.addEventListener("click", function () { downloadIcs([e], e.id); });
    acts.appendChild(c);
    card.appendChild(acts);
    return card;
  }

  var list = document.getElementById("event-list");
  if (list) {
    var active = "all", now0 = chicagoNow().date, shown = [];
    var addAll = document.getElementById("add-all");
    var hash = location.hash.slice(1);
    if (TYPE_LABEL[hash]) {
      active = hash;
      document.querySelectorAll(".filters button").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.filter === hash); });
    }
    var draw = function () {
      list.innerHTML = "";
      shown = upcoming().filter(function (e) { return active === "all" || e.type === active; });
      if (addAll) addAll.hidden = !shown.length;
      if (!shown.length) {
        list.appendChild(el("div", "empty", "<h3>Nothing posted here yet</h3><p>The next schedule is posted on our Facebook page. Check there, or call " + esc(SITE.phone) + ".</p>"));
        return;
      }
      var by = {};
      shown.forEach(function (e) { (by[e.date] = by[e.date] || []).push(e); });
      Object.keys(by).sort().forEach(function (date) {
        var d = parseDate(date), g = el("section", "day");
        g.appendChild(el("h3", "", (date === now0 ? "Today · " : "") + DAYS_LONG[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate()));
        by[date].forEach(function (e) { g.appendChild(eventCard(e, now0, "h4")); });
        list.appendChild(g);
      });
    };
    document.querySelectorAll(".filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        active = b.dataset.filter;
        document.querySelectorAll(".filters button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        draw();
      });
    });
    if (addAll) addAll.addEventListener("click", function () { downloadIcs(shown, "turn-order-events"); });
    draw();
  }

  /* ---- weekly "turn order" tracker (home) ---- */
  var trackerEl = document.getElementById("tracker");
  if (trackerEl) {
    var panel = document.getElementById("day-panel"), tNow = chicagoNow(), upc = upcoming(), week = [], tabs = [];
    for (var i = 0; i < 7; i++) {
      var dd = parseDate(tNow.date); dd.setDate(dd.getDate() + i);
      var key = ymd(dd);
      week.push({ key: key, d: dd, evs: upc.filter(function (e) { return e.date === key; }) });
    }
    var select = function (idx, focus) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", j === idx); t.tabIndex = j === idx ? 0 : -1; });
      panel.setAttribute("aria-labelledby", "tab-" + idx);
      panel.innerHTML = "";
      var w = week[idx], hrs = (SITE.hours || [])[w.d.getDay()];
      if (w.evs.length) w.evs.forEach(function (e) { panel.appendChild(eventCard(e, tNow.date, "h3")); });
      else if (hrs && hrs.open) panel.appendChild(el("div", "panel-note", "Nothing posted for " + DAYS_LONG[w.d.getDay()] + ". Doors are open " + fmtTime(hrs.open) + " to " + fmtTime(hrs.close) + ", so come grab an open table."));
      else panel.appendChild(el("div", "panel-note", "Closed on " + DAYS_LONG[w.d.getDay()] + "s. Back the next day, and the table's waiting."));
      if (focus) tabs[idx].focus();
    };
    week.forEach(function (w, idx) {
      var hrs = (SITE.hours || [])[w.d.getDay()], types = [];
      w.evs.forEach(function (e) { if (types.indexOf(e.type) < 0) types.push(e.type); });
      var b = el("button", "day-tab", '<span class="day-today">' + (idx === 0 ? "Today" : "") + '</span><span class="day-hex"><b>' + w.d.getDate() + '</b></span><span class="day-name">' + DAYS[w.d.getDay()] + '</span><span class="dots">' +
        types.map(function (t) { return '<i class="dot" style="--c:' + TYPE_COLOR[t] + '"></i>'; }).join("") + (hrs && hrs.open ? "" : '<span class="day-closed">Closed</span>') + "</span>");
      b.type = "button"; b.id = "tab-" + idx; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "day-panel");
      b.setAttribute("aria-label", DAYS_LONG[w.d.getDay()] + " " + MONTHS[w.d.getMonth()] + " " + w.d.getDate() + (idx === 0 ? ", today" : "") + ", " + (w.evs.length ? w.evs.length + " event" + (w.evs.length > 1 ? "s" : "") : "no events"));
      b.addEventListener("click", function () { select(idx); });
      b.addEventListener("keydown", function (ev) {
        var n = ev.key === "ArrowRight" ? (idx + 1) % 7 : ev.key === "ArrowLeft" ? (idx + 6) % 7 : ev.key === "Home" ? 0 : ev.key === "End" ? 6 : -1;
        if (n > -1) { ev.preventDefault(); select(n, true); }
      });
      tabs.push(b); trackerEl.appendChild(b);
    });
    select(0);
  }

  /* ---- hero: live countdown to the next event ---- */
  var hero = document.getElementById("hero-next");
  if (hero) {
    var renderHero = function () {
      var n = chicagoNow(), first = upcoming()[0];
      if (!first) { hero.hidden = true; return; }
      hero.hidden = false;
      var fd = parseDate(first.date), startMs = stamp(first.date, first.start), endMs = first.end ? stamp(first.date, first.end) : startMs + 7200000, nowMs = stamp(n.date, n.time);
      var diff = Math.round((startMs - nowMs) / 60000), label, count;
      if (nowMs >= startMs && nowMs <= endMs) { label = "Happening now"; count = first.end ? "In progress · until " + fmtTime(first.end) : "In progress"; }
      else {
        label = "Next up";
        if (diff < 60) count = "Starts in " + diff + " min";
        else if (first.date === n.date) count = "Starts in " + Math.floor(diff / 60) + "h " + (diff % 60) + "m";
        else { var days = Math.round((parseDate(first.date) - parseDate(n.date)) / 86400000); count = days === 1 ? "Tomorrow at " + fmtTime(first.start) : "In " + days + " days"; }
      }
      hero.innerHTML = "<small>" + label + "</small><strong>" + esc(first.title) + "</strong><span>" + DAYS[fd.getDay()] + ", " + MONTHS[fd.getMonth()] + " " + fd.getDate() + " · " + eventLine(first) + '</span><span class="count">' + count + "</span>";
    };
    renderHero();
    setInterval(renderHero, 30000);
  }

  /* ---- d20: "roll for tonight" picks a game ---- */
  var die = document.getElementById("die");
  if (die && GAMES.length) {
    var dieNum = document.getElementById("die-num"), rollCard = document.getElementById("roll-card"), boardHint = document.getElementById("board-hint"), rolling = false;
    var burst = function () {
      var gs = window.gsap, board = document.querySelector(".board");
      if (!gs || REDUCE || !board) return;
      var cs = getComputedStyle(document.documentElement), cols = [cs.getPropertyValue("--c-pop"), cs.getPropertyValue("--c-soft"), cs.getPropertyValue("--pop-light")];
      for (var i = 0; i < 26; i++) {
        var h = el("span", "burst"); h.style.background = cols[i % 3]; board.appendChild(h);
        var a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 150;
        gs.fromTo(h, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }, { x: Math.cos(a) * d, y: Math.sin(a) * d + 40, scale: 0.3 + Math.random() * 0.9, rotation: Math.random() * 360, opacity: 0, duration: 1.1 + Math.random() * 0.6, ease: "power2.out", onComplete: (function (n) { return function () { n.remove(); }; })(h) });
      }
    };
    var showRoll = function (n) {
      var g = GAMES[(n - 1) % GAMES.length];
      var head = n === 20 ? "Natural 20! Critical pick" : n === 1 ? "Natural 1. Rough roll, great game" : "You rolled a " + n;
      rollCard.innerHTML = "<small>" + head + "</small><h3>" + esc(g.name) + "</h3><p>" + esc(g.blurb) + '</p><div class="meta"><span class="chip">' + g.min + (g.max > g.min ? "–" + g.max : "") + ' players</span><span class="chip">~' + g.minutes + ' min</span><button type="button" class="btn btn-ghost btn-sm" id="roll-again">Roll again</button></div>';
      rollCard.hidden = false;
      if (n === 20) burst();
      document.getElementById("roll-again").addEventListener("click", roll);
      if (boardHint) boardHint.hidden = true;
    };
    var roll = function () {
      if (rolling) return;
      rolling = true;
      var final = 1 + Math.floor(Math.random() * 20), steps = REDUCE ? 0 : 14, k = 0;
      die.classList.remove("rolling"); void die.offsetWidth; if (!REDUCE) die.classList.add("rolling");
      (function tick() {
        if (k++ >= steps) { dieNum.textContent = final; showRoll(final); rolling = false; return; }
        dieNum.textContent = 1 + Math.floor(Math.random() * 20);
        setTimeout(tick, 45 + k * k * 1.6);
      })();
    };
    die.addEventListener("click", roll);
  }

  /* ---- game finder ---- */
  var finder = document.getElementById("finder");
  if (finder) {
    var out = document.getElementById("finder-out");
    var run = function () {
      var n = +finder.elements.players.value || 2, mins = +finder.elements.time.value, vibe = finder.elements.vibe.value;
      var scored = GAMES.map(function (g) {
        var s = 0, why = [];
        if (n >= g.min && n <= g.max) { s += 4; why.push("fits " + n + " player" + (n > 1 ? "s" : "")); } else s -= 6;
        if (g.minutes <= mins) { s += 2; why.push("about " + g.minutes + " min"); } else if (g.minutes > mins * 1.5) s -= 3;
        if (vibe === "any" || g.vibes.indexOf(vibe) > -1) { if (vibe !== "any") { s += 3; why.push(vibe === "coop" ? "co-op" : vibe); } } else s -= 2;
        return { g: g, s: s, why: why };
      }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
      out.innerHTML = "";
      if (!scored.length) { out.appendChild(el("div", "pick", "<h3>Stumped us</h3><p>That's an unusual combo. Ask at the counter and we'll find you something from the shelves.</p>")); return; }
      scored.forEach(function (x) {
        out.appendChild(el("div", "pick", "<h3>" + esc(x.g.name) + "</h3><p>" + esc(x.g.blurb) + '</p><div class="meta"><span class="chip">' + x.g.min + (x.g.max > x.g.min ? "–" + x.g.max : "") + " players</span>" +
          '<span class="chip">~' + x.g.minutes + " min</span>" + x.why.slice(0, 1).map(function (w) { return '<span class="chip t-ltp">' + esc(w) + "</span>"; }).join("") + "</div>"));
      });
    };
    finder.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    finder.addEventListener("change", run);
    finder.addEventListener("input", run);
    run();
  }

  /* ---- message builders: private room request + game request. Nothing is sent from the site;
         the visitor sends the text from their own phone, or copies it. ---- */
  var BUILDERS = {
    room: function (f) {
      var parts = ["Hi Turn Order! I'd like to ask about renting a private room."];
      if (f.date.value) { var d = parseDate(f.date.value); parts.push("Date: " + DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + "."); }
      if (f.time.value) parts.push("Start time: " + fmtTime(f.time.value) + ".");
      if (f.hours.value) parts.push("Length: " + f.hours.value + " hour" + (f.hours.value === "1" ? "" : "s") + ".");
      if (f.size.value) parts.push("Group size: " + f.size.value + ".");
      if (f.note.value.trim()) parts.push("Notes: " + f.note.value.trim().replace(/([^.!?])$/, "$1."));
      parts.push("Is that available, and what is the rate?");
      return parts.join(" ");
    },
    game: function (f) {
      var parts = ["Hi Turn Order! Game request: " + (f.game.value.trim() || "(game name)") + "."];
      if (f.why.value.trim()) parts.push(f.why.value.trim().replace(/([^.!?])$/, "$1."));
      parts.push("Could you stock it or add it to the library?");
      return parts.join(" ");
    }
  };
  document.querySelectorAll("form.composer").forEach(function (form) {
    var build = BUILDERS[form.dataset.kind];
    var outBox = form.querySelector("[data-out]"), sms = form.querySelector("[data-sms]"), copyBtn = form.querySelector("[data-copy]");
    var refresh = function () {
      var msg = build(form.elements);
      outBox.textContent = msg;
      sms.href = SITE.smsHref + "?&body=" + encodeURIComponent(msg);
      return msg;
    };
    form.addEventListener("input", refresh);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = refresh();
      var done = function () { copyBtn.textContent = "Copied!"; setTimeout(function () { copyBtn.textContent = "Copy message"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(done, function () { outBox.focus(); });
      else { var r = document.createRange(); r.selectNodeContents(outBox); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
    if (form.elements.date) {
      var tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
      form.elements.date.min = ymd(tmr);
    }
    refresh();
  });

  /* ---- interactive hex field behind the hero (colours follow the theme) ----
     Two canvases: a static grid drawn once with a single stroke, and a small top layer that only
     redraws the few glowing cells. Cheap enough for phones. */
  var field = document.getElementById("hex-field");
  if (field && field.getContext) {
    (function () {
      var top = document.createElement("canvas"); top.id = "hex-lit"; top.setAttribute("aria-hidden", "true");
      field.parentNode.insertBefore(top, field.nextSibling);
      var gctx = field.getContext("2d"), ctx = top.getContext("2d");
      var R = 38, S3 = Math.sqrt(3), W = 0, H = 0, dpr = 1, lit = {}, raf = 0, onScreen = true, soft = "152,193,217", pop = "238,108,77";
      var rgb = function (name, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        var m = /^#([0-9a-f]{6})$/i.exec(v);
        return m ? parseInt(m[1].slice(0, 2), 16) + "," + parseInt(m[1].slice(2, 4), 16) + "," + parseInt(m[1].slice(4, 6), 16) : fallback;
      };
      var center = function (c, r) { return [(c + (r & 1 ? 0.5 : 0)) * S3 * R, r * 1.5 * R]; };
      var trace = function (g, x, y, rr) {
        for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); g[i ? "lineTo" : "moveTo"](x + rr * Math.cos(a), y + rr * Math.sin(a)); }
        g.closePath();
      };
      var drawGrid = function () {
        gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        gctx.clearRect(0, 0, W, H);
        gctx.strokeStyle = "rgba(" + soft + ",.15)"; gctx.lineWidth = 1;
        gctx.beginPath();
        for (var r = -1; r < H / (1.5 * R) + 2; r++) for (var c = -1; c < W / (S3 * R) + 2; c++) { var p = center(c, r); trace(gctx, p[0], p[1], R - 1); }
        gctx.stroke();
      };
      var size = function () {
        soft = rgb("--c-soft", soft); pop = rgb("--c-pop", pop);
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var b = field.getBoundingClientRect(); W = b.width; H = Math.min(b.height, 1100);
        [field, top].forEach(function (cv) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); });
        drawGrid(); frame();
      };
      var frame = function () {
        raf = 0;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var any = false;
        for (var k in lit) {
          var a = lit[k], rc = k.split(","), p = center(+rc[0], +rc[1]);
          ctx.beginPath(); trace(ctx, p[0], p[1], R - 1);
          ctx.fillStyle = "rgba(" + pop + "," + (a * 0.26).toFixed(3) + ")"; ctx.fill();
          ctx.strokeStyle = "rgba(" + soft + "," + Math.min(1, a).toFixed(3) + ")"; ctx.lineWidth = 1.5; ctx.stroke();
          lit[k] = a * 0.93;
          if (lit[k] < 0.03) delete lit[k]; else any = true;
        }
        if (any && onScreen) raf = requestAnimationFrame(frame);
      };
      var kick = function () { if (!raf && onScreen) raf = requestAnimationFrame(frame); };
      var light = function (x, y, radius) {
        var r0 = Math.round(y / (1.5 * R)), c0 = Math.round(x / (S3 * R) - (r0 & 1 ? 0.5 : 0));
        for (var dr = -3; dr <= 3; dr++) for (var dc = -3; dc <= 3; dc++) {
          var r = r0 + dr, c = c0 + dc, p = center(c, r), dist = Math.hypot(p[0] - x, p[1] - y);
          if (dist < radius) { var key = c + "," + r; lit[key] = Math.max(lit[key] || 0, 1 - dist / radius); }
        }
      };
      var boot = function () {
        size();
        document.addEventListener("themechange", size);
        var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });
        if (REDUCE) return;
        var host = field.parentElement;
        host.addEventListener("pointermove", function (e) { var b = field.getBoundingClientRect(); light(e.clientX - b.left, e.clientY - b.top, 120); kick(); });
        setInterval(function () { if (!onScreen || document.hidden) return; light(Math.random() * W, Math.random() * H * 0.9, 50); kick(); }, 700);
        if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) kick(); }).observe(host);
      };
      // keep the grid off the critical path: start once the browser is idle
      if (window.requestIdleCallback) requestIdleCallback(boot, { timeout: 800 }); else setTimeout(boot, 200);
    })();
  }

  /* ---- 3D tilt on cards (fine pointers only) ---- */
  if (!REDUCE && window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".tilt").forEach(function (n) {
      n.addEventListener("pointermove", function (e) {
        var r = n.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        n.style.setProperty("--rx", (px * 7).toFixed(2) + "deg"); n.style.setProperty("--ry", (-py * 7).toFixed(2) + "deg");
        n.classList.add("is-tilting");
      });
      n.addEventListener("pointerleave", function () { n.classList.remove("is-tilting"); });
    });
  }

  /* ---- count-up numbers ---- */
  var counters = document.querySelectorAll(".count-up");
  if (counters.length) {
    var animate = function (n) {
      var to = +n.dataset.to, t0 = null;
      if (REDUCE) { n.textContent = to; return; }
      var step = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / 1000);
        n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      n.textContent = "0"; requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { animate(x.target); cio.unobserve(x.target); } }); }, { threshold: 0.6 });
      counters.forEach(function (n) { cio.observe(n); });
    }
  }

  /* ---- cursor spotlight on cards ---- */
  document.addEventListener("pointermove", function (e) {
    var t = e.target.closest && e.target.closest(".card, .stat, .event, .promo, .pick");
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty("--mx", (e.clientX - r.left) + "px"); t.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, { passive: true });

  /* ---- scroll progress bar ---- */
  var bar = document.getElementById("progress");
  if (bar && !REDUCE) {
    var ticking = false;
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")"; ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---- GSAP: hero entrance, scroll parallax, magnetic buttons ---- */
  var rootEl = document.documentElement, gs = window.gsap;
  if (!gs || REDUCE) rootEl.classList.remove("anim");
  else {
    var ST = window.ScrollTrigger; if (ST) gs.registerPlugin(ST);
    if (document.querySelector(".board")) {
      var tl = gs.timeline({ onComplete: function () { rootEl.classList.remove("anim"); } });
      tl.fromTo(".board .tile", { scale: 0.15, opacity: 0, rotation: -28 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "back.out(1.7)", stagger: { each: 0.09, from: "center" }, clearProps: "transform,opacity" }, 0.05)
        .from(".next-card", { y: 26, opacity: 0, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity" }, 0.25)
        .from(".board-hint", { opacity: 0, duration: 0.6, clearProps: "opacity" }, 0.9);
      setTimeout(function () { rootEl.classList.remove("anim"); }, 3500);
    } else rootEl.classList.remove("anim");
    if (ST && document.querySelector(".hero .board")) {
      gs.to(".board", { yPercent: -7, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } });
      gs.to(".hero-grid > div:first-child", { y: -26, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } });
    }
    if (ST && document.querySelector(".bands")) {
      document.querySelectorAll(".band-shift").forEach(function (s, i) {
        gs.fromTo(s, { xPercent: i ? 7 : -7 }, { xPercent: i ? -7 : 7, ease: "none", scrollTrigger: { trigger: ".bands", start: "top bottom", end: "bottom top", scrub: true } });
      });
    }
    if (window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".hero .btn, .cta-band .btn").forEach(function (b) {
        b.classList.add("mag");
        var xTo = gs.quickTo(b, "x", { duration: 0.4, ease: "power3" }), yTo = gs.quickTo(b, "y", { duration: 0.4, ease: "power3" });
        b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
        b.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
      });
    }
  }

  /* ---- reveal on scroll ---- */
  var rev = document.querySelectorAll(".reveal");
  rev.forEach(function (n) { var sib = n.parentElement.querySelectorAll(":scope > .reveal"); n.style.setProperty("--i", Array.prototype.indexOf.call(sib, n)); });
  if ("IntersectionObserver" in window && rev.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (n) { io.observe(n); });
  } else rev.forEach(function (n) { n.classList.add("in"); });
})();
