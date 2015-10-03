#ifdef GL_ES
precision highp float;
#endif

varying vec3 vLightWeight;
uniform vec3 uColor;

void main()
{
    gl_FragColor = vec4(uColor * vLightWeight, 1.0);
}
