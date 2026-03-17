// ════════════ PARKING DASHBOARD LOGIC ════════════
const dZones = ['A'];
let dSlots = {};
let dSelSlot = null;
const dNames = ['Arjun S.', 'Priya M.', 'Ravi K.', 'Kavya T.', 'Arun B.', 'Deepa R.'];
const dPlates = ['TN09AX1234', 'KA04BZ5678', 'MH12CD9012', 'DL7CE3456', 'AP28FG7890', 'TS11HI2345'];

function seededR(seed) { let x = Math.sin(seed + 3) * 10000; return x - Math.floor(x); }

function initDashboard() {
    if (Object.keys(dSlots).length > 0) return;
    dZones.forEach(z => {
        for (let n = 1; n <= 8; n++) {
            const id = `${z}${String(n).padStart(2, '0')}`;
            dSlots[id] = {
                id, zone: z, num: n, state: 'free',
                plate: '',
                user: '',
                since: '',
            };
        }
    });
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    dRender();
}

function dRender() {
    const grid = document.getElementById('dZonesGrid'); 
    if(!grid) return;
    grid.innerHTML = '';
    
    let free = 0, occ = 0, sel = 0, total = 0;

    dZones.forEach((zoneChar, zi) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'parking-row';

        // Row Label
        const lbl = document.createElement('div');
        lbl.className = 'row-label';
        lbl.textContent = zoneChar;
        rowDiv.appendChild(lbl);

        // First Block of 4 slots
        const block1 = document.createElement('div');
        block1.className = 'slot-block';
        
        for (let s = 1; s <= 4; s++) {
            renderSlot(zoneChar, s, block1);
        }
        rowDiv.appendChild(block1);

        // Aisle
        const aisle = document.createElement('div');
        aisle.className = 'parking-aisle';
        rowDiv.appendChild(aisle);

        // Second Block of 4 slots
        const block2 = document.createElement('div');
        block2.className = 'slot-block';
        for (let s = 5; s <= 8; s++) {
            renderSlot(zoneChar, s, block2);
        }
        rowDiv.appendChild(block2);

        grid.appendChild(rowDiv);
    });

    function renderSlot(zone, num, parent) {
        const id = `${zone}${String(num).padStart(2, '0')}`;
        const slotData = dSlots[id];
        if (slotData) {
            if (slotData.state === 'free') free++;
            else if (slotData.state === 'occupied') occ++;
            else if (slotData.state === 'selected') sel++;
            total++;

            const sBtn = document.createElement('div');
            sBtn.className = `parking-slot ${slotData.state}`;
            sBtn.dataset.id = id;
            sBtn.dataset.num = num;
            sBtn.onclick = () => dSlotClick(id);
            parent.appendChild(sBtn);
        }
    }

    document.getElementById('dAvail').textContent = free;
    document.getElementById('dOcc').textContent = occ;
    document.getElementById('dSel').textContent = sel;
    document.getElementById('dTotal').textContent = total;
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
    document.getElementById('dPanelTitle').textContent = `Parking Slot ${id}`;
    
    const badge = s.state === 'free' ? '<span class="d-badge fr">Available</span>' : s.state === 'selected' ? '<span class="d-badge sl">Selected</span>' : '<span class="d-badge oc">Occupied</span>';
    
    document.getElementById('dPanelInfo').innerHTML = `
        <div class="d-info-row"><span class="d-info-k">Slot Reference</span><span class="d-info-v">${id}</span></div>
        <div class="d-info-row"><span class="d-info-k">Parking Zone</span><span class="d-info-v">Zone ${s.zone}</span></div>
        <div class="d-info-row"><span class="d-info-k">Availability</span><span class="d-info-v">${badge}</span></div>
        ${s.state === 'occupied' ? `
        <div class="d-info-row"><span class="d-info-k">Vehicle Plate</span><span class="d-info-v">${s.plate}</span></div>
        <div class="d-info-row"><span class="d-info-k">Authorized User</span><span class="d-info-v">${s.user}</span></div>
        <div class="d-info-row"><span class="d-info-k">Parked Since</span><span class="d-info-v">${s.since}</span></div>` : ''}
    `;
    
    const acts = document.getElementById('dPanelActs');
    if (s.state === 'free') acts.innerHTML = `<button class="d-act-btn" onclick="dReserve('${id}')">Assign Slot</button>`;
    else if (s.state === 'selected') acts.innerHTML = `<button class="d-act-btn" onclick="dConfirm('${id}')">Finalize Assignment</button>`;
    else acts.innerHTML = `<button class="d-act-btn" onclick="dRelease('${id}')">Deallocate Slot</button>`;
    
    document.getElementById('dPanel').classList.add('open');
}

function dClosePanel() { document.getElementById('dPanel').classList.remove('open'); }
function dReserve(id) { dSlots[id].state = 'selected'; dSelSlot = id; dRender(); dOpenPanel(id); }
function dConfirm(id) {
    dSlots[id].state = 'occupied'; 
    dSlots[id].plate = dPlates[Math.floor(Math.random() * 6)];
    dSlots[id].user = dNames[Math.floor(Math.random() * 6)]; 
    dSlots[id].since = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} AM`;
    dSelSlot = null; dRender(); dClosePanel(); showToast(`✅ Slot ${id} Assigned`);
}
function dRelease(id) { dSlots[id].state = 'free'; dSlots[id].plate = ''; dSlots[id].user = ''; dSlots[id].since = ''; dRender(); dOpenPanel(id); showToast(`Slot ${id} Released`); }

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

document.addEventListener('DOMContentLoaded', initDashboard);
