import assert from 'node:assert/strict';
import * as THREE from '../web/vendor/three.module.js';
import {applyPalette,createPaletteUniforms} from '../web/palettes.js';
import {BACKGROUND_CONTROLS,BACKGROUND_DEFAULTS,STAR_PALETTES,normalizeBackground,starFieldOptions} from '../web/background-settings.js';
import {createStarField} from '../web/star-field.js';

assert.equal(STAR_PALETTES.length,4);
assert.equal(BACKGROUND_DEFAULTS.starFollowAvatar,false);
assert.deepEqual(normalizeBackground(),BACKGROUND_DEFAULTS);
const normalized=normalizeBackground({starCount:1e8,starSizeMin:8,starSizeMax:1,starPalette:99,starColors:['#FF0000','#00FF00','#0000FF'],backgroundColor:'#1122AA',starFollowAvatar:true,emotion:'angry'});
assert.equal(normalized.starCount,6000);assert.equal(normalized.starSizeMax,8);assert.equal(normalized.starPalette,3);
assert.deepEqual(normalized.starColors,['#ff0000','#00ff00','#0000ff']);assert.equal(normalized.backgroundColor,'#1122aa');assert.ok(!('emotion' in normalized));
assert.equal(normalizeBackground({starColors:['red','#000000','#ffffff'],starSpread:NaN,starFollowAvatar:'true'}).starColors,null);
for(const [key,c] of Object.entries(BACKGROUND_CONTROLS)){
  assert.equal(normalizeBackground({[key]:-Infinity})[key],c.value);
  assert.equal(normalizeBackground({[key]:c.min-1})[key],c.min);
  assert.equal(normalizeBackground({[key]:c.max+1})[key],c.max);
}

const avatar=createPaletteUniforms(THREE);applyPalette(avatar,2);
avatar.uDynamicHue.value=.8;avatar.uPalettePhase.value=.3;avatar.uDynamicGain.value=1.7;
const stars=createStarField(THREE,avatar),u=stars.points.material.uniforms;
const independent={time:0,pixelRatio:2,...starFieldOptions({...BACKGROUND_DEFAULTS,starColors:['#ff0000','#00ff00','#0000ff'],starCount:2000})};
stars.update(independent);
assert.deepEqual(u.uColorA.value.toArray(),[1,0,0]);assert.equal(u.uDynamicGain.value,1);assert.equal(u.uDynamicHue.value,0);
assert.notEqual(u.uColorA,avatar.uColorA);assert.notEqual(u.uColorA.value,avatar.uColorA.value);
assert.equal(avatar.uPalettePhase.value,.3,'Independent star colors never alter avatar dynamics');
const ownRed=u.uColorA.value.clone();applyPalette(avatar,1);assert.ok(u.uColorA.value.equals(ownRed),'Editing avatar colors cannot recolor the field');

stars.update({...independent,time:.05,followAvatar:true});
for(const key of Object.keys(avatar)){
  assert.notEqual(u[key],avatar[key]);
  if(avatar[key].value?.toArray)assert.deepEqual(u[key].value.toArray(),avatar[key].value.toArray());
  else assert.equal(u[key].value,avatar[key].value);
}
stars.update({...independent,time:.1});assert.ok(u.uColorA.value.equals(ownRed),'Leaving follow mode restores independent colors');assert.equal(u.uDynamicGain.value,1);
assert.equal(avatar.uDynamicGain.value,1.7,'Leaving follow mode cannot reset avatar animation');

const positions=stars.points.geometry.attributes.position.array.slice();
stars.update({...independent,time:.15,count:5500,minSize:3,maxSize:1,spread:1.8,softness:.2,depth:1.6,twinkle:.9,glow:1.5,hue:90,saturation:.3,colorSpeed:1,twinkleSpeed:2});
assert.equal(stars.points.geometry.drawRange.count,5500);assert.deepEqual(u.sizeRange.value.toArray(),[3,3]);assert.equal(u.spread.value,1.8);assert.equal(u.softness.value,.2);
assert.equal(u.depth.value,1.6);assert.equal(u.twinkle.value,.9);assert.equal(u.glow.value,1.5);assert.equal(u.uHueShift.value,Math.PI/2);assert.equal(u.uColorSaturation.value,.3);
assert.ok(u.uPalettePhase.value>0&&u.twinklePhase.value>0);
const phase=u.uPalettePhase.value,twinkle=u.twinklePhase.value;
stars.update({...independent,time:.20,speed:0,twinkleSpeed:0,colorSpeed:0});
const drift=u.drift.value.clone();
stars.update({...independent,time:.25,speed:0,twinkleSpeed:0,colorSpeed:0});
assert.equal(u.uPalettePhase.value,phase);assert.equal(u.twinklePhase.value,twinkle);assert.ok(u.drift.value.equals(drift),'Zero movement, twinkle and color drift freeze independently');
assert.deepEqual(stars.points.geometry.attributes.position.array,positions,'Count and spread changes preserve the seeded field');
stars.update({...independent,time:6000,count:0});assert.equal(stars.points.visible,false);
stars.update({...independent,time:6001,amount:0});assert.equal(stars.points.visible,false);
stars.update({time:NaN,pixelRatio:Infinity,colors:['bad'],count:Infinity});
assert.equal(u.pixelRatio.value,1);assert.equal(stars.points.geometry.drawRange.count,1200);
for(const value of Object.values(u)){
  if(typeof value.value==='number')assert.ok(Number.isFinite(value.value));
  if(value.value?.toArray)assert.ok(value.value.toArray().every(Number.isFinite));
}
stars.dispose();
console.log('Verified independent/custom/follow star colors, palette ownership, settings normalization, density/size/spread/depth, frozen animation and invalid input.');
