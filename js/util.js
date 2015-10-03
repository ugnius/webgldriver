/*jshint node:true devel:true */
/*global KFC:true, vec3, mat4, mat3, quat4, NI, APP, fs */


if (typeof(exports) !== 'undefined') {
	global.KFC = global.KFC || {};
} else {
	window.KFC = window.KFC || {};
}

/**
 * Returns 2D dot product
 * @param {!number} x1
 * @param {!number} y1
 * @param {!number} x2
 * @param {!number} y2
 * @return {!number}
 */
KFC.dot2d = function(x1, y1, x2, y2) {
	return x1*x2 + y1*y2;
};

KFC.sign = function (f) {
	return ((f < 0) ? -1 : 1);
};


/**
 * returns value clamped to min or max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
KFC.clamp = function (value, min, max) {
	return Math.min(max, Math.max(min, value));
};

KFC.quat4 = function (w, v, norm, dest) {	// TODO, optimize array literals, ( check performance? )
	if (norm !== true) { vec3.normalize(v); }
	var r = w * 0.5;
	var s = Math.sin(r);
	
	quat4.set([v[0]*s, v[1]*s, v[2]*s, Math.cos(r)], dest);
};

/**
 * Padds text in the front with pad character until text is long enought
 * @param {string} text Text to pad
 * @param {number} length Length to pad string to
 * @param {string} pad Padding character
 * @return {string} Padded text
 */
KFC.padString = function( text, length, pad ) {
	var l = text.length;
	var n = KFC.clamp(length - l, 0, 256);
	return (new Array(n+1)).join(pad[0]) + text;
};

/**
 * @namespace Holds augmented vec3 functions
 */
KFC.vec3 = {};

/**
 * Converts vec3 to formated string
 * @param {vec3} vec vec3 vector to convert
 * @param {number=} opt_f numbers to show after point
 * @return {string} Formated vector string
 */
KFC.vec3.str = function (vec, opt_f) {
	if ( opt_f === undefined ) { opt_f = 3; }
	return '[' + vec[0].toFixed(opt_f) + ', ' +
		vec[1].toFixed(opt_f) + ', '  +
		vec[2].toFixed(opt_f) + ']';
};

/**
 * Calculates suqared distance beetween vectors
 * @param {vec3} vec1 First vector
 * @param {vec3} vec2 Second vector
 * @return {number} Squared distance beetween vectors
 */
KFC.vec3.sqrDis = function(vec1, vec2) {
	return ((vec1[0]-vec2[0]) * (vec1[0]-vec2[0])) +
			((vec1[1]-vec2[1]) * (vec1[1]-vec2[1])) +
			((vec1[2]-vec2[2]) * (vec1[2]-vec2[2]));
};

/**
 * Extension to gl-matrix functions, adds scaled vector
 * @param {vec3} vec First operand
 * @param {vec3} vec2 Second operand
 * @param {number} val Scale value
 * @param {vec3} [dest] vec3 receiving operation result. If not specified result is written to vec
 * @returns {vec3} dest if specified, vec otherwise
 */
KFC.vec3.addscaled = function (vec, vec2, val, dest) {
	if (!dest || vec === dest) {
		vec[0] += vec2[0] * val;
		vec[1] += vec2[1] * val;
		vec[2] += vec2[2] * val;
		return vec;
	}

	dest[0] = vec[0] + vec2[0] * val;
	dest[1] = vec[1] + vec2[1] * val;
	dest[2] = vec[2] + vec2[2] * val;
	return dest;
};

/**
 * Load file contents
 * @param {string} url File url
 * @param {function(string)|function(ArrayBuffer)} callback Callback function returning file text or ArrayBuffer
 * @param {?function()=} opt_error_cb Callback function on error
 * @param {boolean=} opt_arrayBuffer Response will be array buffer if true, default response type string 
 */
KFC.loadFile = function (url, callback, opt_error_cb, opt_arrayBuffer ) {
	
	if ( typeof(exports) === 'undefined' ) {
		if ( !COMPILED ) { url = 'site/' + url; }
		var xhr;
		xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		if ( opt_arrayBuffer ) {
			xhr.responseType = 'arraybuffer';
		}
		xhr.onreadystatechange  = function () {
			if ( xhr.readyState === 4 ) {
				if ( xhr.status === 200 || xhr.status === 0 ) {
					if ( opt_arrayBuffer ) {
						callback(xhr.response);
					} else {
						callback(xhr.responseText);
					}
				} else {
					console.log(xhr.status);
					if ( typeof opt_error_cb === 'function' ) {
						opt_error_cb();
					} else {
						throw new Error('Failed to load "'+url+'"');
					}
				}
			}
		};
		xhr.send();
		
	} else {
		fs.readFile(url, 'utf-8', function(err, data) {
			callback(data);
		});
	}
};

/**
 * Returns true if code is running on Node.js environment
 * @return {boolean} True if running on Node.js, false otherwise
 */
KFC.isNode = function() {
	return typeof exports !== 'undefined';
};

