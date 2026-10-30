/* Der gruene Kasten und die Statuszeile duerfen einander nie widersprechen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':'application/octet-stream'});
 s.end(fs.readFileSync(f));}).listen(8801);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:1000}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8801/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  /* Whisper aus, Erkennung des Browsers nachgebaut */
  window.hoerLaden=()=>Promise.reject(new Error('[wasm] RangeError: Out of memory'));
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){const self=this;
   this.start=()=>{setTimeout(()=>{
    const w=window.__sagt;
    if(w&&self.onresult)self.onresult({results:[Object.assign([{transcript:w}],{length:1})]});
    if(self.onend)self.onend();},20);};
   this.stop=()=>{};};
  /* Die App bringt eine Vermittleradresse mit. Fuer die Pruefung der
     uebrigen Hoerwege wird sie abgeschaltet. */
  await IDB.set('kv','proxyUrl','aus');
  HOERWEG=null;HOERKAPUTT=null;

  /* Eine Sprechaufgabe bauen */
  let it=null;
  for(const id of (FRV_GAME.gen&&FRV_GAME.gen.topics)||[]){
   const tp=mtopic(id);if(!tp||typeof tp.g!=='function')continue;
   for(let k=0;k<12&&!it;k++){const x=genItem(tp,1+(k%3),FRV_GAME.gen);if(x&&x.type==='speak')it=x;}
   if(it)break;}
  if(!it){pruef('Sprechaufgabe gefunden',false);return aus;}
  pruef('Sprechaufgabe gefunden',true,it.answer);
  pruef('Nur ein Durchgang',(it.rounds||1)===1,String(it.rounds));

  const R={id:'t',players:[TEST_PLAYER],game:FRV_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[50],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;renderQuestion(R,Q);

  const karte=()=>document.querySelector('main .card');
  const kasten=()=>[...karte().querySelectorAll('div')].find(d=>d.getAttribute('aria-live')==='polite'&&d.style.borderRadius);
  const statusZeile=()=>[...karte().querySelectorAll('p')].find(p=>p.getAttribute('aria-live')==='polite');
  const mic=()=>[...karte().querySelectorAll('button')].find(x=>/Sprechen|Speak|Parler/i.test(x.textContent));

  /* Der Kasten steht schon vor dem ersten Versuch da. */
  const k0=kasten();
  pruef('Kasten von Anfang an sichtbar',!!k0&&k0.style.display!=='none');
  pruef('Platzhalter statt leerer Fläche',!!k0&&k0.children[1].textContent.trim().length>0,
   k0&&k0.children[1].textContent);
  pruef('Keine Punktreihe bei einem Durchgang',
   ![...karte().querySelectorAll('p')].some(p=>p.style.letterSpacing==='3px'&&p.style.display!=='none'));

  /* Auf einem ausgelasteten Rechner braucht der Durchgang laenger als
     eine feste Wartezeit. Darum auf den Zustand warten, nicht auf die Uhr. */
  const warteAuf=async(f,ms)=>{const bis=performance.now()+(ms||3000);
   while(performance.now()<bis){if(f())return true;await new Promise(r=>setTimeout(r,50));}return false;};
  window.__sagt=it.answer;
  await warteAuf(()=>mic());
  mic().click();
  await warteAuf(()=>mic()&&mic().disabled===true);
  const k1=kasten(), s1=statusZeile();
  pruef('Gehörtes steht da',!!k1&&k1.style.display!=='none',k1&&k1.lastChild.textContent);
  pruef('Status meldet nicht "nichts verstanden"',!/Nichts verstanden|Nothing|Rien/i.test((s1&&s1.textContent)||''),
   s1&&s1.textContent);
  pruef('Weg wird genannt',[...karte().querySelectorAll('p')].some(p=>/Browser|navigateur/i.test(p.textContent)));
  pruef('Knopf nach dem Durchgang gesperrt',!!mic()&&mic().disabled===true,mic()?'da':'Knopf fehlt');

  /* Noch ein Versuch darf nicht mehr greifen */
  window.__sagt='';
  try{mic().click();}catch(_){}
  await new Promise(r=>setTimeout(r,700));
  const k2=kasten(), s2=statusZeile();
  const leer=/Nichts verstanden|Nothing|Rien/i.test((s2&&s2.textContent)||'');
  const gruen=!!k2&&k2.style.display!=='none';
  pruef('Kein Widerspruch zwischen Kasten und Zeile',!(leer&&gruen),
   (s2&&s2.textContent)+' | Kasten '+(gruen?'sichtbar':'weg'));
  pruef('Aufgabe wurde abgeschlossen',R.answers.length===1,R.answers.length+' Antwort(en)');
  const u1=k1&&k1.children[2];
  pruef('Urteil in Worten bei richtig',!!u1&&/Richtig|correct|juste/i.test(u1.textContent),u1&&u1.textContent);

  /* Zweite Aufgabe: nichts gesagt - der Kasten muss trotzdem dastehen. */
  const R2=Object.assign({},R,{answers:[],q:0,score:[50]});S.run=R2;
  const Q2=prepare(it,'medium');Q2.t0=performance.now();R2.cur=Q2;renderQuestion(R2,Q2);
  window.__sagt='';
  mic().click();await new Promise(r=>setTimeout(r,400));
  const k3=kasten(), s3=statusZeile();
  pruef('Ohne Verstandenes bleibt der Kasten sichtbar',!!k3&&k3.style.display!=='none');
  pruef('Platzhalter im Kasten',!!k3&&k3.children[1].textContent.trim().length>0,k3&&k3.children[1].textContent);
  pruef('Zeile nennt den Grund',/Nichts verstanden|Nothing|Rien/i.test((s3&&s3.textContent)||''),
   s3&&s3.textContent);
  pruef('Urteil im Kasten nennt "nichts verstanden"',
   !!k3&&/Nichts verstanden|Nothing understood|Rien compris/i.test(k3.children[2].textContent),
   k3&&k3.children[2].textContent);

  /* Falsch gesprochen: Urteil muss das sagen und das Ziel nennen */
  const R4=Object.assign({},R,{answers:[],q:0,score:[50]});S.run=R4;
  const Q4=prepare(it,'medium');Q4.t0=performance.now();R4.cur=Q4;renderQuestion(R4,Q4);
  window.__sagt='le bateau rouge tout a fait';
  mic().click();await new Promise(r=>setTimeout(r,400));
  const k4=kasten();
  pruef('Urteil in Worten bei falsch',!!k4&&/Noch nicht richtig|Not right|Pas encore/i.test(k4.children[2].textContent),
   k4&&k4.children[2].textContent);
  pruef('Rot umrandet bei falsch',!!k4&&/red/.test(k4.style.borderColor||''),k4&&k4.style.borderColor);
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
