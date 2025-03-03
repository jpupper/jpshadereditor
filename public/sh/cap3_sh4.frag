#ifdef GL_ES
precision mediump float;
#endif

// 3.4
// Multiplicación y suma de colores :
 
// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

// FUNCIONES SACADAS DE https://thebookofshaders.com/06/: 
// esta es para transformar si pensamos un color en hsb a rgb, nunca lo use.
vec3 rgb2hsb(in vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
                 vec4(c.gb, K.xy),
                 step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
                 vec4(c.r, p.yzx),
                 step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                d / (q.x + e),
                q.x);
}

// Function from Iñigo Quiles
// https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0),
                             6.0) - 3.0) - 1.0,
                     0.0,
                     1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

#define PI 3.14159265359

void main() {
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
      
    // ES IMPORTANTE COMPRENDER QUE NO EXISTE UNA REAL DIFERENCIA ENTRE FORMA Y COLOR EN GLSL
    // LA DIFERENCIA ENTRE UNA Y OTRA ES ARBITRARIA SEGUN LO QUE EL PROGRAMADORE ENTIENDA COMO TAL.
      
    // Esta es la forma que habíamos hecho en el tutorial anterior.
    // Veremos las opciones existentes que hay para poder pintar un dibujo:
    float formafinal = sin(uv.x * 10.0 * PI + time
                        + sin(uv.y * 2.0 * PI + time
                        + sin(uv.x * 10.0 * PI - time 
                        + sin(uv.y * 10.0 * PI - time
                        + sin(uv.x * 10.0 * PI - time
                        + sin(uv.y * 10.0 * PI - time)
                        + sin(uv.x * 10.0 * PI - time)))))) * 0.5 + 0.5;
    
    float formafinal2 = sin(uv.y * 10.0 * PI + time
                        + sin(uv.y * 10.0 * PI + time
                        + sin(uv.x * 8.0 * PI - time 
                        + sin(uv.y * 5.0 * PI - time
                        + sin(uv.x * 10.0 * PI - time
                        + sin(uv.y * 2.0 * PI - time)
                        + sin(uv.x * 9.0 * PI - time)))))) * 0.5 + 0.5;
   
    vec3 color1 = vec3(1.0, 0.0, 0.2); 
    vec3 color2 = vec3(0.2, 0.5, 1.0); 
    
    // Creo una variable en donde voy a hacer todas las cuentas finales. 
    // En donde una forma si la multiplico por ese color va a ser de ese color.
    // Sumo 2 formas que fueron multiplicadas por los colores respectivos.
    
    vec3 fin = color1 * formafinal + color2 * formafinal2;
    gl_FragColor = vec4(fin, 1.0); 
}