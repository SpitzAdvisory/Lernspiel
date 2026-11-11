/* Verben, bei denen die Bedeutung ueber die Formen entscheidet.
   Geprueft wird vor allem das eine, worauf es ankommt: dass die Antwort
   zur Bedeutung in der Klammer gehoert und nicht zur anderen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8865);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8865/');
 await pg.waitForFunction(()=>typeof DEZB!=='undefined'&&typeof DET!=='undefined');

 const da=await pg.evaluate(()=>{
  const T=DET.find(x=>x.id==='de-zweibedeutung');
  const infinitive=[...new Set(DEZB.map(e=>e[0]))];
  const ohnePartner=DEZB.filter(e=>!zbPartner(e)).map(e=>e[0]);
  const scharf=DEZB.filter(e=>e.slice(2).some(f=>/ß/.test(f))).map(e=>e[0]);
  const schief=DEZB.filter(e=>e.slice(2).some(f=>!/^[a-zäöü]+$/.test(f))).map(e=>e[0]);
  /* Die vier Formen eines Paares muessen voneinander verschieden sein,
     sonst faellt ein Ablenker mit der richtigen Antwort zusammen. */
  const unscharf=[];
  for(const e of DEZB){const a=zbPartner(e);if(!a)continue;
   const v=[e[2],a[2],e[3],a[3]];
   if(new Set(v).size!==4)unscharf.push(e[0]+' ('+e[1]+'): '+v.join('/'));}
  return {da:!!T,jahr:T?T.y:null,anzahl:DEZB.length,verben:infinitive.length,
   ohnePartner,scharf,schief,unscharf};});
 pruef('Das Thema steht im Deutsch-Modul',da.da===true);
 pruef('Es liegt in Klasse 7',da.jahr===7,da.jahr);
 pruef('17 Eintraege aus der zweiten Tabelle',da.anzahl===17,da.anzahl);
 pruef('Neun Verben, acht davon mit zwei Bedeutungen',da.verben===9,da.verben);
 pruef('Nur waegen steht ohne Partner',da.ohnePartner.join()==='wägen',da.ohnePartner.join());
 pruef('Kein scharfes s in den Formen',da.scharf.length===0,da.scharf.join(', '));
 pruef('Jede Form ist ein kleingeschriebenes Wort',da.schief.length===0,da.schief.join(', '));
 pruef('Die vier Formen eines Paares sind unterscheidbar',da.unscharf.length===0,da.unscharf.join(' | '));

 const z=await pg.evaluate(()=>{
  const T=DET.find(x=>x.id==='de-zweibedeutung');
  const raus=[];
  for(const spr of ['de','en','fr']){
   S.lang=spr;
   for(let lv=1;lv<=3;lv++) for(let n=0;n<150;n++){
    let it;try{it=T.g(lv);}catch(e){raus.push({spr,lv,fehler:e.message});continue;}
    const p=String(it.prompt||'');
    /* «haengen (etwas aufhaengen)» aus dem Text lesen */
    /* Franzoesisch setzt Leerzeichen in die Anfuehrungszeichen. */
    const m=p.match(/«\s*([^»(]+)\(([^)]*)\)\s*»/);
    const eintrag={spr,lv,p,typ:it.type,
     opt:it.options||null,
     korrekt:it.options?it.options[(it.correct||[0])[0]]:null,
     antwort:it.answer!==undefined?String(it.answer):null,
     schritte:(it.steps||[]).join(' ')};
    if(m){const inf=m[1].trim(),bed=m[2].trim();
     const e=DEZB.find(x=>x[0]===inf&&x[1]===bed);
     eintrag.eintrag=e||null;eintrag.inf=inf;eintrag.bed=bed;
     if(e){const a=zbPartner(e);eintrag.partner=a?{p:a[2],pp:a[3],pr:a[4]}:null;
      eintrag.soll={p:e[2],pp:e[3],pr:e[4]};}}
    raus.push(eintrag);}}
  S.lang='de';return raus;});

 pruef('Keine Ziehung wirft einen Fehler',z.filter(x=>x.fehler).length===0,
  (z.find(x=>x.fehler)||{}).fehler);
 pruef('Jede Frage nennt Verb und Bedeutung',z.filter(x=>!x.fehler&&!x.eintrag).length===0,
  JSON.stringify((z.find(x=>!x.fehler&&!x.eintrag)||{}).p));
 pruef('Jede genannte Bedeutung steht so in der Liste',
  z.filter(x=>x.inf&&!x.eintrag).length===0,
  JSON.stringify((z.find(x=>x.inf&&!x.eintrag)||{}).p));

 /* ---------- Stufe 1: Auswahl, vier Antworten, Praeteritum der genannten Bedeutung ---------- */
 const s1=z.filter(x=>x.lv===1&&x.eintrag);
 pruef('Stufe 1 fragt immer mit Auswahl',s1.every(x=>x.typ==='single'),
  (s1.find(x=>x.typ!=='single')||{}).typ);
 pruef('Stufe 1 bietet vier Antworten',s1.every(x=>x.opt&&x.opt.length===4),
  JSON.stringify((s1.find(x=>!x.opt||x.opt.length!==4)||{}).opt));
 const s1falsch=s1.filter(x=>x.korrekt!==x.soll.p);
 pruef('Stufe 1: die richtige Antwort ist das Praeteritum dieser Bedeutung',
  s1falsch.length===0,JSON.stringify((s1falsch[0]||{}).p));
 const s1partner=s1.filter(x=>x.partner&&x.opt.indexOf(x.partner.p)<0);
 pruef('Stufe 1 stellt die Form der anderen Bedeutung daneben',s1partner.length===0,
  JSON.stringify((s1partner[0]||{}).opt));
 pruef('Stufe 1 zieht nur Verben mit Partner',s1.every(x=>x.partner),
  (s1.find(x=>!x.partner)||{}).inf);

 /* ---------- Stufe 2: Praeteritum oder Du-Form, nie die Form des Partners ---------- */
 const s2=z.filter(x=>x.lv===2&&x.eintrag);
 const s2falsch=s2.filter(x=>x.antwort!==x.soll.p&&x.antwort!==x.soll.pr);
 pruef('Stufe 2 verlangt Praeteritum oder Du-Form dieser Bedeutung',s2falsch.length===0,
  JSON.stringify((s2falsch[0]||{})));
 const s2verwechselt=s2.filter(x=>x.partner&&x.antwort===x.partner.p&&x.antwort!==x.soll.p);
 pruef('Stufe 2 verlangt nie die Form der anderen Bedeutung',s2verwechselt.length===0,
  JSON.stringify((s2verwechselt[0]||{}).p));
 const duFragen=s2.filter(x=>x.antwort===x.soll.pr&&x.soll.pr!==x.soll.p);
 pruef('Die Du-Form wird nur dort gefragt, wo sie sich unterscheidet',
  duFragen.every(x=>x.partner&&x.partner.pr!==x.soll.pr),
  JSON.stringify((duFragen.find(x=>x.partner&&x.partner.pr===x.soll.pr)||{}).p));

 /* ---------- Stufe 3: beide Formen, auch waegen ---------- */
 const s3=z.filter(x=>x.lv===3&&x.eintrag);
 const s3falsch=s3.filter(x=>x.antwort!==x.soll.p+' – '+x.soll.pp);
 pruef('Stufe 3 verlangt Praeteritum und Partizip dieser Bedeutung',s3falsch.length===0,
  JSON.stringify((s3falsch[0]||{}).antwort));
 pruef('waegen kommt auf Stufe 3 vor',s3.some(x=>x.inf==='wägen'),
  s3.filter(x=>x.inf==='wägen').length);

 pruef('Kein scharfes s in Fragen und Schritten',
  z.filter(x=>/ß/.test(x.p+x.schritte)).length===0,
  (z.find(x=>/ß/.test(x.p+x.schritte))||{}).p);
 pruef('Keine Seitenfehler',perr.length===0,perr.slice(0,2).join(' | '));

 for(const [s,n,x] of aus)console.log(s,n,x);
 const fehler=aus.filter(x=>x[0]==='FAIL').length;
 console.log(fehler?('FEHLER: '+fehler):('Alles gut: '+aus.length+' Pruefungen'));
 await b.close();srv.close();process.exit(fehler?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
