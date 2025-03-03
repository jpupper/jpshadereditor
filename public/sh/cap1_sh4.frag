#ifdef GL_ES
precision mediump float;
#endif

// Variables uniform para manejar la interfaz
uniform float time;
uniform vec2 resolution;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution; // De esta manera obtenemos las coordenadas cartesianas
    // La variable uv tendra en su componente X (es decir el primer componente del vector).
    //                       y su componente Y (es decir el segundo componente del vector).
       
    // vec3 color = vec3(uv.y,0.0,0.0); // De mas brillante a menos brillante en Y segun el valor del pixel  
    // vec3 color = vec3(0.0,uv.x,0.0); // De mas brillante a menos brillante en X segun el valor del pixel  
    vec3 color = vec3(uv.x,0.2,uv.y); // De mas brillante a menos brillante en X e Y segun el valor del pixel  
    // vec3 color = vec3(1.-uv.x,0.0,0.0); // Invertimos la coordenada en X 
    // vec3 color = vec3(1.-uv.y,1.-uv.y,0.0); // Invertimos la coordenada en Y
    // vec3 color = vec3(uv,0.8); // Aca directamente mandamos las UV (un vec2 y sumamos otro numero mas para así tener las 3 componentes).
    gl_FragColor = vec4(color,1.0); 
}