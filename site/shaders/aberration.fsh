
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTex0;
uniform float uStrength;

varying vec2 vVerPosition;

void main()
{
	vec2 r = (vVerPosition * (1.0 + uStrength * 2.0) + 1.0) * 0.5;
	vec2 g = (vVerPosition * (1.0 + uStrength) + 1.0) * 0.5;
	vec2 b = (vVerPosition + 1.0) * 0.5;
	
    gl_FragColor = vec4(texture2D(uTex0, r).r,
						texture2D(uTex0, g).g,
						texture2D(uTex0, b).b,
						1.0);
}