import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {createGlassFrosting,FROSTING_WEIGHTS} from '../web/glass-frosting.js';
assert.equal(FROSTING_WEIGHTS.length,17);
assert.ok(Math.abs(FROSTING_WEIGHTS.reduce((sum,n)=>sum+n,0)-1)<1e-12,'The filter preserves linear HDR brightness');
for(let i=0;i<8;i++)assert.equal(FROSTING_WEIGHTS[i],FROSTING_WEIGHTS[16-i],'Symmetric blur kernel');
const original=new THREE.WebGLRenderTarget(1920,1080,{type:THREE.HalfFloatType});
const outer=new THREE.WebGLRenderTarget(1920,1080);
let destination=outer,cleared=false,fail=false;
const passes=[],targets=new Set(),materials=new Set(),geometries=new Set();
const renderer={
  getRenderTarget(){return destination;},
  setRenderTarget(target){destination=target;cleared=false;},
  clear(){cleared=true;},
  render(scene,camera){
    assert.ok(cleared,'Filter passes clear old light');
    assert.ok(camera.isOrthographicCamera);
    const quad=scene.children[0],m=quad.material;
    assert.notEqual(m.uniforms.uSource.value,destination.texture,'No framebuffer reads itself');
    assert.equal(m.toneMapped,false);assert.equal(m.depthWrite,false);assert.equal(m.depthTest,false);
    assert.equal(m.glslVersion,THREE.GLSL3);assert.equal(m.blending,THREE.NoBlending);
    assert.match(m.fragmentShader,/textureLod\(uSource,uv,0\.\)/,'Read base-level pixels, never coarse mip texels');
    assert.match(m.fragmentShader,/clamp\(vUv/,'Samples clamp at texture edges');
    targets.add(destination);materials.add(m);geometries.add(quad.geometry);
    passes.push({destination,source:m.uniforms.uSource.value,direction:m.uniforms.uDirection.value.clone(),spacing:m.uniforms.uSpacing.value});
    if(fail)throw new Error('Synthetic GPU failure');
  }
};
const frosting=createGlassFrosting(THREE,renderer);
frosting.resize(1920,1080);
for(const amount of [0,-1,NaN,Infinity])assert.equal(frosting.render(original.texture,amount),original.texture);
assert.equal(passes.length,0,'Zero/invalid frosting performs no GPU work');
let output=frosting.render(original.texture,1);
assert.equal(passes.length,2,'A separable Gaussian requires exactly two passes');
assert.notEqual(output,original.texture);assert.equal(destination,outer,'Restore the enclosing optical render target');
assert.equal(passes[0].source,original.texture);assert.equal(passes[1].source,passes[0].destination.texture);
assert.equal(output,passes[1].destination.texture);
assert.equal(passes[0].destination.width,960);assert.equal(passes[0].destination.height,540);
assert.equal(passes[0].direction.x,1/960);assert.equal(passes[0].direction.y,0);
assert.equal(passes[1].direction.x,0);assert.equal(passes[1].direction.y,1/540);
assert.equal(passes[0].spacing,.9);
for(const target of targets){
  assert.equal(target.texture.type,THREE.HalfFloatType);assert.equal(target.texture.colorSpace,THREE.LinearSRGBColorSpace);
  assert.equal(target.texture.minFilter,THREE.LinearFilter);assert.equal(target.texture.magFilter,THREE.LinearFilter);
  assert.equal(target.texture.generateMipmaps,false);assert.equal(target.depthBuffer,false);assert.equal(target.stencilBuffer,false);
}
const allocated=new Set(targets);
frosting.resize(1279,721);output=frosting.render(original.texture,.4);
assert.equal([...targets][0].width,640);assert.equal([...targets][0].height,361);
assert.ok(Math.abs(passes.at(-1).spacing-.36)<1e-12,'Blur spacing varies continuously with frosting strength');
assert.equal(targets.size,allocated.size,'Reusing the pass buffers does not allocate every frame');
frosting.resize(1,1);frosting.render(original.texture,1);for(const target of targets){assert.equal(target.width,1);assert.equal(target.height,1);}
assert.throws(()=>frosting.render(output,1),/original inner-scene/,'Do not accept a previous output as input');
fail=true;assert.throws(()=>frosting.render(original.texture,1),/Synthetic GPU/);assert.equal(destination,outer,'Restore the render target even after an error');fail=false;
let disposed=0;for(const resource of [...targets,...materials,...geometries])resource.addEventListener('dispose',()=>disposed++);
frosting.dispose();assert.equal(disposed,targets.size+materials.size+geometries.size,'Release both HDR buffers, material and geometry');
frosting.dispose();assert.equal(disposed,4,'Repeated disposal is safe');
const before=passes.length;assert.equal(frosting.render(original.texture,1),original.texture);assert.equal(passes.length,before,'Disposed helpers perform no draws');
original.dispose();outer.dispose();
console.log('Verified smooth glass frosting: normalized 17-tap linear HDR Gaussian, two independent half-resolution passes, no mip artifacts/feedback, zero bypass and resource lifecycle.');
