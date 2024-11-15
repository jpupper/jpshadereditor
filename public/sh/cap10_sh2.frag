#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 2 - FRACTAL ABS+SCALE+ROT 
// IGUAL AL ANTERIOR CON OTRA TECNICA DE COLOREADO: SUMA DE LAS DIFERENCIAS
// COMPARAR CON EL SHADER ANTERIOR ACTIVANDO Y DESACTIVANDO LA PESTAÑA

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
    float lprev = length(p); // length inicial
    float res = 0.0; // resultado
    for (float i = 0.0; i < 12.0; i++) {
        p *= rot(time * 0.1); // rotación variable
        p = abs(p); // espejo en x e y
        p *= 1.5; // escala variable por fract de tiempo
        p -= 1.0; // translación
        float l = length(p); // length actual
        res += abs(l - lprev); // acumula diferencia entre lenght anterior y actual
        lprev = l; // guarda el length actual
    }
    res *= 0.1; // achico el resultado
    // armo color con el resultado y una coordenada
    vec3 col = vec3(res, res*res, p.x*p.x); 
    return col;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}