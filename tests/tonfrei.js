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
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,3).join(' | '));}
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 await b.close();srv.close();process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
