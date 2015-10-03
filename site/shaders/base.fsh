
/**
 * Basic shader
 * @name base
 * @type vertex
 */

attribute vec3 aVerPos;
uniform vec4 aColor;

uniform  mat4 uPMatrix;
uniform  mat4 uMVMatrix;

varying vec4 vColor;

void main() 
{
    vColor = aColor;
    gl_Position = uPMatrix * uMVMatrix * vec4( aVerPos, 1.0 );
}

/**
 * Basic shader
 * @name base
 * @type fragment
 */

#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;

void main()
{
    gl_FragColor = vColor;
}