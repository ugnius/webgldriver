/*jshint sub:true */
/*global KFC, Input, NI, APP */

/**
 * Holds main game logic and supportive functions
 * @namespace
 */
var BGAME = {};


var script=document.createElement('script');
script.onload=function() {
	var stats = new window.Stats();
	stats.domElement.style.cssText='position:fixed;right:0;bottom:0;z-index:10000';
	document.body.appendChild(stats.domElement);
	requestAnimationFrame(function loop(){
		stats.update();
		requestAnimationFrame(loop);
	});
};
script.src='//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';
document.head.appendChild(script);


window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

BGAME.main = function() {
	
	BGAME.loaded = 0;
	BGAME.rendered = 0;

	BGAME.intStep = 0.0020;	// integration step      s
	BGAME.frame = 0;
	BGAME.iframe = 0;		// integration frame 
	BGAME.time = (new Date()).getTime();
	BGAME.acc = 0;
	BGAME.freeze = false;
	BGAME.lastUpdate = 0;
	BGAME.aspect = 1;
	BGAME.offline = true;
	BGAME.help = true;
	BGAME.vinetting = true;
	BGAME.fieldOfView = true;
	BGAME.focus = 0.15;
	BGAME.mute = false;
	BGAME.camMode = 1;	// 0-free, 1-follow
	BGAME.audioGain = 5;
	BGAME.canvasScale = 1.0;
	BGAME.renderDis = 10; // 1 - min, 10 - max
	
	BGAME.activeScreen = null;
	
	BGAME.NOTCON = 0;
	BGAME.LOGIN = 1;
	BGAME.REGIN = 2;
	BGAME.ONLINE = 3;
	BGAME.SHOP = 4;
	
	BGAME.serverState = BGAME.NOTCON;
	
	
	//BGAME.wsurl = 'ws://pikta.sofa.lt:8001';
	BGAME.wsurl = 'ws://' + (window.location.hostname || 'localhost') + ':8001';
	//BGAME.wsurl = 'ws://78.62.156.213:8001';
	BGAME.cnt = 0;
	
	BGAME.oldt = 0;
	BGAME.oldb = 0;
	BGAME.olda = 0;
	BGAME.id = -1;
	
	BGAME.players = [];
	BGAME.cars = [];
	BGAME.carsm = [];
	BGAME.carsa = [];
	BGAME.ripf = [];	// frame at which car was removed
	
	window.onbeforeunload = BGAME.unload;	// function to call before unloading page
	
	// Personal settings
	BGAME.loadSettings();
	
	/** @type {Input} */
	BGAME.input = new Input();  // Input class
	BGAME.input.setAllowedKeys([BGAME.input.KEY_F5, BGAME.input.KEY_F11, BGAME.input.KEY_F12, BGAME.input.KEY_F]);
	BGAME.input.setMouseLock(false);
	
	/** @type {HTMLElement} */
	BGAME.canvas = document.getElementById('canvas');
	BGAME.glc = new KFC.CGLC(BGAME.canvas, {'antialias': false, 'alpha': false});
	if (BGAME.glc === null) { return; }	// TOOD : error handle

	
	window.addEventListener('resize', BGAME.fresize, false);
	BGAME.fresize();
	
	// BGAME.audio = new KFC.Audio();
	// BGAME.audio.setGain(BGAME.audioGain);
	
	BGAME.glc.getFramebuffer('depth', true);	// preallocates FBOS
	BGAME.glc.getFramebuffer('scene');
	BGAME.glc.getFramebuffer('left');
	BGAME.glc.getFramebuffer('right');
	
	// NI.init(BGAME.wsurl);
	
	
	// DEBUG TEXT
	/** @type {HTMLElement} */
	BGAME.helpDiv = document.getElementById('help');
	
	/** @type {HTMLElement} */
	BGAME.debug = document.getElementById('debug');
	//BGAME.debug.style.display = 'none';
	
	/** @type {HTMLElement} */
	BGAME.debug2 = document.getElementById('debug2');
	BGAME.debug2.style.display = 'none';
	
	
	BGAME.activeScreen = new KFC.SCMain(BGAME);
	
	BGAME.activeScreen.load( function() {
		
		if ( !BGAME.help ) {	// hide help menu if turned off
			BGAME.helpDiv.style.display = 'none';
		}
	
		//console.log('SCMain, loaded');

		//APP.out.style.display = 'none';
		APP.out.innerHTML = '';
		APP.log('<h2>WebGL Driver (alpha)</h2>');
		APP.log('<p>Made by <a href="http://www.facebook.com/UgniusKavaliauskas">Ugnius Kavaliauskas</a> and <a href="http://www.facebook.com/rimvydas.klementavicius">Rimvydas Klementavi&#269;ius</a></p>');

		BGAME.glc.gl.clear(BGAME.glc.gl.COLOR_BUFFER_BIT);
		BGAME.canvas.style.display = 'inline';
		BGAME.glc.gl.clearColor(1.0, 1.0, 1.0, 1.0);
		
		window.requestAnimationFrame(BGAME.tick, BGAME.canvas);
		//setTimeout(BGAME.tick, 1);
			
	});

};


