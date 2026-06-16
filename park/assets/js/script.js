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
async function buildMiniGrid() {
  const mg = document.getElementById('miniGrid');
  if (!mg) return;

  const occ = new Set();
  
  try {
    const res = await fetch('http://127.0.0.1:5000/api/get-slots');
    if (res.ok) {
      const remoteSlots = await res.json();
      remoteSlots.forEach(s => {
        if (s.state === 'occupied') occ.add(s.id);
      });
    }
  } catch (err) {
    console.warn("Backend offline, using local storage fallback.");
    // Load existing occupied slots from dashboard sync
    const bookings = JSON.parse(localStorage.getItem('parkease_bookings') || '[]');
    bookings.forEach(b => {
      if (b.state === 'occupied') occ.add(b.id);
    });
  }

  mg.innerHTML = '';
  const totalSlots = parseInt(localStorage.getItem('parkease_total_slots') || '8');
  
  // Dynamic slot generation based on settings
  for (let n = 1; n <= totalSlots; n++) {
    const s = document.createElement('div');
    const id = `B2-A${String(n).padStart(2, '0')}`;
    
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
  const totalSlots = parseInt(localStorage.getItem('parkease_total_slots') || '8');
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
        window.lastBookedSlot = bookedId; // Global reference for receipt
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
      const duration = parseInt(document.getElementById('lDuration')?.value || '3');

      // Calculate Expiry for Notification
      const [h, m] = time.split(':').map(Number);
      const arrivalDate = new Date();
      arrivalDate.setHours(h, m, 0, 0);
      const expiryDate = new Date(arrivalDate.getTime() + duration * 60 * 60 * 1000);
      
      const bookingData = {
        name, plate, dest, date, time, duration,
        expiry: expiryDate.getTime(),
        alertSent: false
      };
      
      // Store locally for background check
      const currentBookings = JSON.parse(localStorage.getItem('user_active_sessions') || '[]');
      currentBookings.push(bookingData);
      localStorage.setItem('user_active_sessions', JSON.stringify(currentBookings));

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
          slot: window.lastBookedSlot,
          amount: '₹1.00',
          duration: `${duration} hrs`
        })
      });
      console.log("SQL: Transaction data synced.");
    } catch (err) {
      console.warn("SQL: Record failed, backend might be local-only.", err);
    }
  }, 3000);
}

