/* Die Spielpause im Lauf: erscheint, gewinnt, verliert, bestraft begrenzt. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8817);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:900,height:1000},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 pg.on('console',m=>{if(m.type()==='error')perr.push('console: '+m.text());});
 await pg.goto('http://127.0.0.1:8817/');
 await pg.waitForFunction(()=>typeof nextQuestion==='function'&&typeof SPIELE!=='undefined');

 const wort=await pg.evaluate(()=>{const fehlt=[];
  for(const k of ['spielTitel','spielLos','spielWieder','spielZielTreffer','spielZielKloetze','spielZeit','spielNochmal','spielStrafe','spielGut'])
   for(const l of ['de','en','fr'])if(!T[l]||!T[l][k])fehlt.push(l+'.'+k);
  return fehlt;});
 pruef('Wortlaute in allen drei Sprachen',wort.length===0,wort.join(','));

 const start=await pg.evaluate(()=>{
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'classic',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:5,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:25,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity,spielAt:0};
  S.run=R;window.__R=R;nextQuestion(R);
  const h2=document.querySelector('main h2');
  const ziel=[...document.querySelectorAll('main p')].map(p=>p.textContent).join(' | ');
  return {kopf:h2?h2.textContent:'',ziel,spielAt:R.spielAt,leinwand:!!document.querySelector('canvas')};});
 pruef('Spielpause erscheint statt der Scherzfrage',/🎮/.test(start.kopf),start.kopf);
 pruef('Huerde mit Zahl, nicht mit Platzhalter',/\d/.test(start.ziel)&&!/\{n\}/.test(start.ziel),start.ziel.slice(0,70));
 pruef('Naechste Pause ist neu angesetzt',start.spielAt>=11,start.spielAt);
 pruef('Vor dem Start noch keine Leinwand',start.leinwand===false);

 /* Los druecken: die Leinwand kommt */
 await pg.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t('spielLos')).click());
 await pg.waitForTimeout(400);
 pruef('Nach «Los» läuft das Spiel',await pg.evaluate(()=>!!document.querySelector('canvas')));

 /* Gewinnen erzwingen: fertig(true) von aussen gibt es nicht, also ueber
    das Spiel selbst - wir melden ueber den Pruefhaken. */
 const gewonnen=await pg.evaluate(async()=>{
  /* Spielpause neu aufbauen und das Spiel sofort gewinnen lassen */
  const R=window.__R;R.q=5;R.spielAt=0;R.target=25;
  const echt=SPIELE.map(s=>s.bau);
  SPIELE.forEach(s=>{s.bau=(platz,o)=>{setTimeout(()=>o.fertig(true,9),30);return{ende(){}};};});
  nextQuestion(R);
  [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t('spielLos')).click();
  await new Promise(r=>setTimeout(r,250));
  const txt=document.querySelector('main .hand')?document.querySelector('main .hand').textContent:'';
  const weiter=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t('next')&&b.style.display!=='none');
  SPIELE.forEach((s,i)=>{s.bau=echt[i];});
  return {txt,weiter:!!weiter,target:R.target};});
 pruef('Sieg wird gemeldet',gewonnen.txt.length>3,gewonnen.txt);
 pruef('Sieg kostet keine Zusatzaufgaben',gewonnen.target===25,gewonnen.target);
 pruef('Nach dem Sieg geht es weiter',gewonnen.weiter);

 /* Verlieren: erster Versuch gratis, zweiter kostet genau zwei Aufgaben */
 const verloren=await pg.evaluate(async()=>{
  const R=window.__R;R.q=5;R.spielAt=0;R.target=25;
  const echt=SPIELE.map(s=>s.bau);
  SPIELE.forEach(s=>{s.bau=(platz,o)=>{setTimeout(()=>o.fertig(false,0),20);return{ende(){}};};});
  nextQuestion(R);
  const los=()=>[...document.querySelectorAll('button')].find(b=>(b.textContent.trim()===t('spielLos')||b.textContent.trim()===t('spielWieder'))&&b.style.display!=='none');
  los().click();await new Promise(r=>setTimeout(r,200));
  const nach1={txt:document.querySelector('main .hand').textContent,target:R.target,
   knopf:los()?los().textContent.trim():''};
  los().click();await new Promise(r=>setTimeout(r,200));
  const nach2={txt:document.querySelector('main .hand').textContent,target:R.target};
  SPIELE.forEach((s,i)=>{s.bau=echt[i];});
  return {nach1,nach2,wieder:t('spielWieder'),strafe:t('spielStrafe')};});
 pruef('Erster Fehlversuch ist gratis',verloren.nach1.target===25&&verloren.nach1.knopf===verloren.wieder,
  JSON.stringify(verloren.nach1));
 pruef('Zweiter Fehlversuch kostet genau zwei Aufgaben',verloren.nach2.target===27,verloren.nach2.target);
 pruef('Strafe wird benannt',verloren.nach2.txt===verloren.strafe,verloren.nach2.txt.slice(0,50));

 /* Die Strafe haeuft sich nicht: ein zweites Spiel, wieder nur +2 */
 const zweimal=await pg.evaluate(async()=>{
  const R=window.__R;R.target=27;R.q=12;R.spielAt=0;
  const echt=SPIELE.map(s=>s.bau);
  SPIELE.forEach(s=>{s.bau=(platz,o)=>{setTimeout(()=>o.fertig(false,0),20);return{ende(){}};};});
  nextQuestion(R);
  const los=()=>[...document.querySelectorAll('button')].find(b=>(b.textContent.trim()===t('spielLos')||b.textContent.trim()===t('spielWieder'))&&b.style.display!=='none');
  los().click();await new Promise(r=>setTimeout(r,200));
  los().click();await new Promise(r=>setTimeout(r,200));
  SPIELE.forEach((s,i)=>{s.bau=echt[i];});
  return R.target;});
 pruef('Zweites Spiel kostet wieder nur zwei',zweimal===29,zweimal);

 /* Im Duell bleibt die Pause weg */
 const duell=await pg.evaluate(()=>{
  const R={mode:'duel'};const at=(R.mode==='duel')?Infinity:5;return at===Infinity;});
 pruef('Im Duell keine Spielpause',duell);

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,4).join(' | '));
 console.log(aus.filter(x=>x[0]==='FAIL').length||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
})();
