/*jshint node:true devel:true */
/*global BGAME, KFC:true, vec3, mat4, mat3, NI, APP */


/**
 * Namespace for game specific funtions
 * @namespace
 */


if (typeof(exports) !== 'undefined') {
	global.KFC = global.KFC || {};
} else {
	window.KFC = window.KFC || {};
}


/**
 * WebGL context and redering class
 * @constructor
 * @param {HTMLElement} canvas
 * @param {Object.<string, *>} attributes paramters to pass to WebGL
 */
KFC.CGLC = function (canvas, attributes) {
	
	if ( !canvas || typeof(canvas.getContext) !== 'function' ) { this.gl = null; return; }
	
	/** type {WebGLRenderingContext} */
	this.gl = canvas.getContext('experimental-webgl', attributes) || canvas.getContext('webgl', attributes);
	
	/** @type {!HTMLElement} */
	this.canvas = canvas;

	this.canvas.style.display = 'none';
	
	/** @type {boolean} */
	this.ready = false;

	/** @type {KFC.CustomMaterial} */
	this.activeShader = null;
	/** @type {Object.<string, !KFC.CustomMaterial>} */
	this.shaders = {};
	/** @type {Object.<string, !KFC.Texture>} */
	this.textures = {};
	/** @type {Object.<string, !KFC.Mesh>} */
	this.meshes = {};
	/** @type {Object.<string, !KFC.Framebuffer>} */
	this.framebuffers = {};
	
	this.gl.clearColor(0.14, 0.14, 0.14, 1.0);
	// this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
	this.gl.enable(this.gl.DEPTH_TEST);
	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	this.gl.enable(this.gl.CULL_FACE);

	/** @type {number} */
	this.width = this.canvas.width;
	/** @type {number} */
	this.height = this.canvas.height;
	/** @type {boolean} */
	this.fbResize = false;
	
	/** @type {boolean} */
	this.culling = true;
	/** @type {boolean} */
	this.blending = false;
	
	/** @type {WebGLBuffer} */
	this.lastBuffer = null;
	/** @type {number} */
	this.activeTexture = 0;
	/** @type {Array.<!WebGLTexture>} */
	this.bindedTextures = [];
	
	/** @type {Float32Array} */
	var taVerPos = new Float32Array([ // vertex positions array
		-1,  1,  0,  -1, -1,  0,   1, -1,  0,
		 1, -1,  0,   1,  1,  0,  -1,  1,  0 ]);
	/** @type {!WebGLBuffer} */
	this.bScreenVerPos = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bScreenVerPos);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, taVerPos, this.gl.STATIC_DRAW);
	
	//console.log(this.gl.getSupportedExtensions());
	this.gl.getExtension('OES_texture_float');
	
};


/**
 * Releases resources allocated on GPU, should be called before closing page
 */
KFC.CGLC.prototype.unload = function () {
	
	/** @type {WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {string} */
	var n;
	/** @type {KFC.Framebuffer} */
	var fb;
	
	for ( n in this.framebuffers ) {
		if ( this.framebuffers.hasOwnProperty(n) ) {
			fb = this.framebuffers[n];
			
			gl.deleteFramebuffer(fb.fb);
			gl.deleteTexture(fb.tex);
			gl.deleteRenderbuffer(fb.rb);
		}
	}
	
	for ( n in this.textures ) {
		if ( this.textures.hasOwnProperty(n) ) {
			gl.deleteTexture(this.textures[n].tex);
		}
	}
	
};

/**
 * Sets WebGL viewport to correct size
 * @param {number} w Viewport width
 * @param {number} h Viewport Height
 */
KFC.CGLC.prototype.setSize = function (w, h) {
	this.canvas.width = w;
	this.width = w;
	this.canvas.height = h;
	this.height = h;
	this.fbResize = true;
	
	this.gl.viewport(0, 0, w, h);
};

/**
 * Renders all objects in a scene from specified camera
 * @param {!KFC.Scene} scene Scene to render objects from
 * @param {!KFC.Camera} camera Camera to get perspective matrix from
 */
KFC.CGLC.prototype.render = function (scene, camera) {
	
	/** @type {WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {KFC.Obj3D} */
	var o;
	/** @type {number} */
	var i;
	
	if (scene.autoclear) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	
	for (i = 0; i < scene.objects.length; i++) {
		o = scene.objects[i];		
		this.renderObject(scene, camera, o, i);		
	}
	
	for (i = 0; i < scene.endObjects.length; i++) {		
		o = scene.endObjects[i];		
		this.renderObject(scene, camera, o, i);
	}
	
};

/**
 * Renders single object
 * @param {!KFC.Scene} scene Scene object is from
 * @param {!KFC.Camera} camera Camera to get perspective matrix from
 * @param {!KFC.Obj3D} o Object to render
 * @param {number} i Object id in a scene list
 */
