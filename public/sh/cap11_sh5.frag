#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

// DESPLAZAMIENTOS/DEFORMACIONES DE LA FUNCIÓN DE DISTANCIA
// Y COLOREADO VARIABLE DEL OBJETO

// VARIABLES GLOBALES
float det = 0.001;
float maxdist = 30.0;
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

float ground(vec3 p, float y) 
{
    p.y += y;
    return abs(p.y);
}

// FUNCION DE ESTIMACION DE DISTANCIA
float de(vec3 p) 
{
    vec3 pos = p;
    p.xz *= rot(time);
    p.yz *= rot(time);
    float sph = sphere(p, 2.0);
    pos.y += cos(pos.x)*0.3;    
    pos.y += sin(pos.z)*0.3;    
    float pla = ground(pos, 2.0);
    float l = length(sin(p*5.0))*0.2;
    sph -= l;
    float d = min(sph, pla);
    if (d == sph) objcol = mix(vec3(0.5,0.0,0.0), vec3(1.0), smoothstep(0.2,0.3, l));
    if (d == pla) objcol = length(fract(pos.xz)) * vec3(0.0,0.7,0.8);
    return d * 0.7;
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
        col += fract(length(p.xy*0.5)) * vec3(0.1,0.3,0.4);
    }
    return col;    
}

// MAIN
void main(void)
{
    vec2 uv = gl_FragCoord.xy/resolution.xy - 0.5; 
    uv.x *= resolution.x / resolution.y; 
    vec3 from = vec3(0.0, 0.0, -10.0);
    vec3 dir = normalize(vec3(uv, 1.0));
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col, 1.0);
}