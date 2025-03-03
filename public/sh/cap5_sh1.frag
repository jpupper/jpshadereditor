#ifdef GL_ES
precision mediump float;
#endif

//Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    //Como en realidad nosotros siempre estamos trabajando con la totalidad de las coordenadas y utilizando
    //todas las uv y no usando una forma. Con simplemente agregarle variables a las uv podemos desplazarlas para generar movimiento.
  
    float fix = resolution.x/resolution.y; 
    uv.x*=fix;
    
    
    vec2 mov = vec2(sin(time)*0.2,cos(time)*0.2); //Movimiento circular simple.
         //mov = vec2(sin(time*2.)*0.2,cos(time)*0.2); //Como multiplico x2 entonces se mueve 2 veces antes de dar la vuelta
         //mov = vec2(sin(time*2.)*0.5,cos(time*8.)*0.4);
  
     
     uv+=mov;//Le agrego el movimiento a las uv 
     
    //EN EL P también lo tengo que multiplicar por el fix.
    vec2 p = vec2(0.5*fix,0.5) - uv; //Genero un punto en el espacio(en este caso en el medio.
    float r = length(p);  //Obtengo el radio
    float a = atan(p.x,p.y);//obtengo el angulo.
    float mof = sin(a*5.+time)*0.05 ;
    float e = smoothstep(0.88,0.9,(1.-r)+mof);
          
    gl_FragColor = vec4(vec3(e),1.0); 
}