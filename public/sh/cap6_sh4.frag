#ifdef GL_ES
precision mediump float;
#endif

//6.4
//Fracts
//UVS combinadas.

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
    float fix = resolution.x/resolution.y;
    
    //Otra fantastica ventaja al usar fract es que si desplazamos las uv constantemente en      un eje.
    //El dibujo volvera por el otro lado, para que esto funcione. 
    //El desplazamiento debe hacerse previo a aplicar la funcion fract a las uvs.
    uv.x*=fix;
    uv = fract(uv*5.+time*0.25); //Lo desplazo en las dos posiciones.
    //uv = fract(vec2(uv.x*5.,uv.y*5.+time*0.25));//Lo desplazo solo en y
    
    //También puedo utilizar el fract mas en un eje que en el otro : 
    // uv = fract(vec2(uv.x*2.-time*0.25,uv.y*2.));//Lo desplazo solo en x
    
    float e = poly(uv,vec2(0.5),0.1,0.1,3,time);
    vec3 fin = vec3(e); //POLY CON FIX 
           
    gl_FragColor = vec4(fin,1.0); 
}