import {createActorProfileStore} from './actor-calibration.js';
export function createCalibrationUI({webcam,notify}){
  const id=name=>document.getElementById(name),store=createActorProfileStore(localStorage);
  let selectedId='',activeId='',items=store.list(),lastSignature='',lastList='';
  const saved=store.active();
  if(saved&&webcam.setCalibration(saved.calibration)){activeId=items.some(p=>p.id===saved.profileId)?saved.profileId:'';selectedId=activeId;lastSignature=JSON.stringify(webcam.calibration);}
  const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  function persist(){try{store.activate(activeId,webcam.calibration);}catch{notify('Actor calibration is active, but local storage could not save it.');}}
  function render(){
    const signature=JSON.stringify([items,selectedId]);if(signature===lastList)return;lastList=signature;
    const select=id('actorProfileList');select.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=items.length?'Choose an actor':'No saved actors';select.append(empty);
    for(const p of items){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option);}
    select.value=selectedId;
  }
  id('actorProfileList').addEventListener('change',e=>{selectedId=e.target.value;const p=items.find(p=>p.id===selectedId);if(p)id('actorProfileName').value=p.name;update();});
  id('captureNeutralFace').addEventListener('click',()=>{webcam.captureNeutral();update();});
  id('captureFaceRange').addEventListener('click',()=>{webcam.captureRange();update();});
  id('resetFaceCalibration').addEventListener('click',()=>{webcam.resetCalibration();activeId='';lastSignature=JSON.stringify(webcam.calibration);persist();update();});
  id('saveActorProfile').addEventListener('click',()=>{
    try{const record=store.save(id('actorProfileName').value,webcam.calibration);items=store.list();selectedId=activeId=record.id;lastSignature=JSON.stringify(webcam.calibration);persist();notify('Saved actor '+record.name+'.');update();}
    catch(error){notify(error.message);}
  });
  id('loadActorProfile').addEventListener('click',()=>{
    const record=items.find(p=>p.id===selectedId);if(!record)return;
    if(webcam.setCalibration(record.calibration)){activeId=record.id;id('actorProfileName').value=record.name;lastSignature=JSON.stringify(webcam.calibration);persist();notify('Loaded actor '+record.name+'.');update();}
  });
  id('deleteActorProfile').addEventListener('click',()=>{
    try{const removed=store.remove(selectedId);if(!removed)return;items=store.list();if(activeId===removed.id)activeId='';selectedId=activeId;persist();notify('Deleted actor '+removed.name+'. Undo is available.');update();}
    catch(error){notify(error.message||'Unable to remove this actor profile.');}
  });
  id('undoActorProfile').addEventListener('click',()=>{
    try{const restored=store.undo();if(!restored)return;items=store.list();selectedId=restored.id;
      if(JSON.stringify(restored.calibration)===JSON.stringify(webcam.calibration))activeId=restored.id;
      persist();notify('Restored actor '+restored.name+'.');update();
    }catch(error){notify(error.message||'Unable to restore this actor profile.');}
  });
  function update(){
    const calibration=webcam.calibration,signature=JSON.stringify(calibration);
    if(signature!==lastSignature){lastSignature=signature;activeId='';persist();}
    const active=items.find(p=>p.id===activeId),selected=items.find(p=>p.id===selectedId);
    text(id('actorProfileActive'),active?'Actor: '+active.name:calibration?'Unsaved actor calibration':'Uncalibrated tracking');
    text(id('actorCalibrationStatus'),webcam.calibrationStatus);
    id('captureNeutralFace').disabled=!webcam.hasFace||webcam.calibrating;
    id('captureFaceRange').disabled=!webcam.hasFace||!calibration||webcam.calibrating;
    id('resetFaceCalibration').disabled=!calibration&&!webcam.calibrating;
    id('saveActorProfile').disabled=!calibration||webcam.calibrating;
    id('loadActorProfile').disabled=!selected||webcam.calibrating;
    id('deleteActorProfile').disabled=!selected||webcam.calibrating;
    id('undoActorProfile').hidden=!store.canUndo;
    render();
  }
  if(activeId){const profile=items.find(p=>p.id===activeId);if(profile)id('actorProfileName').value=profile.name;}
  update();return {update};
}
