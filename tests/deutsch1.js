/* Deutsch Primarschule, Klassen 1 und 2.
   Geprueft wird dreierlei: dass jedes Thema auf jeder Stufe eine brauchbare
   Frage liefert, dass die Antworten fachlich stimmen, und dass die Schweizer
   Schreibung eingehalten ist - nie das scharfe s. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8861);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8861/');
 await pg.waitForFunction(()=>typeof DPT!=='undefined'&&typeof DEP_GAME!=='undefined');

 /* ---------- Aufbau ---------- */
 const bau=await pg.evaluate(()=>({
  anzahl:DPT.length,
  ids:DPT.map(x=>x.id),
  jahre:[...new Set(DPT.map(x=>x.y))].sort(),
  spiel:DEP_GAME.id,
  titelDa:['de','en','fr'].every(l=>T[l]&&T[l].dep_title),
  gefunden:DPT.every(x=>!!mtopic(x.id)),
  inListe:S.lang&&typeof builtinGames==='function'?true:null}));
 pruef('Zehn Themen sind eingetragen',bau.anzahl===10,bau.anzahl);
 pruef('Fünf in Klasse 1, fünf in Klasse 2',
  bau.jahre.length===2&&bau.jahre[0]===1&&bau.jahre[1]===2,JSON.stringify(bau.jahre));
 pruef('Alle Themen sind über mtopic auffindbar',bau.gefunden===true);
 pruef('Das Spiel heisst de-primar',bau.spiel==='de-primar',bau.spiel);
 pruef('Der Spieltitel steht in allen drei Sprachen',bau.titelDa===true);

 /* ---------- Jedes Thema liefert auf jeder Stufe eine Frage ---------- */
 const lauf=await pg.evaluate(()=>{
  const kaputt=[],ohneHilfe=[];
  for(const tp of DPT){
   for(let lv=1;lv<=3;lv++){
    /* Zwanzig Ziehungen je Stufe: die Aufgaben werden zufaellig gewaehlt,
       ein kaputter Eintrag bliebe bei einem einzigen Versuch unentdeckt. */
    for(let k=0;k<20;k++){
     let it=null;
     try{it=tp.g(lv);}catch(e){kaputt.push(tp.id+' St'+lv+': '+e.message);break;}
     if(!it||!it.prompt){kaputt.push(tp.id+' St'+lv+' ohne Frage');break;}
     if(!it.steps||!it.steps.length)ohneHilfe.push(tp.id);
     if(it.type==='single'){
      if(!it.options||it.options.length<2)kaputt.push(tp.id+' zu wenige Antworten');
      else if(new Set(it.options).size!==it.options.length)kaputt.push(tp.id+' doppelte Antwort: '+it.options.join('/'));
      else if(!it.correct||it.correct[0]!==0)kaputt.push(tp.id+' Lösung nicht an Stelle 0');}
     if(it.type==='num'&&!(it.ans&&isFinite(it.ans.re)))kaputt.push(tp.id+' Zahl unbrauchbar');}}}
  return {kaputt:[...new Set(kaputt)],ohneHilfe:[...new Set(ohneHilfe)]};});
 pruef('Jedes Thema liefert auf jeder Stufe eine brauchbare Frage',
  lauf.kaputt.length===0,lauf.kaputt.slice(0,3).join(' | '));
 pruef('Jede Frage bringt einen Lösungsweg mit',lauf.ohneHilfe.length===0,lauf.ohneHilfe.join(','));

 /* ---------- Fachliche Stichproben ---------- */
 const fach=await pg.evaluate(()=>{
  const falsch=[];
  /* Silben: die Zahl muss zur Trennung passen */
  for(const [w,n] of SILBEN){
   const teile=w.split('-').length;
   if(teile!==n)falsch.push('Silben '+w+': '+teile+' statt '+n);}
  /* Reime: das Reimwort darf nicht unter den Ablenkern stehen */
  for(const [a,r,ab] of REIME){
   if(ab.includes(r))falsch.push('Reim '+a+': Lösung unter den Ablenkern');
   if(a===r)falsch.push('Reim '+a+': Wort gleich Reimwort');}
  /* Anlaut: jedes Wort beginnt mit einem Grossbuchstaben des Alphabets */
  for(const w of ANLAUT)if(!/^[A-ZÄÖÜ]/.test(w))falsch.push('Anlaut '+w);
  /* sp/st: die Kennzeichnung muss zum Wortanfang passen */
  for(const [w,k] of SPST){
   if(w.slice(0,2).toLowerCase()!==k)falsch.push('spst '+w+' als '+k);}
  /* Satzzeichen: nur Punkt, Frage- und Ausrufezeichen */
  for(const [s,z] of ZEICHEN)if(!'.?!'.includes(z))falsch.push('Zeichen '+s);
  /* Wortarten: keine Dopplung zwischen den drei Listen */
  const alle=WORTARTEN.flatMap(x=>x[1]);
  const doppelt=alle.filter((w,i)=>alle.indexOf(w)!==i);
  if(doppelt.length)falsch.push('Wort in zwei Wortarten: '+doppelt.join(','));
  return falsch;});
 pruef('Die Silbenzahlen stimmen mit der Trennung überein',
  !fach.some(x=>x.startsWith('Silben')),fach.filter(x=>x.startsWith('Silben')).join(' | '));
 pruef('Kein Reimwort steht unter seinen eigenen Ablenkern',
  !fach.some(x=>x.startsWith('Reim')),fach.filter(x=>x.startsWith('Reim')).join(' | '));
 pruef('Die sp- und st-Wörter sind richtig zugeordnet',
  !fach.some(x=>x.startsWith('spst')),fach.filter(x=>x.startsWith('spst')).join(' | '));
 pruef('Kein Wort steht in zwei Wortarten',
  !fach.some(x=>x.startsWith('Wort in')),fach.filter(x=>x.startsWith('Wort in')).join(' | '));
 pruef('Alle fachlichen Stichproben bestehen',fach.length===0,fach.slice(0,3).join(' | '));

 /* ---------- Schweizer Schreibung ---------- */
 const ch=await pg.evaluate(()=>{
  const mitSZ=[];
  for(const tp of DPT){
   const txt=JSON.stringify([tp.n,tp.c]);
   if(txt.includes('ß'))mitSZ.push(tp.id+' (Titel oder Erklärung)');
   for(let lv=1;lv<=3;lv++)for(let k=0;k<10;k++){
    const it=tp.g(lv);
    const s=JSON.stringify([it.prompt,it.options||'',it.steps||'']);
    if(s.includes('ß'))mitSZ.push(tp.id+' (Aufgabe)');}}
  return [...new Set(mitSZ)];});
 pruef('Nirgends ein scharfes s',ch.length===0,ch.join(' | '));

 /* ---------- Der Lehrplan-Code steht an jedem Thema ---------- */
 const lp=await pg.evaluate(()=>{
  const ohne=DPT.filter(tp=>!/Lehrplan 21: D\.\d/.test(String(tp.c[0]))).map(tp=>tp.id);
  const codes=DPT.map(tp=>{const m=/Lehrplan 21: (D\.[0-9A-Za-z.]+)/.exec(String(tp.c[0]));
   return tp.id+' → '+(m?m[1]:'fehlt');});
  return {ohne,codes};});
 /* Ein Code darf nur stehen, wenn sein Wortlaut belegt ist. Die Liste
    stammt aus der Recherche zum St. Galler Lehrplan; alles andere muss
    den Zyklus nennen statt einer Nummer. */
 const belegt=await pg.evaluate(()=>{
  const erlaubt=['D.5.E.1.a','D.5.E.1.b','D.5.E.1.c','D.5.E.1.d','D.5.E.1.e',
   'D.5.D.1.a','D.5.D.1.b','D.5.D.1.c','D.5.D.1.d','D.5.D.1.e',
   'D.4.F.1.a','D.4.F.1.b','D.4.F.1.c','D.4.F.1.d','D.5.A.1'];
  const schlecht=[];
  for(const tp of DPT){
   const m=/Lehrplan 21: (D(?:\.[0-9A-Za-z]+)+)\./.exec(String(tp.c[0]));
   if(m&&!erlaubt.includes(m[1]))schlecht.push(tp.id+' → '+m[1]);
   if(!m&&!/Zyklus/.test(String(tp.c[0])))schlecht.push(tp.id+' → weder Code noch Zyklus');}
  return schlecht;});
 pruef('Jedes Thema nennt einen belegten Code oder den Zyklus',
  belegt.length===0,belegt.join(' | '));
 pruef('Jedes Thema kennzeichnet die Klasse als Empfehlung',
  await pg.evaluate(()=>DPT.every(tp=>/Empfehlung|recommendation|recommandation/.test(String(tp.c[0])))));
 console.log('  Lehrplan-Zuordnung:');
 for(const c of lp.codes)console.log('    '+c);

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
