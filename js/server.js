/*jshint node:true */
/*global KFC:true, vec3, quat4, mat4, mat3 */

var ws = require('./ws.js');	// WebSockets stuff
global.fs = require('fs');	// add file system as global variable

require('./util.js');
require('./car.js');
require('./mesh.js');
require('./phys.js');

require('./gl-matrix-min.js');


//
///**
// * Server logic class
// * @constructor
// */
//var WGDServer = function()
//{
//	/** @type {Array.<!Player>} */
//	this.players = [];
//	
//	/** @type {Array.<!Socket>} */
//	this.sockets = [];
//	
//	
//	
//};
//
//

// var posting_error = false;

// process.on('uncaughtException', function (err) {
// 	console.log(err.stack || err.message);
	
// 	if ( posting_error ) { return; }
// 	posting_error = true;
	
// 	fs.appendFile('node_log.txt',
// 		'\nUNCOUGHT EXCEPTION ' + Date() + '\n' + err.stack || err.message + '\n');
	
// 	posting_error = false;
	
// 	throw new Error(err);
// });

var players = [];
var sockets = [];


var intStep = 0.002;	// integration step      s
var iframe = 0;		    // integration frame 
var gtime = (new Date()).getTime();
var acc = 0;
var cid = 0;

var one = 0;

var userid = 0;
var users = [];
var carid = 0;
var cars = [];
var coll = new KFC.PhysMesh();



var cnt = 1;
var callback = function() {
	
	cnt--;
	
	if ( cnt === 0 ) {	
		gtime = (new Date()).getTime();
		setTimeout(loop, 1); // TODO, delay loop untill all assets are loaded
		server.listen(8001);
	}
};

cnt++;
var mesh = new KFC.ObjMesh(null, '../site/obj/isl.obj', true, function () {
		console.log('mesh loaded');
		callback();
	});
mesh.terr = 1;

cnt++;
var road = new KFC.ObjMesh(null, '../site/obj/road.obj', true, function () {
		console.log('mesh loaded');
		callback();
	});
road.terr = 0;

cnt++;
var port = new KFC.ObjMesh(null, '../site/obj/prpl.obj', true, function () {
		console.log('mesh loaded');
		callback();
	});
port.terr = 0;

cnt++;
var port = new KFC.ObjMesh(null, '../site/obj/prpl.obj', true, function () {
		console.log('mesh loaded');
		callback();
	});
port.terr = 0;

var water = new KFC.ObjMesh(null, '../site/obj/water.obj', true, function () {
		console.log('mesh loaded');
		callback();
	});

coll.meshes_.push(road);
coll.meshes_.push(mesh);
coll.meshes_.push(port);
coll.meshes_.push(water);

/**
 * Player data object
 * @constructor
 */
var Player = function(socket, user) {
    this.id = user.id;
	this.user = user;
    this.socket = socket;
	
    this.car = null;	
};


cnt++;
fs.readFile('../data.txt', 'utf-8', function(err, data) {	
	if ( err === null ) {
		try {
		var jd = JSON.parse(data);
		console.log('Loaded database with ' + jd.users.length + ' users and ' + jd.cars.length + ' cars');		
		if ( jd.userid !== undefined ) { userid = jd.userid; } else { console.log('Data load error'); }
		if ( jd.users !== undefined ) { users = jd.users; } else { console.log('Data load error'); }
		if ( jd.carid !== undefined ) { carid = jd.carid; } else { console.log('Data load error'); }
		if ( jd.cars !== undefined ) { cars = jd.cars; } else { console.log('Data load error'); }
		} catch (e) { console.log('Error parsing JSON data'); }
	} else {
		console.dir(err);
	}	
	setTimeout( function () {saveData(true); }, 2000 );
	callback();
});



var saveData = function( auto ) {	
	var jd = {'users':users, 'cars':cars, 'userid':userid, 'carid':carid};		
	fs.writeFile('../data.txt', JSON.stringify(jd), 'utf-8', function(err) {
		if ( err ) { console.log(err); }
	});
	if ( auto ) {
		setTimeout( function () {saveData(true); }, 30000 );
	}
};


var isOnline = function(id) {
	var i;
	for ( i = players.length-1; i >= 0; i-- ) {		
		if ( players[i].id === id ) {
			return true;
		}			
	}
	
	return false;
};

var getUser = function(name) {
	
	var i;
	for ( i = users.length-1; i >= 0; i-- ) {		
		var user = users[i];
		if ( user === undefined ) { continue; }		
		if ( user.name === name ) {
			return user;			
		}				
	}
	
	return null;	
};


