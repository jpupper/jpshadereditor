#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

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

void radialCopy(inout vec2 p, float cant, float offset) 
{
    float d = 3.1416 / cant * 2.0;
    float at = atan(p.y, p.x);
    float a = mod(at, d) - d * 0.5;
    p = vec2(cos(a), sin(a)) * length(p) - vec2(offset,0.0);
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

vec3 path(float t) 
{
    vec3 p = vec3(sin(t * 0.1), cos(t * 0.2), t);
    p.xy += cos(t*0.1) * 5.0;
    return p;
}

float de(vec3 p) 
{
    light1 = length(p - lightpos1) - 0.1;
    light2 = length(p - lightpos2) - 0.1;
    p.xy -= path(p.z).xy;
    vec3 p2 = p;
    float id = floor(p2.z);
    p2.xy *= rot(sin(id + time));
    radialCopy(p2.xy, 15.0, 2.0);
    p2.z = fract(p2.z) - 0.5;
    float ring1 = sdRoundBox(p2, vec3(0.1,0.35,0.3), 0.1);
    float d = min(ring1, min(light1, light2));
    return d;
}

vec3 normal(vec3 p) 
{
    vec2 d = vec2(0.0, det);
    return normalize(vec3(de(p+d.yxx), de(p+d.xyx), de(p+d.xxy)) - de(p));
}

vec3 shade(vec3 p, vec3 dir)
{
    if (light1<det) return light1color;
    if (light2<det) return light2color;
    vec3 lightdir1 = normalize(lightpos1 - p);
    vec3 lightdir2 = normalize(lightpos2 - p);
    float fade1 = exp(-0.2 * distance(p, lightpos1));
    float fade2 = exp(-0.2 * distance(p, lightpos2));
    vec3 n = normal(p);
    vec3 dif1 = max(0.0, dot(lightdir1, n)) * light1color * fade1 * 0.7;
    vec3 dif2 = max(0.0, dot(lightdir2, n)) * light2color * fade2 * 0.7;
    vec3 ref1 = reflect(lightdir1, n);
    vec3 ref2 = reflect(lightdir2, n);
    vec3 spe1 = pow(max(0.0, dot(ref1, dir)),10.0) * light1color * fade1;
    vec3 spe2 = pow(max(0.0, dot(ref2, dir)),10.0) * light2color * fade2;
    return dif1 + spe1 + dif2 + spe2;
}

vec3 march(vec3 from, vec3 dir) 
{
    float maxdist = 100.0;
    float totdist = 0.0;
    float d;
    vec3 p;
    vec3 col = vec3(0.0);
    float glow1 = 0.0, glow2 = 0.0;
    const int MARCH_STEPS = 200;
    for (int i=0; i<MARCH_STEPS; i++)
    {
        p = from + totdist * dir;
        d = de(p);
        if (d < det || totdist > maxdist) break;
        totdist += d;
        glow1 = max(glow1, 1.0 - light1);
        glow2 = max(glow2, 1.0 - light2);
    }
    if (d < det) 
    {
        col = shade(p, dir);
    }
    col += pow(glow1, 5.0) * light1color;
    col += pow(glow2, 5.0) * light2color;
    return col;
}

mat3 lookat(vec3 dir, vec3 up) 
{
    dir = normalize(dir);
    vec3 rt = normalize(cross(dir, up));
    return mat3(rt, cross(rt, dir), dir);
}

void main(void)
{
    vec2 uv = (gl_FragCoord.xy - resolution / 2.0) / resolution.y;
    float t = time * 4.0; 
    vec3 from = path(t);
    vec3 adv = path(t + 1.0);
    vec3 look = normalize(adv - from);
    vec3 dir = normalize(vec3(uv, 1.0));
    dir = lookat(look, vec3(0.0, 1.0, 0.0)) * dir;
    lightpos1 = path(t + 5.0 * (1.0 + sin(time / 2.0))) + vec3(sin(time) * 1.0, cos(time) * 1.0, 0.0); 
    lightpos2 = path(t + 15.0) + vec3(-sin(time) * 1.0, cos(time) * 1.0, 0.0);
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col, 1.0);
}