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

  /* Der Bildschirm bleibt im Hoermodus wach. Die echte Sperre kann nur
     das Geraet geben; geprueft wird, dass sie richtig angefordert,
     freigegeben und nach dem Wegschalten neu geholt wird. */
  pruef('Die Moeglichkeit wird erkannt, nicht angenommen',
   typeof wachMoeglich==='function');
  let geholt=0,frei=0;
  const echteSperre=navigator.wakeLock;
  let letzte=null;
  Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{
   request:async(art)=>{geholt++;
    letzte={art:art,hoerer:[],
     release:async()=>{frei++;letzte.hoerer.forEach(f=>f());},
     addEventListener:(n,f)=>{if(n==='release')letzte.hoerer.push(f);}};
    return letzte;}}});

  await wachAn();
  pruef('Die Sperre wird angefordert',geholt===1,'geholt: '+geholt);
  pruef('Und zwar fuer den Bildschirm',letzte&&letzte.art==='screen',letzte&&letzte.art);
  await wachAn();
  pruef('Ein zweiter Anlauf holt sie nicht doppelt',geholt===1,'geholt: '+geholt);

  /* Wegschalten gibt die Sperre frei; beim Zurueckkommen wird sie neu geholt */
  letzte.hoerer.forEach(f=>f());
  document.dispatchEvent(new Event('visibilitychange'));
  await warte(60);
  pruef('Nach dem Zurueckkommen wird sie neu geholt',geholt===2,'geholt: '+geholt);

  wachAus();
  await warte(40);
  pruef('Am Ende wird sie freigegeben',frei===1,'frei: '+frei);
  document.dispatchEvent(new Event('visibilitychange'));
  await warte(60);
  pruef('Danach wird sie nicht mehr geholt',geholt===2,'geholt: '+geholt);

  /* Ohne Unterstuetzung laeuft alles weiter, nur ohne Sperre */
  Object.defineProperty(navigator,'wakeLock',{configurable:true,value:undefined});
  let ohne=null;
  try{ ohne=await wachAn(); }catch(e){ ohne='Ausnahme: '+e.message; }
  pruef('Ohne Unterstuetzung wirft nichts',ohne===false,String(ohne));
  wachAus();
  Object.defineProperty(navigator,'wakeLock',{configurable:true,value:echteSperre});

  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 await b.close();srv.close();process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
