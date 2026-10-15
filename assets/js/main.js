/* Turn Order sample site. No dependencies. Data is inlined by src/build.mjs. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var DATA = {};
  try { DATA = JSON.parse(document.getElementById("site-data").textContent); } catch (e) { /* page still works without data */ }
  var SITE = DATA.site || {}, EVENTS = DATA.events || [], GAMES = DATA.games || [];
  var TZ = SITE.timezone || "America/Chicago";
  var TYPE_LABEL = { ltp: "Learn to Play", magic: "Magic", villainous: "Villainous", chess: "Chess", special: "Special event" };
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  /* ---- nav ---- */
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
      btn.textContent = open ? "Close" : "Menu";
    });
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
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.dataset.state = s.state; el.textContent = s.text;
    });
    document.querySelectorAll("tr[data-dow]").forEach(function (tr) {
      tr.classList.toggle("today", +tr.dataset.dow === now.dow);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ---- events ---- */
  function upcoming() {
    var now = chicagoNow();
    return EVENTS.filter(function (e) {
      var end = e.end || e.start;
      return e.date + "T" + end >= now.date + "T" + now.time;
    });
  }
  function eventLine(e) {
    return fmtTime(e.start) + (e.end ? " – " + fmtTime(e.end) : "");
  }
  function icsEscape(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
  function downloadIcs(e) {
    var d = e.date.replace(/-/g, ""), s = e.start.replace(":", "") + "00";
    var endT = e.end || (String(+e.start.slice(0, 2) + 2).padStart(2, "0") + e.start.slice(3));
    var en = endT.replace(":", "") + "00";
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Turn Order sample//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:" + e.id + "@turnorder-sample", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d{3}/g, ""),
      "DTSTART:" + d + "T" + s, "DTEND:" + d + "T" + en,
      "SUMMARY:" + icsEscape(e.title + " at Turn Order"),
      "DESCRIPTION:" + icsEscape(e.desc),
      "LOCATION:" + icsEscape("Turn Order, " + SITE.address.street + ", " + SITE.address.city + ", " + SITE.address.region + " " + SITE.address.zip),
      "END:VEVENT", "END:VCALENDAR"];
    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = e.id + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function eventCard(e, today, h) {
    h = h || "h4";
    var d = parseDate(e.date);
    var card = el("article", "event" + (e.date === today ? " is-today" : ""));
    card.dataset.type = e.type;
    card.appendChild(el("div", "when", "<small>" + DAYS[d.getDay()] + "</small><b>" + MONTHS[d.getMonth()] + " " + d.getDate() + "</b>"));
    card.appendChild(el("div", "", '<span class="chip t-' + e.type + '">' + TYPE_LABEL[e.type] + "</span><" + h + ">" + esc(e.title) + "</" + h + "><p>" + eventLine(e) + " · " + esc(e.desc) + "</p>"));
    var acts = el("div", "acts");
    if (e.rsvp) { var r = el("a", "btn btn-primary btn-sm", "RSVP on Facebook"); r.href = e.rsvp; r.rel = "noopener"; r.target = "_blank"; acts.appendChild(r); }
    var c = el("button", "btn btn-outline btn-sm", "Add to calendar"); c.type = "button";
    c.addEventListener("click", function () { downloadIcs(e); });
    acts.appendChild(c);
    card.appendChild(acts);
    return card;
  }

  var list = document.getElementById("event-list");
  if (list) {
    var active = "all", now0 = chicagoNow().date;
    var draw = function () {
      list.innerHTML = "";
      var items = upcoming().filter(function (e) { return active === "all" || e.type === active; });
      if (!items.length) {
        list.appendChild(el("div", "empty", "<h3>Nothing posted here yet</h3><p>The next schedule is posted on our Facebook page. Check there, or call " + esc(SITE.phone) + ".</p>"));
        return;
      }
      var by = {};
      items.forEach(function (e) { (by[e.date] = by[e.date] || []).push(e); });
      Object.keys(by).sort().forEach(function (date) {
        var d = parseDate(date), g = el("section", "day");
        g.appendChild(el("h3", "", (date === now0 ? "Today · " : "") + ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate()));
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
    draw();
  }

  var next = document.getElementById("next-events");
  if (next) {
    var up = upcoming().slice(0, 4), t0 = chicagoNow().date;
    if (!up.length) next.appendChild(el("div", "empty", "<p>The next schedule is posted on our Facebook page.</p>"));
    up.forEach(function (e) { next.appendChild(eventCard(e, t0, "h3")); });
  }
  var hero = document.getElementById("hero-next");
  if (hero) {
    var first = upcoming()[0];
    if (first) {
      var fd = parseDate(first.date);
      hero.innerHTML = "<small>Next up</small><strong>" + esc(first.title) + "</strong><span>" + DAYS[fd.getDay()] + ", " + MONTHS[fd.getMonth()] + " " + fd.getDate() + " · " + eventLine(first) + "</span>";
    } else hero.hidden = true;
  }

  /* ---- game finder ---- */
  var finder = document.getElementById("finder");
  if (finder) {
    var out = document.getElementById("finder-out");
    var run = function () {
      var n = +finder.elements.players.value || 2;
      var mins = +finder.elements.time.value;
      var vibe = finder.elements.vibe.value;
      var scored = GAMES.map(function (g) {
        var s = 0, why = [];
        if (n >= g.min && n <= g.max) { s += 4; why.push("fits " + n + " player" + (n > 1 ? "s" : "")); }
        else s -= 6;
        if (g.minutes <= mins) { s += 2; why.push("about " + g.minutes + " min"); }
        else if (g.minutes <= mins * 1.5) s += 0;
        else s -= 3;
        if (vibe === "any" || g.vibes.indexOf(vibe) > -1) { s += vibe === "any" ? 0 : 3; if (vibe !== "any") why.push(vibe === "coop" ? "co-op" : vibe); }
        else s -= 2;
        return { g: g, s: s, why: why };
      }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
      out.innerHTML = "";
      if (!scored.length) {
        out.appendChild(el("div", "pick", "<h3>Stumped us</h3><p>That's an unusual combo. Ask at the counter and we'll find you something from the shelves.</p>"));
        return;
      }
      scored.forEach(function (x) {
        var c = el("div", "pick", "<h3>" + esc(x.g.name) + "</h3><p>" + esc(x.g.blurb) + '</p><div class="meta"><span class="chip">' + x.g.min + (x.g.max > x.g.min ? "–" + x.g.max : "") + " players</span>" +
          '<span class="chip">~' + x.g.minutes + " min</span>" + x.why.slice(0, 1).map(function (w) { return '<span class="chip t-ltp">' + esc(w) + "</span>"; }).join("") + "</div>");
        out.appendChild(c);
      });
    };
    finder.addEventListener("submit", function (e) {
      e.preventDefault();
      var die = document.getElementById("roll-die"); if (die) { die.classList.remove("rolling"); void die.offsetWidth; die.classList.add("rolling"); }
      run();
    });
    finder.addEventListener("change", run);
    finder.addEventListener("input", run);
    run();
  }

  /* ---- private room request composer (nothing is sent from the site) ---- */
  var composer = document.getElementById("composer");
  if (composer) {
    var outBox = document.getElementById("composer-out"), sms = document.getElementById("composer-sms"), copyBtn = document.getElementById("composer-copy");
    var build = function () {
      var f = composer.elements, parts = ["Hi Turn Order! I'd like to ask about renting a private room."];
      if (f.date.value) { var d = parseDate(f.date.value); parts.push("Date: " + DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + "."); }
      if (f.time.value) parts.push("Start time: " + fmtTime(f.time.value) + ".");
      if (f.hours.value) parts.push("Length: " + f.hours.value + " hour" + (f.hours.value === "1" ? "" : "s") + ".");
      if (f.size.value) parts.push("Group size: " + f.size.value + ".");
      if (f.note.value.trim()) parts.push("Notes: " + f.note.value.trim().replace(/([^.!?])$/, "$1."));
      parts.push("Is that available, and what is the rate?");
      var msg = parts.join(" ");
      outBox.textContent = msg;
      sms.href = SITE.smsHref + "?&body=" + encodeURIComponent(msg);
      return msg;
    };
    composer.addEventListener("input", build);
    composer.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = build();
      var done = function () { copyBtn.textContent = "Copied!"; setTimeout(function () { copyBtn.textContent = "Copy message"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(done, function () { outBox.focus(); });
      else { var r = document.createRange(); r.selectNodeContents(outBox); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
    var tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    composer.elements.date.min = tmr.getFullYear() + "-" + String(tmr.getMonth() + 1).padStart(2, "0") + "-" + String(tmr.getDate()).padStart(2, "0");
    build();
  }

  /* ---- reveal on scroll ---- */
  var rev = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && rev.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (n) { io.observe(n); });
  } else rev.forEach(function (n) { n.classList.add("in"); });
})();
