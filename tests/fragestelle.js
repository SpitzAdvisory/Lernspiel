/* Die Fragestelle: das gesprochene Gespraech mit dem Lernhilfe-Agenten.
   Geprueft wird gegen einen nachgebauten Dienst, der das Protokoll von
   ElevenLabs spricht. So laesst sich alles pruefen, was die App tut, ohne
   einen Schluessel und ohne eine Minute Gespraechszeit zu verbrauchen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const D='/tmp/claude-0/wtest';
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

/* --- Nachgebauter Vermittler und nachgebauter Dienst --- */
let gesehen={init:null,tonStuecke:0,pong:null,agentAngefragt:null,herkunft:null};
const wss=new WebSocketServer({port:8891});
wss.on('connection',(ws,req)=>{
 gesehen.pfad=req.url;
 ws.on('message',roh=>{
  let m=null;try{m=JSON.parse(roh.toString());}catch(_){return;}
  if(m.type==='conversation_initiation_client_data'){
   gesehen.init=m;
   /* Begruessung mit eingesetzter Variablen, dazu ein Stueck Ton */
   const name=(m.dynamic_variables&&m.dynamic_variables.vorname)||'???';
   ws.send(JSON.stringify({type:'agent_response',agent_response_event:{agent_response:'Hoi '+name+'. Sag mir, wo Du steckst.'}}));
   const n=1600;const b=Buffer.alloc(n*2);
   for(let i=0;i<n;i++)b.writeInt16LE(Math.round(3000*Math.sin(i/8)),i*2);
   ws.send(JSON.stringify({type:'audio',audio_event:{audio_base_64:b.toString('base64'),event_id:1}}));
   ws.send(JSON.stringify({type:'ping',ping_event:{event_id:77,ping_ms:0}}));
   setTimeout(()=>ws.send(JSON.stringify({type:'user_transcript',user_transcription_event:{user_transcript:'Ich weiss nicht weiter.'}})),120);
   return;}
  if(m.type==='pong'){gesehen.pong=m.event_id;return;}
  if(m.user_audio_chunk!==undefined){gesehen.tonStuecke++;return;}});});

