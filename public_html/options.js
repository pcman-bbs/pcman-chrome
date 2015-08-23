// Process the operations of prefwindow

// get i18n strings for UI
function getMsg() {
    // All the contents within label and option with className are overridden
    var writeMsg = function() {
        for(var i=0; i<arguments.length; ++i) {
            var elems = document.getElementsByTagName(arguments[i]);
            for(var j=0; j<elems.length; ++j) {
                var textContent = elems[j].textContent;
                if(textContent.charAt(0) == '&')
                    elems[j].textContent = msg(textContent.slice(1,-1));
            }
        }
    };
    writeMsg('label', 'option', 'header', 'title');
    var downloads = document.getElementsByTagName('a');
    for(var i=0; i<downloads.length; ++i) {
        var href = downloads[i].getAttribute('href');
        if(href.charAt(0) == '&')
            downloads[i].setAttribute('href', msg(href.slice(1,-1)));
    }
    getVersion(function(ver) {
        var versions = document.getElementsByClassName('version');
        for(var i=0; i<versions.length; ++i)
            versions[i].textContent = '' + ver;
    });
}

// get version info for ABOUT page
function getVersion(callback) {
    var req = new XMLHttpRequest();
    req.open('GET', '/version', true);
    req.onreadystatechange = function(event) {
        if(req.readyState != 4 || req.status != 200)
            return;
        callback(req.response);
    };
    req.send();
}

// initiate tab switching
function iniTabs(origin) {
    var tabheaders = origin.getElementsByTagName('header');
    for(var i=0; i<tabheaders.length; ++i) {
        if(!tabheaders[i].parentNode.className)
            tabheaders[i].parentNode.className = 'inactive';
        tabheaders[i].onclick = function(event) {
            var tab = event.target.parentNode;
            for(var j=0; j<tab.parentNode.childNodes.length; ++j) {
                var node = tab.parentNode.childNodes[j];
                if(node.tagName && (node.tagName.toLowerCase() == 'section'))
                    node.className = 'inactive';
            }
            tab.className = 'active';
        };
    }
}

// To avoid duplicate id after cloneNode
function modifyAttr(orgTabs, fromGrp, toGrp) {
    var modifyAttribute = function(parentNode, tag, attr, fromGrp, toGrp) {
        var nodes = parentNode.getElementsByTagName(tag);
        for(var i=0; i<nodes.length; ++i) {
            var attribute = nodes[i].getAttribute(attr);
            if(!attribute) continue;
            nodes[i].setAttribute(
                attr,
                attribute.replace(new RegExp(fromGrp+'$'),toGrp)
            );
        }
    };
    modifyAttribute(orgTabs, 'label', 'for', fromGrp, toGrp);
    modifyAttribute(orgTabs, 'select', 'id', fromGrp, toGrp);
    modifyAttribute(orgTabs, 'datalist', 'id', fromGrp, toGrp);
    modifyAttribute(orgTabs, 'input', 'id', fromGrp, toGrp);
    modifyAttribute(orgTabs, 'input', 'list', fromGrp, toGrp);
}

// create, override, or remove a HTML Tab group
function cloneTabs(toGroup, name) {
    var siteList = document.getElementById('siteList');
    if(!toGroup)
        toGroup = siteList.length;
    var newTabs = document.getElementById('_'+toGroup);
    if(newTabs) {
        newTabs.parentNode.removeChild(newTabs);
        var option = siteList.options[toGroup];
        option.parentNode.removeChild(option);
    }
    if(newTabs && !name) { // remove toGroup only, resequence the Tabs
        for(var i=toGroup; i<siteList.length; ++i) {
            var oldTabs = document.getElementById('_'+(i+1));
            modifyAttr(oldTabs, i+1, i);
            oldTabs.id = '_' + i;
        }
    }
    if(!name)
        return; // remove toGroup only

    var orgTabs = document.getElementById('_0');

    modifyAttr(orgTabs, 0, toGroup);

    newTabs = orgTabs.cloneNode(true);
    newTabs.id = '_'+toGroup;
    newTabs.className = 'tabs hide';

    modifyAttr(orgTabs, toGroup, 0);

    orgTabs.parentNode.insertBefore(
        newTabs,
        document.getElementById('_'+(toGroup+1))
    );
    var option = document.createElement("option");
    option.textContent = name;
    siteList.insertBefore(
        option,
        (toGroup < siteList.length) ? siteList.options[toGroup] : null
    );
    iniTabs(newTabs);
}