var loginUser = function(socket, user) {
	var p = new Player(socket, user);
	players.push(p);
	socket.p = p;
	
	if ( user.lastCar === -1 ) {
		console.log('Player "' + user.name + '" has no car!');
		
		p.socket.send('GBC');
		
	} else {
		var car = cars[user.lastCar];
		if ( car ) {
			console.log('Player has a car ' + car.type );
			// spawn somewhere
			
			p.car = new KFC.Car(car.type);
			p.car.coll = coll;
			
		} else {
			console.log('Player car is invalid!');
		}
	}
	
	printUsers();
};

var printUsers = function() {
	
	var id,
		user,
		player;
		
	//console.log('user list:');
	//
	//for ( id in users ) {
	//	if ( users.hasOwnProperty(id) ) {
	//		user = users[id];
	//		
	//		console.log(id + ' ' + user.id + ' ' + user.name);
	//	}
	//}
	
	console.log('player list:');
	
	for ( id in players ) {
		if ( players.hasOwnProperty(id) ) {
			player = players[id];
			
			console.log(id + ' ' + player.id + ' ' + player.user.name);
		}
	}
	
};


var server = new ws.Server();

server.on('listening', function(){ console.log('Server listening on port: ' + server.server.address().port);});
server.on('error', function(e){console.dir(e);});

server.on('connection', function(socket) {
    
    socket.on('handshake', function(){
        console.log('socket.handshaked: ' + socket.socket.remoteAddress);
        //socket.send('HI! ');
    });
    
    socket.on('data', function(buff) {

        var msg = buff.toString();
		var msgParts = msg.split(' ');
		var user;
		var car;
		var i;
		var p;
		
		
		switch (msgParts[0]) {
		case 'LOG' :
			console.log('LOGIN with ' + msgParts[1] + ' ' + msgParts[2]);
			
			user = getUser(msgParts[1]);
			
			if ( user !== null ) {	// user exist in list
				
				if ( user.pass === msgParts[2] ) {	// password is correct
					
					if ( !isOnline(user.id) ) {		// not allready connected
						
						console.log('User logged in: ' + user.name);
						
						this.send('LOG SUC');
						this.send('HID ' + user.id);
						
						loginUser(this, user);
						
					} else {
						console.log('Player is already online!');
						this.send('LOG ERR user is playing');						
					}					
				} else {
					console.log('password is incorrect!');
					this.send('LOG ERR wrong pass');
				}				
			} else {				
				console.log('user was not found ' + msgParts[1]);
				this.send('LOG ERR no such user');
			}
			
			break;		
		case 'REG' :
			console.log('REGISTER with ' + msgParts[1] + ' ' + msgParts[2]);
			
			user = getUser(msgParts[1]);
			
			if ( user === null ) {
				if ( msgParts[1].length > 10 || msgParts[1] < 4 || msgParts[2].length > 16 || msgParts[2].length < 6 ) {
					this.send('REG ERR wrong size');
				} else {
					
					user = {
						'id' : userid,
						'name' : msgParts[1],
						'pass' : msgParts[2],
						'money' : 40000,
						'lastCar' : -1,
						'location' : ''
						};
						
					users[userid++] = user;					
					saveData();
					
					console.log('New user registered! ' + user.name);
					this.send('REG SUC');
					this.send('HID ' + user.id);
					
					loginUser(this, user);
				}
			} else {
				console.log('user already exist ' + msgParts[1]);
				this.send('REG ERR user exists');
			}
			
			
			break;
		case 'PIG' :
			
			this.send('POG');
			
			break;
		case 'SIF' :
			
			this.send('SIF ' + iframe);
			
			break;
		
		case 'CNT' :
			if ( !this.p || !this.p.car ) { return; } // ignore if plaer car is not set
			car = this.p.car;
			if ( car ) {
				if ( parseInt(msgParts[1], 10) < iframe ) {
					console.log('controll frame came ' + (iframe - parseInt(msgParts[1], 10)) + ' frames too late');
					this.send('LAG ');
				} else {			
					car.controllQueue.push({
						'iframe' : parseInt(msgParts[1], 10),
						'throttle' : parseFloat(msgParts[2]),
						'brakes' : parseFloat(msgParts[3]),
						'steerAngle' : parseFloat(msgParts[4])
					});
					
					var cmsg = 'CNT ' + this.p.id + ' ' + msgParts[1] + ' ' + msgParts[2] + ' ' + msgParts[3] + ' ' + msgParts[4];
					
					for ( i = players.length-1; i >= 0; i-- ) {		
						if ( players[i].socket === this ) { continue; }
						players[i].socket.send(cmsg);
					}
				}
			} else {
				console.log('Player send CNT frame with no car!');
			}
		
			break;
		case 'BUY' :
			
			if ( !this.p ) { return; }
			
			p = this.p;
			var carTypes = [1, 2, 3, 4, 5, 6, 9, 11];
			var type = parseInt(msgParts[1], 10);
			
			if ( carTypes.indexOf(type) === -1 ) {
				console.log('invalid car');
				return;
			}
			
			console.log('player "' + p.user.name  + '" bought ' + type);
			
			car = {
				'id' : carid,
				'userid' : p.userid,
				'type' : parseInt(msgParts[1], 10)
			};
			p.user.lastCar = carid;			
			cars[carid++] = car;
			
			saveData();
			
			p.car = new KFC.Car(type);
			p.car.coll = coll;
			
			var typePlace = {'1':0, '2':1, '3':2, '4':3, '5':4, '6':5, '9':6, '11':7};			
			var plc = typePlace[type.toString()];			
			vec3.set([-298.390 - plc * 8.0, 0.388, 25.159 - plc * 0.3], p.car.pos_wc);
			
			for ( i = 0; i < 100; i++ ) {
				p.car.integrate(intStep);
			}
			
			this.send('BOK');
			
			break;
		
		case 'OUT' :
			
			if ( !this.p ) { return; }
			
			p = this.p;
			
			console.log('user "' + p.user.name + '" logged out');
			
			id = p.id;			
			players.splice(players.indexOf(socket.p), 1);
			
			for ( i = players.length-1; i >= 0; i-- ) {
				players[i].socket.send('OUT ' + id);
			}
			
			printUsers();
			
			break;
		
		case 'RST' :
			
			if ( !this.p || !this.p.car ) { return; }
			
			console.log('User ' + this.p.user.name + ' requested car reset');
			
			car = this.p.car;
			
			car.pos_wc[1] = coll.yAt(car.pos_wc[0], car.pos_wc[2]).r + 1.0;
			vec3.set([0, 0, 0], car.vel_wc);
			quat4.set([0, 0.554, 0, 0.832], car.rot);
			vec3.set([0, 0, 0], car.ave);
			car.wheels[0].vrot = 0.001;
			car.wheels[1].vrot = 0.001;
			car.wheels[2].vrot = 0.001;
			car.wheels[3].vrot = 0.001;
			
			break;
		
		default:
			console.log('UNKNOW mesasge ' + msg);
		}
		

    });
    
    socket.on('close', function(){
		
		console.log(socket.lastData);
		
		var i;
		
		if ( socket.p ) {
            players.splice(players.indexOf(socket.p), 1);
			
			for ( i = 0; i < players.length; i++ ) {
				players[i].socket.send('OUT ' + socket.p.id);
			}
        }
        sockets.splice(sockets.indexOf(socket), 1);
        
        console.log('socket.close ');
        console.log(players.length);
		
		
		printUsers();
    });
    
    sockets.push(socket);
    
});


