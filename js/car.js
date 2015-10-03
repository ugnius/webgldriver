/*jshint node:true devel:true */
/*global KFC:true, vec3, mat4, mat3, quat4, NI, APP */

if (typeof(exports) !== 'undefined') {
	global.KFC = global.KFC || {};
} else {
	window.KFC = window.KFC || {};
}


/**
 * Car 
 * @constructor
 * @param {number} type Car type code
 */
KFC.Car = function (type) {
	
	this.type = type;
	if ( this.type === -1 ) {	// pick a car, any car...
	  var ci = [1, 2, 3, 4, 5, 6, 9, 11];	// car indexes
	  this.type = ci[Math.floor(Math.random() * 1e10) % ci.length];
	  //this.type = 1;
	}
	
	this.pos_wc = vec3.create([417, 0.338, -395.164]);	// position world coordinates
	this.vel_wc = vec3.create([0,   0, 0]);	// velocity world coordinates
	
	this.rot = quat4.create();				// rotation quaternion
	quat4.set([0, 0.554, 0, 0.832], this.rot);
	//KFC.quat4(0.4, [0, 1, 0], false, this.rot);
	
	this.ave = vec3.create([0, 0, 0]);	// angular velocity
	
	this.mass = 1200;
	this.imass = 1.0 / this.mass;
	this.moi = 1200;		// should be inertia tensor
	
	this.throttle	= 0;	//  0..1
	this.brakes		= 0;	//  0..1
	this.steerAngle	= 0;	// -1..1
	this.gear		= 1;	// -1,0,1-6
	this.gratio = {10:-3.68, 0:0, 1:4.06, 2:2.4, 3:1.58, 4:1.19, 5:1.00, 6:0.87, 9:3.80 };	// 10 - reverse, 9 - final
	this.frontLock	= 0.75;	// rad - 43 deg
	
	this.engine = new KFC.Engine(this);
	
	this.cgf  = vec3.create();	// forces affecting center of gravity
	this.torq = vec3.create();	// torques rotating car
	
	//this.engine = new KFC.CarEngine(this);
	
	this.cg_mat = mat4.create();
	this.icg_mat = mat4.create();
	
	this.tq = quat4.create();
	this.tv = vec3.create();
	this.vel_cc = vec3.create();
	
	
	this.tva = vec3.create();
	this.tva2 = vec3.create();
	
	this.tq = quat4.create();
	
	this.rrot = quat4.create();	// rotation
	
	this.coll = null;
	
	this.controllQueue = [];
	this.stateQueue = [];
	
	//this.tv2 = vec3.create();
	//this.tv3 = vec3.create();
	//this.tv4 = vec3.create();

	
	var f = 0.0;	// z to front wheels
	var r = 0.0;	// z to rear wheels
	var s = 0.0;	// x distance to wheels
	var h = 0.0;	// y from cg
	var wb = 2.0;
	var fw = 0.5;
	var ft = 0.0;	// front and rear torque distribution
	var rt = 1.0;
	
	switch ( this.type ) {
	case 1 :   // b3
		fw = 0.6; wb =  2.578;
		s =  0.74; h =  0.25;
		ft = 1.0; rt = 0.0;
		break;
	case 2 :	// alpha
		fw = 0.57; wb =  2.615;
		s =  0.72; h =  0.25;
		ft = 0.4; rt = 0.6;
		break;
	case 3 :	// ulf
		fw = 0.5; wb =  2.761;
		s =  0.75; h =  0.25;
		break;
	case 4 :	// head
		fw = 0.53; wb =  2.700;
		s =  0.80; h =  0.30;
		break;
	case 5 :	// f35
		fw = 0.50; wb =  2.780;
		s =  0.79; h =  0.30;
		break;
	case 6 :	// arosa
		fw = 0.50; wb =  2.650;
		s =  0.83; h =  0.35;
		break;
	case 9 :	// r500
		fw = 0.39; wb =  2.350;
		s =  0.75; h =  0.30;
		break;
	case 11 :	// admin
		fw = 0.50; wb =  2.560;
		s =  0.82; h =  0.35;
		ft = 0.4; rt = 0.6;
		break;
	default :
		fw = 0.5; wb =  2.761;
		s =  0.79; h =  0.25;
		ft = 0.0; rt = 1.0;
		console.log('default car values loaded!');
	}
	
	this.fTorq = ft * 0.5;	// front and rear torque distribution fo one wheel
	this.rTorq = rt * 0.5;
	
	f = -wb * (1.0-fw);
	r = wb * fw;
	
	this.wheels = [];
	this.wheels[0] = new KFC.Wheel([-s, h, f],  1, this);
	this.wheels[1] = new KFC.Wheel([ s, h, f], -1, this);
	this.wheels[2] = new KFC.Wheel([-s, h, r],  1, this);
	this.wheels[3] = new KFC.Wheel([ s, h, r], -1, this);
	
};


