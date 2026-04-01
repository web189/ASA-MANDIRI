/* ===========================
   ASA MANDIRI - APP.JS
   Versi: 2.1 | Update: Force Login on Refresh
   =========================== */

// ── STATE ──────────────────────────────────────
let currentUser = null;
let role = "tamu";
let data = [];
let histori = [];
let kas = 0;
let logKas = [];
let editIndex = -1;
let keranjang = []; // { id, nama, harga, qty, stokTersedia }
let noTransaksi = 0;

const ADMIN_EMAIL = "admin@asa.com";
const KASIR_EMAIL = "kasir@asa.com";

// ── HELPERS ─────────────────────────────────────
const el = id => document.getElementById(id);

function rupiah(angka) {
  const abs = Math.abs(angka);
  const prefix = angka < 0 ? "-Rp. " : "Rp. ";
  return prefix + abs.toLocaleString("id-ID");
}

function getEmoji(nama) {
  const n = nama.toLowerCase();
  if (n.includes("mie") || n.includes("noodle")) return "🍜";
  if (n.includes("beras") || n.includes("rice")) return "🌾";
  if (n.includes("minyak") || n.includes("oil")) return "🛢️";
  if (n.includes("gula") || n.includes("sugar")) return "🍬";
  if (n.includes("susu") || n.includes("milk")) return "🥛";
  if (n.includes("telur") || n.includes("egg")) return "🥚";
  if (n.includes("kopi") || n.includes("coffee")) return "☕";
  if (n.includes("teh") || n.includes("tea")) return "🍵";
  if (n.includes("air") || n.includes("water") || n.includes("aqua")) return "💧";
  if (n.includes("snack") || n.includes("keripik") || n.includes("chips")) return "🍟";
  if (n.includes("sabun") || n.includes("soap")) return "🧼";
  if (n.includes("deterjen") || n.includes("rinso")) return "🧺";
  if (n.includes("sampo") || n.includes("shampoo")) return "🧴";
  if (n.includes("rokok") || n.includes("cigarette")) return "🚬";
  if (n.includes("roti") || n.includes("bread")) return "🍞";
  if (n.includes("saus") || n.includes("ketchup") || n.includes("saos")) return "🍅";
  if (n.includes("minuman") || n.includes("sirup") || n.includes("jus")) return "🥤";
  if (n.includes("cokelat") || n.includes("choco")) return "🍫";
  if (n.includes("wafer") || n.includes("biscuit") || n.includes("biskuit")) return "🍪";
  return "📦";
}

function toast(pesan, tipe = "success") {
  const t = el("toast");
  if (!t) return;
  t.textContent = pesan;
  t.className = `toast ${tipe}`;
  setTimeout(() => { t.className = "toast hidden"; }, 3000);
}

function generateNoTransaksi() {
  const now = new Date();
  const tgl = now.toLocaleDateString("id-ID", { day:"2-digit", month:"2-digit", year:"2-digit" }).replace(/\//g,"-");
  const jam = now.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit", second:"2-digit" }).replace(/\./g,"");
  return `TRX-${tgl}-${jam}`;
}

// ── JAM ─────────────────────────────────────────
function updateJam() {
  const now = new Date();
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][now.getDay()];
  const tgl  = String(now.getDate()).padStart(2,"0");
  const bln  = String(now.getMonth()+1).padStart(2,"0");
  const thn  = now.getFullYear();
  const jam  = String(now.getHours()).padStart(2,"0");
  const mnt  = String(now.getMinutes()).padStart(2,"0");
  const dtk  = String(now.getSeconds()).padStart(2,"0");
  const str  = `${hari}, ${tgl}/${bln}/${thn} ${jam}:${mnt}:${dtk}`;

  if (el("jamSidebar")) el("jamSidebar").innerText = str;
  if (el("jamHeader"))  el("jamHeader").innerText  = str;
}
setInterval(updateJam, 1000);
updateJam();

// ── FIREBASE DATA ────────────────────────────────
function loadData() {
  db.ref("asaMandiri").on("value", snap => {
    const d = snap.val();
    if (d) {
      data     = d.data     || [];
      histori  = d.histori  || [];
      kas      = d.kas      || 0;
      logKas   = d.logKas   || [];
    }
    renderAll();
  });
}