KFC.CGLC.prototype.renderObject = function ( scene, camera, o, i ) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {number} */
	var u;
	/** @type {!WebGLUniformLocation} */
	var l;
	/** @type {Array.<number>} */
	var v;
	/** @type {number} */
	var j;
	
	if ( !o.draw || !o.mesh.ready || !o.shader.ready ) { return; }
	
	if ( BGAME.activeScreen.rframe % 16 === i % 16 ) {
		o.far = (o.sqDis && KFC.vec3.sqrDis(camera.position, o.pos) > o.sqDis * BGAME.renderDis * 0.1);
	}
	
	if ( o.far ) { return; }	// distance filtering
	
	if (this.activeShader !== o.shader) {
		gl.useProgram(o.shader.program);
		this.activeShader = o.shader;
		gl.uniformMatrix4fv(o.shader.pMatrix, false, camera.getMatrix());
	}
	if ( camera.dirty === true ) {
		gl.uniformMatrix4fv(o.shader.pMatrix, false, camera.getMatrix());
	}
	
	gl.uniformMatrix4fv(o.shader.mvMatrix, false, o.getMVMatrix());
	if ( o.shader.nMatrix ) {
		gl.uniformMatrix3fv(o.shader.nMatrix, false, o.getNMatrix());
	}
	
	for ( j = 0; j < o.shader.unis; j++ ) {
		
		u = o.shader.uniIds[j];
		l = o.shader.uniLocs[j];
		v = o.uniforms[u] || o.mesh.uniforms[u] || scene.uniforms[u] || camera.uniforms[u];
		if ( v === undefined ) {
			throw new Error('Object has undefined uniform: "' + KFC.UniStr[u] + '", "' + o.mesh.url_ +'"');
		}
		
		switch (KFC.UniTyp[u]) {
			case 10 :
				gl.uniform3fv(l, v);
				break;
			case 11 :
				gl.uniform4fv(l, v);
				break;
			case 0 :
				gl.uniform1f(l, v);
				break;
			case 4 :
				gl.uniform1i(l, v);
				break;
			default:
				throw new Error('Bad unifrom type: ' + KFC.UniTyp[u] + ', ' + KFC.UniTyp[u] );			
		}
	}
	
	if ( o.culling === false ) {
		if ( this.culling === true ) {
			this.culling = false;
			gl.disable(gl.CULL_FACE);
		}
	} else {
		if ( this.culling === false ) {
			this.culling = true;
			gl.enable(gl.CULL_FACE);
		}
	}
	
	if ( o.blending === true ) {
		if ( this.blending === false ) {
			this.blending = true;
			gl.enable(gl.BLEND);
		}
	} else {
		if ( this.blending === true ) {
			this.blending = false;
			gl.disable(gl.BLEND);
		}
	}
	
	if ( o.mesh.numTris ) {
		if ( o.text !== undefined ) {
			
		} else {
			BGAME.cnt += o.mesh.numTris;
		}
	}
	
	o.mesh._render(gl, o.shader, o);
};

/**
 * Renders depth map of all objects in a scene
 * @param {!KFC.Scene} scene Scene to get objects from
 * @param {!KFC.Camera} camera Camera to get perpective matrix from
 */
KFC.CGLC.prototype.renderDepth = function(scene, camera) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.CustomMaterial} */
	var dsh = this.getShader('depth');
	/** @type {number} */
	var i;
	/** @type {KFC.Obj3D} */
	var o;
		
	if ( !dsh.ready ) { return; }
	
	gl.useProgram(dsh.program);
	this.activeShader = dsh;
	gl.uniformMatrix4fv(dsh.pMatrix, false, camera.getMatrix());
	
	for (i = 0; i < scene.objects.length; i++) {
		o = scene.objects[i];
		
		if ( !o.draw ) { continue; }		
		if ( !o.mesh.ready ) { continue; }
		if ( !o.mesh._renderDepth ) { continue; }
		if ( o.far ) { return; }	// distance filtering
		
		gl.uniformMatrix4fv(dsh.mvMatrix, false, o.getMVMatrix());
		BGAME.rendered++;
		o.mesh._renderDepth(gl, dsh, o);
	}
	for (i = 0; i < scene.endObjects.length; i++) {
		o = scene.endObjects[i];
		
		if ( !o.draw ) { continue; }	
		if ( !o.mesh.ready ) { continue; }
		if ( !o.mesh._renderDepth ) { continue; }
		if ( o.far ) { return; }	// distance filtering
		
		gl.uniformMatrix4fv(dsh.mvMatrix, false, o.getMVMatrix());
		BGAME.rendered++;
		o.mesh._renderDepth(gl, dsh, o);
	}
};


/**
 * Complete framebuffer object
 * @constructor
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {!number} width Famebuffer width
 * @param {!number} height Framebuffer height
 * @param {!boolean=} opt_type_float If true use gl.FLOAT as framebuffer texture format, if false or undefined use gl.UNSIGNED_INT
 */
KFC.Framebuffer = function(gl, width, height, opt_type_float) {
	/** @type {!WebGLRenderingContext} */
	this.gl = gl;
	/** @type {!WebGLFramebuffer} */
	this.fb = gl.createFramebuffer();
	/** @type {!WebGLTexture} */
	this.tex = gl.createTexture();
	/** @type {!WebGLRenderbuffer} */
	this.rb = gl.createRenderbuffer();
	
	this.width = width;
	this.height = height;
	
	this.type = (opt_type_float === true) ? gl.FLOAT : gl.UNSIGNED_BYTE;
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
	
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, this.type, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
	
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.rb);
	
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
};

/**
 * Gets framebuffer object, allocates one on GPU if does not exists
 * @param {!string} name Name for framebuffer object
 * @param {boolean=} opt_type_float Set to true if framebuffer needs to be of FLOAT type, default false UNSINGED_INT
 * @param {number=} opt_width Width of framebuffer
 * @param {number=} opt_height Height of framebuffer
 * @return {!KFC.Framebuffer} Named framebuffer object
 */
KFC.CGLC.prototype.getFramebuffer = function(name, opt_type_float, opt_width, opt_height) {
	/** @type {number} */
	var width = opt_width || this.width;
	/** @type {number} */
	var height = opt_height || this.height;
	
	if ( !this.framebuffers[name] ) {
		this.framebuffers[name] = new KFC.Framebuffer(this.gl, width, height, opt_type_float);	
	}
	
	return this.framebuffers[name];
};

/**
 * Resizes all framebuffers allocated to this context
 */
KFC.CGLC.prototype.resizeFrameBuffers = function() {
	if ( !this.fbResize ) {
		return;
	}
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.Framebuffer} */	
	var fb;
	/** @type {string} */	
	var n; 
	
	for ( n in this.framebuffers ) {
		if ( this.framebuffers.hasOwnProperty(n) ) {
			fb = this.framebuffers[n];
			fb.width = this.width;
			fb.height = this.height;
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb.fb);
			gl.bindTexture(gl.TEXTURE_2D, fb.tex);
			gl.bindRenderbuffer(gl.RENDERBUFFER, fb.rb);
			
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, fb.type, null);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fb.width, fb.height);
		}
	}
	
	gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	this.fbResize = false;
};

/**
 * Renders transparent shadow to the active buffer, darkening corners and creating vignette effect
 * @param {!Array.<number>} color Color of vignette
 * @param {!number} strength Strength of vignette
 */
