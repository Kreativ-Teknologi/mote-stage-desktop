export function setupActorScript(notify){
  const storageKey='mote-actor-script-v1';
  const id=name=>document.getElementById(name);
  const buttonsTab=id('actorButtonsTab'),scriptTab=id('actorScriptTab');
  const buttonsPanel=id('actorButtonsPanel'),scriptPanel=id('actorScriptPanel');
  const scriptText=id('actorScriptText'),editor=id('actorScriptEditor'),input=id('actorScriptInput');
  let text='';
  try{text=localStorage.getItem(storageKey)??'';}catch{}
  const render=()=>{scriptText.textContent=text||'Open a text file or paste your script to begin.';};
  function save(value){
    text=value;
    try{localStorage.setItem(storageKey,text);}
    catch{notify('Script saved for this session only.');}
    render();
    scriptText.scrollTop=0;
  }
  function select(showScript){
    buttonsPanel.hidden=showScript;
    scriptPanel.hidden=!showScript;
    scriptPanel.closest('.actor-panel').classList.toggle('actor-script-view',showScript);
    for(const [tab,selected] of [[buttonsTab,!showScript],[scriptTab,showScript]]){
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
    }
  }
  function edit(show){
    editor.hidden=!show;
    scriptText.hidden=show;
    if(show){input.value=text;input.focus();}
    else scriptText.focus();
  }
  buttonsTab.addEventListener('click',()=>select(false));
  scriptTab.addEventListener('click',()=>select(true));
  for(const tab of [buttonsTab,scriptTab])tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?buttonsTab:event.key==='End'?scriptTab:tab===buttonsTab?scriptTab:buttonsTab;
    select(next===scriptTab);next.focus();
  });
  id('actorScriptEdit').addEventListener('click',()=>edit(true));
  id('actorScriptSave').addEventListener('click',()=>{save(input.value);edit(false);});
  id('actorScriptCancel').addEventListener('click',()=>edit(false));
  id('actorScriptOpen').addEventListener('click',()=>{
    const picker=document.createElement('input');
    picker.type='file';picker.accept='.txt,.md,text/plain,text/markdown';
    picker.addEventListener('change',async()=>{
      const file=picker.files[0];
      if(!file)return;
      try{save(await file.text());edit(false);}
      catch{notify('Could not open the script.');}
    },{once:true});
    picker.click();
  });
  render();
}
