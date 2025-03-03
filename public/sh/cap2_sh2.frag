#ifdef GL_ES
precision mediump float;
#endif

// 2.2
// Intro senoidales
// Taller de Livecoding con visuales en GLSL 

uniform float time;
uniform vec2 resolution;

void main()
{   
    vec2 uv = gl_FragCoord.xy / resolution; // Obtengo las coordenadas UV(coordenadas cartesianas).
   
    // Si a la función senoidal le sumamos una variable, veremos que oscilara en relación a esa variable. 
    
    float forma = sin(time + uv.x) * 0.5 + 0.5; // Degrade constante en X
    forma = sin(time + uv.y) * 0.5 + 0.5; // Degrade constante en Y
    forma = sin(time + uv.y + uv.x) * 0.5 + 0.5; // Degrade constante en X+Y
          
    gl_FragColor = vec4(vec3(forma), 1.0); 
}