KFC.Car.prototype.getData = function( ab, off ) {
	
	var ua = new Uint8Array( ab, off, 4 );
	var fa = new Float32Array( ab, off+4 );
	
	ua[0] = this.type;
	ua[1] = this.gear;
	
	var i = 0;
	var w;
	
	fa[i++] = this.pos_wc[0]; fa[i++] = this.pos_wc[1]; fa[i++] = this.pos_wc[2];
	fa[i++] = this.vel_wc[0]; fa[i++] = this.vel_wc[1]; fa[i++] = this.vel_wc[2];
	fa[i++] = this.rot[0]; fa[i++] = this.rot[1]; fa[i++] = this.rot[2]; fa[i++] = this.rot[3];
	fa[i++] = this.ave[0]; fa[i++] = this.ave[1]; fa[i++] = this.ave[2];
	
	fa[i++] = this.throttle;
	fa[i++] = this.brakes;
	fa[i++] = this.steerAngle;
	
	fa[i++] = this.engine.vel;
	
	for ( w = 0; w < 4; w++ ) {
		fa[i++] = this.wheels[w].su_pos;
		fa[i++] = this.wheels[w].su_vel;
		fa[i++] = this.wheels[w].prot;
		fa[i++] = this.wheels[w].vrot;
	}
	
};

KFC.Car.prototype.toString = function() {
	
	var s = [];
    var ab = new ArrayBuffer(136);
	var i;
	
	this.getData( ab, 0 );
	
	var ua = new Uint8Array( ab );
	
	for ( i = 0; i < 136*2; i++ ) {
		
		var b = ua[Math.ceil(i/2)];
		if ( i & 0x01 ) {
			b = b & 0x0f;
		} else {
			b = b >>> 4;
		}
		
		switch (b) {
		case 0 : s[i] = '0'; break;
		case 1 : s[i] = '1'; break;
		case 2 : s[i] = '2'; break;
		case 3 : s[i] = '3'; break;
		case 4 : s[i] = '4'; break;
		case 5 : s[i] = '5'; break;
		case 6 : s[i] = '6'; break;
		case 7 : s[i] = '7'; break;
		case 8 : s[i] = '8'; break;
		case 9 : s[i] = '9'; break;
		case 10 : s[i] = 'a'; break;
		case 11 : s[i] = 'b'; break;
		case 12 : s[i] = 'c'; break;
		case 13 : s[i] = 'd'; break;
		case 14 : s[i] = 'e'; break;
		case 15 : s[i] = 'f'; break;
		default : s[i] = 'x';
		}
	}
	
	return s.join('');
	
};


KFC.Car.prototype.setData = function( ab, off ) {
	
	var ua = new Uint8Array( ab, off, 4 );
	var fa = new Float32Array( ab, off+4 );
	
	this.gear = ua[1];
	
	var i = 0;
	var w;
	
	this.pos_wc[0] = fa[i++]; this.pos_wc[1] = fa[i++]; this.pos_wc[2] = fa[i++];
	this.vel_wc[0] = fa[i++]; this.vel_wc[1] = fa[i++]; this.vel_wc[2] = fa[i++];
	this.rot[0] = fa[i++]; this.rot[1] = fa[i++]; this.rot[2] = fa[i++]; this.rot[3] = fa[i++];
	this.ave[0] = fa[i++]; this.ave[1] = fa[i++]; this.ave[2] = fa[i++];
	
	this.throttle	= fa[i++];
	this.brakes		= fa[i++];
	this.steerAngle = fa[i++];
	
	this.engine.vel = fa[i++];
	
	for ( w = 0; w < 4; w++ ) {
		this.wheels[w].su_pos	= fa[i++];
		this.wheels[w].su_vel	= fa[i++];
		this.wheels[w].prot		= fa[i++];
		this.wheels[w].vrot		= fa[i++];
	}
	
};


