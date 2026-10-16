/* Midvora sample gate. Asks a first-time visitor for a name and email, emails them to Midvora through
   Web3Forms, then reloads into the site. A soft gate: it records who looked, it does not hide the files.

   Built to survive stale caches. It carries its own styling and draws itself inside a shadow root, so the
   site's CSS cannot reach it and an old cached copy of the site's stylesheet cannot leave it half-styled.
   src/build.mjs puts a version tag on this file's address, so an edited gate is never served from an old copy.
   The inline snippet in each page's <head> loads it, and only for visitors who have not entered yet.
   Settings come from data/gate.json through window.MV_GATE. No dependencies. */
(function () {
  "use strict";
  var CFG = window.MV_GATE, root = document.documentElement;
  if (!CFG || !root.classList.contains("gate-locked")) return;

  var V = "?v=" + encodeURIComponent(CFG.v);
  var LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
  var SANS = '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
  var SERIF = '"Fraunces", Georgia, "Times New Roman", serif';

  /* Fonts have to be declared on the page itself; a shadow root cannot declare them. */
  var fontCss = document.createElement("style");
  fontCss.textContent = '@font-face{font-family:"Fraunces";font-style:normal;font-weight:700;font-display:swap;src:url("assets/fonts/fraunces-700.woff2' + V + '") format("woff2");unicode-range:' + LATIN + "}";
  document.head.appendChild(fontCss);
  if (document.fonts && document.fonts.load) document.fonts.load('700 1em "Fraunces"');

  var CSS = [
    ":host{all:initial}",
    "*,*::before,*::after{box-sizing:border-box}",
    ".page{position:absolute;inset:0;display:grid;place-items:center;padding:24px;overflow-x:hidden;overflow-y:auto;background:linear-gradient(160deg,#f4f8ff 0%,#fff 48%,#eef3fb 100%);color:#0e1b2e;font-family:" + SANS + ";font-size:1rem;line-height:1.6;text-align:left;-webkit-text-size-adjust:100%}",
    ".page:focus{outline:none}",
    ".glows{position:fixed;inset:0;overflow:hidden;pointer-events:none}",
    ".glow{position:absolute;border-radius:50%;filter:blur(70px)}",
    ".glow--one{top:-120px;right:-80px;width:420px;height:420px;background:rgba(43,123,255,.22)}",
    ".glow--two{bottom:-140px;left:-100px;width:460px;height:460px;background:rgba(143,160,184,.28)}",
    ".card{position:relative;width:min(100%,460px);padding:40px 36px 34px;text-align:center;background:#fff;border:1px solid rgba(14,27,46,.08);border-radius:22px;box-shadow:0 30px 80px rgba(14,27,46,.14),0 2px 6px rgba(14,27,46,.05);animation:in .5s ease both}",
    ".logo{display:block;width:min(237px,70%);height:auto;margin:0 auto 22px}",
    ".eyebrow{margin:0 0 8px;color:#1a5fc9;font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase}",
    "h1{margin:0 0 10px;color:#0e1b2e;font-family:" + SERIF + ";font-size:clamp(1.8rem,6vw,2.25rem);font-weight:700;line-height:1.08;letter-spacing:-.035em}",
    ".lede{margin:0 0 26px;color:#4a586b;font-size:.98rem}",
    "form{display:grid;gap:16px;text-align:left}",
    "label{display:grid;gap:7px}",
    "label span{color:#34445a;font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}",
    "input,button{font:inherit}",
    "input[type=text],input[type=email]{width:100%;min-height:52px;padding:12px 15px;border:1.5px solid #7f8c9e;border-radius:12px;background:#fff;color:#0e1b2e;transition:border-color .2s ease,box-shadow .2s ease}",
    "input::placeholder{color:#667386}",
    "input:focus{outline:none;border-color:#2b7bff;box-shadow:0 0 0 4px rgba(43,123,255,.16)}",
    ".trap{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}",
    ".button{width:100%;min-height:54px;margin-top:4px;border:0;border-radius:12px;background:linear-gradient(135deg,#2a6fe0,#1456d6);color:#fff;font-size:.95rem;font-weight:700;letter-spacing:.02em;cursor:pointer;box-shadow:0 10px 24px rgba(31,111,229,.32);transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}",
    ".button:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(31,111,229,.4);filter:brightness(.95)}",
    ".button:disabled{opacity:.7;cursor:wait}",
    ".button:focus-visible{outline:3px solid #0e1b2e;outline-offset:3px}",
    ".error{margin:0;padding:12px 14px;border-radius:12px;background:#fff1ef;border:1px solid #f6c3bc;color:#a22a1d;font-size:.9rem;font-weight:600}",
    ".error[hidden]{display:none}",
    ".fine{margin:20px 0 0;color:#5a667a;font-size:.8rem}",
    ".done{display:grid;justify-items:center;padding-top:4px}",
    ".done .button{margin-top:12px}",
    ".check{display:grid;place-items:center;width:62px;height:62px;margin-bottom:18px;border-radius:50%;background:#e7f6ee;color:#1b8a52;animation:pop .45s ease both}",
    ".check svg{width:30px;height:30px}",
    "@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
    "@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}",
    "@media (max-width:480px){.card{padding:30px 22px 26px;border-radius:18px}}",
    "@media (prefers-reduced-motion:reduce){.card,.check{animation:none}}"
  ].join("\n");

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var host, shadow, page, body;

  function build() {
    host = document.createElement("div");
    host.id = "gate";
    host.className = "gate";
    host.style.cssText = "position:fixed;inset:0;z-index:2000;display:block";
    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML =
      "<style>" + CSS + "</style>" +
      '<div class="page" role="dialog" aria-modal="true" aria-labelledby="gate-title" tabindex="-1">' +
      '<div class="glows" aria-hidden="true"><div class="glow glow--one"></div><div class="glow glow--two"></div></div>' +
      '<div class="card" aria-live="polite">' +
      '<img class="logo" src="assets/img/midvora-logo.png' + V + '" alt="Midvora. From the Midwest. For the World." width="237" height="146">' +
      '<div class="body"></div>' +
      "</div></div>";
    page = shadow.querySelector(".page");
    body = shadow.querySelector(".body");
    showForm();
    document.body.insertBefore(host, document.body.firstChild);
    page.focus({ preventScroll: true });
  }

  function showForm() {
    body.innerHTML =
      '<p class="eyebrow">Private preview</p>' +
      '<h1 id="gate-title">Welcome to your sample.</h1>' +
      '<p class="lede">We built a sample website for ' + esc(CFG.business) + ". Tell us who you are and we will open it for you.</p>" +
      "<form>" +
      '<label><span>Your name</span><input type="text" name="name" autocomplete="name" autocapitalize="words" placeholder="Jane Smith" required></label>' +
      '<label><span>Your email</span><input type="email" name="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="jane@company.com" required></label>' +
      '<input type="text" name="botcheck" class="trap" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="error" role="alert" hidden>We could not send your request just now. Please try again in 5 minutes.</p>' +
      '<button type="submit" class="button">View the sample</button>' +
      "</form>" +
      '<p class="fine">Your details go only to the Midvora team.</p>';
    var form = body.querySelector("form"), error = form.querySelector(".error"), button = form.querySelector("button");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.botcheck.value || button.disabled) return;
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
      '<div class="done">' +
      '<span class="check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<h1 id="gate-title">We got your request' + (first ? ", " + esc(first) : "") + ".</h1>" +
      '<p class="lede">Thank you for your interest. Your ' + esc(CFG.business) + " sample is ready.</p>" +
      '<button type="button" class="button">Open the sample</button>' +
      "</div>";
    var open = body.querySelector("button");
    open.addEventListener("click", function () {
      // Reload so the page starts fresh (the hero intro and scroll effects were set up while it was covered).
      // If storage is blocked a reload would show the gate again, so open the site in place instead.
      if (remembered) { location.reload(); return; }
      root.classList.remove("gate-locked");
      host.parentNode.removeChild(host);
    });
    open.focus();
  }

  function remember(visitor) {
    try { localStorage.setItem(CFG.store, JSON.stringify(visitor)); return localStorage.getItem(CFG.store) !== null; } catch (e) { return false; }
  }

  /* No key (a local preview) means nothing is sent and the visitor just goes through. */
  function notify(visitor) {
    if (!CFG.key) return Promise.resolve();
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

  /* The script can arrive before the page body has been parsed. */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
