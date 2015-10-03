
/*global KFC, Input, NI, APP */

/**
 * Holds main game logic and supportive functions
 * @namespace
 */
var BGAME = {};

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
	BGAME.vinetting = true;
	BGAME.fieldOfView = false;
	BGAME.focus = 0.15;
	BGAME.mute = false;
	BGAME.camMode = 1;	// 0-free, 1-follow
	BGAME.audioGain = 0.5;
	BGAME.canvasScale = 1.0;
	BGAME.renderDis = 10; // 1 - min, 10 - max
	
	BGAME.activeScreen = null;
	BGAME.serverState = 0;	// 0 - not connected, 1 - sent login data, 2 - sent registration data, 3 - gameplay, 4 - shop
	
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
    
    BGAME.canvas = document.getElementById('canvas');
    BGAME.glc = new KFC.CGLC(BGAME.canvas, {'antialias': false});
    if (BGAME.glc === null) { return; }	// TOOD : error handle

	
    window.addEventListener('resize', BGAME.fresize, false);
    BGAME.fresize();
	
	BGAME.audio = new KFC.Audio();
	BGAME.audio.setGain(BGAME.audioGain);
	
	//
	BGAME.glc.getFramebuffer('depth', true);	// preallocates FBOS
	BGAME.glc.getFramebuffer('scene');
	//
	
	// Network stuff
	//if ( !BGAME.offline ) {
		NI.init(BGAME.wsurl);
	//}
	
//	// camera
//    BGAME.camera = new KFC.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 5000);
//	var cs = localStorage.getItem("camera1");	// load camera state from Local storage
//	if ( cs ) {
//		cs = JSON.parse(cs);
//		BGAME.camera.setPosition(cs.pos[0], cs.pos[1], cs.pos[2]);
//		BGAME.camera.setRotation(cs.rot[0], cs.rot[1], cs.rot[2]);
//	} else {
//		BGAME.camera.setPosition(0, 20, 30);
//		BGAME.camera.setRotation(-0.4, 0, 0);
//	}
//	vec3.set( [0, 0, 0], BGAME.camera.vel );
//    
	
	
	// SCENE
	//BGAME.scene = new KFC.Scene();  // scene with simple lighting
	//BGAME.scene.autoclear = true;
	//BGAME.scene.uniforms['uAmbientColor'] = [0.5, 0.5, 0.5];
	//BGAME.scene.uniforms['uDirColor'] = [0.5, 0.5, 0.5];
	//BGAME.scene.uniforms['uLightDirection'] = [0.507, -0.407, 0.30];

//    var mesh;
//	var shader;
//    var object;
//	var tex;
	
	// flying cubes
//	mesh = new KFC.BoxMesh(BGAME.glc.gl, 0.2, 0.2, 0.2);
//	BGAME.cube1 = object = new KFC.Object3D(mesh, BGAME.glc.shaders['normal']);
//    object.uniforms.uColor = [1.0, 0.0, 1.0, 1];
//    BGAME.scene.add(object);
	
	
		//console.log('mesh loaded');
	
	// Terrain
	//
	//tex = new KFC.Texture(BGAME.glc.gl, 'textures/isl.png');
	//mesh = new KFC.ObjMesh(BGAME.glc.gl, 'obj/isl.obj', tex.tex, true, function () {
	//	BGAME.ncar.pos_wc[1] = BGAME.terr.mesh.root.yAt(BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[2]).r + 2.0;
	//	BGAME.ncar.coll = BGAME.terr;
		
		//var obj;
		//var cnt = 0;
		//
		//var boxs = [];
		//boxs.push(BGAME.terr.mesh.root);
		//
		//while ( cnt < 200 && boxs.length > 0 ) {
		//	
		//	var r = boxs.shift();
		//	
		//	if ( !r ) { continue; }
		//	
		//	if ( r.z !== null ) { boxs.push(r.z); }
		//	if ( r.o !== null ) { boxs.push(r.o); }
		//	
		//	//if ( r.level !== 30 ) { continue; }
		//	
		//	obj = new KFC.Obj3D(new KFC.LineAABBox(BGAME.glc.gl, r.min[0], r.min[1], r.min[2], r.max[0], r.max[1], r.max[2] ),
		//						BGAME.glc.shaders['color']);
		//	BGAME.scene.add(obj);
		//	
		//	cnt++;
		//};
		
	//});	// build qtree, place car on specified height on finish
	//
	//BGAME.terr = new KFC.Obj3D(mesh, BGAME.glc.shaders['terrain']);
	//BGAME.scene.add(BGAME.terr);
	
	// Main car
	//if ( BGAME.offline ) {
	//	var ci = [2, 3, 4, 5, 6, 9];
	//	//ci = [6];
	//	BGAME.ncar = new KFC.Car( ci[Math.floor(Math.random() * 1e10) % ci.length] );
	//	BGAME.ncarm = new KFC.CarModel(BGAME.ncar, BGAME.glc);
	//	BGAME.scene.add(BGAME.ncarm);
	//	BGAME.ncar.coll = BGAME.terr;
	//}

	// GUI STUFF, ortho camera etc...	
	// in junk.js	
	
	
	// DEBUG TEXT
	BGAME.help = document.getElementById('help');
	//BGAME.help.style.display = 'inline';
	
	BGAME.debug = document.getElementById('debug');
	//BGAME.debug.style.display = 'none';
	
	BGAME.debug2 = document.getElementById('debug2');
	BGAME.debug2.style.display = 'none';
	
	
	BGAME.activeScreen = new KFC.SCMain(BGAME);
	
	BGAME.activeScreen.load( function() {
		
		//console.log('SCMain, loaded');

		APP.out.style.display = 'none';
		
		window.requestAnimationFrame(BGAME.tick, BGAME.canvas);
		//setTimeout(BGAME.tick, 1);
			
	});
	
    //setTimeout(BGAME.tick, 0);
    //requestAnimationFrame(BGAME.tick, BGAME.canvas);
    
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
		'renderDis':	BGAME.renderDis
		};
	localStorage.setItem('settings', window.JSON.stringify(set));
};


