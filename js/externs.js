
/**
 *
 * @externs
 */


/* Joistick API */

/**
 * @constructor
 */
function Gamepad() {};

/** @type {Array.<number>} */
Gamepad.prototype.axes;

/** @type {Array.<number>} */
Gamepad.prototype.buttons;

/** @type {string} */
Gamepad.prototype.id;

/** @type {Array.<number>} */
Gamepad.prototype.index;


/** @type {Array.<Gamepad>} */
navigator.webkitGamepads;

/** @type {Array.<Gamepad>} */
navigator.gamepads;



/* WebAudio API */

/**
 * @constructor
 */
function AudioContext() {};

/** @type {AudioDestinationNode} */
AudioContext.prototype.destination;

/** @type {number} */
AudioContext.prototype.currentTime;

AudioContext.prototype.decodeAudioData = function () {};

/**
 * @return {AudioPannerNode}
 */
AudioContext.prototype.createPanner = function () {};

/**
 * @return {AudioGainNode}
 */
AudioContext.prototype.createGainNode = function () {};

/**
 * @return {AudioBufferSourceNode}
 */
AudioContext.prototype.createBufferSource = function () {};


/**
 * @constructor
 */
function AudioNode () {};

/**
 * @param {AudioNode} node
 */
AudioNode.prototype.connect = function (node) {};


/**
 * @constructor
 * @extends {AudioNode}
 */
function AudioPannerNode () {};

/**
 * @param {!number} x
 * @param {!number} y
 * @param {!number} z
 */
AudioPannerNode.prototype.setPosition = function (x, y, z) {};


/**
 * @constructor
 * @extends {AudioNode}
 */
function AudioDestinationNode () {};


/**
 * @constructor
 * @extends {AudioNode}
 */
function AudioSourceNode () {};

/**
 * @constructor
 * @extends {AudioNode}
 */
function AudioGainNode () {};

/**
 * @type {AudioGain}
 */
AudioGainNode.prototype.gain;


/**
 * @constructor
 * @extends {AudioSourceNode}
 */
function AudioBufferSourceNode () {};

/**
 * @param {number} time
 */
AudioBufferSourceNode.prototype.noteOn = function (time) {};

/**
 * @param {number} time
 */
AudioBufferSourceNode.prototype.noteOff = function (time) {};

/**
 * @type {AudioGain}
 */
AudioBufferSourceNode.prototype.gain;


/**
 * @constructor
 */
function AudioParam () {};

/**
 * @constructor
 * @extends {AudioParam}
 */
function AudioGain () {};

/** @type {number} */
AudioGain.prototype.value;
/**
 * @param {number} value
 * @param {number} time
 */
AudioGain.prototype.exponentialRampToValueAtTime = function(value, time) {};


/** @type {AudioContext} */
window.AudioContext

/** @type {AudioContext} */
window.webkitAudioContext;



/* Pointer API */

/**
 * @constructor
 */
function PointerLock() {};

/** @type {boolean} */
PointerLock.prototype.isLocked;

/**
 * @param {Element} element
 * @param {function()=} opt_success_callback
 * @param {function()=} opt_error_callback
 */
PointerLock.prototype.lock = function (element, opt_success_callback, opt_error_callback) {};

///** @override */
PointerLock.prototype.unlock = function () {};


/** @type {PointerLock} */
navigator.pointer;
/** @type {PointerLock} */
navigator.webkitPointer;


/** @type {number} */
MouseEvent.webkitMovementX;
/** @type {number} */
MouseEvent.webkitMovementY;

/**
 * @param {number} opt_flags
 */
Element.prototype.webkitRequestFullScreen = function (opt_flags) {};
/** @type {number} */
Element.prototype.ALLOW_KEYBOARD_INPUT;



/* Local storage */

/** @type {Storage} */
var localStorage;





/* JSON */

var JSON = {};
window.JSON = {};





/* Node.js */
var exports = {};
var global = {};
var fs = {};

/**
 * @param {!string} url
 * @param {!string} encoding
 * @param {function(*, ArrayBuffer)} callback
 */
fs.readFile = function(url, encoding, callback) {};


/**
 * @param {!string} url
 * @return {*}
 */
var require = function(url) {};


/** @type {Console} */
var console;


/**
 * @constructor
 * @extends {WebSocket}
 * @param {string} url Specifies URL to which to connect
 */
var MozWebSocket = function(url) {};

/** @type {MozWebSocket} */
window.MozWebSocket;
/** @type {WebSocket} */
window.WebSocket;

/** @type {string} */
WebSocket.binaryType;

/** @type {string} */
MozWebSocket.binaryType;


