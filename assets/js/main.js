/* Turn Order sample site. No dependencies. Data is inlined by src/build.mjs. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var DATA = {};
  try { DATA = JSON.parse(document.getElementById("site-data").textContent); } catch (e) { /* page still works without data */ }
  var SITE = DATA.site || {}, EVENTS = DATA.events || [], GAMES = DATA.games || [], PROMOS = DATA.promos || [];
  var TZ = SITE.timezone || "America/Chicago";
  var TYPE_LABEL = { ltp: "Learn to Play", magic: "Magic", villainous: "Villainous", chess: "Chess", special: "Special event" };
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var CONFIRM = '<span class="confirm" title="Not yet confirmed with the owners">Confirm with store</span>';

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
    return ["BEGIN:VEVENT", "UID:" + e.id + "@turnorder-sample", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d{3}/g, ""),
      "DTSTART:" + d + "T" + s, "DTEND:" + d + "T" + endT.replace(":", "") + "00",
      "SUMMARY:" + icsEscape(e.title + " at Turn Order"), "DESCRIPTION:" + icsEscape(desc),
      "LOCATION:" + icsEscape("Turn Order, " + SITE.address.street + ", " + SITE.address.city + ", " + SITE.address.region + " " + SITE.address.zip), "END:VEVENT"];
  }
  function downloadIcs(list, name) {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Turn Order sample//EN", "CALSCALE:GREGORIAN"];
    list.forEach(function (e) { lines = lines.concat(veventLines(e)); });
    lines.push("END:VCALENDAR");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" })); a.download = name + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function eventCard(e, today, h) {
    h = h || "h4";
    var d = parseDate(e.date);
    var card = el("article", "event" + (e.date === today ? " is-today" : ""));
    card.dataset.type = e.type;
    card.appendChild(el("div", "when", "<small>" + DAYS[d.getDay()] + "</small><b>" + MONTHS[d.getMonth()] + " " + d.getDate() + "</b>"));
    var mid = el("div", "", '<span class="chip t-' + e.type + '">' + TYPE_LABEL[e.type] + "</span><" + h + ">" + esc(e.title) + "</" + h + "><p>" + eventLine(e) + " · " + esc(e.desc) + "</p>");
    if (e.details && e.details.length) {
      mid.appendChild(el("details", "ev-details", "<summary>What to expect</summary><ul>" + e.details.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" + (e.unconfirmed ? "<p>" + CONFIRM + " " + esc(e.unconfirmed) + "</p>" : "")));
    }
    card.appendChild(mid);
    var acts = el("div", "acts");
    if (e.rsvp) { var r = el("a", "btn btn-primary btn-sm", "RSVP on Facebook"); r.href = e.rsvp; r.rel = "noopener"; r.target = "_blank"; acts.appendChild(r); }
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
    if (addAll) addAll.addEventListener("click", function () { downloadIcs(shown, "turn-order-events"); });
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
    finder.addEventListener("submit", function (e) {
      e.preventDefault();
      var die = document.getElementById("roll-die"); if (die) { die.classList.remove("rolling"); void die.offsetWidth; die.classList.add("rolling"); }
      run();
    });
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
      form.elements.date.min = tmr.getFullYear() + "-" + String(tmr.getMonth() + 1).padStart(2, "0") + "-" + String(tmr.getDate()).padStart(2, "0");
    }
    refresh();
  });

  /* ---- reveal on scroll ---- */
  var rev = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && rev.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (n) { io.observe(n); });
  } else rev.forEach(function (n) { n.classList.add("in"); });
})();
