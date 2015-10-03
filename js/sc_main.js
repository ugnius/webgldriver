/*jshint node:true devel:true */
/*global KFC:true, vec3, quat4, mat4, mat3, NI, APP */


if (typeof(exports) !== 'undefined') {
	KFC = global.KFC = global.KFC || KFC;
} else {
	window.KFC = window.KFC || {};
}


/**
 * Main game screen class
 * @constructor
 * @param {*} game BGAME object
 */
KFC.SCMain = function( game ) {
	
	this.game = game;
	this.time = (new Date()).getTime() + 60000;
	this.startTime = 0;
	this.acc = 0;
	this.iStep = 0.002;
	this.iframe = 0;
	this.rframe = 0;
	
	this.user = 'test';
	this.pass = 'blabla';
	this.offlineTries = 0;
	
	this.debug = false;
	
	this.rot = 0.0;
	this.rot2 = 0.03;
	this.rot3 = 0.0;
	
	this.lightDir = [0.507, -0.407, 0.30];
	this.vignetteColor = [0.01, 0.012, 0.013];
	
	this.scene = new KFC.Scene();
	this.scene.autoclear = true;
	this.scene.uniforms[KFC.UniId.uAmbientColor] = [0.8, 0.8, 0.8];
	this.scene.uniforms[KFC.UniId.uDirColor] = [0.5, 0.5, 0.5];
	this.scene.uniforms[KFC.UniId.uLightDirection] = this.lightDir;
	this.scene.uniforms[KFC.UniId.uFog] = [3000];
	this.scene.uniforms[KFC.UniId.uScale] = [1.0];
	this.scene.uniforms[KFC.UniId.uTime] = [this.time];
	this.scene.uniforms[KFC.UniId.uWindStrength] = [2];
	
	this.sceneFMenu = new KFC.Scene();
	this.sceneFMenu.autoclear = false;
	this.sceneFMenu.uniforms[KFC.UniId.uAmbientColor] = [0.5, 0.5, 0.5];
	this.sceneFMenu.uniforms[KFC.UniId.uDirColor] = [0.5, 0.5, 0.5];
	this.sceneFMenu.uniforms[KFC.UniId.uLightDirection] = this.lightDir;
	this.sceneFMenu.uniforms[KFC.UniId.uFog] = [2000];
	
	this.colSecA	= [ 10/256, 207/256,   0/256];
	this.colSecB	= [  0/256, 155/256, 149/256];
	this.colTitle	= [255/256, 113/256,   0/256];
	this.colErr		= [253/256,   0/256,   6/256];
	
	
	this.camera = new KFC.PerspectiveCamera(45, game.aspect, 0.1, 10000 );
	vec3.set([383.349, 12.549, -354.146], this.camera.position);
	vec3.set([0.060, -12.009, 0.000], this.camera.rotation);
	
	
	this.hudCamera = new KFC.PerspectiveCamera(45, game.aspect, 0.1, 4000 );
	
	this.menuX = 0;
	this.nextMenuX = 0;
	this.menuY = 3;
	this.nextMenuY = 1;
	this.afterFade = null;
	this.menuFade = 0.0;
	this.menuFadeY = 0.0;
	this.fadeTo = 0;
	this.fadeTime = 0;
	this.cameraMode = 0;
	
	this.pingStart = 0;
	this.pings = [];
	this.pingAvg = 0;
	
	this.titles = [];
	
	this.menuMat = mat4.create();
	
	this.coll = new KFC.PhysMesh();
	
	this.hudText = [];
	this.hudMat = mat4.create();
	mat4.identity(this.hudMat);
	mat4.translate(this.hudMat, [196.7, 4.5, -64.5]);
	mat4.rotate(this.hudMat, 0.807, [0, 1, 0]);
	
	this.fadeCB = function() {};
	
	this.shopCars = [];
	this.shopCarsModels = [];
	
	this.shopSelection = 0;
	this.shopConfirm = 0;
	
	this.fColor = [0.0, 0.0, 0.0];
	this.sColor = [1.0, 1.0, 1.0];
	this.lastP = 0;

};


KFC.SCMain.prototype.resize = function( width, height ) {
	this.camera.aspect = width/((height > 0) ? height : 1);
    this.camera.dirty = true;
	
	this.hudCamera.aspect = width/((height > 0) ? height : 1);
    this.hudCamera.dirty = true;

};

