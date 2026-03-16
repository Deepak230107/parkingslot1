// ════════════ LANDING UTILITIES ════════════
function lScroll(id, btn) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  if (btn) {
    document.querySelectorAll('.l-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

let currentVehicle = 'Standard Car';
function selectV(btn, v) {
  document.querySelectorAll('.v-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  currentVehicle = v === 'CAR' ? 'Standard Car' : v === 'BIKE' ? 'Quick Bike' : 'Heavy Truck';
  showToast(`Vehicle type: ${currentVehicle}`);
}

// ════════════ MINI LOT GRID ════════════
let currentSlot = 'PE-104'; // Default
function buildMiniGrid() {
  const mg = document.getElementById('miniGrid');
  if (!mg) return;
  mg.innerHTML = '';
  
  const occ = new Set();
  let i = 0;
  // Generate random stable occupied slots
  while (occ.size < 12) {
    const r = Math.sin(i + 13) * 10000;
    occ.add(Math.floor((r - Math.floor(r)) * 36));
    i++;
  }

  let mSel = null;
  for (let n = 0; n < 36; n++) {
    const s = document.createElement('div');
    s.className = 'mini-slot' + (occ.has(n) ? ' occ' : '');
    
    if (!occ.has(n)) {
      s.addEventListener('click', () => {
        mg.querySelectorAll('.mini-slot').forEach(x => x.classList.remove('sel'));
        if (currentSlot === `PE-${n + 100}`) {
          currentSlot = 'PE-104';
        } else {
          s.classList.add('sel');
          currentSlot = `PE-${n + 100}`;
          showToast(`Slot ${currentSlot} selected`);
        }
        updateMiniStats(occ, currentSlot === 'PE-104' ? null : n);
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

// ════════════ RESERVATION LOGIC ════════════
function confirmReservation() {
  const plate = document.getElementById('lPlate').value.trim();
  const dest = document.getElementById('lDest').value;
  
  if (!plate) {
    showToast('⚠️ Please enter your vehicle registration number');
    return;
  }
  
  showToast('⚡ Securing your placement...', 'dark-t');
  
  setTimeout(() => {
    showToast('✅ Slot Reserved! Finalize payment below.');
    document.getElementById('lRcPlate').textContent = plate.toUpperCase();
    document.getElementById('rcZone').textContent = dest.includes('B2') ? 'Zone B2' : 'Elite Zone';
    document.getElementById('l-pay-sec').scrollIntoView({ behavior: 'smooth' });
  }, 1200);
}

async function processPayment() {
  const btn = document.getElementById('mainPayBtn');
  const plate = document.getElementById('lPlate')?.value || 'PARKEASE';
  
  // Real UPI deep link for bank transaction simulation
  const vpa = "deepak@sbi"; // Based on your SBI QR
  const name = "DEEPAK";
  const amount = "1.00";
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Parking Slot: ' + plate)}`;

  btn.textContent = '🔒 Redirecting to Bank...';
  btn.style.opacity = '0.7';
  
  showToast('🏦 Handshaking with Bank Gateway...');

  // Open the UPI app
  window.location.href = upiUri;

  // Wait for simulation of return/success
  setTimeout(async () => {
    btn.textContent = '✅ Payment Successful';
    btn.style.background = '#22c55e';
    btn.style.color = '#fff';
    btn.style.opacity = '1';
    btn.disabled = true;
    
    document.getElementById('payStatus').textContent = 'SUCCESSFUL';
    document.getElementById('payStatus').style.color = '#22c55e';
    
    showToast('💎 Transaction Verified. Access Granted.');

    // SAVE TO SQL DATABASE
    try {
      const name = document.getElementById('lName')?.value.trim() || 'Guest User';
      const dest = document.getElementById('lDest')?.value || 'Central Park District';
      const date = document.getElementById('lDate')?.value || 'N/A';
      const time = document.getElementById('lArrival')?.value || 'N/A';
      
      await fetch('http://127.0.0.1:5000/api/record-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          plate: plate,
          location: dest,
          date: date,
          time: time,
          type: currentVehicle,
          slot: currentSlot,
          amount: '₹1.00'
        })
      });
      console.log("SQL: Transaction data synced.");
    } catch (err) {
      console.warn("SQL: Record failed, backend might be local-only.", err);
    }
  }, 3000);
}

async function downloadReceipt() {
  // Retrieve user data directly from the form elements
  const name = document.getElementById('lName')?.value.trim() || 'Guest User';
  const plate = document.getElementById('lPlate')?.value.trim() || 'NOT_SPECIFIED';
  const dest = document.getElementById('lDest')?.value || 'Central Park District';
  const date = document.getElementById('lDate')?.value || 'N/A';
  const time = document.getElementById('lArrival')?.value || 'N/A';
  
  showToast('📜 Retrieving user data for personalized PDF...');

  try {
    const response = await fetch('http://127.0.0.1:5000/api/generate-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        plate: plate,
        type: currentVehicle,
        location: dest,
        date: date,
        time: time,
        slot: currentSlot,
        amount: 'INR 1.00'
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ParkEase_Receipt_${plate.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('✅ Personalized Receipt Generated!');
    } else {
      throw new Error('Backend unreachable');
    }
  } catch (err) {
    console.error(err);
    showToast('⚠️ Data retrieval failed. Is the Python backend running?');
  }
}

// ════════════ TOAST SYSTEM ════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 3000);
}

// ════════════ PAYMENT REDIRECTION ════════════
function openUpi(platform) {
  const plate = document.getElementById('lPlate')?.value || 'PARKEASE';
  const amount = "1.00";
  const vpa = "deepak@sbi"; // Your SBI VPA
  const name = "DEEPAK";
  const note = `ParkEase: ${plate}`;

  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  showToast(`🚀 Opening ${platform} for transaction...`);

  setTimeout(() => {
    window.location.href = upiUri;
    
    // Auto-success after simulation
    setTimeout(() => {
      if (document.getElementById('payStatus').textContent === 'PENDING') {
        processPayment();
      }
    }, 4000);
  }, 800);
}

// ════════════ INITIALIZATION ════════════
document.addEventListener('DOMContentLoaded', () => {
  buildMiniGrid();
  
  // Set default date
  const dateInput = document.getElementById('lDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Scroll Spy for Nav
  window.addEventListener('scroll', () => {
    const sections = ['hero', 'l-steps-sec', 'l-reserve-sec'];
    let current = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 150) {
        current = id;
      }
    });

    document.querySelectorAll('.l-nav-btn').forEach(btn => {
      const target = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
      btn.classList.toggle('active', target === current);
    });
  }, { passive: true });
});
