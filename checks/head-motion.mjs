import assert from 'node:assert/strict';
import {cameraHeadPose,createStagePosition} from '../web/head-motion.js';
assert.equal(cameraHeadPose(null),null);
const input={yaw:.2,pitch:-.3,roll:0,x:.4,y:-.5,z:.2};
const locked=cameraHeadPose(input);assert.equal(locked.x,0);assert.equal(locked.pitch,-.3);assert.equal(locked.roll,0);
const free=cameraHeadPose(input,{}, {free:true,amount:2});assert.equal(free.x,.52);assert.equal(free.y,-.42);assert.equal(free.pitch,-.3);
assert.equal(cameraHeadPose(input,{pitch:.2}).pitch,-.09999999999999998);
assert.deepEqual(cameraHeadPose({x:NaN,pitch:Infinity,yaw:'bad'}, {}, {free:true,amount:NaN}),{yaw:0,pitch:0,roll:0,x:0,y:0,z:0});
console.log('Camera head movement: independent free translation, nodding, bounds and invalid input passed.');

for(const fps of [30,60,120,240]){
 const driver=createStagePosition();let p;
 for(let frame=0;frame<fps*8;frame++){
  p=driver.update({delta:1/fps,time:frame/fps,bounce:.035,intensity:1});
  assert.ok(Math.abs(p.y)<=.04100001,'Expression bob remains bounded at '+fps+' fps');
 }
 const frozen=driver.update({head:{x:1,y:1,z:1},time:900,freeze:true});assert.deepEqual(frozen,p,'Freeze holds the composed rendered position');
 const track=createStagePosition();for(let frame=0;frame<fps*3;frame++)p=track.update({head:{x:.4,y:-.2,z:.1},delta:1/fps,time:frame/fps,bounce:0,intensity:0});
 assert.ok(Math.abs(p.x-.4)<1e-8&&Math.abs(p.y+.2)<1e-8,'Tracked anchor converges independently of rendered bob');
}
console.log('Verified frame-rate independent head position and bounded expression bob at 30–240 fps.');
