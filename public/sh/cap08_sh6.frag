#ifdef GL_ES
precision mediump float;
#endif

//8.2
//Feedback
//Operaciones matriciales sobre las uv del feedback : 

//Taller de Livecoding con visuales en GLSL 4.0 

uniform float time;
uniform vec2 resolution;
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

#define PI 3.14159265359
#define TWO_PI PI*2.0
mat2 scale(vec2 _scale){
    return mat2(_scale.x,0.0,
                0.0,_scale.y);
}
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

//LIMIT AND DEC  : 
vec3 limitanddec(vec3 col, vec3 limit, vec3 dec){
    if(col.r > limit.r){
        col.r -=dec.r;
    }

    if(col.g > limit.g){
        col.g -=dec.g;
    }
    if(col.b > limit.b){
        col.b -=dec.b;
    }

    return col;
}

void main(void){
    vec2 uv = gl_FragCoord.xy / resolution;
        
    //Variable de forma que utilizare para modificar las transformaciones del feedback : 
     
    vec4 feedback = texture2D(backbuffer,uv);
    
    //Hago un vector para manejar el movimiento : 
    vec2 mov = vec2(sin(time*0.5)*0.4,cos(time*4.0)*0.4); //Movimiento complejo
         //mov = vec2(sin(time*4.0)*0.2,cos(time*4.0)*0.2); //Movimiento circular
         mov = vec2(sin(time*4.0)*0.4,cos(time*0.5)*0.4);
    
    //Defino la forma: 
    float e = sin(uv.x*100.0+time*10.0);
          e = smoothstep(0.88,0.90,1.-length(vec2(0.5)+mov-uv)); //Circulo en una sola linea.
          //e = smoothstep(0.88,0.88,1.-length(vec2(0.5)+mov-uv)); //Circulo sin degrade
           
    //Defino el dibujo (color y forma). 
    vec3 dib = vec3(e) ; 
    

    //Feedback mix
    
    vec3  fin = dib;
            
    float forma2 = sin(uv.x*20.0*PI+time
                        +sin(uv.y*1.0*PI+time
                        +sin(uv.x*10.0*PI-time 
                        +sin(uv.y*20.0*PI-time
                        +sin(uv.x*10.0*PI-time
                        +sin(uv.y*10.0*PI-time)
                        +sin(uv.x*10.0*PI-time))))))*0.5+0.5;
     
     vec3 col = vec3(sin(uv.x*30000.0+time)*0.5+0.5,cos(uv.y*300.0+time)*0.5+0.5,0.5);
     
     vec3 fbmodifier = vec3(forma2) * col;
     
     
     //Otro truco que podemos utilizar para el feedback es multiplicar la cantidad de feedback por otro dibujo. 
     //En este caso "fbmodifier" es otra visual que tenemos , y el circulo pinta su feedback en relación a eso.
     //Y genera este efecto. 
     
     //Este efecto es particularmente util con imagenes y videos en donde queremos hacer como una especie de 
     //"mascara" que permita descubrir la imagen de atras". 
     
     
     
     
     fin = dib + (feedback.rgb*1.2*(fbmodifier));
      
      
     //Pruebas de lo mismo pero utilizando mix : 
     //fin = mix(feedback.rgb,dib,dib*fbmodifier);
     //fin = mix(feedback.rgb,dib*fbmodifier,dib);
    
    gl_FragColor = vec4(fin,1.0);
}