KFC.CGLC.prototype.addVignette = function(color, strength) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.CustomMaterial} */
	var sh = this.getShader('vignette');
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
		
		sh.enableAttrib('aVerPosition');			
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
		
		gl.uniform3fv(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uColor)], color);
		gl.uniform1f(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uStrength)], strength);
		
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		gl.colorMask(true, true, true, false);
		
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.colorMask(true, true, true, true);
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
	}
};

/**
 * Renders black fade to the active buffer
 * @param {number} fade Amount of fade, should be from 0 (no fade) to 1 (black screen)
 */
KFC.CGLC.prototype.addFade = function( fade ) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.CustomMaterial} */
	var sh = this.getShader('fade');
	
	if ( fade === undefined ) { fade = 0.5; }
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
					
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
		
		gl.uniform1f(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uFade)], fade);
		
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
	}
};

/**
 * Blurs source framebuffer according to depth buffer. Making field of view effect
 * @param {!KFC.Framebuffer} sourceFB Color framebuffer to blurr
 * @param {!KFC.Framebuffer} depthFB Depth framebuffer
 * @param {?KFC.Framebuffer} destinationFb Framebuffer to render result to, set null to render to default framebuffer
 * @param {number=} opt_blur Blur factor
 * @param {number=} opt_dis Focus distance
 */
KFC.CGLC.prototype.gaussianBlur = function(sourceFB, depthFB, destinationFb, opt_blur, opt_dis) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.CustomMaterial} */
	var vsh = this.getShader('vgauss');
	/** @type {!KFC.CustomMaterial} */
	var hsh = this.getShader('hgauss');
	/** @type {!KFC.Framebuffer} */
	var tfb = this.getFramebuffer('tgauss');
	/** @type {number} */
	var blur = (typeof(opt_blur) === 'number') ? opt_blur : 1.0 / 512.0;
	/** @type {number} */
	var focus = (typeof(opt_dis) === 'number') ? opt_dis : 0.25;
	
	if ( !vsh.ready || !hsh.ready ) { return; }	
	
    gl.bindFramebuffer(gl.FRAMEBUFFER, tfb.fb);
	
	gl.useProgram(vsh.program);
	this.activeShader = vsh;
	
	vsh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
	
	vsh.bindTexture(0, sourceFB.tex);
	vsh.bindTexture(1, depthFB.tex);
	
	gl.uniform1i(vsh.uniLocs[vsh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
	gl.uniform1i(vsh.uniLocs[vsh.uniIds.indexOf(KFC.UniId.uTex1)], 1);
	gl.uniform1f(vsh.uniLocs[vsh.uniIds.indexOf(KFC.UniId.uBlur)], blur);
	gl.uniform1f(vsh.uniLocs[vsh.uniIds.indexOf(KFC.UniId.uFocus)], focus);
	
	gl.disable(gl.DEPTH_TEST);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
    gl.bindFramebuffer(gl.FRAMEBUFFER, (destinationFb) ? destinationFb.fb : null);
		
	gl.useProgram(hsh.program);
	this.activeShader = hsh;
	
	hsh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tfb.tex);
	gl.uniform1i(hsh.uniLocs[hsh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
	gl.uniform1i(hsh.uniLocs[hsh.uniIds.indexOf(KFC.UniId.uTex1)], 1);
	gl.uniform1f(hsh.uniLocs[hsh.uniIds.indexOf(KFC.UniId.uBlur)], blur);
	gl.uniform1f(hsh.uniLocs[hsh.uniIds.indexOf(KFC.UniId.uFocus)], focus);
	
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.enable(gl.DEPTH_TEST);						
	
};


/**
 * Renders colormaped fb to active framebuffer
 * @param {!KFC.Framebuffer} fb Framebuffer to colormap
 * @param {!KFC.Texture} map Colormap texture
 * @param {!number=} opt_strength Amount of colormap applied 
 */
KFC.CGLC.prototype.colormap = function(fb, map, opt_strength) {
	
	opt_strength = (opt_strength === undefined) ? 0 : opt_strength;
	
	var gl = this.gl;
	
	var sh = this.getShader('colormap');
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
		
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
		
		sh.bindTexture(0, fb.tex);
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
		
		sh.bindTexture(1, map.tex);
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex1)], 1);
		
		gl.disable(gl.DEPTH_TEST);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.enable(gl.DEPTH_TEST);
	}
	
};


/**
 * Renders texture with appliued cromatic aberration
 * @param {!KFC.Framebuffer} fb Source framebuffer to aplly effect
 * @param {!number=} opt_strength Amount of aberration applied
 */
KFC.CGLC.prototype.aberration = function(fb, opt_strength) {
	
	opt_strength = (opt_strength === undefined) ? 0 : opt_strength;
	
	var gl = this.gl;
	
	var sh = this.getShader('aberration');
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
		
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
		
		sh.bindTexture(0, fb.tex);
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
		gl.uniform1f(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uStrength)], opt_strength);
		
		gl.disable(gl.DEPTH_TEST);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.enable(gl.DEPTH_TEST);
	}
};


/**
 * Renders texture with appliued cromatic aberration
 * @param {!KFC.Framebuffer} fb Framebuffer to colormap
 * @param {!number=} opt_strength Amount of colormap applied
 */
KFC.CGLC.prototype.blend = function(fb, opt_strength) {
	
	opt_strength = (opt_strength === undefined) ? 0 : opt_strength;
	
	var gl = this.gl;
	
	var sh = this.getShader('blend');
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
		
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
		
		sh.bindTexture(0, fb.tex);
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
		gl.uniform1f(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uStrength)], opt_strength);
		
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
	}
};

/**
 * Renders framebuffer to default framebuffer
 * @param {!KFC.Framebuffer} fb dramebuffer object to render
 */
KFC.CGLC.prototype.renderBuffer = function(fb) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.CustomMaterial} */
	var sh = this.getShader('rbuffer');
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
		
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);		
		sh.bindTexture(0, fb.tex);
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
		
		gl.disable(gl.DEPTH_TEST);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.enable(gl.DEPTH_TEST);
	}
};


/**
 * Renders two textures to screen in anaglyph colors
 * @param {!WebGLTexture} leftTex dramebuffer object to render
 * @param {!WebGLTexture} rightTex dramebuffer object to render
 */
