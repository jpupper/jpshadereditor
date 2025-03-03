#ifdef GL_ES
precision mediump float;
#endif

//8.1
//Feedback
//Sumar feedback.

//Taller de Livecoding con visuales en GLSL 4.0 

uniform float time;
uniform vec2 resolution;

//Declaración del uniform de feedback.
uniform sampler2D backbuffer; // Esto reemplaza a prevFrame

//FUNCIONES SACADAS DE https://thebookofshaders.com/06/: 
//esta es para transformar si pensamos un color en hsb a rgb, nunca lo use.
vec3 rgb2hsb( in vec3 c ){
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
                 vec4(c.gb, K.xy),
                 step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
                 vec4(c.r, p.yzx),
                 step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                d / (q.x + e),
                q.x);
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void){
    vec2 uv = gl_FragCoord.xy / resolution;
    
    //La tecnica de "feedback" consiste en la mezcla entre el frame anterior y el frame actual.
    //Es decir, la imagen que se genero un frame anterior antes de que se genere una nueva.
    
    //Para obtener el feedback es necesario acceder a la uniform sampler2D. 
    //sampler2D es un tipo de variable de GLSL utilizada para manejar texturas.
    
    //Para transformar de sampler2D a un vec4 es necesaria esta operacion : 
    vec4 feedback = texture2D(backbuffer, uv);
    //La función texture recibe como parametro el sampler2D y las coordenadas uv. 
    
    //Defino la forma: 
    float e = sin(uv.x*100.0+time*10.0);
          //e = smoothstep(0.95,0.98,1.-length(vec2(0.5+sin(time)*0.1,0.5+cos(time)*0.1)-uv)); //Circulo en una sola linea.
          e = smoothstep(0.88,0.88,1.-length(vec2(0.5+sin(time*0.5)*0.4,0.5+cos(time*4.0)*0.4)-uv)); //Circulo sin degrade
          
    //Vamos a crear un dibujo en que constantemente vaya cambiando el tono.
    vec3 dib = vec3(e) * hsb2rgb(vec3(sin(time)*0.5+0.5,0.8,1.0)); 
          
    //Feedback sumado :  
    //El problema con sumarla es que corro el riesgo de que se me sature la imagen
    //Entonces tengo la opcion de ponerle menos feedback o si no de multiplicar el dibujo por un menor valor para 
    //equilibrarlo. Es importante comprender que el feedback cuando lo sumo siempre tiene que estar multiplicado por 
    //Valores menores a 1.0 porque si no la imagen se quemara. 
    
    vec3  fin = dib;
    
         //fin = dib + feedback.rgb*0.99; //opcion 1.A (imagen semiquemada).
         //fin = dib*0.04 + feedback.rgb*0.96;
         
         //feedback.rgb = smoothstep(0.01,0.99,feedback.rgb);
         fin = mix(feedback.rgb*0.97,dib,dib);
         
         float limit = 0.07;
         if(fin.r < limit){
         fin.r = 0.0;
         }
         if(fin.g < limit){
         fin.g = 0.0;
         }
         if(fin.b < limit){
         fin.b = 0.0;
         }
         
         
         
         //opcion 1.B(El feedback es el mismo, 
         //el dibujo esta multiplicado * 0.1).
         //fin = dib + feedback.rgb*0.6;
         //opcion 1.C(multiplico el feedback por un menor valor).
        
       // fin = smoothstep(0.1,0.9,fin);
    gl_FragColor = vec4(fin,1.0);
}