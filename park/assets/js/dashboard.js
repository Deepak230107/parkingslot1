// ════════════ PARKING DASHBOARD LOGIC ════════════
const dZones = ['A'];
let dSlots = {};
let dSelSlot = null;
const dNames = ['Arjun S.', 'Priya M.', 'Ravi K.', 'Kavya T.', 'Arun B.', 'Deepa R.'];
const dPlates = ['TN09AX1234', 'KA04BZ5678', 'MH12CD9012', 'DL7CE3456', 'AP28FG7890', 'TS11HI2345'];

function seededR(seed) { let x = Math.sin(seed + 3) * 10000; return x - Math.floor(x); }

async function initDashboard() {
    const totalSlots = parseInt(localStorage.getItem('parkease_total_slots') || '8');
    
    // Ensure all slots exist locally before fetching, and reset old selections
    for (let i = 1; i <= totalSlots; i++) {
        const id = `B2-A${String(i).padStart(2, '0')}`;
        if (!dSlots[id]) {
            dSlots[id] = { id: id, zone: 'A', num: i, state: 'free', user: '', plate: '', since: '' };
        } else if (dSlots[id].state === 'selected') {
            dSlots[id].state = 'free'; // Reset to evaluate again
        }
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/get-slots');
        if (response.ok) {
            const remoteSlots = await response.json();
            
            // Clear or update local cache
            remoteSlots.forEach(s => {
                if(dSlots[s.id]) {
                    dSlots[s.id].state = s.state;
                    dSlots[s.id].user = s.user || '';
                    dSlots[s.id].plate = s.plate || '';
                    dSlots[s.id].since = s.since || '';
                }
            });
        }
    } catch (err) {
        console.warn("API Offline. Falling back to simulation/local.");
    }

    // Sync from LocalStorage (Selections & Bookings)
    const selectedSlotId = localStorage.getItem('parkease_selected_slot');
    if (selectedSlotId && dSlots[selectedSlotId] && dSlots[selectedSlotId].state === 'free') {
        dSlots[selectedSlotId].state = 'selected';
    }

    const localBookings = JSON.parse(localStorage.getItem('parkease_bookings') || '[]');
    localBookings.forEach(b => {
        if (b.state === 'occupied' && dSlots[b.id]) {
            dSlots[b.id].state = 'occupied';
            dSlots[b.id].user = b.user;
            dSlots[b.id].plate = b.plate;
            dSlots[b.id].since = b.since;
            dSlots[b.id].zone = b.zone;
        }
    });

    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    dRender();
}

// Global Polling (now async)
setInterval(() => {
    initDashboard();
}, 2000);

