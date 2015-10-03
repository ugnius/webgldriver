#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeight;
uniform vec3 uColor;
uniform float uFog;

uniform vec3 uCamPosition;
uniform vec3 uLightDirection;
uniform vec3 uAmbientColor;
uniform vec3 uDirColor;

varying vec3 vNormal;
varying vec4 vVerPosition;
varying float vScreenZ;

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
    
    vec3 fogColor = uAmbientColor + uDirColor;
    vec3 skyColor = texture2D(uTex2, R.xz + vec2(0.5, 0.5)).rgb * fogColor;

    vec3 cReflect;

    
    if ( R.y > 0.0 ) {
        cReflect = fogColor;
    } else if ( R.y > -0.1 ) {
        cReflect = mix( fogColor, skyColor, R.y*-10.0 );
    } else {
        cReflect = skyColor;
    }
    
    float fog = clamp((uFog - vScreenZ)/(uFog - 1.0), 0.0, 1.0);
    
    vec3 H = normalize(I - normalize(uLightDirection));
    float pspec = pow(max(dot(vNormal, H),0.0), 32.0);

    vec3 objColor = (tColor.rgb + uColor * color) * (ao * ((diff + pspec) * uDirColor + uAmbientColor) ) + cReflect * shiny;
    
    // gl_FragColor = vec4( mix( objColor, vec3(1.0, 1.0, 1.0), 1.0-fog ), 1.0);


    // vec3 color = tColor.rgb * (diff * uDirColor + uAmbientColor);

    gl_FragColor = vec4(mix(fogColor, objColor, fog), 1.0);
}