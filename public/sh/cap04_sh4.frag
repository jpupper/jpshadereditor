#ifdef GL_ES
precision mediump float;
#endif

// 4.4
// Formas
// Circulo avanzado - smoothstep

// Taller de Livecoding con visuales en GLSL 4.0 

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    // ESTO ES PARA ARREGLAR EL ASPECT RADIO. 
    // Es decir para que no importa la resolución que tenga, el circulo siempre sea un circulo perfecto.
    float fix = resolution.x / resolution.y; // Creo la variable que me permite arreglar esto.
    uv.x *= fix;
    
    // EN EL P también lo tengo que multiplicar por el fix.
    vec2 p = vec2(0.5 * fix, 0.5) - uv; // Genero un punto en el espacio(en este caso en el medio.
    float r = length(p);  // Obtengo el radio
    float a = atan(p.y, p.x); // obtengo el angulo. 
    
    // LA FUNCIÓN SMOOTHSTEP FUNCIONA COMO SI FUERA UN UMBRAL CON LA OPCION DE GRAFICAR VALORES INTERMEDIOS.
    // Esto nos permite hacer un circulo con un borde con degrade.
    
    // TODOS LOS VALORES DEBAJO DE 0.88 LOS TRANSFORMA EN 0. 
    // TODOS LOS VALORES ARRIBA DE 0.9 LOS TRANSFORMA EN 1.
    // TODOS LOS VALORES INTERMEDIOS ENTRE 0.88 y 0.9 LES HACE UNA INTERPOLACION ENTRE 0.0 y 1.0.
    
    // LO MISMO SI LO HAGO CON uv.x , uv.y , a , o cualquier valor que yo le pase. 
    float e = smoothstep(0.88, 0.9, 1.0 - r); 
         
    gl_FragColor = vec4(vec3(e), 1.0); 
}