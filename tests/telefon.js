/* Das Telefon: schmaler Schirm, grosse Finger. Geprueft wird bei 390 Pixel
   Breite gegen 1000 Pixel - dieselbe Datei, zwei Verhalten. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8849);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

async function schirm(b,w,h){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<500});
 const pg=await ctx.newPage();
 await pg.goto('http://127.0.0.1:8849/');
 await pg.waitForFunction(()=>typeof viewRunSetup==='function');
 await pg.evaluate(()=>{S.lang='de';
  window.__P={id:'pX',name:'Felix',avatar:'🦊',unlockAll:true,pen:true};
  S.profiles=S.profiles.filter(p=>p.id!=='pX').concat([window.__P]);computeState();});
 return {ctx,pg};
}

(async()=>{
 const b=await chromium.launch();
 const perr=[];

 /* ---------- Wortlaute ---------- */
 {
  const {ctx,pg}=await schirm(b,390,844);
  const fehlt=await pg.evaluate(()=>{const f=[];
   for(const k of ['notesAndSources','topicsOpen'])
    for(const l of ['de','en','fr'])if(!T[l]||!T[l][k])f.push(l+'.'+k);
   return f;});
  pruef('Wortlaute in allen drei Sprachen',fehlt.length===0,fehlt.join(','));
  const platz=await pg.evaluate(()=>/\{n\}/.test(T.de.topicsOpen)&&/\{m\}/.test(T.de.topicsOpen));
  pruef('Die Zusammenfassung nennt Zahl und Gesamtzahl',platz);
  await ctx.close();
 }

 /* ---------- Schmaler Schirm ---------- */
 {
  const {ctx,pg}=await schirm(b,390,844);
  pg.on('pageerror',e=>perr.push(e.message));
  const r=await pg.evaluate(()=>{
   viewRunSetup(window.__P,MATH_GAME);
   const d=document.documentElement;
   const notiz=document.querySelector('details.notiz:not(.themen)');
   const themen=document.querySelector('details.themen');
   const klein=[...document.querySelectorAll('main button')]
    .filter(e=>{const x=e.getBoundingClientRect();return x.width>0&&(x.width<44||x.height<44);})
    .map(e=>e.textContent.trim().slice(0,14));
   return {quer:d.scrollWidth>d.clientWidth,hoch:d.scrollHeight,
    notiz:!!notiz,notizZu:notiz?!notiz.hasAttribute('open'):null,
    themen:!!themen,themenZu:themen?!themen.hasAttribute('open'):null,
    summe:themen?themen.querySelector('summary').textContent:'',
    klein};});
  pruef('Kein Querlauf auf dem Startschirm',r.quer===false);
  pruef('Hinweis und Quellen sind eingeklappt',r.notiz&&r.notizZu===true,
   'vorhanden:'+r.notiz+' zu:'+r.notizZu);
  pruef('Die Themenliste ist eingeklappt',r.themen&&r.themenZu===true,
   'vorhanden:'+r.themen+' zu:'+r.themenZu);
  pruef('Die Zusammenfassung zeigt echte Zahlen',
   /\d+\D+\d+/.test(r.summe)&&!/\{/.test(r.summe),r.summe);
  pruef('Kein Tippziel unter 44 Pixel',r.klein.length===0,r.klein.join(' | '));
  pruef('Die Seite ist kuerzer als drei Bildschirme',r.hoch<3*844,r.hoch+'px');

  /* Aufklappen bringt die Themen zurueck */
  const auf=await pg.evaluate(()=>{
   const d=document.querySelector('details.themen');d.open=true;
   return document.querySelectorAll('details.themen .topicrow').length;});
  pruef('Aufgeklappt stehen die Themen wieder da',auf>=10,auf);
  await ctx.close();
 }

 /* ---------- Breiter Schirm: unveraendert ---------- */
 {
  const {ctx,pg}=await schirm(b,1000,900);
  const r=await pg.evaluate(()=>{
   viewRunSetup(window.__P,MATH_GAME);
   const notiz=document.querySelector('details.notiz:not(.themen)');
   return {notizOffen:notiz?notiz.hasAttribute('open'):null,
    themenDetails:!!document.querySelector('details.themen'),
    reihen:document.querySelectorAll('.topicrow').length};});
  pruef('Auf dem iPad stehen Hinweis und Quellen offen',r.notizOffen===true,r.notizOffen);
  pruef('Auf dem iPad bleibt die Themenliste ohne Klappe',r.themenDetails===false);
  pruef('Und die Themen stehen direkt auf der Seite',r.reihen>=10,r.reihen);
  await ctx.close();
 }

 /* ---------- Das Gitter holt das angetippte Kaestchen in den Blick ------ */
 {
  const {ctx,pg}=await schirm(b,390,844);
  pg.on('pageerror',e=>perr.push(e.message));
  const r=await pg.evaluate(async()=>{
   const R={id:'t',players:[window.__P],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
    started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
    level:2,up:0,down:0,q:0,masteries:{},timer:null,ended:false,target:12,retry:[],extra:0,
    gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity,spielAt:Infinity};
   S.run=R;const tp=mtopic('m4-geteiltschriftlich');
   let it=null;for(let k=0;k<40;k++){it=genItem(tp,3,{});if(it&&it.gitter)break;}
   const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
   await new Promise(r=>setTimeout(r,350));
   const rahmen=document.querySelector('.zscroll');
   const kaesten=[...document.querySelectorAll('.zbox')];
   const rollt=rahmen.scrollWidth>rahmen.clientWidth+1;
   const kante=rahmen.className;
   /* Das letzte Kaestchen liegt am weitesten rechts. */
   /* Das letzte Kaestchen im Dokument ist das unterste, nicht das
      rechteste: die Treppe laeuft zeilenweise. Gesucht ist das am
      weitesten rechts liegende. */
   let letzt=kaesten[0];
   for(const k of kaesten)
    if(k.getBoundingClientRect().right>letzt.getBoundingClientRect().right)letzt=k;
   /* Erst ganz nach links rollen, damit der verdeckte Fall wirklich
      eintritt - sonst beweist die Pruefung nichts. */
   rahmen.scrollLeft=0;
   await new Promise(r=>setTimeout(r,120));
   const vorher=letzt.getBoundingClientRect();
   const rb=rahmen.getBoundingClientRect();
   const sichtbarVorher=vorher.right<=rb.right+1&&vorher.left>=rb.left-1;
   letzt.focus();
   await new Promise(r=>setTimeout(r,250));
   const nach=letzt.getBoundingClientRect();
   const rb2=rahmen.getBoundingClientRect();
   const sichtbarNachher=nach.right<=rb2.right+1&&nach.left>=rb2.left-1;
   return {rollt,kante,anzahl:kaesten.length,sichtbarVorher,sichtbarNachher,
    links:Math.round(rahmen.scrollLeft)};});
  pruef('Das Gitter rollt seitlich, die Seite nicht',r.rollt===true||r.sichtbarVorher===true,
   'rollt:'+r.rollt);
  if(r.rollt){
   pruef('Eine Kante weist auf den verdeckten Teil hin',/mehrRechts|mehrLinks/.test(r.kante),r.kante);
   pruef('Ganz links gerollt liegt das letzte Kaestchen ausserhalb',
    r.sichtbarVorher===false,r.sichtbarVorher);
   pruef('Das angetippte Kaestchen kommt in den Blick',r.sichtbarNachher===true,
    'vorher:'+r.sichtbarVorher+' nachher:'+r.sichtbarNachher+' Rollstand:'+r.links);
  }else{
   pruef('Alle Kaestchen sind ohne Rollen sichtbar',r.sichtbarVorher===true);
  }
  await ctx.close();
 }

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
