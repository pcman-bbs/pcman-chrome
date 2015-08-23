// handle some direct access to preference

function PCManOptions() {
    this.setupDefault = PrefDefaults;
    this.prefsKey = "PCManOptions";
}

PCManOptions.prototype = {
    // wrappers for different apis in each browser
    doLoad: function() {
        return localStorage[this.prefsKey];
    },

    doSave: function(str) {
        localStorage[this.prefsKey] = str;
    },

    addObserver: function(handlerFunc) {
        var handler = {handleEvent: handlerFunc};
        addEventListener("storage", handler, false);
        return handler;
    },

    removeObserver: function(handler) {
        removeEventListener("storage", handler, false);
    },

    // get pref object from the database
    load: function() {
        var jsonData = this.doLoad();
        var data = [];
        if(jsonData)
            data = JSON.parse(jsonData);
        // reorganize the groups
        if(!Array.isArray(data) || data.length < 1)
            data = [{'Name': this.setupDefault.Name}];
        var names = {};
        for(var i=0; i<data.length; ++i) {
            if(!data[i] || typeof(data[i]) != 'object') {
                if(i==0) { // modify wrong default pref
                    data[i] = {'Name': this.setupDefault.Name};
                } else { // remove wrong sitepref
                    data.splice(i, 1);
                    --i;
                    continue;
                }
            }
            if(i==0 && data[i].Name != this.setupDefault.Name) // recover default pref
                data.unshift({'Name': this.setupDefault.Name});
            if(i>0 && names[data[i].Name]) { // remove duplicate sitepref
                data.splice(i, 1);
                --i;
                continue;
            }
            names[data[i].Name] = true;
            for(var key in data[i]) { // remove redundant pref
                if(typeof(this.setupDefault[key]) == 'undefined')
                    delete data[i][key];
            }
            for(var key in this.setupDefault) { // modify wrong or missing pref
                if(typeof(data[i][key]) != typeof(this.setupDefault[key]))
                    data[i][key] = this.setupDefault[key];
            }
        }
        // add setupDefault group
        data.unshift({});
        for(var key in this.setupDefault)
            data[0][key] = this.setupDefault[key];
        return data;
    },

    // save prefs to database
    save: function(data) {
        for(var i=0; i<data.length; ++i) { // compress the data size
            for(var key in data[i]) {
                if(key == 'Name')
                    continue;
                if(data[i][key] == this.setupDefault[key])
                    delete data[i][key];
            }
        }
        this.doSave(JSON.stringify(data));
    },

    // Determine the group name by the url
    getGroupNameByUrl: function(url) {
        if(!url) return '';
        return url.replace(/.*:\/\/([^\/]*).*/, '$1'); // Trim the protocol
    }
}