KFC.CGLC.prototype.render3D = function( leftTex, rightTex ) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	/** @type {!KFC.CustomMaterial} */
	var sh = this.getShader('3d');
	
	if ( sh.ready ) {
		gl.useProgram(sh.program);
		this.activeShader = sh;
		
		sh.attribPointer('aVerPosition', this.bScreenVerPos, 3);
		sh.bindTexture(0, leftTex);		
		sh.bindTexture(1, rightTex);
		
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex0)], 0);
		gl.uniform1i(sh.uniLocs[sh.uniIds.indexOf(KFC.UniId.uTex1)], 1);
		
		gl.disable(gl.DEPTH_TEST);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.enable(gl.DEPTH_TEST);
	}
	
};


/**
 * Preloads shader, calls callback when shader is ready
 * @param {string} name Predefined shader name
 * @param {function()=} opt_callback Function to call when shader is ready
 */
KFC.CGLC.prototype.readyShader = function( name, opt_callback ) {
	
	if ( typeof(name) !== 'string' ) { throw 'Wrong shader name!'; }
	
	if ( typeof(this.shaders[name]) !== 'undefined' ) {
		if ( opt_callback ) {
			opt_callback();
		}
		return;
	}
	
	switch (name) {
	case 'color' : 
		this.shaders[name] = new KFC.CustomMaterial( this, // shader for lines
							'color.vsh', 'color.fsh',
							['aVerPosition'],
							[KFC.UniId.uColor],
							opt_callback );
		break;
	case 'normal' : 
		this.shaders[name] = new KFC.CustomMaterial( this, // dunno what this is used for
							'normal.vsh', 'normal.fsh',
							['aVerPosition', 'aVerNormal'],							
							[KFC.UniId.uAmbientColor,
							 KFC.UniId.uDirColor,
							 KFC.UniId.uLightDirection,
							 KFC.UniId.uColor],
							opt_callback );
		break;
	case 'car' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// for rendering cars
							'car.vsh', 'car.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							[/*'uAmbientColor', 'uDirColor',*/ 'uLightDirection', 'uColor', 'uTex0', 'uTex1', 'uTex2', 'uCamPosition'], opt_callback );
		break;
	case 'add' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// for rendering cars
							'add.vsh', 'add.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							['uAmbientColor', 'uDirColor', 'uLightDirection', 'uFog', 'uColor', 'uTex0', 'uTex1', 'uTex2', 'uCamPosition'], opt_callback );
		break;
	case 'terrain' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special terrain shader
							'terrain.vsh', 'terrain.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							[KFC.UniId.uLightDirection,
							 KFC.UniId.uDirColor,
							 KFC.UniId.uAmbientColor,
							 KFC.UniId.uFog,
							 KFC.UniId.uScale,
							 KFC.UniId.uTex0],							 
							opt_callback );	
		break;
	case 'transparent' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special terrain shader
							'transparent.vsh', 'transparent.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							[KFC.UniId.uLightDirection,
							 KFC.UniId.uDirColor,
							 KFC.UniId.uAmbientColor,
							 KFC.UniId.uFog,
							 KFC.UniId.uScale,
							 KFC.UniId.uTex0],
							opt_callback );	
		break;
	case 'tree' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special tree
							'tree.vsh', 'tree.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							[KFC.UniId.uLightDirection,
							 KFC.UniId.uDirColor,
							 KFC.UniId.uAmbientColor,
							 KFC.UniId.uFog,
							 KFC.UniId.uScale,
							 KFC.UniId.uTime,
							 KFC.UniId.uWindStrength,
							 KFC.UniId.uTex0],
							opt_callback );	
		break;
	case 'water' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special terrain shader
							'water.vsh', 'water.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							['uAmbientColor', 'uDirColor', 'uCamPosition', 'uLightDirection', 'uFog', 'uTime', 'uTex0'], opt_callback );	
		break;
	case 'multicol' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special terrain shader
							'multicol.vsh', 'multicol.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							[KFC.UniId.uLightDirection,
							 KFC.UniId.uAmbientColor,
							 KFC.UniId.uDirColor,
							 KFC.UniId.uFog,
							 KFC.UniId.uTex0,
							 KFC.UniId.uTex1,
							 KFC.UniId.uTex2,
							 KFC.UniId.uTex3,
							 KFC.UniId.uCamPosition], opt_callback );	
		break;
	case 'multicolroad' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special terrain shader
							'multicolroad.vsh', 'multicolroad.fsh',
							['aVerPosition', 'aVerNormal', 'aTexCoord'],
							['uLightDirection', 'uAmbientColor', 'uDirColor', 'uFog', 'uTex0', 'uTex1', 'uTex2', 'uTex3', 'uCamPosition'], opt_callback );	
		break;
	case 'sky' : 
		this.shaders[name] = new KFC.CustomMaterial( this,	// special terrain shader
							'sky.vsh', 'sky.fsh',
							['aVerPosition', 'aTexCoord'],
							['uAmbientColor', 'uDirColor', 'uTex0', 'uCamPosition', 'uTime'], opt_callback );	
		break;
	case 'text' :
		this.shaders[name] = new KFC.CustomMaterial( this,
							'text.vsh', 'text.fsh',
							['aVerPosition', 'aVerNormal'],
							[KFC.UniId.uAmbientColor,
							 KFC.UniId.uDirColor,
							 KFC.UniId.uLightDirection,
							 KFC.UniId.uColor,
							 KFC.UniId.uOffset],
							opt_callback );
		break;
	case 'vignette' :
		this.shaders[name] = new KFC.CustomMaterial( this,
							'vignette.vsh', 'vignette.fsh',
							['aVerPosition'],
							['uColor', 'uStrength'], opt_callback );
		break;
	case 'fade' :
		this.shaders[name] = new KFC.CustomMaterial( this,
							'fade.vsh', 'fade.fsh',
							['aVerPosition'],
							[KFC.UniId.uFade], opt_callback );
		break;
	case 'depth' :
		this.shaders[name] = new KFC.CustomMaterial( this,
				'depth.vsh', 'depth.fsh',
				['aVerPosition'],
				['uOffset'], opt_callback );
		break;
	case 'rbuffer' :
		this.shaders[name] = new KFC.CustomMaterial(this,
				'rbuffer.vsh', 'rbuffer.fsh',
				['aVerPosition'],
				['uTex0'], opt_callback );
		break;
	case 'colormap' :
		this.shaders[name] = new KFC.CustomMaterial(this,
				'colormap.vsh', 'colormap.fsh',
				['aVerPosition'],
				['uTex0', 'uTex1', 'uStrength'], opt_callback );
		break;
	case 'aberration' :
		this.shaders[name] = new KFC.CustomMaterial(this,
				'aberration.vsh', 'aberration.fsh',
				['aVerPosition'],
				['uTex0', 'uStrength'], opt_callback );
		break;
	case 'blend' :
		this.shaders[name] = new KFC.CustomMaterial(this,
				'blend.vsh', 'blend.fsh',
				['aVerPosition'],
				['uTex0', 'uStrength'], opt_callback );
		break;
	case '3d' :
		this.shaders[name] = new KFC.CustomMaterial(this,
				'3d.vsh', '3d.fsh',
				['aVerPosition'],
				['uTex0', 'uTex1'], opt_callback );
		break;
	case 'vgauss' :
		this.shaders[name] = new KFC.CustomMaterial(this,
			'vgauss.vsh', 'vgauss.fsh',
			['aVerPosition'],
			['uTex0', 'uTex1', 'uBlur', 'uFocus'], opt_callback );
		break;
	case 'hgauss' :
		this.shaders[name] = new KFC.CustomMaterial(this,
			'hgauss.vsh', 'hgauss.fsh',
			['aVerPosition'],
			['uTex0', 'uTex1', 'uBlur', 'uFocus'], opt_callback );
		break;
	default :
		throw 'Unkonwn shader ' + name;
	}
	
};

