#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

// COPIAR OBJETOS A LO LARGO DE VARIOS EJES

// VARIABLES GLOBALES
float det = 0.001;
float maxdist = 50.0;
const int maxsteps = 150;
vec3 objcol;

// FUNCION DE ROTACION
mat2 rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c,s,-s,c);
}

// FUNCIONES DE DISTANCIA PRIMITIVAS 
float sphere(vec3 p, float rad) 
{
    return length(p) - rad;
}

float box(vec3 p, vec3 c)
{
    p=abs(p)-c;
    return length(max(p,0.0))+min(0.0,max(p.z,max(p.x,p.y)));
}

float ground(vec3 p, float y) 
{
    p.y += y;
    return abs(p.y);
}

// FUNCION DE ESTIMACION DE DISTANCIA
float de(vec3 p) 
{
    vec3 pos = p;
    p.xz = mod(p.xz, 8.0) - 4.0;
    float box = box(p, vec3(0.3,2.0,0.3));
    float pla = ground(pos, 2.0);
    float d = min(box, pla);
    p = abs(p * 3.0);
    float c = pow(max(max(fract(p.x),fract(p.y)), fract(p.z)),10.0);
    float b = pow(max(fract(p.x),fract(p.z)),10.0);
    if (d==box) objcol=vec3(0.5,0.0,0.1)+c;
    if (d==pla) objcol=vec3(0.0,0.5,0.6)+b;
    return d;
}

// FUNCION NORMAL
vec3 normal(vec3 p) 
{   
    vec2 d = vec2(0.0, det);
    return normalize(vec3(de(p + d.yxx), de(p + d.xyx), de(p + d.xxy)) - de(p));
}

// FUNCION SHADOW
float shadow(vec3 p, vec3 ldir) {
    float td=0.001,sh=1.0,d=det;
    for (int i=0; i<100; i++) {
        p+=ldir*d;
        d=de(p);
        td+=d;
        sh=min(sh,10.0*d/td);
        if (sh<0.001) break;
    }
    return clamp(sh,0.0,1.0);
}

// FUNCION SHADE
vec3 shade(vec3 p, vec3 dir) {
    vec3 col = objcol;
    vec3 lightdir = normalize(vec3(1.5, 2.0, -1.0)); 
    vec3 n = normal(p);
    float sh = shadow(p, lightdir);    
    float diff = max(0.0, dot(lightdir, n)) * sh;
    vec3 refl = reflect(dir, n);
    float spec = pow(max(0.0, dot(lightdir, refl)), 20.0) * sh;
    float amb = 0.1;
    return col*(amb + diff) + spec * 0.7;
}

// FUNCION DE RAYMARCHING
vec3 march(vec3 from, vec3 dir) 
{
    float d, td=0.0;
    vec3 p, col;

    for (int i=0; i<maxsteps; i++) 
    {
        p = from + td * dir;
        d = de(p);
        if (d < det || td > maxdist) break;
        td += d;
    }

    if (d < det)
    {
        p -= det * dir;
        col = shade(p, dir);
    } else {
        td = maxdist;
    }
    col = mix(vec3(0.7),col, exp(-0.002*td*td));
    return col;    
}

// MAIN
void main(void)
{
    vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5; 
    uv.x *= resolution.x / resolution.y; 
    vec3 from = vec3(0.0, 0.0,-2.0);
    vec3 dir = normalize(vec3(uv, 1.0));
    from.xz *= rot(time*0.3);
    dir.xz *= rot(time*0.3);
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col, 1.0);
}