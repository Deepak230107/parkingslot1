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
           icon: "../assets/images/favicon.png"
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
  const plate = document.getElementById('lPlate')?.value.trim() || 'NOT_SPECIFIED';
  const dest = document.getElementById('lDest')?.value || 'Central Park District';
  const duration = document.getElementById('lDuration')?.value || '3';
  const amountStr = document.getElementById('rTotal')?.textContent || '₹1.00';
  
  const numericAmount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 1.00;
  const baseFare = (numericAmount * 0.8).toFixed(2);
  const taxes = (numericAmount * 0.2).toFixed(2);
  const vehicle = window.currentVehicle || 'Standard Car';
  const slot = window.lastBookedSlot || 'Pending';
  const payStatus = document.getElementById('payStatus')?.textContent || 'PENDING';
  const payColor = payStatus === 'SUCCESSFUL' ? '#22c55e' : '#a78bfa';
  const orderNum = Math.floor(100000 + Math.random() * 900000);

  // Update receipt UI fields
  if (document.getElementById('rcZone')) document.getElementById('rcZone').textContent = dest;
  if (document.getElementById('lRcPlate')) document.getElementById('lRcPlate').textContent = plate.toUpperCase();
  if (document.getElementById('lRcModel')) document.getElementById('lRcModel').textContent = vehicle;
  if (document.getElementById('lRcSlot')) document.getElementById('lRcSlot').textContent = slot;
  if (document.getElementById('lRcDuration')) document.getElementById('lRcDuration').textContent = duration + (duration === '1' ? ' Hour' : ' Hours');
  if (document.getElementById('lRcBase')) document.getElementById('lRcBase').textContent = `₹${baseFare}`;
  if (document.getElementById('lRcTax')) document.getElementById('lRcTax').textContent = `₹${taxes}`;

  showToast('📜 Generating PDF Receipt...');

  // Build PDF HTML — dark receipt card + white permit
  const detailRows = [
    ['Parking Zone', dest],
    ['Vehicle Plate', plate.toUpperCase()],
    ['Vehicle Model', vehicle],
    ['Allotted Slot', slot],
    ['Duration', `${duration} Hour${duration !== '1' ? 's' : ''}`],
  ];

  const receiptHTML = `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;width:794px;background:#fff;box-sizing:border-box;">

      <!-- ═══ DARK RECEIPT CARD (matches on-screen UI) ═══ -->
      <div style="background:#0f172a;padding:48px 48px 40px;min-height:580px;display:flex;align-items:center;justify-content:center;">
        <div style="width:360px;background:rgba(15,18,40,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:30px;box-shadow:0 40px 80px rgba(0,0,0,0.6);">
          <!-- Header -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;padding-bottom:18px;border-bottom:1px dashed rgba(255,255,255,0.12);">
            <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:22px;">&#x1F4B3;</div>
            <div>
              <div style="font-size:15px;font-weight:800;color:#f1f5f9;">Order #PE-${orderNum}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">Standard 1-Slot License</div>
            </div>
          </div>
          <!-- Detail rows -->
          ${detailRows.map(([k,v]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px dashed rgba(255,255,255,0.07);"><span style="color:#94a3b8;font-size:13px;font-weight:600;">${k}</span><span style="color:#f1f5f9;font-size:13px;font-weight:700;">${v}</span></div>`).join('')}
          <!-- Fare -->
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed rgba(255,255,255,0.07);"><span style="color:#64748b;font-size:12px;">Base Fare</span><span style="color:#94a3b8;font-size:12px;">&#x20B9;${baseFare}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed rgba(255,255,255,0.07);"><span style="color:#64748b;font-size:12px;">Taxes &amp; Fees (20%)</span><span style="color:#94a3b8;font-size:12px;">&#x20B9;${taxes}</span></div>
          <!-- Status -->
          <div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px dashed rgba(255,255,255,0.07);"><span style="color:#94a3b8;font-size:13px;font-weight:600;">Payment Status</span><span style="color:${payColor};font-weight:800;font-size:13px;letter-spacing:1px;">${payStatus}</span></div>
          <!-- Total -->
          <div style="display:flex;justify-content:space-between;padding:18px 0 4px;"><span style="color:#f1f5f9;font-size:15px;font-weight:800;">Grand Total</span><span style="color:#a78bfa;font-size:19px;font-weight:800;">&#x20B9;${numericAmount.toFixed(2)}</span></div>
        </div>
      </div>

      <!-- ═══ WHITE AUTHORIZATION PERMIT ═══ -->
      <div style="background:#fff;padding:50px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h1 style="color:#6366f1;margin:0;font-size:30px;letter-spacing:-1px;">ParkEase</h1>
            <p style="color:#6b7280;font-size:13px;margin-top:4px;">Quantum Prismatic Grid — Authorized Permit</p>
          </div>
          <div style="text-align:right;color:#6b7280;font-size:13px;">
            <p style="margin:0;">Order #: PE-${orderNum}</p>
            <p style="margin:4px 0 0;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <hr style="border:none;border-top:2px solid #6366f1;margin:26px 0;">
        <h2 style="text-align:center;color:#111827;font-size:20px;letter-spacing:2px;margin-bottom:32px;">AUTHORIZATION PERMIT</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${detailRows.map(([k,v]) => `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:14px 0;font-weight:700;color:#4b5563;">${k}</td><td style="padding:14px 0;text-align:right;color:#111827;font-weight:600;">${v}</td></tr>`).join('')}
        </table>
        <div style="margin-top:36px;padding:26px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
          <h3 style="margin:0 0 16px;color:#334155;font-size:16px;">Payment Summary</h3>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#475569;margin-bottom:10px;"><span>Base Fare</span><span>&#x20B9;${baseFare}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#475569;"><span>Taxes &amp; Fees (20%)</span><span>&#x20B9;${taxes}</span></div>
          <hr style="border:none;border-top:1px dashed #cbd5e1;margin:16px 0;">
          <div style="display:flex;justify-content:space-between;font-weight:800;font-size:19px;color:#6366f1;"><span>Grand Total</span><span>&#x20B9;${numericAmount.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;margin-top:12px;font-weight:700;font-size:13px;color:${payColor};"><span>Payment Status</span><span>${payStatus}</span></div>
        </div>
        <div style="margin-top:50px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:22px;">
          <p style="margin:0 0 6px;">Thank you for choosing ParkEase. This is a digitally signed Quantum Permit.</p>
          <p style="margin:0;">Support: help@parkease.systems | Secured with RSA-2048</p>
        </div>
      </div>
    </div>
  `;

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = receiptHTML;
  tempContainer.style.cssText = 'position:absolute;top:0;left:0;z-index:-9999;';
  document.body.appendChild(tempContainer);

  const opt = {
    margin: 0,
    filename: `ParkEase_Receipt_${plate.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
    jsPDF: { unit: 'px', format: [794, 1500], orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(tempContainer).save();
    showToast('✅ Receipt PDF Generated!');
  } catch (err) {
    console.error('PDF Generation failed', err);
    showToast('⚠️ Error generating PDF.');
  } finally {
    document.body.removeChild(tempContainer);
  }
}



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
