import {normalizeBackground} from './background-settings.js';
const number=(v,fallback,min=0,max=1)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;};
export function getRenderSettings(s){
  return {...normalizeBackground(s),style:({ethereal:0,mercury:1,companion:2,luminous:3}[s.look]??3),
    palette:Math.max(0,['aether','ember','dawn','void'].indexOf(s.scene)),
    face:number(s.facePresence,.92),motion:number(s.fluidMotion,.55,0,2),size:number(s.orbSize,.72,.65,1.3),
    deform:number(s.surfaceDeformation,0),glass:number(s.glassDepth,.4),refraction:number(s.refraction,.4),
    dispersion:number(s.dispersion,.12),depth:number(s.internalDepth,.25),ripple:number(s.surfaceRipples,.1),
    voiceHalo:number(s.voiceHalo,.7),faceStrength:number(s.faceStrength,1.8,.5,3),starField:number(s.starField,.35),
    bloomStrength:number(s.bloomStrength,.48,0,1.5),flareStrength:number(s.flareStrength,.18),edgeGlow:number(s.edgeGlow,.7),
    edgeSoftness:number(s.edgeSoftness,.65),featureSoftness:number(s.featureSoftness,.55),haloSpread:number(s.haloSpread,.45),
    customColors:s.customColors,hueShift:number(s.hueShift,0,-180,180),colorSaturation:number(s.colorSaturation,1,0,2),colorGain:number(s.colorGain,1,0,2),
    flowScale:number(s.flowScale,.8,.3,2),flowCurl:number(s.flowCurl,1,0,2),flowAngle:number(s.flowAngle,0,-180,180),audioResponse:number(s.audioResponse,1,0,2),featureEmission:number(s.featureEmission,1,0,2),
    starCount:number(s.starCount,1200,0,6000),starSizeMin:number(s.starSizeMin,.65,.3,8),starSizeMax:number(s.starSizeMax,2.2,.3,12),starSpeed:number(s.starSpeed,.25,0,2),starDirection:number(s.starDirection,20,-180,180),starDepth:number(s.starDepth,1,.3,2),starTwinkle:number(s.starTwinkle,.2),starGlow:number(s.starGlow,1,0,2),
    surfaceRoughness:number(s.surfaceRoughness,.12),surfaceFrosting:number(s.surfaceFrosting,0),surfaceTension:number(s.surfaceTension,.35),iridescence:number(s.iridescence,.2),
    breathAmount:number(s.breathAmount,.12),breathRate:number(s.breathRate,8,0,30),colorAnimation:s.colorAnimation!==false,
    paletteDrift:number(s.paletteDrift,.12,-1,1),hueWander:number(s.hueWander,0,0,180),hueSpeed:number(s.hueSpeed,.18,0,2),colorPulse:number(s.colorPulse,.08),colorPulseRate:number(s.colorPulseRate,6,0,30),
    voiceColorGain:number(s.voiceColorGain,.2),ribbonSpeed:number(s.ribbonSpeed,.2,-1,1),ribbonWidth:number(s.ribbonWidth,.5),ribbonIntensity:number(s.ribbonIntensity,1,0,2),voiceColor:number(s.voiceColor,.25),
    quality:number(s.renderQuality,1.3,.65,1.3),audioFluid:s.audioFluid!==false};
}
export function renderScale(deviceRatio,quality){return Math.max(.55,Math.min(3,deviceRatio,deviceRatio*quality/1.3));}
export function gesturePose(name,elapsed){
  if(elapsed<0||elapsed>=1400)return {yaw:0,pitch:0,blink:0};
  const p=elapsed/1400,amp=Math.sin(p*Math.PI);
  return {yaw:name==='look-left'?-.45*amp:name==='look-right'?.45*amp:0,
    pitch:name==='nod'?.22*Math.sin(p*5*Math.PI)*amp:0,
    blink:name==='blink'&&elapsed<200?Math.sin(Math.PI*elapsed/200):0};
}
