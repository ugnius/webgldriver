
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTex0;

varying vec2 vVerPosition;

void main()
{
    gl_FragColor = texture2D(uTex0, (vVerPosition+1.0)*0.5);
}