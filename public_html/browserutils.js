function dump(str) {
    console.log(str);
}

function msg(str) {
    switch(navigator.language) {
    case 'zh-TW':
        if(locale_zh_TW && locale_zh_TW[str])
            return locale_zh_TW[str].message;
    default:
        if(locale_en_US && locale_en_US[str])
            return locale_en_US[str].message;
    }
    return '';
}

function getSearch(search) {
    var parameters = {};
    decodeURIComponent(window.location.search).split(/[?|&]/).map(function(s) {
        if(s.indexOf('=') > 0)
            parameters[s.split('=')[0]] = s.split('=')[1];
    });
    return (search ? parameters[search] : parameters);
}

function openURI(uri, activate, callback) {
    if(activate) {
        window.open(uri, '_blank');
    } else if(isBrowser(['Chrome', 'Safari'])) {
        var a = document.createElement("a");
        a.href = uri;
        var evt = document.createEvent("MouseEvents");
        //the tenth parameter of initMouseEvent sets ctrl key
        evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
                                    true, false, false, false, 0, null);
        a.dispatchEvent(evt);
    } else { // FIXME: open background tab in FX and IE
        window.open(uri, '_blank');
    }
}

function isBrowser(lists) {
    var checkBrowser = function() {
        if(navigator.userAgent.indexOf('Trident') >=0)
            return 'IE';
        else if(navigator.userAgent.indexOf('Firefox') >=0)
            return 'Firefox';
        else if(navigator.userAgent.indexOf('Chrome') >=0)
            return 'Chrome';
        else if(navigator.userAgent.indexOf('Safari') >=0)
            return 'Safari';
        else if(navigator.userAgent.indexOf('Presto') >=0)
            return 'Opera'; // old opera version
        else
            return null;
    };

    for(var i=0; i<lists.length; i++) {
        if(lists[i] == checkBrowser())
            return true;
    }
    return false;
}
