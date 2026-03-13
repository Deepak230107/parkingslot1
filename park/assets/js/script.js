// ════════════ LANDING LOGIC ════════════
function lScroll(id, btn) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  if (btn) { document.querySelectorAll('.l-nav-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
}
function selectV(btn, v) { document.querySelectorAll('.v-btn').forEach(b => b.classList.remove('sel')); btn.classList.add('sel'); }
function updateLPrice() {
  const v = document.getElementById('lDur').value;
  document.getElementById('lPrice').textContent = '₹' + v;
  if (document.getElementById('rParkFee')) document.getElementById('rParkFee').textContent = '₹' + v;
  if (document.getElementById('rTotal')) document.getElementById('rTotal').textContent = '₹' + v;
}
function selPm(el) { document.querySelectorAll('.pm').forEach(e => e.classList.remove('active')); el.classList.add('active'); }

// Mini lot grid
let miniSel = null;
const miniOcc = new Set();
while (miniOcc.size < 14) miniOcc.add(Math.floor(Math.seededR(miniOcc.size + 1) * 36));
Math.seededR = function (seed) { let x = Math.sin(seed + 7) * 10000; return x - Math.floor(x); };
// Rebuild properly
function buildMiniGrid() {
  const mg = document.getElementById('miniGrid'); mg.innerHTML = '';
  const occ = new Set(); let i = 0;
  while (occ.size < 14) { const r = Math.sin(i + 7) * 10000; occ.add(Math.floor((r - Math.floor(r)) * 36)); i++; }
  let mSel = null;
  for (let n = 0; n < 36; n++) {
    if (n === 12 || n === 24) { const a = document.createElement('div'); a.className = 'mini-aisle'; mg.appendChild(a); }
    const s = document.createElement('div');
    s.className = 'mini-slot' + (occ.has(n) ? ' occ' : '');
    s.dataset.n = n;
    if (!occ.has(n)) {
      s.addEventListener('click', () => {
        mg.querySelectorAll('.mini-slot').forEach(x => { if (x.classList.contains('sel')) { x.classList.remove('sel'); } });
        if (mSel === n) { mSel = null; } else { s.classList.add('sel'); mSel = n; }
        updateMiniStats(occ, mSel);
      });
    }
    mg.appendChild(s);
  }
  updateMiniStats(occ, null);
}
function updateMiniStats(occ, sel) {
  const free = 36 - occ.size - (sel !== null ? 1 : 0);
  document.getElementById('mFree').textContent = free;
  document.getElementById('mOcc').textContent = occ.size;
  document.getElementById('mSel').textContent = sel !== null ? 1 : 0;
}
buildMiniGrid();

// Date
const today = new Date().toISOString().split('T')[0];
document.getElementById('lDate').value = today;
document.getElementById('lRcDate').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Nav active on scroll
window.addEventListener('scroll', () => {
  const secs = [['hero', 'Find'], ['l-features-sec', 'Find'], ['l-reserve-sec', 'Reserve'], ['l-pay-sec', 'Pay']];
  let cur = 'hero';
  secs.forEach(([id]) => { const el = document.getElementById(id); if (el && window.scrollY >= el.offsetTop - 100) cur = id; });
  const map = { 'hero': 'Find', 'l-features-sec': 'Find', 'l-reserve-sec': 'Reserve', 'l-pay-sec': 'Pay' };
  document.querySelectorAll('.l-nav-btn').forEach(b => { b.classList.toggle('active', b.textContent.trim() === map[cur]); });
}, { passive: true });

// ════════════ VIEW SWITCHER ════════════
function showDashboard() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('dashboard').classList.add('visible');
  document.body.style.overflow = 'hidden';
  initDashboard();
}
function showLanding() {
  document.getElementById('dashboard').classList.remove('visible');
  document.getElementById('landing').style.display = 'flex';
  document.body.style.overflow = '';
}

// ════════════ DASHBOARD LOGIC ════════════
const dZones = ['A', 'B', 'C', 'D'];
let dSlots = {};
let dSelSlot = null;
const dNames = ['Arjun S.', 'Priya M.', 'Ravi K.', 'Kavya T.', 'Arun B.', 'Deepa R.'];
const dPlates = ['TN09AX1234', 'KA04BZ5678', 'MH12CD9012', 'DL7CE3456', 'AP28FG7890', 'TS11HI2345'];

function seededR(seed) { let x = Math.sin(seed + 3) * 10000; return x - Math.floor(x); }

