#ifdef GL_ES
precision mediump float;
#endif

// 4.5
// Formas
// Circulo inicial - Shaping function.

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
    
    // Puedo utilizar una variable para modificar a mi circulo ahora.
    
    float mof = sin(a * 5.0 + time) * 0.02;
    // mof = sin(a * 10.0 + time + sin(r * 100.0 + time * 10.0)) * 0.02;
    // mof = sin(a * 50.0 + time) * 0.08 * sin(r * 100.0 + time);
    // mof = sin(a * 10.0 + time) * 0.08 * sin(r * 100.0 + time);
    // mof = sin(uv.x * 200.0 + time) * 0.08 * sin(uv.y * 200.0 + time);
    // mof = sin(uv.x * 100.0 + time) * 0.08 * sin(uv.y * 50000000.0 + time);
    
    float e = smoothstep(0.88, 0.9, (1.0 - r) + mof); 
          
    gl_FragColor = vec4(vec3(e), 1.0); 
}