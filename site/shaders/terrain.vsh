
attribute vec3 aVerPosition;
attribute vec3 aVerNormal;
attribute vec2 aTexCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uAmbientColor;
uniform vec3 uDirColor;
uniform vec3 uLightDirection;

varying vec3 vLightWeight;
varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec4 vVerPosition;
varying float vScreenZ;

void main()
{
    vTexCoord = aTexCoord;
    vVerPosition = uMVMatrix * vec4(aVerPosition, 1.0);
    gl_Position = uPMatrix * vVerPosition;
    vScreenZ = gl_Position.z;

    vec3 transformedNormal = uNMatrix * aVerNormal;
    float dirLightWeight = max(dot(transformedNormal, -uLightDirection), 0.0);
    vLightWeight = uDirColor * dirLightWeight + uAmbientColor;
    vNormal = transformedNormal;
}