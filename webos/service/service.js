/*
 * Free My TV's background service on LG webOS: Home pressed in an app opened from Free My TV brings Free My TV back;
 * Home pressed in Free My TV itself leaves LG's home screen up.
 *
 * The home screen's page is suspended while another app is in front, so it can't see the Home key; this service
 * keeps running. webOS denies developer apps which app is in front over Luna, but LG's second-screen API (SSAP, a
 * WebSocket on the TV itself) answers it to a client the person allowed on the TV: the page pairs once and hands the
 * key over. Plain ES5 and Node's own modules (older webOS ships an old Node).
 *
 *   luna://io.freemytv.service/watch {key, on}  (subscribe: the page stays subscribed, which keeps the service alive)
 *   luna://io.freemytv.service/status            what it saw, for tests
 */
var Service = require('webos-service');
var net = require('net');
var crypto = require('crypto');

var APP = 'io.freemytv';
var HOME = /^com\.webos\.app\.(home|launcher)$/;
var service = new Service('io.freemytv.service');
var state = {key: null, on: true, connected: false, front: '', openedHere: '', log: []};
var socket = null, retry = null;

function note(text) {
  state.log.push(new Date().toISOString().slice(11, 23) + ' ' + text);
  if (state.log.length > 40) state.log.shift();
}

// MARK: - A small WebSocket client (text frames, masked as a client must, pings answered)

function connect(onText, onClose) {
  var sock = net.connect(3000, '127.0.0.1'), buf = Buffer.alloc(0), text = Buffer.alloc(0), open = false;
  var wsKey = crypto.randomBytes(16).toString('base64');

  function frame(op, data) {
    var mask = crypto.randomBytes(4), len = data.length, head;
    if (len < 126) head = Buffer.from([0x80 | op, 0x80 | len]);
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 0x80 | 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 0x80 | 127; head.writeUInt32BE(0, 2); head.writeUInt32BE(len, 6); }
    var body = Buffer.alloc(len);
    for (var i = 0; i < len; i++) body[i] = data[i] ^ mask[i % 4];
    sock.write(Buffer.concat([head, mask, body]));
  }

  sock.on('connect', function () {
    sock.write('GET / HTTP/1.1\r\nHost: 127.0.0.1:3000\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'
      + 'Sec-WebSocket-Key: ' + wsKey + '\r\nSec-WebSocket-Version: 13\r\n\r\n');
  });
  sock.on('data', function (d) {
    buf = Buffer.concat([buf, d]);
    if (!open) {
      var end = buf.indexOf('\r\n\r\n');
      if (end < 0) return;
      if (!/^HTTP\/1\.1 101/.test(buf.slice(0, end).toString())) { sock.destroy(); return; }
      buf = buf.slice(end + 4);
      open = true;
      sock.emit('open');
    }
    while (buf.length >= 2) {
      var len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = buf.readUInt32BE(6); off = 10; }
      if (buf[1] & 128) off += 4;   // a server doesn't mask, but in case
      if (buf.length < off + len) return;
      var op = buf[0] & 15, fin = buf[0] & 128, payload = buf.slice(off, off + len);
      buf = buf.slice(off + len);
      if (op === 1 || op === 0) {
        text = Buffer.concat([text, payload]);
        if (fin) { var t = text.toString(); text = Buffer.alloc(0); onText(t); }
      } else if (op === 8) sock.end();
      else if (op === 9) frame(10, payload);
    }
  });
  sock.on('error', function () {});
  sock.on('close', onClose);
  sock.sendText = function (t) { frame(1, Buffer.from(t)); };
  return sock;
}

// MARK: - Which app is in front, and Home

function launchSelf() {
  service.call('luna://com.webos.applicationManager/launch', {id: APP}, function (r) {
    note('launch ' + APP + ' ' + (r.payload && r.payload.returnValue !== false ? 'ok' : JSON.stringify(r.payload)));
  });
}

/** The app in front changed: an app opened from Free My TV (by it, or by the remote's own key while it was in front)
 *  and then LG's home screen means Home was pressed in that app. */
function front(id) {
  if (!id || id === state.front) return;
  var was = state.front;
  note('front ' + id);
  if (HOME.test(id) && state.on && state.openedHere && was === state.openedHere) {
    state.openedHere = '';
    launchSelf();
  } else if (id === APP) state.openedHere = '';
  else if (was === APP && !HOME.test(id)) state.openedHere = id;
  state.front = id;
}

function watch() {
  if (socket || !state.key) return;
  clearTimeout(retry);
  socket = connect(function (t) {
    var m = null;
    try { m = JSON.parse(t); } catch (e) { return; }
    if (m.type === 'registered') {
      state.connected = true;
      note('registered');
      socket.sendText(JSON.stringify({type: 'subscribe', id: 'front', uri: 'ssap://com.webos.applicationManager/getForegroundAppInfo'}));
    } else if (m.type === 'error') note('error ' + JSON.stringify(m.error || m.payload));
    else if (m.id === 'front' && m.payload) front(m.payload.appId);
  }, function () {
    state.connected = false;
    socket = null;
    note('closed');
    retry = setTimeout(watch, 5000);   // the TV woke up, or its server restarted
  });
  socket.on('open', function () {
    socket.sendText(JSON.stringify({type: 'register', id: 'reg', payload: {forcePairing: false, pairingType: 'PROMPT', 'client-key': state.key,
      manifest: {manifestVersion: 1, appVersion: '1.0', localizedAppNames: {'': 'Free My TV'}, permissions: ['READ_RUNNING_APPS', 'READ_APP_STATUS']}}}));
  });
}

// MARK: - The bus

service.register('watch', function (message) {
  var p = message.payload || {};
  if (p.key) state.key = p.key;
  if (p.on !== undefined) state.on = p.on !== false;
  watch();
  message.respond({returnValue: true, connected: state.connected, on: state.on});
}, function () {});

service.register('status', function (message) {
  message.respond({returnValue: true, connected: state.connected, on: state.on, front: state.front, openedHere: state.openedHere, log: state.log});
});

try { service.activityManager.create('keepAlive', function () {}); } catch (e) {}
// The bus's handle doesn't hold Node's event loop open on its own: without this, Node ends the service at once (exit 0)
setInterval(function () {}, 3600000);
