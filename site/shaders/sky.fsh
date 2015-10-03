#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying float vFragY;

uniform vec3 uAmbientColor;
uniform vec3 uDirColor;
uniform sampler2D uTex0;

void main()
{
    vec4 tColor = texture2D(uTex0, vec2(vTexCoord));
    gl_FragColor = mix( tColor, vec4(1.0, 1.0, 1.0, 1.0), clamp(1.0 - vFragY * 0.004, 0.0, 1.0)) * vec4(uAmbientColor + uDirColor, 1.0);

}
