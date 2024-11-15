#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

// VARIABLES GLOBALES
float det = 0.001;
vec3 lightpos1, lightpos2;
float light1, light2;
vec3 light1color = vec3(2.0,1.0,0.0);
vec3 light2color = vec3(0.0,1.0,2.0);

mat2 rot(float a) 
{
    float s=sin(a), c=cos(a);
    return mat2(c,s,-s,c);
}

float sdOctahedron( vec3 p, float s)
{
  p = abs(p);
  return (p.x+p.y+p.z-s)*0.57735027;
}

float de(vec3 p) 
{
    light1 = length(p - lightpos1) - 0.1;
    light2 = length(p - lightpos2) - 0.1;
    p.yz *= rot(time * 0.7);
    p.xz *= rot(time * 0.5);
    float oct = max(sdOctahedron(p, 5.0), -length(p)+3.3);
    float d = min(oct, min(light1, light2));
    return d;
}

vec3 normal(vec3 p) 
{
    vec2 d = vec2(0.0, det);
    return normalize(vec3(de(p+d.yxx), de(p+d.xyx), de(p+d.xxy)) - de(p));
}

vec3 shade(vec3 p, vec3 dir)
{
    if (light1 < det) return light1color;
    if (light2 < det) return light2color;
    vec3 lightdir1 = normalize(lightpos1 - p);
    vec3 lightdir2 = normalize(lightpos2 - p);
    float fade1 = exp(-0.2 * distance(p, lightpos1));
    float fade2 = exp(-0.2 * distance(p, lightpos2));
    vec3 n = normal(p);
    float amb = 0.05;
    vec3 dif1 = max(0.0, dot(lightdir1, n)) * light1color * fade1 * 0.7;
    vec3 dif2 = max(0.0, dot(lightdir2, n)) * light2color * fade2 * 0.7;
    vec3 ref1 = reflect(lightdir1, n);
    vec3 ref2 = reflect(lightdir2, n);
    vec3 spe1 = pow(max(0.0, dot(ref1, dir)),10.0) * light1color * fade1;
    vec3 spe2 = pow(max(0.0, dot(ref2, dir)),10.0) * light2color * fade2;
    return amb + dif1 + spe1 + dif2 + spe2;
}

vec3 march(vec3 from, vec3 dir) 
{
    float maxdist = 50.0;
    float totdist = 0.0;
    const int steps = 100;
    float d;
    vec3 p;
    vec3 col = vec3(0.0);
    float glow1 = 0.0, glow2 = 0.0;
    float glowgeneral = 0.0;
    for (int i=0; i<steps; i++)
    {
        p = from + totdist * dir;
        d = de(p);
        if (d < det || totdist > maxdist) break;
        totdist += d;
        glow1 = max(glow1, 1.0 - light1);
        glow2 = max(glow2, 1.0 - light2);
        glowgeneral++;
    }
    if (d < det) 
    {
        col = shade(p, dir);
    }
    col += pow(glow1, 5.0) * light1color;
    col += pow(glow2, 5.0) * light2color;
    col += glowgeneral * glowgeneral * 0.0002;
    return col;
}

void main(void)
{
    vec2 uv = (gl_FragCoord.xy - resolution / 2.0) / resolution.y;
    vec3 from = vec3(0.0, 0.0, -25.0);
    vec3 dir = normalize(vec3(uv, 1.5));
    lightpos1 = vec3(sin(time) * 8.0, sin(time * 2.0), cos(time) * 8.0);
    lightpos2 = -lightpos1.yxz;
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col, 1.0);
}