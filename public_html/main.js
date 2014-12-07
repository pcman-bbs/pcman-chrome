// Main Program

function PCMan() {
    var canvas = document.getElementById("canvas");
    this.conn=new Conn(this);
    this.view=new TermView(canvas);
    this.buf=new TermBuf(80, 24);
    this.buf.setView(this.view);
    this.view.setBuf(this.buf);
    this.view.setConn(this.conn);
    this.parser=new AnsiParser(this.buf);
}

PCMan.prototype={

    connect: function(url) {
        var parts = url.split(':');
        var port = 23;
        if(parts.length > 1)
            port=parseInt(parts[1], 10);
        this.conn.connect(parts[0], port);
    },

    close: function() {
        if(this.conn.app.ws) {
            this.abnormalClose = true;
            this.conn.close();
        }

        this.view.removeEventListener();

        // added by Hemiola SUN 
        this.view.blinkTimeout.cancel();
    },

    onConnect: function(conn) {
        this.updateTabIcon('connect');
    },

    onData: function(conn, data) {
        this.parser.feed(data); // parse the received data
        this.view.update(); // update the view
    },

    onClose: function(conn) {
        if(this.abnormalClose) return;

        this.updateTabIcon('disconnect');
    },

    copy: function(selection){
        if(selection/* && this.os == 'WINNT'*/)
            return; // Windows doesn't support selection clipboard

        if(this.view.selection.hasSelection()) {
            var text = this.view.selection.getText();

            var _this = this;
            this.conn.app.copy(text, function() {
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent('copy', true, true);
                _this.view.input.dispatchEvent(evt);
            });
            this.view.selection.cancelSel(true);
        }
    },

    paste: function(selection) {
        if(selection/* && this.os == 'WINNT'*/)
            return; // Windows doesn't support selection clipboard

        var _this = this;
        this.conn.app.paste(function(text) {
            if(!text)
                return;
 
            text = text.replace(/\r\n/g, '\r');
            text = text.replace(/\n/g, '\r');
            text = text.replace(/\x1b/g, '\x15');
 
            _this.conn.convSend(text, 'big5');
        });
    },

    selAll: function() {
        this.view.selection.selectAll();
    },

    search: function() {
        if(!this.view.selection.hasSelection())
            return;
        var text = this.view.selection.getText();
        //Fixme: get search patterns from the preferences of GC
        var searchPattern = "http://www.google.com/search?q=%s";
        openURI(searchPattern.replace(/%s/g, encodeURIComponent(text)), true);
        this.view.selection.cancelSel(true);
    },

    updateTabIcon: function(aStatus) {
      var icon = 'icon/tab-connecting.png';
      switch (aStatus) {
        case 'connect':
          icon =  'icon/tab-connect.png';
          break;
        case 'disconnect':
          icon =  'icon/tab-disconnect.png';
          break;
        case 'idle':  // Not used yet
          icon =  'icon/tab-idle.png';
          break;
        case 'connecting':  // Not used yet
        default:
      }

      var link = document.querySelector("link[rel~='icon']");
      if(!link) {
          link = document.createElement("link");
          link.setAttribute("rel", "icon");
          link.setAttribute("href", icon);
          document.head.appendChild(link);
      } else {
          link.setAttribute("href", icon);
      }
    }
}
