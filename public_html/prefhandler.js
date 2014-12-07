// get settings from preferences and apply it immediately

function PrefHandler(listener) {
    this.listener=listener;
    this.handler=null; // handle the callback from the observer
    this.load();
    this.observer.observe(listener);
    //FIXME: The pollution of the namespace for the preferences
}

PrefHandler.prototype={
    // load prefs from the database
    load: function(triggerObserver) {
        var options = new PCManOptions();
        var url = document.location.hash.substr(1);
        if(!url) url = 'ptt.cc';
        options.sync(url, this);
    },

    // Listen the changes of the prefs
    observe: function(startObserve) {
        var options = new PCManOptions();
        var url = document.location.hash.substr(1);
        if(!url) url = 'ptt.cc';
        if(startObserve)
            return options.addObserver(url, this);
        else
            return options.removeObserver(this);
    },

    // functions for applying prefs immediately
    // for prefs without handler, only the pref value is set

    observer : {
        //FIXME: The pollution of the namespace for the preferences
        observe: function(listener) {
            this.listener = listener;
        },

        handler: null, // wrap 'this' for FX 3.6 doesn't support bind()

        Encoding: function() {
            var Encoding = this.listener.prefs.Encoding;
            var _this = this;
            conv.buildCache(Encoding, function(b2ustatus) {
                oconv.buildCache(Encoding, function(u2bstatus) {
                    _this.listener.view.redraw(true);
                });
            });
        }
    }
}
