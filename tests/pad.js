const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':'audio/mpeg'});s.end(fs.readFileSync(f));}).listen(8796);
let fails=0;
const ok=(n,c,i)=>{if(!c)fails++;console.log((c?'  OK  ':'  FAIL')+'  '+n+(i?'   '+i:''));};
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:900,height:800}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8796/');
 await pg.waitForFunction(()=>typeof scratchPad==='function');
 const r=await pg.evaluate(()=>{
  const pad=scratchPad({height:300});
  document.body.append(pad.el);
  const cv=pad.el.querySelector('canvas'), sc=pad.el.querySelector('.padscroll');
  const out={};
  out.imDom=!!cv&&!!sc;
  out.hoehe=sc.style.height;
  out.knoepfe=[...pad.el.querySelectorAll('button')].map(x=>x.getAttribute('data-k'));
  out.touchDa=padTouchDa();
  cv.setPointerCapture=()=>{};cv.releasePointerCapture=()=>{};
  Object.defineProperty(cv,'getBoundingClientRect',{value:()=>({left:0,top:0,width:860,height:1200})});
  const ev=(t,o)=>cv.dispatchEvent(new PointerEvent(t,Object.assign({bubbles:true,pointerId:1,pressure:.5},o)));
  const strich=(typ,id)=>{const n0=pad.strokes.length;
   ev('pointerdown',{pointerType:typ,pointerId:id,clientX:40,clientY:40});
   for(let i=1;i<=8;i++)ev('pointermove',{pointerType:typ,pointerId:id,clientX:40+i*7,clientY:40+i*4});
   ev('pointerup',{pointerType:typ,pointerId:id,clientX:96,clientY:72});
   return pad.strokes.length-n0;};
  out.maus=strich('mouse',10);
  out.finger=strich('touch',12);          /* vor dem Stift: muss schreiben */
  out.stift=strich('pen',11);
  out.handflaeche=strich('touch',15);     /* gleich nach dem Stift: Handflaeche */
  
  /* Knoepfe */
  const k=n=>pad.el.querySelector('[data-k="'+n+'"]');
  const vor=pad.strokes.length;
  k('undo').click(); out.undo=pad.strokes.length===vor-1;
  k('redo').click(); out.redo=pad.strokes.length===vor;
  k('clear').click(); out.clear=pad.strokes.length===0;
  /* nach dem Leeren wieder zeichnen */
  out.nachClear=strich('mouse',13);
  /* Groesse und Seite */
  const h0=sc.style.height; k('size').click(); out.groesse=sc.style.height!==h0;
  const cvh0=cv.style.height; k('page').click(); out.seite=cv.style.height!==cvh0;
  /* Radierer */
  k('eraser').click();
  const vorR=pad.strokes.length;
  ev('pointerdown',{pointerType:'mouse',pointerId:14,clientX:40,clientY:40});
  ev('pointerup',{pointerType:'mouse',pointerId:14});
  out.radierer=pad.strokes.length<vorR;
  k('pen').click();
  out.datenNachher=!!pad.data()||pad.strokes.length===0;
  pad.el.remove();
  return out;});
 ok('Blatt erscheint im DOM', r.imDom);
 ok('Sichtbare Hoehe gesetzt', /\d+px/.test(r.hoehe||''), r.hoehe);
 ok('Alle Knoepfe da', r.knoepfe.filter(Boolean).length>=7, r.knoepfe.join(',')+'  Touch='+r.touchDa);
 ok('Maus zeichnet', r.maus===1, 'Striche: '+r.maus);
 ok('Stift zeichnet', r.stift===1, 'Striche: '+r.stift);
 ok('FINGER zeichnet', r.finger===1, 'Striche: '+r.finger);
 ok('Handflaeche nach Stift ignoriert', r.handflaeche===0, 'Striche: '+r.handflaeche);
 ok('Undo', r.undo); ok('Redo', r.redo); ok('Leeren', r.clear);
 ok('Zeichnen nach dem Leeren', r.nachClear===1, 'Striche: '+r.nachClear);
 ok('Groesse umschalten', r.groesse);
 ok('Seite anfuegen', r.seite);
 ok('Radierer', r.radierer);
 ok('Keine Seitenfehler', perr.length===0, perr.slice(0,2).join(' | '));
 await b.close();srv.close();
 console.log('\n'+(fails?('FEHLER: '+fails):'alles gut'));
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
