onload = function() {
  document.getElementById("port").value = location.port;
  var setDefault = document.getElementById("setDefault");
  var renew = document.getElementById("renew");
  var show = document.getElementById("show");
  var hide = document.getElementById("hide");
  var logger = document.getElementById("logger");

  var setLog = function(log) {
    logger.textContent = log;
  };

  var server = function(setting, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', "/status?setting=" + encodeURIComponent(setting), true);
    req.onreadystatechange = function(event) {
      if (req.readyState != 4)
        return;
      if (req.status == 200)
        callback(req.response);
    };
    req.send();
  };

  renew.onclick = function(event) {
    server("", setLog);
  };

  show.onclick = function(event) {
    server(JSON.stringify({
      setDefault: setDefault.checked,
      hidden: false
    }), setLog);
  };

  hide.onclick = function(event) {
    server(JSON.stringify({
      setDefault: setDefault.checked,
      hidden: true
    }), setLog);
  };

  renew.click();
};
