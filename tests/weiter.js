/* Was nach der Antwort geschieht: von selbst weiter bei richtig, stehen
   bleiben bei falsch - und der Beispielsatz steht fuer sich. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8829);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:900,height:1000}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8829/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function'&&typeof DET!=='undefined');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const warte=ms=>new Promise(r=>setTimeout(r,ms||0));
  S.lang='de';

  const bauR=()=>{const R={id:'t',players:[TEST_PLAYER],game:DE_GAME,mode:'learn',diff:'medium',
   adaptive:false,started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],
   lives:3,level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
   S.run=R;return R;};

  /* ---- Beispielsatz ---- */
  let it=null;
  for(let k=0;k<60&&!(it&&it.satz);k++)it=genItem(mtopic('de-objekt'),1,{});
  pruef('Die Aufgabe trägt einen Beispielsatz',!!(it&&it.satz),it&&it.satz);
  let R=bauR();
  let Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
  await warte(60);
  const bs=document.querySelector('.beispiel'), pr=document.querySelector('.prompt');
  pruef('Er steht in einem eigenen Block',!!bs&&bs.textContent.trim()===it.satz.trim(),bs&&bs.textContent);
  pruef('Die Frage steht daneben, nicht darin',!!pr&&pr.textContent.indexOf(it.satz)<0,pr&&pr.textContent.trim());
  pruef('Der Block sieht anders aus als die Frage',
   !!bs&&getComputedStyle(bs).fontFamily!==getComputedStyle(pr).fontFamily,
   bs&&getComputedStyle(bs).fontFamily);

  /* ---- Nach richtiger Antwort von selbst weiter ----
     Geprueft wird am Weiterschalten selbst, nicht am Schirm: in dieser
     Pruefumgebung ist kein vollstaendiger Lauf aufgebaut. */
  const echtNext=window.nextQuestion;
  let weiter=0;
  window.nextQuestion=()=>{weiter++;};
  R=bauR();
  it=genItem(mtopic('de-begriffe'),1,{});
  Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
  await warte(60);
  let richtig=[...document.querySelectorAll('.opt')].find(b=>Q.opts.find(o=>o.text===b.textContent&&o.ok));
  pruef('Die richtige Wahl ist auffindbar',!!richtig,richtig&&richtig.textContent);
  const vorher=R.q;
  if(richtig)richtig.click();
  await warte(120);
  pruef('Die Antwort wurde gezählt',R.q===vorher+1,R.q+' statt '+(vorher+1));
  const warMarke=!!document.querySelector('.stamp.ok');
  pruef('Der Haken erscheint',warMarke);
  pruef('Sofort wird noch nicht weitergeschaltet',weiter===0,weiter);
  await warte(1800);
  pruef('Nach kurzer Pause geht es von selbst weiter',weiter===1,weiter);

  /* ---- Nach falscher Antwort bleibt der Schirm stehen ---- */
  weiter=0;
  R=bauR();
  it=genItem(mtopic('de-begriffe'),1,{});
  Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
  await warte(60);
  const falsch=[...document.querySelectorAll('.opt')].find(b=>Q.opts.find(o=>o.text===b.textContent&&!o.ok));
  pruef('Eine falsche Wahl ist auffindbar',!!falsch,falsch&&falsch.textContent);
  if(falsch)falsch.click();
  await warte(200);
  /* Bei drei Wahlmoeglichkeiten gibt es einen zweiten Versuch - dann nochmals falsch */
  const falsch2=[...document.querySelectorAll('.opt:not(.bad)')].find(b=>Q.opts.find(o=>o.text===b.textContent&&!o.ok));
  if(falsch2)falsch2.click();
  await warte(200);
  const marke=document.querySelector('.stamp');
  pruef('Der Stempel steht da',!!marke,marke&&marke.textContent);
  await warte(1800);
  pruef('Nach einem Fehler bleibt der Schirm stehen',weiter===0,weiter);
  pruef('Und der Stempel ist noch zu lesen',!!document.querySelector('.stamp'));

  /* Ein Tippen bricht das Warten ab */
  window.nextQuestion=()=>{weiter++;};
  R=bauR();weiter=0;
  it=genItem(mtopic('de-begriffe'),1,{});
  Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
  await warte(60);
  const r2=[...document.querySelectorAll('.opt')].find(b=>Q.opts.find(o=>o.text===b.textContent&&o.ok));
  if(r2)r2.click();
  await warte(120);
  document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
  await warte(1800);
  pruef('Ein Tippen hält das Weiterschalten an',weiter===0,weiter);
  window.nextQuestion=echtNext;

  /* ---- Versionsnummer ---- */
  pruef('Die Versionsnummer ist gesetzt',/^V\d+$/.test(APPVER),APPVER);
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
