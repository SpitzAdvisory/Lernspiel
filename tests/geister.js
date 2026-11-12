/* Sichtbarkeit der Geister, gemessen statt geschaetzt.
   Urs meldete am 12.11.2026 zum dritten Mal, die Geister seien zu
   schwer zu erkennen. Zweimal war die Deckkraft erhoeht worden, zweimal
   blieb die Klage. Seither traegt jeder Geist einen Schein, und dieser
   Test misst nach: der hellste Punkt der Gestalt gegen einen Fleck
   Hintergrund, der von jedem Geist weit genug weg liegt. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8872);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const MINDEST=3.0;   /* uebliche Untergrenze fuer ein grafisches Objekt */
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8872/');
 await pg.waitForFunction(()=>typeof SPIELE!=='undefined'&&SPIELE.some(s=>s.id==='geister'));

 const r=await pg.evaluate(async(MIND)=>{
  const sp=SPIELE.find(s=>s.id==='geister');
  const lum=(d,i)=>0.2126*d[i]/255+0.7152*d[i+1]/255+0.0722*d[i+2]/255;
  const out=[];
  for(let st=1;st<=5;st++){
   const platz=document.createElement('div');
   platz.style.cssText='width:420px';document.body.appendChild(platz);
   const F=sp.bau(platz,{stufe:st,fertig:()=>{}});
   const cv=platz.querySelector('canvas');
   await new Promise(r=>setTimeout(r,1500));
   const z=F.zustand();
   const c=cv.getContext('2d');
   const dpr=cv.width/cv.getBoundingClientRect().width;
   /* Ein Punkt gilt als Hintergrund, wenn kein Geist naeher als 40 liegt. */
   const weg=(x,y)=>z.geister.every(g=>Math.hypot(g.x-x,g.y-y)>40);
   const proben=[];
   for(const g of z.geister){
    const px=Math.round(g.x*dpr), py=Math.round(g.y*dpr);
    if(px<20||py<20||px>cv.width-20||py>cv.height-20)continue;
    /* Hellster Punkt der Gestalt */
    const gd=c.getImageData(px-15,py-15,30,30).data;
    let hell=0;for(let i=0;i<gd.length;i+=4)hell=Math.max(hell,lum(gd,i));
    /* Hintergrund: der Ring direkt um die Gestalt, ausserhalb ihres
       Scheins. Das ist der Vergleich, den das Auge zieht - ein Fleck
       am anderen Bildrand sagt nichts darueber, ob die Gestalt
       auffaellt. Punkte, die zu einem anderen Geist gehoeren, bleiben
       draussen. */
    const ring=[];
    for(let a=0;a<360;a+=15){
     const rad=a*Math.PI/180;
     const bx=g.x+Math.cos(rad)*48, by=g.y+Math.sin(rad)*48;
     if(bx<6||by<6||bx>cv.width/dpr-6||by>cv.height/dpr-6)continue;
     if(!weg(bx,by))continue;
     const bd=c.getImageData(Math.round(bx*dpr),Math.round(by*dpr),2,2).data;
     let sum=0,n=0;for(let i=0;i<bd.length;i+=4){sum+=lum(bd,i);n++;}
     ring.push(sum/(n||1));}
    if(ring.length<6)continue;
    ring.sort((x,y)=>x-y);
    const hg=ring[Math.floor(ring.length/2)];   /* Median, gegen Ausreisser */
    proben.push({hell:+hell.toFixed(3),grund:+hg.toFixed(3),
     v:+((hell+0.05)/(hg+0.05)).toFixed(2)});}
   F.ende&&F.ende();platz.remove();
   out.push({stufe:st,gemessen:proben.length,
    schlechtestes:proben.length?Math.min.apply(null,proben.map(p=>p.v)):null,
    proben});}
  return out;},MINDEST);

 for(const x of r){
  pruef('Stufe '+x.stufe+': mindestens ein Geist gemessen',x.gemessen>0,x.gemessen);
  if(!x.gemessen)continue;
  pruef('Stufe '+x.stufe+': jeder Geist hebt sich mit '+MINDEST+':1 ab',
   x.schlechtestes>=MINDEST,
   'schlechtestes '+x.schlechtestes+' | '+x.proben.map(p=>p.v).join(', '));}
 /* Die Helligkeit darf mit der Stufe sinken, aber nicht unter die Schwelle. */
 const alle=r.filter(x=>x.gemessen).map(x=>x.schlechtestes);
 pruef('Auch die hoechste Stufe bleibt ueber der Schwelle',
  alle.length===5&&Math.min.apply(null,alle)>=MINDEST,JSON.stringify(alle));
 pruef('Keine Seitenfehler',perr.length===0,perr.slice(0,2).join(' | '));
 for(const [s,n,x] of aus)console.log(s,n,x);
 const fehler=aus.filter(x=>x[0]==='FAIL').length;
 console.log(fehler?('FEHLER: '+fehler):('Alles gut: '+aus.length+' Pruefungen'));
 await b.close();srv.close();process.exit(fehler?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
