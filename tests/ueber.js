/* Ueberspringen der Sprechhuerde: Weg frei, Punkte weg, eine Frage mehr. */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const D='/tmp/claude-0/wtest';
const srv=http.createServer((q,s)=>{const f=path.join(D,q.url==='/'?'app.html':decodeURIComponent(q.url).split('?')[0]);
 if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':'application/octet-stream'});
 s.end(fs.readFileSync(f));}).listen(8797);
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1000,height:900}});
 const perr=[];pg.on('pageerror',e=>perr.push(e.message));
 await pg.goto('http://127.0.0.1:8797/');
 await pg.waitForFunction(()=>typeof renderQuestion==='function'&&typeof sprechSchritt==='function');
 const r=await pg.evaluate(async()=>{
  const aus=[];
  const pruef=(n,b,x)=>aus.push([b?'OK  ':'FAIL',n,x===undefined?'':String(x)]);
  /* Lauf wie im Spiel, Modus learn */
  const R={id:'t',players:[TEST_PLAYER],game:FRV_GAME,mode:'learn',diff:'medium',
   adaptive:false,started:new Date(),pool:[],used:new Set(),answers:[],score:[100],streak:[0],
   best:[0],lives:3,level:2,up:0,down:0,q:0,masteries:{[TEST_PLAYER.id]:{}},timer:null,ended:false,
   target:12,retry:[],extra:0,gen:true,topics:null,cards:new Set(),sub:null,wcur:{},jokes:[],jokeAt:Infinity};
  S.run=R;
  /* Eine Vokabelaufgabe mit Sprechteil finden */
  let it=null;
  for(const id of (FRV_GAME.gen&&FRV_GAME.gen.topics)||[]){
   const tp=mtopic(id);if(!tp||typeof tp.g!=='function')continue;
   for(let k=0;k<6&&!it;k++){const x=genItem(tp,1+(k%3),FRV_GAME.gen);if(x&&x.sprich&&x.type==='single')it=x;}
   if(it)break;}
  if(!it){pruef('Vokabelaufgabe mit Sprechteil gefunden',false);return aus;}
  pruef('Vokabelaufgabe mit Sprechteil gefunden',true,it.sprich);

  const Q=prepare(it,'medium');Q.t0=performance.now();R.cur=Q;
  renderQuestion(R,Q);
  /* richtig beantworten, damit die Rueckmeldung mit dem Sprechteil kommt */
  const opts=[...document.querySelectorAll('main .opts .opt')];
  const iOk=Q.opts?Q.opts.findIndex(o=>o.ok):-1;
  if(iOk<0||!opts[iOk]){pruef('Antwort anklickbar',false);return aus;}
  opts[iOk].click();
  await new Promise(r=>setTimeout(r,80));

  const vorPunkte=R.score[0], vorZiel=R.target, vorExtra=R.extra;
  const knoepfe=()=>[...document.querySelectorAll('main .feedback button')];
  const ueberKnopf=knoepfe().find(x=>/berspringen|Skip|Passer/.test(x.textContent));
  pruef('Überspringen steht von Anfang an da',!!ueberKnopf,ueberKnopf&&ueberKnopf.textContent.trim());
  const weiterVorher=knoepfe().some(x=>x.textContent.trim()===t('next'));
  pruef('Weiter erscheint vorher NICHT',!weiterVorher);
  pruef('Keine Selbstbeurteilung im Spiel',
   !knoepfe().some(x=>/selbst|myself|moi|hatte alles richtig|had it right/i.test(x.textContent)));
  if(!ueberKnopf)return aus;

  ueberKnopf.click();
  await new Promise(r=>setTimeout(r,80));
  pruef('Punkte abgezogen',R.score[0]===Math.max(0,vorPunkte-SPRECHSTRAFE),
   vorPunkte+' → '+R.score[0]);
  pruef('Eine Frage mehr',R.target===vorZiel+1&&R.extra===vorExtra+1,
   vorZiel+' → '+R.target);
  const weiterNachher=knoepfe().some(x=>x.textContent.trim()===t('next'));
  pruef('Weiter erscheint danach',weiterNachher);
  const nochDa=knoepfe().some(x=>/berspringen|Skip|Passer/.test(x.textContent)&&x.offsetParent!==null);
  pruef('Überspringen verschwindet danach',!nochDa);
  pruef('Im Protokoll vermerkt',!!(R.answers[R.answers.length-1]||{}).speakSkipped);
  /* zweites Druecken darf nicht nochmals kosten */
  const p2=R.score[0];
  try{ueberKnopf.click();}catch(_){}
  await new Promise(r=>setTimeout(r,60));
  pruef('Zweiter Druck kostet nicht nochmals',R.score[0]===p2);

  /* Punkte koennen nicht unter null fallen */
  R.score[0]=2;const z2=R.target;sprechStrafe(R,0);
  pruef('Nicht unter null',R.score[0]===0,'2 → '+R.score[0]);
  pruef('Obergrenze der Zusatzfragen greift',R.target>=z2);
  return aus;});
 let f=0;
 r.forEach(x=>{if(x[0]==='FAIL')f++;console.log('  '+x[0]+'  '+x[1]+(x[2]?'   '+x[2]:''));});
 if(perr.length){f++;console.log('  Seitenfehler: '+perr.slice(0,3).join(' | '));}
 await b.close();srv.close();
 console.log('\n'+(f?('FEHLER: '+f):'alles gut'));
 process.exit(f?1:0);
})().catch(e=>{console.error(e.message);srv.close();process.exit(1);});
