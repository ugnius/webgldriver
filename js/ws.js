/*jshint node:true */
/*global  */

var net = require('net');
var crypto = require('crypto');

/**
 * WebSockets server class
 * @constructor
 */
var Server = function() {
    
    this.server = net.createServer();
    
    var me = this;
    this.server.on('connection', function(socket) {
        var wss = me;
        wss.onConnection(new exports.Socket(socket));
    });
    
};

/**
 * Set server callback functions
 * @param {string} func Function name
 * @param {function(?)} cb 
 */
Server.prototype.on = function(func, cb) {
    switch (func) {
		case 'connection' :
				this.onConnection = cb;
				break;
		case 'close' :
				this.server.on('close', cb);
				break;
		case 'error' :
				this.server.on('error', cb);
				break;
		case 'listening' :
				this.server.on('listening', cb);
				break;
		default :
				throw new Error('Unknow server event: ' + func);
    }
};

/**
 * Set server to listen on custom port
 * @param {number} port Port to listen on
 */
Server.prototype.listen = function(port) {
    this.server.listen(port);
};

/**
 * WebSockets socket class wrapping TCP socket
 * @param {Socket} socket TCP client socket
 */
var Socket = function(socket) {    
    var me = this;
    
    this.handshaked = false;
    this.reconstructed_frame_size = 0;
    this.reconstructed_length = 0;
    this.reconstructed_buffer = null;
		this._remoteAddress = socket.remoteAddress;
		this._remotePort = socket.remotePort;

    this.cbHandshake = null;
    this.cbData = null;
    
    this.socket = socket;
    this.socket.on('data', function(d) {
        var sock = me;
        sock._onData(d, sock.socket);
    });
    
};

/**
 * Registers callback events
 * @param {string} event Event name
 * @param {function} cb function to call on event
 */
Socket.prototype.on = function(event, cb) {
    switch (event) {
        case 'close' :
            this.socket.on('close', cb);
            break;
        case 'data' :
            this.cbData = cb;
            break;
        case 'error' :
            this.socket.on('error', cb);
            break;
        case 'handshake' :
            this.cbHandshake = cb;
            break;
    }
};

/**
 * Handles incoming raw TCP data
 * @param {Buffer} buffer TCP data buffer
 * @param {Socket} socket TCP socket receiving data
 */
Socket.prototype._onData = function(buffer, socket) {
    
    if (!this.handshaked) {
        if (this.parseHandshake(buffer, socket)) {
        } else {
            console.log('NOT hanshaked');
        }
    } else {
        this._parseFrame(buffer, socket);
    }
};


/**
 * Sends data over WebSockets protcol
 * @param {string|ArrayBuffer|Buffer} data
 */
Socket.prototype.send = function(data) {		
    this._sendFrame(data);
};


/**
 * Encodes data to WebSockets frame and sends over TCP
 * @param {string|ArrayBuffer|Buffer} data
 */
Socket.prototype._sendFrame = function(data) {
    
		var i;
    var binary = Buffer.isBuffer(data);
		
    if ( !binary && typeof data.byteLength === 'number' ) {	// if other buffer ( Float32Array/UInt8Array/etc... )
        var d = new Buffer(data.byteLength);
        var ub = new Uint8Array(data);
        for ( i = data.byteLength-1; i >= 0; i-- ) {
            d.writeUInt8( ub[i], i, false );
        }
        
        data = d;
        binary = true;
    }
		
    if ( !binary && typeof data !== 'string' ) {	// number, object, etc
        data = data.toString();
    }
    
    var payload_length = (binary) ? data.length : Buffer.byteLength(data, 'utf-8');
    var extended_payload_length = payload_length;
		
    var header_length = 2;
    if ( payload_length > 65535 ) {
        header_length = 10;
        extended_payload_length = payload_length;
        payload_length = 127;
    } else if ( payload_length > 125 ) {
        header_length = 4;
        extended_payload_length = payload_length;
        payload_length = 126;
    }
    
    var message = new Buffer(header_length + extended_payload_length);
    message[0] = (binary) ? 0x82 : 0x81;
    message[1] = 0x00 | payload_length;
    
    if ( payload_length === 126 ) {
        message[2] = (extended_payload_length & 0xff00) >> 8;
        message[3] = (extended_payload_length & 0x00ff);
    }
		if ( payload_length === 127 ) {
        message[2] = 0x00;
        message[3] = (extended_payload_length & 0xff000000000000) >> 48;
        message[4] = (extended_payload_length & 0x00ff0000000000) >> 40;
        message[5] = (extended_payload_length & 0x0000ff00000000) >> 32;
        message[6] = (extended_payload_length & 0x000000ff000000) >> 24;
        message[7] = (extended_payload_length & 0x00000000ff0000) >> 16;
        message[8] = (extended_payload_length & 0x0000000000ff00) >> 8;
        message[9] = (extended_payload_length & 0x000000000000ff);
    }
    if (binary) {
        data.copy(message, header_length);
    } else {
        message.write(data, header_length);
    }
		
    if ( this.socket.writable ) {
        this.socket.write(message);
    }
};


