import {ACTOR_EXPRESSIONS,ACTOR_LABELS,DEFAULT_EMOTES,LIBRARY_EMOTES} from './actor-actions.js';
import {BODY_FORMS,BODY_FORM_LABELS} from './action-body.js';

const storageKey='mote-emote-layout-v1';
const reserved=new Set(['b','x','m']);
const gridSizes=[3,4,5,6,7],maxSlots=gridSizes.at(-1)*3;
export const defaultEmoteLayout=()=>Array.from({length:maxSlots},(_,index)=>{
  const name=DEFAULT_EMOTES[index];
  return name?{name,key:'1234567890'[index]||''}:null;
});
const validKey=key=>typeof key==='string'&&/^[a-z0-9]$/.test(key)&&!reserved.has(key);
export function normalizeEmoteLayout(value){
  if(!Array.isArray(value))return defaultEmoteLayout();
  const names=new Set(),keys=new Set();
  return defaultEmoteLayout().map((_,index)=>{
    const slot=value[index];
    if(!ACTOR_EXPRESSIONS.includes(slot?.name)||names.has(slot.name))return null;
    names.add(slot.name);
    const key=validKey(slot.key)&&!keys.has(slot.key)?slot.key:'';
    if(key)keys.add(key);
    return {name:slot.name,key};
  });
}
export function placeEmote(layout,name,index){
  if(!ACTOR_EXPRESSIONS.includes(name)||!Number.isInteger(index)||index<0||index>=layout.length)return layout;
  const next=layout.slice(),source=next.findIndex(slot=>slot?.name===name);
  if(source===index)return next;
  const emote=source<0?{name,key:''}:next[source];
  if(source>=0)next[source]=next[index];
  next[index]=emote;
  return next;
}
export function createEmoteLayout({grid,editor,library,status,reset,size,shapeEditor,onChange,onPreview}){
  const templates=new Map([...grid.children].map(button=>[button.dataset.actorName,button]));
  let saved,selected='',dragged='';
  try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
  let layout=normalizeEmoteLayout(Array.isArray(saved)?saved:saved?.slots);
  let columns=gridSizes.includes(saved?.columns)?saved.columns:5;
  const shapeKeys={};
  for(const form of BODY_FORMS){
    const key=saved?.shapeKeys?.[form];
    if(validKey(key)&&!layout.some(slot=>slot?.key===key)&&!Object.values(shapeKeys).includes(key))shapeKeys[form]=key;
  }
  const save=()=>localStorage.setItem(storageKey,JSON.stringify({columns,slots:layout,shapeKeys}));
  function renderShapeKeys(){
    shapeEditor.replaceChildren();
    const heading=document.createElement('span');heading.textContent='Shape keys';shapeEditor.append(heading);
    for(const form of BODY_FORMS){
      const label=document.createElement('label'),input=document.createElement('input');
      label.textContent=BODY_FORM_LABELS[form];
      input.maxLength=1;input.placeholder='Key';input.value=(shapeKeys[form]||'').toUpperCase();
      input.setAttribute('aria-label',`Shortcut for ${BODY_FORM_LABELS[form]} shape`);
      input.addEventListener('change',()=>{
        const key=input.value.trim().toLowerCase();
        if(key&&(!validKey(key)||layout.some(slot=>slot?.key===key)||BODY_FORMS.some(other=>other!==form&&shapeKeys[other]===key))){
          input.value=(shapeKeys[form]||'').toUpperCase();status.textContent='Use an unused letter or number. B, M and X are reserved.';return;
        }
        shapeKeys[form]=key;input.value=key.toUpperCase();
        try{save();status.textContent='Shape shortcut updated.';}
        catch{status.textContent='Shape shortcut updated for this session only.';}
        onChange();
      });
      label.append(input);shapeEditor.append(label);
    }
  }
  function updateLibraryFade(){
    library.classList.toggle('has-more',library.scrollHeight-library.scrollTop-library.clientHeight>2);
  }
  library.addEventListener('scroll',updateLibraryFade,{passive:true});
  new ResizeObserver(updateLibraryFade).observe(library);
  function commit(next,message,focusIndex){
    layout=next;
    try{save();}
    catch{message+=' Saved for this session only.';}
    selected='';
    render();
    if(focusIndex!==undefined)editor.children[focusIndex]?.querySelector('button')?.focus();
    status.textContent=message;
    onChange();
  }
  function makeButton(label,className){
    const button=document.createElement('button');
    button.type='button';button.textContent=label;button.className=className;
    return button;
  }
  function addEmoteIcon(button,name){
    const template=templates.get(name);
    const icon=template?.querySelector('.actor-glyph');
    if(icon)button.prepend(icon.cloneNode(true));
    if(template?.title)button.title=template.title;
  }
  for(const [name,emote] of Object.entries(LIBRARY_EMOTES)){
    const button=makeButton(emote.label,'actor-action actor-expression');
    button.dataset.actorKind='expression';button.dataset.actorName=name;
    button.setAttribute('aria-pressed','false');button.title=emote.hint;
    const icon=document.createElement('span');
    icon.className='actor-glyph';icon.setAttribute('aria-hidden','true');icon.textContent=emote.icon;
    button.prepend(icon);
    templates.set(name,button);
  }
  function selectSource(button,name){
    button.draggable=true;
    button.addEventListener('dragstart',event=>{
      dragged=name;
      event.dataTransfer.setData('text/plain',name);
      event.dataTransfer.effectAllowed='move';
    });
    button.addEventListener('dragend',()=>{dragged='';});
  }
  function render(){
    const libraryScroll=library.scrollTop;
    size.value=String(columns);
    grid.style.setProperty('--emote-columns',columns);
    editor.style.setProperty('--emote-columns',columns);
    grid.replaceChildren();
    editor.replaceChildren();
    library.replaceChildren();
    for(const [index,slot] of layout.slice(0,columns*3).entries()){
      if(slot){
        const button=templates.get(slot.name).cloneNode(true);
        button.style.gridArea=`${Math.floor(index/columns)+1} / ${index%columns+1}`;
        button.querySelector('kbd')?.remove();
        if(slot.key){const key=document.createElement('kbd');key.textContent=slot.key.toUpperCase();button.append(key);}
        grid.append(button);
      }
      const tile=document.createElement('div');
      tile.className='emote-slot';
      const label=makeButton(slot?ACTOR_LABELS[slot.name]:'Empty','emote-slot-target');
      label.setAttribute('aria-label',`Slot ${index+1}: ${label.textContent}`);
      if(slot)addEmoteIcon(label,slot.name);
      label.setAttribute('aria-pressed',String(!!slot&&slot.name===selected));
      if(slot)selectSource(label,slot.name);
      const place=name=>commit(placeEmote(layout,name,index),`${ACTOR_LABELS[name]} placed in slot ${index+1}.`,index);
      label.addEventListener('click',()=>{
        if(selected&&selected!==slot?.name)place(selected);
        else if(slot){onPreview(slot.name);selected=selected?'':slot.name;render();editor.children[index].querySelector('button').focus();}
      });
      tile.addEventListener('dragover',event=>{if(dragged){event.preventDefault();event.dataTransfer.dropEffect='move';}});
      tile.addEventListener('drop',event=>{if(dragged){event.preventDefault();const name=dragged;dragged='';place(name);}});
      tile.append(label);
      if(slot){
        const key=document.createElement('input');
        key.value=slot.key.toUpperCase();key.maxLength=1;key.placeholder='Key';
        key.setAttribute('aria-label',`Shortcut for ${ACTOR_LABELS[slot.name]}`);
        key.addEventListener('change',()=>{
          const value=key.value.trim().toLowerCase();
          if((value&&!validKey(value))||layout.some((other,position)=>position!==index&&value&&other?.key===value)||(value&&Object.values(shapeKeys).includes(value))){
            key.value=layout[index].key.toUpperCase();status.textContent='Use an unused letter or number. B, M and X are reserved.';return;
          }
          key.value=value.toUpperCase();
          if(value!==layout[index].key){
            layout[index]={...slot,key:value};
            try{save();status.textContent='Shortcut updated.';}
            catch{status.textContent='Shortcut updated for this session only.';}
            const actorButton=grid.querySelector(`[data-actor-name="${slot.name}"]`);
            actorButton.querySelector('kbd')?.remove();
            if(value){const badge=document.createElement('kbd');badge.textContent=value.toUpperCase();actorButton.append(badge);}
          }
        });
        const remove=makeButton('×','emote-remove');
        remove.setAttribute('aria-label',`Remove ${ACTOR_LABELS[slot.name]}`);
        remove.addEventListener('click',()=>commit(layout.map((item,position)=>position===index?null:item),`${ACTOR_LABELS[slot.name]} removed.`,index));
        tile.append(key,remove);
      }
      editor.append(tile);
    }
    for(const name of ACTOR_EXPRESSIONS){
      const slot=layout.findIndex(item=>item?.name===name);
      const button=makeButton(ACTOR_LABELS[name],'emote-source');
      addEmoteIcon(button,name);
      const location=document.createElement('small');
      location.textContent=slot<0?'Available':slot>=columns*3?'Off grid':`Slot ${slot+1}`;
      button.append(location);
      button.setAttribute('aria-pressed',String(selected===name));
      selectSource(button,name);
      button.addEventListener('click',()=>{onPreview(name);selected=selected===name?'':name;render();library.children[ACTOR_EXPRESSIONS.indexOf(name)].focus();status.textContent=selected?'Choose a slot to place it.':'';});
      library.append(button);
    }
    library.scrollTop=libraryScroll;
    updateLibraryFade();
  }
  size.addEventListener('change',()=>{
    const next=Number(size.value);
    if(!gridSizes.includes(next))return;
    columns=next;
    commit(layout,`${columns} × 3 layout applied. Extra slots return when you expand the grid.`);
  });
  reset.addEventListener('click',()=>{
    columns=5;
    const defaults=defaultEmoteLayout();
    for(const form of BODY_FORMS)if(shapeKeys[form]&&defaults.some(slot=>slot?.key===shapeKeys[form]))delete shapeKeys[form];
    renderShapeKeys();
    commit(defaults,'Default layout restored.');
  });
  renderShapeKeys();
  render();
  return {forKey:key=>layout.slice(0,columns*3).find(slot=>slot?.key&&slot.key===key)?.name,
    shapeForKey:key=>BODY_FORMS.find(form=>shapeKeys[form]&&shapeKeys[form]===key),shapeKey:form=>shapeKeys[form]||''};
}
