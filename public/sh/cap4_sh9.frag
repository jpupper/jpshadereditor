#ifdef GL_ES
precision mediump float;
#endif

// 4.8
// Formas
// Formas Con borde de distintos colores : 

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
    // mof = sin(a * 10.0 + time) * 0.05 * sin(r * 100.0 + time);
    // mof = sin(a * 10.0 + time) * 0.08 * sin(r * 100.0 + time);
    // mof = sin(uv.x * 200.0 + time) * 0.08 * sin(uv.y * 200.0 + time);
    // mof = sin(uv.x * 100.0 + time) * 0.08 * sin(uv.y * 50000000.0 + time);
    
    // Cambiar estos parametros y ver como afectan :
    float size = 0.88; // Tamaño de la figura.
    float diffusesize = size + 0.01; // Tamaño del diffuse de la forma
    float bordersize = 0.01; // TAMAÑO DEL BORDE
    float borderdiffuse = 0.005; // Tamaño del diffuse del borde.
    
    float e = smoothstep(size, diffusesize, (1.0 - r) + mof);  // Forma 1 
    float e2 = smoothstep(diffusesize + bordersize, diffusesize + bordersize + borderdiffuse, (1.0 - r) + mof);  // Forma 2 // Aca decido los tamaños.
   
    // Declaro 2 colores :
    vec3 col1 = vec3(1.0, 0.5, 0.3);
    vec3 col2 = vec3(0.3, 0.5, 1.0);
    
    // Como sabemos e2 es la forma mas pequeña y e la forma mas grande. 
    // Si nosotros utilizamos la función mix mezclara segun la forma de la estrella los 2 colores.
    // Luego si col1 es multiplicado por e (la forma mas grande) y e en todos los lugares donde no es la estrella es 0 , entonces 
    // como cualquier numero que multiplico por 0 da 0 , el color es cortado como una mascara. Por eso nos queda solo el borde.
    vec3 fin = mix(col1 * e, col2, e2);
   
    gl_FragColor = vec4(fin, 1.0); 
}