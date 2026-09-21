import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';
// Reproducible screening of the source register, not a certification of live records.
const input=process.argv[2];
if(!input) throw new Error('Usage: node scripts/audit-product-register.mjs <route-book.json>');
const {stops}=JSON.parse(readFileSync(input,'utf8'));
const compiled=await build({entryPoints:['src/admin/routebook/products.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {reviewState,reviewReason,categoriesOf,isProductNamedRecord}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const names=new Map();
for(const s of stops){const k=s.name.toLowerCase().replace(/[^a-z0-9]/g,'');names.set(k,[...(names.get(k)??[]),s.id]);}
const rows=stops.map(s=>({id:s.id,name:s.name,state:reviewState(s),reason:reviewReason(s),products:categoriesOf(s).join('; '),missingDescription:!(s.makes??'').trim(),productNamedRecord:isProductNamedRecord(s),duplicateIds:names.get(s.name.toLowerCase().replace(/[^a-z0-9]/g,'')).filter(id=>id!==s.id).join('; ')}));
const summary={scope:'Source register only. Live employee profiles and later SQL evidence migrations are not included. Screening does not verify a factory.',total:rows.length,missingDescriptions:rows.filter(r=>r.missingDescription).length,productNamedRecords:rows.filter(r=>r.productNamedRecord).length,duplicateRows:rows.filter(r=>r.duplicateIds).length,states:rows.reduce((a,r)=>(a[r.state]=(a[r.state]??0)+1,a),{})};
mkdirSync('reports',{recursive:true});
const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
writeFileSync('reports/product-register-screening.csv',[Object.keys(rows[0]),...rows.map(Object.values)].map(r=>r.map(quote).join(',')).join('\n')+'\n');
writeFileSync('reports/product-register-screening.json',JSON.stringify(summary,null,2)+'\n');
console.log(summary);
