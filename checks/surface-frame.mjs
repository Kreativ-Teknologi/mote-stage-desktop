import assert from 'node:assert/strict';
import {radialSurfaceNormal} from '../web/surface-frame.js';
import {actionBodyPose,actionBodyDisplacement} from '../web/action-body.js';
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),unit=v=>{const length=Math.hypot(...v);return v.map(n=>n/length);};
const points=[[0,1,0],[0,-1,0],[0,0,1],[1,0,0]];for(let i=0;i<700;i++){const y=1-(i+.5)/350,r=Math.sqrt(1-y*y),a=i*2.39996;points.push([r*Math.cos(a),y,r*Math.sin(a)]);}
for(const axes of [[1,1,1],[1.22,.7,1.07],[.8,1.3,1]])for(const p of points){
 const radius=1/Math.sqrt(p.reduce((s,n,i)=>s+(n/axes[i])**2,0));
 const actual=radialSurfaceNormal(p,q=>1/Math.sqrt(q.reduce((s,n,i)=>s+(n/axes[i])**2,0)));
 const expected=unit(p.map((n,i)=>n*radius/axes[i]**2));assert.ok(dot(actual,expected)>.999999,'Normals follow the actual ellipsoid curvature');
}
for(const name of ['joy','sad','thinking']){
 const pose=actionBodyPose({name,kind:'expression',weight:1,elapsed:2400,duration:4000,remaining:1600},1.5);
 for(const p of points){const normal=radialSurfaceNormal(p,q=>1.037*(1+actionBodyDisplacement(q,pose)));assert.ok(normal.every(Number.isFinite));assert.ok(dot(normal,p)>0,'Deformed glass has a finite outward normal');}
}
console.log('Verified displaced-surface normals against analytical ellipsoids and morphed bodies, including poles and high-strength shapes.');
