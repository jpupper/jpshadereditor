#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

// función rotar, a = angulo en radianes, 
// devuelve matriz de rotación para multiplicar por las coordenadas
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

// fractal - recibe las coordenadas e itera la fórmula en el for
vec3 fractal(vec2 p) {
    p *= 2.0; // zoom out
    for (int i = 0; i < 12; i++) {
        p *= rot(time * 0.1); // rotación variable
        p = abs(p); // espejo en x e y
        p *= 1.5; // escala
        p -= 1.0; // translación
    }
    // usamos las coordenadas resultantes para colorear
    return vec3(p.x, p.y, length(p)*0.5)*1.5;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}