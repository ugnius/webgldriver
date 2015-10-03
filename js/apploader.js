/*!
 * APPLOADER
 *
 * by Ugnius Kavaliauskas
 *
 * Date: 2012.01.30
 */

/*global BGAME */

/** namespace */
var KFC = {};

/** @define (boolean) */
var COMPILED = false;

/**
 * Holds methods to check browser compatability and to load rest of the application
 * @namespace
 */
var APP = {
	webGL_req : true,
	webSockets_req : true,
	mouseLockAPI_req : true,
	fullscreenAPI_req : true,
	gamepadAPI_req : true,
	webAudioAPI_req : true,
	scripts : ['js/audio.js',
				'js/mesh.js',
				'js/util.js',
				'js/car.js',
				'js/phys.js',
				'js/bgame.js',
				'js/input.js',
				'js/sc_main.js',
				'js/gl-matrix.js',
				'js/wglc.js',
				'js/network.js'],
	start_obj : 'BGAME',
	start_func : 'main',
	in_error : false
};

APP.main = function() {
	APP.out = document.getElementById('output');
	
	window.onerror = APP.onError;
	
	APP.log('<h2>WebGL Driver (alpha)</h2>');
	APP.log('<p>Made by <a href="https://www.facebook.com/UgniusKavaliauskas">Ugnius Kavaliauskas</a> and <a href="">Rimvydas Klementavi&#269;ius</a></p>');
	APP.log('<p>Testing browser...</p>');
	APP.log('<p>' + navigator.userAgent + '</p>');
		
	APP.checkAPISupport();
};

/**
 * Logs messages to HTML output
 * @param {!string} text
 * @param {!string=} opt_type Optional class type
 */
APP.log = function(text, opt_type) {
	APP.out.innerHTML += (( opt_type ) ? ('<p class="' + opt_type + '">') :'<p>') + text + '</p>';
};

/**
 * Adds plain text to html output
 * @param {!string} text
 */
APP.add = function(text) {
	APP.out.innerHTML += text;
};

/**
 * Checks for supported APIs
 */
APP.checkAPISupport = function() {
	
	var error = false,
		canvas, gl;
	
	// WebGl
	if (APP.webGL_req) {
		canvas = document.createElement('canvas');
		gl = canvas.getContext('experimental-webgl') || canvas.getContext('webgl');
		if ( gl ) {
			APP.log('WebGL is supported', 'success');
		} else {
			APP.log('WebGL is not supported!', 'error');
			error = true;
		}
	}
	
	// WebSockets
	if (APP.webSockets_req) {
		if ( window.MozWebSocket || window.WebSocket ) {
			APP.log('WebSockets are supported', 'success');
		} else {
			APP.log('WebSockets are not supported!', 'error');
			error = true;
		}
	}
	
	// Mouse Lock API
	if (APP.mouseLockAPI_req) {
		if ( navigator.pointer || navigator.webkitPointer ) {
			APP.log('Mouse Lock API is supported', 'success');
		} else {
			APP.log('Mouse Lock API is not supported!', 'warning');
			//error = true;
		}
	}
	
	// Gamepad API
	if (APP.gamepadAPI_req) {
		if ( navigator.gamepads || navigator.webkitGamepads ) {
			APP.log('Gamepad API is supported', 'success');
		} else {
			APP.log('Gamepad API is not supported!', 'warning');
			//error = true;
		}
	}
	
	// Web Audio API
	if (APP.webAudioAPI_req) {
		if ( window.AudioContext || window.webkitAudioContext ) {
			APP.log('Web Audio API is supported', 'success');
		} else {
			APP.log('Web Audio API is not supported!', 'warning');
			//error = true;
		}
	}
	
	
	if (!error) {
		APP.log('Loading application...');
		if ( COMPILED === true ) {
			BGAME.main();
		} else {
			APP.loadApplicationFiles();
		}
	} else {
		APP.log('Sorry, this game will not work here =/');
	}
	
};


/**
 * Loads files in APP.scripts array
 */
APP.loadApplicationFiles = function() {
	var count = APP.scripts.length,
		cb, s;
	
	cb = function(url){
		count--;
		//APP.log('<p>' + url + ' loaded. '  + count + ' left</p>');
		APP.add('.');
		if ( count === 0 ) {
			window[APP.start_obj][APP.start_func]();
		}
	};
	
	while ( (s = APP.scripts.pop()) !== undefined ) {
		APP.loadScript(s, cb);
	}
};


/**
 * Adds script tag to html header
 * @param {string} url Script url
 * @param {function(string)} callback function to call when script is loaded
 */
APP.loadScript = function(url, callback) {
	/** @type {Element} */
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	script.onload = function(){
		var lurl = url;
		callback(lurl);
	};
	document.getElementsByTagName('head')[0].appendChild(script);
};

/**
 * Post AJAX message to server
 * @param {string} type Type of message. Should be 'err' or 'log'
 * @param {string} msg Message content.
 */
APP.postMessage = function(type, msg) {
	/** @type {XMLHttpRequest} */
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'post.php');
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send('data=' + type + '&msg=' + msg);
};

/**
 * Global error handler.
 * @param {string} errorMsg Error message
 * @param {string} url file in which error has occured
 * @param {number} lineNumber Error line number
 */
APP.onError = function(errorMsg, url, lineNumber) {
	
	/** @type {string} */
	var str;
	/** @type {string} */
	var msg;
	/** @type {Array.<string>} */
	var strp;
	
	if ( APP.in_error === true ) { return; }	// to avoid infinite loop
	APP.in_error = true;
	
	strp = url.split('/');
	str = strp[strp.length-1];
	msg = errorMsg + '  ' + str + ':' + lineNumber;
	
	APP.log( '<p class="error">' + msg + '</p>');
	APP.postMessage('err', msg);
	
	APP.in_error = false;
};


window.onload = APP.main;



