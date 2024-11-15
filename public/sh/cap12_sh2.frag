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
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float rama(vec3 p, float r, float l) {
    p.x += sin(p.y)*0.5;
    p.y += l;
    return max(abs(p.y)-l, length(p.xz) - r);
}

float fractal(vec3 p) 
{
    float x = p.x * 0.01;
    p.xz *= rot(time*0.2);
    float d = 1000.0;
    float rd = 1.0;
    float sc = 1.2;
    const int ITERATIONS = 8;
    for (int i=0; i<ITERATIONS; i++)
    {
        d = smin(d, (rama(p, 0.5 / rd, 4.0)) / rd, 0.5);
        p.xz = abs(p.xz);
        p.xy *= rot(-0.4 - x);
        p.yz *= rot(0.5);
        p *= sc;
        rd *= sc;
        p.y -= 10.0/ rd;
    }
    return d * 0.8 + 0.03;
}

float de(vec3 p) 
{
    float fra = fractal(p);
    float sue = p.y + 6.0;
    light1 = length(p - lightpos1)-0.5;
    light2 = length(p - lightpos2)-1.0;
    float d = min(sue,min(fra, min(light1, light2)));
    return d;
}

float ao(vec3 p, vec3 n) {
    float scale=0.2;
    float ao=0.0;
    const int AO_ITERATIONS = 6;
    for(int i=0; i<AO_ITERATIONS; i++ ) {
        float fi = float(i);
        float td=scale*fi*fi;
        float d=de(p+n*td);
        ao+=max(0.0,(td-d)/td);
    }
    return clamp(1.0-ao*0.15,0.0,1.0);
}

float shadow1(vec3 p) {
    vec3 lightdir = normalize(lightpos1 - p);
    float td=0.0,sh=1.0,d=det;
    const int SHADOW_ITERATIONS = 80;
    for (int i=0; i<SHADOW_ITERATIONS; i++) {
        p += lightdir * d;
        d = de(p);
        td += d;
        sh = min(sh, 10.0 * d / td);
        if (sh < 0.001 || light1<det) break;
    }
    if (light1<det) sh = 1.0;
    return clamp(sh, 0.0, 1.0);
}

float shadow2(vec3 p) {
    vec3 lightdir = normalize(lightpos2 - p);
    float td=0.001,sh=1.0,d=det;
    const int SHADOW_ITERATIONS = 80;
    for (int i=0; i<SHADOW_ITERATIONS; i++) {
        p += lightdir * d;
        d = de(p);
        td += d;
        sh = min(sh, 10.0 * d / td);
        if (sh < 0.001 || light2<det) break;
    }
    if (light2<det) sh = 1.0;
    return clamp(sh, 0.0, 1.0);
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
    float fade1 = exp(-0.1 * distance(p, lightpos1));
    float fade2 = exp(-0.07 * distance(p, lightpos2));
    float sh1 = shadow1(p);
    float sh2 = shadow2(p);
    vec3 n = normal(p);
    float aoc = ao(p, n);
    vec3 amb = 0.2 * ao(p, n) * (light1color * fade1 + light2color * fade2);
    vec3 dif1 = max(0.0, dot(lightdir1, n)) * light1color * fade1 * sh1 * 0.8;
    vec3 dif2 = max(0.0, dot(lightdir2, n)) * light2color * fade2 * sh2 * 0.8;
    vec3 ref1 = reflect(lightdir1, n);
    vec3 ref2 = reflect(lightdir2, n);
    vec3 spe1 = pow(max(0.0, dot(ref1, dir)),10.0) * light1color * sh1 *fade1 * 0.7;
    vec3 spe2 = pow(max(0.0, dot(ref2, dir)),10.0) * light2color * sh2 * fade2 * 0.7;
    return amb + dif1 + spe1 + dif2 + spe2;
}

vec3 march(vec3 from, vec3 dir) 
{
    float maxdist = 50.0;
    float totdist = 0.0;
    float d;
    vec3 p;
    vec3 col = vec3(0.0);
    float glow1 = 0.0, glow2 = 0.0;
    const int MARCH_ITERATIONS = 100;
    for (int i=0; i<MARCH_ITERATIONS; i++)
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

void main(void)
{
    vec2 uv = (gl_FragCoord.xy - resolution / 2.0) / resolution.y;
    vec3 from = vec3(0.0, 3.0, -30.0 + sin(time * 0.3) * 15.0);
    vec3 dir = normalize(vec3(uv, 0.7));
    lightpos1 = vec3(sin(time) * 7.0, 5.0+sin(time*2.0), cos(time) * 5.0);
    lightpos2 = vec3(-sin(time * 0.5) * 15.0, 17.0+cos(time)* 3.0, cos(time * 0.5) * 15.0);
    vec3 col = march(from, dir);
    gl_FragColor = vec4(col, 1.0);
}