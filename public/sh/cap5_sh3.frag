#ifdef GL_ES
precision mediump float;
#endif

//5.1
//translate rotate scale
//TRANSLATE ROTATE Y SCALE CON 2 POLIGONOS COMBINADOS.

//Taller de Livecoding con visuales en GLSL 4.0 

//Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359
#define TWO_PI PI*2.

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

//HAGO FUNCIONES PARA ESCALAR UVS EN UNA SOLA LINEA !!
vec2 scale(vec2 uv,vec2 _sc){
    float fix = resolution.x/resolution.y; 
    uv-=vec2(0.5*fix,0.5);
    uv = scale(_sc)*uv;
    uv+=vec2(0.5*fix,0.5);
    return uv;
}
//HAGO FUNCIONES PARA ROTAR UVS EN UNA SOLA LINEA !!
vec2 rotate2d(vec2 uv,float _rot){
    float fix = resolution.x/resolution.y; 
    uv-=vec2(0.5*fix,0.5);
    uv = rotate2d(_rot)*uv;
    uv+=vec2(0.5*fix,0.5);
    return uv;
}

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
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    
    float fix = resolution.x/resolution.y; 
    uv.x*=fix;
    
    //podemos hacer copias de las uv original y luego utilizar translate, rotate y scale en las distintas uv.
    //De esta manera tener podemos tener coordenadas con distintas escalas, rotaciones y translates.
    
    vec2 uv2 = uv;
    vec2 uv3 = uv;
    
    uv2.x-=0.5;
    uv2.x+=sin(time*3.)*0.2; //TRANSLATE
    uv2 = scale(uv2,vec2(2.8));  //SCALE
    uv2 = rotate2d(uv2,time); //ROTATE
    
    uv3.x+=0.5;
    uv3.y+=sin(time*5.)*0.2; //TRANSLATE
    uv3 = scale(uv3,vec2(0.9));  //SCALE
    uv3 = rotate2d(uv3,-time); //ROTATE
    
    //COMO PODEMOS OBSERVAR , AMBOS POLIGONOS TIENEN LOS MISMOS VALORES EXCEPTO POR LAS UVS QUE RECIBEN. 
    //DE ESTA MANERA QUEDA DEMOSTRADO EL PODER QUE TIENEN LAS OPERACIONES MATRICIALES EN DONDE UN DIBUJO PUEDE CAMBIAR     
    //COMPLETAMENTE SOLO CON OPERACIONES MATRICIALES
    vec3 dibujo1 = vec3(poly(uv2,vec2(0.5*fix,0.5),0.1,0.1,3,0.0));           
    vec3 dibujo2 = vec3(poly(uv3,vec2(0.5*fix,0.5),0.1,0.1,3,0.0));
                    
                    
    vec3 fin = dibujo1+dibujo2;      
    gl_FragColor = vec4(fin,1.0); 
}