BGAME.loadSettings = function() {
	if ( typeof localStorage === 'undefined' ) { return; }
	
	var set = String(localStorage.getItem('settings'));
	if ( set ) {
		set = window.JSON.parse(set);
		if ( set ) {
			if ( set.fieldOfView !== undefined ) { BGAME.fieldOfView = set.fieldOfView; }
			if ( set.camMode !== undefined ) { BGAME.camMode = set.camMode; }
			if ( set.audioGain !== undefined ) { BGAME.audioGain = set.audioGain; }
			if ( set.canvasScale !== undefined ) { BGAME.canvasScale = set.canvasScale; }
			if ( set.renderDis !== undefined ) { BGAME.renderDis = set.renderDis; }
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
	
    //BGAME.update(time);
    //BGAME.draw();
    
	
	//BGAME.debug.innerHTML = 'LOADED: ' + BGAME.loaded + '<br/>'
	//						+ 'RENDERED: ' + BGAME.rendered + '</br>';
	
	//BGAME.debug.innerHTML = 'iframe: ' + BGAME.activeScreen.iframe + '<br/>'
	//						+ 'rframe: ' + BGAME.activeScreen.rframe + '<br/>';
	
	if ( BGAME.input.wasKeyPressed(BGAME.input.KEY_F1) ) {
        if ( BGAME.help.style.display === 'none' ) {
            BGAME.help.style.display = 'block';
        } else {
            BGAME.help.style.display = 'none';
        }
    }
	
	BGAME.rendered = 0;
	
    BGAME.frame++;
	
    //setTimeout(BGAME.tick, 1);
    window.requestAnimationFrame(BGAME.tick, BGAME.canvas);
};



/*
BGAME.draw = function() {

    var glc = BGAME.glc;
	
	glc.resizeFrameBuffers();	// resize frame buffers if needed
	
	//glc.gl.clear(glc.gl.COLOR_BUFFER_BIT | glc.gl.DEPTH_BUFFER_BIT);
    
	if ( BGAME.fieldOfView === true ) {
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.framebuffers['scene'].fb);	// select 'scene' framebuffer
		//glc.gl.clear(glc.gl.COLOR_BUFFER_BIT | glc.gl.DEPTH_BUFFER_BIT);			// clear 'scene' framebuffer 
		glc.render(BGAME.scene, BGAME.camera);										// render scene colors to buffer
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.framebuffers['depth'].fb);	// select 'depth' frambuffer
		glc.renderDepth(BGAME.scene, BGAME.camera);									// render scene depth
		
		glc.gaussianBlurr(glc.framebuffers['scene'], glc.framebuffers['depth'], null, 1.0/512.0, BGAME.focus);	// field of view gaussblurr depending on distance
	} else {
		glc.render(BGAME.scene, BGAME.camera);	// just render to screeen
	}
	
	
	if ( BGAME.vinetting === true ) {
		glc.addVignette();
	}
	
	//glc.render(BGAME.guiScene, BGAME.guiCamera);	// any GUI stuff
    
};
*/

/*
BGAME.update = function() {
	var time, dt, input, intStep,
		moveSpeed, mouseSpeed,
		ma, i, ci, c,
		cs,
		data, ua, id, ocar, nap,
		alr, car;
	
	time = (new Date()).getTime();
	dt = (time - BGAME.time)/1000;
	if ( dt > 0.25 ) {
		console.log('lag ' + dt);
		dt = 0.25;
	}
	BGAME.time = time;	
	if ( !BGAME.freeze ) {// freeze
		BGAME.acc += dt;
	}
		
    input = BGAME.input;
    moveSpeed = 10 * dt;
	mouseSpeed = 0.0025;	
	intStep = BGAME.intStep;	// integration step
	
    if ( input.wasKeyPressed(input.KEY_F) ) {
		BGAME.freeze = !BGAME.freeze;
	}
	
	if ( input.wasKeyPressed(input.KEY_L) ) {
		
		
		if ( BGAME.offline ) {
			console.log('online');
			
			NI.init(BGAME.wsurl);
			
			if ( BGAME.ncarm ) {
				BGAME.ncarm.removeFromScene(BGAME.scene);
				BGAME.ncar = undefined;
				BGAME.ncarm = undefined;
			}
			
		} else {
			console.log('offline');
			NI.close();
			
			if ( !BGAME.ncar ) {
				ci = [2, 3, 4, 5, 6, 9];
				//ci = [6];
				BGAME.ncar = new KFC.Car( ci[Math.floor(Math.random() * 1e10) % ci.length] );
				BGAME.ncarm = new KFC.CarModel(BGAME.ncar, BGAME.glc);
				BGAME.scene.add(BGAME.ncarm);
				BGAME.ncar.coll = BGAME.terr;
			}
			
			// remove other cars
			for ( i = 0; i < BGAME.carsm.length; i++ ) {
				if ( BGAME.carsm[i] === null ) { continue; }
				BGAME.carsm[i].removeFromScene(BGAME.scene);
				BGAME.carsm[i] = null;
			}
			for ( i = 0; i < BGAME.carsm.length; i++ ) {
				if ( BGAME.cars[i] === null ) { continue; }
				BGAME.cars[i] = null;
			}
			
		}
		
		BGAME.offline = !BGAME.offline;
		
	}
  
	
	// Output console
    if ( input.wasKeyPressed(input.KEY_TILDE) ) {
        if ( APP.out.style.display === 'none' ) {
            APP.out.style.display = 'block';
        } else {
            APP.out.style.display = 'none';
        }
    }
		// Output console
    if ( input.wasKeyPressed(input.KEY_F1) ) {
        if ( BGAME.help.style.display === 'none' ) {
            BGAME.help.style.display = 'block';
        } else {
            BGAME.help.style.display = 'none';
        }
    }
	
	
	if ( input.wasKeyPressed(input.KEY_SPACE) ) {	// save camera state
		cs = {pos:BGAME.camera.position, rot:BGAME.camera.rotation};
		localStorage.setItem("camera1", JSON.stringify(cs));
	}
	
	if ( BGAME.ncar ) {
		BGAME.carControl(BGAME.ncar, BGAME.input, dt);
		
		if ( input.gamepadAPI ) {	// Joystick controls
			if ( input.gamepadButton(6) > 0.02 || false) {
				BGAME.ncar.brakes = input.gamepadButton(6);
			}
			if ( input.gamepadButton(7) > 0.02 || false) {
				BGAME.ncar.throttle = input.gamepadButton(7);
			}
			
			if ( Math.abs(input.gamepadAxis(0)) > 0.05 || false) {
				BGAME.ncar.steerAngle = -input.gamepadAxis(0);
			}
			
		}
	
	}
	
	BGAME.focus += input.mouseWheelDiff() * 0.01;

	

	
	
	// Web Sockets stuff
    ma = NI.getLast();
    while ((i = ma.pop()) !== undefined) {
        //console.log(ma);
		
		data = ma[i];
		
		BGAME.lastUpdate = (new Date()).getTime();		
		
		if ( typeof(data) === 'object' ) {
			
			ua = new Uint8Array( data, 0, 12 );
			
			//console.log(ua);
			
			if ( ua[0] === 67 && ua[1] === 68 ) {
				
				id = ua[2]*256 + ua[3];
				
				if ( id === BGAME.id ) {	// own id
					
					if ( BGAME.ncar === undefined ) { // no car spawned yet
						
						BGAME.ncar = new KFC.Car( ua[8] );
						BGAME.ncarm = new KFC.CarModel(BGAME.ncar, BGAME.glc);
						BGAME.ncar.coll = BGAME.terr;
						BGAME.scene.add(BGAME.ncarm);
						
					}					
					
					BGAME.ncar.setData( data, 8 );
					
				} else {
					ocar = BGAME.cars[id];
					if ( ocar === undefined || ocar === null ) { // no car spawned yet
						
						ocar = BGAME.cars[id] = new KFC.Car( ua[8] );
						BGAME.carsm[id] = new KFC.CarModel(ocar, BGAME.glc);
						ocar.coll = BGAME.terr;
						BGAME.scene.add(BGAME.carsm[id]);
					}
					
					ocar.setData( data, 8 );
					
				}
			}
			
		} else {
		
			c = ma[i].substring(0, 4);
			if ( c === 'NCP ' ) {    // new car position
				//console.log(ma[i]);
				nap = ma[i].slice(4,ma[i].length);
				nap = nap.split(',',64);
	
				id = parseInt(nap[0], 10);
				
				//console.log(id);
				
				if ( id !== BGAME.id ) {	// it's you !!!!
					ocar = BGAME.cars[id];
					//if ( ocar === undefined ) {
					//	console.log("New car found! " + id);
					//	ocar = new KFC.CarModel(BGAME.glc.gl);
					//	BGAME.cars[id] = ocar;
					//	BGAME.scene.add(ocar);
					//}
					//ocar.pos_wc[0] = parseFloat(nap[1]);
					//ocar.pos_wc[0] = parseFloat(nap[2]);
					//ocar.pos_wc[0] = parseFloat(nap[3]);
					
					
					//ocar.vel_wc.set3f(parseFloat(nap[4]),
					//				  parseFloat(nap[5]),
					//				  parseFloat(nap[6]));
					//ocar.wfl.vrot = parseFloat(nap[7]);
					//ocar.wfr.vrot = parseFloat(nap[8]);
					//ocar.wrl.vrot = parseFloat(nap[9]);
					//ocar.wrr.vrot = parseFloat(nap[10]);				
					//ocar.engine.vel = parseFloat(nap[11]);
					//ocar.angle_wc = parseFloat(nap[12]);
					
				} else {	// some other car
					BGAME.ncar.pos_wc[0] = parseFloat(nap[1]);
					BGAME.ncar.pos_wc[1] = parseFloat(nap[2]);
					BGAME.ncar.pos_wc[2] = parseFloat(nap[3]);
					BGAME.ncar.vel_wc[0] = parseFloat(nap[4]);
					BGAME.ncar.vel_wc[1] = parseFloat(nap[5]);
					BGAME.ncar.vel_wc[2] = parseFloat(nap[6]);
					BGAME.ncar.rot[0] = parseFloat(nap[7]);
					BGAME.ncar.rot[1] = parseFloat(nap[8]);
					BGAME.ncar.rot[2] = parseFloat(nap[9]);
					BGAME.ncar.rot[3] = parseFloat(nap[10]);
					BGAME.ncar.wheels[0].vrot = parseFloat(nap[11]);
					BGAME.ncar.wheels[1].vrot = parseFloat(nap[12]);
					BGAME.ncar.wheels[2].vrot = parseFloat(nap[13]);
					BGAME.ncar.wheels[3].vrot = parseFloat(nap[14]);
					
					BGAME.ncar.engine.vel = parseFloat(nap[15]);
					
					//console.log( parseFloat(nap[12]) + ' ' + parseFloat(nap[13]) );
				//	BGAME.car.vel_wc.set3f(parseFloat(nap[4]),
				//						   parseFloat(nap[5]),
				//						   parseFloat(nap[6]));
				//	BGAME.car.wfl.vrot = parseFloat(nap[7]);
				//	BGAME.car.wfr.vrot = parseFloat(nap[8]);
				//	BGAME.car.wrl.vrot = parseFloat(nap[9]);
				//	BGAME.car.wrr.vrot = parseFloat(nap[10]);
				//	BGAME.car.angle_wc = parseFloat(nap[12]);
				//	
				}
				
				
				//console.log(parseFloat(nap[0]) + ' ' +
				//			parseFloat(nap[1]) + ' ' +
				//			parseFloat(nap[2]) + ' ' +
				//			parseFloat(nap[3]) + ' ' +
				//			parseFloat(nap[4]) + ' ' +
				//			parseFloat(nap[5]) + ' ' +
				//			parseFloat(nap[6]) + ' ' +
				//			parseFloat(nap[7]) + ' ' +
				//			parseFloat(nap[8]) );
				
				//aa[nap[0]].dir = nap[4];
				
				
			} else if ( c === 'HID ' ) { // Hello, your id is
				alr = ma[i].slice(4,ma[i].length);
				alr = alr.split(',',1);
				BGAME.id = parseInt(alr[0], 10);
				
				console.log("New ID: " + BGAME.id);
			} else if ( c === 'OUT ' ) {
				alr = ma[i].slice(4,ma[i].length);
				alr = alr.split(',',1);
				id = parseInt(alr[0], 10);
				
				BGAME.carsm[id].removeFromScene(BGAME.scene);
				
				BGAME.cars[id] = null;
				BGAME.carsm[id] = null;
			} else if ( c === 'CNT ') {
				
				alr = ma[i].slice(4,ma[i].length);
				alr = alr.split(',',4);
				
				id = parseInt(alr[0], 10);
				car = BGAME.cars[id];
				
				car.throttle = parseFloat(alr[1]);
				car.brakes = parseFloat(alr[2]);
				car.steerAngle = parseFloat(alr[3]);
				
			} else {
				if ( ma[i].length > 256 ) {
					console.log('got unknown code message: ' + ma[i].substring(0,256) + '...');
				} else {
					console.log('got unknown code message: ' + ma[i]);
				}
			}
		}
    }
	
	if ( BGAME.ncar ) {
		
		car = BGAME.ncar;
		
		// send car controls if they changed
		if ( BGAME.oldt !== car.throttle || BGAME.oldb !== car.brakes || BGAME.olda !== car.steerAngle ) {
			NI.send('CNT '+ car.throttle + ',' + car.brakes + ',' + car.steerAngle );
			
			BGAME.oldt = car.throttle;
			BGAME.oldb = car.brakes;
			BGAME.olda = car.steerAngle;
		}
		
		
		if ( BGAME.input.wasKeyPressed(BGAME.input.KEY_NUM_PLUS) ) {
			BGAME.ncar.pos_wc[1] += 2.0;
		}
	
		if ( BGAME.input.wasKeyPressed(BGAME.input.KEY_NUM_MINUS) ) {
			BGAME.ncar.pos_wc[1] -= 2.0;
		}
	}
	
	if ( BGAME.input.wasKeyPressed(BGAME.input.KEY_C) ) {
		BGAME.camMode++;
		if ( BGAME.camMode > 1 ) { BGAME.camMode = 0; }
	}

		
	while ( BGAME.acc >= intStep ) { // Euler integration, with intStep time steps
		

		BGAME.cnt = 0;
	
		BGAME.acc -= intStep;
		
		//if ( ((new Date()).getTime() - BGAME.lastUpdate) < 1000 || BGAME.offline )	// integrate if last update was less than second before or game is offline
		//	BGAME.car.integrate(intStep);
		//	
		//for ( c in BGAME.cars ) {		// integrate other cars
		//	BGAME.cars[c].integrate(intStep);
		//}

		
		// new CAR --------------------------------
		
		if ( typeof(BGAME.terr.mesh.root) === 'object' ) {	// wait for terrain collision tree
			
			if ( BGAME.ncar ) {
			
				BGAME.ncar.integrate(BGAME.intStep);
			}

			for ( i = 0; i < BGAME.cars.length; i++ ) {
				if ( BGAME.cars[i] === null ) { continue; }
				BGAME.cars[i].integrate(BGAME.intStep);
			}
			
		//BGAME.cube1.setPosition(BGAME.ncar.pos_wc[0],
		//						.r,
		//						BGAME.ncar.pos_wc[2] + 4);	
			
			//BGAME.ncar.pos_wc[1] = BGAME.terr.mesh.root.yAt(BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[2]).r + 0.5;
			
			
		}
		
		// follow camera
		if ( BGAME.camMode === 1 && BGAME.ncar ) {
			var f = 0;
			var d = 0;
			KFC.vec3.addscaled(BGAME.camera.position, BGAME.camera.vel, BGAME.intStep );		
			d = vec3.dist(BGAME.camera.position, BGAME.ncar.pos_wc);		
			f = 40 * (d - 10);
			var tv = vec3.create();
			vec3.direction(BGAME.camera.position, BGAME.ncar.pos_wc, tv);
			KFC.vec3.addscaled(BGAME.camera.vel, tv, -f * BGAME.intStep );
			vec3.scale(BGAME.camera.vel, 0.990);
			BGAME.camera.position[1] = BGAME.ncar.pos_wc[1] + 3;
			
			//if ( typeof(BGAME.terr.mesh.root) == "object" ) {
			//	var tv1 = vec3.create();
			//	vec3.direction(BGAME.camera.position, [BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[1]+1, BGAME.ncar.pos_wc[2]], tv1);
			//	var cd = BGAME.terr.mesh.root.rayTest([BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[1]+1, BGAME.ncar.pos_wc[2]],
			//										  tv1, 15 );
			//	if ( cd !== false ) {
			//		dis = cd.dis;
			//		if ( dis < 10 ) {
			//			KFC.vec3.addscaled([BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[1]+1, BGAME.ncar.pos_wc[2]], tv1, cd.dis, BGAME.camera.position);
			//		}
			//	}
			//	
			//}
			
		}
		
		BGAME.iframe++;
		
				
	}
	
	var dis = -1;
	
	// mouse pointer collision code
	if ( typeof(BGAME.terr.mesh.root) == "object" ) {	// wait for terrain collision tree
	
		var dir = vec3.create([0, 0, -1]);
		var hrot = BGAME.camera.rotation[0];
		var vrot = BGAME.camera.rotation[1];
		
		var mhrot = (BGAME.glc.height/2 - BGAME.input.mousePositionY()) / BGAME.glc.height * BGAME.camera.fov / 180 * Math.PI;
		var mvrot = (BGAME.glc.width/2 - BGAME.input.mousePositionX()) / BGAME.glc.width * BGAME.camera.fov / 180 * Math.PI * BGAME.camera.aspect;
		
		var td = vec3.create(dir);			
		var sin, cos;
		
					
		
		sin = Math.sin(mhrot);
		cos = Math.cos(mhrot);
		dir[1] = td[1] * cos - td[2] * sin;
		dir[2] = td[1] * sin + td[2] * cos;
		
		vec3.set(dir, td);
		sin = Math.sin(-mvrot);
		cos = Math.cos(-mvrot);
		dir[0] = td[0] * cos - td[2] * sin;
		dir[2] = td[0] * sin + td[2] * cos;
		
		
		vec3.set(dir, td);
		sin = Math.sin(hrot);
		cos = Math.cos(hrot);
		dir[1] = td[1] * cos - td[2] * sin;
		dir[2] = td[1] * sin + td[2] * cos;
		
		vec3.set(dir, td);
		sin = Math.sin(-vrot);
		cos = Math.cos(-vrot);
		dir[0] = td[0] * cos - td[2] * sin;
		dir[2] = td[0] * sin + td[2] * cos;
		
		
		vec3.normalize(dir);
		//console.dir(dir);
		var m = BGAME.terr.mesh;
		var cd = m.root.rayTest([BGAME.camera.position[0], BGAME.camera.position[1], BGAME.camera.position[2]],
											  dir,
											  100);
		
		if ( cd !== false ) {
			BGAME.cube1.setPosition(m.cp[0], m.cp[1], m.cp[2]);
			dis = m.dis;
			
			//if ( BGAME.iframe === 200 ) {
			//	console.dir(m);
			//}
		}
	
	}
	
	
    // move player camera around
	if ( BGAME.camMode === 0 || BGAME.ncar === undefined ) {
		BGAME.FFCamera(BGAME.camera, input, dt);
	} else if ( BGAME.camMode === 1 ) {

		BGAME.camera.lookAt(BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[1]+1, BGAME.ncar.pos_wc[2]);
	}
	
	if ( BGAME.actx && BGAME.ncar ) { // Audio context
		
		BGAME.aupdate();
		
		// TODO: rotate sound
		
		BGAME.apa.setPosition((BGAME.ncar.pos_wc[0]-BGAME.camera.position[0])*0.2,
							  (BGAME.ncar.pos_wc[1]-BGAME.camera.position[1])*0.2,
							  (BGAME.ncar.pos_wc[2]-BGAME.camera.position[2])*0.2);
	}
	
	//BGAME.line1.mesh.orgin = car.pos_wc.copy();
	//BGAME.line1.mesh.point = car.vel_wc.copy();
	//BGAME.line1.mesh.apply();
	
	//BGAME.line2.mesh.orgin = car.pos_wc.copy();
	//BGAME.line2.mesh.point = new KFC.Vector(0, car.angular_vel, 0);
	//BGAME.line2.mesh.apply();
	
	//BGAME.line3.mesh.apply();
	
	//BGAME.debug.innerHTML = BGAME.car.vel_wc + '<br/>'
	//						+ ((new Date()).getTime() - BGAME.lastUpdate) + 'ms<br/>';
	
	//var s;
	//s = BGAME.s1;
	//
	//s.r = BGAME.car.vel_wc.length()/100;
	//s.mesh.v = [s.c.y+s.r, s.c.y-s.r, s.c.x-s.r, s.c.x+s.r];
	//s.mesh.apply();
	//
	//var f = {'x':car.vel_wc.x/100, 'z':car.vel_wc.z/100};
	//BGAME.s2.mesh.v = [s.c.y+f.z+0.005, s.c.y+f.z-0.005, s.c.x+f.x-0.005, s.c.x+f.x+0.005];
	//BGAME.s2.mesh.apply();
	
	
	if ( BGAME.ncar ) {
	var gs = ["R", "N", "1", "2", "3", "4", "5", "6"];
	var wspeed = (BGAME.ncar.wheels[1].vrot * BGAME.ncar.wheels[1].radius + BGAME.ncar.wheels[0].vrot * BGAME.ncar.wheels[0].radius) / 2 * 3.6; // m/s 
	BGAME.debug2.innerHTML = gs[BGAME.ncar.gear+1] + '<br/>'
							+ Math.floor(wspeed) + ' kph<br/>'
							+ BGAME.cnt + ' tq<br/>'
							+ dis.toFixed(3) + ' dis<br/>'
							+ Math.floor(BGAME.ncar.engine.vel*30/Math.PI) + ' rpm<br/>'
							+ ((new Date()).getTime() - BGAME.lastUpdate) + ' <br/>';
	}
							
							
	//if ( typeof(BGAME.terr.mesh.root) == "object" ) {
	//	BGAME.debug2.innerHTML = BGAME.terr.mesh.root.yAt(BGAME.ncar.pos_wc[0],
	//													  BGAME.ncar.pos_wc[2]) + '<br/>';
	//	BGAME.cube1.setPosition(BGAME.ncar.pos_wc[0],
	//							BGAME.terr.mesh.root.yAt(BGAME.ncar.pos_wc[0], BGAME.ncar.pos_wc[2]),
	//							BGAME.ncar.pos_wc[2]);	
	//}
	
	
	
	// update car cube matrices
	//car.updateMatrices();
	//
	for ( c in BGAME.carsm ) {
		if ( BGAME.carsm[c] === null ) { continue; }
		BGAME.carsm[c].updateMatrices();
	}
	
	if ( input.wasKeyPressed( input.KEY_V ) ) {	BGAME.vinetting = !BGAME.vinetting;	}
	if ( input.wasKeyPressed( input.KEY_B ) ) {	BGAME.fieldOfView = !BGAME.fieldOfView; }
	if ( input.wasKeyPressed( input.KEY_M ) ) {	BGAME.mute = !BGAME.mute; }
	
	if ( BGAME.ncarm ) {
		BGAME.ncarm.updateMatrices();
	}
	
	this.car.updateMatrices();
	
};
*/


BGAME.carControl = function(car, input, dt) {
	if ( input.isKeyDown(input.KEY_UP) ) {
		car.throttle += 0.2;
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
		if ( car.brakes <= 0.2 ) {
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
	
	hrot -= (KFC.clamp(Math.abs(rx)- 0.05, 0.0, 1.0) * KFC.sign(rx)) * dt * 0.01;
	vrot -= (KFC.clamp(Math.abs(ry)- 0.05, 0.0, 1.0) * KFC.sign(ry)) * dt * 0.01;
	
	if ( vrot >  1.5 ) { vrot =  1.5; }
	if ( vrot < -1.5 ) { vrot = -1.5; }
	
	camera.setPosition(posx, posy, posz);
    camera.setRotation(vrot, hrot, 0);
};

/* legacy
BGAME.load = function(url, id) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'arraybuffer';
	xhr.onload = function() {
		BGAME.actx.decodeAudioData(xhr.response, function(buffer) {
			BGAME.aso[id] = BGAME.actx.createBufferSource();
			BGAME.aso[id].buffer = buffer;
			BGAME.aso[id].loop = true;
			
			BGAME.aso[id].connect(BGAME.apa);
			BGAME.aso[id].gain.value = 0;
			BGAME.aso[id].noteOn(0);
		});
	};
	xhr.send();
};
*/

/*
BGAME.aupdate = function() {
	 
	var rpm = BGAME.ncar.engine.vel * 10,
		load = BGAME.ncar.throttle,
		gain = (BGAME.mute) ? 0 : 1,
		aso = BGAME.aso,
		r = [1575*2, 1995*2, 3225*2];
	
	
	if ( aso[1] ) {
		aso[1].playbackRate.value = rpm / r[0];
		if ( rpm < r[0] ) {
			aso[1].gain.value = (1-load)*gain;
		} else {
			aso[1].gain.value = (1-load)*gain * Math.max((r[1]-rpm)/(r[1]-r[0]), 0);
		}
	}
	if ( aso[2] ) {
		aso[2].playbackRate.value = rpm / r[1];
		if ( rpm < r[1] ) {
			aso[2].gain.value = (1-load)*gain * Math.max( (rpm-r[0]) / (r[1]-r[0]), 0);
		} else {
			aso[2].gain.value = (1-load)*gain * Math.max((r[2]-rpm)/(r[2]-r[1]), 0);
		}
		
	}
	if ( aso[3] ) {
		aso[3].playbackRate.value = rpm / r[2];
		if ( rpm < r[2] ) {
			aso[3].gain.value = (1-load)*gain * Math.max((rpm-r[1])/(r[2]-r[1]), 0);
		} else {
			aso[3].gain.value = (1-load)*gain;
		}
	
	}
	
	if ( aso[4] ) {
		aso[4].playbackRate.value = rpm / r[0];
		if ( rpm < r[0] ) {
			aso[4].gain.value = (load)*gain;
		} else {
			aso[4].gain.value = (load)*gain * Math.max((r[1]-rpm)/(r[1]-r[0]), 0);
		}
	}
	if ( aso[5] ) {
		aso[5].playbackRate.value = rpm / r[1];
		if ( rpm < r[1] ) {
			aso[5].gain.value = (load)*gain * Math.max( (rpm-r[0]) / (r[1]-r[0]), 0);
		} else {
			aso[5].gain.value = (load)*gain * Math.max((r[2]-rpm)/(r[2]-r[1]), 0);
		}
		
	}
	if ( aso[6] ) {
		aso[6].playbackRate.value = rpm / r[2];
		if ( rpm < r[2] ) {
			aso[6].gain.value = (load)*gain * Math.max((rpm-r[1])/(r[2]-r[1]), 0);
		} else {
			aso[6].gain.value = (load)*gain;
		}
	
	}
	
	//BGAME.debug.innerHTML = '';
	//
	//for ( var s in aso ) {
	//	if ( (aso[s].gain.value <= 0) && (aso[s].playbackState === 2) ) {	// if not needed, shut off and ready it
	//		aso[s].noteOff(0);
	//		
	//		var sbuffer = aso[s].buffer;
	//		var sgain = aso[s].gain.value;
	//		
	//		aso[s] = BGAME.actx.createBufferSource();
	//		aso[s].buffer = sbuffer;
	//		aso[s].loop = true;
	//		
	//		aso[s].connect(BGAME.apa);
	//		aso[s].gain.value = sgain;
	//	}
	//	if ( (aso[s].gain.value > 0) && (aso[s].playbackState === 0) ) {
	//		aso[s].noteOn(0);
	//	}
	//	
	//	
	//	BGAME.debug.innerHTML += s + ' ' + aso[s].playbackState
	//						+ ' ' + aso[s].gain.value.toFixed(3)
	//						+ ' ' + aso[s].playbackRate.value.toFixed(3) + '<br/>';
	//}
	
	//document.getElementById('prpm').innerHTML = rpm + ' rpm';
};
*/



/**
 * Box mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {number} w width of the box
 * @param {number} h heigth of the box
 * @param {number} d depth of the box
 */
KFC.BoxMesh = function (gl, w, h, d) {
	KFC.Mesh.call(this, gl);
	
	this.taVerPos = new Float32Array([ // vertex positions array
		// Front face
		 -w/2,  -h/2,  d/2,
		 w/2,  -h/2,  d/2,
		 w/2,  h/2,  d/2,
		 w/2,  h/2,  d/2,
		 -w/2,  h/2,  d/2,
		 -w/2,  -h/2,  d/2,
		 
		// Back face
		 -w/2,  -h/2,  -d/2,
		 -w/2,  h/2,  -d/2,
		 w/2,  h/2,  -d/2,
		 w/2,  h/2,  -d/2,
		 w/2,  -h/2,  -d/2,
		 -w/2,  -h/2,  -d/2,

		// Top face
		 -w/2,  h/2,  -d/2,
		 -w/2,  h/2,  d/2,
		 w/2,  h/2,  d/2,
		 w/2,  h/2,  d/2,
		 w/2,  h/2,  -d/2,
		 -w/2,  h/2,  -d/2,

		// Bottom face
		 -w/2,  -h/2,  -d/2,
		 w/2,  -h/2,  -d/2,
		 w/2,  -h/2,  d/2,
		 w/2,  -h/2,  d/2,
		 -w/2,  -h/2,  d/2,
		 -w/2,  -h/2,  -d/2,

		// Right face
		 w/2,  -h/2,  -d/2,
		 w/2,  h/2,  -d/2,
		 w/2,  h/2,  d/2,
		 w/2,  h/2,  d/2,
		 w/2,  -h/2,  d/2,
		 w/2,  -h/2,  -d/2,

		// Left face
		 -w/2,  -h/2,  -d/2,
		 -w/2,  -h/2,  d/2,
		 -w/2,  h/2,  d/2,
		 -w/2,  h/2,  d/2,
		 -w/2,  h/2,  -d/2,
		 -w/2,  -h/2,  -d/2
	]);
	
	this.taNorm = new Float32Array([ // vertex positions array
		// Front face
		 0,  0,  1,  0,  0,  1,  0,  0,  1,
		 0,  0,  1,  0,  0,  1,  0,  0,  1,         
		// Back face
		 0,  0, -1,  0,  0, -1,  0,  0, -1,
		 0,  0, -1,  0,  0, -1,  0,  0, -1,
		// Top face
		 0,  1,  0,  0,  1,  0,  0,  1,  0,
		 0,  1,  0,  0,  1,  0,  0,  1,  0, 
		// Bottom face
		 0, -1,  0,  0, -1,  0,  0, -1,  0,
		 0, -1,  0,  0, -1,  0,  0, -1,  0, 
		// Right face
		 1,  0,  0,  1,  0,  0,  1,  0,  0,
		 1,  0,  0,  1,  0,  0,  1,  0,  0, 
		// Left face
		-1,  0,  0, -1,  0,  0, -1,  0,  0,
		-1,  0,  0, -1,  0,  0, -1,  0,  0
	]);
	
	this.buffers.bVerPos = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, this.taVerPos, gl.STATIC_DRAW);
	
	this.buffers.bNorm = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bNorm);
	gl.bufferData(gl.ARRAY_BUFFER, this.taNorm, gl.STATIC_DRAW);
	
	this.ready = true;
};

KFC.BoxMesh.prototype._render = function (gl, shader) {
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.enableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.vertexAttribPointer(shader.attributes['aVerPosition'], 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bNorm);
	gl.enableVertexAttribArray(shader.attributes['aVerNormal']);
	gl.vertexAttribPointer(shader.attributes['aVerNormal'], 3, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLES, 0, 36);
	
	
	gl.disableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.disableVertexAttribArray(shader.attributes['aVerNormal']);
};

/**
 * Wireframe Axis alligned box mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {number} xi box x min coordiante 
 * @param {number} yi box y min coordiante 
 * @param {number} zi box z min coordiante 
 * @param {number} xa box x max coordiante 
 * @param {number} ya box y max coordiante 
 * @param {number} za box z max coordiante 
 */
KFC.LineAABBox = function(gl, xi, yi, zi, xa, ya, za) {
	KFC.Mesh.call(this, gl);
	
	/** @type {Float32Array} */
	var taVerPos;
	
	taVerPos = new Float32Array(
		[ xi, yi, zi,  xa, yi, zi,
		  xi, yi, zi,  xi, ya, zi,  
		  xi, yi, zi,  xi, yi, za,
		  
		  xa, ya, za,  xi, ya, za,
		  xa, ya, za,  xa, yi, za,
		  xa, ya, za,  xa, ya, zi,
		  
		  xa, yi, zi,  xa, ya, zi,
		  xa, yi, zi,  xa, yi, za,
		  
		  xi, ya, zi,  xa, ya, zi,
		  xi, ya, zi,  xi, ya, za,
		  
		  xi, yi, za,  xa, yi, za,
		  xi, yi, za,  xi, ya, za
	]);
	
	
	this.uniforms['uColor'] = [Math.random(), Math.random(), Math.random(), 1];
	
	this.buffers.bVerPos = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, taVerPos, gl.STATIC_DRAW);
	
	this.ready = true;
};

KFC.LineAABBox.prototype._render = function (gl, shader) {
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.enableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.vertexAttribPointer(shader.attributes['aVerPosition'], 3, gl.FLOAT, false, 0, 0); 

	//gl.disable(gl.DEPTH_TEST);	
	gl.drawArrays(gl.LINES, 0, 24);
	//gl.enable(gl.DEPTH_TEST);
	
	gl.disableVertexAttribArray(shader.attributes['aVerPosition']);
};

/**
 * Cylinder mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {number} r cylinder radius
 * @param {number} h cylinder height
 * @param {number} s number of sides
 */
KFC.CylinderMesh = function (gl, r, h, s) {	
	KFC.Mesh.call(this, gl);
	
	var i,
		a1, a2, x1, x2, z1, z2, n;
	
	this.r = r || 1;
	this.h = h || 1;
	this.s = s || 16;
	
	this.taVerPos = new Float32Array(s*4*3*3);
	this.taNorm = new Float32Array(s*4*3*3);
	for( i = 0; i < this.s; i+=1 ) {
		a1 = i*Math.PI*2/this.s;
		a2 = (i+1)*Math.PI*2/this.s;
		x1 = Math.sin(a1) * this.r;
		z1 = Math.cos(a1) * this.r;
		x2 = Math.sin(a2) * this.r;
		z2 = Math.cos(a2) * this.r;
		// top triangle
		this.taVerPos[i*36   ] = 0;		this.taVerPos[i*36+ 1] = h/2;	this.taVerPos[i*36+ 2] = 0;	
		this.taVerPos[i*36+ 3] = x1;	this.taVerPos[i*36+ 4] = h/2;	this.taVerPos[i*36+ 5] = z1;
		this.taVerPos[i*36+ 6] = x2;	this.taVerPos[i*36+ 7] = h/2;	this.taVerPos[i*36+ 8] = z2;
		// bottom triangle
		this.taVerPos[i*36+27] = 0;		this.taVerPos[i*36+28] = -h/2;	this.taVerPos[i*36+29] = 0;
		this.taVerPos[i*36+30] = x2;	this.taVerPos[i*36+31] = -h/2;	this.taVerPos[i*36+32] = z2;
		this.taVerPos[i*36+33] = x1;	this.taVerPos[i*36+34] = -h/2;	this.taVerPos[i*36+35] = z1;
		// side triangles
		this.taVerPos[i*36+ 9] = x2;	this.taVerPos[i*36+10] = h/2;	this.taVerPos[i*36+11] = z2;
		this.taVerPos[i*36+12] = x2;	this.taVerPos[i*36+13] = -h/2;	this.taVerPos[i*36+14] = z2;
		this.taVerPos[i*36+15] = x1;	this.taVerPos[i*36+16] = -h/2;	this.taVerPos[i*36+17] = z1;		
		this.taVerPos[i*36+18] = x1;	this.taVerPos[i*36+19] = -h/2;	this.taVerPos[i*36+20] = z1;
		this.taVerPos[i*36+21] = x2;	this.taVerPos[i*36+22] = h/2;	this.taVerPos[i*36+23] = z2;
		this.taVerPos[i*36+24] = x1;	this.taVerPos[i*36+25] = h/2;	this.taVerPos[i*36+26] = z1;
		// top normal
		this.taNorm[i*36   ] = 0;	this.taNorm[i*36+ 1] = 1;	this.taNorm[i*36+ 2] = 0;	
		this.taNorm[i*36+ 3] = 0;	this.taNorm[i*36+ 4] = 1;	this.taNorm[i*36+ 5] = 0;
		this.taNorm[i*36+ 6] = 0;	this.taNorm[i*36+ 7] = 1;	this.taNorm[i*36+ 8] = 0;
		// bottom normal
		this.taNorm[i*36+27] = 0;	this.taNorm[i*36+28] = -1;	this.taNorm[i*36+29] = 0;
		this.taNorm[i*36+30] = 0;	this.taNorm[i*36+31] = -1;	this.taNorm[i*36+32] = 0;
		this.taNorm[i*36+33] = 0;	this.taNorm[i*36+34] = -1;	this.taNorm[i*36+35] = 0;
		
		// TODO : change and test Cylinder normal generation
		
		//n = KFC.vecX(new KFC.Vector(0, h, 0), new KFC.Vector(x1-x2, 0, z1-z2)).normal();
		//// side normal
		//this.taNorm[i*36+ 9] = n.x;	this.taNorm[i*36+10] = n.y;	this.taNorm[i*36+11] = n.z;
		//this.taNorm[i*36+12] = n.x;	this.taNorm[i*36+13] = n.y;	this.taNorm[i*36+14] = n.z;
		//this.taNorm[i*36+15] = n.x;	this.taNorm[i*36+16] = n.y;	this.taNorm[i*36+17] = n.z;
		//this.taNorm[i*36+18] = n.x;	this.taNorm[i*36+19] = n.y;	this.taNorm[i*36+20] = n.z;
		//this.taNorm[i*36+21] = n.x;	this.taNorm[i*36+22] = n.y;	this.taNorm[i*36+23] = n.z;
		//this.taNorm[i*36+24] = n.x;	this.taNorm[i*36+25] = n.y;	this.taNorm[i*36+26] = n.z;
		
	}
	
	this.buffers.bVerPos = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, this.taVerPos, gl.STATIC_DRAW);
	
	this.buffers.bNorm = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bNorm);
	gl.bufferData(gl.ARRAY_BUFFER, this.taNorm, gl.STATIC_DRAW);
	
	this.ready = true;
};

