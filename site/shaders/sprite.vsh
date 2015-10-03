
attribute vec3 aVerPosition;
attribute vec2 aTexCoord;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

varying vec2 vTexCoord;

void main()
{
    vTexCoord = aTexCoord;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVerPosition, 1.0);
}