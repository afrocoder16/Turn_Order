/* Midvora sample gate. Asks a first-time visitor for a name and email, emails them to Midvora through
   Web3Forms, then reloads into the site. A soft gate: it records who looked, it does not hide the files.
   Settings come from data/gate.json through src/build.mjs (window.MV_GATE). No dependencies. */
(function () {
  "use strict";
  var CFG = window.MV_GATE, root = document.documentElement;
  if (!CFG || !root.classList.contains("gate-locked")) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var gate = document.createElement("div");
  gate.className = "gate";
  gate.id = "gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "gate-title");
  gate.innerHTML =
    '<div class="gate__glows" aria-hidden="true"><div class="gate__glow gate__glow--one"></div><div class="gate__glow gate__glow--two"></div></div>' +
    '<div class="gate__card" aria-live="polite">' +
    '<img class="gate__logo" src="assets/img/midvora-logo.png" alt="Midvora. From the Midwest. For the World." width="237" height="146">' +
    '<div class="gate__body"></div>' +
    "</div>";
  var body = gate.querySelector(".gate__body");

  function showForm() {
    body.innerHTML =
      '<p class="gate__eyebrow">Private preview</p>' +
      '<h1 id="gate-title">Welcome to your sample.</h1>' +
      '<p class="gate__lede">We built a sample website for ' + esc(CFG.business) + ". Tell us who you are and we will open it for you.</p>" +
      "<form>" +
      '<label><span>Your name</span><input type="text" name="name" autocomplete="name" placeholder="Jane Smith" required></label>' +
      '<label><span>Your email</span><input type="email" name="email" autocomplete="email" placeholder="jane@company.com" required></label>' +
      '<input type="text" name="botcheck" class="gate__trap" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="gate__error" role="alert" hidden>We could not send your request just now. Please try again in 5 minutes.</p>' +
      '<button type="submit" class="gate__button">View the sample</button>' +
      "</form>" +
      '<p class="gate__fine">Your details go only to the Midvora team.</p>';
    var form = body.querySelector("form"), error = form.querySelector(".gate__error"), button = form.querySelector("button");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.botcheck.value) return;
      var visitor = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim() };
      button.disabled = true;
      button.textContent = "Sending…";
      error.hidden = true;
      notify(visitor).then(function () { showDone(visitor, remember(visitor)); }, function (err) {
        if (window.console) console.error("Sample gate could not send the request:", err);
        error.hidden = false;
        button.disabled = false;
        button.textContent = "Try again";
      });
    });
  }

  function showDone(visitor, remembered) {
    var first = visitor.name.split(/\s+/)[0];
    body.innerHTML =
      '<div class="gate__done">' +
      '<span class="gate__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<h1 id="gate-title">We got your request' + (first ? ", " + esc(first) : "") + ".</h1>" +
      '<p class="gate__lede">Thank you for your interest. Your ' + esc(CFG.business) + " sample is ready.</p>" +
      '<button type="button" class="gate__button">Open the sample</button>' +
      "</div>";
    var open = body.querySelector("button");
    open.addEventListener("click", function () {
      // Reload so the page starts fresh (hero intro and scroll effects were set up while it was covered).
      // If storage is blocked a reload would show the gate again, so open the site in place instead.
      if (remembered) { location.reload(); return; }
      root.classList.remove("gate-locked");
      gate.parentNode.removeChild(gate);
    });
    open.focus();
  }

  function remember(visitor) {
    try { localStorage.setItem(CFG.store, JSON.stringify(visitor)); return localStorage.getItem(CFG.store) !== null; } catch (e) { return false; }
  }

  function notify(visitor) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      signal: ctl ? ctl.signal : undefined,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CFG.key,
        subject: "Sample opened: " + visitor.name + " (" + CFG.business + ")",
        from_name: "Midvora sample gate",
        name: visitor.name,
        email: visitor.email,
        sample: CFG.business + " website",
        opened_at: new Date().toISOString(),
        referrer: document.referrer || "direct",
        browser: navigator.userAgent
      })
    }).then(function (res) {
      return res.json().then(function (out) {
        if (!out.success) throw new Error(out.message || "Web3Forms returned " + res.status);
      });
    }).then(function () { clearTimeout(timer); }, function (err) { clearTimeout(timer); throw err; });
  }

  showForm();
  document.body.insertBefore(gate, document.body.firstChild);
})();
