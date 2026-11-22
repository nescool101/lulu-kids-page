// Consent banner (es/en). Analytics load only after "Accept". Choice kept in localStorage.
// Ads: none yet. When AdSense is enabled, load its script ONLY inside luluConsent.onGranted(...).
(function () {
  var K = 'lulu-consent', cbs = [], loaded = false;
  var T = {
    es: ['Cookies y privacidad', 'Usamos cookies de analítica (Google Analytics y Vercel) solo si lo aceptas. Más información en la <a href="/privacy.html#cookies">política de privacidad</a>.', 'Aceptar', 'Rechazar'],
    en: ['Cookies and privacy', 'We use analytics cookies (Google Analytics and Vercel) only if you accept. More in the <a href="/privacy.html#cookies">privacy policy</a>.', 'Accept', 'Reject']
  };
  function get() { try { return localStorage.getItem(K); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(K, v); } catch (e) {} }
  function load(src, attrs) { var s = document.createElement('script'); s.src = src; s.defer = true; for (var a in attrs || {}) s[a] = attrs[a]; document.head.appendChild(s); }
  function grant() {
    if (loaded) return; loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-07LDV0LZEN');
    load('https://www.googletagmanager.com/gtag/js?id=G-07LDV0LZEN');
    load('/_vercel/insights/script.js'); load('/_vercel/speed-insights/script.js');
    cbs.forEach(function (f) { f(); });
  }
  window.luluConsent = { get: get, onGranted: function (f) { if (get() === 'granted') f(); else cbs.push(f); } };

  var box;
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'es'; }
  function render() {
    if (!box) return;
    var t = T[lang()];
    box.innerHTML = '<p id="lc-t"><b>' + t[0] + '</b></p><p>' + t[1] + '</p><div><button data-v="granted">' + t[2] + '</button><button data-v="denied">' + t[3] + '</button></div>';
  }
  function show(focus) {
    if (!box) {
      var st = document.createElement('style');
      st.textContent = '#lc{position:fixed;left:0;right:0;bottom:0;max-height:25vh;overflow:auto;padding:8px 12px;background:#fff;color:#2b2540;border-top:2px solid #2b2540;font:14px/1.35 system-ui,sans-serif;z-index:9999;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}#lc p{margin:0;flex:1 1 260px}#lc p#lc-t{display:none}#lc a{color:inherit;display:inline-block;padding:10px 0}#lc div{display:flex;gap:8px}#lc button{font:inherit;font-weight:700;min-height:44px;min-width:44px;padding:0 16px;border:2px solid #2b2540;border-radius:999px;background:#ffd1dc;color:#2b2540;cursor:pointer}#lc button+button{background:#bde7ff}@media(prefers-color-scheme:dark){#lc{background:#2a2545;color:#f4efff;border-color:#f4efff}#lc button{border-color:#f4efff}}';
      document.head.appendChild(st);
      box = document.createElement('div'); box.id = 'lc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'lc-t');
      box.onclick = function (e) {
        var v = e.target.dataset && e.target.dataset.v; if (!v) return;
        var was = get(); set(v); box.hidden = true;
        if (v === 'granted') grant(); else if (was === 'granted') location.reload();
      };
      document.body.appendChild(box);
      new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    render(); box.hidden = false; if (focus) box.querySelector('button').focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (a) { e.preventDefault(); show(true); }
  });
  function init() { var c = get(); if (c === 'granted') grant(); else if (c !== 'denied') show(); }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
