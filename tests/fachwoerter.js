/* Die Namen der Rechenteile, Klasse 3 bis 7, und die beiden Rechenregeln.
   Jede Frage wird unabhaengig nachgerechnet: der Term wird aus dem
   Aufgabentext gelesen, das Ergebnis neu bestimmt und mit der Antwort
   der App verglichen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8864);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const IDS=['m3-wortplusminus','m4-wortmalgeteilt','m5-wortalle','m6-wortrechnen',
           'm7-wortpotenzwurzel','m3-vertauschen','m4-verbinden'];
const JAHR={'m3-wortplusminus':3,'m4-wortmalgeteilt':4,'m5-wortalle':5,'m6-wortrechnen':6,
            'm7-wortpotenzwurzel':7,'m3-vertauschen':3,'m4-verbinden':4};
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8864/');
 await pg.waitForFunction(()=>typeof MT!=='undefined'&&typeof GLOSS!=='undefined');

 const da=await pg.evaluate(o=>({
  fehlt:o.ids.filter(i=>!MT.find(x=>x.id===i)),
  jahr:o.ids.map(i=>{const T=MT.find(x=>x.id===i);return i+':'+(T?T.y:'-');}),
  gloss:['summand','sum','minuend','subtrahend','difference','factor','product',
         'dividend','divisor','quotient','power','base','exponent','root','radicand']
        .filter(k=>!GLOSS[k]),
  begriffe:o.ids.map(i=>{const T=MT.find(x=>x.id===i);
   return T?(T.terms||[]).filter(k=>!GLOSS[k]).map(k=>i+'/'+k):[];}).flat()
 }),{ids:IDS});
 pruef('Alle sieben Themen stehen im Mathe-Modul',da.fehlt.length===0,da.fehlt.join(','));
 pruef('Jedes Thema liegt in seiner Klasse',
  da.jahr.every(x=>Number(x.split(':')[1])===JAHR[x.split(':')[0]]),da.jahr.join(' '));
 pruef('Alle zehn Fachwoerter stehen im Glossar',da.gloss.length===0,da.gloss.join(','));
 pruef('Jeder von den Themen genannte Begriff steht im Glossar',da.begriffe.length===0,da.begriffe.join(','));

 /* ---------- Ziehungen in drei Sprachen, alle nachgerechnet ---------- */
 const z=await pg.evaluate(o=>{
  const raus=[];
  const zahl=t=>Number(String(t).replace(/[’'’]/g,'').replace(/−/g,'-'));
  const rechne=(a,op,b)=>op==='+'?a+b:op==='−'?a-b:op==='·'?a*b:a/b;
  for(const spr of ['de','en','fr']){
   S.lang=spr;
   for(const id of o.ids){
    const T=MT.find(x=>x.id===id);
    for(let lv=1;lv<=3;lv++) for(let n=0;n<60;n++){
     let it;try{it=T.g(lv);}catch(e){raus.push({id,spr,lv,fehler:String(e.message)});continue;}
     const p=String(it.prompt||'');
     const eintrag={id,spr,lv,p,typ:it.type,opt:it.options||null,
      korrekt:it.options?it.options[(it.correct||[0])[0]]:null,
      antwort:it.answer!==undefined?it.answer:null,
      schritte:(it.steps||[]).join(' ')};
     /* Term aus dem Text lesen, wo einer drinsteht */
     /* «Gilt a - b = b - a?» zeigt keinen Term, sondern stellt ihn infrage. */
     const fragt=/^(Gilt |Is |Est-ce)/.test(p);
     const m=fragt?null:p.match(/(\d+)\s([+−·:])\s(\d+)\s=\s([\d’'’]+)/);
     if(m)eintrag.term={a:zahl(m[1]),op:m[2],b:zahl(m[3]),r:zahl(m[4]),
      stimmt:Math.abs(rechne(zahl(m[1]),m[2],zahl(m[3]))-zahl(m[4]))<1e-9};
     raus.push(eintrag);}}}
  S.lang='de';
  return raus;},{ids:IDS});

 pruef('Keine Ziehung wirft einen Fehler',z.filter(x=>x.fehler).length===0,
  (z.find(x=>x.fehler)||{}).fehler);
 pruef('Jeder gezeigte Term stimmt',z.filter(x=>x.term&&!x.term.stimmt).length===0,
  JSON.stringify((z.find(x=>x.term&&!x.term.stimmt)||{}).p));
 pruef('Kein scharfes s',z.filter(x=>/ß/.test(x.p+x.schritte)).length===0,
  (z.find(x=>/ß/.test(x.p+x.schritte))||{}).p);
 const leer=z.filter(x=>!x.fehler&&!x.p.trim());
 pruef('Keine leere Frage',leer.length===0,leer.length);
 const einfach=z.filter(x=>x.typ==='single'&&(!x.opt||x.opt.length<2));
 pruef('Jede Auswahlfrage hat mehrere Antworten',einfach.length===0,einfach.length);
 const doppelt=z.filter(x=>x.opt&&new Set(x.opt).size!==x.opt.length);
 pruef('Keine Auswahl zeigt dieselbe Antwort zweimal',doppelt.length===0,
  JSON.stringify((doppelt[0]||{}).opt));
 const vier=z.filter(x=>x.typ==='single'&&/wortplusminus|wortmalgeteilt|wortalle|wortpotenzwurzel/.test(x.id)&&x.opt.length!==4);
 pruef('Die Namensfragen bieten genau vier Antworten',vier.length===0,
  JSON.stringify((vier[0]||{}).opt));

 /* ---------- Die Namen sitzen an der richtigen Stelle ---------- */
 const rollen=await pg.evaluate(()=>{
  S.lang='de';
  const NAME={'+':['Summand','Summand','Summe'],'−':['Minuend','Subtrahend','Differenz'],
              '·':['Faktor','Faktor','Produkt'],':':['Dividend','Divisor','Quotient']};
  const zahl=t=>Number(String(t).replace(/[’'’]/g,''));
  const schlecht=[];
  for(const id of ['m3-wortplusminus','m4-wortmalgeteilt','m5-wortalle']){
   const T=MT.find(x=>x.id===id);
   for(let lv=1;lv<=3;lv++) for(let n=0;n<120;n++){
    const it=T.g(lv);const p=String(it.prompt);
    const m=p.match(/(\d+)\s([+−·:])\s(\d+)\s=\s([\d’'’]+)/);
    if(!m)continue;
    const a=zahl(m[1]),b=zahl(m[3]),r=zahl(m[4]),op=m[2];
    const werte=[a,b,r];
    if(it.type==='single'){
     /* Deutsch: die gefragte Zahl steht zuletzt, vor dem Fragezeichen. */
     const g=p.match(/([\d’'’]+)\?\s*$/);if(!g)continue;
     const z=zahl(g[1]);
     const erlaubt=werte.map((w,i)=>w===z?NAME[op][i]:null).filter(Boolean);
     const richtig=it.options[(it.correct||[0])[0]];
     if(erlaubt.indexOf(richtig)<0)schlecht.push({id,lv,p,richtig,erlaubt});
    }else{
     /* Zahlfrage: der genannte Name muss auf die verlangte Zahl zeigen. */
     const nm=NAME[op].find(x=>p.indexOf(x)>=0);
     if(!nm)continue;
     const ist=Number(it.answer&&it.answer.re!==undefined?it.answer.re:it.answer);
     /* Bei Plus und Mal tragen beide Teile denselben Namen; dann muss die
        Ordnungszahl im Text entscheiden. */
     const stellen=NAME[op].map((x,i)=>x===nm?i:-1).filter(i=>i>=0);
     const welche=/\berste\b|\bfirst\b|\bpremier\b/.test(p)?[stellen[0]]
       :/\bzweite\b|\bsecond\b/.test(p)?[stellen[1]!==undefined?stellen[1]:stellen[0]]:stellen;
     if(!welche.some(i=>Math.abs(werte[i]-ist)<1e-9))
      schlecht.push({id,lv,p,nm,soll:welche.map(i=>werte[i]),ist:JSON.stringify(it.answer)});}}}
  return schlecht;});
 pruef('Jeder Name zeigt auf den richtigen Teil der Rechnung',rollen.length===0,
  JSON.stringify(rollen[0]||''));

 /* ---------- Vertauschen: ja bei Plus und Mal, nein bei Minus und Geteilt ---------- */
 const vert=await pg.evaluate(()=>{
  S.lang='de';const T=MT.find(x=>x.id==='m3-vertauschen');const schlecht=[];
  for(let lv=1;lv<=3;lv++) for(let n=0;n<200;n++){
   const it=T.g(lv);const p=String(it.prompt);
   const m=p.match(/^Gilt (\d+) ([+−·:]) (\d+) = (\d+) ([+−·:]) (\d+)\?$/);
   if(!m)continue;
   const soll=(m[2]==='+'||m[2]==='·')?'Ja':'Nein';
   const richtig=it.options[(it.correct||[0])[0]];
   if(richtig!==soll)schlecht.push({p,richtig,soll});}
  return schlecht;});
 pruef('Vertauschen gilt genau bei Plus und Mal',vert.length===0,JSON.stringify(vert[0]||''));

 /* ---------- Zusammenfassen: das Paar ergibt einen glatten Zehner ---------- */
 const verb=await pg.evaluate(()=>{
  S.lang='de';const T=MT.find(x=>x.id==='m4-verbinden');const schlecht=[];
  for(let lv=1;lv<=3;lv++) for(let n=0;n<200;n++){
   const it=T.g(lv);const p=String(it.prompt);
   if(it.type!=='single')continue;
   const richtig=String(it.options[(it.correct||[0])[0]]);
   const m=richtig.match(/^(\d+) \+ (\d+)$/);
   if(!m){schlecht.push({p,richtig});continue;}
   if(Number(m[1])+Number(m[2])!==10)schlecht.push({p,richtig});}
  return schlecht;});
 pruef('Das empfohlene Paar ergibt zehn',verb.length===0,JSON.stringify(verb[0]||''));

 /* ---------- Potenz und Wurzel ---------- */
 const pw=await pg.evaluate(()=>{
  S.lang='de';const T=MT.find(x=>x.id==='m7-wortpotenzwurzel');const schlecht=[];
  const sup={'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8};
  const zahl=t=>Number(String(t).replace(/[’'’]/g,''));
  for(let lv=1;lv<=3;lv++) for(let n=0;n<200;n++){
   const it=T.g(lv);const p=String(it.prompt);
   let m=p.match(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸]) = ([\d’'’]+)/);
   if(m){const b=zahl(m[1]),e=sup[m[2]],v=zahl(m[3]);
    if(Math.pow(b,e)!==v){schlecht.push({p,grund:'Potenzwert falsch'});continue;}
    if(Math.pow(b,e)===Math.pow(e,b))schlecht.push({p,grund:'Basis und Exponent vertauschbar'});
    continue;}
   m=p.match(/√([\d’'’]+) = ([\d’'’]+)/);
   if(m){const rad=zahl(m[1]),w=zahl(m[2]);
    if(w*w!==rad)schlecht.push({p,grund:'Wurzel falsch'});}}
  return schlecht;});
 pruef('Potenz und Wurzel stimmen in jeder Frage',pw.length===0,JSON.stringify(pw[0]||''));

 pruef('Keine Seitenfehler',perr.length===0,perr.slice(0,2).join(' | '));
 for(const [s,n,x] of aus)console.log(s,n,x);
 const fehler=aus.filter(x=>x[0]==='FAIL').length;
 console.log(fehler?('FEHLER: '+fehler):('Alles gut: '+aus.length+' Pruefungen'));
 await b.close();srv.close();process.exit(fehler?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
