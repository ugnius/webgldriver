
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;

uniform vec4 uColor;
uniform sampler2D uTex0;

void main()
{
    vec4 c = texture2D(uTex0, vTexCoord);
    gl_FragColor = vec4(c.rgb, c.r) * uColor;
}