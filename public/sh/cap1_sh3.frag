#ifdef GL_ES
precision mediump float;
#endif

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

// LAS FUNCIONES SIEMPRE SE DECLARAN ARRIBA DEL MAIN.

// Podemos declarar funciones que proximamente vamos a invocar en el main.

// Las funciones pueden devolver variables : 
// Es decir, cuando yo ejecuto esta funcion, la funcion va a devolver un valor, en este caso, el valor que devuelve es el vec3.
// Hago una funcion que me devuelve un valor
vec3 rojopastel(){
    return vec3(0.9,0.55,0.55);
}

// Esta funcion recibe un valor, y utiliza ese valor para devolver otro valor. 
// En este caso, esta función lo que hace es obtener el valor invertido de un vec3.
vec3 invertcolor(vec3 _col1){
    return vec3(1.0-_col1);
}

void main()
{
    vec3 colorfinal = rojopastel();
    // gl_FragColor = vec4(colorfinal,1.0); 
    gl_FragColor = vec4(invertcolor(colorfinal),1.0); 
}