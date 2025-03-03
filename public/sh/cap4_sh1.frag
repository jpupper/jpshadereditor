#ifdef GL_ES
precision mediump float;
#endif

// 4.1
// Formas
// Obtencion de radio y angulo.

// Taller de Livecoding con visuales en GLSL 4.0 

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    // Al igual que cuando utilizamos uv.x y uv.y también podemos utilizar las variables r y a.
    // Estas variables son el radio y el angulo . 
    // Se obtienen de la siguiente manera : 
    
    vec2 p = vec2(0.5) - uv; // Genero un punto en el espacio(en este caso en el medio.
    
    // Obtengo el radio(calcula la distancia del punto del medio con las puntas mas alejadas y por eso me genera el radio 
    float r = length(p);
    
    // obtengo el angulo. (Calcula el angulo existente que hay en el punto p.)
    float a = atan(p.x, p.y);
    
    gl_FragColor = vec4(r, a, r + a, 1.0); // Visualizo el radio, el ángulo y su suma
    // gl_FragColor = vec4(vec3(a), 1.0); // Visualizo solo el angulo.
}