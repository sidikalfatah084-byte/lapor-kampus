const defaultReports = () => [];
let reports = load('laporkampus-reports', defaultReports()).filter(r => !['LP-2401', 'LP-2398', 'LP-2392', 'LP-2387', 'LP-2379', 'LP-2375'].includes(r.id)), users = load('laporkampus-users', () => []), role = 'mahasiswa', currentUser = null, page = 'dashboard', listFilter = '', searchTerm = '';
function load(key, fallback) {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v ?? (typeof fallback === 'function' ? fallback() : fallback);
    }
    catch {
        return typeof fallback === 'function' ? fallback() : fallback;
    }
}
function save() {
    localStorage.setItem('laporkampus-reports', JSON.stringify(reports));
    renderNotificationButton();
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const notificationButton = document.querySelector('.icon-action');
notificationButton.id = 'notification-button';
notificationButton.setAttribute('aria-label', 'Buka notifikasi');
notificationButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><i id="notification-dot"></i>';
const notificationPanel = document.createElement('section');
notificationPanel.className = 'notification-panel hidden';
notificationPanel.id = 'notification-panel';
notificationButton.after(notificationPanel);
function notificationItems() {
    if (!currentUser)
        return [];
    const list = role === 'admin' ? reports.filter(r => r.status === 'Menunggu').map(r => ({
        report: r, title: 'Laporan baru dari ' + r.name, detail: r.title, token: 'new:' + r.id, owner: r.owner
    })) : reports.filter(r => r.owner === studentId() && ['Diproses', 'Selesai', 'Ditolak'].includes(r.status)).map(r => ({
        report: r, title: 'Status laporan diperbarui', detail: `${r.title} · ${r.status}`, token: `status:${r.id}:${r.status}:${r.updatedAt || r.date}`, owner: r.owner
    }));
    return list.slice().reverse();
}
function notificationReadSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem(`laporkampus-notifications-read:${role}:${currentUser?.identity || ''}`)) || []);
    }
    catch {
        return new Set();
    }
}
function renderNotificationButton() {
    if (!currentUser)
        return;
    const items = notificationItems(), read = notificationReadSet(), unread = items.filter(n => !read.has(n.token)).length;
    notificationButton.setAttribute('aria-label', `Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`);
    notificationButton.querySelector('#notification-dot')?.classList.toggle('visible', unread > 0);
    notificationPanel.innerHTML = `<div class="notification-head"><strong>Notifikasi</strong><span>${unread ? `${unread} baru` : 'Terbaru'}</span></div>${items.length ? items.map(n => `<button class="notification-item ${read.has(n.token) ? 'read' : ''}" data-notification-report="${esc(n.report.id)}" data-notification-owner="${esc(n.owner)}"><span class="notification-mark">${role === 'admin' ? '!' : '↗'}</span><span><b>${esc(n.title)}</b><small>${esc(n.detail)}</small><small>${esc(n.report.updatedAt ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium', timeStyle: 'short'
    }).format(new Date(n.report.updatedAt)) : n.report.date)}</small></span></button>`).join('') : '<div class="notification-empty">Belum ada notifikasi.</div>'}`;
}
notificationButton.addEventListener('click', () => {
    const opening = notificationPanel.classList.contains('hidden');
    notificationPanel.classList.toggle('hidden', !opening);
    if (opening && currentUser) {
        const read = notificationReadSet();
        notificationItems().forEach(n => read.add(n.token));
        localStorage.setItem(`laporkampus-notifications-read:${role}:${currentUser.identity}`, JSON.stringify([...read]));
        renderNotificationButton();
    }
});
const studentNav = [['dashboard', '▦', 'Ringkasan'], ['new', '＋', 'Buat laporan'], ['mine', '▤', 'Laporan saya'], ['guide', 'ⓘ', 'Panduan pelaporan'], ['profile', '♙', 'Profil saya']];
const adminNav = [['dashboard', '▦', 'Ringkasan'], ['all', '▤', 'Semua laporan'], ['categories', '▧', 'Kategori fasilitas'], ['students', '♙', 'Data pelapor'], ['guide', 'ⓘ', 'Panduan pelaporan']];
const studentId = () => currentUser?.identity || '';
function setRole(next) {
    role = next;
    document.querySelectorAll('.role-tab').forEach(b => b.classList.toggle('active', b.dataset.role === role));
    const label = document.querySelector('#identity-label');
    label.childNodes[0].textContent = role === 'admin' ? 'Email admin' : 'NIM';
    document.querySelector('[name="identity"]').placeholder = role === 'admin' ? 'admin@kampus.ac.id' : 'Contoh: 23101234';
    document.querySelector('#demo-hint').textContent = role === 'admin' ? 'Admin demo · kata sandi: demo' : 'Daftar terlebih dahulu untuk membuat akun mahasiswa';
}
document.querySelectorAll('.role-tab').forEach(b => b.addEventListener('click', () => setRole(b.dataset.role)));
setRole('mahasiswa');
const loginForm = document.querySelector('#login-form');
const signupLink = document.createElement('button');
signupLink.type = 'button';
signupLink.className = 'auth-switch';
signupLink.innerHTML = 'Belum punya akun? <b>Daftar sebagai mahasiswa</b>';
loginForm.after(signupLink);
const signupDialog = document.createElement('dialog');
signupDialog.id = 'signup-dialog';
signupDialog.innerHTML = '<form id="signup-form"><div class="dialog-head"><div><p class="eyebrow">AKUN BARU</p><h2>Daftar mahasiswa</h2></div><button type="button" class="close-dialog" id="signup-close">×</button></div><label>Nama lengkap<input name="name" required minlength="3" placeholder="Masukkan nama sesuai identitas"></label><label>NIM<input name="identity" required minlength="5" placeholder="Contoh: 23101234"></label><label>Kata sandi<input name="password" type="password" required minlength="4" placeholder="Minimal 4 karakter"></label><label>Ulangi kata sandi<input name="confirm" type="password" required minlength="4" placeholder="Ketik ulang kata sandi"></label><button class="btn-primary full" type="submit">Buat akun <span>→</span></button></form>';
document.body.append(signupDialog);
signupLink.addEventListener('click', () => signupDialog.showModal());
document.querySelector('#signup-close').addEventListener('click', () => signupDialog.close());
document.querySelector('#signup-form').addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(e.currentTarget), name = d.get('name').trim(), identity = d.get('identity').trim(), password = d.get('password');
    if (role !== 'mahasiswa') {
        toast('Pendaftaran hanya tersedia untuk mahasiswa');
        return;
    }
    if (password !== d.get('confirm')) {
        toast('Konfirmasi kata sandi belum cocok');
        return;
    }
    if (users.some(u => u.identity.toLowerCase() === identity.toLowerCase())) {
        toast('NIM tersebut sudah terdaftar');
        return;
    }
    users.push({
        name, identity, password
    });
    localStorage.setItem('laporkampus-users', JSON.stringify(users));
    e.currentTarget.reset();
    signupDialog.close();
    document.querySelector('[name="identity"]').value = identity;
    document.querySelector('[name="password"]').value = '';
    toast('Akun berhasil dibuat. Silakan masuk');
});
function updateAvatarElements() {
    [document.querySelector('#avatar'), document.querySelector('#top-avatar')].forEach(el => {
        if (currentUser?.photoData)
            el.innerHTML = `<img src="${currentUser.photoData}" alt="Foto profil">`;
        else
            el.textContent = (currentUser?.name?.[0] || '?').toUpperCase();
    });
}
document.querySelector('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget), identity = fd.get('identity').trim(), password = fd.get('password');
    if (role === 'admin') {
        if (password !== 'demo') {
            toast('Kata sandi admin demo adalah demo');
            return;
        }
        currentUser = {
            identity, name: 'Admin Kampus'
        };
    }
    else {
        const account = users.find(u => u.identity.toLowerCase() === identity.toLowerCase() && u.password === password);
        if (!account) {
            toast('Akun tidak ditemukan atau kata sandi salah');
            return;
        }
        currentUser = {
            identity: account.identity, name: account.name, photoData: account.photoData || ''
        };
    }
    document.querySelector('#login-screen').classList.add('hidden');
    document.querySelector('#app-shell').classList.remove('hidden');
    document.querySelector('#user-name').textContent = currentUser.name;
    document.querySelector('#user-role').textContent = role === 'admin' ? 'Administrator' : 'Mahasiswa · ' + currentUser.identity;
    updateAvatarElements();
    document.querySelector('#today').textContent = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    renderNav();
    go('dashboard');
});
document.querySelector('#logout').addEventListener('click', () => {
    currentUser = null;
    document.querySelector('#app-shell').classList.add('hidden');
    document.querySelector('#login-screen').classList.remove('hidden');
    document.querySelector('#login-form').reset();
});
function renderNav() {
    let nav = role === 'admin' ? adminNav : studentNav;
    document.querySelector('#main-nav').innerHTML = nav.map(([key, icon, label]) => `<a class="nav-item" data-page="${key}"><span class="nav-icon">${icon}</span>${label}${key === 'mine' && pendingMine() ? '<span class="nav-badge">' + pendingMine() + '</span>' : ''}</a>`).join('');
    document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => {
        go(el.dataset.page);
        document.querySelector('.sidebar').classList.remove('open');
    }));
    const openProfile = () => {
        go('profile');
        document.querySelector('.sidebar').classList.remove('open');
    };
    document.querySelector('.more-button').onclick = openProfile;
    const profileTargets = [document.querySelector('.user-card'), document.querySelector('.top-avatar')];
    profileTargets.forEach(el => {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Buka profil saya');
        el.onclick = openProfile;
        el.onkeydown = e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProfile();
            }
        };
    });
    renderNotificationButton();
}
function go(next) {
    page = next;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === next));
    const names = {
        dashboard: 'Ringkasan', new: 'Buat laporan', mine: 'Laporan saya', all: 'Semua laporan', categories: 'Kategori fasilitas', students: 'Data pelapor', guide: 'Panduan pelaporan', profile: 'Profil saya'
    };
    document.querySelector('#page-crumb').textContent = names[next] || 'Ringkasan';
    renderPage();
}
function setTitle(title, subtitle, action = '') {
    document.querySelector('#page-title').innerHTML = `<div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="title-actions">${action}</div>` : ''}`;
}
function buttonNew() {
    return '<button class="btn-primary" data-new-report>＋ Buat laporan</button>';
}
function myReports() {
    return reports.filter(r => role === 'admin' || r.owner === studentId());
}
function pendingMine() {
    return reports.filter(r => r.owner === studentId() && r.status === 'Menunggu').length;
}
function stat(label, num, foot, icon) {
    return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-num">${num}</div><div class="stat-foot">${foot}</div></div>`;
}
function statusClass(s) {
    return s.toLowerCase();
}
function tableRows(items, admin = false, canDelete = false) {
    return items.length ? items.map(r => `<tr><td>${esc(r.title)}<div class="report-id">${esc(r.id)} · ${esc(r.category)}</div></td>${admin ? `<td>${esc(r.name)}</td>` : ''}<td>${esc(r.location)}</td><td>${esc(r.date)}</td><td><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span></td><td><span class="priority ${esc(r.priority)}">${esc(r.priority)}</span></td><td><button class="table-action" data-detail="${esc(r.id)}">Detail ↗</button>${admin || canDelete ? ` <button class="table-action delete-action" data-delete-report="${esc(r.id)}">Hapus</button>` : ''}</td></tr>`).join('') : `<tr><td colspan="${admin ? 7 : 6}" class="empty-state">Belum ada laporan yang cocok.</td></tr>`;
}
function table(items, admin = false, canDelete = false) {
    return `<div class="panel"><div class="table-wrap"><table><thead><tr><th>JUDUL LAPORAN</th>${admin ? '<th>PELAPOR</th>' : ''}<th>LOKASI</th><th>TANGGAL</th><th>STATUS</th><th>URGENSI</th><th></th></tr></thead><tbody>${tableRows(items, admin, canDelete)}</tbody></table></div></div>`;
}
function recentPanel(items, admin = false) {
    return `<div class="panel"><div class="panel-head"><div><h3>${admin ? 'Laporan terbaru' : 'Laporan terakhir'}</h3><p>Pantau laporan yang baru masuk</p></div><button class="link-button" data-goto="${admin ? 'all' : 'mine'}">Lihat semua →</button></div><div class="table-wrap"><table><thead><tr><th>JUDUL LAPORAN</th>${admin ? '<th>PELAPOR</th>' : ''}<th>LOKASI</th><th>TANGGAL</th><th>STATUS</th><th>URGENSI</th><th></th></tr></thead><tbody>${tableRows(items.slice().reverse().slice(0, 4), admin)}</tbody></table></div></div>`;
}
function dashboard() {
    const items = myReports(), all = reports, wait = all.filter(r => r.status === 'Menunggu').length, progress = all.filter(r => r.status === 'Diproses').length, done = all.filter(r => r.status === 'Selesai').length;
    const welcome = role === 'admin' ? `<div class="welcome-banner"><div><p class="eyebrow">PANEL PENGELOLA</p><h2>Selamat datang, Admin Kampus</h2><p>Kelola laporan fasilitas dan bantu kampus menjadi lebih nyaman.</p></div></div>` : `<div class="welcome-banner"><div><p class="eyebrow">PORTAL PELAPORAN FASILITAS</p><h2>Halo, ${esc(currentUser.name)} 👋</h2><p>Ada fasilitas kampus yang perlu diperbaiki? Sampaikan laporanmu di sini.</p></div>${buttonNew()}</div>`;
    setTitle(role === 'admin' ? 'Ringkasan pengelola' : 'Ringkasan aktivitas', role === 'admin' ? 'Pantau dan tindak lanjuti laporan fasilitas kampus.' : 'Selamat datang di portal pelaporan fasilitas kampus.');
    document.querySelector('#view').innerHTML = welcome + `<div class="stat-grid">${stat(role === 'admin' ? 'Total laporan' : 'Laporan saya', role === 'admin' ? all.length : items.length, '<b>↑</b> Data tersimpan', '▤')}${stat('Menunggu', role === 'admin' ? wait : items.filter(r => r.status === 'Menunggu').length, 'Perlu ditinjau', '◷')}${stat('Sedang diproses', role === 'admin' ? progress : items.filter(r => r.status === 'Diproses').length, 'Sedang ditangani', '⚙')}${stat('Selesai', role === 'admin' ? done : items.filter(r => r.status === 'Selesai').length, 'Sudah ditindaklanjuti', '✓')}</div>${recentPanel(role === 'admin' ? all : items, role === 'admin')}<div class="quick-grid"><div class="panel"><div class="panel-head"><div><h3>${role === 'admin' ? 'Perlu perhatian' : 'Tips pelaporan'}</h3><p>${role === 'admin' ? 'Laporan yang menunggu tindak lanjut' : 'Agar laporan cepat diproses'}</p></div></div><div class="activity-list">${role === 'admin' ? activity(all.filter(r => r.status === 'Menunggu').slice(-3).reverse()) : '<div class="activity-item"><span class="activity-dot"></span><div><strong>Pilih kategori yang sesuai</strong><p>Misalnya ruang kelas, toilet, atau jaringan.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>Jelaskan lokasi dengan rinci</strong><p>Sertakan gedung, lantai, dan nomor ruang.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>Pantau status secara berkala</strong><p>Periksa menu Laporan saya untuk pembaruan.</p></div></div>'}</div></div><div class="panel"><div class="panel-head"><div><h3>Alur pelaporan</h3><p>Dari laporan masuk hingga selesai</p></div></div><div class="activity-list"><div class="activity-item"><span class="activity-dot"></span><div><strong>1. Kirim laporan</strong><p>Isi detail kerusakan dan lokasi fasilitas.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>2. Menunggu dan diproses</strong><p>Admin meninjau, lalu meneruskan ke petugas.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>3. Selesai</strong><p>Status diperbarui setelah tindak lanjut.</p></div></div></div></div></div>`;
}
function activity(items) {
    return items.length ? items.map(r => `<div class="activity-item"><span class="activity-dot"></span><div><strong>${esc(r.title)}</strong><p>${esc(r.name)} · ${esc(r.location)}</p><time>${esc(r.date)}</time></div></div>`).join('') : '<div class="empty-state">Tidak ada laporan yang menunggu.</div>';
}
function reportList(admin = false) {
    const items = (admin ? reports : myReports()).filter(r => (!listFilter || r.status === listFilter) && (!searchTerm || `${r.title} ${r.location} ${r.category} ${r.name}`.toLowerCase().includes(searchTerm.toLowerCase())));
    setTitle(admin ? 'Semua laporan' : 'Laporan saya', admin ? 'Cari, tinjau, dan perbarui laporan fasilitas.' : 'Semua laporan yang kamu kirim dan status terkininya.', admin ? '' : '<button class="btn-primary" data-new-report>＋ Buat laporan</button>');
    document.querySelector('#view').innerHTML = `<div class="filter-bar"><div class="search-box"><span>⌕</span><input id="report-search" placeholder="Cari judul, kategori, atau lokasi..." value="${esc(searchTerm)}"></div><select id="status-filter"><option value="">Semua status</option>${['Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map(s => `<option ${listFilter === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn-quiet" id="reset-filters">Atur ulang</button></div>${table(items, admin, !admin)}`;
    document.querySelector('#report-search').addEventListener('input', e => {
        searchTerm = e.target.value;
        reportList(admin);
        const input = document.querySelector('#report-search');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    });
    document.querySelector('#status-filter').addEventListener('change', e => {
        listFilter = e.target.value;
        reportList(admin);
    });
    document.querySelector('#reset-filters').addEventListener('click', () => {
        listFilter = '';
        searchTerm = '';
        reportList(admin);
    });
}
function categories() {
    const cats = [['Ruang Kelas', '▣', 'Kelas, proyektor, meja, kursi'], ['Toilet', '♧', 'Keran, sanitasi, kebersihan'], ['Laboratorium', '⚗', 'Peralatan dan fasilitas lab'], ['Perpustakaan', '▤', 'Ruang baca dan koleksi'], ['Area Umum', '⌂', 'Koridor, taman, parkir'], ['Jaringan & IT', '⌘', 'Wi-Fi, komputer, perangkat']];
    setTitle('Kategori fasilitas', 'Ringkasan laporan berdasarkan kategori kerusakan.');
    document.querySelector('#view').innerHTML = `<div class="category-grid">${cats.map(([name, icon, desc]) => `<article class="category-card"><span>${icon}</span><h3>${name}</h3><p>${desc}</p><strong>${reports.filter(r => r.category === name).length}</strong></article>`).join('')}</div>`;
}
function students() {
    let people = [...new Map(reports.map(r => [r.owner, {
                owner: r.owner, name: r.name
            }
        ])).values()];
    setTitle('Data pelapor', 'Lihat laporan mahasiswa dan hapus laporan yang tidak sesuai.');
    document.querySelector('#view').innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Daftar mahasiswa</h3><p>${people.length} pelapor tercatat</p></div></div><div class="table-wrap"><table><thead><tr><th>NAMA</th><th>NIM</th><th>JUMLAH LAPORAN</th><th>TERAKHIR MELAPOR</th><th>KELOLA</th></tr></thead><tbody>${people.length ? people.map(p => {
        const own = reports.filter(r => r.owner === p.owner);
        return `<tr><td>${esc(p.name)}</td><td>${esc(p.owner)}</td><td>${own.length}</td><td>${esc(own[own.length - 1].date)}</td><td><button class="table-action" data-owner-reports="${esc(p.owner)}">Lihat / hapus laporan</button></td></tr>`;
    }).join('') : '<tr><td colspan="5" class="empty-state">Belum ada laporan dari mahasiswa.</td></tr>'}</tbody></table></div></div>`;
}
function guide() {
    setTitle('Panduan pelaporan', 'Langkah sederhana untuk mengirim laporan fasilitas.');
    document.querySelector('#view').innerHTML = `<div class="quick-grid"><div class="panel"><div class="panel-head"><div><h3>Bagaimana cara melapor?</h3><p>Ikuti langkah berikut agar laporan mudah ditindaklanjuti.</p></div></div><div class="activity-list"><div class="activity-item"><span class="activity-dot"></span><div><strong>1. Pilih “Buat laporan”</strong><p>Gunakan menu di sisi kiri atau tombol pada ringkasan.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>2. Isi informasi yang jelas</strong><p>Tulis judul, kategori, lokasi spesifik, dan uraian masalah.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>3. Pilih urgensi dengan tepat</strong><p>Tandai darurat hanya jika kerusakan berisiko bagi keselamatan.</p></div></div><div class="activity-item"><span class="activity-dot"></span><div><strong>4. Pantau perkembangan</strong><p>Status laporan dapat dilihat pada menu Laporan saya.</p></div></div></div></div><div class="panel"><div class="panel-head"><div><h3>Arti status laporan</h3><p>Setiap laporan bergerak melalui proses berikut.</p></div></div><div class="activity-list"><div class="activity-item"><span class="status-pill menunggu">Menunggu</span><div><strong>Sudah diterima</strong><p>Admin belum meninjau laporan.</p></div></div><div class="activity-item"><span class="status-pill diproses">Diproses</span><div><strong>Dalam penanganan</strong><p>Laporan diteruskan kepada petugas terkait.</p></div></div><div class="activity-item"><span class="status-pill selesai">Selesai</span><div><strong>Perbaikan tuntas</strong><p>Fasilitas sudah ditindaklanjuti.</p></div></div><div class="activity-item"><span class="status-pill ditolak">Ditolak</span><div><strong>Tidak dapat diproses</strong><p>Admin memberikan alasan atau meminta laporan baru.</p></div></div></div></div></div><div style="margin-top:14px">${role === 'mahasiswa' ? buttonNew() : ''}</div>`;
}
function profile() {
    setTitle('Profil saya', 'Informasi akun dan foto profil.');
    const avatar = currentUser.photoData ? `<img src="${currentUser.photoData}" alt="Foto profil">` : `<span>${esc(currentUser.name[0].toUpperCase())}</span>`;
    document.querySelector('#view').innerHTML = `<div class="profile-card"><div class="profile-hero"><div class="profile-photo-large">${avatar}</div><div><h2>${esc(currentUser.name)}</h2><p>${role === 'admin' ? 'Administrator' : 'Mahasiswa · ' + esc(currentUser.identity)}</p>${role === 'mahasiswa' ? '<label class="profile-photo-control">Pilih foto profil<input id="profile-photo-input" type="file" accept="image/*"></label><small>Gambar maksimal 5 MB. Foto disimpan pada browser ini.</small>' : ''}</div></div><div class="profile-row"><span>Nama</span><strong>${esc(currentUser.name)}</strong></div><div class="profile-row"><span>${role === 'admin' ? 'Email' : 'NIM'}</span><strong>${esc(currentUser.identity)}</strong></div><div class="profile-row"><span>Jenis akun</span><strong>${role === 'admin' ? 'Administrator' : 'Mahasiswa'}</strong></div><div class="profile-row"><span>Total laporan</span><strong>${myReports().length} laporan</strong></div><div class="profile-row"><span>Akun</span><strong>${role === 'admin' ? 'Akun demo' : 'Terdaftar'}</strong></div></div>`;
    const input = document.querySelector('#profile-photo-input');
    if (input)
        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file)
                return;
            try {
                const photoData = await preparePhoto(file), account = users.find(u => u.identity === currentUser.identity);
                if (!account)
                    throw new Error('Akun mahasiswa tidak ditemukan.');
                account.photoData = photoData;
                currentUser.photoData = photoData;
                localStorage.setItem('laporkampus-users', JSON.stringify(users));
                updateAvatarElements();
                profile();
                toast('Foto profil berhasil diperbarui');
            }
            catch (error) {
                toast(error.message || 'Foto gagal disimpan');
            }
        });
}
function renderPage() {
    if (page === 'dashboard')
        dashboard();
    else if (page === 'mine' || page === 'all')
        reportList(page === 'all');
    else if (page === 'new') {
        setTitle('Buat laporan', 'Sampaikan kerusakan fasilitas dengan detail.');
        document.querySelector('#view').innerHTML = `<div class="panel"><div class="empty-state">Gunakan formulir untuk mengirim laporan baru.<br><br>${buttonNew()}</div></div>`;
    }
    else if (page === 'categories')
        categories();
    else if (page === 'students')
        students();
    else if (page === 'guide')
        guide();
    else if (page === 'profile')
        profile();
}
document.addEventListener('click', e => {
    const notification = e.target.closest('[data-notification-report]');
    if (notification) {
        notificationPanel.classList.add('hidden');
        const reportId = notification.dataset.notificationReport, ownerId = notification.dataset.notificationOwner;
        if (role === 'admin') {
            go('students');
            showOwnerReports(ownerId);
        }
        else {
            go('mine');
            showDetail(reportId);
        }
        return;
    }
    if (!e.target.closest('#notification-panel') && !e.target.closest('#notification-button'))
        notificationPanel.classList.add('hidden');
    if (e.target.closest('[data-new-report]')) {
        document.querySelector('#report-form').reset();
        document.querySelector('#report-dialog-title').textContent = 'Buat laporan baru';
        document.querySelector('#report-dialog').showModal();
    }
    const goto = e.target.closest('[data-goto]');
    if (goto)
        go(goto.dataset.goto);
    const detail = e.target.closest('[data-detail]');
    if (detail)
        showDetail(detail.dataset.detail);
    const owner = e.target.closest('[data-owner-reports]');
    if (owner)
        showOwnerReports(owner.dataset.ownerReports);
    const del = e.target.closest('[data-delete-report]');
    if (del)
        deleteReport(del.dataset.deleteReport);
    const close = e.target.closest('[data-close]');
    if (close)
        document.getElementById(close.dataset.close).close();
});
async function preparePhoto(file) {
    if (!file)
        return '';
    if (!file.type.startsWith('image/'))
        throw new Error('Pilih file gambar.');
    if (file.size > 5 * 1024 * 1024)
        throw new Error('Ukuran foto maksimal 5 MB.');
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => {
            const max = 1400, scale = Math.min(1, max / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', .78));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Foto tidak dapat dibaca.'));
        };
        img.src = url;
    });
}
const photoInput = document.querySelector('#report-form [name="photo"]');
const photoInfo = document.createElement('small');
photoInfo.className = 'photo-info';
photoInfo.textContent = 'Format gambar · maksimal 5 MB';
photoInput.after(photoInfo);
photoInput.addEventListener('change', () => {
    photoInfo.textContent = photoInput.files[0] ? `${photoInput.files[0].name} · maks. 5 MB` : 'Format gambar · maksimal 5 MB';
});
document.querySelector('#report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget, d = new FormData(form), submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
        const photoData = await preparePhoto(d.get('photo'));
        reports.push({
            id: 'LP-' + String(Date.now()).slice(-4), owner: studentId(), name: currentUser.name, title: d.get('title').trim(), category: d.get('category'), location: d.get('location').trim(), priority: d.get('priority'), description: d.get('description').trim(), photoData, status: 'Menunggu', date: new Intl.DateTimeFormat('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }).format(new Date())
        });
        save();
        form.reset();
        photoInfo.textContent = 'Format gambar · maksimal 5 MB';
        document.querySelector('#report-dialog').close();
        renderNav();
        go(role === 'admin' ? 'all' : 'mine');
        toast('Laporan berhasil dikirim');
    }
    catch (error) {
        toast(error.message || 'Foto gagal disimpan');
    }
    finally {
        submit.disabled = false;
    }
});
function showDetail(id) {
    const r = reports.find(x => x.id === id);
    if (!r)
        return;
    const dlg = document.querySelector('#detail-dialog');
    dlg.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">${esc(r.id)} · ${esc(r.category)}</p><h2>${esc(r.title)}</h2></div><button class="close-dialog" data-close="detail-dialog">×</button></div><div class="detail-body"><p><b>Pelapor:</b> ${esc(r.name)} · ${esc(r.owner)}</p><p><b>Lokasi:</b> ${esc(r.location)}</p><p><b>Tanggal:</b> ${esc(r.date)} · <b>Urgensi:</b> ${esc(r.priority)}</p><p><b>Deskripsi:</b><br>${esc(r.description)}</p>${r.photoData ? `<div class="evidence-block"><b>Foto pendukung</b><img class="evidence-photo" src="${r.photoData}" alt="Foto pendukung laporan ${esc(r.id)}"><a href="${r.photoData}" download="${esc(r.id)}-foto.jpg">Unduh foto ↗</a></div>` : '<p class="muted-label">Tidak ada foto pendukung.</p>'}<p><b>Status saat ini:</b> <span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span></p>${role === 'admin' ? `<div class="detail-actions"><select class="admin-status" id="admin-status">${['Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map(s => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn-primary" id="update-status" data-id="${esc(r.id)}">Perbarui status</button></div>` : ''}</div>`;
    if (!dlg.open)
        dlg.showModal();
    const update = document.querySelector('#update-status');
    if (update)
        update.addEventListener('click', () => {
            r.status = document.querySelector('#admin-status').value;
            r.updatedAt = new Date().toISOString();
            save();
            dlg.close();
            renderNav();
            renderPage();
            toast('Status laporan diperbarui');
        });
}
function showOwnerReports(ownerId) {
    const dlg = document.querySelector('#detail-dialog'), own = reports.filter(r => r.owner === ownerId), person = own[0];
    if (!person)
        return;
    dlg.innerHTML = `<div class="dialog-head"><div><p class="eyebrow">DATA PELAPOR · ${esc(ownerId)}</p><h2>${esc(person.name)}</h2></div><button class="close-dialog" data-close="detail-dialog">×</button></div><div class="detail-body"><p>Lihat detail dan foto pendukung, atau hapus laporan satu per satu.</p><div class="table-wrap"><table><thead><tr><th>LAPORAN</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>${own.map(r => `<tr><td>${esc(r.title)}<div class="report-id">${esc(r.id)} · ${esc(r.date)}</div></td><td><span class="status-pill ${statusClass(r.status)}">${esc(r.status)}</span></td><td><button class="table-action" data-detail="${esc(r.id)}">Detail</button> <button class="table-action delete-action" data-delete-report="${esc(r.id)}">Hapus</button></td></tr>`).join('')}</tbody></table></div></div>`;
    if (!dlg.open)
        dlg.showModal();
}
function deleteReport(id) {
    const report = reports.find(r => r.id === id);
    if (!report)
        return;
    const allowed = role === 'admin' || (role === 'mahasiswa' && report.owner === studentId());
    if (!allowed)
        return;
    const prompt = role === 'admin' ? `Hapus laporan “${report.title}” dari ${report.name}? Tindakan ini tidak dapat dibatalkan.` : `Hapus laporan “${report.title}” milikmu? Tindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(prompt))
        return;
    reports = reports.filter(r => r.id !== id);
    save();
    renderNav();
    if (page === 'students')
        students();
    else
        renderPage();
    const dlg = document.querySelector('#detail-dialog');
    if (dlg.open) {
        const ownerStillHas = reports.some(r => r.owner === report.owner);
        if (dlg.querySelector('[data-owner-reports]') || dlg.querySelector('.detail-body table')) {
            if (page === 'students' && ownerStillHas)
                showOwnerReports(report.owner);
            else
                dlg.close();
        }
    }
    toast('Laporan berhasil dihapus');
}
document.querySelector('#mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
let toastTimer;
function toast(message) {
    const t = document.querySelector('#toast');
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2300);
}
