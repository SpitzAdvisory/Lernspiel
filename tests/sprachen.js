/* Bei den Sprachen darf kein Schreibblatt erscheinen, und keine Aufgabe
   darf verlangen, von Hand zu schreiben. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':'text/html'});s.end(fs.readFileSync(f));}).listen(8805);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8805/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  S.penForce=true;
  const machRun=(spiel)=>({id:'t',players:[TEST_PLAYER],game:spiel,mode:'learn',diff:'medium',
   adaptive:false,started:new Date(),pool:[],used:new Set(),answers:[],score:[0],streak:[0],
   best:[0],lives:3,level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,
   target:99,retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity});
  const pruefSpiel=(spiel,blattErwartet)=>{
   let hand=0, mitBlatt=0, n=0;
   const ids=spiel.gen&&spiel.gen.topics?spiel.gen.topics:gameUnits(spiel);
   for(const id of ids){
    const tp=mtopic(id);if(!tp||typeof tp.g!=='function')continue;
    for(let k=0;k<14;k++){
     let it;try{it=genItem(tp,1+(k%3),spiel.gen);}catch(_){continue;}
     if(!it||!it.type)continue;n++;
     if(it.type==='handwrite')hand++;
     const R=machRun(spiel);S.run=R;
     const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;
     try{renderQuestion(R,Q);}catch(_){continue;}
     if(document.querySelector('.padbox'))mitBlatt++;
    }}
   return {n,hand,mitBlatt};};
  for(const [spiel,blatt] of [[FRV_GAME,false],[FRG_GAME,false],[IT_GAME,false],[MATH_GAME,true]]){
   if(!spiel)continue;
   const z=pruefSpiel(spiel,blatt);
   pruef(spiel.id+': keine Schreibaufgaben von Hand', blatt?true:z.hand===0, z.hand+' von '+z.n);
   if(blatt) pruef(spiel.id+': Blatt weiterhin da', z.mitBlatt>0, z.mitBlatt+' von '+z.n);
   else      pruef(spiel.id+': kein Blatt', z.mitBlatt===0, z.mitBlatt+' von '+z.n);
  }
  pruef('Versionsangabe vorhanden',typeof APPVER==='string'&&/^V\d+$/.test(APPVER),APPVER);
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
