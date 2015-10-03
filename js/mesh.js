/*jshint node:true devel:true */
/*global KFC:true, vec3, mat4, quat4, mat3, NI, APP */



if (typeof(exports) !== 'undefined') {
	global.KFC = global.KFC || {};
} else {
	window.KFC = window.KFC || {};
}


/**
 * 3D Object wrap class
 * @constructor
 * @param {!KFC.Mesh} mesh Mesh object
 * @param {!KFC.CustomMaterial} shader Shader object
 * @param {KFC.Texture=} opt_tex0 Texture object
 */
KFC.Obj3D = function (mesh, shader, opt_tex0) {
	
	/** @type {!KFC.Mesh} */
	this.mesh = mesh;
	/** @type {!KFC.CustomMaterial} */
	this.shader = shader;	
	/** @type {Object.<number, Array.<number>>} */
	this.uniforms = [];
	/** @type {boolean} */
	this.culling = true;
	/** @type {boolean} */
	this.blending = false;
	
	/** @type {KFC.Texture} */
	this.tex0 = (opt_tex0 !== undefined ) ? opt_tex0 : null;
	/** @type {KFC.Texture} */
	this.tex1 = null;
	/** @type {KFC.Texture} */
	this.tex2 = null;
	/** @type {KFC.Texture} */
	this.tex3 = null;
	
	/** @type {vec3} */
	this.pos = vec3.create();
	/** @type {quat4} */
	this.rot = quat4.create([0,0,0,1]);
	
	/** @type {mat4} */
	this.mvMatrix = mat4.create();
	/** @type {mat3} */
	this.nMatrix = mat3.create();
	
	/** @type {boolean} */
	this.draw = true;
	
	/** @type {boolean} */
	this.dirty = true;
	
	this.sqDis = 0;
	
	this.far = true;
};

KFC.Obj3D.prototype._makeMatrix = function () {
	mat4.identity(this.mvMatrix);
	mat4.translate(this.mvMatrix, this.pos);
	mat4.multiply(this.mvMatrix, quat4.toMat4(this.rot));
	
	
	mat4.toInverseMat3(this.mvMatrix, this.nMatrix);
	mat3.transpose(this.nMatrix);
	
	this.dirty = false;
};

KFC.Obj3D.prototype.getMVMatrix = function () {
	if ( this.dirty ) {
		this._makeMatrix();
	}
	return this.mvMatrix;
};

KFC.Obj3D.prototype.getNMatrix = function () {
	return this.nMatrix;
};


/**
 * Mesh interface
 * @constructor
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 */
KFC.Mesh = function (gl) {
	this.ready = false;
	/** @type {Object.<string,!WebGLBuffer>} */
	this.buffers = {};
	this.uniforms = [];
	
	//this.__proto__._render = KFC.Mesh.prototype._render;
};

KFC.Mesh.prototype._render = function (gl, shader, object) {

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
	
	
	this.uniforms[KFC.UniId.uColor] = [Math.random(), Math.random(), Math.random(), 1];
	
	this.buffers.bVerPos = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, taVerPos, gl.STATIC_DRAW);
	
	this.ready = true;
};

KFC.LineAABBox.prototype._render = function (gl, shader) {
	
	shader.enableAttrib('aVerPosition');
	shader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);

	//gl.disable(gl.DEPTH_TEST);	
	gl.drawArrays(gl.LINES, 0, 24);
	//gl.enable(gl.DEPTH_TEST);
	
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
	shader.enableAttrib('aVerPosition');
	shader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);

	gl.disable(gl.DEPTH_TEST);	
	gl.drawArrays(gl.LINES, 0, 2);
	gl.enable(gl.DEPTH_TEST);
};

KFC.LineMesh.prototype._renderDepth = function (gl, shader) {
	shader.enableAttrib('aVerPosition');
	shader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);

	gl.disable(gl.DEPTH_TEST);	
	gl.drawArrays(gl.LINES, 0, 2);
	gl.enable(gl.DEPTH_TEST);
};


