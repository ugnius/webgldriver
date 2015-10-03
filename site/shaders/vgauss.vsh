
attribute vec3 aVerPosition;

varying vec2 vTexPosition;

void main() 
{
    gl_Position = vec4(aVerPosition, 1);
	vTexPosition = (aVerPosition.xy+1.0)*0.5;
}