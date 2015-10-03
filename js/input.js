/*!
 * input.js
 *
 * by Ugnius Kavaliauskas
 *
 * Date: 2012.01.30
 */

/*global KFC:true, vec3, mat4, mat3, quat4, NI, APP */

/**
 * Input handler class
 * @constructor
 */
var Input = function() {
    
    /**
     * @type {Array.<number>}
     * @private
     */
    this._allowedKeys = [];
    
    /**
     * @type {boolean}
     * @private
     */
    this._lockMouse = false;
    
    this._keysDown = [];
    this._keysPressed = [];
    this._keysReleased = [];
    this._keysPressedQueue = [];
    this._keysReleasedQueue = [];

    this._buttonsDown = [];
    this._buttonsPressed = [];
    this._buttonsReleased = [];
    this._buttonsPressedQueue = [];
    this._buttonsReleasedQueue = [];
    
    this._buttonsPressedHistory = [];
    this._buttonsPressedLast = [];

    this._mousePositionX = 0;
    this._mousePositionY = 0;
    this._mousePositionDiffX = 0;
    this._mousePositionDiffY = 0;
    this._mouseMovementX = 0;
    this._mouseMovementY = 0;
    this._mouseLastPositionX = 0;
    this._mouseLastPositionY = 0;
    this._mouseLocked = false;

    this._mouseWheelQueue = 0;
    this._mouseWheelDiff = 0;
    
    this._isFocus = true;
    this._qFocus = false;
    this._focus = false;
    this._qBlur = false;
    this._blur = false;
    
    this._gamepad = null;
    this._gamepadLast = null;
    
    this._init();
    
    this.mouseLockAPI = ( navigator.pointer || navigator.webkitPointer ) ? true : false;
    this.gamepadAPI = ( navigator.gamepads || navigator.webkitGamepads ) ? true : false;
    
};

/**
 * Initializes event callbacks
 * @private
 */
Input.prototype._init = function() {

    navigator.pointer = navigator.pointer || navigator.webkitPointer;
    
    var o = this;
    
    // suppress right click menu
    window.oncontextmenu = function() {
        return false;
    };
    
    window.onkeydown = function(e) {
        if ( !o._keysDown[e.keyCode] ) {    // TODO do button repeat
            o._keysPressedQueue[e.keyCode] = true;
        }
        o._keysDown[e.keyCode] = true;
        
        o._buttonsPressedHistory.push(e.keyCode);
        
        if (e.keyCode === o.KEY_F11 && o._lockMouse) {
            o._fullLock();
            return false;
        } else {
            if (o._allowedKeys[e.keyCode]) {
                return true;
            } else {
                return false;
            }
        }
    };

    window.onkeyup = function(e) {
        o._keysDown[e.keyCode] = false;
        o._keysReleasedQueue[e.keyCode] = true;
    };

    window.onblur = function() {
        var kc;
        for (kc in o._keysDown) {
            if ( o._keysDown.hasOwnProperty(kc) ) {
                if ( o._keysDown[kc] )
                    o._keysPressedQueue[kc] = true;
                o._keysDown[kc] = false;
            }
        }
        o._iFocus = false;
        o._qBlur = true;
    };

    window.onfocus = function() {
        o._iFocus = true;
        o._qFocus = true;
    };

    window.onmousedown = function(e) {
        if ( !o._buttonsDown[e.button] )
            o._buttonsPressedQueue[e.button] = true;
        o._buttonsDown[e.button] = true;
        
        return false;
    };
    
    window.onmouseup = function(e) {
        o._buttonsDown[e.button] = false;
        o._buttonsReleasedQueue[e.button] = true;
    };
    
    window.ondblclick = function(e) {
        return false;
    };
    
    window.onmousemove = function(e) {
        if ( o.mouseLockAPI ) {
            o._mouseMovementX += e.webkitMovementX;
            o._mouseMovementY += e.webkitMovementY;
        }
        o._mousePositionX = e.clientX;
        o._mousePositionY = e.clientY;
    };
    
    // works on Chrome
    window.addEventListener('mousewheel', function(e){
        o._mouseWheelQueue += e.wheelDelta / Math.abs(e.wheelDelta);
    }, false);
    
    // works on Firefox
    window.addEventListener('DOMMouseScroll', function(e){
        o._mouseWheelQueue -= e.detail / Math.abs(e.detail);
    }, false);
    
};

