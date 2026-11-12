
// =========================================
// SIAD PT LANA NUSANTARA
// SCRIPT.JS
// =========================================

"use strict";

// DATA CONTOH SURAT MASUK
let incomingLetters = [
  {
    id: 1,
    no: 1,
    receivedDate: "2026-10-15",
    letterNumber: "001/UND/X/2026",
    letterDate: "2026-10-14",
    sender: "Dinas Pendidikan",
    subject: "Undangan Rapat Koordinasi",
    summary: "Undangan rapat koordinasi program kerja dan evaluasi kegiatan.",
    archiveCode: "UM.01",
    nature: "Penting",
    status: "Belum Didisposisi",
    file: null,
    fileName: ""
  },
  {
    id: 2,
    no: 2,
    receivedDate: "2026-10-14",
    letterNumber: "014/PKS/X/2026",
    letterDate: "2026-10-13",
    sender: "PT Mitra Jaya",
    subject: "Permohonan Kerja Sama",
    summary: "Permohonan kerja sama untuk mendukung kegiatan operasional perusahaan.",
    archiveCode: "KS.02",
    nature: "Biasa",
    status: "Dalam Proses",
    file: null,
    fileName: ""
  },
  {
    id: 3,
    no: 3,
    receivedDate: "2026-10-13",
    letterNumber: "022/EVL/X/2026",
    letterDate: "2026-10-12",
    sender: "Bagian Operasional",
    subject: "Pemberitahuan Evaluasi",
    summary: "Pemberitahuan jadwal evaluasi kinerja dan laporan kegiatan.",
    archiveCode: "OP.01",
    nature: "Penting",
    status: "Dalam Proses",
    file: null,
    fileName: ""
  },
  {
    id: 4,
    no: 4,
    receivedDate: "2026-10-12",
    letterNumber: "007/INF/X/2026",
    letterDate: "2026-10-11",
    sender: "PT Sumber Data",
    subject: "Penyampaian Informasi",
    summary: "Penyampaian informasi umum mengenai pembaruan data perusahaan.",
    archiveCode: "IN.01",
    nature: "Biasa",
    status: "Selesai",
    file: null,
    fileName: ""
  },
  {
    id: 5,
    no: 5,
    receivedDate: "2026-10-10",
    letterNumber: "019/UND/X/2026",
    letterDate: "2026-10-09",
    sender: "Bagian Keuangan",
    subject: "Undangan Pembahasan Anggaran",
    summary: "Undangan pembahasan rencana dan evaluasi anggaran perusahaan.",
    archiveCode: "KE.02",
    nature: "Rahasia",
    status: "Selesai",
    file: null,
    fileName: ""
  }
];

let nextId = 6;
let pendingDeleteId = null;
let activeDetailId = null;

// =========================================
// ELEMEN DAN FUNGSI BANTUAN
// =========================================

const missingElementStub = new Proxy({}, {
  get(_target, property) {
    if (property === "classList") return { add() {}, remove() {}, toggle() { return false; }, contains() { return false; } };
    if (property === "style" || property === "dataset") return {};
    if (property === "files") return [];
    if (property === "value" || property === "textContent" || property === "innerHTML" || property === "className") return "";
    if (property === "closest" || property === "querySelector" || property === "getAttribute") return () => null;
    if (property === "querySelectorAll") return () => [];
    if (property === "addEventListener" || property === "removeEventListener" || property === "reset" || property === "focus" || property === "click" || property === "setAttribute" || property === "removeAttribute") return () => {};
    return undefined;
  },
  set() { return true; }
});
const $ = (selector) => document.querySelector(selector) || missingElementStub;

// GANTI dengan nomor WhatsApp Pimpinan dalam format internasional.
// Contoh Indonesia: 62812XXXXXXXX (tanpa tanda +, spasi, atau angka 0 di depan).

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const parts = dateValue.split("-");
  if (parts.length !== 3) return dateValue;

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


// Pencarian menyeluruh: gabungkan atribut teks yang tersedia dan variasi tanggal.
function searchableRecordText(record) {
  if (!record) return "";
  const values = [];
  const add = value => {
    if (value === null || value === undefined || typeof value === "object") return;
    values.push(String(value));
  };
  Object.entries(record).forEach(([key, value]) => {
    if (key === "file" || key === "blob" || key === "dataUrl") return;
    if (Array.isArray(value)) value.forEach(add); else add(value);
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y,m,d] = value.split("-");
      values.push(`${d}/${m}/${y}`, `${d}-${m}-${y}`, formatDate(value));
    }
  });
  return values.join(" ").normalize("NFKC").toLocaleLowerCase("id-ID");
}
function matchesGlobalSearch(record, query) {
  const q = String(query || "").trim().normalize("NFKC").toLocaleLowerCase("id-ID");
  return !q || searchableRecordText(record).includes(q);
}

function setSelectValueCompat(select, value) {
  if (!select) return;
  const v = String(value || "");
  if (v && !Array.from(select.options).some(option => option.value === v)) {
    const legacy = new Option(`${v} (data lama)`, v);
    select.add(legacy);
  }
  select.value = v;
}
function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function openModal(id) {
  $("#" + id).classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  $("#" + id).classList.remove("show");

  if (!document.querySelector(".modal-backdrop.show")) {
    document.body.style.overflow = "";
  }
}

function getLetter(id) {
  return incomingLetters.find(letter => letter.id === Number(id));
}

function nextAgendaNumber() {
  return incomingLetters.reduce((highest, letter) => {
    return Math.max(highest, Number(letter.no) || 0);
  }, 0) + 1;
}

// =========================================
// TANGGAL HEADER DAN DASHBOARD
// =========================================

function setupDates() {
  const now = new Date();

  const formatted = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  $("#todayDate").textContent = formatted;
  $("#welcomeDate").textContent = formatted;
}

// =========================================
// NAVIGASI SIDEBAR
// =========================================

const pageNames = {
  dashboard: "Dashboard",
  "surat-masuk": "Surat Masuk",
  "surat-keluar": "Surat Keluar",
  disposisi: "Disposisi",
  klasifikasi: "Klasifikasi Arsip",
  "profil-pengguna": "Profil Pengguna",
  agenda: "Buku Agenda",
  pengguna: "Pengelola Akun Pengguna",
  notifikasi: "Notifikasi"
};

function showPage(pageName) {
  const target = $("#page-" + pageName);

  if (!target) return;

  document.querySelectorAll(".page-view").forEach(page => {
    page.classList.remove("active");
  });

  target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  $("#breadcrumbCurrent").textContent =
    pageNames[pageName] || "Dashboard";

  closeSidebarOnMobile();
  // Muat/render hanya bagian yang sedang dibuka, bukan seluruh tabel setiap login.
  renderSiadPageIfNeeded(pageName);
  window.scrollTo({ top: 0, behavior: "auto" });
}

const renderedSiadPages = new Set();
function renderSiadPageIfNeeded(pageName) {
  if (renderedSiadPages.has(pageName)) return;
  try {
    switch (pageName) {
      case "dashboard": break;
      case "surat-masuk": setupDates(); resetLetterForm(); renderIncomingTable(); break;
      case "surat-keluar": renderOutgoingTable(); break;
      case "disposisi": renderDispositionTable(); break;
      case "klasifikasi": renderClassifications(); break;
      case "pengguna": renderUsers(); break;
      case "notifikasi": renderNotifications(); break;
      case "agenda": renderRecentLetters(); break;
      case "profil-pengguna": renderUserProfile(); break;
    }
    renderedSiadPages.add(pageName);
  } catch (error) {
    console.error("Gagal memuat halaman SIAD:", pageName, error);
  }
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

// Sidebar mobile
function openSidebar() {
  $("#sidebar").classList.add("open");
  $("#sidebarOverlay").classList.add("show");
}

function closeSidebarOnMobile() {
  $("#sidebar").classList.remove("open");
  $("#sidebarOverlay").classList.remove("show");
}

$("#menuToggle").addEventListener("click", openSidebar);
$("#closeSidebar").addEventListener("click", closeSidebarOnMobile);
$("#sidebarOverlay").addEventListener("click", closeSidebarOnMobile);

// =========================================
// STATUS DAN BADGE
// =========================================

function natureClass(nature) {
  if (nature === "Penting") return "tag-important";
  if (nature === "Rahasia") return "tag-secret";
  return "tag-ordinary";
}

function statusClass(status) {
  if (status === "Selesai") return "tag-done";
  if (status === "Dalam Proses") return "tag-process";
  return "tag-pending";
}

function natureBadge(nature) {
  return `<span class="tag ${natureClass(nature)}">${escapeHTML(nature)}</span>`;
}

function statusBadge(status) {
  return `<span class="tag ${statusClass(status)}">${escapeHTML(status)}</span>`;
}

// =========================================
// TABEL SURAT MASUK
// =========================================

function renderIncomingTable() {
  const searchText = $("#letterSearch").value.trim().toLowerCase();
  const statusValue = $("#statusFilter").value;
  const natureValue = $("#natureFilter").value;

  const filtered = incomingLetters.filter(letter => {
    const searchable = searchableRecordText(letter);
    const matchesSearch = !searchText || searchable.includes(searchText);
    const matchesStatus = !statusValue || letter.status === statusValue;
    const matchesNature = !natureValue || letter.nature === natureValue;

    return matchesSearch && matchesStatus && matchesNature;
  });

  const tbody = $("#incomingTableBody");

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-row">
          Tidak ada surat yang sesuai dengan pencarian.
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = filtered.map(letter => `
      <tr>
        <td>${escapeHTML(letter.no)}</td>
        <td>${escapeHTML(formatDate(letter.receivedDate))}</td>
        <td>${escapeHTML(letter.letterNumber)}</td>
        <td>${escapeHTML(formatDate(letter.letterDate))}</td>
        <td class="sender-cell">
          <strong>${escapeHTML(letter.sender)}</strong>
        </td>
        <td class="subject-cell">
          <strong>${escapeHTML(letter.subject)}</strong>
        </td>
        <td class="summary-cell">${escapeHTML(letter.summary)}</td>
        <td class="code-cell">${escapeHTML(letter.archiveCode || "-")}</td>
        <td>${natureBadge(letter.nature)}</td>
        <td>${statusBadge(letter.status)}</td>
        <td class="action-cell">
          <div class="action-buttons">
            <button class="action-btn view-file"
              data-action="view-file" data-id="${letter.id}"
              title="Buka file surat">↗ Lihat Surat</button>
            <button class="action-btn" data-action="download" data-id="${letter.id}"
              title="Unduh file surat">↓ Download Surat</button>
            <button class="action-btn"
              data-action="edit" data-id="${letter.id}"
              title="Edit data surat">✎ Edit</button>
            <button class="action-btn"
              data-action="print" data-id="${letter.id}"
              title="Cetak data surat">▤ Cetak</button>
            <button class="action-btn delete-action"
              data-action="delete" data-id="${letter.id}"
              title="Hapus data surat">× Hapus</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  $("#tableResultCount").textContent =
    `Menampilkan ${filtered.length} dari ${incomingLetters.length} surat`;

  updateStatistics();
}

$("#letterSearch").addEventListener("input", renderIncomingTable);
$("#statusFilter").addEventListener("change", renderIncomingTable);
$("#natureFilter").addEventListener("change", renderIncomingTable);

// =========================================
// STATISTIK DASHBOARD DAN SURAT MASUK
// =========================================

function updateStatistics() {
  const total = incomingLetters.length;
  const pending = incomingLetters.filter(
    letter => letter.status === "Belum Didisposisi"
  ).length;
  const processing = incomingLetters.filter(
    letter => letter.status === "Dalam Proses"
  ).length;
  const completed = incomingLetters.filter(
    letter => letter.status === "Selesai"
  ).length;

  $("#totalIncoming").textContent = total;
  $("#processingIncoming").textContent = processing;
  $("#completedIncoming").textContent = completed;

  $("#dashboardIncoming").textContent = total;
  $("#dashboardPending").textContent = pending;
  $("#dashboardProcessing").textContent = processing;

  $("#summaryPending").textContent = pending;
  $("#summaryProcessing").textContent = processing;
  $("#summaryDone").textContent = completed;

  $("#sidebarIncomingCount").textContent = total;

  renderRecentLetters();
}

function renderRecentLetters() {
  const recent = [...incomingLetters]
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
    .slice(0, 4);

  $("#recentLetters").innerHTML = recent.map(letter => `
    <div class="recent-item">
      <div class="recent-icon">✉</div>
      <div class="recent-info">
        <strong>${escapeHTML(letter.subject)}</strong>
        <span>${escapeHTML(letter.sender)} · ${escapeHTML(letter.letterNumber)}</span>
        <small>${escapeHTML(formatDate(letter.receivedDate))} · ${escapeHTML(letter.status)}</small>
      </div>
    </div>
  `).join("");
}

$("#refreshDashboard").addEventListener("click", () => {
  renderIncomingTable();
  showToast("Ringkasan tampilan telah diperbarui.");
});

// =========================================
// FORM TAMBAH SURAT DAN EDIT SURAT
// =========================================

function resetLetterForm() {
  $("#letterForm").reset();
  $("#editId").value = "";
  $("#formNo").value = nextAgendaNumber();
  $("#formReceivedDate").value = todayISO();
  $("#formLetterDate").value = todayISO();
  $("#formNature").value = "Biasa";
  $("#formStatus").value = "Belum Didisposisi";
  $("#formFile").value = "";
  $("#selectedFile").textContent = "Belum ada file dipilih.";
  $("#letterModalTitle").textContent = "Tambah Surat Masuk";
}

function openAddForm() {
  resetLetterForm();
  openModal("letterModal");
}

$("#openAddLetter").addEventListener("click", openAddForm);
$("#closeLetterModal").addEventListener("click", () => closeModal("letterModal"));
$("#cancelLetter").addEventListener("click", () => closeModal("letterModal"));

$("#formFile").addEventListener("change", () => {
  const file = $("#formFile").files[0];

  if (!file) {
    $("#selectedFile").textContent = "Belum ada file dipilih.";
    return;
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    showToast("Ukuran file maksimal 10 MB.");
    $("#formFile").value = "";
    $("#selectedFile").textContent = "Belum ada file dipilih.";
    return;
  }

  const allowedExtensions = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;

  if (!allowedExtensions.test(file.name)) {
    showToast("Format file belum didukung.");
    $("#formFile").value = "";
    $("#selectedFile").textContent = "Belum ada file dipilih.";
    return;
  }

  $("#selectedFile").textContent =
    `File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
});

function openEditForm(id) {
  const letter = getLetter(id);
  if (!letter) return;

  resetLetterForm();

  $("#letterModalTitle").textContent = "Edit Surat Masuk";
  $("#editId").value = letter.id;
  $("#formNo").value = letter.no;
  $("#formLetterNumber").value = letter.letterNumber;
  $("#formReceivedDate").value = letter.receivedDate;
  $("#formLetterDate").value = letter.letterDate;
  $("#formSender").value = letter.sender;
  $("#formSubject").value = letter.subject;
  $("#formSummary").value = letter.summary;
  $("#formArchiveCode").value = letter.archiveCode;
  $("#formNature").value = letter.nature;
  $("#formStatus").value = letter.status;
  $("#selectedFile").textContent = letter.fileName
    ? `File saat ini: ${letter.fileName}. Pilih file baru jika ingin menggantinya.`
    : "Belum ada file surat yang dilampirkan.";

  openModal("letterModal");
}

$("#letterForm").addEventListener("submit", event => {
  event.preventDefault();

  const editId = $("#editId").value;
  const existing = editId ? getLetter(editId) : null;
  const selectedFile = $("#formFile").files[0];

  const letterData = {
    id: existing ? existing.id : nextId++,
    no: existing ? existing.no : nextAgendaNumber(),
    letterNumber: $("#formLetterNumber").value.trim(),
    receivedDate: $("#formReceivedDate").value,
    letterDate: $("#formLetterDate").value,
    sender: $("#formSender").value.trim(),
    subject: $("#formSubject").value.trim(),
    summary: $("#formSummary").value.trim(),
    archiveCode: $("#formArchiveCode").value.trim(),
    nature: $("#formNature").value,
    status: $("#formStatus").value,
    file: existing ? existing.file : null,
    fileName: existing ? existing.fileName : ""
  };

  if (selectedFile) {
    letterData.file = selectedFile;
    letterData.fileName = selectedFile.name;
  }

  if (existing) {
    const index = incomingLetters.findIndex(
      letter => letter.id === existing.id
    );
    incomingLetters[index] = letterData;
    showToast("Data surat berhasil diperbarui.");
  } else {
    incomingLetters.push(letterData);
    showToast("Surat masuk berhasil ditambahkan.");
  }

  closeModal("letterModal");
  renderIncomingTable();
});

// =========================================
// LIHAT SURAT: BUKA FILE YANG DIUNGGAH
// =========================================

function downloadBlobFile(file, fileName) {
  if (!file) return false;
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || file.name || "dokumen-surat";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}

function downloadLetterFile(id) {
  const letter = getLetter(id);
  if (!letter) return;
  if (!letter.file) {
    showToast("Belum ada file surat untuk diunduh. Gunakan Edit untuk melampirkan file.");
    return;
  }
  downloadBlobFile(letter.file, letter.fileName || letter.file.name || "surat-masuk");
  showToast("Download surat berhasil dimulai.");
}

function viewLetterFile(id) {
  const letter = getLetter(id);
  if (!letter) return;

  if (!letter.file) {
    showToast(
      "Belum ada file untuk surat ini. Gunakan Edit untuk melampirkan file."
    );
    return;
  }

  const file = letter.file;
  const fileName = letter.fileName || file.name;
  const extension = fileName.split(".").pop().toLowerCase();

  // PDF dan gambar dapat ditampilkan langsung di tab browser.
  if (["pdf", "jpg", "jpeg", "png"].includes(extension)) {
    const fileURL = URL.createObjectURL(file);
    const newWindow = window.open(fileURL, "_blank");

    if (!newWindow) {
      URL.revokeObjectURL(fileURL);
      showToast("Browser memblokir tab baru. Izinkan pop-up lalu coba lagi.");
      return;
    }

    // URL tidak langsung dicabut karena tab baru masih memakainya.
    setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
    return;
  }

  // Format DOC/DOCX tidak selalu bisa dipratinjau oleh browser.
  const downloadURL = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadURL;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);
  showToast("File Word diunduh. Buka file menggunakan aplikasi yang sesuai.");
}