/**
 * Static object mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {string} url mesh file location
 * @param {boolean=} opt_build_tree build collision tree for mesh?
 * @param {function()=} opt_cb function to call when object parsing is finished
 */
KFC.ObjMesh = function (gl, url, opt_build_tree, opt_cb) {
	KFC.Mesh.call(this, gl);
	
	var that = this;
	this.gl = gl;
	this.url_ = url;
	
	if ( !KFC.isNode() ) {
		this.uniforms[KFC.UniId.uTex0] = [0];
		this.uniforms[KFC.UniId.uTex1] = [1];
		this.uniforms[KFC.UniId.uTex2] = [2];
		this.uniforms[KFC.UniId.uTex3] = [3];
	}
	
	this.root = opt_build_tree;
	
	this.taFaces = null;
	this.taVerts = null;
	this.taNorms = null;
	
	/**
	 * Finish loading callback function
	 * @type {function()|null}
	 * @private
	 */
	this.cb_ = (opt_cb === undefined) ? null : opt_cb;
	
	this.numTris = 0;
	
	this.normals = false;
	this.texture = false;
	this.firstFace = false;
	
	this.taVerPos = null;
	this.taNorm = null;
	this.taTexCoord = null;
	
	// QTree temp vectors
	this.tcp = vec3.create();
    this.ctc = vec3.create();
    this.cr = vec3.create();
	
	this.a = vec3.create();
	this.b = vec3.create();
	this.c = vec3.create();
	this.tn = vec3.create();
	
	// test results
	this.cp = vec3.create();
	this.nv = vec3.create();
	this.dis = 0;
	
	KFC.loadFile( this.url_, function(text){
		that._parse(text);
	});
	
};

