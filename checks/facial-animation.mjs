import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {eyeContourCurve,actionGaze,createGazeDriver} from '../web/facial-animation.js';
import {wrapEyeInsideGlass,featureLight,eyeOpenness} from '../web/face-geometry.js';
import {actorGesturePose} from '../web/actor-actions.js';
const gesture=(name,elapsed=160)=>({kind:'gesture',name,elapsed,duration:4000,remaining:4000-elapsed,mode:'blend',weight:.86});
assert.equal(eyeContourCurve(),0);assert.ok(eyeContourCurve({emotion:'joy'})>.02);
assert.ok(eyeContourCurve({trackedCurve:-.25})>.02);assert.equal(eyeContourCurve({trackedCurve:.25}),0);
for(const name of ['angry','afraid'])assert.equal(eyeContourCurve({action:{kind:'expression',name,weight:1},trackedCurve:-.25}),0,'Approved action contours remain uncurved');
assert.equal(eyeContourCurve({emotion:'joy',openness:0}),0);assert.equal(featureLight(eyeOpenness(.65,true)),0,'Closed eyes still fully disappear');
for(const height of [.2,.42,1,2])assert.ok(eyeContourCurve({emotion:'joy',height})<=.135*height*.5,'Arcs cannot fold into sharp slits');
const left=actionGaze(gesture('look-left')),right=actionGaze(gesture('look-right'));
assert.ok(left.x<-.02&&right.x>.02);assert.equal(left.x,-right.x);assert.equal(left.y,0);
assert.deepEqual(actionGaze(gesture('look-left',1200)),{x:0,y:0},'Eyes return to center after the head takes over');
assert.deepEqual(actionGaze(null),{x:0,y:0});assert.deepEqual(actionGaze(gesture('look-left',4000)),{x:0,y:0});
for(const fps of [30,60,120,240]){const driver=createGazeDriver();let p;for(let f=0;f<fps;f++){p=driver.update(gesture('look-left',f/fps*1000),1/fps);assert.ok(Math.abs(p.x)<.029&&Math.abs(p.y)<.011);}for(let f=0;f<fps;f++)p=driver.update(null,1/fps);assert.deepEqual(p,{x:0,y:0},'Gaze cannot accumulate');}
for(const duration of [3000,4000,5000]){
 const samples=[];for(let f=0;f<=400;f++)samples.push(actorGesturePose({...gesture('nod',duration*f/400),duration},{pitch:.6}).pitch);
 let excursions=0,positive=false;for(const n of samples){if(n>.02&&!positive){positive=true;excursions++;}if(n<=.02)positive=false;assert.ok(Math.abs(n)<.16,'Nod stays restrained');}
 assert.equal(excursions,1,'Nod has one deliberate downstroke');assert.ok(Math.abs(samples.at(-1))<1e-8);
 assert.equal(actorGesturePose(gesture('nod',1200),{pitch:.6}).pitch,actorGesturePose(gesture('nod',1200),{pitch:-.6}).pitch,'Nod does not recenter a tracked head');
}
const eye=new THREE.Mesh(new THREE.SphereGeometry(1,32,24)),template=new Float32Array(eye.geometry.attributes.position.array);
for(const radius of [.985,.91625])for(const height of [.04,.135,.25])for(const curve of [0,.012,.026]){
 eye.position.set(.235,.135,.945);eye.scale.set(.16,height,.047);eye.rotation.z=.45;
 wrapEyeInsideGlass(eye.geometry,template,eye,radius,-.035,curve);eye.updateMatrix();
 for(const value of eye.geometry.attributes.normal.array)assert.ok(Number.isFinite(value));
 const a=eye.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(eye.matrix);p.y-=.035;assert.ok(p.length()<=radius+.000001,'Arched eyes remain completely inside the optical glass');}
 wrapEyeInsideGlass(eye.geometry,template,eye,radius,0,0);for(let i=0;i<a.count;i++)assert.ok(Math.abs(a.getY(i)-template[i*3+1])<1e-6,'Releasing a smile restores the original round eye');
}
eye.geometry.dispose();
console.log('Verified rounded 3D smile eyes, full blink extinction, optical containment, gentle leading gaze and single tracking-relative nod at all action durations.');
