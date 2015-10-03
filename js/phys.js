/*jshint node:true devel:true */
/*global KFC:true, vec3, mat4, quat4, mat3, NI, APP */


if (typeof(exports) !== 'undefined') {
	global.KFC = global.KFC || {};
} else {
	window.KFC = window.KFC || {};
}


/**
 * Binary tree
 * @constructor
 */
KFC.BTree = function (mesh) {
	this.mesh = mesh;
	
	this.min = vec3.create();
	this.max = vec3.create();
	
	this.level = 0;
	
	this.ta = [];
	
	this.z = null;
	this.o = null;
	
	this.cp = vec3.create();
	this.nv = vec3.create();
	this.dis = 0;
	
	
};

KFC.BTree.prototype.add = function(t) {
	this.ta.push(t);
};

KFC.BTree.prototype.seeBounds = function() {
	
	var i, t, v, p, a;
	
	// reset
	this.min[0] =  1e+10;
	this.min[1] =  1e+10;
	this.min[2] =  1e+10;
	this.max[0] = -1e+10;
	this.max[1] = -1e+10;
	this.max[2] = -1e+10;
	
	for (i = 0; i < this.ta.length; i++) {
		t = this.ta[i] * 3;
		for (v = 0; v < 3; v++) {
			
			for (a = 0; a < 3; a++) {
				p = this.mesh.taVerts[this.mesh.taFaces[t+v]*3 + a];
				if ( p > this.max[a] ) { this.max[a] = p; }
				if ( p < this.min[a] ) { this.min[a] = p; }
			}
		}
	}
	
};


KFC.BTree.prototype.build = function(lvl) {
	var split, mid, t, p, i, a, na, q;
	this.seeBounds();
	
	this.level = lvl;
	
	if ( this.ta.length === 0 ) { console.log(0); }
	
	if ( this.ta.length > 2 && lvl < 50 ) {
		split = (((this.max[0] - this.min[0]) > (this.max[2] - this.min[2]))?0:2);
		
		this.split = split;
		
		mid = ((split) ? (this.max[2] + this.min[2])/2 : (this.max[0] + this.min[0])/2);
		  q =  (split) ? (this.max[2] - this.min[2])/4 : (this.max[0] - this.min[0])/4;
		
		this.mid = mid;
		
		this.z = new KFC.BTree(this.mesh);
		this.o = new KFC.BTree(this.mesh);
		
		na = [];
		
		while ((t = this.ta.pop()) !== undefined) {
			// find max and min coordinate in split axis
			i = a = this.mesh.taVerts[this.mesh.taFaces[t*3]*3+split];
			p = this.mesh.taVerts[this.mesh.taFaces[t*3+1]*3+split];
			if ( p < i ) { i = p; }
			if ( p > a ) { a = p; }
			p = this.mesh.taVerts[this.mesh.taFaces[t*3+2]*3+split];
			if ( p < i ) { i = p; }
			if ( p > a ) { a = p; }
			
			if ( (mid-i) > q && (a-mid) > q ) {
				na.push(t);
			} else {
				if ( (mid-i) > (a-mid) ) {
					this.o.add(t);
				} else {
					this.z.add(t);
				}
			}
		}
		
		this.ta = na;
		
		if ( this.z.ta.length === 0 ) { this.z = null; }
		else { this.z.build(lvl+1); }
		
		if ( this.o.ta.length === 0 ) { this.o = null; }
		else { this.o.build(lvl+1); }
		
	}
	
};

// Finds highest mesh position at line
KFC.BTree.prototype.yAt = function(x, z) {
	if ( x < this.min[0] || x > this.max[0] || z > this.max[2] || z < this.min[2] ) { return false; }
	
	var ret;
	var max = -1e2;
	var n = [0,1,0];
	var i;
	
	for (i = this.ta.length-1; i >= 0; i--) {
		ret = this.testY(x, z, this.ta[i]);
		if ( ret !== false && ret.r > max ) {
			max = ret.r; n = ret.n;
		}
	}
	
	if ( this.z !== null ) {
		ret = this.z.yAt(x, z);
		if ( ret !== false && ret.r > max ) {
			max = ret.r; n = ret.n;
		}
	}
	
	if ( this.o !== null ) {
		ret = this.o.yAt(x, z);
		if ( ret !== false && ret.r > max ) {
			max = ret.r; n = ret.n;
		}
	}
	
	return {'r':max, 'n':n};
};



KFC.BTree.prototype.testY = function(x, z, t) {
	var a, b, c, i, m, A, B, C,
		t3 = t+t+t;
		
	m = this.mesh;
	
	i = m.taFaces[t3]*3;	a = [m.taVerts[i++], m.taVerts[i++], m.taVerts[i]];
	i = m.taFaces[t3+1]*3;	b = [m.taVerts[i++], m.taVerts[i++], m.taVerts[i]];
	if ( KFC.dot2d(x-a[0], z-a[2], a[2]-b[2], b[0]-a[0]) > 0 ) return false;
	i = m.taFaces[t3+2]*3;	c = [m.taVerts[i++], m.taVerts[i++], m.taVerts[i]];
    if ( KFC.dot2d(x-b[0], z-b[2], b[2]-c[2], c[0]-b[0]) > 0 ) return false;
    if ( KFC.dot2d(x-c[0], z-c[2], c[2]-a[2], a[0]-c[0]) > 0 ) return false;
	
	A = m.taNorms[t3++];
	B = m.taNorms[t3++];
	C = m.taNorms[t3];
	
    if ( A === 0 && B === 0 && C === 0 ) {
        return false;
	}
        
    var mD = A*a[0] + B*a[1] + C*a[2];
    
    return {'r':(A*x + C*z - mD) / (-B), 'n':[A, B, C]};
};

