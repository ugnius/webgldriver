#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
uniform float uFog;
uniform float uTime;

uniform vec3 uCamPosition;
uniform vec3 uLightDirection;
uniform vec3 uAmbientColor;
uniform vec3 uDirColor;

varying vec3 vNormal;
varying vec4 vVerPosition;
varying float vScreenZ;

uniform sampler2D uTex0;

void main()
{
    float scale = 100.0;
    
    vec4 tColor = mix(texture2D(uTex0, vec2(vVerPosition.xz) * 0.04 + vec2(cos(uTime*0.7), sin(uTime)) *0.05 ),
                    texture2D(uTex0, vec2(vVerPosition.xz) * 0.07 + vec2(cos(uTime*0.3), sin(uTime*1.3)) * 0.02 ), (sin(uTime*1.3 + vVerPosition.x * 0.01) * cos( uTime*0.3 + vVerPosition.z * 0.05 ) + 1.0) * 0.5);
    
    float diff = max(dot(vNormal, normalize(-uLightDirection)),0.0) * 0.5;
    
    float fog = (uFog - vScreenZ)/(uFog - 1.0);
    fog = clamp(fog, 0.0, 1.0);
    
    vec3 V = normalize(uCamPosition - vVerPosition.xyz);
    vec3 H = normalize(V - normalize(uLightDirection));
    float pspec = pow(max(dot(vNormal, H),0.0), 32.0) * 1.0;

    vec3 waterColor = tColor.rgb * ((diff + pspec) * uDirColor + uAmbientColor);
    vec3 fogColor = uAmbientColor + uDirColor;

    gl_FragColor = vec4(mix(fogColor, waterColor, fog), 1.0);
}
