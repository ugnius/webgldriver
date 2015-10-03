
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTex0;
uniform sampler2D uTex1;

uniform float strength;

varying vec2 vVerPosition;

void main()
{
    float size = 32.0;
    float isize = 1.0 / size;
    float hp = 0.5 * isize;
    
    vec3 tex = texture2D(uTex0, (vVerPosition)).rgb;

    tex = tex * (size-1.0);
    tex.rg = (tex.rg + 0.5 ) * isize;

    
    vec3 map1 = texture2D(uTex1, vec2((tex.r + floor(tex.b)) * isize, 1.0-tex.g )).rgb;
    
    vec3 map2 = texture2D(uTex1, vec2((tex.r + ceil(tex.b)) * isize, 1.0-tex.g )).rgb;

    
    gl_FragColor = vec4(mix(map2, map1, (ceil(tex.b) - tex.b)), 1.0);
}