/**
 * Tries to lock mouse cursor using mouseLockAPI
 * @private
 */
Input.prototype._fullLock = function() {
    /** @type {Element} */
    var el = document.body;
    el.webkitRequestFullScreen(el.ALLOW_KEYBOARD_INPUT);
    if ( this.mouseLockAPI ) {
        navigator.pointer.lock(el,
            function() {},
            function() {throw new Error('Failed to enable pointer lock');
        });
    }
};


/**
 * Set keys which are not suppressed
 * @param {Array.<number>} allowedKeys Array of allowed key codes
 */
Input.prototype.setAllowedKeys = function(allowedKeys) {
    /** @type {number} */
    var i;
    this._allowedKeys = [];
    
    for ( i = 0; i < allowedKeys.length; i++ ) {
        this._allowedKeys[allowedKeys[i]] = true;
    }
};

/**
 * Enable or disable mouse locking when entering fullscreen mode
 * @param {boolean} enable Enable mouse locking
 */
Input.prototype.setMouseLock = function( enable ) {
    this._lockMouse = (enable === true) ? true : false;
};

/**
 * Parses all recorded inputs since last method call
 */
Input.prototype.handleInput = function() {
    this._keysPressed = this._keysPressedQueue;
    this._keysPressedQueue = {};
    this._keysReleased = this._keysReleasedQueue;
    this._keysReleasedQueue = {};

    this._buttonsPressed = this._buttonsPressedQueue;
    this._buttonsPressedQueue = {};
    this._buttonsReleased = this._buttonsReleasedQueue;
    this._buttonsReleasedQueue = {};

    if (!this.mouseLockAPI || !navigator.pointer.isLocked) { 
        this._mousePositionDiffX = this._mousePositionX - this._mouseLastPositionX;
        this._mousePositionDiffY = this._mousePositionY - this._mouseLastPositionY;
        this._mouseLastPositionX = this._mousePositionX;
        this._mouseLastPositionY = this._mousePositionY;
    } else {
        this._mousePositionDiffX = this._mouseMovementX;
        this._mousePositionDiffY = this._mouseMovementY;
        this._mouseMovementX = 0;
        this._mouseMovementY = 0;
    }
    
    this._blur = this._qBlur;
    this._focus = this._qFocus;
    this._qBlur = this._qFocus = false;
    
    this._mouseWheelDiff = this._mouseWheelQueue;
    this._mouseWheelQueue = 0;
    
    this._buttonsPressedLast = this._buttonsPressedHistory;
    this._buttonsPressedHistory = [];    
};


/**
 * Pools gamepad data
 */
Input.prototype.poolGamepad = function() {
    if ( this.gamepadAPI ) {
        var gamepads = navigator.gamepads || navigator.webkitGamepads;
        var pad = gamepads[0];
        var i = 0;
        if ( pad !== undefined ) {
            //this._gamepadLast = this._gamepad;
            if ( this._gamepadLast === null ) {
                this._gamepadLast = {};
                this._gamepadLast.buttons = [];
                this._gamepadLast.axes = [];
            }
            if ( this._gamepad === null ) {
                this._gamepad = {};
                this._gamepad.buttons = [];
                this._gamepad.axes = [];
            }
            
            if ( this._gamepad ) {
                for ( i = 0; i < 16; i++ ) { this._gamepadLast.buttons[i] = this._gamepad.buttons[i]; }
                for ( i = 0; i < 4; i++ ) { this._gamepadLast.axes[i] = this._gamepad.axes[i]; }
            }
            
            for ( i = 0; i < 16; i++ ) { this._gamepad.buttons[i] = pad.buttons[i]; }
            for ( i = 0; i < 4; i++ ) { this._gamepad.axes[i] = pad.axes[i]; }
        }
    }
};


