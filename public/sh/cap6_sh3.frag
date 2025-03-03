#ifdef GL_ES
precision mediump float;
#endif

//6.3
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
    vec2 uv_circulos = fract(uv*20.);
    
    //AL IGUAL QUE COMO HABIAMOS HECHO EN EL EJEMPLO DEL TRANSLATE ,SCALE Y ROTATE.
    //PODEMOS DECLARAR MAS DE UNAS COORDENADAS UV Y USARLAS EN PARALELO Y LUEGO COMBINARLAS.
    //EN ESTE CASO ESTAMOS UTILIZANDO UN PATRON DE CIRCULOS 
    //EN EL CUAL EL TAMAÑO ES DECIDIDO POR OTRO PATRON QUE USA OTRAS UV
    
    vec2 p = vec2(0.5) -uv;
    float r = length(p);
    float a  = atan(p.x,p.y);
    
    //Esta es la forma con la que se decidiran los tamaños de los circulos:
    //Ejemplo forma2 1 :
    float forma2 = sin(r*10.+time)*0.5+0.5;
    
     //Ejemplo forma2 2 :
     //forma2 = sin(uv.x*10.+time)*0.5+0.5;
      
     //Ejemplo forma2 3 :
     //forma2 = poly(uv,vec2(0.5,0.5),0.0,0.2,3,time);
          
    //DESCOMENTAR PARA VER LOS DISTINTOS EJEMPLOS
    
    //En este ejemplo usamos "forma2 para variar los parametros de la función poly, 
    //y así poder hacer que la grilla de poligonos reaccione de manera distinta. 
    
    //EJEMPLO POLY 1 CAMBIAMOS EL TAMAÑO: 
     vec3  fin = vec3(poly(uv_circulos,vec2(0.5,0.5),0.0,forma2,30,time)); 
    
    //EJEMPLO POLY 2 CAMBIAMOS EL ANGULO: 
    //fin = vec3(poly(uv_circulos,vec2(0.5,0.5),0.2,0.1,3,forma2)); 
        
     //EJEMPLO POLY 2 CAMBIAMOS LA POSICION: 
     //fin = vec3(poly(uv_circulos,vec2(forma2*0.2+0.5,0.5),0.1,0.2,3,0.)); 
           
    //EJEMPLO POLY 3 MUESTRA DE COMO CORTA LA PANTALLA :
    //ACLARACION : hay que tener cuidado cuando manejamos una grilla,
    //porque si el elemento que manejamos 
    //toca los bordes de la uv subdivida percibimos el corte.
    //Ese corte si no es intencional puede percibirse como un error,
    //una manera de evitarlo es no 
    //moviendo mucho la posición o si movemos la posición achicar el poligono. 
    //Siempre debemos asegurarnos que la forma no toque la pantalla si queremos evitarlo :
    // fin = vec3(poly(uv_circulos,vec2(forma2*0.2+0.5,0.5),0.2,0.3,3,forma2));
            
    vec3 color = vec3(1.-r,0.5,sin(r*10.)*0.5+0.5);//Creamos un color
    fin*=color; //Lo multiplicamos para que tome ese color.
    
    gl_FragColor = vec4(fin,1.0); 
}