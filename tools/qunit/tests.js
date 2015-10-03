$(document).ready(function(){
    
	module('CGLC');
	
	test('constructor', function() {
		
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 600;
		var attribs = {'antialias': false};
		
		var result;
		
		strictEqual( (new KFC.CGLC()).gl, null, "No canvas pased" ); 
		strictEqual( (new KFC.CGLC(true)).gl, null, "Not canvas pased" ); 
		
		
		result = new KFC.CGLC(canvas, attribs);
		
		notStrictEqual( result.gl, null, "Web GL contructor return" );
		strictEqual( result.width, 400, "width" ); 
		strictEqual( result.height, 600, "height" ); 
		strictEqual( result.ready, true, "ready" ); 
		
		//equal(  )
		
		
	});
	
	module('Car');	
	test('constuctor', function() {
		
		var car = new KFC.Car(1);
		
		equal( car.type, 1, 'Car.type' );
		equal( car.mass, 1200, 'Car.mass' );
		equal( car.throttle, 0, 'Car.throttle' );
		equal( car.brakes, 0, 'Car.brakes' );
		equal( car.steerAngle, 0, 'Car.steerAngle' );
		
		
	});	
	test('toString', function() {
	
		var car = new KFC.Car(1);
		
		equal( car.toString(), '010000000080d3465e0dae3ef495c3c000000000000000000000000000000002f2dd0f3000000004fdf45f300000000000000000000000000000000000000000000000000002d24dcccccdb0000000000000000dccccc04dcccccdb0000000000000000dccccc04dcccccdb0000000000000000dccccc04dcccccdb0000000000000000dccccc040', 'Car.ToString()' );
		
	});
	
	
	module('Engine');	
	test('Engine', function() {	
		var car = new KFC.Car(1);		
		equal( car.engine.car, car, 'Car.engine.car' );
		equal( car.engine.frictionKv, 0.1, 'Car.engine.frictionKv' );
		equal( car.engine.Widle, 105, 'Car.engine.Widle' );
		equal( car.engine.Wmax, 830, 'Car.engine.Wmax' );
		equal( car.engine.moi, 0.2, 'Car.engine.moi' );
		equal( car.engine.vel, 105, 'Car.engine.vel' );
	});
	test('torq', function() {	
		var car = new KFC.Car(1);
		equal( car.engine.torq(), 800, 'Car.engine.torq() @ idle' );
		
		car.engine.vel = 900;
		equal( car.engine.torq(), 0, 'Car.engine.torq() @ max' );
	});
	
	module('Wheel');
	test('torq', function() {	
		var car = new KFC.Car(1);
		
		equal( typeof car.wheels[0], 'object', 'Car.wheel 0' );
		equal( typeof car.wheels[1], 'object', 'Car.wheel 1' );
		equal( typeof car.wheels[2], 'object', 'Car.wheel 2' );
		equal( typeof car.wheels[3], 'object', 'Car.wheel 3' );
		
		equal( car.wheels[0].rotate, 1, 'Car.wheel 0 rotate' );
		equal( car.wheels[1].rotate, -1, 'Car.wheel 1 rotate' );
		equal( car.wheels[2].rotate, 1, 'Car.wheel 2 rotate' );
		equal( car.wheels[3].rotate, -1, 'Car.wheel 3 rotate' );
		
	});
	
	module('KFC util');
	test('dot2d', function() {
		
		equal( KFC.dot2d(0, 0, 0, 0), 0, '0' );
		equal( KFC.dot2d(1, 0, 0, 2), 0, '0' );
		equal( KFC.dot2d(0, 1, 2, 0), 0, '0' );
		equal( KFC.dot2d(1, 3, 2, 4), 14, '14' );
		equal( KFC.dot2d(-1, 3, 2, -4), -14, '14' );
		equal( KFC.dot2d(0.5, 0.5, 0.5, 0.5), 0.5, 'float' );
		
	});
	
	test('sign', function() {
		
		equal( KFC.sign(0), 1, 'positive zero' );
		equal( KFC.sign(-0.0000001), -1, 'negative' );
		equal( KFC.sign(+0.0000001), 1, 'negative' );
		equal( KFC.sign(80.0000001), 1, 'negative' );
		equal( KFC.sign(-80.0000001), -1, 'negative' );
		
		equal( KFC.sign('20'), 1, 'string' );
		equal( KFC.sign('-20'), -1, 'string' );
		
		equal( KFC.sign(undefined), 1, 'undefined' );
		
	});
	
	test('clamp', function() {
		
		equal( KFC.clamp(0, 0, 0), 0, 'zero' );
		equal( KFC.clamp(1, 0, 0), 0, 'zero' );
		equal( KFC.clamp(-1, 0, 0), 0, 'zero' );
		equal( KFC.clamp(0, -1, 1), 0, 'zero' );
		equal( KFC.clamp(0, 1, -1), -1, 'bar range max wins' );
		
		equal( KFC.clamp(-2, -1, 1), -1, 'clamp max' );
		equal( KFC.clamp(9, -1, 1), 1, 'clamp min' );
		
	});
	
	
	test('quat4', function() {
		
		var q = quat4.create();
		
		KFC.quat4(0, [0, 2, 0], true, q);
		equal( q[0], 0, 'x' );
		equal( q[1], 0, 'y' );
		equal( q[2], 0, 'z' );
		equal( q[3], 1, 'w' );
	});
	
	
	test('isNode', function() {
		
		equal( KFC.isNode(), false, 'not testing in node ofcourse' );
	});
	
	
	
	//test("a basic test example", function() {
	//	ok( true, "this test is fine" );
	//	var value = "hello";
	//	equal( value, "hello", "We expect value to be hello" );
	//});
	//
	//module("Module A");
	//
	//test("first test within module", function() {
	//  ok( true, "all pass" );
	//});
	//
	//test("second test within module", function() {
	//  ok( true, "all pass" );
	//});
	//
	//module("Module B");
	//
	//test("some other test", function() {
	//  expect(2);
	//  equal( true, false, "failing test" );
	//  equal( true, true, "passing test" );
	//});

});