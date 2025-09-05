const supabaseUrl = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWxzZ3djY3JkcWpnY3hnbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTc0MDUsImV4cCI6MjA3MjYzMzQwNX0.6Ge1ON_x9Ce-l4tFRtH_Ks9o3v1RouLIDejtbohjo4Y";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function loadProductsAdmin(){
  const { data,error }=await supabase.from("products").select("*").order("created_at",{ascending:false});
  if(error) return console.error(error);

  const tbody=document.getElementById("product-list-admin");
  tbody.innerHTML="";
  data.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${p.name}</td>
      <td>Rp ${p.price}</td>
      <td><img src="${p.image}" alt="${p.name}" width="50"/></td>
      <td>${p.description}</td>
      <td>
        <button onclick="editProduct('${p.id}')">Edit</button>
        <button onclick="deleteProduct('${p.id}')">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function addProduct(){
  const name=prompt("Nama produk:");
  const price=prompt("Harga:");
  const image=prompt("URL gambar:");
  const description=prompt("Deskripsi:");

  const { error }=await supabase.from("products").insert({name,price,image,description});
  if(error) return alert("Gagal tambah produk: "+error.message);
  loadProductsAdmin();
}

async function editProduct(id){
  const { data,error }=await supabase.from("products").select("*").eq("id",id).single();
  if(error) return alert("Gagal load produk: "+error.message);

  const name=prompt("Nama produk:",data.name);
  const price=prompt("Harga:",data.price);
  const image=prompt("URL gambar:",data.image);
  const description=prompt("Deskripsi:",data.description);

  const { error:err }=await supabase.from("products").update({name,price,image,description}).eq("id",id);
  if(err) return alert("Gagal update produk: "+err.message);
  loadProductsAdmin();
}

async function deleteProduct(id){
  if(!confirm("Yakin ingin hapus produk ini?")) return;
  const { error }=await supabase.from("products").delete().eq("id",id);
  if(error) return alert("Gagal hapus produk: "+error.message);
  loadProductsAdmin();
}

async function loadOrders(){
  const { data,error }=await supabase.from("orders").select("*").order("created_at",{ascending:false});
  if(error) return console.error(error);

  const tbody=document.getElementById("order-list-admin");
  tbody.innerHTML="";
  data.forEach(order=>{
    const items=Array.isArray(order.items)?order.items.map(i=>`${i.name} x${i.qty}`).join(", "):"-";
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${order.username}</td>
      <td>${order.phone}</td>
      <td>${items}</td>
      <td>${order.status}</td>
      <td>
        <button onclick="updateStatus('${order.id}','done')">Done</button>
        <button onclick="updateStatus('${order.id}','canceled')">Batal</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateStatus(orderId,newStatus){
  const { error }=await supabase.from("orders").update({status:newStatus}).eq("id",orderId);
  if(error) return alert("Gagal update status: "+error.message);
  loadOrders();
}

document.addEventListener("DOMContentLoaded",()=>{
  loadProductsAdmin();
  loadOrders();
});
