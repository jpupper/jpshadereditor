#ifdef GL_ES
precision mediump float;
#endif

//7.1
//Fors
//Fors para sumar posiciones.

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

//DECLARO UNA FUNCION. ESTA FUNCION ME SIRVE PARA GENERAR POLIGONOS.
//Funcion sacada de : https://thebookofshaders.com/07/
//aunque la transformación a función fue hecha por jp.
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
    uv.x*=fix;

    vec2 p = vec2(0.5*fix,0.5) - uv;
    float r = length(p);
    float a = atan(p.x,p.y);
    
    const int cantidad = 10;//Defino la cantidad de iteraciones que tendra mi for
    vec3 fin = vec3(0.0);//Defino un vec3 en el que ire sumando los circulos.
    
    vec2 uv2 = uv;
    for(int i =0; i< cantidad; i++){
        
        float index = float(i)*PI*2./float(cantidad); 
        
        //ACA EL SCALE SE ESTA APLICANDO EN CADA BUCLE, ENTONCES EN CADA BUCLE A UV2 LE HACE UN SCALE 
        //*1.3, lo que equivale a hacerlo mas pequeño.
        uv2-=vec2(0.5*fix,0.5);
        uv2 = scale(vec2(1.2))*uv2; 
        uv2+=vec2(0.5*fix,0.5);

        //Esta tecnica es para que en una 
        //pasada del bucle sume figura y en la otra pasada del bucle reste.
        //Entonces visualmente queda asi :
        if(mod(float(i),2.) == 0.){
           // fin+= poly(uv2,vec2(0.5*fix,0.5),0.35,0.05,3,0);
           //Aca hago que cambie el angulo en relación al indice y que gire para un lado
            fin+= poly(uv2,vec2(0.5*fix,0.5),0.35,0.05,3,index+time); 
        }else{
            //fin-= poly(uv2,vec2(0.5*fix,0.5),0.4,0.05,3,0); 
            //Aca hago que cambie el angulo 
            //en relación al indice y que gire para el otro lado.
            fin-= poly(uv2,vec2(0.5*fix,0.5),0.35,0.05,3,index-time); 
        }
    }
    gl_FragColor = vec4(fin,1.0); 
}