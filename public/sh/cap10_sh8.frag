#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 8 - FRACTAL BOXFOLD+BALLFOLD (estilo Mandelbox) 
// TECNICA DE COLOREADO: ORBIT TRAPS ANIMADAS - COLOR POR ITERACION

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

const int MAX_ITERATIONS = 10;

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
    p *= rot(time * 0.2); // rotacion de 'camara'
    p *= 0.2; // zoom in
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        p = abs(p + 1.0) - abs(p - 1.0) - p; // boxfold
        p /= clamp(dot(p,p), 0.0, 2.0); // ballfold
        p *= 1.5; // escala
        p -= vec2(1.0, 3.0); // translación
        float v = abs(p.x) + abs(sin(p.y * 0.5 + time * 3.0)) * 0.5; // para capturar el valor más cercano al eje x
                                                    // y animado sumando un valor absoluto del seno del eje y con time
        if (v < ot) // no uso min ya que quiero capturar la iteracion tambien, si el valor v es menor...
        {
            ot = v; // guardo el valor menor en ot
            it = float(i); // guardo la iteracion 
        }
    }
    ot = exp(-7.0 * ot); // exp negativo invierte ot y le da contraste (comprime)
    return hsv2rgb(vec3(it*0.2,0.7, 4.0)) * ot; // creo rgb con hsv usando iteracion guardada multiplicada por ot
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}