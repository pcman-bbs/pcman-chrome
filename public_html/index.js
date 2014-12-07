var pcman=null;
function setup() {
//    var url=document.location.host;
//    document.location.hash = '#' + getBGVar('url');
    pcman=new PCMan();
    var url = document.location.hash.substr(1);
    if(!url) url = 'ptt.cc';
    // Load charset converter table before connect
    if(isBrowser(['Chrome', 'Safari'])) {
        pcman.connect(url);
    } else {
        b2uTab.init(function(b2ustatus) {
            u2bTab.init(function(u2bstatus) {
                pcman.connect(url);
            });
        });
    }
    document.title = url;
    document.getElementById('input_proxy').focus();
    document.addEventListener('focus', set_focus, false);
    resize();
}

function set_focus(e) { document.getElementById('input_proxy').focus(); }

function finalize() {
    pcman.close();
    pcman=null;
    document.removeEventListener('focus', set_focus, false);
}

function resize(){
    document.getElementById('topwin').style.height = window.innerHeight + 'px';
    pcman.view.onResize();
}

function eventHandler(event) {
    switch (event.type) {
    case 'mousedown':
        return pcman.view.onMouseDown(event);
    case 'mousemove':
        return pcman.view.onMouseMove(event);
    case 'mouseup':
        return pcman.view.onMouseUp(event);
    case 'click':
        return pcman.view.onClick(event);
    case 'dblclick':
        return pcman.view.onDblClick(event);
    default:
    }
}

window.onload = setup;
window.onunload = finalize;
window.onresize = resize;
window.onmousedown = set_focus;
window.onmouseup = set_focus;

var box1 = document.getElementById('box1');
box1.onmousedown = eventHandler;
box1.onmousemove = eventHandler;
box1.onmouseup = eventHandler;
box1.onclick = eventHandler;
box1.ondblclick = eventHandler;

function dump(str) {
    console.log(str);
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

