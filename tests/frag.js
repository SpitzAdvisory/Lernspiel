/* Frag-Knopf: Aufnahme -> /stt -> /frage -> /tts, und was dabei nicht
   hinausgehen darf. Mikrofon und Netz sind nachgebildet. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8821);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1100,height:1200},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8821/');
 await pg.waitForFunction(()=>typeof fragBox==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const warte=(ms)=>new Promise(r=>setTimeout(r,ms||0));
  const warteAuf=async(f,ms)=>{const bis=Date.now()+(ms||2500);
   while(Date.now()<bis){if(f())return true;await warte(25);}return false;};

  /* ---------- 1. Aufgabentext: was die Begleitung erfaehrt ---------- */
  const itV={type:'input',prompt:'Übersetze: la cloche',answer:'die Glocke',
   accept:['Glocke'],fr:'la cloche'};
  const sV=aufgabeText({},{},itV);
  pruef('Aufgabe nennt das franzoesische Wort',sV.indexOf('la cloche')>=0,sV);
  pruef('Aufgabe nennt die Loesung nicht',sV.indexOf('die Glocke')<0&&sV.indexOf('Glocke')<0,sV);

  const itA={type:'single',prompt:'Welches Wort passt?'};
  const QA={opts:[{text:'rouge',ok:true},{text:'vert',ok:false},{text:'bleu',ok:false}]};
  const sA=aufgabeText({},QA,itA);
  pruef('Auswahl geht mit',sA.indexOf('rouge / vert / bleu')>=0,sA);
  pruef('Kein Hinweis auf die richtige Wahl',!/true|ok|richtig|correct/i.test(sA),sA);

  const tp=mtopic('m3-stellen');
  const itR=genItem(tp,2,{});
  const sR=aufgabeText({},{},itR);
  pruef('Schriftliche Rechnung geht als Zahlenpaar mit',
   sR.indexOf('Rechnung: '+itR.gitter.a)>=0,sR);
  pruef('Das Ergebnis steht nicht im Text',sR.indexOf(String(itR.gitter.res))<0,sR);
  pruef('Aufgabentext bleibt unter 600 Zeichen',
   aufgabeText({},{},{prompt:'x'.repeat(2000)}).length<=600);

  /* ---------- 2. Ohne Vermittler kein Knopf ----------
     Die App bringt eine Adresse mit; «aus» schaltet sie ab. */
  await IDB.set('kv','proxyUrl','aus');
  const b0=fragBox({},{},{type:'input',prompt:'p'},()=>false);
  document.body.append(b0);
  await warte(120);
  pruef('Ohne Vermittler bleibt der Knopf verborgen',b0.style.display==='none',b0.style.display);
  b0.remove();

  /* ---------- 3. Mit Adresse: der ganze Weg ---------- */
  await IDB.set('kv','proxyUrl','https://vermittler.example/');
  const echtesFetch=window.fetch, echtesHoer=window.hoerFrei, echtesSag=window.sag;
  let rufe=[], gesagt=[], ttsAntwort=()=>({ok:true,status:200,blob:async()=>new Blob(['x'],{type:'audio/mpeg'})});
  let frageAntwort=()=>({ok:true,status:200,json:async()=>({text:'Schau zuerst auf die Einer.'})});
  window.fetch=async(u,o)=>{
   const url=String(u);
   if(/vermittler\.example\/frage$/.test(url)){
    rufe.push({weg:'frage',inhalt:JSON.parse(o.body)});return frageAntwort();}
   if(/vermittler\.example\/tts$/.test(url)){
    rufe.push({weg:'tts',inhalt:JSON.parse(o.body)});return ttsAntwort();}
   return echtesFetch(u,o);};
  window.sag=(txt,spr)=>{gesagt.push({txt,spr});};

  let gehoert='Ich weiss nicht, wie ich anfangen soll';
  let hoerFehler=null, stopGesehen=false;
  window.hoerFrei=async(o,code)=>{
   rufe.push({weg:'stt',code:code,halten:!!(o&&o.halten),lang:o&&o.lang});
   if(o&&o.aufAktiv)o.aufAktiv(()=>{stopGesehen=true;});
   await warte(10);
   if(hoerFehler)throw new Error(hoerFehler);
   return gehoert;};

  S.lang='de';
  const box=fragBox({},{},{type:'input',prompt:'Rechne aus.'},()=>false);
  document.body.append(box);
  pruef('Knopf erscheint mit Vermittler',await warteAuf(()=>box.style.display===''),box.style.display);
  const knopf=box.querySelector('button');
  pruef('Knopf heisst nach der Stimme',/Emilia/.test(knopf.textContent),knopf.textContent.trim());

  knopf.click();
  pruef('Aufnahme laeuft an',await warteAuf(()=>rufe.some(x=>x.weg==='stt')));
  const stt=rufe.find(x=>x.weg==='stt');
  pruef('Deutscher Erkennungscode',stt&&stt.code==='deu',stt&&stt.code);
  pruef('Aufnahme haelt bis zum zweiten Druck',stt&&stt.halten===true);
  pruef('Frage geht an den Vermittler',await warteAuf(()=>rufe.some(x=>x.weg==='frage')));
  const fr=rufe.find(x=>x.weg==='frage');
  pruef('Gehoerte Frage geht mit',fr&&fr.inhalt.frage===gehoert,fr&&fr.inhalt.frage);
  pruef('Sprache geht mit',fr&&fr.inhalt.spr==='de');
  pruef('Aufgabe geht mit',fr&&fr.inhalt.aufgabe.indexOf('Rechne aus.')>=0,fr&&fr.inhalt.aufgabe);
  pruef('Keine Loesung im Rumpf',fr&&Object.keys(fr.inhalt).join(',')==='frage,aufgabe,spr',
   fr&&Object.keys(fr.inhalt).join(','));
  pruef('Antwort steht auf dem Schirm',
   await warteAuf(()=>box.textContent.indexOf('Schau zuerst auf die Einer.')>=0),box.textContent);
  pruef('Gehoertes wird gezeigt',box.textContent.indexOf('anfangen soll')>=0);
  pruef('Antwort wird gesprochen',await warteAuf(()=>rufe.some(x=>x.weg==='tts')));
  const tts=rufe.find(x=>x.weg==='tts');
  pruef('Stimme nach Sprache',tts&&tts.inhalt.spr==='de',tts&&tts.inhalt.spr);
  pruef('Gesprochen wird die Antwort',tts&&tts.inhalt.text==='Schau zuerst auf die Einer.');

  /* ---------- 4. Zweiter Druck beendet die Aufnahme ---------- */
  rufe=[];stopGesehen=false;
  knopf.click();
  await warteAuf(()=>rufe.some(x=>x.weg==='stt'));
  knopf.click();
  pruef('Zweiter Druck gibt das Mikrofon frei',await warteAuf(()=>stopGesehen));
  await warteAuf(()=>rufe.some(x=>x.weg==='frage'));

  /* ---------- 5. Nichts gehoert ---------- */
  rufe=[];gehoert='';
  knopf.click();
  pruef('Nichts gehoert wird gemeldet',
   await warteAuf(()=>/Nichts gehört/.test(box.textContent)),box.textContent.slice(0,120));
  pruef('Ohne Frage wird nicht gefragt',!rufe.some(x=>x.weg==='frage'));

  /* ---------- 6. Begleitung fehlgeschlagen ---------- */
  gehoert='Hilfe';frageAntwort=()=>({ok:false,status:502,json:async()=>({error:'kaputt'})});
  knopf.click();
  pruef('Fehler der Begleitung wird gemeldet',
   await warteAuf(()=>/nicht geklappt/.test(box.textContent)),box.textContent.slice(0,160));
  frageAntwort=()=>({ok:true,status:200,json:async()=>({text:'Zähle die Zehner.'})});

  /* ---------- 7. Stimme fehlgeschlagen: Systemstimme ---------- */
  gesagt=[];ttsAntwort=()=>({ok:false,status:502,blob:async()=>new Blob([])});
  knopf.click();
  pruef('Ohne Stimme vom Vermittler spricht das Geraet',
   await warteAuf(()=>gesagt.some(g=>g.txt==='Zähle die Zehner.'&&g.spr==='de')),JSON.stringify(gesagt));
  ttsAntwort=()=>({ok:true,status:200,blob:async()=>new Blob(['x'],{type:'audio/mpeg'})});

  /* ---------- 8. Andere Sprachen ---------- */
  box.remove();
  for(const [sp,name,code] of [['en','Kate','eng'],['fr','Emilie','fra']]){
   S.lang=sp;rufe=[];
   const bx=fragBox({},{},{type:'input',prompt:'p'},()=>false);
   document.body.append(bx);
   await warteAuf(()=>bx.style.display==='');
   const kn=bx.querySelector('button');
   pruef(sp+': Knopf nennt '+name,new RegExp(name).test(kn.textContent),kn.textContent.trim());
   kn.click();
   await warteAuf(()=>rufe.some(x=>x.weg==='frage'));
   const s2=rufe.find(x=>x.weg==='stt'), f2=rufe.find(x=>x.weg==='frage');
   pruef(sp+': Erkennungscode '+code,s2&&s2.code===code,s2&&s2.code);
   pruef(sp+': Sprache geht mit',f2&&f2.inhalt.spr===sp,f2&&f2.inhalt.spr);
   bx.remove();
  }
  S.lang='de';

  /* ---------- 9. Gesperrte Frage ---------- */
  rufe=[];
  const bz=fragBox({},{},{type:'input',prompt:'p'},()=>true);
  document.body.append(bz);
  await warteAuf(()=>bz.style.display==='');
  bz.querySelector('button').click();
  await warte(200);
  pruef('Nach dem Ende der Runde nimmt der Knopf nichts auf',!rufe.length,JSON.stringify(rufe));
  bz.remove();

  /* ---------- 10. Im Fragenschirm ---------- */
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const itQ=genItem(tp,2,{});const QQ=prepare(itQ,'medium');QQ.t0=performance.now();
  R.cur=QQ;renderQuestion(R,QQ);
  const dran=await warteAuf(()=>[...document.querySelectorAll('.page button')]
   .some(x=>/Emilia/.test(x.textContent)));
  pruef('Der Knopf steht im Fragenschirm',dran);

  renderQuestion(R,prepare({type:'speak',prompt:'Sprich nach',answer:'la cloche',
   id:'x',difficulty:1,rounds:1},'medium'));
  await warte(200);
  pruef('Bei Sprechaufgaben kein zweites Mikrofon',
   ![...document.querySelectorAll('.page button')].some(x=>/Emilia|Ask Kate/.test(x.textContent)));

  window.fetch=echtesFetch;window.hoerFrei=echtesHoer;window.sag=echtesSag;
  await IDB.set('kv','proxyUrl','aus');
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
