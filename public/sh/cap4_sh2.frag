#ifdef GL_ES
precision mediump float;
#endif

// 4.2
// Formas
// Uso de radio y angulo como osciladores

// Taller de Livecoding con visuales en GLSL 4.0 

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    vec2 p = vec2(0.5) - uv; // Genero un punto en el espacio(en este caso en el medio.
    float r = length(p);  // Obtengo el radio
    float a = atan(p.y, p.x); // obtengo el angulo. 
    
    // También puedo utilizarlas de la misma manera que hice con las uv.x y uv.y para generar formas mas complejas.
    
    vec3 forma_radioangulocompleja = vec3(
        sin(r * 20.0 - time
        + sin(a * 10.0 + time
        + sin(r * 100.0 - time
        + sin(a * 10.0
        + sin(r * 100.0
        + sin(a * 10.0)))))) * 0.5 + 0.5);
    
    gl_FragColor = vec4(forma_radioangulocompleja, 1.0); 
}