import {resolvePalette,hexToLinear} from './palettes.js';

const mix=(a,b,t)=>a+(b-a)*t;
const mixVector=(a,b,t)=>a.map((value,index)=>mix(value,b[index],t));
const mixPalette=(a,b,t)=>({
  colors:a.colors.map((color,index)=>mixVector(color,b.colors[index],t)),
  power:mix(a.power,b.power,t)
});

function resolve(settings){
  const {style,palette,customColors,starPalette,starColors,starFollowAvatar,backgroundColor,...values}=settings;
  return {...values,
    material:[1,2,3].map(index=>Number(style===index)),
    abyss:Number(palette===3),colors:resolvePalette(palette,customColors),
    starLinearColors:resolvePalette(starPalette,starColors),starFollowMix:Number(starFollowAvatar),
    backgroundLinear:hexToLinear(backgroundColor)
  };
}

export function createLookTransition(duration=650){
  let from,target,signature,started;
  function sample(now){
    const progress=Math.max(0,Math.min(1,(now-started)/duration));
    if(progress===1||from===target)return target;
    const t=progress*progress*(3-2*progress);
    const out={...target};
    for(const key of Object.keys(target)){
      if(typeof target[key]==='number'&&key!=='quality')out[key]=mix(from[key],target[key],t);
    }
    out.quality=from.quality;
    out.material=mixVector(from.material,target.material,t);
    out.backgroundLinear=mixVector(from.backgroundLinear,target.backgroundLinear,t);
    out.colors=mixPalette(from.colors,target.colors,t);
    out.starLinearColors=mixPalette(from.starLinearColors,target.starLinearColors,t);
    return out;
  }
  return (settings,now)=>{
    // Shapes and tracking strength are performance controls, independent of a look.
    const {bodyForm,faceStrength,...look}=settings;
    const nextSignature=JSON.stringify(look);
    if(nextSignature!==signature){
      from=target?sample(now):resolve(look);
      target=resolve(look);
      signature=nextSignature;
      started=now;
    }
    return {...sample(now),bodyForm,faceStrength};
  };
}
