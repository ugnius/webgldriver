#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeight;
uniform vec3 uColor;

uniform vec3 uCamPosition;
uniform vec3 uLightDirection;
uniform vec3 uAmbientColor;

varying vec3 vNormal;
varying vec4 vVerPosition;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;

void main()
{
    vec4 tColor = texture2D(uTex0, vTexCoord);
    float diff = max(dot(vNormal, normalize(-uLightDirection)),0.0) * 0.5;
    
    vec4 tAdd = texture2D(uTex1, vTexCoord);
    float ao = tAdd.r;
    float shiny = tAdd.g;
    float color = tAdd.b;
    
    vec3 I = normalize(uCamPosition - vVerPosition.xyz);
    vec3 R = reflect(I, vNormal) * 0.5;
    
    vec3 cReflect;
    if ( R.y > 0.0 ) {
        cReflect = vec3(0.2, 0.2, 0.2);
    } else if ( R.y > -0.1 ) {
        cReflect = mix( vec3(0.2, 0.2, 0.2), texture2D(uTex2, R.xz + vec2(0.5, 0.5)).rgb, R.y*-10.0 );
    } else {
        cReflect = texture2D(uTex2, R.xz + vec2(0.5, 0.5)).rgb;
    }
    
    vec3 H = normalize(I - normalize(uLightDirection));
    float pspec = pow(max(dot(vNormal, H),0.0), 32.0) * 4.0;
    //gl_FragColor = vec4(tColor.rgb * (diff + pspec + 0.5) * ao + cReflect, 1.0);
    gl_FragColor = vec4( (tColor.rgb + uColor * color) * (ao * (diff + pspec + 0.5) ) + cReflect * shiny, 1.0 );
}