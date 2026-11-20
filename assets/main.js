(function () {
  var root = document.documentElement;
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Ułatwienia dostępu: panel i ustawienia zapamiętywane w przeglądarce
  var a11yToggle = document.getElementById('a11y-toggle');
  var a11yPanel = document.getElementById('a11y-panel');
  function setPanel(open) {
    a11yPanel.hidden = !open;
    a11yToggle.setAttribute('aria-expanded', String(open));
    layout();
  }
  a11yToggle.addEventListener('click', function () { setPanel(a11yPanel.hidden); });
  document.getElementById('a11y-close').addEventListener('click', function () { setPanel(false); a11yToggle.focus(); });
  a11yPanel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setPanel(false); a11yToggle.focus(); } });

  var fsButtons = document.querySelectorAll('[data-fs]');
  function setFs(v) {
    if (v === '0') root.removeAttribute('data-fs'); else root.setAttribute('data-fs', v);
    fsButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-fs') === v)); });
    save('p16-fs', v);
    layout();
  }
  fsButtons.forEach(function (b) { b.addEventListener('click', function () { setFs(b.getAttribute('data-fs')); }); });

  var PREFS = { contrast: ['data-contrast', 'high'], spacing: ['data-spacing', 'on'], links: ['data-links', 'on'], font: ['data-font', 'readable'] };
  var prefButtons = document.querySelectorAll('[data-pref]');
  function setPref(name, on) {
    var p = PREFS[name];
    if (on) root.setAttribute(p[0], p[1]); else root.removeAttribute(p[0]);
    document.querySelectorAll('[data-pref="' + name + '"]').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); });
    save('p16-' + name, on ? '1' : '0');
    layout();
  }
  prefButtons.forEach(function (b) {
    b.addEventListener('click', function () { setPref(b.getAttribute('data-pref'), b.getAttribute('aria-pressed') !== 'true'); });
  });
  document.getElementById('a11y-reset').addEventListener('click', function () {
    setFs('0'); Object.keys(PREFS).forEach(function (n) { setPref(n, false); });
  });

  // Menu mobilne
  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');
  menuBtn.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  function closeMenu() { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); menuBtn.focus(); } });
  document.addEventListener('click', function (e) { if (menu.classList.contains('open') && !menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu(); });

  // Przyklejony nagłówek (telefon) lub menu (komputer): wysokość dla przewijania do sekcji
  var masthead = document.querySelector('.masthead');
  var mobileMq = window.matchMedia('(max-width: 720px)');
  function layout() {
    var h = mobileMq.matches ? masthead.offsetHeight : menu.offsetHeight;
    root.style.setProperty('--sticky-h', h + 'px');
    if (!mobileMq.matches) closeMenu();
  }
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
  setFs(load('p16-fs') || '0');
  Object.keys(PREFS).forEach(function (n) { setPref(n, load('p16-' + n) === '1'); });

  // Cień pod menu i przycisk powrotu na górę
  var toTop = document.getElementById('to-top');
  function onScroll() {
    if (toTop) toTop.hidden = window.scrollY < window.innerHeight;
    menu.classList.toggle('stuck', !mobileMq.matches && masthead.getBoundingClientRect().bottom <= 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Dokumenty: wyszukiwarka i otwieranie kategorii z linków
  var filter = document.getElementById('doc-filter');
  if (filter) {
    var groups = document.querySelectorAll('.doc-group');
    var count = document.getElementById('doc-count');
    var empty = document.getElementById('doc-empty');
    var total = document.querySelectorAll('.files li').length;
    var initialOpen = [];
    groups.forEach(function (g) { initialOpen.push(g.open); });
    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l'); }
    filter.addEventListener('input', function () {
      var q = norm(filter.value.trim()); var shown = 0;
      groups.forEach(function (g, i) {
        var hits = 0;
        g.querySelectorAll('li').forEach(function (li) {
          var ok = !q || norm(li.textContent + ' ' + g.querySelector('summary').textContent).indexOf(q) !== -1;
          li.hidden = !ok; if (ok) hits++;
        });
        g.hidden = hits === 0;
        g.open = q ? hits > 0 : initialOpen[i];
        shown += hits;
      });
      count.textContent = q ? 'Znaleziono: ' + shown + ' z ' + total : count.getAttribute('data-default');
      empty.hidden = shown !== 0;
    });
    count.setAttribute('data-default', count.textContent);
    function openFromHash() {
      var id = location.hash.slice(1); var el = id && document.getElementById(id);
      if (el && el.classList.contains('doc-group')) el.open = true;
    }
    window.addEventListener('hashchange', openFromHash);
    document.querySelectorAll('a[href^="#dok-"]').forEach(function (a) {
      a.addEventListener('click', function () { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) el.open = true; });
    });
    openFromHash();
  }

  // Wyszukiwarka (lupa)
  var dlg = document.getElementById('search-dlg');
  if (dlg) {
    var sInput = document.getElementById('search-input');
    var sResults = document.getElementById('search-results');
    var sStatus = document.getElementById('search-status');
    var sSuggest = document.getElementById('search-suggest');
    var sDefault = sStatus.textContent;
    var index = null;
    function clean(s) { return s.replace(/\s+/g, ' ').trim().normalize('NFC'); }
    function textOf(el) {
      var parts = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      while (w.nextNode()) { if (!w.currentNode.parentElement.closest('svg, .dl')) parts.push(w.currentNode.nodeValue); }
      return clean(parts.join(' ')).replace(/ ([,.:;)])/g, '$1');
    }
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function buildIndex() {
      var units = [];
      var sel = 'h1, h2, h3, main p, .ticks li, .offer li, .news li, .files li, .groups li, .partners li, .quick li, tbody tr, .facts > div, blockquote';
      document.querySelectorAll('main ' + sel.split(', ').join(', main ')).forEach(function (el) {
        if (el.closest('.search-dlg') || el.matches('.kicker, .doc-count, .doc-empty, .search-status') || el.closest('.quick-actions')) return;
        if (el.matches('p') && el.closest('li, .facts')) return;
        var text = textOf(el); if (text.length < 2) return;
        var sec = el.closest('section, .intro');
        var crumb = sec ? (sec.getAttribute('data-section') || clean((sec.querySelector('h2') || {}).textContent || '')) : (el.closest('.quick') ? 'Na skróty' : '');
        var group = el.closest('details');
        var sub = group ? clean(group.querySelector('summary').childNodes[0].textContent || group.querySelector('summary').textContent) : '';
        if (!sub) { var box = el.closest('.offer > div, .programs'); var h = box && box.querySelector('h3'); if (h && h !== el) sub = clean(h.textContent); }
        var title = '', note = null;
        var link = el.matches('li, tr') && el.querySelector('a');
        if (el.matches('h1, h2, h3')) title = text;
        else if (el.matches('.files li')) { title = textOf(el.querySelector('.ft')); note = textOf(el.querySelector('.fmt')) + ', ' + textOf(el.querySelector('.sz')); }
        else if (el.matches('.news li')) { title = textOf(el.querySelector('a')); note = textOf(el.querySelector('time')) + ' · ' + textOf(el.querySelector('.src')); }
        else if (link) title = textOf(link.querySelector('strong') || link);
        else if (el.matches('.facts > div')) { title = textOf(el.querySelector('dt')) + ': ' + textOf(el.querySelector('dd')); note = ''; }
        else if (el.matches('tr')) { title = textOf(el.cells[0]); note = Array.prototype.slice.call(el.cells, 1).map(textOf).join(' · '); }
        units.push({ el: el, note: note, text: text, n: norm(text), title: title, crumb: crumb + (sub && sub !== crumb ? ' › ' + sub : ''), kw: sec ? norm(sec.getAttribute('data-keywords') || '') : '', heading: el.matches('h1, h2, h3') });
      });
      return units;
    }
    function terms(q) {
      return norm(q).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; }).map(function (w) {
        // proste ucinanie końcówek, by „opłata” znalazło „opłaty”, a „zapis” – „zapisy”
        return w.length >= 7 ? w.slice(0, w.length - 2) : (w.length === 6 ? w.slice(0, 5) : w);
      });
    }
    function highlight(s, ts) {
      var n = norm(s), marks = [];
      ts.forEach(function (t) { var i = n.indexOf(t); while (i !== -1) { marks.push([i, i + t.length]); i = n.indexOf(t, i + t.length); } });
      marks.sort(function (a, b) { return a[0] - b[0]; });
      var out = '', pos = 0;
      marks.forEach(function (m) { if (m[0] < pos) return; out += esc(s.slice(pos, m[0])) + '<mark>' + esc(s.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
      return out + esc(s.slice(pos));
    }
    function snippet(u, ts) {
      var first = -1;
      ts.forEach(function (t) { var i = u.n.indexOf(t); if (i !== -1 && (first === -1 || i < first)) first = i; });
      var s = u.text;
      if (first > 60) { var start = s.lastIndexOf(' ', first - 40); s = '… ' + s.slice(start + 1); }
      if (s.length > 170) s = s.slice(0, s.lastIndexOf(' ', 165)) + ' …';
      return s;
    }
    function search(q) {
      if (!index) index = buildIndex();
      var ts = terms(q); sResults.innerHTML = '';
      sSuggest.hidden = ts.length > 0;
      if (!ts.length) { sStatus.textContent = sDefault; return; }
      var hits = [];
      index.forEach(function (u) {
        var score = 0, ok = true;
        ts.forEach(function (t) {
          var i = u.n.indexOf(t);
          if (i !== -1) { score += 10 + (i === 0 || /[^a-z0-9]/.test(u.n.charAt(i - 1)) ? 5 : 0) + (u.title && norm(u.title).indexOf(t) !== -1 ? 6 : 0); }
          else if (u.kw.indexOf(t) !== -1) score += 2;
          else ok = false;
        });
        if (!ok) return;
        if (u.heading) score += 4;
        hits.push({ u: u, s: score });
      });
      hits.sort(function (a, b) { return b.s - a.s; });
      var seen = [];
      hits = hits.filter(function (h) { if (seen.indexOf(h.u.el) !== -1) return false; seen.push(h.u.el); return true; }).slice(0, 40);
      sStatus.textContent = hits.length ? 'Wyniki: ' + hits.length + (hits.length === 40 ? ' (pokazano najtrafniejsze)' : '') : 'Brak wyników dla „' + q.trim() + '”. Spróbuj krótszego słowa albo zadzwoń: 94 345 26 16.';
      hits.forEach(function (h, i) {
        var u = h.u, li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button';
        var main = u.title || snippet(u, ts);
        var snip = u.note !== null ? u.note : (u.title && u.title !== u.text ? snippet(u, ts) : '');
        b.innerHTML = (u.crumb ? '<span class="sr-crumb">' + esc(u.crumb) + '</span>' : '') + '<span class="sr-main">' + highlight(main, ts) + '</span>' + (snip && snip !== main ? '<span class="sr-snip">' + highlight(snip, ts) + '</span>' : '');
        b.addEventListener('click', function () { goTo(u.el); });
        li.appendChild(b); sResults.appendChild(li);
      });
    }
    function goTo(el) {
      var d = el.closest('details'); while (d) { d.open = true; d = d.parentElement.closest('details'); }
      if (filter && el.closest('.doc-group') && (el.hidden || el.closest('.doc-group').hidden)) { filter.value = ''; filter.dispatchEvent(new Event('input')); }
      dlg.close();
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.focus({ preventScroll: true });
      el.classList.add('search-hit');
      setTimeout(function () { el.classList.remove('search-hit'); }, 2600);
    }
    var lastOpener = null;
    function openSearch(from) {
      lastOpener = from || document.activeElement; closeMenu();
      if (!dlg.open) dlg.showModal();
      sInput.focus(); sInput.select();
    }
    document.querySelectorAll('[data-open-search]').forEach(function (b) { b.addEventListener('click', function () { openSearch(b); }); });
    document.getElementById('search-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (lastOpener && !document.activeElement.classList.contains('search-hit')) lastOpener.focus(); });
    sInput.addEventListener('input', function () { search(sInput.value); });
    sInput.addEventListener('keydown', function (e) {
      var first = sResults.querySelector('button');
      if (e.key === 'Enter' && first) { e.preventDefault(); first.click(); }
      if (e.key === 'ArrowDown' && first) { e.preventDefault(); first.focus(); }
      if (e.key === 'Escape') { e.preventDefault(); dlg.close(); }
    });
    sResults.addEventListener('keydown', function (e) {
      var bs = Array.prototype.slice.call(sResults.querySelectorAll('button')), i = bs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i < bs.length - 1) { e.preventDefault(); bs[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? bs[i - 1] : sInput).focus(); }
    });
    sSuggest.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { sInput.value = b.textContent; search(sInput.value); sInput.focus(); }); });
    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
    });

    if (location.hash === '#szukaj') { history.replaceState(null, '', location.pathname); openSearch(); }
  }

  var rok = document.getElementById('rok');
  if (rok) rok.textContent = new Date().getFullYear();
})();