KFC.CylinderMesh.prototype._render = function (gl, shader) {    
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.enableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.vertexAttribPointer(shader.attributes['aVerPosition'], 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bNorm);
	gl.enableVertexAttribArray(shader.attributes['aVerNormal']);
	gl.vertexAttribPointer(shader.attributes['aVerNormal'], 3, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLES, 0, this.s*12);
	
	gl.disableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.disableVertexAttribArray(shader.attributes['aVerNormal']);
};



/**
 * Line mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {boolean=} opt_add add position coordinates to orgin?
 */
KFC.LineMesh = function (gl, opt_add) {
	KFC.Mesh.call(this, gl);
	this.gl = gl;
	
	this.orgin = vec3.create([ 5,  0,  0]);
	this.point = vec3.create([ 0, 10,  0]);
	this.add = (opt_add === undefined) ? true : opt_add;
	
	this.varr = new Float32Array(6);
	
	this.apply();
	
	this.ready = true;
};

KFC.LineMesh.prototype.apply = function () {
	var o = this.orgin,
		p = this.point,
		v = this.varr,
		gl;
		
	v[0] = o[0]; v[1] = o[1]; v[2] = o[2];
	if (this.add) {
		v[3] = o[0] + p[0];
		v[4] = o[1] + p[1];
		v[5] = o[2] + p[2];
	} else {
		v[3] = p[0]; v[4] = p[1]; v[5] = p[2];
	}
	
	gl = this.gl;
	this.buffers.bVerPos = this.buffers.bVerPos || gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, v, gl.STREAM_DRAW);

};

