#ifdef GL_ES
precision mediump float;
#endif

// 3.3
// Funcion mix y hsb2rgb para pintar una animación, NO EXISTE UNA DIFERENCIA TANGIBLE ENTRE COLOR Y FORMA
// Funciónes HSB y RGB: 
 
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
    
    // OPCION 1 : 
    // Una opcion es pasar la variable que genera la forma 
    // a algunos de los valores cuando se usa la función hsb2rgb.
    
    // Le multiplicamos los valores para que sea mas atractivo:
    vec3 color_hsb = hsb2rgb(vec3(formafinal,
                               0.5 + formafinal * 0.5,
                               formafinal * 0.7 + 0.8));
    
    // OPCION 2 :
    // UTILIZAMOS LA FUNCIÓN MIX PARA MEZCLAR 2 COLORES y pasamos como tercer parametro nuestra forma.
    // De esa manera nos va a pintar la forma que le hayamos pasado.
    vec3 color1 = vec3(1.0, 0.0, 0.0);
    vec3 color2 = vec3(1.0, 1.0, 0.0);
    
    vec3 colfinal = mix(color1, color2, formafinal);
        
    // OPCION 3 :
    // Combinación : 
    
    // Aca lo que hacemos es como inventar colores y luegos utilizarlos para pintar la forma
    // Como se puede observar los componentes de color3 y color4 son complejos
    // Es decir no se limitan a valores entre 0 y 1 . 
    // Puedo "inventar" un color que no sea igual en todos los pixeles para darle mas complejidad a mi visual.
    vec3 color3 = vec3(uv.y, 0.0, 1.0 - uv.y);
    vec3 color4 = vec3(sin(formafinal * 2.0), sin(uv.y * 2.0 * PI + time) * 0.5 + 0.5, uv.y);
    
    vec3 colfinal2 = mix(color3, color4, formafinal);
        
    // gl_FragColor = vec4(color_hsb, 1.0); 
    // gl_FragColor = vec4(colfinal, 1.0); 
    gl_FragColor = vec4(colfinal2, 1.0); 
}