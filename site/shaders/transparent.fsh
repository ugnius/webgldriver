#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeight;
uniform float uFog;
uniform float uScale;

uniform vec3 uCamPosition;
uniform vec3 uLightDirection;
uniform vec3 uDirColor;
uniform vec3 uAmbientColor;

varying vec3 vNormal;
varying vec4 vVerPosition;
varying float vScreenZ;

uniform sampler2D uTex0;

void main()
{    
    vec4 tColor = texture2D(uTex0, vec2(vTexCoord) * uScale);
    if ( tColor.a < 0.8 ) {
        discard;
    }
    
    float diff = max(dot(vNormal, normalize(-uLightDirection)),0.0) * 0.5;
    
    float fog = (uFog - vScreenZ)/(uFog - 1.0);
    fog = clamp(fog, 0.0, 1.0);

    vec3 waterColor = tColor.rgb * (diff * uDirColor + uAmbientColor);
    vec3 fogColor = uAmbientColor + uDirColor;

    gl_FragColor = vec4(mix(fogColor, waterColor, fog), tColor.a);
}
