#ifdef GL_ES
precision mediump float;
#endif

// 3.1
// Colores
// Función MIX : 
 
// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas

    vec3 color1 = vec3(1.0, 0.0, 0.0); // ROJO
    vec3 color2 = vec3(0.0, 0.0, 1.0); // AZUL
    
    // Puedo utilizar la función mix para mezclar colores. 
    vec3 colfinal = mix(color1, color2, 0.0); // Si el tercer parametro de la función mix es 0 obtengo solo color1
    colfinal = mix(color1, color2, 1.0); // Si el tercer parametro de la función mix es 1 obtengo solo color2
    colfinal = mix(color1, color2, 0.5); // Obtengo el color intermedio entre uno y otro.
    colfinal = mix(color1, color2, sin(time) * 0.5 + 0.5); // OSCILA ENTRE EL COLOR 1 Y EL COLOR 2.
         
    gl_FragColor = vec4(colfinal, 1.0); 
}