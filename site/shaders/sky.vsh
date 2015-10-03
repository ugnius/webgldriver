
attribute vec3 aVerPosition;
attribute vec2 aTexCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform vec3 uCamPosition;
uniform float uTime;

varying vec2 vTexCoord;
varying float vFragY;

void main()
{
    vTexCoord = aTexCoord;
    vec3 pos;
    
    float a = uTime * 0.0005;
    float s = 2.0;
    
    pos.x = uCamPosition.x + aVerPosition.x * s * cos(a) - aVerPosition.z * s * sin(a);
    pos.y = aVerPosition.y * s - 20.0;
    pos.z = uCamPosition.z + aVerPosition.x * s * sin(a) + aVerPosition.z * s * cos(a);
    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
    
    vFragY = aVerPosition.y;
}