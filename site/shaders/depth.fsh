
#ifdef GL_ES
precision highp float;
#endif

void main()
{
	float z = pow(gl_FragCoord.z, 128.0);
	//float a = fract(z * 256.0*256.0*256.0);
	//float b = fract(z * 256.0*256.0) - 1.0/(256.0) * a;
	//float g = fract(z * 256.0) - 1.0/(256.0*256.0) * b;
	//float r = fract(z  ) - 1.0/(256.0*256.0*256.0) * g;
    //gl_FragColor = vec4(r, g, b, a);
    gl_FragColor = vec4(z, z, z, 1.0);
}