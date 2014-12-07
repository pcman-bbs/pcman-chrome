var u2bTab = {
    u2bTab: '',
    init: function (callback) {
        // load U2B table
        var req = new XMLHttpRequest();
        req.open('GET', '/charset/u2b.tab', !!callback);
        if(!!callback) {
            var _this = this;
            req.responseType = 'arraybuffer';
            req.onreadystatechange = function(event) {
                if(req.readyState != 4)
                    return;
                if(req.status == 200) {
                    _this.u2bTab = String.fromCharCode.apply(
                        null, new Uint8Array(req.response)
                    );
                }
                callback(req.status);
            };
            req.send();
            return;
        }
        req.overrideMimeType('text\/plain; charset=x-user-defined');
        req.send();
        this.u2bTab = req.responseText;
    },

    u2b: function(ustr) {
        var ret = '';
        if(!this.u2bTab)
            this.init(); // initialize UAO table
        var u2b = this.u2bTab; // the table
        var i, n = ustr.length;
        for(i = 0; i < n; ++i) {
            var ch = ustr[i];
            var code = ch.charCodeAt(0);
            if(code >= 129) { // use UAO table
                var idx = (code - 129) * 2;
                // dump('idx = ' + idx + ', len = ' + u2b.length + '\n');
                if(idx < u2b.length) {
                    var big5 = u2b[idx] + u2b[idx + 1];
                    ret += big5;
                }
            }
            else // this is an ascii character
                ret += ch;
        }
        return ret;
    }
}

var b2uTab = {
    b2uTab: '',
    init: function (callback) {
        // load B2U table
        var req = new XMLHttpRequest();
        req.open('GET', '/charset/b2u.tab', !!callback);
        if(!!callback) {
            var _this = this;
            req.responseType = 'arraybuffer';
            req.onreadystatechange = function(event) {
                if(req.readyState != 4)
                    return;
                if(req.status == 200) {
                    _this.b2uTab = String.fromCharCode.apply(
                        null, new Uint8Array(req.response)
                    );
                }
                callback(req.status);
            };
            req.send();
            return;
        }
        req.overrideMimeType('text\/plain; charset=x-user-defined');
        req.send();
        this.b2uTab = req.responseText.split('').map(function(x) {
            return String.fromCharCode(x.charCodeAt(0) % 0x100);
        }).join('');
    },

    b2u: function(bstr) {
        var ret = '';
        if(!this.b2uTab)
            this.init(); // initialize UAO table
        var b2u = this.b2uTab; // the table
        var i, n = bstr.length;
        for(i = 0; i < n; ++i) {
            if(bstr.charCodeAt(i) >= 129 && i < n-1) { // use UAO table
                var code = bstr.charCodeAt(i)*0x100 + bstr.charCodeAt(i+1);
                var idx = (code - 0x8001) * 2;
                // dump('idx = ' + idx + ', len = ' + b2u.length + '\n');
                var uni = b2u.charCodeAt(idx)*0x100 + b2u.charCodeAt(idx+1);
                ret += String.fromCharCode(uni);
                ++i;
            }
            else // this is an ascii character
                ret += bstr[i];
        }
        return ret;
    }
}

var conv = {
    convertStringToUTF8: function(data, charset, skipCheck) {
        return b2uTab.b2u(data);
    }
};

var oconv = {
    charset: '',
    ConvertFromUnicode: function(str) {
        return u2bTab.u2b(str);
    }
};

