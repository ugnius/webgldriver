
#ifdef GL_ES
precision highp float;
#endif

uniform vec3 uColor;
uniform float uStrength;

varying vec2 vVerPosition;

void main()
{
	vec2 p = vVerPosition * uStrength;
	float v = dot(p, p);
    gl_FragColor = vec4(uColor, v);
}