function save() {
  db.ref("asaMandiri").set({ data, histori, kas, logKas });
}

// ── AUTH (MODIFIED FOR FORCE LOGIN) ──────────────
function login() {
  const email    = el("email").value.trim();
  const password = el("password").value;
  if (!email || !password) { toast("Email & password wajib diisi", "error"); return; }

  // Set Persistence ke SESSION agar login hilang saat tab ditutup
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => {
      return firebase.auth().signInWithEmailAndPassword(email, password);
    })
    .then(() => { 
      toast("Login berhasil!"); 
      el("password").value = ""; // Bersihkan password field
    })
    .catch(err => { toast("Login gagal: " + err.message, "error"); });
}

function loginSebagaiTamu() {
  currentUser = null;
  role = "tamu";
  el("loginOverlay").classList.add("hidden");
  el("appWrapper").classList.remove("hidden");
  applyRole();
  renderAll();
  showSection("dashboard");
}

function logout() {
  firebase.auth().signOut()
    .then(() => { 
      toast("Berhasil logout"); 
      // Force reload untuk memastikan state bersih
      window.location.reload();
    })
    .catch(err => { toast("Gagal: " + err.message, "error"); });
}

// FORCE LOGOUT SETIAP KALI HALAMAN DI MUAT ULANG (REFRESH)
firebase.auth().signOut().then(() => {
    console.log("State reset: Menunggu login baru.");
});

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    if (user.email === ADMIN_EMAIL)       role = "admin";
    else if (user.email === KASIR_EMAIL)  role = "kasir";
    else                                  role = "tamu";

    el("loginOverlay").classList.add("hidden");
    el("appWrapper").classList.remove("hidden");
  } else {
    currentUser = null;
    role = "tamu";
    el("loginOverlay").classList.remove("hidden");
    el("appWrapper").classList.add("hidden");
  }
  applyRole();
  renderAll();
  showSection("dashboard");
});

// ── ROLE UI ──────────────────────────────────────
function applyRole() {
  const avatars = { admin: "A", kasir: "K", tamu:  "T" };
  const colors  = {
    admin: "linear-gradient(135deg,#e17055,#d63031)",
    kasir: "linear-gradient(135deg,#0984e3,#74b9ff)",
    tamu:  "linear-gradient(135deg,#636e72,#b2bec3)"
  };
  const names   = { admin: "Administrator", kasir: "Kasir", tamu:  "Tamu" };

  if (el("userAvatar")) {
    el("userAvatar").textContent = avatars[role];
    el("userAvatar").style.background = colors[role];
  }
  if (el("userName"))    el("userName").textContent = names[role];
  if (el("userBadge"))   el("userBadge").textContent = role.toUpperCase();
  if (el("mobileBadge")) el("mobileBadge").textContent = role.toUpperCase();

  document.querySelectorAll(".admin-only").forEach(e => {
    e.classList.toggle("hidden", role !== "admin");
  });
  document.querySelectorAll(".kasir-only").forEach(e => {
    e.classList.toggle("hidden", role !== "kasir");
  });

  const aksiCols = document.querySelectorAll("th.admin-only");
  aksiCols.forEach(c => c.classList.toggle("hidden", role !== "admin"));
}

// ── NAVIGASI ─────────────────────────────────────
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const sec = el("sec-" + id);
  if (sec) sec.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelectorAll(`.nav-item[onclick*="${id}"]`).forEach(n => n.classList.add("active"));

  if (window.innerWidth <= 768) el("sidebar").classList.remove("open");
  renderSection(id);
}

function renderSection(id) {
  if (id === "dashboard")     renderDashboard();
  if (id === "inventaris")    renderInventaris();
  if (id === "inputBarang")   renderAdminTable();
  if (id === "histori")       renderHistori();
  if (id === "kasir")         { renderPilihBarang(); renderKeranjang(); }
  if (id === "manajemenKas")  renderKas();
}

function toggleSidebar() {
  el("sidebar").classList.toggle("open");
}

// ── RENDER ALL ───────────────────────────────────
function renderAll() {
  renderDashboard();
  const activeSection = document.querySelector(".section.active");
  if (activeSection) {
    const id = activeSection.id.replace("sec-", "");
    renderSection(id);
  }
}

