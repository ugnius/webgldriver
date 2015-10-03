/*global APP, KFC, AudioContext */

// Type declarations

window.KFC = window.KFC || {};

window.AudioContext = window.AudioContext || window.webkitAudioContext;	

/**
 * Web Audio wrapper class
 * @constructor
 */
KFC.Audio = function() {
	

	
	//this.tag = document.createElement('audio');
	//document.body.appendChild(this.tag);
	//this.tag.src = 'sound/01_01_shifty.ogg';
	//this.tag.load();
	//this.tag.play();
	
	/** @type {AudioContext} */
	this.context = (window.AudioContext) ? new AudioContext() : null;
	if ( !this.context ) { return; }
	
	this.buffers = {};

	// console.log(this.context);

	this.destGain = this.context.createGain();
	this.destGain.connect(this.context.destination);
	
};

/**
 * Returns audio wrapper destination node
 * @return {AudioNode}
 */
KFC.Audio.prototype.getDestination = function() {
	return this.destGain;
};

/**
 * Changes gain of this Audio wrapper
 * @param {number} gain Gain level, 0 - silent, 1 - maximum gain
 * @param {number=} opt_time Time to linearly change value
 */
KFC.Audio.prototype.setGain = function(gain, opt_time) {
	if ( this.context ) {
		this.destGain.gain.exponentialRampToValueAtTime( KFC.clamp(gain, 0.0, 1.0), this.context.currentTime + (opt_time || 0));
	}	
};


/**
 * returns gain of this audio wrapper
 * @return {number} gain Gain level, 0 - silent, 1 - maximum gain
 */
KFC.Audio.prototype.getGain = function() {	
	if ( this.context ) {
		return this.destGain.gain.value;
	}
	
	return 0;
};


/**
 * Readies audio file to a buffer for playing later
 * @param {string} url URL of audio file
 * @param {function()} callback callback to call when file is loaded
 * @param {function()=} opt_err_callback function to call when an error occurs
 */
KFC.Audio.prototype.readyBuffer = function (url, callback, opt_err_callback) {
	if ( !this.context ) {
		if ( typeof(callback) === 'function' ) {
			callback();
		}
		return;
	}
	
	var xhr, buffer,
		cb = callback,
		that = this;
		
		
	if ( typeof(url) !== 'string' ) { throw new Error('Wrong audio url name!'); }
	
	if ( this.buffers[url] !== undefined ) {
		if ( typeof(callback) === 'function' ) {
			callback();
		}
	} else {
		this.buffers[url] = buffer = {'ready':false, 'buffer':null};

		url = 'sound/' + url;
		
		KFC.loadFile( url, function(response) {
			that.context.decodeAudioData(response,
				function(buff) {
					buffer.buffer = buff;
					buffer.ready = true;
				
					if ( typeof(cb) === 'function' ) {
						cb();
					}
				
				});
			}, opt_err_callback, true);
	}
};


KFC.Audio.prototype.getBuffer = function (url) {
	if ( !this.context ) { return null; }
	
	if ( this.buffers[url] === undefined || this.buffers[url].buffer === null ) {
		throw new Error('Audio resource is not ready!');
	}
	
	return this.buffers[url].buffer;
};


KFC.Audio.prototype.play = function (url, dest) {
	if ( !this.context ) { return; }
	
	var source,
		that = this;
	
	if ( this.buffers[url] === undefined ) {
		
		this.readyBuffer(url, function () {
			that.play(url, dest);
		});
		
		APP.log('Audio resource was not preloaded "' + url + '"', 'warn' );
	} if ( this.buffers[url].buffer === null ) {
		APP.log('Audio buffer is not ready', 'warn');
	} else {
		source = this.context.createBufferSource();
		source.buffer = this.buffers[url].buffer;
		
		source.connect((dest !== undefined) ? dest : this.destGain);		
		source.noteOn(0);
	}
	
};


KFC.Audio.prototype.getSource = function (url, gain, loop, dest) {
	if ( !this.context ) { return null; }
	
	var source = this.context.createBufferSource();
	source.buffer = this.getBuffer(url);
	// console.log(source);
//	source.gain.value = (gain !== undefined) ? gain : 1.0;
	source.loop = (loop === true) ? true : false;
	if ( dest !== undefined ) {
		source.connect(dest);
	}
	
	return source;
	
};

KFC.Audio.prototype.playRadio = function( id ) {
	
	
	
}