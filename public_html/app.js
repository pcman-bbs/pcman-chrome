function AppCom(conn) {
    this.conn = conn;
    this.ws = null;
    this.onload();
}

AppCom.prototype.onload = function() {
    if(this.ws)
        this.onunload();
};

AppCom.prototype.connect = function(host, port) {
    if(this.ws)
        this.onunload();

    var wsUri = window.location.href.replace('http', 'ws');
    if(wsUri.indexOf('#') >= 0)
        wsUri = wsUri.substr(0, wsUri.indexOf('#'));
    if(wsUri.indexOf('?') >= 0)
        wsUri = wsUri.substr(0, wsUri.indexOf('?'));
    this.ws = new WebSocket(wsUri);
    this.ws.binaryType = 'arraybuffer';

    var conn = this.conn;
    this.ws.onopen = function(event) {
        if(conn.app.ws.readyState == 1)
            conn.app.send(host + ':' + port, 'con');
    };
    this.ws.onclose = function(event) {
        conn.app.ws = null;
        conn.onStopRequest();
    };
    this.ws.onerror = function(event) {
        //dump(event.data);
        conn.app.ws = null;
        conn.onStopRequest();
    };
    this.ws.onmessage = function(event) {
        var data = String.fromCharCode.apply(null, new Uint8Array(event.data));
        var action = data.substr(0, 3);
        var content = data.substr(3);
        switch(action) {
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
            conn.app.copyCallback();
            break;
        case "pas":
            conn.app.pasteCallback(decodeURIComponent(escape(content)));
            break;
        default:
        }
    };
};

AppCom.prototype.send = function(output, action) {
    if(!this.ws)
        return;
    if(this.ws.readyState != 1)
        return;
    if(!action)
        action = 'dat';
    this.ws.send((new Uint8Array(Array.prototype.map.call(
        action + output, function(x) { return x.charCodeAt(0); }
    ))).buffer);
};

AppCom.prototype.onunload = function() {
    if(!this.ws)
        return;
    this.send('', 'dis');
    this.ws.close();
    this.ws = null;
};

AppCom.prototype.copy = function(text, callback) {
    if(!this.ws)
        return;
    this.send(unescape(encodeURIComponent(text)), 'cop');
    this.copyCallback = callback;
};

AppCom.prototype.paste = function(callback) {
    if(!this.ws)
        return;
    this.send('', 'pas');
    this.pasteCallback = callback;
};
