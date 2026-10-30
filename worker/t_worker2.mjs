/* Pruefung der beiden neuen Wege: /tts und /frage.
   Der Dienst wird nachgebildet; es geht kein Netzverkehr hinaus. */
import worker from './worker.mjs';
let f=0; const pruef=(n,b,x)=>{if(!b)f++;console.log('  '+(b?'OK  ':'FAIL')+'  '+n+(x!==undefined?'   '+x:''));};
const OK='https://spitzadvisory.github.io';
const env={ELEVEN_KEY:'e-key',ANTHROPIC_KEY:'a-key'};

let gesehen=null, elevenStatus=200, elevenFehler='voice not found';
globalThis.fetch=async(u,o)=>{
 const url=String(u);
 if(url.indexOf('elevenlabs.io')>=0){
  const body=JSON.parse(o.body);
  gesehen={dienst:'eleven',url,schluessel:o.headers['xi-api-key'],
   text:body.text,modell:body.model_id,einst:body.voice_settings};
  if(elevenStatus!==200)return new Response(JSON.stringify({detail:{message:elevenFehler}}),
   {status:elevenStatus,headers:{'content-type':'application/json'}});
  return new Response('ID3-nachgebildet',{status:200,headers:{'content-type':'audio/mpeg'}});}
 if(url.indexOf('anthropic.com')>=0){
  const body=JSON.parse(o.body);
  gesehen={dienst:'anthropic',schluessel:o.headers['x-api-key'],modell:body.model,
   system:body.system,inhalt:body.messages[0].content,max:body.max_tokens};
  return new Response(JSON.stringify({content:[{type:'text',text:'Schau zuerst auf die Einer.'}]}),
   {status:200,headers:{'content-type':'application/json'}});}
 throw new Error('unerwartet: '+url);};

const ruf=(pfad,obj,origin)=>worker.fetch(new Request('https://w.example'+pfad,
 {method:'POST',headers:{Origin:origin===undefined?OK:origin,'content-type':'application/json'},
  body:JSON.stringify(obj||{})}),env);

console.log('\n/tts');
let r=await ruf('/tts',{text:'Guten Tag',spr:'de'});
pruef('Deutsch liefert Tonspur',r.status===200&&r.headers.get('content-type')==='audio/mpeg','HTTP '+r.status);
pruef('Emilia wird gewaehlt',gesehen.url.indexOf('ghgFyr7gmpr57xyTgX9q')>=0);
pruef('Format mp3_44100_128',gesehen.url.indexOf('output_format=mp3_44100_128')>=0);
pruef('Schluessel aus dem Konto',gesehen.schluessel==='e-key');
pruef('Erstes Modell eleven_v4',gesehen.modell==='eleven_v4');
pruef('Herkunft im Kopf',r.headers.get('Access-Control-Allow-Origin')===OK);

await ruf('/tts',{text:'Good day',spr:'en'});
pruef('Englisch waehlt Kate',gesehen.url.indexOf('LmBeiuCEOHOsilCkLod0')>=0);
await ruf('/tts',{text:'Bonjour',spr:'fr'});
pruef('Franzoesisch waehlt Emilie',gesehen.url.indexOf('i6ke7jvmGEVUyV4zjSaT')>=0);
await ruf('/tts',{text:'Hallo',spr:'klingonisch'});
pruef('Unbekannte Sprache faellt auf Deutsch',gesehen.url.indexOf('ghgFyr7gmpr57xyTgX9q')>=0);
await ruf('/tts',{text:'Hallo'});
pruef('Ohne Sprachangabe Deutsch',gesehen.url.indexOf('ghgFyr7gmpr57xyTgX9q')>=0);

r=await ruf('/tts',{text:'   '});
pruef('Leerer Text abgewiesen',r.status===400,'HTTP '+r.status);
await ruf('/tts',{text:'x'.repeat(900)});
pruef('Text auf 400 Zeichen gekappt',gesehen.text.length===400,gesehen.text.length);

elevenStatus=422; elevenFehler='model_id eleven_v4 is not available';
r=await ruf('/tts',{text:'Hallo',spr:'de'});
pruef('Modellfehler zieht den zweiten Versuch nach',gesehen.modell==='eleven_multilingual_v2',gesehen.modell);
pruef('Danach 502 mit Begruendung',r.status===502,'HTTP '+r.status);
elevenStatus=401; elevenFehler='unauthorized';
await ruf('/tts',{text:'Hallo',spr:'de'});
pruef('Anderer Fehler bricht gleich ab',gesehen.modell==='eleven_v4',gesehen.modell);
elevenStatus=200;

r=await ruf('/tts',{text:'Hallo'},'https://boeswillig.example');
pruef('Fremde Herkunft abgewiesen',r.status===403,'HTTP '+r.status);
r=await worker.fetch(new Request('https://w.example/tts',{method:'OPTIONS',headers:{Origin:OK}}),env);
pruef('Vorabfrage beantwortet',r.status===204);
r=await ruf('/tts',{text:'Hallo'},undefined);
pruef('Ohne ELEVEN_KEY klare Meldung',
 (await worker.fetch(new Request('https://w.example/tts',{method:'POST',
  headers:{Origin:OK,'content-type':'application/json'},body:'{"text":"x"}'}),{ANTHROPIC_KEY:'a'})).status===500);

console.log('\n/frage');
r=await ruf('/frage',{frage:'Ich weiss nicht wie ich anfangen soll',
 aufgabe:'Rechne schriftlich. 347 + 285.',spr:'de'});
let d=await r.json();
pruef('Antwort kommt als Text',r.status===200&&d.text==='Schau zuerst auf die Einer.','HTTP '+r.status);
pruef('Aufgabe geht mit',gesehen.inhalt.indexOf('347 + 285')>=0);
pruef('Frage geht mit',gesehen.inhalt.indexOf('wie ich anfangen soll')>=0);
pruef('Sprache wird angesagt',/Reply in German/.test(gesehen.system));
pruef('Verbot steht im Auftrag',/Never give the answer/.test(gesehen.system));
pruef('Kurze Antwort erzwungen',gesehen.max===160,gesehen.max);
pruef('Schluessel aus dem Konto',gesehen.schluessel==='a-key');

await ruf('/frage',{frage:'help',aufgabe:'x',spr:'en'});
pruef('Englisch wird angesagt',/Reply in English/.test(gesehen.system));
await ruf('/frage',{frage:'aide',aufgabe:'x',spr:'fr'});
pruef('Franzoesisch wird angesagt',/Reply in French/.test(gesehen.system));

r=await ruf('/frage',{frage:'  ',aufgabe:'x'});
pruef('Leere Frage abgewiesen',r.status===400,'HTTP '+r.status);
await ruf('/frage',{frage:'q'.repeat(900),aufgabe:'a'.repeat(900)});
pruef('Frage auf 400 gekappt',gesehen.inhalt.split('The child asks: ')[1].length===400);
pruef('Aufgabe auf 600 gekappt',gesehen.inhalt.indexOf('a'.repeat(600))>=0&&gesehen.inhalt.indexOf('a'.repeat(601))<0);
r=await ruf('/frage',{frage:'q'},'https://boeswillig.example');
pruef('Fremde Herkunft abgewiesen',r.status===403,'HTTP '+r.status);

console.log('\n/unbekannt');
r=await ruf('/sonstwas',{});
pruef('Unbekannter Pfad 404',r.status===404,'HTTP '+r.status);

console.log('\n'+(f?f+' FEHLER':'alles in Ordnung'));
process.exit(f?1:0);
