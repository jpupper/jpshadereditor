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
    
    //Los fors son una estructura repetitiva 
    //que nos permiten hacer una misma operación varias veces. 
    //Eso puede tener varias ventajas cuando queremos
    //correr lineas de codigos con ligeras variaciones pero sin necesidad
    //de volver a escribir todo el codigo. 
    
    //Los fors tienen 3 elementos : 
    
    //-El valor inicial : int i = 0; 
    //-El limite : i<cantidad; 
    //-El aumento : i++
    
    //El valor inicial nos permite indicar que valor tendra i 
    //la primera vez que recorre el bucle.
    
    //El limite nos indica la condicion por la cual se mantendra dentro del bucle
    //En este caso mientras que i sea menor que cantidad. 
    //El aumento nos indica cuanto aumenta i en cada frame.
    
    // NOTA IMPORTANTE: Al adaptar a web, es necesario declarar la cantidad
    // de iteraciones como una constante (const) para que el shader funcione correctamente en web.
    const int cantidad = 5;//Defino la cantidad de iteraciones que tendra mi for
    float amp = 0.2; //Variable para manejar la amplitud de los circulos.
    vec3 fin = vec3(0.0);//Defino un vec3 en el que ire sumando los circulos.
    
    //Todo lo que este dentro de los corchetes del 
    //for es lo que se va a repetir constatemente
    
    for(int i =0; i< cantidad; i++){
        //Aca lo que hago es basicamente hacer la cuenta para obtener que:
        //Cuando i = 0, index = 0. 
        //cuando i = cantidad-1 , index = PI*2.
        //Esta transformación la uso para pasarla como fase a las sinuidales 
        //del movimiento. Esto nos permite hacer que los 5 circulos esten 
        //en distancias exactas y poder cambiar la cantidad y que siga manteniendose
        float index = float(i)*PI*2./float(cantidad); 
        
        vec2 pos = vec2(0.5*fix,0.5);//Defino una posicion 
        
        //genero un vector de movimiento para generar movimiento circular
        //y le agrego el index para que todos se muevan en fase
        vec2 mov = vec2(sin(time+index)*amp,cos(time+index)*amp);
        pos+=mov; // sumo el movimiento a la posicion.
        
        vec2 p = pos - uv; // defino un punto.
        float r = length(p); //obtengo el radio
        
        fin+= smoothstep(0.95,0.99,1.-r); //Sumo el dibujo del circulo a mi vector final
        
        //Cada vez que termina de correr el bucle una vez, 
        //lo vuelve a correr y la variable i aumenta en uno (i++)    
    }
    gl_FragColor = vec4(fin,1.0); 
}