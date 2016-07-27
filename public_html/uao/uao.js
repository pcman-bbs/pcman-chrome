// Javascript module for Unicode-at-on support
// Reference: http://moztw.org/docs/big5/
// http://moztw.org/docs/big5/table/uao250-u2b.txt

'use strict';

var EXPORTED_SYMBOLS = ["uaoConv"];

var uaoConv = {
    cache: {},
    buildCache: function(type, charset, callback) {
        var cache = this.cache;
        if (cache[type + '_' + charset])
            return callback(); // don't build again

        var url = '/uao/' + type.replace('a', 'b') + '.tab';
        if (charset != 'big5')
            url = '/charset/' + type + '.tab?charset=' + charset;

        var req = new XMLHttpRequest();
        req.open('GET', url, !!callback);
        if (!!callback) {
            req.responseType = 'arraybuffer';
            req.onreadystatechange = function(event) {
                if (req.readyState != 4)
                    return;
                if (req.status == 200) {
                    cache[type + '_' + charset] = Array.prototype.map.call(
                        new Uint8Array(req.response),
                        function(x) {
                            return String.fromCharCode(x);
                        }
                    ).join('');
                }
                callback(req.status);
            };
            req.send();
            return;
        }
        req.overrideMimeType('text\/plain; charset=x-user-defined'); // IE fails
        req.send();
        var ret = req.responseText;
        cache[type + '_' + charset] = ret.split('').map(function(x) {
            return String.fromCharCode(x.charCodeAt(0) % 0x100);
        }).join('');
    },

    convertStringToUTF8: function(data, charset, skipCheck, allowSubstitution) {
        if (!this.cache['a2u_' + charset])
            this.buildCache('a2u', charset); // sync building, which fails in IE

        var b2u = this.cache['a2u_' + charset]; // the table
        var ret = '',
            i, n = data.length;
        for (i = 0; i < n; ++i) {
            if (data.charCodeAt(i) >= 129 && i < n - 1) { // use UAO table
                var code = data.charCodeAt(i) * 0x100 + data.charCodeAt(i + 1);
                var idx = (code - 0x8001) * 2;
                var uni = b2u.charCodeAt(idx) * 0x100 + b2u.charCodeAt(idx + 1);
                ret += String.fromCharCode(uni);
                ++i;
            } else { // this is an ascii character
                ret += data[i];
            }
        }
        return ret;
    },

    charset: '',
    ConvertFromUnicode: function(str) {
        var charset = this.charset;

        if (!this.cache['u2a_' + charset])
            this.buildCache('u2a', charset); // sync building, which fails in IE

        var u2b = this.cache['u2a_' + charset]; // the table
        var ret = '',
            i, n = str.length;
        for (i = 0; i < n; ++i) {
            var ch = str[i];
            var code = ch.charCodeAt(0);
            if (code >= 129) { // use UAO table
                var idx = (code - 129) * 2;
                if (idx < u2b.length) {
                    var big5 = u2b[idx] + u2b[idx + 1];
                    ret += big5;
                }
            } else { // this is an ascii character
                ret += ch;
            }
        }
        return ret;
    }
};