KFC.LineMesh.prototype._render = function (gl, shader) {
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.enableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.vertexAttribPointer(shader.attributes['aVerPosition'], 3, gl.FLOAT, false, 0, 0); 

	gl.disable(gl.DEPTH_TEST);	
	gl.drawArrays(gl.LINES, 0, 2);
	gl.enable(gl.DEPTH_TEST);
	
	gl.disableVertexAttribArray(shader.attributes['aVerPosition']);	
};

KFC.LineMesh.prototype._renderDepth = function (gl, shader) {
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.enableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.vertexAttribPointer(shader.attributes['aVerPosition'], 3, gl.FLOAT, false, 0, 0); 

	gl.disable(gl.DEPTH_TEST);	
	gl.drawArrays(gl.LINES, 0, 2);
	gl.enable(gl.DEPTH_TEST);
	
	gl.disableVertexAttribArray(shader.attributes['aVerPosition']);
};


/**
 * Sprite mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {Array.<number>} v sprite vertex positions
 * @param {Array.<number>} t sprite texture UV positions
 * @param {KFC.Texture} tex texture object
 */
KFC.SpriteMesh = function (gl, v, t, tex) {
	KFC.Mesh.call(this, gl);
	this.gl = gl;
	this.v = v;	// should be array[0..3] // top, bottom, left, right
	this.t = t;	// should be array[0..3] // top, bottom, left, right
	this.tex = tex;
	this.uniforms['uTex0'] = [0];
	
	this.apply();	
	this.ready = true;
};

