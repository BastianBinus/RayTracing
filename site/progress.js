(function () {
  'use strict';

  var path   = window.location.pathname;
  var bookId = path.indexOf('TheNextWeek') !== -1       ? 'book2'
             : path.indexOf('TheRestOfYourLife') !== -1 ? 'book3'
             : 'book1';

  var PROG_KEY = 'rt_progress_' + bookId;
  var TOC_KEY  = 'rt_toc_'      + bookId;

  /* ── Wait for Markdeep to finish rendering ──────────── */
  function whenReady(fn) {
    if (document.body.style.visibility === 'visible') {
      return setTimeout(fn, 100);
    }
    var obs = new MutationObserver(function () {
      if (document.body.style.visibility === 'visible') {
        obs.disconnect();
        setTimeout(fn, 100);
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    // Safety net if mutation is missed
    window.addEventListener('load', function () {
      setTimeout(function () { obs.disconnect(); fn(); }, 900);
    });
  }

  whenReady(init);

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    restoreScroll();
    trackScroll();
    injectStyles();
    addBackButton();
    buildTOC();
  }

  /* ── Reading progress ───────────────────────────────── */
  function restoreScroll() {
    var p = parseFloat(localStorage.getItem(PROG_KEY) || '0');
    if (p > 0.001) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.round(p * max));
    }
  }

  var scrollTimer;
  function trackScroll() {
    window.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max > 0) {
          localStorage.setItem(PROG_KEY, (window.scrollY / max).toFixed(4));
        }
      }, 350);
    }, { passive: true });
  }

  /* ── Styles ─────────────────────────────────────────── */
  function injectStyles() {
    var s = document.createElement('style');
    s.textContent =
      /* back button */
      '#rt-back{position:fixed;top:12px;right:12px;z-index:1001;font-size:12px;' +
      'color:#555;text-decoration:none;background:#fff;border:1px solid #d8d5cf;' +
      'border-radius:4px;padding:5px 11px;transition:color .15s,border-color .15s;}' +
      '#rt-back:hover{color:#111;border-color:#bbb;}' +
      /* toc toggle */
      '#rt-toc-btn{position:fixed;top:12px;left:12px;z-index:1001;font-size:12px;' +
      'color:#555;background:#fff;border:1px solid #d8d5cf;border-radius:4px;' +
      'padding:5px 11px;cursor:pointer;transition:color .15s,border-color .15s;}' +
      '#rt-toc-btn:hover{color:#111;border-color:#bbb;}' +
      /* toc panel */
      '#rt-toc{position:fixed;top:0;left:0;width:232px;height:100vh;' +
      'background:#faf9f7;border-right:1px solid #e4e1d9;overflow-y:auto;' +
      'z-index:1000;padding:50px 0 40px;box-sizing:border-box;' +
      'transition:transform .22s ease;}' +
      '#rt-toc.hidden{transform:translateX(-232px);}' +
      '#rt-toc a{display:block;padding:5px 18px;font-size:12.5px;line-height:1.55;' +
      'color:#666;text-decoration:none;border-left:2px solid transparent;}' +
      '#rt-toc a.sub{padding-left:30px;font-size:11.5px;color:#999;}' +
      '#rt-toc a:hover{color:#111;}' +
      '#rt-toc a.active{color:#111;border-left-color:#1a1a1a;font-weight:500;}' +
      /* hide on narrow screens */
      '@media(max-width:900px){#rt-toc,#rt-toc-btn{display:none;}}';
    document.head.appendChild(s);
  }

  /* ── Back button ────────────────────────────────────── */
  function addBackButton() {
    var a = document.createElement('a');
    a.id = 'rt-back';
    a.href = '../../index.html';
    a.textContent = '← Library';
    document.body.appendChild(a);
  }

  /* ── Table of contents ──────────────────────────────── */
  function buildTOC() {
    var entries = collectHeadings();
    if (entries.length < 2) return;

    var isOpen = localStorage.getItem(TOC_KEY) !== 'closed';

    /* nav panel */
    var nav = document.createElement('nav');
    nav.id = 'rt-toc';
    if (!isOpen) nav.classList.add('hidden');

    entries.forEach(function (e) {
      var a = document.createElement('a');
      a.href = '#' + e.id;
      a.textContent = e.text;
      if (e.level > 1) a.classList.add('sub');
      nav.appendChild(a);
    });
    document.body.appendChild(nav);

    /* toggle button */
    var btn = document.createElement('button');
    btn.id = 'rt-toc-btn';
    btn.setAttribute('aria-label', 'Toggle table of contents');
    btn.textContent = isOpen ? '✕ Contents' : '☰ Contents';
    btn.addEventListener('click', function () {
      isOpen = !isOpen;
      nav.classList.toggle('hidden', !isOpen);
      btn.textContent = isOpen ? '✕ Contents' : '☰ Contents';
      localStorage.setItem(TOC_KEY, isOpen ? 'open' : 'closed');
    });
    document.body.appendChild(btn);

    /* highlight current section on scroll */
    var links = Array.from(nav.querySelectorAll('a'));
    var io = new IntersectionObserver(function (ioEntries) {
      ioEntries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('active'); });
        var match = links.find(function (l) {
          return l.getAttribute('href') === '#' + e.target.id;
        });
        if (match) match.classList.add('active');
      });
    }, { rootMargin: '0px 0px -75% 0px' });

    entries.forEach(function (e) {
      var el = document.getElementById(e.id);
      if (el) io.observe(el);
    });
  }

  /*
   * collectHeadings — three strategies, most specific first.
   *
   * Strategy A: Markdeep inserts <a name="..."> anchors immediately before
   *   each heading. We pair them up and give the heading the anchor's id.
   *
   * Strategy B: Headings that already carry an id attribute.
   *
   * Strategy C: Any heading element — we generate ids ourselves.
   */
  function collectHeadings() {
    var results = [];
    var seen    = {};

    /* A: named anchors */
    var anchors = document.querySelectorAll('a[name]');
    anchors.forEach(function (a) {
      var id   = a.id || a.name;
      if (!id || seen[id]) return;
      var node = a.nextSibling;
      while (node && node.nodeType === 3) node = node.nextSibling; // skip text nodes
      var text = '', level = 1;
      if (node && /^H[1-6]$/.test(node.nodeName)) {
        text  = node.textContent.trim();
        level = parseInt(node.nodeName[1]);
        if (!node.id) node.id = id; // so IntersectionObserver can find it
      }
      if (text) {
        seen[id] = true;
        results.push({ id: id, text: clean(text), level: level });
      }
    });

    /* B: headings with existing ids */
    if (results.length < 2) {
      results = []; seen = {};
      document.querySelectorAll('h1[id],h2[id],h3[id]').forEach(function (h) {
        if (!seen[h.id]) {
          seen[h.id] = true;
          results.push({ id: h.id, text: clean(h.textContent), level: parseInt(h.tagName[1]) });
        }
      });
    }

    /* C: generate ids from heading content */
    if (results.length < 2) {
      results = [];
      document.querySelectorAll('h1,h2,h3').forEach(function (h, i) {
        if (!h.id) {
          h.id = 'rt-h-' + i;
        }
        results.push({ id: h.id, text: clean(h.textContent), level: parseInt(h.tagName[1]) });
      });
    }

    return results;
  }

  function clean(text) {
    return text
      .replace(/^[\d.]+\s+/, '') // strip Markdeep's "1.2 " section prefixes
      .replace(/\s+/g, ' ')
      .trim();
  }

})();
