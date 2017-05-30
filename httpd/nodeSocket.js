// Implements some of net.Socket API of Node.js by chrome.sockets.tcp

'use strict';

function nodeSocket(options) {
  this.options = options || {};
  this.options.socketId = -1;
  this.tcp = chrome.sockets.tcp;
  this.listeners_ = {};
}

nodeSocket.prototype = {
  on: function(eventName, listener) {
    if (!this.listeners_[eventName])
      this.listeners_[eventName] = [];
    this.listeners_[eventName].push(listener);
    return this;
  },

  emit: function(eventName, args) {
    var arg_arr = Array.prototype.slice.call(arguments, 1);
    var ret = false;
    if (this.listeners_[eventName]) {
      this.listeners_[eventName].map(function(listener) {
        var result = listener.apply(null, arg_arr);
        ret = ret || result;
        return result;
      });
    }
    if (eventName == 'error') {
      this.emit('close', true);
    } else if (eventName == 'end') {
      this.emit('close', false);
    }
    return ret;
  },

  removeListener: function(eventName, listener) {
    if (!this.listeners_[eventName])
      return;
    for (var i = this.listeners_[eventName].length - 1; i >= 0; i--) {
      if (this.listeners_[eventName][i] == listener) {
        this.listeners_[eventName].splice(i, 1);
        break; // only remove listener once
      }
    }
  },

  setEncoding: function(encoding) {
    this.encoding = encoding;
  },

  connect: function(port, host, connectListener) { // path is not supported
    if (!port)
      return;
    if (!connectListener && typeof(host) == 'function') {
      connectListener = host;
      host = '';
    }
    if (port.port) { // 1st arg is options
      host = port.host;
      port = port.host;
    }

    if (connectListener)
      this.on('connect', connectListener);
    if (!host)
      host = '127.0.0.1';

    var _this = this;
    this.tcp.create({
      name: this.options.name
    }, function(createInfo) {
      if (createInfo.socketId <= 0)
        _this.emit('error', 'Unable to create socket');
      _this.tcp.connect(createInfo.socketId, host, port, function(result) {
        if (result < 0 && chrome.runtime.lastError)
          return _this.emit('error', 'Unable to connect ' + host);
        _this.emit('connect');
        _this.options.socketId = createInfo.socketId;
        _this.onReceive = function(info) {
          if (info.socketId != createInfo.socketId) // data from other sockets
            return;
          var data = new Uint8Array(info.data);
          if (_this.encoding) // charset converter is not supported
            data = String.fromCharCode.apply(null, data);
          _this.emit('data', data);
        };
        _this.tcp.onReceive.addListener(_this.onReceive);
        _this.onReceiveError = function(info) {
          if (info.socketId != createInfo.socketId) // data from other sockets
            return;
          //https://cs.chromium.org/chromium/src/net/base/net_error_list.h
          switch (info.resultCode) {
            case -15: // SOCKET_NOT_CONNECTED
            case -100: // CONNECTION_CLOSED
              _this.emit('end');
              break;
            default: // other errors
              _this.emit('error', 'Error code: ' + info.resultCode);
          }
          _this.options.socketId = -1;
        };
        _this.tcp.onReceiveError.addListener(_this.onReceiveError);
      });
    });
    return this;
  },

  write: function(data, encoding, callback) {
    if (encoding != 'binary') // other encodings are not supported
      return;
    if (this.options.socketId < 0)
      return;
    var _this = this;
    this.tcp.send(
      _this.options.socketId,
      (new Uint8Array(Array.prototype.map.call(
        data,
        function(x) {
          return x.charCodeAt(0);
        }
      ))).buffer,
      function(sendInfo) {
        callback ? callback() : '';
      }
    );
    // return is not supported
  },

  end: function(data, encoding) {
    if (this.options.socketId < 0)
      return;
    if (data)
      this.write(data, encoding);
    this.tcp.disconnect(this.options.socketId, function() {});
  },

  destroy: function(exception) {
    if (exception)
      this.emit('error', exception);
    if (this.options.socketId < 0)
      return;
    this.end();
    this.tcp.close(this.options.socketId, function() {});
    this.tcp.onReceive.removeListener(this.onReceive);
    this.tcp.onReceiveError.removeListener(this.onReceiveError);
    this.options.socketId = -1;
  }
};