KFC.ObjMesh.prototype._parse = function (text) {
	//console.log(text.length);
	
	var ln,	lp, n,
		v, v1, v2, v3, f, vt, vn, t,
		n1, n2, n3, t1, t2, t3, gl,
		va = [],
		fa = [],
		vta = [],
		vna = [],
		a = vec3.create(),
		b = vec3.create(),
		c = vec3.create(),
		nm = vec3.create();
		
	ln = text.split('\n');
	
	for ( n = 0; n < ln.length; n++ ) {
		if ( ln[n].length === 0 ) { continue; }
		lp = ln[n].split(' ');
		if ( lp.length === 0 ) { continue; }
		switch (lp[0]) {
			case "#" :
				//console.log('comment at: ' + n);
				break;
			case "o" :
				//console.log('Object: ' + lp[1]);
				break;
			case "v" :
				if ( lp.length === 4 ) {
					v = [parseFloat(lp[1]), parseFloat(lp[2]), parseFloat(lp[3])];
					if ( !isNaN(v[0]) && !isNaN(v[1]) && !isNaN(v[2]) ) {
						va.push(v);
					} else {
						console.error('Bad vertex data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Wrong vertex data count in ' + this.url_ + ':' + n);
				}
				break;
			case "f" :
				if ( !this.firstFace ) {
					this.normals = vna.length > 0;
					this.texture = vta.length > 0;
					this.firstFace = true;
				}				
				
				if ( lp.length === 4 ) {	// this assumes only triangulated faces are listed ('f' f1 f2 f3)
					v1 = lp[1].split('/');
					v2 = lp[2].split('/');
					v3 = lp[3].split('/');
					f = [parseInt(v1[0], 10), parseInt(v2[0], 10), parseInt(v3[0], 10),
						 parseInt(v1[1], 10), parseInt(v2[1], 10), parseInt(v3[1], 10),
						 parseInt(v1[2], 10), parseInt(v2[2], 10), parseInt(v3[2], 10)];
					if ( !isNaN(f[0]) && !isNaN(f[1]) && !isNaN(f[2]) ) {
						fa.push(f);
					} else {
						console.error('Bad vertex data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Wrong face data count in ' + this.url_ + ':' + n);
				}
				break;
			case 'vt' :
				if ( lp.length === 3 ) {
					vt = [parseFloat(lp[1]), parseFloat(lp[2])];
					if (  !isNaN(vt[0]) && !isNaN(vt[1]) ) {
						vta.push(vt);
					} else {
						console.error('Bad vertex texture data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Bad vertex texture data in ' + this.url_ + ':' + n);
				}
				break;
			case 'vn' :
				if ( lp.length === 4 ) {
					vn = [parseFloat(lp[1]), parseFloat(lp[2]), parseFloat(lp[3])];
					if (  !isNaN(vn[0]) && !isNaN(vn[1]) && !isNaN(vn[2]) ) {
						vna.push(vn);
					} else {
						console.error('Bad vertex normal data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Bad vertex normal data in ' + this.url_ + ':' + n);
				}
				break;
			default :
				//console.warn('Unknown obj data in ' + this.url_ + ':' + n + '\n' + ln[n]);
		}
	}
	
	var flip = -1;
	
	this.numTris = fa.length;
	
	this.taVerPos = new Float32Array(this.numTris*3*3);
	if ( this.normals === true ) {
		this.taNorm = new Float32Array(this.numTris*3*3);
	}
	if ( this.texture === true ) {
		this.taTexCoord	= new Float32Array(this.numTris*3*2);
	}
	
	if ( this.root === true ) {	// arrays needed to build tree
		this.taFaces = new Int16Array(this.numTris*3);
		this.taVerts = new Float32Array(va.length*3);
		this.taNorms = new Float32Array(this.numTris*3);
		
		for ( t = 0; t < this.numTris; t++ ) {
			this.taFaces[t*3    ] = fa[t][0] - 1;
			this.taFaces[t*3 + 1] = fa[t][1] - 1;
			this.taFaces[t*3 + 2] = fa[t][2] - 1;
		}
		
		for ( t = va.length - 1; t !== -1; t -= 1 ) {
			this.taVerts[t*3    ] = va[t][0];
			this.taVerts[t*3 + 1] = va[t][1];
			this.taVerts[t*3 + 2] = va[t][2];
		}
		
		for ( t = 0; t < this.numTris; t++ ) {
			// vertices
			v1 = va[fa[t][0]-1];
			v2 = va[fa[t][1]-1];
			v3 = va[fa[t][2]-1];
			
			// build normals from vertice data for flat collison surfaces
			vec3.subtract(v1, v2, a);
			vec3.subtract(v2, v3, b);
			vec3.cross(a, b, nm);
			vec3.normalize(nm);
			
			this.taNorms[t*3 + 0] = nm[0]; 
			this.taNorms[t*3 + 1] = nm[1];
			this.taNorms[t*3 + 2] = nm[2];
		}
		
	}
	
	
	for (t = 0; t < this.numTris; t++ ) {
		//var n = i*3;
		
		// vertices
		v1 = va[fa[t][0]-1];
		v2 = va[fa[t][1]-1];
		v3 = va[fa[t][2]-1];
		
		this.taVerPos[t*3*3    ] = v1[0];
		this.taVerPos[t*3*3 + 1] = v1[1];
		this.taVerPos[t*3*3 + 2] = v1[2];
		this.taVerPos[t*3*3 + 3] = v2[0];
		this.taVerPos[t*3*3 + 4] = v2[1];
		this.taVerPos[t*3*3 + 5] = v2[2];
		this.taVerPos[t*3*3 + 6] = v3[0];
		this.taVerPos[t*3*3 + 7] = v3[1];
		this.taVerPos[t*3*3 + 8] = v3[2];
		
		// Normals		
		if ( this.normals ) {
	
			n1 = vna[fa[t][6]-1];
			n2 = vna[fa[t][7]-1];
			n3 = vna[fa[t][8]-1];
			
			this.taNorm[t*3*3    ] = n1[0];
			this.taNorm[t*3*3 + 1] = n1[1];
			this.taNorm[t*3*3 + 2] = n1[2];
			this.taNorm[t*3*3 + 3] = n2[0];
			this.taNorm[t*3*3 + 4] = n2[1];
			this.taNorm[t*3*3 + 5] = n2[2];
			this.taNorm[t*3*3 + 6] = n3[0];
			this.taNorm[t*3*3 + 7] = n3[1];
			this.taNorm[t*3*3 + 8] = n3[2];
		}

		// Texture coordinates
		if ( this.texture ) {
			
			t1 = vta[fa[t][3]-1];
			t2 = vta[fa[t][4]-1];
			t3 = vta[fa[t][5]-1];
			
			this.taTexCoord[t*3*2    ] = t1[0]; // same normal for all triangle vertices
			this.taTexCoord[t*3*2 + 1] = t1[1];
			this.taTexCoord[t*3*2 + 2] = t2[0];
			this.taTexCoord[t*3*2 + 3] = t2[1];
			this.taTexCoord[t*3*2 + 4] = t3[0];
			this.taTexCoord[t*3*2 + 5] = t3[1];
		}
	}
	
	if ( typeof(exports) === 'undefined' ) {	// exclude from node.js
		gl = this.gl;
		
		this.buffers.bVerPos = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
		gl.bufferData(gl.ARRAY_BUFFER, this.taVerPos, gl.STATIC_DRAW);
		
		if ( this.normals ) {
			this.buffers.bNorm = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bNorm);
			gl.bufferData(gl.ARRAY_BUFFER, this.taNorm, gl.STATIC_DRAW);
		}
		
		if ( this.texture ) {
			this.buffers.bTexCoord = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bTexCoord);
			gl.bufferData(gl.ARRAY_BUFFER, this.taTexCoord, gl.STATIC_DRAW);
		}
	}
	
	var mesh = this;
	
	if ( this.root ) {
		setTimeout(function (){	// call this later, to not freeze stuff too much TODO: move to worker thread
			
			var t;
			mesh.root = new KFC.BTree(mesh);
			
			for ( t = 0; t < mesh.numTris; t++ ) {
				mesh.root.add(t);
			}
			mesh.root.build(0);
			
			if ( mesh.cb_ ) {
				mesh.cb_();
				mesh.cb_ = null;
			}
			
		}, 1);
	} else {
		if ( this.cb_ ) {
			this.cb_();
			this.cb_ = null;
		}
	}
	
	this.ready = true;
	
};

KFC.ObjMesh.prototype._render = function (gl, shader, object) {
	
	shader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);
	
	var fix = 'aVerNormal';
	
	if ( shader.attributes[fix] !== undefined ) {	// if shader does not require normal attribute
		if ( this.normals === true ) {
			shader.enableAttrib('aVerNormal');			
			shader.attribPointer('aVerNormal', this.buffers.bNorm, 3);
		} else {
			shader.disableAttrib('aVerNormal');
		}
	}	
	
	if ( this.texture && object.tex0 ) {
		shader.enableAttrib('aTexCoord');
		shader.attribPointer('aTexCoord', this.buffers.bTexCoord, 2);
		
		shader.bindTexture(0, object.tex0.tex);		
		if ( object.tex1 ) {
			shader.bindTexture(1, object.tex1.tex);
		}
		if ( object.tex2 ) {
			shader.bindTexture(2, object.tex2.tex);
		}
		if ( object.tex3 ) {
			shader.bindTexture(3, object.tex3.tex);
		}
	}	
	
	gl.drawArrays(gl.TRIANGLES, 0, this.numTris*3);
	
};

KFC.ObjMesh.prototype._renderDepth = function(gl, dshader) {
	
	dshader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);
	
	gl.drawArrays(gl.TRIANGLES, 0, this.numTris*3);
};


