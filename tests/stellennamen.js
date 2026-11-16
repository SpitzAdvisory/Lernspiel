/* Stellennamen und die Ausrichtung der Divisionstreppe.
   Urs hat am 16.11.2026 zwei Dinge gemeldet: die deutschen Kuerzel E, Z, H
   standen in allen drei Sprachen ueber den Spalten, und die Treppe der
   schriftlichen Division sass schief. Das Zweite lag am Minuszeichen: es
   stand mittig in seiner Spalte, und weil die Randspalte schmal, die
   Ziffernspalten aber breit sind, sass es mal dicht an der Zahl, mal eine
   ganze Spalte daneben - dort genau unter einer Kaestchenreihe. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8883);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:1000,height:1200}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8883/');
 await pg.waitForFunction(()=>typeof geteiltGitter!=='undefined');

 /* ---------- Die Kuerzel ---------- */
 const reihen=await pg.evaluate(()=>{
  const o={};
  for(const l of ['de','en','fr']){S.lang=l;o[l]=[0,1,2,3,4,5,6,7,8].map(k=>stelleName(k));}
  S.lang='de';
  return o;});
 pruef('Deutsch beginnt mit E Z H',reihen.de.slice(0,3).join(' ')==='E Z H',reihen.de.join(' '));
 pruef('Englisch beginnt mit O T H',reihen.en.slice(0,3).join(' ')==='O T H',reihen.en.join(' '));
 pruef('Französisch beginnt mit u d c',reihen.fr.slice(0,3).join(' ')==='u d c',reihen.fr.join(' '));
 pruef('Jede Sprache hat neun Stellen',
  reihen.de.length===9&&reihen.en.length===9&&reihen.fr.length===9);
 pruef('Keine Stelle bleibt leer',
  ['de','en','fr'].every(l=>reihen[l].every(x=>x&&x.length>0)));
 /* Innerhalb einer Sprache muss jedes Kuerzel eindeutig sein, sonst sagt
    die Kopfzeile nichts mehr. */
 for(const l of ['de','en','fr'])
  pruef('Die Kürzel sind eindeutig ('+l+')',new Set(reihen[l]).size===reihen[l].length,reihen[l].join(' '));
 /* Und die Sprachen muessen sich unterscheiden - das war der Fehler. */
 pruef('Englisch ist nicht die deutsche Reihe',reihen.en.join()!==reihen.de.join());
 pruef('Französisch ist nicht die deutsche Reihe',reihen.fr.join()!==reihen.de.join());

 /* ---------- Die Kopfzeile im Spiel ---------- */
 const kopf={};
 for(const l of ['de','en','fr']){
  kopf[l]=await pg.evaluate(async(l)=>{
   S.lang=l;
   const p={id:'sA',name:'V',avatar:'🦊',geb:'2016-09-28'};
   S.profiles=S.profiles.filter(x=>x.id!=='sA').concat([p]);
   const R={id:'s',players:[p],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
    started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
    level:3,up:0,down:0,q:0,masteries:{[p.id]:{}},timer:null,ended:false,target:12,
    retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
   S.run=R;R.ended=false;
   const G=geteiltGitter(7384,6);
   const Q=prepare({type:'stellen',prompt:'x',gitter:G,answer:'1230'},'medium');
   Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
   await new Promise(x=>setTimeout(x,300));
   return [...document.querySelectorAll('.zstelle')].map(e=>e.textContent).join(' ');},l);}
 pruef('Die Kopfzeile steht auf Deutsch richtig',kopf.de==='T H Z E T H Z E',kopf.de);
 pruef('Die Kopfzeile steht auf Englisch richtig',kopf.en==='Th H T O Th H T O',kopf.en);
 pruef('Die Kopfzeile steht auf Französisch richtig',kopf.fr==='um c d u um c d u',kopf.fr);

 /* ---------- Der Loesungsweg zum Stellenwert ---------- */
 const weg=await pg.evaluate(()=>{
  const tp=mtopic('m3-placevalue');
  const o={};
  for(const l of ['de','en','fr']){
   S.lang=l;const txt=[];
   /* Mehrere Zuege, weil das Thema drei Aufgabenarten wuerfelt. */
   for(let k=0;k<40;k++){const it=genItem(tp,2,{});
    (it.steps||[]).forEach(z=>txt.push(String(z)));}
   o[l]=txt.join(' | ');}
  S.lang='de';return o;});
 pruef('Der Lösungsweg trägt keine deutschen Kürzel im Englischen',
  !/\d\s(H|Z|E)\s\d\s(H|Z|E)/.test(weg.en)||/\d\sH\s\d\sT\s\d\sO/.test(weg.en),
  (weg.en.match(/\d\s\S\s\d\s\S\s\d\s\S/)||['-'])[0]);
 pruef('Der Lösungsweg trägt keine deutschen Kürzel im Französischen',
  !/\d\sZ\s/.test(weg.fr),(weg.fr.match(/\d\s\S\s\d\s\S\s\d\s\S/)||['-'])[0]);

 /* ---------- Die Treppe: Abstand des Minuszeichens ---------- */
 const faelle=[[846,3],[7384,6],[9276,12],[1000,8],[405,5]];
 const messe=async(a,bb)=>pg.evaluate(async([a,bb])=>{
  S.lang='de';
  const p={id:'sA',name:'V',avatar:'🦊',geb:'2016-09-28'};
  const R={id:'s',players:[p],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:3,up:0,down:0,q:0,masteries:{[p.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;R.ended=false;
  const G=geteiltGitter(a,bb);
  const Q=prepare({type:'stellen',prompt:'x',gitter:G,answer:String(Math.floor(a/bb))},'medium');
  Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
  await new Promise(x=>setTimeout(x,350));
  const grid=document.querySelector('.zgrid');
  const Z=el=>+getComputedStyle(el).gridRowStart;
  const abstand=[];
  for(const m of grid.querySelectorAll('.zminus')){
   const rg=document.createRange();rg.selectNodeContents(m);
   const rechts=rg.getBoundingClientRect().right;
   const boxen=[...grid.querySelectorAll('.zcell')]
    .filter(c=>Z(c)===Z(m)&&c.querySelector('canvas'))
    .map(c=>c.querySelector('canvas').getBoundingClientRect().left);
   if(boxen.length)abstand.push(Math.round(Math.min(...boxen)-rechts));}
  return abstand;},[a,bb]);

 for(const [a,bb] of faelle){
  const ab=await messe(a,bb);
  pruef('Jede Stufe hat ein Minuszeichen ('+a+':'+bb+')',ab.length>0,ab.length);
  const spanne=ab.length?Math.max(...ab)-Math.min(...ab):0;
  /* Zwei Pixel Spielraum fuer das Runden der Schriftbreite. */
  pruef('Das Minus steht überall gleich weit von der Zahl ('+a+':'+bb+')',
   spanne<=2,ab.join(', ')+' px');
  pruef('Das Minus klebt nicht an der Zahl ('+a+':'+bb+')',ab.every(x=>x>=4),ab.join(', '));
  pruef('Das Minus steht nicht eine Spalte daneben ('+a+':'+bb+')',
   ab.every(x=>x<=30),ab.join(', '));}

 /* Die Zelle des Minus muss ihre Spalte fuellen, sonst laeuft das
    Rechtsbuendige ins Leere - genau daran scheiterte der erste Versuch. */
 const streckt=await pg.evaluate(()=>{
  const m=document.querySelector('.zminus');
  return m?getComputedStyle(m).justifySelf:'';});
 pruef('Die Minuszelle füllt ihre Spalte',streckt==='stretch',streckt);

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
