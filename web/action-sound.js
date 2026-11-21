const cues={
  neutral:[['tone',0,.24,330,220]],
  curious:[['tone',0,.24,330,510],['tone',.17,.21,510,685]],
  joy:[['tone',0,.27,440,660],['tone',.15,.32,660,880]],
  angry:[['grit',0,.36,119,54],['air',.04,.27,870,310]],
  sad:[['tone',0,.43,392,294],['tone',.26,.46,294,174]],
  afraid:[['grit',0,.23,190,410],['tone',.13,.33,740,330]],
  thinking:[['tone',.15,.15,440,440],['tone',.49,.15,550,550],['tone',.83,.24,660,660]],
  listening:[['tone',0,.24,230,380],['tone',.28,.42,380,260]],
  flirting:[['tone',.30,.18,520,780],['tone',.43,.39,820,1040]],
  pop:[['tone',.20,.12,530,115],['air',.21,.24,3500,760],['tone',2.25,.35,450,850]],
  laugh:[['tone',.06,.14,360,490],['tone',.24,.16,410,560],['tone',.42,.28,510,390]],
  shy:[['tone',0,.34,570,450],['tone',.22,.28,355,395]],
  surprise:[['tone',.10,.21,275,920],['air',.18,.25,2200,640]],
  sleepy:[['tone',0,.64,235,150],['air',.44,.55,700,260]],
  proud:[['tone',0,.35,294,440],['tone',.20,.56,587,587]],
  delight:[['tone',.08,.25,500,815],['tone',.46,.28,630,1040]],
  skeptical:[['grit',.08,.29,304,262],['tone',.62,.22,400,485]],
  confused:[['tone',0,.22,460,380],['tone',.31,.25,470,625],['tone',.64,.28,460,350]],
  worried:[['grit',.09,.22,176,184],['grit',.49,.22,185,197],['tone',.73,.28,275,174]],
  relieved:[['air',.15,.96,1370,220],['tone',.63,.50,432,295]],
  dizzy:[['tone',.10,.81,275,680],['tone',.39,.92,800,260],['tone',1.13,.37,320,195]],
  grumpy:[['grit',.05,.35,137,91],['air',.44,.21,640,420]],
  determined:[['tone',.15,.20,130,98],['grit',.44,.45,185,330]],
  awe:[['tone',.08,1.37,270,540],['tone',.53,1.09,405,810]],
  pout:[['tone',.11,.25,389,259],['grit',.58,.19,155,117]],
  smirk:[['tone',.14,.24,417,492],['tone',.43,.25,580,528]],
  squint:[['tone',.12,.31,510,350],['tone',.54,.16,355,355]],
  disgust:[['grit',.15,.31,298,91],['air',.38,.27,1140,410]],
  tryingToRemember:[['tone',.21,.32,320,475],['tone',1.35,.32,460,315]],
  catchingOn:[['tone',.27,.12,320,382],['tone',.73,.12,390,475],['tone',1.23,.23,460,640]],
  almostCrying:[['tone',.55,.65,420,329],['air',1.08,.50,690,290]],
  braveFace:[['air',.18,.22,980,450],['tone',.66,.43,330,510]],
  sideEye:[['tone',.36,.24,510,345],['tone',1.45,.16,390,302]],
  cushionBounce:[['tone',.32,.19,170,72],['tone',.60,.23,340,478],['tone',1.10,.16,460,565]],
  sneeze:[['air',.27,.45,450,1170],['air',.91,.31,2900,530]],
  yawn:[['air',.45,1.48,740,360]],
  gaspThenGrin:[['air',.15,.29,1240,2230],['tone',.72,.53,440,784]],
  holdingBreath:[['air',.23,.48,390,990],['air',2.24,.36,760,280]],
  nervousLaugh:[['tone',.31,.18,530,430],['tone',.82,.19,580,430]],
  nope:[['tone',.18,.21,380,260],['tone',.61,.24,330,207]],
  hiccup:[['tone',.19,.12,335,590],['tone',.86,.15,394,645]],
  queasy:[['tone',.36,.53,390,267],['grit',.84,.35,178,133]],
  deflated:[['air',.30,1.13,1100,280],['tone',.55,.78,310,155]],
  startledFreeze:[['air',.12,.19,1980,540],['tone',.18,.25,620,335]],
  sheepish:[['tone',.29,.39,490,345],['tone',1.11,.31,365,465]],
  aha:[['tone',.42,.16,392,587],['tone',.55,.43,784,880]],
  suspicious:[['tone',.28,.30,380,310],['tone',1.15,.38,290,378]],
  offended:[['grit',.19,.21,235,105],['tone',.74,.32,470,340]],
  bored:[['tone',.38,.80,315,185]],
  pleading:[['tone',.29,.48,330,480],['tone',1.23,.39,480,399]],
  smug:[['tone',.42,.22,310,370],['tone',.81,.43,450,510]],
  giggleFit:[['tone',.28,.13,415,487],['tone',.67,.13,470,550],['tone',1.08,.24,511,670]],
  anticipation:[['air',.22,.64,470,1420],['tone',.90,.39,330,550]],
  incredulous:[['tone',.28,.28,520,290],['tone',.71,.42,349,390]],
  bracing:[['grit',.23,.30,154,95],['air',.91,.47,790,380]],
  mischievous:[['tone',.31,.20,582,470],['tone',.87,.37,480,735]],
  flustered:[['tone',.21,.15,415,570],['tone',.66,.17,590,400],['air',.85,.30,1180,620]],
  wonder:[['tone',.31,.64,330,440],['tone',.85,.72,495,660]],
  deadpan:[['tone',.64,.12,261,245]],
  doubleTake:[['tone',.18,.19,416,270],['tone',.71,.24,300,710]],
  sigh:[['air',.17,.45,440,1080],['air',.78,1.12,950,190]],
  wince:[['grit',.14,.15,310,160],['tone',.27,.28,460,245]],
  tender:[['tone',.32,.52,392,440],['tone',.68,.46,523,494]],
  stifledLaugh:[['tone',.38,.14,400,510],['tone',.91,.15,445,550]],
  explosion:[['grit',.05,.38,94,185],['tone',.43,.54,119,40],['air',.43,.89,4200,280],['tone',1.46,.63,185,740]],
  rainbow:[['tone',0,.30,392,523],['tone',.25,.33,523,660],['tone',.49,.36,660,784],['tone',.73,.58,784,1047]],
  pixelCascade:[['grit',.22,.25,480,206],['tone',.51,.29,242,480],['grit',1.02,.32,362,158],['tone',2.10,.37,290,720]],
  blueprint:[['tone',.17,.94,410,730],['tone',1.18,.15,780,790],['air',1.98,.64,1340,460]],
  paperTear:[['grit',.15,.41,280,170],['air',.32,.63,2300,570],['tone',1.71,.48,455,270]],
  iris:[['grit',.16,.43,212,141],['tone',.59,.46,382,255],['air',1.65,.51,650,1240]],
  stageTilt:[['air',.27,.54,430,1680],['tone',.53,.37,253,396],['tone',1.39,.38,340,246]],
  comicBurst:[['tone',.31,.19,240,110],['air',.32,.19,2660,460],['tone',1.07,.22,315,142]],
  disco:[['tone',.32,.14,135,75],['tone',.72,.14,142,80],['tone',1.12,.14,135,75],['tone',1.52,.14,142,80],['tone',1.92,.31,220,330]],
  curtainCall:[['air',.20,.85,550,1660],['tone',.62,.58,392,587],['tone',1.31,.82,523,784]],
  popcorn:[['tone',.38,.11,460,280],['tone',.88,.13,540,260],['tone',1.46,.13,640,295],['air',1.61,.3,1850,565]],
  lightspeed:[['grit',.13,.52,125,218],['air',.54,1.88,470,2360],['tone',.78,1.57,224,520],['air',2.56,.56,2180,395]],
  snowGlobe:[['air',.22,.37,820,1690],['air',.55,.43,920,1750],['tone',1.04,.63,830,660],['tone',1.53,.85,550,460]],
  nightfall:[['air',.23,.85,1170,280],['tone',.71,1.08,330,165],['tone',1.95,.52,240,480]],
  glassFold:[['air',.22,1.53,610,1560],['tone',.78,1.16,458,725]],
  flipbook:[['grit',.26,.11,250,165],['grit',.75,.11,325,190],['grit',1.23,.13,385,220],['tone',1.75,.22,395,245]],
  tidalRoll:[['air',.20,1.91,360,1250],['tone',.55,1.39,173,266],['air',1.46,1.07,940,250]],
  figureEight:[['tone',.18,.79,420,680],['tone',.98,.88,690,415],['air',1.91,.56,920,285]],
  slingshot:[['air',.12,1.82,520,2200],['tone',1.17,.62,300,570],['air',3.13,.34,1870,560]],
  meteorDive:[['tone',.20,1.0,335,752],['air',1.28,1.12,3070,380],['tone',2.12,.43,240,100]],
  phaseJump:[['tone',.30,.17,380,680],['tone',.78,.18,535,898],['tone',1.30,.21,654,1120],['air',3.17,.44,1350,570]],
  comet:[['air',.12,2.90,900,1980],['tone',.52,2.35,680,220],['air',3.14,.52,2100,520],['tone',3.22,.58,210,475]],
  shockwave:[['tone',.13,.46,100,45],['air',.18,.40,2100,360],['tone',.63,.39,83,42]],
  eclipse:[['tone',.14,1.37,240,115],['tone',.82,1.12,390,488]],
  sparkle:[['tone',0,.22,890,1280],['tone',.17,.27,1150,1590],['tone',.42,.41,750,1110]],
  prism:[['tone',.08,.60,330,490],['tone',.23,.72,444,880],['tone',.42,.88,592,1070]],
  heartbeat:[['tone',.18,.21,92,46],['tone',.45,.21,75,41],['tone',1.14,.21,92,46],['tone',1.42,.21,75,41]],
  orbit:[['tone',.20,.54,415,622],['tone',.56,.54,622,830],['tone',1.02,.70,830,415],['tone',1.74,.72,415,622],['tone',3.21,.54,622,370]],
  melt:[['grit',.15,.62,260,68],['air',.52,.59,1120,310],['tone',1.45,.40,150,390]],
  aurora:[['tone',.08,1.62,445,610],['tone',.35,1.84,595,820],['air',.45,1.42,1480,720]],
  wormhole:[['air',.13,2.57,1000,260],['grit',.38,2.24,180,48],['tone',2.63,.67,88,330]],
  crystal:[['tone',.08,.30,740,740],['tone',.27,.46,990,990],['tone',.53,.69,1480,1320]],
  nebula:[['air',.15,1.99,450,1450],['tone',.47,1.81,225,339],['tone',1.04,1.33,452,571]],
  echo:[['tone',.14,.32,480,680],['tone',.38,.37,500,570,.70],['tone',.62,.38,490,530,.47]],
  lantern:[['tone',.12,1.14,285,510],['tone',.31,1.27,427,765],['air',.48,.94,800,1170]],
  gravity:[['grit',.14,.91,160,48],['air',.48,.63,1400,250],['tone',1.18,.62,67,289]],
  fireflies:[['tone',.24,.43,860,1120],['tone',.53,.29,1240,1490],['tone',.85,.43,930,1130],['tone',1.14,.47,1440,1540]],
  nod:[['tone',.39,.23,285,181],['tone',.62,.19,190,248]],
  'look-left':[['air',0,.35,1050,480],['tone',.14,.20,420,290]],
  'look-right':[['air',0,.35,580,1250],['tone',.14,.20,295,445]],
  blink:[['air',.09,.16,1800,470]]
};
const durationCues=new Set(['comet','orbit','wormhole']);
const particleLayers={
  pop:{scatter:[.22,.54,9,2100,.34,-.31],extra:[['air',.22,.17,5100,1640,.43,0,.22],['tone',2.21,.29,630,985,.36,-.28,.21]]},
  explosion:{scatter:[.46,1.48,16,1330,.42,-.64],extra:[['tone',.43,.68,74,29,.79,0,0],['air',.46,1.02,2210,370,.46,-.59,.56],['air',1.47,.54,385,1720,.51,.45,-.26]]},
  comet:{scatter:[.66,2.71,13,1530,.26,-.27],extra:[['air',.35,2.65,490,1540,.46,-.64,.92],['tone',.62,2.38,545,232,.30,-.69,.84],['air',3.13,.60,2560,580,.70,-.75,.06]]},
  orbit:{scatter:[.48,3.38,16,1430,.23,.14],extra:[['tone',.42,1.44,289,435,.25,-.69,.76],['tone',1.25,1.57,570,392,.32,.76,-.63]]},
  sparkle:{scatter:[.08,1.67,17,2090,.33,.42],extra:[['tone',.34,.90,620,1100,.26,-.43,.66]]},
  flirting:{scatter:[.24,1.67,9,1370,.23,.35],extra:[['tone',.38,.59,389,585,.30,-.31,.33]]},
  fireflies:{scatter:[.26,2.88,19,1650,.26,.33],extra:[['tone',.73,1.64,460,645,.19,-.58,.59]]},
  nebula:{scatter:[.66,2.73,10,983,.24,.12],extra:[['air',.27,2.47,813,490,.29,-.83,.66],['tone',.50,2.14,183,275,.35,.70,-.64]]},
  wormhole:{scatter:[.44,2.52,13,860,.27,-.41],extra:[['air',.49,2.22,2070,390,.39,-.74,.21],['grit',.83,1.72,94,43,.23,.74,-.22]]},
  aurora:{scatter:[.48,2.18,11,1480,.22,.27],extra:[['air',.27,2.14,1190,2500,.28,-.87,.73],['tone',.53,1.61,413,823,.25,.69,-.55]]}
};
export function actionSoundPlan(name,duration=4000){
  if(!Object.hasOwn(cues,name))return [];
  const scale=durationCues.has(name)?Math.min(1.25,Math.max(.75,duration/4000)):1;
  const layers=particleLayers[name];
  const notes=[...cues[name],...(layers?.extra??[])];
  if(layers){
    const [begin,end,count,pitch,level,slope]=layers.scatter;
    for(let index=0;index<count;index++){
      const fraction=index/(count-1),pattern=.5+.5*Math.sin(index*12.9898+count);
      const step=(end-begin)/(count-1),at=begin+fraction*(end-begin)+pattern*step*.42;
      const length=.085+.17*pattern;
      const from=pitch*(.58+.74*pattern)*(1+slope*fraction);
      const pan=Math.sin(index*2.39996+fraction*3)*(.48+.43*fraction);
      const gain=level*(.55+.45*pattern)*(1-fraction*.62);
      notes.push(['tone',at,length,from,from*(.81+.30*pattern),gain,pan,pan*.76]);
      if(index%3===0)notes.push(['tone',at+.013,length*.74,from*1.91,from*1.76,gain*.38,-pan*.67,-pan*.85]);
    }
  }
  return notes.map(([type,at,length,from,to,level=1,pan=0,panEnd=pan])=>({type,at:at*scale,length:length*scale,from,to,level,pan,panEnd}));
}
export function createActionSound(){
  let context=null,noise=null,current=null,paused=false;
  async function setPaused(value){
    if(paused===value)return;
    paused=value;
    if(!context)return;
    if(paused)await context.suspend();
    else if(current)await context.resume();
  }
  function stop(){
    if(!current)return;
    const voice=current;current=null;
    const now=context.currentTime,end=now+.14;
    if(voice.bus.gain.cancelAndHoldAtTime)voice.bus.gain.cancelAndHoldAtTime(now);
    else{voice.bus.gain.cancelScheduledValues(now);voice.bus.gain.setValueAtTime(voice.bus.gain.value,now);}
    voice.bus.gain.linearRampToValueAtTime(0,end);
    for(const source of voice.sources)try{source.stop(end);}catch{}
  }
  async function play(action,delay=0){
    const plan=actionSoundPlan(action.name,action.duration);
    if(action.followUp)plan.push(...actionSoundPlan(action.followUp.name,action.duration).map(note=>({...note,at:note.at+action.duration/1000})));
    if(!plan.length)return;
    const Audio=globalThis.AudioContext??globalThis.webkitAudioContext;
    if(!Audio)return;
    context??=new Audio({latencyHint:'interactive'});
    stop();
    const bus=context.createGain();
    const limiter=context.createDynamicsCompressor();
    limiter.threshold.value=-15;limiter.ratio.value=5;limiter.attack.value=.004;limiter.release.value=.14;
    bus.gain.value=.44;
    bus.connect(limiter).connect(context.destination);
    const voice={bus,sources:[]};current=voice;
    let pending=plan.length;
    try{if(paused)await context.suspend();else if(context.state==='suspended')await context.resume();}
    catch(error){bus.disconnect();limiter.disconnect();if(current===voice)current=null;throw error;}
    if(current!==voice){bus.disconnect();limiter.disconnect();return;}
    const start=context.currentTime+.015+delay;
    for(const note of plan){
      const at=start+note.at,end=at+note.length;
      const volume=context.createGain();
      volume.gain.setValueAtTime(.0001,at);
      volume.gain.exponentialRampToValueAtTime(note.level*(note.type==='air'?.15:note.type==='grit'?.12:.17),at+Math.min(.05,note.length*.22));
      volume.gain.exponentialRampToValueAtTime(.0001,end);
      let panner;
      if(context.createStereoPanner&&(note.pan||note.panEnd)){
        panner=context.createStereoPanner();
        panner.pan.setValueAtTime(note.pan,at);
        panner.pan.linearRampToValueAtTime(note.panEnd,end);
        volume.connect(panner).connect(bus);
      }else volume.connect(bus);
      let source,filter;
      if(note.type==='air'){
        if(!noise){
          noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
          const samples=noise.getChannelData(0);
          for(let index=0;index<samples.length;index++)samples[index]=Math.random()*2-1;
        }
        source=context.createBufferSource();source.buffer=noise;source.loop=true;
        filter=context.createBiquadFilter();filter.type='bandpass';filter.Q.value=.73;
        filter.frequency.setValueAtTime(note.from,at);filter.frequency.exponentialRampToValueAtTime(note.to,end);
        source.connect(filter).connect(volume);
      }else{
        source=context.createOscillator();source.type=note.type==='grit'?'triangle':'sine';
        source.frequency.setValueAtTime(note.from,at);source.frequency.exponentialRampToValueAtTime(note.to,end);
        source.connect(volume);
      }
      voice.sources.push(source);
      source.onended=()=>{
        source.disconnect();filter?.disconnect();volume.disconnect();panner?.disconnect();
        if(--pending===0){bus.disconnect();limiter.disconnect();if(current===voice)current=null;}
      };
      source.start(at);source.stop(end+.005);
    }
  }
  return {play,stop,setPaused};
}
