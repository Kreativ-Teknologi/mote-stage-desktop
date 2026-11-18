import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {createPostProcessing} from '../web/post-processing.js';
let destination=null,cleared=false;
const targets=new Set(),materials=new Set();
const renderer={
  setRenderTarget(t){destination=t;cleared=false;if(t)targets.add(t);},
  clear(){cleared=true;},
  render(scene){
    assert.ok(cleared,'Every optical pass must clear stale light');
    const m=scene.children[0].material;materials.add(m);
    for(const u of Object.values(m.uniforms))if(u.value?.isTexture&&destination)assert.notEqual(u.value,destination.texture,'Optical passes cannot read their own framebuffer');
    assert.equal(m.toneMapped,destination===null,'Only the screen pass applies the display transform');
    cleared=false;
  }
};
const optics=createPostProcessing(THREE,renderer);targets.add(optics.sceneTarget);
for(const [w,h] of [[1920,1080],[1280,721],[2,2]]){
  optics.resize(w,h);assert.equal(optics.sceneTarget.width,w);assert.equal(optics.sceneTarget.height,h);
  optics.render({bloomStrength:.48,flareStrength:.18});
  optics.render({bloomStrength:0,flareStrength:0});
  assert.equal(destination,null,'Rendering returns to the screen');
}
for(const t of targets){assert.ok(t.width>=2&&t.height>=2);assert.equal(t.texture.type,THREE.HalfFloatType);assert.equal(t.texture.colorSpace,THREE.LinearSRGBColorSpace);}
let disposed=0;for(const t of targets)t.addEventListener('dispose',()=>disposed++);
optics.dispose();assert.equal(disposed,targets.size,'All optical framebuffers must be released');
console.log('Verified HDR optics: full-resolution scene, linear light, no framebuffer feedback, cleared light and resource disposal.');
