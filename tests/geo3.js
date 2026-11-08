/* Die zwei Konstruktionen aus dem Aufgabenblatt Geometrie 6/7.
   Geprueft wird das Praedikat ok(): die richtige Figur besteht, die nach
   Augenmass gesetzte faellt durch. Ein Praedikat, das alles bestehen laesst,
   waere schlimmer als gar keine Aufgabe. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8865);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8865/');
 await pg.waitForFunction(()=>typeof KTASKS!=='undefined'&&typeof kResolve==='function');

 const da=await pg.evaluate(()=>{
  const ids=KTASKS.map(t=>t.id);
  return {sp:ids.includes('k-zwei-spiegelachsen'),st:ids.includes('k-strecke-mittelpunkt'),
   inThemen:['k-zwei-spiegelachsen','k-strecke-mittelpunkt'].every(i=>GEO_IDS.includes(i)),
   werkzeuge:KTASKS.filter(t=>['k-zwei-spiegelachsen','k-strecke-mittelpunkt'].includes(t.id))
    .map(t=>t.id+':'+(t.tools||[]).join(',')),
   dreisprachig:KTASKS.filter(t=>['k-zwei-spiegelachsen','k-strecke-mittelpunkt'].includes(t.id))
    .filter(t=>t.n.length!==3||t.goal.length!==3||t.steps.length!==3
      ||t.n.some(x=>!x)||t.goal.some(x=>!x)||t.steps.some(s=>!s.length)).map(t=>t.id)};});
 pruef('Die zwei Spiegelachsen sind eine Aufgabe',da.sp);
 pruef('Die Strecke mit Mittelpunkt ist eine Aufgabe',da.st);
 pruef('Beide stehen in der Themenliste',da.inThemen);
 pruef('Beide haben Name, Auftrag und Schritte in drei Sprachen',da.dreisprachig.length===0,da.dreisprachig.join(','));
 pruef('Beide bringen das noetige Werkzeug mit',
  da.werkzeuge.every(w=>/pt/.test(w)&&/ln/.test(w)&&/ci/.test(w)),da.werkzeuge.join(' | '));

 /* ---------- Zwei Spiegelachsen ---------- */
 const sp=await pg.evaluate(()=>{
  const T=KTASKS.find(t=>t.id==='k-zwei-spiegelachsen');
  const o=T.geg(), R0=kResolve(o,null), nm=n=>kByName(o,R0,n);
  const G=nm('G'),H=nm('H'),I=nm('I'),J=nm('J'),E=nm('E'),F=nm('F');
  const C=kIntLL(G,H,I,J)[0];
  const ein=d=>{const n=Math.hypot(d[0],d[1]);return [d[0]/n,d[1]/n];};
  const u=ein([H[0]-G[0],H[1]-G[1]]), v=ein([J[0]-I[0],J[1]-I[1]]);
  const a1=ein([u[0]+v[0],u[1]+v[1]]), a2=ein([u[0]-v[0],u[1]-v[1]]);
  const sp2=(P,a)=>{const w=[P[0]-C[0],P[1]-C[1]];const t=w[0]*a[0]+w[1]*a[1];
   return [C[0]+2*t*a[0]-w[0], C[1]+2*t*a[1]-w[1]];};
  /* Bausteine: eine Achse als Gerade, ein Bildpaar als Strecke */
  const achse=(q,a)=>{const i=q.length;
   q.push({k:'P',x:C[0]-40*a[0],y:C[1]-40*a[1]},{k:'P',x:C[0]+40*a[0],y:C[1]+40*a[1]},
          {k:'L',a:i,b:i+1});return q;};
  const bild=(q,P,Q)=>{const i=q.length;
   q.push({k:'P',x:P[0],y:P[1]},{k:'P',x:Q[0],y:Q[1]},{k:'S',a:i,b:i+1});return q;};
  const pruefe=bau=>{const q=bau(o.slice());return T.ok(q,kResolve(q,null));};
  const E1=sp2(E,a1),F1=sp2(F,a1),E2=sp2(E,a2),F2=sp2(F,a2);
  return {
   achsenSenkrecht:Math.abs(a1[0]*a2[0]+a1[1]*a2[1])<1e-9,
   /* Die Spiegelung muss g auf g' abbilden - sonst ist die Achse falsch */
   bildetAb:(()=>{const Gs=sp2(G,a1),Hs=sp2(H,a1);
    return kDistLine(Gs,I,J)<1e-6&&kDistLine(Hs,I,J)<1e-6;})(),
   richtig1:pruefe(q=>bild(achse(achse(q,a1),a2),E1,F1)),
   richtig2:pruefe(q=>bild(achse(achse(q,a1),a2),E2,F2)),
   nurEineAchse:pruefe(q=>bild(achse(q,a1),E1,F1)),
   ohneBild:pruefe(q=>achse(achse(q,a1),a2)),
   bildDaneben:pruefe(q=>bild(achse(achse(q,a1),a2),[E1[0]+7,E1[1]+5],[F1[0]+7,F1[1]+5])),
   gemischtesBild:pruefe(q=>bild(achse(achse(q,a1),a2),E1,F2)),
   schiefeAchse:pruefe(q=>bild(achse(achse(q,a1),ein([a2[0]+0.25,a2[1]])),E1,F1)),
   achseNebenSchnitt:pruefe(q=>{const i=q.length;
    q.push({k:'P',x:C[0]-40*a1[0]+9,y:C[1]-40*a1[1]+9},{k:'P',x:C[0]+40*a1[0]+9,y:C[1]+40*a1[1]+9},
           {k:'L',a:i,b:i+1});return bild(achse(q,a2),E1,F1);}),
   leer:T.ok(o,R0)};});
 pruef('Die beiden Achsen stehen senkrecht aufeinander',sp.achsenSenkrecht===true);
 pruef('Die erste Achse bildet GH tatsächlich auf IJ ab',sp.bildetAb===true);
 pruef('Beide Achsen und die erste Bildstrecke bestehen',sp.richtig1===true,sp.richtig1);
 pruef('Beide Achsen und die zweite Bildstrecke bestehen',sp.richtig2===true,sp.richtig2);
 pruef('Eine einzelne Achse genügt nicht',sp.nurEineAchse===false,sp.nurEineAchse);
 pruef('Zwei Achsen ohne Bildstrecke genügen nicht',sp.ohneBild===false,sp.ohneBild);
 pruef('Eine danebengesetzte Bildstrecke fällt durch',sp.bildDaneben===false,sp.bildDaneben);
 pruef('Ein Bild aus zwei verschiedenen Achsen fällt durch',sp.gemischtesBild===false,sp.gemischtesBild);
 pruef('Eine schiefe zweite Achse fällt durch',sp.schiefeAchse===false,sp.schiefeAchse);
 pruef('Eine Achse am Schnittpunkt vorbei fällt durch',sp.achseNebenSchnitt===false,sp.achseNebenSchnitt);
 pruef('Die leere Ausgangsfigur besteht nicht',sp.leer===false,sp.leer);

 /* ---------- Strecke mit vorgegebenem Mittelpunkt ---------- */
 const st=await pg.evaluate(()=>{
  const T=KTASKS.find(t=>t.id==='k-strecke-mittelpunkt');
  const o=T.geg(), R0=kResolve(o,null), nm=n=>kByName(o,R0,n);
  const G=nm('G'),H=nm('H'),I=nm('I'),J=nm('J'),M=nm('M');
  const sp2=P=>[2*M[0]-P[0],2*M[1]-P[1]];
  const B=kIntLL(sp2(G),sp2(H),I,J)[0], A=sp2(B);
  const strecke=(P,Q)=>{const q=o.slice(),i=q.length;
   q.push({k:'P',x:P[0],y:P[1]},{k:'P',x:Q[0],y:Q[1]},{k:'S',a:i,b:i+1});
   return T.ok(q,kResolve(q,null));};
  return {A,B,
   aufGH:kDistLine(A,G,H)<1e-6, aufIJ:kDistLine(B,I,J)<1e-6,
   mitte:(()=>{const m=kmid(A,B);return Math.abs(m[0]-M[0])<1e-6&&Math.abs(m[1]-M[1])<1e-6;})(),
   richtig:strecke(A,B),
   vertauscht:strecke(B,A),
   daneben:strecke([A[0]+8,A[1]],B),
   /* Zwei Punkte auf den Geraden, aber M nicht in der Mitte */
   falschePunkte:(()=>{const A2=[A[0]+14,A[1]];
    const d=[J[0]-I[0],J[1]-I[1]];const B2=[B[0]+d[0]*0.18,B[1]+d[1]*0.18];
    return strecke(A2,B2);})(),
   nurPunkte:(()=>{const q=o.slice();
    q.push({k:'P',x:A[0],y:A[1]},{k:'P',x:B[0],y:B[1]});
    return T.ok(q,kResolve(q,null));})(),
   leer:T.ok(o,R0)};});
 pruef('Der eine Endpunkt liegt auf GH',st.aufGH===true);
 pruef('Der andere liegt auf IJ',st.aufIJ===true);
 pruef('M ist der Mittelpunkt der beiden',st.mitte===true);
 pruef('Beide Endpunkte liegen im Zeichenfeld',
  st.A[0]>0&&st.A[0]<130&&st.A[1]>0&&st.A[1]<100&&st.B[0]>0&&st.B[0]<130&&st.B[1]>0&&st.B[1]<100,
  JSON.stringify([st.A,st.B]));
 pruef('Die richtige Strecke besteht',st.richtig===true,st.richtig);
 pruef('Die Reihenfolge der Endpunkte spielt keine Rolle',st.vertauscht===true,st.vertauscht);
 pruef('Ein verschobener Endpunkt fällt durch',st.daneben===false,st.daneben);
 pruef('Zwei Punkte auf den Geraden ohne M in der Mitte fallen durch',st.falschePunkte===false,st.falschePunkte);
 pruef('Zwei Punkte ohne Verbindungsstrecke genügen nicht',st.nurPunkte===false,st.nurPunkte);
 pruef('Die leere Ausgangsfigur besteht nicht',st.leer===false,st.leer);

 /* ---------- Keine W-Woerter, kein scharfes s ---------- */
 const w=await pg.evaluate(()=>{
  const wRe=/^(Warum|Wenn|Was|Wer|Wo|Wie|Wann|Welche|Welcher|Welches|Welchen|Welchem|Weshalb|Wem|Wen|Wobei|Womit|Wodurch|Woraus|Wofür)\b/;
  const treffer=[],scharf=[];
  for(const t of KTASKS.filter(x=>['k-zwei-spiegelachsen','k-strecke-mittelpunkt'].includes(x.id))){
   const texte=[t.n[0],t.goal[0]].concat(t.steps[0]);
   for(const s of texte){
    if(/ß/.test(s))scharf.push(t.id+': '+s.slice(0,40));
    for(const satz of String(s).split(/(?<=[.!?])\s+/))
     if(wRe.test(satz.trim())&&!/\?$/.test(satz.trim()))treffer.push(t.id+': '+satz.trim().slice(0,50));}}
  return {treffer,scharf};});
 pruef('Kein Satz beginnt mit einem W-Wort',w.treffer.length===0,w.treffer.join(' | '));
 pruef('Kein scharfes s',w.scharf.length===0,w.scharf.join(' | '));

 for(const [s,n,x] of aus)console.log(s,n,x);
 if(perr.length)console.log('SEITENFEHLER:',perr.slice(0,3).join(' | '));
 const f=aus.filter(x=>x[0]==='FAIL').length;
 console.log(f||perr.length?'>>> NICHT BESTANDEN':'>>> alles bestanden');
 await b.close();srv.close();
 process.exit(f||perr.length?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