KFC.SpriteMesh.prototype.apply = function () {
	var v = this.v,
		t = this.t,
		varr, tarr, gl;
	varr = new Float32Array([v[0], v[2], 0,	// vertex array
							 v[1], v[2], 0,
							 v[1], v[3], 0,
							 v[1], v[3], 0,
							 v[0], v[3], 0,
							 v[0], v[2], 0]);
	tarr = new Float32Array([t[0], t[2],	// texture array
							 t[1], t[2],
							 t[1], t[3],
							 t[1], t[3],
							 t[0], t[3],
							 t[0], t[2]]);

	gl = this.gl;
	this.buffers.bVerPos = this.buffers.bVerPos || gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, varr, gl.STREAM_DRAW);
	
	this.buffers.bTexPos = this.buffers.bTexPos || gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bTexPos);
	gl.bufferData(gl.ARRAY_BUFFER, tarr, gl.STREAM_DRAW);

};

KFC.SpriteMesh.prototype._render = function (gl, shader) {
		
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	//gl.enableVertexAttribArray(shader.attributes['aVerPosition']);
	gl.vertexAttribPointer(shader.attributes['aVerPosition'], 3, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bTexPos);
	//gl.enableVertexAttribArray(shader.attributes['aTexCoord']);
	gl.vertexAttribPointer(shader.attributes['aTexCoord'], 2, gl.FLOAT, false, 0, 0);
	
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.tex.tex);
	//gl.uniform1i(shader.uniforms.uTex0, 0);
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	
	//gl.disableVertexAttribArray(shader.attributes['aVerPosition']);
	//gl.disableVertexAttribArray(shader.attributes['aTexCoord']);
};




		//KFC.Vector = function (x, y, z) {
//	this.x = x || 0;
//	this.y = y || 0;
//	this.z = z || 0;
//};
//
//KFC.Vector.prototype.set3f = function (x, y, z) {
//	this.x = x;
//	this.y = y;
//	this.z = z;
//};
//
//KFC.Vector.prototype.length = function () {
//	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
//};
//
//KFC.Vector.prototype.normal = function () {
//	var l = this.length();
//	if ( l === 0 ) return new KFC.Vector();
//	return new KFC.Vector(
//		this.x / l,
//		this.y / l,
//		this.z / l);
//};
//
//KFC.Vector.prototype.multi = function (f) {
//	return new KFC.Vector(this.x * f,
//						  this.y * f,
//						  this.z * f);
//};
//
//KFC.Vector.prototype.copy = function (v) {
//	return new KFC.Vector(
//		this.x,
//		this.y,
//		this.z );
//};
//
//KFC.Vector.prototype.rotateY = function (angle) {
//	var sin = Math.sin(angle);
//	var cos = Math.cos(angle);
//	return new KFC.Vector(
//		this.x * cos - this.z * sin,
//		this.y,
//		this.x * sin + this.z * cos 
//	);
//};
//
//KFC.Vector.prototype.adds = function (v) {
//	this.x += v.x;
//	this.y += v.y;
//	this.z += v.z;
//	return this;
//};
//
//KFC.Vector.prototype.RKadds = function (v1, v2, v3, v4, f) {
//	this.x += (v1.x + 2*(v2.x+v3.x) + v4.x) * f/6;
//	this.y += (v1.y + 2*(v2.y+v3.y) + v4.y) * f/6;
//	this.z += (v1.z + 2*(v2.z+v3.z) + v4.z) * f/6;
//	return this;
//};
//
//KFC.Vector.prototype.multis = function (f) {
//	this.x *= f;
//	this.y *= f;
//	this.z *= f;
//	return this;
//};
//
//KFC.Vector.prototype.addmultis = function (v, f) {
//	this.x += v.x * f;
//	this.y += v.y * f;
//	this.z += v.z * f;
//	return this;
//};
//
//KFC.Vector.prototype.toString = function () {
//	return "x:" + this.x.toFixed(3)
//		 + ",y:" + this.y.toFixed(3)
//		 + ",z:" + this.z.toFixed(3);
//};
//
//
//KFC.vecAdd = function (v1, v2) {
//	return new KFC.Vector(v1.x + v2.x,
//						  v1.y + v2.y,
//						  v1.z + v2.z);
//};
//
//KFC.vecSub = function (v1, v2) {
//	return new KFC.Vector(v1.x - v2.x,
//						  v1.y - v2.y,
//						  v1.z - v2.z);
//};
//
//KFC.vecMulti = function (v, f) {
//	return new KFC.Vector(v.x * f,
//						  v.y * f,
//						  v.z * f);
//};
//
//KFC.vecDot = function (v1, v2) {
//	return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
//};
//
//KFC.vecX = function (v1, v2) {
//	return new KFC.Vector(
//		v1.y * v2.z - v1.z * v2.y,
//		v1.x * v2.z - v1.z * v2.x,
//		v1.x * v2.y - v1.y * v2.x);
//};
//
//KFC.rkadd = function (k1, k2, k3, k4, f) {
//	return (k1 + 2*(k2 + k3) + k4) * f/6;
//};
//
//KFC.dot2d = function(x1, y1, x2, y2) {
//	return x1*x2 + y1*y2;
//}

KFC.CarModel = function (gl) {
	
	//this.state = new KFC.CarState();
	//this.state.prot.y = Math.PI/4;
	this.pos_wc = new KFC.Vector(20, 0.6, 0);
	this.vel_wc = new KFC.Vector();                                                                               
	this.angle_wc = Math.PI/2;			// yaw
	this.angular_vel = 0;		// yaw speed
	
	this.mass = 1680;
	this.moi = 1680; // moment of inertia
	
	this.throttle	= 0;	//  0..1
	this.brakes		= 0;	//  0..1
	this.steerAngle	= 0;	// -1..1
	this.gear		= 1;	// -1,0,1-6
	this.gratio = {'-1': -3.68, 0: 0, 1: 4.06, 2: 2.4, 3: 1.58, 4: 1.19, 5: 1.00, 6: 0.87, 'f': 3.80 };
	this.frontLock = 0.75;	// rad - 43 deg

	this.engine = new KFC.CarEngine(this);
	
	
	
	//
	//
	//BGAME.tex1 = new KFC.Texture(BGAME.glc.gl, 'textures/dot.png');
	//
	//BGAME.spriteShader = new KFC.CustomMaterial(BGAME.glc.gl, 'sprite.vsh', 'sprite.fsh',
	//											['aVerPosition', 'aTexCoord'],
	//											['uColor', 'uTex0']);
	//
	//BGAME.s1 = new KFC.Object3D(new KFC.SpriteMesh(BGAME.glc.gl, [1, 0, 0, 1], [1, 0, 0, 1], BGAME.tex0), BGAME.spriteShader);
	//BGAME.s1.mesh.v = [0.75+0.1, 0.75-0.1, 0.75-0.1, 0.75+0.1]; BGAME.s1.mesh.apply();
	//BGAME.s1.uniforms['uColor'] = [1, 1, 1, 1];
	//BGAME.s1.c = {'x':0.75,'y':0.75}; BGAME.s1.r = 0.1;
	//BGAME.guiScene.add(BGAME.s1);
	
	
	var shader, mesh,
		s, f, r;
	

	shader = new KFC.CustomMaterial(gl,
				'car.vsh', 'car.fsh',
				['aVerPosition', 'aVerNormal', 'aTexCoord'],
				['uAmbientColor', 'uDirColor', 'uLightDirection', 'uColor', 'uTex0', 'uCamPosition']);
	
		
	// M3
	this.tex0 = new KFC.Texture(gl, 'textures/bmw.png');
	mesh = new KFC.ObjMesh(gl, "obj/bmw.obj", this.tex0.tex);
	this.body = new KFC.Object3D(mesh, shader);
	this.body.uniforms.uColor = [1, 1, 1, 1];
	this.body.setPosition(0, -0.04, 0.11);
	
	s = 0.79;	// x distance to wheels
	f = -1.37;	// z to front wheels
	r = 1.37;	// z to rear wheels
	
	//A4
	//this.tex0 = new KFC.Texture(BGAME.glc.gl, 'textures/audi_a4.png');
	//mesh = new KFC.ObjMesh(BGAME.glc.gl, "obj/audi_a4.obj", this.tex0);
	//this.body = new KFC.Object3D(mesh, shader);
	//this.body.uniforms.uColor = [1, 1, 1, 1];
	//this.body.position.y = -0.08;
	//this.body.position.z = -0.4;
	//
	//var s = 0.75;
	//var f = -1.68;
	//var r = 1.17;
	
	
	// WW GOLF
	//	mesh = new KFC.ObjMesh(BGAME.glc.gl, "obj/vw_golf.obj");
	//this.body = new KFC.Object3D(mesh, shader);
	//this.body.uniforms.uColor = [0.9, 0.9, 0.9, 1];
	//this.body.setPosition(0, -0.100, 0);
	
	//var s = 0.72;
	//var f = -1.44;
	//var r = 1.12;
	
	
	//mesh = new KFC.BoxMesh(gl, 0.255, 0.481, 0.481); // tire mesh
	
	this.tex1 = new KFC.Texture(gl, 'textures/ratai3.png');
	mesh = new KFC.ObjMesh(gl, "obj/ratai3.obj", this.tex1.tex);
	this.wfl = new KFC.CarWheel(mesh, shader,  1);
	this.wfl.position.set3f(-s, -0.250, f);	
	this.wfr = new KFC.CarWheel(mesh, shader, -1);
	this.wfr.position.set3f( s, -0.250, f);	
	this.wrl = new KFC.CarWheel(mesh, shader,  1);
	this.wrl.position.set3f(-s, -0.250, r);	
	this.wrr = new KFC.CarWheel(mesh, shader, -1);
	this.wrr.position.set3f( s, -0.250, r);
	
};

