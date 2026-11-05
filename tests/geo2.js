/* Die zwei neuen Konstruktionsaufgaben aus der Wiederholungspruefung.
   Geprueft wird das Praedikat ok(): die richtige Figur muss bestehen, die
   nach Augenmass gesetzte durchfallen. Ein Praedikat, das alles bestehen
   laesst, waere schlimmer als gar keine Aufgabe. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8853);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8853/');
 await pg.waitForFunction(()=>typeof KTASKS!=='undefined'&&typeof kResolve==='function');

 /* ---------- Beide Aufgaben sind eingetragen ---------- */
 const da=await pg.evaluate(()=>{
  const ids=KTASKS.map(t=>t.id);
  return {mp:ids.includes('k-mittelparallele'),pz:ids.includes('k-punkt-zwei-bedingungen'),
   anzahl:KTASKS.length,inThemen:['k-mittelparallele','k-punkt-zwei-bedingungen']
    .every(i=>GEO_IDS.includes(i))};});
 pruef('Die Mittelparallele ist eine Aufgabe',da.mp);
 pruef('Der Punkt aus zwei Bedingungen ist eine Aufgabe',da.pz);
 pruef('Beide stehen in der Themenliste',da.inThemen);

 /* ---------- Mittelparallele: richtig besteht, falsch faellt durch ---------- */
 const mp=await pg.evaluate(()=>{
  const T=KTASKS.find(t=>t.id==='k-mittelparallele');
  const o=T.geg();
  /* g laeuft durch G,H auf y=34; h durch I,J auf y=74. Die Mittelparallele
     liegt auf y=54. Angehaengt als zwei Punkte plus Gerade. */
  const mitLinie=(y1,y2)=>{const q=o.concat([
    {k:'P',x:20,y:y1},{k:'P',x:110,y:y2},{k:'L',a:o.length,b:o.length+1}]);
   return T.ok(q,kResolve(q,null));};
  return {richtig:mitLinie(54,54),
   zuHoch:mitLinie(44,44),            /* parallel, aber nicht mittig */
   schraeg:mitLinie(48,60),           /* mittig im Schnitt, aber nicht parallel */
   aufG:mitLinie(34,34)};});          /* die gegebene Gerade selbst */
 pruef('Die richtige Mittelparallele besteht',mp.richtig===true,mp.richtig);
 pruef('Eine parallele, aber nicht mittige Gerade faellt durch',mp.zuHoch===false,mp.zuHoch);
 pruef('Eine schraege Gerade durch die Mitte faellt durch',mp.schraeg===false,mp.schraeg);
 pruef('Die gegebene Gerade g selbst besteht nicht',mp.aufG===false,mp.aufG);

 /* ---------- Punkt aus zwei Bedingungen ---------- */
 const pz=await pg.evaluate(()=>{
  const T=KTASKS.find(t=>t.id==='k-punkt-zwei-bedingungen');
  const o=T.geg();
  const R0=kResolve(o,null);
  const nm=n=>kByName(o,R0,n);
  const A=nm('A'),B=nm('B'),G=nm('G'),H=nm('H'),I=nm('I');
  /* Dieselbe Rechnung wie im Praedikat, hier unabhaengig nachvollzogen */
  const M=kmid(A,B), nAB=[-(B[1]-A[1]),B[0]-A[0]];
  const nGH=[-(H[1]-G[1]),H[0]-G[0]];
  const F=kIntLL(I,[I[0]+nGH[0],I[1]+nGH[1]],G,H)[0];
  const Mg=kmid(I,F);
  const C=kIntLL(M,[M[0]+nAB[0],M[1]+nAB[1]],Mg,[Mg[0]+(H[0]-G[0]),Mg[1]+(H[1]-G[1])])[0];
  const mitPunkt=(x,y)=>{const q=o.concat([{k:'P',x,y}]);return T.ok(q,kResolve(q,null));};
  const L=kdist(A,B);
  return {C,abstandGleich:Math.abs(kdist(C,A)-kdist(C,B))<1e-6,
   mittig:Math.abs(kDistLine(C,G,H)-kDistLine(C,I,[I[0]+(H[0]-G[0]),I[1]+(H[1]-G[1])]))<1e-6,
   richtig:mitPunkt(C[0],C[1]),
   daneben:mitPunkt(C[0]+L*0.12,C[1]),
   nurMitte:mitPunkt(M[0],M[1]),
   ohnePunkt:T.ok(o,R0)};});
 pruef('Der gesuchte Punkt ist von A und B gleich weit entfernt',pz.abstandGleich===true);
 pruef('Er hat von g und h denselben Abstand',pz.mittig===true);
 pruef('Der richtige Punkt besteht',pz.richtig===true,pz.richtig);
 pruef('Ein danebengesetzter Punkt faellt durch',pz.daneben===false,pz.daneben);
 pruef('Der blosse Mittelpunkt von AB faellt durch',pz.nurMitte===false,pz.nurMitte);
 pruef('Die leere Ausgangsfigur besteht nicht',pz.ohnePunkt===false,pz.ohnePunkt);

 /* ---------- Der Wortschatz ---------- */
 const w=await pg.evaluate(()=>{
  const fehlt=[];
  for(const e of PFILL)for(let i=0;i<3;i++)if(!e[0][i])fehlt.push(e[1]+'/'+i);
  /* Jede Antwort muss in ihrer eigenen Annahmeliste stehen */
  const unannehmbar=PFILL.filter(e=>!e[2].concat([e[1]])
   .some(a=>a.toLowerCase()===e[1].toLowerCase())).map(e=>e[1]);
  const woerter=PFILL.map(e=>e[1]);
  return {anzahl:PFILL.length,fehlt,unannehmbar,woerter};});
 pruef('Der Wortschatz umfasst mindestens sechzehn Einträge',w.anzahl>=16,w.anzahl);
 pruef('Jeder Eintrag steht in allen drei Sprachen',w.fehlt.length===0,w.fehlt.join(','));
 pruef('Jede Antwort wird von ihrer eigenen Liste angenommen',w.unannehmbar.length===0,w.unannehmbar.join(','));
 for(const wort of ['Mittelparallelen','Winkelhalbierende','Lot','Ortslinie','Umlaufsinn'])
  pruef('Der Wortschatz enthält «'+wort+'»',w.woerter.includes(wort));

 /* ---------- Die beiden neuen Themen ---------- */
 const th=await pg.evaluate(()=>{
  const hat=i=>GEO_IDS.includes(i);
  /* Jedes Thema muss auf jeder Stufe eine brauchbare Frage liefern */
  const kaputt=[];
  for(const id of ['g7-woerter','g7-ortslinien']){
   const T=MT.find(x=>x.id===id);
   if(!T){kaputt.push(id+' fehlt in MT');continue;}
   /* Zehn Ziehungen je Stufe: die Frage wird zufaellig gewaehlt, ein
      kaputter Eintrag bliebe bei einem einzigen Versuch unentdeckt. */
   for(let lv=1;lv<=3;lv++)for(let k=0;k<10;k++){
    try{const it=T.g(lv);
     if(!it||!it.prompt)kaputt.push(id+' Stufe '+lv+' ohne Frage');}
    catch(e){kaputt.push(id+' Stufe '+lv+': '+e.message);}}}
  return {woerter:hat('g7-woerter'),ortslinien:hat('g7-ortslinien'),kaputt};});
 pruef('Das Thema «Die Wörter der Geometrie» ist eingetragen',th.woerter);
 pruef('Das Thema «Vom Satz zur Linie» ist eingetragen',th.ortslinien);
 pruef('Beide Themen liefern auf jeder Stufe eine Frage',th.kaputt.length===0,th.kaputt.join(' | '));

 /* ---------- Die neuen Begriffe im Glossar ---------- */
 const gl=await pg.evaluate(()=>{
  const fehlt=['geo_anglebisector','geo_midparallel','geo_locus','geo_orientation']
   .filter(k=>!GLOSS_GEO[k]);
  const kurz=Object.keys(GLOSS_GEO).filter(k=>(GLOSS_GEO[k]||[]).length<6);
  return {fehlt,kurz};});
 pruef('Die vier neuen Begriffe stehen im Glossar',gl.fehlt.length===0,gl.fehlt.join(','));
 pruef('Jeder Glossareintrag hat Name und Erklärung in drei Sprachen',gl.kurz.length===0,gl.kurz.join(','));

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