/**
 * Analyzies TCP buffer and if possible extracts data from WebSockets frame
 * @param {string|ArrayBuffer|Buffer} data
 */
Socket.prototype._parseFrame = function(buffer, socket) {
		
		var i;
    
    if ( this.reconstructed_frame_size !== 0 ) { // if we need to reconstruct chopped frame
        if ( this.reconstructed_frame_size > buffer.length + this.reconstructed_length ) {            
            buffer.copy(this.reconstructed_buffer, this.reconstructed_length, 0); // copy data
            this.reconstructed_length += buffer.length;
            return;
        } else if ( this.reconstructed_frame_size > buffer.length + this.reconstructed_length ) { // reconstructed frame is bigger than expected
            console.error("Failed to reconstruct frame");
            this.reconstructed_frame_size = 0;
            this.reconstructed_length = 0;
            this.reconstructed_buffer = null;
            // disconnect?
            return;
        } else {    // buffers add to full frame
            buffer.copy(this.reconstructed_buffer, this.reconstructed_length, 0);
            buffer = this.reconstructed_buffer;
            this.reconstructed_frame_size = 0;
            this.reconstructed_length = 0;
            this.reconstructed_buffer = null;
            console.log("Reconstructed frame");
        }
    }
    
    if ( buffer.length < 2 ) {
        console.error("Message is too short to have a header");
        return;
    }
    
    var fin = (buffer[0] & 0x80) === 0x80;
    if ( !fin ) {
        console.error("FIN is not set, not supported yet!");
        return;
    }
    
    var rsv1 = (buffer[0] & 0x40) === 0x40;
    var rsv2 = (buffer[0] & 0x20) === 0x20;
    var rsv3 = (buffer[0] & 0x10) === 0x10;
    if ( rsv1 || rsv2 || rsv3 ) {
        console.warn("One of the reserved bit fields are set");
    }
    
    var opcode = buffer[0] & 0x0F;
    if ( opcode !== 0x01 && opcode !== 0x02 && opcode !== 0x08 ) { // 0x01 - text, 0x02 - binary
        console.error("unsupported opcode: 0x" + opcode.toString(16));
        return;
    }
    
    if ( opcode === 0x08 ) {
        this.socket.destroy();
        return;
    }
    
    var mask = (buffer[1] & 0x80) === 0x80;
    if ( !mask ) {
        console.error("Payload is not masked!");
        return;
    }
    
    var payload_length = buffer[1] & 0x7F;
    var length_size = 0;
    
    switch (payload_length) {
        case 126:
            length_size = 2;
            payload_length = (buffer[2] << 8) | buffer[3];
            break;
        case 127:
            length_size = 8;
            payload_length = (buffer[2] << 56) |
                             (buffer[3] << 48) |
                             (buffer[4] << 40) |
                             (buffer[5] << 32) |
                             (buffer[6] << 24) |
                             (buffer[7] << 16) |
                             (buffer[8] << 8) |
                              buffer[9];
            break;
    }
    
    // TODO disconnect if frame is too big;
    //console.log('paylad_length ' + payload_length);
    if ( (2 + length_size + 4 + payload_length) > buffer.length ) {
        console.warn("Payload size("+payload_length+") is bigger than message size");
        this.reconstructed_frame_size = 2 + length_size + 4 + payload_length; // full frame size to reconstruct
        this.reconstructed_length = buffer.length;  // reconstructed size
        this.reconstructed_buffer = new Buffer(this.reconstructed_frame_size); // Space for reconstructed frame
        buffer.copy(this.reconstructed_buffer, 0, 0); // copy data
        return;
    }
    
    // TODO masking, might be slow, change to 32 bit    
    var mask_bits = [];    
    mask_bits[0] = buffer[2 + length_size + 0];
    mask_bits[1] = buffer[2 + length_size + 1];
    mask_bits[2] = buffer[2 + length_size + 2];
    mask_bits[3] = buffer[2 + length_size + 3];        
    for ( i = 2 + length_size + 4; i < length_size + 6 + payload_length; i++ ) {
        buffer[i] = buffer[i] ^ mask_bits[(i+length_size+2)%4];
    }
		
		var payload;
		
		if ( length_size + 6 + payload_length < buffer.length ) {		// if buffer is longer than frame
				payload = Buffer(payload_length);
				buffer.copy(payload, 0, length_size + 6, length_size + 6 + payload_length); // copy data
				this.cbData(payload);
				
				this._parseFrame(buffer.slice(length_size + 6 + payload_length));	// pass rest of the buffer back to _parseFrame
		} else {
				
				this.cbData(buffer.slice(length_size + 6));
		}
    
};