// =========================================
// MODAL DETAIL SURAT
// =========================================

function detailField(label, value, full = false) {
  return `
    <div class="detail-field ${full ? "full-detail" : ""}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value || "-")}</strong>
    </div>`;
}

function openDetail(id) {
  const letter = getLetter(id);
  if (!letter) return;

  activeDetailId = letter.id;

  $("#detailContent").innerHTML = `
    ${detailField("Nomor Agenda", letter.no)}
    ${detailField("Nomor Surat", letter.letterNumber)}
    ${detailField("Tanggal Terima", formatDate(letter.receivedDate))}
    ${detailField("Tanggal Surat", formatDate(letter.letterDate))}
    ${detailField("Diterima dari / Pengirim", letter.sender)}
    ${detailField("Perihal", letter.subject)}
    ${detailField("Kode Arsip", letter.archiveCode || "-")}
    ${detailField("Sifat Surat", letter.nature)}
    ${detailField("Status Disposisi", letter.status)}
    ${detailField("Isi Ringkas", letter.summary, true)}
    ${detailField("File Surat", letter.fileName || "Belum ada file dilampirkan", true)}
  `;

  openModal("detailModal");
}

$("#closeDetailModal").addEventListener("click", () => closeModal("detailModal"));
$("#detailClose").addEventListener("click", () => closeModal("detailModal"));

$("#detailViewFile").addEventListener("click", () => {
  if (activeDetailId !== null) viewLetterFile(activeDetailId);
});

$("#detailPrint").addEventListener("click", () => {
  if (activeDetailId !== null) printLetter(activeDetailId);
});

// =========================================
// CETAK DATA SURAT
// =========================================

function printLetter(id) {
  const letter = getLetter(id);
  if (!letter) return;
  if (!letter.file) {
    showToast("Belum ada file surat yang dapat dicetak. Gunakan Edit untuk melampirkan file surat.");
    return;
  }
  printUploadedDocument(letter.file, letter.fileName || letter.file.name || "surat-masuk");
}

// =========================================
// HAPUS SURAT DENGAN KONFIRMASI
// =========================================

function askDelete(id) {
  const letter = getLetter(id);
  if (!letter) return;

  pendingDeleteId = letter.id;
  openModal("deleteModal");
}

$("#cancelDelete").addEventListener("click", () => {
  pendingDeleteId = null;
  closeModal("deleteModal");
});

$("#confirmDelete").addEventListener("click", () => {
  if (pendingDeleteId === null) return;

  const deleted = getLetter(pendingDeleteId);

  incomingLetters = incomingLetters.filter(
    letter => letter.id !== pendingDeleteId
  );

  if (deleted && activeDetailId === deleted.id) {
    activeDetailId = null;
    closeModal("detailModal");
  }

  pendingDeleteId = null;
  closeModal("deleteModal");
  renderIncomingTable();
  showToast("Data surat berhasil dihapus dari daftar demo.");
});

// =========================================
// AKSI PADA TABEL
// =========================================

$("#incomingTableBody").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  if (action === "view-file") viewLetterFile(id);
  if (action === "download") downloadLetterFile(id);
  if (action === "detail") openDetail(id);
  if (action === "edit") openEditForm(id);
  if (action === "print") printLetter(id);
  if (action === "delete") askDelete(id);
});

// =========================================
// KELUAR DARI DASHBOARD DEMO
// =========================================

$("#logoutButton").addEventListener("click", () => {
  openModal("logoutModal");
});

$("#cancelLogout").addEventListener("click", () => {
  closeModal("logoutModal");
});

$("#confirmLogout").addEventListener("click", () => {
  closeModal("logoutModal");
  sessionStorage.removeItem("siadRole");
  sessionStorage.removeItem("siadUsername");
  sessionStorage.removeItem("siadDemoSession");
  window.location.href = "../index.html";
});

// =========================================
// TUTUP MODAL KETIKA LATAR DIKLIK
// =========================================

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) {
      closeModal(backdrop.id);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-backdrop.show").forEach(modal => {
      closeModal(modal.id);
    });

    closeSidebarOnMobile();
  }
});

// =========================================
// SURAT KELUAR DAN DISPOSISI
// =========================================

let outgoingLetters = [
  { id: 101, no: 1, letterNumber: "003/SLN/X/2026", date: "2026-10-15", recipient: "Dinas Perindustrian", subject: "Penyampaian Laporan Bulanan", summary: "Penyampaian laporan kegiatan operasional bulan September.", archiveCode: "LP.01", nature: "Penting", status: "Terkirim", signer: "Direktur", file: null, fileName: "" },
  { id: 102, no: 2, letterNumber: "004/SLN/X/2026", date: "2026-10-16", recipient: "PT Mitra Jaya", subject: "Tanggapan Permohonan Kerja Sama", summary: "Tanggapan awal atas permohonan kerja sama operasional.", archiveCode: "KS.02", nature: "Biasa", status: "Draft", signer: "Direktur", file: null, fileName: "" },
  { id: 103, no: 3, letterNumber: "005/SLN/X/2026", date: "2026-10-17", recipient: "Bagian Operasional", subject: "Arahan Evaluasi Kinerja", summary: "Surat terkait evaluasi dan rencana tindak lanjut kinerja.", archiveCode: "OP.01", nature: "Penting", status: "Draft", signer: "Pimpinan", file: null, fileName: "" }
];
let nextOutgoingId = 104;
let pendingOutgoingDeleteId = null;

// Daftar disposisi dimulai kosong. Isinya hanya bertambah ketika Admin/Sekretaris mengajukan surat.
let dispositions = [];
let nextDispositionId = 1;

