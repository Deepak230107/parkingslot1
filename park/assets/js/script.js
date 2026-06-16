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
  const plate = document.getElementById('lPlate')?.value.trim() || 'NOT_SPECIFIED';
  const dest = document.getElementById('lDest')?.value || 'Central Park District';
  const duration = document.getElementById('lDuration')?.value || '3';
  const amountStr = document.getElementById('rTotal')?.textContent || '₹1.00';
  
  const numericAmount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 1.00;
  const baseFare = (numericAmount * 0.8).toFixed(2);
  const taxes = (numericAmount * 0.2).toFixed(2);

  // Update receipt fields dynamically in UI
  if (document.getElementById('rcZone')) document.getElementById('rcZone').textContent = dest;
  if (document.getElementById('lRcPlate')) document.getElementById('lRcPlate').textContent = plate.toUpperCase();
  if (document.getElementById('lRcModel')) document.getElementById('lRcModel').textContent = window.currentVehicle || 'Standard Car';
  if (document.getElementById('lRcSlot')) document.getElementById('lRcSlot').textContent = window.lastBookedSlot || 'Pending';
  if (document.getElementById('lRcDuration')) document.getElementById('lRcDuration').textContent = duration + (duration === '1' ? ' Hour' : ' Hours');
  if (document.getElementById('lRcBase')) document.getElementById('lRcBase').textContent = `₹${baseFare}`;
  if (document.getElementById('lRcTax')) document.getElementById('lRcTax').textContent = `₹${taxes}`;

  showToast('📜 Generating full-page PDF Receipt...');

  // Create a clean, A4-sized printable receipt HTML
  const receiptHTML = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 50px; color: #1f2937; width: 800px; min-height: 1050px; background: #ffffff; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="color: #6366f1; margin: 0; font-size: 32px; letter-spacing: -1px;">ParkEase</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Quantum Prismatic Grid Authorized</p>
        </div>
        <div style="text-align: right; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Order #: PE-${Math.floor(100000 + Math.random() * 900000)}</p>
          <p style="margin: 4px 0 0 0;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <hr style="border: none; border-top: 2px solid #6366f1; margin: 30px 0;">
      
      <h2 style="text-align: center; color: #111827; font-size: 24px; letter-spacing: 2px; margin-bottom: 40px;">AUTHORIZATION PERMIT</h2>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px 0; font-weight: bold; color: #4b5563;">Parking Zone</td>
          <td style="padding: 16px 0; text-align: right; color: #111827;">${dest}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px 0; font-weight: bold; color: #4b5563;">Vehicle Plate</td>
          <td style="padding: 16px 0; text-align: right; color: #111827;">${plate.toUpperCase()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px 0; font-weight: bold; color: #4b5563;">Vehicle Model</td>
          <td style="padding: 16px 0; text-align: right; color: #111827;">${window.currentVehicle || 'Standard Car'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px 0; font-weight: bold; color: #4b5563;">Allotted Slot</td>
          <td style="padding: 16px 0; text-align: right; color: #111827; font-weight: bold;">${window.lastBookedSlot || 'Pending'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px 0; font-weight: bold; color: #4b5563;">Duration</td>
          <td style="padding: 16px 0; text-align: right; color: #111827;">${duration} Hours</td>
        </tr>
      </table>
      
      <div style="margin-top: 50px; padding: 30px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; margin-bottom: 20px; color: #334155; font-size: 18px;">Payment Summary</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; color: #475569;">
          <span>Base Fare</span><span>₹${baseFare}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; color: #475569;">
          <span>Taxes & Fees (20%)</span><span>₹${taxes}</span>
        </div>
        <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 22px; color: #6366f1;">
          <span>Grand Total</span><span>₹${numericAmount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 16px; font-weight: bold; font-size: 16px; color: #22c55e;">
          <span>Auth Status</span><span>VERIFIED SUCCESSFUL</span>
        </div>
      </div>
      
      <div style="margin-top: 80px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 30px;">
        <p style="margin: 0 0 8px 0;">Thank you for choosing ParkEase. This is a digitally signed Quantum Permit.</p>
        <p style="margin: 0;">Support: help@parkease.systems | Securely encrypted with RSA-2048</p>
      </div>
    </div>
  `;

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = receiptHTML;
  // Position it to render accurately but hide overflow
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '0';
  tempContainer.style.left = '0';
  tempContainer.style.zIndex = '-9999';
  document.body.appendChild(tempContainer);

  const opt = {
    margin:       0,
    filename:     `ParkEase_Receipt_${plate.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(tempContainer).save();
    showToast('✅ Full-Page Receipt Generated!');
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
