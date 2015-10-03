
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTex0;
uniform sampler2D uTex1;

varying vec2 vVerPosition;

void main()
{
    vec4 l = texture2D(uTex0, vVerPosition);
    vec4 r = texture2D(uTex1, vVerPosition);
    gl_FragColor = vec4( l.r * 0.299 + l.g * 0.587 + l.b * 0.114,
                         0,
                         r.r * 0.299 + r.g * 0.587 + r.b * 0.114, 1.0);
}