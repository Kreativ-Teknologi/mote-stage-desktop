import {STAR_PALETTES} from './background-settings.js';
import {COLOR_MOTION_PRESETS} from './surface-animation.js';
import {CONTROLS,formatControl,pickAppearance,createAppearanceStore,resetAppearanceSection} from './appearance-settings.js';
import {paletteHex,PALETTES} from './palettes.js';
export function createAppearanceUI({getState,setState,notify,onPresetsChange}){
  const id=x=>document.getElementById(x),store=createAppearanceStore(localStorage);
  let selectedId='',lastList='',panel='surface',lastEdit='',lastAt=0;
  const history=[];
  function apply(change,key='action'){
    const before=pickAppearance(getState()),after=pickAppearance({...getState(),...change});
    if(JSON.stringify(before)===JSON.stringify(after))return false;
    const now=performance.now();
    if(key!==lastEdit||now-lastAt>700){history.push(before);if(history.length>24)history.shift();}
    lastEdit=key;lastAt=now;setState(change);update();return true;
  }
  id('undoAppearance').addEventListener('click',()=>{const previous=history.pop();if(!previous)return;lastEdit='';setState(previous);update();});
  id('resetAppearanceSection').addEventListener('click',()=>{lastEdit='';apply(resetAppearanceSection(getState(),panel==='starcolor'?'stars':panel),'reset');notify('Reset '+({surface:'surface',motion:'motion',color:'color and light',animation:'color motion',stars:'stars',starcolor:'star colors'}[panel]||panel)+'. Undo is available.');});
  document.querySelectorAll('.look-btn').forEach(b=>b.addEventListener('click',()=>apply({look:b.dataset.look},'material')));
  document.querySelectorAll('.scene-btn').forEach(b=>b.addEventListener('click',()=>apply({scene:b.dataset.scene,customColors:null,hueShift:0,colorSaturation:1,colorGain:1},'palette')));
  id('colorAnimation').addEventListener('change',e=>apply({colorAnimation:e.target.checked},'colorAnimation'));
  document.querySelectorAll('[data-color-motion]').forEach(b=>b.addEventListener('click',()=>{lastEdit='';apply(COLOR_MOTION_PRESETS[b.dataset.colorMotion],'motionPreset');}));
  id('audioFluid').addEventListener('change',e=>apply({audioFluid:e.target.checked},'audioFluid'));
  id('renderQuality').addEventListener('change',e=>apply({renderQuality:Number(e.target.value)},'renderQuality'));
  id('starFollowAvatar').addEventListener('change',e=>apply({starFollowAvatar:e.target.checked},'starFollowAvatar'));
  id('starPalette').addEventListener('change',e=>apply({starPalette:Number(e.target.value),starColors:null},'starPalette'));
  const starColors=()=>getState().starColors||STAR_PALETTES[getState().starPalette||0].colors;
  for(let i=0;i<3;i++){
    const updateStar=value=>{if(!/^#[0-9a-f]{6}$/i.test(value)){notify('Use a six-digit hex color.');return;}const next=[...starColors()];next[i]=value;apply({starColors:next,starFollowAvatar:false},'starColor'+i);};
    id('starColor'+i).addEventListener('input',e=>updateStar(e.target.value));id('starHex'+i).addEventListener('change',e=>updateStar(e.target.value));
  }
  const updateBackground=value=>{if(!/^#[0-9a-f]{6}$/i.test(value)){notify('Use a six-digit hex color.');return;}apply({backgroundColor:value},'backgroundColor');};
  id('backgroundColor').addEventListener('input',e=>updateBackground(e.target.value));id('backgroundHex').addEventListener('change',e=>updateBackground(e.target.value));
  const paletteIndex=()=>Math.max(0,['aether','ember','dawn','void'].indexOf(getState().scene));
  const colors=()=>getState().customColors||paletteHex(paletteIndex());
  function selectPanel(name){panel=name;id('resetAppearanceSection').hidden=name==='presets';document.body.dataset.appearance=name;document.querySelectorAll('[data-appearance-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.appearanceTab===name)));}
  selectPanel('surface');document.querySelectorAll('[data-appearance-tab]').forEach(b=>b.addEventListener('click',()=>selectPanel(b.dataset.appearanceTab)));
  document.querySelectorAll('.appearance-card input[type=range]').forEach(el=>el.addEventListener('pointerdown',()=>{lastEdit='';}));
  for(const [key,c] of Object.entries(CONTROLS))id(key).addEventListener('input',e=>{
    const value=Number(e.target.value)/c.scale,change={[key]:value},s=getState();
    if(key==='starSizeMin'&&value>s.starSizeMax)change.starSizeMax=value;
    if(key==='starSizeMax'&&value<s.starSizeMin)change.starSizeMin=value;
    if(c.group==='performance')setState(change);else apply(change,key);
  });
  for(let i=0;i<3;i++){
    const update=value=>{if(!/^#[0-9a-f]{6}$/i.test(value)){notify('Use a six-digit hex color, such as #9ad7ff.');return;}const next=[...colors()];next[i]=value;apply({customColors:next},'color'+i);};
    id('shaderColor'+i).addEventListener('input',e=>update(e.target.value));
    id('shaderHex'+i).addEventListener('change',e=>update(e.target.value.startsWith('#')?e.target.value:'#'+e.target.value));
  }
  id('resetColors').addEventListener('click',()=>apply({customColors:null,hueShift:0,colorSaturation:1,colorGain:1},'resetColors'));
  function load(record){selectedId=record.id;id('presetName').value=record.name;lastEdit='';const changed=apply(record.appearance,'load');notify('Loaded '+record.name+'.');update();return changed;}
  function render(){
    const items=store.list(),signature=JSON.stringify([items,selectedId]);
    if(signature===lastList)return;lastList=signature;
    const list=id('appearancePresetList');list.replaceChildren();
    id('presetEmpty').hidden=items.length>0;
    for(const record of items){
      const row=document.createElement('div');row.className='saved-look'+(selectedId===record.id?' selected':'');
      const swatch=document.createElement('span');swatch.className='saved-look-swatch';
      const index=Math.max(0,['aether','ember','dawn','void'].indexOf(record.appearance.scene));
      const color=record.appearance.customColors||paletteHex(index);swatch.style.background=`linear-gradient(135deg,${color[0]},${color[1]},${color[2]})`;
      const text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=record.name;detail.textContent=record.appearance.look+' · '+(record.appearance.customColors?'Custom palette':PALETTES[index].name);text.append(name,detail);
      const actions=document.createElement('div');actions.className='saved-look-actions';
      const apply=document.createElement('button');apply.type='button';apply.textContent='Load';apply.setAttribute('aria-label','Load '+record.name);apply.addEventListener('click',()=>load(record));
      const remove=document.createElement('button');remove.type='button';remove.textContent='Delete';remove.className='quiet-delete';remove.setAttribute('aria-label','Delete '+record.name);remove.addEventListener('click',()=>{store.remove(record.id);if(selectedId===record.id)selectedId='';id('undoPreset').hidden=false;id('presetMessage').textContent='Deleted '+record.name+'.';update();});
      actions.append(apply,remove);row.append(swatch,text,actions);list.append(row);
    }
    onPresetsChange?.();
  }
  id('saveAppearance').addEventListener('click',()=>{try{const r=store.save(id('presetName').value,getState());selectedId=r.id;id('presetMessage').textContent='Saved '+r.name+'.';render();update();}catch(e){notify(e.message);}});
  id('undoPreset').addEventListener('click',()=>{const r=store.undo();if(r){id('presetMessage').textContent='Restored '+r.name+'.';id('undoPreset').hidden=true;update();}});
  function updateSaveLabel(){const exists=store.list().some(p=>p.name.toLowerCase()===id('presetName').value.trim().toLowerCase());id('saveAppearance').textContent=exists?'Update saved look':'Save current look';}
  id('presetName').addEventListener('input',updateSaveLabel);
  id('exportAppearance').addEventListener('click',()=>{
    const name=id('presetName').value.trim()||'Nord appearance';const data={format:'NORD-APPEARANCE',version:1,name,appearance:pickAppearance(getState())};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name.replace(/[^a-z0-9 _-]/gi,'')+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  id('importAppearance').addEventListener('change',async e=>{
    try{const file=e.target.files?.[0];if(!file)return;if(file.size>200000)throw new Error('This file is too large for an appearance preset.');const data=JSON.parse(await file.text());
      if(data.format!=='NORD-APPEARANCE'||!data.appearance)throw new Error('Choose a Nord appearance file.');
      const record=store.save(data.name||file.name.replace(/\.json$/i,''),data.appearance);load(record);
    }catch(error){notify(error.message||'Unable to load this appearance file.');}finally{e.target.value='';}
  });
  function update(){
    id('undoAppearance').disabled=history.length===0;
    const live=getState();
    id('colorAnimation').checked=live.colorAnimation!==false;
    id('colorAnimationHint').textContent=live.freeze?'Color motion is held. Resume motion below to animate.':live.colorAnimation===false?'Color motion is off. The selected palette and static ribbon shape remain visible.':'Palette and light animate across glass and halo. Stars have independent color controls. Negative drift reverses direction; voice controls use microphone amplitude.';
    id('voiceMotionHint').textContent=live.audioFluid?'Vocal amplitude adds movement to the chosen idle flow.':'Voice modulation is off.';
    id('motionAppearanceHint').textContent=live.freeze?'Motion is frozen. Choose Resume motion below to see movement changes.':live.fluidMotion===0?(live.audioFluid&&live.audioResponse>0?'Idle flow is stopped. Voice modulation can still add movement.':(live.breathAmount>0&&live.breathRate>0?'Flow is stopped; breathing remains active.':'Flow is stopped. Increase Flow speed or enable voice motion to animate it.')):'Flow direction turns the current pattern; it does not rotate the head.';
    id('starAppearanceHint').textContent=live.starCount===0||live.starField===0?'The star field is hidden. Increase both count and brightness to show it.':'Star colors are set in Star color. Size is in screen pixels before perspective; bright stars feed bloom and flare.';
    const s=getState();for(const [key,c] of Object.entries(CONTROLS)){id(key).value=s[key]*c.scale;id(key+'Output').textContent=formatControl(key,s[key]);}
    id('starFollowAvatar').checked=!!s.starFollowAvatar;id('starPalette').value=String(s.starPalette||0);id('starPalette').disabled=!!s.starFollowAvatar;
    id('starColorMode').textContent=s.starFollowAvatar?'Following avatar · own palette is preserved':s.starColors?'Custom star colors':'Independent '+STAR_PALETTES[s.starPalette||0].name+' palette';
    const stars=starColors();for(let i=0;i<3;i++){id('starColor'+i).value=stars[i];if(document.activeElement!==id('starHex'+i))id('starHex'+i).value=stars[i];}
    id('backgroundColor').value=s.backgroundColor;if(document.activeElement!==id('backgroundHex'))id('backgroundHex').value=s.backgroundColor;
    const current=colors();for(let i=0;i<3;i++){id('shaderColor'+i).value=current[i];if(document.activeElement!==id('shaderHex'+i))id('shaderHex'+i).value=current[i];}
    id('colorMode').textContent=s.customColors?'Custom palette':PALETTES[paletteIndex()].name+' palette';
    const saved=store.list().find(p=>p.id===selectedId);id('appearanceStatus').textContent=saved?(JSON.stringify(saved.appearance)===JSON.stringify(pickAppearance(s))?'Saved · '+saved.name:'Modified · '+saved.name):'Live appearance';
    render();updateSaveLabel();
  }
  update();return {update,list:store.list,loadPreset:presetId=>{
    const record=store.list().find(preset=>preset.id===presetId);
    return record?load(record):false;
  }};
}
