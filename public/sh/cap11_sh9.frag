#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

float det = 0.001;
float maxdist = 60.0;
const int maxsteps = 100;
vec3 objcolor;
vec3 lightdir = normalize(vec3(1.0,1.0,-2.0));

// funcion de rotacion
mat2 rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c,s,-s,c);
}

// hash (random)
float hash(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// funcion noise
float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// funcion de distancia a un ciclindro (h alto, r radio)
float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(h,r);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

// funcion de distancia a una caja (c.xyz son las dimensiones)
float sdBox(vec3 p, vec3 c) {
    vec3 q = abs(p) - c;
    return length(max(vec3(0.0), q));
}

// "tilear" el espacio radialmente (cant = cantidad de copias, offset = distancia desde el centro)
// recibe p y lo devuelve transformado. p debe ser un vec2, por ejemplo p.xz, p.xy
void radialCopy(inout vec2 p, float cant, float offset) 
{
    float d = 3.1416 / cant * 2.0;
    float at = atan(p.y, p.x);
    float a = mod(at, d) - d * 0.5;
    p = vec2(cos(a), sin(a)) * length(p) - vec2(offset,0.0);
}

// funcion de distancia a un engranaje
float engranaje(vec3 p)
{
    float d = sdCappedCylinder(p, 5.0, 0.4) - 0.1;
    d = max(d, -length(p.xz)+1.0);
    vec3 p2 = p;
    radialCopy(p2.xz, 5.0, 3.0);
    d = max(d, -length(p2.xz)+1.5);
    vec3 p3 = p;
    radialCopy(p3.xz, 15.0, 5.3);
    d = min(d, sdBox(p3, vec3(0.5, 0.3, 0.5))) - 0.1;
    return d;
}

// funcion de distancia principal
float de(vec3 p) {
    float piso = p.y+7.0;
    p.yz *= rot(-1.3);
    vec3 p1 = p;
    p1.x-= 5.5;
    p1.xz *= rot(time);
    float engranaje1 = engranaje(p1);
    vec3 p2 = p;
    p2.x+=5.5;
    p2.xz *= rot(-time);
    float engranaje2 = engranaje(p2);
    float d = min(engranaje1, engranaje2);
    d=min(d,piso);
    if (d==engranaje1) objcolor = vec3(1.0,1.0,0.0) - noise(p1.xz*30.0) * 0.5; 
    if (d==engranaje2) objcolor = vec3(0.0,1.0,1.0) - noise(p2.xz*30.0) * 0.5;
    if (d==piso) objcolor = vec3(1.0);
    return d;
}

// funcion calculo de normal
vec3 normal(vec3 p) {
    vec2 d = vec2(0.0,det);
    return normalize(vec3(de(p+d.yxx),de(p+d.xyx),de(p+d.xxy))-de(p));
}

// funcion de proyección de sombras
float shadow(vec3 p, vec3 ldir) {
    float soft = 20.0;
    float td=0.0,sh=1.0,d=det;
    for (int i=0; i<50; i++) {
        p+=ldir*d;
        d=de(p);
        td+=d;
        sh=min(sh,soft*d/td);
        if (sh<0.01) break;
    }
    return clamp(sh,0.0,1.0);
}

// funcion de shading
vec3 shade(vec3 p, vec3 dir) {
    vec3 col = objcolor;
    vec3 n = normal(p);
    float sh = shadow(p, lightdir);
    float amb = 0.1;
    float dif = max(0.0,dot(lightdir,n)) * 0.5 * sh;
    vec3 ref = reflect(lightdir,n);
    float spe = pow(max(0.0,dot(ref,dir)),30.0) * 0.7 * sh;
    return col*(dif+amb)+spe;
}

// funcion de raymarching
vec3 march(vec3 from, vec3 dir) {
    vec3 p, col=vec3(0.0);
    float d, totdist=0.0;
    for (int i=0; i<maxsteps; i++) {
        p = from + totdist * dir;
        d = de(p);
        totdist += d;
        if (totdist > maxdist || d < det) break;
    }
    if (d < det) {
        p-= det*dir;
        col=shade(p, dir);
    } else {
        p = 30.0 * dir;
        col = pow(max(0.0,dot(dir,lightdir)),100.0) * vec3(1.5);
        col += min(fract(p.x),fract(p.y))*0.3*smoothstep(0.0,20.0,p.z);
    }
    return col;
}

// funcion lookat
mat3 lookat(vec3 dir, vec3 up) {
    dir = normalize(dir); 
    vec3 rt = normalize(cross(dir, up));
    return mat3(rt, cross(rt, dir), dir);
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution - 0.5;
    uv.x*=resolution.x/resolution.y;
    
    vec3 from = vec3(sin(time*0.3) * 5.0, 0.0, cos(time*0.3) *30.0);
    vec3 target = vec3(5.0,0.0,0.0);
    vec3 camdir = normalize(target-from);
    vec3 dir = normalize(vec3(uv, 1.0));
    dir = lookat(camdir, vec3(0.0,1.0,0.0))* dir;
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col,1.0);
}