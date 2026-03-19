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
  currentVehicle = v === 'CAR' ? 'Standard Car' : 'Quick Bike';
  showToast(`Vehicle type: ${currentVehicle}`);
}

// ════════════ MINI LOT GRID ════════════
let currentSlot = null; // Default none selected
function buildMiniGrid() {
  const mg = document.getElementById('miniGrid');
  if (!mg) return;
  mg.innerHTML = '';

  const occ = new Set();
  
  // Load existing occupied slots from dashboard sync
  const bookings = JSON.parse(localStorage.getItem('parkease_bookings') || '[]');
  bookings.forEach(b => {
    if (b.state === 'occupied') occ.add(b.id);
  });

  // Set as 8 slots (matching dashboard Zone A)
  for (let n = 1; n <= 8; n++) {
    const s = document.createElement('div');
    const id = `A${String(n).padStart(2, '0')}`;
    
    s.className = 'mini-slot';
    if (occ.has(id)) s.classList.add('occupied');
    if (id === currentSlot && !occ.has(id)) s.classList.add('sel');

    s.addEventListener('click', () => {
      if (occ.has(id)) {
        showToast(`Slot ${id} is already occupied`);
        return;
      }
      mg.querySelectorAll('.mini-slot').forEach(x => x.classList.remove('sel'));
      s.classList.add('sel');
      currentSlot = id;
      showToast(`Slot ${currentSlot} selected`);
      
      // Sync Selection to Dashboard
      localStorage.setItem('parkease_selected_slot', id);
      
      updateMiniStats(occ, 1);
    });
    mg.appendChild(s);
  }
  updateMiniStats(occ, (currentSlot && !occ.has(currentSlot)) ? 1 : 0);
}

function updateMiniStats(occ, selCount) {
  const totalSlots = 8;
  const sCount = typeof selCount === 'number' ? selCount : 0;
  const free = totalSlots - occ.size - sCount;

  document.getElementById('mFree').textContent = Math.max(0, free);
  document.getElementById('mOcc').textContent = occ.size;
  document.getElementById('mSel').textContent = sCount;
}

// ════════════ SENSOR & RESERVATION ════════════
function confirmReservation() {
  const plate = document.getElementById('lPlate').value.trim();
  const name = document.getElementById('lName').value.trim() || 'Guest User';
  const dest = document.getElementById('lDest').value;

  if (!plate) {
    showToast('⚠️ Please enter your vehicle registration number');
    return;
  }
  
  if (!currentSlot) {
    showToast('⚠️ Please select a slot from the live grid above');
    document.getElementById('l-reserve-sec').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  showToast('🛰️ Initiating IoT Smart Scanning...');
  document.getElementById('l-sensor-sec').scrollIntoView({ behavior: 'smooth' });

  const label = document.getElementById('scanLabel');
  const summary = document.getElementById('summaryCard');
  const orb = document.querySelector('.scan-orb');

  // Simulation of sensor handshake
  setTimeout(() => {
    label.textContent = "Vehicle Detected...";
    orb.style.background = 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)';

    setTimeout(() => {
      label.textContent = "Authenticating Plate...";

      setTimeout(() => {
        label.textContent = "SUCCESS: Slot Locked";
        orb.style.background = 'radial-gradient(circle, #22c55e 0%, transparent 70%)';

        // Populate ID Card
        document.getElementById('idPlate').textContent = plate.toUpperCase();
        document.getElementById('idSlot').textContent = currentSlot;
        document.getElementById('idUser').textContent = name;

        // Show Summary
        summary.style.display = 'block';
        summary.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // MARK AS OCCUPIED IN SYNC
        const bookings = JSON.parse(localStorage.getItem('parkease_bookings') || '[]');
        // Check if already exists, update or add
        const idx = bookings.findIndex(b => b.id === currentSlot);
        const newBooking = {
          id: currentSlot,
          user: name,
          plate: plate.toUpperCase(),
          since: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} AM`,
          state: 'occupied'
        };
        if (idx > -1) bookings[idx] = newBooking;
        else bookings.push(newBooking);
        
        localStorage.setItem('parkease_bookings', JSON.stringify(bookings));
        localStorage.removeItem('parkease_selected_slot'); // Clear selected state
        
        const bookedId = currentSlot;
        currentSlot = null; // Prevent 'sel' from staying active locally
        
        // RE-BUILD MINI GRID to show local occupied state immediately
        buildMiniGrid();

        showToast(`✅ Vehicle Authenticated. Slot ${bookedId} Locked.`);
      }, 1500);
    }, 1500);
  }, 1000);
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
  // Live Sync Loop to reflect Admin-level releases/changes
  setInterval(buildMiniGrid, 2000);

  // Set default date
  const dateInput = document.getElementById('lDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Scroll Reveal Observer
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  };

  const revealObserver = new IntersectionObserver(revealCallback, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

  // Navbar & Scroll Spy
  const nav = document.querySelector('.l-nav');
  window.addEventListener('scroll', () => {
    // Nav Style
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }

    // Scroll Spy
    const sections = ['hero', 'l-steps-sec', 'l-reserve-sec'];
    let current = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 200) {
        current = id;
      }
    });

    document.querySelectorAll('.l-nav-btn').forEach(btn => {
      const targetAttr = btn.getAttribute('onclick');
      if (targetAttr) {
        const match = targetAttr.match(/'([^']+)'/);
        if (match && match[1] === current) {
          document.querySelectorAll('.l-nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      }
    });
  }, { passive: true });
});
