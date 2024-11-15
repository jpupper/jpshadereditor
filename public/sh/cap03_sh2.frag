#ifdef GL_ES
precision mediump float;
#endif

// 3.2
// Colores
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

void main() {
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    // Puedo utilizar la función hsb2rgb para expresar los colores en hsb.
    // HSB SIGNIFICA : HUE-SATURATION-BRIGHTNESS (tono,saturacion y brillo).
    // De esta manera el segundo parametro corresponde a la saturación.
    // Y el tercer parametro al brillo
     
    vec3 color = hsb2rgb(vec3(uv.x, 1.0 - uv.y, uv.y));

    gl_FragColor = vec4(color, 1.0); 
}