Input.prototype.handleText = function(text) {
    var i;
    for ( i = 0; i < this._buttonsPressedLast.length; i++ ) {
        var s = this.getSymbol_(this._buttonsPressedLast[i]);
        if ( s !== '' ) {
            text += s;
        }        
        if ( this._buttonsPressedLast[i] === this.KEY_BACKSPACE ) {
            text = text.slice(0, text.length-1);
        }
    }    
    return text;
};

Input.prototype.getSymbol_ = function( key ) {
    
    switch (key) {
        case this.KEY_A: return 'a';
        case this.KEY_B: return 'b';
        case this.KEY_C: return 'c';
        case this.KEY_D: return 'd';
        case this.KEY_E: return 'e';
        case this.KEY_F: return 'f';
        case this.KEY_G: return 'g';
        case this.KEY_H: return 'h';
        case this.KEY_I: return 'i';
        case this.KEY_J: return 'j';
        case this.KEY_K: return 'k';
        case this.KEY_L: return 'l';
        case this.KEY_M: return 'm';
        case this.KEY_N: return 'n';
        case this.KEY_O: return 'o';
        case this.KEY_P: return 'p';
        case this.KEY_Q: return 'q';
        case this.KEY_R: return 'r';
        case this.KEY_S: return 's';
        case this.KEY_T: return 't';
        case this.KEY_U: return 'u';
        case this.KEY_V: return 'v';
        case this.KEY_W: return 'w';
        case this.KEY_X: return 'x';
        case this.KEY_Y: return 'y';
        case this.KEY_Z: return 'z';
        case this.KEY_1: return '1';
        case this.KEY_2: return '2';
        case this.KEY_3: return '3';
        case this.KEY_4: return '4';
        case this.KEY_5: return '5';
        case this.KEY_6: return '6';
        case this.KEY_7: return '7';
        case this.KEY_8: return '8';
        case this.KEY_9: return '9';
        case this.KEY_0: return '0';
    }
    
    return '';
};


/**
 * Returns true if key was pressed in last frame
 * @param {number} key Key code
 * @return {boolean}
 */
Input.prototype.wasKeyPressed = function(key) {
    return (this._keysPressed[key] === true) ? true : false;
};

/**
 * Returns true if key was pressed in last frame
 * @param {number} key Key code
 * @return {boolean}
 */
Input.prototype.wasKeyReleased = function(key) {
    return (this._keysReleased[key] === true) ? true : false; 
};

/**
 * Returns true if key is pressed down
 * @param {number} key Key code
 * @return {boolean}
 */
Input.prototype.isKeyDown = function(key) {
    return (this._keysDown[key] === true) ? true : false;
};

Input.prototype.wasButtonPressed = function(but) {
    return this._buttonsPressed[but];
};
Input.prototype.wasButtonReleased = function(but) {
    return this._buttonsReleased[but];
};
Input.prototype.isButtonDown = function(but) {
    return this._buttonsDown[but];
};

Input.prototype.isMouseLocked = function() {
    return (this.mouseLockAPI && navigator.pointer.isLocked);
};

Input.prototype.mousePositionX = function() {
    return this._mouseLastPositionX;
};
Input.prototype.mousePositionY = function() {
    return this._mouseLastPositionY;
};
Input.prototype.mousePositionDiffX = function() {
    return this._mousePositionDiffX;
};
Input.prototype.mousePositionDiffY = function() {
    return this._mousePositionDiffY;
};

Input.prototype.mouseWheelDiff = function() {
    return this._mouseWheelDiff;
};

/**
 * Returns true if browser window has focus, false if not
 * @return {boolean}
 */
Input.prototype.hasFucus = function() {
    return this._focus;
};

/**
 * Returns true if window got onblur event on last frame
 * @return {boolean}
 */
Input.prototype.wasBlur = function() {
    return this._blur;
};

/**
 * Return true if window got onfocus event on last frame
 * @return {boolean}
 */
Input.prototype.wasFocus = function() {
    return this._focus;
};

/**
 * Returns state of gamepad Axis
 * @param {number} axis Gamepad axis code
 * @return {number} Axis state value
 */