BGAME.fresize = function() {
	BGAME.glc.setSize(window.innerWidth  * BGAME.canvasScale,
		window.innerHeight * BGAME.canvasScale);
	BGAME.aspect = window.innerWidth/window.innerHeight;
	
	if ( BGAME.activeScreen && typeof(BGAME.activeScreen.resize) === 'function' ) {
		BGAME.activeScreen.resize( window.innerWidth, window.innerHeight );
	}
};


BGAME.unload = function() {
	BGAME.glc.unload();	// unload gl stuff	
	BGAME.saveSettings();
	
};


BGAME.saveSettings = function() {	
	if ( typeof localStorage === 'undefined' ) { return; }
	var set = {
		'fieldOfView':	BGAME.fieldOfView,
		'camMode':		BGAME.camMode,
		'audioGain':	BGAME.audioGain,
		'canvasScale':	BGAME.canvasScale,
		'renderDis':	BGAME.renderDis,
		'help':			BGAME.help
		};
	localStorage.setItem('settings', window.JSON.stringify(set));
};


BGAME.loadSettings = function() {
	if ( typeof localStorage === 'undefined' ) { return; }
	
	var set = String(localStorage.getItem('settings'));
	if ( set ) {
		set = window.JSON.parse(set);
		if ( set ) {
			if ( set['fieldOfView'] !== undefined ) { BGAME.fieldOfView = set['fieldOfView']; }
			if ( set['camMode'] !== undefined ) { BGAME.camMode = set['camMode']; }
			if ( set['audioGain'] !== undefined ) { BGAME.audioGain = set['audioGain']; }
			if ( set['canvasScale'] !== undefined ) { BGAME.canvasScale = set['canvasScale']; }
			if ( set['renderDis'] !== undefined ) { BGAME.renderDis = set['renderDis']; }
			if ( set['help'] !== undefined ) { BGAME.help = set['help']; }
		}
		
	}	
};


BGAME.tick = function(time) {
	
	time = (new Date()).getTime();
	
	BGAME.input.handleInput();
	BGAME.input.poolGamepad();
	
	if ( BGAME.activeScreen ) {
		if ( typeof(BGAME.activeScreen.update) === 'function' ) {
			BGAME.activeScreen.update(BGAME.input, time);
		}
		if ( typeof(BGAME.activeScreen.render) === 'function' ) {
			BGAME.activeScreen.render(BGAME.glc);
		}
	}
	
	if ( BGAME.activeScreen.debug ) {
		BGAME.debug.innerHTML = '' +
			'Triangles: ' + BGAME.cnt + '<br/>' +
			'Server state: ' + BGAME.serverState + '<br/>' +
			'ping average: ' + BGAME.activeScreen.pingAvg + '<br/>' +
			'Network interface: ' + NI.state + '<br/>' +
			'uAmbientColor: ' + KFC.vec3.str(BGAME.activeScreen.scene.uniforms[KFC.UniId.uAmbientColor], 2) + '<br/>' +
			'uDirColor    : ' + KFC.vec3.str(BGAME.activeScreen.scene.uniforms[KFC.UniId.uDirColor], 2) + '<br/>';	
	} else {
		
		BGAME.debug.innerHTML = '';
	}
	BGAME.cnt = 0;
	
	if ( BGAME.input.wasKeyPressed(BGAME.input.KEY_F1) ) {
		BGAME.help = !BGAME.help;
		console.log(BGAME.help);
		BGAME.helpDiv.style.display = (BGAME.help) ? 'inline' : 'none';
	}
	
	BGAME.rendered = 0;
	
	BGAME.frame++;
	
	//setTimeout(BGAME.tick, 1);
	window.requestAnimationFrame(BGAME.tick, BGAME.canvas);
};



