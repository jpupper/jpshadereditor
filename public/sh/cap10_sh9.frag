#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 9 - FRACTAL BOXFOLD + COUSINFOLD 
// TECNICA DE COLOREADO: ORBIT TRAPS ANIMADAS - COLOR POR ITERACION

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

const int MAX_ITERATIONS = 8;

// función rotar, a = angulo en radianes, 
// devuelve matriz de rotación para multiplicar por las coordenadas
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// fractal - recibe las coordenadas e itera la fórmula en el for
vec3 fractal(vec2 p) {
    float ot = 1000.0; // orbit trap se inicializa en valor alto
    float it = 0.0; // para guardar la iteracion del orbit trap
    p += time * 0.1; // movimiento camara
    p *= 3.0; // zoom out
    p = mod(p, 3.0); // mosaico para repetir el patron
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        p = abs(p + 0.5) - abs(p - 0.5) - p; // boxfold
        p /= clamp(p.x * p.y, 0.25, 1.0); // cousinfold
        p *= 0.5; // escala
        p -= 1.0; // translación
        float v = abs(p.x) + fract(p.y * 0.2 + time * 0.5 + float(i) * 0.15) * 0.5; // para capturar el valor más cercano al eje x
                            // y animar sumando fract de p.y y time, ademas de la iteracion actual para desfasar 
        if (v < ot) // no uso min ya que quiero capturar la iteracion tambien, si el valor v es menor...
        {
            ot = v; // guardo el valor menor en ot
            it = float(i); // guardo la iteracion 
        }
    }
    ot = exp(-10.0 * ot); // exp negativo invierte ot y le da contraste (comprime)
    return hsv2rgb(vec3(it*0.1,0.7,2.0)) * ot + length(p) *0.005; // creo rgb con hsv usando de hue iteracion guardada 
                        //luego multiplicado por orbit trap y sumando length de las coordenadas finales (blanco)
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    uv.x *= 1.0+uv.y; // deformacion de uv.x para simular perspectiva
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}