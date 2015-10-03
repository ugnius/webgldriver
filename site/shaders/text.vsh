
attribute vec3 aVerPosition;
attribute vec3 aVerNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform int uOffset;

uniform vec3 uAmbientColor;
uniform vec3 uDirColor;
uniform vec3 uLightDirection;

varying vec3 vLightWeight;

void main()
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVerPosition - vec3(0, 0, float(uOffset) * 0.2), 1.0);

    vec3 transformedNormal = uNMatrix * aVerNormal;
    float dirLightWeight = max(dot(transformedNormal, uLightDirection), 0.0);
    vLightWeight = uAmbientColor + uDirColor * dirLightWeight;
}