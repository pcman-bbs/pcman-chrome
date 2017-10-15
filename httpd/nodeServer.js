/* 
 * Serve main programs to browsers by HTTP and convert raw socket to websocket
 * Support both Chrome apps and Node.js platforms
 * Web & websocket server in Chrome app is modified from Http WebSocket Server:
 * https://github.com/GoogleChrome/chrome-app-samples/tree/master/websocket-server
 * The document root is modified to /public_html within this app
 * The directory index page is set as index.htm only
 */

'use strict';

function Server(port, host) {
  this.mod = {
    manifest: require('../manifest.json'),
    charset: require('./charset/charset.js'),
    // Node.js modules on npm
    iconv: require('iconv-lite'), // dep: none
    clipboard: require('copy-paste-win32fix'), // dep: iconv-lite
    wsServer: require('ws').Server, // dep: safe-buffer, ultron
    // Node.js built-in modules
    fs: require('fs'),
    http: require('http'),
    netSocket: require('net').Socket
  };
  if (typeof(__dirname) != 'undefined') {
    var fs = this.mod['fs'];
    var key = __dirname + '/https-key.pem';
    var cert = __dirname + '/https-cert.pem';
    if (fs.existsSync(key) && fs.existsSync(cert)) {
      this.mod['http'] = {
        createServer: function(requestListener) {
          return require('https').createServer({
            key: fs.readFileSync(key),
            cert: fs.readFileSync(cert)
          }, requestListener);
        }
      };
    }
  }

  this.httpServer = null;
  this.wsServer = null;
  this.socketIds = 0;
  this.telnets = [];
  this.logger = {
    textContent: ''
  };

  this.initial(port, host);
}

Server.prototype = {
  initial: function(port, host) {
    if (!port)
      port = 8080;
    if (!host)
      host = '127.0.0.1';
    if (typeof(port) == 'string') {
      if (port.indexOf(':') >= 0) {
        var hostPort = port.split(':');
        port = parseInt(hostPort[1]);
        host = hostPort[0];
      } else {
        port = parseInt(port);
      }
    }
    this.httpServer = this.http(port, host);
    this.wsServer = this.ws(this.httpServer);
  },

  close: function() {
    this.telnets.map(function(telnet) {
      if (telnet)
        telnet.destroy();
    });
    this.telnets = [];
    this.socketIds = 0;
    var _this = this;
    _this.wsServer ? _this.wsServer.close(function() {
      _this.httpServer ? _this.httpServer.close(function() {
        _this.wsServer = null;
        _this.httpServer = null;
      }) : '';
    }) : '';
  },

  log: function(str) {
    if (str) {
      this.logger.external ? this.logger.external(str) : '';
      this.logger.textContent += str + '\n';
    }
    return this.logger.textContent;
  },

  getVersion: function() {
    return this.mod['manifest'].version;
  },

  cache: function(type, charset, callback) {
    this.mod['charset'][type + 'Cache'](
      charset,
      callback,
      this.mod['iconv'][(type == 'u2a') ? 'encode' : 'decode']
    );
  },

  applySetting: function(settings) {
    // To be override
  },

  clipboard: function(callback, str) {
    var clipboard = this.mod['clipboard'];
    if (typeof(str) != 'undefined')
      clipboard.copy(str, callback);
    else
      clipboard.paste(callback);
  },

  serve: function(res, url, str) {
    if (typeof(str) != 'undefined') {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': str.length
      });
      res.end(str, 'binary');
      this.log('HTTP GET ' + url);
      return;
    }

    this.log('Served ' + url);

    var extensionTypes = {
      'css': 'text/css',
      'html': 'text/html',
      'htm': 'text/html',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'js': 'text/javascript',
      'png': 'image/png',
      'svg': 'image/svg+xml',
      'txt': 'text/plain'
    };

    var dirname = (typeof(__dirname) == 'undefined') ? '..' : __dirname + '/..';
    this.mod['fs'].readFile(dirname + url.split('?')[0], function(err, data) {
      if (err) {
        res.writeHead(404, {
          'Content-Type': 'text/plain',
          'Content-Length': 0
        });
        res.end();
        return;
      }

      var extension = (url.indexOf('.') != -1) ?
        url.split('.')[1].split('?')[0] : 'txt';
      res.writeHead(200, {
        'Content-Type': extensionTypes[extension] || 'text/plain',
        'Content-Length': data.byteLength
      });
      res.end(data);
    });
  },

  http: function(port, host) {
    var _this = this;
    return this.mod['http'].createServer(function(req, res) {
      var url = req.url;
      var path = url.split('?')[0];
      var search = url.replace(path, '');
      if (path.substr(-1) == '/')
        url = path + 'index.htm' + search;

      if (url == '/version') {
        _this.serve(res, url, _this.getVersion());
      } else if (url.indexOf('/charset/a2u.tab?charset=') == 0) {
        _this.cache('a2u', url.substr(25), function(table) {
          _this.serve(res, url, table);
        });
      } else if (url.indexOf('/charset/u2a.tab?charset=') == 0) {
        _this.cache('u2a', url.substr(25), function(table) {
          _this.serve(res, url, table);
        });
      } else if (url.indexOf('/status?setting=') == 0) {
        // Read or write settings from remote pages
        _this.applySetting(decodeURIComponent(url.substr(16)));
        _this.serve(res, url, _this.log());
      } else if (url.indexOf('/server') == 0) {
        // For remote control
        _this.serve(res, '/httpd/ctrl_remote' + url.substr(7));
      } else {
        // Serve the pages of this chrome application.
        _this.serve(res, '/public_html' + url);
      }
      return true;
    }).listen(port, host);
  },

  ws: function(httpServer) {
    var _this = this;
    var wsServer = new this.mod['wsServer']({
      clientTracking: true,
      server: httpServer
    });
    wsServer.on('connection', function(ws) {
      ws.binaryType = 'arraybuffer';
      var socketId = _this.socketIds++;
      var uri = 'ptt.cc:23';
      _this.log('WebSocket client #' + socketId + ' connected');
      ws.on('message', function(data) {
        var output = function(act, con) {
          return con ? (act + con) : act;
        };
        if (typeof(data) == 'object') {
          data = String.fromCharCode.apply(null, new Uint8Array(data));
          output = function(act, con) {
            return new Uint8Array(Array.prototype.map.call(
              act + (con ? String.fromCharCode.apply(null, con) : ''),
              function(x) {
                return x.charCodeAt(0);
              }
            )).buffer;
          };
        }
        var action = data.substr(0, 3);
        var content = data.substr(3);
        switch (action) {
          case 'con':
            uri = content;
            var hostPort = uri.split(':');
            var telnet = new _this.mod['netSocket']();
            telnet.connect(parseInt(hostPort[1]), hostPort[0], function() {
              ws.send(output('con'));
            });
            telnet.on('data', function(data) {
              ws.send(output('dat', data));
            });
            telnet.on('close', function() {
              if (ws.readyState > 1)
                return;
              ws.send(output('dis'));
            });
            telnet.on('error', function() {
              if (ws.readyState > 1)
                return;
              ws.send(output('dis'));
            });
            _this.telnets[socketId] = telnet;
            _this.log('Connect to ' + uri + ' by #' + socketId);
            break;
          case 'dat':
            _this.telnets[socketId].write(content, 'binary');
            break;
          case 'dis':
            var telnet = _this.telnets[socketId];
            _this.log('Disconnect from ' + uri + ' by #' + socketId);
            telnet.destroy();
            _this.telnets[socketId] = null;
            break;
          case 'cop':
            _this.clipboard(function() {
              ws.send(output('cop'));
            }, decodeURIComponent(escape(content)));
            break;
          case 'pas':
            _this.clipboard(function(err, str) {
              if (err)
                return;
              ws.send(output('pas' + unescape(encodeURIComponent(str))));
            });
            break;
          default:
        }
      });
      ws.on('close', function() {
        _this.log('WebSocket client #' + socketId + ' disconnected');
        if (_this.telnets[socketId]) {
          _this.telnets[socketId].destroy();
          _this.telnets[socketId] = null;
        }
      });
    });
    return wsServer;
  }
};