KFC.SCMain.prototype.load = function( callback ) {
	var cnt = 1,
		glc = this.game.glc,
		// audio = this.game.audio,
		that = this,
		cb, i;
	
	cb = function() {
		cnt--;
        APP.add('.');
		
		if ( cnt === 0 && typeof(callback) === 'function' ) {			
			callback();
			that.startTime = (new Date()).getTime();
			
			// that.cara = new KFC.CarAudio(that.car, audio);
			
			
		} else if ( cnt < 0 ) {
			APP.log('Too much callbacks!', 'warn');
		}
	};
	
	cnt++; glc.readyShader('vignette', cb);
	cnt++; glc.readyShader('fade', cb);
	cnt++; glc.readyShader('normal', cb);
	cnt++; glc.readyShader('text', cb);
	cnt++; glc.readyShader('car', cb);
	cnt++; glc.readyShader('terrain', cb);
	cnt++; glc.readyShader('normal', cb);
	cnt++; glc.readyShader('multicol', cb);
	cnt++; glc.readyShader('multicolroad', cb);
	cnt++; glc.readyShader('sky', cb);
	cnt++; glc.readyShader('transparent', cb);
	cnt++; glc.readyShader('add', cb);
	
	//cnt++; glc.readyTexture('b3.png', cb);	
	//cnt++; glc.readyTexture('arosa.png', cb);	
	//cnt++; glc.readyTexture('ratai.png', cb, false);	
	cnt++; glc.readyTexture('zemelapio_tex.jpg', cb); // map
	cnt++; glc.readyTexture('smelis_red.jpg', cb);
	cnt++; glc.readyTexture('uola_blue.jpg', cb);
	cnt++; glc.readyTexture('zole_green.jpg', cb);	
	cnt++; glc.readyTexture('kelias.png', cb);	// road
	cnt++; glc.readyTexture('betonas_red.jpg', cb);
	cnt++; glc.readyTexture('sonas_asfalt_green.png', cb);
	cnt++; glc.readyTexture('asphalt.jpg', cb);
	cnt++; glc.readyTexture('water.jpg', cb);	// water
	cnt++; glc.readyTexture('dangus.jpg', cb);	// water
	
	cnt++; glc.readyMesh('isl.obj', true, cb);
	cnt++; glc.readyMesh('road.obj', true, cb);
	
	cnt++; glc.readyMesh('prpl.obj', true, cb);
	
	cnt++; glc.readyMesh('water.obj', true, cb);
	cnt++; glc.readyMesh('vsky.obj', false, cb);
	
	cnt++; glc.readyMesh('b3.obj', false, cb);
	cnt++; glc.readyMesh('arosa.obj', false, cb);
	
	
	cnt++; glc.meshes['title.obj'] = new KFC.TextMesh(glc.gl, 'obj/title.obj', cb);	// preload text mesh
	
	// cnt++; audio.readyBuffer('roll.wav', cb);
	// 
	// cnt++; audio.readyBuffer('offlow.ogg', cb);
	// cnt++; audio.readyBuffer('offmid.ogg', cb);
	// cnt++; audio.readyBuffer('offhigh.ogg', cb);
	// cnt++; audio.readyBuffer('onlow.ogg', cb);
	// cnt++; audio.readyBuffer('onmid.ogg', cb);
	// cnt++; audio.readyBuffer('onhigh.ogg', cb);	 
	
	var isl = new KFC.Obj3D(glc.getMesh('isl.obj'), glc.getShader('multicol'));
	isl.tex0 = glc.getTexture('zemelapio_tex.jpg');
	isl.tex1 = glc.getTexture('uola_blue.jpg');
	isl.tex2 = glc.getTexture('zole_green.jpg');
	isl.tex3 = glc.getTexture('smelis_red.jpg');
	this.scene.add(isl);
	
	var road = new KFC.Obj3D(glc.getMesh('road.obj'), glc.getShader('multicolroad'));
	road.tex0 = glc.getTexture('kelias.png');
	road.tex1 = glc.getTexture('betonas_red.jpg');
	road.tex2 = glc.getTexture('sonas_asfalt_green.png');
	road.tex3 = glc.getTexture('asphalt.jpg');
	this.scene.add(road);
	
	var prpl = new KFC.Obj3D(glc.getMesh('prpl.obj'), glc.getShader('terrain'));
	prpl.tex0 = glc.getTexture('betonas_red.jpg');
	prpl.uniforms[KFC.UniId.uScale] = [40.0];
	this.scene.add(prpl);
	
	var sky = new KFC.Obj3D(glc.getMesh('vsky.obj'), glc.getShader('sky'));
	sky.tex0 = glc.getTexture('dangus.jpg');
	this.scene.add( sky );
	
	var sea = new KFC.Obj3D(glc.getMesh('water.obj'), glc.getShader('water'));
	sea.tex0 = glc.getTexture('water.jpg');
	sea.uniforms[KFC.UniId.uScale] = [100.0];
	this.scene.add( sea );
	
	
	for (i = 0; i < 7; i++ ) {
		this.titles[i] = new KFC.Obj3D(glc.getMesh('title.obj'), glc.getShader('text'));
		this.titles[i].uniforms[KFC.UniId.uColor] = [0, 0, 0];
		vec3.set(this.colSecA, this.titles[i].uniforms[KFC.UniId.uColor]);
		this.titles[i].uniforms[KFC.UniId.uOffset] = [0];
		this.titles[i].text = 'xoxoxox';
		this.titles[i].pos[1] = -0.35 * i;
		this.sceneFMenu.add(this.titles[i]);
	}
	
	this.setupMenu(0);
	
	// hud menu
	for (i = 0; i < 3; i++ ) {
		this.hudText[i] = new KFC.Obj3D(glc.getMesh('title.obj'), glc.getShader('text'));
		this.hudText[i].uniforms[KFC.UniId.uColor] = [0, 0, 0];
		vec3.set(this.colTitle, this.hudText[i].uniforms[KFC.UniId.uColor]);
		this.hudText[i].uniforms[KFC.UniId.uOffset] = [0];
		this.hudText[i].text = 'xoxoxox';
		//this.hudText[i].draw = false;
		this.hudText[i].pos[1] = -0.35 * i;
		this.sceneFMenu.add(this.hudText[i]);
	}
	
	this.coll.meshes_.push(glc.getMesh('road.obj'));
	this.coll.meshes_.push(glc.getMesh('isl.obj'));
	this.coll.meshes_.push(glc.getMesh('prpl.obj'));
	this.coll.meshes_.push(glc.getMesh('water.obj'));
	
	glc.getMesh('road.obj').terr = 0;
	glc.getMesh('isl.obj').terr = 1;
	glc.getMesh('prpl.obj').terr = 0;
	
	cnt++; this.loadObjList('obj/obj.obj', cb);
	cnt++; this.loadObjList('obj/sviestuvai.obj', cb);
	cnt++; this.loadObjList('obj/kont.obj', cb);
	cnt++; this.loadObjList('obj/loc_laivas.obj', cb);
	cnt++; this.loadObjList('obj/loc_hotel.obj', cb);
	cnt++; this.loadObjList('obj/loc_dangoraizis.obj', cb);
	cnt++; this.loadObjList('obj/loc_dangoraizis2.obj', cb);
	cnt++; this.loadObjList('obj/loc_didelis_namas.obj', cb);
	cnt++; this.loadObjList('obj/loc_siena.obj', cb);
	cnt++; this.loadObjList('obj/loc_tvora.obj', cb);
	
	cnt++; this.loadObjList('obj/loc_namas1.obj', cb);
	cnt++; this.loadObjList('obj/loc_namas2.obj', cb);
	cnt++; this.loadObjList('obj/loc_namas3.obj', cb);
	cnt++; this.loadObjList('obj/loc_namas4.obj', cb);
	cnt++; this.loadObjList('obj/loc_palme1.obj', cb);
	
	cnt++; this.loadObjList('obj/loc_svyturys.obj', cb);
	cnt++; this.loadObjList('obj/loc_pastatas1.obj', cb);
	cnt++; this.loadObjList('obj/loc_villa1.obj', cb);
	cnt++; this.loadObjList('obj/loc_perkunas.obj', cb);
	cnt++; this.loadObjList('obj/loc_villa2.obj', cb);
	cnt++; this.loadObjList('obj/loc_villa.obj', cb);
	cnt++; this.loadObjList('obj/loc_lektuvas.obj', cb);
	cnt++; this.loadObjList('obj/loc_angaras.obj', cb);
	cnt++; this.loadObjList('obj/loc_ktu.obj', cb);
	
	cb();
};

KFC.SCMain.prototype.unload = function( callback ) {
	
	
	if ( typeof(callback) === 'function' ) {
		callback();
	}
};


KFC.SCMain.prototype.loadObjList = function( url, cb ) {
	
	var that = this;
	
	KFC.loadFile( url, function(text) {
		that.parseObjList(text, url, cb);
	});
};


/**
 * Parses object list file and adds objects to scene
 * @param text {!string} File contents
 * @param url {!string} file URL
 * @param cb {function()} function to call when finished
 */
