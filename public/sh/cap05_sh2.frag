#ifdef GL_ES
precision mediump float;
#endif

//5.1
//translate rotate scale
//rotate y scale

//Taller de Livecoding con visuales en GLSL 4.0 

//Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359

mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas

    float fix = resolution.x/resolution.y; 
    uv.x*=fix;
    
    //scale es una función que devuelve un mat2,
    //mat2 es un tipo de variable que nos permite hacer operaciones matriciales complejas
    //No importa mucho eso. Lo importante es aprender la sintaxis de como funciona.
    
    float oscilator = sin(time)*0.3+0.8;
    //Los pasos para que funcione el scale o rotate son : 
    //trasladar las coordenadas -0.5
    //Utilizar la función scale como esta resuelta aqui: 
    //Volver a trasladar las coordenadas 0.5
    //-Nota : fijarse que si usamos el fix, tenemos que multiplicar.
    
    //APLICO UN SCALE
    uv-=vec2(0.5*fix,0.5);
    uv = scale(vec2(oscilator))*uv;
    uv+=vec2(0.5*fix,0.5);
    
    //APLICO ROTATE.
    uv-=vec2(0.5*fix,0.5);
    uv = rotate2d(time*0.2)*uv;
    uv+=vec2(0.5*fix,0.5);
    
    //EN EL P también lo tengo que multiplicar por el fix.
    vec2 p = vec2(0.5*fix,0.5) - uv; //Genero un punto en el espacio(en este caso en el medio.
    float r = length(p);  //Obtengo el radio
    float a = atan(p.x,p.y);//obtengo el angulo.
    float mof = sin(a*5.+time)*0.05 ;
    float e = smoothstep(0.88,0.9,(1.-r)+mof);
          
         // e = sin(uv.x*20.+sin(uv.y*20.+time*2.)); //Descomentar para ver como actua con este patron.
     
    vec3 fin = vec3(e);
         fin = vec3(sin(uv.x*20.+sin(uv.y*20.+time*2.)));
         //fin = vec3(uv.x,uv.y,1.0);
    gl_FragColor = vec4(fin,1.0); 
}