/* Unité 1 – Training für die Prüfung.
   Urs am 19.11.2026, am Abend vor der Prüfung: der ganze Wortschatz
   der Unité, alle Verben konjugiert, besonderes Gewicht auf manger,
   commencer und s’appeler, und die Verben in beide Richtungen
   übersetzt.

   Eine falsche Verbform in einem Prüfungstraining ist schlimmer als
   gar kein Training: das Kind lernt sie und schreibt sie am nächsten
   Morgen hin. Darum stehen die heiklen Formen hier einzeln und
   ausgeschrieben, nicht erzeugt - sonst prüfte der Test dieselbe
   Regel, die er prüfen soll. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8896);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

/* Die Formen, auf die es ankommt. Von Hand gesetzt. */
const SOLL={
 'manger':['je mange','tu manges','il mange','nous mangeons','vous mangez','ils mangent'],
 'commencer':['je commence','tu commences','il commence','nous commençons','vous commencez','ils commencent'],
 's’appeler':['je m’appelle','tu t’appelles','il s’appelle','nous nous appelons','vous vous appelez','ils s’appellent'],
 'se lever':['je me lève','tu te lèves','il se lève','nous nous levons','vous vous levez','ils se lèvent'],
 's’habiller':['je m’habille','tu t’habilles','il s’habille','nous nous habillons','vous vous habillez','ils s’habillent'],
 's’excuser':['je m’excuse','tu t’excuses','il s’excuse','nous nous excusons','vous vous excusez','ils s’excusent'],
 'se doucher':['je me douche','tu te douches','il se douche','nous nous douchons','vous vous douchez','ils se douchent'],
 'se brosser':['je me brosse','tu te brosses','il se brosse','nous nous brossons','vous vous brossez','ils se brossent'],
 'se dépêcher':['je me dépêche','tu te dépêches','il se dépêche','nous nous dépêchons','vous vous dépêchez','ils se dépêchent'],
 'avoir':['j’ai','tu as','il a','nous avons','vous avez','ils ont'],
 'être':['je suis','tu es','il est','nous sommes','vous êtes','ils sont'],
 'aller':['je vais','tu vas','il va','nous allons','vous allez','ils vont'],
 'prendre':['je prends','tu prends','il prend','nous prenons','vous prenez','ils prennent'],
 'ouvrir':['j’ouvre','tu ouvres','il ouvre','nous ouvrons','vous ouvrez','ils ouvrent'],
 'oublier':['j’oublie','tu oublies','il oublie','nous oublions','vous oubliez','ils oublient'],
 'arriver':['j’arrive','tu arrives','il arrive','nous arrivons','vous arrivez','ils arrivent'],
 'chercher':['je cherche','tu cherches','il cherche','nous cherchons','vous cherchez','ils cherchent'],
 'préparer':['je prépare','tu prépares','il prépare','nous préparons','vous préparez','ils préparent'],
 'sonner':['je sonne','tu sonnes','il sonne','nous sonnons','vous sonnez','ils sonnent'],
 'jouer':['je joue','tu joues','il joue','nous jouons','vous jouez','ils jouent']};
/* Formen, die ein Kind schreibt und die falsch sind. Keine davon darf
   je als Lösung erscheinen. */
const NIE=['nous mangons','nous commencons','nous commensons','nous nous appellons',
 'je me lèver','nous nous levez','je m’habilles','j’ai suis'];

