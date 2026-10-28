const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end('x');}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8787);
let fails=0;const ok=(n,c,i)=>{if(!c)fails++;console.log((c?'  OK  ':'  FAIL')+'  '+n+(i?'   '+i:''));};
(async()=>{
 const b=await chromium.launch();
 for(const touch of [false,true]){
  const ctx=await b.newContext({viewport:{width:900,height:1000},hasTouch:touch,isMobile:touch});
  const pg=await ctx.newPage();
  const perr=[];pg.on('pageerror',e=>perr.push(e.message));
  await pg.goto('http://127.0.0.1:8787/');
  await pg.waitForFunction(()=>typeof tastatur==='function');
  const r=await pg.evaluate(async()=>{
   const out={touchErkannt:padTouchDa()};
   const tp=FRTOPICS.find(x=>x.dd);
   let it=null;for(let i=0;i<200&&!it;i++){const x=tp.g(2);if(x&&x.type==='input')it=x;}
   if(!it)return Object.assign(out,{fehler:'keine Schreibaufgabe gefunden'});
   const R={id:'t',players:[TEST_PLAYER],game:FRV_GAME,mode:'learn',diff:'medium',adaptive:false,
    started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
    level:2,up:0,down:0,q:0,masteries:{test:{}},timer:null,ended:false,target:99,retry:[],extra:0,
    gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
   S.run=R;const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);
   const inp=document.querySelector('main input.answerbox');
   const tast=document.querySelector('main .tast');
   out.feldDa=!!inp; out.tastDa=!!tast;
   out.tastSichtbar=tast?tast.style.display!=='none':false;
   await new Promise(r=>setTimeout(r,80));   /* der Fokus kommt verzoegert */
   out.fokusAutomatisch=document.activeElement===inp;
   if(!tast)return out;
   const tasten=[...tast.querySelectorAll('.key')];
   out.anzahlTasten=tasten.length;
   /* tippen */
   const tip=(z)=>{const k=tasten.find(x=>x.textContent===z);if(k)k.click();};
   'bonjour'.split('').forEach(tip);
   out.getippt=inp.value;
   /* Grossschreibung */
   const shift=tasten.find(x=>x.textContent==='⇧');
   if(shift)shift.click();
   out.grossZeichen=tasten.find(x=>x.textContent==='B')?'B':'(keine)';
   tip('B');
   out.nachShift=inp.value;
   if(shift)shift.click();
   /* Leerzeichen und Loeschen */
   const leer=tasten.find(x=>x.textContent==='␣'); if(leer)leer.click();
   const del=tasten.find(x=>x.textContent==='⌫');
   if(del){del.click();del.click();}
   out.nachLoeschen=inp.value;
   /* Akzente danach noch bedienbar? */
   const acc=document.querySelector('main .accents .key');
   if(acc){acc.click();out.nachAkzent=inp.value;}
   /* Umschalter */
   const um=[...document.querySelectorAll('main .card button')].find(x=>/tastatur|keyboard|clavier/i.test(x.textContent));
   if(um){const vorher=tast.style.display;
    um.click();out.umschaltGeaendert=tast.style.display!==vorher;
    um.click();out.wiederWieVorher=tast.style.display===vorher;}
   return out;
  });
  console.log('\n=== '+(touch?'Beruehrungsgeraet (iPad)':'Maus und Tastatur')+' ===');
  ok('Touch richtig erkannt', r.touchErkannt===touch, 'padTouchDa='+r.touchErkannt);
  ok('Schreibfeld da', r.feldDa);
  ok('Eigene Tastatur eingebaut', r.tastDa, r.anzahlTasten+' Tasten');
  ok('Sichtbar genau dort, wo sie gebraucht wird', r.tastSichtbar===touch, 'sichtbar='+r.tastSichtbar);
  ok('Kein Fokus von selbst auf dem Tablet', touch?!r.fokusAutomatisch:r.fokusAutomatisch, 'Fokus='+r.fokusAutomatisch);
  ok('Tippen schreibt ins Feld', r.getippt==='bonjour', JSON.stringify(r.getippt));
  ok('Umschalttaste macht gross', r.nachShift==='bonjourB', JSON.stringify(r.nachShift));
  ok('Leerzeichen und Loeschen', r.nachLoeschen==='bonjour', JSON.stringify(r.nachLoeschen));
  ok('Akzenttasten weiter bedienbar', (r.nachAkzent||'').length>7, JSON.stringify(r.nachAkzent));
  ok('Umschalter blendet um und zurueck', r.umschaltGeaendert&&r.wiederWieVorher);
  ok('Keine Seitenfehler', perr.length===0, perr.slice(0,2).join(' | '));
  await ctx.close();
 }
 await b.close();srv.close();
 console.log('\n'+(fails?('FEHLER: '+fails):'alles gut'));
 process.exit(fails?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
