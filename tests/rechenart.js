/* Rechenart: im Kopf, mit Notizen, schriftlich.
   Urs am 18.11.2026: «Es gibt grundsätzlich Kopfrechnen, Rechnen mit
   Notizen, Schriftliches Rechnen.» Schriftlich soll immer waehlbar sein
   statt vom Zufall abzuhaengen, und beim Kopfrechnen geht es um Tempo -
   darum fuenf Rechnungen in einer Frage. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8896);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const SPIELER={id:'raA',name:'Valentin',avatar:'🦊',geb:'2016-09-28'};
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:1000,height:1200},
  screen:{width:1000,height:1200}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8896/');
 await pg.waitForFunction(()=>typeof RECHENARTEN!=='undefined');

 /* ---------- Die Begriffe ---------- */
 const bg=await pg.evaluate(()=>({
  arten:RECHENARTEN,
  mathIst:rechenSpiel(MATH_GAME),
  sprachIst:rechenSpiel(FRV_GAME),
  vorgabe:rechenArt({}),
  unbekannt:rechenArt({rechenart:'quatsch'})}));
 pruef('Es gibt genau drei Rechenarten',bg.arten.join(',')==='kopf,notiz,schriftlich',bg.arten.join(','));
 pruef('Rechnen ist ein Rechenspiel',bg.mathIst===true);
 pruef('Französisch ist keines',bg.sprachIst===false);
 pruef('Ohne Angabe gilt «mit Notizen»',bg.vorgabe==='notiz',bg.vorgabe);
 pruef('Unbekanntes fällt auf «mit Notizen» zurück',bg.unbekannt==='notiz',bg.unbekannt);

 /* ---------- Der Vorrat ---------- */
 const vr=await pg.evaluate(()=>{
  const voll=genTopics(MATH_GAME).map(x=>({id:x.id,topic:x.id}));
  const sch=rechenVorrat(voll,'schriftlich',MATH_GAME).map(x=>x.id);
  const kop=rechenVorrat(voll,'kopf',MATH_GAME).map(x=>x.id);
  const not=rechenVorrat(voll,'notiz',MATH_GAME).map(x=>x.id);
  const fremd=rechenVorrat(voll,'schriftlich',FRV_GAME).map(x=>x.id);
  return {n:voll.length,sch,kopfHatGitter:kop.filter(id=>STIFTTHEMEN.indexOf(id)>=0),
   kopfN:kop.length,notN:not.length,fremdN:fremd.length,gitter:STIFTTHEMEN};});
 pruef('Schriftlich lässt nur die Gitterthemen übrig',
  vr.sch.length===vr.gitter.length&&vr.sch.every(id=>vr.gitter.indexOf(id)>=0),vr.sch.join(','));
 pruef('Kopfrechnen lässt die Gitterthemen weg',vr.kopfHatGitter.length===0,vr.kopfHatGitter.join(','));
 pruef('Kopfrechnen behält den Rest',vr.kopfN===vr.n-vr.gitter.length,vr.kopfN+' von '+vr.n);
 pruef('Mit Notizen bleibt alles',vr.notN===vr.n,vr.notN);
 pruef('Bei einem Sprachspiel greift die Rechenart nicht',vr.fremdN===vr.n,vr.fremdN);

 /* ---------- Die Zeile in der Tabelle ---------- */
 const tab=async(spiel)=>pg.evaluate(async(spiel)=>{
  S.profiles=S.profiles.filter(x=>x.id!=='raA')
   .concat([{id:'raA',name:'Valentin',avatar:'🦊',geb:'2016-09-28'}]);
  const p=S.profiles.find(x=>x.id==='raA');
  viewRunSetup(p,spiel==='math'?MATH_GAME:FRV_GAME,null);
  await new Promise(r=>setTimeout(r,160));
  const zeilen=[...document.querySelectorAll('.wahltabelle .wl')].map(x=>x.textContent);
  const zellen=[...document.querySelectorAll('.wahltabelle .wahlzelle')].map(x=>x.textContent);
  return {zeilen,zellen};},spiel);
 const tm=await tab('math');
 const hatArt=tm.zellen.some(x=>/Kopfrechnen|In your head|De tête/.test(x));
 pruef('Kopfrechnen steht zur Wahl',hatArt,tm.zellen.join(' | ').slice(0,90));
 pruef('Alle drei stehen zur Wahl',
  ['Kopfrechnen','Mit Notizen','Schriftlich'].every(x=>tm.zellen.indexOf(x)>=0)
  ||['In your head','With notes','In columns'].every(x=>tm.zellen.indexOf(x)>=0),
  tm.zellen.join(' | ').slice(0,120));
 const tf=await tab('fr');
 pruef('Beim Französisch steht sie nicht',
  !tf.zellen.some(x=>/Kopfrechnen|In your head|De tête/.test(x)),tf.zellen.join(' | ').slice(0,80));

 /* ---------- Der Block ---------- */
 const lauf=async(art)=>pg.evaluate(async(art)=>{
  const p=S.profiles.find(x=>x.id==='raA');
  await startRun({players:[p],game:MATH_GAME,mode:'classic',diff:'medium',
   adaptive:false,minis:false,rechenart:art,sel:{},topics:null});
  const R=S.run;
  await new Promise(r=>setTimeout(r,500));
  const it=R.cur&&R.cur.item;
  return {art:R.rechenart,ziel:R.target,typ:it&&it.type,
   teile:(it&&it.teile)?it.teile.length:0,
   stichwort:it&&it.teile?it.teile.map(x=>x.prompt).slice(0,2):null,
   antworten:it&&it.teile?it.teile.map(x=>x.antwort):null,
   blatt:!!document.querySelector('.padbox'),
   felder:document.querySelectorAll('.kopffeld').length,
   hinweis:(document.querySelector('.hint')||{}).textContent||''};},art);

 const k=await lauf('kopf');
 pruef('Die Rechenart steht im Durchgang',k.art==='kopf',k.art);
 pruef('Der Durchgang ist kürzer',k.ziel===10,k.ziel);
 pruef('Die Frage ist ein Block',k.typ==='kopf',k.typ);
 pruef('Der Block trägt fünf Rechnungen',k.teile===5,k.teile);
 pruef('Jede Rechnung hat eine ganze Zahl als Antwort',
  !!k.antworten&&k.antworten.every(a=>/^-?\d+$/.test(a)),(k.antworten||[]).join(' / '));
 pruef('Es stehen fünf Felder da',k.felder===5,k.felder);
 pruef('Kein Notizblatt beim Kopfrechnen',k.blatt===false);
 pruef('Der Hinweis gehört zum Block',/fünf|five|cinq/i.test(k.hinweis),k.hinweis);

 const n=await lauf('notiz');
 pruef('Mit Notizen bleibt es eine Aufgabe',n.typ!=='kopf',n.typ);
 pruef('Mit Notizen liegt das Blatt bereit',n.blatt===true);
 pruef('Mit Notizen bleibt der Durchgang lang',n.ziel===25,n.ziel);

 const sc=await pg.evaluate(async()=>{
  const p=S.profiles.find(x=>x.id==='raA');
  await startRun({players:[p],game:MATH_GAME,mode:'classic',diff:'medium',
   adaptive:false,minis:false,rechenart:'schriftlich',sel:{},topics:null});
  const R=S.run;await new Promise(r=>setTimeout(r,500));
  const arten=new Set();
  for(const sl of R.pool){const tp=mtopic(sl.topic);if(tp)arten.add(tp.id);}
  return {typ:R.cur&&R.cur.item&&R.cur.item.type,themen:[...arten]};});
 pruef('Schriftlich zieht nur aus den Gitterthemen',
  sc.themen.every(id=>vr.gitter.indexOf(id)>=0),sc.themen.join(','));
 pruef('Die erste Frage ist ein Gitter',sc.typ==='stellen',sc.typ);

 /* ---------- Rechnen im Block ---------- */
 const rechne=async(wie)=>pg.evaluate(async(wie)=>{
  const p=S.profiles.find(x=>x.id==='raA');
  await startRun({players:[p],game:MATH_GAME,mode:'classic',diff:'medium',
   adaptive:false,minis:false,rechenart:'kopf',sel:{},topics:null});
  const R=S.run;await new Promise(r=>setTimeout(r,500));
  const it=R.cur&&R.cur.item;
  if(!it||it.type!=='kopf')return {fehler:'kein Block'};
  const felder=[...document.querySelectorAll('.kopffeld')];
  felder.forEach((f,i)=>{
   if(wie==='leer')return;
   let v=it.teile[i].antwort;
   if(wie==='einsFalsch'&&i===2)v=String(+v+1);
   f.value=v;});
  const knopf=[...document.querySelectorAll('.page button')]
   .find(x=>x.textContent===t('check'));
  knopf.click();
  /* Sofort messen: nach dem Pruefen zeichnet die App die Karte neu,
     und die Faerbung der Felder ist dann nicht mehr da. */
  const gut=document.querySelectorAll('.kopffeld.ok').length;
  const schlecht=document.querySelectorAll('.kopffeld.bad').length;
  const status=(document.querySelector('.page p.small')||{}).textContent||'';
  await new Promise(r=>setTimeout(r,350));
  const a=R.answers[R.answers.length-1]||null;
  return {geantwortet:!!a,richtig:a&&a.correct===true,
   gegeben:a&&a.given,status,gut,schlecht};},wie);

 const alle=await rechne('alle');
 pruef('Alle fünf richtig zählt als richtig',alle.richtig===true,JSON.stringify(alle));
 pruef('Alle fünf werden grün',alle.gut===5,alle.gut);
 const eins=await rechne('einsFalsch');
 pruef('Eine falsche macht den Block falsch',eins.richtig===false,JSON.stringify(eins));
 pruef('Nur die falsche wird rot',eins.schlecht===1&&eins.gut===4,eins.gut+' gut, '+eins.schlecht+' schlecht');
 pruef('Der Stand wird genannt',/4/.test(eins.status),eins.status);
 const leer=await rechne('leer');
 pruef('Leer wird nicht abgerechnet',leer.geantwortet===false,JSON.stringify(leer));
 pruef('Leer wird gemeldet',/5/.test(leer.status),leer.status);

 /* ---------- Was überdauert ---------- */
 const quelle=fs.readFileSync(path.join(D,'app.html'),'utf-8');
 pruef('Die Rechenart steht im Protokoll',/rechenart:R\.rechenart,aborted/.test(quelle));
 pruef('Die Vorwahl liest sie zurück',/RECHENARTEN\.indexOf\(l\.rechenart\)>=0/.test(quelle));
 pruef('«Nochmals» nimmt sie mit',/rechenart:R\.rechenart,sel:R\.sel/.test(quelle));

 /* ---------- Die Texte ---------- */
 const txt=await pg.evaluate(()=>{
  const keys=['rechenart','r_kopf','r_notiz','r_schriftlich','rd_kopf','rd_notiz',
   'rd_schriftlich','rd_schriftlichOhne','hint_kopf','t_kopf','kopfOffen','kopfTeil'];
  const fehlt=[];
  for(const key of keys)for(const l of ['de','en','fr'])
   if(!T[l]||!T[l][key]||!String(T[l][key]).trim())fehlt.push(l+'.'+key);
  const scharf=keys.filter(key=>/ß/.test(String((T.de&&T.de[key])||'')));
  return {fehlt,scharf};});
 pruef('Alle Texte stehen in allen drei Sprachen',txt.fehlt.length===0,txt.fehlt.join(', '));
 pruef('Kein scharfes s im Deutschen',txt.scharf.length===0,txt.scharf.join(', '));

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n2,x] of aus)console.log(s+' '+n2+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
