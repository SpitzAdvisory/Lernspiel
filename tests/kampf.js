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

  pruef('Sechs Spiele angemeldet',SPIELE.length===6,SPIELE.length+': '+SPIELE.map(s=>s.id).join(','));
  for(const id of ['drache','raum','duell'])
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

  platz.remove();
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