function initDashboard() {
  if (Object.keys(dSlots).length > 0) return;
  let idx = 0;
  dZones.forEach(z => {
    for (let n = 1; n <= 16; n++) {
      const id = `${z}${String(n).padStart(2, '0')}`;
      const r = seededR(idx++);
      const state = r < 0.45 ? 'occupied' : 'free';
      dSlots[id] = {
        id, zone: z, num: n, state,
        plate: state === 'occupied' ? dPlates[Math.floor(r * 6)] : '',
        user: state === 'occupied' ? dNames[Math.floor(r * 6)] : '',
        since: state === 'occupied' ? `${Math.floor(r * 5) + 8}:${r > .5 ? '30' : '00'} AM` : '',
      };
    }
  });
  document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  dRender();
}

function dRender() {
  const grid = document.getElementById('dZonesGrid'); grid.innerHTML = '';
  let free = 0, occ = 0, sel = 0, total = 0;
  dZones.forEach((z, zi) => {
    const zSlots = Object.values(dSlots).filter(s => s.zone === z);
    const zFree = zSlots.filter(s => s.state === 'free').length;
    free += zFree; occ += zSlots.filter(s => s.state === 'occupied').length;
    sel += zSlots.filter(s => s.state === 'selected').length; total += zSlots.length;
    const card = document.createElement('div');
    card.className = 'd-zone'; card.style.animationDelay = `${zi * .07}s`;
    card.innerHTML = `<div class="d-zone-lbl">Zone ${z}<span class="d-zone-cnt">${zFree} free</span></div><div class="d-slot-col" id="dCol${z}"></div>`;
    grid.appendChild(card);
    const col = card.querySelector(`#dCol${z}`);
    for (let row = 0; row < 8; row++) {
      if (row === 4) { const a = document.createElement('div'); a.className = 'd-aisle'; a.innerHTML = '<span class="d-aisle-lbl">← aisle →</span>'; col.appendChild(a); }
      const rDiv = document.createElement('div'); rDiv.className = 'd-slot-row';
      [row * 2 + 1, row * 2 + 2].forEach(n => { const id = `${z}${String(n).padStart(2, '0')}`; rDiv.appendChild(dBuildSlot(id)); });
      col.appendChild(rDiv);
    }
  });
  document.getElementById('dAvail').textContent = free;
  document.getElementById('dOcc').textContent = occ;
  document.getElementById('dSel').textContent = sel;
  document.getElementById('dTotal').textContent = total;
}

function dBuildSlot(id) {
  const s = dSlots[id]; if (!s) return document.createElement('div');
  const wrap = document.createElement('div');
  wrap.className = `d-slot ${s.state === 'occupied' ? 'occ' : s.state === 'selected' ? 'sel' : ''}`;
  wrap.dataset.id = id;
  const carFill = s.state === 'occupied' ? 'rgba(255,255,255,0.7)' : s.state === 'selected' ? '#111' : '#1a1d24';
  const carOp = s.state === 'free' ? '0.2' : '0.9';
  wrap.innerHTML = `
    <div class="d-slot-body">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
        <rect x="2" y="8" width="28" height="14" rx="3" fill="${carFill}" opacity="${carOp}"/>
        <path d="M5 8L8 3H24L27 8" stroke="${carFill}" stroke-width="1.6" stroke-linejoin="round" opacity="${carOp}"/>
        <ellipse cx="8" cy="22" rx="3" ry="3" fill="${s.state !== 'free' ? carFill : 'transparent'}" opacity="${carOp}"/>
        <ellipse cx="24" cy="22" rx="3" ry="3" fill="${s.state !== 'free' ? carFill : 'transparent'}" opacity="${carOp}"/>
      </svg>
    </div>
    <div class="d-slot-id">${id}</div>`;
  wrap.addEventListener('click', () => dSlotClick(id));
  return wrap;
}

function dSlotClick(id) {
  const s = dSlots[id]; if (!s) return;
  if (s.state === 'free') {
    if (dSelSlot && dSelSlot !== id) dSlots[dSelSlot].state = 'free';
    dSlots[id].state = 'selected'; dSelSlot = id;
  } else if (s.state === 'selected') {
    dSlots[id].state = 'free'; dSelSlot = null;
  }
  dRender(); dOpenPanel(id);
}

