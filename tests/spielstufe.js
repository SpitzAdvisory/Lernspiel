/* Die Stufe der Minispiele, Spiel fuer Spiel.
   Felix stand am 12.11.2026 mit sieben Jahren auf Stufe 3, weil eine
   einzige Zahl fuer alle Spiele galt und jeder Sieg in einem leichten
   Spiel sie auch in den schweren hochzog. Seither traegt jedes Spiel
   seine eigene Stufe, und die Bewegung nach einem Durchgang steht in
   spielStufeNachLauf. Dieser Test haelt beides fest. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8873);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:900}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8873/');
 await pg.waitForFunction(()=>typeof spielStufe==='function'&&typeof spielStufeNachLauf==='function');

 const r=await pg.evaluate(async()=>{
  const o={};
  /* Die drei echten Geburtstage, damit die Zahlen die Kinder treffen
     und nicht ein gedachtes Alter. */
  const kind=(geb)=>({id:'t'+geb,name:'Test',geb:geb});
  const felix=kind('2019-10-03'), valentin=kind('2016-09-28'), johannes=kind('2014-03-14');
  o.alter=[alterJahre(felix),alterJahre(valentin),alterJahre(johannes)];
  o.stufen=[altersStufe(felix),altersStufe(valentin),altersStufe(johannes)];
  o.boeden=[spielBoden(felix),spielBoden(valentin),spielBoden(johannes)];
  o.spiele=SPIELE.map(s=>s.id);

  /* Ohne Eintrag gilt die Alterstufe. */
  o.frisch=SPIELE.map(s=>spielStufe(felix,s.id));

  /* Die alte einzelne Zahl bleibt Startwert fuer jedes Spiel. */
  const alt=kind('2019-10-03'); alt.spielStufe=3;
  o.uebernahme=SPIELE.map(s=>spielStufe(alt,s.id));

  /* Ein Sieg in einem Spiel laesst die anderen Spiele unberuehrt. */
  const je=kind('2019-10-03'); je.spielStufe=2;
  await spielStufeSetz(je,SPIELE[0].id,4);
  o.einzeln=[spielStufe(je,SPIELE[0].id),spielStufe(je,SPIELE[1].id)];
  o.spanne=spielStufenSpanne(je);

  /* Der Boden haelt, die Decke auch. */
  await spielStufeSetz(je,SPIELE[1].id,-5);
  const hoch=kind('2014-03-14');
  await spielStufeSetz(hoch,SPIELE[0].id,0);
  await spielStufeSetz(hoch,SPIELE[1].id,99);
  o.boden=[spielStufe(je,SPIELE[1].id),spielStufe(hoch,SPIELE[0].id)];
  o.decke=spielStufe(hoch,SPIELE[1].id);

  /* Der Patzer merkt sich das Spiel, nicht das Kind. */
  await spielPatzerSetz(je,SPIELE[0].id);
  o.patzer=[spielPatzer(je,SPIELE[0].id),spielPatzer(je,SPIELE[1].id)];

  /* Eingebaute Profile werden nicht beschrieben. */
  const ein={id:'gast',builtin:true,geb:'2019-10-03'};
  await spielStufeSetz(ein,SPIELE[0].id,5);
  o.builtin=spielStufe(ein,SPIELE[0].id);

  /* Die Bewegung nach einem Durchgang. */
  const L=(x)=>spielStufeNachLauf(Object.assign({stufe:3,altersStufe:1,gewonnen:true,
   verloren:0,schnell:false,schonGepatzt:false},x));
  o.sprung      =L({schnell:true});                     /* schnell, nie gepatzt */
  o.sprungGepatzt=L({schnell:true,schonGepatzt:true});  /* schnell, aber Patzer */
  o.schritt     =L({});                                 /* langsam gewonnen */
  o.zweiterSieg =L({verloren:1,schnell:true});          /* Sieg im zweiten Anlauf */
  o.ueberAlter  =L({gewonnen:false});                   /* 3 ueber Alterstufe 1 */
  o.aufAlter1   =L({gewonnen:false,altersStufe:3});     /* 3 auf Alterstufe 3 */
  o.aufAlter2   =L({gewonnen:false,altersStufe:3,verloren:1});
  o.unten       =L({gewonnen:false,stufe:1,altersStufe:1,verloren:1});
  return o;});

 await b.close();srv.close();

 pruef('Alter der drei Kinder',JSON.stringify(r.alter)==='[7,10,12]',r.alter);
 pruef('Alterstufen 1/3/4',JSON.stringify(r.stufen)==='[1,3,4]',r.stufen);
 pruef('Boeden eine Stufe darunter',JSON.stringify(r.boeden)==='[1,2,3]',r.boeden);
 pruef('mehr als ein Spiel vorhanden',r.spiele.length>1,r.spiele.join(','));
 pruef('ohne Eintrag gilt die Alterstufe',r.frisch.every(s=>s===1),r.frisch);
 pruef('alte Einzelzahl wird Startwert',r.uebernahme.every(s=>s===3),r.uebernahme);
 pruef('Stufe steigt nur im gespielten Spiel',
  r.einzeln[0]===4&&r.einzeln[1]===2,r.einzeln);
 pruef('Verwaltung zeigt die Spanne',r.spanne==='2-4'||r.spanne==='2–4',r.spanne);
 pruef('Boden haelt nach unten',JSON.stringify(r.boden)==='[1,3]',r.boden);
 pruef('Stufe 5 ist die Decke',r.decke===5,r.decke);
 pruef('Patzer gilt je Spiel',r.patzer[0]===true&&r.patzer[1]===false,r.patzer);
 pruef('eingebautes Profil bleibt unberuehrt',r.builtin===1,r.builtin);
 pruef('schnell und ohne Patzer: zwei Stufen',r.sprung===5,r.sprung);
 pruef('schnell, aber schon gepatzt: eine Stufe',r.sprungGepatzt===4,r.sprungGepatzt);
 pruef('langsam gewonnen: eine Stufe',r.schritt===4,r.schritt);
 pruef('Sieg erst im zweiten Anlauf: keine Stufe',r.zweiterSieg===null,r.zweiterSieg);
 pruef('ueber der Alterstufe senkt eine Niederlage',r.ueberAlter===2,r.ueberAlter);
 pruef('auf der Alterstufe haelt die erste Niederlage',r.aufAlter1===null,r.aufAlter1);
 pruef('auf der Alterstufe senkt die zweite',r.aufAlter2===2,r.aufAlter2);
 pruef('unter Stufe 1 geht es nicht',r.unten===null,r.unten);
 if(perr.length)pruef('SEITENFEHLER',false,perr.join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