KFC.SCMain.prototype.parseObjList = function(text, url, cb) {
	var ln,	lp, n, v, obj,
		v1, v2, v3, f,
		va = [];
		/** @type {!KFC.CGLC} */
	var glc = this.game.glc;
	var dir = vec3.create(),
		lastObject = '';
		
	ln = text.split('\n');
	
	for (n = 0; n < ln.length; n++ ) {
		if ( ln[n].length === 0 ) { continue; }
		lp = ln[n].split(' ');
		if ( lp.length === 0 ) { continue; }
		switch (lp[0]) {
			case '#' :
				break;
			case 'g' :
				lastObject = lp[1].split('.')[0];
				break;
			case 'v' :
				if ( lp.length === 4 ) {
					v = [parseFloat(lp[1]), parseFloat(lp[2]), parseFloat(lp[3])];
					if ( !isNaN(v[0]) && !isNaN(v[1]) && !isNaN(v[2]) ) {
						va.push(v);
					} else {
						throw new Error('Bad vertex data in ' + url + ':' + n);
					}
				} else {
					throw new Error('Wrong vertex data count in ' + url + ':' + n);
				}
				break;
			case 'f' :
				if ( lp.length === 4 ) {	// this assumes only triangulated faces are listed ('f' f1 f2 f3)
					f = [parseInt(lp[1], 10), parseInt(lp[2], 10), parseInt(lp[3], 10)];
					if ( !isNaN(f[0]) && !isNaN(f[1]) && !isNaN(f[2]) ) {
						
						//console.log('add ' + lastObject );
						var mat;
						lastObject = lastObject.replace('_Plane', '');
						
						switch (lastObject) {
							case 'loc_angaras' :
								obj = new KFC.Obj3D(glc.getMesh('angaras.obj'), glc.getShader('terrain'), glc.getTexture('angaras.jpg'));	
								obj.sqDis = 500;			
								this.scene.add(obj);
								break;
							case 'loc_ktu' :
								obj = new KFC.Obj3D(glc.getMesh('tktu.obj'), glc.getShader('terrain'), glc.getTexture('ktu.jpg'));
								obj.sqDis = 1000;
								this.scene.add(obj);
								break;
							case 'loc_medis1' :
								obj = new KFC.Obj3D(glc.getMesh('medis.obj'), glc.getShader('tree'), glc.getTexture('medis.png', false, true));
								obj.blending = true; obj.culling = false;
								obj.sqDis = 500;
								this.scene.add(obj, true);
								break;
							case 'loc_palme1' :
								obj = new KFC.Obj3D(glc.getMesh('palme1.obj'), glc.getShader('tree'), glc.getTexture('palme1.png', false, true));				
								obj.blending = true; obj.culling = false;
								obj.sqDis = 500;
								this.scene.add(obj, true);
								break;
							case 'loc_sviestuvas' :
								obj = new KFC.Obj3D(glc.getMesh('sviestuvas.obj'), glc.getShader('terrain'), glc.getTexture('sviestuvas.jpg'));
								obj.sqDis = 300;
								this.scene.add(obj);
								break;
							case 'loc_kont' :
								obj = new KFC.Obj3D(glc.getMesh('konteineris.obj'), glc.getShader('terrain'), glc.getTexture('konteineris.jpg'));
								obj.sqDis = 500;
								this.scene.add(obj);
								break;
							case 'loc_laivas' :
								obj = new KFC.Obj3D(glc.getMesh('laivas.obj'), glc.getShader('terrain'), glc.getTexture('laivas.png'));
								this.scene.add(obj);
								break;
							case 'loc_hotel' :
								obj = new KFC.Obj3D(glc.getMesh('hotel.obj'), glc.getShader('terrain'), glc.getTexture('hotel.jpg'));
								this.scene.add(obj);
								break;
							case 'loc_dangoraizis' :
								obj = new KFC.Obj3D(glc.getMesh('dangoraizis.obj'), glc.getShader('add'), glc.getTexture('dangoraizis.png', false));
								obj.tex1 = glc.getTexture('dangoraizis_add.png', false);
								obj.tex2 = glc.getTexture('dangus.jpg', false);
								obj.uniforms[KFC.UniId.uColor] = [0,0,0];
								this.scene.add(obj);
								break;
							case 'loc_dangoraizis2' :
								obj = new KFC.Obj3D(glc.getMesh('dangoraizis2.obj'), glc.getShader('terrain'), glc.getTexture('dangoraizis2.png', false));
								this.scene.add(obj);
								break;
							case 'loc_didelis_namas' :
								obj = new KFC.Obj3D(glc.getMesh('didelis_namas.obj'), glc.getShader('terrain'), glc.getTexture('didelis_namas.jpg'));
								this.scene.add(obj);
								break;
							case 'loc_siena' :
								obj = new KFC.Obj3D(glc.getMesh('siena.obj'), glc.getShader('terrain'), glc.getTexture('siena.jpg'));
								this.scene.add(obj);
								obj.sqDis = 200;
								break;
							case 'loc_namas1' :
								obj = new KFC.Obj3D(glc.getMesh('namas1.obj'), glc.getShader('terrain'), glc.getTexture('namas1.jpg'));
								obj.sqDis = 1000;
								this.scene.add(obj);
								break;
							case 'loc_namas2' :
								obj = new KFC.Obj3D(glc.getMesh('namas2.obj'), glc.getShader('terrain'), glc.getTexture('namas2.jpg'));
								obj.sqDis = 1000;
								this.scene.add(obj);
								break;
							case 'loc_tvora' :
								obj = new KFC.Obj3D(glc.getMesh('tvora.obj'), glc.getShader('transparent'), glc.getTexture('tvora.png', false, true));				
								obj.blending = true; obj.culling = false;
								obj.sqDis = 200;
								this.scene.add(obj, true);
								break;
							case 'loc_namas3' :
								obj = new KFC.Obj3D(glc.getMesh('namas3.obj'), glc.getShader('terrain'), glc.getTexture('namas3.jpg'));
								obj.sqDis = 1000;
								this.scene.add(obj);
								break;
							case 'loc_namas4' :
								obj = new KFC.Obj3D(glc.getMesh('namas4.obj'), glc.getShader('terrain'), glc.getTexture('namas4.jpg'));
								obj.sqDis = 1000;
								this.scene.add(obj);
								break;
							case 'loc_svyturys' :
								obj = new KFC.Obj3D(glc.getMesh('svyturys.obj'), glc.getShader('terrain'), glc.getTexture('svyturys.png'));		
								obj.sqDis = 1000;	
								this.scene.add(obj);								
								break;
							case 'loc_perkunas' :
								obj = new KFC.Obj3D(glc.getMesh('perkunas.obj'), glc.getShader('terrain'), glc.getTexture('perkunas.jpg'));
								obj.sqDis = 500;
								this.scene.add(obj);								
								break;
							case 'loc_pastatas1' :
								obj = new KFC.Obj3D(glc.getMesh('pastatas1.obj'), glc.getShader('terrain'), glc.getTexture('pastatas1.jpg'));
								this.scene.add(obj);								
								break;
							case 'loc_villa' :
								obj = new KFC.Obj3D(glc.getMesh('villa.obj'), glc.getShader('terrain'), glc.getTexture('villa.jpg'));
								obj.sqDis = 500;
								this.scene.add(obj);								
								break;
							case 'loc_villa1' :
								obj = new KFC.Obj3D(glc.getMesh('villa1.obj'), glc.getShader('terrain'), glc.getTexture('villa1.jpg'));
								obj.sqDis = 500;
								this.scene.add(obj);								
								break;
							case 'loc_villa2' :
								obj = new KFC.Obj3D(glc.getMesh('villa2.obj'), glc.getShader('terrain'), glc.getTexture('villa2.jpg'));
								obj.sqDis = 500;
								this.scene.add(obj);								
								break;
							case 'loc_lektuvas' :
								obj = new KFC.Obj3D(glc.getMesh('lektuvas.obj'), glc.getShader('terrain'), glc.getTexture('lektuvas.jpg'));
								obj.sqDis = 500;
								this.scene.add(obj);								
								break;
							default :
								APP.log('Unknown object name "' + lastObject +'"', 'warn');
								va = [];
								continue;
						}
						
						vec3.set(va[0], obj.pos);
						vec3.subtract(va[0], va[1], dir);						
						var scale = vec3.length(dir);
						var angle = Math.atan(dir[0]/dir[2]);
						if (dir[2] > 0.0) {
							angle += Math.PI;
						}
						obj.sqDis = obj.sqDis * obj.sqDis;
						
						if ( lastObject === 'loc_palme1' ||  lastObject === 'loc_medis1' ) {
							scale *= 2.0;
						}
						
						mat4.identity(obj.mvMatrix);
						mat4.translate(obj.mvMatrix, va[0]);
						mat4.rotate(obj.mvMatrix, angle - Math.PI/2.0, [0, 1, 0]);
						
						mat4.toInverseMat3(obj.mvMatrix, obj.nMatrix);
						mat3.transpose(obj.nMatrix);
						
						mat4.scale(obj.mvMatrix, [scale, scale, scale]);
						
						
						obj.dirty = false;
						
						va = [];
					} else {
						throw new Error('Bad vertex data in ' + url + ':' + n);
					}
				} else {
					throw new Error('Wrong face data count in ' + url + ':' + n);
				}
				break;
			default :
				//console.warn('Unknown obj data in ' + this.url_ + ':' + n + '\n' + ln[n]);
		}
	}
	
	if ( typeof cb === 'function' ) {
		cb();
	}
	
};


KFC.SCMain.prototype.setupMenu = function(menuX) {
	
	switch (menuX) {
	case 0 :	// login menu
		
		this.titles[0].text = 'webgl driver';
		vec3.set(this.colTitle, this.titles[0].uniforms[KFC.UniId.uColor]);
		this.titles[1].text = 'user: ' + this.user;
		this.titles[2].text = 'pass: ' + (new Array(this.pass.length+1)).join('*');
		this.titles[3].text = 'login>';
		this.titles[4].text = 'register>';
		this.titles[5].text = 'options>';
		
		this.titles[6].text = '';
		vec3.set(this.colErr, this.titles[6].uniforms[KFC.UniId.uColor]);
		
		break;
	case 1 :	// options
		this.titles[0].text = 'options';
		// this.titles[1].text = 'sound ' + KFC.padString( this.game.audioGain.toString(), 4, ' ');
		this.titles[2].text = 'video ' + KFC.padString( Math.floor(this.game.canvasScale * 10.0).toString(), 4, ' ');
		this.titles[3].text = 'fov   ' + ((this.game.fieldOfView)?'  on':' off');
		this.titles[4].text = 'render ' + KFC.padString( this.game.renderDis.toString(), 3, ' ');
		this.titles[5].text = '<back';			
		this.titles[6].text = '';
		
		break;
	case 2 :	// game menu
		this.titles[0].text = 'game menu';
		this.titles[1].text = 'continue';
		this.titles[2].text = 'options';
		this.titles[3].text = 'main menu';
		this.titles[4].text = '';
		this.titles[5].text = '';			
		this.titles[6].text = '';
		
		break;
	case 3 :	// game menu
		this.titles[0].text = 'choose your car';
		this.titles[1].text = '<name>';
		this.titles[2].text = '';
		this.titles[3].text = '';
		this.titles[4].text = '';
		this.titles[5].text = '';			
		this.titles[6].text = '';
		
		break;
	default :
		this.titles[0].text = ''; 
		this.titles[1].text = ''; 
		this.titles[2].text = ''; 
		this.titles[3].text = ''; 
		this.titles[4].text = ''; 
		this.titles[5].text = ''; 
		this.titles[6].text = ''; 
	}
	
};

