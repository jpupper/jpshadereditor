#ifdef GL_ES
precision mediump float;
#endif

// 4.3
// Formas
// Circulo inicial, Funcion step.

// Taller de Livecoding con visuales en GLSL 4.0 

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    
    vec2 p = vec2(0.5 , 0.5) - uv; // Genero un punto en el espacio(en este caso en el medio.
    float r = length(p);  // Obtengo el radio
    float a = atan(p.y, p.x); // obtengo el angulo. 
    
    // LA FUNCIÓN STEP FUNCIONA COMO SI FUERA UN UMBRAL. 
    // TODOS LOS VALORES DEBAJO DE 0.9 LOS TRANSFORMA EN 0. 
    // TODOS LOS VALORES ARRIBA DE 0.9 LOS TRANSFORMA EN 1.
    
    // LO MISMO SI LO HAGO CON uv.x , uv.y , a , o cualquier valor que yo le pase. 
    float e = step(0.9, 1.0 - r); // aca uso 1.-r para que me de el valor invertido, entonces negro pasa a blanco y blanco a negro.
    // e = step(0.9, uv.y);
    // e = step(0.9, uv.x); // Este se ve mitad negro mitad blanco porque cuando utilizamos fix pasan estas cosas.
    // e = step(0.9, a);
    
    gl_FragColor = vec4(vec3(e), 1.0); 
}