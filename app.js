const supabase = supabase.createClient('https://YOUR-PROJECT.supabase.co', 'YOUR-ANON-KEY');

async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return console.error(error);

  const list = document.getElementById('product-list');
  list.innerHTML = '';
  data.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${prod.image}" style="max-width:100%">
      <h3>${prod.name}</h3>
      <p>Rp${prod.price}</p>
      <button onclick="orderProduct('${prod.id}')">Beli</button>
    `;
    list.appendChild(card);
  });
}

async function orderProduct(productId) {
  const username = prompt("Masukkan nama:");
  const phone = prompt("Nomor WhatsApp:");
  const { error } = await supabase.from('orders').insert({ username, phone, product: productId });
  if (error) alert('Gagal order: ' + error.message);
  else alert('Order sukses!');
}

loadProducts();
