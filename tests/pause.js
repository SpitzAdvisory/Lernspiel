/* Pause und Fortsetzen: ein Durchgang wird abgelegt, spaeter mit demselben
   Stand wieder aufgenommen, und verschwindet, sobald er zu Ende ist. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8865);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1000,height:1000},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8865/');
 await pg.waitForFunction(()=>typeof pauseAus==='function'&&typeof viewGames==='function');

 /* ---------- Wortlaute ---------- */
 const wort=await pg.evaluate(()=>{const f=[];
  for(const k of ['pause','pauseTitel','pauseStand','pauseStandOffen','pauseWeiter',
   'pauseVerwerfen','pauseVerwerfenFrage','pauseUnvollstaendig','pauseGesichert','pauseNurHier'])
   for(const l of ['de','en','fr'])if(!T[l]||!T[l][k])f.push(l+'.'+k);
  return f;});
 pruef('Wortlaute in allen drei Sprachen',wort.length===0,wort.join(','));

 /* ---------- Spieler anlegen und einen Durchgang bauen ---------- */
 await pg.evaluate(()=>{
  S.lang='de';
  window.__P={id:'pX',name:'Valentin',avatar:'🦊',unlockAll:true,pen:true};
  S.profiles=S.profiles.filter(x=>x.id!=='pX').concat([window.__P]);
  computeState();
  window.saveProfiles=async()=>{};
  /* Ohne Datenordner ist S.games leer; die eingebauten Spiele stehen dort
     im Betrieb immer, also werden sie hier nachgereicht. */
  if(!S.games.some(g=>g.id===MATH_GAME.id))S.games=[MATH_GAME].concat(S.games||[]);
 });

 const lauf=async(zusatz)=>pg.evaluate(async(z)=>{
  await startRun(Object.assign({players:[window.__P],game:MATH_GAME,mode:'classic',
   diff:'easy',adaptive:false,minis:false,sel:{mode:'classic',diff:'easy',adaptive:false,
   topics:new Set((MATH_GAME.gen?gameUnits(MATH_GAME):[]).slice(0,3))},
   topics:(MATH_GAME.gen?gameUnits(MATH_GAME):null),sub:null},z||{}));
  return !!S.run;},zusatz);

 pruef('Ein Durchgang startet',await lauf());

 /* ---------- Ohne Antworten gibt es nichts abzulegen ---------- */
 const leer=await pg.evaluate(()=>pauseAus(S.run));
 pruef('Ohne Antwort wird nichts abgelegt',leer===null,leer);

 /* ---------- Stand von Hand setzen und ablegen ---------- */
 const abgelegt=await pg.evaluate(async()=>{
  const R=S.run;
  for(let i=0;i<7;i++)R.answers.push({itemId:'x'+i,correct:i%2===0,points:i%2?0:10,player:window.__P.id});
  R.q=7;R.score=[40];R.streak=[2];R.best=[3];R.level=2;R.extra=1;
  R.used=new Set(['a','b','c']);R.cards=new Set(['m1']);
  await pauseSichernLokal(R);
  const d=await pauseLaden(window.__P.id);
  return {da:!!d,q:d&&d.q,antworten:d&&d.answers.length,
   used:d&&d.used.length,cards:d&&d.cards.length,
   spieler:d&&d.spieler.join(','),spiel:d&&d.spiel,
   restMs:d&&d.restMs,target:d&&d.target,
   /* nichts darf beim Ablegen verlorengehen oder haengenbleiben */
   jsonOk:(()=>{try{JSON.parse(JSON.stringify(d));return true;}catch(_){return false;}})()};});
 pruef('Der Stand liegt ab',abgelegt.da);
 pruef('Fragezahl, Antworten und Mengen sind drin',
  abgelegt.q===7&&abgelegt.antworten===7&&abgelegt.used===3&&abgelegt.cards===1,
  JSON.stringify(abgelegt));
 pruef('Spieler und Spiel sind benannt',abgelegt.spieler==='pX'&&!!abgelegt.spiel,abgelegt.spieler);
 pruef('Das Abgelegte ist reines JSON',abgelegt.jsonOk===true);

 /* ---------- Fortsetzen stellt den Stand her ---------- */
 const fort=await pg.evaluate(async()=>{
  if(S.run){S.run.ended=true;clearInterval(S.run.timer);}
  S.run=null;
  const d=await pauseLaden(window.__P.id);
  const sel=Object.assign({},d.sel||{});
  if(Array.isArray(sel.topics))sel.topics=new Set(sel.topics);
  await startRun({players:[window.__P],game:MATH_GAME,mode:d.mode,diff:d.diff,
   adaptive:d.adaptive,minis:d.spielAt!==null,sel,topics:d.topics,sub:d.sub,fort:d});
  const R=S.run;
  return {q:R.q,antworten:R.answers.length,score:R.score[0],streak:R.streak[0],
   best:R.best[0],level:R.level,extra:R.extra,
   used:R.used instanceof Set?R.used.size:-1,
   cards:R.cards instanceof Set?R.cards.size:-1,
   id:R.id,gleicheId:R.id===d.id,
   begonnen:R.started instanceof Date&&!isNaN(R.started)};});
 pruef('Fragezahl und Antworten kehren zurück',fort.q===7&&fort.antworten===7,JSON.stringify(fort));
 pruef('Punkte, Serie und Bestwert kehren zurück',
  fort.score===40&&fort.streak===2&&fort.best===3,fort.score+'/'+fort.streak+'/'+fort.best);
 pruef('Niveau und Zusatzfragen kehren zurück',fort.level===2&&fort.extra===1);
 /* Nach dem Fortsetzen zieht der Durchgang gleich die naechste Frage und
    legt sie in «used» ab - drei abgelegte plus die neue. */
 pruef('«used» und «cards» sind wieder Mengen',fort.used>=3&&fort.cards===1,
  fort.used+'/'+fort.cards);
 pruef('Der Durchgang behält seine Kennung',fort.gleicheId===true);
 pruef('Das Startdatum bleibt das alte',fort.begonnen===true);

 /* ---------- Die Karte auf der Spielerseite ---------- */
 const karte=await pg.evaluate(async()=>{
  if(S.run){S.run.ended=true;clearInterval(S.run.timer);}
  S.run=null;
  await viewGames(window.__P);
  const k=[...document.querySelectorAll('main .card')]
   .find(c=>/⏸/.test(c.textContent));
  return {da:!!k,txt:k?k.textContent.replace(/\s+/g,' ').trim():'',
   knoepfe:k?[...k.querySelectorAll('button')].map(b=>b.textContent.trim()):[]};});
 pruef('Die Karte steht auf der Spielerseite',karte.da,karte.txt.slice(0,70));
 pruef('Sie nennt den Stand mit Zahlen',/8\D+25|7\b/.test(karte.txt)&&!/\{/.test(karte.txt),
  karte.txt.slice(0,80));
 pruef('Fortsetzen und Verwerfen stehen bereit',
  karte.knoepfe.length===2&&/▶/.test(karte.knoepfe[0]),JSON.stringify(karte.knoepfe));

 /* ---------- Fortsetzen über die Karte ---------- */
 const perKarte=await pg.evaluate(async()=>{
  const k=[...document.querySelectorAll('main .card')].find(c=>/⏸/.test(c.textContent));
  k.querySelector('button').click();
  await new Promise(r=>setTimeout(r,700));
  return S.run?{q:S.run.q,antworten:S.run.answers.length}:null;});
 pruef('Der Knopf setzt den Durchgang fort',
  perKarte&&perKarte.q===7&&perKarte.antworten===7,JSON.stringify(perKarte));

 /* ---------- Abschluss räumt die Pause weg ---------- */
 const nachher=await pg.evaluate(async()=>{
  const R=S.run;if(!R)return 'kein Lauf';
  R.ended=false;
  await finishRun(R,true);
  await new Promise(r=>setTimeout(r,400));
  return await pauseLaden(window.__P.id);});
 pruef('Nach dem Abschluss ist die Pause fort',nachher===null,nachher&&nachher.q);

 /* ---------- Verwerfen ---------- */
 const verworfen=await pg.evaluate(async()=>{
  await startRun({players:[window.__P],game:MATH_GAME,mode:'classic',diff:'easy',
   adaptive:false,minis:false,sel:{topics:new Set()},topics:gameUnits(MATH_GAME),sub:null});
  S.run.answers.push({itemId:'z',correct:true,points:5,player:window.__P.id});S.run.q=1;
  await pauseSichernLokal(S.run);
  const vorher=!!(await pauseLaden(window.__P.id));
  await pauseWeg(window.__P.id);
  const danach=await pauseLaden(window.__P.id);
  return {vorher,danach};});
 pruef('Verwerfen entfernt die Pause',verworfen.vorher===true&&verworfen.danach===null,
  JSON.stringify(verworfen));

 /* ---------- Zeitrennen: die Restzeit wandert mit ---------- */
 const zeit=await pg.evaluate(async()=>{
  if(S.run){S.run.ended=true;clearInterval(S.run.timer);}
  await startRun({players:[window.__P],game:MATH_GAME,mode:'timed',diff:'medium',
   adaptive:false,minis:false,sel:{topics:new Set()},topics:gameUnits(MATH_GAME),sub:null});
  const R=S.run;
  R.answers.push({itemId:'z',correct:true,points:5,player:window.__P.id});R.q=1;
  R.deadline=Date.now()+20000;          /* zwanzig Sekunden uebrig */
  await pauseSichernLokal(R);
  const d=await pauseLaden(window.__P.id);
  R.ended=true;clearInterval(R.timer);S.run=null;
  await startRun({players:[window.__P],game:MATH_GAME,mode:'timed',diff:'medium',
   adaptive:false,minis:false,sel:{topics:new Set()},topics:gameUnits(MATH_GAME),sub:null,fort:d});
  const rest=Math.round((S.run.deadline-Date.now())/1000);
  S.run.ended=true;clearInterval(S.run.timer);
  await pauseWeg(window.__P.id);
  return {gesichert:Math.round(d.restMs/1000),rest};});
 pruef('Die Restzeit wird gesichert',zeit.gesichert>=19&&zeit.gesichert<=20,zeit.gesichert);
 pruef('Und beim Fortsetzen wieder gesetzt',zeit.rest>=18&&zeit.rest<=20,zeit.rest+' s');

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
