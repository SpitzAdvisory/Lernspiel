/* Mikrofon gegen Lautsprecher, ElevenLabs als Erkennung, Handschrift. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8808);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1000,height:950},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8808/');
 await pg.waitForFunction(()=>typeof hoerScribe==='function'&&typeof leseHandschrift==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

  /* ---- 1. Mikrofon und Lautsprecher schliessen einander aus ---- */
  const sb=sndBtn('la cloche',true);document.body.append(sb);
  pruef('Tonknopf zu Beginn bedienbar',sb.disabled===false);
  mikroAn(true);
  pruef('Während der Aufnahme gesperrt',sb.disabled===true);
  let gespielt=false;const echt=window.ttsFr;window.ttsFr=()=>{gespielt=true;return true;};
  sayFr('la cloche');
  pruef('Während der Aufnahme bleibt es still',gespielt===false);
  mikroAn(false);window.ttsFr=echt;
  pruef('Danach wieder bedienbar',sb.disabled===false);
  /* ein ohnehin gesperrter Knopf bleibt gesperrt */
  const sb2=sndBtn('x',false);document.body.append(sb2);
  mikroAn(true);mikroAn(false);
  pruef('Ein gesperrter Knopf bleibt gesperrt',sb2.disabled===true);
  sb.remove();sb2.remove();

  /* ---- 2. ElevenLabs ---- */
  await IDB.set('kv','elevenKey','test-schluessel');
  HOERWEG=null;HOERKAPUTT=null;
  try{await IDB.del?IDB.del('kv','scribeModel'):0;}catch(_){}
  let gesehen=null;
  const echtesFetch=window.fetch;
  window.fetch=async(u,o)=>{
   if(String(u).indexOf('speech-to-text')>=0){
    gesehen={url:String(u),schluessel:(o.headers||{})['xi-api-key'],
     modell:o.body.get('model_id'),sprache:o.body.get('language_code'),
     datei:o.body.get('file')};
    return {ok:true,json:async()=>({text:'la cloche',language_code:'fra'})};}
   return echtesFetch(u,o);};
  const text=await hoerScribe(new Float32Array(16000).fill(0.1));
  pruef('Scribe wird gerufen',!!gesehen&&/api\.elevenlabs\.io\/v1\/speech-to-text$/.test(gesehen.url),gesehen&&gesehen.url);
  pruef('Schlüssel im Kopf',gesehen&&gesehen.schluessel==='test-schluessel');
  pruef('Modell gesetzt',gesehen&&/^scribe_v/.test(gesehen.modell||''),gesehen&&gesehen.modell);
  pruef('Sprache Französisch',gesehen&&gesehen.sprache==='fra',gesehen&&gesehen.sprache);
  pruef('Datei als WAV dabei',!!(gesehen&&gesehen.datei&&gesehen.datei.size>1000),
   gesehen&&gesehen.datei&&gesehen.datei.size+' Bytes');
  pruef('Text kommt zurück',text==='la cloche',JSON.stringify(text));
  const weg=await hoerWeg(()=>{});
  pruef('Mit Schlüssel gilt ElevenLabs zuerst',weg==='eleven',weg);
  pruef('Der Weg wird benannt',/ElevenLabs/.test(hoerWegText()),hoerWegText());

  /* ---- 3. Handschrift ---- */
  let bildGesehen=null;
  window.fetch=async(u,o)=>{
   if(String(u).indexOf('api.anthropic.com')>=0){
    const body=JSON.parse(o.body);
    const bild=(body.messages[0].content||[]).find(c=>c.type==='image');
    bildGesehen={typ:bild&&bild.source&&bild.source.media_type,laenge:bild&&bild.source&&bild.source.data.length,
     schluessel:(o.headers||{})['x-api-key']};
    return {ok:true,json:async()=>({content:[{type:'text',text:window.__gelesen||'la cloche'}]})};}
   return echtesFetch(u,o);};
  await IDB.set('kv','apiKey','sk-ant-test');
  const pad=scratchPad({height:200});document.body.append(pad.el);
  pruef('Leeres Blatt gibt kein Bild',pad.bild(800)===null);
  pad.strokes.push({p:[[40,40,.5],[80,60,.5],[120,40,.5]]});
  const dataUrl=pad.bild(800);
  pruef('Bild entsteht',typeof dataUrl==='string'&&dataUrl.indexOf('data:image/png')===0);
  const gelesen=await leseHandschrift(dataUrl);
  pruef('Bild geht als PNG hin',bildGesehen&&bildGesehen.typ==='image/png',bildGesehen&&bildGesehen.typ);
  pruef('Anthropic-Schlüssel im Kopf',bildGesehen&&bildGesehen.schluessel==='sk-ant-test');
  pruef('Gelesener Text kommt zurück',gelesen==='la cloche',JSON.stringify(gelesen));
  pad.el.remove();

  /* Vergleich der Schreibweise */
  pruef('Gleich zählt',schriftGleich('la cloche','la cloche'));
  pruef('Grossschreibung egal',schriftGleich('La Cloche','la cloche'));
  pruef('Schlusspunkt egal',schriftGleich('la cloche.','la cloche'));
  pruef('Akzent zählt',!schriftGleich('la fenetre','la fenêtre'));
  pruef('Falsches Wort zählt nicht',!schriftGleich('la bouche','la cloche'));
  pruef('Leeres zählt nicht',!schriftGleich('','la cloche'));

  window.fetch=echtesFetch;
  await IDB.set('kv','elevenKey','');await IDB.set('kv','apiKey','');
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