KFC.Car.prototype.integrate = function (dt) {
	
	switch( this.gear ) {
		case 10:
			if ( this.brakes <= 0.01 && this.throttle >= 0.01 && vec3.length(this.vel_wc) < 0.02 ) {
				this.gear = 0;
			}
			if (this.brakes <= 0.01 && this.engine.vel <= this.engine.Widle) {	// reduce gear to prevent engine stalling
				this.gear = 0;
			}
			break;
		case 0:
			if ( this.throttle <= 0.01 && this.brakes >= 0.5 && vec3.length(this.vel_wc) < 0.1 ) {
				this.gear = 10;
			} else {
				if (this.engine.vel > this.engine.Widle + 200) {	// switch gear if near redline
					this.gear++;
				}
			}
			if ( this.throttle < 0.01 && this.brakes < 0.5 ) {
				this.brakes = 0.49;
			}
			break;
		case 1:
			if (this.engine.vel > this.engine.Wmax - 10) {	// switch gear if near redline
				this.gear++;
			}
			if (this.engine.vel < this.engine.Widle + 10) {	// reduce gear to prevent engine stalling
				this.gear--;
			}
			break;
		case 2:
		case 3:
		case 4:
		case 5:
			if (this.engine.vel > this.engine.Wmax - 10) {	// switch gear if near redline
				this.gear++;
			}
			if (this.engine.vel / this.gratio[this.gear] * this.gratio[this.gear-1] < this.engine.Wmax - 100) {	// reduce gear to prevent engine stalling
				this.gear--;
			}
			break;		
		case 6:
			if (this.engine.vel / this.gratio[this.gear] * this.gratio[this.gear-1] < this.engine.Wmax - 100) {	// reduce gear to prevent engine stalling
				this.gear--;
			}
			break;
		default :
			console.warn("invalid gear: " + this.gear);
	}
	
	
	this.wheels[0].yaw = this.steerAngle * this.frontLock * ((this.steerAngle > 0)?1.2:0.9) / (Math.pow(vec3.length(this.vel_wc)/8,2)+1);	// steer front wheels
	this.wheels[1].yaw = this.steerAngle * this.frontLock * ((this.steerAngle < 0)?1.2:0.9) / (Math.pow(vec3.length(this.vel_wc)/8,2)+1);
	
	
	vec3.set([0,0,0], this.cgf);			// should be in car coordinates
	vec3.set([0,0,0], this.torq);
	
	var tv = this.tva;
	
	quat4.multiplyVec3(this.rot, this.vel_wc, this.vel_cc);
	
	var Wgbo = this.wheels[0].vrot * this.fTorq + this.wheels[1].vrot * this.fTorq +
				this.wheels[2].vrot * this.rTorq + this.wheels[3].vrot * this.rTorq;	// gear box output angular speed
	var ratio = this.gratio[this.gear] * this.gratio[9];			// current gear ratio
	var Wgbi = Wgbo * ratio;												// gear box input
	
	var Tcluch = ( this.engine.vel - Wgbi ) * 50;							// cluch torque
	Tcluch = Math.min(Tcluch, 2000);
	if ( this.gear === 0 ) {								// Neutral gear
		Tcluch = 0;
	}
	
	this.engine.step((this.gear === 10) ? this.brakes : this.throttle, Tcluch, dt);
	
	
	var Tgb = Tcluch * ratio / 1;
	
	
	this.wheels[0].addForce(Tgb*this.fTorq, dt);
	this.wheels[1].addForce(Tgb*this.fTorq, dt);
	this.wheels[2].addForce(Tgb*this.rTorq, dt);
	this.wheels[3].addForce(Tgb*this.rTorq, dt);
	
	
	// damp forces ?
	KFC.vec3.addscaled(this.torq, this.ave, -0.001 );
	KFC.vec3.addscaled(this.cgf,  this.vel_cc,   -0.001 );	
	
	quat4.multiplyVec3(this.rot, this.cgf);		// change CG force to world coordinates	
	
	this.applyForce([0, 0, 0], [0, -this.mass*9.8, 0]);			// gravity

	
	// changing position and coordinates
	
	var m = vec3.length(this.ave);
	if ( m > 0 ) {
		vec3.scale(this.ave, 1/m, tv);
		KFC.quat4(m*dt, tv, true, this.tq);
		quat4.multiply(this.rot, this.tq);	
		quat4.normalize(this.rot);
		quat4.conjugate(this.rot, this.rrot);		// reverse car rotation ( to convert rotation from world to car coords )
	}	
	vec3.add(this.ave, vec3.scale(this.torq, dt/this.moi));
	
	
	vec3.add(this.pos_wc, vec3.scale(this.vel_wc, dt, tv));
	vec3.add(this.vel_wc, vec3.scale(this.cgf,    dt*this.imass, tv));
	
	// recalculating matrices
	mat4.identity(this.cg_mat);
	mat4.translate(this.cg_mat, this.pos_wc);
	mat4.multiply(this.cg_mat, quat4.toMat4(this.rot));
	
	this.icg_mat = mat4.inverse(this.cg_mat, this.icg_mat);
};


// fo - force orgin
// fv - force vector
// cgf - forece affecting cg accumulator
// torq - torque accumulator
KFC.Car.prototype.applyForce = function (fo, fv) {
	
	vec3.add(this.cgf, fv);
	vec3.add(this.torq, vec3.cross(fo, fv, this.tva) );
};



/**
 * Input handler
 * @constructor
 */
KFC.Engine = function (car) {
	this.car = car;
	this.frictionKv = 0.1;			// engine friction  (N/(rad/s))
	this.frictionTorqueMax = 20;	// max engine friction
	this.moi = 0.2;					// moment of inertia (0.1)
	this.imoi = 1 / this.moi;		// one over moment if inertia
	this.Widle = 105;				// engine idle speed (rad/s) 105 ~ 1000rpm
	this.Wmax = 830;				// max angular velocity (rad/s) 830 ~ 8000rpm
	
	this.vel = this.Widle;						// engine angular speed (rad/s)
	
	this.curve = [0, 280, 300, 340, 390, 400, 400, 360, 340, 0];	// torque curve points
	
};

KFC.Engine.prototype.step = function (throttle, Tcluch, dt) {
	var torque = this.torq() * throttle;
	var friction = Math.min(this.vel * this.frictionKv, this.frictionTorqueMax);
	
	var a = ( torque - friction - Tcluch ) * this.imoi;
	
	this.vel += a * dt;
	this.vel = Math.max(this.vel, this.Widle);
	
};


