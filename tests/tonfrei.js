/* Die Tonfreigabe fuer Safari: ein ungueltiger Stummton macht sie
   wirkungslos, ohne dass es auffaellt. Darum wird die eingebaute Datei
   selbst geladen und vermessen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs');
const srv=http.createServer((q,s)=>{s.writeHead(200,{'Content-Type':'text/html'});
 s.end(fs.readFileSync('/tmp/claude-0/wtest/app.html'));}).listen(8831);
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const pg=await b.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8831/');
 await pg.waitForFunction(()=>typeof tonFreigeben==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  const warte=ms=>new Promise(r=>setTimeout(r,ms||0));
  pruef('Es gibt genau ein Vorlese-Element',vorleser()===vorleser());
  tonFreigeben();
  await warte(500);
  const el=vorleser();
  pruef('Der Stummton laedt',el.readyState>=2,'readyState '+el.readyState);
  pruef('Der Stummton ist gueltig',el.error===null,el.error?('Fehlercode '+el.error.code):'ohne Fehler');
  pruef('Der Stummton ist kurz',el.duration>0&&el.duration<0.3,el.duration);
  pruef('Danach ist das Element nicht stumm gestellt',el.muted===false);
  pruef('Die Freigabe wirft nichts',(()=>{try{tonFreigeben();return true;}catch(_){return false;}})());
  /* Ein Satz ohne Netz und ohne Aufnahme faellt auf die Stimme des
     Browsers zurueck, statt den Lauf anzuhalten. */
  await IDB.set('kv','proxyUrl','aus');
  const echt=window.fetch;window.fetch=async()=>({ok:false,status:404});
  let fertig=false;
  const p=sprich('Testsatz','de').then(()=>{fertig=true;});
  await Promise.race([p,warte(2500)]);
  window.fetch=echt;
  pruef('Ohne Vermittler kehrt das Vorlesen zurueck',fertig);

  /* Ein Satz wird genau einmal geholt: der zweite Aufruf nimmt den
     Zwischenspeicher und ruehrt das Netz nicht an. */
  await IDB.set('kv','proxyUrl','https://vermittler.example/');
  let rufe=0;
  const echt2=window.fetch;
  window.fetch=async(u,o)=>{
   const url=String(u);
   if(/vermittler\.example\/tts$/.test(url)){rufe++;
    return {ok:true,status:200,blob:async()=>new Blob([new Uint8Array(2000)],{type:'audio/mpeg'})};}
   if(/audio\//.test(url))return {ok:false,status:404};
   return echt2(u,o);};
  const satz='Ein Satz, den es nirgends gibt '+Date.now();
  const b1=await tonBesorgen(satz,'de');
  const b2=await tonBesorgen(satz,'de');
  pruef('Der Satz wird geholt',!!b1&&b1.size>400,b1&&b1.size);
  pruef('Beim zweiten Mal aus dem Geraet',rufe===1,'Netzrufe: '+rufe);
  pruef('Und es ist derselbe Ton',!!b2&&b2.size===b1.size);

  /* Zwei Aufrufe gleichzeitig teilen sich einen Netzruf. */
  const satz2='Noch einer '+Date.now();
  rufe=0;
  const [c1,c2]=await Promise.all([tonBesorgen(satz2,'de'),tonBesorgen(satz2,'de')]);
  pruef('Gleichzeitige Aufrufe holen nur einmal',rufe===1,'Netzrufe: '+rufe);
  pruef('Beide bekommen den Ton',!!c1&&!!c2);
  window.fetch=echt2;

  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 await b.close();srv.close();process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
