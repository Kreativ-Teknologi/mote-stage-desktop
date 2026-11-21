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
  disgust:{label:'Disgust',hint:'Bubbles recoils and pulls one mouth corner down',face:[1.03,.62,-.29,-.014,.087,0,0],aperture:.112,width:.167,eyes:[.88,1.12]},
  tryingToRemember:{label:'Trying to Remember',hint:'Searches up to one side, then squints as the thought slips away',face:[.96,1.03,-.14,.031,.016,0,0],aperture:.041,width:.15},
  catchingOn:{label:'Catching On',hint:'Three increasingly certain nods land on a quiet smile',face:[1.09,.81,.09,.023,-.095,0,0],aperture:.052,width:.17},
  almostCrying:{label:'Almost Crying',hint:'Eyes lift inward as a small, uneven frown trembles',face:[.99,.91,-.36,.024,.15,0,0],aperture:.048,width:.151},
  braveFace:{label:'Brave Face',hint:'Starts with a flinch, then straightens into a held smile',face:[1.13,.66,.03,.024,-.091,0,0],aperture:.049,width:.176},
  sideEye:{label:'Side Eye',hint:'A long sideways glance ends with one slow blink',face:[1.08,.63,.12,.014,.018,0,0],aperture:.034,width:.163},
  cushionBounce:{label:'Cushion Bounce',hint:'Drops, squashes, and makes two smaller rebounds',face:[1.13,.79,-.07,.018,-.08,0,0],aperture:.062,width:.196},
  sneeze:{label:'Sneeze',hint:'Builds up, snaps forward, then settles',face:[1.04,.72,.09,.02,.02,0,0],aperture:.048,width:.16},
  yawn:{label:'Yawn',hint:'Opens slowly as the lids sink, then finishes with a blink',face:[.97,.67,.02,-.02,-.016,0,0],aperture:.032,width:.15},
  gaspThenGrin:{label:'Gasp to Grin',hint:'A gasp softens into a broad, delighted grin',face:[1.11,.79,-.09,.028,-.14,0,0],aperture:.066,width:.202},
  holdingBreath:{label:'Hold Breath',hint:'Draws in air and holds still with eyes wide',face:[1.02,.86,-.05,.017,.011,0,0],aperture:0,width:.15},
  nervousLaugh:{label:'Nervous Laugh',hint:'Two uneven laughs fade into a sideways glance',face:[1.16,.81,-.16,.028,-.075,0,0],aperture:.056,width:.18},
  nope:{label:'Nope',hint:'Shakes side to side twice with a tight mouth',face:[1.11,.57,.23,-.009,.055,0,0],aperture:.035,width:.18},
  hiccup:{label:'Hiccup',hint:'Two involuntary jolts interrupt a steady stare',face:[.98,.87,0,.015,-.01,0,0],aperture:.03,width:.15},
  queasy:{label:'Queasy',hint:'A slow roll and an uneven, pinched grimace',face:[.98,.56,-.18,-.01,.10,0,0],aperture:.057,width:.13},
  deflated:{label:'Deflated',hint:'The eyes drop as Bubbles slowly sinks',face:[1.07,.74,-.24,-.016,.10,0,0],aperture:.042,width:.16},
  startledFreeze:{label:'Startled Freeze',hint:'A quick recoil followed by a wide, motionless stare',face:[.91,1.05,-.08,.049,0,0,0],aperture:.082,width:.13},
  sheepish:{label:'Sheepish',hint:'Looks down and peeks back up with a hesitant smile',face:[1.02,.71,-.09,.012,-.078,0,0],aperture:.054,width:.18},
  aha:{label:'Aha!',hint:'A flash of recognition lifts the face into a bright grin',face:[1.14,.82,-.11,.05,-.16,0,0],aperture:.085,width:.21},
  suspicious:{label:'Suspicious',hint:'Narrow eyes track from one side to the other',face:[1.12,.55,.26,.015,.026,0,0],aperture:.034,width:.17},
  offended:{label:'Offended',hint:'A sharp backward tilt and pursed mouth',face:[.95,.95,-.08,.04,.09,0,0],aperture:.063,width:.128},
  bored:{label:'Bored',hint:'A slow droop into a half-lidded stare',face:[1.14,.60,.03,-.031,.028,0,0],aperture:.027,width:.175},
  pleading:{label:'Pleading',hint:'Looks up with lifted inner lids and an uncertain mouth',face:[.99,1.13,-.39,.048,.108,0,0],aperture:.071,width:.15},
  smug:{label:'Smug',hint:'Raises the chin and settles into a long, lopsided smile',face:[1.05,.52,.09,.026,-.115,0,0],aperture:.055,width:.194},
  giggleFit:{label:'Giggle Fit',hint:'Three quick laughs build into a final bob',face:[1.16,.65,.05,.045,-.16,0,0],aperture:.055,width:.22},
  anticipation:{label:'Anticipation',hint:'Draws back, then leans in with widening eyes',face:[1.06,.83,-.12,.012,-.045,0,0],aperture:.042,width:.162},
  incredulous:{label:'Incredulous',hint:'One eye rises as Bubbles slowly recoils in disbelief',face:[1.08,.83,.13,.025,0,0,0],aperture:.062,width:.17},
  bracing:{label:'Bracing',hint:'Tucks down and squeezes both eyes before peeking out',face:[1.03,.73,.19,-.01,.043,0,0],aperture:.041,width:.18},
  mischievous:{label:'Mischievous',hint:'A searching side glance gives way to a crooked grin',face:[1.08,.75,.11,.018,-.12,0,0],aperture:.065,width:.185},
  flustered:{label:'Flustered',hint:'Two startled glances and a quick flutter of the eyes',face:[.96,.98,-.16,.027,.028,0,0],aperture:.07,width:.15},
  wonder:{label:'Wonder',hint:'A slow upward sweep with an unfolding smile',face:[1.03,.96,0,.042,-.088,0,0],aperture:.075,width:.182},
  deadpan:{label:'Deadpan',hint:'An unamused sideways glance with a flat, closed mouth',face:[1.12,.38,0,-.015,0,0,0],aperture:.016,width:.17},
  doubleTake:{label:'Double Take',hint:'Look away, then snap back with wide eyes and a gasp',face:[.98,.77,0,.02,0,0,0],aperture:.038,width:.15},
  sigh:{label:'Sigh',hint:'A slow inhale followed by a long exhale and drooping lids',face:[1,.58,-.08,.015,.025,0,0],aperture:.05,width:.15},
  wince:{label:'Wince',hint:'Squeeze the eyes shut and pull the mouth into a tight grimace',face:[1.13,.58,.30,0,.052,0,0],aperture:.05,width:.19},
  tender:{label:'Tender',hint:'A small, warm smile with soft eyes and a gentle tilt',face:[1.03,.53,.08,.03,-.102,0,0],aperture:.049,width:.18},
  stifledLaugh:{label:'Stifled Laugh',hint:'Two tiny giggles escape through a tightly held grin',face:[1.12,.55,.09,.025,-.15,0,0],aperture:.041,width:.20}
};
Object.assign(LIBRARY_EMOTES,{
  explosion:{label:'Explosion',icon:'✹',hint:'The glass compresses, then erupts in a jagged flash and expanding plume',effect:1},
  rainbow:{label:'Rainbow',icon:'◒',hint:'A band of rainbow color sweeps across the glass',effect:2},
  pixelCascade:{label:'Pixel Cascade',hint:'A rolling wave turns the entire picture into chunky lit tiles and restores it',effect:28},
  blueprint:{label:'Blueprint',hint:'A scanner reveals Bubbles as cyan contours on a drafting grid',effect:29},
  paperTear:{label:'Paper Tear',hint:'The image tears down a jagged seam, revealing warm light underneath',effect:31},
  iris:{label:'Iris',hint:'An old film iris closes around Bubbles, pauses, then opens again',effect:32},
  stageTilt:{label:'Stage Tilt',hint:'The entire stage swings like a hinged card, then rocks back into place',effect:33},
  comicBurst:{label:'Comic Burst',hint:'Two illustrated impact beats send tapered ink rays out from Bubbles',effect:34},
  disco:{label:'Disco',hint:'Stars turn into a rotating dance floor while Bubbles bobs to the beat',effect:25},
  curtainCall:{label:'Curtain Call',hint:'Twin curtains of stars part as Bubbles bows in a warm spotlight',effect:26},
  popcorn:{label:'Popcorn',hint:'The star field pops in staggered jumps while Bubbles dodges the bursts',effect:27},
  lightspeed:{label:'Lightspeed',hint:'The stars rush outward into luminous trails as Bubbles accelerates',effect:22},
  snowGlobe:{label:'Snow Globe',hint:'Two shakes toss the stars up, then they drift down like snow',effect:23},
  nightfall:{label:'Nightfall',hint:'Stars fade in waves, leaving Bubbles lit by a silvery rim',effect:24},
  glassFold:{label:'Glass Fold',hint:'A soft crease rolls diagonally through the glass and unfolds',effect:19},
  flipbook:{label:'Flipbook',hint:'Bubbles clicks through four hand-cranked poses with stepped light',effect:20},
  tidalRoll:{label:'Tidal Roll',hint:'A slow swell rolls through Bubbles and pushes the star field outward',effect:21},
  figureEight:{label:'Figure Eight',hint:'Splits into twin lights that cross in mirrored loops and reunite',effect:3},
  slingshot:{label:'Slingshot',hint:'Pulls back like a stretched band, then snaps across the stage',effect:3},
  meteorDive:{label:'Meteor Dive',hint:'A steep gold dive lands in a broad shock ring that clears the stars',effect:3},
  phaseJump:{label:'Phase Jump',hint:'Zigs, zags, and jumps out through the upper edge in a short violet trail',effect:3},
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
const flightStyles={
  figureEight:{tint:[2.3,.46,.78],width:0.88,stars:[.31,.24,.39],departure:[[.08,0,0,0],[.32,-.33,.40,-4],[.56,-.68,0,-8],[.78,-.32,-.40,-9],[1.0,.38,.37,-10],[1.24,.68,0,-9],[1.43,.35,-.41,-7],[COMET_EXIT,-1.36,.03,-8]],arrival:[[COMET_RETURN,1.30,-.38,1.3],[2.35,.25,-.14,.64],[2.78,0,0,0]]},
  slingshot:{tint:[3.2, .67, .23],width:1.2,stars:[0.43, -0.29, 0.29],departure:[[.08,0,0,0],[.39,-.35,-.17,-2],[.69,-.62,-.28,-4],[.88,-.59,-.26,-4],[1.17,.36,.12,-3],[1.43,.84,.35,-5],[COMET_EXIT,1.39,.63,-9]],arrival:[[COMET_RETURN,-1.24,-.26,1.4],[2.33,-.37,-.12,.63],[2.78,0,0,0]]},
  meteorDive:{tint:[3.6, 1.05, .17],width:1.48,stars:[0.33, 0.03, 0.22],departure:[[.08,0,0,0],[.38,-.34,.33,-4],[.77,-.40,.75,-12],[1.07,-.06,.60,-10],[1.36,.34,-.05,-6],[COMET_EXIT,.58,-1.44,-2.5]],arrival:[[COMET_RETURN,.34,1.80,1.1],[2.32,.13,-.54,.48],[2.78,0,0,0]]},
  phaseJump:{tint:[1.28, 0.56, 1.38],width:0.56,stars:[0.22, -0.23, 0.78],departure:[[.08,0,0,0],[.32,-.52,-.15,-2],[.65,.38,.07,-7],[.94,-.38,.27,-11],[1.27,.35,.48,-12],[COMET_EXIT,.66,1.35,-10]],arrival:[[COMET_RETURN,-1.22,-.14,1.7],[2.35,-.23,-.03,.67],[2.78,0,0,0]]},
};
export function cometPath(time,name='comet'){
  const style=Object.hasOwn(flightStyles,name)?flightStyles[name]:null;
  const route=time<COMET_RETURN?(style?.departure??cometDeparture):(style?.arrival??cometArrival);
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
    const style=flightStyles[action.name];
    const path=cometPath(flightTime,action.name);
    const flare=flightRamp(.21,.51)*(1-flightRamp(COMET_EXIT,COMET_RETURN))*weight;
    Object.assign(pose,{time:flightTime,flightName:action.name,tint:style?.tint??[1,1,1],wakeWidth:style?.width??1,flightStars:style?.stars,shift:path.x*weight,lift:path.y*weight,depth:path.z*weight,cometHidden:flightTime>=COMET_EXIT&&flightTime<COMET_RETURN&&weight>.98,
      cometFlare:flare,face:1-flare,shell:1,stretch:-.15*flare,spread:.09*flare,
      particles:weight*flightRamp(.18,.39)*(1-flightRamp(1.91,2.52))});
    const arcPulse=(start,peak,end)=>flightRamp(start,peak)*(1-flightRamp(peak,end));
    switch(action.name){
      case 'figureEight': {
        const twins=weight*flightRamp(.17,.47)*(1-flightRamp(1.72,2.22));
        Object.assign(pose,{twins,wakeWidth:.60,cometFlare:twins,face:1-twins});
        break;
      }
      case 'slingshot': {
        const draw=weight*arcPulse(.28,.73,1.14),launch=weight*arcPulse(.79,1.14,1.72);
        Object.assign(pose,{cometFlare:launch,face:1-launch,particles:launch,wakeAge:.37,stretch:.51*draw-.18*launch,
          starWave:[0,0,.60*launch,0]});
        break;
      }
      case 'meteorDive': {
        const impact=weight*arcPulse(2.19,2.32,2.74);
        Object.assign(pose,{impact,impactAge:clamp((flightTime-2.19)/.55),starWave:[0,-.82*impact,impact*.35,0]});
        break;
      }
    }
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
  if(mode===19){
    const sweep=ramp(.15,2.02);
    const crease=weight*ramp(.15,.52)*(1-ramp(1.66,2.17));
    Object.assign(pose,{travel:2.44*sweep-1.22,beat:crease,starWave:[0,crease,0,0]});
  }
  if(mode===20){
    // Fast eased steps read as held frames without a single-frame position jump.
    const first=ramp(.24,.32),second=ramp(.73,.82),third=ramp(1.21,1.30),settle=ramp(1.72,1.95);
    const poseIndex=first+second+third+settle;
    const hinge=(-first+2*second-1.65*third+.65*settle)*weight;
    const flash=weight*(pulse(.22,.32,.48)+pulse(.71,.82,.98)+pulse(1.18,1.30,1.48));
    Object.assign(pose,{travel:poseIndex,roll:.29*hinge,shift:.24*hinge,stretch:-.22*hinge,beat:flash,starWave:[0,0,flash,0]});
  }
  if(mode===21){
    const swell=weight*pulse(.15,1.13,2.65);
    Object.assign(pose,{travel:2.35*ramp(.16,2.48)-1.175,beat:swell,roll:.24*swell,lift:.15*swell,starWave:[0,-swell,0,0]});
  }
  if(mode===22){
    const duration=clamp((action.duration||4000)/1000,3,5);
    const speed=weight*ramp(.16,.96)*(1-ramp(duration-.92,duration-.14));
    Object.assign(pose,{beat:speed,stretch:.20*speed,compression:-.16*speed,starWave:[speed,0,0,0]});
  }
  if(mode===23){
    const duration=clamp((action.duration||4000)/1000,3,5);
    const snow=weight*ramp(.13,.58)*(1-ramp(duration-.99,duration-.17));
    const shake=weight*(pulse(.08,.30,.56)-pulse(.37,.61,.88)+.36*pulse(.69,.89,1.15));
    Object.assign(pose,{beat:snow,roll:.24*shake,shift:.22*shake,lift:.08*Math.abs(shake),
      starPattern:[4,snow,time]});
  }
  if(mode===24){
    const dusk=weight*ramp(.16,.94)*(1-ramp(1.88,2.68));
    Object.assign(pose,{beat:dusk,lift:-.07*dusk,starWave:[0,0,0,-dusk]});
  }
  if(mode===25){
    const strength=weight*ramp(.18,.61)*(1-ramp(2.26,2.85));
    const bounce=strength*Math.pow(.5+.5*Math.cos((time-.46)*Math.PI*5),2);
    Object.assign(pose,{beat:strength,starPattern:[1,strength,time],lift:.10*bounce,roll:.15*strength*Math.sin(time*7.85)});
  }
  if(mode===26){
    const opening=weight*ramp(.16,.89)*(1-ramp(2.07,2.91));
    const bow=weight*pulse(.66,1.40,2.28);
    Object.assign(pose,{beat:opening,starPattern:[2,opening,time],pitch:.52*bow,lift:-.15*bow,stretch:-.09*bow});
  }
  if(mode===27){
    const strength=weight*ramp(.12,.42)*(1-ramp(2.26,2.83));
    const first=pulse(.30,.53,.82),second=pulse(.80,1.10,1.42),third=pulse(1.39,1.75,2.14);
    const dodge=weight*(first-second+third*.65);
    Object.assign(pose,{beat:strength,starPattern:[3,strength,time],shift:.27*dodge,roll:.21*dodge,lift:.13*weight*(first+second+third)});
  }
  if(mode===28){
    const progress=clamp(time/2.65);
    const tiles=weight*ramp(.08,.47)*(1-ramp(2.13,2.78));
    Object.assign(pose,{screen:[1,tiles,progress],stretch:.10*weight*pulse(.35,.68,1.18)});
  }
  if(mode===29){
    const scan=clamp((time-.13)/1.07);
    const ink=weight*ramp(.09,.36)*(1-ramp(1.95,2.70));
    Object.assign(pose,{screen:[2,ink,scan],pitch:-.10*ink});
  }
  if(mode===31){
    const tear=weight*ramp(.13,.56)*(1-ramp(1.74,2.64));
    Object.assign(pose,{screen:[4,tear,clamp((time-.10)/1.02)],stretch:.10*tear});
  }
  if(mode===32){
    const iris=weight*ramp(.11,.81)*(1-ramp(1.62,2.58));
    Object.assign(pose,{screen:[5,iris,0],pitch:-.12*iris});
  }
  if(mode===33){
    const swing=weight*(pulse(.13,.67,1.41)-.42*pulse(1.22,1.61,2.27));
    Object.assign(pose,{screen:[6,Math.abs(swing),swing]});
  }
  if(mode===34){
    const impact=weight*(pulse(.17,.35,.88)+.70*pulse(.91,1.13,1.80));
    Object.assign(pose,{screen:[7,impact,time],stretch:.24*impact,lift:.11*impact});
  }
  if(mode===18)pose.particles=weight*ramp(.18,.68);
  return pose;
}
export function starActionPose(action,effect){
  if(action?.kind!=='expression')return [];
  const weight=clamp(action.weight/(action.mode==='blend'?.86:1));
  const time=action.elapsed/1000;
  const burst=(start,speed)=>smooth((time-start)/.09)*Math.exp(-Math.max(0,time-start)*speed)*weight;
  if(effect?.mode===3){
    const flight=effect.time;
    const pullback=smooth((flight-.19)/.62)*(1-smooth((flight-2.02)/.76));
    const [zoom,twist,hue]=effect.flightStars??[.45,0,0];
    const drive=weight*pullback;
    const impact=effect.impact??0;
    return [.11*impact,twist*drive,.62*impact,hue*drive,.72*impact,zoom*drive];
  }
  switch(action.name){
    case 'tidalRoll': {
      const swell=effect?.beat??0;
      return [.14*swell,.34*swell,.20*swell,.08*swell,.29*swell];
    }
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
    case 'tryingToRemember': {
      const search=pulse(.12,.86,1.62), loss=pulse(1.25,1.72,2.34);
      return {yaw:.25*search,pitch:-.19*search,eyeBias:.30*search,eyeHeight:-.42*loss,jaw:.035*loss};
    }
    case 'catchingOn': {
      const nod=.48*pulse(.16,.38,.64)+.75*pulse(.62,.84,1.13)+pulse(1.09,1.32,1.71);
      const smile=ramp(1.09,1.66);
      return {pitch:.22*nod,eyeLift:.023*smile,eyeHeight:-.20*smile,jaw:.046*smile};
    }
    case 'almostCrying': {
      const well=ramp(.16,.96), tremor=beat(5.6)*pulse(.48,1.12,2.04);
      return {pitch:.13*well,lift:-.049*well,eyeHeight:.22*well,jaw:.05*well+.025*tremor,skew:.034*tremor};
    }
    case 'braveFace': {
      const flinch=pulse(.07,.28,.72), settle=ramp(.45,1.15);
      return {pitch:-.25*flinch-.13*settle,lids:.90*flinch,tilt:.09*(flinch-settle),jaw:.035*settle};
    }
    case 'sideEye': {
      const turn=ramp(.14,.62)*(1-ramp(1.66,2.24));
      return {yaw:.29*turn,tilt:-.06*turn,eyeBias:.27*turn,lids:.97*pulse(1.30,1.52,1.80)};
    }
    case 'cushionBounce': {
      const landing=pulse(.08,.38,.59);
      const rebound=pulse(.38,.67,.96)+.45*pulse(.95,1.16,1.43);
      return {lift:-.15*landing+.13*rebound,stretch:-.24*landing+.15*rebound,pitch:.12*landing,jaw:.059*rebound,lids:1.22*landing};
    }
    case 'sneeze': {
      const inhale=pulse(.08,.63,.97), snap=pulse(.78,.96,1.31);
      return {pitch:-.18*inhale+.31*snap,lids:1.28*snap,jaw:.08*inhale+.13*snap,lift:-.10*snap};
    }
    case 'yawn': {
      const stretch=pulse(.17,1.18,2.58);
      return {pitch:-.17*stretch,jaw:.22*stretch,lids:.81*stretch,eyeHeight:-.26*stretch};
    }
    case 'gaspThenGrin': {
      const gasp=pulse(.06,.28,.95), grin=ramp(.59,1.34);
      return {pitch:-.24*gasp,lids:.29*grin,eyeHeight:.46*gasp,jaw:.16*gasp+.06*grin};
    }
    case 'holdingBreath': {
      const inhale=pulse(.12,.54,.87), hold=ramp(.49,.89)*(1-ramp(2.13,2.79));
      return {pitch:-.11*inhale,stretch:.12*hold,eyeHeight:.36*hold,jaw:.082*inhale};
    }
    case 'nervousLaugh': {
      const laugh=pulse(.18,.43,.69)+.67*pulse(.75,.94,1.22), glance=ramp(1.07,1.74);
      return {yaw:.25*glance,tilt:-.13*glance,skew:.033*glance,jaw:.105*laugh,eyeBias:.26*glance,lids:.42*laugh};
    }
    case 'nope': {
      const shake=pulse(.05,.30,.54)-pulse(.44,.69,.95)+.64*pulse(.85,1.06,1.39);
      return {yaw:.36*shake,tilt:-.12*shake,pitch:.08*Math.abs(shake)};
    }
    case 'hiccup': {
      const kick=pulse(.11,.24,.46)+.78*pulse(.76,.92,1.26);
      return {lift:.12*kick,pitch:-.20*kick,jaw:.15*kick,lids:.65*kick};
    }
    case 'queasy': {
      const roll=ramp(.18,.74)*(1-ramp(1.28,2.28));
      return {tilt:.25*roll,yaw:-.14*roll,skew:.041*roll,lids:.42*pulse(.63,1.12,1.95)};
    }
    case 'deflated': {
      const sink=ramp(.28,1.62);
      return {lift:-.15*sink,pitch:.19*sink,eyeHeight:-.31*sink,jaw:-.034*sink};
    }
    case 'startledFreeze': {
      const snap=pulse(.06,.22,.58), hold=ramp(.18,.61);
      return {pitch:-.29*snap-.08*hold,eyeHeight:.44*hold,jaw:.11*snap};
    }
    case 'sheepish': {
      const duck=pulse(.13,.72,1.53), peek=ramp(.85,1.61);
      return {pitch:.24*duck,yaw:-.15*duck,tilt:.12*peek,eyeBias:.22*peek,skew:.033*peek};
    }
    case 'aha': {
      const click=pulse(.30,.51,.84), grin=ramp(.48,.96);
      return {pitch:-.23*click,lift:.09*click,eyeHeight:.39*click-.18*grin,jaw:.10*click+.055*grin};
    }
    case 'suspicious': {
      const first=pulse(.13,.62,1.18), second=ramp(1.12,1.85);
      return {yaw:-.27*first+.21*second,eyeHeight:-.18*Math.max(first,second),eyeBias:.20*(first-second)};
    }
    case 'offended': {
      const recoil=pulse(.09,.35,1.02), turn=ramp(.63,1.21);
      return {pitch:-.32*recoil,yaw:.24*turn,tilt:-.11*turn,jaw:.084*recoil,lids:.38*turn};
    }
    case 'bored': {
      const sag=ramp(.25,1.45);
      return {pitch:.14*sag,lift:-.10*sag,eyeHeight:-.46*sag,lids:.36*sag,tilt:.065*sag};
    }
    case 'pleading': {
      const lift=ramp(.1,.84), falter=pulse(1.09,1.49,2.04);
      return {pitch:-.22*lift,eyeHeight:.28*lift,eyeLift:.032*lift,jaw:.07*falter,skew:-.022*falter};
    }
    case 'smug': {
      const rise=ramp(.24,1.22);
      return {pitch:-.19*rise,tilt:.16*rise,skew:-.045*rise,eyeBias:.24*rise,lids:.24*pulse(1.18,1.52,1.95)};
    }
    case 'giggleFit': {
      const burst=.65*pulse(.19,.36,.57)+.82*pulse(.53,.74,.98)+pulse(.92,1.16,1.57);
      return {lift:.10*burst,pitch:.15*burst,lids:.65*burst,jaw:.135*burst,stretch:.12*burst};
    }
    case 'anticipation': {
      const windup=pulse(.08,.55,1.05), lean=ramp(.65,1.28);
      return {pitch:-.13*windup+.22*lean,eyeHeight:.34*lean,eyeLift:.022*lean,jaw:.05*lean};
    }
    case 'incredulous': {
      const recoil=ramp(.14,.88), blink=pulse(.36,.49,.63);
      return {pitch:-.17*recoil,yaw:-.12*recoil,tilt:.15*recoil,eyeBias:.52*recoil,lids:.85*blink,skew:-.031*recoil};
    }
    case 'bracing': {
      const tuck=pulse(.15,.65,1.54), peek=pulse(1.0,1.31,1.79);
      return {pitch:.26*tuck,lift:-.09*tuck,lids:1.28*tuck,eyeBias:.34*peek};
    }
    case 'mischievous': {
      const glance=pulse(.10,.51,1.02), grin=ramp(.65,1.27);
      return {yaw:.23*glance-.10*grin,tilt:.11*grin,skew:.048*grin,jaw:.045*grin,eyeBias:.22*glance};
    }
    case 'flustered': {
      const first=pulse(.07,.32,.63), second=pulse(.59,.90,1.30);
      return {yaw:.23*first-.26*second,tilt:.11*(first-second),lids:.80*pulse(.48,.59,.72),jaw:.07*(first+second)};
    }
    case 'wonder': {
      const rise=ramp(.20,1.45), sweep=pulse(.53,1.30,2.26);
      return {pitch:-.23*rise,yaw:.16*sweep,tilt:-.10*sweep,eyeHeight:.27*rise,eyeLift:.032*rise,jaw:.038*rise};
    }
    case 'deadpan': {
      const glance=ramp(.38,.84)*(1-ramp(1.55,2.10));
      return {yaw:-.21*glance,eyeBias:.14*glance,lids:.83*pulse(.92,1.06,1.20)};
    }
    case 'doubleTake': {
      const away=pulse(.08,.50,.82),startle=pulse(.64,.90,1.78);
      return {yaw:.39*away-.10*startle,pitch:-.15*startle,tilt:.10*away,eyeHeight:.52*startle,jaw:.19*startle};
    }
    case 'sigh': {
      const inhale=pulse(.08,.70,1.24),exhale=pulse(.71,1.42,2.74);
      return {pitch:-.16*inhale+.20*exhale,lift:.04*inhale-.07*exhale,lids:.68*exhale,jaw:.04*inhale+.09*exhale};
    }
    case 'wince': {
      const reflex=pulse(.07,.30,.94),aftershock=pulse(.92,1.12,1.65);
      return {pitch:-.20*reflex,tilt:.12*reflex,lids:1.26*reflex+.39*aftershock,jaw:.036*reflex,skew:.035*(reflex+aftershock)};
    }
    case 'tender': {
      const settle=ramp(.18,.94);
      return {tilt:-.13*settle,pitch:.06*settle,lids:.26*pulse(.66,1.28,1.96),eyeLift:.026*settle};
    }
    case 'stifledLaugh': {
      const giggle=pulse(.28,.48,.71)+.8*pulse(.79,1.01,1.27);
      return {pitch:.11*giggle,lift:.045*giggle,lids:.72*giggle,jaw:.077*giggle,skew:.018*ramp(.2,.68)};
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
  let action=null,start=0,releasedAt=null,seenId='',handoff=null,pausedAt=null;
  const actionTime=time=>pausedAt??time;
  function sample(time=now()){
    time=actionTime(time);
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
    time=actionTime(time);
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
      if(next===null){if(action&&releasedAt===null)releasedAt=actionTime(now());return;}
      if(!next||typeof next.id!=='string'||next.id===seenId||!Number.isFinite(next.at)||!Number.isFinite(next.duration))return;
      const valid=makeActorAction(next.kind,next.name,next.duration/1000,next.mode,next.at,next.id,next.form,next.followUp?.name,next.appearance,next.followUp?.form,next.followUp?.appearance);if(!valid)return;
      seenId=next.id;
      const age=Math.max(0,Number.isFinite(next.pausedElapsed)?next.pausedElapsed:wallNow()-next.at);
      if(age>=valid.duration*(valid.followUp?2:1))return;
      const receipt=actionTime(now()),from=visual(receipt);
      handoff=from?.weight>.001?{from,at:receipt-age}:null;
      action=valid;start=receipt-age;releasedAt=null;
    },
    sample,visual,
    setPaused(paused){
      const time=now();
      if(paused){pausedAt??=time;return;}
      if(pausedAt===null)return;
      const hold=time-pausedAt;
      start+=hold;
      if(handoff)handoff.at+=hold;
      if(releasedAt!==null)releasedAt+=hold;
      pausedAt=null;
    },
    current(){
      const time=now();
      if(!sample(time)||releasedAt!==null)return null;
      const elapsed=actionTime(time)-start;
      return {...action,at:wallNow()-elapsed,...(pausedAt!==null?{pausedElapsed:elapsed}:{})};
    },
    release(){if(action&&releasedAt===null)releasedAt=actionTime(now());}
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