(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:1000,height:1200},screen:{width:1000,height:1200}})).newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8896/');
 await pg.waitForFunction(()=>typeof u1Verben!=='undefined'&&typeof PRU_GAME!=='undefined');
 /* Johannes arbeitet auf Deutsch; der Pruefstand startet auf Englisch. */
 await pg.evaluate(()=>{S.lang='de';});

 /* ---------- Das Spiel ---------- */
 const sp=await pg.evaluate(()=>{
  const titel={};for(const l of ['de','en','fr'])titel[l]=(T[l]||{}).pru_title||'';
  return {id:PRU_GAME.id,themen:PRU.map(x=>x.id),
   titel,
   inListe:typeof spielNachId==='undefined'?null:null,
   sprachspiel:SPRACHSPIEL.indexOf('fr-pruefung')>=0,
   gefunden:PRU.every(x=>!!mtopic(x.id)),
   bereiche:PRU.map(x=>x.a)};});
 pruef('Das Spiel heisst fr-pruefung',sp.id==='fr-pruefung');
 pruef('Es trägt fünf Themen',sp.themen.length===5,sp.themen.join(', '));
 pruef('Jedes Thema ist über mtopic auffindbar',sp.gefunden);
 pruef('Der Titel steht in allen drei Sprachen',
  ['de','en','fr'].every(l=>sp.titel[l].length>5),JSON.stringify(sp.titel));
 pruef('Der englische Titel ist der von Urs verlangte',
  sp.titel.en==='Unité 1 final exam training',sp.titel.en);
 pruef('Kein scharfes s im deutschen Titel',!/ß/.test(sp.titel.de),sp.titel.de);
 pruef('Das Blatt bleibt ohne Erkennung gesperrt',sp.sprachspiel);

 /* ---------- Der Wortschatz ---------- */
 const ws=await pg.evaluate(()=>{
  const l=u1Wortschatz();
  return {n:l.length,leer:l.filter(d=>!d[0]||!d[1]).length,
   quellen:['dd7-1-1','dd7-1-2','dd7-1-3'].map(id=>{const tp=FRTOPICS.find(x=>x.id===id);return tp?(tp.w||[]).length:0;}),
   erste:l[0][0],letzte:l[l.length-1][0]};});
 pruef('Der Wortschatz der Unité ist vollständig',
  ws.n===ws.quellen.reduce((a,b)=>a+b,0)&&ws.n>=55,ws.n+' Einträge aus '+ws.quellen.join('+'));
 pruef('Kein Eintrag ist leer',ws.leer===0,ws.leer);
 pruef('Er beginnt und endet wie im Lehrmittel',
  ws.erste==='il y a'&&ws.letzte==='les parents',ws.erste+' … '+ws.letzte);

 /* ---------- Die Konjugationen ---------- */
 const konj=await pg.evaluate(()=>{
  const o={};for(const v of u1Verben())o[v.inf]=[0,1,2,3,4,5].map(i=>u1Form(v,i));
  return o;},{});
 const inf=Object.keys(konj);
 pruef('Alle Verben der Unité sind da',inf.length>=30,inf.length+' Verben');
 for(const k of Object.keys(SOLL)){
  const ist=konj[k];
  pruef('Konjugation stimmt: '+k,
   !!ist&&ist.join(' | ')===SOLL[k].join(' | '),
   ist?ist.join(' | '):'fehlt');}
 pruef('Jede Form trägt ihr Subjekt',
  inf.every(k=>konj[k].every((f,i)=>new RegExp('^(je |j’|tu |il |nous |vous |ils )').test(f))),
  inf.filter(k=>konj[k].some(f=>!/^(je |j’|tu |il |nous |vous |ils )/.test(f))).join(', '));
 pruef('Keine Form ist leer oder doppelt angehängt',
  inf.every(k=>konj[k].every(f=>f.length>3&&!/\s\s/.test(f))));
 const alleFormen=inf.flatMap(k=>konj[k]);
 for(const f of NIE)
  pruef('Diese falsche Form kommt nirgends vor: '+f,alleFormen.indexOf(f)<0);
 /* Die drei Sonderfälle müssen sich von der blossen Regel unterscheiden. */
 pruef('manger folgt nicht blind der Regel',
  konj['manger'][3]!=='nous mangons',konj['manger'][3]);
 pruef('commencer folgt nicht blind der Regel',
  konj['commencer'][3]!=='nous commencons',konj['commencer'][3]);
 pruef('s’appeler hat bei nous nur ein l',
  /nous nous appelons$/.test(konj['s’appeler'][3]),konj['s’appeler'][3]);
 pruef('s’appeler hat bei je zwei l',
  /m’appelle$/.test(konj['s’appeler'][0]),konj['s’appeler'][0]);

 /* ---------- Die Aufgaben ---------- */
 for(const id of sp.themen){
  const r=await pg.evaluate((id)=>{
   const tp=mtopic(id);const arten={};let leer=0,ohneLoesung=0;const texte=[];
   for(let k=0;k<240;k++){
    const lv=1+(k%5);
    const it=genItem(tp,lv,{});
    if(!it){leer++;continue;}
    arten[it.type]=(arten[it.type]||0)+1;
    const hat=it.answer||(it.options&&it.options.length)||it.order||it.solution||it.pairs;
    if(!hat)ohneLoesung++;
    if(!it.prompt&&it.type!=='pairs')ohneLoesung++;
    /* Nur die Loesung, nicht die Ablenker: bei den Sonderfaellen ist
       die falsche Form als Ablenker gerade der Zweck der Aufgabe. */
    const richtig=it.type==='single'?String((it.options||[])[(it.correct||[0])[0]]||''):'';
    texte.push(String(it.answer||'')+' § '+String(it.solution||'')+' § '+richtig);}
   return {arten,leer,ohneLoesung,text:texte.join(' § ')};},id);
  pruef('Aufgaben entstehen ('+id+')',r.leer===0,r.leer+' leer');
  pruef('Jede Aufgabe hat Frage und Lösung ('+id+')',r.ohneLoesung===0,r.ohneLoesung);
  pruef('Mehrere Aufgabenarten ('+id+')',Object.keys(r.arten).length>=2,Object.keys(r.arten).join(', '));
  const schlecht=NIE.filter(f=>r.text.indexOf(f)>=0);
  pruef('Keine falsche Form in den Aufgaben ('+id+')',schlecht.length===0,schlecht.join(', '));}

 /* Beide Richtungen müssen wirklich vorkommen. */
 for(const id of ['pru-u1-wort','pru-u1-verbwort']){
  const r=await pg.evaluate((id)=>{
   const tp=mtopic(id);let nachFr=0,nachDe=0;
   for(let k=0;k<300;k++){const it=genItem(tp,2,{});if(!it)continue;
    const p=String(it.prompt||'');
    if(/Französisch|français/.test(p))nachFr++;
    if(/Deutsch|allemand/.test(p))nachDe++;}
   return {nachFr,nachDe};},id);
  pruef('Nach dem Französischen wird gefragt ('+id+')',r.nachFr>20,r.nachFr);
  pruef('Nach dem Deutschen auch ('+id+')',r.nachDe>20,r.nachDe);}

 /* Die Ablenker bei den Sonderfaellen muessen die Schreibweise sein,
    die ein Kind waehlt - sonst uebt die Aufgabe nichts. */
 const abl=await pg.evaluate(()=>{
  const tp=mtopic('pru-u1-fokus');const gesehen=new Set();let n=0;
  for(let k=0;k<400;k++){const it=genItem(tp,2,{});
   if(!it||it.type!=='single')continue;n++;
   const r=(it.correct||[0])[0];
   (it.options||[]).forEach((o,i)=>{if(i!==r)gesehen.add(o);});}
  return {n,ablenker:[...gesehen]};});
 pruef('Die Sonderfälle fragen auch als Auswahl',abl.n>10,abl.n);
 pruef('Die falsche Schreibweise steht als Ablenker da',
  ['nous mangons','nous commencons','nous nous appellons'].some(x=>abl.ablenker.indexOf(x)>=0),
  abl.ablenker.join(' | '));
 pruef('Kein Ablenker ist zugleich eine richtige Form',
  abl.ablenker.every(o=>['nous mangeons','nous commençons','nous nous appelons'].indexOf(o)<0),
  abl.ablenker.join(' | '));

 /* Die Sonderfälle müssen die nous-Form wirklich betonen. */
 const fok=await pg.evaluate(()=>{
  const tp=mtopic('pru-u1-fokus');let nous=0,n=0;
  for(let k=0;k<300;k++){const it=genItem(tp,2,{});if(!it)continue;n++;
   if(/nous/.test(String(it.prompt||'')+String(it.answer||'')))nous++;}
  return {nous,n};});
 pruef('Die nous-Form steht im Mittelpunkt',fok.nous>fok.n*0.4,fok.nous+' von '+fok.n);

 await b.close();srv.close();
 if(perr.length)pruef('SEITENFEHLER',false,perr.slice(0,3).join(' | '));
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
