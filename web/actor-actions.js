import {BODY_FORMS} from './action-body.js';
import {pickAppearance} from './appearance-settings.js';

export const DEFAULT_EMOTES=['neutral','curious','joy','angry','sad','afraid','thinking','listening','flirting','pop','laugh','shy','surprise','sleepy','proud'];
export const LIBRARY_EMOTES={
  delight:{label:'Delight',icon:'✺',hint:'Bright grin and a buoyant lift',face:[1.24,.59,.12,.085,-.20,0,.03],aperture:.13,width:.23,pitch:-.10,lift:.075},
  skeptical:{label:'Skeptical',icon:'≋',hint:'One eye narrows as the head cocks sideways',face:[1.05,.78,.24,.02,.056,0,0],aperture:.054,width:.15,tilt:.17,eyes:[.45,1.2]},
  confused:{label:'Confused',icon:'?',hint:'Uneven eyes and a slow side-to-side tilt',face:[1.02,1.04,-.22,.02,.04,0,0],aperture:.082,width:.13,tilt:.14,sway:1.15,eyes:[1.22,.65]},
  worried:{label:'Worried',icon:'◈',hint:'Turned-up inner eyes and a tense frown',face:[.96,.69,-.42,.022,.16,0,0],aperture:.074,width:.17,pitch:.09},
  relieved:{label:'Relieved',icon:'≈',hint:'A long exhale, softer eyes and a gentle drop',face:[1,.44,.04,-.025,-.066,0,0],aperture:.13,width:.17,lift:-.048},
  dizzy:{label:'Dizzy',icon:'◎',hint:'A woozy head roll with a round mouth',face:[.73,.64,.2,.01,0,0,0],aperture:.125,width:.12,tilt:.24,sway:1.55,eyes:[.72,1.17]},
  grumpy:{label:'Grumpy',icon:'▰',hint:'Heavy slanted eyes and a tight frown',face:[1.17,.33,.42,-.045,.14,0,0],aperture:.06,width:.19,pitch:.10},
  determined:{label:'Determined',icon:'➤',hint:'A steady, narrowed stare and a forward lean',face:[1.1,.46,.24,.01,-.018,0,0],aperture:.065,width:.18,pitch:.20,lift:.022},
  awe:{label:'Awe',icon:'✧',hint:'Slow upward gaze with an open, rounded mouth',face:[.92,1.27,0,.075,-.015,0,0],aperture:.19,width:.15,pitch:-.23,lift:.043},
  pout:{label:'Pout',icon:'⌣',hint:'A little pinched mouth and lowered gaze',face:[.91,.70,-.17,-.05,.135,0,0],aperture:.088,width:.115,pitch:.11,tilt:-.085},
  smirk:{label:'Smirk',hint:'A crooked half-smile and a knowing glance',face:[1.03,.69,.13,.01,-.11,0,0],aperture:.068,width:.19,eyes:[.91,1.06]},
  squint:{label:'Squint',hint:'Eyes narrow as Bubbles leans in to inspect',face:[1.22,.33,0,.022,-.018,0,0],aperture:.047,width:.14},
  disgust:{label:'Disgust',hint:'Bubbles recoils and pulls one mouth corner down',face:[1.03,.62,-.29,-.014,.087,0,0],aperture:.112,width:.167,eyes:[.88,1.12]}
};
Object.assign(LIBRARY_EMOTES,{
  explosion:{label:'Explosion',icon:'✹',hint:'The glass compresses, then erupts in a jagged flash and expanding plume',effect:1},
  rainbow:{label:'Rainbow',icon:'◒',hint:'A band of rainbow color sweeps across the glass',effect:2},
  comet:{label:'Comet',icon:'☄',hint:'Fly deep into the distance, leave frame, then return from the foreground',effect:3},
  shockwave:{label:'Shockwave',icon:'≋',hint:'Two ripples travel across the shell',effect:4},
  eclipse:{label:'Eclipse',icon:'◐',hint:'A shadow crosses the orb and reveals a warm rim',effect:5},
  sparkle:{label:'Sparkle',icon:'✦',hint:'Glass motes twinkle around the orb',effect:6},
  prism:{label:'Prism',icon:'◇',hint:'Three spectral bands split and rejoin',effect:7},
  heartbeat:{label:'Heartbeat',icon:'♡',hint:'A pair of warm pulses swell the glass',effect:8},
  orbit:{label:'Orbit',icon:'⊙',hint:'Split into eight circling copies, then merge',effect:9},
  melt:{label:'Melt',icon:'◡',hint:'The orb slumps into a soft puddle and springs back',effect:10},
  aurora:{label:'Aurora',icon:'∿',hint:'Silky curtains of teal and violet unfurl around the glass',effect:11},
  wormhole:{label:'Wormhole',icon:'◉',hint:'Stars arc around a dark lens and a tilted ribbon of light',effect:12},
  crystal:{label:'Crystal',icon:'⬡',hint:'Bubbles crystallizes into cut glass with a traveling spectral glint',effect:13},
  nebula:{label:'Nebula',icon:'☁',hint:'Violet and rose clouds billow out and curl around Bubbles',effect:14},
  echo:{label:'Echo',icon:'◌',hint:'Three glass echoes lag behind a sweeping turn',effect:15},
  lantern:{label:'Lantern',icon:'◆',hint:'A warm light grows inside the glass, then cools',effect:16},
  gravity:{label:'Gravity',icon:'↓',hint:'Stars fall inward as Bubbles compresses, then spring back',effect:17},
  fireflies:{label:'Fireflies',icon:'✷',hint:'Warm points of light rise in drifting spirals',effect:18}
});
export const ACTOR_EXPRESSIONS=[...DEFAULT_EMOTES,...Object.keys(LIBRARY_EMOTES)];
export const ACTOR_APERTURES={neutral:0,curious:.045,joy:.102,angry:.072,sad:.06,afraid:.13,thinking:.025,listening:0,flirting:.082,shy:.049};
export const ACTOR_GESTURES=['nod','look-left','look-right','blink'];
export const ACTOR_LABELS={neutral:'Neutral',curious:'Curious',joy:'Smile',angry:'Angry',sad:'Frown',afraid:'Afraid',thinking:'Thinking',listening:'Listening',nod:'Nod','look-left':'Look left','look-right':'Look right',blink:'Close eyes'};
Object.assign(ACTOR_LABELS,{flirting:'Flirting',pop:'Pop',laugh:'Laugh',shy:'Shy',surprise:'Surprise',sleepy:'Sleepy',proud:'Proud'});
for(const [name,emote] of Object.entries(LIBRARY_EMOTES))ACTOR_LABELS[name]=emote.label;
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const COMET_EXIT=1.78,COMET_RETURN=2.02;
const cometDeparture=[
  [.08,0,0,0],[.36,-.27,.14,-1.65],[.72,-.68,.40,-6.8],
  [1.04,-.36,.57,-11.2],[1.31,.31,.48,-12.8],[COMET_EXIT,1.28,.19,-10.5]
];
const cometArrival=[[COMET_RETURN,-.26,-2.8,1.78],[2.32,-.19,-.36,.86],[2.78,0,0,0]];
export function cometPath(time){
  const route=time<COMET_RETURN?cometDeparture:cometArrival;
  const last=route.length-1;
  const index=Math.min(last-1,Math.max(0,route.findLastIndex(point=>point[0]<=time)));
  const from=route[index],to=route[index+1],previous=route[Math.max(0,index-1)],next=route[Math.min(last,index+2)];
  const duration=to[0]-from[0],phase=clamp((time-from[0])/duration);
  const squared=phase*phase,cubed=squared*phase;
  const coordinate=axis=>{
    const departure=index===0?0:(to[axis]-previous[axis])*duration/(to[0]-previous[0]);
    const arrival=index+1===last?0:(next[axis]-from[axis])*duration/(next[0]-from[0]);
    return (2*cubed-3*squared+1)*from[axis]+(cubed-2*squared+phase)*departure+(-2*cubed+3*squared)*to[axis]+(cubed-squared)*arrival;
  };
  return {x:coordinate(1),y:coordinate(2),z:coordinate(3)};
}
export function stageEffectPose(action){
  const mode=action?.kind==='expression'&&Object.hasOwn(LIBRARY_EMOTES,action.name)?LIBRARY_EMOTES[action.name].effect:0;
  if(!mode)return null;
  const time=Math.max(0,action.elapsed)/1000;
  const weight=clamp(action.weight/(action.mode==='blend'?.86:1));
  const ramp=(start,end)=>smooth((time-start)/(end-start));
  const pulse=(start,peak,end)=>ramp(start,peak)*(1-ramp(peak,end));
  const beat=(pulse(.12,.29,.48)+.57*pulse(.43,.56,.82)+pulse(1.10,1.27,1.46)+.57*pulse(1.41,1.54,1.80))*weight;
  const slump=ramp(.15,.85)*(1-ramp(1.08,1.95))*weight;
  const rebound=pulse(1.34,1.86,2.27)*weight;
  const travel=2*ramp(.08,Math.max(2.6,(action.duration||4000)/1000-.28))-1;
  const pose={mode,time,weight,beat,travel,shift:0,lift:0,stretch:0,spread:0,particles:0};
  if(mode===1){
    const charge=pulse(.03,.39,.46),impact=pulse(.39,.49,.86);
    const assembly=ramp(1.40,2.15);
    const presence=1-weight*ramp(.41,.49)*(1-ramp(1.86,2.23));
    Object.assign(pose,{shell:presence,face:presence,assembly,flash:.82*weight*impact,
      reform:weight*pulse(1.87,2.03,2.23),compression:weight*(-.22*charge+.12*impact-.30*pulse(1.72,1.93,2.24)),stretch:weight*(-.14*charge+.10*impact)});
  }
  if(mode===3){
    const duration=clamp((action.duration||4000)/1000,2.8,5);
    const flightEnd=duration*.74,returnStart=duration*.81,land=Math.max(returnStart+.1,duration-.08);
    const flightTime=time<flightEnd?time/flightEnd*COMET_EXIT:time<returnStart
      ?COMET_EXIT+(time-flightEnd)/(returnStart-flightEnd)*(COMET_RETURN-COMET_EXIT)
      :COMET_RETURN+clamp((time-returnStart)/(land-returnStart))*(2.78-COMET_RETURN);
    const flightRamp=(start,end)=>smooth((flightTime-start)/(end-start));
    const path=cometPath(flightTime);
    const flare=flightRamp(.21,.51)*(1-flightRamp(COMET_EXIT,COMET_RETURN))*weight;
    Object.assign(pose,{time:flightTime,shift:path.x*weight,lift:path.y*weight,depth:path.z*weight,cometHidden:flightTime>=COMET_EXIT&&flightTime<COMET_RETURN&&weight>.98,
      cometFlare:flare,face:1-flare,shell:1,stretch:-.15*flare,spread:.09*flare,
      particles:weight*flightRamp(.18,.39)*(1-flightRamp(1.91,2.52))});
  }
  if(mode===4)pose.stretch=.075*weight*(pulse(.14,.30,.58)-pulse(.61,.83,1.19));
  if(mode===6)pose.particles=weight*ramp(.10,.45);
  if(mode===9){
    const duration=clamp((action.duration||4000)/1000,2.8,5);
    pose.split=weight*ramp(.10,.55)*(1-ramp(duration-.70,duration-.10));
  }
  if(mode===8){pose.stretch=.13*beat;pose.spread=.10*beat;}
  if(mode===10)Object.assign(pose,{stretch:-.49*slump+.15*rebound,spread:.14*slump,lift:-.31*slump+.08*rebound});
  if(mode===11)Object.assign(pose,{lift:.12*weight*ramp(.12,.95),stretch:.065*weight*Math.sin(time*2.3)});
  if(mode===12){
    const pull=ramp(.12,.88)*weight;
    Object.assign(pose,{gravity:pull,compression:-.16*pull,face:1-.99*pull});
  }
  if(mode===13)pose.stretch=.085*weight*ramp(.04,.44);
  if(mode===14)Object.assign(pose,{compression:.09*weight*ramp(.22,1.5),lift:.043*weight*Math.sin(time*1.8)});
  if(mode===15){
    const sweep=pulse(.14,.56,1.13)-.72*pulse(1.08,1.58,2.16);
    Object.assign(pose,{shift:.53*sweep*weight,lift:.11*sweep*weight,echo:weight*pulse(.16,.64,2.35)});
  }
  if(mode===16)pose.beat=weight*ramp(.15,.82)*(.83+.17*Math.sin(time*3.4));
  if(mode===17){
    const pull=weight*pulse(.12,.87,1.40),release=weight*pulse(1.02,1.47,2.13);
    Object.assign(pose,{gravity:pull,beat:release,compression:-.23*pull+.12*release,stretch:-.16*pull+.10*release,lift:-.13*pull});
  }
  if(mode===18)pose.particles=weight*ramp(.18,.68);
  return pose;
}
export function starActionPose(action,effect){
  if(action?.kind!=='expression')return [];
  const weight=clamp(action.weight/(action.mode==='blend'?.86:1));
  const time=action.elapsed/1000;
  const burst=(start,speed)=>smooth((time-start)/.09)*Math.exp(-Math.max(0,time-start)*speed)*weight;
  switch(action.name){
    case 'explosion': {
      const wave=burst(.43,2.8);
      const push=weight*smooth((time-.43)/.16)*(1-smooth((time-.72)/1.42));
      return [.14*wave,0,1.05*wave,.05*wave,.76*push];
    }
    case 'pop': {const wave=burst(.21,4.2);return [.14*wave,0,.45*wave,.08*wave];}
    case 'shockwave': {const wave=burst(.16,3.5)+.65*burst(.63,3);return [.17*wave,0,.53*wave,0];}
    case 'wormhole': {
      const pull=effect?.gravity??0;
      return [0,.76*pull,.25*pull,.16*pull,0,0,pull];
    }
    case 'orbit': return [0,.18*(effect?.split??0),.18*weight,0];
    case 'rainbow': return [0,0,.22*weight,.34*weight*Math.sin(time*1.8)];
    case 'aurora': return [.045*weight,.08*Math.sin(time*1.7)*weight,.28*weight,.18*weight];
    case 'nebula': return [0,0,0,0,0,.37*weight*smooth((time-.12)/.92)];
    case 'comet': {
      const flight=effect?.time??0;
      const pullback=smooth((flight-.19)/.62)*(1-smooth((flight-2.02)/.76));
      return [0,0,0,0,0,.45*weight*pullback];
    }
    case 'heartbeat': return [.10*(effect?.beat??0),0,.50*(effect?.beat??0),0];
    case 'gravity': return [-.30*(effect?.gravity??0)+.23*(effect?.beat??0),.14*(effect?.gravity??0),.55*(effect?.beat??0),0];
    case 'lantern': return [0,0,.17*(effect?.beat??0),0];
    default:return [];
  }
}
export function libraryEmoteMotion(name,elapsed){
  const time=Math.max(0,Number.isFinite(elapsed)?elapsed:0)/1000;
  const ramp=(start,end)=>smooth((time-start)/(end-start));
  const pulse=(start,peak,end)=>ramp(start,peak)*(1-ramp(peak,end));
  const beat=(rate,offset=0)=>Math.sin((time-offset)*Math.PI*2*rate);
  switch(name){
    case 'smirk': {
      const lean=ramp(.14,.63);
      return {yaw:.16*lean,tilt:-.09*lean,skew:.042*lean,eyeBias:.20*lean};
    }
    case 'squint': {
      const check=pulse(.10,.47,1.24),hold=ramp(.12,.68);
      return {pitch:.13*hold,eyeHeight:-.38*hold,lids:.55*check,eyeLift:.022*hold};
    }
    case 'disgust': {
      const flinch=pulse(.10,.40,1.14),turn=ramp(.1,.62);
      return {pitch:-.28*flinch,yaw:-.22*turn,lids:.34*flinch,jaw:.088*flinch,skew:-.039*turn};
    }
    case 'delight': {
      const hop=pulse(.06,.33,.79)+.65*pulse(.78,1.02,1.44);
      return {lift:.15*hop,stretch:.13*hop,pitch:-.13*hop,jaw:.15*hop,lids:.22*hop,eyeLift:.045*hop};
    }
    case 'skeptical': {
      const lean=ramp(.08,.65),doubleTake=pulse(.64,.88,1.35);
      return {tilt:.19*lean-.11*doubleTake,yaw:.23*lean,stretch:-.05*doubleTake,eyeBias:.48*lean,eyeLift:.035*doubleTake,jaw:.04*doubleTake,skew:.028*lean};
    }
    case 'confused': {
      const searching=ramp(.12,.4)*beat(.53,.12);
      return {tilt:.23*searching,yaw:-.22*searching,eyeBias:.34*searching,jaw:.095*Math.abs(searching),stretch:-.06*Math.abs(searching),skew:.031*searching};
    }
    case 'worried': {
      const tremble=ramp(.15,.45)*beat(4.6),gulp=pulse(.50,.79,1.30);
      return {tilt:.047*tremble,pitch:.12*gulp,stretch:-.11*gulp,eyeLift:.07*gulp,jaw:.14*gulp,skew:.017*tremble,lift:-.035*gulp};
    }
    case 'relieved': {
      const inhale=pulse(.02,.48,1.08),exhale=ramp(.45,1.49),blink=pulse(.63,.89,1.25);
      return {pitch:-.12*inhale+.12*exhale,lift:.07*inhale-.085*exhale,stretch:.09*inhale-.08*exhale,jaw:.17*inhale-.09*exhale,lids:.95*blink};
    }
    case 'dizzy': {
      const wobble=ramp(.05,.28)*(1-.68*ramp(1.5,3.2)),orbit=beat(1.24);
      return {tilt:.36*orbit*wobble,yaw:.22*beat(1.24,-.20)*wobble,pitch:.15*beat(1.24,-.20)*wobble,eyeBias:.40*orbit*wobble,lift:.055*orbit*wobble,stretch:.09*orbit*wobble,jaw:.09*Math.abs(orbit)*wobble};
    }
    case 'grumpy': {
      const recoil=pulse(.04,.26,.6),huff=pulse(.40,.72,1.2)+.45*pulse(1.22,1.48,1.91);
      return {pitch:.17*huff-.12*recoil,yaw:-.18*ramp(.25,.66),lift:-.064*huff,stretch:-.15*huff,jaw:.14*huff,lids:.55*huff};
    }
    case 'determined': {
      const brace=pulse(.04,.29,.60),push=pulse(.37,.69,1.18),lock=ramp(.45,1.05);
      return {pitch:.19*lock-.12*brace,lift:-.063*brace+.085*push,stretch:-.17*brace+.14*push,jaw:.09*push,lids:.42*lock,eyeLift:-.036*lock};
    }
    case 'awe': {
      const rise=ramp(.11,1.6),breath=.5+.5*beat(.54,.4);
      return {pitch:-.31*rise,lift:.12*rise,stretch:.085*rise+.035*breath*rise,jaw:.19*rise+.035*breath*rise,eyeLift:.065*rise,eyeHeight:.32*rise};
    }
    case 'pout': {
      const sulk=ramp(.10,.68),quiver=pulse(.44,.8,1.25)*beat(5.3);
      return {pitch:.20*sulk,tilt:-.14*sulk,yaw:.11*sulk,lift:-.07*sulk,stretch:-.095*sulk,jaw:.055*sulk+.03*quiver,skew:.035*sulk+.013*quiver,eyeLift:-.038*sulk,lids:.35*sulk};
    }
    default:return {};
  }
}
export function bubbleActionPose(action){
  if(action?.kind!=='expression')return {shell:1,wink:0,tilt:0,hearts:0,burst:0,flash:0,reform:0,age:0};
  const age=Math.max(0,action.elapsed)/1000;
  const weight=clamp(action.weight/(action.mode==='blend'?.86:1));
  const wink=action.name==='flirting'?weight*smooth((age-.26)/.12)*(1-smooth((age-.57)/.19)):0;
  const pop=action.name==='pop';
  const burst=pop?weight*smooth((age-.21)/.035)*(1-smooth((age-.28)/.59)):0;
  const shell=pop?1-weight*smooth((age-.21)/.04)*(1-smooth((age-2.25)/.48)):1;
  const flash=pop?weight*smooth((age-.05)/.17)*(1-smooth((age-.22)/.09)):0;
  const reform=pop?weight*smooth((age-2.25)/.10)*(1-smooth((age-2.54)/.19)):0;
  const tilt=action.name==='flirting'?.18*weight*smooth((age-.14)/.26)*(1-smooth((age-.56)/.43)):0;
  return {shell,wink,tilt,hearts:action.name==='flirting'?weight:0,burst,flash,reform,age};
}
export function makeActorAction(kind,name,duration=4,mode='blend',wallNow=Date.now(),id=crypto.randomUUID(),form,followUp,appearance,nextForm,nextAppearance){
  if(!(kind==='expression'?ACTOR_EXPRESSIONS:kind==='gesture'?ACTOR_GESTURES:[]).includes(name))return null;
  const action={id,kind,name,duration:clamp(Number(duration)||4,3,5)*1000,mode:mode==='override'?'override':'blend',at:wallNow};
  if(BODY_FORMS.includes(form))action.form=form;
  const nextKind=ACTOR_GESTURES.includes(followUp)?'gesture':ACTOR_EXPRESSIONS.includes(followUp)?'expression':null;
  if(nextKind&&followUp!==name){
    action.followUp={name:followUp,kind:nextKind};
    if(BODY_FORMS.includes(nextForm))action.followUp.form=nextForm;
    if(nextAppearance&&typeof nextAppearance==='object'&&!Array.isArray(nextAppearance))action.followUp.appearance=pickAppearance(nextAppearance);
  }
  if(appearance&&typeof appearance==='object'&&!Array.isArray(appearance))action.appearance=pickAppearance(appearance);
  return action;
}
export function createActorActionPlayer(now=()=>performance.now(),wallNow=()=>Date.now()){
  const handoffMs=170;
  let action=null,start=0,releasedAt=null,seenId='',handoff=null;
  function sample(time=now()){
    if(!action)return null;
    const totalElapsed=Math.max(0,time-start),totalDuration=action.duration*(action.followUp?2:1);
    const totalRemaining=Math.max(0,totalDuration-totalElapsed);
    const phaseIndex=action.followUp&&totalElapsed>=action.duration?1:0;
    const elapsed=totalElapsed-phaseIndex*action.duration,remaining=Math.max(0,action.duration-elapsed);
    let weight=smooth(elapsed/180)*smooth(remaining/650);
    if(releasedAt!==null)weight*=1-smooth((time-releasedAt)/220);
    if(totalRemaining<=0||(releasedAt!==null&&time-releasedAt>=220)){action=null;return null;}
    const phase=phaseIndex?action.followUp:{name:action.name,kind:action.kind};
    const sequence=action.followUp?{phaseIndex,rootName:action.name,rootKind:action.kind,totalRemaining,totalProgress:totalElapsed/totalDuration,
      formWeight:smooth(totalElapsed/180)*smooth(totalRemaining/650)*(releasedAt===null?1:1-smooth((time-releasedAt)/220))}:{};
    return {...action,...phase,...sequence,elapsed,remaining,progress:elapsed/action.duration,weight:weight*(action.mode==='blend'?.86:1)};
  }
  function visual(time=now()){
    const next=sample(time);
    if(!next||!handoff||next.phaseIndex===1)return next;
    const age=Math.max(0,time-handoff.at);
    if(age<handoffMs){
      const release=releasedAt===null?1:1-smooth((time-releasedAt)/220);
      const fade=(1-smooth(age/handoffMs))*release;
      return {...handoff.from,weight:handoff.from.weight*fade,...(handoff.from.formWeight!==undefined?{formWeight:handoff.from.formWeight*fade}:{})};
    }
    const elapsed=Math.max(0,next.elapsed-handoffMs),duration=next.duration-handoffMs;
    const release=releasedAt===null?1:1-smooth((time-releasedAt)/220);
    return {...next,elapsed,duration,progress:elapsed/duration,
      ...(next.formWeight!==undefined?{formWeight:next.formWeight*smooth(elapsed/180)}:{}),
      weight:smooth(elapsed/180)*smooth(next.remaining/650)*release*(next.mode==='blend'?.86:1)};
  }
  return {
    receive(next){
      if(next===null){if(action&&releasedAt===null)releasedAt=now();return;}
      if(!next||typeof next.id!=='string'||next.id===seenId||!Number.isFinite(next.at)||!Number.isFinite(next.duration))return;
      const valid=makeActorAction(next.kind,next.name,next.duration/1000,next.mode,next.at,next.id,next.form,next.followUp?.name,next.appearance,next.followUp?.form,next.followUp?.appearance);if(!valid)return;
      seenId=next.id;const age=Math.max(0,wallNow()-next.at);
      if(age>=valid.duration*(valid.followUp?2:1))return;
      const receipt=now(),from=visual(receipt);
      handoff=from?.weight>.001?{from,at:receipt-age}:null;
      action=valid;start=receipt-age;releasedAt=null;
    },
    sample,visual,
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
