/* Finger oder Stift: der gewaehlte Knopf muss hervorgehoben sein, und die
   Wahl muss das Verhalten auf dem Blatt tatsaechlich aendern. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':'application/octet-stream'});
 s.end(fs.readFileSync(f));}).listen(8799);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:900,height:900},hasTouch:true,isMobile:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8799/');
 await pg.waitForFunction(()=>typeof scratchPad==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  try{localStorage.removeItem('spitz.padfinger');}catch(_){}
  pruef('Gerät gilt als Tippgerät',padTouchDa()===true);
  const pad=scratchPad({height:300});document.body.append(pad.el);
  const kn=k=>pad.el.querySelector('button[data-k="'+k+'"]');
  const fB=kn('finger'), pB=kn('penonly');
  pruef('Beide Knöpfe da',!!fB&&!!pB,fB&&fB.textContent.trim()+' / '+(pB&&pB.textContent.trim()));
  if(!fB||!pB)return aus;
  const hell=e=>!!e.style.background&&e.style.background!=='';
  pruef('Finger ist voreingestellt und hervorgehoben',hell(fB)&&!hell(pB));
  pruef('Zustand für Vorlesegeräte gesetzt',fB.getAttribute('aria-pressed')==='true'
   &&pB.getAttribute('aria-pressed')==='false');

  pB.click();
  pruef('Nach Umschalten ist Nur Stift hervorgehoben',hell(pB)&&!hell(fB));
  pruef('Zustand mit umgeschaltet',pB.getAttribute('aria-pressed')==='true'
   &&fB.getAttribute('aria-pressed')==='false');
  pruef('Wahl gemerkt',padFingerGet()===false,String(padFingerGet()));

  fB.click();
  pruef('Zurück auf Finger',hell(fB)&&!hell(pB)&&padFingerGet()===true);

  /* Die Werkzeugwahl bleibt davon unberuehrt */
  const stift=kn('pen'), radier=kn('eraser');
  pruef('Stift als Werkzeug weiter hervorgehoben',hell(stift)&&!hell(radier));
  radier.click();
  pruef('Radierer übernimmt die Hervorhebung',hell(radier)&&!hell(stift));
  pruef('Werkzeugwahl ändert die Fingerwahl nicht',hell(fB)&&!hell(pB));
  stift.click();

  /* Wirkung auf dem Blatt */
  const cv=pad.el.querySelector('canvas');
  /* Synthetische Zeiger lassen sich nicht einfangen; die App ruft
     setPointerCapture. Fuer die Pruefung wird das stillgelegt. */
  cv.setPointerCapture=()=>{};cv.releasePointerCapture=()=>{};
  Object.defineProperty(cv,'getBoundingClientRect',{value:()=>({left:0,top:0,width:860,height:1200})});
  let zid=20;
  const zeichne=(typ)=>{const id=++zid;
   const ev=(tt,o)=>cv.dispatchEvent(new PointerEvent(tt,Object.assign(
    {bubbles:true,pointerId:id,pointerType:typ,pressure:.5},o)));
   ev('pointerdown',{clientX:40,clientY:40});
   for(let i=1;i<=8;i++)ev('pointermove',{clientX:40+i*7,clientY:40+i*4});
   ev('pointerup',{clientX:96,clientY:72});};
  const leeren=()=>{const c=kn('clear');if(c)c.click();};

  leeren();zeichne('touch');
  pruef('Mit Finger wird geschrieben',!pad.isEmpty());
  leeren();pB.click();zeichne('touch');
  pruef('Auf Nur Stift schreibt der Finger nicht',pad.isEmpty());
  leeren();zeichne('pen');
  pruef('Der Stift schreibt weiterhin',!pad.isEmpty());
  leeren();fB.click();
  pad.el.remove();
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