/**
 * Gets header data from http request message
 * @param {string} message HTTP header message
 * @param {string} header HTTP header name
 * @retrun {string} header string or "" if header was not found
 */
Socket.prototype._getHeaderData = function(message, header) {
    var p, d;
    
    p = message.indexOf(header+': ');
    if (p === -1) return '';
    d = message.indexOf("\r\n", p);
    if (d === -1) return '';
    return message.substring(p+header.length+2, d);
};


/**
 * Gets request URI from HTTP request message
 * @param {string} message HTTP request header message
 * @return {string} request URI if found
 */
Socket.prototype._getRequestURI = function(message) {
    var p, d;
    
    p = message.indexOf('GET');
    d = message.indexOf('HTTP');
    if (p === -1 || d === -1) return '';
    return message.substring(p+4, d-1);
};

/**
 * Parses TCP buffer for WebSockets handshake, if valid - sends responce
 * @param {Buffer} buffer TCP data buffer
 * @param {Socket} socket Socket communicating
 * @return {boolean} Returns true if handshake was successfull, false otherwise
 */
Socket.prototype.parseHandshake = function(buffer, socket) {
    
    var request = buffer.toString('ascii');
    var responce = '';
    
    var resource_name   = this._getRequestURI(request);
    var host            = this._getHeaderData(request,'Host');
    var upgrade         = this._getHeaderData(request,'Upgrade');
    var connection      = this._getHeaderData(request,'Connection');
    var key             = this._getHeaderData(request,'Sec-WebSocket-Key');
    var version         = this._getHeaderData(request,'Sec-WebSocket-Version');
    var origin          = this._getHeaderData(request,'Origin');
    //var protocol = getHeaderData(request,'Sec-WebSocket-Protocol');
    //var version = getHeaderData(request,'Sec-WebSocket-Extensions');

    //if (origin !== "specific origin") {
    //    responce = "HTTP/1.1 403 Forbidden\r\n"
    //             + "Connection: close\r\n\r\n";
    //    socket.end(responce, 'ascii');
    //    return;
    //}
    
    if (key === '') {
        responce = "HTTP/1.1 400 Bad Request\r\n" +
										"Connection: close\r\n\r\n";
        socket.end(responce, 'ascii');
        return false;
    }
    
    if (version !== '8' && version !== '13') {
        responce = "HTTP/1.1 426 Upgrade Required\r\n" +
										"Connection: close\r\n" +
										"Sec-WebSocket-Version: 8, 13\r\n\r\n";
        socket.end(responce, 'ascii');
        return false;
    }
    
    //if (resource_name != '') {} // specific resource name 404
    
    var digest = crypto.createHash('sha1');
    digest.update(key);
    digest.update("258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
    
    responce  = "HTTP/1.1 101 Switching Protocols\r\n";
    responce += "Upgrade: websocket\r\n";
    responce += "Connection: Upgrade\r\n";
    responce += "Sec-WebSocket-Accept: " + digest.digest('base64') + "\r\n";
    responce += "\r\n";
    
    socket.write(responce);
    this.handshaked = true;
    this.cbHandshake();
    
    return true;
};

// Export objects
exports.Server = Server;
exports.Socket = Socket;



