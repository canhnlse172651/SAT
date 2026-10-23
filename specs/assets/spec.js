/* Shared behaviour for every specs/NNN-slug/spec.html: TOC, EARS keyword highlight, theme toggle, Mermaid.
   Classic script (not a module) so pages also work when opened from file://. */
(function () {
  'use strict';

  // Take over rendering from Mermaid's own on-load pass so we keep each diagram's source for re-theming.
  if (window.mermaid) window.mermaid.initialize({ startOnLoad: false });

  function isDark() {
    var forced = document.documentElement.getAttribute('data-theme');
    if (forced) return forced === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Wrap EARS keywords inside .ears cells: WHEN / WHILE / IF / THEN / WHERE / THE SYSTEM SHALL.
  function highlightEars() {
    var re = /\b(THE SYSTEM SHALL|WHEN|WHILE|IF|THEN|WHERE)\b/g;
    document.querySelectorAll('.ears').forEach(function (el) {
      if (el.dataset.earsDone) return;
      el.innerHTML = el.innerHTML.replace(re, '<b class="kw">$1</b>');
      el.dataset.earsDone = '1';
    });
  }

  // Build the sticky table of contents from section.doc > h2 and .flow/.req h3 that have ids.
  function buildToc() {
    var toc = document.querySelector('nav.toc ol');
    if (!toc) return;
    var items = [];
    document.querySelectorAll('main section.doc').forEach(function (sec) {
      var h2 = sec.querySelector(':scope > h2');
      if (!sec.id || !h2) return;
      items.push({ id: sec.id, text: h2.childNodes[0].textContent.trim(), lvl: 2 });
      sec.querySelectorAll('.flow[id] > h3, .toc-sub[id]').forEach(function (h) {
        var id = h.id || h.parentElement.id;
        items.push({ id: id, text: (h.dataset.toc || h.textContent).trim(), lvl: 3 });
      });
    });
    toc.innerHTML = items.map(function (i) {
      return '<li class="lvl' + i.lvl + '"><a href="#' + i.id + '">' + i.text.replace(/</g, '&lt;') + '</a></li>';
    }).join('');

    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '0px 0px -75% 0px' });
    items.forEach(function (i) { var t = document.getElementById(i.id); if (t) obs.observe(t); });
  }

  function renderMermaid() {
    if (!window.mermaid) return;
    var nodes = document.querySelectorAll('.mermaid');
    nodes.forEach(function (n) {
      if (!n.dataset.src) n.dataset.src = n.textContent;
      else { n.removeAttribute('data-processed'); n.innerHTML = n.dataset.src; }
    });
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isDark() ? 'dark' : 'default',
      fontFamily: 'Be Vietnam Pro, Segoe UI, system-ui, sans-serif',
      flowchart: { htmlLabels: true, curve: 'basis' },
      sequence: { mirrorActors: false, showSequenceNumbers: true }
    });
    window.mermaid.run({ nodes: nodes }).catch(function (err) { console.error('Mermaid:', err); });
  }

  function themeToggle() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      document.documentElement.setAttribute('data-theme', isDark() ? 'light' : 'dark');
      renderMermaid();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    highlightEars();
    buildToc();
    themeToggle();
    // Render after web fonts load, otherwise Mermaid measures labels with the fallback font and clips them.
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    Promise.race([fontsReady, timeout]).then(renderMermaid);
  });
})();
