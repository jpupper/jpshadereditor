#ifdef GL_ES
precision mediump float;
#endif

// 4.7
// Formas
// Movimiento de formas

// Taller de Livecoding con visuales en GLSL 4.0 

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359
#define TWO_PI PI * 2.0

// DECLARO UNA FUNCION. ESTA FUNCION ME SIRVE PARA GENERAR POLIGONOS.
// Funcion sacada de : https://thebookofshaders.com/07/
// aunque la transformación a función fue hecha por jp.
float poly(vec2 uv, vec2 p, float s, float dif, int N, float a) {
    // Remap the space to -1. to 1.
    vec2 st = p - uv;
    // Angle and radius from the current pixel
    float a2 = atan(st.y, st.x) + a;
    float r = TWO_PI / float(N);
    float d = cos(floor(0.5 + a2 / r) * r - a2) * length(st);
    float e = 1.0 - smoothstep(s, s + dif, d);
    return e;
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    // ESTO ES PARA ARREGLAR EL ASPECT RADIO. 
    // Es decir para que no importa la resolución que tenga, el circulo siempre sea un circulo perfecto.
    float fix = resolution.x / resolution.y; // Creo la variable que me permite arreglar esto.
    uv.x *= fix;
    
    vec2 pos = vec2(0.5); // También podemos animar el movimiento.
    vec2 mov = vec2(sin(time) * 0.2, cos(time) * 0.2);
    pos += mov;
     
    // EN EL P también lo tengo que multiplicar por el fix.
    vec2 p = vec2(pos.x * fix, pos.y) - uv; // Genero un punto en el espacio(en este caso en el medio.
    float r = length(p);  // Obtengo el radio
    float a = atan(p.y, p.x); // obtengo el angulo. 
    
    float mof = sin(a * 5.0 + time) * 0.02;
    float e = smoothstep(0.88, 0.9, (1.0 - r) + mof);
          
    gl_FragColor = vec4(vec3(e), 1.0); 
}