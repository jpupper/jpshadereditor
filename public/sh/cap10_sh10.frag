#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 10 - FRACTAL BOXFOLD + BALLFOLD 
// TECNICA DE COLOREADO: ORBIT TRAPS ANIMADAS - COLOR POR ITERACION

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

const int MAX_ITERATIONS = 20;

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
    p *= 5.0+sin(time * 0.2)*4.5; // zoom out
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        p = abs(p); // boxfold
        p *= rot(-0.7); // rotación fija
        p /= clamp(dot(p,p), 0.0, 1.5); // ballfold
        p -= 0.25; // translación
        // para capturar el valor más cercano a los ejes x o y
        // y animar sumando fract de p.y y time, ademas de la iteracion actual para desfasar 
        float v = min(abs(p.x), abs(p.y)) + fract(p.y * 0.1 + time + float(i) * 0.2) * 0.5; 
        if (v < ot) // no uso min ya que quiero capturar la iteracion tambien, si el valor v es menor...
        {
            ot = v; // guardo el valor menor en ot
            it = float(i); // guardo la iteracion 
        }
    }
    ot = exp(-30.0 * ot); // exp negativo invierte ot y le da contraste (comprime)
    return hsv2rgb(vec3(it*0.05,0.7,2.0)) * ot + length(p) *0.005; // creo rgb con hsv usando de hue iteracion guardada 
                        //luego multiplicado por orbit trap y sumando length de las coordenadas finales (blanco)
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}