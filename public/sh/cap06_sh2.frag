#ifdef GL_ES
precision mediump float;
#endif

//6.2
//Fracts
//Subdivisión del espacio.

//Taller de Livecoding con visuales en GLSL 4.0 

//Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359
#define TWO_PI PI*2.

float poly(vec2 uv,vec2 p, float s, float dif,int N,float a){
    // Remap the space to -1. to 1.
    vec2 st = p - uv ;
    // Angle and radius from the current pixel
    float a2 = atan(st.x,st.y)+a;
    float r = TWO_PI/float(N);
    float d = cos(floor(0.5+a2/r)*r-a2)*length(st);
    float e = 1.0 - smoothstep(s,s+dif,d);
    return e;
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;

    //La subdivision del espacio con la función fract es clave si queremos hacer elementos repetidos:
    
    uv = fract(uv*10.); //ACA LE DIGO CUANTO TIENE QUE SUBDIVIDIR EL ESPACIO.
    
    vec2 p = vec2(0.5) -uv;
    float r = length(p);
    float a  = atan(p.x,p.y);
    
    //DESCOMENTAR PARA VER LOS DISTINTOS EJEMPLOS
    vec3 fin = vec3(uv,1.0);
         //fin = vec3(poly(uv,vec2(0.5,0.5),0.25,0.1,5,time)); 
         //fin = vec3(sin(r*20.+time));
        
    gl_FragColor = vec4(fin,1.0); 
}