KFC.CarModel.prototype.updateMatrices = function () {	
	var cg_mat, mat;
	
	cg_mat = mat4.create();		// main car location
	mat4.identity(cg_mat);
	mat4.translate(cg_mat, [this.pos_wc.x, this.pos_wc.y, this.pos_wc.z]);
	mat4.rotate(cg_mat, this.angle_wc, [0, 1, 0]);
	
	mat = this.body.mvMatrix;	// car body
	mat4.set(cg_mat, mat);
	mat4.translate(mat, [this.body.position.x, this.body.position.y, this.body.position.z]);
	
	mat4.toInverseMat3(this.body.mvMatrix, this.body.nMatrix);
	mat3.transpose(this.body.nMatrix);
	
	this.wfl.updateMatix(cg_mat);	// wheels
	this.wfr.updateMatix(cg_mat);
	this.wrl.updateMatix(cg_mat);
	this.wrr.updateMatix(cg_mat);
};

KFC.CarModel.prototype.addToScene = function (scene) {
	scene.add(this.body);
	scene.add(this.wfl);
	scene.add(this.wfr);
	scene.add(this.wrl);
	scene.add(this.wrr);
};

KFC.CarModel.prototype.integrate = function (dt) {	
	var s, k1, k2, k3, k4;
	
	s = new KFC.CarState(this);
	
	k1 = s.evaluate(0, undefined, 1);
	k2 = s.evaluate(0.5*dt, k1, 2);
	k3 = s.evaluate(0.5*dt, k2, 3);
	k4 = s.evaluate(dt, k3, 4);
	
	//s.adds(k1, dt);	
	s.sum(k1, k2, k3, k4, dt);
	s.apply();
};


KFC.CarState = function (car) {
	if (car) {
		this.car = car;
		// changing vars
		this.pos_wc = car.pos_wc.copy();
		this.vel_wc = car.vel_wc.copy();
		this.angle_wc = car.angle_wc;
		this.angular_vel = car.angular_vel;

	}
};

KFC.CarState.prototype.copy = function () {
	
	var o = new KFC.CarState();
	o.car = this.car;
	
	o.pos_wc = this.pos_wc.copy();
	o.vel_wc = this.vel_wc.copy();
	o.angle_wc = this.angle_wc;
	o.angular_vel = this.angular_vel;

	
	return o;
};

KFC.CarState.prototype.apply = function () {
	var car = this.car;
	car.pos_wc = this.pos_wc.copy();
	car.vel_wc = this.vel_wc.copy();
	car.angle_wc = this.angle_wc;
	car.angular_vel = this.angular_vel;
};

KFC.CarState.prototype.adds = function (d, dt) {
	this.pos_wc.addmultis(d.pos_wc, dt);	
	this.vel_wc.addmultis(d.vel_wc, dt);	
	this.angle_wc += d.angle_wc * dt;
	this.angular_vel += d.angular_vel * dt;

	
};

KFC.CarState.prototype.sum = function (k1, k2, k3, k4, dt) {
	this.pos_wc.RKadds(k1.pos_wc, k2.pos_wc, k3.pos_wc, k4.pos_wc, dt);
	this.vel_wc.RKadds(k1.vel_wc, k2.vel_wc, k3.vel_wc, k4.vel_wc, dt);
	
	this.angle_wc += KFC.rkadd(k1.angle_wc, k2.angle_wc, k3.angle_wc, k4.angle_wc, dt);
	this.angular_vel += KFC.rkadd(k1.angular_vel, k2.angular_vel, k3.angular_vel, k4.angular_vel, dt);

};

KFC.CarState.prototype.evaluate = function (dt, d, k) {
	var o = this.copy();
	if (d) {
		o.adds(d, dt);
	}
	
	var car = o.car;	
	var Fnet_cc = new KFC.Vector();	// net force affecting car cg in car coordinates
	var Tnet = 0;					// net torque affecting car cg
	
	var Wgbo = (car.wfl.vrot + car.wfr.vrot + car.wrl.vrot + car.wrr.vrot) * -0.25;	// gear box output angular speed
	var ratio = car.gratio[car.gear] * car.gratio['f'];						// current gear ratio
	var Wgbi = Wgbo * ratio;												// gear box input
	
	var Tcluch = ( car.engine.vel - Wgbi ) * 50;							// cluch torque
	Tcluch = Math.min(Tcluch, 600);
	if ( car.gear === 0 ) {								// Neutral gear
		Tcluch = 0;
	}
	
	car.engine.RKStep(k, car.throttle, Tcluch);								// RKStep engine
	
	var Tgb = Tcluch * ratio / 1;
	

	var fl = o.evalw(car.wfl, true, k, Tgb*0.2);
	var fr = o.evalw(car.wfr, true, k, Tgb*0.2);
	var rl = o.evalw(car.wrl, true, k, Tgb*0.3);
	var rr = o.evalw(car.wrr, true, k, Tgb*0.3);
	
	Fnet_cc.adds(fl.F); Tnet += fl.T;
	Fnet_cc.adds(fr.F); Tnet += fr.T;
	Fnet_cc.adds(rl.F); Tnet += rl.T;
	Fnet_cc.adds(rr.F); Tnet += rr.T;
	
	
	var Fnet_wc = Fnet_cc.rotateY(-car.angle_wc); // Sum force in world coordinates
	
	o.pos_wc = o.vel_wc;						// new speed	v
	o.vel_wc = Fnet_wc.multis(1/car.mass);	// new acceleration a = f/m

	o.angle_wc = o.angular_vel;
	o.angular_vel = Tnet * 1/car.moi;
	
	return o;
};

KFC.CarState.prototype.evalw = function (w, drive, k, Tengine) {
	
	var car = this.car;
	var Vc_cc = this.vel_wc.rotateY(this.angle_wc);						// car cg velocity in car coordinates
	
	var Dcg_w = w.position.copy();										// direction from car cg to wheel
		Dcg_w.y = 0;													// no height;
	var Vr_dir = KFC.vecX(Dcg_w, new KFC.Vector(0, -1, 0)).normal(); 	// direction of rotational velocity
	var Vr_cc = Vr_dir.multi(this.angular_vel * Dcg_w.length());		// velocity from car rotation at the wheel
	var Vcw_cc = KFC.vecAdd(Vc_cc, Vr_cc);		// car velocity at wheel point car coordinates
		
	var Vcw_hc = Vcw_cc.rotateY(w.yaw);	// car speed at wheels with respect to wheel
	var Vcp_hc = Vcw_hc.z - w.vrot * w.radius;	// CP speed with respect to wheel
	
	var Fy = car.mass/4 * 9.8;
		
	var Slong;						// longitudal slip, CP speed / hub speed
	var Vcw_l = Vcw_cc.length(); 	// car velocity size at point
	if (Vcw_l < 0.0001) {
		Slong = Vcp_hc * 9000.1;
	} else {
		Slong = Vcp_hc / Vcw_l;
	}
	var Slip = Slong;
	if ( Math.abs(Slong) > w.maxSlong ) {
		Slong = w.maxSlong * ((Slong<0)?-1:1);	// limit slip to maximum slip
	}
	
	//var Flong = Fy * 31 * Slong / (1+Math.pow(Math.abs(9.625*Slong), 2.375));
	var Flong = Fy * 20 * Slong;
	
	var Alat = 0;		// Lateral slip angle (rad)
	if ( Vcp_hc !== 0 ) {
		Alat = Math.atan(Vcw_hc.x/Vcp_hc) * Math.abs(Vcp_hc)/Vcp_hc;
	}
	Alat *= 180 / Math.PI;
	Alat = (Alat >= 0) ? Math.min(Alat, 3.273) : Math.max(Alat, -3.273);
	
	var Flat = Alat * 0.4891 * Fy;
	
	var Tbrake = w.vrot * car.brakes * -100;
	var Tfric = w.vrot * w.radius * -10;			// friction, rolling resistance
	var Tslip = Flong * w.radius;
	//Tengine /= -1;
	
	switch ( k ) {
		case 1 :
			w.rp0 = w.prot;
			w.aa[1] = (-Tengine + Tbrake + Tfric + Tslip) * w.imoi * BGAME.intStep/2;
			w.av[1] = w.vrot;
			w.prot += w.av[1] * BGAME.intStep/2;
			w.vrot += w.aa[1];
			break;
		case 2 :
			w.aa[2] = (-Tengine + Tbrake + Tfric + Tslip) * w.imoi * BGAME.intStep/2;
			w.av[2] = w.vrot;
			w.prot = w.rp0 + w.av[2] * BGAME.intStep/2;
			w.vrot = w.av[1] + w.aa[2];
			break;		
		case 3 :
			w.aa[3] = (-Tengine + Tbrake + Tfric + Tslip) * w.imoi * BGAME.intStep;
			w.av[3] = w.vrot;
			w.prot = w.rp0 + w.av[3] * BGAME.intStep;
			w.vrot = w.av[1] + w.aa[3];
			break;
		case 4 :
			w.aa[4] = (-Tengine + Tbrake + Tfric + Tslip) * w.imoi * BGAME.intStep/2;
			w.prot = w.rp0 + (w.av[1] + 2*( w.av[2] + w.av[3] ) + w.vrot ) * BGAME.intStep/6;
			w.vrot = w.av[1] + (w.aa[1] + 2*w.aa[2] + w.aa[3] + w.aa[4]) * 1/3;

			w.slip = Slong;
			break;
		default :
			console.error("RK value out of range");
	}
	

	var Fll = new KFC.Vector(-Flat, 0, -Flong);
	Fll = Fll.rotateY(-w.yaw);		// rotate from hub to car coordinates
	
	var cgw = w.position.copy();	// point to apply force on (in car coordinates)
		cgw.y = 0;							// lets say force is horizontal to mass center
	var cgdir = cgw.normal();			// direction to force point
		
	var Fapply = KFC.vecMulti(cgdir, KFC.vecDot(Fll, cgdir));	// Force affecting position change
	var Ts = KFC.vecX(KFC.vecSub(Fll, Fapply), cgw).y;			// Force rotating car
	
	

	//if ( w === BGAME.car.wrl && BGAME.iframe < 4 ) {
	//	if ( k === 1 )
	//		BGAME.debug.innerHTML += w.vrot + '<br/>';
	//	if ( k === 2 )
	//		BGAME.debug.innerHTML += w.vrot + '<br/>';
	//	if ( k === 3 )
	//		BGAME.debug.innerHTML += w.vrot + '<br/>';
	//	if ( k === 4 )
	//		BGAME.debug.innerHTML += w.vrot + '<br/>';
	//}
	//
	return {'F':Fapply, 'T':Ts};
};


KFC.CarWheel = function (mesh, shader, rotate) {
	KFC.Object3D.call(this, mesh, shader);
	
	//this.uniforms.uColor = [137/256, 225/256, 75/256, 1];
	this.uniforms.uColor = [1, 1, 1, 1];
	
	this.moi = 1;						// mass of inertia
	this.imoi = 1 / this.moi;			// inverted mass of inertia
	this.radius = 0.3305;				// wheel radius (m)
	this.yaw = 0;						// wheel side turn (rad)
	this.maxSlong = 0.08;				// max longitudal slip
	this.rotate = rotate;
	
	//// RK stuff
	this.rp0 = 0;
	this.aa = [0, 0, 0, 0, 0];
	this.av = [0, 0, 0, 0, 0];
	
	this.prot = 0;						// angular rotation position
	this.vrot = 0.1;						// angular speed
	//this.Ek = this.moi + this.w * this.w * 0.5;		// wheel kinetic energy
	
	
	
};

