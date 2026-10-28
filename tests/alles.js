/* Stehende Regressionspruefung: spielt alle Pruefdateien gegen die
   aktuelle app.html und meldet eine Zeile je Datei. Aufruf:
   node alles.js            - alle Dateien
   node alles.js stellen    - nur die, deren Name das Wort enthaelt      */
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path');
const D=__dirname;
const filter=process.argv[2]||'';
const dateien=fs.readdirSync(D)
 .filter(f=>/^(stellen|stellen2|spielpause|mathblatt|pad|finger|sprachen|kb|ueber|sperre|widerspruch|rueckfall|neu|proxy)\.js$/.test(f))
 .filter(f=>!filter||f.includes(filter)).sort();
let schlecht=0;
console.log('Pruefe '+dateien.length+' Dateien gegen app.html ('+
 (fs.statSync(path.join(D,'app.html')).size/1024|0)+' KB)\n');
for(const f of dateien){
 let ausgabe='';
 try{ausgabe=execFileSync('node',[path.join(D,f)],{encoding:'utf8',timeout:240000,cwd:D});}
 catch(e){ausgabe=(e.stdout||'')+(e.stderr||'')+' [Abbruch]';}
 const zeilen=ausgabe.trim().split('\n');
 const fehler=zeilen.filter(z=>/^FAIL|NICHT BESTANDEN|SEITENFEHLER|Abbruch/.test(z));
 const ok=!fehler.length;
 if(!ok)schlecht++;
 console.log((ok?'  bestanden  ':'  GEFALLEN   ')+f.padEnd(18)+
  (ok?zeilen.filter(z=>/^OK/.test(z)).length+' Pruefungen':fehler.slice(0,2).join(' / ').slice(0,140)));
}
console.log('\n'+(schlecht?schlecht+' Datei(en) gefallen':'Alles bestanden'));
process.exit(schlecht?1:0);