KFC.Engine.prototype.torq = function () {	// Engine torque "curve"
	
	var rpm = this.vel * 0.00955;	// * Pi / 30 / 1000
	
	var p1 = Math.floor(rpm);
	var p2 = Math.ceil(rpm);
	if ( p1 === p2 ) { p2++; }
	var mix = rpm - p1;
	
	p1 = KFC.clamp(p1, 0, 9);
	p2 = KFC.clamp(p2, 0, 9);
	
	return (this.curve[p1] * mix + this.curve[p2] * (1-mix)) * 2.0;
};



/**
 * Wheel
 * @constructor
 */
KFC.Wheel = function (pos, rotate, car) {
	
	this.pos = vec3.create(pos);	// wheel position relative to car cg;
	this.radius = 0.3305;				// wheel radius (m)
	this.yaw = 0;						// wheel side turn (rad)
	this.rotate = rotate; 
	this.car = car;
	
	this.apos = vec3.create();
	this.dpos = vec3.create();
	
	this.mass = 10;
	this.imass = 1 / this.mass;
	this.moi = 10;						// mass of inertia
	this.imoi = 1 / this.moi;			// inverted mass of inertia
	
	this.maxSlong = 0.18;				// max longitudal slip
	
	this.su_dir = vec3.create([0,1,0]);	// suspension direction
	this.su_pos = -0.10;						// suspension movement
	this.su_rest = -0.20;						// suspension rest
	this.su_vel = 0;						// suspension movement speed
	this.su_ks = 75000;						// suspension stiffness 
	this.su_kd = 8000;						// suspension damping
	this.Fp	= vec3.create();				// suspension force
	this.Fg = vec3.create();			// grip force
	this.Fa = vec3.create();			// side grip force
	this.cp_cc = vec3.create();			// Contact patch position car coords
	this.cp_wc = vec3.create();			// Contact patch position world coords
	
	this.tv1 = vec3.create();
	this.tv2 = vec3.create();
	this.tv3 = vec3.create();
	this.tv4 = vec3.create();
	this.tv5 = vec3.create();
	this.tv6 = vec3.create();
	
	this.prot = 0;						// angular rotation position
	this.vrot = 0.01;					// angular speed
	
};


