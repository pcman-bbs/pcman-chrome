/* 
 * Web and websocket server is modified from Http WebSocket Server of Google Chrome Apps:
 * https://github.com/GoogleChrome/chrome-app-samples/tree/master/websocket-server
 * the document root is modified to /public_html within this app
 * the directory index page is set as index.htm only
 */

onload = function() {
  var start = document.getElementById("start");
  var stop = document.getElementById("stop");
  var hosts = document.getElementById("hosts");
  var port = document.getElementById("port");
  var directory = document.getElementById("directory");
  var logger = document.getElementById("logger");

  start.disabled = false;
  stop.disabled = true;
  directory.disabled = true;

  var logToScreen = function(log) {
    logger.textContent += log + "\n";
  }

  var applySetting = function(setting) {
    if (!setting) return;
    var settings = JSON.parse(setting);
    var win = chrome.app.window.current();
    settings.hidden ? win.hide() : win.show();
    var autoStart = document.getElementById('autoStart');
    if (settings.setDefault && (settings.hidden != autoStart.checked))
      autoStart.click(); // Also trigger onchange event
  };

  var server = null;
  var wsServer = null;
  var agent = null;

  start.onclick = function() {
    server = new http.Server();
    wsServer = new http.WebSocketServer(server);
    server.listen(parseInt(port.value), hosts.value);

    server.addEventListener("request", function(req) {
      var url = req.headers.url;
      var path = url;
      var search = '';
      if (url.indexOf("?") != -1) {
        path = url.substr(0, url.indexOf("?"));
        search = url.substr(url.indexOf("?"));
      }
      if (path.substr(-1) == "/")
        url = path + "index.htm" + search;

      var serveStr = function(url, str) {
        req.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': str.length
        });
        req.end(str);
        logToScreen("HTTP GET " + url);
      };

      if (url == "/version") {
        serveStr(url, chrome.runtime.getManifest().version);
      } else if (url.indexOf("/charset/a2u.tab?charset=") == 0) {
        a2uCache(url.substr(25), function(table) {
          serveStr(url, table);
        });
      } else if (url.indexOf("/charset/u2a.tab?charset=") == 0) {
        u2aCache(url.substr(25), function(table) {
          serveStr(url, table);
        });
      } else if (url.indexOf("/status?setting=") == 0) {
        // Read or write settings from remote pages
        applySetting(decodeURIComponent(url.substr(16)));
        serveStr(url, logger.textContent);
      } else if (url.indexOf("/server") == 0) {
        // For remote control
        req.serveUrl("/httpd/ctrl_remote" + url.substr(7));
      } else {
        // Serve the pages of this chrome application.
        req.serveUrl("/public_html" + url);
      }
      return true;
    });

    server.addEventListener("log", function(uri) {
      logToScreen("HTTP GET " + uri.substr(12));
      return true;
    });

    agent = new telnetAgent();

    wsServer.addEventListener("request", function(req) {
      var socket = req.accept();
      logToScreen("WebSocket client #" + socket.socketId_ + " connected");
      socket.binaryType = 'arraybuffer';

      agent.callback[socket.socketId_] = function(msg) {
        switch (msg.action) {
          case 'connected':
            socket.send('con');
            break;
          case 'data':
            socket.send('dat' + msg.content);
            break;
          case 'disconnected':
            socket.send('dis');
            break;
          default:
        }
      };

      socket.addEventListener('message', function(event) {
        var action = event.data.substr(0, 3);
        var content = event.data.substr(3);
        switch (action) {
          case 'con':
            var uri = content.split(":");
            agent.create(socket.socketId_, uri[0], parseInt(uri[1]));
            socket.hostPort = content;
            logToScreen("Connect to " + socket.hostPort +
              " by #" + socket.socketId_);
            break;
          case 'dat':
            agent.send(socket.socketId_, content);
            break;
          case 'dis':
            agent.close(socket.socketId_);
            logToScreen("Disconnect from " + socket.hostPort +
              " by #" + socket.socketId_);
            break;
          case "cop":
            systemClipboard(decodeURIComponent(escape(content)));
            socket.send('cop');
            break;
          case "pas":
            socket.send('pas' + unescape(encodeURIComponent(systemClipboard())));
            break;
          default:
        }
      });

      socket.addEventListener('close', function() {
        logToScreen("WebSocket client #" + socket.socketId_ + " disconnected");
        agent.close(socket.socketId_);
      });

      return true;
    });

    stop.disabled = false;
    start.disabled = true;
  };

  stop.onclick = function() {
    agent.close();

    wsServer.close();

    setTimeout(function() { // wait for closing all websocket properly
      stop.disabled = true;
      start.disabled = false;

      server.close();
      agent = null;
      wsServer = null;
      server = null;
    }, 100);
  };

  document.getElementById('hide').onclick = function(event) {
    chrome.app.window.current().hide();
    event.target.blur();
  };

  var setPref = function(event) {
    if (document.getElementById('autoStart').checked) {
      chrome.storage.local.set({
        port: port.value
      }, function() {});
    } else {
      chrome.storage.local.remove('port', function() {});
    }
  };
  document.getElementById('autoStart').onchange = setPref;
  port.onchange = setPref;

  if (document.location.hash.substr(1)) {
    port.value = document.location.hash.substr(1);
    document.getElementById('autoStart').checked = true;
    start.click();
  }

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

  // no equivalent new api
  /*chrome.socket.getNetworkList(function(interfaces) {
    for(var i in interfaces) {
      var interface = interfaces[i];
      var opt = document.createElement("option");
      opt.value = interface.address;
      opt.innerText = interface.name + " - " + interface.address;
      hosts.appendChild(opt);
    }
  });*/
};

