// admin.js
const SUPABASE_URL = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";    // <-- ganti
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWxzZ3djY3JkcWpnY3hnbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTc0MDUsImV4cCI6MjA3MjYzMzQwNX0.6Ge1ON_x9Ce-l4tFRtH_Ks9o3v1RouLIDejtbohjo4Y";                 // <-- ganti
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const el = id => document.getElementById(id);

// Load products for admin
async function loadAdminProducts(){
  const tbody = el('admin-products');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">Memuat...</td></tr>';
  const { data, error } = await supabase.from('products').select('*').order('name');
  if(error){ console.error('loadAdminProducts:', error); tbody.innerHTML = '<tr><td colspan="5">Gagal memuat</td></tr>'; return; }
  if(!data.length){ tbody.innerHTML = '<tr><td colspan="5">Belum ada produk</td></tr>'; return; }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${p.image||'https://via.placeholder.com/120x80'}" style="width:120px;height:80px;object-fit:cover;border-radius:6px"></td>
      <td>${p.name}</td>
      <td>Rp ${Number(p.price).toLocaleString()}</td>
      <td>${p.description||''}</td>
      <td>
        <button class="btn" onclick="startEditProduct('${p.id}')">Edit</button>
        <button class="btn" onclick="deleteProduct('${p.id}')">Hapus</button>
      </td>
    </tr>
  `).join('');
}

// Add / Update product
el('product-form')?.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const id = el('p-id').value;
  const name = el('p-name').value.trim();
  const price = parseFloat(el('p-price').value);
  const image = el('p-image').value.trim();
  const description = el('p-desc').value.trim();
  if(!name || !image || isNaN(price)) return alert('Isi nama, gambar, harga valid');

  if(id){
    // update
    const { error } = await supabase.from('products').update({ name, price, image, description }).eq('id', id);
    if(error){ console.error('update product', error); alert('Gagal update: '+error.message); return; }
    el('p-id').value = '';
    el('product-form').reset();
  } else {
    // insert
    const { error } = await supabase.from('products').insert([{ name, price, image, description }]);
    if(error){ console.error('insert product', error); alert('Gagal tambah: '+error.message); return; }
    el('product-form').reset();
  }
  await loadAdminProducts();
});

// start edit flow
window.startEditProduct = async function(id){
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if(error || !data){ console.error('startEditProduct', error); return; }
  el('p-id').value = data.id;
  el('p-name').value = data.name;
  el('p-price').value = data.price;
  el('p-image').value = data.image;
  el('p-desc').value = data.description;
  window.scrollTo({ top:0, behavior:'smooth' });
};

// delete
window.deleteProduct = async function(id){
  if(!confirm('Hapus produk?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if(error){ console.error('deleteProduct', error); alert('Gagal hapus: '+error.message); return; }
  await loadAdminProducts();
};

// load orders
async function loadAdminOrders(){
  const tbody = el('admin-orders');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted)">Memuat...</td></tr>';
  const { data, error } = await supabase.from('orders').select('*').order('created_at', {ascending:false});
  if(error){ console.error('loadAdminOrders', error); tbody.innerHTML = '<tr><td colspan="5">Gagal memuat pesanan</td></tr>'; return; }
  if(!data.length){ tbody.innerHTML = '<tr><td colspan="5">Belum ada pesanan</td></tr>'; return; }

  // need product names for each items array
  const allProdIds = Array.from(new Set(data.flatMap(o => (o.items||[]).map(it=>it.product))));
  const { data: prods } = await supabase.from('products').select('id,name').in('id', allProdIds);
  const map = {}; (prods||[]).forEach(p=>map[p.id]=p.name);

  tbody.innerHTML = data.map(o => {
    const itemsHtml = (o.items||[]).map(it => map[it.product] || it.product).join('<br>');
    return `<tr>
      <td>${o.username}</td>
      <td>${o.phone}</td>
      <td>${itemsHtml}</td>
      <td>${o.status}</td>
      <td>
        <button class="btn" onclick="updateOrderStatus('${o.id}','done')">Done</button>
        <button class="btn" onclick="updateOrderStatus('${o.id}','canceled')">Batal</button>
      </td>
    </tr>`;
  }).join('');
}

// update order status
window.updateOrderStatus = async function(id, status){
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select();
  if(error){ console.error('updateOrderStatus', error); alert('Gagal update: '+error.message); return; }
  await loadAdminOrders();
};

// realtime subscriptions
function adminRealtime(){
  supabase.channel('rt-products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, ()=> loadAdminProducts())
    .subscribe()
    .catch(e=>console.warn('rt-products', e));

  supabase.channel('rt-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, ()=> loadAdminOrders())
    .subscribe()
    .catch(e=>console.warn('rt-orders', e));
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  loadAdminProducts();
  loadAdminOrders();
  adminRealtime();

  // reset form
  el('reset-form')?.addEventListener('click', ()=>{ el('product-form').reset(); el('p-id').value=''; });
});