// ── DASHBOARD ────────────────────────────────────
function renderDashboard() {
  const totalPenjualan = data.reduce((acc, d) => acc + (d.keluar * d.harga), 0);
  const totalLaba      = data.reduce((acc, d) => acc + (d.keluar * (d.harga - d.modal)), 0);
  const totalProduk    = data.length;

  if (el("statPenjualan")) el("statPenjualan").textContent = rupiah(totalPenjualan);
  if (el("statLaba"))      el("statLaba").textContent      = rupiah(totalLaba);
  if (el("statKas"))       el("statKas").textContent       = rupiah(kas);
  if (el("statProduk"))    el("statProduk").textContent    = totalProduk;

  const lowStock = data.filter(d => (d.masuk - d.keluar) <= 20 && (d.masuk - d.keluar) > 0);
  const habis    = data.filter(d => (d.masuk - d.keluar) <= 0);
  const lsEl     = el("lowStockList");
  if (!lsEl) return;

  if (lowStock.length === 0 && habis.length === 0) {
    lsEl.innerHTML = `<p class="empty-state">Semua stok aman ✅</p>`;
    return;
  }

  lsEl.innerHTML = "";
  habis.forEach(d => {
    lsEl.innerHTML += `
      <div class="low-stock-item" style="border-color:rgba(214,48,49,0.3);background:rgba(214,48,49,0.08);">
        <div class="item-name">${d.nama}</div>
        <div class="item-stock" style="color:#ff7675;">STOK HABIS</div>
      </div>`;
  });
  lowStock.forEach(d => {
    const sisa = d.masuk - d.keluar;
    lsEl.innerHTML += `
      <div class="low-stock-item">
        <div class="item-name">${d.nama}</div>
        <div class="item-stock">Sisa: ${sisa} unit</div>
      </div>`;
  });
}

// ── INVENTARIS ───────────────────────────────────
function renderInventaris() {
  const keyword = el("search")?.value?.toLowerCase() || "";
  const tbody   = el("dataTable");
  if (!tbody) return;

  const filtered = data.filter(d => d.nama.toLowerCase().includes(keyword));
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="empty-state">Tidak ada barang</td></tr>`;
    return;
  }

  filtered.forEach((d, i) => {
    const sisa         = d.masuk - d.keluar;
    const totalHarga   = d.keluar * d.harga;
    const laba         = d.keluar * (d.harga - d.modal);
    let statusBadge    = "";
    if (sisa <= 0)        statusBadge = `<span class="badge-habis">Habis</span>`;
    else if (sisa <= 20)  statusBadge = `<span class="badge-warning">⚠ Hampir Habis</span>`;
    else                  statusBadge = `<span class="badge-tersedia">Tersedia</span>`;

    const aksiAdmin = role === "admin" ? `
      <button class="btn-icon-edit" onclick="editData(${data.indexOf(d)})"><i class="fa-solid fa-pen"></i> Edit</button>
      <button class="btn-icon-del" onclick="hapus(${data.indexOf(d)})"><i class="fa-solid fa-trash"></i></button>
    ` : `<span style="color:var(--text-muted);font-size:11px;">-</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><code style="font-size:11px;color:var(--text-muted);">${d.kode || "-"}</code></td>
        <td>
          <div style="font-weight:600;">${d.nama}</div>
          <div style="font-size:10px;color:var(--text-muted);">${d.waktu || ""}</div>
        </td>
        <td>${rupiah(d.modal)}</td>
        <td>${rupiah(d.harga)}</td>
        <td>${d.masuk}</td>
        <td>${d.keluar}</td>
        <td><b>${sisa}</b></td>
        <td>${rupiah(totalHarga)}</td>
        <td class="${laba >= 0 ? 'laba-pos' : 'laba-neg'}">${rupiah(laba)}</td>
        <td>${statusBadge}</td>
        <td class="admin-only ${role !== 'admin' ? 'hidden' : ''}">${aksiAdmin}</td>
      </tr>`;
  });
}

// ── ADMIN TABLE ──────────────────────────────────
function renderAdminTable() {
  const tbody = el("adminTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Belum ada barang</td></tr>`;
    return;
  }

  data.forEach((d, i) => {
    const sisa = d.masuk - d.keluar;
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><code style="font-size:11px">${d.kode || "-"}</code></td>
        <td>${d.nama}</td>
        <td>${rupiah(d.modal)}</td>
        <td>${rupiah(d.harga)}</td>
        <td><b>${sisa}</b></td>
        <td>
          <button class="btn-icon-edit" onclick="editData(${i})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-icon-del" onclick="hapus(${i})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
  });
}