KFC.SCMain.prototype.updateMenu = function(input, dt) {
	
	var car;
	var i, t, text,
		down = input.wasKeyPressed(input.KEY_DOWN) || input.wasGamepadButtonPressed(input.PAD_DOWN) || input.wasKeyPressed(input.KEY_TAB),
		up   = input.wasKeyPressed(input.KEY_UP  ) || input.wasGamepadButtonPressed(input.PAD_UP),
		left = input.wasKeyPressed(input.KEY_LEFT) || input.wasGamepadButtonPressed(input.PAD_LEFT),
		right = input.wasKeyPressed(input.KEY_RIGHT) || input.wasGamepadButtonPressed(input.PAD_RIGHT),
		ok = input.wasKeyPressed(input.KEY_ENTER) || input.wasGamepadButtonPressed(input.PAD_A),
		cancel = input.wasKeyPressed(input.KEY_BACKSPACE) || input.wasGamepadButtonPressed(input.PAD_B),
		logout = input.wasKeyPressed(input.KEY_L) || input.wasGamepadButtonPressed(input.PAD_Y);
		
	if ( this.game.serverState === this.game.ONLINE ) {	// gameplay
		
		
		if ( this.menuX === -1 && cancel ) {
			
			this.menuX = 2;
			this.setupMenu(this.menuX);
			this.menuY = -1;
			this.nextMenuY = 1;
			this.fadeTo = -3;
			this.fadeCB = null;
			// this.game.audio.play('roll.wav');
		}
		
		if ( this.menuX === 2 && this.fadeTo === 0 ) {
			
			if ( down ) {
				this.menuY++;
				if ( this.menuY >= 4 ) { this.menuY = 1; }
				// this.game.audio.play('roll.wav');
			}
			
			if ( up ) {
				this.menuY--;
				if ( this.menuY <= 0 ) { this.menuY = 3; }
				// this.game.audio.play('roll.wav');
			}
			
			if ( (this.menuY === 1 && ok) || cancel ) {
				this.nextMenuX = -1;
				this.fadeTo = 3;
				// this.game.audio.play('roll.wav');
			}
			
			if ( this.menuY === 2 && (ok || right) ) {
				this.nextMenuX = 1;
				this.nextMenuY = 1;
				this.fadeTo = 1;
				// this.game.audio.play('roll.wav');
			}
			
			if ( this.menuY === 3 && (ok) ) {
				// this.game.audio.play('roll.wav');
				this.logoutToMain();
				//this.menuX = 1;
				//this.nextMenuY = 1;
				//this.fadeTo = 1;
			}
			
		}
		
		if ( logout ) {
			APP.log('logout');
			// this.game.audio.play('roll.wav');
			// NI.close();
		}
		
	}
	
	if ( this.menuX === 0 && this.menuY !== 1 && this.menuY !== 2 && this.fadeTo === 0 && this.game.serverState === this.game.NOTCON && cancel ) {
		this.nextMenuX = -1;
		this.fadeTo = 3;
		this.nextMenuY = 3;
		this.fadeCB = null;
		// this.game.audio.play('roll.wav');
	}
	if ( this.menuX === -1 && this.fadeTo === 0 && this.game.serverState === this.game.NOTCON && cancel ) {
		this.menuX = 0;
		this.setupMenu(this.menuX);
		this.menuY = -1;
		this.nextMenuY = 3;
		this.fadeTo = -3;
		// this.game.audio.play('roll.wav');
	}	
	
	if ( this.menuX === 0 && this.fadeTo === 0 && this.game.serverState === this.game.NOTCON ) {
		
		if ( down ) {
			this.menuY++;
			if ( this.menuY >= 6 ) { this.menuY = 1; }			
			// this.game.audio.play('roll.wav');
		}
		if ( up ) {
			this.menuY--;
			if ( this.menuY <= 0 ) { this.menuY = 5; }
			// this.game.audio.play('roll.wav');
		}
		
		if ( this.menuY === 1 ) {			
			text = input.handleText( this.user );
			if ( text !== this.user ) {	
				// this.game.audio.play('roll.wav');
				if ( text.length > 10 ) {
					text = text.slice(0, 10);
				}
				this.user = text;
				this.titles[1].text = 'user: ' + this.user;
			}
		}
		
		if ( this.menuY === 2 ) {			
			text = input.handleText( this.pass );
			if ( text !== this.pass ) {
				// this.game.audio.play('roll.wav');
				if ( text.length > 16 ) {
					text = text.slice(0, 16);
				}
				this.pass = text;
				this.titles[2].text = 'pass: ' + (new Array(this.pass.length+1)).join('*');
			}
		}
		
		if ( (this.menuY === 1 || this.menuY === 2 || this.menuY === 3) && ok && this.game.serverState === this.game.NOTCON ) {
			// this.game.audio.play('roll.wav');	
			if ( NI.state === 2 ) {
				if ( (this.user === '') || (this.pass === '') ) {
					this.titles[6].text = 'enter fields';
				} else {
					// NI.send('LOG ' + this.user + ' ' + this.pass);
					this.game.serverState = this.game.LOGIN;
					this.titles[6].text = 'logging in';
				}
			} else {
				this.titles[6].text = 'server offline =\\';
				
				if ( this.offlineTries < 2 ) {
					
					this.offlineTries++;
					
					if ( NI.state === 3 ) {
						
						NI.init(this.game.wsurl);
					}
					
				} else {
					
					this.titles[6].text = 'fine, ok, go play';
				
					this.game.id = 43;
					
						car = new KFC.Car( -1 );
						car.coll = this.coll;
						var model = new KFC.CarModel(car, this.game.glc, this.debug);
						// var audio = new KFC.CarAudio(car, this.game.audio);
						
						this.scene.add(model);
						// TODO audio					
						this.game.cars.push(car);
						this.game.carsm.push(model);
						// this.game.carsa.push(audio);
						
						this.game.players[43] = {};
						this.game.players[43].car = car;
						this.game.players[43].model = model;
						// this.game.players[43].audio = audio;
						
						this.game.serverState = this.game.ONLINE;
						
					this.nextMenuX = -1;
					this.fadeTo = 3;
					
					var that = this;
					this.fadeCB = function() {
						that.cameraMode = 1;
					};
					
				}
				
			}
		}
		
		if ( this.menuY === 4 && ok && this.game.serverState === this.game.NOTCON ) {
			// this.game.audio.play('roll.wav');
			if ( NI.state === 2 ) {
				
				if ( (this.user === '') || (this.pass === '') ) {
					this.titles[6].text = 'enter fields';
				} else {
					// NI.send('REG ' + this.user + ' ' + this.pass);
					this.game.serverState = this.game.REGIN;
					this.titles[6].text = 'registering in';
				}
			} else {
				this.titles[6].text = 'server offline =\\';
			}
		}
		
		if ( this.menuY === 5 && (ok || right) ) {
			this.fadeTo = 1;
			this.nextMenuX = 1; // settings
			this.nextMenuY = 1;
			// this.game.audio.play('roll.wav');
		}

		
	} else if ( this.menuX === 1 && this.fadeTo === 0 ) {
		
		if ( down ) {
			this.menuY++;
			if ( this.menuY >= 6 ) { this.menuY = 1; }			
			// this.game.audio.play('roll.wav');
		}
		if ( up ) {
			this.menuY--;
			if ( this.menuY <= 0 ) { this.menuY = 5; }			
			// this.game.audio.play('roll.wav');
		}
		
		if ( this.menuY === 1 && left ) {			
			// this.game.audioGain = KFC.clamp(this.game.audioGain - 1, 0, 10);			
			// this.game.audio.setGain( this.game.audioGain / 10, 0.2 );
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}
		
		if ( this.menuY === 1 && right ) {
			// this.game.audioGain = KFC.clamp(this.game.audioGain + 1, 0, 10);			
			// this.game.audio.setGain( this.game.audioGain / 10, 0.2 );
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}
		
		if ( this.menuY === 2 && left ) {
			this.game.canvasScale = Math.floor(KFC.clamp(this.game.canvasScale - 0.1, 0.1, 2.6)*10+0.01)/10;
			this.game.fresize();
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}
		
		if ( this.menuY === 2 && right ) {
			this.game.canvasScale = Math.floor(KFC.clamp(this.game.canvasScale + 0.1, 0.1, 2.6)*10+0.01)/10;
			this.game.fresize();			
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}
		
		if ( this.menuY === 3 && (left || right || ok) ) {
			this.game.fieldOfView = !this.game.fieldOfView;
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}
		
		if ( this.menuY === 4 && left ) {			
			this.game.renderDis--;
			if ( this.game.renderDis < 1 ) { this.game.renderDis = 1; }
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}
		if ( this.menuY === 4 && right ) {
			this.game.renderDis++;
			if ( this.game.renderDis > 10 ) { this.game.renderDis = 10; }
			// this.game.audio.play('roll.wav');
			this.setupMenu(1);
		}

			
		if ( cancel || (this.menuY === 5 && (ok || left))) {
			
			if ( this.game.serverState === this.game.NOTCON ) {	
				this.menuX = 0;	// login menu
				this.nextMenuY = 5;
			} else if ( this.game.serverState === this.game.ONLINE ) {
				this.menuX = 2;	// game menu
				this.nextMenuY = 2;
			}
			
					
			this.fadeTo = -1;
			// this.game.audio.play('roll.wav');
		}
	}	
	
	if ( this.fadeTo === 1 ) {	// fade to right
		this.menuFade += dt*20;
		if ( this.menuFade >= 5 ) {
			this.menuX = this.nextMenuX;
			this.setupMenu(this.menuX);
			this.menuY = -1;
			
			this.menuFade = -5;
			this.fadeTo = 2;
		}
	}
	if ( this.fadeTo === 2 ) {
		this.menuFade += dt*20;
		if ( this.menuFade > 0 ) {
			this.menuY = this.nextMenuY;
			
			this.menuFade = 0;
			this.fadeTo = 0;
		}
	}
	
	
	if ( this.fadeTo === -1 ) {
		this.menuFade -= dt*20;
		if ( this.menuFade <= -5 ) {			
			this.setupMenu(this.menuX);
			this.menuY = -1;
			
			this.fadeTo = -2;
			this.menuFade = 5;
		}
	}
	if ( this.fadeTo === -2 ) {
		this.menuFade -= dt*20;
		if ( this.menuFade < 0 ) {
			this.menuY = this.nextMenuY;
			
			this.menuFade = 0;
			this.fadeTo = 0;
		}
	}
	
	if ( this.fadeTo === 3 ) {	// fade to top
		this.menuFadeY += dt*10;
		if ( this.menuFadeY > 2 ) {
			
			this.fadeTo = 0;
			
			this.menuX = this.nextMenuX;
			this.setupMenu(this.nextMenuX);
			
			if ( typeof this.fadeCB === 'function' ) { this.fadeCB(); }
		}
	}	
	if ( this.fadeTo === -3 ) {	// fade from top
		this.menuFadeY -= dt*10;
		if ( this.menuFadeY < 0 ) {
			this.menuY = this.nextMenuY;
			
			this.menuFadeY = 0;
			this.fadeTo = 0;
		}
	}
	
	
	
	mat4.identity(this.menuMat);
	mat4.translate(this.menuMat, [-1.8, 0.8, -3.5]);		
	mat4.rotate(this.menuMat, -1.02, [0, 1, 0]);
		
	if ( this.menuX === 2 || (this.menuX === 1 && this.game.serverState === this.game.ONLINE)) {
		mat4.scale(this.menuMat, [0.5, 0.5, 0.5]);
	}
	if ( this.game.serverState === this.game.SHOP ) {
		mat4.identity(this.menuMat);
		mat4.translate(this.menuMat, [-1.8, 1.2, -3.5]);		
		mat4.rotate(this.menuMat, -1.02, [0, 1, 0]);
		mat4.scale(this.menuMat, [0.5, 0.5, 0.5]);
	}
	

	t = null;
	for ( i = this.titles.length - 1; i >= 0; i-- ) {
		t = this.titles[i];
		if ( this.menuY === i ) {
			if ( t.pos[0] < 0.1 ) {
				t.pos[0] += 0.6 * dt;
				if ( t.pos[0] > 0.1 ) { t.pos[0] = 0.1; }
				t.uniforms[KFC.UniId.uColor][0] = this.colSecA[0]*(1-t.pos[0]*10) + this.colSecB[0]*(t.pos[0]*10);
				t.uniforms[KFC.UniId.uColor][1] = this.colSecA[1]*(1-t.pos[0]*10) + this.colSecB[1]*(t.pos[0]*10);
				t.uniforms[KFC.UniId.uColor][2] = this.colSecA[2]*(1-t.pos[0]*10) + this.colSecB[2]*(t.pos[0]*10);
			}
		} else {
			if ( t.pos[0] > 0 ) {
				t.pos[0] -= 0.6 * dt;
				if ( t.pos[0] < 0.0 ) { t.pos[0] = 0.0; }
				t.uniforms[KFC.UniId.uColor][0] = this.colSecA[0]*(1-t.pos[0]*10) + this.colSecB[0]*(t.pos[0]*10);
				t.uniforms[KFC.UniId.uColor][1] = this.colSecA[1]*(1-t.pos[0]*10) + this.colSecB[1]*(t.pos[0]*10);
				t.uniforms[KFC.UniId.uColor][2] = this.colSecA[2]*(1-t.pos[0]*10) + this.colSecB[2]*(t.pos[0]*10);
			}
		}
		
		// TODO, change when needed
		mat4.set(this.menuMat, t.mvMatrix);
		mat4.translate(t.mvMatrix, t.pos);	
		mat4.translate(t.mvMatrix, [0,
									Math.pow(this.menuFadeY, 2) * KFC.sign(this.menuFadeY),
									Math.pow(this.menuFade, 2) * KFC.sign(this.menuFade) ]);	
		mat4.toInverseMat3(t.mvMatrix, t.nMatrix);
		mat3.transpose(t.nMatrix);
		
		if ( i === 0 ) {
			mat4.scale(t.mvMatrix, [1.2, 1.2, 1.2]);
		}
	}
	
	
	// write text to HUD menu
	if ( this.game.players[this.game.id] ) {
		car = this.game.players[this.game.id].car;		
		var gs = ['N', '1', '2', '3', '4', '5', '6']; gs[10] = 'R';		
		var wspeed = (car.wheels[1].vrot * car.wheels[1].radius + car.wheels[0].vrot * car.wheels[0].radius) / 2 * 3.6; // m/s
		this.hudText[0].draw = true;
		this.hudText[1].draw = true;
		this.hudText[2].draw = false;
		this.hudText[0].text = KFC.padString( Math.floor(Math.abs(wspeed)) + ' KPH', 7, ' ' );
		this.hudText[1].text = KFC.padString( Math.floor(car.engine.vel*30/Math.PI) + ' ' + gs[car.gear].toString(), 7, ' ' );
	} else {
		this.hudText[0].draw = false;
		this.hudText[1].draw = false;
		this.hudText[2].draw = false;
	}
	
	// Move HUD matrix to front of camera
	mat4.identity(this.hudMat);	
	mat4.translate(this.hudMat, [0.96, -0.8, -3.5]);		
	mat4.rotate(this.hudMat, -2, [0, 1, 0]);		
	mat4.scale(this.hudMat, [0.5, 0.5, 0.5]);
	
	// Move HUD text to front of camera
	for ( i = this.hudText.length - 1; i >= 0; i-- ) {
		t = this.hudText[i];
		if ( !t.draw ) { continue; }
		
		mat4.set(this.hudMat, t.mvMatrix);
		mat4.translate(t.mvMatrix, t.pos);
		
		mat4.toInverseMat3(t.mvMatrix, t.nMatrix);
		mat3.transpose(t.nMatrix);
	}
	
};


