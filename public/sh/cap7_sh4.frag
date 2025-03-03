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

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;
    float fix = resolution.x/resolution.y;
    uv.x*=fix;

    const int cantidad = 20;//Defino la cantidad de iteraciones que tendra mi for
    vec3 fin = vec3(0.0);//Defino un vec3 en el que ire sumando los circulos.
    
    vec2 uv2 = uv;
    for(int i =0; i< cantidad; i++){
        
        float index = float(i)*PI*2./float(cantidad); 
        
        //Al agregarle al movimiento circular a la traslacion de cada uvec2
        // Y a su vez a cada uv hacerle un fract distinto puedo percibir particulas
        //en profundidad.
        vec2 mov = vec2(sin(time+index),cos(time+index));
        
       // float multiplyer = sin(time)*0.5+0.8;
        vec2 uv2 = fract(uv2*float(i+1)+mov);              
        vec2 pos = vec2(0.5*fix,0.5);//Defino una posicion 
        vec2 p = pos - uv2; // defino un punto.
        float r = length(p); //obtengo el radio
        
        vec3 col1 = vec3(1.0,1.0,0.0);
        vec3 col2 = vec3(1.0,0.0,0.0);
        
        //Con esta tecnica puedo 
        //asignarle distintos colores a las distintas capas que voy agregando
        //(i+1)/float(cantidad) me devuelve de 0.0 a 1.0 la relacion de i,cantidad.
        
        vec3 colf = mix(col1,col2,float(i+1)/float(cantidad));
        //Sumo el dibujo del circulo a mi vector final
        fin+= smoothstep(0.94,0.99,1.-r)*colf; 
    }
    gl_FragColor = vec4(fin,1.0); 
}