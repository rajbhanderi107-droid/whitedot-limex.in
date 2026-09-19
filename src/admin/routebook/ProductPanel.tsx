import { useState, type FormEvent } from 'react';
import type { RbStop,RbMark } from './types.js';
import { PRODUCTS, blankProductProfile, categoriesOf, productProfile, reviewState, safeProductUrl, type ProductProfile } from './products.js';
import { patchMark } from './store.js';
import { toast } from './ctx.js';

export function ProductPanel({s,m}: {s:RbStop;m?:RbMark}) {
  const p=productProfile(s,m), state=reviewState(s,m);
  const [edit,setEdit]=useState(false);
  return <section className="rb-product-panel" aria-label={`Products of ${s.name}`}>
    <div className="rb-product-heading"><strong>Products</strong><span className={`rb-verification is-${state}`}>{state==='verified'?'Manufacturer evidence checked':state==='excluded'?'Outside target list':'Needs verification'}</span><button type="button" onClick={()=>setEdit(!edit)}>{edit?'Close':'Edit products & photos'}</button></div>
    <div className="rb-product-labels">{categoriesOf(s,m).map(id=><span key={id}>{PRODUCTS.find(([k])=>k===id)?.[1]}</span>)}{!categoriesOf(s,m).length && <span>Product type not recorded</span>}</div>
    {state==='review' && <p className="rb-product-help">Confirm that this company makes opaque plastic products before planning a visit.</p>}
    {!!p?.photos.length ? <div className="rb-product-gallery">{p.photos.map(photo=><figure key={photo.url}><ProductPhoto url={photo.url} alt={photo.caption || `${s.name} product`} /><figcaption>{photo.caption || 'Company product'}{safeProductUrl(photo.source) && <a href={photo.source} target="_blank" rel="noopener noreferrer">Source</a>}</figcaption></figure>)}</div>:<p className="rb-photo-empty">No company product photo yet. Add a photo link from its catalogue.</p>}
    {p?.evidence && <p className="rb-product-help">{p.evidence} {safeProductUrl(p.source) && <a href={p.source} target="_blank" rel="noopener noreferrer">View evidence</a>}{p.checkedOn && ` · Checked ${p.checkedOn}`}</p>}
    {state==='verified' && <p className="rb-product-help">Product match only. Confirm the polymer, LIMEX grade and trial result with the factory.</p>}
    {edit && <ProductEditor key={s.id} initial={p ?? {...blankProductProfile(),categories:categoriesOf(s,m)}} onSave={next=>{const prev=patchMark(s.id,{productProfile:JSON.stringify(next)});toast('Product details queued for saving',()=>patchMark(s.id,{productProfile:prev.productProfile ?? null}));setEdit(false);}} />}
  </section>;
}
function ProductEditor({initial,onSave}:{initial:ProductProfile;onSave:(p:ProductProfile)=>void}) {
  const [p,setP]=useState<ProductProfile>(initial);
  const [error,setError]=useState('');
  const save=(e:FormEvent)=>{e.preventDefault();
    if(p.business==='manufacturer' && (!p.evidence.trim() || !safeProductUrl(p.source))){setError('Add the manufacturer evidence and its public HTTPS source.');return;}
    if((p.source && !safeProductUrl(p.source)) || p.photos.some(x=>!safeProductUrl(x.url)||(x.source&&!safeProductUrl(x.source)))){setError('Use public HTTPS links for photos and sources.');return;}
    onSave({...p,checkedOn:new Date().toISOString().slice(0,10)});
  };
  return <form className="rb-product-editor" onSubmit={save}>
    <fieldset><legend>Products manufactured</legend>{PRODUCTS.map(([id,label])=><label key={id}><input type="checkbox" checked={p.categories.includes(id)} onChange={e=>setP({...p,categories:e.target.checked?[...p.categories,id]:p.categories.filter(x=>x!==id)})}/>{label}</label>)}</fieldset>
    <div className="rb-row"><label>Business type<select value={p.business} onChange={e=>setP({...p,business:e.target.value as ProductProfile['business']})}><option value="unknown">Not checked</option><option value="manufacturer">Finished-product manufacturer</option><option value="trader">Trader / reseller only</option><option value="raw-material">Granules / raw materials only</option><option value="machinery">Machinery / moulds only</option></select></label>
    <label>Relevant product appearance<select value={p.opacity} onChange={e=>setP({...p,opacity:e.target.value as ProductProfile['opacity']})}><option value="unknown">Not checked</option><option value="opaque">Opaque / coloured</option><option value="milky-white">Milky white</option><option value="transparent">Transparent only</option></select></label></div>
    <label>Manufacturing evidence<textarea maxLength={1500} value={p.evidence} onChange={e=>setP({...p,evidence:e.target.value})} placeholder="What confirms their own manufacturing and relevant product?"/></label>
    <label>Evidence page URL<input type="url" maxLength={1600} value={p.source} onChange={e=>setP({...p,source:e.target.value})} placeholder="https://company.example/products"/></label>
    {p.photos.map((photo,i)=><div className="rb-photo-edit" key={i}><label>Photo URL {i+1}<input type="url" required maxLength={1600} value={photo.url} onChange={e=>setP({...p,photos:p.photos.map((x,j)=>j===i?{...x,url:e.target.value}:x)})}/></label><label>Product caption<input maxLength={160} value={photo.caption} onChange={e=>setP({...p,photos:p.photos.map((x,j)=>j===i?{...x,caption:e.target.value}:x)})}/></label><label>Photo source page<input type="url" maxLength={1600} value={photo.source} onChange={e=>setP({...p,photos:p.photos.map((x,j)=>j===i?{...x,source:e.target.value}:x)})}/></label><button type="button" onClick={()=>setP({...p,photos:p.photos.filter((_,j)=>j!==i)})}>Remove photo</button></div>)}
    {p.photos.length<6 && <button type="button" className="wd-ghost-btn" onClick={()=>setP({...p,photos:[...p.photos,{url:'',caption:'',source:p.source}]})}>Add product photo</button>}
    {error && <p role="alert">{error}</p>}<button className="wd-primary-btn" type="submit">Save product details</button>
  </form>;
}

function ProductPhoto({url,alt}:{url:string;alt:string}) {
 const [failed,setFailed]=useState(false);
 return <a href={url} target="_blank" rel="noopener noreferrer">{failed?<span className="rb-photo-empty">Photo could not load. Open original.</span>:<img src={url} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)} />}</a>;
}