KFC.SCMain.prototype.setupShop = function() {
	
	var i, c;
	
	vec3.set([-312.256, 1.680, 18.914], this.camera.position);
	vec3.set([-0.100, -2.59, 0], this.camera.rotation);
	this.camera.dirty = true;
	
	this.shopConfirm = 0;
	
	this.game.serverState = this.game.SHOP;
	
	var carTypes = [1, 2, 3, 4, 5, 6, 9, 11];
	var scar = null;
	var scarmodel = null;
	
	for ( i = 0; i < carTypes.length; i++ ) {
		scar = new KFC.Car(carTypes[i]);
		scar.coll = this.coll;
		vec3.set([-298.390 - i * 8.0, 0.388, 25.159 - i * 0.3], scar.pos_wc);
		
		scarmodel = new KFC.CarModel(scar, this.game.glc, this.debug);
		this.scene.add(scarmodel);
		
		this.shopCars.push(scar);
		this.shopCarsModels.push(scarmodel);
	}
	
	for ( i = 0; i < 400; i++ ) {
		for ( c = 0; c < this.shopCars.length; c++ ) {
			this.shopCars[c].integrate(this.game.intStep);
		}
	}
	
	this.menuX = 3;
	this.setupMenu(this.menuX);
	this.nextMenuY = 1;
	this.fadeTo = -3;
	
};

