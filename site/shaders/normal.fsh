#ifdef GL_ES
precision highp float;
#endif

varying vec3 vLightWeight;
uniform vec4 uColor;

void main()
{
    gl_FragColor = uColor * vec4(vLightWeight, 1.0);
}
