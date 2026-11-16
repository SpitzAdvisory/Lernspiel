/* Sprechen: Gespraeche in der Fremdsprache.
   Urs wollte am 16.11.2026 ein Spiel, in dem die Kinder eine Fremdsprache
   laut sprechen, verankert an den Unites von «dis donc!». Bewertet wird
   die Beteiligung, nicht die Korrektheit - eine Note auf freie Rede waere
   erfunden. Dieser Test haelt fest, was die App dafuer hergibt und was sie
   dem Agenten mitgibt. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8884);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
const warte=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:900,height:1100}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8884/');
 await pg.waitForFunction(()=>typeof SPT!=='undefined'&&typeof SPR_GAME!=='undefined');

 /* ---------- Die Themen ---------- */
 const th=await pg.evaluate(()=>{
  const ids=new Set(FRTOPICS.map(x=>x.id));
  return {
   zahl:SPT.length,
   ausDd:SPT.every(x=>{const q=FRTOPICS.find(y=>y.id===x.quelle);return !!(q&&q.dd);}),
   aufloesbar:SPT.every(x=>!!mtopic(x.id)),
   keineKollision:SPT.every(x=>!ids.has(x.id)),
   genugWoerter:SPT.every(x=>(x.w||[]).length>=10),
   zielspr:[...new Set(SPT.map(x=>x.zielspr))],
   beschreibung:SPT.every(x=>Array.isArray(x.c)&&x.c.length===3&&x.c.every(y=>y&&y.length>10))};});
 pruef('Es gibt Sprechthemen',th.zahl>0,th.zahl);
 pruef('Jedes stammt aus einer dis-donc-Unité',th.ausDd);
 pruef('Jedes ist über mtopic auffindbar',th.aufloesbar);
 pruef('Keine Kennung kollidiert mit dem Wortschatzspiel',th.keineKollision);
 pruef('Jedes trägt mindestens zehn Wörter',th.genugWoerter);
 pruef('Alle zielen vorerst auf Französisch',th.zielspr.length===1&&th.zielspr[0]==='fr',th.zielspr.join(','));
 pruef('Jedes ist in allen drei Sprachen beschrieben',th.beschreibung);

 /* ---------- Die Aufgabe ---------- */
 const it=await pg.evaluate(()=>{
  const tp=SPT[0];
  const mach=lv=>genItem(tp,lv,{});
  const a=mach(1),c=mach(3),e=mach(5);
  const frz=new Set((tp.w||[]).map(d=>ddFr(d)));
  const liste=String(c.woerter||'').split(', ').filter(Boolean);
  return {art:c.type,spr:c.spr,
   min1:a.min,min3:c.min,min5:e.min,
   thema:c.topic,stufe:c.difficulty,
   woerterDa:liste.length>0,
   woerterEcht:liste.every(w=>frz.has(w)),
   woerterKurz:String(c.woerter||'').length<=1200,
   leer:String(c.answer||'')==='' ,
   schritte:Array.isArray(c.steps)&&c.steps.length>0,
   unite:String(c.unite||''),
   prompt:String(c.prompt||'')};});
 pruef('Die Aufgabenart heisst dialog',it.art==='dialog',it.art);
 pruef('Die Zielsprache steht an der Aufgabe',it.spr==='fr',it.spr);
 pruef('Die Mindestbeiträge steigen mit der Stufe',it.min1<it.min3&&it.min3<it.min5,
  it.min1+' < '+it.min3+' < '+it.min5);
 pruef('Auch auf der untersten Stufe wird geredet',it.min1>=3,it.min1);
 pruef('Das Thema hängt an der Aufgabe',!!it.thema,it.thema);
 pruef('Der Wortschatz geht mit',it.woerterDa);
 pruef('Er stammt aus der Unité',it.woerterEcht);
 pruef('Er bleibt unter 1200 Zeichen',it.woerterKurz);
 pruef('Es gibt keine Lösung zu verraten',it.leer);
 pruef('Die Aufgabe trägt Hinweise',it.schritte);
 pruef('Die Unité steht am Item',it.unite.length>0,it.unite.slice(0,40));
 pruef('Die Mindestzahl steht in der Anweisung',/\d/.test(it.prompt),it.prompt.slice(0,60));

 /* ---------- Das Spiel ---------- */
 const sp=await pg.evaluate(()=>({
  gefunden:!!spielAusId('sprechen'),
  kennung:SPR_GAME.id,
  gespraech:SPR_GAME.gespraech===true,
  themen:SPR_GAME.gen.topics.length===SPT.length,
  titel:SPR_GAME.title,
  fach:SPR_GAME.subject}));
 pruef('Das Spiel ist über seine Kennung auffindbar',sp.gefunden);
 pruef('Es ist als Gesprächsspiel gekennzeichnet',sp.gespraech);
 pruef('Es führt alle Sprechthemen',sp.themen);
 pruef('Es trägt einen Titel',!!sp.titel&&sp.titel.length>3,sp.titel);
 pruef('Es zählt zu den Sprachen',sp.fach==='lang',sp.fach);

 /* Beide Registraturen fuehren dieselbe Liste. Faellt das Spiel in einer
    davon aus, findet es die App an einer Stelle und an der anderen nicht
    - ein Fehler, der sich erst beim Fortsetzen zeigen wuerde. */
 const quelle=fs.readFileSync(path.join(D,'app.html'),'utf-8');
 const treffer=(quelle.match(/\[MATH_GAME,DEP_GAME,DE_GAME,OW_GAME,GEO_GAME,FRV_GAME,FRG_GAME,SPR_GAME,IT_GAME\]/g)||[]).length;
 pruef('Das Spiel steht in beiden Registraturen',treffer===2,treffer);

 /* ---------- Die Spielart ---------- */
 const art=await pg.evaluate(async()=>{
  const p={id:'spA',name:'Johannes',avatar:'🦉',geb:'2014-03-14'};
  S.profiles=S.profiles.filter(x=>x.id!=='spA').concat([p]);
  viewRunSetup(p,SPR_GAME,null);
  await new Promise(r=>setTimeout(r,120));
  const zellen=[...document.querySelectorAll('.wahltabelle .wahlzelle')].map(x=>x.textContent);
  return {zellen,
   gespraech:zellen.some(x=>x===t('m_sprechen')),
   keinDuell:!zellen.includes(t('m_duel')),
   keinRennen:!zellen.includes(t('m_timed'))};});
 pruef('Die Spielart Gespräch steht zur Wahl',art.gespraech,art.zellen.slice(0,4).join(' | '));
 pruef('Ein Duell wird nicht angeboten',art.keinDuell);
 pruef('Ein Zeitrennen wird nicht angeboten',art.keinRennen);

 /* Und umgekehrt: das Gespraech taucht nicht bei den anderen Spielen auf. */
 const fremd=await pg.evaluate(async()=>{
  const p=S.profiles.find(x=>x.id==='spA');
  viewRunSetup(p,MATH_GAME,null);
  await new Promise(r=>setTimeout(r,120));
  return [...document.querySelectorAll('.wahltabelle .wahlzelle')].map(x=>x.textContent)
   .includes(t('m_sprechen'));});
 pruef('Beim Rechnen gibt es kein Gespräch',!fremd);

 /* ---------- Der Fragenschirm ---------- */
 const schirm=await pg.evaluate(async()=>{
  const p=S.profiles.find(x=>x.id==='spA');
  const R={id:'t',players:[p],game:SPR_GAME,mode:'sprechen',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:3,up:0,down:0,q:0,masteries:{[p.id]:{}},timer:null,ended:false,target:3,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const item=genItem(SPT[0],3,{});
  const Q=prepare(item,'medium');Q.t0=performance.now();R.cur=Q;
  renderQuestion(R,Q);
  await new Promise(r=>setTimeout(r,200));
  const knoepfe=[...document.querySelectorAll('.page button')].map(x=>x.textContent);
  return {knoepfe,
   start:knoepfe.some(x=>x.indexOf(t('dlgStart'))>=0),
   keinFragen:!knoepfe.some(x=>new RegExp(TUTORNAME[S.lang]).test(x)),
   zaehler:document.body.textContent.indexOf(t('dlgCount',{n:0,m:item.min}))>=0,
   min:item.min};});
 pruef('Der Startknopf steht da',schirm.start,schirm.knoepfe.join(' | ').slice(0,80));
 pruef('Kein zweites Mikrofon neben dem Gespräch',schirm.keinFragen);
 pruef('Der Zähler steht auf null',schirm.zaehler);

 /* ---------- Was der Agent mitbekommt ---------- */
 const mit=await pg.evaluate(async()=>{
  let fang=null,melder=null;
  const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars,melde,kennung,wer,opt)=>{
   fang={vars,kennung,opt,wer:!!wer};melder=melde;
   melde&&melde('zustand','laeuft');
   return {schliesse(){}};};
  const p=S.profiles.find(x=>x.id==='spA');
  const R=S.run;R.ended=false;
  const item=genItem(SPT[0],3,{});
  const Q=prepare(item,'medium');Q.t0=performance.now();R.cur=Q;
  renderQuestion(R,Q);
  await new Promise(r=>setTimeout(r,120));
  const knopf=[...document.querySelectorAll('.page button')]
   .find(x=>x.textContent.indexOf(t('dlgStart'))>=0);
  knopf.click();
  await new Promise(r=>setTimeout(r,200));
  window.gespraechStarten=echt;
  return {v:fang&&fang.vars,opt:fang&&fang.opt,kennung:fang&&fang.kennung,
   wer:fang&&fang.wer,melderDa:!!melder};});
 pruef('Der Modus steht auf sprechen',mit.v&&mit.v.modus==='sprechen',mit.v&&mit.v.modus);
 pruef('Die Zielsprache geht mit',mit.v&&mit.v.zielsprache==='fr',mit.v&&mit.v.zielsprache);
 pruef('Der Wortschatz geht mit',!!(mit.v&&mit.v.wortschatz&&mit.v.wortschatz.length>20));
 pruef('Die Unité geht als Thema mit',!!(mit.v&&mit.v.thema&&mit.v.thema.length>5),mit.v&&mit.v.thema);
 pruef('Es wird keine Lösung mitgereicht',mit.v&&mit.v.loesung==='');
 pruef('Der Name geht mit',mit.v&&mit.v.vorname==='Johannes',mit.v&&mit.v.vorname);
 pruef('Das Alter geht mit',!!(mit.v&&mit.v.alter),mit.v&&mit.v.alter);
 pruef('Der Kanal bekommt die Zielsprache',mit.opt&&mit.opt.spr==='fr',mit.opt&&mit.opt.spr);
 pruef('Der erste Satz steht in der Zielsprache',
  !!(mit.opt&&/Salut/.test(String(mit.opt.ersterSatz||''))),mit.opt&&mit.opt.ersterSatz);
 pruef('Die Kennung des Kindes geht mit',String(mit.kennung||'').indexOf('spitz-')===0,mit.kennung);
 pruef('Das Profil wird gereicht',mit.wer===true);

 /* Alle Felder, die der Auftrag nennt, muessen besetzt sein. Ein fehlendes
    Feld laesst beim Anbieter die Verbindung scheitern, und das faellt erst
    auf, wenn ein Kind davorsitzt. */
 const felder=['vorname','alter','fach','thema','aufgabe','schritte','loesung',
  'stand','fehler_heute','schwach','zuletzt','stufe','sprache','modus',
  'zielsprache','wortschatz','tutorname','erinnerung'];
 const fehlt=felder.filter(f=>!(mit.v&&Object.prototype.hasOwnProperty.call(mit.v,f)));
 pruef('Jedes Feld des Auftrags ist besetzt',fehlt.length===0,fehlt.join(', '));

 /* ---------- Die Zaehlung ---------- */
 const zaehl=await pg.evaluate(async()=>{
  let melder=null,ergebnis=null;
  const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars,melde)=>{melder=melde;melde('zustand','laeuft');
   return {schliesse(){}};};
  const p=S.profiles.find(x=>x.id==='spA');
  const R={id:'z',players:[p],game:SPR_GAME,mode:'sprechen',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:1,up:0,down:0,q:0,masteries:{[p.id]:{}},timer:null,ended:false,target:3,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const item=genItem(SPT[0],1,{});          /* Stufe 1: drei Beitraege reichen */
  const Q=prepare(item,'medium');Q.t0=performance.now();R.cur=Q;
  renderQuestion(R,Q);
  await new Promise(r=>setTimeout(r,120));
  [...document.querySelectorAll('.page button')]
   .find(x=>x.textContent.indexOf(t('dlgStart'))>=0).click();
  await new Promise(r=>setTimeout(r,200));
  const text=()=>document.body.textContent;
  melder('hilfe','Salut !');
  melder('kind','Oui');
  melder('kind','a');                        /* zu kurz, zaehlt nicht */
  melder('kind',' ');                        /* leer, zaehlt nicht */
  const nachZwei=text().indexOf(t('dlgCount',{n:1,m:item.min}))>=0;
  melder('kind','Je me lève à sept heures');
  melder('kind','Mon copain s’appelle Léo');
  const nachDrei=text().indexOf(t('dlgCount',{n:3,m:item.min}))>=0;
  melder('zustand','aus');
  await new Promise(r=>setTimeout(r,400));
  const antw=R.answers[R.answers.length-1]||null;
  window.gespraechStarten=echt;
  return {min:item.min,nachZwei,nachDrei,
   geantwortet:!!antw,richtig:antw&&antw.correct===true,
   spur:text().indexOf('Je me lève')>=0};});
 pruef('Die Mindestzahl auf Stufe 1 ist drei',zaehl.min===3,zaehl.min);
 pruef('Zu kurze Äusserungen zählen nicht',zaehl.nachZwei);
 pruef('Echte Beiträge zählen',zaehl.nachDrei);
 pruef('Die Mitschrift ist sichtbar',zaehl.spur);
 pruef('Am Schluss wird abgerechnet',zaehl.geantwortet);
 pruef('Genug geredet heisst bestanden',zaehl.richtig===true);

 /* Und der umgekehrte Fall: zu wenig gesagt, also nicht bestanden. */
 const knapp=await pg.evaluate(async()=>{
  let melder=null;
  const echt=window.gespraechStarten;
  window.gespraechStarten=async(vars,melde)=>{melder=melde;melde('zustand','laeuft');
   return {schliesse(){}};};
  const p=S.profiles.find(x=>x.id==='spA');
  const R={id:'k',players:[p],game:SPR_GAME,mode:'sprechen',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:1,up:0,down:0,q:0,masteries:{[p.id]:{}},timer:null,ended:false,target:3,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const item=genItem(SPT[0],1,{});
  const Q=prepare(item,'medium');Q.t0=performance.now();R.cur=Q;
  renderQuestion(R,Q);
  await new Promise(r=>setTimeout(r,120));
  [...document.querySelectorAll('.page button')]
   .find(x=>x.textContent.indexOf(t('dlgStart'))>=0).click();
  await new Promise(r=>setTimeout(r,200));
  melder('kind','Oui');
  melder('zustand','aus');
  await new Promise(r=>setTimeout(r,400));
  const antw=R.answers[R.answers.length-1]||null;
  window.gespraechStarten=echt;
  return {geantwortet:!!antw,richtig:antw&&antw.correct===true};});
 pruef('Zu wenig geredet wird auch abgerechnet',knapp.geantwortet);
 pruef('Zu wenig geredet heisst nicht bestanden',knapp.richtig===false);

 /* ---------- Die Texte ---------- */
 const txt=await pg.evaluate(()=>{
  const keys=['spr_title','m_sprechen','md_sprechen','hint_dialog','t_dialog',
   'dlgStart','dlgStop','dlgCount','dlgConnecting','dlgSpeak','dlgDone','dlgShort',
   'dlgTrouble','dlgNoMic','dlgSkip','dlgLimit','dlgNoProxy'];
  const fehlt=[];
  for(const k of keys)for(const l of ['de','en','fr'])
   if(!T[l]||!T[l][k]||!String(T[l][k]).trim())fehlt.push(l+'.'+k);
  const scharf=keys.filter(k=>/ß/.test(String((T.de&&T.de[k])||'')));
  return {fehlt,scharf};});
 pruef('Alle Texte stehen in allen drei Sprachen',txt.fehlt.length===0,txt.fehlt.join(', '));
 pruef('Kein scharfes s im Deutschen',txt.scharf.length===0,txt.scharf.join(', '));

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
