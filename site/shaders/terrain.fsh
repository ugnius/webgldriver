#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeight;
uniform float uFog;
uniform float uScale;

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
    
    //vec4 tColor = (texture2D(uTex0, vec2(vTexCoord) * scale) + texture2D(uTex0, vec2(vTexCoord) * scale * 3.14))/2.0;
    vec4 tColor = texture2D(uTex0, vec2(vTexCoord) * uScale);    
    
    // float diff = max(dot(vNormal, normalize(-uLightDirection)),0.0) * 0.5;
    float diff = max(dot(vNormal, normalize(-uLightDirection)),0.0) * 0.5;

    
    
    float fog = (uFog - vScreenZ)/(uFog - 1.0);
    fog = clamp(fog, 0.0, 1.0);
    
    vec3 V = normalize(uCamPosition - vVerPosition.xyz);
    vec3 H = normalize(V - normalize(uLightDirection));
    float pspec = pow(max(dot(vNormal, H),0.0), 32.0) * 1.0;

    vec3 color = tColor.rgb * (diff * uDirColor + uAmbientColor);
    vec3 fogColor = uAmbientColor + uDirColor;

    gl_FragColor = vec4(mix(fogColor, color, fog), 1.0);
}
