#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

// RAYMARCHING BASICO DE UNA ESFERA

// VARIABLES GLOBALES
float det = 0.001;
float maxdist = 30.0;
const int maxsteps = 100;

// FUNCIONES DE DISTANCIA PRIMITIVAS 
float sphere(vec3 p, float rad) 
{
    return length(p) - rad;
}

// FUNCION DE ESTIMACION DE DISTANCIA
float de(vec3 p) 
{
    float d = sphere(p, 3.0);
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
    vec3 col = vec3(0.0, 0.0 , 1.0);
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
        p -= dir * det;
        col = shade(p, dir);
    }
    else
    {
        col = mod(gl_FragCoord.y,10.0)*vec3(0.04,0.0,0.0);
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