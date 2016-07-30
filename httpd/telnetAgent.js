/* 
 * telnetAgent lets normal web pages use APIs of apps 
 * It support tcp connection to external servers
 */

function telnetAgent() {
    this.telnetSockets = {};
    this.callback = {};

    var tcp = chrome.sockets.tcp;
    tcp.onReceive.addListener(this.onReceive_());
    tcp.onReceiveError.addListener(this.onReceiveError_());
}

telnetAgent.prototype.getSocketId = function(telnetSocket) {
    for(var webSocketId in this.telnetSockets) {
        if(telnetSocket == this.telnetSockets[webSocketId])
            return webSocketId;
    }
    return 0;
};

telnetAgent.prototype.create = function(socketId, host, port) {
    var _this = this;
    var tcp = chrome.sockets.tcp;

    var onCreated = function(createInfo) {
        if(createInfo.socketId <= 0) {
            // dump("Unable to create socket");
        }

        var onConnected = function(result) {
            _this.callback[socketId]({ action: "connected" });
            if(result < 0 && chrome.runtime.lastError)
                return _this.callback[socketId]({ action: "disconnected" });
            _this.telnetSockets[socketId] = createInfo.socketId;
        };

        tcp.connect(createInfo.socketId, host, port, onConnected);
    };

    tcp.create({}, onCreated);
};

telnetAgent.prototype.onReceive_ = function() {
    var _this = this;
    this.onReceive = function(receiveInfo) {
        var socketId = _this.getSocketId(receiveInfo.socketId);
        if(!socketId)
            return;

        // convert ArrayBuffer (ab) to String (str)
        var ab = receiveInfo.data;
        var str = String.fromCharCode.apply(null, new Uint8Array(ab));

        _this.callback[socketId]({
            action: "data",
            content: str
        });
    };
    return this.onReceive;
};

telnetAgent.prototype.onReceiveError_ = function() {
    var _this = this;
    this.onReceiveError = function(receiveInfo) {
        var socketId = _this.getSocketId(receiveInfo.socketId);
        if(!socketId)
            return;

        switch(receiveInfo.resultCode) {
        case -15: // socket is closed by peer, old version
        case -100: // socket is closed by peer, new version
            _this.callback[socketId]({ action: "disconnected" });
            break;
        default: // other errors
            // dump("Unknown errors");
        }
    };
    return this.onReceiveError;
};

telnetAgent.prototype.send = function(socketId, content) {
    if(!this.telnetSockets[socketId])
        return;

    // convert String (str) to ArrayBuffer (ab)
    var str = content;
    var ab = (new Uint8Array(Array.prototype.map.call(
        str, function(x) { return x.charCodeAt(0); }
    ))).buffer;

    var tcp = chrome.sockets.tcp;
    tcp.send(this.telnetSockets[socketId], ab, function() {});
};

telnetAgent.prototype.disconnect = function(socketId) {
    if(!this.telnetSockets[socketId])
        return;

    var tcp = chrome.sockets.tcp;
    tcp.disconnect(this.telnetSockets[socketId], function() {});
    tcp.close(this.telnetSockets[socketId], function() {});
    delete this.callback[socketId];
    delete this.telnetSockets[socketId];
};

telnetAgent.prototype.close = function(socketId) {
    if(socketId)
        return this.disconnect(socketId);
    for(var socketId in this.telnetSockets) {
        if(this.telnetSockets[socketId])
            this.callback[socketId]({ action: "disconnected" });
    }

    var tcp = chrome.sockets.tcp;
    tcp.onReceive.removeListener(this.onReceive);
    tcp.onReceiveError.removeListener(this.onReceiveError);
};
