#ifdef GL_ES
precision mediump float;
#endif

// 4.6
// Formas
// Poligonos

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
    
    // TAMBIEN PUEDO UTILIZAR UNA FUNCION PARA HACER POLIGONOS : 
    // los parametros que recibe la funcion son : 
    // -UV, 
    // -posicion(si le pongo el fix tengo que multiplicar el x por el fix),
    // -El tamaño del poligono
    // -El diffuse(osea la interpolacion entre el negro y el blanco.
    // -Cantidad de puntas.
    // -Angulo.
    float e = poly(uv, vec2(0.25 * fix, 0.25), 0.1, 0.05, 3, time * 0.5); 
    e += poly(uv, vec2(0.75 * fix, 0.75), 0.1, 0.01, 4, -time); 
    e += poly(uv, vec2(0.25 * fix, 0.75), 0.1, 0.0, 5, -time * 0.5); 
    e += poly(uv, vec2(0.75 * fix, 0.25), 0.0, 0.5, 5, time); 
          
    gl_FragColor = vec4(vec3(e), 1.0); 
}