Input.prototype.gamepadAxis = function(axis) {
    if ( this._gamepad && this._gamepad.axes && this._gamepad.axes[axis] !== undefined ) {
        return this._gamepad.axes[axis];
    }
    return 0;
};

/**
 * Returns state of gamepad button
 * @param {number} button Gamepad button code
 * @return {number} Button state value
 */
Input.prototype.gamepadButton = function(button) {
    if ( this._gamepad && this._gamepad.buttons && this._gamepad.buttons[button] !== undefined) {
        return this._gamepad.buttons[button];
    }
    return 0;
};

/**
 * Returns state of gamepad button
 * @param {number} button Gamepad button code
 * @return {boolean} Button state value
 */
Input.prototype.wasGamepadButtonPressed = function(button) {
    var g = this._gamepad,
        l = this._gamepadLast;
        
    if ( g && g.buttons && g.buttons[button] !== undefined) {
        if ( l && l.buttons && l.buttons[button] !== undefined) {
            if ( l.buttons[button] <= 0.1 && g.buttons[button] > 0.1 ) {
                return true;
            }
        }
    }
    return false;
};


// Keyboard, button codes

/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F1 = 112;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F2 = 113;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F3 = 114;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F4 = 115;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F5 = 116;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F6 = 117;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F7 = 118;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F8 = 119;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F9 = 120;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F10 = 121;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F11 = 122;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F12 = 123;

/** @constant
 *  @type {number}
 */ Input.prototype.KEY_0 = 48;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_1 = 49;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_2 = 50;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_3 = 51;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_4 = 52;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_5 = 53;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_6 = 54;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_7 = 55;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_8 = 56;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_9 = 57;

/** @constant
 *  @type {number}
 */ Input.prototype.KEY_A = 65;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_B = 66;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_C = 67;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_D = 68;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_E = 69;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_F = 70;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_G = 71;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_H = 72;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_I = 73;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_J = 74;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_K = 75;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_L = 76;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_M = 77;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_N = 78;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_O = 79;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_P = 80;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_Q = 81;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_R = 82;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_S = 83;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_T = 84;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_U = 85;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_V = 86;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_W = 87;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_X = 88;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_Y = 89;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_Z = 90;

/** @constant
 *  @type {number}
 */ Input.prototype.KEY_LEFT = 37;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_RIGHT = 39;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_UP = 38;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_DOWN = 40;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_SPACE = 32;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_ENTER = 13;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_BACKSPACE = 8;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_ESCAPE = 27;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_SHIFT = 16;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_CTRL = 17;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_ALT = 18;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_TAB = 9;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_CAPSLOCK = 20;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_TILDE = 192;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_PAUSE = 19;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_LESS_THAN = 188;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_GREATER_THAN = 190;

/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_0 = 96;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_1 = 97;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_2 = 98;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_3 = 99;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_4 = 100;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_5 = 101;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_6 = 102;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_7 = 103;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_8 = 104;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_9 = 105;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_STAR = 106;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_PLUS = 107;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_MINUS = 109;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_DOT = 110;
/** @constant
 *  @type {number}
 */ Input.prototype.KEY_NUM_SLASH = 111;

// Mouse buttons

/** @constant
 *  @type {number}
 */ Input.prototype.BUTTON_LEFT = 0;
/** @constant
 *  @type {number}
 */ Input.prototype.BUTTON_MIDDLE = 1;
/** @constant
 *  @type {number}
 */ Input.prototype.BUTTON_RIGHT = 2;
 
// Gamepad buttons
 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_A = 0;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_B = 1;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_X = 2;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_Y = 3;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_LB = 4;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_RB = 5;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_LT = 6;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_RT = 7; 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_BACK = 8;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_START = 9; 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_LS = 10;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_RS = 11; 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_UP = 12;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_DOWN = 13; 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_LEFT = 14;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_RIGHT = 15;
 
// Gamepad axes
 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_AXIS_LX = 0;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_AXIS_LY = 1; 
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_AXIS_RX = 2;
/** @constant
 *  @type {number}
 */ Input.prototype.PAD_AXIS_RY = 3;
 
 
 
 
 
 
 
 
 
 
 