function getOutgoing(id) {
  return outgoingLetters.find(letter => letter.id === Number(id));
}
function getDisposition(id) {
  return dispositions.find(item => item.id === Number(id));
}
function nextOutgoingNumber() {
  return outgoingLetters.reduce((max, item) => Math.max(max, Number(item.no) || 0), 0) + 1;
}
function dispositionStatusFromOutgoing(status) {
  if (status === "Selesai") return "Selesai";
  if (status === "Ditolak") return "Ditolak";
  if (status === "Dalam Proses") return "Dalam Proses";
  return "Menunggu Arahan";
}
function outgoingStatusBadge(status) {
  const cls = status === "Terkirim" || status === "Disetujui" ? "tag-done" :
    status === "Menunggu Disposisi" ? "tag-pending" :
    status === "Draft" ? "tag-ordinary" : "tag-process";
  return `<span class="tag ${cls}">${escapeHTML(status)}</span>`;
}
function dispositionBadge(status) {
  const cls = status === "Selesai" ? "tag-done" :
    status === "Dalam Proses" ? "tag-process" :
    status === "Ditolak" ? "tag-secret" : "tag-pending";
  return `<span class="tag ${cls}">${escapeHTML(status)}</span>`;
}
function renderOutgoingTable() {
  const search = $("#outgoingSearch").value.trim().toLowerCase();
  const status = $("#outgoingStatusFilter").value;
  const nature = $("#outgoingNatureFilter").value;
  const rows = outgoingLetters.filter(item => {
    return matchesGlobalSearch(item, search) && (!status || item.status === status) && (!nature || item.nature === nature);
  });
  $("#outgoingTableBody").innerHTML = rows.length ? rows.map(item => {
    return `<tr>
      <td>${escapeHTML(item.no)}</td><td>${escapeHTML(formatDate(item.date))}</td>
      <td>${escapeHTML(item.letterNumber)}</td><td>${escapeHTML(formatDate(item.letterDate || item.date))}</td>
      <td class="sender-cell"><strong>${escapeHTML(item.recipient)}</strong></td>
      <td class="subject-cell"><strong>${escapeHTML(item.subject)}</strong></td>
      <td class="summary-cell">${escapeHTML(item.summary)}</td><td>${escapeHTML(item.archiveCode || "-")}</td>
      <td>${natureBadge(item.nature)}</td><td>${outgoingStatusBadge(item.status)}</td>
      <td><div class="action-buttons">
        <button class="action-btn view-file" data-out-action="view-file" data-id="${item.id}">↗ Lihat Surat</button>
        <button class="action-btn" data-out-action="download" data-id="${item.id}" title="Unduh file surat">↓ Download Surat</button>
        <button class="action-btn" data-out-action="edit" data-id="${item.id}">✎ Edit</button>
        <button class="action-btn" data-out-action="print" data-id="${item.id}">▤ Cetak</button>
        <button class="action-btn delete-action" data-out-action="delete" data-id="${item.id}">× Hapus</button>
      </div></td></tr>`;
  }).join("") : '<tr><td colspan="11" class="empty-row">Tidak ada surat keluar yang sesuai.</td></tr>';
  $("#outgoingResultCount").textContent = `Menampilkan ${rows.length} dari ${outgoingLetters.length} surat`;
  $("#totalOutgoing").textContent = outgoingLetters.length;
  $("#pendingOutgoing").textContent = outgoingLetters.filter(item => item.status === "Draft").length;
  $("#sentOutgoing").textContent = outgoingLetters.filter(item => item.status === "Terkirim").length;
  const dashboardOutgoing = document.querySelector("#dashboardOutgoing");
  if (dashboardOutgoing) dashboardOutgoing.textContent = outgoingLetters.length;
  const badge = document.querySelector("#sidebarDispositionCount");
  if (badge) badge.textContent = dispositions.filter(d => d.status === "Menunggu Arahan").length;
}
function resetOutgoingForm() {
  $("#outgoingForm").reset();
  $("#outgoingEditId").value = "";
  $("#outgoingNo").value = nextOutgoingNumber();
  $("#outgoingDate").value = todayISO();
  $("#outgoingStatus").value = "Draft";
  $("#outgoingNature").value = "Biasa";
  $("#outgoingFile").value = "";
  $("#outgoingSelectedFile").textContent = "Belum ada file dipilih.";
  $("#outgoingModalTitle").textContent = "Tambah Surat Keluar";
}
function openOutgoingForm(id = null) {
  resetOutgoingForm();
  if (id !== null) {
    const item = getOutgoing(id);
    if (!item) return;
    $("#outgoingModalTitle").textContent = "Edit Surat Keluar";
    $("#outgoingEditId").value = item.id;
    $("#outgoingNo").value = item.no;
    $("#outgoingLetterNumber").value = item.letterNumber;
    $("#outgoingDate").value = item.date;
    $("#outgoingRecipient").value = item.recipient;
    $("#outgoingSubject").value = item.subject;
    $("#outgoingSummary").value = item.summary;
    $("#outgoingArchiveCode").value = item.archiveCode || "";
    $("#outgoingNature").value = item.nature;
    $("#outgoingStatus").value = item.status === "Menunggu Disposisi" ? "Draft" : item.status;
    $("#outgoingSelectedFile").textContent = item.fileName ? `File saat ini: ${item.fileName}. Pilih file baru untuk menggantinya.` : "Belum ada file dipilih.";
    const disp = dispositions.find(d => String(d.outgoingId) === String(item.id));
    if (disp) {
      $("#requestDisposition").checked = true;
      $("#outgoingDispositionFields").hidden = false;
      $("#outgoingAssignedTo").value = disp.assignedTo;
      $("#outgoingInstruction").value = disp.instruction;
      $("#outgoingDeadline").value = disp.deadline || "";
      $("#outgoingAssignedTo").required = true;
      $("#outgoingInstruction").required = true;
    }
  }
  openModal("outgoingModal");
}
$("#openAddOutgoing").addEventListener("click", () => openOutgoingForm());
$("#closeOutgoingModal").addEventListener("click", () => closeModal("outgoingModal"));
$("#cancelOutgoing").addEventListener("click", () => closeModal("outgoingModal"));
$("#outgoingFile").addEventListener("change", () => {
  const file = $("#outgoingFile").files[0];
  if (!file) { $("#outgoingSelectedFile").textContent = "Belum ada file dipilih."; return; }
  const allowed = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
  if (file.size > 10 * 1024 * 1024 || !allowed.test(file.name)) {
    showToast(file.size > 10 * 1024 * 1024 ? "Ukuran file maksimal 10 MB." : "Format file belum didukung.");
    $("#outgoingFile").value = "";
    $("#outgoingSelectedFile").textContent = "Belum ada file dipilih.";
    return;
  }
  $("#outgoingSelectedFile").textContent = `File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
});
$("#outgoingForm").addEventListener("submit", event => {
  event.preventDefault();
  const editId = $("#outgoingEditId").value;
  const existing = editId ? getOutgoing(editId) : null;
  const file = $("#outgoingFile").files[0];
  const item = {
    id: existing ? existing.id : nextOutgoingId++,
    no: existing ? existing.no : nextOutgoingNumber(),
    letterNumber: $("#outgoingLetterNumber").value.trim(),
    date: $("#outgoingDate").value,
    recipient: $("#outgoingRecipient").value.trim(),
    subject: $("#outgoingSubject").value.trim(),
    summary: $("#outgoingSummary").value.trim(),
    archiveCode: $("#outgoingArchiveCode").value.trim(),
    nature: $("#outgoingNature").value,
    status: $("#outgoingStatus").value,
    file: file || (existing ? existing.file : null),
    fileName: file ? file.name : (existing ? existing.fileName : "")
  };
  if (existing) {
    outgoingLetters[outgoingLetters.findIndex(x => x.id === existing.id)] = item;
  } else outgoingLetters.push(item);
  closeModal("outgoingModal");
  renderOutgoingTable();
  renderClassifications();
  addNotification(existing ? "Surat keluar diperbarui" : "Surat keluar baru tercatat", `${item.letterNumber} · ${item.subject}`, "Surat Keluar", "surat-keluar");
  showToast(existing ? "Surat keluar berhasil diperbarui." : "Surat keluar berhasil ditambahkan.");
});
function viewOutgoingFile(id) {
  const item = getOutgoing(id);
  if (!item) return;
  if (!item.file) { showToast("Belum ada file surat yang dilampirkan. Gunakan Edit untuk mengunggah file surat."); return; }
  const url = URL.createObjectURL(item.file);
  const ext = (item.fileName || item.file.name || "").split(".").pop().toLowerCase();
  if (["pdf", "jpg", "jpeg", "png"].includes(ext)) {
    const tab = window.open(url, "_blank");
    if (!tab) { URL.revokeObjectURL(url); showToast("Browser memblokir tab baru. Izinkan pop-up lalu coba lagi."); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    const a = document.createElement("a"); a.href = url; a.download = item.fileName || item.file.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function printUploadedDocument(file, fileName) {
  const ext = String(fileName).split(".").pop().toLowerCase();
  if (!["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    showToast("Format Word tidak bisa dicetak langsung oleh browser. File diunduh; buka di Word lalu tekan Ctrl+P.");
    return;
  }
  const url = URL.createObjectURL(file);
  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) {
    URL.revokeObjectURL(url);
    showToast("Izinkan pop-up browser agar dokumen dapat dicetak.");
    return;
  }
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const content = isImage
    ? `<img src="${url}" alt="Dokumen" style="max-width:100%;max-height:100%;object-fit:contain" onload="setTimeout(()=>window.print(),300)">`
    : `<iframe title="Dokumen untuk dicetak" src="${url}#toolbar=0&navpanes=0" style="border:0;width:100%;height:100vh" onload="setTimeout(()=>window.print(),800)"></iframe>`;
  w.document.open();
  w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Cetak ${escapeHTML(fileName)}</title><style>html,body{margin:0;padding:0;width:100%;height:100%;}body{display:flex;align-items:center;justify-content:center;}@media print{body{display:block}iframe{width:100%;height:100vh;border:0}}</style></head><body>${content}</body></html>`);
  w.document.close();
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
function printOutgoing(id) {
  const item = getOutgoing(id);
  if (!item) return;
  if (!item.file) {
    showToast("Belum ada file surat yang dapat dicetak. Unggah file surat melalui menu Edit.");
    return;
  }
  printUploadedDocument(item.file, item.fileName || item.file.name || "surat-keluar");
}
function deleteOutgoing(id) {
  const item = getOutgoing(id);
  if (!item) return;
  if (!confirm(`Hapus surat keluar "${item.letterNumber}"? Disposisi terkait juga akan dihapus.`)) return;
  outgoingLetters = outgoingLetters.filter(x => x.id !== item.id);
  renderOutgoingTable(); renderDispositionTable(); renderClassifications();
  showToast("Surat keluar dan disposisi terkait dihapus.");
}
$("#outgoingTableBody").addEventListener("click", event => {
  const btn = event.target.closest("[data-out-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id), item = getOutgoing(id);
  if (!item) return;
  if (btn.dataset.outAction === "edit") openOutgoingForm(id);
  if (btn.dataset.outAction === "delete") deleteOutgoing(id);
  if (btn.dataset.outAction === "view-file") viewOutgoingFile(id);
  if (btn.dataset.outAction === "download") {
    if (!item.file) showToast("Belum ada file surat yang dilampirkan. Gunakan Edit untuk mengunggah file surat.");
    else { downloadBlobFile(item.file, item.fileName || item.file.name || "surat-keluar"); showToast("Download surat berhasil dimulai."); }
  }
  if (btn.dataset.outAction === "print") printOutgoing(id);
});
$("#outgoingSearch").addEventListener("input", renderOutgoingTable);
$("#outgoingStatusFilter").addEventListener("change", renderOutgoingTable);
$("#outgoingNatureFilter").addEventListener("change", renderOutgoingTable);

function dispositionSheetHTML(d, autoPrint = false) {
  const l = getLetter(d.sourceId) || {};
  const code = d.natureCode || ({Penting:"P",Biasa:"B",Rahasia:"R"})[l.nature] || "B";
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${escapeHTML(window.location.href)}"><title>Lembar Disposisi - ${escapeHTML(d.letterNumber || "Surat")}</title><style>
    @page{size:A4;margin:18mm}body{font:12px Arial,sans-serif;color:#111;padding:0}
    table{border-collapse:collapse;width:100%}td,th{border:1px solid #222;padding:8px;vertical-align:top}
    .title{text-align:center;font-weight:bold;font-size:16px}.codes{text-align:right;font-weight:bold;letter-spacing:5px}
    .foot{text-align:center}.signature-cell{height:142px;border-top:0!important;text-align:center;vertical-align:top!important;padding-top:18px!important}
    .signature-title{margin-bottom:6px}.signature-image{display:block;width:150px;height:64px;object-fit:contain;margin:0 auto 2px}.signature-name{font-weight:bold;text-decoration:underline;margin-bottom:4px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><table>
    <tr><td colspan="2" class="title">LEMBAR DISPOSISI<div class="codes">${code==="P"?"Ⓟ":"P"}　${code==="B"?"B̲":"B"}　${code==="R"?"R̲":"R"}</div></td></tr>
    <tr><td>Perihal:<br>${escapeHTML(d.subject||l.subject||"")}</td><td>Tanggal Penyelesaian:<br>${escapeHTML(d.deadline||"")}</td></tr>
    <tr><td colspan="2">Tanggal Surat : ${escapeHTML(d.letterDate||l.letterDate||"")}<br><br>Nomor Surat : ${escapeHTML(d.letterNumber||l.letterNumber||"")}<br><br>Asal Surat : ${escapeHTML(d.sender||l.sender||"")}<br><br>Lampiran : ${escapeHTML(d.attachment||l.fileName||"-")}</td></tr>
    <tr><td colspan="2"><b>Instruksi:</b><br>${escapeHTML(d.instruction||"")}</td></tr>
    <tr><td colspan="2">Diteruskan:<br>${escapeHTML(d.assignedTo||"").replace(/\n/g,"<br>")}</td></tr>
    <tr><td colspan="2" class="foot">P = Penting,　 B = Biasa,　 R = Rahasia</td></tr>
    <tr><td colspan="2" class="signature-cell"><div class="signature-title">Direktur Utama</div><img class="signature-image" src="../assets/tanda-tangan-pimpinan.png" alt="Tanda tangan pimpinan" onerror="this.style.display='none'"><div class="signature-name">Akila Noviana Jufri, S.Tr.A.P.D</div><div>NIP. 45325001</div></td></tr>
  </table>${autoPrint?'<script>window.onload=()=>window.print()<\/script>':''}</body></html>`;
}
function printDispositionSheet(d) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Izinkan pop-up untuk mencetak lembar disposisi."); return; }
  w.document.open(); w.document.write(dispositionSheetHTML(d, true)); w.document.close();
}
function downloadDispositionSheet(d) {
  const html = dispositionSheetHTML(d, false);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const safeNumber = String(d.letterNumber || d.id || "disposisi").replace(/[^a-z0-9_-]+/gi, "_");
  downloadBlobFile(blob, `Lembar_Disposisi_${safeNumber}.html`);
  showToast("Lembar disposisi diunduh. Buka file HTML untuk melihat atau mencetaknya sebagai PDF.");
}
function renderDispositionTable() {
  const search = $("#dispositionSearch").value.trim().toLowerCase();
  const status = $("#dispositionStatusFilter").value;
  const rows = dispositions.filter(d => {
    const sourceLetter = getLetter(d.sourceId) || {};
    const combined = { ...sourceLetter, ...d };
    return matchesGlobalSearch(combined, search) && (!status || d.status === status);
  });
  $("#dispositionTableBody").innerHTML = rows.length ? rows.map((d, index) => `<tr>
    <td>${escapeHTML(index + 1)}</td>
    <td>${escapeHTML(d.letterNumber || "-")}</td>
    <td class="subject-cell"><strong>${escapeHTML(d.subject || "-")}</strong></td>
    <td>${escapeHTML(d.instruction || "Belum diisi pimpinan")}</td>
    <td>${escapeHTML(d.assignedTo || "Belum ditentukan")}</td>
    <td>${escapeHTML(d.deadline ? formatDate(d.deadline) : "Belum ditentukan")}</td>
    <td>${dispositionBadge(d.status)}</td>
    <td><div class="action-buttons">
      <button class="action-btn" data-disp-action="sheet" data-id="${d.id}">▤ Lihat Lembar Disposisi</button>
      <button class="action-btn" data-disp-action="download-sheet" data-id="${d.id}" title="Unduh lembar disposisi">↓ Download Lembar Disposisi</button>
      <button class="action-btn" data-disp-action="print" data-id="${d.id}">▣ Cetak</button>
      <button class="action-btn" data-disp-action="file" data-id="${d.id}">▧ Lihat File Surat</button>
      ${String(sessionStorage.getItem("siadRole") || "").toLowerCase() === "pimpinan" ? `<button class="action-btn" data-disp-action="update" data-id="${d.id}">✎ Tindak Lanjut</button>` : ""}
      ${["admin","sekretaris"].includes(String(sessionStorage.getItem("siadRole") || "").toLowerCase()) && String(d.requestedBy || "").toLowerCase() === String(sessionStorage.getItem("siadRole") || "").toLowerCase() && d.status === "Menunggu Arahan" ? `<button class="action-btn delete-action" data-disp-action="cancel" data-id="${d.id}">✕ Batalkan Pengajuan</button>` : ""}
    </div></td></tr>`).join("") : '<tr><td colspan="8" class="empty-row">Belum ada pengajuan disposisi. Surat yang diajukan Admin atau Sekretaris akan muncul di sini.</td></tr>';
  $("#dispositionResultCount").textContent = `Menampilkan ${rows.length} dari ${dispositions.length} disposisi`;
  $("#dispositionPendingCount").textContent = dispositions.filter(d => d.status === "Menunggu Arahan").length;
  $("#dispositionProcessCount").textContent = dispositions.filter(d => d.status === "Dalam Proses").length;
  $("#dispositionDoneCount").textContent = dispositions.filter(d => d.status === "Selesai").length;
  const badge = document.querySelector("#sidebarDispositionCount");
  if (badge) badge.textContent = dispositions.filter(d => d.status !== "Selesai").length;
  renderOutgoingTableStatsOnly();
}
function renderOutgoingTableStatsOnly() {
  $("#totalOutgoing").textContent = outgoingLetters.length;
  $("#pendingOutgoing").textContent = outgoingLetters.filter(item => item.status === "Draft").length;
  $("#sentOutgoing").textContent = outgoingLetters.filter(item => item.status === "Terkirim").length;
  const dash = document.querySelector("#dashboardOutgoing");
  if (dash) dash.textContent = outgoingLetters.length;
}
function openDispositionAction(id) {
  const d = getDisposition(id);
  if (!d) return;
  $("#dispositionActionId").value = d.id;
  $("#dispositionActionSubtitle").textContent = `${d.letterNumber} · ${d.subject}`;
  $("#dispositionActionStatus").value = d.status;
  $("#dispositionActionNote").value = d.note || "";
  openModal("dispositionActionModal");
}
$("#dispositionTableBody").addEventListener("click", event => {
  const btn = event.target.closest("[data-disp-action]");
  if (!btn) return;
  const d = getDisposition(btn.dataset.id);
  if (!d) return;
  if (btn.dataset.dispAction === "update") openDispositionAction(d.id);
  if (btn.dataset.dispAction === "cancel") {
    const role = String(sessionStorage.getItem("siadRole") || "").toLowerCase();
    if (!["admin", "sekretaris"].includes(role) || String(d.requestedBy || "").toLowerCase() !== role || d.status !== "Menunggu Arahan") {
      showToast("Pengajuan ini tidak dapat dibatalkan dari akun saat ini.");
      return;
    }
    if (!confirm(`Batalkan pengajuan disposisi untuk surat "${d.letterNumber}"?`)) return;
    dispositions = dispositions.filter(item => Number(item.id) !== Number(d.id));
    const linkedLetter = getLetter(d.sourceId);
    if (linkedLetter) linkedLetter.status = "Belum Didisposisi";
    renderDispositionTable();
    renderIncomingTable();
    saveSiadState();
    addNotification("Pengajuan disposisi dibatalkan", `${d.letterNumber} · Dibatalkan oleh ${role === "admin" ? "Admin" : "Sekretaris"}.`, "Disposisi", "disposisi");
    showToast("Pengajuan disposisi berhasil dibatalkan.");
    return;
  }
  if (btn.dataset.dispAction === "sheet") { const l=getLetter(d.sourceId); const sel=document.getElementById("dispositionSourceLetter"); if(sel){sel.innerHTML='<option value="">Pilih surat yang akan diajukan</option>'; incomingLetters.forEach(x=>{const o=document.createElement("option");o.value=x.id;o.textContent=`${x.letterNumber} · ${x.subject} · ${x.sender}`;sel.appendChild(o);}); sel.value=d.sourceId; document.getElementById("sheetSubject").value=d.subject||l?.subject||"";document.getElementById("sheetLetterDate").value=d.letterDate||l?.letterDate||"";document.getElementById("sheetLetterNumber").value=d.letterNumber||l?.letterNumber||"";document.getElementById("sheetSender").value=d.sender||l?.sender||"";document.getElementById("sheetAttachment").value=d.attachment||l?.fileName||"Tidak ada lampiran";document.getElementById("sheetDeadline").value=d.deadline||"";setSelectValueCompat(document.getElementById("sheetInstruction"), d.instruction||"");
setSelectValueCompat(document.getElementById("sheetAssignedTo"), d.assignedTo||"");document.getElementById("sheetNature").value=d.natureCode||({Penting:"P",Biasa:"B",Rahasia:"R"})[l?.nature]||"B";document.getElementById("dispositionSheetModal").classList.add("show");document.body.style.overflow="hidden"; }}
  if (btn.dataset.dispAction === "print") printDispositionSheet(d);
  if (btn.dataset.dispAction === "download-sheet") downloadDispositionSheet(d);
  if (btn.dataset.dispAction === "file") viewLetterFile(d.sourceId);
  if (btn.dataset.dispAction === "detail") alert(`Nomor surat: ${d.letterNumber}\nPerihal: ${d.subject}\nInstruksi: ${d.instruction || "Belum diisi"}\nDiteruskan: ${d.assignedTo || "Belum ditentukan"}\nTanggal penyelesaian: ${d.deadline ? formatDate(d.deadline) : "Belum ditentukan"}\nStatus: ${d.status}`);
});
$("#closeDispositionAction").addEventListener("click", () => closeModal("dispositionActionModal"));
$("#cancelDispositionAction").addEventListener("click", () => closeModal("dispositionActionModal"));
$("#dispositionActionForm").addEventListener("submit", event => {
  event.preventDefault();
  const d = getDisposition($("#dispositionActionId").value);
  if (!d) return;
  d.status = $("#dispositionActionStatus").value;
  d.note = $("#dispositionActionNote").value.trim();
  if (d.status === "Selesai") d.completedAt = todayISO();
  const letter = getLetter(d.sourceId);
  if (letter) letter.status = d.status === "Selesai" ? "Selesai" : d.status === "Dalam Proses" ? "Dalam Proses" : "Belum Didisposisi";
  closeModal("dispositionActionModal");
  renderDispositionTable(); renderOutgoingTable(); renderIncomingTable();
  addNotification("Status disposisi diperbarui", `${d.letterNumber} · Status: ${d.status}`, "Disposisi", "disposisi");
  showToast("Status disposisi berhasil diperbarui.");
});
$("#dispositionSearch").addEventListener("input", renderDispositionTable);
$("#dispositionStatusFilter").addEventListener("change", renderDispositionTable);

// =========================================
// KLASIFIKASI ARSIP, AKUN PENGGUNA, NOTIFIKASI
// =========================================
let classifications = [
  {
    "id": 1,
    "code": "100",
    "name": "BISNIS",
    "category": "100",
    "level": "root"
  },
  {
    "id": 2,
    "code": "110",
    "name": "PERKENALAN",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 3,
    "code": "110.1",
    "name": "Perkenalan Perusahaan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 4,
    "code": "110.2",
    "name": "Perkenalan Produk & Jasa",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 5,
    "code": "110.3",
    "name": "Profil & Company Profile",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 6,
    "code": "120",
    "name": "PERMINTAAN PENAWARAN",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 7,
    "code": "120.1",
    "name": "Permintaan Daftar Harga",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 8,
    "code": "120.2",
    "name": "Permintaan Katalog",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 9,
    "code": "120.3",
    "name": "Permintaan Sampel",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 10,
    "code": "120.4",
    "name": "Permintaan Informasi Produk",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 11,
    "code": "120.5",
    "name": "Permintaan Proposal",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 12,
    "code": "120.6",
    "name": "Permintaan Negosiasi",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 13,
    "code": "130",
    "name": "PENAWARAN",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 14,
    "code": "130.1",
    "name": "Penawaran Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 15,
    "code": "130.2",
    "name": "Penawaran Jasa",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 16,
    "code": "130.3",
    "name": "Penawaran Harga Khusus",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 17,
    "code": "130.4",
    "name": "Penawaran Diskon",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 18,
    "code": "130.5",
    "name": "Penawaran Kerja Sama",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 19,
    "code": "140",
    "name": "PESANAN",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 20,
    "code": "140.1",
    "name": "Pesanan Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 21,
    "code": "140.2",
    "name": "Pesanan Jasa",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 22,
    "code": "140.3",
    "name": "Konfirmasi Pesanan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 23,
    "code": "140.4",
    "name": "Perubahan Pesanan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 24,
    "code": "140.5",
    "name": "Pembatalan Pesanan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 25,
    "code": "150",
    "name": "PENGIRIMAN",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 26,
    "code": "150.1",
    "name": "Surat Jalan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 27,
    "code": "150.2",
    "name": "Pengiriman Pesanan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 28,
    "code": "150.3",
    "name": "Penjemputan Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 29,
    "code": "150.4",
    "name": "Pengantar Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 30,
    "code": "150.5",
    "name": "Keterlambatan Pengiriman",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 31,
    "code": "150.6",
    "name": "Retur Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 32,
    "code": "160",
    "name": "TAGIHAN",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 33,
    "code": "160.1",
    "name": "Invoice / Faktur",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 34,
    "code": "160.2",
    "name": "Penagihan Faktur",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 35,
    "code": "160.3",
    "name": "Pengingat Pembayaran",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 36,
    "code": "170",
    "name": "KLAIM",
    "category": "100",
    "level": "sub"
  },
  {
    "id": 37,
    "code": "170.1",
    "name": "Klaim Barang Rusak",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 38,
    "code": "170.2",
    "name": "Klaim Kekurangan Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 39,
    "code": "170.3",
    "name": "Komplain Pelayanan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 40,
    "code": "170.4",
    "name": "Balasan Klaim",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 41,
    "code": "170.5",
    "name": "Klaim Garansi",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 42,
    "code": "170.8",
    "name": "Klaim Keterlambatan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 43,
    "code": "170.9",
    "name": "Klaim Kehilangan Barang",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 44,
    "code": "170.10",
    "name": "Klaim Gangguan Layanan",
    "category": "100",
    "level": "leaf"
  },
  {
    "id": 45,
    "code": "200",
    "name": "KEPEGAWAIAN",
    "category": "200",
    "level": "root"
  },
  {
    "id": 46,
    "code": "210",
    "name": "Cuti",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 47,
    "code": "210.1",
    "name": "Cuti Tahunan",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 48,
    "code": "210.2",
    "name": "Cuti Sakit",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 49,
    "code": "210.3",
    "name": "Cuti Melahirkan",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 50,
    "code": "210.4",
    "name": "Cuti Besar",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 51,
    "code": "210.5",
    "name": "Cuti Alasan Penting",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 52,
    "code": "210.6",
    "name": "Cuti Tanpa Gaji",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 53,
    "code": "220",
    "name": "Pendidikan dan Pelatihan",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 54,
    "code": "220.1",
    "name": "Pelatihan Internal",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 55,
    "code": "220.2",
    "name": "Pelatihan Eksternal",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 56,
    "code": "220.3",
    "name": "Seminar/Workshop",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 57,
    "code": "220.4",
    "name": "Izin Belajar",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 58,
    "code": "230",
    "name": "Lamaran Kerja",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 59,
    "code": "230.1",
    "name": "Seleksi Administrasi",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 60,
    "code": "230.2",
    "name": "Panggilan Tes",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 61,
    "code": "230.3",
    "name": "Wawancara",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 62,
    "code": "230.4",
    "name": "Pengangkatan Karyawan",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 63,
    "code": "230.5",
    "name": "Kontrak Kerja",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 64,
    "code": "230.6",
    "name": "Penempatan Kerja",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 65,
    "code": "230.7",
    "name": "Mutasi",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 66,
    "code": "230.8",
    "name": "Promosi Jabatan",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 67,
    "code": "230.9",
    "name": "Demosi Jabatan",
    "category": "200",
    "level": "leaf"
  },
  {
    "id": 68,
    "code": "240",
    "name": "Surat Peringatan",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 69,
    "code": "250",
    "name": "Skorsing",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 70,
    "code": "260",
    "name": "Pengunduran Diri",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 71,
    "code": "270",
    "name": "Pemutusan Hubungan Kerja (PHK)",
    "category": "200",
    "level": "sub"
  },
  {
    "id": 72,
    "code": "300",
    "name": "KEUANGAN",
    "category": "300",
    "level": "root"
  },
  {
    "id": 73,
    "code": "310",
    "name": "Anggaran",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 74,
    "code": "310.1",
    "name": "Rencana Anggaran Biaya",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 75,
    "code": "310.2",
    "name": "Revisi Anggaran",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 76,
    "code": "320",
    "name": "Permintaan Dana",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 77,
    "code": "320.1",
    "name": "Pengajuan Dana",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 78,
    "code": "320.2",
    "name": "Persetujuan Dana",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 79,
    "code": "330",
    "name": "Laporan Keuangan",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 80,
    "code": "330.1",
    "name": "Laporan Kas",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 81,
    "code": "330.2",
    "name": "Laporan Neraca",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 82,
    "code": "330.3",
    "name": "Laporan Laba Rugi",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 83,
    "code": "340",
    "name": "Pembayaran",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 84,
    "code": "340.1",
    "name": "Transfer Dana",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 85,
    "code": "340.2",
    "name": "Bukti Pembayaran",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 86,
    "code": "350",
    "name": "Tagihan",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 87,
    "code": "350.1",
    "name": "Invoice",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 88,
    "code": "350.2",
    "name": "Penagihan Pembayaran",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 89,
    "code": "360",
    "name": "Pajak",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 90,
    "code": "360.1",
    "name": "Faktur Pajak",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 91,
    "code": "360.2",
    "name": "Laporan Pajak",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 92,
    "code": "370",
    "name": "Audit",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 93,
    "code": "370.1",
    "name": "Audit Internal",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 94,
    "code": "370.2",
    "name": "Audit Eksternal",
    "category": "300",
    "level": "leaf"
  },
  {
    "id": 95,
    "code": "380",
    "name": "Pertanggungjawaban Keuangan",
    "category": "300",
    "level": "sub"
  },
  {
    "id": 96,
    "code": "400",
    "name": "TRANSPORTASI",
    "category": "400",
    "level": "root"
  },
  {
    "id": 97,
    "code": "410",
    "name": "Transportasi Darat",
    "category": "400",
    "level": "sub"
  },
  {
    "id": 98,
    "code": "410.1",
    "name": "Kendaraan Motor",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 99,
    "code": "410.2",
    "name": "Kendaraan Mobil",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 100,
    "code": "410.3",
    "name": "Kendaraan Bus",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 101,
    "code": "420",
    "name": "Transportasi Laut",
    "category": "400",
    "level": "sub"
  },
  {
    "id": 102,
    "code": "420.1",
    "name": "Kapal Barang",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 103,
    "code": "420.2",
    "name": "Kapal Penumpang",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 104,
    "code": "430",
    "name": "Transportasi Udara",
    "category": "400",
    "level": "sub"
  },
  {
    "id": 105,
    "code": "430.1",
    "name": "Pesawat Penumpang",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 106,
    "code": "430.2",
    "name": "Pesawat Kargo",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 107,
    "code": "440",
    "name": "Surat Jalan",
    "category": "400",
    "level": "sub"
  },
  {
    "id": 108,
    "code": "440.1",
    "name": "Surat Jalan Barang",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 109,
    "code": "440.2",
    "name": "Surat Jalan Kendaraan",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 110,
    "code": "450",
    "name": "Perjalanan Dinas",
    "category": "400",
    "level": "sub"
  },
  {
    "id": 111,
    "code": "450.1",
    "name": "Tiket Perjalanan",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 112,
    "code": "450.2",
    "name": "Laporan Perjalanan Dinas",
    "category": "400",
    "level": "leaf"
  },
  {
    "id": 113,
    "code": "460",
    "name": "Izin Operasional Kendaraan",
    "category": "400",
    "level": "sub"
  },
  {
    "id": 114,
    "code": "500",
    "name": "SURAT DINAS & KETERANGAN",
    "category": "500",
    "level": "root"
  },
  {
    "id": 115,
    "code": "510",
    "name": "Surat Dinas Non-Pemerintah",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 116,
    "code": "510.1",
    "name": "Surat Dinas Internal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 117,
    "code": "510.2",
    "name": "Surat Dinas Eksternal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 118,
    "code": "510.3",
    "name": "Surat Undangan Dinas / Rapat",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 119,
    "code": "510.4",
    "name": "Surat Pemberitahuan Dinas",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 120,
    "code": "520",
    "name": "Surat Keterangan",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 121,
    "code": "520.1",
    "name": "Surat Keterangan Pribadi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 122,
    "code": "520.2",
    "name": "Surat Keterangan Perusahaan / Instansi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 123,
    "code": "520.3",
    "name": "Surat Keterangan Pendidikan / Pelatihan",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 124,
    "code": "530",
    "name": "SURAT KUASA & LEGAL",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 125,
    "code": "530.1",
    "name": "Surat Kuasa Internal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 126,
    "code": "530.2",
    "name": "Surat Kuasa Eksternal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 127,
    "code": "530.3",
    "name": "Surat Pernyataan",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 128,
    "code": "540",
    "name": "SURAT INTERNAL",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 129,
    "code": "540.1",
    "name": "Memo",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 130,
    "code": "540.2",
    "name": "Nota Dinas",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 131,
    "code": "540.3",
    "name": "Laporan Internal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 132,
    "code": "550",
    "name": "SURAT EKSTERNAL / ANTAR INDIVIDU",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 133,
    "code": "550.1",
    "name": "Surat Pengantar",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 134,
    "code": "550.2",
    "name": "Surat Referensi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 135,
    "code": "550.3",
    "name": "Surat Rekomendasi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 136,
    "code": "550.4",
    "name": "Surat Pernyataan Pribadi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 137,
    "code": "550.5",
    "name": "Surat Undangan Antar Individu",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 138,
    "code": "550.6",
    "name": "Surat Pengantar Dokumen",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 139,
    "code": "550.7",
    "name": "Surat Pengantar Barang",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 140,
    "code": "560",
    "name": "SURAT PENGUMUMAN & LIBURAN",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 141,
    "code": "560.1",
    "name": "Surat Pengumuman Internal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 142,
    "code": "560.2",
    "name": "Surat Pengumuman Eksternal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 143,
    "code": "560.3",
    "name": "Surat Pemberitahuan Libur Nasional",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 144,
    "code": "560.4",
    "name": "Surat Pemberitahuan Libur Perusahaan / Instansi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 145,
    "code": "560.5",
    "name": "Surat Pemberitahuan Kegiatan / Event",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 146,
    "code": "570",
    "name": "SURAT EDARAN",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 147,
    "code": "570.1",
    "name": "Surat Edaran Internal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 148,
    "code": "570.2",
    "name": "Surat Edaran Eksternal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 149,
    "code": "570.3",
    "name": "Surat Edaran Peraturan / Kebijakan",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 150,
    "code": "570.4",
    "name": "Surat Edaran Kegiatan / Program",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 151,
    "code": "580",
    "name": "SURAT PENGANTAR MAGANG / PRAKTIK KERJA",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 152,
    "code": "580.1",
    "name": "Surat Pengantar Magang Internal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 153,
    "code": "580.2",
    "name": "Surat Pengantar Magang Eksternal",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 154,
    "code": "580.3",
    "name": "Surat Pengantar Permohonan Kerja Sama Pendidikan",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 155,
    "code": "580.4",
    "name": "Surat Pengantar Penelitian / Observasi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 156,
    "code": "590",
    "name": "SURAT PERMOHONAN",
    "category": "500",
    "level": "sub"
  },
  {
    "id": 157,
    "code": "590.1",
    "name": "Surat Permohonan Izin",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 158,
    "code": "590.2",
    "name": "Surat Permohonan Kerja Sama",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 159,
    "code": "590.3",
    "name": "Surat Permohonan Bantuan / Sponsor",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 160,
    "code": "590.4",
    "name": "Surat Permohonan Informasi / Dokumen",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 161,
    "code": "590.5",
    "name": "Surat Permohonan Layanan / Administrasi",
    "category": "500",
    "level": "leaf"
  },
  {
    "id": 162,
    "code": "600",
    "name": "SURAT KEPUTUSAN",
    "category": "600",
    "level": "root"
  },
  {
    "id": 163,
    "code": "610",
    "name": "Internal / Eksternal / Kebijakan",
    "category": "600",
    "level": "sub"
  },
  {
    "id": 164,
    "code": "610.1",
    "name": "Surat Keputusan Internal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 165,
    "code": "610.2",
    "name": "Surat Keputusan Eksternal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 166,
    "code": "610.3",
    "name": "Surat Keputusan Peraturan / Kebijakan",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 167,
    "code": "610.4",
    "name": "Surat Keputusan Kenaikan Jabatan / Promosi",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 168,
    "code": "610.5",
    "name": "Surat Keputusan Sanksi / Disiplin",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 169,
    "code": "620",
    "name": "SURAT TUGAS",
    "category": "600",
    "level": "sub"
  },
  {
    "id": 170,
    "code": "620.1",
    "name": "Surat Tugas Internal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 171,
    "code": "620.2",
    "name": "Surat Tugas Eksternal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 172,
    "code": "620.3",
    "name": "Surat Tugas Kegiatan / Proyek",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 173,
    "code": "620.4",
    "name": "Surat Tugas Penugasan Khusus",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 174,
    "code": "630",
    "name": "PERINTAH / INSTRUKSI",
    "category": "600",
    "level": "sub"
  },
  {
    "id": 175,
    "code": "630.1",
    "name": "Instruksi Internal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 176,
    "code": "630.2",
    "name": "Instruksi Eksternal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 177,
    "code": "630.3",
    "name": "Instruksi Pelaksanaan Program / Kegiatan",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 178,
    "code": "630.4",
    "name": "Instruksi Darurat / Prioritas",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 179,
    "code": "640",
    "name": "SURAT PERJANJIAN",
    "category": "600",
    "level": "sub"
  },
  {
    "id": 180,
    "code": "640.1",
    "name": "Surat Perjanjian Internal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 181,
    "code": "640.2",
    "name": "Surat Perjanjian Eksternal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 182,
    "code": "640.3",
    "name": "Surat Perjanjian Kerja Sama / MoU",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 183,
    "code": "640.4",
    "name": "Surat Perjanjian Kontrak Proyek",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 184,
    "code": "640.5",
    "name": "Surat Perjanjian Kerja",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 185,
    "code": "650",
    "name": "BERITA ACARA",
    "category": "600",
    "level": "sub"
  },
  {
    "id": 186,
    "code": "650.1",
    "name": "Berita Acara Internal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 187,
    "code": "650.2",
    "name": "Berita Acara Eksternal",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 188,
    "code": "650.3",
    "name": "Berita Acara Kegiatan / Rapat",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 189,
    "code": "650.4",
    "name": "Berita Acara Serah Terima",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 190,
    "code": "650.5",
    "name": "Berita Acara Pemeriksaan / Audit",
    "category": "600",
    "level": "leaf"
  },
  {
    "id": 191,
    "code": "700",
    "name": "RAPAT DAN KEGIATAN",
    "category": "700",
    "level": "root"
  },
  {
    "id": 192,
    "code": "710",
    "name": "RAPAT",
    "category": "700",
    "level": "sub"
  },
  {
    "id": 193,
    "code": "710.1",
    "name": "Notulen Rapat",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 194,
    "code": "710.2",
    "name": "Daftar Hadir",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 195,
    "code": "710.3",
    "name": "Dokumentasi Rapat",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 196,
    "code": "710.4",
    "name": "Jadwal Rapat",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 197,
    "code": "720",
    "name": "SEMINAR DAN PELATIHAN",
    "category": "700",
    "level": "sub"
  },
  {
    "id": 198,
    "code": "720.1",
    "name": "Materi Seminar",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 199,
    "code": "720.2",
    "name": "Sertifikat",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 200,
    "code": "720.3",
    "name": "Absensi Peserta",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 201,
    "code": "720.4",
    "name": "Proposal Kegiatan",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 202,
    "code": "730",
    "name": "KEGIATAN KANTOR",
    "category": "700",
    "level": "sub"
  },
  {
    "id": 203,
    "code": "730.1",
    "name": "Studi Banding",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 204,
    "code": "730.2",
    "name": "Gathering",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 205,
    "code": "730.3",
    "name": "Bakti Sosial",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 206,
    "code": "730.4",
    "name": "Lomba",
    "category": "700",
    "level": "leaf"
  },
  {
    "id": 207,
    "code": "800",
    "name": "TEKNOLOGI INFORMASI",
    "category": "800",
    "level": "root"
  },
  {
    "id": 208,
    "code": "810",
    "name": "SISTEM INFORMASI",
    "category": "800",
    "level": "sub"
  },
  {
    "id": 209,
    "code": "810.1",
    "name": "Manual Sistem",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 210,
    "code": "810.2",
    "name": "Update Sistem",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 211,
    "code": "810.3",
    "name": "Hak Akses",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 212,
    "code": "810.4",
    "name": "Database Sistem",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 213,
    "code": "820",
    "name": "DATA DIGITAL",
    "category": "800",
    "level": "sub"
  },
  {
    "id": 214,
    "code": "820.1",
    "name": "Backup Data",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 215,
    "code": "820.2",
    "name": "Keamanan Data",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 216,
    "code": "820.3",
    "name": "Arsip Digital",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 217,
    "code": "820.4",
    "name": "Recovery Data",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 218,
    "code": "830",
    "name": "WEBSITE DAN MEDIA",
    "category": "800",
    "level": "sub"
  },
  {
    "id": 219,
    "code": "830.1",
    "name": "Domain",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 220,
    "code": "830.2",
    "name": "Hosting",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 221,
    "code": "830.3",
    "name": "Konten Website",
    "category": "800",
    "level": "leaf"
  },
  {
    "id": 222,
    "code": "830.4",
    "name": "Maintenance Website",
    "category": "800",
    "level": "leaf"
  }
];
let nextClassificationId = 223;
let users = [
  { id: 1, name: "Direktur Utama", username: "pimpinan", role: "Pimpinan", active: true },
  { id: 2, name: "Administrator SIAD", username: "admin", role: "Admin", active: true },
  { id: 4, name: "Sekretaris Pimpinan", username: "sekretaris", role: "Sekretaris", active: true }
];
let nextUserId = 5;
let notifications = [
  { id: 1, title: "Surat masuk baru tercatat", message: "Undangan Rapat Koordinasi dari Dinas Pendidikan menunggu arahan.", time: "17 Okt 2026", type: "Surat Masuk", read: false, page: "surat-masuk" },
  { id: 2, title: "Disposisi menunggu arahan", message: "Surat 005/SLN/X/2026 memerlukan tinjauan pimpinan.", time: "17 Okt 2026", type: "Disposisi", read: false, page: "disposisi" },
  { id: 3, title: "Surat keluar tersimpan", message: "Surat 003/SLN/X/2026 tercatat dengan status Terkirim.", time: "15 Okt 2026", type: "Surat Keluar", read: true, page: "surat-keluar" },
  { id: 4, title: "Pengingat tenggat disposisi", message: "Periksa tenggat tindak lanjut surat yang sedang diproses.", time: "14 Okt 2026", type: "Pengingat", read: false, page: "disposisi" }
];
let nextNotificationId = 5;

const expandedClassificationCodes = new Set();
function renderClassifications() {
  const q = $("#classificationSearch").value.trim().toLowerCase();
  const categoryFilter = $("#classificationCategoryFilter").value;
  const categoryNames = {"100":"BISNIS","200":"KEPEGAWAIAN","300":"KEUANGAN","400":"TRANSPORTASI","500":"SURAT DINAS & KETERANGAN","600":"SURAT KEPUTUSAN","700":"RAPAT DAN KEGIATAN","800":"TEKNOLOGI INFORMASI"};
  const matches = classifications.filter(c => (!categoryFilter || c.category === categoryFilter) && [c.code,c.name,categoryNames[c.category]].join(" ").toLowerCase().includes(q));
  const searching = Boolean(q || categoryFilter);
  const byCode = new Map(classifications.map(c => [c.code, c]));
  const parentOf = c => {
    if (c.level === "root") return null;
    if (c.level === "sub") return byCode.get(c.category) || null;
    // A rincian belongs to the closest matching subcategory, not always the root.
    const candidates = classifications.filter(x => x.level === "sub" && x.category === c.category && (c.code === x.code || c.code.startsWith(x.code + ".")));
    return candidates.sort((a,b) => b.code.length-a.code.length)[0] || byCode.get(c.category) || null;
  };
  const childrenOf = c => classifications.filter(x => parentOf(x)?.code === c.code);
  const visible = searching ? matches : classifications.filter(c => {
    let parent = parentOf(c);
    while (parent) {
      if (!expandedClassificationCodes.has(parent.code)) return false;
      parent = parentOf(parent);
    }
    return true;
  });
  const levelLabel = level => level === "root" ? "Kategori utama" : level === "sub" ? "Subkategori" : "Sub-subkategori";
  const indent = level => level === "root" ? "root" : level === "sub" ? "sub" : "leaf";
  const rows = visible.map((c,i) => {
    const canExpand = childrenOf(c).length > 0;
    const expanded = expandedClassificationCodes.has(c.code);
    const arrow = canExpand ? `<button type="button" class="classification-toggle" data-class-toggle="${escapeHTML(c.code)}" aria-expanded="${expanded}" aria-label="${expanded ? 'Tutup' : 'Buka'} subklasifikasi" title="${expanded ? 'Tutup' : 'Buka'} subklasifikasi">${expanded ? '▾' : '▸'}</button>` : '<span class="classification-toggle-placeholder" aria-hidden="true"></span>';
    const name = c.level === "root" ? `<strong>${escapeHTML(c.name)}</strong>` : `<span>${escapeHTML(c.name)}</span>`;
    return `<tr class="classification-${indent(c.level)}"><td>${i+1}</td><td><strong>${escapeHTML(c.code)}</strong></td><td><div class="classification-name-wrap level-${indent(c.level)}">${arrow}${name}</div></td><td>${levelLabel(c.level)}</td><td><div class="action-buttons"><button class="action-btn" data-class-action="edit" data-id="${c.id}">✎ Edit</button>${c.level === "root" ? "" : `<button class="action-btn delete-action" data-class-action="delete" data-id="${c.id}">× Hapus</button>`}</div></td></tr>`;
  }).join("");
  $("#classificationTableBody").innerHTML = rows || '<tr><td colspan="5" class="empty-row">Tidak ada klasifikasi yang cocok.</td></tr>';
  $("#classificationResultCount").textContent = searching ? `Menampilkan ${visible.length} klasifikasi hasil pencarian dari ${classifications.length}` : `Menampilkan ${visible.length} klasifikasi yang terbuka dari ${classifications.length}`;
  const select = $("#classificationCategoryFilter");
  if (select.options.length === 1) Object.entries(categoryNames).forEach(([code,name]) => select.add(new Option(`${code} · ${name}`,code)));
}
function resetClassificationForm() { $("#classificationForm").reset(); $("#classificationEditId").value = ""; $("#classificationSubmit").textContent = "＋ Tambah Kode"; $("#classificationCancel").hidden = true; }
$("#classificationForm").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#classificationEditId").value;
  const code = $("#classificationCode").value.trim().toUpperCase();
  const name = $("#classificationName").value.trim();
  const category = $("#classificationCategory").value;
  if (classifications.some(c => c.code.toLowerCase() === code.toLowerCase() && String(c.id) !== id)) { showToast("Kode klasifikasi sudah digunakan."); return; }
  const level = code.includes(".") ? "leaf" : (code.endsWith("00") ? "sub" : "leaf");
  if (id) Object.assign(classifications.find(c => c.id === Number(id)), {code,name,category,level});
  else classifications.push({id:nextClassificationId++,code,name,category,level});
  classifications.sort((a,b) => Number(a.code.replace(".",".")) - Number(b.code.replace(".",".")) || a.code.localeCompare(b.code));
  resetClassificationForm(); renderClassifications(); showToast("Data klasifikasi berhasil disimpan.");
});
$("#classificationCancel").addEventListener("click", resetClassificationForm);
$("#classificationSearch").addEventListener("input", renderClassifications);
$("#classificationCategoryFilter").addEventListener("change", renderClassifications);
$("#classificationTableBody").addEventListener("click", event => {
  const toggle = event.target.closest("[data-class-toggle]");
  if (toggle) {
    const code = toggle.dataset.classToggle;
    if (expandedClassificationCodes.has(code)) expandedClassificationCodes.delete(code);
    else expandedClassificationCodes.add(code);
    renderClassifications();
    return;
  }
  const btn = event.target.closest("[data-class-action]"); if (!btn) return;
  const item = classifications.find(x => x.id === Number(btn.dataset.id)); if (!item) return;
  if (btn.dataset.classAction === "edit") {
    $("#classificationEditId").value = item.id; $("#classificationCode").value = item.code; $("#classificationName").value = item.name; $("#classificationCategory").value = item.category;
    $("#classificationSubmit").textContent = "Simpan Perubahan"; $("#classificationCancel").hidden = false; $("#classificationCode").focus();
  } else if (btn.dataset.classAction === "delete") {
    const used = incomingLetters.some(x => x.archiveCode === item.code) || outgoingLetters.some(x => x.archiveCode === item.code);
    if (used) { showToast("Kode sedang digunakan surat dan tidak dapat dihapus."); return; }
    if (confirm(`Hapus klasifikasi ${item.code} - ${item.name}?`)) { classifications = classifications.filter(x => x.id !== item.id); renderClassifications(); showToast("Klasifikasi dihapus."); }
  }
});

function renderUsers() {
  const q = $("#userSearch").value.trim().toLowerCase();
  const rows = users.filter(u => [u.name, u.username, u.role, u.active ? "aktif" : "nonaktif"].join(" ").toLowerCase().includes(q));
  $("#userTableBody").innerHTML = rows.length ? rows.map((u, i) => `<tr><td>${i + 1}</td><td><strong>${escapeHTML(u.name)}</strong></td><td>${escapeHTML(u.username)}</td><td>${escapeHTML(u.role)}</td><td><span class="tag ${u.active ? "tag-done" : "tag-secret"}">${u.active ? "Aktif" : "Nonaktif"}</span></td><td><div class="action-buttons"><button class="action-btn" data-user-action="edit" data-id="${u.id}">✎ Edit</button><button class="action-btn" data-user-action="toggle" data-id="${u.id}">${u.active ? "Nonaktifkan" : "Aktifkan"}</button><button class="action-btn delete-action" data-user-action="delete" data-id="${u.id}">× Hapus</button></div></td></tr>`).join("") : '<tr><td colspan="6" class="empty-row">Tidak ada akun yang cocok.</td></tr>';
  $("#userTotal").textContent = users.length; $("#userActive").textContent = users.filter(u => u.active).length; $("#userInactive").textContent = users.filter(u => !u.active).length;
  $("#userResultCount").textContent = `Menampilkan ${rows.length} dari ${users.length} akun`;
}
function resetUserForm() { $("#userForm").reset(); $("#userEditId").value = ""; $("#userPassword").required = true; $("#userUsername").disabled = false; $("#userSubmit").textContent = "＋ Tambah Akun"; $("#userCancel").hidden = true; }
$("#userForm").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#userEditId").value; const name = $("#userName").value.trim(); const username = $("#userUsername").value.trim(); const role = $("#userRole").value; const password = $("#userPassword").value;
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase() && String(u.id) !== id)) { showToast("Username sudah digunakan."); return; }
  if (id) { const u = users.find(x => x.id === Number(id)); Object.assign(u, { name, username, role }); if (password) u.passwordDemo = password; }
  else users.push({ id: nextUserId++, name, username, role, active: true, passwordDemo: password });
  resetUserForm(); renderUsers(); showToast("Data akun berhasil disimpan.");
});
$("#userCancel").addEventListener("click", resetUserForm);
$("#userSearch").addEventListener("input", renderUsers);
$("#userTableBody").addEventListener("click", event => {
  const btn = event.target.closest("[data-user-action]"); if (!btn) return;
  const u = users.find(x => x.id === Number(btn.dataset.id)); if (!u) return;
  if (btn.dataset.userAction === "edit") { $("#userEditId").value = u.id; $("#userName").value = u.name; $("#userUsername").value = u.username; $("#userRole").value = u.role; $("#userPassword").value = ""; $("#userPassword").required = false; $("#userUsername").disabled = false; $("#userSubmit").textContent = "Simpan Perubahan"; $("#userCancel").hidden = false; $("#userName").focus(); }
  else if (btn.dataset.userAction === "toggle") { u.active = !u.active; renderUsers(); showToast(`Akun ${u.active ? "diaktifkan" : "dinonaktifkan"}.`); }
  else if (btn.dataset.userAction === "delete") { if (confirm(`Hapus akun ${u.username}?`)) { users = users.filter(x => x.id !== u.id); renderUsers(); showToast("Akun dihapus."); } }
});

function renderNotifications() {
  const filter = $("#notificationFilter").value;
  const rows = notifications.filter(n => !filter || (filter === "read" ? n.read : !n.read));
  $("#notificationList").innerHTML = rows.length ? rows.map(n => `<article class="notification-item ${n.read ? "is-read" : "is-unread"}"><div class="notification-symbol">${n.read ? "✓" : "♧"}</div><div class="notification-copy"><div class="notification-meta"><span>${escapeHTML(n.type)}</span><time>${escapeHTML(n.time)}</time></div><h3>${escapeHTML(n.title)}</h3><p>${escapeHTML(n.message)}</p></div><div class="notification-actions"><span class="tag ${n.read ? "tag-ordinary" : "tag-pending"}">${n.read ? "Sudah dibaca" : "Belum dibaca"}</span><button class="action-btn" data-notif-action="${n.read ? "open" : "read"}" data-id="${n.id}">${n.read ? "Buka" : "Tandai dibaca"}</button></div></article>`).join("") : '<div class="empty-row">Tidak ada notifikasi untuk filter ini.</div>';
  $("#notificationTotal").textContent = notifications.length; $("#notificationUnread").textContent = notifications.filter(n => !n.read).length; $("#notificationRead").textContent = notifications.filter(n => n.read).length; $("#notificationResultCount").textContent = `Menampilkan ${rows.length} notifikasi`;
  const unread = notifications.filter(n => !n.read).length;
  document.querySelectorAll(".notification-dot, .notification-button span").forEach(dot => { dot.style.display = unread ? "block" : "none"; });
}
$("#notificationFilter").addEventListener("change", renderNotifications);
$("#markAllNotifications").addEventListener("click", () => { notifications.forEach(n => n.read = true); renderNotifications(); showToast("Semua notifikasi ditandai sudah dibaca."); });
$("#clearReadNotifications").addEventListener("click", () => { const count = notifications.filter(n => n.read).length; if (!count) { showToast("Tidak ada notifikasi terbaca untuk dihapus."); return; } if (confirm(`Hapus ${count} notifikasi yang sudah dibaca?`)) { notifications = notifications.filter(n => !n.read); renderNotifications(); showToast("Notifikasi terbaca dihapus."); } });
$("#notificationList").addEventListener("click", event => { const btn = event.target.closest("[data-notif-action]"); if (!btn) return; const n = notifications.find(x => x.id === Number(btn.dataset.id)); if (!n) return; n.read = true; renderNotifications(); if (btn.dataset.notifAction === "open") showPage(n.page); else showToast("Notifikasi ditandai sudah dibaca."); });
function addNotification(title, message, type, page) { notifications.unshift({ id: nextNotificationId++, title, message, type, time: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }), read: false, page }); if (typeof renderNotifications === "function") renderNotifications(); }

// =========================================
// Integrasi demo dari beranda perusahaan
(function applyDemoSession() {
  const roleRaw = sessionStorage.getItem("siadRole") || "pimpinan";
  const roleMap = { pimpinan: "Pimpinan", admin: "Admin", sekretaris: "Sekretaris" };
  const roleKey = String(roleRaw).toLowerCase();
  const role = roleMap[roleKey] || (roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1));
  const username = sessionStorage.getItem("siadUsername") || "";
  const hint = username ? `Username: ${username}` : `Anda masuk sebagai ${role}`;
  const avatar = role.charAt(0).toUpperCase();
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  const roleIntro = {
    Pimpinan: "Pantau surat masuk, berikan arahan disposisi, dan tinjau tindak lanjut pekerjaan dalam satu dashboard.",
    Admin: "Kelola data persuratan, klasifikasi arsip, akun pengguna, dan notifikasi sistem.",
    Sekretaris: "Bantu mengelola agenda persuratan, menyiapkan dokumen, dan memantau tindak lanjut pimpinan."
  };
  setText("sidebarUserRole", role);
  setText("sidebarUserHint", hint);
  setText("logoutConfirmText", `Apakah kamu yakin ingin keluar dari area ${role}?`);
  setText("topUserRole", role);
  setText("topUserHint", `Area ${role}`);
  setText("dashboardEyebrow", `DASHBOARD ${role.toUpperCase()}`);
  setText("dashboardWelcome", `Selamat Datang, ${role}!`);
  const intro = document.getElementById("dashboardIntro");
  if (intro) intro.textContent = roleIntro[role] || `Anda masuk sebagai ${role}. Silakan gunakan menu yang tersedia sesuai tugas Anda.`;
  document.querySelectorAll(".user-card .avatar, .top-user .avatar").forEach(el => el.textContent = avatar);
})();

// =========================================
// HAK AKSES BERDASARKAN PERAN LOGIN
// =========================================
function applyRolePermissions() {
  const raw = String(sessionStorage.getItem("siadRole") || "pimpinan").toLowerCase();
  const role = raw === "admin" ? "Admin" : raw === "sekretaris" ? "Sekretaris" : "Pimpinan";
  const allowedPages = {
    Pimpinan: ["dashboard", "surat-masuk", "surat-keluar", "disposisi", "agenda", "notifikasi", "profil-pengguna"],
    Admin: ["dashboard", "surat-masuk", "surat-keluar", "disposisi", "klasifikasi", "agenda", "pengguna", "notifikasi", "profil-pengguna"],
    Sekretaris: ["dashboard", "surat-masuk", "surat-keluar", "disposisi", "klasifikasi", "agenda", "notifikasi", "profil-pengguna"]
  };
  const allowed = allowedPages[role] || allowedPages.Pimpinan;
  const canManageLetters = role === "Admin" || role === "Sekretaris";
  document.querySelectorAll(".nav-item[data-page], .dashboard-menu-card[data-page]").forEach(btn => { btn.hidden = !allowed.includes(btn.dataset.page); });
  ["openAddLetter", "openAddOutgoing"].forEach(id => { const el = document.getElementById(id); if (el) el.hidden = !canManageLetters; });
  if (!canManageLetters) document.querySelectorAll("#page-surat-masuk [data-action='edit'], #page-surat-masuk [data-action='delete'], #page-surat-keluar [data-action='edit'], #page-surat-keluar [data-action='delete'], #page-surat-masuk .edit-action, #page-surat-masuk .delete-action, #page-surat-keluar .edit-action, #page-surat-keluar .delete-action").forEach(el => el.hidden = true);
  // Admin hanya mengajukan disposisi; tindak lanjut hanya untuk Pimpinan.
  if (role === "Admin") document.querySelectorAll("#page-disposisi [data-disp-action='update'], #page-disposisi .disposition-action-form, #page-disposisi [data-role='follow-up']").forEach(el => el.hidden = true);
  if (role !== "Pimpinan") document.querySelectorAll("#page-disposisi [data-role='pimpinan-only']").forEach(el => el.hidden = true);
  document.querySelectorAll(".nav-item[data-page], .dashboard-menu-card[data-page]").forEach(btn => {
    if (btn.dataset.permissionBound === "1") return;
    btn.dataset.permissionBound = "1";
    btn.addEventListener("click", event => { if (!allowed.includes(btn.dataset.page)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  });
  const active = document.querySelector(".page-view.active");
  if (active && !allowed.includes(active.id.replace("page-", ""))) { document.querySelectorAll(".page-view").forEach(p => p.classList.remove("active")); const firstAllowed = document.getElementById("page-" + (allowed.includes("surat-masuk") ? "surat-masuk" : allowed[0])); if (firstAllowed) firstAllowed.classList.add("active"); }
  renderUserProfile(role);
}

const profileDefaults = {
  Pimpinan: {name:"Akila Noviana Jufri S.Tr.A.P.D", nip:"45325001", job:"Pimpinan", address:"Nyampa Desa Barombong Kecamatan Gantarang Kabupaten Bulukumba", phone:"087756814886", email:"akilanovianajufri@gmail.com"},
  Admin: {name:"Administrator SIAD", nip:"admin", job:"Admin", address:"Makassar, Sulawesi Selatan", phone:"08xxxxxxxxxx", email:"admin@lananusantara.co.id"},
  Sekretaris: {name:"Sekretaris Pimpinan", nip:"sekretaris", job:"Sekretaris", address:"Makassar, Sulawesi Selatan", phone:"08xxxxxxxxxx", email:"sekretaris@lananusantara.co.id"},
};
function currentProfileRole() { const r=String(sessionStorage.getItem("siadRole")||"pimpinan").toLowerCase(); return r==="admin"?"Admin":r==="sekretaris"?"Sekretaris":"Pimpinan"; }
function getProfileData(role=currentProfileRole()) {
  const key="siadProfile_"+role.toLowerCase(); let saved={}; try { saved=JSON.parse(localStorage.getItem(key)||"{}"); } catch(e) {}
  return {...(profileDefaults[role]||profileDefaults.Pimpinan),...saved};
}
function renderUserProfile(role=currentProfileRole()) {
  const host=document.getElementById("userProfileDetails"); if(!host) return;
  const d=getProfileData(role); const fields=[["Nama lengkap",d.name],["NIP / Username",d.nip],["Jabatan",d.job],["Alamat",d.address],["No. HP",d.phone],["Email",d.email]];
  host.innerHTML=fields.map(([label,value])=>`<article class="panel profile-info-card"><small>${escapeHTML(label)}</small><strong style="display:block;margin-top:7px;overflow-wrap:anywhere">${escapeHTML(value||"Belum diisi")}</strong></article>`).join("");
  const edit=document.getElementById("editUserProfileBtn"); if(edit) edit.hidden=false;
}
(function bindPersonalProfile(){
  const editBtn=document.getElementById("editUserProfileBtn"), editForm=document.getElementById("userProfileEditForm"), passBtn=document.getElementById("changeUserPasswordBtn"), passForm=document.getElementById("userPasswordForm");
  if(!editBtn||!editForm||!passBtn||!passForm) return;
  editBtn.addEventListener("click",()=>{const d=getProfileData(); ["name","nip","job","address","phone","email"].forEach((k,i)=>document.getElementById(["profileFullName","profileNip","profileJob","profileAddress","profilePhone","profileEmail"][i]).value=d[k]||""); editForm.hidden=false; passForm.hidden=true;});
  document.getElementById("cancelUserProfileEdit").addEventListener("click",()=>editForm.hidden=true);
  editForm.addEventListener("submit",e=>{e.preventDefault(); const d={name:document.getElementById("profileFullName").value.trim(),nip:document.getElementById("profileNip").value.trim(),job:document.getElementById("profileJob").value.trim(),address:document.getElementById("profileAddress").value.trim(),phone:document.getElementById("profilePhone").value.trim(),email:document.getElementById("profileEmail").value.trim()}; localStorage.setItem("siadProfile_"+currentProfileRole().toLowerCase(),JSON.stringify(d)); editForm.hidden=true; renderUserProfile(); showToast("Profil pengguna berhasil diperbarui.");});
  passBtn.addEventListener("click",()=>{passForm.hidden=false; editForm.hidden=true;});
  document.getElementById("cancelUserPassword").addEventListener("click",()=>passForm.hidden=true);
  passForm.addEventListener("submit",e=>{e.preventDefault();const a=document.getElementById("profileNewPassword").value,b=document.getElementById("profileConfirmPassword").value;if(a!==b){showToast("Konfirmasi password tidak sama.");return;}localStorage.setItem("siadPassword_"+currentProfileRole().toLowerCase(),a);passForm.reset();passForm.hidden=true;showToast("Password demo berhasil diperbarui pada browser ini.");});
})();
const profileShortcut=document.getElementById("openUserProfile");
if(profileShortcut) profileShortcut.addEventListener("click",()=>{const nav=document.querySelector(".nav-item[data-page=\"profil-pengguna\"]"); if(nav && !nav.hidden) nav.click(); else {document.querySelectorAll(".page-view").forEach(p=>p.classList.remove("active")); const page=document.getElementById("page-profil-pengguna"); if(page) page.classList.add("active"); renderUserProfile();}});
const profileNav=document.querySelector(".nav-item[data-page=\"profil-pengguna\"]"); if(profileNav) profileNav.addEventListener("click",()=>renderUserProfile());
applyRolePermissions();

// =========================================
// PENYIMPANAN PERMANEN LOKAL (IndexedDB)
// Data surat, PDF, klasifikasi, akun, disposisi, dan notifikasi disimpan
// pada browser yang digunakan. Tidak membutuhkan Node.js atau server.
// =========================================
const SIAD_DB_NAME = "SIAD_PT_LANA_NUSANTARA_DB";
const SIAD_DB_VERSION = 1;
let siadDb = null;
let saveTimer = null;

function openSiadDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Browser ini tidak mendukung IndexedDB."));
      return;
    }
    const request = indexedDB.open(SIAD_DB_NAME, SIAD_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("appState")) db.createObjectStore("appState");
    };
    request.onsuccess = () => { siadDb = request.result; resolve(siadDb); };
    request.onerror = () => reject(request.error || new Error("Database tidak dapat dibuka."));
  });
}

function currentSiadState() {
  return {
    incomingLetters, outgoingLetters, dispositions, classifications, users, notifications,
    nextId, nextOutgoingId, nextDispositionId, nextClassificationId, nextUserId, nextNotificationId,
    dispositionCleanupVersion: 1,
    savedAt: new Date().toISOString()
  };
}

function saveSiadState() {
  if (!siadDb) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const tx = siadDb.transaction("appState", "readwrite");
      tx.objectStore("appState").put(currentSiadState(), "main");
      tx.onerror = () => showToast("Penyimpanan lokal gagal. Ekspor cadangan jika data penting.");
    } catch (error) {
      console.error("Gagal menyimpan SIAD:", error);
      showToast("Data belum berhasil disimpan ke browser.");
    }
  }, 180);
}

function loadSiadState() {
  return new Promise((resolve, reject) => {
    const tx = siadDb.transaction("appState", "readonly");
    const request = tx.objectStore("appState").get("main");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Data tersimpan tidak dapat dibaca."));
  });
}

function applySiadState(state) {
  if (!state) return;
  if (Array.isArray(state.incomingLetters)) incomingLetters = state.incomingLetters;
  if (Array.isArray(state.outgoingLetters)) outgoingLetters = state.outgoingLetters;
  // Pembersihan satu kali untuk data disposisi lama. Penanda disimpan agar
  // pengajuan baru tidak ikut terhapus pada pembukaan aplikasi berikutnya.
  if (state.dispositionCleanupVersion === 1) {
    if (Array.isArray(state.dispositions)) dispositions = state.dispositions;
  } else {
    const oldDispositions = Array.isArray(state.dispositions) ? state.dispositions : [];
    oldDispositions.forEach(item => {
      const linkedLetter = incomingLetters.find(letter => String(letter.id) === String(item.sourceId));
      if (linkedLetter) linkedLetter.status = "Belum Didisposisi";
    });
    dispositions = [];
    nextDispositionId = 1;
  }
  if (Array.isArray(state.classifications)) classifications = state.classifications;
  if (Array.isArray(state.users)) users = state.users;
  if (Array.isArray(state.notifications)) notifications = state.notifications;
  ["nextId", "nextOutgoingId", "nextDispositionId", "nextClassificationId", "nextUserId", "nextNotificationId"].forEach(key => {
    if (Number.isFinite(state[key])) window[key] = state[key];
  });
  // Variabel top-level let tidak menjadi properti window, maka pulihkan satu per satu.
  if (Number.isFinite(state.nextId)) nextId = state.nextId;
  if (Number.isFinite(state.nextOutgoingId)) nextOutgoingId = state.nextOutgoingId;
  if (Number.isFinite(state.nextDispositionId)) nextDispositionId = state.nextDispositionId;
  if (Number.isFinite(state.nextClassificationId)) nextClassificationId = state.nextClassificationId;
  if (Number.isFinite(state.nextUserId)) nextUserId = state.nextUserId;
  if (Number.isFinite(state.nextNotificationId)) nextNotificationId = state.nextNotificationId;
}

function renderAllSiadData() {
  // First paint dibuat ringan agar dashboard segera tampil setelah login.
  setupDates();
  renderedSiadPages.clear();
  renderSiadPageIfNeeded("dashboard");
  // Data rinci dirender saat menu terkait dibuka. Tidak perlu membangun semua tabel.
}

async function initializeSiadStorage() {
  try {
    await openSiadDatabase();
    const saved = await loadSiadState();
    applySiadState(saved);
    renderAllSiadData();
    if (!saved || saved.dispositionCleanupVersion !== 1) saveSiadState();
  } catch (error) {
    console.error("IndexedDB SIAD tidak tersedia:", error);
    renderAllSiadData();
    showToast("Penyimpanan lokal tidak tersedia. Coba buka dengan Chrome atau Edge.");
  }
}

// Autosimpan setelah perubahan formulir/tombol. Penundaan singkat memberi
// kesempatan event handler halaman memperbarui array sebelum disimpan.
document.addEventListener("input", event => {
  if (event.target.closest("#letterForm, #outgoingForm, #classificationForm, #userForm")) saveSiadState();
});
document.addEventListener("change", event => {
  if (event.target.closest("#letterForm, #outgoingForm, #classificationForm, #userForm")) saveSiadState();
});
document.addEventListener("click", event => {
  if (event.target.closest("button, [data-page], a")) saveSiadState();
});
document.addEventListener("submit", () => saveSiadState(), true);
window.addEventListener("beforeunload", saveSiadState);


// CADANGAN PORTABEL: ekspor/impor data termasuk file lampiran untuk dipindahkan antar-laptop.
function blobToDataUrl(blob) {
  return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve({__siadBlob:true,type:blob.type||"application/octet-stream",dataUrl:reader.result}); reader.onerror=()=>reject(reader.error); reader.readAsDataURL(blob); });
}
async function encodeBackupValue(value) {
  if (value instanceof Blob) return await blobToDataUrl(value);
  if (Array.isArray(value)) return await Promise.all(value.map(encodeBackupValue));
  if (value && typeof value === "object") { const out={}; for (const [k,v] of Object.entries(value)) out[k]=await encodeBackupValue(v); return out; }
  return value;
}
async function decodeBackupValue(value) {
  if (Array.isArray(value)) return await Promise.all(value.map(decodeBackupValue));
  if (value && typeof value === "object") {
    if(value.__siadBlob && value.dataUrl){ const res=await fetch(value.dataUrl); return new Blob([await res.blob()],{type:value.type||"application/octet-stream"}); }
    const out={}; for(const [k,v] of Object.entries(value)) out[k]=await decodeBackupValue(v); return out;
  }
  return value;
}
async function readCurrentFullState() {
  if(!siadDb) await openSiadDatabase();
  const saved=await loadSiadState();
  return saved || currentSiadState();
}
const exportBackupBtn=document.getElementById("exportSiadBackup");
if(exportBackupBtn) exportBackupBtn.addEventListener("click",async()=>{
 const originalLabel=exportBackupBtn.textContent;
 exportBackupBtn.disabled=true;
 exportBackupBtn.textContent="Menyiapkan cadangan...";
 try {
  // Tunggu penyimpanan tertunda selesai, tetapi ambil state langsung dari memori
  // agar surat yang baru saja ditambahkan tidak tertinggal di IndexedDB.
  if(saveTimer){ clearTimeout(saveTimer); saveTimer=null; }
  if(!siadDb) await openSiadDatabase();
  await new Promise((resolve,reject)=>{
   try { const tx=siadDb.transaction("appState","readwrite"); tx.objectStore("appState").put(currentSiadState(),"main"); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error||new Error("Gagal menyimpan data sebelum ekspor.")); }
   catch(err){reject(err);}
  });
  const state=await loadSiadState();
  if(!state) throw new Error("Data SIAD belum tersedia untuk diekspor.");
  const portable=await encodeBackupValue(state);
  const blob=new Blob([JSON.stringify({format:"SIAD_PT_LANA_NUSANTARA_BACKUP",version:1,exportedAt:new Date().toISOString(),state:portable})],{type:"application/json;charset=utf-8"});
  const filename="Cadangan_SIAD_PT_LANA_NUSANTARA.json";
  // Pakai dialog simpan jika browser mendukungnya; jika tidak, pakai unduhan biasa.
  if(window.showSaveFilePicker){
   try { const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:"Cadangan SIAD (JSON)",accept:{"application/json":[".json"]}}]}); const writable=await handle.createWritable(); await writable.write(blob); await writable.close(); showToast("Cadangan berhasil disimpan."); return; }
   catch(err){ if(err && err.name==="AbortError") return; console.warn("Dialog simpan tidak tersedia, mencoba unduhan biasa:",err); }
  }
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.style.display="none"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  showToast("File cadangan disiapkan. Periksa folder Unduhan/Downloads atau izin unduhan browser.");
 } catch(e){ console.error("Ekspor cadangan SIAD gagal:",e); alert("Ekspor cadangan gagal: "+(e && e.message ? e.message : "kesalahan tidak diketahui")+". Coba buka SIAD dengan Chrome/Edge dan periksa izin unduhan."); }
 finally { exportBackupBtn.disabled=false; exportBackupBtn.textContent=originalLabel; }
});
const importBackupBtn=document.getElementById("importSiadBackup"), importBackupFile=document.getElementById("importSiadBackupFile");
if(importBackupBtn&&importBackupFile) {
 importBackupBtn.addEventListener("click",()=>importBackupFile.click());
 importBackupFile.addEventListener("change",async()=>{
  const file=importBackupFile.files&&importBackupFile.files[0]; if(!file)return;
  if(!confirm("Impor cadangan akan mengganti data SIAD di browser ini. Ekspor cadangan saat ini terlebih dahulu jika masih diperlukan. Lanjutkan?")){importBackupFile.value="";return;}
  try {
   const payload=JSON.parse(await file.text());
   if(payload.format!=="SIAD_PT_LANA_NUSANTARA_BACKUP"||!payload.state) throw new Error("Format cadangan tidak sesuai.");
   const state=await decodeBackupValue(payload.state);
   await openSiadDatabase();
   await new Promise((resolve,reject)=>{const tx=siadDb.transaction("appState","readwrite");tx.objectStore("appState").put(state,"main");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
   applySiadState(state); renderAllSiadData();
   ["surat-masuk","surat-keluar","disposisi","klasifikasi","pengguna","notifikasi"].forEach(p=>{renderedSiadPages.delete(p);renderSiadPageIfNeeded(p);});
   showToast("Cadangan berhasil dipulihkan. Data surat dan lampiran sudah dimuat di browser ini.");
  } catch(e){console.error(e);alert("Cadangan tidak dapat dipulihkan. Pastikan file JSON berasal dari Ekspor Cadangan SIAD.");}
  importBackupFile.value="";
 });
}


// JALANKAN SAAT HALAMAN DIBUKA
// =========================================
initializeSiadStorage();

// Terapkan ulang pembatasan aksi setelah tabel digambar ulang.
let roleObserverQueued = false;
const roleObserver = new MutationObserver(() => {
  // Satukan banyak perubahan DOM menjadi satu pemeriksaan per frame.
  if (roleObserverQueued) return;
  roleObserverQueued = true;
  requestAnimationFrame(() => {
    roleObserverQueued = false;
    applyRolePermissions();
    const role = (sessionStorage.getItem("siadRole") || "pimpinan").toLowerCase();
    if (role !== "admin" && role !== "sekretaris") {
      document.querySelectorAll("#page-surat-masuk .action-edit, #page-surat-masuk .action-delete, #page-surat-keluar .action-edit, #page-surat-keluar .action-delete, #page-surat-masuk [data-letter-action='edit'], #page-surat-masuk [data-letter-action='delete'], #page-surat-keluar [data-outgoing-action='edit'], #page-surat-keluar [data-outgoing-action='delete']").forEach(el => el.hidden = true);
    }
  });
});
roleObserver.observe(document.body, { childList: true, subtree: true });


// FORM LEMBAR DISPOSISI: data surat disalin otomatis, arahan diisi Pimpinan.
(function bindDispositionSheet(){
 const openBtn=document.getElementById('openApplyDisposition'), modal=document.getElementById('dispositionSheetModal'), form=document.getElementById('dispositionSheetForm'), select=document.getElementById('dispositionSourceLetter');
 if(!openBtn||!modal||!form||!select) return;
 function fillLetterOptions(){
  const previous=select.value; const existing=Array.from(select.options).slice(1).map(o=>o.value);
  incomingLetters.forEach(letter=>{if(!existing.includes(String(letter.id))){const o=document.createElement('option');o.value=letter.id;o.textContent=`${letter.letterNumber} · ${letter.subject} · ${letter.sender}`;select.appendChild(o);}});
  Array.from(select.options).slice(1).forEach(o=>{if(!incomingLetters.some(l=>String(l.id)===o.value))o.remove();});
  if(previous) select.value=previous;
 }
 function selectedLetter(){return incomingLetters.find(l=>String(l.id)===select.value)}
 function populate(){const l=selectedLetter(); document.getElementById('sheetSubject').value=l?.subject||'';document.getElementById('sheetLetterDate').value=l?.letterDate||'';document.getElementById('sheetLetterNumber').value=l?.letterNumber||'';document.getElementById('sheetSender').value=l?.sender||'';document.getElementById('sheetAttachment').value=l?.fileName||l?.attachment||'Tidak ada lampiran';document.getElementById('sheetNature').value=({Penting:'P',Biasa:'B',Rahasia:'R'})[l?.nature]||'B';}
 function close(){modal.classList.remove('show');document.body.style.overflow='';}
 openBtn.addEventListener('click',()=>{fillLetterOptions();form.reset();populate();modal.classList.add('show');document.body.style.overflow='hidden';});
 select.addEventListener('change',populate);
 document.getElementById('closeDispositionSheet').addEventListener('click',close);document.getElementById('cancelDispositionSheet').addEventListener('click',close);
 form.addEventListener('submit',e=>{e.preventDefault();const l=selectedLetter();if(!l){alert('Pilih surat masuk terlebih dahulu.');return;}const existing=dispositions.find(d=>Number(d.sourceId)===Number(l.id));
 const natureCode=document.getElementById('sheetNature').value;const instruction=document.getElementById('sheetInstruction').value.trim();const assigned=document.getElementById('sheetAssignedTo').value.trim();const deadline=document.getElementById('sheetDeadline').value;
 if(existing){existing.assignedTo=assigned;existing.instruction=instruction;existing.deadline=deadline;existing.natureCode=natureCode;existing.letterDate=l.letterDate;existing.sender=l.sender;existing.attachment=l.fileName||'';existing.subject=l.subject;existing.letterNumber=l.letterNumber;}else{dispositions.push({id:nextDispositionId++,sourceType:'Surat Masuk',sourceId:l.id,letterNumber:l.letterNumber,subject:l.subject,assignedTo:assigned,instruction,deadline,status:'Menunggu Arahan',note:'',natureCode,letterDate:l.letterDate,sender:l.sender,attachment:l.fileName||'',requestedBy:(sessionStorage.getItem('siadRole')||'admin').toLowerCase()==='sekretaris'?'Sekretaris':'Admin'});}
 l.status='Dalam Proses';close();renderDispositionTable();renderIncomingTable();saveSiadState();showToast('Pengajuan disposisi berhasil disimpan.');
 });
})();