function loop() {
	
	var p;
    var i;
	
    var time = (new Date()).getTime();
	var dt = (time - gtime)/1000;
	if ( dt > 0.25 ) {
		var sf = Math.floor((dt - 0.25) / intStep);
		console.log('Skipping ' + sf + ' frames');
		iframe += sf;
		dt = 0.25;
	}
	acc += dt;
    gtime = time;
	
	
    var ab = new ArrayBuffer(144);	
    
    while ( acc >= intStep ) { // Euler integration, with intStep time steps
		acc -= intStep;
		
		for ( p = players.length-1; p >= 0; p-- ) {
			var car = players[p].car;
			if ( !car ) { continue; }
			
			var queue = car.controllQueue;
			if ( queue[0] ) {
				if ( queue[0].iframe === iframe ) {
					var cnt = queue.shift();
					car.throttle = cnt.throttle;
					car.brakes = cnt.brakes;
					car.steerAngle = cnt.steerAngle;
				} else if ( queue[0].iframe < iframe ){
					queue.shift();
				}
			}
			
			car.integrate(intStep);
			
			if ( iframe % 200 === 0 ) {
			
				car.getData(ab, 8);
				var ua = new Uint8Array( ab, 0, 4 );
				ua[0] = 67;
				ua[1] = 68;
				ua[2] = players[p].id >>> 8;
				ua[3] = players[p].id & 0x00ff;
				var ia = new Uint32Array( ab, 4, 1 );
				ia[0] = iframe;
				
				for ( i = players.length-1; i >= 0; i-- ) {
					players[i].socket.send(ab);
				}
			}
		}
		
		
		iframe++;
	}
    
    setTimeout(loop, 1);
}

callback();

