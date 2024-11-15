#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

// RESTAR UN OBJETO A OTRO

// VARIABLES GLOBALES
float det = 0.001;
float maxdist = 30.0;
const int maxsteps = 100;
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

float obj1(vec3 p) 
{
    float box = box(p, vec3(1.0));
    float sph = sphere(p, 1.3);
    float d = max(sph, box);
    return d;
}

float obj2(vec3 p) 
{
    float box = box(p, vec3(2.0));
    float sph = sphere(p, 2.5);
    float d = max(-sph, box);
    return d;
}

// FUNCION DE ESTIMACION DE DISTANCIA
float de(vec3 p) 
{
    p.xz *= rot(time);
    p.yz *= rot(time);
    float obj2 = obj2(p);
    p.xy *= rot(time*2.0);
    p=abs(p);
    p -= 3.0;
    float obj1 = obj1(p);
    float d = min(obj1, obj2);
    if (d == obj2) objcol = vec3(0.0, 0.0, 1.0);
    if (d == obj1) objcol = vec3(1.0, 1.0, 0.0);
    return d;
}

// FUNCION NORMAL
vec3 normal(vec3 p) 
{   
    vec2 d = vec2(0.0, det);
    return normalize(vec3(de(p + d.yxx), de(p + d.xyx), de(p + d.xxy)) - de(p));
}

// FUNCION SHADE
vec3 shade(vec3 p, vec3 dir) {
    vec3 lightdir = normalize(vec3(1.5, 1.0, -1.0)); 
    vec3 col = objcol;
    vec3 n = normal(p);
    float diff = max(0.0, dot(lightdir, n));
    vec3 refl = reflect(dir, n);
    float spec = pow(max(0.0, dot(lightdir, refl)), 20.0);
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
    }
    else 
    {
        p = from + maxdist * dir;
        col += sin(p*2.0)*0.2;
    }
    return col;    
}

// MAIN
void main(void)
{
    vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5; 
    uv.x *= resolution.x / resolution.y; 
    vec3 from = vec3(0.0, 0.0, -15.0);
    vec3 dir = normalize(vec3(uv, 1.0));
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col, 1.0);
}