KFC.CarWheel.prototype.updateMatix = function (top_mat) {
	var mat = this.mvMatrix;
	mat4.set(top_mat, mat);
	mat4.translate(mat, [this.position.x, this.position.y, this.position.z]);
	mat4.rotate(mat, this.yaw, [0, 1, 0]);
	mat4.rotate(mat, this.prot, [1, 0, 0]);
	mat4.rotate(mat, Math.PI/2*this.rotate, [0, 0, 1]);
	
	mat4.toInverseMat3(this.mvMatrix, this.nMatrix);
	mat3.transpose(this.nMatrix);
};

KFC.CarWheel.prototype.getMVMatrix = KFC.Object3D.prototype.getMVMatrix;
KFC.CarWheel.prototype._makeMatrix = KFC.Object3D.prototype._makeMatrix;
KFC.CarWheel.prototype.getNMatrix = KFC.Object3D.prototype.getNMatrix;


KFC.CarEngine = function (car) {
	this.car = car;
	this.frictionKv = 0.1;			// engine friction  (N/(rad/s))
	this.frictionTorqueMax = 50; 	// max engine friction
	this.moi = 0.2;					// moment of inertia (0.1)
	this.imoi = 1 / this.moi; 		// one over moment if inertia
	this.Widle = 105				// engine idle speed (rad/s) 105 ~ 1000rpm
	this.Wmax = 830;				// max angular velocity (rad/s) 830 ~ 8000rpm
	
	this.vel = this.Widle;						// engine angular speed (rad/s)
	//this.Ek = this.moi * this.w*this.w * 0.5;	// Engine kinetic energy	Ek = I * w^2 / 2
	
	this.rkv = [0, 0, 0, 0, 0];		// speed from RK
	this.rka = [0, 0, 0, 0, 0];		// acceleration from RK
};

KFC.CarEngine.prototype.RKStep = function (k, throttle, Tcluch) {
	var torque = this.torq() * throttle;
	var friction = Math.min(this.vel * this.frictionKv, this.frictionTorqueMax);
	
	var v = this.rkv;
	var a = this.rka;
	
	switch ( k ) {
		case 1 :
			a[1] = (torque - friction - Tcluch) * this.imoi * BGAME.intStep/2;
			v[1] = this.vel;
			this.vel = this.vel + a[1];
			break;
		case 2 :
			a[2] = (torque - friction - Tcluch) * this.imoi * BGAME.intStep/2;
			v[2] = this.vel;
			this.vel = v[1] + a[2];
			break;		
		case 3 :
			a[3] = (torque - friction - Tcluch) * this.imoi * BGAME.intStep;
			v[3] = this.vel;
			this.vel = v[1] + a[3];
			break;
		case 4 :			
			a[4] = (torque - friction - Tcluch) * this.imoi * BGAME.intStep/2;
			//this.rkv[3] = vel;
			this.vel = v[1] + (a[1] + 2*a[2] + a[3] + a[4]) * 1/3;
			this.vel = Math.max(this.vel, this.Widle); // keep idle speed 105 rad/s = 1000rpm;
			break;		
		default :
			console.error("RK value out of range");
	}
	
};

KFC.CarEngine.prototype.torq = function () {	// Engine torque "curve"
	return ((this.vel > this.Wmax) ? 0 : 500); 		// flat at 600N/m
};


	// GUI STUFF

	BGAME.guiScene = new KFC.Scene();
	var aspect = window.innerWidth/window.innerHeight;
	BGAME.guiCamera = new KFC.OrthoCamera(-(aspect-1)/2, 1+(aspect-1)/2, 0, 1, 1.0, -1.0);
	
	//BGAME.l1 = new KFC.Object3D(new KFC.LineMesh(BGAME.glc.gl, false), csh);
	//BGAME.l1.uniforms['uColor'] = [1, 1, 0, 1];
	//BGAME.l1.mesh.orgin.set3f(0, 0, 0);
	//BGAME.l1.mesh.point.set3f(0.5, 0.5, 0);
	//BGAME.l1.mesh.apply();
	//BGAME.guiScene.add(BGAME.l1);
	
	//BGAME.tex0 = new KFC.Texture(BGAME.glc.gl, 'textures/circle.png');
	//BGAME.tex1 = new KFC.Texture(BGAME.glc.gl, 'textures/dot.png');
	//
	//BGAME.spriteShader = new KFC.CustomMaterial(BGAME.glc.gl, 'sprite.vsh', 'sprite.fsh',
	//											['aVerPosition', 'aTexCoord'],
	//											['uColor', 'uTex0']);
	//
	//BGAME.s1 = new KFC.Object3D(new KFC.SpriteMesh(BGAME.glc.gl, [1, 0, 0, 1], [1, 0, 0, 1], BGAME.tex0), BGAME.spriteShader);
	//BGAME.s1.mesh.v = [0.75+0.1, 0.75-0.1, 0.75-0.1, 0.75+0.1]; BGAME.s1.mesh.apply();
	//BGAME.s1.uniforms['uColor'] = [1, 1, 1, 1];
	//BGAME.s1.c = {'x':0.75,'y':0.75}; BGAME.s1.r = 0.1;
	//BGAME.guiScene.add(BGAME.s1);
	//
	//
	//BGAME.s2 = new KFC.Object3D(new KFC.SpriteMesh(BGAME.glc.gl, [1, 0, 0, 1], [1, 0, 0, 1], BGAME.tex1), BGAME.spriteShader);
	//BGAME.s2.mesh.v = [0.75+0.01, 0.75-0.01, 0.75-0.01, 0.75+0.01]; BGAME.s2.mesh.apply();
	//BGAME.s2.uniforms['uColor'] = [1, 1, 1, 1];
	//BGAME.s2.c = {'x':0.75,'y':0.75}; BGAME.s2.r = 0.1;
	//BGAME.guiScene.add(BGAME.s2);


		
	
//	 white big cylinder
//	mesh = new KFC.CylinderMesh(BGAME.glc.gl, 4, 4, 8);
//	object = new KFC.Object3D(mesh, nsh);
//    object.uniforms.uColor = [1, 1, 1, 1];
//    object.setPosition(0, 0, -20);
//    BGAME.scene.add(object);
		

