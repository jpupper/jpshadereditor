#ifdef GL_ES
precision mediump float;
#endif

// EJEMPLO 5 - FRACTAL ABS+INVERSION 
// TECNICA DE COLOREADO: SUMA DE DIFERENCIAS - CONVERSION HSV A RGB - VARIACION DE BRILLO RADIAL

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
    float len = lprev; // guardo el length 
    float res = 0.0; // resultado
    for (float i = 0.0; i < 20.0; i++) {
        p = abs(p); // espejo en x
        p /= dot(p,p); // Inversión circular
        p -= 0.5; // translación
        float l = length(p); // length actual
        res += abs(l - lprev); // acumula diferencia entre lenght anterior y actual
        lprev = l; // guarda el length actual
    }
    res *= 0.015; // escalar resultado
    return hsv2rgb(vec3(res, 0.7, 1.0)) // obtengo rgb desde hsv usando res como hue
    * fract(len * 5.0 + res - time * 0.5); // el fract del length original, sumado al resultado del fractal
                                    // y restando time, genera las ondas radiales que se expanden
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x *= resolution.x / resolution.y;
    vec3 col = fractal(uv);
    gl_FragColor = vec4(col,1.0);
}