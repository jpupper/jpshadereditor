#ifdef GL_ES
precision mediump float;
#endif

// 2.4
// Mezclando ondas 
// Taller de Livecoding con visuales en GLSL 

uniform float time;
uniform vec2 resolution;

// COMO EL NUMERO PI NO VIENE INCLUDO EN GLSL LO DEFINIMOS MANUALMENTE.
// Utilizamos la estructura #define para definir constantes en el programa.
#define PI 3.14159265359

void main()
{   
    vec2 uv = gl_FragCoord.xy / resolution; // Obtengo las coordenadas UV(coordenadas cartesianas).

    float forma  = sin(time + uv.x * 5.0 * PI) * 0.5 + 0.5; // Degrade constante en X
    float forma2 = sin(time + uv.y * 5.0 * PI) * 0.5 + 0.5;
    
    // Existen varias maneras de mezclar las ondas senoidales. 
    
    // EJEMPLO 1 : 
    // suma de 2 ondas : 
    float formafinal = forma + forma2; 
    
    // EJEMPLO 2 : 
    // Multiplicacion de 2 ondas: 
    // float formafinal = forma * forma2; 
    
    // EJEMPLO 3 : 
    // Mezclarlas dentro de una tercera onda senoidal.
    // float formafinal = sin(forma * forma2 * 10.0 + time); 
    
    gl_FragColor = vec4(vec3(formafinal), 1.0); 
}