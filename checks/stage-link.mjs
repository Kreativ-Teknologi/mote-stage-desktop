import assert from 'node:assert/strict';
import {createStageLink} from '../web/stage-link.js';
const origin='https://stage.example';
function environment(){const listeners=new Set();return {crypto:{randomUUID:()=>String(Math.random())},location:{origin},BroadcastChannel:class{constructor(){throw Error('partitioned');}},opener:null,addEventListener:(n,fn)=>listeners.add(fn),removeEventListener:(n,fn)=>listeners.delete(fn),dispatch:e=>{for(const fn of listeners)fn(e);}};}
const control=environment(),stage=environment();
const controlProxy={closed:false,postMessage(data){control.dispatch({origin,source:stageProxy,data});}};
const stageProxy={closed:false,postMessage(data){stage.dispatch({origin,source:controlProxy,data});}};
stage.opener=controlProxy;
const received=[];let state={name:'Nord',audioFluid:true,trackingFailsafe:true,trackingBlackout:true,faceStrength:1.8,starField:.35,bloomStrength:.48,flareStrength:.18,edgeGlow:.7,emotion:'joy',refraction:.95,cameraFace:true,blackout:true};
const c=createStageLink(control,({data})=>{if(data.type==='hello'){c.post({type:'state',state,clockOrigin:100000});c.post({type:'assets',assets:{base:{src:'data:image/png;base64,test'}}});}});
const s=createStageLink(stage,({data})=>received.push(data));
c.add(stageProxy);s.post({type:'hello'});
assert.deepEqual(received[0].state,state);
assert.equal(received[0].clockOrigin,100000,'Transient show clock survives the direct output transport');
assert.ok(received[1].assets.base.src.startsWith('data:'));
for(const payload of [{type:'meter',level:.8},{type:'tracking',sample:{yaw:.4,shapes:{jawOpen:.7}}},{type:'gesture',name:'nod'}])c.post(payload);
assert.deepEqual(received.slice(2).map(x=>x.type),['meter','tracking','gesture']);
// Duplicate packets from multiple transports must not replay gestures or transitions.
const last=received.at(-1);stage.dispatch({origin,source:controlProxy,data:last});assert.equal(received.length,5);
stage.dispatch({origin:'https://untrusted.example',source:controlProxy,data:{...last,id:'bad'}});assert.equal(received.length,5);
state={...state,blackout:false,orbSize:1.3};s.post({type:'hello'});assert.equal(received.at(-2).state.blackout,false);assert.equal(received.at(-2).state.orbSize,1.3);
const actor={id:'actor-1',kind:'expression',name:'joy',duration:4000,mode:'blend',at:123456};
c.post({type:'actor-action',action:actor});assert.deepEqual(received.at(-1).action,actor,'Timed Actor actions reach an independently linked output');
c.post({type:'actor-action',action:null});assert.equal(received.at(-1).action,null,'Actor release reaches the output');
c.close();s.close();console.log('Verified direct sync without BroadcastChannel: state, artwork, mic, webcam, gestures, reconnect, duplicate and origin checks.');
