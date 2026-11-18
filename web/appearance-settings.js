import {BACKGROUND_CONTROLS,BACKGROUND_DEFAULTS,normalizeBackground} from './background-settings.js';
export const CONTROLS={
  ...BACKGROUND_CONTROLS,
  facePresence:{label:'Face visibility',min:0,max:1,value:.92,scale:100,group:'surface'},
  orbSize:{label:'Character size',min:.65,max:1.3,value:.72,scale:100,group:'surface'},
  surfaceDeformation:{label:'Shape deformation',min:0,max:1,value:0,scale:100,group:'surface'},
  glassDepth:{label:'Glass reflection',min:0,max:1,value:.4,scale:100,group:'surface'},
  refraction:{label:'Refraction',min:0,max:1,value:.4,scale:100,group:'surface'},
  dispersion:{label:'Chromatic dispersion',min:0,max:1,value:.12,scale:100,group:'surface'},
  internalDepth:{label:'Liquid depth',min:0,max:1,value:.25,scale:100,group:'surface'},
  surfaceRipples:{label:'Surface ripples',min:0,max:1,value:.1,scale:100,group:'surface'},
  fluidMotion:{label:'Flow speed',min:0,max:2,value:.55,scale:100,group:'motion'},
  flowScale:{label:'Flow scale',min:.3,max:2,value:.8,scale:100,group:'motion'},
  flowCurl:{label:'Curl',min:0,max:2,value:1,scale:100,group:'motion'},
  flowAngle:{label:'Flow direction',min:-180,max:180,value:0,scale:1,unit:'°',group:'motion'},
  audioResponse:{label:'Voice motion response',min:0,max:2,value:1,scale:100,group:'motion'},
  hueShift:{label:'Hue shift',min:-180,max:180,value:0,scale:1,unit:'°',group:'color'},
  colorSaturation:{label:'Color saturation',min:0,max:2,value:1,scale:100,group:'color'},
  colorGain:{label:'Color brightness',min:0,max:2,value:1,scale:100,group:'color'},
  edgeSoftness:{label:'Edge softness',min:0,max:1,value:.65,scale:100,group:'surface'},
  featureSoftness:{label:'Feature softness',min:0,max:1,value:.55,scale:100,group:'surface'},
  haloSpread:{label:'Halo spread',min:0,max:1,value:.45,scale:100,group:'color'},
  edgeGlow:{label:'Edge light',min:0,max:1,value:.7,scale:100,group:'color'},
  voiceHalo:{label:'Voice halo',min:0,max:1,value:.7,scale:100,group:'color'},
  featureEmission:{label:'Eyes & mouth emission',min:0,max:2,value:1,scale:100,group:'color'},
  bloomStrength:{label:'Bloom',min:0,max:1.5,value:.48,scale:100,group:'color'},
  flareStrength:{label:'Lens flare',min:0,max:1,value:.18,scale:100,group:'color'},
  starField:{label:'Star brightness',min:0,max:1,value:.35,scale:100,group:'stars'},
  starCount:{label:'Star count',min:0,max:6000,value:1200,scale:1,unit:'',step:50,group:'stars'},
  starSizeMin:{label:'Minimum size',min:.3,max:8,value:.65,scale:1,unit:'px',step:.05,group:'stars'},
  starSizeMax:{label:'Maximum size',min:.3,max:12,value:2.2,scale:1,unit:'px',step:.05,group:'stars'},
  starSpeed:{label:'Movement speed',min:0,max:2,value:.25,scale:100,group:'stars'},
  starDirection:{label:'Movement direction',min:-180,max:180,value:20,scale:1,unit:'°',group:'stars'},
  starDepth:{label:'Depth spread',min:.3,max:2,value:1,scale:100,group:'stars'},
  starTwinkle:{label:'Twinkle',min:0,max:1,value:.2,scale:100,group:'stars'},
  starGlow:{label:'Star emission',min:0,max:2,value:1,scale:100,group:'stars'},
  surfaceRoughness:{label:'Reflection roughness',min:0,max:1,value:.12,scale:100,group:'surface'},
  surfaceFrosting:{label:'Glass frosting',min:0,max:1,value:0,scale:100,group:'surface'},
  surfaceTension:{label:'Surface tension',min:0,max:1,value:.35,scale:100,group:'surface'},
  iridescence:{label:'Iridescence',min:0,max:1,value:.2,scale:100,group:'surface'},
  breathAmount:{label:'Breathing amount',min:0,max:1,value:.12,scale:100,group:'motion'},
  breathRate:{label:'Breathing rate',min:0,max:30,value:8,scale:1,unit:' bpm',step:1,group:'motion'},
  paletteDrift:{label:'Palette drift',min:-1,max:1,value:.12,scale:100,group:'animation'},
  hueWander:{label:'Hue sweep',min:0,max:180,value:0,scale:1,unit:'°',group:'animation'},
  hueSpeed:{label:'Hue sweep speed',min:0,max:2,value:.18,scale:100,group:'animation'},
  colorPulse:{label:'Light pulse',min:0,max:1,value:.08,scale:100,group:'animation'},
  colorPulseRate:{label:'Pulse rate',min:0,max:30,value:6,scale:1,unit:' bpm',step:1,group:'animation'},
  voiceColorGain:{label:'Voice light',min:0,max:1,value:.2,scale:100,group:'animation'},
  ribbonSpeed:{label:'Ribbon drift',min:-1,max:1,value:.2,scale:100,group:'animation'},
  ribbonWidth:{label:'Ribbon width',min:0,max:1,value:.5,scale:100,group:'animation'},
  ribbonIntensity:{label:'Ribbon light',min:0,max:2,value:1,scale:100,group:'animation'},
  voiceColor:{label:'Voice color shift',min:0,max:1,value:.25,scale:100,group:'animation'},
  faceStrength:{label:'Expression strength',min:.5,max:3,value:1.8,scale:100,group:'performance'}
};
export const APPEARANCE_DEFAULTS={...BACKGROUND_DEFAULTS,...Object.fromEntries(Object.entries(CONTROLS).map(([k,c])=>[k,c.value])),look:'luminous',scene:'aether',audioFluid:true,colorAnimation:true,renderQuality:1.3,customColors:null};
export function formatControl(key,value){const c=CONTROLS[key];if(c.unit==='px')return Number(value).toFixed(2)+' px';return Math.round(value*c.scale)+(c.unit??'%');}
export function pickAppearance(input={}){
  const out={};for(const [key,c] of Object.entries(CONTROLS))if(c.group!=='performance'){
    const n=Number(input[key]);out[key]=Number.isFinite(n)?Math.min(c.max,Math.max(c.min,n)):c.value;
  }
  if(out.starSizeMin>out.starSizeMax)out.starSizeMax=out.starSizeMin;
  out.starCount=Math.round(out.starCount);
  out.look=['luminous','ethereal','mercury','companion'].includes(input.look)?input.look:'luminous';
  out.scene=['aether','ember','dawn','void'].includes(input.scene)?input.scene:'aether';
  out.colorAnimation=input.colorAnimation!==false;
  out.audioFluid=input.audioFluid!==false;out.renderQuality=[.7,1,1.3].includes(Number(input.renderQuality))?Number(input.renderQuality):1.3;
  out.customColors=Array.isArray(input.customColors)&&input.customColors.length===3&&input.customColors.every(x=>/^#[0-9a-f]{6}$/i.test(x))?[...input.customColors]:null;
  Object.assign(out,normalizeBackground({...out,...input}));
  return out;
}
export function createAppearanceStore(storage,newId=()=>crypto.randomUUID()){
  const key='nord-appearance-presets-v1';let deleted=null;
  const read=()=>{try{const items=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(items)?items.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').slice(0,50).map(p=>({...p,appearance:pickAppearance(p.appearance)})):[];}catch{return [];}};
  const write=items=>storage.setItem(key,JSON.stringify(items));
  return {
    list:read,
    save(name,appearance){
      name=String(name||'').trim().slice(0,48);if(!name)throw new Error('Give this look a name.');
      const items=read(),existing=items.find(p=>p.name.toLowerCase()===name.toLowerCase());
      if(!existing&&items.length>=50)throw new Error('50 saved looks maximum. Export or remove a look first.');
      const record={id:existing?.id||newId(),name,appearance:pickAppearance(appearance),updatedAt:new Date().toISOString()};
      if(existing)items[items.indexOf(existing)]=record;else items.unshift(record);
      write(items);return record;
    },
    remove(id){const items=read(),index=items.findIndex(p=>p.id===id);if(index<0)return null;deleted={record:items[index],index};items.splice(index,1);write(items);return deleted.record;},
    undo(){if(!deleted)return null;const items=read();if(!items.some(p=>p.id===deleted.record.id))items.splice(Math.min(deleted.index,items.length),0,deleted.record);write(items);const record=deleted.record;deleted=null;return record;}
  };
}

// Reset only the selected workspace. Camera, cues and power remain live.
export function resetAppearanceSection(state,section){
  const change={};
  for(const [key,c] of Object.entries(CONTROLS))if(c.group===section)change[key]=c.value;
  if(section==='surface')change.renderQuality=APPEARANCE_DEFAULTS.renderQuality;
  if(section==='stars')Object.assign(change,BACKGROUND_DEFAULTS);
  if(section==='motion')change.audioFluid=true;
  if(section==='animation')change.colorAnimation=true;
  if(section==='color')Object.assign(change,{customColors:null,hueShift:0,colorSaturation:1,colorGain:1});
  return change;
}