/**
 * Text Mesh class
 * @constructor
 * @extends {KFC.Mesh}
 * @param {!WebGLRenderingContext} gl WebGL rendering context
 * @param {string} url mesh file location
 * @param {function()=} opt_cb function to call when object parsing is finished
 */
KFC.TextMesh = function(gl, url, opt_cb) {
	
	KFC.Mesh.call(this, gl);
	
	var that = this;
	this.gl = gl;
	this.url_ = url;
	this._cb = ( opt_cb === undefined ) ? null : opt_cb;
	this.offsets = {'': 0};
	this.size = {};
	
	KFC.loadFile( this.url_, function(text) {
		that._parse(text);
	});
	
};


KFC.TextMesh.prototype._parse = function(text) {
	
	var ln,	lp, n,
		v, v1, v2, v3, f, vt, vn, t,
		lastoff = '',
		n1, n2, n3, t1, t2, t3, gl,
		va = [],
		fa = [],
		vta = [],
		vna = [];
		
	ln = text.split('\n');
	
	for ( n = 0; n < ln.length; n++ ) {
		if ( ln[n].length === 0 ) { continue; }
		lp = ln[n].split(' ');
		if ( lp.length === 0 ) { continue; }
		switch (lp[0]) {
			case "#" :
				//console.log('comment at: ' + n);
				break;
			case "o" :
				//console.log('Object: ' + lp[1]);
				break;
			case "g" :
				//console.log('Object: ', (lp[1])[0], fa.length);
				this.offsets[lp[1][0]] = fa.length;
				this.size[lastoff] = fa.length - this.offsets[lastoff];
				lastoff = lp[1][0];
				
				break;
			case "v" :
				if ( lp.length === 4 ) {
					v = [parseFloat(lp[1]), parseFloat(lp[2]), parseFloat(lp[3])];
					if ( !isNaN(v[0]) && !isNaN(v[1]) && !isNaN(v[2]) ) {
						va.push(v);
					} else {
						console.error('Bad vertex data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Wrong vertex data count in ' + this.url_ + ':' + n);
				}
				break;
			case 'vn' :
				if ( lp.length === 4 ) {
					vn = [parseFloat(lp[1]), parseFloat(lp[2]), parseFloat(lp[3])];
					if (  !isNaN(vn[0]) && !isNaN(vn[1]) && !isNaN(vn[2]) ) {
						vna.push(vn);
					} else {
						console.error('Bad vertex normal data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Bad vertex normal data in ' + this.url_ + ':' + n);
				}
				break;
			case "f" :
				if ( lp.length === 4 ) {	// this assumes only triangulated faces are listed ('f' f1 f2 f3)
					v1 = lp[1].split('/');
					v2 = lp[2].split('/');
					v3 = lp[3].split('/');
					f = [parseInt(v1[0], 10), parseInt(v2[0], 10), parseInt(v3[0], 10),
						 parseInt(v1[1], 10), parseInt(v2[1], 10), parseInt(v3[1], 10),
						 parseInt(v1[2], 10), parseInt(v2[2], 10), parseInt(v3[2], 10)];
					if ( !isNaN(f[0]) && !isNaN(f[1]) && !isNaN(f[2]) ) {
						fa.push(f);
					} else {
						console.error('Bad vertex data in ' + this.url_ + ':' + n);
					}
				} else {
					console.error('Wrong face data count in ' + this.url_ + ':' + n);
				}
				break;
			default :
				//console.warn('Unknown obj data in ' + this.url_ + ':' + n + '\n' + ln[n]);
		}
	}
	
	this.size[lastoff] = fa.length - this.offsets[lastoff];
	
	var flip = -1;
	
	this.numTris = fa.length;
	
	this.taVerPos	= new Float32Array(this.numTris*3*3);
	this.taNorm		= new Float32Array(this.numTris*3*3);	
	
	for (t = 0; t < this.numTris; t++ ) {
		//var n = i*3;
		
		// vertices
		v1 = va[fa[t][0]-1];
		v2 = va[fa[t][1]-1];
		v3 = va[fa[t][2]-1];
		
		this.taVerPos[t*3*3    ] = v1[0];
		this.taVerPos[t*3*3 + 1] = v1[1];
		this.taVerPos[t*3*3 + 2] = v1[2];
		this.taVerPos[t*3*3 + 3] = v2[0];
		this.taVerPos[t*3*3 + 4] = v2[1];
		this.taVerPos[t*3*3 + 5] = v2[2];
		this.taVerPos[t*3*3 + 6] = v3[0];
		this.taVerPos[t*3*3 + 7] = v3[1];
		this.taVerPos[t*3*3 + 8] = v3[2];
		
		// Normals		
		n1 = vna[fa[t][6]-1];
		n2 = vna[fa[t][7]-1];
		n3 = vna[fa[t][8]-1];
		
		this.taNorm[t*3*3    ] = -n1[0]; // same normal for all triangle vertices
		this.taNorm[t*3*3 + 1] = -n1[1];
		this.taNorm[t*3*3 + 2] = -n1[2];
		this.taNorm[t*3*3 + 3] = -n2[0];
		this.taNorm[t*3*3 + 4] = -n2[1];
		this.taNorm[t*3*3 + 5] = -n2[2];
		this.taNorm[t*3*3 + 6] = -n3[0];
		this.taNorm[t*3*3 + 7] = -n3[1];
		this.taNorm[t*3*3 + 8] = -n3[2];
	}
	
	gl = this.gl;
	
	this.buffers.bVerPos = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bVerPos);
	gl.bufferData(gl.ARRAY_BUFFER, this.taVerPos, gl.STATIC_DRAW);
	
	this.buffers.bNorm = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bNorm);
	gl.bufferData(gl.ARRAY_BUFFER, this.taNorm, gl.STATIC_DRAW);
	
	
	this.ready = true;
	
	if ( typeof(this._cb) == 'function' ) {
		this._cb();
		this._cb = null;
	}
};


