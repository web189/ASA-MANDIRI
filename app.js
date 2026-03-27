const passwordAdmin = "admin123";
const passwordKasir = "kasir123";
let data = JSON.parse(localStorage.getItem('data')) || [];
let kas = parseInt(localStorage.getItem('kas')) || 0; // modal awal
let role = "tamu";
let editIndex = -1;

const el = id => document.getElementById(id);

// ROLE
el('role').onchange = () => {
  const selectedRole = el('role').value;

  // kalau pilih tamu
  if(selectedRole === 'tamu'){
    role = 'tamu';
    render();
    return;
  }

  // minta password
  let inputPass = prompt("Masukkan Password:");

  if(selectedRole === 'admin' && inputPass === passwordAdmin){
    role = 'admin';
    alert("Login Admin berhasil!");
  } 
  else if(selectedRole === 'kasir' && inputPass === passwordKasir){
    role = 'kasir';
    alert("Login Kasir berhasil!");
  } 
  else {
    alert("Password salah!");
    el('role').value = 'tamu';
    role = 'tamu';
  }

  render();
};

// TAMBAH / EDIT
el('btnTambah').onclick = () => {
  const item = {
    kode: el('kode').value,
    nama: el('nama').value,
    modal: +el('modal').value,
    harga: +el('harga').value,
    masuk: +el('qty').value,
    keluar: 0
  };

  if (editIndex >= 0) {
    data[editIndex] = item;
    editIndex = -1;
  } else {
   kas -= item.modal * item.masuk; // potong kas beli barang
data.push(item);
  }

  save();
  clearForm();
  render();
};

function clearForm(){
  el('kode').value = '';
  el('nama').value = '';
  el('modal').value = '';
  el('harga').value = '';
  el('qty').value = '';
}

el('btnKas').onclick = () => {
  let jumlah = parseInt(el('kasInput').value);
  let tipe = el('tipeKas').value;

  // VALIDASI INPUT
  if(!jumlah || jumlah <= 0){
    alert("Masukkan jumlah yang valid!");
    return;
  }

  // 🔥 TAMBAHKAN DI SINI
  if(tipe === 'keluar' && kas < jumlah){
    alert("Kas tidak cukup!");
    return;
  }

  // PROSES KAS
  if(tipe === 'masuk'){
    kas += jumlah;
  } else {
    kas -= jumlah;
  }

  save();
  render();

  el('kasInput').value = '';
};

// EDIT
function editData(i){
  const d = data[i];
  el('kode').value = d.kode;
  el('nama').value = d.nama;
  el('modal').value = d.modal;
  el('harga').value = d.harga;
  el('qty').value = d.masuk;
  editIndex = i;
}

// JUAL
function jual(i){
  let d = data[i];
  if(d.masuk - d.keluar <= 0){
    alert("Stok habis!");
    return;
  }
  d.keluar++;
  kas += d.harga;
  save();
  render();
}

// HAPUS
function hapus(i){
  if(confirm("Hapus data?")){
    data.splice(i,1);
    save();
    render();
  }
}

// SIMPAN
function save(){
  localStorage.setItem('data', JSON.stringify(data));
  localStorage.setItem('kas', kas);
}

function rupiah(angka){
  let prefix = angka < 0 ? "-Rp. " : "Rp. ";
  return prefix + Math.abs(angka).toLocaleString("id-ID");
}

// RENDER
function render(){
  const keyword = el('search').value.toLowerCase();
  const table = el('dataTable');

  let totalPenjualan = 0;
  let totalLaba = 0;

  table.innerHTML = '';

  data
  .filter(d => d.nama.toLowerCase().includes(keyword))
  .forEach((d,i)=>{

    const sisa = d.masuk - d.keluar;
    const total = d.keluar * d.harga;
    const laba = d.keluar * (d.harga - d.modal);

    totalPenjualan += total;
    totalLaba += laba;

    table.innerHTML += `
    <tr class="${sisa>0?'status-ada':'status-habis'}">
      <td>${i+1}</td>
      <td>${d.nama}</td>
      <td>${rupiah(d.modal)}</td>
<td>${rupiah(d.harga)}</td>
      <td>${d.masuk}</td>
      <td>${d.keluar}</td>
      <td>${sisa}</td>
      <td>${rupiah(total)}</td>

      <td class="
  ${
    sisa === 0 
    ? 'status-habis'
    : sisa <= 5 
    ? 'status-warning'
    : 'status-ada'
  }
">
  ${
    sisa === 0 
    ? 'Habis'
    : sisa <= 5 
    ? 'Hampir Habis'
    : 'Tersedia'
  }
</td>
<td>
  ${
    role==='admin'
    ? `<button onclick="editData(${i})">Edit</button>
       <button onclick="hapus(${i})">Hapus</button>`
    : role==='kasir'
    ? `<button onclick="jual(${i})">Jual</button>`
    : `<span style="color:gray">View Only</span>`
  }
</td>
    </tr>`;
  });

el('totalPenjualan').innerText = rupiah(totalPenjualan);
el('totalLaba').innerText = rupiah(totalLaba);
el('kas').innerText = rupiah(kas);

  el('formBarang').style.display = role==='admin'?'block':'none';
  el('kasSection').style.display = role==='kasir' ? 'block' : 'none';
}

function updateJam(){
  const now = new Date();

  const jam = String(now.getHours()).padStart(2,'0');
  const menit = String(now.getMinutes()).padStart(2,'0');
  const detik = String(now.getSeconds()).padStart(2,'0');

  document.getElementById('jam').innerText = `${jam}:${menit}:${detik}`;
}

// update tiap 1 detik
setInterval(updateJam, 1000);

// jalankan pertama kali
updateJam();

// SEARCH
el('search').oninput = render;

// INIT
render();

