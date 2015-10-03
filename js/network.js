/*!
 * WebSockets JavaScript implementation
 *
 * Copyright 2011, Ugnius Kavaliauskas
 *
 * Date: @DATE
 */

/*jshint sub:true */
/*global WebSocket, MozWebsocket */

var NI = {};


NI.init = function(server) {
    NI.server = server;   
    NI.na = [];
    NI.retries = 0;
    
    /** @type {WebSocket} */
    NI.s = null;
    
    NI.connect();
    
    NI.state = 0;   // not connected
    
};


NI.connect = function() {
    try {
        NI.s = new WebSocket(NI.server);
    } catch(e) {}
    
    try {
        NI.s = new MozWebSocket(NI.server);
    } catch(e) {}
    
    if (NI.s === null) {
        console.log("WARNING: NetworkInterface::connect - WebSocket is not supported");
        return;
    }
    
    NI.s['binaryType'] = 'arraybuffer'; // quick hack for GCC
    NI.s.onopen = NI.onopen;
    NI.s.onclose = NI.onclose;
    NI.s.onmessage = NI.onmessage;
    
    NI.state = 1;   // trying to connect
};


NI.close = function() {
    if ( NI.s ) {
        NI.s.close();
    }
};

NI.onopen = function() {
    console.log("INFO: NetworkInterface - succesfuly connected to " + NI.server);
    NI.state = 2;   // connected
};


NI.onclose = function() {
    //log("INFO: NetworkInterface::onclose - reporting");
    if ( NI.retries === 0 ) { // try localhost
        NI.retries = 1;
        NI.server = "ws://localhost:8001";
        NI.connect();
    } else {
        console.log("WARNING: NetworkInterface::onclose - failed to connect to WebSockets server!");
        NI.state = 3; // Failed to connect
    }
};


NI.onmessage = function(event) {
    NI.na.push(event.data);
};


NI.send = function(m) {
    if (NI.s !== null && NI.s.readyState === 1) {
        NI.s.send(m);
    }
};


NI.getLast = function() {
    var t = NI.na;
    NI.na = [];
    return t;
};


