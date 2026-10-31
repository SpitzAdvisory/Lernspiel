const {chromium}=require('playwright');
const http=require('http'),fs=require('fs');
const srv=http.createServer((q,s)=>{s.writeHead(200,{'Content-Type':'text/html'});
 s.end(fs.readFileSync('/tmp/claude-0/wtest/app.html'));}).listen(8830);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const pg=await ctx.newPage();
 pg.on('pageerror',e=>console.log('SEITENFEHLER '+e.message));
 await pg.goto('http://127.0.0.1:8830/');
 await pg.waitForFunction(()=>typeof renderHoeren==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const warte=ms=>new Promise(r=>setTimeout(r,ms||0));
  const warteAuf=async(f,ms)=>{const bis=Date.now()+(ms||3000);
   while(Date.now()<bis){if(f())return true;await warte(25);}return false;};
  S.lang='de';
  await IDB.set('kv','proxyUrl','https://vermittler.example/');

  /* Ton und Mikrofon nachbilden */
  let gesprochen=[],gehoert='zwei';
  window.sprich=async(txt)=>{gesprochen.push(String(txt));await warte(10);return true;};
  window.hoerFrei=async(o)=>{await warte(10);return gehoert;};
  window.tonFreigeben=()=>{};

  pruef('Auswahlaufgabe ist hoerbar',hoerbarItem({type:'single'})===true);
  pruef('Stellenrechnen ist es nicht',hoerbarItem({type:'num',gitter:{a:1,b:2}})===false);
  pruef('Schreibaufgabe ist es nicht',hoerbarItem({type:'input',tippen:true})===false);
  pruef('Figur schliesst aus',hoerbarItem({type:'single',fig:()=>null})===false);
  pruef('Karte schliesst aus',hoerbarItem({type:'single',map:{}})===false);
  pruef('Sortieren ist nicht hoerbar',hoerbarItem({type:'order'})===false);

  const Q0={opts:[{text:'reflexiv',ok:false},{text:'transitiv',ok:true},{text:'intransitiv',ok:false}]};
  const it0={type:'single'};
  pruef('Zahl waehlt die Zeile',
   (hoerEntscheid(Q0,it0,'zwei')||{}).text==='transitiv',
   JSON.stringify(hoerEntscheid(Q0,it0,'zwei')));
  pruef('Das Wort waehlt ebenso',
   (hoerEntscheid(Q0,it0,'ich glaube transitiv')||{}).text==='transitiv');
  pruef('Richtig wird als richtig erkannt',
   (hoerEntscheid(Q0,it0,'zwei')||{}).ok===true);
  pruef('Falsch bleibt falsch',
   (hoerEntscheid(Q0,it0,'eins')||{}).ok===false);
  pruef('Nebengeraeusch waehlt nichts',hoerEntscheid(Q0,it0,'[stöhnt]')===null);
  pruef('Unverstandenes waehlt nichts',hoerEntscheid(Q0,it0,'blau')===null);

  /* Stehen Zahlen zur Auswahl, zaehlt nur das Wort */
  const QZ={opts:[{text:'2',ok:false},{text:'3',ok:true},{text:'4',ok:false}]};
  pruef('Bei Zahlen als Auswahl zaehlt die Zahl selbst',
   (hoerEntscheid(QZ,{type:'single'},'drei')||{}).text==='3',
   JSON.stringify(hoerEntscheid(QZ,{type:'single'},'drei')));

  /* Freie Antwort */
  pruef('Freie Antwort wird verglichen',
   (hoerEntscheid({},{type:'input',answer:'rufen'},'Rufen')||{}).ok===true);
  pruef('Lautgleiches zaehlt auch hier',
   (hoerEntscheid({},{type:'input',formen:['fallen','fiel','gefallen']},
    'Fallen, viel gefallen')||{}).ok===true);

  /* Ganzer Schirm */
  const R={id:'t',players:[TEST_PLAYER],game:DE_GAME,mode:'hoeren',diff:'medium',adaptive:false,
   started:new Date(),pool:gameUnits(DE_GAME).map(id=>({id,topic:id,difficulty:2,slot:true})),
   used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:1,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:gameUnits(DE_GAME),cards:new Set(),sub:null,wcur:{},
   jokes:[],jokeAt:Infinity,spielAt:Infinity};
  S.run=R;
  const it=genItem(mtopic('de-objekt'),1,{});
  const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;
  gesprochen=[];
  renderHoeren(R,Q);
  await warte(80);
  pruef('Der Schirm zeigt einen grossen Knopf',!!document.querySelector('.hoerKnopf'));
  pruef('Keine Tastatur auf dem Schirm',!document.querySelector('input'));
  pruef('Keine Zeichenflaeche',!document.querySelector('canvas'));
  pruef('Die Auswahl steht mit Zahlen da',
   (document.querySelectorAll('.hoerWahl li').length===Q.opts.length),
   document.querySelectorAll('.hoerWahl li').length);
  const ersteZeile=document.querySelector('.hoerWahl li');
  pruef('Die erste Zeile beginnt mit eins',/^eins:/.test(ersteZeile?ersteZeile.textContent:''),
   ersteZeile&&ersteZeile.textContent);

  /* Richtige Antwort sprechen */
  const richtig=Q.opts.findIndex(o=>o.ok);
  gehoert=['eins','zwei','drei','vier'][richtig];
  document.querySelector('.hoerKnopf').click();
  const fertig=await warteAuf(()=>/✓|Richtig/i.test(document.querySelector('.page').textContent),4000);
  pruef('Die gesprochene Zahl wird als Antwort genommen',fertig,
   document.querySelector('.page').textContent.slice(0,80));
  pruef('Die Aufgabe wurde vorgelesen',gesprochen.length>0&&/eins:/.test(gesprochen[0]),
   (gesprochen[0]||'').slice(0,70));
  pruef('Das Urteil wird gesprochen',gesprochen.length>1,JSON.stringify(gesprochen.slice(1,2)));
  pruef('Punkte wurden gebucht',R.score[0]>0,R.score[0]);


  /* Falsche Antwort: das Urteil nennt die richtige Loesung */
  const it2=genItem(mtopic('de-objekt'),1,{});
  const Q2=prepare(it2,'medium');Q2.t0=performance.now();R.ended=false;R.cur=Q2;
  gesprochen=[];
  renderHoeren(R,Q2);
  await warte(60);
  const falschNr=Q2.opts.findIndex(o=>!o.ok);
  gehoert=['eins','zwei','drei','vier'][falschNr];
  document.querySelector('.hoerKnopf').click();
  const weg=await warteAuf(()=>/✗|falsch/i.test(document.querySelector('.page').textContent),4000);
  pruef('Eine falsche Antwort wird als falsch gewertet',weg,
   document.querySelector('.page').textContent.slice(0,70));
  pruef('Das gesprochene Urteil nennt die Loesung',
   gesprochen.some(x=>/Richtig ist/i.test(x)),JSON.stringify(gesprochen.slice(-1)));

  /* Nichts verstanden: der Schirm bleibt stehen und laedt zum neuen Anlauf.
     Zuvor die selbsttaetige Weiterschaltung der vorigen Aufgabe auslaufen
     lassen, sonst legt sie sich ueber den Pruefschirm. */
  await warte(900);
  const it3=genItem(mtopic('de-objekt'),1,{});
  const Q3=prepare(it3,'medium');Q3.t0=performance.now();R.ended=false;R.cur=Q3;
  renderHoeren(R,Q3);
  await warte(60);
  gehoert='[räuspert sich]';
  document.querySelector('.hoerKnopf').click();
  await warte(400);
  pruef('Nichts Verstandenes wertet nicht',
   !/✓|✗/.test(document.querySelector('.hoerKnopf').textContent),
   document.querySelector('.hoerKnopf').textContent);
  pruef('Dafuer die Einladung zum neuen Anlauf',
   /Nichts verstanden/.test(document.querySelector('.page').textContent));

  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 await b.close();srv.close();process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
