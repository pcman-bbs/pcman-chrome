var conv = {
    convertStringToUTF8: function(data, charset, skipCheck) {
        if(!this.cache['a2u_'+charset]) // building it in advance is recommended
            this.buildCache(charset); // sync building, which fails in IE

        var b2u = this.cache['a2u_'+charset]; // the table
        var ret = '', i, n = data.length;
        for(i = 0; i < n; ++i) {
            if(data.charCodeAt(i) >= 129 && i < n-1) { // use UAO table
                var code = data.charCodeAt(i)*0x100 + data.charCodeAt(i+1);
                var idx = (code - 0x8001) * 2;
                // dump('idx = ' + idx + ', len = ' + b2u.length + '\n');
                var uni = b2u.charCodeAt(idx)*0x100 + b2u.charCodeAt(idx+1);
                ret += String.fromCharCode(uni);
                ++i;
            }
            else // this is an ascii character
                ret += data[i];
        }
        return ret;
    },

    cache: {},

    buildCache: function(charset, callback) {
        var cache = this.cache;
        if(cache['a2u_'+charset])
            return callback(); // don't build again

        var url = '/charset/b2u.tab';
        if(charset != 'big5')
            var url = '/charset/a2u.tab?charset=' + charset;

        var req = new XMLHttpRequest();
        req.open('GET', url, !!callback);
        if(!!callback) {
            req.responseType = 'arraybuffer';
            req.onreadystatechange = function(event) {
                if(req.readyState != 4)
                    return;
                if(req.status == 200) {
                    cache['a2u_'+charset] = Array.prototype.map.call(
                        new Uint8Array(req.response), function(x) {
                            return String.fromCharCode(x);
                        }
                    ).join('');
                    /*cache['a2u_'+charset] = String.fromCharCode.apply(
                        null, new Uint8Array(req.response)
                    );*/ // GC complains of maximum call stack size exceeded
                }
                callback(req.status);
            };
            req.send();
            return;
        }
        req.overrideMimeType('text\/plain; charset=x-user-defined'); // IE fails
        req.send();
        cache['a2u_'+charset] = req.responseText.split('').map(function(x) {
            return String.fromCharCode(x.charCodeAt(0) % 0x100);
        }).join('');
    }
}

var oconv = {
    charset: '',
    ConvertFromUnicode: function(str) {
        var charset = this.charset;

        if(!this.cache['u2a_'+charset]) // building it in advance is recommended
            this.buildCache(charset); // sync building, which fails in IE

        var u2b = this.cache['u2a_'+charset]; // the table
        var ret = '', i, n = str.length;
        for(i = 0; i < n; ++i) {
            var ch = str[i];
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
    },

    cache: {},

    buildCache: function(charset, callback) {
        var cache = this.cache;
        if(cache['u2a_'+charset])
            return callback(); // don't build again

        var url = '/charset/u2b.tab';
        if(charset != 'big5')
            var url = '/charset/u2a.tab?charset=' + charset;

        var req = new XMLHttpRequest();
        req.open('GET', url, !!callback);
        if(!!callback) {
            req.responseType = 'arraybuffer';
            req.onreadystatechange = function(event) {
                if(req.readyState != 4)
                    return;
                if(req.status == 200) {
                    cache['a2u_'+charset] = Array.prototype.map.call(
                        new Uint8Array(req.response), function(x) {
                            return String.fromCharCode(x);
                        }
                    ).join('');
                    /*cache['a2u_'+charset] = String.fromCharCode.apply(
                        null, new Uint8Array(req.response)
                    );*/ // GC complains of maximum call stack size exceeded
                }
                callback(req.status);
            };
            req.send();
            return;
        }
        req.overrideMimeType('text\/plain; charset=x-user-defined'); // IE fails
        req.send();
        cache['u2a_'+charset] = req.responseText;
    }
};
