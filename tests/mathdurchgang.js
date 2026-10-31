/* Durchgang durch die Mathematik der Jahre 4 bis 9, auf iPad-Breite.
   Geprueft wird, was ohne Geraet pruefbar ist: dass jedes Thema auf jeder
   Stufe eine brauchbare Aufgabe liefert, dass sie sich zeichnen laesst und
   dass sie nicht aus dem Bild laeuft. Stift, Safari und Ton braucht es
   dafuer trotzdem am echten Geraet. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8827);
(async()=>{
 const b=await chromium.launch();
 /* iPad hoch: 820 x 1180 Punkte */
 const ctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,deviceScaleFactor:2});
 const pg=await ctx.newPage();
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8827/');
 await pg.waitForFunction(()=>typeof MT!=='undefined'&&typeof renderQuestion==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,ok,x)=>aus.push([ok?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  S.lang='de';
  const themen=MT.filter(t=>t.y>=4&&t.y<=9);
  pruef('Themen der Jahre 4 bis 9 vorhanden',themen.length>0,themen.length+' Themen');

  const R={id:'t',players:[TEST_PLAYER],game:MATH_GAME,mode:'learn',diff:'medium',adaptive:false,
   started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],best:[0],lives:3,
   level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,target:12,
   retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;

  const ohneItem=[],leer=[],ohneAntwort=[],kaputt=[],zuBreit=[];
  let gezeichnet=0;
  for(const tp of themen){
   for(const lv of [1,2,3]){
    /* Erzeugen: viele Proben, damit seltene Zweige mitkommen */
    for(let k=0;k<25;k++){
     let it=null;
     try{ it=genItem(tp,lv,{}); }catch(e){ kaputt.push(tp.id+'/'+lv+': '+e.message); break; }
     if(!it){ohneItem.push(tp.id+'/'+lv);break;}
     if(!String(it.prompt||'').trim())leer.push(tp.id);
     if((it.type==='input'||it.type==='num')&&it.answer==null&&!it.fields&&!it.ans)ohneAntwort.push(tp.id);
    }
    /* Zeichnen: eine Aufgabe je Thema und Stufe */
    let it=null;
    try{ it=genItem(tp,lv,{}); }catch(e){ continue; }
    if(!it)continue;
    try{
     const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;R.ended=false;
     renderQuestion(R,Q);gezeichnet++;
    }catch(e){ kaputt.push(tp.id+'/'+lv+' beim Zeichnen: '+e.message); continue; }
    await new Promise(r=>setTimeout(r,0));
    const karte=document.querySelector('.page .card');
    if(karte){
     const br=karte.scrollWidth, sicht=document.documentElement.clientWidth;
     if(br>sicht+2)zuBreit.push(tp.id+'/'+lv+': '+br+' statt '+sicht);
    }
   }
  }
  pruef('Jedes Thema liefert auf jeder Stufe eine Aufgabe',ohneItem.length===0,ohneItem.slice(0,4).join(' | '));
  pruef('Keine Aufgabe wirft einen Fehler',kaputt.length===0,kaputt.slice(0,3).join(' | '));
  pruef('Kein leerer Fragetext',[...new Set(leer)].length===0,[...new Set(leer)].slice(0,4).join(' | '));
  pruef('Jede Eingabeaufgabe hat eine Antwort',[...new Set(ohneAntwort)].length===0,
   [...new Set(ohneAntwort)].slice(0,4).join(' | '));
  pruef('Alle Aufgaben gezeichnet',gezeichnet===themen.length*3,gezeichnet+' von '+(themen.length*3));
  pruef('Nichts läuft auf iPad-Breite aus dem Bild',zuBreit.length===0,zuBreit.slice(0,4).join(' | '));
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  SEITENFEHLER: '+perr.slice(0,5).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error('Abbruch: '+e.message);srv.close();process.exit(1);});