// ════════════ BACKGROUND NOTIFICATION ENGINE ════════════
setInterval(() => {
  const sessions = JSON.parse(localStorage.getItem('user_active_sessions') || '[]');
  const now = Date.now();
  let changed = false;

  sessions.forEach(s => {
    // 30 minutes expressed in ms = 30 * 60 * 1000 = 1,800,000
    const timeUntilExpiry = s.expiry - now;
    
    if (timeUntilExpiry > 0 && timeUntilExpiry <= 1800000 && !s.alertSent) {
      // Trigger Notification
      showToast(`⚠️ URGENT: Your stay at ${s.dest} expires in 30 minutes!`);
      if (Notification.permission === "granted") {
        new Notification("ParkEase Alert", {
           body: `Vehicle ${s.plate} session in ${s.dest} expires soon.`,
           icon: "assets/images/favicon.png"
        });
      } else {
        alert(`🚨 ParkEase Alert: Your session for ${s.plate} expires in 30 minutes!`);
      }
      s.alertSent = true;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('user_active_sessions', JSON.stringify(sessions));
  }
}, 30000); // Check every 30 seconds

// Request notification permission on load
if ("Notification" in window && Notification.permission !== "denied") {
  Notification.requestPermission();
}

async function downloadReceipt() {
  // ── Read live values directly from the on-screen receipt card ──
  const zone      = document.getElementById('rcZone')?.textContent     || document.getElementById('lDest')?.value || 'Central Park District';
  const plate     = document.getElementById('lRcPlate')?.textContent   || document.getElementById('lPlate')?.value.trim() || 'NOT_SPECIFIED';
  const model     = document.getElementById('lRcModel')?.textContent   || window.currentVehicle || 'Standard Car';
  const slot      = document.getElementById('lRcSlot')?.textContent    || window.lastBookedSlot || 'Pending';
  const duration  = document.getElementById('lRcDuration')?.textContent || '3 Hours';
  const baseFare  = document.getElementById('lRcBase')?.textContent    || '₹0.80';
  const taxes     = document.getElementById('lRcTax')?.textContent     || '₹0.20';
  const payStatus = document.getElementById('payStatus')?.textContent  || 'PENDING';
  const grandTotal= document.getElementById('rTotal')?.textContent     || '₹1.00';
  const orderNum  = `PE-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr   = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const isPaid    = payStatus.toUpperCase().includes('SUCCESS');
  const statusColor = isPaid ? '#16a34a' : '#8b5cf6';

  showToast('📜 Generating full-page PDF Receipt...');

  // ── PDF Receipt HTML — mirrors the on-screen receipt card exactly ──
  const receiptHTML = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; width: 794px; min-height: 1123px; background: #ffffff; box-sizing: border-box;">

      <!-- Header Band -->
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%); padding: 40px 50px 32px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 34px; font-weight: 900; color: #a78bfa; letter-spacing: -1px; line-height: 1;">Park<span style="color:#ffffff;">Ease</span></div>
          <div style="color: #c4b5fd; font-size: 12px; margin-top: 6px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Quantum Prismatic Grid — Authorized Permit</div>
        </div>
        <div style="text-align: right; color: #c4b5fd; font-size: 13px; line-height: 1.8;">
          <div style="font-weight: 700; color: #fff; font-size: 15px;">Order #${orderNum}</div>
          <div>${dateStr}</div>
          <div>${timeStr}</div>
        </div>
      </div>

      <!-- Title -->
      <div style="text-align: center; padding: 28px 50px 0;">
        <div style="display: inline-block; background: #f5f3ff; border: 1px solid #ddd6fe; padding: 8px 28px; border-radius: 100px; font-size: 12px; font-weight: 800; color: #7c3aed; letter-spacing: 3px; text-transform: uppercase;">Authorization Permit</div>
      </div>

      <!-- Details Table (mirrors the receipt card) -->
      <div style="margin: 24px 50px 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <!-- Row: Parking Zone -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; border-bottom: 1px solid #f0f0f0; background: #fafafa;">
          <span style="font-size: 15px; color: #6b7280; font-weight: 500;">Parking Zone</span>
          <span style="font-size: 15px; color: #111827; font-weight: 700;">${zone}</span>
        </div>
        <!-- Row: Vehicle Plate -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-size: 15px; color: #6b7280; font-weight: 500;">Vehicle Plate</span>
          <span style="font-size: 15px; color: #111827; font-weight: 800; letter-spacing: 1px;">${plate}</span>
        </div>
        <!-- Row: Vehicle Model -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; border-bottom: 1px solid #f0f0f0; background: #fafafa;">
          <span style="font-size: 15px; color: #6b7280; font-weight: 500;">Vehicle Model</span>
          <span style="font-size: 15px; color: #111827; font-weight: 700;">${model}</span>
        </div>
        <!-- Row: Allotted Slot -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-size: 15px; color: #6b7280; font-weight: 500;">Allotted Slot</span>
          <span style="font-size: 15px; color: #111827; font-weight: 800;">${slot}</span>
        </div>
        <!-- Row: Duration -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; background: #fafafa;">
          <span style="font-size: 15px; color: #6b7280; font-weight: 500;">Duration</span>
          <span style="font-size: 15px; color: #111827; font-weight: 700;">${duration}</span>
        </div>
      </div>

      <!-- Payment Summary Box -->
      <div style="margin: 20px 50px 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="background: #f5f3ff; padding: 14px 28px; border-bottom: 1px solid #ede9fe;">
          <span style="font-size: 13px; font-weight: 800; color: #7c3aed; letter-spacing: 2px; text-transform: uppercase;">Payment Summary</span>
        </div>
        <!-- Base Fare -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 28px; border-bottom: 1px dashed #e5e7eb;">
          <span style="font-size: 14px; color: #9ca3af;">Base Fare</span>
          <span style="font-size: 14px; color: #9ca3af; font-weight: 600;">${baseFare}</span>
        </div>
        <!-- Taxes -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 28px; border-bottom: 1px dashed #e5e7eb;">
          <span style="font-size: 14px; color: #9ca3af;">Taxes &amp; Fees (20%)</span>
          <span style="font-size: 14px; color: #9ca3af; font-weight: 600;">${taxes}</span>
        </div>
        <!-- Payment Status -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 28px; border-bottom: 1px solid #e5e7eb; background: #fafafa;">
          <span style="font-size: 15px; color: #374151; font-weight: 500;">Payment Status</span>
          <span style="font-size: 15px; font-weight: 800; color: ${statusColor}; letter-spacing: 1px;">${payStatus}</span>
        </div>
        <!-- Grand Total -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 28px; background: #1e1b4b;">
          <span style="font-size: 18px; color: #c4b5fd; font-weight: 700;">Grand Total</span>
          <span style="font-size: 28px; color: #a78bfa; font-weight: 900; letter-spacing: -0.5px;">${grandTotal}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin: 32px 50px 0; padding: 20px 0 0; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.8;">
        <div style="font-weight: 700; color: #374151; font-size: 13px; margin-bottom: 4px;">Thank you for choosing ParkEase</div>
        <div>This is a digitally authorized Quantum Permit — do not share with unauthorized persons.</div>
        <div>Support: help@parkease.systems &nbsp;|&nbsp; Secured with RSA-2048 Encryption</div>
      </div>

    </div>
  `;

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = receiptHTML;
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '0';
  tempContainer.style.left = '0';
  tempContainer.style.zIndex = '-9999';
  document.body.appendChild(tempContainer);

  const opt = {
    margin:       0,
    filename:     `ParkEase_Invoice_${plate.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(tempContainer).save();
    showToast('✅ Invoice PDF Generated!');
  } catch (err) {
    console.error("PDF Generation failed", err);
    showToast('⚠️ Error generating PDF.');
  } finally {
    document.body.removeChild(tempContainer);
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

  // Check for scanned data from scanner.html
  const scannedData = localStorage.getItem('parkease_last_scanned');
  if (scannedData) {
    try {
      const data = JSON.parse(scannedData);
      
      // Auto-fill form
      if (document.getElementById('lName')) document.getElementById('lName').value = data.name || '';
      if (document.getElementById('lPlate')) document.getElementById('lPlate').value = data.plate || '';
      if (data.slot) {
        currentSlot = data.slot;
        buildMiniGrid(); // Refresh grid to show selection
      }
      
      // Update receipt UI
      if (document.getElementById('lRcPlate')) document.getElementById('lRcPlate').textContent = data.plate || 'N/A';
      if (document.getElementById('rTotal')) document.getElementById('rTotal').textContent = data.amount || '₹1';
      
      showToast("📋 Scanned Permit Data Loaded");
      
      // Scroll to payment after short delay
      setTimeout(() => {
        document.getElementById('l-pay-sec')?.scrollIntoView({ behavior: 'smooth' });
        localStorage.removeItem('parkease_last_scanned'); // Clear after use
      }, 800);
      
    } catch (e) {
      console.error("Failed to parse scanned data", e);
    }
  }

  // ═══ SCROLL PROGRESS BAR ═══
  const progressBar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && docHeight > 0)
      progressBar.style.width = ((window.scrollY / docHeight) * 100) + '%';
  }, { passive: true });

  // ═══ SCROLL REVEAL OBSERVER ═══
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target); // fire once only
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
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

function toggleMobileNav(show) {
  const nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('active', show);
  document.body.style.overflow = show ? 'hidden' : '';
}
