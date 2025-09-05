const supabase = supabase.createClient('https://YOUR-PROJECT.supabase.co', 'YOUR-ANON-KEY');

async function addProduct() {
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const image = document.getElementById('prodImage').value;
  const description = document.getElementById('prodDesc').value;

  const { error } = await supabase.from('products').insert({ name, price, image, description });
  if (error) alert('Gagal tambah produk: ' + error.message);
  else loadProducts();
}

async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return console.error(error);

  const tbody = document.querySelector('#product-list tbody');
  tbody.innerHTML = '';
  data.forEach(prod => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${prod.name}</td>
      <td>${prod.price}</td>
      <td>
        <button onclick="deleteProduct('${prod.id}')">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) alert('Gagal hapus: ' + error.message);
  else loadProducts();
}

async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, username, phone, status, product(name)');
  if (error) return console.error(error);

  const tbody = document.querySelector('#order-list tbody');
  tbody.innerHTML = '';
  data.forEach(order => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.username} (${order.phone})</td>
      <td>${order.product?.name || '-'}</td>
      <td>${order.status}</td>
      <td>
        <button onclick="updateStatus('${order.id}', 'done')">Done</button>
        <button onclick="updateStatus('${order.id}', 'canceled')">Batal</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function updateStatus(orderId, newStatus) {
  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  if (error) alert('Gagal update: ' + error.message);
  else loadOrders();
}

loadProducts();
loadOrders();
