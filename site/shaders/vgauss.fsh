
#ifdef GL_ES
precision highp float;
#endif

uniform float uBlur;
uniform float uFocus;

uniform sampler2D uTex0;
uniform sampler2D uTex1;

varying vec2 vTexPosition;

void main()
{

	float blurSize = uBlur * abs(uFocus - texture2D(uTex1, vTexPosition).x);

	vec4 sum = vec4(0.0);
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y - blurSize * 4.0)) * 0.05;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y - blurSize * 3.0)) * 0.09;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y - blurSize * 2.0)) * 0.12;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y - blurSize)) * 0.15;
	sum += texture2D(uTex0, vTexPosition) * 0.16;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y + blurSize)) * 0.15;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y + blurSize * 2.0)) * 0.12;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y + blurSize * 3.0)) * 0.09;
	sum += texture2D(uTex0, vec2(vTexPosition.x, vTexPosition.y + blurSize * 4.0)) * 0.05;	
	
    gl_FragColor = sum;
}