KFC.Wheel.prototype.addForce = function (Tengine, dt) {
	
	
	var tv = this.car.tva,		// temporary vector
		tv2 = this.car.tva2,
		Fs, Fl,
		cp_vel = this.tv1,
		cp_cc = this.cp_cc,
		cp_wc = this.cp_wc,
		pp, pn, cd, terr, 
		cn = this.tv2,
		w = this.tv3,
		Fw = this.tv4,
		Fa = this.Fa,
		wb_wc = this.tv5,		// wheel axis point in world coordinates
		dsu_dir_wc = this.tv6,	// donwards suspension direction in world coordinates	
		b = 0,
		a = 0,
		e = 0.00001;
		
	vec3.set([0, 0, 0], this.Fp);
	vec3.set([0, 0, 0], Fw);
	
		
	Fs = this.su_ks * (this.su_pos - this.su_rest) + this.su_kd * this.su_vel;		// suspension spring force
			// TODO: add hard rebound
	if ( Math.abs(Fs) > 40000 ) {	// max suspension force
		Fs = 40000 * KFC.sign(Fs);
	}
	//var sdis = Math.abs(this.su_pos - this.su_rest);
	//if ( sdis > 0.2 ) {  }
	

	mat4.multiplyVec3(this.car.cg_mat, this.apos, wb_wc);
	quat4.multiplyVec3(this.car.rot, this.su_dir, dsu_dir_wc);
	vec3.scale(dsu_dir_wc, -1);
	
	var m = this.car.coll;
	var cr = false;
	
	//if ( typeof(m) == 'object' ) {
		cr = m.rayTest(wb_wc, dsu_dir_wc, 2.0);
	//}
	
	if ( cr !== false ) {

		pp = m.cp;
		pn = m.nv;		
		cd = m.dis - this.radius;	// colision distance
		terr = m.terr;
		
		if ( cd < e ) {				// is penetration
			
			quat4.multiplyVec3(this.car.rrot, pn, cn);			// rotate colission normal to car coordinates
			vec3.add(wb_wc, vec3.scale(pn, -this.radius, tv), cp_wc);	// calculate colision point (world coordinates)
			
			mat4.multiplyVec3(this.car.icg_mat, cp_wc, cp_cc);	// colision point in car coordinates
			
			quat4.multiplyVec3(this.car.rrot, this.car.vel_wc, cp_vel);		// CP velocity from car cg velocity	
			vec3.add(cp_vel, vec3.cross(this.car.ave, cp_cc, tv));		// CP velocity from car angular velocity		
			vec3.subtract(cp_vel, vec3.scale(cn, vec3.dot(cn, cp_vel), tv));	// subtract non normal component
			
			
			var Fpm = Math.min((-cd) * 400 * 5000, 16 * 5000);	// penetration force magnitude
			vec3.scale(cn, Fpm, this.Fp);	// Penetration force
			
			KFC.quat4(this.yaw, cn, false, this.car.tq);
			quat4.multiplyVec3(this.car.tq, [0,0,-1], w);		// direction of wheel
			var s = (this.vrot * this.radius - vec3.dot(cp_vel, w));		// slip coeficient
			var l = vec3.length(cp_vel) || 0.0001;
			if ( l < 1 ) {	// limit  slip in wery low speeds
				l = Math.pow(l, 0.001);	
			}
			s /= l;
			s = KFC.clamp( s, -1*this.maxSlong, this.maxSlong );
			vec3.scale(w, s * ((terr)?4:8) * Fpm, this.Fg);
			
			
			vec3.cross(w, cn, Fa);	// Slip Angle, perpendicular to collision normal and wheel direction
			
			var vz = vec3.dot(cp_vel, w);	// wheel hub forward/backward speed
			var vx = vec3.dot(cp_vel, Fa);	// wheel hub sideways speed
			
			var lz = vz - (this.vrot * this.radius);	// longitudal slip
			if ( Math.abs(lz) < 1 ) {	// limits jumps
				lz = Math.pow(Math.abs(lz), 0.001) * ((lz > 0)?-1:1);
			}
			
			a = Math.atan(vx/(lz)) * ((lz > 0)?-1:1);
			
			a *= 180 / Math.PI;
			
			a = KFC.clamp(a, -3.273, 3.273);
			//a = (a >= 0) ? Math.min(a, 3.273) : Math.max(a, -3.273);
			
			vec3.scale(Fa, a * ((terr)?0.4891:0.8891) * Fpm);
			//vec3.scale(Fa, a * 0.4891 * Fpm);
			
			
			vec3.add(Fw, this.Fg);
			vec3.add(Fw, Fa);
			vec3.add(Fw, this.Fp);
			
			
			vec3.subtract(Fw, vec3.scale(cn, vec3.dot(cn, Fw), tv), tv2);	// wheel force minus  suspension projection
			this.car.applyForce(cp_cc,											// apply to car ant contact point
								tv2);
		}
		
	}
	
	
	vec3.scale(this.su_dir, Fs, tv);	// suspension force
	this.car.applyForce(this.pos, tv);	// aply suspensio force at suspension point
	
	var Ttrac = vec3.dot(Fw, w);
	 if ( Math.abs(Ttrac) < 50.00 ) { Ttrac = 0; }
	
	//if ( this === this.car.wheels[0] ) {
	//			BGAME.debug.innerHTML =  KFC.vec3.str(cp_vel) + '<br/>'
	//								+ KFC.vec3.str(w) + '<br/>'
	//								+ KFC.vec3.str(Fa) + '<br/>'
	//								+ this.vrot * this.radius + '<br/>'
	//								+ vx + ' vx<br/>'
	//								+ lz + ' lz<br/>'
	//								+ sdis + '<br/>'
	////			//					+ this.su_vel + '<br/>'
	//								;
	//}
	
	var brakes = (this.car.gear === 10) ? this.car.throttle : this.car.brakes;
	
	var Tbrake = Math.min(this.vrot * brakes * 500 - Ttrac * brakes, 5000);
	var Tfric = this.vrot * 2;			// friction, rolling resistance
	
	
	this.su_pos += this.su_vel * dt;				// suspension position
	this.su_vel += ( vec3.dot(this.su_dir, this.Fp) - Fs) * this.imass * dt;	// suspension speed
	
	this.prot += this.vrot * dt;
	this.vrot += (Tengine - Tfric - Tbrake - Ttrac) * this.imoi * dt;
	if ( Math.abs(this.vrot) < 0.1 && brakes > 0.5 ) { this.vrot = 0; }
	
	
	vec3.add(this.pos, vec3.scale(this.su_dir, this.su_pos, tv), this.apos);	// set wheel position in car coordinates
	
	var d_pos = this.su_pos;
	if ( d_pos - this.su_rest > 0.15 ) {
		d_pos = this.su_rest + 0.15;
	}
	vec3.add(this.pos, vec3.scale(this.su_dir, d_pos, tv), this.dpos);	// set wheel position in car coordinates for drawing
	
};


/**
 * CarModel
 * @constructor
 * @param {KFC.Car} car Car from whitch to take data
 * @param {KFC.CGLC} glc WebGL rendering wrapper
 * @param {boolean=} opt_lines If true, lines representing forces will be drawn
 */
