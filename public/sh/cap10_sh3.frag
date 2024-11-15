#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 3 - FRACTAL ABS+SCALE+ROT 
// TECNICA DE COLOREADO: ROTAR RGB SEGUN SUMA DE LAS DIFERENCIAS

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
    p *= 2.5; // zoom out
    float lprev = length(p); // length inicial
    float res = 0.0; // resultado
    for (float i = 0.0; i < 20.0; i++) {
        p *= rot(0.3); // rotación fija
        p = abs(p); // espejo en x e y
        p *= 1.35 - fract(time * 0.1) * 0.2; // escala variable por fract de tiempo
        p -= vec2(2.0, 1.0); // translación
        float l = length(p); // length actual
        res += abs(l - lprev); // acumula diferencia entre lenght anterior y actual
        lprev = l; // guarda el length actual
    }
    vec3 col = vec3(0.0, 0.0, 1.0); // color base
    col.rb *= rot(res * 0.5); // roto la paleta segun resultado
    return col;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}