KFC.SCMain.prototype.updateShop = function(input, dt) {
	
	var i, t, text,
		down = input.wasKeyPressed(input.KEY_DOWN) || input.wasGamepadButtonPressed(input.PAD_DOWN) || input.wasKeyPressed(input.KEY_TAB),
		up   = input.wasKeyPressed(input.KEY_UP  ) || input.wasGamepadButtonPressed(input.PAD_UP),
		left = input.wasKeyPressed(input.KEY_LEFT) || input.wasGamepadButtonPressed(input.PAD_LEFT),
		right = input.wasKeyPressed(input.KEY_RIGHT) || input.wasGamepadButtonPressed(input.PAD_RIGHT),
		ok = input.wasKeyPressed(input.KEY_ENTER) || input.wasGamepadButtonPressed(input.PAD_A),
		cancel = input.wasKeyPressed(input.KEY_BACKSPACE) || input.wasGamepadButtonPressed(input.PAD_B),
		cpos = vec3.create();
		
	if ( this.shopConfirm === 0 ) {
		if ( left ) {
			this.shopSelection--;
			if ( this.shopSelection < 0 ) {
				this.shopSelection = 7;
			}
			// this.game.audio.play('roll.wav');
		}
		if ( right ) {
			this.shopSelection++;
			if ( this.shopSelection > 7 ) {
				this.shopSelection = 0;
			}
			// this.game.audio.play('roll.wav');
		}
		if ( ok ) {
			this.shopConfirm = 1;
		}
		
		var names = ['Guolen B3', 'Ring Alpha', 'Gunter ULF', 'Hamer Head', 'Takamura F35', 'Biattino Arosa', 'Beat R500', 'Admin car'];
		var price = ['22,000', '21,000', '25,000', '92,300', '52,000', '100,000', '60,000', 'over 9000'];
		
		this.titles[1].text = '<' + names[this.shopSelection] + '>';
		this.titles[2].text = 'price:' + price[this.shopSelection] + '\u20AC';
		this.titles[3].text = '';
		
	} else if ( this.shopConfirm === 1 ) {
		
		this.titles[3].text = 'Are you shure?';
		
		if ( cancel ) {
			this.shopConfirm = 0;
			// this.game.audio.play('roll.wav');
		}
		
		if ( ok ) {
			var carTypes = [1, 2, 3, 4, 5, 6, 9, 11];
			
			console.log('BUY ' + carTypes[this.shopSelection]);
			// NI.send('BUY ' + carTypes[this.shopSelection]);
			// this.game.audio.play('roll.wav');
		}
	}
	
		
	cpos[0] = -312.256 + (this.shopSelection-1) * -8.0;
	cpos[1] = 1.680;
	cpos[2] = 18.914 + (this.shopSelection-1) * -0.3;
	
	
	this.camera.goTo(cpos, dt);
	this.camera.dirty = true;
	
};

KFC.SCMain.prototype.cleanShop = function() {	
	/** @type {number} */
	var i;
	
	for ( i = this.shopCarsModels.length - 1; i >= 0; i-- ) {
		var model = this.shopCarsModels[i];
		model.removeFromScene(this.scene);
	}
	
	this.shopCarsModels.length = 0;
	this.shopCars.length = 0;
	
};

KFC.SCMain.prototype.setCamModeToOne = function() {
	this.cameraMode = 1;
};

KFC.SCMain.prototype.parseBinary = function( message ) {
	
	/** @type {number} */
	var i;
	
	var ua = new Uint8Array( message, 0, 12 );
	var ia = new Uint32Array( message, 4, 1 );
	
	var sframe = ia[0];	// server state frame			
	
		//console.log('binary frame');
		//console.log(message);
		//console.log(ua[0], ua[1]);
		
	if ( ua[0] === 67 && ua[1] === 68 ) {	// state frame
		
		var id = ua[2]*256 + ua[3];
		var car = null;
		
		if ( ! this.game.players[id] ) {	// new car
			
			if ( this.game.ripf[id] && (this.game.ripf[id] + 500 > this.iframe) ) {
				console.log('Dead car driving ' + id);
				return;
			}
			
			console.log('NEW car ' + id);
			
			car = new KFC.Car( ua[8] );
			car.coll = this.coll;
			var model = new KFC.CarModel(car, this.game.glc, this.debug);
			// var audio = new KFC.CarAudio(car, this.game.audio);
			
			this.scene.add(model);
			// TODO audio					
			this.game.cars.push(car);
			this.game.carsm.push(model);
			// this.game.carsa.push(audio);	
			
			this.game.players[id] = {};
			this.game.players[id].car = car;
			this.game.players[id].model = model;
			// this.game.players[id].audio = audio;
		}
		
		car = this.game.players[id].car;
		
		if ( id !== this.game.id ) {	// different car
			sframe += 120;
			
			if ( sframe > this.iframe ) { // state frame is in the future
				var sQueue = car.stateQueue;	// save state to queue
				sQueue.push({
					iframe : sframe,
					state : message
				});
				return;	// do not integrate car to future frame
			}
		}
		
		if ( this.iframe - sframe > 400 ) {
			//console.log('OLD ' + (this.iframe - sframe) + ' contorol frame');
			return;
		}
		
		car.setData( message, 8 );	// send car back in time
		
		var queue = car.controllQueue;
		var qi = 0;				
		while ( queue[0] && queue[0].iframe < sframe ) {
			queue.shift();	// remove old frames
		}
		
		for ( i = sframe; i < this.iframe; i++ ) {
			if ( queue[qi] && queue[qi].iframe === i ) {
				car.throttle = queue[qi].throttle;
				car.brakes = queue[qi].brakes;
				car.steerAngle = queue[qi].steerAngle;
				
				qi++;
			}
			car.integrate(this.iStep);
		}				
	}
};

KFC.SCMain.prototype.updateNetwork = function() {
	
	if ( NI.state !== 2 ) { return; }
	
	/** @type {number} */
	var i;
	/** @type {number} */
	var m;
	/** @type {number} */
	var id;

	var p;
	
	var messages = NI.getLast();
	var msgCount = messages.length;
	
	for ( m = 0; m < msgCount; m++ ) {
		var message = messages[m];
		
		if ( typeof message !== 'string' ) { 
			this.parseBinary(message);
			continue;
		}
		
		var msgParts = message.split(' ');
		
		switch( msgParts[0] ) {
		case 'HI!' :
			//console.log('Server says HI!');
			break;
		case 'HID' :	// Hello, your id is
			this.game.id = parseInt(msgParts[1], 10);
			
			console.log("New ID: " + this.game.id);
			break;
		case 'LOG' :	// loggin querry responce
			if ( this.game.serverState !== this.game.LOGIN ) {
				console.log('Server LOG message not in place!');
				continue;
			}
			
			if ( msgParts[1] === 'SUC' ) {
				this.titles[6].text = 'Logged in!';
				vec3.set(this.colSecA, this.titles[6].uniforms[KFC.UniId.uColor]);
				
				this.game.serverState = this.game.ONLINE;
				this.nextMenuX = -1;
				this.fadeTo = 3;
				
				var that = this;
				this.fadeCB = this.setCamModeToOne;
				
				// this.game.audio.play('roll.wav');
			} else {
				this.titles[6].text = (msgParts.slice(2).join(' ')).slice(0, 16).toLowerCase();// 'error logging in';
				vec3.set(this.colErr, this.titles[6].uniforms[KFC.UniId.uColor]);
				this.game.serverState = this.game.NOTCON;
			}
			
			break;
		case 'REG' :	// registration querry responce
			
			if ( this.game.serverState !== this.game.REGIN ) {
				console.log('Server REG message not in place!');
				continue;
			}
			
			if ( msgParts[1] === 'SUC' ) {			
				this.titles[6].text = 'Registered!';				
				vec3.set(this.colSecA, this.titles[6].uniforms[KFC.UniId.uColor]);
				
				this.game.serverState = this.game.LOGIN;
				this.nextMenuX = -1;
				this.fadeTo = 3;
				
				this.fadeCB = this.setCamModeToOne;
				
				// this.game.audio.play('roll.wav');
			} else {
				this.titles[6].text = (msgParts.slice(2).join(' ')).slice(0, 16).toLowerCase();// 'error logging in';
				vec3.set(this.colErr, this.titles[6].uniforms[KFC.UniId.uColor]);
				this.game.serverState = this.game.NOTCON;
			}
			
			break;
		case 'POG' :
			this.pings.push((new Date()).getTime() - this.pingStart);
			
			if (this.pings.length < 20) {
				this.pingStart = (new Date()).getTime();
				// NI.send('PIG');
			} else if ( this.pings.length === 20 ) {
				this.pingAvg = 0;
				for ( i = this.pings.length-1; i >= 0; i-- ) {
					this.pingAvg += this.pings[i];
				}
				this.pingAvg = Math.ceil(this.pingAvg/this.pings.length);
				// NI.send('SIF');
			}
			break;
		case 'SIF' :	// set iframe to the server
			console.log('Synchronizing time with server ' + msgParts[1]);
			
			this.iframe = parseInt(msgParts[1], 10) + Math.ceil(1.3 * this.pingAvg / 2);
			break;
		
		case 'OUT' :	// other player logged out
			
			id = parseInt(msgParts[1], 10);			
			p = this.game.players[id];
			
			console.log('OUT ' + id);
			
			if ( p ) {
			
				p.model.removeFromScene(this.scene);
				// p.audio.remove();
				
				this.game.cars.splice( this.game.cars.indexOf(p.car), 1 );
				this.game.carsm.splice( this.game.carsm.indexOf(p.model), 1 );
				// this.game.carsa.splice( this.game.carsa.indexOf(p.audio), 1 );
				this.game.players[id] = null;
				
				this.game.ripf[id] = this.iframe;
			}
			
			break;
		case 'CNT' :	// controll frame from other players
			
			id = parseInt(msgParts[1], 10);			
			p = this.game.players[id];			
			if ( !p ) { continue; }
			
			var car = this.game.players[id].car;
			var pciframe = this.iframe - 120;
			
			if ( parseInt(msgParts[2], 10) < pciframe ) {
				console.log('PC controll frame came ' + (pciframe - parseInt(msgParts[2], 10)) + ' frames too late');
			} else {
				car.controllQueue.push({
					iframe	: parseInt(msgParts[2], 10) + 120,
					throttle	: parseFloat(msgParts[3]),
					brakes	: parseFloat(msgParts[4]),
					steerAngle : parseFloat(msgParts[5])
				});
			}
			
			break;
		case 'LAG' :
			
			console.log('High ping, slowing down');
			this.iframe += 1;
			break;
		
		case 'GBC' : // go buy a car
			console.log('Go buy a car');
			this.setupShop();
			break;
		
		case 'BOK' : // Buying car was success
			
			this.game.serverState = this.game.ONLINE;	// gameplay state
			this.menuX = -1;			// turn off menu
			this.fadeTo = 3;			// fade to top	
			
			this.fadeCB = this.setCamModeToOne();	// after fade setvamera to one
			
			this.cleanShop();
			
			break;
		default:
			console.log('Unknown message form server ' + message);
		}
		
	}
	
	if ( this.pingStart === 0 ) {
		this.pingStart = (new Date()).getTime();
		// NI.send('PIG');
		//console.log(this.pingStart);
	}
	
};