// ── HISTORI ──────────────────────────────────────
function renderHistori() {
  const list = el("historiList");
  if (!list) return;

  if (histori.length === 0) {
    list.innerHTML = `<p class="empty-state">Belum ada histori</p>`;
    return;
  }

  list.innerHTML = "";
  histori.slice().reverse().forEach(h => {
    list.innerHTML += `
      <div class="histori-item">
        <div class="histori-dot"></div>
        <div>
          <div class="histori-aksi">${h.aksi}</div>
          <div class="histori-waktu">${h.waktu}</div>
        </div>
      </div>`;
  });
}

function hapusHistori() {
  if (!confirm("Hapus semua histori?")) return;
  histori = [];
  save();
  renderHistori();
  toast("Histori dihapus");
}

function tambahHistori(aksi) {
  histori.push({
    aksi,
    waktu: new Date().toLocaleString("id-ID")
  });
}

// ── INPUT BARANG & KAS ───────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const btnTambah = el("btnTambah");
  if (btnTambah) {
    btnTambah.onclick = () => {
      if (role !== "admin") { toast("Akses ditolak", "error"); return; }

      const modalSatuan = +el("modal").value;
      const jumlahMasuk = +el("qty").value;
      const hargaJual   = +el("harga").value;
      const namaBarang  = el("nama").value.trim();
      const kodeBarang  = el("kode").value.trim();

      if (!namaBarang || !modalSatuan || !hargaJual || !jumlahMasuk) {
        toast("Lengkapi semua field!", "warning"); return;
      }

      const item = {
        kode: kodeBarang,
        nama: namaBarang,
        modal: modalSatuan,
        harga: hargaJual,
        masuk: jumlahMasuk,
        keluar: 0,
        kategori: el("kategori")?.value || "",
        waktu: new Date().toLocaleString("id-ID")
      };

      if (editIndex >= 0) {
        data[editIndex] = { ...data[editIndex], ...item, keluar: data[editIndex].keluar };
        tambahHistori(`Edit barang: ${item.nama}`);
        editIndex = -1;
      } else {
        const totalModal = modalSatuan * jumlahMasuk;
        if (kas < totalModal) { toast("Kas tidak cukup!", "error"); return; }
        kas -= totalModal;
        data.push(item);
        tambahHistori(`Tambah barang: ${item.nama}`);
      }

      save();
      clearForm();
      renderAdminTable();
      toast("Berhasil disimpan ✓");
    };
  }

  const btnKas = el("btnKas");
  if (btnKas) {
    btnKas.onclick = () => {
      const jumlah = parseInt(el("kasInput").value);
      const tipe   = el("tipeKas").value;
      if (!jumlah || jumlah <= 0) return;

      if (tipe === "keluar" && kas < jumlah) { toast("Kas tidak cukup!", "error"); return; }

      if (tipe === "masuk") kas += jumlah; else kas -= jumlah;

      logKas.push({ keterangan: el("keterKas")?.value || "Kas Update", jumlah, tipe, waktu: new Date().toLocaleString("id-ID") });
      save();
      renderKas();
      el("kasInput").value = "";
      toast(`Kas diupdate ✓`);
    };
  }
});

function clearForm() {
  ["kode","nama","modal","harga","qty","kategori"].forEach(id => { if (el(id)) el(id).value = ""; });
  editIndex = -1;
  if (el("formTitle")) el("formTitle").innerHTML = `<i class="fa-solid fa-plus"></i> Tambah Barang Baru`;
}

function editData(i) {
  const d = data[i];
  el("kode").value = d.kode;
  el("nama").value = d.nama;
  el("modal").value = d.modal;
  el("harga").value = d.harga;
  el("qty").value = d.masuk;
  editIndex = i;
  showSection("inputBarang");
}

function hapus(i) {
  if (!confirm(`Hapus "${data[i].nama}"?`)) return;
  data.splice(i, 1);
  save();
  renderAll();
}

