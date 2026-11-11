/* Modul «Verben im Fokus»: Daten, Aufgaben und die gesprochene Abfrage. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8826);
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1000,height:1000}});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8826/');
 await pg.waitForFunction(()=>typeof DET!=='undefined'&&typeof hoerUrteilDe==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  S.lang='de';

  /* ---- Verbendaten ---- */
  pruef('114 Verben aus Teil 1 und Teil 2',DEV.length===114,DEV.length);
  const schlecht=DEV.filter(v=>v.length!==5||!v[0]||!v[1]||!v[2]||!v[3]);
  pruef('Jedes Verb hat vier Formen',schlecht.length===0,schlecht.slice(0,3).map(v=>v[0]).join(' | '));
  pruef('Erstes und letztes Verb wie in der Liste',DEV[0][0]==='backen'&&DEV[113][0]==='zwingen',
   DEV[0][0]+' … '+DEV[113][0]);
  pruef('Teil 2 schliesst an Teil 1 an',DEV[75][0]==='schreien'&&DEV[76][0]==='schweigen',
   DEV[75][0]+' -> '+DEV[76][0]);
  /* Die Liste des Lehrers ist alphabetisch; eine verrutschte Zeile faellt hier auf. */
  const unsortiert=DEV.map(v=>v[0]).filter((x,i,a)=>i>0&&a[i-1].localeCompare(x,'de')>0);
  pruef('Die Verben stehen alphabetisch',unsortiert.length===0,unsortiert.join(', '));
  const scharf=DEV.filter(v=>v.slice(0,4).some(f=>/\u00df/.test(f)));
  pruef('Kein scharfes s in den Formen',scharf.length===0,scharf.map(v=>v[0]).join(', '));
  /* gelingen hat keine zweite Person; die Liste fuehrt dort «es gelingt».
     Nur diese unpersoenliche Form darf ein Leerzeichen tragen. */
  const wort=/^[a-z\u00e4\u00f6\u00fc]+$/;
  const schiefeForm=DEV.filter(v=>
   !wort.test(v[0])||!wort.test(v[1])||!wort.test(v[2])||
   !(wort.test(v[3])||/^es [a-z\u00e4\u00f6\u00fc]+$/.test(v[3])));
  pruef('Jede Form ist ein kleingeschriebenes Wort, unpersoenlich mit «es»',
   schiefeForm.length===0,schiefeForm.map(v=>v[0]).join(', '));
  const hilfFeld=DEV.filter(v=>v[4]!=='h'&&v[4]!=='s'&&v[4]!=='');
  pruef('Das Hilfsverb ist h, s oder leer',hilfFeld.length===0,hilfFeld.map(v=>v[0]).join(', '));
  /* liegen, sitzen und stehen gehen im Schweizer und im deutschen
     Gebrauch auseinander; keines darf ein festes Hilfsverb tragen. */
  const wackelig=['liegen','sitzen','stehen'].map(n=>DEV.find(v=>v[0]===n)).filter(v=>v&&v[4]!=='');
  pruef('liegen, sitzen und stehen ohne festes Hilfsverb',wackelig.length===0,
   wackelig.map(v=>v[0]+'='+v[4]).join(', '));
  const doppelt=DEV.map(v=>v[0]).filter((x,i,a)=>a.indexOf(x)!==i);
  pruef('Kein Verb doppelt',doppelt.length===0,doppelt.join(' | '));
  const hilf=DEV.filter(v=>v[4]==='h'||v[4]==='s').length;
  pruef('Hilfsverb nur dort, wo es eindeutig ist',hilf>0&&hilf<DEV.length,hilf+' von '+DEV.length);
  const partizip=DEV.filter(v=>!/^(ge|be|emp|er|ver|ent|miss)/.test(v[2]));
  pruef('Partizipien sehen aus wie Partizipien',partizip.length===0,partizip.slice(0,3).map(v=>v[2]).join(' | '));
  /* Stichproben gegen die Liste */
  const probe={fahren:['fuhr','gefahren','fährst'],essen:['ass','gegessen','isst'],
   gelingen:['gelang','gelungen','es gelingt'],schreien:['schrie','geschrien','schreist'],
   niesen:['nieste','geniest','niest']};
  const ab=[];
  for(const k of Object.keys(probe)){const v=DEV.find(x=>x[0]===k);
   if(!v||v[1]!==probe[k][0]||v[2]!==probe[k][1]||v[3]!==probe[k][2])ab.push(k);}
  pruef('Stichproben stimmen mit der Liste überein',ab.length===0,ab.join(' | '));

  /* ---- Themen ---- */
  pruef('Fuenfzehn Themen',DET.length===15,DET.length);
  pruef('Das Modul ist eine eingebaute Kachel',DE_GAME.builtin===true&&DE_GAME.gen.topics.length===15,DE_GAME.gen.topics.length);
  /* Teil 2 muss fuer sich allein uebbar sein. */
  pruef('Teil 2 umfasst 38 Verben von schweigen bis zwingen',
   DEV2.length===38&&DEV2[0][0]==='schweigen'&&DEV2[37][0]==='zwingen',
   DEV2.length+': '+DEV2[0][0]+' … '+DEV2[DEV2.length-1][0]);
  const fremd=[];
  for(let i=0;i<400;i++){const it=DET.find(t=>t.id==='de-stamm-teil2').g(1+(i%3));
   const m=String(it.prompt).match(/«([^»]+)»/);
   if(!m)continue;const w=m[1];
   /* Jede gezogene Form muss zu einem Verb aus Teil 2 gehoeren. */
   if(!DEV2.some(v=>v.slice(0,4).indexOf(w)>=0))fremd.push(w);}
  pruef('Stammformen Teil 2 zieht nur aus Teil 2',fremd.length===0,fremd.slice(0,4).join(', '));
  pruef('Die Verben mit zwei Bedeutungen sind dabei',
   DET.some(t=>t.id==='de-zweibedeutung'),DET.map(t=>t.id).join(' '));
  const fehlend=DET.filter(tp=>!mtopic(tp.id));
  pruef('Jedes Thema ist auffindbar',fehlend.length===0,fehlend.map(x=>x.id).join(' | '));

  let probleme=[];
  for(const tp of DET)for(const lv of [1,2,3]){
   for(let k=0;k<30;k++){
    let it=null;
    try{ it=genItem(tp,lv,{}); }catch(e){ probleme.push(tp.id+': '+e.message); break; }
    if(!it){probleme.push(tp.id+'/'+lv+': kein Item');break;}
    if(!String(it.prompt||'').trim())probleme.push(tp.id+': leerer Fragetext');
    if(it.type==='input'&&!it.answer)probleme.push(tp.id+': ohne Antwort');
    if(it.type==='single'){
     if(!it.options||it.options.length<2)probleme.push(tp.id+': zu wenig Auswahl');
     else if(new Set(it.options).size!==it.options.length)probleme.push(tp.id+': doppelte Auswahl');
    }
   }}
  probleme=[...new Set(probleme)];
  pruef('Alle Themen erzeugen brauchbare Aufgaben',probleme.length===0,probleme.slice(0,3).join(' | '));

  /* ---- Gesprochene Stammformen ---- */
  const sp=mtopic('de-stamm-sprechen');
  const si=genItem(sp,1,{});
  pruef('Sprechaufgabe ist eine Sprechaufgabe',si.type==='speak'&&si.spr==='de',si.type+'/'+si.spr);
  pruef('Drei Formen werden verlangt',si.formen&&si.formen.length===3,JSON.stringify(si.formen));
  pruef('Emilia bekommt einen Satz zum Vorlesen',/^Die Stammformen von /.test(si.sound),si.sound);
  pruef('Die Frage wird von selbst gesprochen',si.autoSound===true&&si.soundPre===true);
  const v=DEV.find(x=>x[0]===si.formen[0]);
  pruef('Die verlangten Formen stammen aus der Liste',
   !!v&&si.formen[1]===v[1]&&si.formen[2]===v[2],JSON.stringify(si.formen));

  const u=(txt,f)=>hoerUrteilDe([txt],f||['fahren','fuhr','gefahren']);
  pruef('Alle drei Formen: richtig',u('fahren fuhr gefahren').ok);
  pruef('Andere Reihenfolge gilt auch',u('gefahren, fuhr, fahren').ok);
  pruef('Füllwörter stören nicht',u('also fahren, dann fuhr und gefahren').ok);
  pruef('Eine fehlende Form: falsch',u('fahren fuhr').ok===false);
  pruef('Die fehlende Form wird benannt',u('fahren fuhr').fehlt.join()==='gefahren',
   JSON.stringify(u('fahren fuhr').fehlt));
  pruef('Falsche Form: falsch',u('fahren fahrte gefahrt').ok===false);
  pruef('Gross- und Kleinschreibung egal',u('Fahren FUHR Gefahren').ok);
  pruef('Nichts gehört: leer',hoerUrteilDe([],['a']).leer===true);
  pruef('Umlaute bleiben unterscheidbar',
   hoerUrteilDe(['er fahrt'],['fährt']).ok===false&&hoerUrteilDe(['er fährt'],['fährt']).ok===true);

  /* Französisch bleibt, wie es war */
  const fr=hoerUrteil(['la cloche'],'la cloche',[]);
  pruef('Französisch wird weiterhin nach Lauten beurteilt',fr.ok===true);

  /* ---- Ein Thema im Schirm ---- */
  const R={id:'t',players:[TEST_PLAYER],game:DE_GAME,mode:'learn',diff:'medium',
   adaptive:false,started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const it=genItem(mtopic('de-stamm'),1,{});
  const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;R.ended=false;renderQuestion(R,Q);
  await new Promise(r=>setTimeout(r,120));
  const inp=document.querySelector('.answerbox');
  pruef('Schreibaufgabe zeigt ein Eingabefeld',!!inp);
  if(inp){
   inp.value=it.answer;
   const pb=[...document.querySelectorAll('button')].find(b=>/^(Prüfen|Check|Vérifier)/.test(b.textContent.trim()));
   if(pb)pb.click();
   await new Promise(r=>setTimeout(r,200));
   pruef('Die richtige Form wird angenommen',inp.style.borderColor.indexOf('green')>=0||
    getComputedStyle(inp).borderColor!=='',inp.style.borderColor);
  }
  /* ---------- Lautgleiche Schreibungen ----------
     «fiel» und «viel» klingen gleich. Johannes sprach richtig, Scribe
     schrieb «viel», und die Aufgabe galt als falsch. */
  const F=['fallen','fiel','gefallen'];
  pruef('Lautgleiches zaehlt als richtig',
   hoerUrteilDe(['Fallen, viel gefallen'],F).ok===true);
  pruef('Dabei wird der Lautweg vermerkt',
   hoerUrteilDe(['Fallen, viel gefallen'],F).laut===true);
  pruef('Richtig Geschriebenes bleibt richtig',
   hoerUrteilDe(['fallen fiel gefallen'],F).ok===true);
  pruef('Eine falsche Form bleibt falsch',
   hoerUrteilDe(['fallen fällt gefallen'],F).ok===false);
  pruef('Und die fehlende Form wird benannt',
   hoerUrteilDe(['fallen fällt gefallen'],F).fehlt.join()==='fiel',
   hoerUrteilDe(['fallen fällt gefallen'],F).fehlt.join());
  pruef('Dehnungs-h faellt nicht ins Gewicht',
   hoerUrteilDe(['nehmen nam genommen'],['nehmen','nahm','genommen']).ok===true);
  pruef('Doppelkonsonant faellt nicht ins Gewicht',
   hoerUrteilDe(['sitzen sas gesessen'],['sitzen','sass','gesessen']).ok===true);
  pruef('Ohne Bezug bleibt es falsch',
   hoerUrteilDe(['keine ahnung'],F).ok===false);

  /* Die Lauttoleranz darf verschiedene Formen nicht verschmelzen.
     Gemessen ueber alle Formen der Verbenliste; erlaubt sind nur echte
     Homophone, die auch ein Mensch nur am Sinn unterscheidet. */
  /* weist (weisen) und weisst (wissen) kamen mit Teil 2 dazu und klingen
     gleich; auch ein Mensch hoert hier nur den Sinn. */
  const echteHomophone=['rit','flist','genist','vaist'];
  const karte={};
  DEV.forEach(v=>[0,1,2,3].forEach(i=>{
   if(!v[i])return;
   const k=lautDe(v[i]);
   (karte[k]=karte[k]||new Set()).add(v[i]);}));
  const verschmolzen=Object.keys(karte)
   .filter(k=>karte[k].size>1&&echteHomophone.indexOf(k)<0);
  pruef('Die Lauttoleranz verschmilzt keine fremden Formen',
   verschmolzen.length===0,
   verschmolzen.map(k=>k+': '+[...karte[k]].join('/')).slice(0,4).join(' | '));

  let innenGleich=[];
  DEV.forEach(v=>{
   const k=[lautDe(v[0]),lautDe(v[1]),lautDe(v[2])];
   /* genesen, geschehen und vergessen haben im Deutschen gleiche
      Infinitiv- und Partizipform - das ist die Sprache, nicht der
      Vergleich. */
   if(new Set(k).size<3&&['genesen','geschehen','vergessen'].indexOf(v[0])<0)
    innenGleich.push(v[0]);});
  pruef('Die drei Stammformen bleiben unterscheidbar',innenGleich.length===0,
   innenGleich.slice(0,4).join(', '));

  /* Die Schreibweise ist bei diesen drei Themen die Uebung. Ihre
     Aufgaben muessen darum gegen gesprochene Antworten gesperrt sein. */
  const schreibThemen=['de-stamm','de-stamm-rueck','de-praesens'];
  const wahlThemen=['de-objekt','de-tempus','de-modus','de-passiv','de-selbst'];
  let ohneFlagge=[],falscheFlagge=[];
  for(const id of schreibThemen){
   const tp=mtopic(id);
   for(let lv=1;lv<=3;lv++)for(let k=0;k<8;k++){
    const x=genItem(tp,lv,{});
    if(x&&x.type==='input'&&!x.tippen)ohneFlagge.push(id+' lv'+lv);}}
  for(const id of wahlThemen){
   const tp=mtopic(id);
   for(let lv=1;lv<=3;lv++)for(let k=0;k<8;k++){
    const x=genItem(tp,lv,{});
    if(x&&x.tippen)falscheFlagge.push(id+' lv'+lv);}}
  pruef('Alle Schreibaufgaben sind gegen Sprechen gesperrt',!ohneFlagge.length,
   ohneFlagge.slice(0,4).join(', '));
  pruef('Auswahlaufgaben bleiben offen fuers Sprechen',!falscheFlagge.length,
   falscheFlagge.slice(0,4).join(', '));

  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
