function launch(launchData) {
    var server = chrome.app.window.get('server');
    if (server) {
        return server.show(true);
    }

    chrome.storage.local.get('port', function(data) {
        var url = 'httpd/index.htm';
        var hidden = false;
        if (data && data.port) {
            url += '#' + data.port;
            hidden = true;
        }

        chrome.app.window.create(url, {
            id: 'server',
            hidden: hidden,
            bounds: {
                width: 500,
                height: 640
            }
        }, function(server) {
            if (hidden)
                server.hide();
        });
    });
}

chrome.app.runtime.onLaunched.addListener(launch);

chrome.runtime.onMessageExternal.addListener(function msg(request, sender, sendResponse) {
    var server = chrome.app.window.get('server');
    if (!server) { // httpd is not initialized
        launch();
        setTimeout(function() {
            msg(request, sender, sendResponse);
        }, 1000);
        return true; // wait for async function calls
    }
    var elem = function(id) {
        return server.contentWindow.document.getElementById(id);
    };
    if (!elem('start').disabled && elem('stop').disabled) {
        sendResponse({
            url: ''
        }); // need manually starting httpd
        return;
    }
    var port = parseInt(elem('port').value);
    var search = '';
    if (request.url.indexOf('?') != -1)
        search = request.url.substr(request.url.indexOf('?'));
    else if (request.url.indexOf('#') != -1)
        search = request.url.substr(request.url.indexOf('#'));
    sendResponse({
        url: 'http://localhost:' + port + '/' + search
    });
});

