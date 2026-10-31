/* Schriftliche Multiplikation und Division: Modell gegen die Arithmetik,
   dann die Kaestchen im Schirm. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8825);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1100,height:1200},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8825/');
 await pg.waitForFunction(()=>typeof malGitter==='function'&&typeof geteiltGitter==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

  /* ---- Multiplikation, einstelliger Faktor ---- */
  let fehler=0,mitUeb=0;
  for(let k=0;k<4000;k++){
   const a=1+Math.floor(Math.random()*99999), b=2+Math.floor(Math.random()*8);
   const g=malGitter(a,b);
   if(g.res!==a*b)fehler++;
   if(String(a*b)!==g.erg.filter(d=>d!==null).join(''))fehler++;
   /* Die Uebertraege stehen seit der Schulschreibweise in einer kleinen
      Zeile ueber dem Teilresultat, jeweils in der Spalte, in der sie
      dazugezaehlt werden. */
   const klein=g.zeilen.find(z=>z.art==='klein');
   if(!klein){fehler++;continue;}
   if(klein.z.some(v=>v!==undefined))mitUeb++;
   const sa=String(a), spEins=g.breite-1;
   let trag=0,schlecht=false;
   for(let k=sa.length-1;k>=0;k--){
    const prod=(+sa[k])*b+trag; trag=Math.floor(prod/10);
    const spalte=spEins-(sa.length-1-k);
    const soll=(trag&&k>0)?trag:undefined;
    if(klein.z[spalte-1]!==soll)schlecht=true;}
   if(schlecht)fehler++;
  }
  pruef('Multiplikation stimmt über 4000 Proben',fehler===0,'Fehler: '+fehler);
  pruef('Überträge kommen vor und stehen in der richtigen Spalte',mitUeb>3000,mitUeb+' von 4000');

  /* ---- Multiplikation, zweistelliger Faktor ---- */
  let f2=0;
  for(let k=0;k<2000;k++){
   const a=100+Math.floor(Math.random()*900), b=10+Math.floor(Math.random()*90);
   const g=malGitter(a,b);
   if(g.res!==a*b)f2++;
   /* Das Blatt der Schule rechnet ZUERST mit den Zehnern, dann mit den
      Einern - die umgekehrte Reihenfolge waere ein Rueckschritt. */
   if(!g.teil||g.teil[0]!==a*Math.floor(b/10)||g.teil[1]!==a*(b%10))f2++;
   if(String(a*b)!==g.erg.filter(d=>d!==null).join(''))f2++;
   /* Ein einziger Strich, unmittelbar vor der Summe. */
   if(g.zeilen.filter(z=>z.art==='strich').length!==1)f2++;
   if(g.zeilen[g.zeilen.length-2].art!=='strich')f2++;
   /* Die letzte Ziffer eines Teilresultats steht unter der Ziffer, mit der
      gerechnet wird. */
   const felder=g.zeilen.filter(z=>z.art==='feld');
   const spMal=g.breite-2-1;             /* Malzeichen: vor den zwei Ziffern von b */
   for(let i=0;i<2;i++){
    const z=felder[i].z;
    let letzte=-1; for(let c=0;c<g.breite;c++) if(typeof z[c]==='number') letzte=c;
    if(letzte!==spMal+1+i)f2++;}
  }
  pruef('Zweistelliger Faktor: Teilprodukte und Summe stimmen',f2===0,'Fehler: '+f2);

  /* ---- Division ---- */
  let f3=0,mitRest=0;
  for(let k=0;k<4000;k++){
   const b=2+Math.floor(Math.random()*8);
   const q=1+Math.floor(Math.random()*9999);
   const a=q*b;
   const g=geteiltGitter(a,b);
   if(g.res!==a/b)f3++;
   if(String(a/b)!==g.erg.filter(d=>d!==null).join(''))f3++;
   if(g.schluss!==0)f3++;
   if(g.zwischen.some(x=>x>0))mitRest++;
   /* Die Treppe Stufe fuer Stufe nachrechnen: teilen, malrechnen,
      subtrahieren, herunterholen. Und es darf keine Stufe geben, die mit
      dem Ergebnis 0 beginnt - die Schule nimmt dann eine Ziffer mehr. */
   const sa=String(a);
   let rr=0,gestartet=false,schlecht=false;
   const erwartet=[];
   for(let i=0;i<sa.length;i++){
    const wert=rr*10+(+sa[i]);
    if(!gestartet&&wert<b&&i<sa.length-1){rr=wert;continue;}
    gestartet=true;
    const q=Math.floor(wert/b);
    erwartet.push(q); rr=wert-q*b;}
   if(erwartet.join('')!==String(a/b))schlecht=true;
   if(g.teilErg.join(',')!==erwartet.join(','))schlecht=true;
   if(g.teilErg[0]===0&&g.res>0)schlecht=true;
   /* So viele Striche wie Stufen. */
   if(g.zeilen.filter(z=>z.art==='strich').length!==erwartet.length)schlecht=true;
   if(schlecht)f3++;
  }
  pruef('Division: Treppe stimmt über 4000 Proben',f3===0,'Fehler: '+f3);
  pruef('Zwischenreste zum Herunterholen kommen vor',mitRest>2500,mitRest+' von 4000');
  const ohne=geteiltGitter(840,4);
  pruef('Glatte Division ohne Rest',ohne.res===210&&ohne.schluss===0,ohne.res+' Rest '+ohne.schluss);

  /* ---- Themen und Darstellung ---- */
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;S.lang='de';
  for(const [id,name] of [['m4-malschriftlich','Malnehmen'],['m4-geteiltschriftlich','Teilen']]){
   const tp=mtopic(id);
   pruef('Thema «'+name+'» vorhanden',!!tp&&typeof tp.g==='function');
   if(!tp)continue;
   let leer=0;
   for(const lv of [1,2,3]){
    for(let k=0;k<60;k++){const it=genItem(tp,lv,{});
     if(!it||!it.gitter||!it.gitter.zeilen)leer++;}
   }
   pruef(name+': jede Stufe liefert ein Gitter',leer===0,'ohne Gitter: '+leer);
  }

  /* Ein Gitter ausfuellen und pruefen lassen */
  const tp=mtopic('m4-geteiltschriftlich');
  const it=genItem(tp,2,{});const Q=prepare(it,'medium');Q.t0=performance.now();
  R.cur=Q;R.ended=false;renderQuestion(R,Q);
  await new Promise(r=>setTimeout(r,120));
  const kaesten=[...document.querySelectorAll('.zbox')];
  const G=it.gitter;
  /* Die Sollwerte in genau der Reihenfolge, in der der Zeichner die
     Kaestchen anlegt: Zeile fuer Zeile, darin Spalte fuer Spalte. Feste
     Zellen (fix) ueberspringt er, und in einer Ergebniszeile heisst null
     "hier steht nichts". */
  const soll=[];
  for(const z of G.zeilen){
   if(z.art!=='feld'&&z.art!=='klein')continue;
   for(let i=0;i<G.breite;i++){
    if(z.fix&&z.fix[i]!=null&&z.fix[i]!=='')continue;
    const v=z.z?z.z[i]:undefined;
    if(v===undefined)continue;
    if(z.art==='feld'&&v===null)continue;
    soll.push(v);}}
  pruef('Teilen: so viele Kästchen wie Sollwerte',kaesten.length===soll.length,
   kaesten.length+' / '+soll.length);
  pruef('Teilen: die Treppe bringt mehr Kästchen als der Quotient Ziffern hat',
   kaesten.length>String(G.res).length,kaesten.length+' Kästchen, Quotient '+G.res);
  const taste=z=>[...document.querySelectorAll('.keypad .key')].find(k=>k.textContent.trim()===String(z));
  kaesten.forEach((el,k)=>{el.focus();const t=taste(soll[k]);if(t)t.click();});
  const pb=[...document.querySelectorAll('button')].find(b=>/^(Prüfen|Check|Vérifier)/.test(b.textContent.trim()));
  pruef('Teilen: Prüfen-Knopf da',!!pb);
  if(pb)pb.click();
  await new Promise(r=>setTimeout(r,300));
  pruef('Teilen: richtige Eingabe wird angenommen',
   document.querySelectorAll('.zbox.bad').length===0,
   'rot: '+document.querySelectorAll('.zbox.bad').length);
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
