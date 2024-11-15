#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 6 - FRACTAL BOXFOLD+SCALE+BALLFOLD (estilo Mandelbox)
// TECNICA DE COLOREADO: SUMA DE DIFERENCIAS - COORDENADA X 

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// fractal - recibe las coordenadas e itera la fórmula en el for
vec3 fractal(vec2 p) {
    float lprev = length(p); // length inicial
    float res = 0.0; // resultado
    p *= 1.0 + sin(time * 0.2) * 0.5; // zoom
    p += vec2(sin(time * 0.3) , time * 0.1);
    p = abs(1.0 - mod(p * 0.1, 2.0));
    for (float i = 0.0; i < 11.0; i++) {
        p = abs(p + 1.0) - abs(p - 1.0) - p; // boxfold
        p *= 2.0; // escala
        p /= clamp(dot(p,p), 0.5, 1.0); // ballfold
        p -= 1.0; // translación
        float l = length(p); // length actual
        res += abs(l - lprev); // acumula diferencia entre lenght anterior y actual
        lprev = l; // guarda el length actual
    }
    res *= 0.05; // escalo res
    res *= res * res; // contraste
    res -= p.x * 0.1; // restar p.x genera los "surcos"
    return vec3(res, res*res, res*res*res); // armo rgb con res
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}