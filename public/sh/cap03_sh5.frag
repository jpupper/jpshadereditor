#ifdef GL_ES
precision mediump float;
#endif

// 3.5
// Cambio de fase 
 
// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359

// Función en la que coloco mi variable de "forma" generada con senoidales.
// Y luego le paso una fase distinta a cada uno : 
float desfase(vec2 uv, float _fase) {
    float formafinal = sin(uv.x * 10.0 * PI + time
                        + sin(uv.y * 2.0 * PI + time
                        + sin(uv.x * 10.0 * PI - time 
                        + sin(uv.y * 10.0 * PI - time
                        + sin(uv.x * 10.0 * PI - time
                        + sin(uv.y * 10.0 * PI - time)
                        + sin(uv.x * 10.0 * PI - time))))) + _fase) * 0.5 + 0.5;
    // formafinal += sin(formafinal * 20.0) * 0.05;
    return formafinal;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    // Otra manera para elegir buenas paletas de colores puede ser desfasando senoidales.
    // En este caso, los 3 canales tienen la misma forma, pero las senoidales que las generan tienen la fase cambiada
    // Por eso es que se generan distintos colores.
    float r = desfase(uv, 0.0);
    float g = desfase(uv, PI / 5.0);
    float b = desfase(uv, PI / 2.0);
    
    gl_FragColor = vec4(r, g, b, 1.0); 
}