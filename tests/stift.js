/* Stiftaufgaben nur auf Geraeten mit Stift.
   Urs am 17.11.2026: «Diese Art von Aufgaben soll auf dem iPhone gar
   nicht erscheinen! iPhones funktionieren nicht mit einem Pen.»
   Entschieden wird an der kuerzeren Bildschirmkante des Geraets, nicht an
   der Fensterbreite und nicht an einer Geraeteliste. Ein Schalter im
   Geraet deckt die Ausnahmen ab. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8889);
const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
(async()=>{
 const b=await chromium.launch();
 const lade=async(vw,vh,sw,sh)=>{
  const ctx=await b.newContext({viewport:{width:vw,height:vh},screen:{width:sw,height:sh}});
  const pg=await ctx.newPage();
  await pg.goto('http://127.0.0.1:8889/');
  await pg.waitForFunction(()=>typeof genTopics!=='undefined'&&typeof stiftGeraet!=='undefined');
  return {ctx,pg};};

 /* ---------- Die Geraete ---------- */
 const faelle=[
  ['iPhone hoch',390,844,390,844,false],
  ['iPhone quer',844,390,390,844,false],
  ['kleines Telefon',320,568,320,568,false],
  ['iPad mini',744,1133,744,1133,true],
  ['iPad hoch',810,1080,810,1080,true],
  ['iPad quer',1080,810,810,1080,true],
  ['Desktop',1366,900,1920,1080,true]];
 for(const [nm,vw,vh,sw,sh,soll] of faelle){
  const {ctx,pg}=await lade(vw,vh,sw,sh);
  const r=await pg.evaluate(()=>{
   const ids=genTopics(MATH_GAME).map(x=>x.id);
   return {stift:stiftGeraet(),
    uebrig:ids.filter(x=>STIFTTHEMEN.indexOf(x)>=0),
    written:ids.indexOf('m3-written')>=0,
    gesamt:ids.length};});
  pruef('Stift erkannt ('+nm+')',r.stift===soll,'erwartet '+soll+', war '+r.stift);
  pruef('Stiftthemen '+(soll?'vorhanden':'weg')+' ('+nm+')',
   soll?r.uebrig.length===3:r.uebrig.length===0,r.uebrig.join(',')||'keine');
  pruef('Schriftlich getippt bleibt ('+nm+')',r.written);
  await ctx.close();}

 /* ---------- Das Fenster entscheidet nicht ----------
    Die App hat eine eigene Funktion screen(). Greift die Erkennung
    versehentlich darauf statt auf window.screen, faellt sie auf die
    Fensterbreite zurueck - und ein schmal gezogenes Fenster am Desktop
    liesse die Aufgaben verschwinden. Genau das war der erste Stand. */
 {const {ctx,pg}=await lade(400,900,1920,1080);
  const r=await pg.evaluate(()=>({stift:stiftGeraet(),
   n:genTopics(MATH_GAME).filter(x=>STIFTTHEMEN.indexOf(x.id)>=0).length,
   innen:window.innerWidth}));
  pruef('Ein schmales Fenster am grossen Schirm behält den Stift',r.stift===true,
   'Fenster '+r.innen+' px');
  pruef('Die Stiftthemen bleiben im schmalen Fenster',r.n===3,r.n);
  await ctx.close();}
 /* Und umgekehrt: ein breites Fenster macht aus einem Telefon kein iPad. */
 {const {ctx,pg}=await lade(1200,800,390,844);
  const r=await pg.evaluate(()=>({stift:stiftGeraet(),
   n:genTopics(MATH_GAME).filter(x=>STIFTTHEMEN.indexOf(x.id)>=0).length}));
  pruef('Ein breites Fenster macht aus dem Telefon kein Stiftgerät',r.stift===false);
  pruef('Die Stiftthemen bleiben weg',r.n===0,r.n);
  await ctx.close();}

 /* ---------- Der Schalter ---------- */
 {const {ctx,pg}=await lade(390,844,390,844);
  const r=await pg.evaluate(()=>{
   const o={};
   for(const v of ['ja','nein','auto']){
    stiftGeraetSet(v);
    o[v]={gespeichert:stiftGeraetGet(),stift:stiftGeraet(),
     n:genTopics(MATH_GAME).filter(x=>STIFTTHEMEN.indexOf(x.id)>=0).length};}
   stiftGeraetSet('auto');
   return o;});
  pruef('Der Schalter schaltet den Stift am Telefon ein',r.ja.stift===true&&r.ja.n===3);
  pruef('Der Schalter schaltet ihn auch aus',r.nein.stift===false&&r.nein.n===0);
  pruef('Ohne Schalter entscheidet der Bildschirm',r.auto.gespeichert==='auto'&&r.auto.stift===false);
  await ctx.close();}
 /* Der Schalter gehoert zum Geraet, nicht zum Kind: er muss einen
    Neustart ueberdauern und darf nicht im Profil landen. */
 {const {ctx,pg}=await lade(390,844,390,844);
  await pg.evaluate(()=>stiftGeraetSet('ja'));
  await pg.reload();
  await pg.waitForFunction(()=>typeof stiftGeraet!=='undefined');
  const r=await pg.evaluate(()=>({stift:stiftGeraet(),
   imProfil:JSON.stringify(S.profiles||[]).indexOf('stift')>=0}));
  pruef('Der Schalter überdauert den Neustart',r.stift===true);
  pruef('Der Schalter steht nicht im Profil',!r.imProfil);
  await ctx.close();}

 /* ---------- Von Hand schreiben ---------- */
 {const {ctx,pg}=await lade(390,844,390,844);
  const r=await pg.evaluate(()=>{
   SCHRIFTOK=true;
   const p={id:'stA',name:'Johannes',avatar:'🦉',geb:'2014-03-14',pen:true};
   S.profiles=S.profiles.filter(x=>x.id!=='stA').concat([p]);
   S.run={id:'x',players:[p],game:FRV_GAME,mode:'learn',q:0,answers:[],ended:false};
   const amGeraet=penNow();
   /* Und die Vokabelaufgabe muss getippt kommen, nicht geschrieben. */
   const tp=FRTOPICS.find(x=>x.dd&&(x.w||[]).length>=10);
   const arten=new Set();
   for(let k=0;k<30;k++)arten.add(frWrite(tp).type);
   return {amGeraet,arten:[...arten]};});
  pruef('Von Hand schreiben ist am Telefon aus',r.amGeraet===false);
  pruef('Die Vokabel kommt getippt statt geschrieben',
   r.arten.indexOf('handwrite')<0,r.arten.join(','));
  await ctx.close();}
 {const {ctx,pg}=await lade(810,1080,810,1080);
  const r=await pg.evaluate(()=>{
   SCHRIFTOK=true;
   const p={id:'stA',name:'Johannes',avatar:'🦉',geb:'2014-03-14',pen:true};
   S.profiles=S.profiles.filter(x=>x.id!=='stA').concat([p]);
   const tp=FRTOPICS.find(x=>x.dd&&(x.w||[]).length>=10);
   const arten=new Set();
   for(let k=0;k<30;k++)arten.add(frWrite(tp).type);
   return [...arten];});
  pruef('Auf dem iPad bleibt das Schreiben von Hand möglich',r.indexOf('handwrite')>=0,r.join(','));
  await ctx.close();}

 /* ---------- Der Schalter in den Einstellungen ----------
    Ohne Bedienung waere die Ausnahme nur ueber die Entwicklerkonsole
    erreichbar, und damit fuer Urs nicht vorhanden. */
 {const {ctx,pg}=await lade(390,844,390,844);
  const r=await pg.evaluate(async()=>{
   /* Der Pruefstand startet ohne Ablage; adminSettings liest aber
      S.store.kind. Darum hier eine gesetzt. */
   if(!S.store)S.store={kind:'browser',name:'Test'};
   S.admin=true;viewAdmin('settings');
   await new Promise(x=>setTimeout(x,1500));
   const sel=document.querySelector('#sg');
   if(!sel)return {da:false};
   const werte=[...sel.options].map(o=>o.value);
   sel.value='ja';sel.dispatchEvent(new Event('change'));
   const nachJa={stift:stiftGeraet(),text:document.body.textContent.indexOf(t('stiftJetztJa'))>=0};
   sel.value='auto';sel.dispatchEvent(new Event('change'));
   const nachAuto={stift:stiftGeraet(),text:document.body.textContent.indexOf(t('stiftJetztNein'))>=0};
   return {da:true,werte,nachJa,nachAuto,
    titel:document.body.textContent.indexOf(t('stiftTitel'))>=0};});
  pruef('Der Schalter steht in den Einstellungen',r.da===true);
  pruef('Er bietet die drei Möglichkeiten',r.da&&r.werte.join(',')==='auto,ja,nein',r.werte&&r.werte.join(','));
  pruef('Die Überschrift steht da',r.da&&r.titel);
  pruef('Umstellen wirkt sofort',r.da&&r.nachJa.stift===true&&r.nachAuto.stift===false);
  pruef('Der Stand wird angezeigt',r.da&&r.nachJa.text&&r.nachAuto.text);
  await ctx.close();}
 /* Die Texte in allen drei Sprachen. */
 {const {ctx,pg}=await lade(810,1080,810,1080);
  const r=await pg.evaluate(()=>{
   const keys=['stiftTitel','stiftNote','stiftFrage','stiftAuto','stiftJa','stiftNein',
    'stiftJetztJa','stiftJetztNein'];
   const fehlt=[];
   for(const k of keys)for(const l of ['de','en','fr'])
    if(!T[l]||!T[l][k]||!String(T[l][k]).trim())fehlt.push(l+'.'+k);
   const scharf=keys.filter(k=>/ß/.test(String((T.de&&T.de[k])||'')));
   return {fehlt,scharf};});
  pruef('Die Texte stehen in allen drei Sprachen',r.fehlt.length===0,r.fehlt.join(', '));
  pruef('Kein scharfes s im Deutschen',r.scharf.length===0,r.scharf.join(', '));
  await ctx.close();}

 /* ---------- Die drei Themen gibt es wirklich ---------- */
 {const {ctx,pg}=await lade(810,1080,810,1080);
  const r=await pg.evaluate(()=>{
   const fehlt=STIFTTHEMEN.filter(id=>!mtopic(id));
   const nurStift=STIFTTHEMEN.every(id=>{
    const tp=mtopic(id);const arten=new Set();
    for(let k=0;k<12;k++)arten.add(tp.g(2).type);
    return arten.size===1&&arten.has('stellen');});
   return {fehlt,nurStift,kante:STIFT_KANTE};});
  pruef('Alle drei Stiftthemen gibt es',r.fehlt.length===0,r.fehlt.join(','));
  pruef('Sie bestehen ganz aus Kästchenaufgaben',r.nurStift);
  pruef('Die Grenze liegt zwischen Telefon und iPad',
   r.kante>480&&r.kante<744,r.kante);
  await ctx.close();}

 await b.close();srv.close();
 for(const [s,n,x] of aus)console.log(s+' '+n+(x?'  ['+x+']':''));
 const schlecht=aus.filter(a=>a[0]==='FAIL').length;
 console.log(schlecht?'NICHT BESTANDEN: '+schlecht:'bestanden: '+aus.length+' Pruefungen');
 process.exit(schlecht?1:0);
})().catch(e=>{console.log('FAIL Abbruch ['+e.message+']');process.exit(1);});
