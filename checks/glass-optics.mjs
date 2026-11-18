import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {glassInteriorHit} from '../web/glass-optics.js';
const camera=new THREE.PerspectiveCamera(34,16/9,.1,40);
camera.position.z=3.85;camera.lookAt(0,0,0);camera.updateMatrixWorld();
function trace(x,ior=1.44,depth=1){
  const origin=new THREE.Vector3(x,0,Math.sqrt(1.037**2-x*x));
  const normal=origin.clone().normalize(),incident=origin.clone().sub(camera.position).normalize();
  const eta=1/ior,cosine=normal.dot(incident);
  const direction=incident.clone().multiplyScalar(eta).sub(normal.clone().multiplyScalar(eta*cosine+Math.sqrt(1-eta*eta*(1-cosine*cosine))));
  const facing=-cosine;
  const hit=new THREE.Vector3(...glassInteriorHit(origin.toArray(),direction.toArray(),.985,depth,facing));
  assert.ok(hit.length()<=origin.length()+1e-8,'A refracted sample stays inside the outer volume');
  const start=origin.project(camera),end=hit.project(camera);
  for(const value of end.toArray())assert.ok(Number.isFinite(value),'No ray-intersection singularity');
  return {offset:end.x-start.x,end:end.x};
}
const central=trace(.25),rim=trace(.99);
assert.ok(Math.abs(central.offset)>.005,'The actual eye region has a visible optical displacement');
assert.ok(Math.abs(rim.offset)>Math.abs(central.offset)*8,'The rounded edge bends more strongly than the face region');
assert.ok(Math.abs(trace(.8,1).offset)<1e-8,'A straight ray projects to its original screen position');
assert.ok(Math.abs(trace(.8,1.405).offset-trace(.8,1.475).offset)>.001,'Spectral indices produce distinct samples');
assert.ok(Math.abs(trace(.8,1.44,1).offset)>Math.abs(trace(.8,1.44,0).offset),'Liquid depth increases optical travel');
let previous=trace(0).end;
for(let i=1;i<=1000;i++){
  const sample=trace(i/1000);
  assert.ok(Math.abs(sample.end-previous)<.01,'No abrupt UV jump at the former inner-sphere miss boundary');
  previous=sample.end;
}
console.log('Verified glass optical travel: visible facial bending, stronger rim, continuity, containment, depth and spectral separation.');
