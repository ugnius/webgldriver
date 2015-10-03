
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTex0;
uniform float uStrength;

varying vec2 vVerPosition;

void main()
{
    gl_FragColor = vec4(texture2D(uTex0,(vVerPosition + 1.0) * 0.5).rgb, uStrength / (0.5+dot(vVerPosition, vVerPosition)));
}