function dOpenPanel(id) {
  const s = dSlots[id]; if (!s) return;
  document.getElementById('dPanelTitle').textContent = `Slot ${id}`;
  const vis = document.getElementById('dPanelVis');
  vis.className = 'd-slot-big ' + (s.state === 'selected' ? 'sel-bg' : s.state === 'occupied' ? 'occ-bg' : '');
  const badge = s.state === 'free' ? '<span class="d-badge fr">Available</span>' : s.state === 'selected' ? '<span class="d-badge sl">Selected</span>' : '<span class="d-badge oc">Occupied</span>';
  document.getElementById('dPanelInfo').innerHTML = `
    <div class="d-info-row"><span class="d-info-k">Slot ID</span><span class="d-info-v">${id}</span></div>
    <div class="d-info-row"><span class="d-info-k">Zone</span><span class="d-info-v">Zone ${s.zone}</span></div>
    <div class="d-info-row"><span class="d-info-k">Status</span><span class="d-info-v">${badge}</span></div>
    ${s.state === 'occupied' ? `
    <div class="d-info-row"><span class="d-info-k">Vehicle</span><span class="d-info-v">${s.plate}</span></div>
    <div class="d-info-row"><span class="d-info-k">User</span><span class="d-info-v">${s.user}</span></div>
    <div class="d-info-row"><span class="d-info-k">Since</span><span class="d-info-v">${s.since}</span></div>` : ''}
  `;
  const acts = document.getElementById('dPanelActs');
  if (s.state === 'free') acts.innerHTML = `<button class="d-act-btn primary" onclick="dReserve('${id}')">Reserve This Slot →</button>`;
  else if (s.state === 'selected') acts.innerHTML = `<button class="d-act-btn primary" onclick="dConfirm('${id}')">Confirm Reservation</button><button class="d-act-btn secondary" onclick="dClear('${id}')">Clear Selection</button>`;
  else acts.innerHTML = `<button class="d-act-btn secondary" onclick="showToast('Session details sent.','light-t')">View Session</button><button class="d-act-btn danger" onclick="dRelease('${id}')">Release Slot</button>`;
  document.getElementById('dPanel').classList.add('open');
}
function dClosePanel() { document.getElementById('dPanel').classList.remove('open'); }
function dReserve(id) { dSlots[id].state = 'selected'; dSelSlot = id; dRender(); dOpenPanel(id); showToast(`Slot ${id} selected.`, 'light-t'); }
function dConfirm(id) {
  dSlots[id].state = 'occupied'; dSlots[id].plate = dPlates[Math.floor(Math.random() * 6)];
  dSlots[id].user = dNames[Math.floor(Math.random() * 6)]; dSlots[id].since = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  dSelSlot = null; dRender(); dClosePanel(); showToast(`✅ Slot ${id} reserved!`, 'light-t');
}
function dClear(id) { dSlots[id].state = 'free'; dSelSlot = null; dRender(); dClosePanel(); showToast(`Slot ${id} cleared.`, 'light-t'); }
function dRelease(id) { dSlots[id].state = 'free'; dSlots[id].plate = ''; dSlots[id].user = ''; dSlots[id].since = ''; dRender(); dOpenPanel(id); showToast(`Slot ${id} available.`, 'light-t'); }
function dNav(el) { document.querySelectorAll('.d-nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active'); }
function dVehicle(v, btn) { document.querySelectorAll('.d-vtab').forEach(b => b.classList.remove('active')); btn.classList.add('active'); showToast(`Showing ${v} slots`, 'light-t'); }
function dSearch(q) {
  document.querySelectorAll('.d-slot').forEach(s => { s.style.opacity = (!q || s.dataset.id?.toLowerCase().includes(q.toLowerCase())) ? '1' : '0.18'; });
}

// ════════════ TOAST ════════════
function showToast(msg, cls = 'dark-t') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${cls} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

function downloadReceipt() {
  showToast('📄 Generating secure PDF receipt...', 'dark-t');
  setTimeout(() => {
    showToast('✅ Receipt downloaded successfully!', 'dark-t');
  }, 1800);
}
// ════════════ ON-THE-SPOT LOGIC ════════════
function openSpotModal() {
  document.getElementById('spotOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSpotModal() {
  document.getElementById('spotOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function selectSpotDur(el, hrs) {
  document.querySelectorAll('.dur-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  // Since user asked for ₹1 for all demo purposes, we keep it ₹1
  showToast(`Duration set to ${hrs} hour${hrs > 1 ? 's' : ''}`, 'dark-t');
}

function confirmSpotBooking() {
  const plate = document.getElementById('spotPlate').value.trim();
  const zone = document.getElementById('spotZone').value;

  if (!plate || plate.length < 4) {
    showToast('⚠️ Please enter a valid vehicle number.', 'dark-t');
    return;
  }

  // Simulate booking
  showToast(`⚡ Processing instant booking for ${plate}...`, 'dark-t');

  setTimeout(() => {
    closeSpotModal();
    // Use the existing notification logic if possible, or just a toast
    if (typeof confirmReservation === 'function') {
      // Sync the landing form if needed, or just trigger the countdown directly
      const plateInput = document.getElementById('lPlate');
      if (plateInput) plateInput.value = plate;

      // Auto-trigger the confirmed state
      confirmReservation();
      showToast(`✅ Instant access granted! Drive to Zone ${zone}-14.`, 'dark-t');
    } else {
      showToast(`✅ Instant access granted! Drive to Zone ${zone}.`, 'dark-t');
    }
  }, 1500);
}
