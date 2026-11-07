/* Pruefungsstoff von Johannes: Distributivgesetz, Klammern weglassen,
   Klammer setzen, Rechenausdruck in Worten.
   Jede Frage wird nachgerechnet. Eine Aufgabe, deren angebliche Loesung
   die eigene Rechnung nicht erfuellt, ist schlimmer als keine Aufgabe. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8861);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const IDS=['m7-distributive','m7-klammern-weg','m7-klammer-setzen','m7-rechenworte'];
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8861/');
 await pg.waitForFunction(()=>typeof MT!=='undefined'&&typeof exprFn==='function');

 /* ---------- Die vier Themen sind eingetragen ---------- */
 const da=await pg.evaluate(ids=>({
  fehlt:ids.filter(i=>!MT.find(x=>x.id===i)),
  jahr:ids.map(i=>{const T=MT.find(x=>x.id===i);return T?T.y+'/'+T.a:'-';}),
  alleThemen:MATH_GAME.gen.topics===null}),IDS);
 pruef('Alle vier Themen stehen im Mathe-Modul',da.fehlt.length===0,da.fehlt.join(','));
 pruef('Alle vier liegen in Klasse 7, Bereich Arithmetik',
  da.jahr.every(x=>x==='7/1'),da.jahr.join(' '));
 pruef('Das Mathe-Spiel nimmt alle Themen auf',da.alleThemen===true);

 /* ---------- Die Klammer-Hilfsfunktionen ---------- */
 const h=await pg.evaluate(()=>({
  wert:kwert('(15 : 3) + (2 · 8)'),
  paare:kpaare('(15 : 3) + (2 · 8)').length,
  beideUnnoetig:knoetig('(15 : 3) + (2 · 8)'),
  minusNoetig:knoetig('20 − (5 − 2)'),
  geteiltNoetig:knoetig('36 : (6 : 2)'),
  verschachtelt:knoetig('((4 + 6) · 3) : 5'),
  minimal:kminimal('((9 + 4) · 6) : 6'),
  minimal2:kminimal('((4 + 6) · 3) : 5'),
  ohne:kohne('(15 : 3) + (2 · 8)',kpaare('(15 : 3) + (2 · 8)'))}));
 pruef('(15 : 3) + (2 · 8) ergibt 21',h.wert===21,h.wert);
 pruef('Zwei Klammerpaare werden gefunden',h.paare===2,h.paare);
 pruef('Beide Klammern sind hier überflüssig',
  JSON.stringify(h.beideUnnoetig)==='[false,false]',JSON.stringify(h.beideUnnoetig));
 pruef('Die Klammer nach einem Minus ist nötig',
  JSON.stringify(h.minusNoetig)==='[true]',JSON.stringify(h.minusNoetig));
 pruef('Die Klammer nach einem Geteilt ist nötig',
  JSON.stringify(h.geteiltNoetig)==='[true]',JSON.stringify(h.geteiltNoetig));
 pruef('Von aussen unnötig, von innen nötig',
  JSON.stringify(h.verschachtelt)==='[false,true]',JSON.stringify(h.verschachtelt));
 pruef('Eine Klammer, die erst durch das Weglassen einer anderen überflüssig wird, fällt mit',
  h.minimal==='9 + 4 · 6 : 6',h.minimal);
 pruef('Eine nötige Klammer bleibt stehen',h.minimal2==='(4 + 6) · 3 : 5',h.minimal2); pruef('Entfernen lässt die Rechnung stehen',h.ohne==='15 : 3 + 2 · 8',h.ohne);

 /* ---------- 200 Ziehungen je Thema und Stufe, alles nachgerechnet ---------- */
 const z=await pg.evaluate(ids=>{
  const sup={'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8};
  const norm=s=>String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸]/g,m=>'^'+sup[m]);
  const val=s=>{const f=exprFn(norm(s));if(!f)return null;const v=f(0);return isFinite(v)?Math.round(v*1e9)/1e9:null;};
  const fehler=[],gesehen={};const merkLang=S.lang;
  for(const lang of ['de','en','fr']){S.lang=lang;
  for(const id of ids){const T=MT.find(x=>x.id===id);gesehen[id]=gesehen[id]||new Set();
   for(let lv=1;lv<=3;lv++)for(let n=0;n<80;n++){
    let it;try{it=T.g(lv);}catch(e){fehler.push(id+' L'+lv+' Absturz: '+e.message);continue;}
    if(!it||!it.prompt){fehler.push(id+' L'+lv+' ohne Frage');continue;}
    gesehen[id].add(it.type);
    if(/ß/.test(JSON.stringify(it)))fehler.push(id+' scharfes s: '+it.prompt);
    if(/["']/.test(it.prompt))fehler.push(id+' gerades Anführungszeichen: '+it.prompt);
    if(it.type==='single'){
     if(!Array.isArray(it.options)||it.options.length<2){fehler.push(id+' zu wenige Antworten: '+it.prompt);continue;}
     if(new Set(it.options).size!==it.options.length)fehler.push(id+' doppelte Antwort: '+it.prompt);
     if(!Array.isArray(it.correct)||it.correct.length!==1)fehler.push(id+' ohne eindeutige Lösung: '+it.prompt);
    }
    if(it.type==='num'&&!(typeof it.ans.re==='number'&&isFinite(it.ans.re)))
     fehler.push(id+' ohne Zahl als Lösung: '+it.prompt);

    /* --- Thema für Thema nachrechnen --- */
    if(id==='m7-distributive'){
     if(it.type==='num'&&/___/.test(it.prompt)){
      const roh=it.prompt.split(': ').slice(1).join(': ').replace('___',String(it.ans.re));
      const [l,r]=roh.split('=');const a=val(l),bq=val(r);
      if(a===null||bq===null||a!==bq)fehler.push(id+' Lücke stimmt nicht: '+it.prompt+' / '+it.ans.re);
     }else if(it.type==='num'){
      const v=val(it.prompt.replace(/\s*=\s*\?$/,''));
      if(v===null||v!==it.ans.re)fehler.push(id+' Wert falsch: '+it.prompt+' -> '+it.ans.re+' statt '+v);
     }else{
      const q=(it.prompt.match(/(?:zu|equals|à) (.+)\.$/)||[])[1];
      const soll=q?val(q):null, ist=val(it.options[it.correct[0]]);
      if(soll===null||ist===null||soll!==ist)fehler.push(id+' Auswahl falsch: '+it.prompt+' -> '+it.options[it.correct[0]]);
      for(let i=0;i<it.options.length;i++)if(i!==it.correct[0]&&val(it.options[i])===soll)
       fehler.push(id+' zweite richtige Antwort: '+it.prompt+' / '+it.options[i]);
     }
    }
    if(id==='m7-klammern-weg'){
     if(it.type==='num'){
      const v=val(it.prompt.replace(/\s*=\s*\?$/,''));
      if(v===null||v!==it.ans.re)fehler.push(id+' Wert falsch: '+it.prompt+' -> '+it.ans.re);
     }else{
      /* Der Term ist der laengste Abschnitt aus Ziffern, Leerzeichen und Rechenzeichen. */
      const m=it.prompt.match(/[\d(][\d\s+\u2212\u00b7:()]*[\d)]/);
      const term=m?m[0]:null;
      if(!term){fehler.push(id+' Term nicht gefunden: '+it.prompt);continue;}
      if(/ähle|ount how many|ompte combien/.test(it.prompt)){
       const nz=knoetig(term),soll=nz.filter(Boolean).length;
       if(String(soll)!==it.options[it.correct[0]])
        fehler.push(id+' Anzahl falsch: '+term+' -> '+it.options[it.correct[0]]+' statt '+soll);
      }else{
       const soll=val(term),rich=it.options[it.correct[0]];
       if(soll===null||val(rich)!==soll)fehler.push(id+' Umschrift ändert den Wert: '+term+' -> '+rich);
       if(!/\(/.test(rich))fehler.push(id+' alle Klammern weg, obwohl eine nötig war: '+term);
       if(kpaare(rich).length>=kpaare(term).length)fehler.push(id+' keine Klammer entfernt: '+term+' -> '+rich);
       if(kminimal(rich)!==rich)fehler.push(id+' unnötige Klammer blieb stehen: '+rich);
       for(let i=0;i<it.options.length;i++)if(i!==it.correct[0]&&it.options[i]===rich)
        fehler.push(id+' doppelte richtige Antwort: '+term);
      }
     }
    }
    if(id==='m7-klammer-setzen'){
     const m=it.prompt.match(/:\s*(.+?)\s*=\s*(-?\d+)\s*$/);
     if(!m){fehler.push(id+' Frage nicht lesbar: '+it.prompt);continue;}
     const ziel=Number(m[2]),flach=m[1];
     const treffer=it.options.map((o,i)=>[i,val(o)]).filter(x=>x[1]===ziel);
     if(treffer.length!==1)fehler.push(id+' nicht genau eine Lösung: '+it.prompt+' / '+JSON.stringify(it.options));
     else if(treffer[0][0]!==it.correct[0])fehler.push(id+' falsche Lösung markiert: '+it.prompt);
     if(val(flach)===ziel)fehler.push(id+' ohne Klammer schon richtig: '+it.prompt);
     for(const o of it.options)if(o.replace(/[()]/g,'').replace(/\s/g,'')!==flach.replace(/\s/g,''))
      fehler.push(id+' Antwort passt nicht zur Rechnung: '+o+' / '+flach);
    }
    if(id==='m7-rechenworte'){
     if(it.type==='num'){
      const term=it.steps&&it.steps[1];
      const v=term?val(term):null;
      if(v===null)fehler.push(id+' Term nicht rechenbar: '+term);
      else if(v!==it.ans.re)fehler.push(id+' Term und Lösung passen nicht: '+term+' = '+v+', erwartet '+it.ans.re);
      if(!Number.isInteger(it.ans.re))fehler.push(id+' keine ganze Zahl: '+it.prompt+' -> '+it.ans.re);
     }else{
      if(it.options.length<2)fehler.push(id+' zu wenige Beschreibungen');
     }
    }
   }}}
  S.lang=merkLang;
  return {fehler:fehler.slice(0,12),anzahl:fehler.length,
   typen:Object.fromEntries(Object.entries(gesehen).map(([k,v])=>[k,[...v].sort()]))};},IDS);
 pruef('2880 Ziehungen in drei Sprachen ohne einen einzigen Fehler',z.anzahl===0,z.anzahl+(z.fehler.length?' | '+z.fehler.join(' | '):''));
 pruef('Das Distributivgesetz fragt rechnend und wählend',
  JSON.stringify(z.typen['m7-distributive'])==='["num","single"]',JSON.stringify(z.typen['m7-distributive']));
 pruef('Klammern weglassen fragt rechnend und wählend',
  JSON.stringify(z.typen['m7-klammern-weg'])==='["num","single"]',JSON.stringify(z.typen['m7-klammern-weg']));
 pruef('Klammer setzen fragt wählend',
  JSON.stringify(z.typen['m7-klammer-setzen'])==='["single"]',JSON.stringify(z.typen['m7-klammer-setzen']));
 pruef('Rechenworte fragen in beide Richtungen',
  JSON.stringify(z.typen['m7-rechenworte'])==='["num","single"]',JSON.stringify(z.typen['m7-rechenworte']));

 /* ---------- Stufe 1 bleibt einfach ---------- */
 const s1=await pg.evaluate(()=>{const T=MT.find(x=>x.id==='m7-klammer-setzen');
  const zahlen=[];for(let n=0;n<60;n++){const it=T.g(1);
   zahlen.push((it.prompt.match(/\d+/g)||[]).length);}
  return Math.max(...zahlen);});
 pruef('Auf Stufe 1 stehen höchstens vier Zahlen in der Frage',s1<=4,s1);

 /* ---------- Namen, Erklärungen, Glossar ---------- */
 const w=await pg.evaluate(ids=>{
  const kurz=[],ohneErkl=[],wWort=[];
  const wRe=/^(Warum|Wenn|Was|Wer|Wo|Wie|Wann|Welche|Welcher|Welches|Welchen|Welchem|Weshalb|Wem|Wen|Wobei|Womit|Wodurch|Woraus|Wofür)\b/;
  for(const id of ids){const T=MT.find(x=>x.id===id);
   if(!T||T.n.length!==3||T.n.some(x=>!x))kurz.push(id+' Name');
   if(!T||T.c.length!==3||T.c.some(x=>!x))ohneErkl.push(id+' Erklärung');
   if(T&&wRe.test(T.n[0]))wWort.push(id+' Titel: '+T.n[0]);
   if(T)for(const satz of String(T.c[0]).split(/(?<=[.!?])\s+/))
    if(wRe.test(satz.trim())&&!/\?$/.test(satz.trim()))wWort.push(id+' Satz: '+satz.trim());
   if(T)for(const term of T.terms||[])if(!GLOSS[term])kurz.push(id+' Begriff '+term);}
  const g=GLOSS['distributive']||[];
  return {kurz,ohneErkl,wWort,glossLen:g.length,glossDe:g[0]||''};},IDS);
 pruef('Jedes Thema hat Namen in drei Sprachen',w.kurz.length===0,w.kurz.join(','));
 pruef('Jedes Thema hat eine Erklärung in drei Sprachen',w.ohneErkl.length===0,w.ohneErkl.join(','));
 pruef('Kein Titel und kein Satz beginnt mit einem W-Wort',w.wWort.length===0,w.wWort.join(' | '));
 pruef('Das Distributivgesetz steht im Glossar',w.glossLen===6&&w.glossDe==='Distributivgesetz',w.glossDe+'/'+w.glossLen);

 /* ---------- Die Themen laufen auch im Spiel ---------- */
 const sp=await pg.evaluate(async ids=>{
  const fehler=[];
  for(const id of ids){
   const T=mtopic(id);if(!T){fehler.push(id+' nicht über mtopic erreichbar');continue;}
   for(let lv=1;lv<=3;lv++){const it=genItem(T,lv);
    if(!it||!it.prompt)fehler.push(id+' genItem leer auf Stufe '+lv);
    else if(!it.explanation)fehler.push(id+' ohne Erklärung auf Stufe '+lv);}}
  return fehler;},IDS);
 pruef('Alle vier laufen über den Spielweg',sp.length===0,sp.join(' | '));


 /* ---------- Die Spieldatei aus den drei Fotos ---------- */
 const SPIEL=JSON.parse(fs.readFileSync(path.join(__dirname,'..','docs','20261107_Mathe-Probe-Klammern_V1.json'),'utf8'));
 const sd=await pg.evaluate(g=>{
  const sup={'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8};
  const norm=s=>String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸]/g,m=>'^'+sup[m]);
  const val=s=>{const f=exprFn(norm(s));if(!f)return null;const v=f(0);return isFinite(v)?Math.round(v*1e9)/1e9:null;};
  const fehler=[],ids=new Set();
  for(const it of g.items){
   const kopie=JSON.parse(JSON.stringify(it));
   if(!validItem(kopie))fehler.push(it.id+': von der App abgelehnt');
   if(ids.has(it.id))fehler.push(it.id+': doppelte Kennung');ids.add(it.id);
   if(/ß/.test(JSON.stringify(it)))fehler.push(it.id+': scharfes s');
   if(/"/.test(it.prompt))fehler.push(it.id+': gerades Anführungszeichen');
   if(!it.explanation)fehler.push(it.id+': ohne Erklärung');
   if(it.type==='input'){
    const term=it.prompt.replace(/^.*?\. /,'').replace(/\s*=\s*\?$/,'');
    const v=val(term);
    if(v!==null&&String(v)!==it.answer)fehler.push(it.id+': '+term+' = '+v+', angegeben '+it.answer);
    if(!/^-?\d+$/.test(it.answer))fehler.push(it.id+': Antwort keine ganze Zahl: '+it.answer);
   }
   if(it.type==='single'){
    if(it.options.length<3)fehler.push(it.id+': weniger als drei Antworten');
    if(new Set(it.options).size!==it.options.length)fehler.push(it.id+': doppelte Antwort');
    if(/^k-/.test(it.id)){
     /* Gesucht ist die knappste Schreibweise mit unver\u00e4ndertem Wert.
        Antworten mit anderem Wert sind erlaubte Ablenker. */
     const m2=it.prompt.match(/[\d(][\d\s+\u2212\u00b7:()]*[\d)]/);
     const term=m2?m2[0]:null, w=term?val(term):null;
     if(w!==null&&it.options.some(o=>val(o)!==null)){
      const gleich=it.options.filter(o=>val(o)===w);
      const knapp=gleich.filter(o=>kminimal(o)===o);
      if(knapp.length!==1)fehler.push(it.id+': nicht genau eine knappe Antwort: '+JSON.stringify(knapp));
      else if(knapp[0]!==it.options[it.correct[0]])fehler.push(it.id+': falsche Antwort als richtig markiert');
     }
    }else{
     /* Sonst darf nur eine Antwort den Wert der Frage treffen */
     const werte=it.options.map(val);
     if(werte.every(v=>v!==null)){
      const soll=werte[it.correct[0]];
      if(werte.filter(v=>v===soll).length!==1)fehler.push(it.id+': zwei Antworten mit gleichem Wert');
     }
    }
   }
  }
  return {fehler:fehler.slice(0,10),anzahl:fehler.length,n:g.items.length};},SPIEL);
 pruef('Die Spieldatei hat 58 Fragen',sd.n===58,sd.n);
 pruef('Jede Frage der Spieldatei besteht die Prüfung der App',sd.anzahl===0,sd.fehler.join(' | '));

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
