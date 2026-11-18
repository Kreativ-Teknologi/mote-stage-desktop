import {createShowClock} from './show-clock.js';
import {ACTION_BODY_HINTS} from './action-body.js';
import {requestLocalMedia} from './media-input.js';
import {makeActorAction,createActorActionPlayer,actorGesturePose,ACTOR_LABELS} from './actor-actions.js';
import {APPEARANCE_DEFAULTS,CONTROLS,pickAppearance} from './appearance-settings.js';
import {createAppearanceUI} from './appearance-ui.js';
import {getRenderSettings,gesturePose} from './render-settings.js';
import {createTrackingFailsafe} from './tracking-failsafe.js';
import {createStageLink} from './stage-link.js';
import {cameraHeadPose} from './head-motion.js';
import {createCalibrationUI} from './calibration-ui.js';
import {createWebcam} from './webcam.js';
import './orb-renderer.js';
(() => {
  'use strict';

  const STAGE_MODE = new URLSearchParams(location.search).get('view') === 'stage';
  const STATE_KEY = 'mote-stage-state-v1';
  const CUES_KEY = 'mote-stage-cues-v1';
  const ASSET_DB = 'mote-stage-art-v1';
  const MOODS = ['neutral','curious','joy','angry','sad','afraid','thinking','listening'];
  const SCENES = ['aether','ember','dawn','void'];
  const ROLES = ['speaker','listener'];
  const defaultCues = [
    {title:'Opening / awaiting', emotion:'neutral', scene:'aether', role:'speaker'},
    {title:'Arrival / curiosity', emotion:'curious', scene:'aether', role:'listener'},
    {title:'First words', emotion:'joy', scene:'dawn', role:'speaker'},
    {title:'The confrontation', emotion:'angry', scene:'ember', role:'speaker'},
    {title:'The question', emotion:'thinking', scene:'void', role:'listener'},
    {title:'Resolution', emotion:'joy', scene:'dawn', role:'speaker'}
  ];
  const defaults = {
    ...APPEARANCE_DEFAULTS,
    actorActionDuration:4,actorActionMode:'blend',actionSurface:1,freeHeadMovement:false,headMovement:1,audioFluid:true,faceStrength:1.8,trackingFailsafe:true,trackingBlackout:false,look:'luminous',expressionMode:'manual',emotion:'neutral',scene:'aether',role:'speaker',intensity:.95,sensitivity:1.8,gate:.018,
    facePresence:.92,fluidMotion:.35,orbSize:.72,renderQuality:1.3,surfaceDeformation:0,glassDepth:.40,
    voiceHalo:.7,starField:.35,bloomStrength:.48,flareStrength:.18,edgeGlow:.7,refraction:.40,dispersion:.12,internalDepth:.25,surfaceRipples:.10,
    voiceReactive:true,freeze:false,blackout:false,showName:false,name:'Nord',
    activeCue:0,mouthX:50,mouthY:59,mouthScale:20
  };
  const safeLoad = (key,fallback) => {
    try { const stored = localStorage.getItem(key);return stored ? JSON.parse(stored) : fallback; }
    catch (_) { return fallback; }
  };
  let state = {...defaults,...safeLoad(STATE_KEY,{})};
  if(!state.independentStarsV1){state.starPalette=Math.max(0,SCENES.indexOf(state.scene));state.starColors=state.customColors?[...state.customColors]:null;state.starHue=Number(state.hueShift)||0;state.starSaturation=Number(state.colorSaturation)||1;state.starFollowAvatar=false;state.independentStarsV1=true;}
  Object.assign(state,pickAppearance(state));
  state.actorActionDuration=Math.max(3,Math.min(5,Number(state.actorActionDuration)||4));
  state.actorActionMode=state.actorActionMode==='override'?'override':'blend';
  if(!STAGE_MODE)state.trackingBlackout=false;
  if(!state.emotiveV2)state.emotiveV2=true;
  if(!state.luminousFaceV1){
    if(state.look==='luminous'&&Number(state.facePresence)<.1)state.facePresence=.92;
    state.luminousFaceV1=true;
  }
  if(!state.nordV1){if(!state.name||state.name==='MOTE')state.name='Nord';state.nordV1=true;}
  let cues = safeLoad(CUES_KEY, defaultCues);
  if (!Array.isArray(cues) || !cues.length) cues = structuredClone(defaultCues);
  cues = cues.filter(c => c && typeof c.title === 'string').slice(0,50);
  if (!cues.length) cues = structuredClone(defaultCues);
  const id = name => document.getElementById(name);
  const $ = (sel,root=document) => root.querySelector(sel);
  const $$ = (sel,root=document) => [...root.querySelectorAll(sel)];
  const clamp = (v,min=0,max=1) => Math.min(max,Math.max(min,v));
  const escapeHTML = val => String(val).replace(/[&<>"']/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const showClock=createShowClock(performance.timeOrigin,!STAGE_MODE);
  const link=createStageLink(window,receive);
  const webcam=STAGE_MODE?null:createWebcam(id('cameraPreview'),id('cameraStatus'));
  const trackingFailsafe=createTrackingFailsafe();
  const actorActions=createActorActionPlayer();
  let cameraRequested=false,trackingTestUntil=0;
  let tracking=null,trackingAt=0,frozenTracking=null,lastTrackingSend=0;
  let stageAssetsReceived=false;
  let stageSeenAt = 0;
  let meter = {target:0,smoothed:0,liveAt:0,lastSent:0,
    bass:0,mid:0,treble:0,bassTarget:0,midTarget:0,trebleTarget:0};
  let audio = {ctx:null,stream:null,source:null,analyser:null,buffer:null,freq:null,active:false,starting:false};
  let demoUntil = 0;
  let assets = {base:null,mouthOpen:null,mouthClosed:null};
  let gesture = {name:'',at:0};
  let appearanceUI=null,calibrationUI=null;
  let powerTransitionAt=-10000;
  let blink = {next:performance.now()+2200,until:0};
  let lastSync = performance.now();
  let toastTimer = 0;
  let heartbeatAt = 0;
  let fpsFrames = 0, fpsStart = performance.now(), fpsValue = 0;

  document.body.classList.toggle('stage-mode',STAGE_MODE);
  const baseTitle=STAGE_MODE?'Nord — Audience Display':'Nord — Performance Control';
  document.title=baseTitle;
  window.MOTEDesktop?.version().then(version=>{id('buildVersion').textContent='v'+version;document.title=baseTitle+' · v'+version;});

  function notify(message) {
    const box = id('toast');
    if (!box || STAGE_MODE) return;
    box.textContent = message;
    box.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('visible'),3300);
  }
  function post(message) {link.post(STAGE_MODE?message:{...message,clockOrigin:performance.timeOrigin});}
  function persist() {
    if (STAGE_MODE) return;
    try {localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(_){notify('Browser storage is unavailable. This session will still work.');}
  }
  function persistCues(){try{localStorage.setItem(CUES_KEY,JSON.stringify(cues));}catch(_){/* session only */}}
  function broadcastState() {
    if (STAGE_MODE) return;
    persist();
    post({type:'state',state:{...state},sent:Date.now()});
    applyState();
    updateConsole();
  }
  function setState(changes) {if ('emotion' in changes) changes.expressionMode='manual';Object.assign(state,changes);broadcastState();}
  function syncFromState(next) {
    if (!STAGE_MODE || !next || typeof next !== 'object') return;
    state={...defaults,...next};
    applyState();positionMouth();
    lastSync=performance.now();
    id('stageConnection').textContent='CONSOLE CONNECTED';
  }
  function receive(event) {
    const msg=event?.data;
    if (!msg || typeof msg !== 'object') return;
    if(STAGE_MODE)showClock.receive(msg.clockOrigin);
    if (msg.type==='hello' && !STAGE_MODE) {stageSeenAt=performance.now();post({type:'state',state:{...state}});if(msg.needsAssets)post({type:'assets',assets});post({type:'actor-action',action:actorActions.current()});}
    if(msg.type==='tracking'&&STAGE_MODE){tracking=msg.sample;trackingAt=performance.now();}
    if (msg.type==='state' && STAGE_MODE) syncFromState(msg.state);
    if (msg.type==='meter' && STAGE_MODE) {
      meter.target=clamp(Number(msg.level)||0);
      meter.bassTarget=clamp(Number(msg.bass)||0);
      meter.midTarget=clamp(Number(msg.mid)||0);
      meter.trebleTarget=clamp(Number(msg.treble)||0);
      meter.liveAt=performance.now();lastSync=performance.now();
    }
    if (msg.type==='heartbeat' && STAGE_MODE) {
      lastSync=performance.now();id('stageConnection').textContent='CONSOLE CONNECTED';
      post({type:'stage-alive',fps:fpsValue});
    }
    if (msg.type==='stage-alive' && !STAGE_MODE) {
      stageSeenAt=performance.now();
      const el=id('connectionStatus');
      if(el)el.textContent='OUTPUT CONNECTED';
    }
    if(msg.type==='actor-action'&&STAGE_MODE)actorActions.receive(msg.action);
    if (msg.type==='gesture') triggerGestureLocal(msg.name);
    if(msg.type==='assets'&&STAGE_MODE&&msg.assets){assets=msg.assets;stageAssetsReceived=true;renderAssets();}
  }

  window.addEventListener('storage',e=>{
    if (STAGE_MODE && e.key===STATE_KEY && e.newValue){try{syncFromState(JSON.parse(e.newValue));}catch(_){/* ignore */}}
    if (STAGE_MODE && e.key===CUES_KEY){/* cues only affect backstage labels */}
  });

  function sceneStars(){
    const holder=id('sceneStars');
    for(let i=0;i<70;i++){
      const sp=document.createElement('span');sp.className='scene-star';
      const x=((i*73.17+19.7)%97)+1,y=((i*i*11.37+i*17.91)%96)+2;
      sp.style.left=x+'%';sp.style.top=y+'%';
      sp.style.width=sp.style.height=(i%8===0?3:1.4)+'px';
      sp.style.animationDelay=-(i%11)*.77+'s';sp.style.animationDuration=(3.5+(i%7)*.63)+'s';
      holder.appendChild(sp);
    }
  }
  sceneStars();

  function applyState(){
    const surface=id('stageSurface');
    surface.dataset.scene=SCENES.includes(state.scene)?state.scene:'aether';
    const black=!!(state.blackout||state.trackingBlackout);
    for(const powerSurface of [surface,...(!STAGE_MODE?[id('actorStageSurface')]:[])]){
    if(powerSurface.dataset.power!==String(black)){
      const surface=powerSurface;
      const initialized=surface.dataset.power!==undefined;
      surface.dataset.power=String(black);
      surface.classList.toggle('blackout',black);
      surface.classList.remove('tv-off','tv-on');
      void surface.offsetWidth;
      if(initialized){powerTransitionAt=performance.now();surface.classList.add(black?'tv-off':'tv-on');}
    }
    }
    id('stageName').textContent=state.name||'Nord';
    id('stageFooter').style.display=state.showName?'flex':'none';
    if (STAGE_MODE) return;
    id('previewMoodLabel').textContent=(state.emotion+' · '+(state.role==='speaker'?'speaking':'listening')+' · '+({aether:'Opal',ember:'Aurora',dawn:'Prism',void:'Abyss'}[state.scene]||state.scene)).toUpperCase();
    id('monitorRole').textContent='VOICE → '+state.role.toUpperCase()+' MODE';
    id('activeCueLabel').textContent=(cues[state.activeCue]?.title||'MANUAL PERFORMANCE').toUpperCase();
    id('freezeButton').classList.toggle('active',!!state.freeze);
    id('blackoutButton').classList.toggle('active',black);
    id('freezeButton').querySelector('strong').textContent=state.freeze?'Resume motion':'Freeze pose';
    id('blackoutButton').querySelector('strong').textContent=state.trackingBlackout&&!state.blackout?'Tracking lost':state.blackout?'Restore image':'Blackout';
  }

  function updateConsole(){
    if(STAGE_MODE)return;
    id('baseEmotion').value=state.emotion;
    id('actorActionDuration').value=state.actorActionDuration||4;id('actorActionDurationOutput').textContent=(state.actorActionDuration||4)+' s';
    id('actorActionMode').value=state.actorActionMode||'blend';
    id('actionSurface').value=Math.round((state.actionSurface??1)*100);id('actionSurfaceOutput').textContent=Math.round((state.actionSurface??1)*100)+'%';
    id('freeHeadMovement').checked=!!state.freeHeadMovement;id('headMovement').value=Math.round((state.headMovement??1)*100);id('headMovementOutput').textContent=Math.round((state.headMovement??1)*100)+'%';
    updateActorControls();
    $$('.look-btn').forEach(b=>{b.classList.toggle('selected',b.dataset.look===state.look);b.setAttribute('aria-pressed',String(b.dataset.look===state.look));});
    $$('.scene-btn').forEach(b=>b.classList.toggle('selected',b.dataset.scene===state.scene&&!state.customColors));
    $$('.role-btn').forEach(b=>{b.classList.toggle('selected',b.dataset.role===state.role);b.setAttribute('aria-pressed',String(b.dataset.role===state.role));});
    id('cameraFace').checked=!!state.cameraFace;
    id('trackingFailsafe').checked=state.trackingFailsafe!==false;
    id('audioFluid').checked=state.audioFluid!==false;
    id('expressionMode').value=state.expressionMode||'manual';
    id('characterName').value=state.name;
    id('showCharacterName').checked=!!state.showName;
    id('voiceReactive').checked=!!state.voiceReactive;
    id('intensity').value=Math.round(state.intensity*100);
    id('intensityOutput').textContent=Math.round(state.intensity*100)+'%';
    id('sensitivity').value=state.sensitivity;
    id('sensitivityOutput').textContent=Number(state.sensitivity).toFixed(1)+'×';
    id('noiseGate').value=state.gate;
    id('gateOutput').textContent=Number(state.gate).toFixed(3);
    appearanceUI?.update();
    id('renderQuality').value=String(state.renderQuality||1);
    for(const name of ['mouthX','mouthY','mouthScale']){
      id(name).value=state[name];id(name+'Output').textContent=state[name]+'%';
    }
    $$('.cue-row').forEach((el,i)=>el.classList.toggle('active',state.activeCue===i));
    updateNextLabel();
    positionMouth();
  }
  function updateNextLabel(){
    const next=cues[(state.activeCue||0)+1];
    id('nextCue').disabled=!next;
    id('nextCueLabel').textContent=next?next.title:'End of cue sequence';
  }
  function renderCues(){
    const holder=id('cueList');holder.replaceChildren();
    const labels={aether:'Opal',ember:'Aurora',dawn:'Prism',void:'Abyss',speaker:'Speaking',listener:'Listening',joy:'Joyful'};
    const options=(arr,val)=>arr.map(x=>`<option value="${x}" ${x===val?'selected':''}>${labels[x]||x.charAt(0).toUpperCase()+x.slice(1)}</option>`).join('');
    cues.forEach((c,i)=>{
      const div=document.createElement('div');div.className='cue-row'+(i===state.activeCue?' active':'');
      div.innerHTML=`<div class="cue-main"><button class="cue-take" title="Take cue ${i+1}" type="button">${String(i+1).padStart(2,'0')}</button><input class="cue-name" aria-label="Cue ${i+1} title" maxlength="64" value="${escapeHTML(c.title)}"/><button type="button" class="cue-remove" aria-label="Remove cue">×</button></div><div class="cue-details"><select aria-label="Cue expression">${options(MOODS,c.emotion)}</select><select aria-label="Cue scene">${options(SCENES,c.scene)}</select><select aria-label="Cue microphone role">${options(ROLES,c.role)}</select></div>`;
      $('.cue-take',div).addEventListener('click',()=>takeCue(i));
      $('.cue-name',div).addEventListener('input',e=>{c.title=e.target.value;persistCues();updateNextLabel();if(i===state.activeCue)applyState();});
      $$('.cue-details select',div).forEach((sel,n)=>sel.addEventListener('change',e=>{
        c[['emotion','scene','role'][n]]=e.target.value;persistCues();
        if(i===state.activeCue)takeCue(i);
      }));
      $('.cue-remove',div).addEventListener('click',()=>{
        if(cues.length<2){notify('Keep at least one cue.');return;}
        cues.splice(i,1);
        state.activeCue=clamp(state.activeCue-(i<=state.activeCue?1:0),0,cues.length-1);
        persistCues();renderCues();broadcastState();
      });
      holder.appendChild(div);
    });
    updateNextLabel();
  }
  function takeCue(i){
    const cue=cues[i];if(!cue)return;
    releaseActorAction();
    Object.assign(state,{expressionMode:'manual',emotion:cue.emotion,scene:cue.scene,role:cue.role,activeCue:i,blackout:false,freeze:false});
    broadcastState();renderCues();
  }
  function takeNextCue(){takeCue(state.activeCue+1);}

  function playActorAction(kind,name){
    const action=makeActorAction(kind,name,state.actorActionDuration,state.actorActionMode);
    if(!action)return;
    actorActions.receive(action);post({type:'actor-action',action});updateActorControls();
  }
  function releaseActorAction(){actorActions.release();post({type:'actor-action',action:null});updateActorControls();}
  function updateActorControls(){
    if(STAGE_MODE)return;
    const action=actorActions.sample();
    document.querySelectorAll('[data-actor-kind]').forEach(b=>{
      const active=!!action&&b.dataset.actorKind===action.kind&&b.dataset.actorName===action.name;
      b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      b.style.setProperty('--action-progress',active?String(action.progress):'0');
    });
    id('releaseActorAction').disabled=!action;
    const status=action?ACTOR_LABELS[action.name]:state.cameraFace&&tracking?'Face tracking':'Ready';
    if(id('actorActionStatus').textContent!==status)id('actorActionStatus').textContent=status;
    id('actorActionCountdown').textContent=action?' · '+(action.remaining/1000).toFixed(1)+' s':'';
    id('actorActionHint').textContent='Tap an action · '+(state.actorActionDuration||4)+' seconds · returns automatically';
    id('actorInputStatus').textContent=(webcam?.active?(tracking?'Tracking live':'Finding face'):'Camera off')+' / '+(audio.active?'Mic live':'Mic off');
  }
  function triggerGestureLocal(name){gesture={name,at:performance.now()};if(name==='blink')blink.until=performance.now()+200;}
  function triggerGesture(name){triggerGestureLocal(name);post({type:'gesture',name});}
  function openStage(){
    if(window.MOTEDesktop){window.MOTEDesktop.openOutput().then(()=>notify('Avatar window ready.')).catch(err=>notify(err.message));return;}
    const url=new URL(location.href);url.searchParams.set('view','stage');
    const win=window.open(url.toString(),'mote-stage-display','width=1280,height=720');
    if(win){link.add(win);post({type:'state',state:{...state}});win.focus();notify('Stage window opened. Move it to the projector and press F.');}
    else notify('Pop-up blocked. Allow pop-ups or open '+url.toString());
  }
  async function requestFullscreen(){
    try {if(!document.fullscreenElement) await id('stageSurface').requestFullscreen();else await document.exitFullscreen();}
    catch(_){if(STAGE_MODE)id('stageConnection').textContent='USE BROWSER FULLSCREEN (F11)';}
  }

  function setupNdiOutput(){
    const desktop=window.MOTEDesktop;
    if(!desktop?.getNdiOutput)return;
    const button=id('ndiToggle');
    let phase='off',changing=false;
    function render(){
      button.disabled=changing||phase==='starting'||phase==='stopping';
      button.textContent={off:'Start NDI',starting:'Starting NDI…',live:'Stop NDI',stopping:'Stopping NDI…'}[phase];
    }
    const unsubscribe=desktop.onNdiOutput(state=>{
      phase=state.phase;
      render();
      if(state.message)notify(state.message);
    });
    window.addEventListener('pagehide',unsubscribe,{once:true});
    desktop.getNdiOutput().then(state=>{
      button.hidden=!state.supported;
      phase=state.phase;
      render();
    }).catch(error=>console.error(error));
    button.addEventListener('click',async()=>{
      changing=true;
      render();
      try{await desktop.setNdiOutput(phase==='off');}
      catch(error){notify(error.message);}
      finally{changing=false;render();}
    });
  }

  function setupConsole(){
    setupNdiOutput();
    calibrationUI=createCalibrationUI({webcam,notify});
    const selectTab=name=>{
      document.body.dataset.tab=name;
      document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===name)));
    };
    selectTab('actor');
    const selectSettings=name=>{document.body.dataset.settings=name;document.querySelectorAll('[data-settings-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.settingsTab===name)));};
    selectSettings('inputs');
    id('openTrackingSettings').addEventListener('click',()=>selectSettings('profiles'));
    document.querySelectorAll('[data-settings-tab]').forEach(b=>b.addEventListener('click',()=>selectSettings(b.dataset.settingsTab)));
    document.querySelectorAll('[data-actor-kind]').forEach(b=>{if(ACTION_BODY_HINTS[b.dataset.actorName])b.title=ACTION_BODY_HINTS[b.dataset.actorName];b.addEventListener('click',()=>playActorAction(b.dataset.actorKind,b.dataset.actorName));});
    id('releaseActorAction').addEventListener('click',releaseActorAction);
    id('baseEmotion').addEventListener('change',e=>setState({emotion:e.target.value,activeCue:-1}));
    id('actorActionDuration').addEventListener('input',e=>setState({actorActionDuration:Math.max(3,Math.min(5,Number(e.target.value)))}));
    id('actorActionMode').addEventListener('change',e=>setState({actorActionMode:e.target.value}));
    document.querySelectorAll('button[data-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));

    const cameraDevice=id('cameraDevice'),media=navigator.mediaDevices;
    const cameraDeviceKey='mote-camera-device';
    const savedCamera=safeLoad(cameraDeviceKey,'');
    let selectedCamera=typeof savedCamera==='string'?savedCamera:'',deviceRefresh=0;
    function showCameraDevices(devices){
      const options=devices.filter(device=>device.kind==='videoinput'&&device.deviceId)
        .map((device,index)=>new Option(device.label||`Camera ${index+1}`,device.deviceId));
      if(selectedCamera&&!options.some(option=>option.value===selectedCamera)){
        options.push(new Option('Saved camera (unavailable)',selectedCamera));
      }
      cameraDevice.replaceChildren(new Option('System default',''),...options);
      cameraDevice.value=selectedCamera;
    }
    async function refreshCameraDevices(){
      const refresh=++deviceRefresh;
      try{
        const devices=await media?.enumerateDevices();
        if(refresh===deviceRefresh&&devices)showCameraDevices(devices);
      }catch{/* The system default remains available when enumeration fails. */}
    }
    showCameraDevices([]);
    refreshCameraDevices();
    media?.addEventListener('devicechange',refreshCameraDevices);
    cameraDevice.addEventListener('change',()=>{
      selectedCamera=cameraDevice.value;
      try{localStorage.setItem(cameraDeviceKey,JSON.stringify(selectedCamera));}catch{/* session only */}
    });
    id('cameraToggle').addEventListener('click',async()=>{
      if(webcam.active||webcam.starting){cameraRequested=false;trackingTestUntil=0;webcam.stop();}
      else{
        cameraRequested=true;
        const pending=webcam.start(selectedCamera);
        updateCameraControls();
        if(!await pending&&!webcam.starting&&!webcam.active)cameraRequested=false;
        refreshCameraDevices();
      }
      updateCameraControls();
    });
    id('cameraCenter').addEventListener('click',()=>webcam.calibrate());
    id('freeHeadMovement').addEventListener('change',e=>setState({freeHeadMovement:e.target.checked}));
    id('headMovement').addEventListener('input',e=>setState({headMovement:Number(e.target.value)/100}));
    id('actionSurface').addEventListener('input',e=>setState({actionSurface:Number(e.target.value)/100}));
    id('cameraFace').addEventListener('change',e=>setState({cameraFace:e.target.checked}));
    id('trackingFailsafe').addEventListener('change',e=>setState({trackingFailsafe:e.target.checked}));
    id('testTrackingLoss').addEventListener('click',()=>{trackingTestUntil=performance.now()+2600;notify('Testing tracking loss. Nord will shut down, then restore.');});
    window.addEventListener('pagehide',()=>{media?.removeEventListener('devicechange',refreshCameraDevices);webcam.stop();});
    id('expressionMode').addEventListener('change',e=>{setState({expressionMode:e.target.value});candidateSince=performance.now();});
    $$('.role-btn').forEach(b=>b.addEventListener('click',()=>setState({role:b.dataset.role,activeCue:-1})));
    id('characterName').addEventListener('input',e=>setState({name:e.target.value.slice(0,24)}));
    id('showCharacterName').addEventListener('change',e=>setState({showName:e.target.checked}));
    id('voiceReactive').addEventListener('change',e=>setState({voiceReactive:e.target.checked}));
    id('intensity').addEventListener('input',e=>setState({intensity:Number(e.target.value)/100}));
    id('sensitivity').addEventListener('input',e=>setState({sensitivity:Number(e.target.value)}));
    id('noiseGate').addEventListener('input',e=>setState({gate:Number(e.target.value)}));
    for(const name of ['mouthX','mouthY','mouthScale'])id(name).addEventListener('input',e=>{state[name]=Number(e.target.value);positionMouth();id(name+'Output').textContent=state[name]+'%';broadcastState();});
    id('micToggle').addEventListener('click',async()=>{if(audio.active||audio.starting)await stopMic();else await startMic();});
    id('deviceSelect').addEventListener('change',async()=>{if(audio.active){await stopMic();await startMic();}});
    id('openStage').addEventListener('click',openStage);
    id('openStageTop').addEventListener('click',openStage);
    id('testAnimation').addEventListener('click',()=>{demoUntil=performance.now()+4300;notify('Running a four-second voice animation test.');});
    id('freezeButton').addEventListener('click',()=>setState({freeze:!state.freeze}));
    id('blackoutButton').addEventListener('click',()=>setState({blackout:!state.blackout}));
    id('resetButton').addEventListener('click',()=>{releaseActorAction();setState({emotion:'neutral',scene:'ember',freeze:false,blackout:false,activeCue:-1});});
    id('addCue').addEventListener('click',()=>{if(cues.length>=50){notify('50 cues maximum.');return;}cues.push({title:'New cue '+(cues.length+1),emotion:state.emotion,scene:state.scene,role:state.role});persistCues();renderCues();});
    id('resetCues').addEventListener('click',()=>{cues=structuredClone(defaultCues);state.activeCue=0;persistCues();renderCues();takeCue(0);notify('Demo cues restored.');});
    id('nextCue').addEventListener('click',takeNextCue);
    for(const [field,key] of [['baseFile','base'],['mouthOpenFile','mouthOpen'],['mouthClosedFile','mouthClosed']]){
      id(field).addEventListener('change',async e=>{
        const file=e.target.files?.[0];if(!file)return;
        if(!file.type.startsWith('image/')){notify('Choose a PNG, WebP, or JPEG image.');return;}
        if(file.size>8_000_000){notify('Please use an image smaller than 8 MB.');return;}
        try{await saveAsset(key,file);await loadAssets();post({type:'assets',assets});notify('Artwork saved locally in this browser.');}
        catch(err){notify('Could not save artwork: '+(err?.message||'storage unavailable'));}
      });
    }
    id('clearArt').addEventListener('click',async()=>{
      try{await clearAssets();await loadAssets();post({type:'assets',assets});notify('Custom artwork removed.');}catch(err){notify('Could not remove art: '+err.message);}
    });
    id('exportShow').addEventListener('click',()=>{
      const payload={format:'MOTE-STAGE-SHOW',version:4,exportedAt:new Date().toISOString(),cues,state:{...state}};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='MOTE-show-cues.json';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
      notify('Show file exported (cues and appearance).');
    });
    id('importShow').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        if(file.size>500_000)throw new Error('Show file is too large.');
        const data=JSON.parse(await file.text());
        if(data?.format!=='MOTE-STAGE-SHOW'||!Array.isArray(data.cues))throw new Error('Not a MOTE stage show file.');
        const incoming=data.cues.slice(0,50).filter(c=>c&&typeof c.title==='string').map(c=>({
          title:String(c.title).slice(0,64),
          emotion:MOODS.includes(c.emotion)?c.emotion:'neutral',
          scene:SCENES.includes(c.scene)?c.scene:'aether',
          role:ROLES.includes(c.role)?c.role:'listener'
        }));
        if(!incoming.length)throw new Error('No valid cues were found.');
        cues=incoming;
        const saved=data.state&&typeof data.state==='object'?data.state:{};
        Object.assign(state,pickAppearance({...state,...saved}));
        for(const [key,min,max] of [['actionSurface',0,1.5],['headMovement',0,2],['faceStrength',.5,3],['intensity',0,1],['sensitivity',.5,5],['gate',.002,.1]])if(typeof saved[key]==='number'&&Number.isFinite(saved[key]))state[key]=clamp(saved[key],min,max);
        if(typeof saved.actorActionDuration==='number')state.actorActionDuration=clamp(saved.actorActionDuration,3,5);
        if(['blend','override'].includes(saved.actorActionMode))state.actorActionMode=saved.actorActionMode;
        for(const key of ['freeHeadMovement','cameraFace','voiceReactive'])if(typeof saved[key]==='boolean')state[key]=saved[key];
        if(MOODS.includes(saved.emotion))state.emotion=saved.emotion;
        if(ROLES.includes(saved.role))state.role=saved.role;
        if(['manual','auto'].includes(saved.expressionMode))state.expressionMode=saved.expressionMode;
        if(typeof saved.audioFluid==='boolean')state.audioFluid=saved.audioFluid;
        if(typeof saved.trackingFailsafe==='boolean')state.trackingFailsafe=saved.trackingFailsafe;
        if(['ethereal','mercury','companion','luminous'].includes(saved.look))state.look=saved.look;
        state.activeCue=-1;persistCues();renderCues();broadcastState();
        notify('Show loaded: '+cues.length+' cues.');
      }catch(err){notify('Import failed: '+(err?.message||'Invalid file'));}
      finally{e.target.value='';}
    });
    appearanceUI=createAppearanceUI({getState:()=>state,setState,notify});
    renderCues();updateConsole();
  }
  function bindKeys(e){
    if(e.altKey||e.metaKey||e.ctrlKey)return;
    const target=e.target,key=e.key.toLowerCase();
    if(!STAGE_MODE&&key==='escape'){releaseActorAction();return;}
    if(target instanceof Element && target.closest('input,select,textarea,[contenteditable]'))return;
    if(target instanceof Element && target.closest('button')&&(e.code==='Space'||e.key==='Enter'||e.key.startsWith('Arrow')))return;
    if(STAGE_MODE){if(key==='f'){e.preventDefault();requestFullscreen();}return;}
    if(key>='1' && key<='8'){e.preventDefault();playActorAction('expression',MOODS[Number(key)-1]);return;}
    if(e.code==='Space'||e.key==='ArrowRight'){e.preventDefault();takeNextCue();return;}
    if(key==='b'){setState({blackout:!state.blackout});return;}
    if(key==='x'){setState({freeze:!state.freeze});return;}
    if(key==='m'){if(audio.active)stopMic();else startMic();}
  }
  document.addEventListener('keydown',bindKeys);
  if(STAGE_MODE){
    id('stageFullscreen').addEventListener('click',requestFullscreen);
    id('stageSurface').addEventListener('dblclick',requestFullscreen);
    post({type:'hello',needsAssets:!stageAssetsReceived});
    setTimeout(()=>post({type:'hello',needsAssets:!stageAssetsReceived}),1500);
  }else setupConsole();

  async function enumerateMicrophones(){
    if(STAGE_MODE||!navigator.mediaDevices?.enumerateDevices)return;
    try{
      const selected=id('deviceSelect').value;
      const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');
      const node=id('deviceSelect');node.replaceChildren();
      const option=document.createElement('option');option.value='';option.textContent='System default microphone';node.appendChild(option);
      devices.forEach((device,i)=>{
        const opt=document.createElement('option');opt.value=device.deviceId;opt.textContent=device.label||`Microphone ${i+1}`;node.appendChild(opt);
      });
      if([...node.options].some(o=>o.value===selected))node.value=selected;
    }catch(_){/* keep default */}
  }
  async function startMic(){
    if(STAGE_MODE||audio.starting||audio.active)return;
    if(!navigator.mediaDevices?.getUserMedia){notify('Microphone requires HTTPS or localhost in a modern browser.');return;}
    const request=audio;request.starting=true;request.abort=new AbortController();
    const button=id('micToggle');button.disabled=false;button.textContent='Cancel microphone connection';
    let stream=null,ctx=null;
    try{
      const deviceId=id('deviceSelect').value;
      const constraints={audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false,...(deviceId?{deviceId:{exact:deviceId}}:{})}};
      stream=await requestLocalMedia(constraints,{signal:request.abort.signal});
      if(audio!==request){stream.getTracks().forEach(t=>t.stop());return;}
      request.stream=stream;
      ctx=new (window.AudioContext||window.webkitAudioContext)();request.ctx=ctx;
      let resumeTimer;
      try{await Promise.race([ctx.resume(),new Promise((_,reject)=>{resumeTimer=setTimeout(()=>reject(new Error('Audio engine startup timed out. Check device availability and retry.')),10000);})]);}finally{clearTimeout(resumeTimer);}
      if(audio!==request){stream.getTracks().forEach(t=>t.stop());await ctx.close();return;}
      const source=ctx.createMediaStreamSource(stream);
      const analyser=ctx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.35;
      source.connect(analyser); // NO audio output connection: avoids echo and feedback.
      Object.assign(audio,{ctx,stream,source,analyser,buffer:new Float32Array(analyser.fftSize),
        freq:new Uint8Array(analyser.frequencyBinCount),active:true});
      button.classList.add('active');id('micStatus').classList.add('live');id('micStatus').textContent='LIVE INPUT';
      id('meterCaption').textContent='Analyzing microphone locally';
      button.innerHTML='<span class="btn-icon">◉</span> Disable microphone <span class="btn-arrow">×</span>';
      void enumerateMicrophones();
    }catch(err){
      stream?.getTracks().forEach(t=>t.stop());if(ctx)try{await ctx.close();}catch(_){}
      if(audio!==request||err?.name==='AbortError')return;
      notify(err?.name==='NotAllowedError'?'Microphone permission denied. Allow Nord in your system privacy settings, then retry.':'Microphone error: '+(err?.message||'not available'));
      button.innerHTML='<span class="btn-icon">◉</span> Enable microphone <span class="btn-arrow">↗</span>';
      id('meterCaption').textContent='Microphone unavailable';
    }finally{if(audio===request){audio.starting=false;button.disabled=false;}}
  }
  async function stopMic(){
    const prev=audio;audio={ctx:null,stream:null,source:null,analyser:null,buffer:null,freq:null,active:false,starting:false};
    prev.abort?.abort();
    prev.stream?.getTracks().forEach(t=>t.stop());
    if(prev.ctx)try{await prev.ctx.close();}catch(_){}
    meter.target=0;meter.bassTarget=0;meter.midTarget=0;meter.trebleTarget=0;
    id('micToggle').classList.remove('active');id('micToggle').innerHTML='<span class="btn-icon">◉</span> Enable microphone <span class="btn-arrow">↗</span>';
    id('micStatus').textContent='OFFLINE';id('micStatus').classList.remove('live');id('meterCaption').textContent='Ready for input';
  }
  window.addEventListener('pagehide',()=>{audio.abort?.abort();if(audio.active)audio.stream?.getTracks().forEach(t=>t.stop());});

  function dbOpen(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB is not available'));return;}
      const request=indexedDB.open(ASSET_DB,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('images'))request.result.createObjectStore('images');};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Artwork database could not open'));
    });
  }
  async function dbGet(key){
    const db=await dbOpen();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('images','readonly');const req=tx.objectStore('images').get(key);
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
    });
  }
  async function dbSet(key,value){
    const db=await dbOpen();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('images','readwrite');tx.objectStore('images').put(value,key);
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    });
  }
  async function clearAssets(){
    const db=await dbOpen();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('images','readwrite');tx.objectStore('images').clear();
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
    });
  }
  function fileToDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Image could not be read'));reader.readAsDataURL(file);});}
  function imageInfo(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error('Invalid image'));img.src=src;});}
  async function saveAsset(key,file){
    const src=await fileToDataURL(file);const info=await imageInfo(src);
    await dbSet(key,{...info,src,name:file.name});
  }
  async function loadAssets(){
    if(STAGE_MODE){renderAssets();return;}
    try{const [base,mouthOpen,mouthClosed]=await Promise.all(['base','mouthOpen','mouthClosed'].map(dbGet));assets={base,mouthOpen,mouthClosed};}
    catch(_){assets={base:null,mouthOpen:null,mouthClosed:null};}
    renderAssets();
    if(!STAGE_MODE)post({type:'assets',assets});
  }
  function renderAssets(){
    const useArt=!window.MOTEDesktop&&!!assets.base;
    id('customRig').classList.toggle('hidden',!useArt);
    id('avatarSystem').classList.toggle('hidden',useArt);
    if(useArt){
      id('customBase').src=assets.base.src;
      id('mouthOpen').src=assets.mouthOpen?.src||'';
      id('mouthClosed').src=assets.mouthClosed?.src||'';
      id('customMouth').classList.toggle('hidden',!(assets.mouthOpen&&assets.mouthClosed));
      resizeArt();positionMouth();
    }
    if(!STAGE_MODE){
      id('mouthControls').classList.toggle('hidden',!useArt);
      const text=useArt?`Custom: ${assets.base.name} · ${assets.mouthOpen&&assets.mouthClosed?'mouth layers ready':'add both mouth layers for lip-sync'}`:'Using Three.js sculpted liquid core and reflective glass shell';
      id('assetSummary').textContent=text;
    }
  }
  function resizeArt(){
    if(!assets.base)return;
    const rect=id('stageSurface').getBoundingClientRect();
    const ratio=assets.base.width/assets.base.height;
    const maxH=rect.height*.9,maxW=rect.width*.83;
    const height=Math.min(maxH,maxW/ratio);
    const width=height*ratio;
    const rig=id('customRig');rig.style.width=width+'px';rig.style.height=height+'px';
  }
  function positionMouth(){
    const el=id('customMouth');el.style.left=clamp(state.mouthX,5,95)+'%';el.style.top=clamp(state.mouthY,5,95)+'%';el.style.width=clamp(state.mouthScale,5,60)+'%';
  }
  window.addEventListener('resize',resizeArt);
  loadAssets();

  const orb=window.MOTEOrb?.make(id(STAGE_MODE?'orbCanvas':'actorOrbCanvas'),{monitor:!STAGE_MODE});
  if(STAGE_MODE&&!orb){console.error('Orb renderer did not load.');if(!STAGE_MODE)notify('Unable to load the orb renderer.');}
  else if(orb?.fallback&&!STAGE_MODE)notify(orb.error||'Three.js unavailable. Run setup_offline.command while online.');
  let lastMonitorFrame=0,monitorDelta=0;
  let animationSeconds=0,previousFrame=performance.now(),frozenLevel=0,frozenPose=null;
  const emotionNumber=Object.fromEntries(MOODS.map((name,i)=>[name,i]));
  function animateFace(now){
    const dt=Math.min(.06,Math.max(0,(now-previousFrame)/1000));previousFrame=now;
    if(!state.freeze){animationSeconds+=dt;frozenLevel=meter.smoothed;}
    if(now>blink.next){blink.until=now+170;blink.next=now+2300+Math.random()*3800;}
    const s=animationSeconds,energy=state.freeze?frozenLevel:meter.smoothed;
    const intensity=clamp(state.intensity);
    const reacting=state.voiceReactive?energy*intensity:0;
    const isListener=state.role==='listener';
    let tilt=.015*Math.sin(s*.75)*intensity+.016*Math.sin(s*.4)*intensity;
    if(state.emotion==='curious')tilt+=.20;
    if(state.emotion==='thinking')tilt-=.16;
    if(state.emotion==='sad')tilt+=.12;
    if(state.emotion==='angry')tilt+=Math.sin(s*13)*.025;
    if(state.emotion==='afraid')tilt+=Math.sin(s*22)*.035;
    if(state.emotion==='joy')tilt+=Math.sin(s*3)*.065;
    if(isListener)tilt+=.026*Math.sin(s*1.6)*reacting;
    const gestureOffset=gesturePose(gesture.name,now-gesture.at);
    const isBlinking=now<blink.until;
    const blinkAmt=isBlinking?Math.sin(Math.PI*(blink.until-now)/170):0;
    const liveTracking=tracking&&now-trackingAt<700?tracking:null;
    if(!state.freeze)frozenTracking=liveTracking;
    const cam=state.freeze?frozenTracking:liveTracking;
    const head=cameraHeadPose(cam,gestureOffset,{free:state.freeHeadMovement,amount:state.headMovement,tilt});
    const pose={head,webcamFace:state.cameraFace?cam?.shapes:null,time:s,level:reacting,amplitude:energy,
      emotion:emotionNumber[state.emotion]||0,bass:meter.bass,mid:meter.mid,treble:meter.treble,
      speaking:!isListener,blink:clamp(blinkAmt),operatorBlink:gestureOffset.blink,tilt,intensity};
    if(!state.freeze||!frozenPose)frozenPose=pose;
    const actorAction=actorActions.sample(now);
    monitorDelta+=dt;
    const drawMonitor=STAGE_MODE||(document.body.dataset.tab==='actor'&&now-lastMonitorFrame>=33);
    if(drawMonitor){lastMonitorFrame=now;
    orb?.draw({...getRenderSettings(state),...(state.freeze?frozenPose:pose),freeze:state.freeze,
      performanceTime:showClock.sample(now),frameDelta:STAGE_MODE?dt:Math.min(.06,monitorDelta),actorAction,actionSurface:state.actionSurface,actorHeadOffset:actorGesturePose(actorAction,(state.freeze?frozenPose:pose).head),
      crtChromatic:Math.sin(Math.PI*clamp((now-powerTransitionAt)/850))});monitorDelta=0;} 

    if(assets.base){
      const rig=id('customRig');
      rig.style.transform=`translateX(-50%) translateY(${(-reacting*6+Math.sin(s*1.4)*2*intensity).toFixed(2)}px) rotate(${(tilt*18).toFixed(2)}deg)`;
      const openImage=id('mouthOpen'),closedImage=id('mouthClosed');
      const amp=isListener?0:energy;
      openImage.style.opacity=clamp(amp*1.6).toFixed(3);
      closedImage.style.opacity=(1-clamp(amp*1.6)).toFixed(3);
    }
  }
  let candidate='neutral',candidateSince=0,lastVoice=0,energy=0,brightness=0;
  function driveExpression(now){
    if(STAGE_MODE)return;
    const status=id('autoStatus');
    if(state.expressionMode!=='auto'){
      status.textContent='Tracking stays live. The resting expression applies when no face is mapped.';return;
    }
    if(!audio.active && now>=demoUntil){status.textContent='Automatic armed · enable microphone or run Test voice.';return;}
    energy+=(meter.target-energy)*.04;
    brightness+=(meter.trebleTarget-brightness)*.04;
    if(meter.target>.035)lastVoice=now;
    const next=now-lastVoice>1800?'listening':energy>.73?'angry':energy>.40?(brightness>.2?'joy':'curious'):energy>.12?'curious':'neutral';
    if(next!==candidate){candidate=next;candidateSince=now;}
    if(now-candidateSince>900 && state.emotion!==candidate && !state.freeze && !state.blackout){
      state.emotion=candidate;state.activeCue=-1;broadcastState();
    }
    status.textContent=(audio.active?'LIVE':'TEST')+' · '+state.emotion.toUpperCase()+' · acoustic expression preset';
  }
  function updateAudio(now){
    if(STAGE_MODE){
      if(now-meter.liveAt>700){meter.target*=.84;meter.bassTarget*=.84;meter.midTarget*=.84;meter.trebleTarget*=.84;}
      return;
    }
    if(audio.active&&audio.analyser){
      const a=audio.analyser;a.getFloatTimeDomainData(audio.buffer);
      let squared=0;for(let i=0;i<a.fftSize;i++){const x=audio.buffer[i];squared+=x*x;}
      const rms=Math.sqrt(squared/a.fftSize);
      // Amplitude is an energy cue, NOT a speech emotion classifier.
      meter.target=clamp((rms-state.gate)*state.sensitivity*9);
      a.getByteFrequencyData(audio.freq);
      // Three broad spectral bands influence surface shape, travelling colour and fine ripples.
      // These are acoustic energy features, not emotion/sentiment recognition.
      const hzPerBin=audio.ctx.sampleRate/a.fftSize;
      const band=(from,to)=>{
        let sum=0,n=0;
        const lo=Math.max(1,Math.floor(from/hzPerBin)),hi=Math.min(audio.freq.length,Math.ceil(to/hzPerBin));
        for(let i=lo;i<hi;i++){sum+=audio.freq[i];n++;}
        return n?clamp((sum/n/255-.11)*1.55*state.sensitivity):0;
      };
      const active=rms>state.gate?1:0;
      meter.bassTarget=band(60,280)*active;
      meter.midTarget=band(280,2000)*active;
      meter.trebleTarget=band(2000,6500)*active;
    }else if(now<demoUntil){
      const w=now/1000;
      meter.target=clamp((.45+.3*Math.sin(w*8)+.2*Math.sin(w*14.3))*(.6+.4*Math.sin(w*2.8)));
      meter.bassTarget=clamp(.28+.20*Math.sin(w*3.4));
      meter.midTarget=clamp(.36+.26*Math.sin(w*5.7));
      meter.trebleTarget=clamp(.26+.21*Math.sin(w*10.2));
    }else {meter.target=0;meter.bassTarget=0;meter.midTarget=0;meter.trebleTarget=0;}
    if(now-meter.lastSent>33){
      meter.lastSent=now;post({type:'meter',level:meter.target,bass:meter.bassTarget,mid:meter.midTarget,treble:meter.trebleTarget});
    }
  }
  function updateMeters(now){
    if(STAGE_MODE)return;
    const value=clamp(meter.smoothed),bars=$$('#meterBars span');
    bars.forEach((b,i)=>{
      const wave=.6+.4*Math.abs(Math.sin(now*.006+i*.5));
      const rise=clamp(value*1.25-(i/bars.length)*.68);
      b.style.height=Math.max(5,Math.round((.12+rise*wave)*35))+'px';
      b.classList.toggle('on',i<Math.floor(value*bars.length));
      b.classList.toggle('hot',i>bars.length*.8 && value>.8);
    });
    id('meterPercent').textContent=String(Math.round(value*100)).padStart(2,'0')+'%';
    for(const name of ['bass','mid','treble']){
      const n=id('band-'+name);if(n)n.style.width=Math.round(meter[name]*100)+'%';
    }
  }
  function updateCameraControls(){
    id('cameraToggle').textContent=webcam.starting?'Cancel camera connection':webcam.active?'Disable webcam':'Enable webcam head tracking';
    id('cameraDevice').disabled=webcam.starting||webcam.active;
  }
  function controllerTick(){
    const now=performance.now();
    tracking=webcam.tick(now);trackingAt=now;calibrationUI?.update();
    const monitor=id('actorCameraPreview'),source=id('cameraPreview').srcObject;
    if(monitor.srcObject!==source){monitor.srcObject=source;if(source)monitor.play().catch(()=>{});}
    id('actorCameraEmpty').hidden=!!source;
    id('actorCameraState').textContent=source?(tracking?'Tracking':'Finding face'):'Camera off';
    const testing=now<trackingTestUntil;
    const safety=trackingFailsafe.update({now,tracked:!!tracking&&!testing,enabled:state.trackingFailsafe!==false,cameraRequested});
    id('testTrackingLoss').disabled=!webcam.active||!safety.armed||state.trackingFailsafe===false||testing;
    id('trackingFailsafeStatus').textContent=safety.status;
    if(state.trackingBlackout!==safety.blackout){state.trackingBlackout=safety.blackout;broadcastState();}
    if(now-lastTrackingSend>66){post({type:'tracking',sample:testing?null:tracking});lastTrackingSend=now;}
    updateCameraControls();
    updateAudio(now);driveExpression(now);updateActorControls();
    if(now-heartbeatAt>1000){
      heartbeatAt=now;post({type:'state',state:{...state}});post({type:'heartbeat'});
      if(now-stageSeenAt>5000)id('connectionStatus').textContent='STAGE NOT CONNECTED';
    }
  }
  function loop(now){
    if(STAGE_MODE)updateAudio(now);
    const speed=meter.target>meter.smoothed?.32:.15;
    meter.smoothed+=(meter.target-meter.smoothed)*speed;
    for(const name of ['bass','mid','treble']){
      const goal=meter[name+'Target'];
      meter[name]+=(goal-meter[name])*(goal>meter[name]?.25:.12);
    }
    if(meter.smoothed<.001)meter.smoothed=0;
    fpsFrames++;
    if(now-fpsStart>1200){
      fpsValue=Math.round(fpsFrames*1000/(now-fpsStart));fpsFrames=0;fpsStart=now;
      if(!STAGE_MODE){const el=id('previewFps');if(el)el.textContent=fpsValue+' FPS';}
    }
    animateFace(now);
    updateMeters(now);
    if(STAGE_MODE&&now-lastSync>7000)id('stageConnection').textContent='CONSOLE NOT DETECTED';
    requestAnimationFrame(loop);
  }
  if(!STAGE_MODE)persist();
  applyState();
  if(!STAGE_MODE)updateConsole();
  const syncTimer=setInterval(()=>{
    if(STAGE_MODE)post({type:'hello',needsAssets:!stageAssetsReceived});else controllerTick();
  },STAGE_MODE?1000:33);
  window.addEventListener('pagehide',()=>{clearInterval(syncTimer);link.close();});
  requestAnimationFrame(loop);
})();
