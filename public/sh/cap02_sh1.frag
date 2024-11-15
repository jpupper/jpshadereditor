#ifdef GL_ES
precision mediump float;
#endif

// 2.1
// Uso de la funcion sin para generar ondas
// Taller de Livecoding con visuales en GLSL 

uniform float time;
uniform vec2 resolution;

void main()
{   
    vec2 uv = gl_FragCoord.xy / resolution; // Obtengo las coordenadas UV(coordenadas cartesianas).
   
    // La funcion sin (seno) me sirve para crear osciladores.
    // devuelve un valor entre -1 y 1. 
    // Entonces para que oscile constantemente debo multiplicarla por 0.5. 
    // una vez multiplicada devolvera un valor entre -0.5+0.5. 
    // Si a ese resultado le sumo 0.5.
    // Obtengo que va a ir entre 0 y 1.
    
    // Utilizo time para que mi onda sinusoide suba y baje constantemente. De esta manera le doy movimiento.
    
    float forma = sin(time) * 0.5 + 0.5;
     
    gl_FragColor = vec4(vec3(forma), 1.0); 
}