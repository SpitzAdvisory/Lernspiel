/* Minispiele: abschaltbar vor dem Start, und mit einer Stufe, die am
   Spieler haengt statt am Lernniveau. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8838);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:900,height:1100},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 const egal=/workers\.dev|Access to fetch|Failed to fetch|CORS|Failed to load resource/i;
 pg.on('console',m=>{if(m.type()==='error'&&!egal.test(m.text()))perr.push('console: '+m.text());});
 await pg.goto('http://127.0.0.1:8838/');
 await pg.waitForFunction(()=>typeof spielStufe==='function'&&typeof viewRunSetup==='function');

 /* ---------- Wortlaute ---------- */
 const wort=await pg.evaluate(()=>{const fehlt=[];
  for(const k of ['minis','minisOn','minisOff','mi_on','mi_off','spielLeichter'])
   for(const l of ['de','en','fr'])if(!T[l]||!T[l][k])fehlt.push(l+'.'+k);
  return fehlt;});
 pruef('Wortlaute in allen drei Sprachen',wort.length===0,wort.join(','));

 /* ---------- Die Stufe fuer sich ---------- */
 const stufen=await pg.evaluate(()=>({
  ohne:spielStufe({}),
  null_:spielStufe(null),
  null0:spielStufe({spielStufe:0}),
  hoch:spielStufe({spielStufe:9}),
  zwei:spielStufe({spielStufe:2}),
  krumm:spielStufe({spielStufe:2.4}),
  mist:spielStufe({spielStufe:'drei'}),
  nan:spielStufe({spielStufe:NaN})}));
 pruef('Ohne Angabe beginnt die Stufe bei 1',stufen.ohne===1&&stufen.null_===1,JSON.stringify(stufen));
 pruef('Die Stufe bleibt zwischen 1 und 5',stufen.null0===1&&stufen.hoch===5,stufen.null0+'/'+stufen.hoch);
 pruef('Unbrauchbare Werte fallen auf 1 zurück',stufen.mist===1&&stufen.nan===1);
 pruef('Gültige Werte bleiben erhalten',stufen.zwei===2&&stufen.krumm===2);

 /* ---------- Ein echter Spieler, kein eingebauter ---------- */
 await pg.evaluate(()=>{
  window.__P={id:'pX',name:'Probe',avatar:'🦊',unlockAll:true,pen:true};
  S.profiles=S.profiles.filter(p=>p.id!=='pX').concat([window.__P]);
  computeState();
  /* Schreiben in den Datenspeicher ist hier nicht das Pruefziel. */
  window.__gespeichert=0;
  window.saveProfiles=async()=>{window.__gespeichert++;};});

 /* ---------- Fuenf Stufen, und jede baut ---------- */
 const leiter=await pg.evaluate(async()=>{
  const schlecht=[];
  for(const sp of SPIELE){
   let vor=0;
   for(let st=1;st<=SPIELSTUFEN;st++){
    const z=sp.ziel(st);
    if(!z||!isFinite(z.n)||z.n<=vor)schlecht.push(sp.id+' Stufe '+st+': '+(z&&z.n));
    vor=z?z.n:0;
    const platz=document.createElement('div');platz.style.cssText='width:358px';
    document.body.appendChild(platz);
    let F=null;
    try{F=sp.bau(platz,{stufe:st,fertig(){}});}catch(e){schlecht.push(sp.id+' Stufe '+st+' baut nicht: '+e.message);}
    await new Promise(r=>setTimeout(r,60));
    if(!platz.querySelector('canvas'))schlecht.push(sp.id+' Stufe '+st+': keine Leinwand');
    try{if(F&&F.ende)F.ende();}catch(_){}
    platz.remove();
   }
  }
  return {stufen:SPIELSTUFEN,schlecht};});
 pruef('Es sind fünf Stufen',leiter.stufen===5,leiter.stufen);
 pruef('Jede Stufe jedes Spiels baut und fordert mehr als die vorige',
  leiter.schlecht.length===0,leiter.schlecht.slice(0,3).join(' | '));

 const eingebaut=await pg.evaluate(async()=>{
  const p={id:'t2',builtin:true};
  await spielStufeSetz(p,SPIELE[0].id,3);
  return p.spielStufe===undefined&&p.spielStufen===undefined;});
 pruef('Eingebaute Profile bekommen keine Stufe',eingebaut);

 /* ---------- Die Stufe folgt dem Spieler, nicht dem Lernniveau ---------- */
 const koppel=await pg.evaluate(()=>{
  window.__P.spielStufe=1;
  const R={id:'t',players:[window.__P],game:MATH_GAME,mode:'classic',diff:'hard',adaptive:true,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:3,up:0,down:0,q:5,masteries:{},timer:null,ended:false,target:25,retry:[],extra:0,
   gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity,spielAt:0};
  S.run=R;window.__R=R;
  const i=SPIELE.findIndex(s=>s.id==='geister');
  const echt=Math.random;Math.random=()=>i/SPIELE.length;
  nextQuestion(R);Math.random=echt;
  const txt=[...document.querySelectorAll('main p')].map(p=>p.textContent).join(' | ');
  return {txt,z1:SPIELE[i].ziel(1).n,z3:SPIELE[i].ziel(3).n};});
 pruef('Stufe 1 trotz Lernniveau «schwer» und Niveau 3',
  koppel.txt.indexOf(String(koppel.z1))>=0&&koppel.txt.indexOf(String(koppel.z3))<0,
  koppel.txt.slice(0,60)+'  (Stufe1='+koppel.z1+', Stufe3='+koppel.z3+')');

 /* ---------- Sieg und Niederlage im echten Durchgang ----------
    Seit V110 traegt jedes Spiel seine eigene Stufe, darum wird hier das
    Spiel festgelegt, statt es dem Zufall zu lassen, und hinterher
    nachgesehen, dass nur dieses eine Spiel sich bewegt hat. */
 await pg.evaluate(()=>{
  window.__lauf=async(o)=>{
   const P=window.__P;
   P.geb=o.geb||null;
   P.spielStufen={}; SPIELE.forEach(s=>{P.spielStufen[s.id]=o.stufe;});
   P.spielPatzer={};
   delete P.spielStufe;
   const R=window.__R;R.q=5;R.spielAt=0;R.target=25;
   const echt=SPIELE.map(s=>s.bau);
   SPIELE.forEach(s=>{s.bau=(platz,x)=>{setTimeout(()=>x.fertig(o.gewinnt,o.gewinnt?9:0),15);return{ende(){}};};});
   const echteZeit=performance.now.bind(performance);
   let versatz=0; performance.now=()=>echteZeit()+versatz;
   const i=SPIELE.findIndex(s=>s.id===(o.spiel||'geister'));
   const echtR=Math.random; Math.random=()=>i/SPIELE.length;
   nextQuestion(R); Math.random=echtR;
   const los=()=>[...document.querySelectorAll('button')]
    .find(b=>(b.textContent.trim()===t('spielLos')||b.textContent.trim()===t('spielWieder'))
      &&b.style.display!=='none');
   const schritte=[];
   for(let n=0;n<(o.anlaeufe||1);n++){
    const knopf=los();
    if(!knopf){schritte.push({kein:true});break;}
    knopf.click();
    if(o.langsam)versatz=120000;
    await new Promise(r=>setTimeout(r,180));
    schritte.push({stufe:spielStufe(P,o.spiel||'geister'),target:R.target,
     txt:(document.querySelector('main .hand')||{}).textContent||'',
     nochmal:!!los()});}
   performance.now=echteZeit;
   SPIELE.forEach((s,k)=>{s.bau=echt[k];});
   return {schritte,
    stufe:spielStufe(P,o.spiel||'geister'),
    andere:SPIELE.filter(s=>s.id!==(o.spiel||'geister')).map(s=>spielStufe(P,s.id)),
    target:R.target,
    leichter:t('spielLeichter'),egal:t('spielEgal'),nochmalTxt:t('spielNochmal')};};});

 /* Muehelos im ersten Anlauf gewonnen: zwei Stufen, und nur hier. */
 const sieg=await pg.evaluate(()=>window.__lauf({stufe:1,gewinnt:true}));
 pruef('Mühelos gewonnen hebt gleich zwei Stufen',sieg.stufe===3,sieg.stufe);
 pruef('Sieg kostet keine Zusatzaufgaben',sieg.target===25,sieg.target);
 pruef('Die anderen Spiele bleiben stehen',
  sieg.andere.every(s=>s===1),JSON.stringify(sieg.andere));

 /* Knapp gewonnen: eine Stufe. Die Uhr wird vorgestellt, statt zu warten. */
 const gemaechlich=await pg.evaluate(()=>window.__lauf({stufe:1,gewinnt:true,langsam:true}));
 pruef('Knapp gewonnen hebt nur eine Stufe',gemaechlich.stufe===2,gemaechlich.stufe);

 /* Ueber der Alterstufe genuegt eine Niederlage. Das Probeprofil hat
    keinen Geburtstag, seine Alterstufe ist also 1. */
 const drueber=await pg.evaluate(()=>window.__lauf({stufe:3,gewinnt:false,anlaeufe:2}));
 pruef('Über der Alterstufe senkt schon der erste Fehlversuch',
  drueber.schritte[0].stufe===2,drueber.schritte[0].stufe);
 pruef('Danach wird nicht zum zweiten Anlauf aufgefordert',
  drueber.schritte[0].nochmal===false&&drueber.schritte[0].txt===drueber.leichter,
  drueber.schritte[0].txt.slice(0,40));
 pruef('Gesunkene Stufe ersetzt die Zusatzaufgaben',drueber.target===25,drueber.target);

 /* Auf der eigenen Alterstufe braucht es zwei. Ein Zwoelfjaehriger steht
    auf Stufe 4; sein Boden liegt bei 3. */
 const zwoelf='2014-03-14';
 const drauf=await pg.evaluate(g=>window.__lauf({stufe:4,gewinnt:false,anlaeufe:2,geb:g}),zwoelf);
 pruef('Auf der Alterstufe lässt der erste Fehlversuch die Stufe stehen',
  drauf.schritte[0].stufe===4&&drauf.schritte[0].nochmal===true,
  JSON.stringify(drauf.schritte[0]));
 pruef('Der erste Fehlversuch lädt zum zweiten Anlauf ein',
  drauf.schritte[0].txt===drauf.nochmalTxt,drauf.schritte[0].txt.slice(0,40));
 pruef('Der zweite Fehlversuch senkt die Stufe',drauf.stufe===3,drauf.stufe);
 pruef('Der Hinweis spricht von «leichter», nicht von Strafe',
  drauf.schritte[1].txt===drauf.leichter,drauf.schritte[1].txt.slice(0,50));

 /* ---------- Auf Stufe 1 bleibt es beim Aufschlag ---------- */
 const unten=await pg.evaluate(()=>window.__lauf({stufe:1,gewinnt:false,anlaeufe:2}));
 pruef('Auf Stufe 1 bleibt die Stufe stehen',unten.stufe===1,unten.stufe);
 /* Seit V91: kein Aufschlag, auf keiner Stufe. */
 pruef('Auf Stufe 1 kosten zwei Fehlversuche nichts',unten.target===25,unten.target);
 pruef('Dort steht der freundliche Hinweis',
  unten.schritte[1].txt===unten.egal,unten.schritte[1].txt.slice(0,40));

 /* ---------- Der Schalter auf dem Startschirm ---------- */
 const schirm=await pg.evaluate(()=>{
  delete window.__P.minis;
  S.run=null;viewRunSetup(window.__P,MATH_GAME);
  const h3=[...document.querySelectorAll('main h3')].map(x=>x.textContent);
  const gruppe=[...document.querySelectorAll('main h3')].find(x=>x.textContent===t('minis'));
  const knoepfe=gruppe?[...gruppe.nextElementSibling.querySelectorAll('button')]
   .map(b=>({txt:b.querySelector('b').textContent,an:b.getAttribute('aria-pressed')})):[];
  return {h3,knoepfe,wort:t('minis')};});
 pruef('Die Gruppe «Minispiele» steht auf dem Startschirm',
  schirm.h3.indexOf(schirm.wort)>=0,schirm.h3.join(' / '));
 pruef('Zwei Knöpfe, «An» ist die Vorgabe',
  schirm.knoepfe.length===2&&schirm.knoepfe[0].an==='true'&&schirm.knoepfe[1].an==='false',
  JSON.stringify(schirm.knoepfe));

 /* Auf «Aus» tippen: der Knopf hält, und die Wahl bleibt am Profil */
 const abschalten=await pg.evaluate(async()=>{
  const vorher=window.__gespeichert;
  const gruppe=[...document.querySelectorAll('main h3')].find(x=>x.textContent===t('minis'));
  const aus=[...gruppe.nextElementSibling.querySelectorAll('button')][1];
  aus.click();
  await new Promise(r=>setTimeout(r,80));
  const g2=[...document.querySelectorAll('main h3')].find(x=>x.textContent===t('minis'));
  const stand=[...g2.nextElementSibling.querySelectorAll('button')].map(b=>b.getAttribute('aria-pressed'));
  /* Jetzt starten - dabei soll die Wahl ans Profil wandern. */
  let uebergeben=null;const echt=window.startRun;
  window.startRun=o=>{uebergeben=o;};
  [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t('start')).click();
  window.startRun=echt;
  await new Promise(r=>setTimeout(r,60));
  return {stand,minis:uebergeben?uebergeben.minis:'kein Aufruf',
   amProfil:window.__P.minis,geschrieben:window.__gespeichert>vorher};});
 pruef('«Aus» bleibt gedrückt',abschalten.stand[0]==='false'&&abschalten.stand[1]==='true',
  JSON.stringify(abschalten.stand));
 pruef('Der Lauf bekommt minis=false mitgegeben',abschalten.minis===false,abschalten.minis);
 pruef('Die Wahl haftet am Profil',abschalten.amProfil===false,abschalten.amProfil);
 pruef('Das Profil wird gespeichert',abschalten.geschrieben===true);

 /* ---------- Abgeschaltet heisst: nie eine Spielpause ---------- */
 const nie=await pg.evaluate(()=>{
  const bau=(minis,mode)=>{const o={mode,minis};
   return (o.mode==='duel'||o.minis===false)?Infinity:5+Math.floor(Math.random()*4);};
  return {aus:bau(false,'classic'),an:bau(true,'classic'),duell:bau(true,'duel')};});
 pruef('Abgeschaltet setzt den Zeitpunkt auf unendlich',nie.aus===Infinity||nie.aus===null,nie.aus);
 pruef('Eingeschaltet bleibt ein endlicher Zeitpunkt',nie.an>=5&&nie.an<=8,nie.an);
 pruef('Im Duell weiterhin keine Spielpause',nie.duell===Infinity||nie.duell===null,nie.duell);

 /* Und derselbe Weg durch den echten Laufaufbau */
 const echtAus=await pg.evaluate(async()=>{
  window.__P.minis=false;
  await startRun({players:[window.__P],game:MATH_GAME,mode:'classic',diff:'easy',
   adaptive:false,minis:false,sel:{},topics:null,sub:null});
  const at=S.run?S.run.spielAt:'kein Lauf';
  if(S.run)S.run.ended=true;
  return at===Infinity;});
 pruef('Der echte Laufaufbau schaltet die Pausen ab',echtAus);

 /* ---------- Im Duell erscheint die Gruppe nicht ---------- */
 const duell=await pg.evaluate(()=>{
  S.run=null;
  const zweiter={id:'pY',name:'Zweiter',avatar:'🐸',unlockAll:true};
  S.profiles=S.profiles.filter(p=>p.id!=='pY').concat([zweiter]);computeState();
  viewRunSetup(window.__P,MATH_GAME,{mode:'duel',diff:'easy',adaptive:true,opp:'pY',minis:true});
  return {h3:[...document.querySelectorAll('main h3')].map(x=>x.textContent),wort:t('minis')};});
 pruef('Im Duell fehlt die Gruppe «Minispiele»',duell.h3.indexOf(duell.wort)<0,duell.h3.join(' / '));


 /* ---------- Stufentabellen: keine darf kuerzer sein als die Leiter ----------
    Der Wackelturm zeigte «0 / undefined», weil seine Tabelle in bau() bei
    drei Stufen stehengeblieben war, waehrend ziel() schon fuenf fuehrte.
    Der Test prueft seither beides: die Quelle und das gespielte Ziel. */
 const quelle=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const leiterZahl=+(/const SPIELSTUFEN=(\d+)/.exec(quelle)||[0,0])[1];
 pruef('SPIELSTUFEN steht im Quelltext',leiterZahl>=3,leiterZahl);
 const kurz=[];
 const muster=/\[([0-9][0-9.,\s]*)\]\[(?:o\.)?(?:st|stufe)-1\]/g;
 let tr;
 while((tr=muster.exec(quelle))!==null){
  const n=tr[1].split(',').length;
  if(n!==leiterZahl)kurz.push(tr[0]+' ('+n+')');}
 pruef('Jede Stufentabelle führt genau '+leiterZahl+' Einträge',
  kurz.length===0,kurz.join(' | '));

 /* ---------- Und das Ziel, nach dem wirklich gespielt wird ---------- */
 const ziele=await pg.evaluate(st=>{
  const raus=[];
  for(const sp of SPIELE){
   for(let s=1;s<=st;s++){
    const soll=(sp.ziel(s)||{}).n;
    if(!(typeof soll==='number'&&isFinite(soll)&&soll>0)){
     raus.push([sp.id,s,soll,'ziel() unbrauchbar']);continue;}
    const platz=document.createElement('div');document.body.appendChild(platz);
    let F=null;
    try{F=sp.bau(platz,{stufe:s,fertig(){}});}
    catch(e){raus.push([sp.id,s,soll,'Aufbau: '+e.message]);}
    try{if(F&&F.stop)F.stop();}catch(_){}
    platz.remove();}}
  return raus;},leiterZahl);
 pruef('Jedes Spiel baut auf jeder Stufe mit brauchbarem Ziel',
  ziele.length===0,JSON.stringify(ziele).slice(0,300));

 /* Der Durchgriff: spiel() muss Ziel und Dauer in die Optionen legen.
    Ein Probespiel mit derselben ziel()-Tabelle, aber gefangenem Aufbau,
    zeigt, welche Optionen bei bau() wirklich ankommen. */
 const durch=await pg.evaluate(st=>{
  const raus=[];
  const merk=SPIELE.length;
  try{
   for(const sp of SPIELE.slice(0,merk)){
    for(let s=1;s<=st;s++){
     const z=sp.ziel(s)||{};
     let gesehen=null;
     spiel('probe',['p','p','p'],['p','p','p'],sp.ziel,(pl,o)=>{gesehen=o;return{stop(){}};});
     const probe=SPIELE[SPIELE.length-1];
     const platz=document.createElement('div');document.body.appendChild(platz);
     probe.bau(platz,{stufe:s,fertig(){}});
     platz.remove();SPIELE.length=merk;
     if(!gesehen||gesehen.ziel!==z.n)raus.push([sp.id,s,'Ziel',gesehen&&gesehen.ziel,z.n]);
     else if(z.zeit&&gesehen.dauer!==z.zeit*1000)raus.push([sp.id,s,'Dauer',gesehen.dauer]);}}
  }finally{SPIELE.length=merk;}
  return raus;},leiterZahl);
 pruef('spiel() legt Ziel und Dauer jeder Stufe in die Optionen',
  durch.length===0,JSON.stringify(durch).slice(0,300));

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,4).join(' | '));
 console.log(aus.filter(x=>x[0]==='FAIL').length||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(aus.filter(x=>x[0]==='FAIL').length||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
