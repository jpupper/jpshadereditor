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
    //uv.x*=fix;

    vec2 p = vec2(0.5*fix,0.5) - uv;
    float r = length(p);
    float a = atan(p.x,p.y);
    
    const int cantidad = 5;//Defino la cantidad de iteraciones que tendra mi for
    vec3 fin = vec3(0.0);//Defino un vec3 en el que ire sumando los circulos.
    
    for(int i =0; i< cantidad; i++){
        
        float index = float(i)*PI*2./float(cantidad); 
        
        vec2 uv2 = fract(vec2(uv.x,uv.y)*float(i));
    
        vec2 p2 = vec2(0.5,0.5) - uv2;
        float r2 = length(p2);
        float a2 = atan(p2.x,p2.y);
  
        //Defino una forma : 
        float e = sin(r2*10.+time+sin(r2*10.+time)*0.2);
        
        //Le invento los colores 
        vec3 col1 = vec3(e+0.5,e,e+0.8);
        vec3 col2 = vec3(e+0.2,e+0.20,0.8);
        
        vec3 dib = mix(col1,col2,float(i)/float(cantidad))*e; //Le pongo la forma con los colores y que los calcule en relacion a la forma
        fin +=dib;
    }
    fin/=float(cantidad);
    gl_FragColor = vec4(fin,1.0); 
}