KFC.SCMain.prototype.logoutToMain = function() {
	console.log('logout');
	
	// NI.send('OUT');
	
	var id;
	var player;
	
	for ( id in this.game.players ) {	// remove all active player data
		if ( this.game.players.hasOwnProperty(id) ) {
			player = this.game.players[id];
			
			if (player === null) { continue; }
			
			player.model.removeFromScene(this.scene);
			// player.audio.remove();
			
			this.game.ripf[id] = this.iframe;	// mark car death time
			
		}
	}
	
	this.game.cars.length = 0;
	this.game.carsm.length = 0;
	this.game.carsa.length = 0;
	
	this.game.players = {};
	
	this.game.id = -1;
	
	this.nextMenuX = -1;
	this.fadeTo = 3;
	
	this.cameraMode = 0;
	
	var that = this;
	this.fadeCB = function() {
		this.menuX = 0;
		this.setupMenu(this.menuX);
		
		this.menuY = -1;
		this.nextMenuY = 3;
		this.fadeTo = -3;
		this.fadeCB = null;
		this.game.serverState = this.game.NOTCON;
	};
	
};


KFC.SCMain.prototype.update = function(input, time) {
	var dt = (time - this.time)/1000;
	if ( dt > 0.1 ) {
		var sf = Math.floor((dt - this.iStep) / this.iStep);
		console.log('Skipping ' + sf + ' frames');
		this.iframe += sf;
		dt = this.iStep;
		this.acc = 0.0;
	}
	else if ( dt < 0 ) { dt = 0; }
	this.time = time;
	this.acc += dt;
	
	var i;
	
	var car = this.game.players[this.game.id] && this.game.players[this.game.id].car;
	var model = this.game.players[this.game.id] && this.game.players[this.game.id].model;
	
	if ( model && NI.state === 3 ) {	// triple rainbow
		var p = (this.time % 1000) / 1000;
		
		if ( p < this.lastP ) {
			this.sColor = this.fColor;
			this.fColor = [Math.random() * 1.2 - 0.1,
						   Math.random() * 1.2 - 0.1,
						   Math.random() * 1.2 - 0.1];
		}
		this.lastP = p;
		
		model.body.uniforms[KFC.UniId.uColor] = [this.fColor[0] * p + this.sColor[0] * (1-p),
												 this.fColor[1] * p + this.sColor[1] * (1-p),
												 this.fColor[2] * p + this.sColor[2] * (1-p)];
	}
	
	if ( input.wasBlur() ) {
		// this.game.audio.setGain(this.game.audioGain * 0.01, 0.5);
	}
	if ( input.wasFocus() ) {
		// this.game.audio.setGain(this.game.audioGain, 0.5);
	}
	
	this.game.FFCamera(this.camera, input, dt, (input.isKeyDown(input.KEY_SHIFT))?20:200);
	
	if ( this.game.serverState === this.game.NOTCON ) {
		this.game.FFCameraGamepad(this.camera, input, dt, 400);
	}
	
	if ( (this.cameraMode === 1 || this.cameraMode === 2) && this.menuX === -1 && car) {		
		this.game.carControl(car, input, dt);
		
		if ( input.wasGamepadButtonPressed(input.PAD_BACK) || input.wasKeyPressed(input.KEY_R)) {
			// NI.send('RST');
			
			// if ( NI.state === 3 ) {
				car.pos_wc[1] = this.coll.yAt(car.pos_wc[0], car.pos_wc[2]).r + 1.0;
				vec3.set([0, 0, 0], car.vel_wc);
				quat4.set([0, 0.554, 0, 0.832], car.rot);
				vec3.set([0, 0, 0], car.ave);
				car.wheels[0].vrot = 0.001;
				car.wheels[1].vrot = 0.001;
				car.wheels[2].vrot = 0.001;
				car.wheels[3].vrot = 0.001;
			// }
		}
	}/* else if ( car ) {
		car.throttle = 0.0;
		car.steerAngle = 0.0;
		car.brakes = 0.0;
	}*/
	
	if ( input.wasKeyPressed(input.KEY_LESS_THAN) ) {
		this.rot += 1;
	}
	if ( input.wasKeyPressed(input.KEY_GREATER_THAN) ) {
		this.rot -= 1;
	}

	if ( input.isKeyDown(input.KEY_N) ) {
		this.scene.uniforms[KFC.UniId.uAmbientColor][0] += 0.005;
		this.scene.uniforms[KFC.UniId.uAmbientColor][1] += 0.005;
		this.scene.uniforms[KFC.UniId.uAmbientColor][2] += 0.005;
	}
	if ( input.isKeyDown(input.KEY_M) ) {
		this.scene.uniforms[KFC.UniId.uAmbientColor][0] -= 0.005;
		this.scene.uniforms[KFC.UniId.uAmbientColor][1] -= 0.005;
		this.scene.uniforms[KFC.UniId.uAmbientColor][2] -= 0.005;
	}
	if ( input.isKeyDown(input.KEY_V) ) {
		this.scene.uniforms[KFC.UniId.uDirColor][0] += 0.005;
		this.scene.uniforms[KFC.UniId.uDirColor][1] += 0.005;
		this.scene.uniforms[KFC.UniId.uDirColor][2] += 0.005;
	}
	if ( input.isKeyDown(input.KEY_B) ) {
		this.scene.uniforms[KFC.UniId.uDirColor][0] -= 0.005;
		this.scene.uniforms[KFC.UniId.uDirColor][1] -= 0.005;
		this.scene.uniforms[KFC.UniId.uDirColor][2] -= 0.005;
	}
	
	//var model = this.game.players[this.game.id] && this.game.players[this.game.id].model;
	//
	//if ( model ) {
	//	model.body.uniforms[KFC.UniId.uColor] = [this.rot, this.rot2, this.rot3];
	//}
	
	if ( input.wasGamepadButtonPressed(input.PAD_LB) || input.wasKeyPressed(input.KEY_O)) {
		
		this.debug = !this.debug;
		
		
		for ( i = 0; i < this.game.carsm.length; i++ ) {
			this.game.carsm[i].toggleLines(this.debug);
		}
		
	}
	
	if ( this.cameraMode === 1 || this.cameraMode === 2 ) {
		if ( input.wasGamepadButtonPressed(input.PAD_RB) || input.wasKeyPressed(input.KEY_C)) {
			this.cameraMode = (this.cameraMode === 1) ? 2 : 1;
		}
	}
	
	this.updateNetwork();
	
	if ( this.game.serverState === this.game.SHOP ) {
		this.updateShop(input, dt);
	}
	
	while ( this.acc >= this.iStep ) {
		this.acc -= this.iStep;
		
		// send car controls if they changed
		if ( car && NI.state === 2 ) {
			if ( this.game.oldt !== car.throttle ||
				 this.game.oldb !== car.brakes ||
				 this.game.olda !== car.steerAngle ) {
				
				var msg = 'CNT ' + this.iframe +
					' ' + car.throttle +
					' ' + car.brakes +
					' ' + car.steerAngle;
				
				// NI.send( msg );
				
				msg = msg.split(' ');
				car.controllQueue.push({
					iframe : parseInt(msg[1], 10),
					throttle : parseFloat(msg[2]),
					brakes : parseFloat(msg[3]),
					steerAngle : parseFloat(msg[4])
				});
				
				car.throttle = parseFloat(msg[2]);
				car.brakes = parseFloat(msg[3]);
				car.steerAngle = parseFloat(msg[4]);
				
				this.game.oldt = car.throttle;
				this.game.oldb = car.brakes;
				this.game.olda = car.steerAngle;
			}
		}
		
		for ( i = 0; i < this.game.cars.length; i++ ) {	// integrate other cars
			
			var icar = this.game.cars[i];
			
			if ( car !== icar ) {	// not own car
				var queue = icar.controllQueue;
				var sQueue = icar.stateQueue;
				
				var qi = 0;
				var cnt;
				
				if ( queue[0] ) {	// apply any controll changes
					if ( queue[0].iframe === this.iframe ) {
						cnt = queue.shift();
						icar.throttle = cnt.throttle;
						icar.brakes = cnt.brakes;
						icar.steerAngle = cnt.steerAngle;					
					} else if ( queue[0].iframe < this.iframe ){
						queue.shift();
					}
				}
				if ( sQueue[0] ) {	// apply any state frames
					if ( sQueue[0].iframe === this.iframe ) {
						var state = sQueue.shift();
						icar.setData( state.state, 8 );
						continue;
					} else if ( sQueue[0].iframe < this.iframe ){
						sQueue.shift();
					}
				}
			}
			
			this.game.cars[i].integrate(this.iStep);
			
		}
		
		if ( this.cameraMode === 1 && this.game.players[this.game.id]) {
			this.camera.follow( this.game.players[this.game.id].car.pos_wc, this.iStep );
		}
		
		this.iframe++;
	}

	for ( i = 0; i < this.game.carsm.length; i++ ) {
		this.game.carsm[i].updateMatrices();
	}
	
	if ( this.cameraMode === 1 && car ) {
		this.camera.lookAt(car.pos_wc[0], car.pos_wc[1]+0.5, car.pos_wc[2]);
	}
	
	if ( this.cameraMode === 2 && car ) {
		var p = mat4.create();
		
		mat4.perspective(this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far, p);
		mat4.translate(p, [0, -0.93, 0.59]);
		mat4.multiply(p, car.icg_mat, this.camera.pMatrix);
		
		vec3.set(car.pos_wc, this.camera.position);
		this.camera.uniforms[KFC.UniId.uCamPosition] = [car.pos_wc[0], car.pos_wc[1], car.pos_wc[2]];
		
		this.dirty = false;
	}
	
	if ( this.game.serverState === this.game.SHOP ) { // shop mode car models
		for ( i = 0; i < this.shopCarsModels.length; i++ ) {
			this.shopCarsModels[i].updateMatrices();
		}
	}
	
	this.updateMenu(input, dt);
	
	if ( this.cameraMode === 1 && car ) {
		mat4.set(car.icg_mat, this.hudMat);	
		mat4.translate(this.hudMat, [-1.5, -0.8, 3.5]);
		mat4.rotate(this.hudMat, 1.15, [0, 1, 0]);
		mat4.scale(this.hudMat, [0.5, 0.5, 0.5]);
	}
	
	var t = (this.time - this.startTime - 3600000) * 0.001;
	var s = Math.sin(t*0.0005);
	var c = Math.cos(t*0.0005);
	
	this.scene.uniforms[KFC.UniId.uTime][0] = t;
	
	
	this.lightDir[0] = 1.0 * c - 0.0 * s;
	this.lightDir[2] = 1.0 * s + 0.0 * c;
	
	
	for ( i = 0; i < this.game.carsa.length; i++ ) {
		this.game.carsa[i].update( this.camera );
	}

};


