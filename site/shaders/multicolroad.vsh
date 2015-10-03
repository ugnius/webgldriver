
attribute vec3 aVerPosition;
attribute vec3 aVerNormal;
attribute vec2 aTexCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uDirColor;
uniform vec3 uLightDirection;
uniform vec3 uCamPosition;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec4 vVerPosition;
varying float vScreenZ;

void main()
{
    vTexCoord = aTexCoord;
    vec3 verPos = aVerPosition;
    verPos.y += clamp((uCamPosition.y-20.0)*0.004 , 0.0, 4.0);
    vVerPosition = uMVMatrix * vec4(verPos, 1.0);
    gl_Position = uPMatrix * vVerPosition;
    vScreenZ = gl_Position.z;

    vNormal = uNMatrix * aVerNormal;
}