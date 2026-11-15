/* Was Emilia beim Start eines Gespraechs mitbekommt.
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
 pruef('Auf Deutsch heisst sie Emilia',
  de.vars.sprache==='de'&&de.vars.tutorname==='Emilia',
  de.vars.sprache+'/'+de.vars.tutorname);

 const en=await start('en');
 pruef('Auf Englisch heisst sie Kate',
  en.vars.sprache==='en'&&en.vars.tutorname==='Kate',
  en.vars.sprache+'/'+en.vars.tutorname);
 const fr=await start('fr');
 pruef('Auf Französisch heisst sie Emilie',
  fr.vars.sprache==='fr'&&fr.vars.tutorname==='Emilie',
  fr.vars.sprache+'/'+fr.vars.tutorname);

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

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