KFC.SCMain.prototype.render = function(glc) {
	
	glc.resizeFrameBuffers();	// resize frame buffers if needed
	var gl = glc.gl;

	if ( this.game.fieldOfView === true ) {	// field of view rendering
		
		//glc.gl.clear(glc.gl.COLOR_BUFFER_BIT | glc.gl.DEPTH_BUFFER_BIT);
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('scene').fb);	// select 'scene' framebuffer
		glc.render(this.scene, this.camera);										// render scene colors to buffer
		glc.gl.clear(glc.gl.DEPTH_BUFFER_BIT);
		glc.render(this.sceneFMenu, this.hudCamera);	// just render to screen
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('depth').fb);	// select 'depth' frambuffer
		glc.gl.clear(glc.gl.COLOR_BUFFER_BIT | glc.gl.DEPTH_BUFFER_BIT);
		glc.renderDepth(this.scene, this.camera);									// render scene depth
		glc.renderDepth(this.sceneFMenu, this.hudCamera);	// just render to screen
		
		glc.gaussianBlur(glc.getFramebuffer('scene'), glc.getFramebuffer('depth'), null, 1.0/1024.0, this.game.focus);	// field of view gaussblurr depending on distance
	
	} else {	// just render to screen
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('scene').fb);	// select 'scene' framebuffer
		
		glc.render(this.scene, this.camera);
		glc.gl.clear(glc.gl.DEPTH_BUFFER_BIT);
		glc.render(this.sceneFMenu, this.hudCamera);	// Render menu text
		
		var cmap;
		
		switch ( Math.abs(this.rot) % 6 ) {
			case 0 : cmap = glc.getTexture('cmap_default.png', false); break;
			case 1 : cmap = glc.getTexture('cmap_contrast.png', false); break;
			case 2 : cmap = glc.getTexture('cmap_huesat.png', false); break;
			case 3 : cmap = glc.getTexture('cmap_invert.png', false); break;
			case 4 : cmap = glc.getTexture('cmap_tones.png', false); break;
			case 5 : cmap = glc.getTexture('cmap_sepia.png', false); break;
			
			default: cmap = glc.getTexture('cmap_default.png', false);
		}
		
		glc.colormap(glc.getFramebuffer('scene'), cmap, 1.0);	// renders to itself		
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('scene2').fb);
		glc.aberration(glc.getFramebuffer('scene'), 0.003);
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('add').fb);
		glc.blend(glc.getFramebuffer('scene2'), 0.45 - KFC.clamp(vec3.length(this.camera.vel) * 0.005, 0, 0.25));	// renders to itself. 0.20 in high speed
		
		glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, null);
		glc.renderBuffer(glc.getFramebuffer('add'));
		
		
		// glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('left').fb);
		// 
		// this.camera._makeMatrix();
		// mat4.translate(this.camera.pMatrix, [-0.12, 0, 0]);		
		// glc.render(this.scene, this.camera);
		// glc.gl.clear(glc.gl.DEPTH_BUFFER_BIT);
		// glc.render(this.sceneFMenu, this.camera);	// Render menu text
		// 
		// glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, glc.getFramebuffer('right').fb);
		// 
		// this.camera._makeMatrix();
		// mat4.translate(this.camera.pMatrix, [0.12, 0, 0]);
		// glc.render(this.scene, this.camera);
		// glc.gl.clear(glc.gl.DEPTH_BUFFER_BIT);
		// glc.render(this.sceneFMenu, this.camera);	// Render menu text
		// 
		// glc.gl.bindFramebuffer(glc.gl.FRAMEBUFFER, null);
		// glc.render3D(glc.getFramebuffer('left').tex, glc.getFramebuffer('right').tex );
		
	}
	
	
	glc.addVignette(this.vignetteColor, 0.6);
	
	if ( this.time - this.startTime < 2000 ) {	// initial black fade
		var fade = KFC.clamp((2000 - this.time + this.startTime)/1400, 0.0, 1.0);
		glc.addFade(Math.pow(fade, 1.0));
	}
	
	this.rframe++;
	
};






