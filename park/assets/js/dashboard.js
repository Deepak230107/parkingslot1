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

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    rows.forEach((rowChar, ri) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'theater-row';
        rowDiv.style.animationDelay = `${ri * .05}s`;

        // Row Label (Left)
        const lblL = document.createElement('div');
        lblL.className = 'row-lbl';
        lblL.textContent = rowChar;
        rowDiv.appendChild(lblL);

        // Slot Wrap
        const wrap = document.createElement('div');
        wrap.className = 't-slot-wrap';

        // We have 8 seats per row (2 + 4 + 2 style)
        for (let s = 1; s <= 8; s++) {
            // Map seat to existing dSlots ID logic if needed, or just use Row-Seat
            // For now, let's just use existing IDs from dSlots to maintain state
            // Logic: 64 slots total. Row A is 1-8, B is 9-16...
            const slotIndex = (ri * 8) + s;
            const zoneIdx = Math.floor((slotIndex - 1) / 16);
            const zoneChar = dZones[zoneIdx];
            const numInZone = ((slotIndex - 1) % 16) + 1;
            const id = `${zoneChar}${String(numInZone).padStart(2, '0')}`;

            const slotData = dSlots[id];
            if (slotData) {
                if (slotData.state === 'free') free++;
                else if (slotData.state === 'occupied') occ++;
                else if (slotData.state === 'selected') sel++;
                total++;

                const sBtn = document.createElement('div');
                sBtn.className = `t-slot ${slotData.state}`;
                sBtn.dataset.id = id;
                sBtn.textContent = s;
                sBtn.onclick = () => dSlotClick(id);
                wrap.appendChild(sBtn);
            }

            // Add Aisle after 2 and 6
            if (s === 2 || s === 6) {
                const aisle = document.createElement('div');
                aisle.className = 't-aisle';
                wrap.appendChild(aisle);
            }
        }

        rowDiv.appendChild(wrap);

        // Row Label (Right)
        const lblR = document.createElement('div');
        lblR.className = 'row-lbl';
        lblR.textContent = rowChar;
        rowDiv.appendChild(lblR);

        grid.appendChild(rowDiv);
    });

    document.getElementById('dAvail').textContent = free;
    document.getElementById('dOcc').textContent = occ;
    document.getElementById('dSel').textContent = sel;
    document.getElementById('dTotal').textContent = total;
}

// dBuildSlot is no longer needed in this structure, integrated into dRender


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

// Initialize on load
document.addEventListener('DOMContentLoaded', initDashboard);
