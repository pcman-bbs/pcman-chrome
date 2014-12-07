// Listen the input events and handle the typed words

function InputHandler(view) {
    this.view = view;
    this.isComposition = false; // Fix for FX 12+

    this.load();
}

InputHandler.prototype = {
    load: function() {
        var input = this.view.input;

        this.composition_start = {
            view: this,
            handleEvent: function(e) {
                this.view.compositionStart(e);
            }
        };
        input.addEventListener('compositionstart', this.composition_start, false);

        this.composition_end = {
            view: this,
            handleEvent: function(e) {
                this.view.compositionEnd(e);
            }
        };
        input.addEventListener('compositionend', this.composition_end, false);

        this.key_press = {
            view: this,
            handleEvent: function(e) {
                this.view.keyPress(e);
            }
        };
        if(typeof(Components) !== 'undefined') // FX only
            addEventListener('keypress', this.key_press, false);
        else // GC, IE, etc.
            addEventListener('keydown', this.key_press, false);

        this.text_input = {
            view: this,
            handleEvent: function(e) {
                this.view.textInput(e);
            }
        };
        input.addEventListener('input', this.text_input, false);
    },

    unload: function() {
        var input = this.view.input;
        input.removeEventListener('compositionstart', this.composition_start, false);
        input.removeEventListener('compositionend', this.composition_end, false);
        if(typeof(Components) !== 'undefined') // FX only
            removeEventListener('keypress', this.key_press, false);
        else // GC, IE, etc.
            removeEventListener('keydown', this.key_press, false);
        input.removeEventListener('input', this.text_input, false);
        this.compositionEnd({target: {}}); // Hide the input proxy
    },

    compositionStart: function(e) {
        this.isComposition = true; // Fix for FX 12+
        this.view.onCompositionStart(e); // Show the input proxy
    },

    compositionEnd: function(e) {
        this.view.onCompositionEnd(e); // Hide the input proxy
        this.isComposition = false; // Fix for FX 12+

        // For compatibility of FX 10 and before
        //this.textInput(e);
        if(isBrowser(['IE']))
            this.textInput(e);
    },

    keyPress: function(e) {
        // dump('onKeyPress:'+e.charCode + ', '+e.keyCode+'\n');
        var conn = this.view.conn;
        
        // give keypress control back to Firefox
        if ( !conn.app.ws )
          return;
          
        // Don't handle Shift Ctrl Alt keys for speed
        if(e.keyCode > 15 && e.keyCode < 19) return;

        if(e.charCode) { // FX only
            // Control characters
            if(e.ctrlKey && !e.altKey && !e.shiftKey) {
                // Ctrl + @, NUL, is not handled here
                if( e.charCode >= 65 && e.charCode <=90 ) { // A-Z
                    if(e.charCode = 67 && this.view.selection.hasSelection())
                        conn.listener.copy(); // ctrl+c
                    else
                        conn.send( String.fromCharCode(e.charCode - 64) );
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                else if( e.charCode >= 97 && e.charCode <=122 ) { // a-z
                    if(e.charCode = 67 && this.view.selection.hasSelection())
                        conn.listener.copy(); // ctrl+c
                    else
                        conn.send( String.fromCharCode(e.charCode - 96) );
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            } if(e.ctrlKey && !e.altKey && e.shiftKey) {
                switch(e.charCode) {
                case 65: // ctrl+shift+a
                case 97: // ctrl+shift+A
                    conn.listener.selAll();
                    break;
                case 83: // ctrl+shift+s
                case 115: // ctrl+shift+S
                    conn.listener.search();
                    break;
                case 86: // ctrl+shift+v
                case 118: // ctrl+shift+V
                    conn.listener.paste();
                    break;
                default:
                    return; // don't stopPropagation
                }
                e.preventDefault();
                e.stopPropagation();
            }
        } else if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch(e.keyCode){
            case 8:
                conn.send('\b');
                break;
            case 9:
                conn.send('\t');
                // don't move input focus to next control
                e.preventDefault();
                e.stopPropagation();
                break;
            case 13:
                conn.send('\r');
                break;
            case 27: //ESC
                conn.send('\x1b');
                break;
            case 33: //Page Up
                conn.send('\x1b[5~');
                break;
            case 34: //Page Down
                conn.send('\x1b[6~');
                break;
            case 35: //End
                conn.send('\x1b[4~');
                break;
            case 36: //Home
                conn.send('\x1b[1~');
                break;
            case 37: //Arrow Left
                conn.send('\x1b[D');
                break;
            case 38: //Arrow Up
                conn.send('\x1b[A');
                break;
            case 39: //Arrow Right
                conn.send('\x1b[C');
                break;
            case 40: //Arrow Down
                conn.send('\x1b[B');
                break;
            case 45: //Insert
                conn.send('\x1b[2~');
                break;
            case 46: //DEL
                conn.send('\x1b[3~');
                break;
            }
        } else if(e.ctrlKey && !e.altKey && !e.shiftKey) { // for GC
            if(e.keyCode >= 65 && e.keyCode <= 90) { // A-Z key
                if(e.keyCode == 67 && this.view.selection.hasSelection()) {
                    conn.listener.copy(); // ctrl+c
                } else {
                    conn.send( String.fromCharCode(e.keyCode - 64) );
                }
            } else if(e.keyCode >= 219 && e.keyCode <= 221) { // [ \ ]
                conn.send( String.fromCharCode(e.keyCode - 192) );
            }
            e.preventDefault();
            e.stopPropagation();
        } else if(e.ctrlKey && !e.altKey && e.shiftKey) { // for GC
            switch(e.keyCode) {
            case 50: // @
                conn.send( String.fromCharCode(0) );
                break;
            case 54: // ^
                conn.send( String.fromCharCode(30) );
                break;
            case 109: // _
                conn.send( String.fromCharCode(31) );
                break;
            case 191: // ?
                conn.send( String.fromCharCode(127) );
                break;
            case 65: // ctrl+shift+a
                conn.listener.selAll();
                break;
            case 83: // ctrl+shift+s
                conn.listener.search();
                break;
            case 86: // ctrl+shift+v
                conn.listener.paste();
                break;
            default:
                return; // don't stopPropagation
            }
            e.preventDefault();
            e.stopPropagation();
        }
    },

    textInput: function(e) {
        if(this.isComposition) // Fix for FX 12+
            return;
        if(e.target.value) {
            this.view.conn.convSend(e.target.value, 'big5');
        }
        e.target.value='';
    }
}