/**
 * Returns shader from preloaded shaders list. Tries to load on the fly if not found
 * @param {string} name Shader name
 * @return {!KFC.CustomMaterial} selected Shader Object
 */
KFC.CGLC.prototype.getShader = function( name ) {
	if ( typeof(name) !== 'string' ) { throw 'Wrong shader name!'; }
	
	if ( typeof(this.shaders[name]) === 'undefined' ) {
		this.readyShader( name );
	}
	
	return this.shaders[name];	
};


/**
 * Preloads texture to GPU. Calls callback function when ready
 * @param {string} url Texture file url
 * @param {?function()=} opt_callback Function to call when texture is ready
 * @param {boolean=} opt_mipmap wheater texture should use mipmaps
 * @param {boolean=} opt_alpha wheater texture should use mipmaps
 */
KFC.CGLC.prototype.readyTexture = function ( url, opt_callback, opt_mipmap, opt_alpha ) {
	if ( typeof(url) !== 'string' ) { throw 'Wrong texture url name!'; }
	
	if ( typeof(this.textures[url]) !== 'undefined' ) {
		if ( opt_callback ) {
			opt_callback();
		}
	} else {	
		this.textures[url] = new KFC.Texture(this.gl, 'textures/'+url, opt_callback, opt_mipmap, opt_alpha);
	}
	
};

/**
 * Returns texture object from preloaded textures list. Tries to load on the fly if not found
 * @param {string} url Texture url
 * @param {boolean=} opt_mipmap wheater texture should use mipmaps
 * @param {boolean=} opt_alpha wheater texture should use mipmaps
 * @return {KFC.Texture} Selected texture Object
 */
KFC.CGLC.prototype.getTexture = function( url, opt_mipmap, opt_alpha ) {
	if ( typeof(url) !== 'string' ) { throw 'Wrong texture name!'; }
	
	if ( typeof(this.textures[url]) === 'undefined' ) {
		//console.log('getting not preloaded texture ' + url);
		this.readyTexture( url, null, opt_mipmap, opt_alpha );
	}
	
	return this.textures[url];	
};

/**
 * Preloads mesh object
 * @param {string} url Mesh url
 * @param {boolean=} opt_btree wheather to make binary tree for mesh
 * @param {function()=} opt_callback Function to call when mesh is ready
 */
KFC.CGLC.prototype.readyMesh = function( url, opt_btree, opt_callback ) {
	if ( typeof url !== 'string' ) { throw 'Wrong mesh url! "' + url + '"' ; }
	
	if ( typeof this.meshes[url] !== 'undefined' ) {
		if ( typeof opt_callback === 'function' ) {
			opt_callback();
		}
	} else {	
		this.meshes[url] = new KFC.ObjMesh(this.gl, 'obj/'+url, opt_btree, opt_callback);
	}
};

/**
 * Returns mesh object from preloaded list, or tries to load on the fly if not found
 * @param {string} url Mesh url address
 * @return {!KFC.Mesh} Mesh Object
 */
KFC.CGLC.prototype.getMesh = function( url ) {
	if ( typeof url !== 'string' ) { throw 'Wrong mesh url! "' + url + '"' ; }
	
	if ( typeof this.meshes[url] === 'undefined' ) {
		this.readyMesh(url);
		//console.log('Getting not preleaded mesh "' + url + '"');
	}
	
	return this.meshes[url];
};

/**
 * Texture wrapper class
 * @constructor
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {string} url texture url
 * @param {?function()=} opt_callback function to call when texture is loaded
 * @param {boolean=} opt_mipmap wheater texture should use mipmaps
 * @param {boolean=} opt_alpha wheater texture should use mipmaps
 */
KFC.Texture = function (gl, url, opt_callback, opt_mipmap, opt_alpha) {
	/** @type {!KFC.Texture} */
	var that = this;
	/** @type {!WebGLRenderingContext} */
	this.gl = gl;
	/** @type {string} */
	this.url = ( COMPILED ) ? url : 'site/' + url;
	/** @type {?function()} */
	this._callback = opt_callback || null;
	/** @type {boolean} */
	this.mipmap = (opt_mipmap === false) ? false : true;
	/** @type {boolean} */
	this.alpha = (opt_alpha === true) ? true : false; 
	
	/** @type {!WebGLTexture} */
	this.tex = gl.createTexture();

	/** @type {Image} */
	this.img = new Image();
	this.img.onload = function () {
		that._handleLoaded();
	};
	this.img.onerror = function() {
		throw 'Error while loading image "' + url + '"';
	};	
	this.img.src = this.url;
	
	/** @type {boolean} */
	this.ready = false;
};