// find the corresponding group index of the url
function findTabs(href) {
    if(!href) return 0;
    var options = new PCManOptions();
    url = options.getGroupNameByUrl(href);
    var siteList = document.getElementById('siteList');
    // search from the newest group
    for(var i=siteList.options.length-1; i>=0; --i) {
        if(url == siteList.options[i].textContent)
            return i;
    }
    return 0; // Not found
}

// set values of HTML elements
function setValues(recentGroup_, targetGroup) {
    if(!(recentGroup_>-1)) // null, undefined, or negative number
        recentGroup_ = -1;
    if(!(targetGroup>-1)) // null, undefined, or negative number
        targetGroup = recentGroup_;
    var prefs = storage[recentGroup_+1];
    for(var key in prefs) {
        var elem = document.getElementById(key+'_'+targetGroup);
        if(!elem)
            continue;
        if(typeof(prefs[key]) == 'boolean')
            elem.checked = prefs[key];
        else
            elem.value = prefs[key];
    }
}

// get values of HTML elements
function getValues(recentGroup_) {
    var prefs = storage[0];
    var output = {};
    for(var key in prefs) {
        var elem = document.getElementById(key+'_'+recentGroup_);
        if(!elem)
            continue;
        if(typeof(prefs[key]) == 'boolean')
            output[key] = elem.checked;
        else if(typeof(prefs[key]) == 'number')
            output[key] = parseFloat(elem.value);
        else
            output[key] = elem.value;
    }
    return output;
}

// build Tabs for each site
function buildTabs(href) {
    var groupNames = [];
    for(var i=1; i<storage.length; ++i)
        groupNames.push(storage[i].Name);
    iniTabs(document.getElementById('_0'));
    setValues(0);
    for(var j=1; j<groupNames.length; ++j) {
        cloneTabs(j, groupNames[j]);
        setValues(j);
    }
    document.getElementById('siteList').selectedIndex = findTabs(href);
    siteChanged();
}

// Initialize the prefwindow
function load() {
    var options = new PCManOptions();
    storage = options.load();
    recentGroup = 0;
    buildTabs(getSearch('url'));
}

// Change the content of prefwindow to that of another group
function siteChanged() {
    document.getElementById('_'+recentGroup).className = 'tabs hide';
    recentGroup = document.getElementById('siteList').selectedIndex;
    document.getElementById('_'+recentGroup).className = 'tabs';
}

// Save all changes to file
function save() {
    var siteList = document.getElementById('siteList');
    var data = [];
    for(i=0; i<siteList.length; ++i) {
        var sitepref = getValues(i);
        if(i == 0)
            sitepref.Name = storage[0].Name;
        else
            sitepref.Name = siteList.options[i].textContent;
        data.push(sitepref);
    }
    var options = new PCManOptions();
    options.save(data);
    storage = options.load();
}

// Create a new site pref
function addSite(isCopy) {
    var newHref = {value: getSearch('url')};
    newHref.value = prompt(msg("options_address"), newHref.value);
    if(!newHref.value) // cancel is pressed (null) or empty string
        return;
    var newGroup = findTabs(newHref.value);
    var siteList = document.getElementById('siteList');
    if(newGroup > 0) { // the site pref is existed, go there
        siteList.selectedIndex = newGroup;
        siteChanged();
        return;
    }
    // Create prefs and set initial value
    cloneTabs(null, newHref.value);
    setValues(isCopy ? recentGroup : null, siteList.length-1);
    siteList.selectedIndex = siteList.length-1;
    siteChanged();
}

// Delete an existed site pref
function delSite() {
    if(recentGroup == 0) {
        setValues(null, 0); // reset default site
        return;
    }
    cloneTabs(recentGroup, '');
    document.getElementById('siteList').selectedIndex = 0;
    recentGroup = 0; // for siteChanged(), because previous site was removed
    siteChanged();
}

window.onload = function(event) {
    getMsg();
    load();
};

document.getElementById('siteList').onchange = function(event) {
    siteChanged();
};
document.getElementById('addSite').onclick = function(event) {
    addSite();
};
document.getElementById('delSite').onclick = function(event) {
    delSite();
};
document.getElementById('submit').onclick = function(event) {
    save();
};

