#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
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
uniform sampler2D uTex3;

void main()
{
    float scale = 1.0 / 1.0;
    
    vec4 mColor = texture2D(uTex0, vec2(vTexCoord));
    
    vec4 tColor = texture2D(uTex1, vec2(vTexCoord)*400.0) * mColor.r +
                (texture2D(uTex2, vec2(vVerPosition.xz)*0.7) + texture2D(uTex2, vec2(vVerPosition.xz)*0.213)) / 2.0 * mColor.g +
                (texture2D(uTex3, vec2(vVerPosition.xz)*0.4) + texture2D(uTex3, vec2(vVerPosition.xz)*0.213)) / 2.0 * mColor.b;
    
    // fog
    //float ffog = (float)uFog
    float fog = (uFog - vScreenZ)/(uFog - 1.0);
    fog = clamp(fog, 0.0, 1.0);
    
    // diffuse light
    float diff = max(dot(vNormal, normalize(-uLightDirection)),0.0) * 0.5;
    
    // specular light
    vec3 V = normalize(uCamPosition - vVerPosition.xyz);
    vec3 H = normalize(V - normalize(uLightDirection));
    float pspec = pow(max(dot(vNormal, H),0.0), 32.0) * 0.4;
    
    vec3 color = tColor.rgb * ((diff + pspec) * uDirColor + uAmbientColor);
    vec3 fogColor = uAmbientColor + uDirColor;

    gl_FragColor = vec4(mix(fogColor, color, fog), 1.0);
}