const srv=http.createServer((q,s)=>{
 if(q.url==='/agent'){
  gesehen.herkunft=q.headers.origin||'';
  let leib='';q.on('data',c=>leib+=c);
  q.on('end',()=>{let j=null;try{j=JSON.parse(leib);}catch(_){}
   gesehen.agentAngefragt=j&&j.agent_id;
   s.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
   s.end(JSON.stringify({signed_url:'ws://127.0.0.1:8891/probe'}));});
  return;}
 const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8890);

(async()=>{
 const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const kontext=await b.newContext({permissions:['microphone']});
 const pg=await kontext.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8890/');
 await pg.waitForFunction(()=>typeof fragestelleBox==='function');

 /* ---------- Die Bausteine ---------- */
 const bs=await pg.evaluate(()=>{
  const f=new Float32Array([0,0.5,-0.5,0.999,-1]);
  const zurueck=base64NachPcm(pcmNachBase64(f));
  return {gleich:zurueck.length===f.length&&f.every((v,i)=>Math.abs(v-zurueck[i])<0.0001),
   agent:LERNHILFE_AGENT,
   leerText:fragestelleBox({aufgabe:''})===null,
   box:!!fragestelleBox({aufgabe:'2 + 2 = ?',loesung:'4'})};});
 pruef('Ton hin und zurück ergibt dieselben Werte',bs.gleich===true);
 pruef('Die Kennung des Lernhilfe-Agenten steht in der App',/^agent_/.test(bs.agent),bs.agent);
 pruef('Ohne Aufgabe gibt es keinen Knopf',bs.leerText===true);
 pruef('Mit Aufgabe gibt es einen Knopf',bs.box===true);

 /* ---------- Das Gespräch ---------- */
 await pg.evaluate(async()=>{
  /* Der Vermittler laeuft hier ohne https; die App verlangt https,
     darum wird die Adresse fuer den Versuch unmittelbar gesetzt. */
  window.__echterVermittler=window.vermittler;
  window.vermittler=async()=>'http://127.0.0.1:8890';
  window.__spur=[];
  window.__box=fragestelleBox({fach:'Mathematik',thema:'Potenzen',
   aufgabe:'Bilde die 4. Potenz von 3.',schritte:'3 · 3 · 3 · 3.',loesung:'81',
   vorname:'Johannes',alter:12});
  document.body.appendChild(window.__box);
  [...window.__box.querySelectorAll('button')][0].click();});
 await pg.waitForFunction(()=>typeof gespraechLaeuft==='function'&&gespraechLaeuft(),{timeout:15000}).catch(()=>{});
 await pg.waitForTimeout(2500);

 const z=await pg.evaluate(()=>({
  laeuft:gespraechLaeuft(),
  text:window.__box.textContent,
  knopf:[...window.__box.querySelectorAll('button')][0].textContent.trim()}));
 pruef('Der Vermittler wird nach dem richtigen Agenten gefragt',
  gesehen.agentAngefragt===bs.agent,String(gesehen.agentAngefragt));
 pruef('Die App schickt die Eröffnung mit den Angaben zur Aufgabe',
  !!(gesehen.init&&gesehen.init.type==='conversation_initiation_client_data'),
  gesehen.init&&gesehen.init.type);
 const dv=(gesehen.init&&gesehen.init.dynamic_variables)||{};
 pruef('Der Vorname geht mit',dv.vorname==='Johannes',dv.vorname);
 pruef('Fach, Thema und Aufgabe gehen mit',
  dv.fach==='Mathematik'&&dv.thema==='Potenzen'&&/4\. Potenz von 3/.test(dv.aufgabe||''),JSON.stringify([dv.fach,dv.thema]));
 pruef('Die Lösung geht mit, damit der Agent führen kann',dv.loesung==='81',dv.loesung);
 pruef('Die Schritte gehen mit',/3 · 3/.test(dv.schritte||''),dv.schritte);
 pruef('Das Mikrofon läuft: Tonstücke gehen hinaus',gesehen.tonStuecke>0,gesehen.tonStuecke);
 pruef('Auf das Ping folgt ein Pong mit derselben Nummer',gesehen.pong===77,gesehen.pong);
 pruef('Das Gespräch läuft',z.laeuft===true);
 pruef('Der Knopf heisst jetzt Beenden',/Beenden|Stop|Terminer/.test(z.knopf),z.knopf);
 pruef('Die Antwort des Agenten steht da',/Hoi Johannes/.test(z.text),z.text.slice(0,80));
 pruef('Das Gesagte des Kindes steht da',/weiss nicht weiter/.test(z.text),z.text.slice(0,120));

 /* ---------- Beenden ---------- */
 await pg.evaluate(()=>{[...window.__box.querySelectorAll('button')][0].click();});
 await pg.waitForTimeout(400);
 const e=await pg.evaluate(()=>({laeuft:gespraechLaeuft(),
  knopf:[...window.__box.querySelectorAll('button')][0].textContent.trim()}));
 pruef('Beenden schliesst das Gespräch',e.laeuft===false);
 pruef('Der Knopf heisst wieder Fragen',/Fragen|Ask|Demander/.test(e.knopf),e.knopf);

 /* ---------- Ohne Vermittler kein Gespräch ---------- */
 const ohne=await pg.evaluate(async()=>{
  window.vermittler=window.__echterVermittler;
  await IDB.set('kv','proxyUrl','aus');
  const box=fragestelleBox({aufgabe:'2 + 2 = ?',loesung:'4'});
  document.body.appendChild(box);
  [...box.querySelectorAll('button')][0].click();
  await new Promise(r=>setTimeout(r,500));
  return {text:box.textContent,laeuft:gespraechLaeuft()};});
 pruef('Ohne Vermittler startet kein Gespräch',ohne.laeuft===false);
 pruef('Und es wird gesagt, woran es liegt',/Vermittler|gateway|relais/i.test(ohne.text),ohne.text.slice(0,90));

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();wss.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();wss.close();process.exit(1);});
