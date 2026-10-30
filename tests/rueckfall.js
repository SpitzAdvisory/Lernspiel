/* Scheitert Whisper am Speicher, uebernimmt die Erkennung des Browsers.
   Geprueft wird mit einem nachgebauten SpeechRecognition. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':'application/octet-stream'});
 s.end(fs.readFileSync(f));}).listen(8798);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8798/');
 await pg.waitForFunction(()=>typeof hoerPruefe==='function'&&typeof sprechSchritt==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);

  /* Whisper scheitert wie auf dem iPad */
  window.hoerLaden=()=>{HOERKAPUTT='[wasm] RangeError: Out of memory';
   return Promise.reject(new Error('[wasm] RangeError: Out of memory'));};
  /* Erkennung des Browsers nachbauen */
  let letzteSprache=null, gestoppt=false, gestartet=false;
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){
   const self=this;this.lang='';this.continuous=null;this.interimResults=null;this.maxAlternatives=0;
   this.start=()=>{gestartet=true;letzteSprache=self.lang;
    setTimeout(()=>{ if(self.onresult) self.onresult({results:[
      Object.assign([{transcript:window.__antwort||'la cloche'},{transcript:'la clauche'}],{length:2})]});
     if(self.onend)self.onend(); },20);};
   this.stop=()=>{gestoppt=true;};
  };
  /* Die App bringt eine Vermittleradresse mit. Fuer die Pruefung der
     uebrigen Hoerwege wird sie abgeschaltet. */
  await IDB.set('kv','proxyUrl','aus');
  HOERWEG=null;HOERKAPUTT=null;

  window.__antwort='la cloche';
  const r1=await hoerPruefe('la cloche',[],{});
  pruef('Rückfall auf die Erkennung des Browsers',HOERWEG==='browser',HOERWEG);
  pruef('Richtig gesprochen wird angenommen',r1.ok===true,JSON.stringify(r1.text));
  pruef('Sprache auf Französisch gestellt',letzteSprache==='fr-FR',letzteSprache);

  /* Zweite Fassung zaehlt: die erste falsch, die zweite richtig */
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){const self=this;
   this.start=()=>{setTimeout(()=>{if(self.onresult)self.onresult({results:[
     Object.assign([{transcript:'la blouche'},{transcript:'la cloche'}],{length:2})]});
    if(self.onend)self.onend();},20);};this.stop=()=>{};};
  const r2=await hoerPruefe('la cloche',[],{});
  pruef('Zweite Fassung zählt mit',r2.ok===true&&r2.text==='la cloche',JSON.stringify(r2.text));

  /* Nichts gesagt */
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){const self=this;
   this.start=()=>{setTimeout(()=>{if(self.onerror)self.onerror({error:'no-speech'});
    if(self.onend)self.onend();},20);};this.stop=()=>{};};
  const r3=await hoerPruefe('la cloche',[],{});
  pruef('Kein Ton ergibt "nichts gehört"',r3.leer===true);

  /* Mikrofon gesperrt */
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){const self=this;
   this.start=()=>{setTimeout(()=>{if(self.onerror)self.onerror({error:'not-allowed'});},20);};this.stop=()=>{};};
  let f4=null;try{await hoerPruefe('la cloche',[],{});}catch(e){f4=e.message;}
  pruef('Gesperrtes Mikrofon wird benannt',f4==='kein-mikrofon',f4);
  pruef('Meldung dazu auf Deutsch da',!!hoerText('kein-mikrofon'),hoerText('kein-mikrofon'));

  /* Ganz ohne Erkennung: Sprechteil faellt weg */
  delete window.webkitSpeechRecognition;delete window.SpeechRecognition;
  const alt=navigator.mediaDevices;
  Object.defineProperty(navigator,'mediaDevices',{value:undefined,configurable:true});
  pruef('Ohne alles meldet die App keine Bereitschaft',hoerMoeglich()===false);
  Object.defineProperty(navigator,'mediaDevices',{value:alt,configurable:true});
  return aus;});

 /* Anzeige des Gehoerten */
 const r2=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  window.hoerLaden=()=>Promise.reject(new Error('aus'));
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){const self=this;
   this.start=()=>{setTimeout(()=>{if(self.onresult)self.onresult({results:[
     Object.assign([{transcript:window.__gesagt||'la cloche'}],{length:1})]});
    if(self.onend)self.onend();},20);};this.stop=()=>{};};
  HOERWEG=null;HOERKAPUTT=null;
  const nb=h('button',{class:'btn'},'Weiter');
  const el=sprechSchritt({sprich:'la cloche',sprichAccept:[]},nb,null,null,null);
  document.body.append(el);
  const mic=el.querySelector('.row button');
  const kasten=()=>[...el.querySelectorAll('div')].find(d=>d.getAttribute('aria-live')==='polite'&&d.style.borderRadius);
  pruef('Kasten steht von Anfang an da',!!kasten()&&kasten().style.display!=='none');
  pruef('Platzhalter vor dem ersten Versuch',!!kasten()&&kasten().children[1].textContent.trim().length>0,
   kasten()&&kasten().children[1].textContent);
  window.__gesagt='la cloche';
  mic.click();await new Promise(r=>setTimeout(r,300));
  const k=kasten();
  pruef('Gehörtes sichtbar',!!k&&k.style.display!=='none');
  pruef('Gehörtes im Wortlaut',!!k&&/la cloche/.test(k.textContent),k&&k.children[1].textContent);
  const gr=k&&k.children[1].style.fontSize;
  pruef('In voller Größe',gr==='1.45rem',gr);
  pruef('Grün umrandet bei richtig',!!k&&/green/.test(k.style.borderColor||''),k&&k.style.borderColor);
  el.remove();

  /* falsch gesprochen */
  const el2=sprechSchritt({sprich:'la cloche',sprichAccept:[]},h('button',{class:'btn'},'Weiter'),null,null,null);
  document.body.append(el2);
  window.__gesagt='le bateau rouge';
  el2.querySelector('.row button').click();await new Promise(r=>setTimeout(r,300));
  const k2=[...el2.querySelectorAll('div')].find(d=>d.getAttribute('aria-live')==='polite'&&d.style.borderRadius);
  pruef('Auch bei falsch sichtbar',!!k2&&k2.style.display!=='none');
  pruef('Falsches im Wortlaut',!!k2&&/le bateau rouge/.test(k2.textContent),k2&&k2.children[1].textContent);
  pruef('Rot umrandet bei falsch',!!k2&&/red/.test(k2.style.borderColor||''),k2&&k2.style.borderColor);
  el2.remove();
  return aus;});

 let f=0;
 [...r,...r2].forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