KFC.CarModel = function (car, glc, opt_lines) {
	
	var i;
	
	this.car = car;	// pointer to car physics object
	
	this.glc = glc;	// pointer to car physics object
	this.gl = glc.gl;
	this.dlines = (opt_lines === true) ? true : false;
	
	this.f = vec3.create();
	
	var shader;
	var mesh;
	var tex;
	var tex2 = 'admin_add.png';
	var pos;
	var texurl;
	var color;
		
	shader = glc.getShader('car');
	
	this.scene = null;
	
	switch ( this.car.type ) {
		case 1 :
			mesh = 'b3.obj';
			tex  = 'b3.png';
			tex2 = 'b3_add.png';
			color = [0.7, 0.0, 0.0];
			pos = vec3.create([0, 0.36, 1.54]);
			break;
		case 2 :
			mesh = 'alpha.obj';
			tex  = 'alpha.png';
			tex2 = 'alpha_add.png';
			color = [0.0, 0.0, 0.1];
			pos = vec3.create([0, 0.09, 1.49]);
			break;
		case 3:
			mesh = 'ulf.obj';
			tex  = 'ulf.png';
			tex2 = 'ulf_add.png';
			color = [0.0, 0.0, 0.1];
			pos = vec3.create([0, 0.02, 1.38]);
			break;
		case 4:			
			mesh = 'head.obj';
			tex  = 'head.png';
			tex2 = 'head_add.png';
			color = [0.05, 0, 0];
			pos = vec3.create([0, 0.07, 1.43]);
			break;
		case 5:
			mesh = 'f35.obj';
			tex  = 'f35.png';
			tex2 = 'f35_add.png';
			color = [0.129, 0, 0.26];
			pos = vec3.create([0, 0.07, 1.39]);
			break;
		case 6:			
			mesh = 'arosa.obj';
			tex  = 'arosa.png';
			tex2 = 'arosa_add.png';
			color = [0.9, 0.9, 0.9];
			pos = vec3.create([0, 0.12, 1.325]);
			break;
		case 9:			
			mesh = 'r500.obj';
			tex  = 'r500.png';
			tex2 = 'r500_add.png';
			color = [0.43, 0.19, 0.04];
			pos = vec3.create([0, 0.12, 0.91]);
			break;
		case 11:			
			mesh = 'admin.obj';
			tex  = 'admin.jpg';
			tex2 = 'admin_add.jpg';
			color = [0.4, 0.9, 0.0];
			pos = vec3.create([0, 0.16, 1.28]);
			break;
			
		default:
			mesh = 'ulf.obj';
			tex  = 'ulf.png';
			tex2 = 'ulf_add.png';
			color = [0.43, 0.19, 0.04];
			pos = vec3.create([0, 0.27, 0.11]);
			console.log('wrong car type: ' + car.type);
	}
	
	this.body = new KFC.Obj3D(glc.getMesh(mesh), shader, glc.getTexture(tex, false));
	this.body.tex1 = glc.getTexture(tex2, false);
	this.body.tex2 = glc.getTexture('dangus.jpg');
	this.body.uniforms[KFC.UniId.uColor] = color;
	this.body.pos = pos;
	
	
	tex = glc.getTexture('ratai.png', true, true);
	mesh = glc.getMesh('ratai.obj');
	
	this.wheels = [];
	for ( i = 0; i < 4; i++ ) {
		this.wheels[i] = new KFC.Obj3D(mesh, shader, tex);	
		this.wheels[i].tex1 = glc.getTexture('ratai_add.png', false);
		this.wheels[i].tex2 = glc.getTexture('dangus.jpg');
		this.wheels[i].uniforms[KFC.UniId.uColor] = [0.5, 0.5, 0.5];
	}
	
	
	/**
	 * @type {Array.<!KFC.Obj3D>}
	 */
	this.lines = [];
	
	if ( this.dlines ) {
		this.addLines();
	}
};


KFC.CarModel.prototype.addLines = function() {
	
	var glc = this.glc;
	var shader = glc.getShader('color');
	var i;
		
	this.lines[0] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[0].uniforms[KFC.UniId.uColor] = [0, 1, 0];
	this.lines[1] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[1].uniforms[KFC.UniId.uColor] = [1, 1, 0];
	this.lines[2] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[2].uniforms[KFC.UniId.uColor] = [0, 1, 0];
	this.lines[3] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[3].uniforms[KFC.UniId.uColor] = [0, 1, 1];
	
	this.lines[4] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[4].uniforms[KFC.UniId.uColor] = [1, 1, 0];
	this.lines[5] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[5].uniforms[KFC.UniId.uColor] = [1, 0, 0];
	this.lines[6] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[6].uniforms[KFC.UniId.uColor] = [0, 1, 1];
	this.lines[7] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[7].uniforms[KFC.UniId.uColor] = [0, 1, 0];
	
	this.lines[8] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[8].uniforms[KFC.UniId.uColor] = [1, 0, 0];
	this.lines[9] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[9].uniforms[KFC.UniId.uColor] = [1, 0, 1];
	this.lines[10] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[10].uniforms[KFC.UniId.uColor] = [0, 0, 1];
	this.lines[11] = new KFC.Obj3D(new KFC.LineMesh(this.gl), shader);
	this.lines[11].uniforms[KFC.UniId.uColor] = [1, 0, 0];
	
	if ( this.scene ) {
		for ( i = this.lines.length-1; i >= 0; i-- ) {
			this.scene.add( this.lines[i], true );
		}
	}
};


