(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.PaywizardPaymentBrands=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const assets={
  visa:{label:'Visa',src:'assets/payment-brands/visa-mark.svg'},
  mastercard:{label:'Mastercard',src:'assets/payment-brands/mastercard-mark.svg'},
  generic:{label:'Card',src:'assets/payment-brands/card-generic.svg'}
 };
 const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const normalized=value=>String(value??'').trim().toLowerCase().replace(/[\s_-]+/g,'');
 function resolve(value){
  const key=normalized(value);
  if(key.includes('mastercard'))return {kind:'scheme',key:'mastercard',label:'Mastercard'};
  if(key.includes('visa'))return {kind:'scheme',key:'visa',label:'Visa'};
  if(['prepaid','qr','qrcode'].includes(key))return {kind:'payment-method',key,label:key==='prepaid'?'Prepaid':'QR'};
  return {kind:'scheme',key:'generic',label:String(value??'').trim()||'Unknown card'};
 }
 function logo(value,{decorative=false,className='card-scheme-logo'}={}){
  const scheme=resolve(value);
  if(scheme.kind!=='scheme')return '';
  const asset=assets[scheme.key]||assets.generic;
  const alt=decorative?'':scheme.key==='generic'?'Unknown card scheme':asset.label;
  return `<img class="${escape(className)}" src="${asset.src}" alt="${escape(alt)}">`;
 }
 function detail(value){
  const scheme=resolve(value);
  const raw=String(value??'').trim();
  const text=scheme.kind==='payment-method'?scheme.label:!raw?scheme.label:normalized(raw)==='visa'?'Visa':normalized(raw)==='mastercard'?'Mastercard':raw;
  if(scheme.kind!=='scheme')return `<span class="card-scheme-name">${escape(text)}</span>`;
  return `<span class="card-scheme-detail">${logo(value,{decorative:true})}<span class="card-scheme-name">${escape(text)}</span></span>`;
 }
 return {resolve,logo,detail};
});
