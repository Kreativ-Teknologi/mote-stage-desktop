import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {createGlassLid,deformGlassMouth,featureLight,eyeOpenness,wrapEyeInsideGlass,wrapMouthInsideGlass} from '../web/face-geometry.js';
function bounds(g){g.computeBoundingBox();const b=g.boundingBox;return [b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];}
function finite(g){for(const name of ['position','normal'])for(const x of g.attributes[name].array)assert.ok(Number.isFinite(x));}
const lid=createGlassLid(THREE);finite(lid);
// Nord has round rims without pointed corners or wings.
const ring=lid.attributes.position;
const first=0,quarter=32*13;
assert.ok(Math.abs(ring.getX(first)-ring.getY(quarter))<.04,'Nord lids stay rounded');
assert.ok(bounds(lid)[2]>.3,'Lids must have real depth');
const mouth=new THREE.TorusGeometry(1,.09,12,128),template=new Float32Array(mouth.attributes.position.array);
deformGlassMouth(mouth,template,.20,.003,-.018);finite(mouth);const closed=bounds(mouth);assert.ok(closed[2]>.005,'Lips must have real depth');
deformGlassMouth(mouth,template,.20,.20,-.055);finite(mouth);assert.ok(bounds(mouth)[1]>closed[1]*2,'Jaw opening must deform mouth geometry');
console.log('Verified finite 3D lid/lip geometry, depth and jaw deformation.');

assert.equal(featureLight(0),0,'Closed features emit no light');
assert.equal(featureLight(.05),0,'Near-closed features leave no luminous slit');
assert.equal(featureLight(1),1,'Open features reach full brightness');
assert.ok(featureLight(.5)>featureLight(.2),'Light fades smoothly with closure');

assert.equal(eyeOpenness(.5,true),0,'A closed webcam eye need not reach coefficient 1');
assert.equal(featureLight(eyeOpenness(.5,true)),0,'Webcam closure leaves no emission');
assert.equal(eyeOpenness(.02,true),1,'An open webcam eye stays open');
assert.equal(eyeOpenness(1),0,'Procedural blinks reach full closure');
assert.ok(eyeOpenness(.25,true)>0&&eyeOpenness(.25,true)<1,'Partial closure remains smooth');

const eye=new THREE.Mesh(new THREE.SphereGeometry(1,32,24));
const eyeTemplate=new Float32Array(eye.geometry.attributes.position.array);
for(const radius of [1.015,.985,.91625])for(const height of [.04,.135,.25]){
  eye.position.set(.235,.135,.945);eye.scale.set(.16,height,.047);eye.rotation.z=.45;
  wrapEyeInsideGlass(eye.geometry,eyeTemplate,eye,radius,-.035);finite(eye.geometry);eye.updateMatrix();
  const a=eye.geometry.attributes.position;
  for(let i=0;i<a.count;i++){
    const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(eye.matrix);p.y-=.035;
    assert.ok(p.length()<=radius+.000001,'Eye geometry stays beneath the glass at every expression');
  }
}
const aperture=new THREE.SphereGeometry(1,32,24),apertureTemplate=new Float32Array(aperture.attributes.position.array),origin=new THREE.Vector3(0,-.285,.94);
for(const radius of [1.015,.985,.91625])for(const height of [.003,.08,.3]){
  deformGlassMouth(aperture,apertureTemplate,.21,height,-.13,true);
  wrapMouthInsideGlass(aperture,origin,radius);finite(aperture);
  const a=aperture.attributes.position;
  for(let i=0;i<a.count;i++)assert.ok(new THREE.Vector3().fromBufferAttribute(a,i).add(origin).length()<=radius+.000001,'Mouth volume stays beneath the glass');
}
console.log('Verified curved facial volumes remain inside the glass while deforming.');
