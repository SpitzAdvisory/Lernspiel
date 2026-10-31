/* Die Kampfspiele: Lebensbalken, Herzen, Sieg und Niederlage.
   Gespielt wird nicht mit der Hand, sondern ueber den Zustand und die
   Zeiger-Rueckrufe - geprueft wird, dass beide Ausgaenge eintreten. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8824);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:900,height:1000},hasTouch:true});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8824/');
 await pg.waitForFunction(()=>typeof SPIELE!=='undefined'&&typeof balken==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const warte=ms=>new Promise(r=>setTimeout(r,ms||0));
  const warteAuf=async(f,ms)=>{const bis=Date.now()+(ms||6000);
   while(Date.now()<bis){if(f())return true;await warte(30);}return false;};

  pruef('Sieben Spiele angemeldet',SPIELE.length===7,SPIELE.length+': '+SPIELE.map(s=>s.id).join(','));
  for(const id of ['drache','raum','duell','geister'])
   pruef('Spiel «'+id+'» da',!!SPIELE.find(s=>s.id===id));

  /* Jedes Spiel nennt seine Huerde fuer alle drei Stufen */
  let schlecht=[];
  for(const s of SPIELE)for(const st of [1,2,3]){
   const z=s.ziel(st);
   if(!z||!(z.n>0)||!z.art)schlecht.push(s.id+'/'+st);
  }
  pruef('Jede Stufe nennt eine Huerde',schlecht.length===0,schlecht.join(' | '));

  /* Die Stufen steigen streng */
  let flach=[];
  for(const s of SPIELE){const n=[1,2,3].map(st=>s.ziel(st).n);
   if(!(n[0]<n[1]&&n[1]<n[2]))flach.push(s.id+': '+n.join(','));}
  pruef('Die Huerde steigt mit jeder Stufe',flach.length===0,flach.join(' | '));

  const platz=document.createElement('div');
  platz.style.cssText='width:600px';document.body.appendChild(platz);
  const spielen=async(id,o)=>{
   platz.replaceChildren();
   const s=SPIELE.find(x=>x.id===id);
   let ergebnis=null;
   const F=s.bau(platz,Object.assign({stufe:1,fertig:(g,p)=>{ergebnis={g,p};}},o||{}));
   await warte(60);
   return {F,hol:()=>ergebnis};
  };

  /* --- Drache --- */
  let d=await spielen('drache',{ziel:3,dauer:60000});
  pruef('Drache: Lebensbalken startet voll',d.F.zustand().hp===3,JSON.stringify(d.F.zustand()));
  pruef('Drache: drei Herzen',d.F.zustand().herz===3);
  /* Warten, bis das Maul offen ist, dann dreimal treffen */
  let schlaege=0;
  for(let k=0;k<400&&d.F.zustand().hp>0;k++){
   if(d.F.zustand().offen){d.F.tipp(d.F.cv.getBoundingClientRect().width/2,84);
    /* Die Lage des Drachen wandert; der Treffer zaehlt nur in der Naehe */
   }
   await warte(20);
   if(d.F.zustand().hp<3-schlaege)schlaege++;
  }
  const dz=d.F.zustand();
  pruef('Drache: Treffer bei offenem Maul senken den Balken',dz.hp<3,JSON.stringify(dz));
  d.F.ende();

  /* Niederlage: Herzen auf null, indem nichts geschieht */
  d=await spielen('drache',{ziel:99,dauer:2500});
  pruef('Drache: Zeitablauf endet das Spiel',
   await warteAuf(()=>d.hol()&&d.hol().g===false,9000),JSON.stringify(d.hol()));
  d.F.ende();

  /* --- Raumschlacht --- */
  let s2=await spielen('raum',{ziel:2,dauer:60000});
  let z2=s2.F.zustand();
  pruef('Raum: Zaehler startet bei null',z2.treffer===0&&z2.herz===3,JSON.stringify(z2));
  pruef('Raum: noch kein Brocken-Gegner',z2.boss===false);
  /* Ohne Steuern trifft das Schiff nur durch Zufall. Hier zielt es auf den
     naechsten Brocken - damit wird auch F.zug mitgeprueft. */
  const zielen=async(F,ms)=>{const bis=Date.now()+ms;
   while(Date.now()<bis){const z=F.zustand();
    if(z.boss)return true;
    const b=(z.brocken||[]).sort((p,q)=>q.y-p.y)[0];
    if(b)F.zug(b.x);
    await warte(25);}
   return !!F.zustand().boss;};
  pruef('Raum: der grosse Brocken kommt nach genug Treffern',
   await zielen(s2.F,30000),JSON.stringify(s2.F.zustand()));
  pruef('Raum: er hat einen eigenen Balken',s2.F.zustand().bossVoll>0,s2.F.zustand().bossVoll);
  s2.F.ende();

  s2=await spielen('raum',{ziel:999,dauer:2500});
  pruef('Raum: Zeitablauf endet das Spiel',
   await warteAuf(()=>s2.hol()&&s2.hol().g===false,9000),JSON.stringify(s2.hol()));
  s2.F.ende();

  /* --- Duell --- */
  let s3=await spielen('duell',{ziel:1});
  await warte(120);
  const z3=s3.F.zustand();
  pruef('Duell: beide Zaehler bei null',z3.meine===0&&z3.seine===0,JSON.stringify(z3));
  pruef('Duell: der Ball liegt im Feld',z3.ball.x>0&&z3.ball.y>0,JSON.stringify(z3.ball));
  pruef('Duell: ein Tor beendet die Runde',
   await warteAuf(()=>s3.hol()!==null,30000),JSON.stringify(s3.hol()));
  const e3=s3.hol();
  pruef('Duell: der Ausgang ist eindeutig',e3&&typeof e3.g==='boolean',JSON.stringify(e3));
  s3.F.ende();

  /* --- Kuerbisnacht --- */
  const g1=SPIELE.find(x=>x.id==='geister');
  pruef('Kürbisnacht: Ziel steigt mit der Stufe',
   g1.ziel(1).n<g1.ziel(2).n&&g1.ziel(2).n<g1.ziel(3).n,
   [1,2,3].map(st=>g1.ziel(st).n).join(','));

  let n1=await spielen('geister',{stufe:1,ziel:2,dauer:60000});
  await warte(200);
  let z1=n1.F.zustand();
  pruef('Kürbisnacht: drei Herzen, nichts gelöst',z1.herz===3&&z1.geloest===0,JSON.stringify({h:z1.herz,g:z1.geloest}));
  pruef('Kürbisnacht: gleich ist ein Geist da',z1.geister.length>=1,z1.geister.length);
  const weit=z1.sicht, haltenKurz=z1.halten;
  n1.F.ende();

  let n3=await spielen("geister",{stufe:3,ziel:2,dauer:60000});
  await warte(200);
  const zn=n3.F.zustand();
  pruef('Kürbisnacht: auf Stufe 3 ist der Lichtkreis enger',zn.sicht<weit,zn.sicht+' statt '+weit);
  pruef('Kürbisnacht: und das Licht muss länger bleiben',zn.halten>haltenKurz,zn.halten+' statt '+haltenKurz);
  n3.F.ende();

  /* Mit dem Licht auf dem Geist loest er sich auf */
  let n2=await spielen('geister',{stufe:1,ziel:3,dauer:60000});
  const geloest=await (async()=>{
   const bis=Date.now()+20000;
   while(Date.now()<bis){
    const z=n2.F.zustand();
    if(z.geloest>0)return true;
    const g=z.geister[0];
    if(g)n2.F.zug(g.x,g.y);
    await warte(25);}
   return n2.F.zustand().geloest>0;})();
  pruef('Kürbisnacht: Licht auf dem Geist löst ihn auf',geloest,JSON.stringify(n2.F.zustand().geloest));
  n2.F.ende();

  /* Wer nichts tut, verliert Herzen */
  let n4=await spielen('geister',{stufe:3,ziel:99,dauer:40000});
  n4.F.zug(5,5);                       /* Laterne in die Ecke, weg von allem */
  pruef('Kürbisnacht: ein durchgekommener Geist kostet ein Herz',
   await warteAuf(()=>n4.F.zustand().herz<3,25000),JSON.stringify(n4.F.zustand().herz));
  n4.F.ende();

  /* --- Klang --- */
  pruef('Elf Klangwirkungen angemeldet',Object.keys(FX).length===11,Object.keys(FX).length);
  const vorher=klangDa();
  pruef('Der Ton lässt sich abschalten',klangSchalter()===!vorher);
  pruef('Und wieder an',klangSchalter()===vorher);
  pruef('Kein Fehler beim Abspielen',(()=>{try{Object.values(FX).forEach(f=>f());return true;}catch(_){return false;}})());
  pruef('Das Brummen lässt sich an- und abstellen',(()=>{try{droneAn();droneAus();return true;}catch(_){return false;}})());

  platz.remove();
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