/*
if (typeof(module) == 'object') { // in Node.js environment
  module.exports = Server;
}
*/

if (typeof(process) != 'undefined') { // in Node.js environment
  // Usage:
  //   Interactive mode:
  //     commands:
  //       start [port | hostPort]: Start the servers
  //       stop: Stop the servers
  //       log: Show log on the screen (stdout)
  //       exit: Close this program
  //   Service mode:
  //     commands for script:
  //       echo start 127.0.0.1:8080 | node nodeServer >> log.txt (Windows)
  //     Parameters of start are the same as those of interactive mode
  //     The log will be save to log.txt

  var server = null;

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function(chunk) {
    var cmds = chunk.replace('\r\n', '\n').split('\n')[0].split(' ');
    switch (cmds[0]) {
      case 'start':
        server = new Server(cmds[1]);
        break;
      case 'stop':
        server.close();
        server = null;
        break;
      case 'log':
        process.stdout.write(server ? server.log() : '');
        break;
      case 'exit':
        process.exit();
        break;
      default:
        process.stdout.write(`Unknown command: ${chunk}`);
    }
  });

  // Show log to stdout after stdin ends
  process.stdin.on('end', function() {
    if (!server)
      return;
    process.stdout.write(server.log());
    server.logger.external = function(str) {
      process.stdout.write(str + '\n');
    };
  });

  // For debugging
  process.on('exit', function(code) {
    process.stdout.write('About to exit with code: ' + code + '\n');
  });
} else { // in Chrome apps environment
  var require = function(module) {
    switch (module) {
      case '../manifest.json':
        return chrome.runtime.getManifest();
      case './charset/charset.js':
        return window;
      case 'iconv-lite':
        return {};
      case 'copy-paste-win32fix':
        return {
          copy: function(str, callback) {
            callback(systemClipboard(str));
          },
          paste: function(callback) {
            callback(null, systemClipboard());
          }
        };
      case 'ws':
        return {
          Server: http.WebSocketServer
        };
      case 'fs':
        return {
          readFile: xhrReadFile
        };
      case 'http':
        return {
          createServer: function(requestListener) {
            return new http.Server(requestListener);
          }
        };
      case 'net':
        return {
          Socket: nodeSocket
        };
      default:
    }
  };

  var systemClipboard = function(text) {
    var sandbox = document.createElement("textarea");
    sandbox.style = "position:absolute; left: -100px;";
    document.getElementById("logger").parentNode.appendChild(sandbox);
    if (text) { // copy string to system clipboard
      sandbox.value = text;
      sandbox.select();
      document.execCommand("copy");
      sandbox.parentNode.removeChild(sandbox);
    } else { // get string from system clipboard
      sandbox.select();
      document.execCommand("paste");
      text = sandbox.value;
      sandbox.parentNode.removeChild(sandbox);
      return text;
    }
  };

  var xhrReadFile = function(file, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onloadend = function() {
      callback(xhr.status != 200, this.response);
    };
    xhr.open('GET', file, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  };
}

