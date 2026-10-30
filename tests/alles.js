/* Stehende Regressionspruefung: spielt alle Pruefdateien gegen die
   aktuelle app.html und meldet eine Zeile je Datei. Aufruf:
   node alles.js            - alle Dateien
   node alles.js stellen    - nur die, deren Name das Wort enthaelt      */
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path');
const D=__dirname;
const filter=process.argv[2]||'';
const dateien=fs.readdirSync(D)
 .filter(f=>/^(stellen|stellen2|spielpause|ton|frag|mathblatt|pad|finger|sprachen|kb|ueber|sperre|widerspruch|rueckfall|neu|proxy)\.js$/.test(f))
 .filter(f=>!filter||f.includes(filter)).sort();
/* Die Pruefdateien reichen die Seite nicht selbst aus, sondern bedienen
   sich aus einem festen Ordner. Wird dort eine alte Fassung liegen
   gelassen, melden alle Pruefungen "bestanden" - gegen die alte Datei.
   Darum wird hier kopiert und der Abgleich hinterher nachgewiesen. */
const WEB='/tmp/claude-0/wtest';
/* Geprueft wird immer die Fassung im Projekt, nicht eine Kopie daneben. */
const quelle=[path.join(D,'..','index.html'),path.join(D,'app.html')]
 .find(f=>fs.existsSync(f));
if(!quelle){console.error('Keine index.html gefunden.');process.exit(2);}
fs.mkdirSync(WEB,{recursive:true});
fs.copyFileSync(quelle,path.join(WEB,'app.html'));
const pruefsumme=f=>require('crypto').createHash('sha256')
 .update(fs.readFileSync(f)).digest('hex').slice(0,12);
const hQ=pruefsumme(quelle), hW=pruefsumme(path.join(WEB,'app.html'));
if(hQ!==hW){console.error('Kopie stimmt nicht: '+hQ+' gegen '+hW);process.exit(2);}

let schlecht=0;
console.log('Pruefe '+dateien.length+' Dateien gegen '+path.basename(quelle)+' ('+
 (fs.statSync(quelle).size/1024|0)+' KB, '+hQ+')\n');
for(const f of dateien){
 let ausgabe='';
 try{ausgabe=execFileSync('node',[path.join(D,f)],{encoding:'utf8',timeout:240000,cwd:D});}
 catch(e){ausgabe=(e.stdout||'')+(e.stderr||'')+' [Abbruch]';}
 const zeilen=ausgabe.trim().split('\n');
 const fehler=zeilen.filter(z=>/^FAIL|NICHT BESTANDEN|SEITENFEHLER|Abbruch/.test(z));
 const ok=!fehler.length;
 if(!ok)schlecht++;
 console.log((ok?'  bestanden  ':'  GEFALLEN   ')+f.padEnd(18)+
  (ok?zeilen.filter(z=>/^\s*OK/.test(z)).length+' Pruefungen':fehler.slice(0,2).join(' / ').slice(0,140)));
}
console.log('\n'+(schlecht?schlecht+' Datei(en) gefallen':'Alles bestanden'));
process.exit(schlecht?1:0);
