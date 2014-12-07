// All the content within label and option with id will be overridden
function getMsg() {
    var labels = document.getElementsByTagName('label');
    for(var i=0; i<labels.length; ++i) {
        if(labels[i].id && labels[i].id.charAt(0) != '_')
            labels[i].textContent = msg(labels[i].id);
    }
    // label cannot be inserted in <option></option>
    var options = document.getElementsByTagName('option');
    for(var j=0; j<options.length; ++j) {
        if(options[j].id && options[j].id.charAt(0) != '_')
            options[j].textContent = msg(options[j].id);
    }
    // label within <header></header> make the change of tabs buggy
    var headers = document.getElementsByTagName('header');
    for(var k=0; k<headers.length; ++k) {
        if(headers[k].id && headers[k].id.charAt(0) != '_')
            headers[k].textContent = msg(headers[k].id);
    }
    document.title = msg("options_pcmanoptions");
    document.getElementById('appName').textContent = msg('appName');
    var req = new XMLHttpRequest();
    req.open('GET', '/version', true);
    req.onreadystatechange = function(event) {
        if(req.readyState != 4 || req.status != 200)
            return;
        document.getElementById('version').textContent = '' + req.response;
    };
    req.send();
}

// Safari doesn't support native HTML5 datalist yet
// It is an extremely simple implement of datalist
// here we must replace <datalist> by <select>
// Only visible elements works as this function is called
// the <select> element must be placed right after the <input>
// each datalist can only correspond to one input
function setDatalist() {
    var inputs = document.getElementsByTagName('input');
    for(var i=0; i<inputs.length; ++i) {
        var list = inputs[i].getAttribute('list');
        if(!list)
            continue;
        var datalist = document.getElementById(list);
        var input = inputs[i];
        datalist.style.position = 'absolute';
        datalist.style.border = '0px';
        datalist.style.margin = '0px';
        var setOption = function(datalist, text) {
            if(!text && datalist.inserted) {
                datalist.remove(0);
                datalist.inserted = false;            
            } else if(text && !datalist.inserted) {
                datalist.add(document.createElement('option'), datalist[0]);
                datalist.inserted = true;
                datalist.selectedIndex = 0;
            }
            if(datalist.inserted)
                datalist.options[0].textContent = text;
        }
        var findOption = function(datalist, text) {
            for(var i = 0; i < datalist.length; i++) {
                if(datalist.options[i].value == text)
                    return i;
            }
            return -1;
        }
        datalist.selectedIndex = findOption(datalist, input.value);
        if(datalist.selectedIndex == -1)
            setOption(datalist, input.value);
        input.style.position = 'absolute';
        // only visible element has clientWidth
        if(datalist.clientWidth) {
            input.style.width = (datalist.clientWidth-20) + 'px';
            input.style.height = (datalist.clientHeight-6) + 'px';
        }
        datalist.input = input;
        input.datalist = datalist;
        input.oninput = function(event) {
            event.target.datalist.selectedIndex = findOption(event.target.datalist, event.target.value);
            if(event.target.datalist.selectedIndex == -1)
                setOption(event.target.datalist, event.target.value);
            else
                setOption(event.target.datalist);

            if(!event.target.value)
                event.target.datalist.selectedIndex = -1;
        }
        datalist.onchange = function(event) {
            setOption(event.target);
            event.target.input.value = event.target.value;
        }
    }
}

function iniTabs() {
    var tabheaders = document.getElementsByTagName('header');
    for(var i=0; i<tabheaders.length; ++i) {
        if(!tabheaders[i].parentNode.className)
            tabheaders[i].parentNode.className = 'inactive';
        tabheaders[i].onclick = function(event) {
            var tab = event.target.parentNode;
            for(var j=0; j<tab.parentNode.childNodes.length; ++j)
                tab.parentNode.childNodes[j].className = 'inactive';
            tab.className = 'active';
        };
    }
}

function initial() {
    getMsg();

    load();

    setDatalist();
    iniTabs();
}

window.onload = initial;

document.getElementById('siteList').onchange = function(event) {
    siteChanged();
};
document.getElementById('addSite').onclick = function(event) {
    addSite();
};
document.getElementById('delSite').onclick = function(event) {
    delSite();
};
document.getElementById('download').onclick = function(event) {
    openURI(msg('options_downloadurl'), true);
};
document.getElementById('homepage').onclick = function(event) {
    openURI('http://code.google.com/p/pcmanfx/', true);
};
document.getElementById('reportbug').onclick = function(event) {
    openURI('http://code.google.com/p/pcmanfx/issues/list', true);
};
document.getElementById('submit').onclick = function(event) {
    save(true);
};

