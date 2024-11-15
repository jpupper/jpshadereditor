#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

float maxdist=50.0;
float det=0.001;
vec3 objcol;

mat2 rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c,s,-s,c);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float box(vec3 p, vec3 c)
{
    vec3 z=abs(p)-c;
    return length(max(vec3(0.0),z))+min(0.0,max(max(z.z,z.x),z.y));
}

float de(vec3 p) {
    p.xz*=rot(time*0.5);
    p.yz*=rot(time*0.5);
    float sph1 = length(p+vec3(sin(time*0.5)*10.0,0.0,0.0))-2.0;
    float sph2 = length(p-vec3(0.0,0.0,cos(time*0.5)*10.0))-2.0;
    float sph3 = length(p-vec3(0.0,sin(time*0.5)*8.0,cos(time*0.25)*8.0))-2.0;
    vec3 p2=p;
    p2.yz*=rot(time*0.1);
    p2.xy*=rot(time*0.1);
    float box1 = box(p2, vec3(3.0));
    float d = min(min(sph1, sph2),sph3);
    d=smin(d,box1,0.5);
    if (abs(d-sph1)<1.0) objcol=vec3(1.0,0.0,0.0);
    if (abs(d-sph2)<1.0) objcol=vec3(0.0,1.0,0.0);
    if (abs(d-sph3)<1.0) objcol=vec3(0.0,0.0,1.0);
    if (abs(d-box1)<1.0) objcol=0.4+pow(length(sin(p2*6.0))*0.7,20.0)*vec3(0.6,0.4,0.3);
    return d;
}

vec3 normal(vec3 p)
{
    vec2 d=vec2(0.0,det);
    return normalize(vec3(de(p+d.yxx),de(p+d.xyx),de(p+d.xxy))-de(p));
}

vec3 shade(vec3 p, vec3 dir) {
    vec3 n=normal(p);
    vec3 lightdir = normalize(vec3(3.0,1.0,-1.0));
    float amb = 0.1;
    float dif=max(0.0,dot(lightdir, n))*0.7;
    vec3 ref = reflect(lightdir, n);
    float spe = pow(max(0.0,dot(dir,ref)),30.0)*0.7;
    return objcol*(amb+dif)+spe;
}

vec3 march(vec3 from, vec3 dir)
{
    vec3 p, col=vec3(0.0);
    float totdist=0.0, d;
    for (int i=0; i<100; i++) 
    {
        p=from+dir*totdist;
        d=de(p);
        if (d<det || totdist>maxdist) break;
        totdist+=d;
    }
    if (d<det) {
        p-=det*dir;
        col=shade(p,dir);
    } 
    return col;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy/resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= resolution.x/resolution.y;
    vec3 dir = normalize(vec3(uv,3.0));
    vec3 from = vec3(0.0,0.0,-30.0);
    vec3 c=march(from,dir);
    gl_FragColor = vec4(c,1.0);
}