var ContextMenu = (function() {

function ContextMenu(listener, elem) {
    this.listener = listener;
    this.elem = elem;
    this.items = {};
    this.shown = false;
    this.initial();
}

ContextMenu.prototype.initial = function() {
    var items = this.elem.childNodes;
    for(var i = 0; i < items.length; i++) {
        var item = items[i];
        if(!item.className)
            continue;
        if(item.className.indexOf('menuitem') == 0)
            this.items[item.id] = new MenuItem(this, item);
        else if(item.className.indexOf('submenu') == 0)
            this.items[item.id] = new SubMenu(this, item);
    }
    if(this.listener instanceof SubMenu)
        return;

    var _this = this;
    this.observer = function(event) {
        event.preventDefault();
        event.stopPropagation();
        var x = event.pageX, y = event.pageY;
        _this.show({
            top: y, bottom: y, left: x, right: x, width: 0, height: 0
        });
        if(_this.oncontextmenu)
            _this.oncontextmenu(event);
    };
};

ContextMenu.prototype.show = function(parentRect) {
    if(this.listener instanceof SubMenu)
        this.listener.elem.className = 'submenu_opened';
    this.shown = true;

    // Attributes of elements within invisible HTML elements won't be updated
    this.hide(true, this); // hide its submenus and all collateral submenus

    var rect = this.elem.getBoundingClientRect();

    if(parentRect.top + rect.height <= document.body.clientHeight)
        this.elem.style.top = parentRect.top + 'px';
    else if(parentRect.bottom - rect.height >= 0)
        this.elem.style.top = (parentRect.bottom - rect.height) + 'px';
    else if(rect.height <= document.body.clientHeight)
        this.elem.style.top = (document.body.clientHeight - rect.height) + 'px';
    else
        this.elem.style.top = '0px';

    // top menu's parentRect.width should be 0 while sub menu's should be > 0
    if(parentRect.right + rect.width <= document.body.clientWidth)
        this.elem.style.left = parentRect.right + 'px';
    else if(!parentRect.width && rect.width <= document.body.clientWidth)
        this.elem.style.left = (document.body.clientWidth - rect.width) + 'px';
    else if(parentRect.width && parentRect.left - rect.width >= 0)
        this.elem.style.left = (parentRect.left - rect.width) + 'px';
    else
        this.elem.style.left = '0px';
};

ContextMenu.prototype.onclick = function(x, y) {
    if(!this.shown)
        return false;
    if(x < 0 || y < 0)
        return this.hide();
    var rect = this.elem.getBoundingClientRect();
    if(x > rect.left && x < rect.right && y > rect.top && y < rect.bottom)
        return true; // click on this menu, let the menuitem handle this event
    for(var itemId in this.items) {
        var item = this.items[itemId];
        if(item instanceof SubMenu) {
            if(item.menu.onclick(x, y))
                return true; // click on its submenu
        }
    }
    if(!(this.listener instanceof SubMenu)) // top menu
        this.hide(); // collapse context menu
    return false; // click outside of this menu
};

ContextMenu.prototype.hide = function(propagate, exclude) {
    if(!this.shown)
        return;
    for(var itemId in this.items) {
        var item = this.items[itemId];
        if(item instanceof SubMenu && item.menu !== exclude)
            item.menu.hide();
    }
    if(!exclude) {
        this.shown = false;
        this.elem.style.top = '-1000px';
        this.elem.style.left = '-1000px';
        if(this.listener instanceof SubMenu)
            this.listener.elem.className = 'submenu';
    }
    if(propagate && this.listener instanceof SubMenu) {
        this.listener.parentMenu.hide(true, exclude ? this : null);
    }
};

function SubMenu(parentMenu, elem) {
    this.parentMenu = parentMenu;
    this.elem = elem;
    if(msg(elem.id))
        elem.appendChild(document.createTextNode(msg(elem.id)));
    this.disabled = false;
    this.menu = new ContextMenu(this, elem.firstChild);
    this.timer = null;
    this.setEventListener();
}

SubMenu.prototype.setEventListener = function() {
    var _this = this;
    this.elem.onmouseover = function(event) {
        _this.timer = setTimeout(function() {
            _this.timer = null;
            if(_this.disabled)
                return;
            if(_this.parentMenu.shown)
                _this.menu.show(_this.elem.getBoundingClientRect());
        }, 500);
    };
    this.elem.onmouseout = function(event) {
        if(!_this.timer)
            return;
        clearTimeout(_this.timer);
        _this.timer = null;
    };
    this.elem.onclick = function(event) {
        if(_this.timer) {
            clearTimeout(_this.timer);
            _this.timer = null;
        }
        if(_this.disabled)
            return;
        _this.menu.show(_this.elem.getBoundingClientRect());
    };
};

SubMenu.prototype.disable = function(setting) {
    if(setting == this.disabled)
        return;
    if(setting) {
        this.elem.setAttribute('disabled', 'true');
    } else {
        this.elem.removeAttribute('disabled');
    }
    this.disabled = setting;
};

function MenuItem(parentMenu, elem) {
    this.parentMenu = parentMenu;
    this.elem = elem;
    if(msg(elem.id))
        elem.textContent = msg(elem.id);
    this.disabled = false;
    this.action = function() {};
    this.timer = null;
    this.setEventListener();
}

MenuItem.prototype.setEventListener = function() {
    var _this = this;
    this.elem.onmouseover = function(event) {
        _this.timer = setTimeout(function() {
            _this.timer = null;
            if(_this.disabled)
                return;
            _this.parentMenu.hide(true, _this.parentMenu); // only show the menu
        }, 500);
    };
    this.elem.onmouseout = function(event) {
        if(!_this.timer)
            return;
        clearTimeout(_this.timer);
        _this.timer = null;
    };
    this.elem.onclick = function(event) {
        if(_this.disabled)
            return;
        // collapse context menu, but it doesn't work on invisible HTML elements
        _this.parentMenu.hide(true);
        _this.action();
    };
};

MenuItem.prototype.disable = function(setting) {
    if(setting == this.disabled)
        return;
    if(setting) {
        this.elem.setAttribute('disabled', 'true');
    } else {
        this.elem.removeAttribute('disabled');
    }
    this.disabled = setting;
};

return ContextMenu; })();