// fixed shader initialization
//CGLC.prototype.makeShader = function(name, vsh_url, fsh_url, callback) {
//    this.shaderList[name] = this.gl.createProgram();
//    var sp = this.shaderList[name];
//
//    sp.name = name;
//    sp.ready = false;
//    sp.vsh = null;
//    sp.fsh = null;
//    sp.callback = callback;
//    
//    this.getShader(sp, this.gl.VERTEX_SHADER, 'shaders/'+vsh_url);
//    this.getShader(sp, this.gl.FRAGMENT_SHADER, 'shaders/'+fsh_url);
//}
//
//
//CGLC.prototype.getShader = function(sp, type, url)
//{
//    var xhr = new XMLHttpRequest();
//    var glc = this;
//    xhr.open("GET", url);
//    xhr.onreadystatechange = function () {
//        if (xhr.readyState == 4) {
//            glc.initShader(sp, type, xhr.responseText);
//        }        
//    }
//    xhr.send();
//}
//
//
//CGLC.prototype.initShader = function(sp, type, source)
//{
//    var gl = this.gl;
//    var shader = gl.createShader(type);
//
//    gl.shaderSource(shader, source);
//    gl.compileShader(shader);
//    if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
//        console.error('ERROR: CGLC:initShaders - failed to compile shader:\n' + gl.getShaderInfoLog(shader));
//        gl.deleteShader(shader);
//    }
//    
//    if (type === gl.VERTEX_SHADER) sp.vsh = shader;
//    if (type === gl.FRAGMENT_SHADER) sp.fsh = shader;
//    
//    this.initShaderProgram(sp);
//}
//
//CGLC.prototype.initShaderProgram = function(sp)
//{    
//    if ( sp.vsh === null || sp.fsh === null ) {
//        return false;
//    }
//    
//    var gl = this.gl;
//        
//    gl.attachShader( sp, sp.vsh );
//    gl.attachShader( sp, sp.fsh );
//    gl.linkProgram( sp );
//    
//    if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
//        console.error("ERROR: Could not initialise shaders!");
//        return false;
//    }
//    
//    if ( sp.name === 'base' ) {
//        sp.attributes = [];
//        
//        sp.attributes['aVerPos'] = gl.getAttribLocation(sp, "aVerPos");
//        gl.enableVertexAttribArray(sp.vpat);
//        //sp.attributes['aColor'] = gl.getAttribLocation( sp, "aColor");
//        //gl.enableVertexAttribArray(sp.aColor);
//        
//        sp.uniforms = [];
//        sp.uniforms['aColor'] = gl.getUniformLocation(sp, "aColor");
//        
//        sp.pMatrix = gl.getUniformLocation(sp, "uPMatrix");
//        sp.mvMatrix = gl.getUniformLocation(sp, "uMVMatrix");
//    } else if ( sp.name == 'color' ) {        
//        sp.vpat = gl.getAttribLocation(sp, "aVerPosition");
//        gl.enableVertexAttribArray(sp.vpat);
//        sp.cat = gl.getAttribLocation(sp, "aColor");
//        gl.enableVertexAttribArray(sp.tcat);
//        
//        sp.pmun = gl.getUniformLocation(sp, "uPMatrix");
//        sp.mmun = gl.getUniformLocation(sp, "uMVMatrix");
//    }
//    
//    for ( var u in this.sp )
//        if ( sp[u] === null )
//            console.log('WARNING: shader program has undefined variable "'+u+'"');
//            
//    sp.ready = true;
//    if (sp.callback !== undefined) sp.callback();
//        
//    return true;
//}
		
		
		
				if ( lp.length === 4 ) {	// this assumes only triangulated faces are listed ('f' v1 v2 v3)
					var v1 = lp[1].split('/');
					var v2 = lp[2].split('/');
					var v3 = lp[3].split('/');
					var f = [parseInt(v1[0]), parseInt(v2[0]), parseInt(v3[0])];
							 //parseInt(v1[1]), parseInt(v2[1]), parseInt(v3[1]),
							 //parseInt(v1[2]), parseInt(v2[2]), parseInt(v3[2])];
					if ( f[0] !== NaN && f[1] !== NaN && f[2] !== NaN ) {
						fa.push(f);
					} else {
						console.error('Bad vertex data in ' + this.url + ':' + n);
					}
				} else {
					console.error('Wrong face data count in ' + this.url + ':' + n);
				}
	
	
	
	
		var state = car.state;
		// dx = dv/dt
		// x = x0 + v0*dt
		// v = da/dt
		// a = F/m
		//state.vel.set3f( 0, 0, (car.brakes - car.throttle) * 5 );
		
		var Fs = new KFC.Vector();	// Sum of all forces affecting center of mass in car coordinates
		var Ts = 0; 				// Sum of all torques
		var cos = Math.cos(car.wheelTurn), sin = Math.sin(car.wheelTurn);		
		
		var wf = new KFC.Vector( 0, 0, (car.brakes - car.throttle)*5 ); // force to apply (in car coordinates)
		wf.set3f(
				wf.x*cos + wf.z*sin,
				wf.y,
				wf.x*sin + wf.z*cos);
		var cgw = car.wfl.position.copy();	// point to apply force on (in car coordinates)
		cgw.y = 0;							// lets say force is horizontal to mass center
		var cgdir = cgw.normal();			// direction to force point
		var Fp = KFC.vecMulti(cgdir, KFC.vecDot(wf, cgdir));	// Force affecting position change
		Ts += KFC.vecX(KFC.vecSub(wf, Fp), cgw).y;							// Force rotating car
		Fs.adds(Fp);
		//(car.brakes - car.throttle)
		var wf = new KFC.Vector( 0, 0, (car.brakes - car.throttle)*5 ); // force to apply (in car coordinates)
		wf.set3f(
				wf.x*cos + wf.z*sin,
				wf.y,
				wf.x*sin + wf.z*cos);
		var cgw = car.wfr.position.copy();	// point to apply force on (in car coordinates)
		cgw.y = 0;							// lets say force is horizontal to mass center
		var cgdir = cgw.normal();			// direction to force point
		var Fp = KFC.vecMulti(cgdir, KFC.vecDot(wf, cgdir));	// Force affecting position change
		Ts += KFC.vecX(KFC.vecSub(wf, Fp), cgw).y;							// Force rotating car
		Fs.adds(Fp);
		
		
		// rear right wheel
		car.wrr.rpos += car.wrr.rvel * intStep;		
		
		var wrrpos = car.wrr.position.copy(); // direction from car cog to wheel CC
		wrrpos.y = 0;
		var Vcraw = KFC.vecX(wrrpos, new KFC.Vector(0, -1, 0)).normal();	// car speed at wheel point from rotation
		Vcraw = KFC.vecMulti(Vcraw, car.state.vrot.y / car.wrr.position.length());
		var Vccc = car.state.vel.copy(); // car speed in car coordinates
		var t = {c:Math.cos(car.state.prot.y),s:Math.sin(car.state.prot.y)};	
		Vccc.set3f(
				Vccc.x*t.c - Vccc.z*t.s,
				Vccc.y,
				Vccc.x*t.s + Vccc.z*t.c);
		BGAME.debug.innerHTML = Vcraw + "<br/>" + Vccc;
		var Vc = KFC.vecAdd(Vcraw, Vccc); // car speed at wheel in car coordinates
		var Vaw = car.wrr.rvel * car.wrr.radius;
		var Vw = new KFC.Vector(0, 0, -Vaw);
		var Slip = KFC.vecMulti(KFC.vecAdd(Vc, Vw),  1/Vc.length());
		var Sl = Slip.length();
		var F;
		if ( Sl === 0 )
			F = new KFC.Vector();
		else
			F = KFC.vecMulti( Slip.normal(), -1 * Math.min(Sl, 5) * car.mass*4 );
			//-Slip/(Math.abs(Slip)) * Math.min(Math.abs(Slip), 1) * car.mass*4;
			
		var Tw = F.z / car.wrr.radius;// + (car.throttle - car.brakes) * 5;
		car.wrr.rvel -= Tw / 0.2 * intStep;
		
		var wf = F.copy(); // force to apply (in car coordinates)
		//var t = {c:Math.cos(-car.state.prot.y),s:Math.sin(-car.state.prot.y)};	
		//wf.set3f(
		//		wf.x*t.c - wf.z*t.s,
		//		wf.y,
		//		wf.x*t.s + wf.z*t.c);
		var cgw = car.wrr.position.copy();	// point to apply force on (in car coordinates)
		cgw.y = 0;							// lets say force is horizontal to mass center
		var cgdir = cgw.normal();			// direction to force point
		var Fp = KFC.vecMulti(cgdir, KFC.vecDot(wf, cgdir));	// Force affecting position change
		Ts += KFC.vecX(KFC.vecSub(wf, Fp), cgw).y;							// Force rotating car
		Fs.adds(Fp);
		
		//// rear left wheel
		//car.wrl.rpos += car.wrl.rvel * intStep;		
		//
		//var wrrpos = car.wrl.position.copy(); // direction from car cog to wheel CC
		//wrrpos.y = 0;
		//var Vcraw = KFC.vecX(wrrpos, new KFC.Vector(0, -1, 0)).normal();	// car speed at wheel point from rotation
		//Vcraw = KFC.vecMulti(Vcraw, car.state.vrot.y / car.wrr.position.length());
		//var Vccc = car.state.vel.copy(); // car speed in car coordinates
		//var t = {c:Math.cos(car.state.prot.y),s:Math.sin(car.state.prot.y)};	
		//Vccc.set3f(
		//		Vccc.x*t.c - Vccc.z*t.s,
		//		Vccc.y,
		//		Vccc.x*t.s + Vccc.z*t.c);
		//BGAME.debug.innerHTML = Vcraw + "<br/>" + Vccc;
		//var Vc = KFC.vecAdd(Vcraw, Vccc); // car speed at wheel in car coordinates
		//var Vaw = car.wrl.rvel * car.wrl.radius;
		//var Vw = new KFC.Vector(0, 0, -Vaw);
		//var Slip = KFC.vecAdd(Vc, Vw) / Vc.lenght();
		//var Sl = Slip.length();
		//var F;
		//if ( Sl === 0 )
		//	F = new KFC.Vector();
		//else
		//	F = KFC.vecMulti( Slip.normal(), -1 * Math.min(Sl, 5) * car.mass*4 );
		//	//-Slip/(Math.abs(Slip)) * Math.min(Math.abs(Slip), 1) * car.mass*4;
		//	
		//var Tw = F.z / car.wrl.radius;// + (car.throttle - car.brakes)*5;
		//car.wrl.rvel -= Tw / 0.2 * intStep;
		//
		//var wf = F.copy(); // force to apply (in car coordinates)
		////var t = {c:Math.cos(-car.state.prot.y),s:Math.sin(-car.state.prot.y)};	
		////wf.set3f(
		////		wf.x*t.c - wf.z*t.s,
		////		wf.y,
		////		wf.x*t.s + wf.z*t.c);
		//var cgw = car.wrl.position.copy();	// point to apply force on (in car coordinates)
		//cgw.y = 0;							// lets say force is horizontal to mass center
		//var cgdir = cgw.normal();			// direction to force point
		//var Fp = KFC.vecMulti(cgdir, KFC.vecDot(wf, cgdir));	// Force affecting position change
		//Ts += KFC.vecX(KFC.vecSub(wf, Fp), cgw).y;							// Force rotating car
		//Fs.adds(Fp);
		
		
		
		//
		//// front right wheel
		//car.wfr.rpos += car.wfr.rvel * intStep;		
		//
		//var wfrpos = car.wfr.position.copy(); // direction from car cog to wheel CC
		//wfrpos.y = 0;
		//var Vcraw = KFC.vecX(wfrpos, new KFC.Vector(0, -1, 0)).normal();	// car speed at wheel point from rotation
		//Vcraw = KFC.vecMulti(Vcraw, car.state.vrot.y / car.wfr.position.length());
		//var Vccc = car.state.vel.copy(); // car speed in car coordinates
		//var t = {c:Math.cos(car.state.prot.y),s:Math.sin(car.state.prot.y)};	
		//Vccc.set3f(
		//		Vccc.x*t.c - Vccc.z*t.s,
		//		Vccc.y,
		//		Vccc.x*t.s + Vccc.z*t.c);
		//BGAME.debug.innerHTML = Vcraw + "<br/>" + Vccc;
		//var Vc = KFC.vecAdd(Vcraw, Vccc); // car speed at wheel in car coordinates
		//var Vaw = car.wfr.rvel * car.wfr.radius;
		//var Vw = new KFC.Vector(0, 0, -Vaw);
		////var t = {c:Math.cos(car.wheelTurn),s:Math.sin(-car.wheelTurn)};	
		////	Vw.set3f(
		////		Vw.x*t.c - Vw.z*t.s,
		////		Vw.y,
		////		Vw.x*t.s + Vw.z*t.c);
		//var Slip = KFC.vecAdd(Vc, Vw) / Vc.lenght();
		//var Sl = Slip.length();
		//var F;
		//if ( Sl === 0 )
		//	F = new KFC.Vector();
		//else
		//	F = KFC.vecMulti( Slip.normal(), -1 * Math.min(Sl, 5) * car.mass*4 );
		//	//-Slip/(Math.abs(Slip)) * Math.min(Math.abs(Slip), 1) * car.mass*4;
		//	
		//var Tw = F.z / car.wfr.radius + (car.throttle - car.brakes) * 5;
		//car.wfr.rvel -= Tw / 0.2 * intStep;
		//
		//var wf = F.copy(); // force to apply (in car coordinates)
		////var t = {c:Math.cos(-car.state.prot.y),s:Math.sin(-car.state.prot.y)};	
		////wf.set3f(
		////		wf.x*t.c - wf.z*t.s,
		////		wf.y,
		////		wf.x*t.s + wf.z*t.c);
		//var cgw = car.wfr.position.copy();	// point to apply force on (in car coordinates)
		//cgw.y = 0;							// lets say force is horizontal to mass center
		//var cgdir = cgw.normal();			// direction to force point
		//var Fp = KFC.vecMulti(cgdir, KFC.vecDot(wf, cgdir));	// Force affecting position change
		//Ts += KFC.vecX(KFC.vecSub(wf, Fp), cgw).y;							// Force rotating car
		//Fs.adds(Fp);		
		
		
		
		var t = {c:Math.cos(-car.state.prot.y),s:Math.sin(-car.state.prot.y)};
		var incc = Slip.copy();
		incc.set3f(incc.x*t.c - incc.z*t.s,
					incc.y,
					incc.x*t.s + incc.z*t.c);
		var Dw = new KFC.Vector(
			car.wfr.position.x*t.c - car.wfr.position.z*t.s,
			car.wfr.position.y,
			car.wfr.position.x*t.s + car.wfr.position.z*t.c
		)
		BGAME.line3.mesh.orgin = KFC.vecAdd(car.state.pos, Dw);		
		//BGAME.line3.mesh.orgin = BGAME.line1.mesh.orgin;
		BGAME.line3.mesh.point = incc.copy();
		
		BGAME.debug.innerHTML = Vcraw + "<br/>" + Slip + "<br/>" + F;

		//if ( BGAME.frame === 1 ) {
		//	console.dir(car.wrr.position);
		//	console.dir(Vcraw);
		//}
		
		
		var Acs = KFC.vecMulti(Fs, car.mass); // Acceleration in car coordinates
		var cos = Math.cos(-state.prot.y);
		var sin = Math.sin(-state.prot.y);
		var Aws = new KFC.Vector(				// Acceleration ir world coordinates
						Acs.x*cos - Acs.z*sin,
						Acs.y,
						Acs.x*sin + Acs.z*cos);
		
		
		state.pos = KFC.vecAdd( state.pos, KFC.vecMulti(state.vel, intStep ));
		state.prot.adds( KFC.vecMulti(state.vrot, intStep) );
		
		state.vel.adds( KFC.vecMulti(Aws, intStep) );					// add
		state.vrot.y += Ts / car.moi * intStep;


		//state.prot = KFC.vecAdd( state.prot, KFC.vecMulti(state.vrot, intStep));
		////state.vrot.set3f( 1, 1, 1 );
		//
		//var w = car.wrl; // wheel
		//w.rpos = w.rpos + w.rvel * intStep;
		//w.rvel = car.state.vel.z / w.radius; // car.state.vel