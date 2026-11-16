/* Was die Begleiterin beim Start eines Gespraechs mitbekommt.
   Urs wollte am 15.11.2026 eine neugierige Begleiterin, die sich erinnert,
   den Stand kennt und in allen drei Sprachen auf der Stufe des Kindes
   spricht. Dieser Test haelt fest, was die App dafuer hinausreicht. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8876);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:1100}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8876/');
 await pg.waitForFunction(()=>typeof lernstand==='function'&&typeof fragestelleBox==='function');

 /* ---------- Der Lernstand ---------- */
 const ls=await pg.evaluate(()=>{
  const p={id:'eA',name:'Felix',avatar:'🦊',geb:'2019-10-03'};
  S.profiles=S.profiles.filter(x=>x.id!=='eA').concat([p]);
  const alle=genTopics(MATH_GAME).map(x=>x.id);
  const t1=alle[0],t2=alle[1];
  /* Ein frueherer Lauf mit vielen Fehlern in einem Thema. */
  const log={id:'La',version:3,game:{id:MATH_GAME.id,title:'M'},mode:'classic',
   difficulty:'easy',adaptive:true,topics:[t1,t2],years:[1],
   started:'2026-11-14T09:00:00.000Z',ended:'2026-11-14T09:10:00.000Z',
   players:[{id:'eA',name:'Felix',score:1,answered:6,correct:2,accuracy:33,bestStreak:1}],
   answers:[{player:'eA',topic:t1,correct:false},{player:'eA',topic:t1,correct:false},
            {player:'eA',topic:t1,correct:false},{player:'eA',topic:t1,correct:true},
            {player:'eA',topic:t2,correct:true},{player:'eA',topic:t2,correct:true},
            {player:'eA',topic:t2,correct:true},{player:'eA',topic:t2,correct:true}]};
  S.logMap={'a.json':log};computeState();
  const R={id:'r1',players:[p],game:MATH_GAME,mode:'classic',diff:'easy',
   level:2,target:25,answers:[
    {player:'eA',topic:t1,correct:false},{player:'eA',topic:t2,correct:true},
    {player:'eA',topic:t1,correct:true}]};
  const o=lernstand(R,p);
  return {o,t1Name:tName(mtopic(t1)),t2Name:tName(mtopic(t2))};});
 pruef('Der Stand zählt die Aufgaben dieses Laufs',
  /3/.test(ls.o.stand)&&/2/.test(ls.o.stand),ls.o.stand);
 pruef('Die Fehler von heute nennen das Thema',
  ls.o.fehler===ls.t1Name,ls.o.fehler);
 pruef('Ein Thema erscheint nur einmal',
  ls.o.fehler.split(',').length===1,ls.o.fehler);
 pruef('Die alte Schwäche kommt aus den Protokollen',
  ls.o.schwach.indexOf(ls.t1Name)>=0&&/25 %/.test(ls.o.schwach),ls.o.schwach);
 pruef('Das gut gelöste Thema gilt nicht als Schwäche',
  ls.o.schwach.indexOf(ls.t2Name)<0,ls.o.schwach);
 pruef('Der letzte Lauf wird datiert genannt',
  ls.o.zuletzt.length>0&&/,/.test(ls.o.zuletzt),ls.o.zuletzt);
 pruef('Die Stufe wird mitgegeben',ls.o.stufe==='2',ls.o.stufe);

 /* ---------- Was beim Start hinausgeht ---------- */
 const start=async(lang)=>pg.evaluate(async(lang)=>{
  S.lang=lang;applyLang();
  const p=S.profiles.find(x=>x.id==='eA');
  const R={id:'r2',players:[p],game:MATH_GAME,mode:'classic',diff:'easy',
   level:3,target:25,answers:[]};
  let fang=null;
  const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars,melde,kennung)=>{fang={vars,kennung};
   melde&&melde('zustand','aus');return{schliesse(){}};};
  const box=fragestelleBox({fach:'Mathematik',thema:'Zehner',aufgabe:'7 + 8 = ?',
   schritte:'Erst auf 10.',loesung:'15',vorname:p.name,alter:alterJahre(p),
   lauf:R,spieler:p});
  if(!box)return {fehlt:'keine Box'};
  document.body.appendChild(box);
  box.querySelector('button').click();
  await new Promise(r=>setTimeout(r,120));
  window.gespraechStarten=echt;box.remove();
  return fang;},lang);

 const NAME=await pg.evaluate(()=>({de:TUTORNAME.de,en:TUTORNAME.en,fr:TUTORNAME.fr}));
 const de=await start('de');
 pruef('Die Box erscheint',de&&de.vars,de&&de.fehlt);
 pruef('Die Kennung ist das Profil, nicht der Name',
  de.kennung==='spitz-eA',de.kennung);
 pruef('Der Name des Kindes geht mit',de.vars.vorname==='Felix',de.vars.vorname);
 pruef('Das Alter geht mit',String(de.vars.alter)==='7',de.vars.alter);
 pruef('Die Aufgabe geht mit',de.vars.aufgabe==='7 + 8 = ?',de.vars.aufgabe);
 pruef('Die Lösung geht mit',de.vars.loesung==='15',de.vars.loesung);
 pruef('Der Stand geht mit',typeof de.vars.stand==='string',de.vars.stand);
 pruef('Die Stufe des Laufs geht mit',de.vars.stufe==='3',de.vars.stufe);
 /* Seit dem 16.11.2026 ein Name fuer alle drei Sprachen. Der Test haelt
    fest, dass es derselbe ist, nicht welcher. */
 pruef('Auf Deutsch kommt der Name aus der Tabelle',
  de.vars.sprache==='de'&&de.vars.tutorname===NAME.de,
  de.vars.sprache+'/'+de.vars.tutorname);

 const en=await start('en');
 pruef('Auf Englisch kommt der Name aus der Tabelle',
  en.vars.sprache==='en'&&en.vars.tutorname===NAME.en,
  en.vars.sprache+'/'+en.vars.tutorname);
 const fr=await start('fr');
 pruef('Auf Französisch kommt der Name aus der Tabelle',
  fr.vars.sprache==='fr'&&fr.vars.tutorname===NAME.fr,
  fr.vars.sprache+'/'+fr.vars.tutorname);
 pruef('Es ist in allen drei Sprachen derselbe Name',
  de.vars.tutorname===en.vars.tutorname&&en.vars.tutorname===fr.vars.tutorname,
  [de.vars.tutorname,en.vars.tutorname,fr.vars.tutorname].join('/'));

 /* ---------- Eingebaute Profile bekommen keine Kennung ---------- */
 const gast=await pg.evaluate(async()=>{
  S.lang='de';applyLang();
  const p={id:'gastX',name:'Gast',builtin:true};
  let fang=null;const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars,melde,kennung)=>{fang={vars,kennung};
   melde&&melde('zustand','aus');return{schliesse(){}};};
  const box=fragestelleBox({fach:'M',thema:'T',aufgabe:'1 + 1 = ?',schritte:'',
   loesung:'2',vorname:'Gast',alter:8,spieler:p});
  document.body.appendChild(box);box.querySelector('button').click();
  await new Promise(r=>setTimeout(r,120));
  window.gespraechStarten=echt;box.remove();return fang;});
 pruef('Ein eingebautes Profil bekommt keine Kennung',
  gast.kennung===null,String(gast.kennung));
 pruef('Ohne Lauf bleiben die Standfelder leer',
  gast.vars.stand===''&&gast.vars.schwach===''&&gast.vars.stufe==='',
  JSON.stringify([gast.vars.stand,gast.vars.schwach,gast.vars.stufe]));

 /* ---------- Jedes Feld ist begrenzt ---------- */
 const lang=await pg.evaluate(async()=>{
  const p=S.profiles.find(x=>x.id==='eA');
  let fang=null;const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars)=>{fang=vars;return{schliesse(){}};};
  const box=fragestelleBox({fach:'x'.repeat(500),thema:'y'.repeat(500),
   aufgabe:'z'.repeat(2000),schritte:'s'.repeat(2000),loesung:'l'.repeat(500),
   vorname:'v'.repeat(200),alter:7,spieler:p});
  document.body.appendChild(box);box.querySelector('button').click();
  await new Promise(r=>setTimeout(r,120));
  window.gespraechStarten=echt;box.remove();
  const lg={};for(const k of Object.keys(fang||{}))lg[k]=String(fang[k]).length;
  return lg;});
 pruef('Kein Feld läuft über',
  lang.fach<=60&&lang.thema<=120&&lang.aufgabe<=600&&lang.schritte<=800
  &&lang.loesung<=200&&lang.vorname<=40,JSON.stringify(lang));

 /* ---------- Das Gedaechtnis ---------- */
 const ged=await pg.evaluate(async()=>{
  const p=S.profiles.find(x=>x.id==='eA');
  delete p.gespraeche;
  const leer=erinnerungText(p);
  await erinnerungSichern(p,[['e','Woran bist Du?'],['k','Ich komme beim Zehner nicht weiter'],
   ['e','Was hast Du schon versucht?'],['k','Ich habe sieben und acht zusammengezaehlt']]);
  const eins=erinnerungText(p);
  await erinnerungSichern(p,[['e','Wie ging es mit dem Zehner?'],['k','Besser']]);
  await erinnerungSichern(p,[['e','Und heute?'],['k','Heute war Mal und Durch dran, das ging']]);
  const drei=erinnerungText(p);
  /* Zu kurzes wird nicht behalten - ein abgebrochenes Gespraech ist keine
     Erinnerung. */
  const vorher=p.gespraeche.length;
  await erinnerungSichern(p,[['k','ja']]);
  const nachKurz=p.gespraeche.length;
  const gast={id:'g1',builtin:true};
  await erinnerungSichern(gast,[['e','Hallo'],['k','Ich komme nicht weiter beim Rechnen']]);
  return {leer,eins,drei,anzahl:p.gespraeche.length,vorher,nachKurz,
   gast:gast.gespraeche===undefined,heute:X('heute','today','aujourd\u2019hui')};});
 pruef('Ohne Vorgeschichte ist die Erinnerung leer',ged.leer==='',ged.leer);
 pruef('Das Gespräch wird im Wortlaut behalten',
  ged.eins.indexOf('Zehner')>=0&&ged.eins.indexOf('Kind:')>=0,ged.eins.slice(0,80));
 pruef('Davor steht, wie lange es her ist',
  ged.eins.indexOf(ged.heute)===0,ged.eins.slice(0,20));
 pruef('Nur die letzten zwei Gespräche bleiben',ged.anzahl===2,ged.anzahl);
 pruef('Das älteste fällt heraus',ged.drei.indexOf('Zehner nicht weiter')<0,ged.drei.slice(0,60));
 pruef('Das jüngste ist dabei',ged.drei.indexOf('Mal und Durch')>=0,ged.drei.slice(-60));
 pruef('Ein abgebrochenes Gespräch wird nicht behalten',
  ged.nachKurz===ged.vorher,ged.vorher+'/'+ged.nachKurz);
 pruef('Eingebaute Profile bekommen kein Gedächtnis',ged.gast===true,ged.gast);

 /* Die Erinnerung geht mit und bleibt begrenzt. */
 const mit=await pg.evaluate(async()=>{
  S.lang='de';applyLang();
  const p=S.profiles.find(x=>x.id==='eA');
  p.gespraeche=[{d:new Date().toISOString(),t:'E: '+'x'.repeat(600)},
                {d:new Date().toISOString(),t:'E: '+'y'.repeat(600)}];
  let fang=null;const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars,melde,kennung,wer)=>{fang={vars,wer:!!wer};
   melde&&melde('zustand','aus');return{schliesse(){}};};
  const box=fragestelleBox({fach:'M',thema:'T',aufgabe:'7 + 8 = ?',schritte:'',
   loesung:'15',vorname:p.name,alter:alterJahre(p),spieler:p});
  document.body.appendChild(box);box.querySelector('button').click();
  await new Promise(r=>setTimeout(r,120));
  window.gespraechStarten=echt;box.remove();
  return {len:String(fang.vars.erinnerung||'').length,wer:fang.wer};});
 pruef('Die Erinnerung geht mit',mit.len>0,mit.len);
 pruef('Sie bleibt unter 900 Zeichen',mit.len<=900,mit.len);
 pruef('Das Profil wird ans Gespräch gereicht',mit.wer===true,mit.wer);

 /* ---------- Kein alter Name mehr im Code ----------
    Am 16.11.2026 blieb bei der Umbenennung eine Spielbeschreibung stehen,
    und zwar auf Deutsch. Diese Pruefung liest die Quelle ohne Kommentare
    und haelt fest, dass die drei alten Namen nur noch in der Chronik
    stehen, nicht in einer Zeichenkette fuer das Kind. */
 const quelle=fs.readFileSync(path.join(D,'app.html'),'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g,' ').replace(/<!--[\s\S]*?-->/g,' ');
 for(const alt of ['Emilia','Emilie','Kate']){
  const n=(quelle.match(new RegExp('\\b'+alt+'\\b','g'))||[]).length;
  pruef('Der Name '+alt+' kommt im Code nicht mehr vor',n===0,n);}

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