// ── KASIR & KERANJANG ─────────────────────────────
function renderKas() {
  if (el("kasBalance")) el("kasBalance").textContent = rupiah(kas);
  const list = el("logKasList");
  if (!list) return;
  list.innerHTML = logKas.length === 0 ? `<p class="empty-state">Belum ada log kas</p>` : "";
  logKas.slice().reverse().forEach(l => {
    list.innerHTML += `<div class="log-kas-item"><div>${l.keterangan}<br><small>${l.waktu}</small></div><div class="${l.tipe === 'masuk' ? 'log-kas-masuk' : 'log-kas-keluar'}">${l.tipe === 'masuk' ? '+' : '-'}${rupiah(l.jumlah)}</div></div>`;
  });
}

function renderPilihBarang() {
  const keyword = el("searchKasir")?.value?.toLowerCase() || "";
  const grid = el("produkGrid");
  if (!grid) return;
  const filtered = data.filter(d => d.nama.toLowerCase().includes(keyword));
  grid.innerHTML = "";
  filtered.forEach(d => {
    const sisa = d.masuk - d.keluar;
    grid.innerHTML += `<div class="produk-card ${sisa <= 0 ? 'habis' : ''}" onclick="tambahKeKeranjang(${data.indexOf(d)})"><div class="produk-emoji">${getEmoji(d.nama)}</div><div class="produk-name">${d.nama}</div><div class="produk-harga">${rupiah(d.harga)}</div><div class="produk-stok">Stok: ${sisa}</div></div>`;
  });
}

function tambahKeKeranjang(idx) {
  const d = data[idx];
  const sisa = d.masuk - d.keluar;
  if (sisa <= 0) return toast("Stok habis!", "error");
  const existing = keranjang.find(k => k.dataIdx === idx);
  if (existing) {
    if (existing.qty < sisa) existing.qty++; else return toast("Stok maksimal!", "warning");
  } else {
    keranjang.push({ dataIdx: idx, nama: d.nama, harga: d.harga, qty: 1 });
  }
  renderKeranjang();
}

function ubahQtyKeranjang(idx, delta) {
  const item = keranjang.find(k => k.dataIdx === idx);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) keranjang = keranjang.filter(k => k.dataIdx !== idx);
  renderKeranjang();
}

function renderKeranjang() {
  const list = el("keranjangList");
  if (!list) return;
  list.innerHTML = keranjang.length === 0 ? `<p class="empty-state">Keranjang kosong</p>` : "";
  let total = 0;
  keranjang.forEach(k => {
    total += k.harga * k.qty;
    list.innerHTML += `<div class="keranjang-item"><div>${k.nama}<br><small>${rupiah(k.harga)} x ${k.qty}</small></div><div><button onclick="ubahQtyKeranjang(${k.dataIdx},-1)">-</button> ${k.qty} <button onclick="ubahQtyKeranjang(${k.dataIdx},1)">+</button></div></div>`;
  });
  if (el("grandTotal")) el("grandTotal").textContent = rupiah(total);
}

function checkout() {
  if (keranjang.length === 0) return;
  const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
  const bayar = +el("uangDiterima").value;
  if (bayar < total) return toast("Uang kurang!", "error");

  keranjang.forEach(k => { data[k.dataIdx].keluar += k.qty; });
  kas += total;
  logKas.push({ keterangan: "Penjualan Kasir", jumlah: total, tipe: "masuk", waktu: new Date().toLocaleString("id-ID") });
  tambahHistori(`Penjualan senilai ${rupiah(total)}`);
  
  save();
  tampilkanNota(keranjang, total, bayar, bayar - total);
  keranjang = [];
  el("uangDiterima").value = "";
  renderAll();
}

function tampilkanNota(items, total, bayar, kembali) {
  el("notaContent").innerHTML = `<h3>ASA MANDIRI</h3><hr>${items.map(i => `<div>${i.nama} x${i.qty} = ${rupiah(i.harga * i.qty)}</div>`).join("")}<hr>TOTAL: ${rupiah(total)}<br>BAYAR: ${rupiah(bayar)}<br>KEMBALI: ${rupiah(kembali)}`;
  el("notaModal").classList.remove("hidden");
}

function tutupNota() { el("notaModal").classList.add("hidden"); }

window.onload = () => { if (typeof db !== "undefined") loadData(); };
