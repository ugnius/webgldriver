
attribute vec3 aVerPosition;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

uniform int uOffset;

void main()
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVerPosition - vec3(0, 0, float(uOffset) * 0.2), 1.0);
}