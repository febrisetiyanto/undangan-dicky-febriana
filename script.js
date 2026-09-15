// ============================================
//   UNDANGAN DIGITAL - JavaScript
//   Firebase loaded via CDN compat (no module)
// ============================================

// ===== COUNTDOWN TIMER =====
function updateCountdown() {
  const weddingDate = new Date('2026-10-06T08:00:00');
  const now  = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    const cdEl = document.getElementById('countdown');
    if (cdEl) {
      cdEl.innerHTML = '<p style="color:#f3dfb1;font-size:1.5rem;font-style:italic">Alhamdulillah, telah berlangsung 🎉</p>';
    }
    return;
  }

  const days    = Math.floor(diff / (1000*60*60*24));
  const hours   = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
  const seconds = Math.floor((diff % (1000*60)) / 1000);

  const dEl = document.getElementById('days');
  const hEl = document.getElementById('hours');
  const mEl = document.getElementById('minutes');
  const sEl = document.getElementById('seconds');

  if (dEl) dEl.textContent = String(days).padStart(2,'0');
  if (hEl) hEl.textContent = String(hours).padStart(2,'0');
  if (mEl) mEl.textContent = String(minutes).padStart(2,'0');
  if (sEl) sEl.textContent = String(seconds).padStart(2,'0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ===== NAMA TAMU DARI URL =====
function getGuestName() {
  const params = new URLSearchParams(window.location.search);
  return params.get('to') || params.get('nama') || '';
}

(function applyGuestName() {
  const name        = getGuestName();
  const coverEl     = document.getElementById('cover-guest-name');
  const bismillahEl = document.getElementById('bismillah-guest-name');
  const wrapEl      = document.getElementById('cover-guest-wrap');

  if (name && coverEl) {
    coverEl.textContent = name;
    if (wrapEl) wrapEl.classList.add('visible');
  } else {
    if (wrapEl) wrapEl.style.display = 'none';
  }
  if (bismillahEl) {
    bismillahEl.textContent = name ? name : 'Bapak/Ibu/Saudara/i';
  }
})();

// ===== BUKA UNDANGAN =====
function openInvitation() {
  const cover = document.getElementById('cover');
  const main  = document.getElementById('main-content');
  const music = document.getElementById('music-player');

  cover.classList.add('hide');

  setTimeout(function() {
    main.classList.remove('hidden');
    cover.style.display = 'none';

    setTimeout(function() {
      if (music) {
        music.style.display = 'flex';
      }
      autoPlayMusic();
    }, 800);

    initScrollReveal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadWishesRealtime();
  }, 800);
}

// ===== MUSIK PLAYER =====
var isPlaying = false;

function autoPlayMusic() {
  var audio = document.getElementById('bg-music');
  if (!audio) return;
  audio.volume = 0.4;
  audio.play()
    .then(function() {
      isPlaying = true;
      var btn = document.getElementById('music-btn');
      if (btn) btn.textContent = '🎵';
    })
    .catch(function() { isPlaying = false; });
}

function toggleMusic() {
  var audio = document.getElementById('bg-music');
  var btn   = document.getElementById('music-btn');
  if (!audio) return;
  if (isPlaying) {
    audio.pause();
    if (btn) btn.textContent = '🔇';
    isPlaying = false;
  } else {
    audio.play();
    if (btn) btn.textContent = '🎵';
    isPlaying = true;
  }
}

// ===== FORM UCAPAN =====
function submitWish(e) {
  e.preventDefault();

  var nameVal    = document.getElementById('wish-name').value.trim();
  var attendVal  = document.getElementById('wish-attend').value;
  var messageVal = document.getElementById('wish-message').value.trim();
  var btn        = document.querySelector('.submit-btn');

  if (!nameVal || !messageVal) {
    alert('Mohon isi nama dan ucapan terlebih dahulu.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Mengirim... ⏳';

  // Tunggu Firebase siap
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    btn.disabled    = false;
    btn.textContent = 'Firebase belum siap, coba lagi ❌';
    return;
  }

  var db = firebase.firestore();
  db.collection('wedding_wishes_dickyfebriana').add({
    name:    nameVal,
    attend:  attendVal,
    message: messageVal,
    time:    firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(function() {
    document.getElementById('wish-name').value    = '';
    document.getElementById('wish-attend').value  = '';
    document.getElementById('wish-message').value = '';
    btn.textContent = 'Terkirim ✅';
    setTimeout(function() {
      btn.disabled    = false;
      btn.textContent = 'Kirim Ucapan 💌';
    }, 2000);
    document.getElementById('wishes-list').scrollIntoView({ behavior:'smooth', block:'nearest' });
  })
  .catch(function(err) {
    console.error('Gagal kirim:', err);
    btn.disabled    = false;
    btn.textContent = 'Gagal, coba lagi ❌';
    setTimeout(function() { btn.textContent = 'Kirim Ucapan 💌'; }, 3000);
  });
}

// ===== LOAD UCAPAN REALTIME =====
function loadWishesRealtime() {
  var list = document.getElementById('wishes-list');
  if (!list) return;

  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    list.innerHTML = '<p class="wishes-error">Firebase tidak tersedia. Periksa koneksi.</p>';
    return;
  }

  list.innerHTML = '<div class="wishes-loading"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span><p>Memuat ucapan...</p></div>';

  var db = firebase.firestore();
  db.collection('wedding_wishes_dickyfebriana')
    .orderBy('time', 'desc')
    .onSnapshot(
      function(snapshot) {
        list.innerHTML = '';
        if (snapshot.empty) {
          list.innerHTML = '<p class="wishes-empty">Jadilah yang pertama mengirim ucapan 💌</p>';
          return;
        }
        snapshot.forEach(function(doc) {
          renderWish(Object.assign({ id: doc.id }, doc.data()));
        });
      },
      function(error) {
        console.error('Error:', error);
        if (error.code === 'permission-denied') {
          list.innerHTML = '<div class="wishes-error">⚠️ Akses ditolak. Pastikan Firestore Rules sudah diatur <code>allow read, write: if true;</code></div>';
        } else if (error.code === 'failed-precondition') {
          list.innerHTML = '<div class="wishes-error">⚠️ Index Firestore belum dibuat. Buka console browser → klik link error untuk buat index otomatis.</div>';
        } else {
          list.innerHTML = '<p class="wishes-error">Gagal memuat ucapan. Periksa koneksi internet.</p>';
        }
      }
    );
}

// ===== RENDER UCAPAN =====
function renderWish(wish) {
  var list    = document.getElementById('wishes-list');
  if (!list) return;
  var initial = wish.name ? wish.name.charAt(0).toUpperCase() : '?';

  var attendClass = '', attendText = '';
  if (wish.attend === 'hadir')  { attendClass = 'hadir'; attendText = '✅ Hadir'; }
  else if (wish.attend === 'tidak') { attendClass = 'tidak'; attendText = '❌ Tidak Hadir'; }
  else if (wish.attend === 'ragu')  { attendClass = 'ragu';  attendText = '🤔 Masih Ragu'; }

  var timeStr = '';
  if (wish.time && wish.time.toDate) {
    var d = wish.time.toDate();
    timeStr = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  }

  var item = document.createElement('div');
  item.className = 'wish-item';
  item.innerHTML =
    '<div class="wish-avatar">' + initial + '</div>' +
    '<div class="wish-content">' +
      '<div class="wish-header">' +
        '<strong>' + escapeHtml(wish.name) + '</strong>' +
        (wish.attend ? '<span class="wish-attend ' + attendClass + '">' + attendText + '</span>' : '') +
      '</div>' +
      '<p>' + escapeHtml(wish.message) + '</p>' +
      (timeStr ? '<span class="wish-time">' + timeStr + '</span>' : '') +
    '</div>';

  list.appendChild(item);

  item.style.opacity   = '0';
  item.style.transform = 'translateY(20px)';
  requestAnimationFrame(function() {
    item.style.transition = 'opacity .4s, transform .4s';
    item.style.opacity    = '1';
    item.style.transform  = 'translateY(0)';
  });
}

function escapeHtml(text) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(text));
  return d.innerHTML;
}

// ===== GIFT TABS =====
function switchGiftTab(tab, btn) {
  document.querySelectorAll('.gift-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.gift-panel').forEach(function(p) { p.classList.add('hidden'); });
  btn.classList.add('active');
  document.getElementById('panel-' + tab).classList.remove('hidden');
}

// ===== COPY REKENING =====
function copyRek(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(function() {
    var span = btn.querySelector('span');
    span.textContent = '✅ Tersalin!';
    btn.classList.add('copied');
    setTimeout(function() { span.textContent = '📋 Salin Nomor'; btn.classList.remove('copied'); }, 2000);
  });
}

// ===== COPY ALAMAT =====
function copyAlamat(btn) {
  var alamat = 'Dicky Wijanarko\nJatirejo, Genengan, Jumantono,\nKaranganyar, Jawa Tengah\nKode Pos: 57782';
  navigator.clipboard.writeText(alamat).then(function() {
    var span = btn.querySelector('span');
    span.textContent = '✅ Tersalin!';
    btn.classList.add('copied');
    setTimeout(function() { span.textContent = '📋 Salin Alamat'; btn.classList.remove('copied'); }, 2000);
  });
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  var sections = document.querySelectorAll('.section');
  sections.forEach(function(s) { s.classList.add('reveal'); });

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  sections.forEach(function(s) { observer.observe(s); });
}

// ===== UPLOAD BUKTI TRANSFER =====
var buktiFile = null;

function previewBukti(input) {
  var file = input.files[0];
  if (!file) return;
  buktiFile = file;

  var reader = new FileReader();
  reader.onload = function(e) {
    var preview = document.getElementById('bukti-preview');
    var placeholder = document.getElementById('upload-placeholder');
    var actions = document.getElementById('upload-actions');

    preview.src = e.target.result;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';
    actions.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function kirimBuktiWA() {
  var nama = document.getElementById('upload-nama').value.trim();
  var noWA = '6285655436179'; // Nomor WA penerima (DANA - Febri)

  // Buat pesan teks
  var pesan = '💍 *Bukti Transfer Hadiah Pernikahan*\n\n';
  pesan += '*Dicky & Febriana*\n';
  pesan += '━━━━━━━━━━━━━━━\n';
  if (nama) pesan += '👤 Pengirim: ' + nama + '\n';
  pesan += '📎 Bukti transfer terlampir di bawah ini 👇';

  // Buka WhatsApp dengan pesan, lalu user lampirkan gambar manual
  // (WA Web/App tidak bisa attach file langsung dari link, kita share dulu teks, lalu instruksi)
  var waUrl = 'https://wa.me/' + noWA + '?text=' + encodeURIComponent(pesan);

  // Share file gambar via Web Share API jika tersedia
  if (navigator.share && buktiFile) {
    navigator.share({
      title: 'Bukti Transfer - Pernikahan Dicky & Febriana',
      text: pesan,
      files: [buktiFile]
    }).catch(function(err) {
      // Fallback ke WA link jika share gagal
      window.open(waUrl, '_blank');
    });
  } else {
    // Fallback: buka WA langsung
    window.open(waUrl, '_blank');
    // Instruksi tambahan
    setTimeout(function() {
      alert('WhatsApp sudah terbuka 📲\n\nSilakan lampirkan foto bukti transfer secara manual setelah pesan terkirim.');
    }, 600);
  }
}

function resetUpload() {
  buktiFile = null;
  var input = document.getElementById('bukti-input');
  input.value = '';

  document.getElementById('bukti-preview').classList.add('hidden');
  document.getElementById('upload-placeholder').style.display = '';
  document.getElementById('upload-actions').classList.add('hidden');
  document.getElementById('upload-nama').value = '';
}

// ===== LINK GENERATOR =====
function generateLink() {
  var input = document.getElementById('gen-name');
  if (!input) return;
  var name = input.value.trim();
  if (!name) { input.focus(); return; }

  var base    = window.location.href.split('?')[0];
  var encoded = encodeURIComponent(name);
  var link    = base + '?to=' + encoded;

  document.getElementById('link-url').textContent = link;

  var msg   = "Assalamu'alaikum, " + name + " 🌸\n\nBersama ini kami mengundang Anda untuk hadir di pernikahan kami 💍\n\nSilakan buka undangan digital kami di:\n" + link + "\n\nAtas kehadiran dan doa restunya, kami ucapkan terima kasih 🙏";
  var waUrl = 'https://wa.me/?text=' + encodeURIComponent(msg);
  document.getElementById('wa-btn').href = waUrl;

  var resultEl = document.getElementById('link-result');
  resultEl.classList.remove('hidden');
  resultEl.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function copyLink(btn) {
  var link = document.getElementById('link-url').textContent;
  navigator.clipboard.writeText(link).then(function() {
    var span = btn.querySelector('span');
    span.textContent = '✅ Tersalin!';
    btn.classList.add('copied');
    setTimeout(function() { span.textContent = '📋 Salin Link'; btn.classList.remove('copied'); }, 2000);
  });
}