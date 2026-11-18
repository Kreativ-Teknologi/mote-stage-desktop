import assert from 'node:assert/strict';
import {actionBodyPose,actionBodyDisplacement} from '../web/action-body.js';
const action=(name,progress=.2,extra={})=>({kind:'expression',name,elapsed:4000*progress,duration:4000,remaining:4000*(1-progress),weight:.86,mode:'blend',...extra});
const rest=actionBodyPose(null);
for(const a of [null,{},action('bad'),action('thinking',1),action('thinking',.5,{remaining:0}),action('thinking',.5,{weight:0}),{kind:'gesture',name:'nod',weight:1}])assert.deepEqual(actionBodyPose(a),rest);
for(const duration of [3000,4000,5000]){
 const pose=p=>actionBodyPose(action('thinking',p,{duration,elapsed:duration*p,remaining:duration*(1-p)}));
 assert.ok(pose(.23).shape[0]>.99&&pose(.23).shape[1]===0,'A rounded square holds first');
 assert.ok(pose(.65).shape[1]>.99&&pose(.65).shape[0]===0,'Triangle follows square');
 assert.deepEqual(pose(.96).shape,[0,0,0,0],'Body returns to the default sphere before release');
}
const dots=ms=>actionBodyPose(action('thinking',ms/4000));
assert.deepEqual(dots(120).dots,[1,0,0]);assert.deepEqual(dots(480).dots,[1,1,0]);assert.deepEqual(dots(850).dots,[1,1,1]);
for(let ms=0;ms<4000;ms+=11){const p=dots(ms);assert.ok(Math.abs(p.dotX.reduce((s,x,i)=>s+x*p.dots[i],0))<1e-10,'Visible dots stay centered');}
assert.equal(actionBodyPose(action('thinking')).face,1,'Thinking completely replaces live facial features at full blend');
assert.equal(actionBodyPose(action('thinking'),0).face,1);assert.deepEqual(actionBodyPose(action('joy'),0).shape,[0,0,0,0]);
for(const name of ['angry','afraid','neutral']){const p=actionBodyPose(action(name));assert.deepEqual(p.shape,[0,0,0,0]);assert.deepEqual(p.body,[0,0,0,0]);}
const points=[];for(let i=0;i<1000;i++){const y=1-(i+.5)/500,r=Math.sqrt(1-y*y),a=i*2.39996;points.push([r*Math.cos(a),y,r*Math.sin(a)]);}
for(const name of ['thinking','joy','sad','curious','listening'])for(const progress of [.2,.44,.65,.85]){
 const pose=actionBodyPose(action(name,progress));const later=actionBodyPose(action(name,progress+.000001));
 for(const p of points){const d=actionBodyDisplacement(p,pose);assert.ok(Number.isFinite(d));assert.ok(d>-.32&&d<.34,name+' body stays bounded');assert.ok(Math.abs(d-actionBodyDisplacement(p,later))<.0001,'Continuous animated shape');}
 // Front of the face remains an optical window rather than folding into features.
 for(const x of [-.4,0,.4])for(const y of [-.4,0,.4]){const z=Math.sqrt(1-x*x-y*y);assert.ok(actionBodyDisplacement([x,y,z],pose)>-.004,'Front clearance preserved');}
}
const square=actionBodyPose(action('thinking',.23)),tri=actionBodyPose(action('thinking',.65));
assert.ok(actionBodyDisplacement([Math.SQRT1_2,Math.SQRT1_2,0],square)-actionBodyDisplacement([1,0,0],square)>.2,'Square corners visibly differ from side centers');
assert.ok(actionBodyDisplacement([0,1,0],tri)-actionBodyDisplacement([0,-1,0],tri)>.5,'Triangle points upward with a broad base');
const sad=actionBodyPose(action('sad'));
assert.ok(actionBodyDisplacement([1,0,0],sad)>actionBodyDisplacement([0,1,0],sad)+.15,'Frown forms a soft wide cushion rather than a pointed teardrop');
const joy=actionBodyPose(action('joy'));
const tip=[0,1,0],valley=[Math.cos(Math.PI/2+Math.PI/5),Math.sin(Math.PI/2+Math.PI/5),0];
assert.ok(actionBodyDisplacement(tip,joy)-actionBodyDisplacement(valley,joy)>.40,'Smile has five clear star points and deep valleys');
const projected=angle=>{let maximum=0;for(let i=0;i<=300;i++){const r=i/300,z=Math.sqrt(1-r*r);maximum=Math.max(maximum,r*(1+actionBodyDisplacement([r*Math.cos(angle),r*Math.sin(angle),z],joy)));}return maximum;};
assert.ok(projected(Math.PI/2)-projected(Math.PI/2+Math.PI/5)>.38,'The front and back of the real 3D body do not fill the star valleys in projection');
const listen=actionBodyPose(action('listening'));for(const p of points)assert.ok(actionBodyDisplacement(p,listen)>=0&&actionBodyDisplacement(p,listen)<.061,'Listening preserves the round core instead of flattening it');
for(const bad of [undefined,{},[NaN,Infinity,0],[0,0,0],[Symbol(),null,'bad']])assert.ok(Number.isFinite(actionBodyDisplacement(bad,square)));
console.log('Verified whole-body morph sequence, preserved anger/fear, smooth shape bounds, optical front clearance, timed facial replacement and centered animated dots.');