/**
 * Copies loaded texture to GPU memmory
 */
KFC.Texture.prototype._handleLoaded = function () {
	/** @type {!WebGLRenderingContext} */
	var gl = this.gl;
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.bindTexture(gl.TEXTURE_2D, this.tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, (this.mipmap === true) ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR);
	if ( this.alpha === true ) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
	} else {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.img);
	}
	
	if (this.mipmap === true) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	this.ready = true;
	
	if (this._callback !== null) { 
		this._callback();
		this._callback = null;
	}
};

/**
 * WebGL shader wrapper class
 * @constructor
 * @param {!KFC.CGLC} glc WebGL rendering context
 * @param {string} vsh_url Vertex shader source url
 * @param {string} fsh_url Fragment shader source url
 * @param {Array.<string|number>} att Shader attributes array
 * @param {Array.<string|number>} uni Shader uniforms array
 * @param {function()=} opt_callback function to call when texture is loaded
 */
KFC.CustomMaterial = function (glc, vsh_url, fsh_url, att, uni, opt_callback) {

	/** @type {!KFC.CGLC} */
	this._glc = glc;
	/** @type {!WebGLRenderingContext} */
	this._gl = glc.gl;
	/** @type {string} */
	this._vsh_url = vsh_url;
	/** @type {string} */
	this._fsh_url = fsh_url;
	/** @type {Array.<string|number>} */
	this._att = att;
	/** @type {Array.<string|number>} */
	this._uni = uni;
	/** @type {?function()} */
	this._callback = opt_callback || null;
	/** @type {boolean} */
	this.ready = false;
	/** @type {Object.<string,number>} */
	this.attributes = {};
	/** @type {Array.<boolean>} */
	this.attEn = [];
	/** @type {WebGLProgram} */
	this.program = this._gl.createProgram();
	/** @type {WebGLShader} */
	this._vsh = null;
	/** @type {WebGLShader} */
	this._fsh = null;
	
	/** @type {number} */
	this.unis = 0;
	/** @type {Array.<number,number>} */
	this.uniIds = [];
	/** @type {Array.<number,!WebGLUniformLocation>} */
	this.uniLocs = [];
	
	this._getShader(this._gl.VERTEX_SHADER, 'shaders/' + vsh_url);
	this._getShader(this._gl.FRAGMENT_SHADER, 'shaders/' + fsh_url);
};

/**
 * Loads shader files
 * @param {number} type Shader type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} url Shader url adress
 */
KFC.CustomMaterial.prototype._getShader = function (type, url) {
	/** @type {KFC.CustomMaterial} */
	var that = this;
	
	KFC.loadFile(url, function(data) {
		that._initShader(type, data);
	});
};

/**
 * Initializes loaded shader
 * @param {number} type Shader type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source Shader source code
 */
KFC.CustomMaterial.prototype._initShader = function (type, source)
{
	/** @type {!WebGLRenderingContext} */
	var gl = this._gl;
	/** @type {!WebGLShader} */
	var shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
		throw new Error('ERROR: CGLC:initShaders - failed to compile shader: "' +
						((type === gl.VERTEX_SHADER) ? this._vsh_url : this._fsh_url) +
						'"\n' + gl.getShaderInfoLog(shader) + gl.deleteShader(shader));
	}
	
	if (type === gl.VERTEX_SHADER) { this._vsh = shader; }
	if (type === gl.FRAGMENT_SHADER) { this._fsh = shader; }
	
	this._initProgram();
};

/**
 * Initializes shader program
 */
KFC.CustomMaterial.prototype._initProgram = function ()
{    
	if ( this._vsh === null || this._fsh === null ) {
		return;
	}
	
	/** @type {!WebGLRenderingContext} */
	var gl = this._gl;
	/** @type {number} */
	var i;
	/** @type {string} */
	var name;
	/** @type {number} */
	var pos;
	/** @type {string|number} */
	var id;
	
	//var a, u, name, pos, id;
		
	gl.attachShader(this.program, this._vsh);
	gl.attachShader(this.program, this._fsh);
	gl.linkProgram(this.program);
	
	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
		console.error("ERROR: Could not initialise shaders!");
		return;
	}
	
	for ( i = 0; i < this._att.length; i++ ) {
		name = this._att[i].toString();
		pos = this.attributes[name] = gl.getAttribLocation(this.program, name);
		if ( pos !== -1 ) {
			gl.enableVertexAttribArray(this.attributes[name]);	// enable attribute	
			this.attEn[pos] = true;			// mark attribte as enabled
		} else {
			console.error("ERROR: Could not get attribute location \"" + name + "\"");
		}
	}
	
	for ( i = 0; i < this._uni.length; i++ ) {
		id = this._uni[i];
		
		if ( typeof id === 'string' ) {
			
			id = KFC.UniStr.indexOf(id);
			if ( id === -1 ) {
				throw new Error('shader uniform definition by string "' + this._uni[i] +  '" was not found! ' + this._vsh_url);
			}
		}
		if ( id === undefined ) {
			throw new Error('shader uniform ' + (i+1) +  ' id is undefined! ' + this._vsh_url);
		}
		
		name = KFC.UniStr[id];
		this.uniIds.push(id); 
		this.uniLocs.push(gl.getUniformLocation(this.program, name));		
		if ( this.uniLocs[this.unis] === null ) {
			console.log('WARNING: shader program "' + this._vsh_url + '" has undefined variable "' + name + '" ' + id);
		}		
		this.unis++;
	}
	
	this.pMatrix = gl.getUniformLocation(this.program, 'uPMatrix');
	this.mvMatrix = gl.getUniformLocation(this.program, 'uMVMatrix');
	this.nMatrix = gl.getUniformLocation(this.program, 'uNMatrix');
	
	for (name in this.attributes ) {
		if ( this.attributes[name] === null ) {
			console.log('WARNING: shader program has undefined variable "' + name + '"');
		}
	}
	
	this.ready = true;
	if (typeof this._callback === 'function') { 
		this._callback();
		this._callback = null;
	}
	
	return;
};

/**
 * Enables shader vertex attrib array if needed
 * @param {string} name Name of atribute to enable
 */