function dRender() {
    const totalSlots = parseInt(localStorage.getItem('parkease_total_slots') || '8');
    const grid = document.getElementById('dZonesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let free = 0, occ = 0, sel = 0, total = 0;

    // Car SVG icon
    const carSVG = `<svg class="s-car" width="36" height="22" viewBox="0 0 48 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 18h36M8 18l4-8h24l4 8"/>
      <rect x="3" y="18" width="42" height="7" rx="3"/>
      <circle cx="12" cy="25" r="2.2"/>
      <circle cx="36" cy="25" r="2.2"/>
      <path d="M14 10h20"/>
    </svg>`;

    // Build rows: first 4 slots, aisle, last 4 slots
    const rowDiv = document.createElement('div');
    rowDiv.className = 'lane-row';

    const block1 = document.createElement('div');
    block1.className = 'slot-block';
    const limit1 = Math.min(4, totalSlots);
    for (let n = 1; n <= limit1; n++) renderSlot(n, block1);
    rowDiv.appendChild(block1);

    if (totalSlots > 4) {
        const aisle = document.createElement('div');
        aisle.className = 'parking-aisle';
        rowDiv.appendChild(aisle);

        const block2 = document.createElement('div');
        block2.className = 'slot-block';
        for (let n = 5; n <= totalSlots; n++) renderSlot(n, block2);
        rowDiv.appendChild(block2);
    }

    grid.appendChild(rowDiv);

    function renderSlot(num, parent) {
        const id = `B2-A${String(num).padStart(2, '0')}`;
        const slotData = dSlots[id] || { state: 'free' };

        const state = slotData.state || 'free';
        if (state === 'free')     free++;
        else if (state === 'occupied') occ++;
        else if (state === 'selected') sel++;
        total++;

        const card = document.createElement('div');
        card.className = `parking-slot ${state}`;
        card.dataset.id = id;
        card.innerHTML = `
            <div class="slot-badge">${id}</div>
            ${carSVG}
        `;
        card.onclick = () => dSlotClick(id);
        parent.appendChild(card);
    }

    document.getElementById('dAvail').textContent = free;
    document.getElementById('dOcc').textContent   = occ;
    document.getElementById('dSel').textContent   = sel;
    document.getElementById('dTotal').textContent = total;

    // Footer stats
    const qOpen = document.getElementById('qOpen');
    const qBusy = document.getElementById('qBusy');
    const qYours = document.getElementById('qYours');
    
    if (qOpen) qOpen.textContent = free;
    if (qBusy) qBusy.textContent = occ;
    if (qYours) qYours.textContent = sel;
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

    const state = s.state || 'free';
    const badge = state === 'free'
        ? '<span class="d-badge fr">● Available</span>'
        : state === 'selected'
        ? '<span class="d-badge sl">● Selected</span>'
        : '<span class="d-badge oc">● Occupied</span>';

    const zoneDisplay = s.zone || 'Central Hub B2';
    
    document.getElementById('dPanelInfo').innerHTML = `
        <div class="d-info-row"><span class="d-info-k">Slot ID</span><span class="d-info-v">${id}</span></div>
        <div class="d-info-row"><span class="d-info-k">Zone</span><span class="d-info-v">${zoneDisplay}</span></div>
        <div class="d-info-row"><span class="d-info-k">Status</span><span class="d-info-v">${badge}</span></div>
        ${state === 'occupied' ? `
        <div class="d-info-row"><span class="d-info-k">Plate</span><span class="d-info-v">${s.plate || '—'}</span></div>
        <div class="d-info-row"><span class="d-info-k">Driver</span><span class="d-info-v">${s.user || '—'}</span></div>
        <div class="d-info-row"><span class="d-info-k">Since</span><span class="d-info-v">${s.since || '—'}</span></div>
        ` : ''}
    `;

    const acts = document.getElementById('dPanelActs');
    if (state === 'free')          acts.innerHTML = `<button class="d-act-btn" onclick="dReserve('${id}')">Assign Slot</button>`;
    else if (state === 'selected') acts.innerHTML = `<button class="d-act-btn" onclick="dConfirm('${id}')">Finalize Assignment</button>`;
    else                           acts.innerHTML = `<button class="d-act-btn danger" onclick="dRelease('${id}')">Release Slot</button>`;

    document.getElementById('dPanel').classList.add('open');
}

function dClosePanel() { document.getElementById('dPanel').classList.remove('open'); }
function dReserve(id) { dSlots[id].state = 'selected'; dSelSlot = id; dRender(); dOpenPanel(id); }
async function dConfirm(id) {
    const s = dSlots[id];
    const user = dNames[Math.floor(Math.random() * 6)];
    const plate = dPlates[Math.floor(Math.random() * 6)];
    const time = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} AM`;

    try {
        await fetch('http://127.0.0.1:5000/api/record-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: user,
                plate: plate,
                location: 'Central Hub - B2',
                date: new Date().toISOString().split('T')[0],
                time: time,
                type: 'Manual Entry',
                slot: id,
                amount: '₹0.00',
                duration: 'Manual'
            })
        });
        
        s.state = 'occupied'; 
        s.plate = plate;
        s.user = user; 
        s.since = time;
    } catch (err) {
        console.error("Backend update failed", err);
    }
    
    // Sync to LocalStorage (Legacy / Local session)
    updateLocalStorageFromDashboard();
    
    dSelSlot = null; dRender(); dClosePanel(); showToast(`✅ Slot ${id} Assigned`);
}

async function dRelease(id) { 
    try {
        await fetch('http://127.0.0.1:5000/api/release-slot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        dSlots[id].state = 'free'; 
        dSlots[id].plate = ''; 
        dSlots[id].user = ''; 
        dSlots[id].since = ''; 
    } catch (err) {
        console.error("Backend release failed", err);
    }
    
    // Sync to LocalStorage
    updateLocalStorageFromDashboard();
    
    dRender(); dOpenPanel(id); showToast(`Slot ${id} Released`); 
}

function updateLocalStorageFromDashboard() {
    const bookings = [];
    Object.keys(dSlots).forEach(id => {
        if (dSlots[id].state === 'occupied') {
            bookings.push({
                id: id,
                user: dSlots[id].user,
                plate: dSlots[id].plate,
                since: dSlots[id].since,
                zone: dSlots[id].zone,
                state: 'occupied'
            });
        }
    });
    localStorage.setItem('parkease_bookings', JSON.stringify(bookings));
}

function dSearch(q) {
    document.querySelectorAll('.parking-slot').forEach(s => { 
        s.style.opacity = (!q || s.dataset.id?.toLowerCase().includes(q.toLowerCase())) ? '1' : '0.1'; 
    });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    renderLogs();
});

// ════════════ SECURITY LOGIC ════════════
const securityLogs = [
    { plate: 'TN 09 AX 1234', type: 'entry', desc: 'Valid Pass - Gate A', time: 'Just now' },
    { plate: 'KA 04 BZ 5678', type: 'exit', desc: 'Checked Out - Gate B', time: '2 mins ago' },
    { plate: 'MH 12 CD 9012', type: 'entry', desc: 'Valid Pass - Gate A', time: '15 mins ago' },
    { plate: 'DL 7C E 3456', type: 'incident', desc: 'Unrecognized Plate - Gate C', time: '1 hr ago' },
    { plate: 'TS 11 HI 2345', type: 'entry', desc: 'Valid Pass - Gate A', time: '2 hrs ago' },
    { plate: 'AP 28 FG 7890', type: 'exit', desc: 'Checked Out - Gate B', time: '3 hrs ago' },
];

function renderLogs() {
    const list = document.getElementById('logList');
    if (!list) return;
    list.innerHTML = '';
    securityLogs.forEach(log => {
        const el = document.createElement('div');
        el.className = `log-item ${log.type}`;
        el.innerHTML = `
            <div class="log-info">
                <span class="log-plate">${log.plate}</span>
                <span class="log-desc">${log.type.toUpperCase()}: ${log.desc}</span>
            </div>
            <span class="log-time">${log.time}</span>
        `;
        list.appendChild(el);
    });
}

function verifyPlate() {
    const plate = document.getElementById('plateInput').value.trim();
    const res = document.getElementById('verifyResult');
    if (!plate) { res.textContent = 'Please enter a plate number'; res.style.color = '#f59e0b'; return; }
    
    res.textContent = 'Scanning Database...';
    res.style.color = '#94a3b8';
    
    setTimeout(() => {
        if (Math.random() > 0.3) {
            res.textContent = 'VERIFIED - ACCESS GRANTED';
            res.style.color = '#10b981';
            securityLogs.unshift({ plate: plate.toUpperCase(), type: 'entry', desc: 'Manual Override - Gate A', time: 'Just now' });
            renderLogs();
            showToast('Gate opened successfully.');
        } else {
            res.textContent = 'DENIED - NO ACTIVE BOOKING';
            res.style.color = '#ef4444';
            showToast('Vehicle access denied.');
        }
        setTimeout(() => {
            res.textContent = '';
            document.getElementById('plateInput').value = '';
        }, 4000);
    }, 800);
}

function reportIncident() {
    const plate = prompt("Enter vehicle plate or incident description:");
    if (plate) {
        securityLogs.unshift({ plate: plate.toUpperCase(), type: 'incident', desc: 'Security Alert Triggered', time: 'Just now' });
        renderLogs();
        showToast('Incident reported successfully.');
    }
}
