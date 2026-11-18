import {PALETTES,paletteHex} from './palettes.js';

export const STAR_PALETTES=PALETTES.map((palette,index)=>({name:palette.name,value:index,colors:paletteHex(index)}));

// Additional controls; the established count, size, drift and depth controls stay intact.
export const BACKGROUND_CONTROLS={
  starHue:{label:'Star hue',min:-180,max:180,value:0,scale:1,unit:'°',group:'stars'},
  starSaturation:{label:'Star saturation',min:0,max:2,value:1,scale:100,group:'stars'},
  starSpread:{label:'Field spread',min:.5,max:2,value:1,scale:100,group:'stars'},
  starTwinkleSpeed:{label:'Twinkle speed',min:0,max:3,value:1,scale:100,group:'stars'},
  starSoftness:{label:'Star softness',min:0,max:1,value:.65,scale:100,group:'stars'},
  starColorSpeed:{label:'Color drift',min:0,max:2,value:0,scale:100,group:'stars'}
};

const established={
  starField:[.35,0,1],starCount:[1200,0,6000],starSizeMin:[.65,.3,8],starSizeMax:[2.2,.3,12],
  starSpeed:[.25,0,2],starDirection:[20,-180,180],starDepth:[1,.3,2],starTwinkle:[.2,0,1],starGlow:[1,0,2]
};
export const BACKGROUND_DEFAULTS={
  ...Object.fromEntries(Object.entries(established).map(([key,[value]])=>[key,value])),
  ...Object.fromEntries(Object.entries(BACKGROUND_CONTROLS).map(([key,c])=>[key,c.value])),
  starFollowAvatar:false,starPalette:0,starColors:null,backgroundColor:'#000000'
};
const finite=(value,fallback,min,max)=>typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
const validHex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);

// Safe to merge into appearance presets: this returns background keys only.
export function normalizeBackground(input={}){
  input=input&&typeof input==='object'?input:{};
  const out={};
  for(const [key,[value,min,max]] of Object.entries(established))out[key]=finite(input[key],value,min,max);
  for(const [key,c] of Object.entries(BACKGROUND_CONTROLS))out[key]=finite(input[key],c.value,c.min,c.max);
  out.starCount=Math.round(out.starCount);
  out.starSizeMax=Math.max(out.starSizeMin,out.starSizeMax);
  out.starFollowAvatar=input.starFollowAvatar===true;
  out.starPalette=Math.round(finite(input.starPalette,0,0,STAR_PALETTES.length-1));
  out.starColors=Array.isArray(input.starColors)&&input.starColors.length===3&&input.starColors.every(validHex)?input.starColors.map(color=>color.toLowerCase()):null;
  out.backgroundColor=validHex(input.backgroundColor)?input.backgroundColor.toLowerCase():BACKGROUND_DEFAULTS.backgroundColor;
  return out;
}

// Renderer adapter; time and pixelRatio are supplied by the renderer itself.
export function starFieldOptions(state={}){
  const p=normalizeBackground(state);
  return {
    amount:p.starField,count:p.starCount,minSize:p.starSizeMin,maxSize:p.starSizeMax,
    speed:p.starSpeed,direction:p.starDirection,depth:p.starDepth,twinkle:p.starTwinkle,glow:p.starGlow,
    followAvatar:p.starFollowAvatar,palette:p.starPalette,colors:p.starColors,hue:p.starHue,
    saturation:p.starSaturation,spread:p.starSpread,twinkleSpeed:p.starTwinkleSpeed,
    softness:p.starSoftness,colorSpeed:p.starColorSpeed
  };
}
