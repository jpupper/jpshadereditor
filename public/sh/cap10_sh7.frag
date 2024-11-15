#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 7 - FRACTAL ABS+INVERSION 
// TECNICA DE COLOREADO: ORBIT TRAPS

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

const int MAX_ITERATIONS = 50;

// función rotar, a = angulo en radianes, 
// devuelve matriz de rotación para multiplicar por las coordenadas
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

// fractal - recibe las coordenadas e itera la fórmula en el for
vec3 fractal(vec2 p) {
    float ot = 1000.0; // orbit trap se inicializa en valor alto
    p *= rot(time * 0.2);
    float zoom = 1.0 + sin(time * 0.3) * 0.95; // zoom 
    p *= zoom * 0.005; // aplico zoom
    p += 0.5;
    int iterations = int(float(MAX_ITERATIONS) - zoom * 8.0);
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if (i >= iterations) break; // Salimos del bucle si superamos las iteraciones calculadas
        p.x = abs(p.x); // espejo en x
        p /= dot(p,p); // Inversión circular
        p -= vec2(0.5, 0.25); // translación
        ot = min(ot, length(p)); // captura el valor mas cercano a 0,0 en ot (orbit trap)
    }
    ot = exp(-8.0 * ot); // exp negativo invierte ot y le da contraste (comprime)
    return vec3(ot * ot, ot * ot * ot, ot * 4.0); // creo rgb con ot
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}