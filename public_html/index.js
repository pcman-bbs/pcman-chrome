var pcman=null;
function setup() {
//    var url=document.location.host;
//    document.location.hash = '#' + getBGVar('url');
    pcman=new PCMan();
    var url = document.location.hash.substr(1);
    if(!url) url = 'ptt.cc';
    pcman.connect(url);
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

