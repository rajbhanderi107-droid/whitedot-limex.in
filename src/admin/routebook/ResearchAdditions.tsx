import { useState } from 'react';
import { RESEARCHED_COMPANIES, companyNameKey } from './verifiedProducts.js';
import { addStop, getRb, patchMark, useRb } from './store.js';
import { toast } from './ctx.js';
export function ResearchAdditions() {
 const st=useRb(), [busy,setBusy]=useState(false), [result,setResult]=useState('');
 if(!st.me || !['ADMIN','SUPER_ADMIN'].includes(st.me.role)) return null;
 const missing=RESEARCHED_COMPANIES.filter(c=>!st.stops.some(s=>companyNameKey(s.name)===companyNameKey(c.fields.name)));
 const add=async()=>{
  setBusy(true);let added=0;
  try {for(const c of RESEARCHED_COMPANIES){
   const current=getRb();
   // Re-check before each write. A retry never re-adds a successful earlier row.
   if(current.stops.some(s=>companyNameKey(s.name)===companyNameKey(c.fields.name))) continue;
   const s=await addStop(c.fields);
   patchMark(s.id,{sourceFolder:'GPT',productProfile:JSON.stringify(c.profile)});
   added++;
  }setResult(`${added} companies added. Product details and GPT source are saving; check the Saved indicator.`);toast(`${added} researched companies added`);}
  catch(e){setResult(`${added} added. ${e instanceof Error?e.message:'Could not finish; retry to add remaining companies.'}`);}
  finally{setBusy(false);}
 };
 return <details className="rb-research"><summary>Researched manufacturers {missing.length?`· ${missing.length} ready to add`:'· already in the book'}</summary><p>Public manufacturing evidence and product photos checked on 19 September 2026. Existing matches are skipped. Confirm production details before a LIMEX trial.</p><ul>{RESEARCHED_COMPANIES.map(c=><li key={c.key}><strong>{c.fields.name}</strong> — {c.region} · <a href={c.profile.source} target="_blank" rel="noopener noreferrer">Evidence</a></li>)}</ul><button type="button" className="wd-primary-btn" disabled={busy||!missing.length} onClick={add}>{busy?'Adding…':`Add ${missing.length} manufacturers to GPT Leads`}</button>{result&&<p role="status">{result}</p>}</details>;
}
