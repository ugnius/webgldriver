
"use strict";


var GAME = {};

GAME.main = function() {
	console.log('GAME.main()');
	
	var canvas = GAME.canvas = document.getElementById('canvas');
	GAME.ctx = GAME.canvas.getContext('2d');
		
	var input = GAME.input = new Input();
	input.setAllowedKeys([input.KEY_F5, input.KEY_F12]);
	
	setInterval(GAME.loop, 33);
};

GAME.loop = function() {
	var ctx = GAME.ctx;
	var inp = GAME.input;
	
	inp.handleInput();
	
	if ( inp.wasKeyPressed(inp.KEY_C) ) {
		APP.out.innerHTML = '';
	}
	
	ctx.fillStyle = "242424";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	var s = "";
	for (var k in inp._keysDown) {
		if ( inp._keysDown[k] ) {
			s += k + ' ';
		}
	}
	
	ctx.fillStyle = "e8f8fd";
	ctx.fillText(s, 5, 400);
	
	

};
