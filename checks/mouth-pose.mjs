import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {speechMouthPose} from '../web/mouth-pose.js';
import {deformGlassMouth,wrapMouthInsideGlass} from '../web/face-geometry.js';

const rest=speechMouthPose();
assert.equal(rest.height,0);assert.equal(rest.light,0,'Resting mouth fully disappears');
assert.equal(speechMouthPose({opening:.008}).light,0,'Nearly closed mapped jaw leaves no luminous line');
assert.equal(speechMouthPose({voice:.015}).light,0,'Near-silent mic energy leaves no luminous line');
const loud=speechMouthPose({voice:1}),jaw=speechMouthPose({opening:.36});
assert.ok(loud.width>.17&&jaw.width>.17,'Speech opens sideways as well as vertically');
assert.ok(jaw.height<.12,'Mapped articulation is not used as literal vertical mesh height');
assert.ok(jaw.width/jaw.height>2,'A fully open jaw remains a wide speech shape');
assert.ok(jaw.drop>0&&jaw.drop<jaw.height,'Lower-jaw travel moves downward without shifting the whole face');
assert.equal(jaw.light,1);assert.equal(loud.light,1);
let previous=0;
for(let i=0;i<=100;i++){
  const pose=speechMouthPose({opening:.36*i/100});
  assert.ok(pose.height>=previous,'Jaw travel is monotonic');previous=pose.height;
  assert.ok(pose.height<=pose.width*.54+1e-12,'Opening never becomes a tall scream');
}
const smile=speechMouthPose({opening:.055,width:.21,curve:-.13});
const frown=speechMouthPose({opening:.045,width:.17,curve:.18});
assert.ok(smile.curve<-.05&&frown.curve>.05,'Smile and frown remain readable');
assert.ok(smile.light>.5&&frown.light>.4,'Explicit expression actions retain visible mouth light');
assert.ok(speechMouthPose({opening:.36,width:.11,pucker:1,funnel:1}).height<.09,'A pursed mouth cannot become vertically stretched');
const invalid=speechMouthPose({opening:NaN,voice:Infinity,width:-99,curve:Infinity,skew:NaN});
for(const value of Object.values(invalid))assert.ok(Number.isFinite(value),'Invalid input cannot poison geometry');

// Verify the actual deformed volume, including curved smiles/frowns, remains
// horizontally legible and beneath the optical shell at maximum deformation.
const geometry=new THREE.SphereGeometry(1,64,32),template=new Float32Array(geometry.attributes.position.array);
const origin=new THREE.Vector3(0,-.285,.94);
for(const radius of [.985,.91625])for(const pose of [rest,loud,jaw,smile,frown,speechMouthPose({opening:.36,width:.11,pucker:1,funnel:1})]){
  origin.y=-.285-pose.drop;
  deformGlassMouth(geometry,template,pose.width,Math.max(.003,pose.height),pose.curve,true,pose.skew);
  wrapMouthInsideGlass(geometry,origin,radius);
  geometry.computeBoundingBox();const size=new THREE.Vector3();geometry.boundingBox.getSize(size);
  assert.ok(size.x>size.y*1.2,'Curvature must not turn the rendered aperture vertical');
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)assert.ok(new THREE.Vector3().fromBufferAttribute(positions,i).add(origin).length()<=radius+.000001,'Speech volume stays inside the glass');
}
geometry.dispose();
console.log('Verified broad speech opening, sideways articulation, full closure, expressive curvature and refractive volume containment.');
