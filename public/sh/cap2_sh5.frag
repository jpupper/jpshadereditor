#ifdef GL_ES
precision mediump float;
#endif

// 2.5
// Ondas anidadas
// Taller de Livecoding con visuales en GLSL 

uniform float time;
uniform vec2 resolution;

// COMO EL NUMERO PI NO VIENE INCLUDO EN GLSL LO DEFINIMOS MANUALMENTE.
// Utilizamos la estructura #define para definir constantes en el programa.
#define PI 3.14159265359

void main()
{   
    vec2 uv = gl_FragCoord.xy / resolution; // Obtengo las coordenadas UV(coordenadas cartesianas).

    // Probar cambiar el numero 10 en las distintas senoidales para ver como influye la frecuencia de las ondas.
    float formafinal = sin(uv.x * 10.0 * PI + time
                            + sin(uv.y * 2.0 * PI + time
                            + sin(uv.x * 20.0 * PI - time 
                            + sin(uv.y * 5.0 * PI - time
                            + sin(uv.x * 2.0 * PI - time
                            + sin(uv.y * 1.0 * PI - time)
                            + sin(uv.x * 10.0 * PI - time)))))) * 0.5 + 0.5;
    
    gl_FragColor = vec4(vec3(formafinal), 1.0); 
}