/*
 * The home screen for web-app TVs (LG webOS, Samsung Tizen), with the Android app's design and behavior (HomeView):
 *  - top: the "For You" title and the tabs (Explore, Movies, Shows); icon-only glass buttons at the right (Live TV,
 *    HDMI Inputs, Settings) and the crypto quotes at the end of the tab row;
 *  - three picks for this hour in the selected tab; the background is the first one's photo, blurred and almost white;
 *  - the glass shelf with the apps; ↓ opens the drawer (inputs, shortcuts, weather, prices); ↑ or Back closes it;
 *  - a night look from sunset to sunrise; a screensaver after a few idle minutes;
 *  - Settings on the whole screen: its groups at the left, the chosen one's settings at the right.
 * The remote's arrows, OK and Back move the focus; a pointer (LG's Magic Remote) focuses what it points at. OK held on
 * an app picks it up, and ← → move it along the shelf.
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function sym(name, parent, size) {
    var s = el('span', 'sym', parent);
    s.style.webkitMaskImage = 'url(symbols/' + name + '.png)';
    s.style.maskImage = 'url(symbols/' + name + '.png)';
    if (size) { s.style.width = size + 'px'; s.style.height = size + 'px'; }
    return s;
  }

  function coin(i, parent) {
    var c = window.COINS && window.COINS[i];
    if (!c) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 32 32');
    for (var k = 0; k < c.length; k++) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', c[k]);
      p.setAttribute('fill-rule', 'evenodd');
      svg.appendChild(p);
    }
    parent.appendChild(svg);
  }

  function hasClass(e, c) { return (' ' + e.className + ' ').indexOf(' ' + c + ' ') >= 0; }
  function setClass(e, c, on) {
    if (!e) return;
    if (on && !hasClass(e, c)) e.className = (e.className + ' ' + c).replace(/^\s+/, '');
    else if (!on && hasClass(e, c)) e.className = (' ' + e.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, '');
  }

  var stage = $('stage'), body = document.body;

  /** The 1920 × 1080 stage fills the window (on the TV it already is 1920 × 1080), centred in one of another shape. */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / 1920, h / 1080);
    var x = Math.round((w - 1920 * s) / 2), y = Math.round((h - 1080 * s) / 2);
    stage.style.webkitTransform = stage.style.transform = s === 1 && !x && !y ? '' : 'translate(' + x + 'px, ' + y + 'px) scale(' + s + ')';
  }

  // MARK: - Apps on the shelf

  /** Shelf apps in this order when installed, like the Android app: key, LG app id, name on the TV, brand gradient. */
  var SHELF = [
    ['netflix', /^netflix$/, /netflix/i, ['#0A0A0A', '#000000']],
    ['youtube', /youtube/, /^youtube$/i, ['#1C1C1E', '#09090A']],
    ['prime', /^amazon$/, /prime video|amazon/i, ['#2AA8FF', '#0A68D4']],
    ['disney', /disney/, /disney/i, ['#173584', '#08143F']],
    ['max', /hbo|wbd/, /^(hbo )?max$|hbo max/i, ['#5C30E8', '#221684']],
    ['appletv', /appletv|apple\.tv/, /apple tv/i, ['#1C1C1E', '#000000']],
    ['hulu', /^hulu/, /hulu/i, ['#1CE783', '#0B8F4E']],
    ['paramount', /paramount|cbs/, /paramount/i, ['#0064FF', '#002A86']],
    ['peacock', /peacock/, /peacock/i, ['#1C1C1E', '#000000']],
    ['globoplay', /globoplay/, /globoplay/i, ['#FF8A1F', '#FF2D5A']],
    ['spotify', /spotify/, /spotify/i, ['#1DB954', '#0F7A36']]
  ];
  var MAX_SHELF = 8;

  function shelfKey(app) {
    for (var i = 0; i < SHELF.length; i++) if (SHELF[i][1].test(app.id) || SHELF[i][2].test(app.title)) return SHELF[i];
    return null;
  }

  function darken(hex, f) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#161618';
    var n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')';
  }

  /** A name that fits the tile on one line (the font shrinks for long names). */
  function wordFit(title, width, max) {
    return Math.max(18, Math.min(max, Math.floor(width * 0.8 / (Math.max(4, title.length) * 0.56))));
  }

  /** An app's face: its own icon on its brand color (or its name, when the icon can't be read). An icon that fills
   *  its square (`edge`: the color of its border) fills the face's height, on that color. */
  function face(app, box, wordSize) {
    var k = shelfKey(app);
    var top = k ? k[3][0] : app.color ? darken(app.color, 0.92) : '#2A2A2E';
    var bottom = k ? k[3][1] : app.color ? darken(app.color, 0.62) : '#161618';
    box.style.background = '-webkit-linear-gradient(top, ' + top + ', ' + bottom + ')';
    box.style.background = 'linear-gradient(' + top + ', ' + bottom + ')';
    if (app.edge) {
      box.style.background = app.edge;
      setClass(box, 'full', true);
    }
    var word = el('div', 'word', box, app.title);
    if (wordSize) word.style.fontSize = wordSize + 'px';
    if (app.icon) {
      var img = el('img', '', box);
      word.style.visibility = 'hidden';
      img.onerror = function () { img.parentNode.removeChild(img); word.style.visibility = ''; };
      img.src = app.icon;
    }
  }

  var apps = [], shelf = [], others = [], inputs = [];

  function pickShelf() {
    var chosen = Prefs.shelf(), out = [];
    if (chosen) {
      for (var i = 0; i < chosen.length && out.length < MAX_SHELF; i++) {
        for (var j = 0; j < apps.length; j++) if (apps[j].id === chosen[i]) out.push(apps[j]);
      }
    } else {
      for (var s = 0; s < SHELF.length && out.length < MAX_SHELF; s++) {
        for (var a = 0; a < apps.length; a++) {
          if ((SHELF[s][1].test(apps[a].id) || SHELF[s][2].test(apps[a].title)) && out.indexOf(apps[a]) < 0) { out.push(apps[a]); break; }
        }
      }
      if (!out.length) out = apps.slice(0, MAX_SHELF);
    }
    shelf = out;
    others = apps.filter(function (x) { return shelf.indexOf(x) < 0; });
  }

  // MARK: - Focus

  var Z = {TOP: 'top', CARDS: 'cards', SHELF: 'shelf', DRAWER: 'drawer', APPS: 'apps', SETTINGS: 'settings'};
  // settings: pane 0 is the groups (cat), pane 1 the chosen group's rows; moving: an app on the shelf is picked up
  var st = {zone: Z.SHELF, top: 0, tab: 0, card: 0, shelf: 0, drawer: 0, grid: 0, cat: 0, pane: 0, row: 0, opt: 0, moving: false};
  var cards = [];

  function sheetOpen() { return st.zone === Z.APPS || st.zone === Z.SETTINGS; }

  function updateFocus() {
    var i, list;
    list = $('tabs').children;
    for (i = 0; i < list.length; i++) {
      setClass(list[i], 'on', i === st.tab);
      setClass(list[i], 'focus', st.zone === Z.TOP && st.top === i);
    }
    list = $('buttons').children;
    for (i = 0; i < list.length; i++) setClass(list[i], 'focus', st.zone === Z.TOP && st.top === 3 + i);
    setClass($('quotes'), 'hide', !hasClass(body, 'themed') && st.zone === Z.TOP && st.top >= 3);   // the round buttons' names go there
    list = $('cards').children;
    for (i = 0; i < list.length; i++) setClass(list[i], 'focus', st.zone === Z.CARDS && st.card === i);
    list = $('tiles').children;
    for (i = 0; i < list.length; i++) setClass(list[i], 'focus', st.zone === Z.SHELF && st.shelf === i);
    var name = $('tilename'), tile = list[st.shelf];   // the focused app's name under its tile
    setClass(name, 'on', st.zone === Z.SHELF && !!tile);
    if (tile) {
      name.textContent = st.moving ? tr('← → mover · ↓ tirar · OK pronto', '← → move · ↓ take off · OK done', '← → mover · ↓ quitar · OK listo') : shelf[st.shelf].title;
      name.style.left = (tile.offsetLeft + tile.offsetWidth / 2) + 'px';
    }
    list = document.querySelectorAll('#drawer .key');
    for (i = 0; i < list.length; i++) setClass(list[i], 'focus', st.zone === Z.DRAWER && st.drawer === i);
    list = document.querySelectorAll('#apps .cell');
    for (i = 0; i < list.length; i++) setClass(list[i], 'focus', st.zone === Z.APPS && st.grid === i);
    var rows = Math.max(1, Math.ceil(others.length / 5)), r = Math.floor(st.grid / 5), first = Math.max(0, Math.min(rows - 3, r - 1));
    $('apps').lastChild.style.webkitTransform = $('apps').lastChild.style.transform = 'translateY(' + (-first * 239) + 'px)';
    focusSettings();
    setClass(body, 'drawer-open', st.zone === Z.DRAWER);
    setClass(body, 'apps-open', st.zone === Z.APPS);
    setClass(body, 'settings-open', st.zone === Z.SETTINGS);
  }

  function nearest(nodes, x) {
    var best = 0, bestD = 1e9;
    for (var i = 0; i < nodes.length; i++) {
      var r = nodes[i].getBoundingClientRect(), d = Math.abs((r.left + r.right) / 2 - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function centerX(node) {
    if (!node) return 960;
    var r = node.getBoundingClientRect();
    return (r.left + r.right) / 2;
  }

  // MARK: - Top: title, tabs, buttons, quotes

  var TAB_KIND = [null, 'movie', 'tv'];

  function renderTop() {
    $('title').textContent = tr('Para você', 'For You', 'Para ti');
    var tabs = $('tabs');
    tabs.innerHTML = '';
    var names = [tr('Explorar', 'Explore', 'Explorar'), tr('Filmes', 'Movies', 'Películas'), tr('Séries', 'Shows', 'Series')];
    for (var i = 0; i < 3; i++) {
      var t = el('button', 'tab', tabs, names[i]);
      hover(t, Z.TOP, i);
    }
    var buttons = $('buttons');
    buttons.innerHTML = '';
    // All Apps first (Live TV, which needs an antenna or cable, stays among the drawer's inputs)
    var defs = [['apps', tr('Todos os Apps', 'All Apps', 'Todas las apps')], ['hdmi', tr('Entradas HDMI', 'HDMI Inputs', 'Entradas HDMI')],
      ['settings', tr('Ajustes', 'Settings', 'Ajustes')]];
    for (var b = 0; b < 3; b++) {
      var r = el('button', 'round' + (b === 2 ? ' last' : ''), buttons);
      if (!hasClass(body, 'themed')) r.style.left = (1596 + 88 * b) + 'px';   // themed: named pills in a row (CSS)
      sym(defs[b][0], r);
      el('span', 'name', r, defs[b][1]);
      el('div', 'tip', r, defs[b][1]);
      hover(r, Z.TOP, 3 + b);
    }
  }

  /** The prices as chips: the coin, its price, and its change in a day (▲ in green, ▼ in red); how old, once old. */
  function renderQuotes() {
    var q = $('quotes'), coins = Data.activeCoins(), stale = Data.staleness(Data.pricesAt, 5 * 60000);
    q.innerHTML = '';
    for (var i = 0; i < coins.length; i++) {
      var item = el('span', 'q', q), v = Data.prices[coins[i]], ch = Data.changes[coins[i]];
      coin(coins[i], item);
      el('span', 'p', item, coins.length > 3 ? Data.compact(v) : Data.money(v));   // the dollar in reais makes four: shorter
      if (!isNaN(ch)) el('span', 'c ' + (ch >= 0 ? 'up' : 'down'), item, (ch >= 0 ? '▲ ' : '▼ ') + Data.change(Math.abs(ch)).replace(/^\+/, ''));
    }
    if (coins.length && stale) el('span', 'stale', q, stale);
  }

  // MARK: - Picks and background

  /** Without picks, the TV's devices take the tall cards' places: the inputs with a cable in (or with a name, where
   *  the TV doesn't tell), at most two. */
  function devices() {
    var out = [], told = false, i;
    if (!Prefs.devices()) return out;
    for (i = 0; i < inputs.length; i++) if (inputs[i].plugged !== undefined) told = true;
    for (i = 0; i < inputs.length && out.length < 2; i++) {
      var x = inputs[i];
      if (x.key === 'live' || !x.connected || !(told ? x.plugged : x.label && !/^HDMI \d$/.test(x.label))) continue;
      out.push({id: x.id, title: x.label ? inputName(x.label) : x.key, meta: x.key.replace('hdmi', 'HDMI '), input: x});
    }
    return out;
  }

  /** A device's name without what its symbol already says ("Nintendo Switch Spielkonsole"); the Apple TV box by a
   *  name apart from the Apple TV app on the shelf. */
  function inputName(label) {
    return label.replace(/^Apple OTT$/i, 'Apple TV Box').replace(/\s+(Spielkonsole|Game Console|Console)$/i, '');
  }

  function renderCards() {
    var list = Data.picks(TAB_KIND[st.tab]);
    var holder = $('cards');
    setClass(body, 'no-picks', !list.length);
    if (!list.length) list = devices();
    var same = list.length === cards.length;
    for (var i = 0; same && i < list.length; i++) same = list[i].id === cards[i].id && list[i].backdrop === cards[i].backdrop && list[i].meta === cards[i].meta;
    if (same && holder.children.length === list.length) { renderGlance(); renderNews(); return; }
    cards = list;
    holder.innerHTML = '';
    var rects = [[80, 1040], [1160, 320], [1520, 320]], news = newsOn();
    // With the news over them, the devices are short cards side by side in the right column.
    var short = list.length === 1 ? [[1160, 680]] : [[1160, 330], [1510, 330]];
    for (var c = 0; c < list.length; c++) {
      var p = list[c], card = el('div', 'card', holder), r = rects[p.input ? 3 - list.length + c : c];
      if (p.input && news) {
        r = short[c];
        setClass(card, 'short', true);
      }
      card.style.left = r[0] + 'px';
      card.style.width = r[1] + 'px';
      var img = el('div', 'img', card);
      if (p.input) {
        setClass(card, 'device', true);
        sym(p.input.symbol, img);
        var foot = el('div', 'foot', img);
        el('div', 'port', foot, p.meta);
        el('div', 'dev', foot, p.title);
      } else {
        img.style.backgroundImage = 'url(' + Data.image(p.backdrop, c === 0 ? 'w1280' : 'w780') + ')';
        el('div', 'name', card, p.title);
        if (c === 0 && p.meta) el('div', 'meta', card, p.meta);
      }
      hover(card, Z.CARDS, c);
    }
    st.card = Math.min(st.card, Math.max(0, list.length - 1));
    if (!list.length && st.zone === Z.CARDS) st.zone = Z.SHELF;
    backdrop(list.length && !list[0].input ? Data.image(list[0].backdrop, 'w300') : '');
    renderGlance();
    renderNews();
    updateFocus();
  }

  /** Without picks: the weather at a glance in the wide card's place, up to the news or the devices. */
  function renderGlance() {
    var g = $('glance'), on = hasClass(body, 'no-picks') && Prefs.weather();
    g.innerHTML = '';
    g.style.display = on ? 'block' : 'none';
    if (!on) return;
    var first = cards.length && cards[0].input ? $('cards').firstChild : null;
    g.style.left = '80px';
    g.style.width = ((newsOn() ? 1160 : first ? parseFloat(first.style.left) : 1880) - 40 - 80) + 'px';
    renderWeather(g);
  }

  // MARK: - News

  /** Without picks, the latest headlines (SRF News) at the top of the right column, over the devices. */
  function newsOn() { return hasClass(body, 'no-picks') && Prefs.news(); }

  function renderNews() {
    var n = $('news'), on = newsOn(), tall = !devices().length, list = Data.news;
    n.innerHTML = '';
    n.style.display = on ? 'block' : 'none';
    setClass(n, 'tall', tall);
    if (!on) return;
    el('div', 'head', n, 'SRF News');
    el('div', 'side', n, Data.staleness(Data.newsAt, 15 * 60000));   // only when the list is old (no internet)
    if (!list.length) {
      el('div', 'empty', n, Data.newsTried ? tr('Sem notícias agora.', 'No news right now.', 'No hay noticias ahora.')
        : tr('Carregando as notícias …', 'Loading the news …', 'Cargando las noticias …'));
      return;
    }
    for (var i = 0; i < list.length && i < (tall ? 4 : 2); i++) {   // each at most two lines, its age in front
      var what = el('div', 'what', n);
      if (list[i].at) el('span', 'when', what, Data.ago(list[i].at) + ' · ');
      what.appendChild(document.createTextNode(list[i].title));
    }
  }

  /** The top row's first item: the selected tab, or Live TV when there are no picks (and no tabs). */
  function firstTop() { return hasClass(body, 'no-picks') ? 3 : st.tab; }

  var bgUrl = null, bgFront = 'bgA';

  /** The first pick's photo as the background: drawn tiny and stretched, it's already as soft as a heavy blur. */
  function backdrop(url) {
    if (url === bgUrl) return;
    bgUrl = url;
    var next = bgFront === 'bgA' ? 'bgB' : 'bgA';
    if (!url) {
      setClass($('bgA'), 'on', false);
      setClass($('bgB'), 'on', false);
      return;
    }
    var img = new Image();
    img.onload = function () {
      if (bgUrl !== url) return;
      var canvas = $(next), ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setClass(canvas, 'on', true);
      setClass($(bgFront), 'on', false);
      bgFront = next;
    };
    img.src = url;
  }

  function renderClock() {
    var d = new Date(), c = $('clock');
    c.firstChild.textContent = Data.time(d.getTime());
    try {
      c.lastChild.textContent = d.toLocaleDateString(I18N.locale(), {weekday: 'long', day: 'numeric', month: 'long'});
    } catch (e) {
      c.lastChild.textContent = d.toDateString();
    }
  }

  // MARK: - Shelf

  function renderShelf() {
    var n = shelf.length, gap = 48, pad = 40;
    var tw = Math.min(270, (1760 - Math.max(0, n - 1) * gap) / Math.max(1, n));
    var width = n * tw + Math.max(0, n - 1) * gap, left = (1920 - width) / 2;
    var platter = $('platter');
    platter.style.display = n ? '' : 'none';
    platter.style.left = (left - pad) + 'px';
    platter.style.width = (width + 2 * pad) + 'px';
    $('quotes').style.right = (1920 - left - width) + 'px';
    $('shelftitle').textContent = tr('Apps', 'Apps', 'Apps');
    $('shelftitle').style.left = (left + 2) + 'px';
    var tiles = $('tiles');
    tiles.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var t = el('div', 'tile', tiles);
      t.style.left = (left + i * (tw + gap)) + 'px';
      t.style.width = tw + 'px';
      face(shelf[i], t, wordFit(shelf[i].title, tw, 30));
      hover(t, Z.SHELF, i);
    }
    st.shelf = Math.min(st.shelf, Math.max(0, n - 1));
  }

  // MARK: - Drawer

  var drawerItems = [], drawerInputs = 0;

  function renderDrawer() {
    var d = $('drawer');
    d.innerHTML = '';
    drawerItems = [];
    for (var i = 0; i < inputs.length; i++) {
      var x = inputs[i];
      drawerItems.push({label: x.label ? inputName(x.label) : tr('TV aberta', 'Live TV', 'TV en vivo'), symbol: x.symbol, off: !x.connected, run: launcher(x.id, x.label)});
    }
    drawerInputs = drawerItems.length;
    drawerItems.push({label: tr('Todos os Apps', 'All Apps', 'Todas las apps'), symbol: 'apps', run: openApps});
    drawerItems.push({label: tr('Ajustes do Início', 'Home Settings', 'Ajustes de inicio'), symbol: 'settings', run: openSettings});
    drawerItems.push({label: tr('Ajustes da TV', 'TV Settings', 'Ajustes del TV'), symbol: 'tv_settings', run: tvSettings});
    var n = drawerItems.length, gap = 18, groupGap = 56, groups = drawerInputs > 0 && drawerInputs < n ? 2 : 1;
    var tw = Math.min(230, (1760 - Math.max(0, n - groups) * gap - (groups - 1) * groupGap) / Math.max(1, n));
    var xPos = 80;
    for (var k = 0; k < n; k++) {
      if (k === drawerInputs && k > 0) {
        xPos += groupGap - gap;
        el('div', 'row-title', d, tr('Atalhos', 'Shortcuts', 'Accesos directos')).style.left = (xPos + 4) + 'px';
      }
      if (k === 0 && drawerInputs) el('div', 'row-title', d, tr('Entradas', 'Inputs', 'Entradas')).style.left = '84px';
      // a long name ("Nintendo Switch Spielkonsole") takes two lines instead of an ellipsis
      var item = drawerItems[k], key = el('div', 'key glass' + (item.off ? ' off' : '') + (item.label.length > 18 ? ' long' : ''), d);
      key.style.left = xPos + 'px';
      key.style.width = tw + 'px';
      sym(item.symbol, key);
      el('div', 'label', key, item.label);
      hover(key, Z.DRAWER, k);
      xPos += tw + gap;
    }
    renderPanels();
    updateFocus();
  }

  function renderPanels() {
    var d = $('drawer');
    var old = d.querySelectorAll('.panel');
    for (var o = 0; o < old.length; o++) d.removeChild(old[o]);
    // Without picks the weather is on the home screen already: once is enough.
    var wx = Prefs.weather() && !hasClass(body, 'no-picks'), coins = Data.activeCoins(), qt = coins.length > 0;
    var split = 80 + 1760 * 0.585;
    setClass(body, 'no-panels', !wx && !qt);
    if (wx) {
      var w = el('div', 'panel glass wx', d);
      w.id = 'weather';
      w.style.left = '80px';
      w.style.width = ((qt ? split - 16 : 1840) - 80) + 'px';
      renderWeather(w);
    }
    if (qt) {
      var q = el('div', 'panel glass', d);
      q.id = 'prices';
      var left = wx ? split + 16 : 80;
      q.style.left = left + 'px';
      q.style.width = (1840 - left) + 'px';
      renderPrices(q, coins);
    }
  }

  function renderWeather(card) {
    el('div', 'head', card, Data.city || tr('Clima', 'Weather', 'Clima'));
    var w = Data.weather;
    if (!w) {
      el('div', 'cond', card, tr('Sem dados do clima agora.', 'No weather data right now.', 'No hay datos del clima ahora.')).style.top = '96px';
      return;
    }
    var now = el('div', 'now', card);
    sym(Data.symbol(w.code, w.isDay), now);
    el('span', 'temp', now, Data.degrees(w.temp));
    el('div', 'cond', card, Data.condition(w.code, w.isDay));
    el('div', 'range', card, I18N.lang === 'ru' ? 'Макс. ' + Data.degrees(w.max) + '   Мин. ' + Data.degrees(w.min) : tr('Máx. ' + Data.degrees(w.max) + '   Mín. ' + Data.degrees(w.min), 'H:' + Data.degrees(w.max) + '   L:' + Data.degrees(w.min),
        'Máx. ' + Data.degrees(w.max) + '   Mín. ' + Data.degrees(w.min)));
    el('div', 'split', card);
    var hours = el('div', 'hours', card), hw = hours.offsetWidth / 6;
    for (var i = 0; i < w.hours.length && i < 6; i++) {
      var h = el('div', 'hour', hours), x = w.hours[i];
      h.style.left = (hw * i) + 'px';
      h.style.width = hw + 'px';
      el('div', 't', h, Data.hour(x.at));
      sym(Data.symbol(x.code, x.day), h);
      el('div', 'd', h, Data.degrees(x.temp));
    }
    var sun = el('div', 'sun', card);
    if (w.sunrise) { var a = el('span', '', sun); sym('sunrise', a); a.appendChild(document.createTextNode(tr('Nascer ', 'Sunrise ', 'Amanecer ') + Data.time(w.sunrise))); }
    if (w.sunset) { var b = el('span', '', sun); sym('sunset', b); b.appendChild(document.createTextNode(tr('Pôr do sol ', 'Sunset ', 'Atardecer ') + Data.time(w.sunset))); }
    // The next days (the card at a glance and the screensaver show them; the drawer's panel has no room)
    var days = el('div', 'days', card), dw = days.offsetWidth / 5;
    for (var j = 0; j < w.days.length && j < 5; j++) {
      var d = el('div', 'day', days), y = w.days[j];
      d.style.left = (dw * j) + 'px';
      d.style.width = dw + 'px';
      el('div', 't', d, j === 0 ? tr('Amanhã', 'Tomorrow', 'Mañana') : Data.weekday(y.at));
      sym(Data.symbol(y.code, true), d);
      var deg = el('div', 'd', d, Data.degrees(y.max));
      el('span', 'm', deg, Data.degrees(y.min));
    }
  }

  function renderPrices(card, coins) {
    el('div', 'head', card, tr('Cotações', 'Crypto', 'Cripto'));
    var stale = Data.staleness(Data.pricesAt, 5 * 60000);
    el('div', 'side', card, stale || tr('variação em 24 h', '24h change', 'variación en 24 h'));
    for (var j = 0; j < coins.length; j++) {
      var i = coins[j], row = el('div', 'coin', card);
      row.style.top = (86 + 52 * j) + 'px';
      coin(i, row);
      el('span', 'n', row, Data.coinName(i));
      el('span', 'p', row, Data.money(Data.prices[i]));
      var ch = Data.changes[i];
      if (!isNaN(ch)) el('span', 'c ' + (ch >= 0 ? 'up' : 'down'), row, Data.change(ch));
    }
  }

  function openDrawer() {
    if (!drawerItems.length) return;
    var tiles = $('tiles').children;
    st.zone = Z.DRAWER;
    st.drawer = Math.min(drawerItems.length - 1, nearest(document.querySelectorAll('#drawer .key'), centerX(tiles[st.shelf])));
    updateFocus();
  }

  function closeDrawer() {
    var keys = document.querySelectorAll('#drawer .key');
    st.zone = Z.SHELF;
    if (shelf.length) st.shelf = nearest($('tiles').children, centerX(keys[st.drawer]));
    updateFocus();
  }

  // MARK: - All Apps

  function renderApps() {
    var sheet = $('apps');
    sheet.firstChild.textContent = tr('Todos os Apps', 'All Apps', 'Todas las apps');
    el('span', 'count', sheet.firstChild, others.length + ' ' + tr('apps', 'apps', 'apps'));
    var grid = sheet.lastChild;
    grid.innerHTML = '';
    for (var i = 0; i < others.length; i++) {
      var r = Math.floor(i / 5), c = i % 5, cell = el('div', 'cell', grid);
      cell.style.left = (130 + c * 340) + 'px';
      cell.style.top = (196 + r * 239) + 'px';
      face(others[i], el('div', 'face', cell), wordFit(others[i].title, 300, 34));
      el('div', 'label', cell, others[i].title);
      hover(cell, Z.APPS, i);
    }
  }

  function openApps() {
    renderApps();
    st.zone = Z.APPS;
    st.grid = 0;
    setClass($('apps'), 'open', true);
    updateFocus();
  }

  function closeSheets() {
    setClass($('apps'), 'open', false);
    setClass($('settings'), 'open', false);
    st.zone = Z.SHELF;
    updateFocus();
  }

  // MARK: - Settings: the groups at the left, the chosen group's settings at the right

  // Each row says what it does under its name. A choice shows all its options: ← → move along them (← past the first
  // goes back to the groups) and only OK takes one, so moving about never changes a thing; OK also flips a switch or
  // runs an action. Back goes to the groups, then closes. Every change shows on the home screen right away.

  function choice(label, info, options, value, set) { return {kind: 'choice', label: label, info: info, options: options, value: value, set: set}; }
  function toggle(label, info, on, set, sub) { return {kind: 'toggle', label: label, info: info, on: on, set: set, sub: sub}; }
  function action(label, info, run) { return {kind: 'action', label: label, info: info, run: run}; }

  function groups() {
    var auto = tr('Automático', 'Automatic', 'Automático'), off = tr('Desligado', 'Off', 'Desactivado');
    var home = [
      toggle(tr('Clima', 'Weather', 'Clima'), tr('O clima da sua cidade no Início.', 'The weather for your city on Home.', 'El clima de tu ciudad en Inicio.'),
        Prefs.weather(), function (on) { Prefs.set('weather', on); renderPanels(); renderGlance(); }),
      toggle(tr('Notícias', 'News', 'Noticias'), tr('As últimas manchetes da SRF News no Início.', 'The latest SRF News headlines on Home.', 'Los últimos titulares de SRF News en Inicio.'),
        Prefs.news(), function (on) { Prefs.set('news', on); cards = []; renderCards(); Data.refresh(); }),   // the devices change shape
      toggle(tr('Aparelhos no Início', 'Devices on Home', 'Dispositivos en Inicio'), tr('Cartões para o que está ligado à TV: OK muda para ele.', 'Cards for what is plugged into the TV: OK switches to it.', 'Tarjetas de lo conectado al TV: OK cambia a ello.'),
        Prefs.devices(), function (on) { Prefs.set('devices', on); renderCards(); }),
      toggle(tr('Widget de cotações', 'Quotes widget', 'Widget de cotizaciones'), tr('Cotações de cripto no topo e na gaveta.', 'Crypto prices at the top and in the drawer.', 'Precios cripto arriba y en el cajón.'),
        Prefs.quotes(), function (on) { Prefs.set('quotes', on); Data.settingsChanged(); })
    ];
    var coins = ['Bitcoin', 'Ethereum', 'Solana', tr('Dólar', 'Dollar', 'Dólar')];
    for (var i = 0; Prefs.quotes() && i < (Data.currency === 'BRL' ? 4 : 3); i++) {   // the coins only while the prices are on
      (function (i) {
        home.push(toggle(coins[i], '', Prefs.coin(i), function (on) { Prefs.setCoin(i, on); Data.settingsChanged(); }, true));
      })(i);
    }
    var lang = [['auto', auto], ['de', 'Deutsch'], ['en', 'English'], ['es', 'Español'], ['pt', 'Português'], ['ru', 'Русский']];
    return [
      {icon: 'sparkles', name: tr('Aparência', 'Look', 'Apariencia'), rows: [
        choice(tr('Tema', 'Theme', 'Tema'), tr('Automático segue o pôr do sol: claro de dia, escuro à noite.', 'Automatic follows the sunset: light by day, dark at night.', 'Automático sigue la puesta del sol: claro de día, oscuro de noche.'),
          [['auto', auto], ['light', tr('Claro', 'Light', 'Claro')], ['dark', tr('Escuro', 'Dark', 'Oscuro')]], Prefs.theme(), function (v) { Prefs.set('theme', v); checkNight(); }),
        toggle(tr('Fundo em movimento', 'Moving wallpaper', 'Fondo en movimiento'), tr('O fundo se move devagar e para enquanto você usa o controle.', 'The wallpaper drifts slowly and holds still while you use the remote.', 'El fondo se mueve despacio y se detiene mientras usas el control.'),
          Prefs.drift(), function (on) { Prefs.set('drift', on); wallFilm(); }),
        choice(tr('Animações', 'Animations', 'Animaciones'), tr('Rápidas encurtam cada movimento, para uma TV mais lenta.', 'Quick makes every move shorter, for a slower TV.', 'Rápidas acortan cada movimiento, para un TV más lento.'),
          [['normal', tr('Normais', 'Normal', 'Normales')], ['quick', tr('Rápidas', 'Quick', 'Rápidas')]], Prefs.motion(), function (v) { Prefs.set('motion', v); applyMotion(); })
      ]},
      {icon: 'home', name: tr('Início', 'Home', 'Inicio'), rows: home},
      {icon: 'apps', name: tr('Apps', 'Apps', 'Apps'), rows: [
        action(tr('Mover apps', 'Move apps', 'Mover apps'), tr('← → mudam a ordem da prateleira, ↓ tira um app. Ou segure OK num app no Início.', '← → change the shelf\'s order, ↓ takes an app off. Or hold OK on an app on Home.', '← → cambian el orden del estante, ↓ quita una app. O mantén OK en una app en Inicio.'),
          function () { startMove(0); })
      ].concat(appRows())},
      {icon: 'bedtime', name: tr('Proteção de tela', 'Screensaver', 'Salvapantallas'), rows: [
        choice(tr('Liga depois de', 'Starts after', 'Empieza tras'), tr('Depois de quanto tempo sem tecla a tela escurece. Bom para OLED.', 'After how long without a key the screen goes dark. Good for an OLED.', 'Tras cuánto tiempo sin tecla se oscurece la pantalla. Bueno para OLED.')
          + (saverAsked ? ' ' + tr('Ligada, a da TV fica desligada.', "While it's on, the TV's own stays off.", 'Encendido, el del TV queda apagado.') : ''),
          [[0, off], [5, '5 min'], [10, '10 min'], [30, '30 min']], Prefs.saver(), function (v) { Prefs.set('saver', v); }),
        action(tr('Mostrar agora', 'Show it now', 'Mostrar ahora'), tr('A hora e o clima no escuro, até a próxima tecla.', 'The time and the weather on the dark wallpaper, until the next key.', 'La hora y el clima en lo oscuro, hasta la próxima tecla.'),
          function () { closeSheets(); showSaver(); })
      ]},
      {icon: 'language', name: tr('Sistema', 'System', 'Sistema'), rows: [
        choice(tr('Idioma', 'Language', 'Idioma'), tr('Automático segue a TV.', 'Automatic follows the TV.', 'Automático sigue al TV.'), lang, Prefs.language(),
          function (v) { Prefs.set('language', v); I18N.set(v); renderAll(); }),
        choice(tr('Temperatura', 'Temperature', 'Temperatura'), tr('Automático segue o seu país.', 'Automatic follows your country.', 'Automático sigue a tu país.'),
          [['auto', auto], ['C', '°C'], ['F', '°F']], Prefs.temperature(), function (v) { Prefs.set('temperature', v); renderPanels(); renderGlance(); }),
        homeTold === false   // the TV doesn't (yet) let this app see which app is in front: OK asks it again
          ? action(tr('Tecla Home', 'Home key', 'Tecla Home'), tr('Para isso a TV precisa permitir uma vez que este app veja qual app está na frente. OK pergunta de novo.', 'For this the TV has to let this app see once which app is in front. OK asks it again.', 'Para esto el TV debe permitir una vez que esta app vea cuál está al frente. OK vuelve a preguntar.'),
            function () { TV.askFrontAgain(); homeTold = null; watchHome(); renderSettings(); toast(tr('Confirme na TV.', 'Allow it on the TV.', 'Confírmalo en el TV.')); })
          : toggle(tr('Tecla Home', 'Home key', 'Tecla Home'), tr('Num app aberto aqui, Home volta para cá; Home de novo leva ao Início da LG.', 'In an app opened here, Home comes back here; Home again goes to LG\'s home screen.', 'En una app abierta aquí, Inicio vuelve aquí; Inicio otra vez lleva al de LG.'),
            Prefs.homeKey(), function (on) { Prefs.set('homeKey', on); watchHome(); }),
        action(tr('Ajustes da TV', 'TV Settings', 'Ajustes del TV'), tr('Os ajustes da própria TV.', "The TV's own settings.", 'Los ajustes del propio TV.'), tvSettings)
      ]}
    ];
  }

  /** Every app on the TV, by name: OK puts it on the shelf or takes it off (the order is the shelf's, moved on Home). */
  function appRows() {
    var ids = shelf.map(function (a) { return a.id; });
    return apps.slice().sort(function (a, b) { return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1; }).map(function (a) {
      var at = ids.indexOf(a.id);
      return {kind: 'app', app: a, label: a.title, on: at >= 0, place: at, set: function () { onShelf(a); }};
    });
  }

  function onShelf(app) {
    var ids = shelf.map(function (a) { return a.id; }), at = ids.indexOf(app.id);
    if (at >= 0) ids.splice(at, 1);
    else if (ids.length < MAX_SHELF) ids.push(app.id);
    else { toast(tr('A prateleira cabe até ' + MAX_SHELF + ' apps.', 'The shelf holds up to ' + MAX_SHELF + ' apps.', 'El estante tiene hasta ' + MAX_SHELF + ' apps.')); return; }
    Prefs.set('shelf', ids);
    pickShelf();
    renderShelf();
  }

  function applyMotion() { setClass(body, 'quick', Prefs.motion() === 'quick'); }

  var groupsNow = [], rowsNow = [];

  /** Where the row's value is among its options (0 for a row without options). */
  function optionAt(r) {
    if (!r || r.kind !== 'choice') return 0;
    for (var i = 0; i < r.options.length; i++) if (r.options[i][0] === r.value) return i;
    return 0;
  }

  function renderSettings() {
    var box = $('settings').firstChild;
    box.innerHTML = '';
    groupsNow = groups();
    st.cat = Math.max(0, Math.min(st.cat, groupsNow.length - 1));
    rowsNow = groupsNow[st.cat].rows;
    st.row = Math.max(0, Math.min(st.row, rowsNow.length - 1));
    el('h2', 'title', box, tr('Ajustes', 'Settings', 'Ajustes'));
    var nav = el('div', 'groups', box);
    for (var g = 0; g < groupsNow.length; g++) {
      var item = el('div', 'group', nav);
      sym(groupsNow[g].icon, item);
      el('span', 'name', item, groupsNow[g].name);
      hover(item, Z.SETTINGS, g, true);
    }
    var list = el('div', 'rows', el('div', 'pane', box));
    for (var i = 0; i < rowsNow.length; i++) {
      var r = rowsNow[i], row = el('div', 'row ' + r.kind + '-row' + (r.sub ? ' sub' : '') + (r.info ? '' : ' bare'), list);
      if (r.kind === 'app') face(r.app, el('div', 'face', row), 16);
      el('div', 'label', row, r.label);
      if (r.info) el('div', 'info', row, r.info);
      var v = el('div', 'value', row);
      if (r.kind === 'choice') {
        for (var o = 0; o < r.options.length; o++) {
          var opt = el('span', 'opt', v, r.options[o][1]);
          setClass(opt, 'on', o === optionAt(r));
          pointAt(opt, i, o);
        }
      } else if (r.kind === 'action') el('span', 'go', v, '›');
      else {
        el('span', 'state', v, r.kind === 'app' ? (r.on ? tr('Na prateleira · ', 'On · ', 'En el estante · ') + ordinal(r.place + 1) : tr('Fora', 'Off', 'Fuera'))
          : r.on ? tr('Ligado', 'On', 'Activado') : tr('Desligado', 'Off', 'Desactivado'));
        setClass(el('span', 'toggle', v), 'on', r.on);
      }
      hover(row, Z.SETTINGS, i);
    }
    el('div', 'keys', box, tr('OK muda · ← → escolhem · Voltar fecha', 'OK changes · ← → choose · Back closes', 'OK cambia · ← → eligen · Atrás cierra'));
    updateFocus();
  }

  /** The pointer on an option focuses it; its click takes it. */
  function pointAt(opt, row, index) {
    opt.onmouseover = function () {
      if (st.zone !== Z.SETTINGS) return;
      st.pane = 1; st.row = row; st.opt = index;
      updateFocus();
    };
    opt.onclick = function (e) {
      opt.onmouseover();
      activateSettings();
      e.stopPropagation();
    };
  }

  function ordinal(n) {
    if (I18N.lang === 'ru') return n + '-е';
    if (I18N.lang === 'de') return n + '.';
    if (I18N.lang !== 'en') return n + 'º';
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /** The settings' focus: the group's row at the left, or one of its settings, scrolled into view. */
  function focusSettings() {
    var on = st.zone === Z.SETTINGS, list = $('settings').querySelectorAll('.group'), rows = $('settings').querySelectorAll('.pane .row'), i;
    for (i = 0; i < list.length; i++) {
      setClass(list[i], 'on', i === st.cat);
      setClass(list[i], 'focus', on && st.pane === 0 && i === st.cat);
    }
    for (i = 0; i < rows.length; i++) {
      setClass(rows[i], 'focus', on && st.pane === 1 && i === st.row);
      var opts = rows[i].querySelectorAll('.opt');   // the option the arrows are on, in the focused row
      for (var o = 0; o < opts.length; o++) setClass(opts[o], 'hot', on && st.pane === 1 && i === st.row && o === st.opt);
    }
    var holder = $('settings').querySelector('.pane .rows'), row = rows[st.row];
    if (!holder) return;
    var view = 760, shift = st.pane === 1 && row ? row.offsetTop + row.offsetHeight / 2 - view / 2 : 0;
    shift = Math.max(0, Math.min(holder.offsetHeight - view, shift));
    holder.style.webkitTransform = holder.style.transform = 'translateY(' + (-Math.round(shift)) + 'px)';
  }

  function openSettings() {
    st.zone = Z.SETTINGS;
    st.pane = 0;
    st.cat = 0;
    st.row = 0;
    renderSettings();
    setClass($('settings'), 'open', true);
    updateFocus();
  }

  function moveSettings(dx, dy) {
    if (st.pane === 0) {
      var c = Math.max(0, Math.min(groupsNow.length - 1, st.cat + dy));
      if (dy && c !== st.cat) { st.cat = c; st.row = 0; renderSettings(); return; }   // the group's settings show at once
      if (dx > 0) enterRows();
      return;
    }
    var r = rowsNow[st.row];
    if (dy) {
      st.row = Math.max(0, Math.min(rowsNow.length - 1, st.row + dy));
      st.opt = optionAt(rowsNow[st.row]);
    } else if (r && r.kind === 'choice' && st.opt + dx >= 0) st.opt = Math.min(r.options.length - 1, st.opt + dx);
    else if (dx < 0) st.pane = 0;
  }

  function enterRows() {
    if (!rowsNow.length) return;
    st.pane = 1;
    st.row = 0;
    st.opt = optionAt(rowsNow[0]);
  }

  function activateSettings() {
    if (st.pane === 0) { enterRows(); updateFocus(); return; }
    var r = rowsNow[st.row];
    if (!r) return;
    if (r.kind === 'action') { r.run(); return; }   // it may close the settings
    if (r.kind === 'choice') r.set(r.options[st.opt][0]);
    else r.set(!r.on);
    if (st.zone === Z.SETTINGS) renderSettings();
  }

  // MARK: - Moving an app on the shelf: hold OK on it (or the pointer's button), then ← →; OK or Back when done

  function startMove(i) {
    if (!shelf.length) return;
    closeSheets();
    st.zone = Z.SHELF;
    st.shelf = Math.max(0, Math.min(shelf.length - 1, i));
    st.moving = true;
    setClass(body, 'moving-app', true);
    updateFocus();
  }

  function endMove() {
    st.moving = false;
    setClass(body, 'moving-app', false);
    updateFocus();
  }

  /** The app and its neighbour swap places, and both slide there from where they were. */
  function shiftApp(dx) {
    var from = st.shelf, to = from + dx, tiles = $('tiles').children;
    if (to < 0 || to >= shelf.length) return;
    var step = tiles[to].offsetLeft - tiles[from].offsetLeft, ids = shelf.map(function (a) { return a.id; });
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    Prefs.set('shelf', ids);
    pickShelf();
    renderShelf();
    st.shelf = to;
    updateFocus();
    slide(tiles[to], 'translateX(' + (-step) + 'px) translateY(-14px) scale(1.16)');
    slide(tiles[from], 'translateX(' + step + 'px)');
  }

  function slide(node, start) {
    node.style.webkitTransition = node.style.transition = 'none';
    node.style.webkitTransform = node.style.transform = start;
    void node.offsetWidth;   // take the start before going back to the place the CSS gives it
    node.style.webkitTransition = node.style.transition = '';
    node.style.webkitTransform = node.style.transform = '';
  }

  /** ↓ while an app is picked up takes it off the shelf (to All Apps, where holding OK on it brings it back). */
  function dropApp() {
    var app = shelf[st.shelf];
    if (!app || shelf.length < 2) return;   // the last one stays: an empty shelf has nothing to focus
    onShelf(app);
    endMove();
    st.shelf = Math.min(st.shelf, shelf.length - 1);
    updateFocus();
    toast(tr(app.title + ' saiu da prateleira: segure OK nele em Todos os Apps para trazê-lo de volta.',
      app.title + ' is off the shelf: hold OK on it in All Apps to bring it back.',
      app.title + ' salió del estante: mantén OK en él en Todas las apps para traerlo de vuelta.'));
  }

  /** OK held on an app in All Apps puts it on the shelf, at the end. */
  function toShelf(app) {
    var before = shelf.length;
    onShelf(app);
    if (shelf.length === before) return;   // full: onShelf said so
    renderApps();
    st.grid = Math.max(0, Math.min(st.grid, others.length - 1));
    updateFocus();
    toast(tr(app.title + ' está na prateleira agora.', app.title + ' is on the shelf now.', app.title + ' está en el estante ahora.'));
  }

  /** OK (or the pointer's button) held: on the shelf it picks the app up, in All Apps it puts the app on the shelf. */
  function held(zone, index) {
    if (zone === Z.SHELF) startMove(index);
    else if (zone === Z.APPS && others[index]) toShelf(others[index]);
  }

  // OK on an app waits for the key to come up: held for 0.6 s, it does what holding does instead of opening it. The
  // remote repeats a held key, so a press within a second of the last is the same press (and a lost key-up can't stick).
  var okAt = 0, okHeld = false, holdTimer = 0, pointerHeld = false;

  function okDown() {
    if (okHeld && Date.now() - okAt < 1000) { okAt = Date.now(); return; }
    okHeld = true;
    okAt = Date.now();
    clearTimeout(holdTimer);
    holdTimer = 0;
    var zone = st.zone, index = zone === Z.SHELF ? st.shelf : st.grid;
    if ((zone === Z.SHELF && !st.moving && shelf.length) || (zone === Z.APPS && others[index])) {
      holdTimer = setTimeout(function () { holdTimer = 0; held(zone, index); }, 600);
    } else activate();
  }

  function okUp() {
    okHeld = false;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = 0; activate(); }
  }

  // MARK: - LG: Home in an app opened here comes back here; Home again (here) leaves LG's home screen up

  var homeTold = null, saverAsked = null;   // the TV's answers: null until it gives them

  /** The background service follows the Home key (webos/service); this page only sets it up and says how it went. */
  function watchHome() {
    TV.homeKey(Prefs.homeKey(), function (ok) {
      homeTold = ok;
      if (st.zone === Z.SETTINGS) renderSettings();
    });
  }

  /** While this app's screensaver is on, and this app in front, LG's own waits: this one comes instead. */
  function holdTvSaver() {
    TV.holdScreensaver(function () { return Prefs.saver() > 0 && !document.hidden; }, function (ok) { saverAsked = ok; });
  }

  // MARK: - Opening things

  function launcher(id, name) {
    function open() {
      TV.launch(id, null, function (ok) {
        if (ok) return;
        toast(tr('Não deu para abrir ', "Couldn't open ", 'No se pudo abrir ') + (name || id));
        wallFilm();
      });
    }
    return function () {
      // The TV shows this page's last picture again when it comes back: with the film in it, the video plane's black.
      // So the still first, drawn, then the app (after one still waiting, in turn).
      if (!hasClass(body, 'film-on') && !opening) { open(); return; }
      dropFilm();
      opening++;
      requestAnimationFrame(function () { requestAnimationFrame(function () { opening--; open(); }); });
    };
  }
  var opening = 0;

  function tvSettings() {
    TV.settings(function (ok) {
      if (!ok) toast(tr('Não deu para abrir os Ajustes da TV', "Couldn't open TV Settings", 'No se pudieron abrir los Ajustes del TV'));
    });
  }

  function activate() {
    if (st.moving) { endMove(); return; }   // OK puts a picked-up app down
    switch (st.zone) {
      case Z.TOP:
        if (st.top < 3) return;
        if (st.top === 3) openApps();
        else if (st.top === 4) { st.zone = Z.SHELF; openDrawer(); st.drawer = 1 < drawerInputs ? 1 : 0; updateFocus(); }
        else openSettings();
        return;
      case Z.CARDS:
        var p = cards[st.card], app = p && !p.input && Data.appFor(p.app);
        if (p && p.input) launcher(p.input.id, p.title)();
        else if (app) launcher(app.id, app.title)();
        return;
      case Z.SHELF:
        if (shelf[st.shelf]) launcher(shelf[st.shelf].id, shelf[st.shelf].title)();
        return;
      case Z.DRAWER:
        if (drawerItems[st.drawer]) drawerItems[st.drawer].run();
        return;
      case Z.APPS:
        if (others[st.grid]) launcher(others[st.grid].id, others[st.grid].title)();
        return;
      case Z.SETTINGS:
        activateSettings();
        return;
    }
  }

  function selectTab(i) {
    if (i === st.tab) return;
    st.tab = i;
    renderCards();
  }

  function move(dx, dy) {
    var tiles = $('tiles').children, cardNodes = $('cards').children;
    if (st.moving) { if (dx) shiftApp(dx); else if (dy > 0) dropApp(); return; }
    switch (st.zone) {
      case Z.SHELF:
        if (dx) st.shelf = Math.max(0, Math.min(shelf.length - 1, st.shelf + dx));
        else if (dy > 0) { openDrawer(); return; }
        else if (dy < 0) {
          if (cards.length) { st.zone = Z.CARDS; st.card = nearest(cardNodes, centerX(tiles[st.shelf])); }
          else { st.zone = Z.TOP; st.top = firstTop(); }
        }
        break;
      case Z.CARDS:
        if (dx) st.card = Math.max(0, Math.min(cards.length - 1, st.card + dx));
        else if (dy < 0) { st.zone = Z.TOP; st.top = firstTop(); }
        else if (shelf.length) { st.zone = Z.SHELF; st.shelf = nearest(tiles, centerX(cardNodes[st.card])); }
        break;
      case Z.TOP:
        if (dx) {
          st.top = Math.max(hasClass(body, 'no-picks') ? 3 : 0, Math.min(5, st.top + dx));
          if (st.top < 3) selectTab(st.top);   // as on Apple TV: focusing a tab selects it
        } else if (dy > 0) {
          if (cards.length) { st.zone = Z.CARDS; st.card = Math.min(cards.length - 1, st.top < 3 ? 0 : cards.length - 1); }
          else st.zone = Z.SHELF;
        }
        break;
      case Z.DRAWER:
        if (dx) st.drawer = Math.max(0, Math.min(drawerItems.length - 1, st.drawer + dx));
        else if (dy < 0) { closeDrawer(); return; }
        break;
      case Z.APPS:
        var g = st.grid + dx + dy * 5;
        if (g >= 0 && g < others.length && (dx === 0 || Math.floor(g / 5) === Math.floor(st.grid / 5))) st.grid = g;
        break;
      case Z.SETTINGS:
        moveSettings(dx, dy);
        break;
    }
    updateFocus();
  }

  function back() {
    if (st.moving) { endMove(); return; }
    if (st.zone === Z.SETTINGS && st.pane === 1) { st.pane = 0; updateFocus(); return; }   // to the groups first
    if (sheetOpen()) { closeSheets(); return; }
    if (st.zone === Z.DRAWER) { closeDrawer(); return; }
    if (st.zone !== Z.SHELF && shelf.length) { st.zone = Z.SHELF; updateFocus(); return; }
    TV.back();
  }

  /** The pointer focuses what it's over (the Magic Remote, or a mouse when previewing); in the settings, `group` marks
   *  a group at the left. Holding the button on an app picks it up, as holding OK does. */
  function hover(node, zone, index, group) {
    node.onmouseover = function () {
      if (saverOn || st.moving || (sheetOpen() !== (zone === Z.APPS || zone === Z.SETTINGS))) return;
      if (zone === Z.DRAWER && st.zone !== Z.DRAWER) return;
      if (zone !== Z.DRAWER && st.zone === Z.DRAWER && zone !== Z.SHELF) return;
      if (zone === Z.SHELF && st.zone === Z.DRAWER) closeDrawer();
      st.zone = zone;
      if (zone === Z.TOP) { st.top = index; if (index < 3) selectTab(index); }
      else if (zone === Z.CARDS) st.card = index;
      else if (zone === Z.SHELF) st.shelf = index;
      else if (zone === Z.DRAWER) st.drawer = index;
      else if (zone === Z.APPS) st.grid = index;
      else if (zone === Z.SETTINGS && group) {
        st.pane = 0;
        if (st.cat !== index) { st.cat = index; st.row = 0; renderSettings(); return; }
      } else if (zone === Z.SETTINGS) {
        if (st.pane !== 1 || st.row !== index) st.opt = optionAt(rowsNow[index]);
        st.pane = 1;
        st.row = index;
      }
      updateFocus();
    };
    node.onclick = function () {
      if (pointerHeld) { pointerHeld = false; return; }   // the long press picked the app up: no click after it
      if (st.moving) { endMove(); return; }
      node.onmouseover();
      activate();
    };
    if (zone !== Z.SHELF && zone !== Z.APPS) return;
    node.onmousedown = function () {
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { holdTimer = 0; pointerHeld = true; held(zone, index); }, 600);
    };
    node.onmouseup = node.onmouseleave = function () { if (!pointerHeld) { clearTimeout(holdTimer); holdTimer = 0; } };
  }

  // MARK: - Toast

  var toastTimer = 0;
  function toast(text) {
    var t = $('toast');
    t.textContent = text;
    setClass(t, 'on', true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { setClass(t, 'on', false); }, 6000);
  }

  // MARK: - Night, clock, screensaver

  function checkNight() {
    setClass(body, 'night', Data.isNight(Date.now()));
    wallFilm();
  }

  var saverOn = false, idleAt = Date.now(), saverIndex = 0, saverTimer = 0;

  function showSaver() {
    var photos = Data.showcase().filter(function (p) { return p.backdrop && Data.appFor(p.app); });
    saverOn = true;
    var s = $('saver');
    s.innerHTML = '';
    var a = el('div', 'photo', s), b = el('div', 'photo', s);
    el('div', 'shade', s);
    var float = el('div', 'float', s);   // all that is shown, a little elsewhere every few seconds: no burn-in on an OLED
    var clock = el('div', 'clock', float);
    el('div', 'time', clock);
    el('div', 'date', clock);
    el('div', 'title', clock);
    if (Prefs.weather()) el('div', 'wx', float);   // the weather under the clock: now, today's range, the next days
    if (Prefs.news() && hasClass(body, 'no-picks')) el('div', 'news', float);   // and the latest headline
    var front = a;
    // Without picks, a theme's dark wallpaper slowly moving, rather than black.
    if (!photos.length && hasClass(body, 'themed')) photos = [{backdrop: 'theme/night.jpg', title: ''}];
    function next() {
      if (!saverOn) return;
      var p = photos.length ? photos[saverIndex++ % photos.length] : null;
      var back = front === a ? b : a;
      if (p) {
        back.style.backgroundImage = 'url(' + (p.backdrop.indexOf('theme/') === 0 ? p.backdrop : Data.image(p.backdrop, 'original')) + ')';
        back.style.webkitTransform = back.style.transform = 'scale(1.0)';
        clock.lastChild.textContent = p.title;
        setTimeout(function () {
          setClass(back, 'on', true);
          setClass(front, 'on', false);
          back.style.webkitTransform = back.style.transform = 'scale(1.08) translateX(-1.5%)';
          front = back;
        }, 60);
      }
      tickSaverClock(clock);
      saverTimer = setTimeout(next, 12000);
    }
    setClass(s, 'on', true);
    next();
  }

  function tickSaverClock(clock) {
    var d = new Date();
    clock.firstChild.textContent = Data.time(d.getTime()).replace(/ (AM|PM)$/, '');
    try {
      clock.children[1].textContent = d.toLocaleDateString(I18N.locale(), {weekday: 'long', day: 'numeric', month: 'long'});
    } catch (e) {
      clock.children[1].textContent = d.toDateString();
    }
    var s = $('saver'), wx = s.querySelector('.wx'), news = s.querySelector('.news'), top = Data.news[0], float = s.querySelector('.float');
    if (wx) { wx.innerHTML = ''; renderWeather(wx); }   // kept as fresh as the clock
    if (news) {
      news.innerHTML = '';
      news.style.display = top ? 'block' : 'none';
      if (top) {
        el('div', 'head', news, 'SRF News' + (top.at ? ' · ' + Data.ago(top.at) : ''));
        el('div', 'what', news, top.title);
      }
    }
    var x = Math.round(Math.random() * 48 - 24), y = Math.round(Math.random() * 32 - 16);
    if (float) float.style.webkitTransform = float.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  }

  function hideSaver() {
    saverOn = false;
    clearTimeout(saverTimer);
    setClass($('saver'), 'on', false);
  }

  function poke() {
    idleAt = Date.now();
    if (saverOn) { hideSaver(); return true; }
    return false;
  }

  // MARK: - Keys

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    keyAt = Date.now();
    if (poke()) { e.preventDefault(); return; }   // the first press only wakes the screen
    if (k === TV.keys.left) move(-1, 0);
    else if (k === TV.keys.right) move(1, 0);
    else if (k === TV.keys.up) move(0, -1);
    else if (k === TV.keys.down) move(0, 1);
    else if (k === TV.keys.ok) okDown();
    else if (k === TV.keys.back || k === 27 || k === 8) back();
    else return;
    e.preventDefault();
  });
  document.addEventListener('keyup', function (e) {
    if (e.keyCode !== TV.keys.ok) return;
    okUp();
    e.preventDefault();
  });
  document.addEventListener('mousemove', function () { poke(); });
  document.addEventListener('mouseup', function () { setTimeout(function () { pointerHeld = false; }, 0); });   // after its click

  // MARK: - Start

  function renderAll() {
    renderTop();
    renderQuotes();
    cards = [];
    renderCards();
    renderShelf();
    renderDrawer();
    renderClock();
    checkNight();
    if (st.zone === Z.SETTINGS) renderSettings();
    updateFocus();
  }

  function loadApps(done) {
    TV.apps(function (list) {
      apps = list;
      Data.setApps(apps);
      pickShelf();
      TV.inputs(function (list2) {
        inputs = list2;
        if (done) done();
      });
    });
  }

  /** Back to the home screen (the app was opened again): the shelf, everything closed, the first tab. */
  function reset() {
    hideSaver();
    if (st.moving) endMove();
    closeSheets();
    st.zone = Z.SHELF;
    st.shelf = 0;
    if (st.tab !== 0) { st.tab = 0; renderCards(); }
    updateFocus();
  }

  Data.onChange(function () {
    renderQuotes();
    renderCards();
    renderPanels();
    checkNight();
  });

  /** The TV's apps and inputs again, a moment after coming back (an app installed, a device switched on): the shelf
   *  and the drawer are drawn again only when they changed, so the page is there at once as it was. */
  var appsSeen = '', appsTimer = 0, filmTimer = 0;
  function appsNow() { return JSON.stringify([apps, inputs, Prefs.shelf()]); }
  function refreshApps() {
    clearTimeout(appsTimer);
    appsTimer = setTimeout(function () {
      loadApps(function () {
        var seen = appsNow();
        if (seen !== appsSeen) { appsSeen = seen; renderShelf(); renderDrawer(); updateFocus(); }
        Data.refresh();
      });
    }, 1500);
  }

  function reopened() { TV.show(); reset(); refreshApps(); }

  window.addEventListener('resize', fit);
  document.addEventListener('webOSRelaunch', reopened);   // LG: opened again while running
  window.addEventListener('appcontrol', reopened);        // Samsung: the same
  document.addEventListener('visibilitychange', function () {
    clearTimeout(filmTimer);
    dropFilm();   // the TV's decoder for the app in front
    if (document.hidden) { hideSaver(); return; }
    TV.show();   // opened again: forward now, not after the first picture (LG sends webOSRelaunch only once it's drawn)
    idleAt = Date.now();
    filmTimer = setTimeout(wallFilm, 1500);   // back here: the page first, then the film over its still
    refreshApps();
  });

  // MARK: - Moving wallpaper

  // With the theme's films (16 s loops rendered in Blender), the wallpaper plays one; without, the still pans a
  // little, a few steps a second. Either holds still while the remote moves the focus, so it never competes with that.
  // A TV shows a film on its own video plane, through a hole in the page that stays black until the film runs: so the
  // film shows (body.film-on) only once it plays, over the same still.
  var wall = document.querySelector('#sky .wall'), film = wall.querySelector('video'), keyAt = 0, driftT = 0, filmSrc = '';

  function wallFilm() {
    var on = hasClass(body, 'themed') && !!window.CONFIG.themeVideo && Prefs.drift();
    setClass(body, 'moving', on);
    if (!on) { dropFilm(); return; }
    if (document.hidden) return;   // loaded again when back in front
    var src = 'theme/' + (hasClass(body, 'night') ? 'night' : 'day') + '.mp4';
    if (src !== filmSrc) { filmSrc = src; setClass(body, 'film-on', false); film.src = src; }
  }

  function dropFilm() {
    setClass(body, 'film-on', false);
    if (!filmSrc) return;
    filmSrc = '';
    film.pause();
    film.removeAttribute('src');
    film.load();
  }

  film.addEventListener('timeupdate', function () {
    if (filmSrc && film.currentTime > 0.3 && !hasClass(body, 'film-on')) setClass(body, 'film-on', true);
  });

  setInterval(function () {
    var still = !hasClass(body, 'themed') || !Prefs.drift() || document.hidden || saverOn, busy = Date.now() - keyAt < 1200;
    if (hasClass(body, 'moving')) {
      if ((still || busy) && !film.paused) film.pause();
      else if (!still && !busy && film.paused && filmSrc) {
        var p = film.play();
        if (p && p.catch) p.catch(function () {});
      }
      return;
    }
    if (still || busy) return;
    driftT += 0.15;
    var x = Math.sin(driftT / 29) * 48, y = Math.sin(driftT / 37) * 26;
    wall.style.webkitTransform = wall.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0)';
  }, 150);

  setClass(body, 'themed', !!(window.CONFIG && window.CONFIG.theme));
  applyMotion();
  I18N.set(Prefs.language());
  fit();
  renderTop();
  loadApps(function () {
    appsSeen = appsNow();
    renderAll();
    Data.refresh();
  });
  watchHome();
  holdTvSaver();
  setInterval(function () {
    renderClock();
    checkNight();
    Data.refresh();
    var after = Prefs.saver() * 60000;
    if (after && !saverOn && !sheetOpen() && Date.now() - idleAt > after) showSaver();
    if (saverOn) tickSaverClock($('saver').querySelector('.clock'));
  }, 30000);

  // For the browser preview and tests.
  window.FreeMyTV = {state: st, move: move, activate: activate, back: back, showSaver: showSaver, hideSaver: hideSaver, toast: toast,
    /** What the TV allows this app (null: no answer yet): the Home key (with the service), to hold its screensaver. */
    tv: function () { return {home: homeTold, saver: saverAsked}; }};
})();
