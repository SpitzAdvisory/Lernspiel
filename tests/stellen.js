/* Schriftliches Rechnen: Gitter, Kaestchen, Uebertrag, Bewertung. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8814);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1100,height:1200},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8814/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

  /* 1. Das Modell selbst, gegen die Arithmetik */
  let modFehler=0,mitUeb=0;
  for(let k=0;k<5000;k++){
   const plus=Math.random()<.5;
   let a=1+Math.floor(Math.random()*99999),b=1+Math.floor(Math.random()*99999);
   if(!plus&&b>a){const t=a;a=b;b=t;}
   const g=stellenGitter(a,b,plus?'+':'−');
   if(String(plus?a+b:a-b)!==g.erg.filter(d=>d!==null).join(''))modFehler++;
   if(g.ueb.some(x=>x))mitUeb++;
  }
  pruef('Gittermodell stimmt über 5000 Proben',modFehler===0,'Fehler: '+modFehler);
  pruef('Überträge kommen vor',mitUeb>1000,mitUeb+' von 5000');

  /* 2. Erzeugung je Stufe */
  const tp=mtopic('m3-stellen');
  pruef('Thema vorhanden',!!tp&&typeof tp.g==='function');
  if(!tp)return aus;
  for(const lv of [1,2,3]){
   let ohne=0;
   for(let k=0;k<200;k++){const it=genItem(tp,lv,{});
    if(!it||!it.gitter){ohne++;continue;}
    const g=it.gitter;
    const st=Math.max(String(g.a).length,String(g.b).length);
    if(st!==(lv===1?2:lv===2?3:4))ohne++;
    if(lv>=2&&!g.ueb.some(x=>x))ohne++;}
   pruef('Stufe '+lv+': Stellenzahl und Übertrag passen',ohne===0,'Abweichungen: '+ohne);
  }

  /* 3. Darstellung */
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const zeige=(lv)=>{const it=genItem(tp,lv,{});const Q=prepare(it,'medium');
   Q.t0=performance.now();R.cur=Q;R.ended=false;renderQuestion(R,Q);return it;};
  const it=zeige(2);
  const gitter=document.querySelector('.zgrid');
  pruef('Gitter gezeichnet',!!gitter);
  if(!gitter)return aus;
  const kaesten=[...document.querySelectorAll('.zbox')];
  const klein=kaesten.filter(x=>x.classList.contains('klein'));
  const gross=kaesten.filter(x=>!x.classList.contains('klein'));
  const G=it.gitter;
  pruef('Ergebniskästchen = Ziffern des Ergebnisses',gross.length===String(G.res).length,
   gross.length+' / '+String(G.res).length);
  pruef('Übertragskästchen = Spalten minus eins',klein.length===G.breite-1,
   klein.length+' / '+(G.breite-1));
  const br=gross[0].getBoundingClientRect();
  pruef('Kästchen sind gross',br.width>=110,'Breite '+Math.round(br.width)+' px');

  /* 4. Richtige Eingabe über die Tasten */
  const taste=z=>[...document.querySelectorAll('.keypad .key')].find(k=>k.textContent.trim()===String(z));
  const fuelle=(falsch)=>{
   const alle=[...document.querySelectorAll('.zbox')];
   /* Reihenfolge im DOM: erst Überträge, dann Ergebnis */
   const soll=[];
   for(let i=0;i<G.breite-1;i++)soll.push(G.ueb[i]);
   for(let i=0;i<G.breite;i++)if(G.erg[i]!==null)soll.push(G.erg[i]);
   alle.forEach((el,k)=>{let v=soll[k];
    if(falsch&&k===alle.length-1)v=(v+1)%10;
    if(v==null)return;                 /* leeres Übertragskästchen bleibt leer */
    el.focus();const b=taste(v);if(b)b.click();});
   return soll;
  };
  const soll=fuelle(false);
  pruef('Sollwerte bestimmt',soll.length===kaesten.length,soll.join(','));
  const pruefKnopf=[...document.querySelectorAll('button')].find(b=>/^(Prüfen|Check|Vérifier)/.test(b.textContent.trim()));
  pruef('Prüfen-Knopf da',!!pruefKnopf);
  if(pruefKnopf)pruefKnopf.click();
  await new Promise(r=>setTimeout(r,250));
  const schlecht=[...document.querySelectorAll('.zbox.bad')].length;
  pruef('Richtige Eingabe wird angenommen',schlecht===0,'rot: '+schlecht);
  pruef('Alle Kästchen grün',[...document.querySelectorAll('.zbox.ok')].length===kaesten.length);

  /* 5. Falsche Eingabe */
  const it2=zeige(2);const G2=it2.gitter;
  const alle2=[...document.querySelectorAll('.zbox')];
  const soll2=[];
  for(let i=0;i<G2.breite-1;i++)soll2.push(G2.ueb[i]);
  for(let i=0;i<G2.breite;i++)if(G2.erg[i]!==null)soll2.push(G2.erg[i]);
  alle2.forEach((el,k)=>{let v=soll2[k];
   if(k===alle2.length-1)v=((v||0)+1)%10;
   if(v==null)return;el.focus();const b=taste(v);if(b)b.click();});
  const pk2=[...document.querySelectorAll('button')].find(b=>/^(Prüfen|Check|Vérifier)/.test(b.textContent.trim()));
  if(pk2)pk2.click();
  await new Promise(r=>setTimeout(r,250));
  pruef('Falsche Ziffer wird rot markiert',[...document.querySelectorAll('.zbox.bad')].length>0);

  /* 6. Übertrag fehlt: Hinweis erscheint */
  const it3=zeige(2);const G3=it3.gitter;
  if(G3.ueb.some(x=>x)){
   const alle3=[...document.querySelectorAll('.zbox')];
   const soll3=[];
   for(let i=0;i<G3.breite-1;i++)soll3.push(G3.ueb[i]);
   for(let i=0;i<G3.breite;i++)if(G3.erg[i]!==null)soll3.push(G3.erg[i]);
   alle3.forEach((el,k)=>{const v=k<G3.breite-1?null:soll3[k];  /* Überträge weglassen */
    if(v==null)return;el.focus();const b=taste(v);if(b)b.click();});
   const pk3=[...document.querySelectorAll('button')].find(b=>/^(Prüfen|Check|Vérifier)/.test(b.textContent.trim()));
   if(pk3)pk3.click();
   await new Promise(r=>setTimeout(r,250));
   const txt=[...document.querySelectorAll('p')].map(p=>p.textContent).join(' ');
   pruef('Hinweis auf den Übertrag',/Übertrag|carry|retenue/i.test(txt),txt.slice(0,80));
  }
  return aus;
 });
 for(const [s,n,x] of r)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.join(' | '));
 console.log(r.filter(x=>x[0]==='FAIL').length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
})();
