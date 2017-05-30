// UI for web & websocket server and telnet client

'use strict';

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

  start.onclick = function() {
    server = new Server(hosts.value + ':' + port.value);
    server.logger.external = logToScreen;
    server.applySetting = applySetting;
    stop.disabled = false;
    start.disabled = true;
  };

  stop.onclick = function() {
    server.close();
    server = null;
    stop.disabled = true;
    start.disabled = false;
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