KFC.CustomMaterial.prototype.enableAttrib = function(name) {
	/** @type {number} */
	var pos = this.attributes[name];
	
	if ( pos === undefined ) {
		console.warn('Bad shader attribute name!'); return;
	}
	if ( this.attEn[pos] === false ) {
		this._gl.enableVertexAttribArray(pos);
		this.attEn[pos] = true;
	}
};

/**
 * Disables shader vertex attrib array if needed
 * @param {string} name Name of atribute to enable
 */
KFC.CustomMaterial.prototype.disableAttrib = function(name) {
	/** @type {number} */
	var pos = this.attributes[name];
	
	if ( pos === undefined ) {
		console.warn('Bad shader attribute name!'); return;
	}	
	if ( this.attEn[pos] === true ) {
		this._gl.disableVertexAttribArray(pos);
		this.attEn[pos] = false;
	}
};


/**
 * Sets attribute pointer if needed
 * @param {string} name Namo of attribute
 * @param {!WebGLBuffer} buffer Buffer for attribute to point
 * @param {number} size Size of attribute vector
 */
KFC.CustomMaterial.prototype.attribPointer = function(name, buffer, size) {
	
	/** @type {!WebGLRenderingContext} */
	var gl = this._gl;	
	/** @type {!KFC.CGLC} */
	var glc = this._glc;
	/** @type {number} */
	var pos = this.attributes[name];
		
	if ( pos === undefined ) {
		throw new Error('Bad shader attribute name "' + name + '"');
	}
	
	if ( glc.lastBuffer !== buffer ) {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		glc.lastBuffer = buffer;
		
		//if ( (bp.buffer !== buffer) && (bp.size !== size) ) {
			gl.vertexAttribPointer(pos, size, gl.FLOAT, false, 0, 0);
			//bp.buffer = buffer;
			//bp.size = size;
		//}
	}
};

/**
 * Binds Texture to selected target if needed
 * @param {number} active Texture target
 * @param {!WebGLTexture} texture Texture to bind
 */
KFC.CustomMaterial.prototype.bindTexture = function(active, texture) {
	
	/** @type {!KFC.CGLC} */
	var glc = this._glc;
	/** @type {!WebGLRenderingContext} */
	var gl = this._gl;
	
	if ( glc.bindedTextures[active] !== texture ) {
		
		if ( glc.activeTexture !== active ) {
			gl.activeTexture(active + 33984);	// gl.TEXTURE0 === 33984
			glc.activeTexture = active;
		}
		
		gl.bindTexture(gl.TEXTURE_2D, texture);
		glc.bindedTextures[active] = texture;
	}
};


/**
 * Scene object
 * @constructor
 */
KFC.Scene = function () {
	/** @type {Array.<!KFC.Obj3D>} */
	this.objects = [];
	/** @type {Array.<!KFC.Obj3D>} */
	this.endObjects = [];
	/** @type {Array.<number,!Array.<number>>} */
	this.uniforms = [];
	/** @type {boolean} */
	this.autoclear = false;
};

/**
 * Adds Object to Scene list
 * @param {!(KFC.Obj3D|KFC.CarModel)} object Object to add to the scene
 * @param {boolean=} opt_end if true adds object to second scene list to be rendered last
 */
KFC.Scene.prototype.add = function (object, opt_end) {
	if ( typeof object.addToScene === 'function' ) {
		object.addToScene(this, opt_end);
	} else {
		if ( opt_end === true ) {
			this.endObjects.push(object);
		} else {
			this.objects.push(object);
		}
	}
};



/**
 * Camera interface
 * @interface
 */
KFC.Camera = function () {};


/**
 * Returns Perspective matrix
 * @return {mat4} Perspective matrix
 */
KFC.Camera.prototype.getMatrix = function() {};


/**
 * Perspective camera
 * @constructor
 * @implements {KFC.Camera}
 * @param {number} fov Fiel of view (in angles)
 * @param {number} aspect Camera aspect ratio (w/h)
 * @param {number} near Camera near limit
 * @param {number} far Camera far limit
 */
KFC.PerspectiveCamera = function (fov, aspect, near, far) {
	this.fov = fov;
	this.aspect = aspect;
	this.near = near;
	this.far = far;
	this.uniforms = [];
	
	this.position = vec3.create();
	this.rotation = vec3.create();
	this.vel = vec3.create();
	this.npos = vec3.create();
	
	this.tv = vec3.create();
	
	this.pMatrix = mat4.create();
	
	this.dirty = true;
};


/**
 * Calculates perspective matrix from set position and rotation
 */
KFC.PerspectiveCamera.prototype._makeMatrix = function () {  
	var position = this.position,
		rotation = this.rotation;
		
	mat4.perspective(this.fov, this.aspect, this.near, this.far, this.pMatrix);
	mat4.rotate(this.pMatrix, -rotation[0], [1, 0, 0]);
	mat4.rotate(this.pMatrix, -rotation[1], [0, 1, 0]);
	mat4.rotate(this.pMatrix, -rotation[2], [0, 0, 1]);
	vec3.scale(position, -1, this.npos);
	mat4.translate(this.pMatrix, this.npos);
	
	this.uniforms[KFC.UniId.uCamPosition] = [position[0], position[1], position[2]];
	
	this.dirty = false;
};

/**
 * Sets camera postion
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {number} z Z coordinate
 */
KFC.PerspectiveCamera.prototype.setPosition = function (x, y, z) {
	var p = this.position;
	if ( p[0] === x && p[1] === y && p[2] === z ) { return; }
	p[0] = x;
	p[1] = y;
	p[2] = z;
	this.dirty = true;
};

/**
 * Sets camera rotation
 * @param {number} x Rotation around X axis
 * @param {number} y Rotation around Y axis
 * @param {number} z Rotation around Z axis
 */
KFC.PerspectiveCamera.prototype.setRotation = function (x, y, z) {
	var r = this.rotation;
	if ( r[0] === x && r[1] === y && r[2] === z ) { return; }
	r[0] = x;
	r[1] = y;
	r[2] = z;
	this.dirty = true;
};

/**
 * Rotates camera to face at specific point
 * @param {number} lx X coordinate
 * @param {number} ly Y coordinate
 * @param {number} lz Z coordinate
 */
