/* Lautsprecher auf der Muttersprachseite: Text, Hash und Darstellung.
   Geprueft wird vor allem, dass der Name der Tondatei zu dem passt, was
   die Erzeugung abgelegt hat - sonst bleibt der Knopf stumm. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8822);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'..','de_audio_manifest.json'),'utf8'));
const namen=manifest.map(x=>x.file);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1100,height:1000}});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8822/');
 await pg.waitForFunction(()=>typeof natSpr==='function');
 const r=await pg.evaluate(async(namen)=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const satz=new Set(namen.dateien);
  const texte=new Set(namen.texte);

  /* Vorlesbar */
  pruef('Semikolon wird zur Aufzaehlung',lesbar('klingeln;läuten','de')==='klingeln, läuten',lesbar('klingeln;läuten','de'));
  pruef('Franzoesisch bleibt unveraendert',lesbar('donner qc','fr')==='donner quelque chose',lesbar('donner qc','fr'));
  pruef('Englisch nimmt dieselbe Regel',lesbar('a;b','en')==='a, b',lesbar('a;b','en'));
  pruef('Abkuerzung jmdn. wird ausgeschrieben',lesbar('jmdn. grüssen','de')==='jemanden grüssen',lesbar('jmdn. grüssen','de'));
  pruef('Abkuerzung etw. wird ausgeschrieben',lesbar('etw. anschauen','de')==='etwas anschauen',lesbar('etw. anschauen','de'));
  pruef('Abkuerzungen nur auf Deutsch',lesbar('etw. x','en')==='etw. x',lesbar('etw. x','en'));

  /* Sprache der Muttersprachseite */
  S.lang='de'; pruef('Deutsch gewaehlt',natSpr()==='de');
  S.lang='en'; pruef('Englisch gewaehlt',natSpr()==='en');
  S.lang='fr'; pruef('Franzoesisch faellt auf Deutsch',natSpr()==='de');
  S.lang='de';

  /* Aufgaben aus beiden Bestaenden */
  /* Beide Bestaende: die Themen der Jahre 5-6 und die Lernziele von dis donc. */
  const themen=FRTOPICS.filter(t=>t.w&&t.w.length);
  const ddThemen=themen.filter(t=>t.dd);
  pruef('Franzoesisch-Themen vorhanden',themen.length>0,themen.length);
  pruef('dis-donc-Lernziele darunter',ddThemen.length>0,ddThemen.length);
  let mitNat=0,ohneDatei=[],geprueft=0;
  for(let k=0;k<400;k++){
   const tp=themen[k%themen.length];
   let it=null;
   try{ it=genItem(tp,1+(k%3),{}); }catch(_){ continue; }
   if(!it||!it.nat)continue;
   mitNat++;geprueft++;
   const datei=audioUrl(it.nat,'de').split('/').pop();
   if(!satz.has(datei))ohneDatei.push(it.nat+' -> '+datei);
  }
  pruef('Aufgaben mit Muttersprachseite kommen vor',mitNat>20,mitNat+' von 400');
  pruef('Jede davon hat eine erzeugte Tondatei',ohneDatei.length===0,ohneDatei.slice(0,3).join(' | '));

  /* Gesprochen wird nur, was so auf der Karte steht. Bei dis donc traegt
     ddDe() einen Hinweis in Klammern nach; der gehoert nicht in den Ton. */
  const fremd=[];
  for(let k=0;k<400;k++){
   const tp=themen[k%themen.length];let it=null;
   try{ it=genItem(tp,1+(k%3),{}); }catch(_){ continue; }
   if(!it||!it.nat)continue;
   if(!texte.has(String(it.nat).trim()))fremd.push(it.nat);
  }
  pruef('Gesprochen wird nur Text von der Karte',fremd.length===0,fremd.slice(0,3).join(' | '));

  /* Darstellung: zwei Lautsprecher */
  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:1,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  let gezeigt=false;
  for(let k=0;k<120&&!gezeigt;k++){
   const tp=themen[k%themen.length];let it=null;
   try{ it=genItem(tp,1,{}); }catch(_){ continue; }
   if(!it||!it.nat||!it.sound)continue;
   const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;R.ended=false;renderQuestion(R,Q);
   const knoepfe=[...document.querySelectorAll('.prompt .sndb')];
   pruef('Zwei Lautsprecher an der Frage',knoepfe.length===2,knoepfe.length);
   gezeigt=true;
  }
  pruef('Eine solche Aufgabe wurde gezeigt',gezeigt);
  return aus;},{dateien:namen,texte:manifest.map(x=>x.de)});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
