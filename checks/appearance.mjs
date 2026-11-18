import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {CONTROLS,APPEARANCE_DEFAULTS,pickAppearance,createAppearanceStore} from '../web/appearance-settings.js';
import {getRenderSettings,renderScale,gesturePose} from '../web/render-settings.js';
import {createPaletteUniforms,applyPalette,paletteHex} from '../web/palettes.js';
import {createStarField} from '../web/star-field.js';
import {createAudioFluidDriver} from '../web/fluid-motion.js';
const mapping={facePresence:'face',orbSize:'size',surfaceDeformation:'deform',glassDepth:'glass',internalDepth:'depth',surfaceRipples:'ripple',fluidMotion:'motion'};
for(const [key,c] of Object.entries(CONTROLS)){
  const a=getRenderSettings({...APPEARANCE_DEFAULTS,[key]:c.min}),b=getRenderSettings({...APPEARANCE_DEFAULTS,[key]:c.max});
  assert.notEqual(a[mapping[key]||key],b[mapping[key]||key],key+' must reach the renderer at both ends of its range');
}
for(const dpr of [1,2]){assert.ok(renderScale(dpr,.7)<renderScale(dpr,1));assert.ok(renderScale(dpr,1)<renderScale(dpr,1.3));assert.equal(renderScale(dpr,1.3),dpr,'High quality preserves native resolution');}
assert.ok(gesturePose('look-left',700).yaw<0&&gesturePose('look-right',700).yaw>0,'Look gestures must use yaw');
assert.notEqual(gesturePose('nod',300).pitch,0,'Nod must use pitch');
const stopped=createAudioFluidDriver().update(0,.05,false,0);assert.equal(stopped.phase,0,'Flow speed zero stops idle flow');
const u=createPaletteUniforms(THREE),stars=createStarField(THREE,u),signatures=[];
for(let i=0;i<4;i++){applyPalette(u,i);signatures.push(JSON.stringify([u.uColorA.value,u.uColorB.value,u.uColorC.value]));stars.update({followAvatar:true});assert.notEqual(stars.points.material.uniforms.uColorA,u.uColorA,'Stars own their palette uniforms');assert.ok(stars.points.material.uniforms.uColorA.value.equals(u.uColorA.value),'Optional follow mode copies the live palette');assert.equal(paletteHex(i).length,3);}
assert.equal(new Set(signatures).size,4,'All four palette options are distinct');
applyPalette(u,0,['#ff0000','#00ff00','#0000ff'],45,1.5,.6);assert.deepEqual(u.uColorA.value.toArray(),[1,0,0]);assert.equal(u.uColorGain.value,.6);
const options={time:0,amount:.8,pixelRatio:2,count:5000,minSize:1,maxSize:4,speed:1,direction:0,depth:1.5,twinkle:.6,glow:1.5};stars.update(options);
assert.equal(stars.points.geometry.drawRange.count,5000);assert.deepEqual(stars.points.material.uniforms.sizeRange.value.toArray(),[1,4]);
stars.update({...options,time:.05});assert.ok(stars.points.material.uniforms.drift.value.x>0);const drift=stars.points.material.uniforms.drift.value.clone();
stars.update({...options,time:.10,speed:0});assert.ok(stars.points.material.uniforms.drift.value.equals(drift),'Star speed zero stops drift');
stars.update({...options,time:.15,count:0});assert.equal(stars.points.visible,false,'Zero stars hides the field');stars.dispose();
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};let sequence=0;
const store=createAppearanceStore(storage,()=>String(++sequence));
const input={...APPEARANCE_DEFAULTS,starCount:4200,flowCurl:1.7,customColors:['#aabbcc','#112233','#00ffee'],emotion:'angry',blackout:true};
const first=store.save('Stage blue',input);assert.deepEqual(first.appearance,pickAppearance(input));assert.ok(!('blackout' in first.appearance)&&!('emotion' in first.appearance),'Appearance does not alter live performance state');
const reopened=createAppearanceStore(storage);assert.deepEqual(reopened.list()[0].appearance,first.appearance,'Presets survive reopening');
const update=store.save('Stage blue',{...input,starCount:100});assert.equal(update.id,first.id);assert.equal(store.list().length,1,'Saving a named look updates it');
store.remove(first.id);assert.equal(store.list().length,0);store.undo();assert.equal(store.list()[0].id,first.id,'Delete can be undone');
const normalized=pickAppearance({starSizeMin:8,starSizeMax:1,starCount:1e9});assert.equal(normalized.starSizeMax,8);assert.equal(normalized.starCount,6000);
console.log('Verified every appearance range, distinct palettes, custom colors, star controls, native quality, gestures and preset persistence/delete/undo.');

const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
for(const key of Object.keys(CONTROLS)){assert.ok(html.includes('id="'+key+'"'),key+' needs a visible control');assert.ok(html.includes('id="'+key+'Output"'),key+' needs a value display');}

for(const [key,c] of Object.entries(CONTROLS)){
  const input=html.match(new RegExp('<input id="'+key+'"[^>]*>'))?.[0];
  assert.equal(Number(input?.match(/min="([^"]+)"/)?.[1]),c.min*c.scale,key+' minimum matches its renderer contract');
  assert.equal(Number(input?.match(/max="([^"]+)"/)?.[1]),c.max*c.scale,key+' maximum matches its renderer contract');
}
