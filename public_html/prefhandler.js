// get settings from preferences and apply it immediately

function PrefHandler(listener) {
    this.listener=listener;
    this.handler=null; // handler for the observer
    this.onPrefChanged=new ApplyChange();
    this.load();
}

PrefHandler.prototype={
    // load the prefs with those in database, and trigger PrefChanged handler
    load: function(triggerObserver) {
        var options = new PCManOptions();
        var storage = options.load();
        var url = document.location.hash.substr(1);
        if(!url) url = 'ptt.cc';
        url = options.getGroupNameByUrl(url);
        var prefs = storage[1];
        for(var i=0; i<storage.length; ++i) {
            if(url == storage[i].Name)
                prefs = storage[i];
        }
        for(var key in prefs) {
            if(this[key] == prefs[key])
                continue;
            this[key] = prefs[key];
            if(triggerObserver && this.onPrefChanged[key]) {
                this.handler.listener = this.listener; // wrap 'this'
                this.handler.applyChange = this.onPrefChanged[key];
                this.handler.applyChange();
            }
        }
    },

    // listen the changes of the prefs
    observe: function(startObserve) {
        var _this = this;
        var handler = function() { _this.load(true); };
        var options = new PCManOptions();
        if(startObserve)
            this.handler = options.addObserver(handler);
        else
            options.removeObserver(this.handler);
    }
}

// functions for applying prefs immediately
// for unlisted prefs, nothing is done
function ApplyChange() {
}

// this = PrefHandler.handler in following methods called by PrefHandler.load
ApplyChange.prototype={
    Encoding: function() {
        var Encoding = this.listener.prefs.Encoding;
        var listener = this.listener;
        conv.buildCache(Encoding, function(b2ustatus) {
            oconv.buildCache(Encoding, function(u2bstatus) {
                listener.view.redraw(true);
            });
        });
    }
}
