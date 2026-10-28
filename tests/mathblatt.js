/* Das Blatt in einer echten Mathematikaufgabe: schreibt es, und ist genau
   ein Werkzeug hervorgehoben? */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8810);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1000,height:1000},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8810/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const ids=MATH_GAME.gen&&MATH_GAME.gen.topics?MATH_GAME.gen.topics:gameUnits(MATH_GAME);
  let it=null;
  for(const id of ids){const tp=mtopic(id);if(!tp||typeof tp.g!=='function')continue;
   const x=genItem(tp,2,MATH_GAME.gen);if(x&&x.type){it=x;break;}}
  if(!it){pruef('Mathematikaufgabe gefunden',false);return aus;}
  pruef('Mathematikaufgabe gefunden',true,it.type);
  const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);

  const box=document.querySelector('.padbox');
  pruef('Notizblatt vorhanden',!!box);
  if(!box)return aus;
  const kn=k=>box.querySelector('button[data-k="'+k+'"]');
  const stift=kn('pen'), radier=kn('eraser');
  pruef('Beide Werkzeugknöpfe da',!!stift&&!!radier);
  const hg=e=>{const i=e.style.background||'';const c=getComputedStyle(e).backgroundColor;return {inline:i,berechnet:c};};
  const hell=e=>{const c=getComputedStyle(e).backgroundColor;
   return c!=='rgba(0, 0, 0, 0)'&&c!=='transparent';};
  pruef('Nur der Stift ist hervorgehoben',hell(stift)&&!hell(radier),
   'Stift '+JSON.stringify(hg(stift))+' | Radierer '+JSON.stringify(hg(radier)));
  radier.click();
  pruef('Nach Klick nur der Radierer',hell(radier)&&!hell(stift),
   'Stift '+JSON.stringify(hg(stift))+' | Radierer '+JSON.stringify(hg(radier)));
  stift.click();

  /* Schreiben */
  const cv=box.querySelector('canvas');
  cv.setPointerCapture=()=>{};cv.releasePointerCapture=()=>{};
  Object.defineProperty(cv,'getBoundingClientRect',{value:()=>({left:0,top:0,width:860,height:1200})});
  const pad=Q.pad;
  pruef('Blatt am Lauf angehängt',!!pad);
  let id=30;
  const strich=(typ)=>{const i=++id;
   const ev=(tt,o)=>cv.dispatchEvent(new PointerEvent(tt,Object.assign({bubbles:true,pointerId:i,pointerType:typ,pressure:.5},o)));
   ev('pointerdown',{clientX:40,clientY:40});
   for(let k=1;k<=6;k++)ev('pointermove',{clientX:40+k*8,clientY:40+k*5});
   ev('pointerup',{clientX:88,clientY:70});};
  const vorher=pad?pad.strokes.length:0;
  strich('touch');
  pruef('Finger schreibt',pad&&pad.strokes.length>vorher,
   (pad?pad.strokes.length:0)+' Striche');
  const v2=pad.strokes.length;
  strich('pen');
  pruef('Stift schreibt',pad.strokes.length>v2,pad.strokes.length+' Striche');
  const v3=pad.strokes.length;
  strich('mouse');
  pruef('Maus schreibt',pad.strokes.length>v3,pad.strokes.length+' Striche');
  /* Hervorhebung muss auch fuer das Auge eindeutig sein */
  const dunkel=e=>getComputedStyle(e).backgroundColor==='rgb(10, 45, 86)';
  pruef('Gewähltes Werkzeug ist dunkel gefüllt',dunkel(stift)&&!dunkel(radier),
   getComputedStyle(stift).backgroundColor+' / '+getComputedStyle(radier).backgroundColor);
  pruef('Heller Text im gewählten Knopf',getComputedStyle(stift).color==='rgb(255, 255, 255)',
   getComputedStyle(stift).color);

  /* Abgewiesener Finger sagt den Grund */
  const fB=box.querySelector('button[data-k="finger"]'), pB=box.querySelector('button[data-k="penonly"]');
  if(fB&&pB){
   pruef('Finger und Nur Stift nie beide dunkel',!(dunkel(fB)&&dunkel(pB)),
    getComputedStyle(fB).backgroundColor+' / '+getComputedStyle(pB).backgroundColor);
   await new Promise(r=>setTimeout(r,1600));   /* Handflaechen-Fenster abwarten */
   pB.click();
   const zeile=()=>[...box.querySelectorAll('p')].find(p=>p.getAttribute('aria-live')==='polite');
   const vor=pad.strokes.length;
   strich('touch');
   pruef('Auf Nur Stift schreibt der Finger nicht',pad.strokes.length===vor);
   pruef('Der Grund steht da',!!zeile()&&/ausgeschaltet|is off|désactivé/i.test(zeile().textContent),
    zeile()&&zeile().textContent);
   fB.click();
   await new Promise(r=>setTimeout(r,50));
   pruef('Zurück auf Finger löscht den Hinweis',!!zeile()&&zeile().textContent==='');
   const v4=pad.strokes.length;
   strich('touch');
   pruef('Danach schreibt der Finger wieder',pad.strokes.length>v4);
   /* Handflaeche: Stift, dann sofort Finger */
   strich('pen');
   const v5=pad.strokes.length;
   strich('touch');
   pruef('Gleich nach dem Stift gilt der Finger als Handfläche',pad.strokes.length===v5);
   pruef('Auch dafür steht der Grund da',!!zeile()&&/Handfläche|palm|paume/i.test(zeile().textContent),
    zeile()&&zeile().textContent);
  }
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
