/* Die Vorwahl des Startschirms.
   Urs wollte am 15.11.2026, dass jeder Spieler seine letzte Einstellung
   vorfindet und mit einem Tipp losspielen kann. Gelesen wird dafuer das
   Lauf-Protokoll, nicht ein zweiter Speicher. Dieser Test haelt fest,
   was uebernommen wird und was still verfaellt. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8874);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:1100}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 const egal=/workers\.dev|Access to fetch|Failed to fetch|CORS|Failed to load resource/i;
 pg.on('console',m=>{if(m.type()==='error'&&!egal.test(m.text()))perr.push('console: '+m.text());});
 await pg.goto('http://127.0.0.1:8874/');
 await pg.waitForFunction(()=>typeof viewRunSetup==='function'&&typeof vorwahlAusLauf==='function');

 await pg.evaluate(()=>{
  window.__A={id:'vA',name:'Anna',avatar:'🦊'};
  window.__B={id:'vB',name:'Bruno',avatar:'🐼'};
  S.profiles=S.profiles.filter(x=>x.id!=='vA'&&x.id!=='vB').concat([window.__A,window.__B]);
  window.saveProfiles=async()=>{};
  /* Ein Protokolleintrag, wie ihn ein beendeter Lauf schreibt. Die
     Genauigkeit bleibt tief, damit nichts nebenbei freigeschaltet wird. */
  window.__log=(o)=>({id:'L'+Math.random(),version:3,device:'web',
   game:{id:o.game,title:o.game},mode:o.mode,difficulty:o.diff,
   adaptive:o.adaptive,aborted:false,topics:o.topics||null,topicNames:[],
   years:o.years||[],target:25,hintsUsed:0,durationSec:60,
   started:o.started,ended:o.started,
   players:(o.players||['vA']).map(id=>({id,name:id,score:1,answered:10,
    correct:1,accuracy:10,bestStreak:1})),
   answers:[]});
  window.__setzeLogs=(liste)=>{S.logMap={};liste.forEach((l,i)=>{S.logMap['t'+i+'.json']=l;});computeState();};
  window.__stand=()=>{const o={};
   for(const wl of document.querySelectorAll('main .wahltabelle .wl')){
    const zeile=wl.nextElementSibling;
    const an=[...zeile.querySelectorAll('button')].find(x=>x.getAttribute('aria-pressed')==='true');
    o[wl.textContent]=an?an.textContent.trim():null;}
   return o;};
  window.__zeilen=()=>[...document.querySelectorAll('main .wahltabelle .wl')].map(x=>x.textContent);
  /* Was wirklich in den Lauf geht - der Knopf «Los» wird abgefangen. */
  window.__los=async()=>{let ue=null;const echt=window.startRun;
   window.startRun=o=>{ue=o;};
   [...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t('start')).click();
   await new Promise(r=>setTimeout(r,60));window.startRun=echt;return ue;};});

 const spiel=await pg.evaluate(()=>MATH_GAME.id);

 /* ---------- Ohne Protokoll gilt die Vorgabe ---------- */
 const leer=await pg.evaluate(()=>{window.__setzeLogs([]);
  viewRunSetup(window.__A,MATH_GAME);
  return {stand:window.__stand(),zeilen:window.__zeilen(),
   woerter:{mode:t('mode'),rechenart:t('rechenart'),diff:t('difficulty'),adjust:t('adjust'),minis:t('minis'),
    klassisch:t('m_classic'),leicht:t('d_easy'),adaptiv:t('adaptive'),an:t('minisOn')}};});
 /* Seit dem 18.11.2026 steht beim Rechnen die Rechenart dazwischen -
    im Kopf, mit Notizen, schriftlich. */
 pruef('Fuenf Zeilen ohne Duell',
  JSON.stringify(leer.zeilen)===JSON.stringify([leer.woerter.mode,leer.woerter.rechenart,
   leer.woerter.diff,leer.woerter.adjust,leer.woerter.minis]),leer.zeilen.join(' / '));
 pruef('Ohne Protokoll steht die Vorgabe',
  leer.stand[leer.woerter.mode]===leer.woerter.klassisch
  &&leer.stand[leer.woerter.diff]===leer.woerter.leicht
  &&leer.stand[leer.woerter.adjust]===leer.woerter.adaptiv
  &&leer.stand[leer.woerter.minis]===leer.woerter.an,JSON.stringify(leer.stand));

 /* ---------- Der letzte Lauf wird uebernommen ---------- */
 const W=leer.woerter;
 const zurueck=await pg.evaluate(s=>{
  window.__setzeLogs([window.__log({game:s,mode:'survival',diff:'easy',
   adaptive:false,started:'2026-11-14T10:00:00.000Z'})]);
  viewRunSetup(window.__A,MATH_GAME);
  return {stand:window.__stand(),ueberleben:t('m_survival'),fest:t('fixed')};},spiel);
 pruef('Spielart kommt aus dem letzten Lauf',
  zurueck.stand[W.mode]===zurueck.ueberleben,zurueck.stand[W.mode]);
 pruef('Anpassung kommt aus dem letzten Lauf',
  zurueck.stand[W.adjust]===zurueck.fest,zurueck.stand[W.adjust]);

 /* ---------- Der neuere Lauf schlaegt den aelteren ---------- */
 const neuer=await pg.evaluate(s=>{
  window.__setzeLogs([
   window.__log({game:s,mode:'survival',diff:'easy',adaptive:false,started:'2026-11-10T10:00:00.000Z'}),
   window.__log({game:s,mode:'timed',diff:'easy',adaptive:true,started:'2026-11-14T10:00:00.000Z'})]);
  viewRunSetup(window.__A,MATH_GAME);
  return {stand:window.__stand(),rennen:t('m_timed')};},spiel);
 pruef('Der neuere Lauf gilt',neuer.stand[W.mode]===neuer.rennen,neuer.stand[W.mode]);

 /* ---------- Fremdes Spiel und fremder Spieler faerben nicht ab ---------- */
 const fremd=await pg.evaluate(s=>{
  window.__setzeLogs([
   window.__log({game:'anderes-spiel',mode:'survival',diff:'easy',adaptive:false,started:'2026-11-14T10:00:00.000Z'}),
   window.__log({game:s,mode:'timed',diff:'easy',adaptive:false,started:'2026-11-14T11:00:00.000Z',players:['vB']})]);
  viewRunSetup(window.__A,MATH_GAME);
  return window.__stand();},spiel);
 pruef('Ein anderes Spiel faerbt nicht ab',fremd[W.mode]===W.klassisch,fremd[W.mode]);
 pruef('Ein anderer Spieler faerbt nicht ab',fremd[W.adjust]===W.adaptiv,fremd[W.adjust]);

 /* ---------- Gesperrte Stufe faellt zurueck ---------- */
 const gesperrt=await pg.evaluate(s=>{
  window.__setzeLogs([window.__log({game:s,mode:'classic',diff:'hard',
   adaptive:true,started:'2026-11-14T10:00:00.000Z'})]);
  viewRunSetup(window.__A,MATH_GAME);
  return {stand:window.__stand(),offen:isUnlocked(window.__A,MATH_GAME,'hard')};},spiel);
 pruef('Schwer ist für dieses Profil gesperrt',gesperrt.offen===false,gesperrt.offen);
 pruef('Eine gesperrte Stufe fällt auf Leicht zurück',
  gesperrt.stand[W.diff]===W.leicht,gesperrt.stand[W.diff]);

 /* ---------- Duell: Gegner da, Gegner weg ---------- */
 const duellDa=await pg.evaluate(s=>{
  window.__setzeLogs([window.__log({game:s,mode:'duel',diff:'easy',adaptive:true,
   started:'2026-11-14T10:00:00.000Z',players:['vA','vB']})]);
  viewRunSetup(window.__A,MATH_GAME);
  return {stand:window.__stand(),zeilen:window.__zeilen(),
   duell:t('m_duel'),gegner:t('opponent')};},spiel);
 pruef('Das Duell kommt zurück',duellDa.stand[duellDa.duell===null?'':W.mode]===duellDa.duell,
  duellDa.stand[W.mode]);
 pruef('Im Duell erscheint die Zeile «Gegner»',
  duellDa.zeilen.indexOf(duellDa.gegner)>=0,duellDa.zeilen.join(' / '));
 pruef('Der Gegner ist vorgewählt',
  String(duellDa.stand[duellDa.gegner]||'').indexOf('Bruno')>=0,duellDa.stand[duellDa.gegner]);

 const duellWeg=await pg.evaluate(s=>{
  window.__setzeLogs([window.__log({game:s,mode:'duel',diff:'easy',adaptive:true,
   started:'2026-11-14T10:00:00.000Z',players:['vA','vWeg']})]);
  viewRunSetup(window.__A,MATH_GAME);
  return {stand:window.__stand(),zeilen:window.__zeilen(),gegner:t('opponent')};},spiel);
 pruef('Ein verschwundener Gegner setzt auf Klassisch zurück',
  duellWeg.stand[W.mode]===W.klassisch,duellWeg.stand[W.mode]);
 pruef('Dann fehlt auch die Zeile «Gegner»',
  duellWeg.zeilen.indexOf(duellWeg.gegner)<0,duellWeg.zeilen.join(' / '));

 /* ---------- Themen: bekannte zurück, unbekannte still weg ---------- */
 const themen=await pg.evaluate(async s=>{
  const alle=genTopics(MATH_GAME).map(x=>x.id);
  const zwei=alle.slice(0,2);
  window.__setzeLogs([window.__log({game:s,mode:'classic',diff:'easy',adaptive:true,
   started:'2026-11-14T10:00:00.000Z',topics:zwei.concat(['gibt-es-nicht-mehr'])})]);
  viewRunSetup(window.__A,MATH_GAME);
  const ue=await window.__los();
  return {gewaehlt:ue?ue.topics:null,erwartet:zwei,alle:alle.length};},spiel);
 pruef('Die Themen des letzten Laufs kommen zurück',
  JSON.stringify((themen.gewaehlt||[]).slice().sort())===JSON.stringify(themen.erwartet.slice().sort()),
  JSON.stringify(themen.gewaehlt));
 pruef('Ein weggefallenes Thema verfällt still',
  (themen.gewaehlt||[]).indexOf('gibt-es-nicht-mehr')<0,JSON.stringify(themen.gewaehlt));

 /* ---------- Ein Tipp genügt ---------- */
 const einTipp=await pg.evaluate(async s=>{
  window.__setzeLogs([window.__log({game:s,mode:'timed',diff:'easy',adaptive:false,
   started:'2026-11-14T10:00:00.000Z'})]);
  viewRunSetup(window.__A,MATH_GAME);
  const ue=await window.__los();
  return ue?{mode:ue.mode,diff:ue.diff,adaptive:ue.adaptive}:null;},spiel);
 pruef('Ohne jede Änderung startet der letzte Lauf neu',
  einTipp&&einTipp.mode==='timed'&&einTipp.diff==='easy'&&einTipp.adaptive===false,
  JSON.stringify(einTipp));

 /* ---------- Unter der Tabelle steht die Erklärung ---------- */
 const erkl=await pg.evaluate(s=>{
  window.__setzeLogs([window.__log({game:s,mode:'survival',diff:'easy',adaptive:true,
   started:'2026-11-14T10:00:00.000Z'})]);
  viewRunSetup(window.__A,MATH_GAME);
  const tab=document.querySelector('main .wahltabelle');
  const txt=tab&&tab.nextElementSibling?tab.nextElementSibling.textContent:'';
  return {txt,satz:t('md_survival'),label:t('m_survival')};},spiel);
 pruef('Die Erklärung der gewählten Spielart steht darunter',
  erkl.txt.indexOf(erkl.satz)>=0&&erkl.txt.indexOf(erkl.label)>=0,erkl.txt.slice(0,70));

 /* ---------- Jede Zelle ist gross genug zum Tippen ---------- */
 const gross=await pg.evaluate(()=>{
  viewRunSetup(window.__A,MATH_GAME);
  const schlecht=[];
  for(const b of document.querySelectorAll('main .wahlzelle')){
   const r=b.getBoundingClientRect();
   if(r.height<36||r.width<40)schlecht.push(b.textContent.trim()+' '+Math.round(r.width)+'x'+Math.round(r.height));
   if(b.scrollWidth>b.clientWidth+2)schlecht.push('abgeschnitten: '+b.textContent.trim());}
  return schlecht;});
 pruef('Keine Zelle ist zu klein oder abgeschnitten',gross.length===0,gross.slice(0,3).join(' | '));

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
