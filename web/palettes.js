export const PALETTES=[
  {name:'Opal',a:[.12,.55,1.],b:[.70,.38,1.],c:[.30,.95,1.],power:.85},
  {name:'Aurora',a:[1.,.035,.25],b:[.08,.85,.72],c:[.55,.03,1.],power:1.},
  {name:'Prism',a:[1.,.42,.66],b:[.24,.76,1.],c:[1.,.82,.42],power:.9},
  {name:'Abyss',a:[.015,.07,.38],b:[.025,.45,.65],c:[.28,.025,.60],power:.8}
];
export function createPaletteUniforms(THREE){return {uColorA:{value:new THREE.Vector3()},uColorB:{value:new THREE.Vector3()},uColorC:{value:new THREE.Vector3()},uPalettePower:{value:1},uHueShift:{value:0},uColorSaturation:{value:1},uColorGain:{value:1},uPalettePhase:{value:0},uDynamicHue:{value:0},uDynamicGain:{value:1}};}
const srgbToLinear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const linearToSrgb=x=>x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055;
export function paletteHex(index){const p=PALETTES[Math.max(0,Math.min(3,index))];return [p.a,p.b,p.c].map(rgb=>'#'+rgb.map(x=>Math.round(Math.max(0,Math.min(1,linearToSrgb(x)))*255).toString(16).padStart(2,'0')).join(''));}
export function applyPalette(uniforms,index,customColors=null,hue=0,saturation=1,gain=1){
  const p=PALETTES[Math.max(0,Math.min(3,Math.round(Number(index)||0)))];
  const colors=Array.isArray(customColors)&&customColors.length===3&&customColors.every(x=>/^#[0-9a-f]{6}$/i.test(x))?customColors.map(hex=>[1,3,5].map(i=>srgbToLinear(parseInt(hex.slice(i,i+2),16)/255))):[p.a,p.b,p.c];
  for(const [i,key] of ['uColorA','uColorB','uColorC'].entries())uniforms[key].value.set(...colors[i]);
  uniforms.uPalettePower.value=customColors?1:p.power;uniforms.uHueShift.value=hue*Math.PI/180;uniforms.uColorSaturation.value=saturation;uniforms.uColorGain.value=gain;
}
export const paletteGLSL=`
  uniform vec3 uColorA,uColorB,uColorC;uniform float uPalettePower,uHueShift,uColorSaturation,uColorGain,uPalettePhase,uDynamicHue,uDynamicGain;
  vec3 tuneColor(vec3 c){
    vec3 axis=normalize(vec3(1.));float a=uHueShift+uDynamicHue;
    c=c*cos(a)+cross(axis,c)*sin(a)+axis*dot(axis,c)*(1.-cos(a));
    float l=dot(c,vec3(.2126,.7152,.0722));
    return max(vec3(0.),mix(vec3(l),c,uColorSaturation))*uColorGain*uDynamicGain*uPalettePower;
  }
  vec3 paletteColor(float seed){
    float t=fract(seed+uPalettePhase)*3.;
    if(t<1.)return tuneColor(mix(uColorA,uColorB,smoothstep(0.,1.,t)));
    if(t<2.)return tuneColor(mix(uColorB,uColorC,smoothstep(0.,1.,t-1.)));
    return tuneColor(mix(uColorC,uColorA,smoothstep(0.,1.,t-2.)));
  }`;