KFC.PerspectiveCamera.prototype.lookAt = function (lx, ly, lz) {
	var dx = lx - this.position[0],
		dy = ly - this.position[1],
		dz = lz - this.position[2],
		vrot, hrot;
		
	hrot = Math.atan(dx/dz);
	if ( dz > 0 ) { hrot += Math.PI; }
	vrot = Math.atan(dy/Math.sqrt(dx*dx+dz*dz));
	this.setRotation(vrot, hrot, 0);
};

/**
 * moves (floats) camera to specific point
 * @param {vec3} pos_wc Follow point location
 * @param {number} iStep Integration step.
 *
 */
KFC.PerspectiveCamera.prototype.follow = function ( pos_wc, iStep ) {
	
	var f = 0,
		d = 0;
		
	d = vec3.dist(this.position, pos_wc);		
	f = 40 * (d - 7);
	vec3.direction(this.position, pos_wc, this.tv);
	KFC.vec3.addscaled(this.vel, this.tv, -f * iStep );
	vec3.scale(this.vel, 0.98);	
	
	KFC.vec3.addscaled(this.position, this.vel, iStep );	
	this.position[1] = pos_wc[1] + 2.0;
	
	this.dirty = true;
};


/**
 * moves (floats) camera to specific point
 * @param {vec3} pos_wc Follow point location
 * @param {number} iStep Integration step.
 *
 */
KFC.PerspectiveCamera.prototype.goTo = function ( pos_wc, iStep ) {
	
	var f = 0;
		
	f = vec3.dist(this.position, pos_wc) * 20;
	vec3.direction(this.position, pos_wc, this.tv);
	KFC.vec3.addscaled(this.vel, this.tv, -f * iStep );
	vec3.scale(this.vel, 0.8);	
	
	KFC.vec3.addscaled(this.position, this.vel, iStep );
	
	this.dirty = true;
};

/**
 * Returns camera matrix, Recalculates if necessary
 * @return {mat4} Camera perpective matrix
 */
KFC.PerspectiveCamera.prototype.getMatrix = function () {
	if ( this.dirty ) {
		this._makeMatrix();
	}
	return this.pMatrix;
};

/**
 * Orthographic camera
 * @constructor
 * @implements {KFC.Camera}
 * @param {number} left
 * @param {number} right
 * @param {number} bottom
 * @param {number} top
 * @param {number} near
 * @param {number} far
 */
KFC.OrthoCamera = function (left, right, bottom, top, near, far) {
	
	this.pMatrix = mat4.create();
	this.dirty = true;
	
	this.left = left;
	this.right = right;
	this.bottom = bottom;
	this.top = top;
	this.near = near;
	this.far = far;
	
};

/**
 * Rebuilds camera matrix
 */
KFC.OrthoCamera.prototype._makeMatrix = function () {
	mat4.ortho(this.left, this.right, this.bottom, this.top, this.near, this.far, this.pMatrix);
	this.dirty = false;
};

/**
 * Returns camera matrix, Recalculates if necessary
 * @return {mat4} Camera perpective matrix
 */
KFC.OrthoCamera.prototype.getMatrix = function () {
	if ( this.dirty ) {
		this._makeMatrix();
	}
	return this.pMatrix;
};

/**
 * @constructor
 * holds prototype list
 */
KFC.UniformList = function() {
	
	/** @type {Array.<Array.<number>>} */
	this.values = [];
	
	/** @type {Array.<number>} */
	this.version = [];
	
};

KFC.UniNum = 0;
KFC.UniId = {};
KFC.UniStr = [];
KFC.UniTyp = [];


KFC.UniId.uPMatrix = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uPMatrix'; 
KFC.UniTyp[KFC.UniNum] = 18;

KFC.UniId.uMVMatrix = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uMMatrix'; 
KFC.UniTyp[KFC.UniNum] = 18;

KFC.UniId.uNMatrix = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uNMatrix'; 
KFC.UniTyp[KFC.UniNum] = 17;


KFC.UniId.uLightDirection = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uLightDirection'; 
KFC.UniTyp[KFC.UniNum] = 10;

KFC.UniId.uAmbientColor = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uAmbientColor'; 
KFC.UniTyp[KFC.UniNum] = 10;

KFC.UniId.uDirColor = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uDirColor'; 
KFC.UniTyp[KFC.UniNum] = 10;


KFC.UniId.uFog = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uFog'; 
KFC.UniTyp[KFC.UniNum] = 0;

KFC.UniId.uScale = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uScale'; 
KFC.UniTyp[KFC.UniNum] = 0;		// 1f

KFC.UniId.uTex0 = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uTex0'; 
KFC.UniTyp[KFC.UniNum] = 4;		// 1i
KFC.UniId.uTex1 = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uTex1'; 
KFC.UniTyp[KFC.UniNum] = 4;		// 1i
KFC.UniId.uTex2 = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uTex2'; 
KFC.UniTyp[KFC.UniNum] = 4;		// 1i
KFC.UniId.uTex3 = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uTex3'; 
KFC.UniTyp[KFC.UniNum] = 4;		// 1i


KFC.UniId.uColor = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uColor'; 
KFC.UniTyp[KFC.UniNum] = 10;	// 4fv

KFC.UniId.uOffset = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uOffset'; 
KFC.UniTyp[KFC.UniNum] = 4;	// 1i

KFC.UniId.uFade = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uFade'; 
KFC.UniTyp[KFC.UniNum] = 0;	// 1i

KFC.UniId.uBlur = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uBlur'; 
KFC.UniTyp[KFC.UniNum] = 0;	// 1i

KFC.UniId.uFocus = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uFocus'; 
KFC.UniTyp[KFC.UniNum] = 0;	// 1i

KFC.UniId.uTime = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uTime'; 
KFC.UniTyp[KFC.UniNum] = 0;	// 1i

KFC.UniId.uCamPosition = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uCamPosition'; 
KFC.UniTyp[KFC.UniNum] = 10;

KFC.UniId.uStrength = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uStrength'; 
KFC.UniTyp[KFC.UniNum] = 0;

KFC.UniId.uWindStrength = ++KFC.UniNum;
KFC.UniStr[KFC.UniNum] = 'uWindStrength'; 
KFC.UniTyp[KFC.UniNum] = 0;




















