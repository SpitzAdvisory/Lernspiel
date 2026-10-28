/* Weiter nur bei richtiger Aussprache; falsch haelt die Huerde geschlossen. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8806);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8806/');
 await pg.waitForFunction(()=>typeof sprechSchritt==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  window.hoerLaden=()=>Promise.reject(new Error('aus'));
  window.SpeechRecognition=window.webkitSpeechRecognition=function(){const self=this;
   this.start=()=>{setTimeout(()=>{const w=window.__sagt;
    if(w&&self.onresult)self.onresult({results:[Object.assign([{transcript:w}],{length:1})]});
    if(self.onend)self.onend();},20);};this.stop=()=>{};};
  HOERWEG=null;HOERKAPUTT=null;
  const R={score:[100],target:12,extra:0,mode:'learn',answers:[{points:10}]};
  const nb=h('button',{class:'btn'},t('next'));
  const el=sprechSchritt({sprich:'la cloche',sprichAccept:[]},nb,null,R,0);
  document.body.append(el);
  const mic=()=>el.querySelector('.row button');
  const weiterDa=()=>[...el.querySelectorAll('button')].some(x=>x.textContent.trim()===t('next'));
  const kasten=()=>[...el.querySelectorAll('div')].find(d=>d.getAttribute('aria-live')==='polite'&&d.style.borderRadius);

  pruef('Weiter zu Beginn nicht da',!weiterDa());
  window.__sagt='le bateau rouge';
  mic().click();await new Promise(r=>setTimeout(r,300));
  const k=kasten();
  pruef('Falsch: rot umrandet',!!k&&/red/.test(k.style.borderColor||''),k&&k.style.borderColor);
  pruef('Falsch: Urteil in Worten',!!k&&/Noch nicht richtig|Not right|Pas encore/i.test(k.children[2].textContent),
   k&&k.children[2].textContent);
  pruef('Falsch: Weiter bleibt gesperrt',!weiterDa());
  pruef('Falsch: Mikrofon wieder bedienbar',mic().disabled===false);
  pruef('Falsch: Überspringen noch da',
   [...el.querySelectorAll('button')].some(x=>/berspringen|Skip|Passer/.test(x.textContent)));

  window.__sagt='la cloche';
  mic().click();await new Promise(r=>setTimeout(r,300));
  const k2=kasten();
  pruef('Richtig: grün umrandet',!!k2&&/green/.test(k2.style.borderColor||''),k2&&k2.style.borderColor);
  pruef('Richtig: Weiter erscheint',weiterDa());
  pruef('Richtig: Mikrofon gesperrt',mic().disabled===true);
  pruef('Richtig: Überspringen verschwunden',
   ![...el.querySelectorAll('button')].some(x=>/berspringen|Skip|Passer/.test(x.textContent)&&x.offsetParent!==null));
  pruef('Richtig kostete keine Punkte',R.score[0]===100,String(R.score[0]));
  el.remove();
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
