import assert from 'node:assert/strict';
import {actionSurfacePose,actionSurfaceDisplacement,ACTION_SURFACE_PROFILES,actionSurfaceGLSL} from '../web/action-surface.js';

const names=Object.keys(ACTION_SURFACE_PROFILES);
const action=name=>({kind:'expression',name,elapsed:1500,duration:4000,remaining:2500,weight:1});
const rest=actionSurfacePose(null);
assert.deepEqual(rest.a,[0,0,0,0]);assert.deepEqual(rest.b,[0,0,0,0]);assert.equal(rest.baseMotion,1);
for(const invalid of [null,{}, {kind:'gesture',name:'nod',weight:1},action('unknown'),{...action('angry'),elapsed:4000},{...action('angry'),remaining:0},{...action('angry'),weight:NaN}]){
  assert.deepEqual(actionSurfacePose(invalid),rest,'No lingering geometry from absent, invalid or expired actions');
}
assert.deepEqual(actionSurfacePose(action('angry'),0),rest,'Surface reactions can be disabled');
assert.equal(actionSurfacePose(action('angry'),100).spike,1.5,'Reaction strength is bounded');
assert.deepEqual(actionSurfacePose(action('joy')),rest,'Smile leaves the fluid surface alone');
const poses=names.map(name=>actionSurfacePose(action(name)));
assert.equal(new Set(poses.map(p=>JSON.stringify([p.a,p.b]))).size,names.length,'Each action has a distinct material performance');
assert.ok(poses[0].baseMotion<.2,'Neutral actively calms the existing fluid field');
assert.equal(actionSurfacePose({...action('angry'),elapsed:1800}).time,1.8,'Action animation uses action time, independent of frozen scene time');

// Uniform sphere samples include both optical front and rear, not only the face.
const points=[];
for(let i=0;i<1600;i++){
  const y=1-(i+.5)*2/1600,r=Math.sqrt(1-y*y),a=i*Math.PI*(3-Math.sqrt(5));
  points.push([r*Math.cos(a),y,r*Math.sin(a)]);
}
const signature=[];
for(const name of names){
  const pose=actionSurfacePose(action(name),1.5),field=points.map(p=>actionSurfaceDisplacement(p,pose));
  assert.ok(field.every(Number.isFinite),'Finite radial displacements for '+name);
  assert.ok(Math.max(...field)<.125&&Math.min(...field)>-.014,'The glass remains bounded around the facial rig: '+name);
  let largestStep=0;
  for(const p of points.slice(0,100)){
    const value=actionSurfaceDisplacement(p,pose);
    const next=actionSurfaceDisplacement([p[0]+1e-5,p[1],p[2]],pose);
    largestStep=Math.max(largestStep,Math.abs(value-next));
  }
  assert.ok(largestStep<.0001,'Smooth spatial displacement for '+name);
  const later=actionSurfacePose({...action(name),elapsed:1500.01},1.5);
  assert.ok(points.slice(0,50).every(p=>Math.abs(actionSurfaceDisplacement(p,later)-actionSurfaceDisplacement(p,pose))<.00002),'No temporal discontinuity for '+name);
  signature.push(field.filter((_,i)=>i%100===0).map(x=>x.toFixed(6)).join(','));
  const small=actionSurfacePose({...action(name),weight:1e-7});
  assert.ok(points.slice(0,50).every(p=>Math.abs(actionSurfaceDisplacement(p,small))<1e-7),'Action release returns to the base shape: '+name);
}
assert.equal(new Set(signature).size,names.length,'All surface actions give a distinct spatial result');
const anger=actionSurfacePose(action('angry'),1.5);
assert.ok(Math.max(...points.map(p=>actionSurfaceDisplacement(p,anger)))>.08,'Angry spikes alter the actual silhouette visibly');
for(const sign of [-1,1]){
  const half=points.filter(p=>Math.sign(p[2])===sign).map(p=>actionSurfaceDisplacement(p,anger));
  assert.ok(Math.max(...half)>.07,'Spikes appear around front and back');
}
const sad=actionSurfacePose(action('sad'));
assert.ok(actionSurfaceDisplacement([0,-1,0],sad)>actionSurfaceDisplacement([0,1,0],sad)+.01,'Frown pulls the fluid downward');
assert.ok(Math.abs(actionSurfaceDisplacement([1e-7,0,1],actionSurfacePose(action('thinking')))-actionSurfaceDisplacement([-1e-7,0,1],actionSurfacePose(action('thinking'))))<1e-7,'Swirl has no discontinuity at the pole');
for(const bad of [undefined,{},[NaN,Infinity,0],[Symbol('invalid'),null,'oops'],[0,0,0],[1]])assert.ok(Number.isFinite(actionSurfaceDisplacement(bad,anger)));
assert.ok(Number.isFinite(actionSurfaceDisplacement([0,0,1],null)));
assert.deepEqual(actionSurfacePose(action('constructor')),rest);
assert.match(actionSurfaceGLSL,/uniform vec4 uActionA,uActionB/);
assert.match(actionSurfaceGLSL,/float actionSurfaceDisplacement\(vec3 p\)/);
console.log('Verified distinct action surfaces, enveloped release, 3D all-around spikes, downward fluid, bounded optical volume, continuity and invalid input handling.');
