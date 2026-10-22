/*
 * The TV's side of the web home screen: its apps, opening one, its inputs, its settings, the Back key, its time zone,
 * and on LG its screensaver and (with the background service) the Home key.
 *  - LG webOS: the TV's service bus (Luna), the same calls LG's launcher makes.
 *  - Samsung Tizen: Tizen's web APIs (tizen.application for the apps, tizen.tvwindow for the inputs).
 *  - A desktop browser: a stand-in with sample apps, so the screen can be previewed and tested on a computer.
 * Plain ES5: older TVs run a Chromium from 2015-2017 (webOS 3 and 4, Tizen 3).
 */
var TV = (function () {
  'use strict';

  var webos = typeof window.PalmServiceBridge !== 'undefined';
  var samsung = !webos && typeof window.tizen !== 'undefined' && !!window.tizen.application;
  var calls = [];   // a bridge is collected if nothing holds it before its reply arrives

  /** One Luna call; done(result) with null on failure. */
  function luna(uri, params, done) {
    if (!webos) {
      if (done) setTimeout(function () { done(null); }, 0);
      return;
    }
    var bridge = new window.PalmServiceBridge();
    calls.push(bridge);
    var finished = false;
    bridge.onservicecallback = function (message) {
      if (finished) return;
      finished = true;
      var i = calls.indexOf(bridge);
      if (i >= 0) calls.splice(i, 1);
      var result = null;
      try { result = JSON.parse(message); } catch (e) {}
      if (done) done(result && result.returnValue !== false ? result : null);
    };
    bridge.call(uri, JSON.stringify(params || {}));
  }

  /** A Luna subscription: on(result) for every message, once on(null) if the TV refuses it (or isn't a webOS TV). */
  function subscribe(uri, params, on) {
    if (!webos) { setTimeout(function () { on(null); }, 0); return; }
    var bridge = new window.PalmServiceBridge(), refused = false;
    calls.push(bridge);   // kept for as long as the app runs
    bridge.onservicecallback = function (message) {
      if (refused) return;
      var result = null;
      try { result = JSON.parse(message); } catch (e) {}
      if (!result || result.returnValue === false) {
        refused = true;
        var i = calls.indexOf(bridge);
        if (i >= 0) calls.splice(i, 1);
        on(null);
        return;
      }
      on(result);
    };
    params.subscribe = true;
    bridge.call(uri, JSON.stringify(params));
  }

  /** A key for LG's second-screen API (SSAP, what phone apps use) on the TV itself, which tells which app is in front
   *  where Luna denies it to developer apps: the TV asks the person once, then the key is kept. done(key) or done(null)
   *  (the person said no: not asked again until askFrontAgain). */
  var SSAP_KEY = 'fmtv.ssapKey', SSAP_NO = 'fmtv.ssapDenied', homeCalls = 0;

  function stored(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  function ssapKey(done) {
    var key = stored(SSAP_KEY), s, over = false;
    if (!key && stored(SSAP_NO)) { setTimeout(function () { done(null); }, 0); return; }
    try { s = new WebSocket('ws://127.0.0.1:3000'); } catch (e) { setTimeout(function () { done(null); }, 0); return; }
    function finish(k) {
      if (over) return;
      over = true;
      try { s.close(); } catch (e) {}
      done(k);
    }
    s.onopen = function () {
      var payload = {forcePairing: false, pairingType: 'PROMPT',
        manifest: {manifestVersion: 1, appVersion: '1.0', localizedAppNames: {'': 'Free My TV'}, permissions: ['READ_RUNNING_APPS', 'READ_APP_STATUS']}};
      if (key) payload['client-key'] = key;
      s.send(JSON.stringify({type: 'register', id: 'reg', payload: payload}));
    };
    s.onmessage = function (m) {
      var d = null;
      try { d = JSON.parse(m.data); } catch (e) { return; }
      if (d.type === 'registered') { store(SSAP_KEY, d.payload['client-key']); finish(d.payload['client-key']); }
      else if (d.type === 'error') { store(SSAP_KEY, null); store(SSAP_NO, '1'); finish(null); }   // the person said no
    };
    s.onclose = function () { finish(null); };
  }

  // LG inputs: the antenna and the four HDMI ports, with the apps LG opens for them.
  var INPUTS = [
    {id: 'com.webos.app.livetv', key: 'live', label: null, symbol: 'live_tv'},
    {id: 'com.webos.app.hdmi1', key: 'hdmi1', label: 'HDMI 1', symbol: 'hdmi'},
    {id: 'com.webos.app.hdmi2', key: 'hdmi2', label: 'HDMI 2', symbol: 'hdmi'},
    {id: 'com.webos.app.hdmi3', key: 'hdmi3', label: 'HDMI 3', symbol: 'hdmi'},
    {id: 'com.webos.app.hdmi4', key: 'hdmi4', label: 'HDMI 4', symbol: 'hdmi'}
  ];

  // Not shown among LG's apps: the inputs above, LG's own home and launchers.
  var HIDDEN = /^(com\.webos\.app\.(livetv|hdmi\d|home|homeconnect|discovery|launcher)|com\.webos\.app\.inputpicker)$/;

  // Not shown among Samsung's apps: Smart Hub's own pieces, the platform's tools and players (but its browser and
  // Netflix, which live there too), services, keyboards and ad players. The rest is what Smart Hub shows.
  var SAMSUNG_HIDDEN = /^(org\.volt\.|org\.tizen\.(?!browser$|netflix)|ise-|d75857a5-)|Service$|[Dd]aemon|Preview$|syspopup|[Hh]elper$|AdPlayer|AdSuite|[Kk]eyboard/;

  // Samsung's live TV viewer: it shows whichever source the TV is on (the antenna, or the HDMI picked here).
  var SAMSUNG_VIEWER = 'org.tizen.tv-viewer';

  // Well-known LG apps: the desktop stand-in shows them all. Some LG firmware (webOS 25, and older ones too) denies
  // listLaunchPoints to developer apps while launch and getAppLoadStatus still work: then the TV's apps are the ones
  // here it says it has.
  var KNOWN = [
    ['netflix', 'Netflix', '#E50914'], ['youtube.leanback.v4', 'YouTube', '#FF0033'], ['amazon', 'Prime Video', '#1A98FF'],
    ['com.disney.disneyplus-prod', 'Disney+', '#1838C8'], ['com.wbd.stream', 'HBO Max', '#6C3BE0'], ['com.hbo.hbomax', 'Max', '#6C3BE0'],
    ['com.apple.appletv', 'Apple TV', '#B8BCC6'], ['globoplaywebos', 'Globoplay', '#FF5A1F'], ['spotify-beehive', 'Spotify', '#1DB954'],
    ['cdp-30', 'Plex', '#E5A00D'], ['com.crunchyroll.webapp', 'Crunchyroll', '#F47521'], ['ui30', 'Rakuten TV', '#BF0000'],
    ['sky', 'Sky', '#0072C9'], ['com.webos.app.lgchannels', 'LG Channels', '#FD312E'], ['amazon.alexa.view', 'Alexa', '#00A8E1'],
    ['com.webos.app.mediadiscovery', 'Media Player', '#7E56B1'], ['com.webos.app.browser', 'Web Browser', '#3A7BD5'],
    ['com.webos.app.discovery', 'LG Content Store', '#4FAA6E'], ['com.palmdts.devmode', 'Developer Mode', '#BB3F3F']
  ];

  // The TV's own icons, when the build found them in icons/: {app id: the color of the icon's border, '' if see-through}.
  var icons = window.ICONS || {};

  function knownApp(k) {
    var has = icons.hasOwnProperty(k[0]);
    return {id: k[0], title: k[1], icon: has ? 'icons/' + k[0] + '.png' : '', color: k[2], edge: has ? icons[k[0]] : ''};
  }

  /** The apps to look for: this TV's own list when the build has it (icons/apps.json), else the well-known ones. */
  function candidates() {
    var list = (window.TVAPPS || []).map(function (a) { return [a.id, a.title, a.color]; });
    return (list.length ? list : KNOWN).filter(function (k) { return !HIDDEN.test(k[0]) && k[0] !== self; });
  }

  /** The candidates the TV says are installed, in the list's order. */
  function knownApps(done) {
    var list = candidates(), found = [], left = list.length;
    if (!left) { done([]); return; }
    list.forEach(function (k, i) {
      luna('luna://com.webos.applicationManager/getAppLoadStatus', {appId: k[0]}, function (res) {
        if (res && res.exist) found[i] = knownApp(k);
        if (--left === 0) done(found.filter(Boolean));
      });
    });
  }

  var self = 'io.freemytv';
  if (webos && window.PalmSystem && window.PalmSystem.identifier) self = window.PalmSystem.identifier.split(' ')[0];
  if (samsung) {
    try { self = window.tizen.application.getCurrentApplication().appInfo.id; } catch (e) {}
  }

  // MARK: - Samsung

  function samsungApps(done) {
    try {
      window.tizen.application.getAppsInfo(function (list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var a = list[i];
          if (!a.id || a.show === false || a.id === self || SAMSUNG_HIDDEN.test(a.id)) continue;
          var icon = a.iconPath || '';
          if (icon && icon.indexOf('://') < 0) icon = 'file://' + icon;
          out.push({id: a.id, title: a.name || a.id, icon: icon, color: ''});
        }
        // Smart Hub keeps its own order, which isn't readable: the same alphabetical order as All Apps elsewhere.
        out.sort(function (x, y) { var a = x.title.toLowerCase(), b = y.title.toLowerCase(); return a < b ? -1 : a > b ? 1 : 0; });
        done(out);
      }, function () { done([]); });
    } catch (e) {
      done([]);
    }
  }

  function samsungLaunch(id, done) {
    try {
      window.tizen.application.launch(id, function () { if (done) done(true); }, function () { if (done) done(false); });
    } catch (e) {
      if (done) done(false);
    }
  }

  /** The video sources the TV reports ([{type: 'TV' | 'HDMI' | ..., number}]), or null when it doesn't tell. */
  function samsungSources(done) {
    try {
      window.tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (v) { done(v && v.connected ? v.connected : null); },
          function () { done(null); });
    } catch (e) {
      done(null);
    }
  }

  /** Puts the TV on a source ("source:HDMI:2"), then brings the TV's viewer up to show it. */
  function samsungSource(spec, done) {
    var parts = spec.split(':'), type = parts[1], number = +parts[2];
    function show(ok) {
      if (!ok) { if (done) done(false); return; }
      samsungLaunch(SAMSUNG_VIEWER, function (shown) {
        if (!shown) {
          try { window.tizen.application.getCurrentApplication().hide(); } catch (e) {}
        }
        if (done) done(true);
      });
    }
    samsungSources(function (sources) {
      var source = null;
      for (var i = 0; sources && i < sources.length; i++) {
        if (sources[i].type === type && sources[i].number === number) source = sources[i];
      }
      if (!source) { show(type === 'TV'); return; }   // the antenna: the viewer alone brings it up
      try {
        window.tizen.tvwindow.setSource(source, function () { show(true); }, function () { show(false); });
      } catch (e) {
        show(false);
      }
    });
  }

  function samsungInputs(done) {
    var list = [{id: 'source:TV:1', key: 'live', label: null, symbol: 'live_tv', connected: true}];
    for (var n = 1; n <= 4; n++) list.push({id: 'source:HDMI:' + n, key: 'hdmi' + n, label: 'HDMI ' + n, symbol: 'hdmi', connected: true});
    samsungSources(function (sources) {
      if (sources) {
        for (var i = 1; i < list.length; i++) list[i].connected = false;
        for (var j = 0; j < sources.length; j++) {
          var s = sources[j];
          if (s.type === 'HDMI' && s.number >= 1 && s.number <= 4) list[s.number].connected = true;
        }
      }
      done(list);
    });
  }

  /** Samsung's settings: whichever app answers the platform's "settings" request. */
  function samsungSettings(done) {
    try {
      var control = new window.tizen.ApplicationControl('http://tizen.org/appcontrol/operation/setting', null, null, null, []);
      window.tizen.application.launchAppControl(control, null, function () { if (done) done(true); },
          function () { if (done) done(false); });
    } catch (e) {
      if (done) done(false);
    }
  }

  // MARK: - The TV, whichever it is

  return {
    name: webos ? 'webos' : samsung ? 'tizen' : 'browser',

    /** Installed apps, as the TV's launcher lists them: [{id, title, icon, color}]. */
    apps: function (done) {
      if (samsung) { samsungApps(done); return; }
      if (!webos) {
        done(candidates().map(knownApp));
        return;
      }
      luna('luna://com.webos.applicationManager/listLaunchPoints', {}, function (res) {
        if (!res) { knownApps(done); return; }
        var out = [];
        var points = res && res.launchPoints ? res.launchPoints : [];
        for (var i = 0; i < points.length; i++) {
          var p = points[i];
          if (!p.id || p.id === self || HIDDEN.test(p.id)) continue;
          out.push({id: p.id, title: p.title || p.id, icon: p.largeIcon || p.icon || '', color: p.bgColor || p.iconColor || ''});
        }
        done(out);
      });
    },

    /** Opens an app (or an input); done(ok). */
    launch: function (id, params, done) {
      if (samsung) {
        if (id.indexOf('source:') === 0) samsungSource(id, done);
        else samsungLaunch(id, done);
        return;
      }
      if (!webos) {
        if (done) setTimeout(function () { done(true); }, 0);
        return;
      }
      luna('luna://com.webos.applicationManager/launch', params ? {id: id, params: params} : {id: id}, function (res) {
        if (done) done(!!res);
      });
    },

    /** The antenna and HDMI inputs; `connected` when the TV says a device is on (when it tells). */
    inputs: function (done) {
      if (samsung) { samsungInputs(done); return; }
      var list = INPUTS.map(function (x) { return {id: x.id, key: x.key, label: x.label, symbol: x.symbol, connected: true}; });
      if (!webos) {
        list[2].connected = false;
        list[3].connected = false;
        list[4].connected = false;
        done(list);
        return;
      }
      luna('luna://com.webos.service.eim/getAllInputStatus', {}, function (res) {
        var devices = res && res.devices ? res.devices : null;
        if (devices) {
          for (var i = 1; i < list.length; i++) {
            for (var j = 0; j < devices.length; j++) {
              var d = devices[j];
              if (d.appId !== list[i].id) continue;
              list[i].connected = d.connected !== false;
              list[i].plugged = d.hdmiPlugIn === true;   // a cable in the port (connected alone is true for an empty one)
              if (/game/i.test(d.icon || '')) list[i].symbol = 'gamepad';
              else if (/streaming|box/i.test(d.icon || '')) list[i].symbol = 'streaming_box';
              // A name the person gave the input on the TV ("PS5"), if any.
              if (d.label && !/^hdmi\s*\d$/i.test(d.label)) list[i].label = d.label;
            }
          }
        }
        done(list);
      });
    },

    /** The TV's own settings; done(ok). */
    settings: function (done) {
      if (samsung) samsungSettings(done);
      else this.launch('com.palm.app.settings', null, done);
    },

    /** Opened again while running: LG keeps the app behind until it asks to come forward (handlesRelaunch). */
    show: function () {
      if (webos && window.PalmSystem && window.PalmSystem.activate) window.PalmSystem.activate();
    },

    /** Back on the first screen: back to wherever the person came from. */
    back: function () {
      if (samsung) {
        try { window.tizen.application.getCurrentApplication().hide(); } catch (e) {}
        return;
      }
      if (window.PalmSystem && window.PalmSystem.platformBack) window.PalmSystem.platformBack();
    },

    /** This app's id. */
    self: self,

    /** LG: Home in an app opened from here comes back here (on) or not. The background service does it (this page is
     *  suspended then), with the SSAP key; status(true) when it's set up, status(false) when it can't be. */
    homeKey: function (on, status) {
      if (!webos) { setTimeout(function () { status(false); }, 0); return; }
      var gen = ++homeCalls;
      // Again a little later, while this is the latest call: the service ends with an update and starts again on
      // the next call, and the TV's second-screen server can be busy just after it starts.
      function again() { if (gen === homeCalls) setTimeout(start, 5000); }
      function start() {
        ssapKey(function (key) {
          if (!key) { status(false); if (stored(SSAP_KEY)) again(); return; }
          // the page stays subscribed: that keeps the service running while another app is in front
          subscribe('luna://' + self + '.service/watch', {key: key, on: on}, function (res) {
            status(!!res);
            if (!res) again();
          });
        });
      }
      start();
    },

    /** Ask the TV again (after the person said no to this app seeing which app is in front). */
    askFrontAgain: function () { store(SSAP_NO, null); },

    /** LG asks before its screensaver comes on: hold(), when true, says no (this app's own screensaver comes instead).
     *  done(false) if the TV doesn't ask this app. */
    holdScreensaver: function (hold, done) {
      var answered = false;
      subscribe('luna://com.webos.service.tvpower/power/registerScreenSaverRequest', {clientName: self}, function (res) {
        if (!answered) { answered = true; if (done) done(!!res); }
        if (!res || res.state !== 'Active') return;
        luna('luna://com.webos.service.tvpower/power/responseScreenSaverRequest', {clientName: self, ack: !hold(), timestamp: res.timestamp});
      });
    },

    /** The TV's time zone ("America/Sao_Paulo"), or ''. */
    zone: function () {
      if (samsung) {
        try { return window.tizen.time.getLocalTimezone() || ''; } catch (e) {}
      }
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
    },

    /** Key codes: the arrows, OK and the TV's Back (LG 461, Samsung 10009). */
    keys: {left: 37, up: 38, right: 39, down: 40, ok: 13, back: samsung ? 10009 : 461}
  };
})();
