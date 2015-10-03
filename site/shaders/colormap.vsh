
attribute vec3 aVerPosition;

varying vec2 vVerPosition;

void main() 
{
    gl_Position = vec4(aVerPosition, 1);
	vVerPosition = (aVerPosition.xy + 1.0) * 0.5;
}