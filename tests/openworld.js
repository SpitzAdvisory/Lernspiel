/* Modul «Open World 1»: Daten, Aufgaben, Lückensätze und Ton. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8828);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'..','ow_audio_manifest.json'),'utf8'));
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:900,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8828/');
 await pg.waitForFunction(()=>typeof OWT!=='undefined');
 const r=await pg.evaluate(async(dateien)=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  S.lang='de';
  /* ---- Daten ---- */
  pruef('Sieben Units',OWU.length===7,OWU.length);
  pruef('521 Wörter',OWU.reduce((a,u)=>a+u[2].length,0)===521,OWU.reduce((a,u)=>a+u[2].length,0));
  pruef('61 unregelmässige Verben',OWV.length===61,OWV.length);
  pruef('35 Zahlwörter',OWZ.length===35,OWZ.length);
  const kaputt=[];
  OWU.forEach(u=>u[2].forEach(w=>{if(!w[0]||!w[1])kaputt.push(u[0]+': '+w[0]);}));
  pruef('Jedes Wort hat Englisch und Deutsch',kaputt.length===0,kaputt.slice(0,3).join(' | '));
  const ohneIpa=[];OWU.forEach(u=>u[2].forEach(w=>{if(!w[3])ohneIpa.push(w[0]);}));
  pruef('Jedes Wort hat Lautschrift',ohneIpa.length===0,ohneIpa.slice(0,3).join(' | '));
  const ohneEx=[];OWU.forEach(u=>u[2].forEach(w=>{if(!w[4])ohneEx.push(w[0]);}));
  pruef('Höchstens ein Wort ohne Beispielsatz',ohneEx.length<=1,ohneEx.join(' | '));
  const vk=OWV.filter(v=>v.length!==4||!v[0]||!v[1]||!v[2]||!v[3]);
  pruef('Jedes Verb hat drei Formen und die Bedeutung',vk.length===0,vk.slice(0,3).map(v=>v[0]).join(' | '));
  const zk=OWZ.filter(p=>!p[1]||!p[2]||!p[3]);
  pruef('Jede Zahl hat Grund- und Ordnungsform',zk.length===0,zk.slice(0,3).join(' | '));
  pruef('Stichprobe: five → the fifth',(OWZ.find(p=>p[0]===5)||[])[2]==='the fifth');
  pruef('Stichprobe: begin → began → begun',
   JSON.stringify((OWV.find(v=>v[0]==='begin')||[]).slice(0,3))==='["begin","began","begun"]');

  /* ---- Themen ---- */
  pruef('Zehn Themen',OWT.length===10,OWT.length);
  pruef('Eine Kachel mit allen Themen',OW_GAME.builtin===true&&OW_GAME.gen.topics.length===10);
  const fehlend=OWT.filter(tp=>!mtopic(tp.id));
  pruef('Jedes Thema ist auffindbar',fehlend.length===0,fehlend.map(x=>x.id).join(' | '));

  let probleme=[],mitTon=0,gesamt=0;
  for(const tp of OWT)for(const lv of [1,2,3]){
   for(let k=0;k<25;k++){
    let it=null;
    try{ it=genItem(tp,lv,{}); }catch(e){ probleme.push(tp.id+': '+e.message); break; }
    if(!it){probleme.push(tp.id+'/'+lv+': kein Item');break;}
    gesamt++;
    if(!String(it.prompt||'').trim())probleme.push(tp.id+': leerer Fragetext');
    if(it.type==='input'&&!it.answer)probleme.push(tp.id+': ohne Antwort');
    if(it.type==='single'&&new Set(it.options).size!==it.options.length)probleme.push(tp.id+': doppelte Auswahl');
    if(it.sound){mitTon++;if(it.spr!=='en')probleme.push(tp.id+': Ton nicht englisch');}
   }}
  probleme=[...new Set(probleme)];
  pruef('Alle Themen erzeugen brauchbare Aufgaben',probleme.length===0,probleme.slice(0,3).join(' | '));
  pruef('Viele Aufgaben bringen den Ton mit',mitTon>gesamt/4,mitTon+' von '+gesamt);

  /* ---- Lückensatz ---- */
  let mitLuecke=0,ohneWort=[];
  for(const u of OWU)for(const w of u[2]){
   const l=owLuecke(w);
   if(!l)continue;
   mitLuecke++;
   if(l.indexOf('…')<0)ohneWort.push(w[0]);
   if(new RegExp('\\b'+w[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(l))ohneWort.push(w[0]);
  }
  pruef('Die meisten Wörter liefern einen Lückensatz',mitLuecke>400,mitLuecke+' von 521');
  pruef('Im Lückensatz steht die Lösung nicht mehr',ohneWort.length===0,ohneWort.slice(0,3).join(' | '));

  /* ---- Tondateien ---- */
  const satz=new Set(dateien);
  let fehltTon=[];
  for(const u of OWU)for(const w of u[2]){
   const f=audioUrl(w[0],'en').split('/').pop();
   if(!satz.has(f))fehltTon.push(w[0]);
  }
  pruef('Zu jedem Wort gehört eine erzeugte Tondatei',fehltTon.length===0,
   fehltTon.length+' fehlen, z.B. '+fehltTon.slice(0,3).join(', '));

  /* ---- Sprechaufgabe ---- */
  const si=genItem(mtopic('ow-verbs-sprechen'),1,{});
  pruef('Sprechaufgabe auf Englisch',si.type==='speak'&&si.spr==='en',si.type+'/'+si.spr);
  pruef('Drei Formen werden verlangt',si.formen&&si.formen.length===3,JSON.stringify(si.formen));
  pruef('Kate bekommt einen Satz zum Vorlesen',/^The three forms of /.test(si.sound),si.sound);
  pruef('Englische Formen werden nach Wörtern beurteilt',
   hoerUrteilDe(['begin began begun'],['begin','began','begun']).ok===true&&
   hoerUrteilDe(['begin began'],['begin','began','begun']).ok===false);
  return aus;},manifest.map(x=>x.file));
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
