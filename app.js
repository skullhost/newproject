const supabaseUrl = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWxzZ3djY3JkcWpnY3hnbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTc0MDUsImV4cCI6MjA3MjYzMzQwNX0.6Ge1ON_x9Ce-l4tFRtH_Ks9o3v1RouLIDejtbohjo4Y";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let cart = [];

async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at",{ascending:false});
  if (error) return console.error(error);

  const container = document.getElementById("product-list");
  container.innerHTML = "";
  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <p>Rp ${p.price}</p>
      <button onclick="addToCart('${p.id}','${p.name}',${p.price})">Keranjang</button>
      <button onclick="buyProduct('${p.id}','${p.name}',${p.price})">Buy</button>
    `;
    container.appendChild(div);
  });
}

function addToCart(id,name,price){
  const exist = cart.find(i=>i.id===id);
  if(exist) exist.qty +=1;
  else cart.push({id,name,price,qty:1});
  renderCart();
}

function renderCart(){
  const container=document.getElementById("cart-list");
  container.innerHTML="";
  cart.forEach(item=>{
    const div=document.createElement("div");
    div.innerHTML=`${item.name} x${item.qty} - Rp ${item.price*item.qty} <button onclick="removeFromCart('${item.id}')">Hapus</button>`;
    container.appendChild(div);
  });
}

function removeFromCart(id){
  cart=cart.filter(i=>i.id!==id);
  renderCart();
}

async function buyProduct(id,name,price){
  const username=prompt("Masukkan username:");
  const phone=prompt("Masukkan nomor WA:");
  if(!username||!phone) return alert("Username & WA wajib diisi");

  const { error }=await supabase.from("orders").insert({
    username, phone, items:[{id,name,price,qty:1}], status:"pending"
  });
  if(error) return alert("Gagal checkout: "+error.message);
  alert("Checkout berhasil! Admin akan menghubungi Anda.");
}

async function checkoutCart(){
  const username=prompt("Masukkan username:");
  const phone=prompt("Masukkan nomor WA:");
  if(!username||!phone) return alert("Username & WA wajib diisi");

  const { error }=await supabase.from("orders").insert({
    username, phone, items:cart, status:"pending"
  });
  if(error) return alert("Gagal checkout: "+error.message);
  alert("Checkout berhasil!");
  cart=[];
  renderCart();
}

async function loadHistory(username){
  const { data, error }=await supabase.from("orders").select("*").eq("username",username).order("created_at",{ascending:false});
  if(error) return console.error(error);

  const list=document.getElementById("history-list");
  list.innerHTML="";
  data.forEach(order=>{
    const items=Array.isArray(order.items)?order.items.map(i=>`${i.name} x${i.qty}`).join(", "):"-";
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=`<h4>${items}</h4><p>Status: ${order.status}</p>`;
    list.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  loadProducts();
  renderCart();
});
