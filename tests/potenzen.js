/* Die sechs Potenz-Themen in Klasse 7.
   Jede Frage wird unabhaengig nachgerechnet. Besonders geprueft wird die
   Stelle, an der Johannes stolpert: (-2)^4 gegen -2^4 und 2^5 gegen 5^2. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8863);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const IDS=['m7-potenz-produkt','m7-potenz-vorzeichen','m7-potenz-vergleich',
           'm7-potenz-anwenden','m7-potenz-rechnen','m7-potenz-woerter'];
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8863/');
 await pg.waitForFunction(()=>typeof MT!=='undefined'&&typeof exprFn==='function');

 const da=await pg.evaluate(ids=>({
  fehlt:ids.filter(i=>!MT.find(x=>x.id===i)),
  jahr:ids.map(i=>{const T=MT.find(x=>x.id===i);return T?T.y+'/'+T.a:'-';}),
  gloss:['power','base','exponent','square','cube','brackets','negative'].filter(k=>!GLOSS[k])}),IDS);
 pruef('Alle sechs Themen stehen im Mathe-Modul',da.fehlt.length===0,da.fehlt.join(','));
 pruef('Alle sechs liegen in Klasse 7, Bereich Arithmetik',da.jahr.every(x=>x==='7/1'),da.jahr.join(' '));
 pruef('Jeder benutzte Begriff steht im Glossar',da.gloss.length===0,da.gloss.join(','));

 /* ---------- 90 Ziehungen je Thema, Stufe und Sprache, alles nachgerechnet ---------- */
 const z=await pg.evaluate(ids=>{
  const sup={'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8};
  const SUPRE=/[⁰¹²³⁴⁵⁶⁷⁸]/g;
  const norm=s=>String(s).replace(SUPRE,m=>'^'+sup[m]);
  const val=s=>{const t=norm(s);if(!/^[\d\s+−·:()^.]+$/.test(t))return null;
   const f=exprFn(t);if(!f)return null;const v=f(0);
   return isFinite(v)?Math.round(v*1e9)/1e9:null;};
  /* Potenz aus einer Zeichenkette lesen, Klammer und Minus getrennt */
  const liesPotenz=s=>{
   let m=String(s).match(/^\s*\(−(\d+)\)([⁰¹²³⁴⁵⁶⁷⁸])\s*=\s*\?\s*$/);
   if(m)return {b:-Number(m[1]),e:sup[m[2]],klammer:true};
   m=String(s).match(/^\s*−(\d+)([⁰¹²³⁴⁵⁶⁷⁸])\s*=\s*\?\s*$/);
   if(m)return {b:Number(m[1]),e:sup[m[2]],klammer:false};
   return null;};
  const fehler=[],typen={},merkLang=S.lang;
  for(const lang of ['de','en','fr']){S.lang=lang;
  for(const id of ids){const T=MT.find(x=>x.id===id);typen[id]=typen[id]||new Set();
   for(let lv=1;lv<=3;lv++)for(let n=0;n<90;n++){
    let it;try{it=T.g(lv);}catch(e){fehler.push(id+' L'+lv+' Absturz: '+e.message);continue;}
    if(!it||!it.prompt){fehler.push(id+' L'+lv+' ohne Frage');continue;}
    typen[id].add(it.type);
    if(!it.explanation)fehler.push(id+' ohne Erklärung: '+it.prompt);
    if(/ß/.test(JSON.stringify(it)))fehler.push(id+' scharfes s: '+it.prompt);
    const text=[it.prompt].concat(it.options||[],it.steps||[],[it.explanation||'']).join(' ');
    if(/"/.test(text))fehler.push(id+' gerades Anführungszeichen: '+it.prompt);
    if(it.type==='single'){
     if(!Array.isArray(it.options)||it.options.length<2)fehler.push(id+' zu wenige Antworten: '+it.prompt);
     if(new Set(it.options).size!==it.options.length)fehler.push(id+' doppelte Antwort: '+it.prompt);
     if(!Array.isArray(it.correct)||it.correct.length!==1)fehler.push(id+' ohne eindeutige Lösung: '+it.prompt);
     /* Rechnen alle Antworten, darf nur eine den Wert der richtigen treffen */
     const w=it.options.map(val);
     if(w.every(v=>v!==null)){const soll=w[it.correct[0]];
      if(w.filter(v=>v===soll).length!==1)fehler.push(id+' zwei Antworten mit gleichem Wert: '+it.prompt+' / '+JSON.stringify(it.options));}
    }
    if(it.type==='num'){
     if(!Number.isInteger(it.ans.re))fehler.push(id+' keine ganze Zahl: '+it.prompt+' -> '+it.ans.re);
     const p=liesPotenz(it.prompt);
     if(p){ /* Vorzeichen: die Regel hier unabhaengig nachgebaut */
      const soll=p.klammer?Math.pow(p.b,p.e):-Math.pow(p.b,p.e);
      if(soll!==it.ans.re)fehler.push(id+' Vorzeichen falsch: '+it.prompt+' -> '+it.ans.re+' statt '+soll);
     }else{
      const m=it.prompt.match(/^\s*(.+?)\s*=\s*\?\s*$/);
      if(m){const v=val(m[1]);
       if(v!==null&&v!==it.ans.re)fehler.push(id+' Wert falsch: '+it.prompt+' -> '+it.ans.re+' statt '+v);}
     }
    }
    /* --- Thema fuer Thema --- */
    if(id==='m7-potenz-produkt'&&it.type==='single'){
     const mp=it.prompt.match(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸])/);
     const mprod=it.prompt.match(/\d+(?: · \d+)+/);
     const soll=mp?Math.pow(Number(mp[1]),sup[mp[2]]):(mprod?val(mprod[0]):null);
     const ist=val(it.options[it.correct[0]]);
     if(soll===null||ist===null||soll!==ist)
      fehler.push(id+' Umschrift falsch: '+it.prompt+' -> '+it.options[it.correct[0]]);
    }
    if(id==='m7-potenz-vergleich'&&it.type==='single'&&/·|[¹²³⁴⁵⁶⁷⁸]|^\d/.test(it.options[0])){
     const w=it.options.map(val).filter(v=>v!==null);
     const r=val(it.options[it.correct[0]]);
     if(r!==null&&/grössere|larger|plus grand/.test(it.prompt)&&!w.every(v=>v<=r))
      fehler.push(id+' nicht die grösste als richtig markiert: '+it.prompt);
     if(r!==null&&/kleinste|smallest|plus petit/.test(it.prompt)&&!w.every(v=>v>=r))
      fehler.push(id+' nicht die kleinste als richtig markiert: '+it.prompt);
     if(/Quadratzahl|square number|nombre carré/.test(it.prompt)){
      for(let i=0;i<it.options.length;i++){const q=Number(it.options[i]);
       const istQ=Number.isInteger(Math.sqrt(q));
       if(i===it.correct[0]&&!istQ)fehler.push(id+' keine Quadratzahl als richtig: '+q);
       if(i!==it.correct[0]&&istQ)fehler.push(id+' Quadratzahl als Ablenker: '+q);}}
    }
   }}}
  S.lang=merkLang;
  return {fehler:fehler.slice(0,12),anzahl:fehler.length,
   typen:Object.fromEntries(Object.entries(typen).map(([k,v])=>[k,[...v].sort().join('+')]))};},IDS);
 pruef('4860 Ziehungen in drei Sprachen ohne einen einzigen Fehler',z.anzahl===0,
  z.anzahl+(z.fehler.length?' | '+z.fehler.join(' | '):''));

 /* ---------- Die Stolperstelle ausdruecklich ---------- */
 const st=await pg.evaluate(()=>{
  const T=MT.find(x=>x.id==='m7-potenz-vorzeichen');
  const merk=S.lang;S.lang='de';
  const mit=[],ohne=[],vergleich=[];
  for(let n=0;n<400;n++){const it=T.g(2);
   if(it.type!=='num')
    {if(/Vergleiche/.test(it.prompt))vergleich.push(it);continue;}
   (/^\(/.test(it.prompt)?mit:ohne).push(it.prompt+' -> '+it.ans.re);}
  S.lang=merk;
  const paar=m=>{const r=m.match(/\(?−(\d+)\)?([²³⁴⁵⁶])/);
   return r?[Number(r[1]),'  ²³⁴⁵⁶'.indexOf(r[2])]:null;};
  return {mit:mit.length,ohne:ohne.length,vergleich:vergleich.length,
   beispielMit:mit[0],beispielOhne:ohne[0],
   /* Mit Klammer und geradem Exponenten muss das Ergebnis positiv sein */
   falschMit:mit.filter(s=>{const e=s.match(/([²³⁴⁵⁶])/);
    if(!e)return false;const ex='  ²³⁴⁵⁶'.indexOf(e[1]);
    const v=Number(s.split('-> ')[1]);return ex%2===0?v<0:v>0;}).slice(0,3),
   /* Ohne Klammer muss das Ergebnis immer negativ sein */
   falschOhne:ohne.filter(s=>Number(s.split('-> ')[1])>0).slice(0,3)};});
 pruef('Beide Schreibweisen kommen vor',st.mit>20&&st.ohne>20,st.mit+' mit, '+st.ohne+' ohne Klammer');
 pruef('Mit Klammer entscheidet der Exponent über das Vorzeichen',st.falschMit.length===0,st.falschMit.join(' | '));
 pruef('Ohne Klammer ist das Ergebnis immer negativ',st.falschOhne.length===0,st.falschOhne.join(' | '));
 pruef('Die Gegenüberstellung wird auch gefragt',st.vergleich>20,st.vergleich);

 /* ---------- Namen, Erklaerungen, W-Woerter ---------- */
 const w=await pg.evaluate(ids=>{
  const kurz=[],wWort=[];
  const wRe=/^(Warum|Wenn|Was|Wer|Wo|Wie|Wann|Welche|Welcher|Welches|Welchen|Welchem|Weshalb|Wem|Wen|Wobei|Womit|Wodurch|Woraus|Wofür)\b/;
  for(const id of ids){const T=MT.find(x=>x.id===id);
   if(!T||T.n.length!==3||T.n.some(x=>!x))kurz.push(id+' Name');
   if(!T||T.c.length!==3||T.c.some(x=>!x))kurz.push(id+' Erklärung');
   if(T&&wRe.test(T.n[0]))wWort.push(id+' Titel: '+T.n[0]);
   if(T)for(const satz of String(T.c[0]).split(/(?<=[.!?])\s+/))
    if(wRe.test(satz.trim())&&!/\?$/.test(satz.trim()))wWort.push(id+' Satz: '+satz.trim());}
  return {kurz,wWort};},IDS);
 pruef('Jedes Thema hat Namen und Erklärung in drei Sprachen',w.kurz.length===0,w.kurz.join(','));
 pruef('Kein Titel und kein Satz beginnt mit einem W-Wort',w.wWort.length===0,w.wWort.join(' | '));

 /* ---------- Der Spielweg ---------- */
 const sp=await pg.evaluate(ids=>{const f=[];
  for(const id of ids){const T=mtopic(id);if(!T){f.push(id+' nicht über mtopic erreichbar');continue;}
   for(let lv=1;lv<=3;lv++){const it=genItem(T,lv);
    if(!it||!it.prompt)f.push(id+' genItem leer auf Stufe '+lv);}}
  return f;},IDS);
 pruef('Alle sechs laufen über den Spielweg',sp.length===0,sp.join(' | '));
 pruef('Jedes Thema fragt rechnend oder wählend',
  Object.values(z.typen).every(v=>v.length>0),JSON.stringify(z.typen));

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