KFC.TextMesh.prototype._render = function (gl, shader, object) {
	
	if ( typeof object.text !== 'string' ) {
		throw Error('TextMesh objects must have a text string!');
	}
	
	var uniLoc = shader.uniLocs[shader.uniIds.indexOf(KFC.UniId.uOffset)];
	var i;

	shader.enableAttrib('aVerPosition');
	shader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);
	
	shader.enableAttrib('aVerNormal');
	shader.attribPointer('aVerNormal', this.buffers.bNorm, 3);
	
	for ( i = 0; i < object.text.length; i++ ) {
		var c = object.text[i].toLowerCase();
		if ( c === ' ' ) { continue; }
		if ( this.offsets[c] === undefined ) { c = '_'; }
		gl.uniform1i(uniLoc, i);
		gl.drawArrays(gl.TRIANGLES, this.offsets[c]*3, this.size[c]*3);
	}
	
};


KFC.TextMesh.prototype._renderDepth = function (gl, shader, object) {
	
	if ( typeof object.text !== 'string' ) { 
		throw Error('TextMesh objects must have a text string!');
	}
	
	var uniLoc = shader.uniLocs[shader.uniIds.indexOf(KFC.UniId.uOffset)];
	var i;
	
	shader.enableAttrib('aVerPosition');
	shader.attribPointer('aVerPosition', this.buffers.bVerPos, 3);
	
	for ( i = 0; i < object.text.length; i++ ) {
		var c = object.text[i].toLowerCase();
		if ( c === ' ' ) { continue; }
		if ( this.offsets[c] === undefined ) { c = '_'; }
		gl.uniform1i(uniLoc, i);
		gl.drawArrays(gl.TRIANGLES, this.offsets[c]*3, this.size[c]*3);
	}
};











