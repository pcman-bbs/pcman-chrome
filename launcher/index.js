onload = function(e) {
    var defaultId = 'kakincoohepfppgfdfhdbjpmhbelkiho';
    var elem = function(id) {
        return document.getElementById(id);
    };
    elem('wait').style.display = 'block';
    if (typeof(chrome) == 'undefined' || !chrome.runtime) {
        elem('wait').style.display = 'none';
        elem('notGC').style.display = 'block';
        return;
    }
    var appId = localStorage.getItem('appId') || defaultId;
    elem('appId').value = appId;
    elem('appId').onchange = function(event) {
        if (event.target.value != defaultId)
            localStorage.setItem('appId', event.target.value);
        else
            localStorage.removeItem('appId')
    };
    addEventListener('storage', function(event) {
        if (event.key == 'appId')
            elem('appId').value = event.newValue || defaultId;
    });
    var request = { url: location.href };
    chrome.runtime.sendMessage(appId, request, function(response) {
        if (!response) {
            elem('wait').style.display = 'none';
            elem('notInstalled').style.display = 'block';
            return;
        }
        if (!response.url) {
            elem('wait').style.display = 'none';
            elem('manually').style.display = 'block';
            return;
        }
        location.replace(response.url);
    });
};

