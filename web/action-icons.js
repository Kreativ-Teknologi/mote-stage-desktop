const icons={
  neutral:['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z','M8 13h8','silver'],
  curious:['M12 3 14.6 9.4 21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z','M16 4h4m-2-2v4','violet'],
  joy:['M4 13a8 8 0 0 0 16 0','M7 9h.1m9.9 0h.1M12 3v3','gold'],
  angry:['m13 2-8 12h6l-1 8 9-13h-6Z','m4 5 2 2m13 11 2 2','coral'],
  sad:['M5 17a7 7 0 0 1 14 0','M8 8h.1m8 0h.1m5 10v3','ice'],
  afraid:['m12 2 8 10-8 10L4 12Z','M12 8v5m0 3h.1','violet'],
  thinking:['M20 16a3 3 0 0 0 2-3V7a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3v4l5-4Z','M7 10h.1m4.9 0h.1m4.9 0h.1','ice'],
  listening:['M13 20c-3 0-3-3-4-5-1-2-3-3-3-6a6 6 0 0 1 12 0c0 4-3 4-4 7','M10 9a2 2 0 1 1 4 0c0 2-2 2-2 4m7 2 2 2','mint'],
  flirting:['M12 20 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6Z','m4 4 2 2m13-3 2-1','pink'],
  pop:['M8 4a8 8 0 1 0 12 8','m14 8 3-5m1 7 5-2m-4 7 3 2','ice'],
  laugh:['M4 12h16a8 8 0 0 1-16 0Z','m5 8 2-2 2 2m6 0 2-2 2 2','gold'],
  shy:['M6 9q2 3 5 1m2 0q3 2 5-1m-8 7q2 2 4 0','m4 13 2 1m12 0 2-1','pink'],
  surprise:['M12 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z','M7 7h.1m9.9 0h.1M12 2v4','gold'],
  sleepy:['M18 17A8 8 0 0 1 8 5a8 8 0 1 0 10 12Z','M16 4h5l-5 5h5','violet'],
  proud:['m3 8 4 4 5-7 5 7 4-4-2 11H5Z','M8 16h8M12 2h.1','gold'],
  delight:['M12 5v14M5 12h14M7 7l10 10M17 7 7 17','M12 2v1m0 18v1M2 12h1m18 0h1','pink'],
  skeptical:['M4 10h6m4 0 5-3m-8 9h5','M6 6h4m9 10v2','violet'],
  confused:['M8 7a4 4 0 0 1 8 0c0 3-4 3-4 6','M12 17h.1m-8-1 2 2m12-2 2-2','gold'],
  worried:['m5 9 4-3m6 0 4 3M7 18q5-7 10 0','M6 13h.1m11.9 0h.1m-6-9V2','ice'],
  relieved:['M3 14q4-5 8 0t10 0M5 18q3-3 6 0t8 0','M8 8q4 3 8 0','mint'],
  dizzy:['M12 12c3-4 7 1 3 4-6 5-13-3-8-9 6-7 16 0 13 8','m3 3 2 2m14 14 2 2','violet'],
  grumpy:['m4 7 6 4m4 0 6-4M7 18h10','M5 13h3m8 0h3','coral'],
  determined:['M3 12h17m-7-6 7 6-7 6','M4 7h5m-5 10h5','gold'],
  awe:['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z','M19 3v4m-2-2h4M4 19v2','ice'],
  pout:['M6 9h3m6 0h3M8 17q4-3 8 0','M10 14q2-2 4 0','pink'],
  smirk:['M6 14q6 5 12-3','M6 8h2m8 0 3-2','pink'],
  squint:['m4 9 5 2-5 2m16-4-5 2 5 2','M9 18h6','ice'],
  disgust:['m4 8 5 1m6 1 5-3M7 17q4-5 6-2t4 1','M4 13h2m13 0h2','coral'],
  deadpan:['M4 9h6m4 0h6M8 17h8','M4 6h3m7 6h3','silver'],
  doubleTake:['m7 4-4 4 4 4m-4-4h9a7 7 0 0 1 7 7','M17 18h4m-2-2v4','gold'],
  sigh:['M3 10q3 4 6 0m2 0q3 4 6 0','M9 16h8q4 0 4 3m-8 1h4','ice'],
  wince:['m4 8 5 3-5 3m16-6-5 3 5 3M8 18h8','m10 5 2-3 2 3','coral'],
  tender:['M12 18 5 11a4 4 0 0 1 7-4 4 4 0 0 1 7 4Z','M9 11q3 3 6 0','pink'],
  stifledLaugh:['m5 9 3-2 3 2m2 0 3-2 3 2M6 15q6 5 12 0','M4 12h2m12 0h2','mint'],
  explosion:['m12 2 3 6 7-1-4 5 4 5-7-1-3 6-3-6-7 1 4-5-4-5 7 1Z','M9 12h6m-3-3v6','coral'],
  rainbow:['M3 17a9 9 0 0 1 18 0','M6 17a6 6 0 0 1 12 0m-9 0a3 3 0 0 1 6 0','pink'],
  comet:['M19 5a4 4 0 1 1-5.7 5.7A4 4 0 0 1 19 5Z','m11 11-8 6m10-3-6 7m5-13-7 4','ice'],
  shockwave:['M7 8a6 6 0 0 0 0 8m10-8a6 6 0 0 1 0 8','M4 5a10 10 0 0 0 0 14m16-14a10 10 0 0 1 0 14M12 10v4','mint'],
  eclipse:['M17 5A8 8 0 1 0 19 17 8 8 0 0 1 17 5Z','M17 2v2m4 2-2 1m4 4h-2','gold'],
  sparkle:['m12 3 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z','M19 3v4m-2-2h4M4 19h3m-1.5-1.5v3','violet'],
  prism:['m12 3 9 17H3Z','m3 10 8 3 10-3m-10 3 8 6','ice'],
  heartbeat:['M3 12a5 5 0 0 1 9-6 5 5 0 0 1 9 6l-9 9Z','M4 12h4l2-3 3 6 2-3h5','pink'],
  orbit:['M4 17c-2-2 0-6 5-9s10-4 12-2-1 6-6 9-9 4-11 2Z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z','ice'],
  melt:['M3 11q3-5 8-3c3 1 4 3 6 3s4 1 4 3-3 3-9 3-10-1-10-3Z','M5 20h5m6 0h3','mint'],
  aurora:['M2 14c5-10 9-10 12-5s5 3 8-3','M2 19c6-10 10-7 13-4s4 1 7-2','mint'],
  wormhole:['M12 3a9 9 0 1 1-9 9','M5 12a7 7 0 1 1 7 7 5 5 0 1 1 5-5','violet'],
  crystal:['m12 2 7 5v10l-7 5-7-5V7Z','m5 7 7 4 7-4m-7 4v11m0-20v9','ice'],
  nebula:['M4 16C0 13 6 6 10 8c4-5 12 1 10 5 4 5-4 7-7 4-4 4-7 2-9-1Z','M10 12h.1m5 1h.1m2-8v3m-1.5-1.5h3','pink'],
  echo:['M16 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z','M13 5a7 7 0 0 1 0 14m4-16a10 10 0 0 1 0 18','violet'],
  lantern:['M7 7h10l3 4-3 7H7l-3-7Zm3 11v3m4-3v3M10 7V4h4v3','M12 10q-4 4 0 6 4-2 0-6Z','gold'],
  gravity:['M3 13q9 9 18 0M5 9q7 6 14 0','M12 3v8m-3-3 3 3 3-3','ice'],
  fireflies:['M7 8h.1m10 0h.1M12 17h.1','M7 4v2m-4 2h2m12 4v2m4-6h-2m-7 12v2','mint'],
  nod:['M12 3v15m-5-5 5 5 5-5','M5 4c0-1 2-2 4-2m10 2c0-1-2-2-4-2','mint'],
  'look-left':['M21 12H3m7-7-7 7 7 7','M15 7h5m-5 10h5','ice'],
  'look-right':['M3 12h18m-7-7 7 7-7 7','M4 7h5m-5 10h5','ice'],
  blink:['M3 10q9 9 18 0','m6 14-2 4m8-2v4m6-6 2 4','violet']
};
const tones={
  silver:['#d4d4d4','#a5a5a5'],violet:['#bf9fff','#f2b4ff'],gold:['#ffd477','#fff1ac'],
  coral:['#ff856f','#ffca90'],ice:['#8dc7ff','#b7f3ff'],mint:['#79dfc0','#d7f49b'],pink:['#f599c8','#ffccaa']
};
export function createActionIcon(name){
  const [primary,accent,tone]=icons[name]??icons.neutral;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('class','actor-glyph action-icon');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  for(const [index,data] of [primary,accent].entries()){
    const path=document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('d',data);path.setAttribute('fill','none');path.setAttribute('stroke',tones[tone][index]);
    path.setAttribute('stroke-width',index?'1.9':'1.55');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
    svg.append(path);
  }
  return svg;
}
