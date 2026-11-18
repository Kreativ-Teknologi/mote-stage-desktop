export const ACTOR_EXPRESSIONS=['neutral','curious','joy','angry','sad','afraid','thinking','listening'];
export const ACTOR_APERTURES={neutral:0,curious:.035,joy:.055,angry:.045,sad:.045,afraid:.13,thinking:.025,listening:0};
export const ACTOR_GESTURES=['nod','look-left','look-right','blink'];
export const ACTOR_LABELS={neutral:'Neutral',curious:'Curious',joy:'Smile',angry:'Angry',sad:'Frown',afraid:'Afraid',thinking:'Thinking',listening:'Listening',nod:'Nod','look-left':'Look left','look-right':'Look right',blink:'Close eyes'};
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function makeActorAction(kind,name,duration=4,mode='blend',wallNow=Date.now(),id=crypto.randomUUID()){
  if(!(kind==='expression'?ACTOR_EXPRESSIONS:kind==='gesture'?ACTOR_GESTURES:[]).includes(name))return null;
  return {id,kind,name,duration:clamp(Number(duration)||4,3,5)*1000,mode:mode==='override'?'override':'blend',at:wallNow};
}
export function createActorActionPlayer(now=()=>performance.now(),wallNow=()=>Date.now()){
  let action=null,start=0,releasedAt=null,seenId='';
  function sample(time=now()){
    if(!action)return null;
    const elapsed=Math.max(0,time-start),remaining=Math.max(0,action.duration-elapsed);
    let weight=smooth(elapsed/180)*smooth(remaining/650);
    if(releasedAt!==null)weight*=1-smooth((time-releasedAt)/220);
    if(remaining<=0||(releasedAt!==null&&time-releasedAt>=220)){action=null;return null;}
    return {...action,elapsed,remaining,progress:elapsed/action.duration,weight:weight*(action.mode==='blend'?.86:1)};
  }
  return {
    receive(next){
      if(next===null){if(action&&releasedAt===null)releasedAt=now();return;}
      if(!next||typeof next.id!=='string'||next.id===seenId||!Number.isFinite(next.at)||!Number.isFinite(next.duration))return;
      const valid=makeActorAction(next.kind,next.name,next.duration/1000,next.mode,next.at,next.id);if(!valid)return;
      seenId=next.id;const age=Math.max(0,wallNow()-next.at);
      if(age>=valid.duration){action=null;return;}
      action=valid;start=now()-age;releasedAt=null;
    },
    sample,
    current(){return sample()&&releasedAt===null?{...action}:null;},
    release(){if(action&&releasedAt===null)releasedAt=now();}
  };
}

// Head actions are offsets layered over the underlying tracked/frozen pose.
export function actorGesturePose(action,baseHead={}){
  const result={yaw:0,pitch:0,blink:0};
  if(action?.kind!=='gesture')return result;
  const w=action.weight;
  if(action.name==='blink')result.blink=clamp(w/(action.mode==='blend'?.86:1));
  if(action.name==='nod'){
    const phase=clamp(action.elapsed/Math.max(1,Number(action.duration)||4000));
    const ramp=(a,b)=>smooth((phase-a)/(b-a));
    const anticipation=phase<.18?-.028*Math.sin(Math.PI*phase/.18):0;
    const stroke=.18*ramp(.14,.42)*(1-ramp(.44,.78));
    const settle=phase>.70&&phase<.93?-.018*Math.sin(Math.PI*(phase-.70)/.23):0;
    result.pitch=(anticipation+stroke+settle)*w;
  }
  if(action.name==='look-left'||action.name==='look-right'){
    const goal=action.name==='look-left'?-.46:.46;
    result.yaw=(goal-(baseHead?.yaw||0))*w*smooth(action.elapsed/420);
  }
  return result;
}

// Preserve articulation and independent live blinks while layering expression.
export function blendActorEye(base,profile,index,weight){
  if(!profile||!weight)return base;
  const target={width:profile[0],height:profile[1],tilt:(index===0?-1:1)*profile[2],lift:profile[3]};
  return Object.fromEntries(Object.keys(target).map(k=>[k,base[k]+(target[k]-base[k])*weight]));
}
export function blendActorMouth(base,profile,weight,opening=0){
  if(!profile||!weight)return base;
  return {...base,opening:base.opening+(Math.max(base.opening,opening)-base.opening)*weight,width:base.width+(profile[0]-base.width)*weight,curve:base.curve+(profile[4]-base.curve)*weight,bounce:base.bounce+(profile[6]-base.bounce)*weight,skew:base.skew*(1-weight)};
}
