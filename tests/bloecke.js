/* Einmaleins, Primzahlen und Kubikzahlen - die Themen mit den Bloecken.
   Jede Antwort wird im Test neu berechnet, mit einem eigenen Sieb und
   eigener Multiplikation, nicht mit den Funktionen der App. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8866);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
/* Eigenes Sieb, unabhaengig von der App */
const PRIM=new Set();{const n=200,f=new Array(n+1).fill(true);f[0]=f[1]=false;
 for(let i=2;i<=n;i++)if(f[i]){PRIM.add(i);for(let j=i*i;j<=n;j+=i)f[j]=false;}}
const KUBIK=new Set();for(let i=1;i<=20;i++)KUBIK.add(i*i*i);
const IDS=['m2-einmaleins','m4-einmaleins','m3-primzahlen','m3-kubikzahlen'];
const JAHR={'m2-einmaleins':2,'m4-einmaleins':4,'m3-primzahlen':3,'m3-kubikzahlen':3};
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8866/');
 await pg.waitForFunction(()=>typeof MT!=='undefined'&&typeof LP21ABW!=='undefined');

 const da=await pg.evaluate(o=>({
  fehlt:o.ids.filter(i=>!MT.find(x=>x.id===i)),
  jahr:o.ids.map(i=>{const T=MT.find(x=>x.id===i);return i+':'+(T?T.y:'-');}),
  gloss:['factor','product','quotient','prime','divisor','power','cube'].filter(k=>!GLOSS[k]),
  abwIds:Object.keys(LP21ABW),
  abwFehlt:Object.keys(LP21ABW).filter(i=>!MT.find(x=>x.id===i)),
  /* Der Hinweis muss in allen drei Sprachen in der Erklaerung stehen. */
  ohneHinweis:Object.keys(LP21ABW).filter(i=>{const T=MT.find(x=>x.id===i);
   if(!T)return true;return [0,1,2].some(k=>String(T.c[k]).indexOf(LP21ABW[i][k])<0);})
 }),{ids:IDS});
 pruef('Alle vier Themen stehen im Mathe-Modul',da.fehlt.length===0,da.fehlt.join(','));
 pruef('Jedes liegt in seiner Klasse',da.jahr.every(x=>Number(x.split(':')[1])===JAHR[x.split(':')[0]]),da.jahr.join(' '));
 pruef('Jeder benutzte Begriff steht im Glossar',da.gloss.length===0,da.gloss.join(','));
 pruef('Zwei Themen sind als Abweichung vom Lehrplan 21 vermerkt',
  da.abwIds.length===2&&da.abwIds.indexOf('m3-primzahlen')>=0&&da.abwIds.indexOf('m3-kubikzahlen')>=0,
  da.abwIds.join(','));
 pruef('Jedes vermerkte Thema gibt es wirklich',da.abwFehlt.length===0,da.abwFehlt.join(','));
 pruef('Der Vermerk steht in allen drei Sprachen in der Erklaerung',
  da.ohneHinweis.length===0,da.ohneHinweis.join(','));

 const z=await pg.evaluate(o=>{
  const raus=[];
  for(const spr of ['de','en','fr']){S.lang=spr;
   for(const id of o.ids){const T=MT.find(x=>x.id===id);
    for(let lv=1;lv<=3;lv++) for(let n=0;n<80;n++){
     let it;try{it=T.g(lv);}catch(e){raus.push({id,spr,lv,fehler:e.message});continue;}
     let bild=null;
     if(it.fig){try{const el=it.fig();bild=el&&el.tagName?el.tagName.toLowerCase():'leer';}
      catch(e){bild='FEHLER '+e.message;}}
     raus.push({id,spr,lv,p:String(it.prompt||''),typ:it.type,
      opt:it.options||null,
      korrekt:it.options?String(it.options[(it.correct||[0])[0]]):null,
      antwort:it.answer&&it.answer.re!==undefined?it.answer.re:(it.answer!==undefined?it.answer:null),
      bild,schritte:(it.steps||[]).join(' ')});}}}
  S.lang='de';return raus;},{ids:IDS});

 pruef('Keine Ziehung wirft einen Fehler',z.filter(x=>x.fehler).length===0,
  (z.find(x=>x.fehler)||{}).fehler);
 pruef('Jedes Bild zeichnet sich',z.filter(x=>x.bild&&/FEHLER|leer/.test(x.bild)).length===0,
  (z.find(x=>x.bild&&/FEHLER|leer/.test(x.bild))||{}).bild);
 pruef('Die Bilder sind SVG',z.filter(x=>x.bild&&x.bild!=='svg').length===0,
  (z.find(x=>x.bild&&x.bild!=='svg')||{}).bild);
 pruef('Auf Stufe 1 steht beim Einmaleins immer eine Mauer',
  z.filter(x=>/einmaleins/.test(x.id)&&x.lv===1&&x.id==='m2-einmaleins').every(x=>x.bild==='svg'),
  z.filter(x=>x.id==='m2-einmaleins'&&x.lv===1&&!x.bild).length);
 pruef('Kein scharfes s',z.filter(x=>/ß/.test(x.p+x.schritte)).length===0,
  (z.find(x=>/ß/.test(x.p+x.schritte))||{}).p);
 const doppelt=z.filter(x=>x.opt&&new Set(x.opt.map(String)).size!==x.opt.length);
 pruef('Keine Auswahl zeigt dieselbe Antwort zweimal',doppelt.length===0,
  JSON.stringify((doppelt[0]||{}).opt));

 /* ---------- Einmaleins nachgerechnet ---------- */
 const em=z.filter(x=>/einmaleins/.test(x.id)&&x.p);
 const emSchlecht=[];
 for(const x of em){
  let m=x.p.match(/^(\d+) · (\d+) = \?$/);
  if(m){if(Number(m[1])*Number(m[2])!==Number(x.antwort))emSchlecht.push(x);continue;}
  m=x.p.match(/^(\d+) : (\d+) = \?$/);
  if(m){if(Number(m[1])/Number(m[2])!==Number(x.antwort))emSchlecht.push(x);continue;}
  m=x.p.match(/^(\d+) · \? = (\d+)$/);
  if(m){if(Number(m[1])*Number(x.antwort)!==Number(m[2]))emSchlecht.push(x);continue;}
  emSchlecht.push(x);}
 pruef('Jede Einmaleins-Aufgabe stimmt',emSchlecht.length===0,
  JSON.stringify((emSchlecht[0]||{}).p));
 const reihen=new Set();em.forEach(x=>{const m=x.p.match(/^(\d+) [·:]/);if(m)reihen.add(Number(m[1]));});
 pruef('Klasse 2 bleibt auf Stufe 1 bei den kleinen Reihen',
  z.filter(x=>x.id==='m2-einmaleins'&&x.lv===1).every(x=>{const m=x.p.match(/^(\d+) · (\d+) = \?$/);return !m||Number(m[1])<=5;}),
  '');

 /* ---------- Primzahlen gegen ein eigenes Sieb ---------- */
 const pz=z.filter(x=>x.id==='m3-primzahlen'&&x.spr==='de'&&x.p);
 const pzSchlecht=[];
 for(const x of pz){
  let m=x.p.match(/^Kannst Du aus (\d+) Blöcken/);
  if(m){const n=Number(m[1]);const soll=PRIM.has(n)?'Nein':'Ja';
   if(x.korrekt!==soll)pzSchlecht.push({p:x.p,ist:x.korrekt,soll});continue;}
  if(/Welche dieser Zahlen ist eine Primzahl/.test(x.p)){
   if(!PRIM.has(Number(x.korrekt)))pzSchlecht.push({p:x.p,ist:x.korrekt,soll:'prim'});
   const falsch=x.opt.filter(y=>String(y)!==x.korrekt).map(Number).filter(y=>PRIM.has(y));
   if(falsch.length)pzSchlecht.push({p:x.p,grund:'Ablenker ist prim',falsch});continue;}
  m=x.p.match(/lässt sich (\d+) teilen/);
  if(m){const n=Number(m[1]),t=Number(x.antwort);
   if(n%t!==0||t<2)pzSchlecht.push({p:x.p,grund:'kein Teiler'});
   for(let q=2;q<t;q++)if(n%q===0)pzSchlecht.push({p:x.p,grund:'nicht der kleinste'});}}
 pruef('Jede Primzahl-Aufgabe stimmt gegen ein eigenes Sieb',pzSchlecht.length===0,
  JSON.stringify(pzSchlecht[0]||''));

 /* ---------- Kubikzahlen ---------- */
 const kz=z.filter(x=>x.id==='m3-kubikzahlen'&&x.spr==='de'&&x.p);
 const kzSchlecht=[];
 for(const x of kz){
  let m=x.p.match(/^Ein Würfel ist (\d+) Blöcke breit/);
  if(m){const e=Number(m[1]);if(e*e*e!==Number(x.antwort))kzSchlecht.push({p:x.p,ist:x.antwort});continue;}
  m=x.p.match(/^Ein Würfel braucht ([\d’']+) Blöcke/);
  if(m){const v=Number(m[1].replace(/[’']/g,''));const e=Number(x.antwort);
   if(e*e*e!==v)kzSchlecht.push({p:x.p,ist:x.antwort});continue;}
  if(/Welche Zahl ist eine Kubikzahl/.test(x.p)){
   const r=Number(String(x.korrekt).replace(/[’']/g,''));
   if(!KUBIK.has(r))kzSchlecht.push({p:x.p,ist:x.korrekt});
   const falsch=x.opt.map(y=>Number(String(y).replace(/[’']/g,''))).filter(y=>y!==r&&KUBIK.has(y));
   if(falsch.length)kzSchlecht.push({p:x.p,grund:'Ablenker ist Kubikzahl',falsch});}}
 pruef('Jede Kubikzahl-Aufgabe stimmt',kzSchlecht.length===0,JSON.stringify(kzSchlecht[0]||''));

 pruef('Keine Seitenfehler',perr.length===0,perr.slice(0,2).join(' | '));
 for(const [s,n,x] of aus)console.log(s,n,x);
 const fehler=aus.filter(x=>x[0]==='FAIL').length;
 console.log(fehler?('FEHLER: '+fehler):('Alles gut: '+aus.length+' Pruefungen'));
 await b.close();srv.close();process.exit(fehler?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
