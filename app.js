// app.js (user)
const SUPABASE_URL = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";    // <-- ganti
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";                 // <-- ganti
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helpers
const el = id => document.getElementById(id);
const CART_KEY = 'storeskull_cart_v1';

function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); window.dispatchEvent(new Event('cart-changed')); }
function clearCart(){ localStorage.removeItem(CART_KEY); window.dispatchEvent(new Event('cart-changed')); }

// Render products (user)
async function renderProducts(){
  const box = el('products');
  if(!box) return;
  box.innerHTML = `<div style="color:var(--muted)">Memuat produk...</div>`;
  const { data, error } = await supabase.from('products').select('*').order('name');
  if(error){ console.error(error); box.innerHTML = `<div style="color:var(--muted)">Gagal memuat produk</div>`; return; }
  if(!data.length){ box.innerHTML = `<div style="color:var(--muted)">Belum ada produk</div>`; return; }

  box.innerHTML = data.map(p => `
    <div class="card">
      <div class="img" style="background-image:url('${p.image || 'https://via.placeholder.com/400x300?text=No+Image'}')"></div>
      <div class="body">
        <h3>${p.name}</h3>
        <p class="price">Rp ${Number(p.price).toLocaleString()}</p>
        <p>${p.description || ''}</p>
        <div class="actions">
          <button class="btn ghost" onclick="addToCart('${p.id}')">Keranjang</button>
          <button class="btn primary" onclick="buyNow('${p.id}')">Buy</button>
        </div>
      </div>
    </div>`).join('');
}

// Cart functions
function addToCart(productId){
  const cart = getCart();
  // store product ids; allow duplicates? we'll avoid duplicates
  if(!cart.includes(productId)) cart.push(productId);
  saveCart(cart);
  alert('Ditambahkan ke keranjang');
}
function removeFromCart(productId){
  const cart = getCart().filter(id => id !== productId);
  saveCart(cart);
  renderCart();
}
async function renderCart(){
  const box = el('cart-list'); if(!box) return;
  const cart = getCart();
  if(cart.length === 0){ box.innerHTML = '<div style="color:var(--muted)">Keranjang kosong</div>'; return; }
  const { data, error } = await supabase.from('products').select('*').in('id', cart);
  if(error){ console.error(error); box.innerHTML = '<div style="color:var(--muted)">Gagal muat item</div>'; return; }
  // show list
  box.innerHTML = data.map(p => `
    <div class="product-card" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--card);border-radius:8px;margin-bottom:8px">
      <img src="${p.image}" style="width:80px;height:60px;object-fit:cover;border-radius:6px">
      <div style="flex:1">
        <strong>${p.name}</strong><div style="color:var(--muted)">Rp ${Number(p.price).toLocaleString()}</div>
      </div>
      <button class="btn ghost" onclick="removeFromCart('${p.id}')">Hapus</button>
    </div>`).join('');
}

// Buy flow (single product)
async function buyNow(productId){
  const username = prompt('Username / Nama:');
  const phone = prompt('Nomor WhatsApp (62...):');
  if(!username || !phone) return alert('Isi username & phone');
  const items = [{ product: productId }];
  const { data, error } = await supabase.from('orders').insert([{ username, phone, items, status: 'pending' }]).select();
  if(error){ console.error(error); alert('Gagal beli: ' + error.message); return; }
  sessionStorage.setItem('last_user', JSON.stringify({ username, phone }));
  alert('Pesanan terkirim. Admin akan menghubungi.');
  // update history page if open
}

// Checkout cart
async function checkoutCart(){
  const cart = getCart();
  if(cart.length === 0) return alert('Keranjang kosong');
  const username = el('checkout-username')?.value || prompt('Username / Nama:');
  const phone = el('checkout-phone')?.value || prompt('Nomor WhatsApp (62...)');
  if(!username || !phone) return alert('Isi username & phone');
  // build items array with product ids
  const items = cart.map(pid => ({ product: pid }));
  // insert multiple orders or single order with items array — we'll insert one order with items array
  const { data, error } = await supabase.from('orders').insert([{ username, phone, items, status: 'pending' }]).select();
  if(error){ console.error(error); alert('Gagal checkout: ' + error.message); return; }
  sessionStorage.setItem('last_user', JSON.stringify({ username, phone }));
  clearCart();
  renderCart();
  alert('Checkout sukses. Admin akan menghubungi.');
}

// History render: if last_user known, show their orders; else show all recent
async function renderHistory(){
  const box = el('history-list'); if(!box) return;
  const last = sessionStorage.getItem('last_user');
  let query = supabase.from('orders').select('id,username,phone,items,status,created_at');
  if(last){
    const u = JSON.parse(last);
    query = query.eq('username', u.username).eq('phone', u.phone);
  }
  const { data, error } = await query.order('created_at', {ascending:false}).limit(50);
  if(error){ console.error(error); box.innerHTML = '<div style="color:var(--muted)">Gagal muat history</div>'; return; }
  if(!data.length) { box.innerHTML = '<div style="color:var(--muted)">Belum ada pesanan</div>'; return; }
  // need product names: collect product ids
  const allItemIds = Array.from(new Set(data.flatMap(o => (o.items || []).map(it=>it.product))));
  const { data: prods } = await supabase.from('products').select('id,name').in('id', allItemIds);
  const map = {}; (prods||[]).forEach(p=>map[p.id]=p.name);
  box.innerHTML = data.map(o => {
    const itemsHtml = (o.items||[]).map(it => `<div>${map[it.product]||it.product}</div>`).join('');
    return `<div style="padding:10px;border-radius:8px;background:var(--card);margin-bottom:8px">
      <div><strong>${o.username}</strong> — ${o.phone}</div>
      <div style="color:var(--muted);margin:6px 0">${itemsHtml}</div>
      <div>Status: <strong>${o.status}</strong></div>
    </div>`;
  }).join('');
}

// Realtime: subscribe products & orders changes to auto refresh
function setupRealtime(){
  // products
  supabase.channel('realtime-products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      renderProducts();
    }).subscribe().catch(e=>console.warn(e));

  // orders
  supabase.channel('realtime-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
      // if user history present, refresh history
      renderHistory();
    }).subscribe().catch(e=>console.warn(e));
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  // user pages
  if(el('products')) { renderProducts(); setupRealtime(); }
  if(el('cart-list')) { renderCart(); el('btn-checkout')?.addEventListener('click', checkoutCart); el('btn-clear')?.addEventListener('click', ()=>{ if(confirm('Kosongkan keranjang?')){ clearCart(); renderCart(); } }); }
  if(el('history-list')) { renderHistory(); setupRealtime(); }
  // listen cart change from other tabs
  window.addEventListener('storage', e=>{ if(e.key===CART_KEY) renderCart(); });
  window.addEventListener('cart-changed', ()=>{ renderCart(); });
});