/**
 * Tests ray collision against mesh tree
 * @param {!vec3} org Ray orgin 
 * @param {!vec3} dir Ray direction, should be normalized
 * @param {number=} opt_max Maximum ray length to test
 */
KFC.BTree.prototype.rayTest = function( org, dir, opt_max ) {
	
	if ( opt_max !== undefined ) { this.mesh.dis = opt_max; }
	else { opt_max = this.mesh.dis; }
	
	var i;
	
	var tfar	=  100000.1,
		tnear	= -100000.1,
		t1, t2;
	
	for ( i = 2; i >= 0; i-- ) {
		if ( dir[i] === 0 ) {
			if ( org[i] < this.min[i] || org[i] > this.max[i] ) {
				return false;
			}
			continue;
		}
		
		t1 = ( this.min[i] - org[i] ) / dir[i];
		t2 = ( this.max[i] - org[i] ) / dir[i];
		
		if ( t1 > t2 ) {
			if ( t2 > tnear ) { tnear = t2; }
			if ( t1 < tfar  ) { tfar  = t1; }
		} else {
			if ( t1 > tnear ) { tnear = t1; }
			if ( t2 < tfar  ) { tfar  = t2; }
		}
		
		if ( tnear > tfar ) { return false; }
		if ( tfar <= 0 ) { return false; }
		if ( tnear > opt_max ) { return false; }
	}
	
	for ( i = this.ta.length-1; i >= 0; i-- ) {
		this.rayTri( org, dir, this.ta[i]);
	}
	
	if ( this.z !== null ) {
		this.z.rayTest(org, dir);
	}
	
	if ( this.o !== null ) {
		this.o.rayTest(org, dir);
	}
	
	if ( this.mesh.dis === opt_max ) { return false; }
	
	return true;
	
};


KFC.BTree.prototype.rayTri = function( org, dir, t ) {
	
	var t3 = t+t+t;
	var i, m, A, B, C;
	
	m = this.mesh;
	
	var cp	= m.tcp,	// collision point
		ctc	= m.ctc,
		cr	= m.cr,
		tn	= m.tn,
		a	= m.a,
		b	= m.b,
		c	= m.c;
	
	i = m.taFaces[t3]*3;	a[0] = m.taVerts[i++]; a[1] = m.taVerts[i++]; a[2] = m.taVerts[i];
	i = m.taFaces[t3+1]*3;	b[0] = m.taVerts[i++]; b[1] = m.taVerts[i++]; b[2] = m.taVerts[i];
	i = m.taFaces[t3+2]*3;	c[0] = m.taVerts[i++]; c[1] = m.taVerts[i++]; c[2] = m.taVerts[i];
	
	tn[0] = m.taNorms[t3++];
	tn[1] = m.taNorms[t3++];
	tn[2] = m.taNorms[t3];
	
	
	var D = -1 * vec3.dot(tn, a);
	var M = vec3.dot(tn, dir);
	if ( M === 0 ) { return false; }
	
	var dis = -1 * (vec3.dot(org, tn) + D) / M;
	
	if ( dis >= m.dis ) { return false; }
	if ( dis < 0 ) { return false; }
	
    vec3.scale(dir, dis, cp );
    vec3.add(cp, org);
	
	// is collision point in triangle, TODO: make functions?
    vec3.subtract(a, b, cr);
    vec3.cross(cr, tn);
    vec3.subtract(cp, a, ctc);
    if ( vec3.dot(cr, ctc) < 0 ) { return false; }
	
    vec3.subtract(b, c, cr);
    vec3.cross(cr, tn);
    vec3.subtract(cp, b, ctc);
    if ( vec3.dot(cr, ctc) < 0 ) { return false; }
	
    vec3.subtract(c, a, cr);
    vec3.cross(cr, tn);
    vec3.subtract(cp, c, ctc);
    if ( vec3.dot(cr, ctc) < 0 ) { return false; }

	// set new values to mesh
	vec3.set(cp, m.cp);
	vec3.set(tn, m.nv);
	
	m.dis = dis;
	
	return true;
};

/**
 * Wraps all physics meshes in one object
 * @constructor
 */
KFC.PhysMesh = function() {
	
	this.meshes_ = [];
	this.root = {};
	
	var that = this;
	
	//this.root.rayTest = function ( a, b, c) {
	//	return that.rayTest(a, b, c);
	//};
	//this.root.yAt = function ( a, b) {
	//	return that.yAt(a, b);
	//};
	
	// test results
	this.cp = vec3.create();
	this.nv = vec3.create();
	this.dis = 0;
	this.terr = 0;
	
};


KFC.PhysMesh.prototype.rayTest = function( org, dir, opt_max ) {
	
	var i, mesh,
		ret = false;
		
		
	this.dis = opt_max;
	
	for ( i = this.meshes_.length-1; i >= 0; i-- ) {
		mesh = this.meshes_[i];
		
		if ( mesh.root.rayTest( org, dir, this.dis ) === true ) {
			vec3.set(mesh.cp, this.cp);
			vec3.set(mesh.nv, this.nv);
			this.dis = mesh.dis;
			this.terr = mesh.terr;
			ret = true;
		}		
	}
	
	return ret;	
};


KFC.PhysMesh.prototype.yAt = function(x, z) {
	
	var i, mesh, ret,
		max = -1e2,
		n = [0,1,0];
	
	for ( i = this.meshes_.length-1; i >= 0; i-- ) {
		mesh = this.meshes_[i];
		ret = mesh.root.yAt( x, z );
		if ( ret !== false && ret.r > max ) {
			max = ret.r; n = ret.n;
		}		
	}
	
	return {'r':max, 'n':n};
};



