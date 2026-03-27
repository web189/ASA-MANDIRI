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
  const modalSatuan = +el('modal').value;
  const jumlahMasuk = +el('qty').value;
  const totalModal = modalSatuan * jumlahMasuk;
// Tambahkan validasi ini sebelum save()
if (+el('harga').value < +el('modal').value) {
  alert("Peringatan: Harga jual lebih rendah dari modal! Anda akan rugi.");
  // Tetap lanjut atau return; tergantung keinginan Anda
}

  const item = {
    kode: el('kode').value,
    nama: el('nama').value,
    modal: modalSatuan,
    harga: +el('harga').value,
    masuk: jumlahMasuk,
    keluar: 0
  };

  if (editIndex >= 0) {
    // Logika edit: (Opsional) Jika ingin lebih akurat, 
    // selisih modal harus dihitung. Untuk pemula, cukup update data.
    data[editIndex] = item;
    editIndex = -1;
  } else {
    // VALIDASI: Jangan sampai kas minus saat beli barang stok
    if (kas < totalModal) {
      alert("Kas tidak cukup untuk membeli stok barang ini!");
      return; 
    }
    kas -= totalModal; 
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
function jual(i) {
  let d = data[i];
  let stokTersedia = d.masuk - d.keluar;

  // Jika stok sudah 0 dari awal
  if (stokTersedia <= 0) {
    alert("Stok sudah habis!");
    return;
  }

  // Minta input jumlah yang dijual
  let inputJual = prompt(`Masukkan jumlah terjual untuk ${d.nama} (Maks: ${stokTersedia}):`, 1);
  let jumlahJual = parseInt(inputJual);

  // Validasi Input
  if (isNaN(jumlahJual) || jumlahJual <= 0) {
    alert("Masukkan jumlah yang valid!");
    return;
  }

  if (jumlahJual > stokTersedia) {
    alert(`Gagal! Stok tidak mencukupi. Sisa stok hanya ${stokTersedia}`);
    return;
  }

  // Eksekusi: Update data keluar dan kas
  d.keluar += jumlahJual;
  kas += (d.harga * jumlahJual);

  save();
  render();
  alert(`Berhasil menjual ${jumlahJual} ${d.nama}`);
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

  // Reset hitungan setiap kali render
  let totalPenjualanSekarang = 0;
  let totalModalBarangInput = 0;

  table.innerHTML = '';

  // Hitung TOTAL MODAL dari semua barang yang pernah diinput (Stok Masuk * Harga Modal)
  totalModalBarangInput = data.reduce((acc, d) => acc + (d.masuk * d.modal), 0);

  data
  .filter(d => d.nama.toLowerCase().includes(keyword))
  .forEach((d, i) => {
    const sisa = d.masuk - d.keluar;
    const totalHargaTerjual = d.keluar * d.harga;

    // Akumulasi total penjualan dari barang yang laku saja
    totalPenjualanSekarang += totalHargaTerjual;

    table.innerHTML += `
    <tr class="${sisa > 0 ? 'status-ada' : 'status-habis'}">
      <td>${i+1}</td>
      <td>${d.nama}</td>
      <td>${rupiah(d.modal)}</td>
      <td>${rupiah(d.harga)}</td>
      <td>${d.masuk}</td>
      <td>${d.keluar}</td>
      <td>${sisa}</td>
      <td>${rupiah(totalHargaTerjual)}</td>
      <td class="${sisa === 0 ? 'status-habis' : sisa <= 5 ? 'status-warning' : 'status-ada'}">
        ${sisa === 0 ? 'Habis' : sisa <= 5 ? 'Hampir Habis' : 'Tersedia'}
      </td>
      <td>
        ${role==='admin'
          ? `<button onclick="editData(${i})">Edit</button> <button onclick="hapus(${i})">Hapus</button>`
          : role==='kasir'
          ? `<button onclick="jual(${i})">Edit Jual</button>`
          : `<span style="color:gray">View Only</span>`
        }
      </td>
    </tr>`;
  });

  // LOGIKA LABA: Total Uang Masuk dari Jual - Total Uang Keluar untuk Stok
  // Atau jika ingin Laba Margin: (Harga Jual - Harga Modal) * Qty Terjual
  let labaMargin = data.reduce((acc, d) => acc + (d.keluar * (d.harga - d.modal)), 0);

  el('totalPenjualan').innerText = rupiah(totalPenjualanSekarang);
  el('totalLaba').innerText = rupiah(labaMargin);
  el('kas').innerText = rupiah(kas);

  el('formBarang').style.display = role==='admin'?'block':'none';
  el('kasSection').style.display = role==='kasir' ? 'block' : 'none';
}




function updateJam() {
  const now = new Date();

  // Daftar hari Indonesia
  const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hari = hariArr[now.getDay()];

  // Format Tanggal (DD.MM.YYYY)
  const tgl = String(now.getDate()).padStart(2, '0');
  const bln = String(now.getMonth() + 1).padStart(2, '0');
  const thn = now.getFullYear();

  // Format Waktu (HH:mm:ss)
  const jam = String(now.getHours()).padStart(2, '0');
  const mnt = String(now.getMinutes()).padStart(2, '0');
  const dtk = String(now.getSeconds()).padStart(2, '0');

  const elemenJam = document.getElementById('jam');
  
  // Validasi: Cek apakah elemen ada sebelum diisi
  if (elemenJam) {
    elemenJam.innerText = `${hari} ${tgl}.${bln}.${thn} ${jam}:${mnt}:${dtk} WIB`;
  }
}

// Jalankan interval setiap 1 detik
setInterval(updateJam, 1000);

// Panggil langsung saat refresh agar tidak menunggu 1 detik pertama
updateJam();



// SEARCH
el('search').oninput = render;

// INIT
render();

