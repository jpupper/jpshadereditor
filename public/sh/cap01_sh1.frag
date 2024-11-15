#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;


void main() {
    // vec4 es un tipo de variable que almacena 4 valores simultaneamente.
    // Estos son Red, Green, Blue y Alpha (rojo,verde,azul y alpha).
    // En este caso no usaremos el alpha por ahora. 
    
    // Segun el valor de 0 a 1 que tenga cada variable del vec4. Sera la cantidad de ese color que tenga. 
        
    // Si descomentamos las siguientes lineas veremos solo ese color. 
    
    // fragColor = vec4(0.0,0.0,0.0,1.0); // BLACK |NEGRO
    // fragColor = vec4(1.0,0.0,0.0,1.0); // RED   |ROJO 
    // fragColor = vec4(0.0,1.0,0.0,1.0); // GREEN |VERDE
    // fragColor = vec4(0.0,0.0,1.0,1.0); // BLUE  |AZUL  
    // fragColor = vec4(1.0,1.0,0.0,1.0); // YELLOW|AMARILLO 
    // fragColor = vec4(1.0,0.0,1.0,1.0); // PINK  |MAGENTA 
    // fragColor = vec4(0.0,1.0,1.0,1.0); // CYAN  |CELESTE 
    // fragColor = vec4(1.0,1.0,1.0,1.0); // WHITE |BLANCO
    
    // También puedo definir variables que : 
    
    gl_FragColor = vec4(1.0,0.5,0.0,1.0); // NARANJA
}