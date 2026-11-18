// Exercise the real event handlers against a small DOM fixture, without a camera or GPU.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CONTROLS,APPEARANCE_DEFAULTS,pickAppearance} from '../web/appearance-settings.js';
import {createAppearanceUI} from '../web/appearance-ui.js';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
class Element{
  constructor(){this.value='';this.textContent='';this.children=[];this.dataset={};this.style={};this.attributes={};this.events={};}
  addEventListener(name,handler){(this.events[name]??=[]).push(handler);}
  async emit(name){for(const f of this.events[name]||[])await f({target:this});}
  setAttribute(k,v){this.attributes[k]=v;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  remove(){}
  click(){return this.emit('click');}
}
const ids=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const buttons=(attribute)=>[...html.matchAll(new RegExp(attribute+'="([^"]+)"','g'))].map(m=>{const e=new Element();e.dataset[attribute.replace('data-','').replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=m[1];return e;});
const tabs=buttons('data-appearance-tab'),looks=buttons('data-look'),palettes=buttons('data-scene'),motions=buttons('data-color-motion');
const selectors={'[data-color-motion]':motions,'.look-btn':looks,'.scene-btn':palettes,'[data-appearance-tab]':tabs,'.appearance-card input[type=range]':Object.keys(CONTROLS).map(k=>ids.get(k))};
globalThis.document={getElementById:id=>ids.get(id),querySelectorAll:q=>selectors[q]||[],createElement:()=>new Element(),body:new Element(),activeElement:null};
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
let state={...APPEARANCE_DEFAULTS,emotion:'joy',cameraFace:true,blackout:true};
const ui=createAppearanceUI({getState:()=>state,setState:change=>Object.assign(state,change),notify:()=>{}});
const input=async(id,value,type='input')=>{const e=ids.get(id);e.value=String(value);await e.emit(type);};
const click=id=>ids.get(id).emit('click');
for(const [key,c] of Object.entries(CONTROLS)){
  for(const value of [c.min,c.max]){await input(key,value*c.scale);assert.equal(state[key],value,key+' event must update state');}
}
await input('starSizeMax',1);await input('starSizeMin',7);assert.equal(state.starSizeMax,7,'Minimum size lifts the maximum when necessary');
await input('shaderHex0','#aabbcc','change');assert.equal(state.customColors[0],'#aabbcc');
await motions.find(b=>b.dataset.colorMotion==='tide').emit('click');assert.equal(state.ribbonSpeed,-.28);assert.equal(state.colorAnimation,true);
ids.get('colorAnimation').checked=false;await ids.get('colorAnimation').emit('change');assert.equal(state.colorAnimation,false);
const beforeMaterial=pickAppearance(state);await looks.find(b=>b.dataset.look==='companion').emit('click');
assert.deepEqual(pickAppearance(state),{...beforeMaterial,look:'companion'},'Material selection preserves all other tuning');
await click('undoAppearance');assert.deepEqual(pickAppearance(state),beforeMaterial,'Undo restores the exact prior appearance');
await tabs.find(b=>b.dataset.appearanceTab==='stars').emit('click');await click('resetAppearanceSection');
for(const [key,c] of Object.entries(CONTROLS))if(c.group==='stars')assert.equal(state[key],c.value);
assert.equal(state.cameraFace,true);assert.equal(state.blackout,true);assert.equal(state.emotion,'joy');
await click('undoAppearance');assert.deepEqual(pickAppearance(state),beforeMaterial,'Reset is reversible');
await input('starHex0','#54aabb','change');assert.equal(state.starColors[0],'#54aabb');assert.equal(state.starFollowAvatar,false);
const ownStars=[...state.starColors];ids.get('starFollowAvatar').checked=true;await ids.get('starFollowAvatar').emit('change');assert.equal(state.starFollowAvatar,true);assert.deepEqual(state.starColors,ownStars);
ids.get('starFollowAvatar').checked=false;await ids.get('starFollowAvatar').emit('change');assert.deepEqual(state.starColors,ownStars,'Turning follow off retains custom stars');
await input('backgroundHex','#050a13','change');assert.equal(state.backgroundColor,'#050a13');
await input('starPalette',2,'change');assert.equal(state.starPalette,2);assert.equal(state.starColors,null);
await input('starHex1','#8877ee','change');assert.equal(state.starColors[1],'#8877ee');
await input('presetName','Fixture look');await click('saveAppearance');const saved=pickAppearance(state);
await input('orbSize',65);await input('starCount',0);ui.update();assert.match(ids.get('appearanceStatus').textContent,/Modified/);
function findAction(label){const visit=e=>e.attributes['aria-label']===label?e:e.children.map(visit).find(Boolean);return visit(ids.get('appearancePresetList'));}
await findAction('Load Fixture look').click();assert.deepEqual(pickAppearance(state),saved,'Loading restores every appearance field');assert.match(ids.get('appearanceStatus').textContent,/Saved/);
await findAction('Delete Fixture look').click();assert.equal(ids.get('appearancePresetList').children.length,0);
await click('undoPreset');assert.equal(ids.get('appearancePresetList').children.length,1);
const imported={format:'NORD-APPEARANCE',name:'Imported fixture',appearance:{...saved,haloSpread:.21,featureSoftness:.83,edgeSoftness:.35}};
ids.get('importAppearance').files=[{size:1000,text:async()=>JSON.stringify(imported)}];await ids.get('importAppearance').emit('change');
assert.deepEqual(pickAppearance(state),pickAppearance(imported.appearance),'File import applies every field through the real handler');
ids.get('audioFluid').checked=false;await ids.get('audioFluid').emit('change');assert.equal(state.audioFluid,false);
await input('fluidMotion',0);ui.update();assert.match(ids.get('motionAppearanceHint').textContent,/Flow is stopped/);assert.doesNotMatch(ids.get('voiceMotionHint').textContent,/active/);
await input('renderQuality',.7,'change');assert.equal(state.renderQuality,.7);
assert.equal(state.cameraFace,true);assert.equal(state.blackout,true);
const snapshot=pickAppearance(state);
await input('shaderHex0','#invalid','change');assert.deepEqual(pickAppearance(state),snapshot,'Invalid color cannot alter the renderer');
let exported;const originalCreate=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return originalCreate(blob);};
await click('exportAppearance');URL.createObjectURL=originalCreate;
const exportedData=JSON.parse(await exported.text());assert.equal(exportedData.format,'NORD-APPEARANCE');assert.deepEqual(exportedData.appearance,pickAppearance(state),'Export preserves every supported appearance field');
console.log('Verified actual Appearance handlers: all sliders, material isolation, palette editing, size coupling, reset/undo, presets and file import.');
