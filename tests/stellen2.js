/* Stifteingabe und Erkennung: Striche, Streifenbild, Zuordnung. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8815);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1100,height:1300},hasTouch:true,deviceScaleFactor:2});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8815/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function');

 /* Erkennung ersetzen: gibt die Sollziffern zurueck, merkt sich die Bilder. */
 await pg.evaluate(()=>{
  window.__bilder=[];window.__soll=[];
  window.leseHandschrift=async(dataUrl)=>{window.__bilder.push(dataUrl.length);
   return window.__soll.splice(0,window.__sollProAufruf||window.__soll.length).join(' ');};
 });

 const vor=await pg.evaluate(()=>{
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const tp=mtopic('m3-stellen');const it=genItem(tp,2,{});
  const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
  const G=it.gitter;const soll=[];
  for(let i=0;i<G.breite-1;i++)soll.push(G.ueb[i]);
  for(let i=0;i<G.breite;i++)if(G.erg[i]!==null)soll.push(G.erg[i]);
  return {aufgabe:G.a+' '+G.op+' '+G.b+' = '+G.res,soll};
 });
 console.log('Aufgabe:',vor.aufgabe,'| Soll:',JSON.stringify(vor.soll));

 /* Mit dem Stift in jedes Kaestchen kritzeln */
 const kaesten=await pg.$$('.zbox');
 for(const k of kaesten){
  const r=await k.boundingBox();
  await pg.mouse.move(r.x+r.width*0.35,r.y+r.height*0.25);
  await pg.mouse.down();
  await pg.mouse.move(r.x+r.width*0.65,r.y+r.height*0.5,{steps:5});
  await pg.mouse.move(r.x+r.width*0.4,r.y+r.height*0.78,{steps:5});
  await pg.mouse.up();
 }
 const nachStrich=await pg.evaluate(()=>{
  const cv=[...document.querySelectorAll('.zcv')];
  /* Ein beschriebenes Kaestchen hat nicht mehr nur weisse Punkte */
  let bemalt=0;
  for(const c of cv){const g=c.getContext('2d');const d=g.getImageData(0,0,c.width,c.height).data;
   for(let i=3;i<d.length;i+=4){if(d[i]>10){bemalt++;break;}}}
  return {felder:cv.length,bemalt};
 });
 console.log((nachStrich.bemalt===nachStrich.felder?'OK  ':'FAIL'),
  'Striche in allen Kästchen sichtbar',nachStrich.bemalt+'/'+nachStrich.felder);

 /* Erkennung: alle Ziffern in einem Aufruf */
 await pg.evaluate(soll=>{window.__soll=soll.filter(x=>x!=null).map(String);
  /* leere Übertragskästchen wurden trotzdem bekritzelt - für den Test
     zählt nur, dass die Zuordnung positionsgenau läuft */
  window.__soll=soll.map(x=>x==null?'1':String(x));},vor.soll);
 await pg.evaluate(()=>{const b=[...document.querySelectorAll('button')]
   .find(x=>/^(Prüfen|Check|Vérifier)/.test(x.textContent.trim()));b.click();});
 await pg.waitForTimeout(600);
 const nach=await pg.evaluate(()=>({
  aufrufe:window.__bilder.length,bildGroesse:window.__bilder[0]||0,
  gruen:document.querySelectorAll('.zbox.ok').length,
  rot:document.querySelectorAll('.zbox.bad').length,
  felder:document.querySelectorAll('.zbox').length}));
 console.log((nach.aufrufe===1?'OK  ':'FAIL'),'Ein einziger Erkennungsaufruf für alle Kästchen','Aufrufe: '+nach.aufrufe);
 console.log((nach.bildGroesse>2000?'OK  ':'FAIL'),'Streifenbild erzeugt','Datenlänge '+nach.bildGroesse);
 console.log('   Bewertung: grün '+nach.gruen+', rot '+nach.rot+' von '+nach.felder);

 await pg.screenshot({path:'/tmp/claude-0/wtest/stellen.png',fullPage:false});
 if(perr.length)console.log('SEITENFEHLER:',perr.join(' | '));
 await b.close();srv.close();
})();
