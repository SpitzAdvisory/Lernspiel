/* Das Lehrmodul: jede Konstruktion Schritt fuer Schritt.
   Der Kern der Pruefung: am Ende jedes Rezepts muss die Figur die Pruefung
   der Aufgabe selbst bestehen, Verschiebungstest eingeschlossen. Damit ist
   jede Erklaerung nachgerechnet und nicht bloss behauptet. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8867);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:1200}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8867/');
 await pg.waitForFunction(()=>typeof KTASKS!=='undefined'&&typeof kZeigBau==='function');

 /* ---------- Jede Aufgabe hat ein Rezept ---------- */
 const da=await pg.evaluate(()=>({
  aufgaben:KTASKS.length,
  ohne:KTASKS.filter(t=>!KZEIG[t.id]).map(t=>t.id),
  fremd:Object.keys(KZEIG).filter(k=>!KTASKS.some(t=>t.id===k))}));
 pruef('Alle 21 Konstruktionsaufgaben sind erfasst',da.aufgaben===21,da.aufgaben);
 pruef('Keine Aufgabe ohne Rezept',da.ohne.length===0,da.ohne.join(','));
 pruef('Kein Rezept ohne Aufgabe',da.fremd.length===0,da.fremd.join(','));

 /* ---------- Das Rezept loest die Aufgabe wirklich ---------- */
 const r=await pg.evaluate(()=>{
  const schlecht=[],nichtRobust=[],tot=[],frei=[],leer=[],schrumpf=[];
  const zahlen=[];
  for(const t of KTASKS){
   let z;try{z=kZeigBau(t);}catch(e){schlecht.push(t.id+' Absturz: '+e.message);continue;}
   if(!z){schlecht.push(t.id+' kein Rezept');continue;}
   const R=kResolve(z.objs,null);
   for(let i=z.geg;i<z.objs.length;i++){
    if(!R[i])tot.push(t.id+' Objekt '+(i-z.geg));
    if(z.objs[i].k==='P'&&!z.objs[i].int)frei.push(t.id+' freier Punkt '+(i-z.geg));}
   /* Jeder Schritt muss etwas hinzufuegen */
   let vor=z.geg;
   for(const g of z.grenzen){if(g<=vor)schrumpf.push(t.id);vor=g;}
   if(!z.grenzen.length)leer.push(t.id);
   /* Dreimal pruefen: der Verschiebungstest wuerfelt selbst */
   for(let v=0;v<3;v++){
    let c;try{c=kCheck(t,z.objs);}catch(e){schlecht.push(t.id+' Pruefung stuerzt ab: '+e.message);break;}
    if(!c.ok){schlecht.push(t.id+' faellt durch ('+(c.why||'')+')');break;}
    if(!c.robust){nichtRobust.push(t.id);break;}}
   zahlen.push([t.id,z.grenzen.length,z.objs.length-z.geg]);}
  return {schlecht,nichtRobust,tot,frei,leer,schrumpf,zahlen};});
 pruef('Jedes Rezept besteht die Pruefung seiner eigenen Aufgabe',r.schlecht.length===0,r.schlecht.slice(0,4).join(' | '));
 pruef('Jedes Rezept haelt auch dem Verschiebungstest stand',r.nichtRobust.length===0,r.nichtRobust.join(','));
 pruef('Kein Rezeptobjekt bleibt unberechenbar',r.tot.length===0,r.tot.slice(0,6).join(','));
 pruef('Kein Punkt wird nach Augenmass gesetzt',r.frei.length===0,r.frei.slice(0,6).join(','));
 pruef('Kein Rezept ist leer',r.leer.length===0,r.leer.join(','));
 pruef('Jeder Schritt bringt etwas Neues',r.schrumpf.length===0,r.schrumpf.join(','));
 pruef('Kein Rezept hat mehr als vierzehn Schritte',
  r.zahlen.every(z=>z[1]<=14),r.zahlen.filter(z=>z[1]>14).map(z=>z[0]+':'+z[1]).join(','));
 pruef('Jedes Rezept hat mindestens drei Schritte',
  r.zahlen.every(z=>z[1]>=3),r.zahlen.filter(z=>z[1]<3).map(z=>z[0]+':'+z[1]).join(','));

 /* ---------- Die Saetze ---------- */
 const w=await pg.evaluate(()=>{
  const wRe=/^(Warum|Wenn|Was|Wer|Wo|Wie|Wann|Welche|Welcher|Welches|Welchen|Welchem|Weshalb|Wem|Wen|Wobei|Womit|Wodurch|Woraus|Wofür)\b/;
  const fehlt=[],scharf=[],wWort=[],lang=[],gerade=[];
  for(const t of KTASKS){const z=kZeigBau(t);if(!z)continue;
   z.texte.forEach((tx,i)=>{
    if(!Array.isArray(tx)||tx.length!==3||tx.some(s=>!s||!String(s).trim()))
     fehlt.push(t.id+' Schritt '+(i+1));
    const de=String(tx[0]||'');
    if(/ß/.test(tx.join(' ')))scharf.push(t.id+' Schritt '+(i+1));
    if(/["]/.test(tx.join(' ')))gerade.push(t.id+' Schritt '+(i+1));
    if(de.length>190)lang.push(t.id+' Schritt '+(i+1)+': '+de.length);
    for(const satz of de.split(/(?<=[.!?])\s+/))
     if(wRe.test(satz.trim())&&!/\?$/.test(satz.trim()))wWort.push(t.id+': '+satz.trim().slice(0,46));});}
  return {fehlt,scharf,wWort,lang,gerade};});
 pruef('Jeder Schritt hat einen Satz in drei Sprachen',w.fehlt.length===0,w.fehlt.slice(0,5).join(','));
 pruef('Kein scharfes s',w.scharf.length===0,w.scharf.join(','));
 pruef('Kein gerades Anführungszeichen',w.gerade.length===0,w.gerade.join(','));
 pruef('Kein Satz beginnt mit einem W-Wort',w.wWort.length===0,w.wWort.slice(0,4).join(' | '));
 pruef('Kein Satz ist länger als 190 Zeichen',w.lang.length===0,w.lang.slice(0,5).join(','));

 /* ---------- Jeder genannte Punkt steht auch in der Zeichnung ---------- */
 const nm=await pg.evaluate(()=>{
  const fehlt=[];
  for(const t of KTASKS){const z=kZeigBau(t);if(!z)continue;
   const namen=new Set();
   for(const o of z.objs)if(o.k==='P'&&o.n)namen.add(o.n);
   z.texte.forEach((tx,i)=>{
    const de=String(tx[0]||'');
    const treffer=de.match(/(?<![A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc])[A-Z][\u2032\u2081\u2082]?(?![A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc])/g)||[];
    for(const n of treffer)if(!namen.has(n))fehlt.push(t.id+' Schritt '+(i+1)+': '+n);});}
  return fehlt;});
 pruef('Jeder im Satz genannte Punkt tr\u00e4gt in der Zeichnung seinen Namen',nm.length===0,nm.slice(0,8).join(' | '));

/* ---------- Alles bleibt im Zeichenfeld ---------- */
 const rand=await pg.evaluate(()=>{const draussen=[];
  for(const t of KTASKS){const z=kZeigBau(t);if(!z)continue;
   const R=kResolve(z.objs,null);
   for(let i=z.geg;i<z.objs.length;i++){const o=z.objs[i];
    if(o.k!=='P'||!o.n||!R[i])continue;   /* nur benannte Punkte muss man sehen */
    const [x,y]=R[i];
    if(x<0||x>KW||y<0||y>KH)draussen.push(t.id+' '+(o.n||('#'+(i-z.geg)))+' bei '+Math.round(x)+','+Math.round(y));}}
  return draussen;});
 pruef('Jeder benannte Punkt liegt im Zeichenfeld',rand.length===0,rand.slice(0,6).join(' | '));

 /* ---------- Keine zwei Namen uebereinander ---------- */
 const kol=await pg.evaluate(()=>{
  const treffer=[];
  for(const t of KTASKS){const z=kZeigBau(t);if(!z)continue;
   const R=kResolve(z.objs,null);
   const pts=[];
   for(let i=0;i<z.objs.length;i++){const o=z.objs[i];
    if(o.k==='P'&&o.n&&R[i])pts.push([o.n,R[i]]);}
   for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)
    if(pts[i][0]!==pts[j][0]&&kdist(pts[i][1],pts[j][1])<4)
     treffer.push(t.id+': '+pts[i][0]+' auf '+pts[j][0]);}
  return treffer;});
 pruef('Keine zwei Beschriftungen liegen \u00fcbereinander',kol.length===0,kol.slice(0,6).join(' | '));

  /* ---------- Die Bedienung ---------- */
 const u=await pg.evaluate(async()=>{
  S.lang='de';
  const T=KTASKS.find(x=>x.id==='k-mittelsenkrechte');
  const bd=kBoard(T);document.body.appendChild(bd.el);
  const knopf=l=>[...bd.el.querySelectorAll('button')].find(b=>b.textContent.trim().indexOf(l)>=0);
  const zahl=()=>bd.el.querySelectorAll('.kboard circle, .kboard line').length;
  const satz=()=>bd.el.querySelector('p.small').textContent.trim();
  const start=knopf('Vormachen');
  const vorher=zahl(), eigenVorher=bd.objs.length;
  start.click();
  const s1=satz(), n1=zahl();
  const weiter=knopf('Weiter');
  weiter.click();const s2=satz(), n2=zahl();
  weiter.click();weiter.click();
  const letzter=satz(), nEnde=zahl();
  const fertig=[...bd.el.querySelectorAll('button')].find(b=>b.textContent.trim()==='Fertig');
  const hatFertig=!!fertig;
  if(fertig)fertig.click();
  const nachher=zahl();
  const z=kZeigBau(T);
  return {vorher,n1,n2,nEnde,nachher,s1,s2,letzter,hatFertig,
   eigenUnberuehrt:bd.objs.length===eigenVorher,
   ersterSatz:z.texte[0][0],letzterSatz:z.texte[z.texte.length-1][0],
   knopfWeg:!document.body.contains(start)||start.style.display==='none'||start.offsetParent===null};});
 pruef('Der Knopf Vormachen startet mit dem ersten Satz',u.s1===u.ersterSatz,u.s1);
 pruef('Weiter zeigt den zweiten Satz',u.s2&&u.s2!==u.s1,u.s2);
 pruef('Die Figur wächst von Schritt zu Schritt',u.n2>u.n1&&u.nEnde>u.n2,[u.n1,u.n2,u.nEnde].join(' < '));
 pruef('Am letzten Schritt steht der letzte Satz',u.letzter===u.letzterSatz,u.letzter);
 pruef('Der letzte Knopf heisst Fertig',u.hatFertig===true);
 pruef('Nach Fertig steht wieder die eigene Zeichnung da',u.nachher===u.vorher,u.nachher+'/'+u.vorher);
 pruef('Die eigene Zeichnung bleibt unberührt',u.eigenUnberuehrt===true);

 /* ---------- Ohne Rezept kein Knopf ---------- */
 const k=await pg.evaluate(()=>{
  const T=KTASKS[0];const merk=KZEIG[T.id];delete KZEIG[T.id];
  const bd=kBoard(T);document.body.appendChild(bd.el);
  const b=[...bd.el.querySelectorAll('button')].find(x=>/Vormachen|Show me|Montre/.test(x.textContent));
  const sichtbar=b?b.style.display!=='none':false;
  KZEIG[T.id]=merk;return sichtbar;});
 pruef('Ohne Rezept bleibt der Knopf verborgen',k===false,k);

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
