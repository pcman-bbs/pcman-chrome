// create socket to server or agent

'use strict';

var EXPORTED_SYMBOLS = ["BrowserComm"];

function BrowserComm(ui) {
    this.listener = ui.listener;
    this.ws = null;
    this.onload();
}

BrowserComm.prototype.onload = function() {
    if (this.ws)
        this.onunload();
};

BrowserComm.prototype.connect = function(conn, host, port) {
    if (this.ws)
        this.onunload();

    var wsUri = window.location.href.replace('http', 'ws');
    if (wsUri.indexOf('#') >= 0)
        wsUri = wsUri.substr(0, wsUri.indexOf('#'));
    if (wsUri.indexOf('?') >= 0)
        wsUri = wsUri.substr(0, wsUri.indexOf('?'));
    var ws = new WebSocket(wsUri);
    ws.binaryType = 'arraybuffer';

    ws.onopen = function(event) {
        if (ws.readyState == 1)
            conn.socket.send(host + ':' + port, 'con');
    };
    ws.onclose = function(event) {
        ws = null;
        if (conn.socket.ws) // socket abnormal close
            conn.onStopRequest();
    };
    ws.onerror = function(event) {
        //conn.listener.ui.debug(event.data);
        ws = null;
        conn.onStopRequest();
    };
    ws.onmessage = function(event) {
        var data = String.fromCharCode.apply(null, new Uint8Array(event.data));
        var action = data.substr(0, 3);
        var content = data.substr(3);
        switch (action) {
            case "con":
                conn.onStartRequest();
                break;
            case "dat":
                conn.onDataAvailable(content);
                break;
            case "dis":
                conn.onStopRequest();
                break;
            case "cop":
                conn.socket.copyCallback();
                break;
            case "pas":
                conn.socket.pasteCallback(decodeURIComponent(escape(content)));
                break;
            default:
        }
    };
    this.ws = ws;
};

BrowserComm.prototype.send = function(output, action) {
    if (!this.ws)
        return;
    if (this.ws.readyState != 1)
        return;
    if (!action)
        action = 'dat';
    this.ws.send((new Uint8Array(Array.prototype.map.call(
        action + output,
        function(x) {
            return x.charCodeAt(0);
        }
    ))).buffer);
};

BrowserComm.prototype.onunload = function() {
    if (!this.ws)
        return;
    this.send('', 'dis');
    this.ws.close();
    this.ws = null;
};

BrowserComm.prototype.copy = function(text, callback) {
    if (!this.ws)
        return;
    this.send(unescape(encodeURIComponent(text)), 'cop');
    this.copyCallback = callback;
};

BrowserComm.prototype.paste = function(callback) {
    if (!this.ws)
        return;
    this.send('', 'pas');
    this.pasteCallback = callback;
};

