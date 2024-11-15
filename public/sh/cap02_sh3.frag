#ifdef GL_ES
precision mediump float;
#endif

// 2.3
// Frecuencia y tiempo.
// Taller de Livecoding con visuales en GLSL 

uniform float time;
uniform vec2 resolution;

// COMO EL NUMERO PI NO VIENE INCLUDO EN GLSL LO DEFINIMOS MANUALMENTE.
// Utilizamos la estructura #define para definir constantes en el programa.
#define PI 3.14159265359

void main()
{   
    vec2 uv = gl_FragCoord.xy / resolution; // Obtengo las coordenadas UV(coordenadas cartesianas).
   
    // Si a la función senoidal le sumamos una variable, veremos que oscilara en relación a esa variable. 
    // En este caso si le colocamos uv.x va a ir haciendo un constante degrade : 
    
    // Si a la frecuencia la multiplicamos por PI obtendremos exactamente ese numero de "lineas".
    float freq = 10.0 * PI; 
    
    float forma = sin(time + uv.x * freq) * 0.5 + 0.5; // Degrade constante en X
    // float forma = sin(time + uv.y * freq) * 0.5 + 0.5; // Degrade constante en Y
    // float forma = sin(time + uv.y * freq + uv.x * freq) * 0.5 + 0.5; // Degrade constante en X+Y
    // float forma = sin(time + uv.y * freq + uv.x * freq); // Así se ve cuando una oscilación es entre -1 y 1
          
    gl_FragColor = vec4(vec3(forma), 1.0); 
}