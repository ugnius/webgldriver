
attribute vec3 aVerPosition;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

void main()
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVerPosition, 1.0);
}