KFC.CarModel.prototype.toggleLines = function(on) {
	
	var i;
	
	if ( on === true ) {
		if ( this.lines.length === 0 ) {
			this.addLines();
		}		
		for ( i = this.lines.length-1; i >= 0; i-- ) {
			this.lines[i].draw = true;
		}		
		this.dlines = true;
		
	} else if ( on === false ) {		
		for ( i = this.lines.length-1; i >= 0; i-- ) {
			this.lines[i].draw = false;
		}		
		this.dlines = false;
	}
	
};


KFC.CarModel.prototype.updateMatrices = function () {
	var cg_mat = this.car.cg_mat;	// main car location	
	var mat = this.body.mvMatrix;	// car body matrix
	var f = this.f;
	var i;
	
	mat4.set(cg_mat, mat);
	mat4.translate(mat, this.body.pos);
	
	mat4.toInverseMat3(this.body.mvMatrix, this.body.nMatrix);
	mat3.transpose(this.body.nMatrix);
	
	for ( i = 0; i < 4; i++ ) {
		var wm = this.wheels[i],
			wmat = wm.mvMatrix,
			w = this.car.wheels[i],
			p = w.cp_wc;
		
		mat4.set(cg_mat, wmat);
		mat4.translate(wmat, w.dpos);
		mat4.rotate(wmat, w.yaw, [0, 1, 0]);
		mat4.rotate(wmat, w.prot, [-1, 0, 0]);
		mat4.rotate(wmat, Math.PI*0.5*w.rotate, [0, 0, 1]);
		
		mat4.toInverseMat3(wm.mvMatrix, wm.nMatrix);
		mat3.transpose(wm.nMatrix);
		
		if ( this.dlines ) {			
			quat4.multiplyVec3(this.car.rot, w.Fp, f);
			vec3.scale(f, 1/3000);
			vec3.set(p, this.lines[i].mesh.orgin);
			vec3.set(f, this.lines[i].mesh.point);
			this.lines[i].mesh.apply();
			
			quat4.multiplyVec3(this.car.rot, w.Fg, f);
			vec3.scale(f, 1/3000);
			vec3.set(p, this.lines[i+4].mesh.orgin);
			vec3.set(f, this.lines[i+4].mesh.point);
			this.lines[i+4].mesh.apply();
			
			quat4.multiplyVec3(this.car.rot, w.Fa, f);
			vec3.scale(f, 1/3000);
			vec3.set(p, this.lines[i+8].mesh.orgin);
			vec3.set(f, this.lines[i+8].mesh.point);
			this.lines[i+8].mesh.apply();
		}
		
	}
	
	
};

/**
 * Adds car model objects to the scene object
 * @param {!KFC.Scene} scene Scene object to add objects to
 * @param {boolean=} opt_end if true objects should be rendered last
 */
KFC.CarModel.prototype.addToScene = function (scene, opt_end) {
	
	this.scene = scene;
	
	scene.add(this.body);
	scene.add(this.wheels[0]);
	scene.add(this.wheels[1]);
	scene.add(this.wheels[2]);
	scene.add(this.wheels[3]);
	var i, line;
	
	for ( i = 0; (line = this.lines[i]); i++ ) {
		scene.add(line, true);
	}
};

KFC.CarModel.prototype.removeFromScene = function(scene) {
	
	this.scene = null;
	
	scene.objects.splice( scene.objects.indexOf(this.body), 1 );
	scene.objects.splice( scene.objects.indexOf(this.wheels[0]), 1 );
	scene.objects.splice( scene.objects.indexOf(this.wheels[1]), 1 );
	scene.objects.splice( scene.objects.indexOf(this.wheels[2]), 1 );
	scene.objects.splice( scene.objects.indexOf(this.wheels[3]), 1 );
	var i;
	
	if ( this.dlines ) {
		for ( i = this.lines.length-1; i >= 0; i-- ) {
			scene.endObjects.splice( scene.endObjects.indexOf(this.lines[i]), 1 );
		}
	}
	
};


/**
 * @constructor
 * @param {!KFC.Car} car Car Object
 * @param {!KFC.Audio} audio Audio context wrapper
 * @param {!AudioNode=} opt_destination Optional audio destination node. If not set output goes to audio context destination
 */
KFC.CarAudio = function (car, audio, opt_destination) {
	
	this.car = car;
	this.audio = audio;

	if ( !this.audio.context ) { return; }
	
	this.destination = opt_destination || audio.getDestination();
	
	this.panner = audio.context.createPanner();
	this.panner.connect(this.destination);
	
	//this.audio.play('offlow.ogg', this.panner);
	
	this.sources = [];
	this.sources[0] = audio.getSource('offlow.ogg',  0.0, true, this.panner);
	this.sources[1] = audio.getSource('offmid.ogg',  0.0, true, this.panner);
	this.sources[2] = audio.getSource('offhigh.ogg', 0.0, true, this.panner);
	this.sources[3] = audio.getSource('onlow.ogg',   0.0, true, this.panner);
	this.sources[4] = audio.getSource('onmid.ogg',   0.0, true, this.panner);
	this.sources[5] = audio.getSource('onhigh.ogg',  0.0, true, this.panner);
	
	this.sources[0].playbackState = 2;
	this.sources[1].playbackState = 2;
	this.sources[2].playbackState = 2;
	this.sources[3].playbackState = 2;
	this.sources[4].playbackState = 2;
	this.sources[5].playbackState = 2;
	
	// this.sources[0].noteOn(0);
	// this.sources[1].noteOn(0);
	// this.sources[2].noteOn(0);
	// this.sources[3].noteOn(0);
	// this.sources[4].noteOn(0);
	// this.sources[5].noteOn(0);
};

