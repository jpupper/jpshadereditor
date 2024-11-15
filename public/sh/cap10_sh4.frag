#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 4 - FRACTAL ABS+SCALE+ROT 
// TECNICA DE COLOREADO: SUMA DE LAS DIFERENCIAS
// COLOREADO FINAL: SENO DEL RESULTADO + CREACION DE PALETA SIMPLE

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
    p *= 4.5; // zoom out
    p.y += 0.75; // offset y
    float lprev = length(p); // length inicial
    float res = 0.0; // resultado
    for (float i = 0.0; i < 41.0; i++) {
        p.x = abs(p.x); // espejo en x
        p *= rot(-0.7); // rotación fija
        p *= 1.4; // escala variable por fract de tiempo
        p -= vec2(0.0, 1.0); // translación
        float l = length(p); // length actual
        res += abs(l - lprev); // acumula diferencia entre lenght anterior y actual
        lprev = l; // guarda el length actual
    }
    res *= 0.00002; // escalar resultado
    res = sin(res + time); // sin + time sobre resultado
    return vec3(res*2.0, res*res, 0.0) + p.x*0.000002; // armo color con resultado y posicion final x
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}