BGAME.carControl = function(car, input, dt) {
	if ( input.isKeyDown(input.KEY_UP) ) {
		car.throttle += 0.22;
		if ( car.throttle > 1.0) {
			car.throttle = 1.0;
		}
	} else {
		if ( car.throttle <= 0.1 ) {
			car.throttle = 0;
		} else {
			car.throttle -= 0.1;
		}
	}
	
	if ( input.isKeyDown(input.KEY_DOWN) ) {
		car.brakes += 0.2;
		if ( car.brakes > 1.0) {
			car.brakes = 1.0;
		}
	} else {
		if ( car.brakes < 0.2 ) {
			car.brakes = 0;
		} else {
			car.brakes -= 0.2;
		}
	}
	
	// steering
	if ( input.isKeyDown(input.KEY_LEFT) ) {
		car.steerAngle += 0.1;
	}
	if ( input.isKeyDown(input.KEY_RIGHT) ) {
		car.steerAngle -= 0.1;
	}
	if ( !input.isKeyDown(input.KEY_LEFT) && !input.isKeyDown(input.KEY_RIGHT) ) {
		if ( Math.abs(car.steerAngle) <= 0.1 ) {
			car.steerAngle = 0;
		} else {
			if ( car.steerAngle > 0 ) {
				car.steerAngle -= 0.1;
			} else {
				car.steerAngle += 0.1;
			}
		}
	}
	if ( car.steerAngle > 1 ) { car.steerAngle = 1; }
	if ( car.steerAngle < -1 ) { car.steerAngle = -1; }
	
	if ( input.wasKeyPressed(input.KEY_2) ) {
		car.gear++;
		if ( car.gear > 6 ) {car.gear = 6; }
	}
	if ( input.wasKeyPressed(input.KEY_1) ) {
		car.gear--;
		if ( car.gear < -1 ) { car.gear = -1; }
	}
	
	if ( input.gamepadAPI ) {	// Joystick controls
		if ( input.gamepadButton(6) > 0.02 || false) {
			car.brakes = input.gamepadButton(6);
		}
		if ( input.gamepadButton(7) > 0.02 || false) {
			car.throttle = input.gamepadButton(7);
		}
		
		if ( Math.abs(input.gamepadAxis(0)) > 0.05 || false) {
			car.steerAngle = -input.gamepadAxis(0);
		}
		
	}
};



BGAME.FFCamera = function(camera, input, dt, speed) {
	
	var vrot, hrot, posx, posy, posz;
	
	speed = speed || 100;
	dt = dt || 1/60;
	dt *= speed;
	
	// move player camera around	
	vrot = camera.rotation[0];
	hrot = camera.rotation[1]; //BGAME.hrot;
	posx = camera.position[0];
	posy = camera.position[1];
	posz = camera.position[2];	
	
	if ( input.isKeyDown(input.KEY_A) ) {
		posx -= Math.cos(-hrot) * dt;
		posz -= Math.sin(-hrot) * dt;
	}
	if ( input.isKeyDown(input.KEY_D) ) {
		posx += Math.cos(-hrot) * dt;
		posz += Math.sin(-hrot) * dt;
	}
	if ( input.isKeyDown(input.KEY_S) ) {
		posx -= Math.sin(-hrot) * dt;
		posz += Math.cos(-hrot) * dt;
	}
	if ( input.isKeyDown(input.KEY_W) ) {
		posx += Math.sin(-hrot) * dt;
		posz -= Math.cos(-hrot) * dt;
	}
	if ( input.isKeyDown(input.KEY_Q) ) {
		posy += dt;
	}
	if ( input.isKeyDown(input.KEY_Z) ) {
		posy -= dt;
	}
	if ( input.isMouseLocked() || input.isButtonDown(input.BUTTON_RIGHT) ) {
		hrot -= input.mousePositionDiffX() * 0.005;
		vrot -= input.mousePositionDiffY() * 0.005;
	}
	
	camera.setPosition(posx, posy, posz);
	camera.setRotation(vrot, hrot, 0);
};


BGAME.FFCameraGamepad = function(camera, input, dt, speed) {
	
	var vrot, hrot, posx, posy, posz;
	
	speed = speed || 100;
	dt = dt || 1/60;
	dt *= speed;
	
	vrot = camera.rotation[0];
	hrot = camera.rotation[1]; //BGAME.hrot;
	posx = camera.position[0];
	posy = camera.position[1];
	posz = camera.position[2];
	
	var rx = input.gamepadAxis(input.PAD_AXIS_RX);
	var ry = input.gamepadAxis(input.PAD_AXIS_RY);
	var lx = input.gamepadAxis(input.PAD_AXIS_LX);
	var ly = input.gamepadAxis(input.PAD_AXIS_LY);
	
	lx = (KFC.clamp(Math.abs(lx)- 0.05, 0.0, 1.0) * KFC.sign(lx)) * dt * 0.5;
	ly = (KFC.clamp(Math.abs(ly)- 0.05, 0.0, 1.0) * KFC.sign(ly)) * dt * 0.5;
	
	posx -= Math.sin(-hrot) * ly - Math.cos(-hrot) * lx;
	posz += Math.cos(-hrot) * ly + Math.sin(-hrot) * lx;
	
	posy += (input.gamepadButton(input.PAD_RT) - input.gamepadButton(input.PAD_LT)) * 4.0;
	
	hrot -= (KFC.clamp(Math.abs(rx)- 0.1, 0.0, 1.0) * KFC.sign(rx)) * dt * 0.01;
	vrot -= (KFC.clamp(Math.abs(ry)- 0.1, 0.0, 1.0) * KFC.sign(ry)) * dt * 0.01;
	
	if ( vrot >  1.5 ) { vrot =  1.5; }
	if ( vrot < -1.5 ) { vrot = -1.5; }
	
	camera.setPosition(posx, posy, posz);
	camera.setRotation(vrot, hrot, 0);
};

