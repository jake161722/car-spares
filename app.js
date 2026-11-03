(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const T = {
 en:{ship_top:'Worldwide delivery',search:'Search',cart:'Cart',shop_cat:'Shop by category ▾',shop:'Shop',finder:'Find by vehicle',help:'Shipping & payment',contact:'Contact',
  h1:'Find the part that fits your car.',sub:'Quality-checked spares for Japanese, European and 4x4 vehicles. Not sure it fits? Send your chassis number on WhatsApp and we confirm before you pay.',
  find:'Find parts',t1:'Genuine, quality-checked parts',t2:'M-Pesa, card and cash on delivery',t3:'Ships to 190+ countries',sort:'Sort',pay_h:'How to pay',ship_h:'Shipping worldwide',fit_h:'Fitment promise',
  fit_p:'Send a photo of the old part or your chassis number. If it does not fit, you do not pay.',send:'Send message',subscribe:'Subscribe',total:'Total',place:'Place order',checkout:'Checkout',pop_h:'Get parts deals first',
  add:'Add to cart',results:n=>`Showing ${n} results`,none:'No parts found. Try another search or ask us on WhatsApp.',added:'Added to cart',empty:'Your cart is empty.',all:'All parts'},
 sw:{ship_top:'Tunasafirisha duniani kote',search:'Tafuta',cart:'Kikapu',shop_cat:'Kategoria ▾',shop:'Duka',finder:'Tafuta kwa gari',help:'Usafirishaji na malipo',contact:'Wasiliana',
  h1:'Pata kipuri kinachofaa gari lako.',sub:'Vipuri vilivyokaguliwa vya magari ya Kijapani, Ulaya na 4x4. Huna uhakika? Tuma nambari ya chassis kwa WhatsApp tuthibitishe kabla ya kulipa.',
  find:'Tafuta vipuri',t1:'Vipuri halisi vilivyokaguliwa',t2:'M-Pesa, kadi na malipo ukipokea',t3:'Tunasafirisha nchi 190+',sort:'Panga',pay_h:'Jinsi ya kulipa',ship_h:'Usafirishaji duniani',fit_h:'Ahadi ya kufaa',
  fit_p:'Tuma picha ya kipuri cha zamani au nambari ya chassis. Kisipofaa, hulipi.',send:'Tuma ujumbe',subscribe:'Jiunge',total:'Jumla',place:'Weka oda',checkout:'Lipa',pop_h:'Pata ofa za vipuri kwanza',
  add:'Weka kikapu',results:n=>`Matokeo ${n}`,none:'Hakuna kipuri. Jaribu utafutaji mwingine au tuulize WhatsApp.',added:'Imewekwa kikapuni',empty:'Kikapu chako kiko tupu.',all:'Vipuri vyote'}};
const S = { cfg:null, list:[], cats:[], makes:[], cat:'', make:'', q:'', sort:'',
  cur:localStorage.cur||'KES', lang:localStorage.lang||'en',
  cart:JSON.parse(localStorage.cart||'[]'), wish:JSON.parse(localStorage.wish||'[]') };
const t = k => T[S.lang][k] ?? k;
const save = () => { localStorage.cart=JSON.stringify(S.cart); localStorage.wish=JSON.stringify(S.wish); localStorage.cur=S.cur; localStorage.lang=S.lang; };
const money = kes => { const r=S.cfg.rates[S.cur]; const v=kes*r; return new Intl.NumberFormat(S.lang==='sw'?'sw-KE':'en',{style:'currency',currency:S.cur,maximumFractionDigits:v<100?2:0}).format(v); };
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast = m => { const e=$('#toast'); e.textContent=m; e.classList.add('on'); setTimeout(()=>e.classList.remove('on'),2200); };
const wa = txt => `https://wa.me/${S.cfg.shop.whatsapp}?text=${encodeURIComponent(txt)}`;
const post = (u,d) => fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(async r=>{const j=await r.json(); if(!r.ok) throw new Error(j.error||'Error'); return j;});
const gear = '<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="13" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="7 3"/><circle cx="17" cy="17" r="4" fill="currentColor"/></svg>';

function i18n(){ document.documentElement.lang=S.lang; $$('[data-i]').forEach(e=>e.textContent=t(e.dataset.i)); }
async function load(){
  const p=new URLSearchParams({q:S.q,cat:S.cat,make:S.make,sort:S.sort}); [...p].forEach(([k,v])=>!v&&p.delete(k));
  const d=await (await fetch('/api/products?'+p)).json(); S.list=d.products; if(!S.cats.length||!S.cat&&!S.make&&!S.q){S.cats=d.categories;S.makes=d.makes;} render();
}
function render(){
  const total=S.cats.reduce((a,c)=>a+c.n,0);
  $('#chips').innerHTML=`<button class="chip ${!S.cat?'on':''}" data-c="">${t('all')}<small>${total}</small></button>`+S.cats.map(c=>`<button class="chip ${S.cat===c.name?'on':''}" data-c="${esc(c.name)}">${esc(c.name)}<small>${c.n}</small></button>`).join('');
  $('#catMenu').innerHTML=S.cats.map(c=>`<a data-c="${esc(c.name)}">${esc(c.name)}<small>${c.n}</small></a>`).join('');
  const fill=(el,arr,first)=>{const v=el.value; el.innerHTML=`<option value="">${first}</option>`+arr.map(x=>`<option>${esc(x.name)}</option>`).join(''); el.value=v;};
  fill($('#fMake'),S.makes,'Make'); fill($('#fCat'),S.cats,'All categories');
  $('#count').textContent=t('results')(S.list.length);
  $('#grid').innerHTML=S.list.length?S.list.map(p=>`<article class="card"><div class="img">${p.image?`<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}">`:gear}
   <button class="heart" data-w="${p.id}" aria-label="Wishlist">${S.wish.includes(p.id)?'♥':'♡'}</button></div>
   <div class="cb"><span class="fit">${esc((p.make+' '+p.model+' '+p.year).toUpperCase())}</span><h3>${esc(p.name)}</h3><span class="sku">SKU ${esc(p.sku)}${p.oem?' · OEM '+esc(p.oem):''}</span>
   <span class="price">${money(p.price)}</span><div class="acts"><button data-a="${p.id}">${t('add')}</button><a class="wa" target="_blank" rel="noopener" href="${wa('Hi, I am interested in: '+p.name+' (SKU '+p.sku+')')}">WhatsApp</a></div></div></article>`).join(''):`<p class="empty">${t('none')}</p>`;
  $('#wCount').textContent=S.wish.length; drawCart();
}
function drawCart(){
  $('#cCount').textContent=S.cart.reduce((a,l)=>a+l.qty,0);
  const rows=S.cart.map(l=>({...l.snap,qty:l.qty}));
  $('#lines').innerHTML=rows.length?rows.map(r=>`<div class="line"><div>${esc(r.name)}<br><small>${money(r.price)}</small></div><b>${money(r.price*r.qty)}</b><div class="qty"><button data-q="${r.id}:-1">−</button>${r.qty}<button data-q="${r.id}:1">+</button></div></div>`).join(''):`<p>${t('empty')}</p>`;
  $('#sum').textContent=money(rows.reduce((a,r)=>a+r.price*r.qty,0)); save();
}
function add(id){ const p=S.list.find(x=>x.id===id); if(!p)return; const l=S.cart.find(x=>x.id===id); l?l.qty++:S.cart.push({id,qty:1,snap:{id:p.id,name:p.name,price:p.price}}); drawCart(); toast(t('added')); }
function setCat(c){ S.cat=c; S.make=$('#fMake').value; $('#catMenu').hidden=true; load(); }

document.addEventListener('click',e=>{
  const c=e.target.closest('[data-c]'); if(c){ S.make=''; setCat(c.dataset.c); $('#shop').scrollIntoView(); }
  const a=e.target.closest('[data-a]'); if(a) add(a.dataset.a);
  const w=e.target.closest('[data-w]'); if(w){ const i=S.wish.indexOf(w.dataset.w); i<0?S.wish.push(w.dataset.w):S.wish.splice(i,1); render(); }
  const q=e.target.closest('[data-q]'); if(q){ const [id,d]=q.dataset.q.split(':'); const l=S.cart.find(x=>x.id===id); l.qty+=+d; if(l.qty<1)S.cart=S.cart.filter(x=>x!==l); drawCart(); }
  if(!e.target.closest('.catwrap')) $('#catMenu').hidden=true;
});
$('#catBtn').onclick=()=>{ $('#catMenu').hidden=!$('#catMenu').hidden; };
$('#searchForm').onsubmit=e=>{ e.preventDefault(); S.q=$('#q').value.trim(); S.cat=''; S.make=''; load(); $('#shop').scrollIntoView(); };
$('#finder').onsubmit=e=>{ e.preventDefault(); S.make=$('#fMake').value; S.cat=$('#fCat').value; load(); $('#shop').scrollIntoView(); };
$('#sort').onchange=e=>{ S.sort=e.target.value; load(); };
$('#cur').onchange=e=>{ S.cur=e.target.value; render(); $('#shipTxt').textContent=shipTxt(); };
$('#lang').onchange=e=>{ S.lang=e.target.value; i18n(); render(); save(); };
$('#wishBtn').onclick=()=>{ S.cat=''; S.q=''; load().then(()=>{ S.list=S.list.filter(p=>S.wish.includes(p.id)); render(); $('#shop').scrollIntoView(); }); };
$('#cartBtn').onclick=()=>$('#drawer').hidden=false; $('#closeCart').onclick=()=>$('#drawer').hidden=true;
$('#goCheckout').onclick=()=>{ if(!S.cart.length) return toast(t('empty')); $('#checkout').hidden=false; $('#goCheckout').hidden=true; };
$('#checkout').onsubmit=async e=>{ e.preventDefault(); const f=Object.fromEntries(new FormData(e.target));
  try{ const o=await post('/api/orders',{items:S.cart.map(l=>({id:l.id,qty:l.qty})),customer:f,payment:f.payment,currency:S.cur});
    const msg=`Order ${o.ref}: ${o.items.map(i=>i.qty+'x '+i.name).join(', ')}. Total ${money(o.total)} (${S.cur}). Name: ${o.customer.name}, ${o.customer.city}, ${o.customer.country}. Payment: ${o.payment}.`;
    S.cart=[]; drawCart(); e.target.reset(); e.target.hidden=true; $('#goCheckout').hidden=false; $('#drawer').hidden=true;
    toast('Order '+o.ref+' received. Opening WhatsApp to confirm.'); window.open(wa(msg),'_blank');
  }catch(err){ toast(err.message); } };
$('#contactForm').onsubmit=async e=>{ e.preventDefault(); try{ await post('/api/contact',Object.fromEntries(new FormData(e.target))); e.target.reset(); toast('Message sent'); }catch(x){ toast(x.message); } };
const sub=async(e,close)=>{ e.preventDefault(); const f=Object.fromEntries(new FormData(e.target)); if(!f.email){f.email=e.target.querySelector('[type=email]').value;}
  try{ await post('/api/subscribe',f); e.target.reset(); toast('Subscribed'); close&&($('#pop').hidden=true); localStorage.subbed=1; }catch(x){ toast(x.message); } };
$('#subPop').onsubmit=e=>sub(e,true); $('#subFoot').onsubmit=e=>sub(e,false);
const closePop=e=>{ e&&e.preventDefault(); $('#pop').hidden=true; localStorage.popSeen=Date.now(); };
$('#popX').onclick=closePop; $('#popNo').onclick=closePop;
const shipTxt=()=>`Kenya: ${S.cfg.shipping.Kenya.note}. International: from ${money(S.cfg.shipping.international.KES)}, ${S.cfg.shipping.international.note}.`;

(async()=>{
  S.cfg=await (await fetch('/api/config')).json(); const sh=S.cfg.shop;
  $('#cur').innerHTML=Object.keys(S.cfg.rates).map(c=>`<option ${c===S.cur?'selected':''}>${c}</option>`).join(''); $('#lang').value=S.lang;
  $('#tPhone').textContent=sh.phone; $('#tPhone').href='tel:'+sh.phone; $('#tWa').href=wa('Hello '+sh.name); $('#tMail').textContent=sh.email; $('#tMail').href='mailto:'+sh.email;
  $('#tHours').textContent=sh.hours; $('#waFab').href=wa('Hello, I need a car part'); $('#waFab').target='_blank';
  $('#pb').textContent=sh.paybill; $('#ac').textContent=sh.account; $('#fName').textContent=sh.name; $('#fAddr').textContent=sh.address; $('#fHours').textContent=sh.hours;
  $('#copy').textContent=`© ${new Date().getFullYear()} ${sh.name} · ${sh.domain}`; $('#shipTxt').textContent=shipTxt();
  i18n(); await load();
  if(!localStorage.subbed && !localStorage.popSeen) setTimeout(()=>$('#pop').hidden=false,8000);
})();
})();
