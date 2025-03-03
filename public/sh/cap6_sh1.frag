#ifdef GL_ES
precision mediump float;
#endif

//6.2
//Fracts
//Intro de la funcion fract

//Taller de Livecoding con visuales en GLSL 4.0 

//Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;

    //Obtiene la parte decimal de una variable
    //La funcion fract lo que hace es siempre transformar los valores mayores a 1 a 0.1. 
    
    //Veamos el siguiente caso : 
    //habiamos establecido que uv.x es una variable que va de 0 a 1, de izquierda a derecha. 
    //Si yo ese valor lo multiplico por 10 entonces ira de 0 a 10. 
    
    //La funcion fract lo que hace es : 
    //-Si el valor es 1.1 transformarlo en 0.1, 
    //-Si el valor es 2.4 lo transforma en 0.4.
    
    //Entonces como podemos ver en el dibujo, lo que esta sucediendo es que cuando el valor llega a 1.1, lo transforma a 0.1.

    vec3 fin = vec3(fract(uv.x*10.));
      
    gl_FragColor = vec4(fin,1.0); 
}