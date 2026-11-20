import assert from 'node:assert/strict';
import {createCharacterPerformance} from '../web/character-performance.js';
const action=(name,elapsed=1000)=>({id:name,kind:'expression',name,elapsed,duration:4000,remaining:4000-elapsed,weight:.86,mode:'blend'});
for(const fps of [30,60,120,240]){
 const driver=createCharacterPerformance();let pose;
 for(let i=0;i<fps;i++)pose=driver.update(action('sad'),1,1/fps);
 assert.ok(pose.body.shape[3]>.999,'The full frown silhouette is reached');
 const previous=pose.body.shape[3];pose=driver.update(action('thinking',100),1,1/fps);
 assert.ok(pose.body.shape[3]>0&&pose.body.shape[3]<previous,'Switching actions retains and eases out the visible body');
 let largestJump=0;
 for(let i=1;i<fps*.3;i++){const before=pose;pose=driver.update(action('thinking',100+i/fps*1000),1,1/fps);largestJump=Math.max(largestJump,Math.abs(pose.body.shape[3]-before.body.shape[3]));}
 assert.ok(largestJump<.5,'Crossfade remains bounded across frame rates');
 for(let i=0;i<fps*1.2;i++)pose=driver.update(null,1,1/fps);
 assert.deepEqual(pose.body.shape,[0,0,0,0]);assert.deepEqual(pose.surface.a,[0,0,0,0]);assert.equal(pose.body.face,0,'Old faces fully extinguish after release');
}
const driver=createCharacterPerformance();let last;
for(let ms=1;ms<3900;ms+=1000/120){const p=driver.update(action('thinking',ms),1,1/120);assert.ok(Math.abs(p.body.dotX.reduce((sum,x,i)=>sum+x*p.body.dots[i],0))<1e-10,'Smoothed visible dots remain centered');last=p;}
const unchanged=driver.update(action('thinking',3900),1,0);assert.deepEqual(unchanged.body.shape,last.body.shape,'Zero time cannot change a rendered shape');
const strength=createCharacterPerformance();let full;for(let i=0;i<120;i++)full=strength.update(action('sad'),1.5,1/120);assert.ok(full.body.shape[3]>1.49,'The entire surface-reaction control range affects body shape');
console.log('Verified fluid action crossfades, centered dot transitions, exact release extinction, full reaction range and frame-rate independence.');
