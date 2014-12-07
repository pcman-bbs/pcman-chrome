// handle some direct access to preference

function PCManOptions(callback) {
    this.setupDefault = PrefDefaults;
    this.prefsKey = "PCManOptions";
    this.storage.setListener(this);
    if(callback) {
        this.async = true;
        this.asyncLoad(callback);
    } else {
        this.async = false;
        this.load();
    }
}

PCManOptions.prototype = {
    storage: {
        setListener: function(listener) {
            this.listener = listener;
        },

        asyncGet: function(name, callback) {
            chrome.storage.local.get(name, callback);
        },

        get: function(name) {
            if(localStorage[name])
                return JSON.parse(localStorage[name]);
            return [];
        },

        set: function(name, obj) {
            if(this.listener.async) {
                var data = {};
                data[name] = obj;
                chrome.storage.local.set(data, function() {});
            } else {
                localStorage[name] = JSON.stringify(obj);
            }
        },

        addObserver: function(prefHandler, callback) {
            var prefsKey = this.listener.prefsKey;
            if(this.listener.async) {
                prefHandler.handler = function(changes, namespace) {
                    if(changes[prefsKey])
                        callback(changes[prefsKey].newValue[0]);
                };
                chrome.storage.onChanged.addListener(prefHandler.handler);
            } else {
                prefHandler.handler = function(event) {
                    // null for all localStoage is removed
                    if(event.key == prefsKey || event.key == null)
                        callback(JSON.parse(event.newValue));
                }
                addEventListener("storage", prefHandler.handler, false);
            }
        },

        removeObserver: function(prefHandler) {
            if(this.listener.async) {
                chrome.storage.onChanged.removeListener(prefHandler.handler);
            } else {
                removeEventListener("storage", prefHandler.handler, false);
            }
        }
    },

    asyncLoad: function(callback) {
        if(!this.groups)
            this.groups = [];
        var _this = this;
        this.storage.asyncGet(this.prefsKey, function(data) {
            _this.load(data[_this.prefsKey] || [{}]);
            callback(_this);
        });
    },

    load: function(data) {
        if(data) // async callback
            this.groups = data;
        else // sync
            this.groups = this.storage.get(this.prefsKey);
        // repair the default group
        if(!this.groups[0]) {
            this.copyGroup(0, null, '_override_');
        } else if(this.groups[0].Name != this.setupDefault.Name) {
            this.groups.unshift({});
            this.copyGroup(0, null, '_override_');
        }
        for(var i=this.groups.length-1; i>=0; --i) {
            // remove the empty group
            if(!this.groups[i]) {
                this.removeGroup(i);
                continue;
            }
            // repair the references
            for(var key in this.setupDefault) {
                if(typeof(this.groups[i][key]) == "undefined")
                    this.setVal(i, key, this.setupDefault[key]);
            }
        }
    },

    save: function() {
        this.storage.set(this.prefsKey, this.groups);
    },

    getGroupNames: function() {
        var groups = [];
        for(var i=0; i<this.groups.length; ++i)
            groups[i] = this.getVal(i, 'Name', this.setupDefault.Name);
        return groups;
    },

    // Determine the group index by the url
    findGroup: function(url) {
        if(!url) return 0;
        url = url.replace(/.*:\/\/([^\/]*).*/, '$1'); // Trim the protocol
        // search from the newest group
        for(var i=this.groups.length-1; i>=0; --i) {
            if(url == this.getVal(i, 'Name', null))
                return i;
        }
        return 0; // Not found
    },

    getVal: function(group, key, value) {
        if(this.groups[group] && typeof(this.groups[group][key])!='undefined') {
            if(typeof(this.setupDefault[key]) == 'number')
                return parseInt(this.groups[group][key]);
            else
                return this.groups[group][key];
        } else {
            return value;
        }
    },

    setVal: function(group, key, value) {
        if(!this.groups[group])
            this.groups[group] = {};
        this.groups[group][key] = value;
    },

    // Copy fromGroup to toGroup
    // Copy from setupDefault if fromGroup is null.
    // Add a new group if toGroup is null.
    // The name of the copied group can be set simultaneously
    // If the name is set as '_override_', use the name of fromGroup
    copyGroup: function(toGroup, fromGroup, name) {
        name = name.replace(/.*:\/\/([^\/]*).*/, '$1'); // Trim the protocol
        if(toGroup == null)
            toGroup = this.groups.length;
        if(fromGroup == null)
            var data = this.setupDefault;
        else
            var data = this.groups[fromGroup];
        for(var key in data) {
            if(key != 'Name' || name == '_override_')
                this.setVal(toGroup, key, data[key]);
            else if(name)
                this.setVal(toGroup, key, name); // key == 'Name'
        }
    },

    // Remove the group
    // For the default group, reset to the setupDefault 
    removeGroup: function(group) {
        if(group == 0)
            return this.copyGroup(0, null, '_override_');
        this.groups.splice(group,1);
    },

    // Observer for the changes of the prefs

    addObserver: function(url, prefHandler) {
        var _this = this;
        this.storage.addObserver(prefHandler, function(newValue) {
            _this.sync(url, prefHandler, newValue);
        });
    },

    removeObserver: function(prefHandler) {
        this.storage.removeObserver(prefHandler);
    },

    sync: function(url, prefHandler, newValue, isCallback) {
        var initial = (typeof(prefHandler.Name) == 'undefined');
        if(!initial && newValue) {
            this.load(newValue); // update to new prefs from the arguments
        } else if(!initial && !this.async) {
            this.load(); // read new prefs from the database
        } else if(!initial && !isCallback) {
            this.asyncLoad(function(options) {
                options.sync(url, prefHandler, null, true);
            });
            return;
        }
        var group = this.findGroup(url);
        for(var key in this.setupDefault) {
            var newVal = this.getVal(group, key, this.setupDefault[key]);
            if(newVal != prefHandler[key]) { // setting is changed
                prefHandler[key] = newVal;
                if(!initial && prefHandler.observer[key]) {
                    prefHandler.observer.handler = prefHandler.observer[key];
                    prefHandler.observer.handler(); // wrap 'this'
                }
            }
        }
    }
}

