import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCalibrationUI} from '../web/calibration-ui.js';
import {sanitizeCalibration} from '../web/actor-calibration.js';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
class Element{
  constructor(){this.value='';this.textContent='';this.children=[];this.events={};this.disabled=false;this.hidden=false;}
  addEventListener(name,f){(this.events[name]??=[]).push(f);}
  async emit(name){for(const f of this.events[name]||[])await f({target:this});}
  append(child){this.children.push(child);}
  replaceChildren(){this.children=[];}
}
const names=['actorProfileName','actorProfileList','actorProfileActive','actorCalibrationStatus','saveActorProfile','loadActorProfile','deleteActorProfile','undoActorProfile','captureNeutralFace','captureFaceRange','resetFaceCalibration'];
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
let elements;
function mount(webcam){elements=new Map(names.map(name=>{assert.ok(html.includes(`id="${name}"`),'Missing Settings control '+name);return[name,new Element()];}));globalThis.document={getElementById:id=>elements.get(id),createElement:()=>new Element()};return createCalibrationUI({webcam,notify:()=>{}});}
const profile=sanitizeCalibration({version:1,neutral:{yaw:.1,pitch:.2,shapes:{jawOpen:.12}}}),another=sanitizeCalibration({version:1,neutral:{yaw:-.1,pitch:.1,shapes:{jawOpen:.03}}});
const webcam={calibration:null,calibrating:false,hasFace:false,calibrationStatus:'Find your face',captureNeutral(){this.calibrating=this.hasFace;return this.hasFace;},captureRange(){this.calibrating=this.hasFace&&!!this.calibration;return this.calibrating;},resetCalibration(){this.calibration=null;this.calibrating=false;},setCalibration(p){this.calibration=sanitizeCalibration(p);return !!this.calibration;}};
let ui=mount(webcam);const click=id=>elements.get(id).emit('click');
assert.ok(elements.get('captureNeutralFace').disabled);assert.ok(elements.get('captureFaceRange').disabled);assert.ok(elements.get('saveActorProfile').disabled,'Cannot save a nonexistent face');assert.ok(elements.get('undoActorProfile').hidden);
webcam.hasFace=true;ui.update();assert.equal(elements.get('captureNeutralFace').disabled,false);await click('captureNeutralFace');assert.equal(webcam.calibrating,true);assert.ok(elements.get('captureNeutralFace').disabled,'Cannot begin overlapping captures');
webcam.calibrating=false;webcam.calibration=profile;ui.update();assert.match(elements.get('actorProfileActive').textContent,/Unsaved/);elements.get('actorProfileName').value='Alex';await click('saveActorProfile');const actorId=elements.get('actorProfileList').value;assert.ok(actorId);assert.equal(elements.get('actorProfileActive').textContent,'Actor: Alex');
webcam.calibration=another;ui.update();assert.match(elements.get('actorProfileActive').textContent,/Unsaved/);await click('loadActorProfile');assert.deepEqual(webcam.calibration,profile,'Load restores actual actor coefficients');assert.equal(elements.get('actorProfileActive').textContent,'Actor: Alex');
await click('deleteActorProfile');assert.equal(elements.get('actorProfileList').children.length,1);assert.equal(elements.get('undoActorProfile').hidden,false);assert.deepEqual(webcam.calibration,profile,'Removing a saved profile preserves the live face settings');assert.match(elements.get('actorProfileActive').textContent,/Unsaved/);
await click('undoActorProfile');assert.equal(elements.get('actorProfileList').value,actorId);assert.equal(elements.get('actorProfileActive').textContent,'Actor: Alex');
webcam.calibration=null;webcam.hasFace=false;ui=mount(webcam);assert.deepEqual(webcam.calibration,profile,'App relaunch restores last actor before webcam starts');assert.equal(elements.get('actorProfileActive').textContent,'Actor: Alex');assert.equal(elements.get('actorProfileName').value,'Alex');assert.ok(elements.get('captureNeutralFace').disabled,'Loaded profile never pretends camera has a face');
await click('resetFaceCalibration');assert.equal(webcam.calibration,null);assert.equal(elements.get('actorProfileList').children.length,2,'Reset leaves saved actors available');assert.equal(JSON.parse(memory.get('nord-active-actor-v1')),null,'Reset persists the uncalibrated choice');
console.log('Verified actual Actor profile handlers: face-required capture, save/load, active restore, draft isolation, reset and delete/undo.');