KFC.CarAudio.prototype.remove = function () {
	
	if ( !this.audio.context ) { return; }
	
	// this.sources[0].noteOff(0);
	// this.sources[1].noteOff(0);
	// this.sources[2].noteOff(0);
	// this.sources[3].noteOff(0);
	// this.sources[4].noteOff(0);
	// this.sources[5].noteOff(0);
	
	this.sources = [];
	
	
};


KFC.CarAudio.prototype.update = function( camera ) {
	
	if ( !this.audio.context ) { return; }
	
	var rpm = this.car.engine.vel * 10,
		load = this.car.throttle,
		gain = 1.0,
		aso = this.sources,
		r = [1575*2, 1995*2, 3225*2],
		s;
		
		
	if ( aso[0] ) {
		aso[0].playbackRate.value = rpm / r[0];
		if ( rpm < r[0] ) {
			aso[0].gain.value = (1-load)*gain;
		} else {
			aso[0].gain.value = (1-load)*gain * Math.max((r[1]-rpm)/(r[1]-r[0]), 0);
		}
	}
	if ( aso[1] ) {
		aso[1].playbackRate.value = rpm / r[1];
		if ( rpm < r[1] ) {
			aso[1].gain.value = (1-load)*gain * Math.max( (rpm-r[0]) / (r[1]-r[0]), 0);
		} else {
			aso[1].gain.value = (1-load)*gain * Math.max((r[2]-rpm)/(r[2]-r[1]), 0);
		}
		
	}
	if ( aso[2] ) {
		aso[2].playbackRate.value = rpm / r[2];
		if ( rpm < r[2] ) {
			aso[2].gain.value = (1-load)*gain * Math.max((rpm-r[1])/(r[2]-r[1]), 0);
		} else {
			aso[2].gain.value = (1-load)*gain;
		}
	
	}
	
	if ( aso[3] ) {
		aso[3].playbackRate.value = rpm / r[0];
		if ( rpm < r[0] ) {
			aso[3].gain.value = (load)*gain;
		} else {
			aso[3].gain.value = (load)*gain * Math.max((r[1]-rpm)/(r[1]-r[0]), 0);
		}
	}
	if ( aso[4] ) {
		aso[4].playbackRate.value = rpm / r[1];
		if ( rpm < r[1] ) {
			aso[4].gain.value = (load)*gain * Math.max( (rpm-r[0]) / (r[1]-r[0]), 0);
		} else {
			aso[4].gain.value = (load)*gain * Math.max((r[2]-rpm)/(r[2]-r[1]), 0);
		}
		
	}
	if ( aso[5] ) {
		aso[5].playbackRate.value = rpm / r[2];
		if ( rpm < r[2] ) {
			aso[5].gain.value = (load)*gain * Math.max((rpm-r[1])/(r[2]-r[1]), 0);
		} else {
			aso[5].gain.value = (load)*gain;
		}
	
	}
		
	//BGAME.debug.innerHTML = '';		
		
	for ( s = 0; s < aso.length; s++ ) {
		if ( (aso[s].gain.value <= 0) && (aso[s].playbackState === 2) ) {	// if not needed, shut off and ready it
			aso[s].noteOff(0);
			
			var sbuffer = aso[s].buffer;
			var sgain = aso[s].gain.value;
			
			aso[s] = this.audio.context.createBufferSource();
			aso[s].buffer = sbuffer;
			aso[s].loop = true;
			
			aso[s].connect(this.panner);
			aso[s].gain.value = sgain;
			
			aso[s].playbackState = 0;			
		}
		
		if ( (aso[s].gain.value > 0) && (aso[s].playbackState === 0) ) {
			aso[s].noteOn(0);
			aso[s].playbackState = 2;
		}
		//
		//BGAME.debug.innerHTML += s + ' ' + aso[s].playbackState
		//					+ ' ' + aso[s].gain.value.toFixed(3)
		//					+ ' ' + aso[s].playbackRate.value.toFixed(3) + '<br/>';
	}
	
	var sub = vec3.create(),
		dir = vec3.create();
	vec3.subtract(this.car.pos_wc, camera.position, dir);
	
	var sin = Math.sin(camera.rotation[1]);
	var cos = Math.cos(camera.rotation[1]);
	
	sub[0] = dir[0] * cos - dir[2] * sin;
	sub[1] = dir[1];
	sub[2] = dir[0] * sin + dir[2] * cos;
	
	this.panner.setPosition(sub[0] * 0.2,
							sub[1] * 0.2,
							sub[2] * 0.2);
	
};


