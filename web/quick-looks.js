import {paletteHex} from './palettes.js';

const storageKey='bubbles-quick-looks-v1';
const count=4;
export const LOOK_DRAG_TYPE='application/x-bubbles-look';
export function createLookIcon(record,number=0){
  const icon=document.createElement('span');
  icon.className='quick-look-icon';icon.setAttribute('aria-hidden','true');
  const colors=record.appearance.customColors??paletteHex(Math.max(0,['aether','ember','dawn','void'].indexOf(record.appearance.scene)));
  icon.style.background=`linear-gradient(140deg,${colors.join(',')})`;
  if(number)icon.textContent=String(number);
  return icon;
}
export function createQuickLooks({rail,editor,list,load,onEdit,keyInUse,notify,onLookSelect,onAssignmentsChange}){
  let saved;
  try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
  const assignments=Array.from({length:count},(_,index)=>typeof saved?.[index]==='string'?saved[index]:'');
  const keys=Array.from({length:count},(_,index)=>{
    const key=saved?.keys?.[index];
    return typeof key==='string'&&/^[a-z0-9]$/.test(key)&&!keyInUse(key)?key:'';
  });
  keys.forEach((key,index)=>{if(key&&keys.indexOf(key)!==index)keys[index]='';});
  if(Array.isArray(saved?.assignments))saved.assignments.slice(0,count).forEach((id,index)=>{if(typeof id==='string')assignments[index]=id;});
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify({assignments,keys}));}catch{}};
  let lastSignature='';
  function update(){
    const presets=list();
    const signature=JSON.stringify([assignments,keys,presets]);
    if(signature===lastSignature)return;
    lastSignature=signature;
    rail.replaceChildren();editor.replaceChildren();
    for(const target of [rail,editor]){
      const heading=document.createElement('span');heading.className='quick-look-heading';heading.textContent='Looks';target.append(heading);
    }
    assignments.forEach((id,index)=>{
      const record=presets.find(preset=>preset.id===id);
      const field=document.createElement('select');
      field.setAttribute('aria-label',`Saved look for button ${index+1}`);
      field.add(new Option(id&&!record?'Look unavailable':'Unassigned',''));
      presets.forEach(preset=>field.add(new Option(preset.name,preset.id)));
      field.value=record?.id??'';
      field.addEventListener('change',()=>{
        assignments[index]=field.value;
        if(!field.value)keys[index]='';
        save();
        update();
        onAssignmentsChange?.();
        editor.querySelectorAll('select')[index]?.focus();
      });
      const row=document.createElement('div');
      row.className='quick-look-field';
      const number=document.createElement('button');
      number.type='button';number.className='quick-look-number';number.textContent=String(index+1);
      number.disabled=!record;number.draggable=!!record;
      number.title=record?`Drag Look ${index+1}: ${record.name} onto an action slot`:`Assign Look ${index+1} first`;
      number.setAttribute('aria-label',number.title);
      if(record){
        number.replaceChildren(createLookIcon(record,index+1));
        number.addEventListener('dragstart',event=>{
          event.dataTransfer.setData(LOOK_DRAG_TYPE,record.id);
          event.dataTransfer.effectAllowed='copy';
        });
        number.addEventListener('click',()=>onLookSelect?.(record.id));
      }
      const key=document.createElement('input');
      key.maxLength=1;key.placeholder='Key';key.value=keys[index].toUpperCase();key.disabled=!record;
      key.setAttribute('aria-label',`Shortcut for look button ${index+1}`);
      key.addEventListener('change',()=>{
        const next=key.value.trim().toLowerCase();
        if(next&&(!/^[a-z0-9]$/.test(next)||keyInUse(next)||keys.some((other,position)=>position!==index&&other===next))){
          key.value=keys[index].toUpperCase();notify('Choose a shortcut that is not already assigned.');return;
        }
        keys[index]=next;save();update();editor.querySelectorAll('input')[index]?.focus();
      });
      row.append(number,field,key);editor.append(row);
      if(!record)return;
      const button=document.createElement('button');
      button.type='button';button.className='quick-look-button';
      button.title='Load '+record.name;button.setAttribute('aria-label',button.title);
      const icon=createLookIcon(record);
      const name=document.createElement('span');name.textContent=record.name;
      button.append(icon,name);button.addEventListener('click',()=>load(record.id));rail.append(button);
      if(keys[index]){
        const badge=document.createElement('kbd');badge.textContent=keys[index].toUpperCase();button.append(badge);
        button.setAttribute('aria-keyshortcuts',badge.textContent);
      }
    });
    if(rail.children.length===1){
      const edit=document.createElement('button');
      edit.type='button';edit.className='quick-look-button';edit.textContent='Assign looks';
      edit.addEventListener('click',onEdit);rail.append(edit);
    }
  }
  update();
  return {update,numberForLook:id=>assignments.indexOf(id)+1,usesKey:key=>!!key&&keys.includes(key),loadForKey:key=>{
    const index=keys.indexOf(key);
    if(!key||index<0||!list().some(preset=>preset.id===assignments[index]))return false;
    load(assignments[index]);return true;
  }};
}
