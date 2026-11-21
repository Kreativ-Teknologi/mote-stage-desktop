import {ACTOR_EXPRESSIONS,ACTOR_GESTURES,ACTOR_LABELS,DEFAULT_EMOTES,LIBRARY_EMOTES} from './actor-actions.js';
import {BODY_FORMS,BODY_FORM_LABELS} from './action-body.js';
import {createActionIcon} from './action-icons.js';
import {LOOK_DRAG_TYPE,createLookIcon} from './quick-looks.js';

const storageKey='mote-emote-layout-v1';
const reserved=new Set(['b','x','m']);
const gridSizes=[3,4,5,6,7],maxSlots=gridSizes.at(-1)*3;
const availableActions=[...ACTOR_EXPRESSIONS,...ACTOR_GESTURES];
export const layoutActionKind=name=>ACTOR_GESTURES.includes(name)?'gesture':'expression';
export const defaultEmoteLayout=()=>Array.from({length:maxSlots},(_,index)=>{
  const name=DEFAULT_EMOTES[index];
  return name?{name,key:'1234567890'[index]||''}:null;
});
const validKey=key=>typeof key==='string'&&/^[a-z0-9]$/.test(key)&&!reserved.has(key);
export function normalizeEmoteLayout(value){
  if(!Array.isArray(value))return defaultEmoteLayout();
  const keys=new Set();
  return defaultEmoteLayout().map((_,index)=>{
    const savedSlot=value[index];
    const slot=!availableActions.includes(savedSlot?.name)&&availableActions.includes(savedSlot?.followUp)
      ?removeSlotPart(savedSlot,'emote'):savedSlot;
    const form=BODY_FORMS.includes(slot?.form)?slot.form:null;
    if(!availableActions.includes(slot?.name))return form?{form}:null;
    const key=validKey(slot.key)&&!keys.has(slot.key)?slot.key:'';
    if(key)keys.add(key);
    const item=form?{name:slot.name,key,form}:{name:slot.name,key};
    if(availableActions.includes(slot.followUp)&&slot.followUp!==slot.name){
      item.followUp=slot.followUp;
      if(BODY_FORMS.includes(slot.nextForm))item.nextForm=slot.nextForm;
      if(typeof slot.nextLookId==='string'&&slot.nextLookId.length<=100&&slot.nextLookId)item.nextLookId=slot.nextLookId;
    }
    if(typeof slot.lookId==='string'&&slot.lookId.length<=100&&slot.lookId)item.lookId=slot.lookId;
    return item;
  });
}
export function placeEmote(layout,name,index){
  if(!availableActions.includes(name)||!Number.isInteger(index)||index<0||index>=layout.length)return layout;
  const next=layout.slice(),source=next.findIndex(slot=>slot?.name===name);
  if(source===index)return next;
  const emote=source<0?{name,key:''}:next[source];
  const target=next[index];
  if(source>=0)next[source]=target?.name?target:null;
  next[index]=target?.form&&(!target.name||source<0)?{...emote,form:target.form}:emote;
  return next;
}
export function placeForm(layout,form,index){
  if(!BODY_FORMS.includes(form)||!Number.isInteger(index)||index<0||index>=layout.length)return layout;
  return layout.map((slot,position)=>position===index?{...slot,form}:slot);
}
export function removeSlotPart(slot,part){
  if(part==='emote'){
    if(slot?.followUp){
      const {followUp,nextForm,nextLookId,...rest}=slot;
      return {...rest,name:followUp,...(nextForm?{form:nextForm}:{}),...(nextLookId?{lookId:nextLookId}:{})};
    }
    return slot?.form?{form:slot.form}:null;
  }
  const next={...slot};
  if(part==='followUp'){delete next.followUp;delete next.nextForm;delete next.nextLookId;}
  else delete next[part==='look'?'lookId':part==='nextForm'?'nextForm':part==='nextLook'?'nextLookId':'form'];
  return next.name?next:null;
}
export function replaceSlotAction(layout,index,part,name){
  const slot=layout[index];
  if(!slot?.name||!availableActions.includes(name))return layout;
  if(part==='emote'&&name===slot.followUp||part==='followUp'&&name===slot.name)return layout;
  return layout.map((item,position)=>position===index?{...item,[part==='followUp'?'followUp':'name']:name}:item);
}
export function placeLibraryAction(layout,name,index){
  if(!availableActions.includes(name)||!Number.isInteger(index)||index<0||index>=layout.length)return layout;
  const slot=layout[index];
  if(!slot?.name)return layout.map((item,position)=>position===index?{...slot,name,key:''}:item);
  if(name===slot.name)return layout;
  return layout.map((item,position)=>position===index?{...slot,followUp:name}:item);
}
export function createEmoteLayout({grid,editor,library,status,reset,size,shapeEditor,listLooks,numberForLook,onChange,onPreview,onPreviewShape,externalKeyInUse=()=>false}){
  const templates=new Map([...grid.children].map(button=>[button.dataset.actorName,button]));
  let saved,selected='',selectedForm='',selectedLook='',dragged='',fromLibrary=false,selectedSlot=-1;
  try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
  let layout=normalizeEmoteLayout(Array.isArray(saved)?saved:saved?.slots);
  let columns=gridSizes.includes(saved?.columns)?saved.columns:5;
  const shapeKeys={};
  let previewShape='';
  for(const form of BODY_FORMS){
    const key=saved?.shapeKeys?.[form];
    if(validKey(key)&&!layout.some(slot=>slot?.key===key)&&!Object.values(shapeKeys).includes(key))shapeKeys[form]=key;
  }
  const save=()=>localStorage.setItem(storageKey,JSON.stringify({columns,slots:layout,shapeKeys}));
  function renderShapeKeys(){
    shapeEditor.replaceChildren();
    const heading=document.createElement('span');heading.textContent='Shape keys';shapeEditor.append(heading);
    for(const form of BODY_FORMS){
      const row=document.createElement('div'),input=document.createElement('input');
      row.className='shape-shortcut-row';
      const button=makeButton(BODY_FORM_LABELS[form],'shape-shortcut-preview');
      const icon=document.querySelector(`[data-body-form="${form}"] span`);
      if(icon)button.prepend(icon.cloneNode(true));
      button.dataset.previewForm=form;
      selectSource(button,'form:'+form);
      button.setAttribute('aria-pressed',String(previewShape===form));
      button.title='Preview '+BODY_FORM_LABELS[form];
      button.addEventListener('click',()=>{
        previewShape=form;onPreviewShape(form);
        selected='';selectedSlot=-1;fromLibrary=false;selectedLook='';selectedForm=form;
        status.textContent='Choose a slot to pair with '+BODY_FORM_LABELS[form]+'.';
        shapeEditor.querySelectorAll('[data-preview-form]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.previewForm===form)));
      });
      input.maxLength=1;input.placeholder='Key';input.value=(shapeKeys[form]||'').toUpperCase();
      input.setAttribute('aria-label',`Shortcut for ${BODY_FORM_LABELS[form]} shape`);
      input.addEventListener('change',()=>{
        const key=input.value.trim().toLowerCase();
        if(key&&(!validKey(key)||externalKeyInUse(key)||layout.some(slot=>slot?.key===key)||BODY_FORMS.some(other=>other!==form&&shapeKeys[other]===key))){
          input.value=(shapeKeys[form]||'').toUpperCase();status.textContent='Use an unused letter or number. B, M and X are reserved.';return;
        }
        shapeKeys[form]=key;input.value=key.toUpperCase();
        try{save();status.textContent='Shape shortcut updated.';}
        catch{status.textContent='Shape shortcut updated for this session only.';}
        onChange();
      });
      row.append(button,input);shapeEditor.append(row);
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
    selected='';selectedForm='';selectedLook='';fromLibrary=false;selectedSlot=-1;
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
  function addFormIcon(button,form){
    const icon=document.querySelector(`[data-body-form="${form}"] span`);
    if(icon){const copy=icon.cloneNode(true);copy.classList.add('actor-glyph');button.prepend(copy);}
  }
  for(const name of availableActions.filter(name=>!templates.has(name))){
    const button=makeButton(ACTOR_LABELS[name],'actor-action actor-expression');
    button.dataset.actorKind=layoutActionKind(name);button.dataset.actorName=name;
    button.setAttribute('aria-pressed','false');button.title=LIBRARY_EMOTES[name]?.hint??ACTOR_LABELS[name];
    templates.set(name,button);
  }
  for(const [name,button] of templates){
    button.querySelector('.actor-glyph')?.remove();
    button.prepend(createActionIcon(name));
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
    const looks=listLooks();
    size.value=String(columns);
    grid.style.setProperty('--emote-columns',columns);
    editor.style.setProperty('--emote-columns',columns);
    grid.replaceChildren();
    editor.replaceChildren();
    library.replaceChildren();
    for(const [index,slot] of layout.slice(0,columns*3).entries()){
      if(slot?.name){
        const button=templates.get(slot.name).cloneNode(true);
        button.dataset.layoutSlot=String(index);
        button.style.gridArea=`${Math.floor(index/columns)+1} / ${index%columns+1}`;
        if(slot.form)button.dataset.comboForm=slot.form;
        if(slot.form&&!slot.followUp){
          button.classList.add('actor-combo');
          const form=makeButton(BODY_FORM_LABELS[slot.form],'');
          addFormIcon(form,slot.form);
          const marker=document.createElement('span');marker.className='actor-combo-shape';
          marker.append(...form.childNodes);
          button.prepend(marker);
          button.title=BODY_FORM_LABELS[slot.form]+' + '+ACTOR_LABELS[slot.name];
        }
        if(slot.followUp){
          button.dataset.followUp=slot.followUp;
          if(slot.nextForm)button.dataset.nextForm=slot.nextForm;
          if(slot.nextLookId)button.dataset.nextLookId=slot.nextLookId;
          button.classList.add('actor-sequence');
          const pair=document.createElement('span');pair.className='actor-sequence-pair';
          for(const [step,name] of [slot.name,slot.followUp].entries()){
            if(step){
              const plus=document.createElement('span');plus.className='actor-sequence-plus';
              plus.textContent='+';plus.setAttribute('aria-hidden','true');pair.append(plus);
            }
            const item=document.createElement('span');item.className='actor-sequence-step';
            const label=document.createElement('span');label.className='actor-sequence-label';label.textContent=ACTOR_LABELS[name];
            const form=step?(slot.nextForm??slot.form):slot.form;
            const lookId=step?(slot.nextLookId??slot.lookId):slot.lookId;
            const look=looks.find(record=>record.id===lookId);
            const shapeBadge=document.createElement('span');
            shapeBadge.className='actor-sequence-style';
            if(form){
              shapeBadge.textContent=BODY_FORM_LABELS[form];
              addFormIcon(shapeBadge,form);
            }
            const lookBadge=document.createElement('span');
            lookBadge.className='actor-sequence-style';
            if(look)lookBadge.append(createLookIcon(look,numberForLook(look.id)),document.createTextNode(look.name));
            item.append(shapeBadge,createActionIcon(name),label,lookBadge);
            pair.append(item);
          }
          button.replaceChildren(pair);
          button.title=(slot.form?BODY_FORM_LABELS[slot.form]+' · ':'')+ACTOR_LABELS[slot.name]+' → '+ACTOR_LABELS[slot.followUp];
        }
        const look=looks.find(record=>record.id===slot.lookId);
        if(look)button.dataset.lookId=look.id;
        if(look&&!slot.followUp){
          const badge=document.createElement('span');
          badge.className='actor-action-look';badge.append(createLookIcon(look,numberForLook(look.id)),document.createTextNode(look.name));
          button.append(badge);button.title=(button.title||ACTOR_LABELS[slot.name])+' · '+look.name;
        }
        button.querySelector('kbd')?.remove();
        if(slot.key){const key=document.createElement('kbd');key.textContent=slot.key.toUpperCase();button.append(key);}
        grid.append(button);
      }
      const tile=document.createElement('div');
      tile.className='emote-slot'+(selectedSlot===index?' emote-slot-selected':'');
      const top=document.createElement('div');top.className='emote-slot-header';
      const slotNumber=document.createElement('span');slotNumber.textContent=`Slot ${index+1}`;top.append(slotNumber);
      tile.append(top);
      const label=makeButton(slot?.name?ACTOR_LABELS[slot.name]:'Action 1','emote-slot-target');
      label.setAttribute('aria-label',`Slot ${index+1}: ${label.textContent}`);
      if(slot?.name)addEmoteIcon(label,slot.name);
      label.setAttribute('aria-pressed',String(!!slot?.name&&slot.name===selected));
      if(slot?.name)selectSource(label,'slot:'+index);
      const move=source=>{
        if(!Number.isInteger(source)||source<0||source===index||!layout[source]?.name)return;
        const next=layout.slice();
        next[index]=slot?.name?layout[source]:{...layout[source],...(slot?.form?{form:slot.form}:{})};
        next[source]=slot?.name?slot:null;
        commit(next,`${ACTOR_LABELS[next[index].name]} moved to slot ${index+1}.`,index);
      };
      const placeFromLibrary=name=>commit(placeLibraryAction(layout,name,index),`${ACTOR_LABELS[name]} placed in slot ${index+1}.`,index);
      const pair=form=>{
        commit(placeForm(layout,form,index),`${BODY_FORM_LABELS[form]} assigned to slot ${index+1}.`,index);
      };
      const previewAction=item=>onPreview(item.name,item.form,item.followUp,item.lookId,item.nextForm,item.nextLookId);
      const attachLook=(id,second=false)=>{
        const record=looks.find(item=>item.id===id);
        if(!record||!slot?.name){status.textContent='Choose a slot that already has an action.';return;}
        if(second&&!slot.followUp)return;
        const next={...slot,[second?'nextLookId':'lookId']:id};
        commit(layout.map((item,position)=>position===index?next:item),`${record.name} assigned to ${second?'Action 2 in ':''}slot ${index+1}.`,index);
        previewAction(next);
      };
      const pairSecond=form=>{
        if(!slot?.followUp||!BODY_FORMS.includes(form))return;
        const next={...slot,nextForm:form};
        commit(layout.map((item,position)=>position===index?next:item),`${BODY_FORM_LABELS[form]} assigned to Action 2.`,index);
        previewAction(next);
      };
      const preview=()=>{
        if(!slot?.name)return;
        previewAction(slot);
        selected=slot.name;selectedSlot=index;fromLibrary=false;
        render();editor.children[index].querySelector('.emote-primary-part button')?.focus();
      };
      const removePart=(part,description)=>commit(layout.map((item,position)=>position===index?removeSlotPart(item,part):item),description+' removed.',index);
      const makeRow=(button,part,description)=>{
        const row=document.createElement('div');row.className='emote-part emote-'+part+'-part';
        row.classList.toggle('emote-drop-empty',!description);
        const caption=document.createElement('span');
        caption.className='emote-drop-label';
        const labelText=button.lastChild;
        caption.textContent=labelText.textContent;
        labelText.replaceWith(caption);
        row.append(button);
        if(description){
          const remove=makeButton('×','emote-remove');
          remove.setAttribute('aria-label',`Remove ${description} from slot ${index+1}`);
          remove.addEventListener('click',()=>removePart(part,description));
          row.append(remove);
        }
        return row;
      };
      const replace=(part,name)=>{
        const next=replaceSlotAction(layout,index,part,name);
        if(next===layout){status.textContent='Choose a different action for this part.';return;}
        commit(next,`${ACTOR_LABELS[name]} assigned to action ${part==='emote'?'1':'2'} in slot ${index+1}.`,index);
      };
      const parts=document.createElement('div');
      parts.className='emote-action-columns';
      function bindDrop(row,match,dropEffect,assign){
        row.addEventListener('dragover',event=>{
          if(!match(event.dataTransfer))return;
          event.preventDefault();
          event.dataTransfer.dropEffect=dropEffect;
          row.classList.add('emote-drop-active');
        });
        row.addEventListener('dragleave',event=>{
          if(!row.contains(event.relatedTarget))row.classList.remove('emote-drop-active');
        });
        row.addEventListener('drop',event=>{
          row.classList.remove('emote-drop-active');
          if(!match(event.dataTransfer))return;
          event.preventDefault();
          assign(event.dataTransfer);
        });
      }
      for(const second of [false,true]){
        if(second&&!slot?.name)break;
        if(second){
          const plus=document.createElement('span');
          plus.className='emote-action-plus';
          plus.textContent='+';
          plus.setAttribute('aria-hidden','true');
          parts.append(plus);
        }
        const column=document.createElement('div');
        column.className='emote-action-column';
        const name=second?slot.followUp:slot?.name;
        const form=second?slot.nextForm:slot?.form;
        const lookId=second?slot.nextLookId:slot?.lookId;
        const look=looks.find(record=>record.id===lookId);
        const actionNumber=second?2:1;

        const formButton=makeButton(BODY_FORM_LABELS[form]??'Shape','emote-slot-target');
        if(form)addFormIcon(formButton,form);
        formButton.setAttribute('aria-label',`Shape for action ${actionNumber}${form?': '+BODY_FORM_LABELS[form]:''}`);
        formButton.addEventListener('click',()=>{
          if(selectedForm)(second?pairSecond:pair)(selectedForm);
          else if(!name&&form)onPreviewShape(form);
          else preview();
        });
        const formRow=makeRow(formButton,second?'nextForm':'form',form?BODY_FORM_LABELS[form]+' shape for action '+actionNumber:null);
        bindDrop(formRow,()=>!formButton.disabled&&dragged.startsWith('form:'),'move',()=>{
          const form=dragged.slice(5);dragged='';(second?pairSecond:pair)(form);
        });
        formButton.disabled=second&&!name;

        const actionButton=second?makeButton(name?ACTOR_LABELS[name]:'Action 2','emote-slot-target'):label;
        if(second&&name)addEmoteIcon(actionButton,name);
        actionButton.addEventListener('click',()=>{
          if(fromLibrary&&selected&&selected!==name)(slot?.name?replace(second?'followUp':'emote',selected):placeFromLibrary(selected));
          else preview();
        });
        const actionRow=makeRow(actionButton,second?'followUp':'emote',name?ACTOR_LABELS[name]+' (action '+actionNumber+')':null);
        actionRow.classList.add('emote-action-drop');
        if(!second)actionRow.classList.add('emote-primary-part');
        bindDrop(actionRow,()=>dragged.startsWith('library:')||(!second&&dragged.startsWith('slot:')),'move',()=>{
          const [source,value]=dragged.split(':');dragged='';
          if(source==='slot')move(Number(value));
          else if(!slot?.name)placeFromLibrary(value);
          else replace(second?'followUp':'emote',value);
        });

        const lookButton=makeButton(look?.name??(lookId?'Unavailable':'Look'),'emote-slot-target');
        if(look)lookButton.prepend(createLookIcon(look,numberForLook(look.id)));
        lookButton.setAttribute('aria-label',`Look for action ${actionNumber}${look?': '+look.name:''}`);
        lookButton.disabled=!name;
        lookButton.addEventListener('click',()=>selectedLook?attachLook(selectedLook,second):preview());
        const lookRow=makeRow(lookButton,second?'nextLook':'look',lookId?(look?.name??'Unavailable')+' look for action '+actionNumber:null);
        bindDrop(lookRow,transfer=>!!name&&transfer.types.includes(LOOK_DRAG_TYPE),'copy',transfer=>{
          attachLook(transfer.getData(LOOK_DRAG_TYPE),second);
        });
        column.append(formRow,actionRow,lookRow);
        parts.append(column);
      }
      tile.append(parts);
      if(slot?.name){
        const key=document.createElement('input');
        key.value=slot.key.toUpperCase();key.maxLength=1;key.placeholder='Key';
        key.setAttribute('aria-label',`Shortcut for ${ACTOR_LABELS[slot.name]}`);
        key.addEventListener('change',()=>{
          const value=key.value.trim().toLowerCase();
          if((value&&(!validKey(value)||externalKeyInUse(value)))||layout.some((other,position)=>position!==index&&value&&other?.key===value)||(value&&Object.values(shapeKeys).includes(value))){
            key.value=layout[index].key.toUpperCase();status.textContent='Use an unused letter or number. B, M and X are reserved.';return;
          }
          key.value=value.toUpperCase();
          if(value!==layout[index].key){
            layout[index]={...slot,key:value};
            try{save();status.textContent='Shortcut updated.';}
            catch{status.textContent='Shortcut updated for this session only.';}
            const actorButton=grid.querySelector(`[data-layout-slot="${index}"]`);
            actorButton.querySelector('kbd')?.remove();
            if(value){const badge=document.createElement('kbd');badge.textContent=value.toUpperCase();actorButton.append(badge);}
          }
        });
        top.append(key);
      }
      editor.append(tile);
    }
    for(const name of availableActions){
      const slot=layout.findIndex(item=>item?.name===name);
      const button=makeButton(ACTOR_LABELS[name],'emote-source');
      addEmoteIcon(button,name);
      const location=document.createElement('small');
      location.textContent=slot<0?'Available':slot>=columns*3?'Off grid':`Slot ${slot+1}`;
      button.append(location);
      button.setAttribute('aria-pressed',String(selected===name));
      selectSource(button,'library:'+name);
      button.addEventListener('click',()=>{onPreview(name);selectedLook='';selectedForm='';selectedSlot=-1;selected=selected===name?'':name;fromLibrary=!!selected;render();library.children[availableActions.indexOf(name)].focus();status.textContent=selected?'Choose an empty slot or add it as a second action.':'';});
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
    defaults.forEach(slot=>{if(slot?.key&&externalKeyInUse(slot.key))slot.key='';});
    for(const form of BODY_FORMS)if(shapeKeys[form]&&defaults.some(slot=>slot?.key===shapeKeys[form]))delete shapeKeys[form];
    renderShapeKeys();
    commit(defaults,'Default layout restored.');
  });
  renderShapeKeys();
  render();
  return {updateLooks:render,selectLook:id=>{
    if(!listLooks().some(look=>look.id===id))return;
    selected='';selectedForm='';fromLibrary=false;selectedSlot=-1;selectedLook=id;
    status.textContent='Click an action slot to apply this look.';
    render();
  },forKey:key=>layout.slice(0,columns*3).find(slot=>slot?.name&&slot.key===key),
    shapeForKey:key=>BODY_FORMS.find(form=>shapeKeys[form]&&shapeKeys[form]===key),shapeKey:form=>shapeKeys[form]||'',
    usesKey:key=>!validKey(key)||layout.some(slot=>slot?.key===key)||Object.values(shapeKeys).includes(key)};
}
