chrome.app.runtime.onLaunched.addListener(function(intentData) {
    var server = chrome.app.window.get('server');
    if(server)
        return server.show(true);

    chrome.storage.local.get('port', function(data) {
        var url = 'index.html';
        var hidden = false;
        if(data && data.port) {
            url += '#' + data.port;
            hidden = true;
        }

        chrome.app.window.create(url, {
            id: 'server',
            hidden : hidden,
            bounds: {
                width: 500,
                height: 640
            }
        }, function(server) {
            if(hidden)
                server.hide();
        });
    });
});
