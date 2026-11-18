import assert from 'node:assert/strict';
import {createShowClock} from '../web/show-clock.js';
import {createCharacterPerformance} from '../web/character-performance.js';
import {thinkingFaceHandoff} from '../web/face-handoff.js';
const controller=createShowClock(100000,true),output=createShowClock(100250);
output.receive(100000);assert.equal(controller.sample(1500),output.sample(1250),'Controller and output share one procedural phase');
const reopened=createShowClock(106000);reopened.receive(100000);assert.equal(controller.sample(6200),reopened.sample(200),'A reopened output resumes the existing show clock');
for(const invalid of [undefined,null,NaN,Infinity,-1,'100000',99000])output.receive(invalid);
assert.equal(output.sample(1250),1.5,'Invalid and old clocks cannot move the output');
controller.receive(999999);assert.equal(controller.sample(1500),1.5,'Controller clock authority stays local');
const action=(name,elapsed,id=name)=>({id,kind:'expression',name,elapsed,duration:4000,remaining:4000-elapsed,weight:.86,mode:'blend'});
for(const fps of [30,60,120,240]){
 const d=createCharacterPerformance();let previous=0;
 for(let frame=0;frame<fps*2;frame++){
  const seconds=frame/fps,part=Math.floor(seconds/.18),name=['thinking','joy','angry','afraid'][part%4];
  const clock=controller.sample(seconds*1000),pose=d.update(action(name,(seconds% .18)*1000,String(part)),1,1/fps,clock);
  assert.ok(pose.surface.time>=previous,'Fast action replacement never rewinds surface animation');assert.equal(pose.surface.time,clock);previous=pose.surface.time;
 }
 const before=d.update(null,1,1/fps,3),after=d.update(null,1,0,99);assert.deepEqual(before,after,'Zero render time holds the entire character pose');
}
const d=createCharacterPerformance();let p;
for(let i=0;i<120;i++)p=d.update(action('thinking',1000),1,1/120,i/120);
assert.ok(p.body.face>.999);
for(let i=0;i<24;i++){
 const elapsed=i/120*1000,t=Math.min(1,elapsed/180),weight=.86*t*t*(3-2*t);
 p=d.update({...action('thinking',elapsed,'repeat'),weight},1,1/120,1+i/120);
 assert.ok(p.body.face>.999,'Repeating Thinking cannot flash the normal face');
}
for(let i=0;i<121;i++)p=d.update(null,1,1/120,1.2+i/120);assert.equal(p.body.face,0);
for(let i=0;i<=1000;i++){
 const handoff=thinkingFaceHandoff(i/1000);assert.equal(handoff.normal*handoff.thought,0,'Old face and thought dots never illuminate together');
}
assert.deepEqual(thinkingFaceHandoff(0),{normal:1,thought:0});assert.deepEqual(thinkingFaceHandoff(1),{normal:0,thought:1});
console.log('Verified shared show phase, late output reconnection, non-rewinding rapid actions, repeated Thinking continuity and clean emissive face handoff.');
