
#ifdef GL_ES
precision highp float;
#endif

//varying vec2 vVerPosition;


uniform float uFade;

void main()
{
	//vec2 p = vVerPosition * 0.6;
	//float v = dot(p, p);
    gl_FragColor = vec4(0.14, 0.14, 0.14, uFade);
}