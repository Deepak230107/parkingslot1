// ════════════════════════════════════════════════════
//  ParkEase — Parking Expiry Notification System
//  Sends browser push notification + shows alert modal
//  when ≤ 30 min remain on the user's parking session.
// ════════════════════════════════════════════════════

let parkEndTime   = null;   // JS Date of session end
let countdownInterval = null;
let alertFired    = false;  // so 30-min alert fires only once
let extendCount   = 0;      // how many times user extended
let alertsEnabled = false;  // did user enable alerts?
let userPhone     = '';     // mobile number for display

// ── Confirm Reservation ──────────────────────────────
function confirmReservation() {
  const arrivalInput = document.getElementById('lArrival');
  const durSelect    = document.getElementById('lDur');
  const dateInput    = document.getElementById('lDate');

  const arrival = arrivalInput ? arrivalInput.value : '09:00';
  const dateVal = dateInput    ? dateInput.value    : new Date().toISOString().split('T')[0];
  const selOpt  = durSelect    ? durSelect.options[durSelect.selectedIndex] : null;
  const hrs     = selOpt       ? parseFloat(selOpt.dataset.hrs || 1) : 1;

  // Build end time from date + arrival + duration
  const [h, m]  = arrival.split(':').map(Number);
  const start   = new Date(`${dateVal}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  parkEndTime   = new Date(start.getTime() + hrs * 3600 * 1000);

  // If start time is in the past (e.g. today, past hour), shift to NOW + duration
  if (parkEndTime < new Date()) {
    parkEndTime = new Date(Date.now() + hrs * 3600 * 1000);
  }

  alertFired    = false;
  extendCount   = 0;

  // Show countdown ribbon
  const ribbon = document.getElementById('parkCountdown');
  const plate  = document.getElementById('lPlate')?.value || 'your vehicle';
  document.getElementById('pkSlotLabel').textContent = `${plate} · B2-14`;
  ribbon.style.display = 'flex';

  startCountdown();
  lScroll('l-pay-sec', null);
  showToast('✅ Reservation confirmed! Alerts active.', 'dark-t');
}

// ── Start / Stop Live Countdown ─────────────────────
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(tickCountdown, 1000);
  tickCountdown(); // immediate first tick
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
  document.getElementById('parkCountdown').style.display = 'none';
  parkEndTime = null;
  alertFired  = false;
  showToast('Parking session ended.', 'light-t');
}

function tickCountdown() {
  if (!parkEndTime) return;

  const now      = new Date();
  const diffMs   = parkEndTime - now;

  if (diffMs <= 0) {
    // Session expired
    document.getElementById('pkTimer').textContent = '00:00:00';
    document.getElementById('pkTimer').style.color = '#ef4444';
    clearInterval(countdownInterval);
    fireExpiryAlert(0);
    return;
  }

  const totalSec = Math.floor(diffMs / 1000);
  const hh       = Math.floor(totalSec / 3600);
  const mm       = Math.floor((totalSec % 3600) / 60);
  const ss       = totalSec % 60;

  const fmt = (n) => String(n).padStart(2, '0');
  document.getElementById('pkTimer').textContent = `${fmt(hh)}:${fmt(mm)}:${fmt(ss)}`;

  // Colour changes as time shrinks
  const timerEl = document.getElementById('pkTimer');
  if (totalSec <= 1800) {        // ≤ 30 min
    timerEl.style.color = '#f59e0b';
  }
  if (totalSec <= 300) {         // ≤ 5 min
    timerEl.style.color = '#ef4444';
    timerEl.style.animation = 'timerPulse 0.6s ease-in-out infinite alternate';
  }

  // ── Fire 30-minute warning ──
  if (!alertFired && totalSec <= 1800) {
    alertFired = true;
    const minLeft = Math.floor(totalSec / 60);
    fireExpiryAlert(minLeft);
  }
}

// ── Fire the Expiry Alert ────────────────────────────
function fireExpiryAlert(minutesLeft) {
  const isExpired = minutesLeft <= 0;
  const plate     = document.getElementById('lPlate')?.value || 'your vehicle';
  const msg       = isExpired
    ? `⛔ Parking for ${plate} has EXPIRED! Please move your vehicle immediately.`
    : `Your parking for ${plate} expires in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Move or extend now.`;

  // 1️⃣ Browser Push Notification (works on Android Chrome / desktop)
  sendBrowserNotification(
    isExpired ? '⛔ Parking Expired!' : '⚠️ Parking Expiring Soon!',
    msg
  );

  // 2️⃣ In-app Alert Modal
  if (!isExpired) {
    openAlertModal(minutesLeft, msg);
  } else {
    showExpiredBanner(msg);
  }

  // 3️⃣ Vibration (mobile)
  if (navigator.vibrate) {
    navigator.vibrate(isExpired ? [200, 100, 200, 100, 400] : [200, 100, 200]);
  }

  // 4️⃣ Audio beep
  playAlertBeep(isExpired);

  // 5️⃣ SMS-style toast with phone number
  if (userPhone) {
    showToast(`📱 Alert sent to ${userPhone}`, 'dark-t');
  }
}

// ── Browser Push Notification ────────────────────────
function sendBrowserNotification(title, body) {
  if (!('Notification' in window)) return;

  const plate  = document.getElementById('lPlate')?.value || 'vehicle';

  if (Notification.permission === 'granted') {
    const notif = new Notification(title, {
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
      tag: 'parkease-alert',
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
      openAlertModal(30, body);
    };
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') sendBrowserNotification(title, body);
    });
  }
}

// ── Enable Alerts (request permission + save phone) ──
function enableParkingAlerts() {
  const phoneEl = document.getElementById('lPhone');
  const phone   = phoneEl ? phoneEl.value.trim() : '';
  const btn     = document.getElementById('btnEnableAlert');

  if (!phone || phone.length < 10) {
    phoneEl.style.borderColor = '#ef4444';
    showToast('⚠️ Please enter a valid mobile number first.', 'dark-t');
    setTimeout(() => { phoneEl.style.borderColor = ''; }, 2000);
    return;
  }

  userPhone     = phone;
  alertsEnabled = true;

  // Request browser notification permission
  if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') {
        btn.textContent = '✅ Alerts Enabled';
        btn.style.background = 'rgba(34,197,94,0.15)';
        btn.style.borderColor = 'rgba(34,197,94,0.5)';
        btn.style.color = '#22c55e';
        showToast(`🔔 Alerts enabled for ${phone}`, 'dark-t');
        // Demo: send a confirmation notification
        new Notification('ParkEase Alerts Active 🅿️', {
          body: `You'll be notified 30 mins before your parking expires.`,
          icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
        });
      } else {
        btn.textContent = '⚠️ In-App Alerts Only';
        btn.style.background = 'rgba(245,168,0,0.1)';
        showToast('Notifications blocked. In-app alerts will still work.', 'light-t');
      }
    });
  } else if (!('Notification' in window)) {
    btn.textContent = '✅ In-App Alerts Enabled';
    btn.style.background = 'rgba(34,197,94,0.15)';
    showToast(`🔔 In-app alerts enabled for ${phone}`, 'dark-t');
  } else {
    showToast('Notifications blocked by browser. In-app modal will still fire.', 'light-t');
    btn.textContent = '✅ In-App Alerts Only';
  }
}

// ── Alert Modal ──────────────────────────────────────
function openAlertModal(minutesLeft, bodyMsg) {
  const overlay = document.getElementById('alertOverlay');
  document.getElementById('alertModalBody').textContent = bodyMsg || `Your parking expires in ${minutesLeft} minutes. Move or extend now.`;
  document.getElementById('amiCountdown').textContent   = `${String(minutesLeft).padStart(2,'0')}:00`;
  overlay.style.display = 'flex';
  // Animate in
  setTimeout(() => overlay.querySelector('.alert-modal').style.transform = 'scale(1)', 10);

  // Live countdown inside modal
  let sec = minutesLeft * 60;
  const iv = setInterval(() => {
    if (sec <= 0) { clearInterval(iv); return; }
    sec--;
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    document.getElementById('amiCountdown').textContent =
      `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }, 1000);
}

function closeAlertModal() {
  const overlay = document.getElementById('alertOverlay');
  const modal   = overlay.querySelector('.alert-modal');
  modal.style.transform = 'scale(0.9)';
  modal.style.opacity   = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    modal.style.transform = '';
    modal.style.opacity   = '';
  }, 300);
}

// ── Expired banner (full session ended) ─────────────
function showExpiredBanner(msg) {
  const overlay = document.getElementById('alertOverlay');
  document.getElementById('alertModalBody').textContent  = msg;
  document.getElementById('amiCountdown').textContent    = '00:00';
  document.getElementById('amiCountdown').style.color    = '#ef4444';
  overlay.querySelector('.alert-modal-pulse').style.background = 'rgba(239,68,68,0.18)';
  overlay.style.display = 'flex';
}

// ── Extend Parking (adds 30 min) ─────────────────────
function extendParking() {
  if (!parkEndTime) {
    showToast('No active session to extend.', 'light-t');
    return;
  }
  extendCount++;
  parkEndTime = new Date(parkEndTime.getTime() + 30 * 60 * 1000);
  alertFired  = false; // re-arm the 30-min alert for the new end time
  document.getElementById('pkTimer').style.color = '#f5a800';
  document.getElementById('pkTimer').style.animation = '';
  showToast(`⏱️ Session extended by 30 min (Ext #${extendCount})`, 'dark-t');
}

// ── Alert Beep ───────────────────────────────────────
function playAlertBeep(isExpired = false) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = 'sine';
    osc.frequency.setValueAtTime(isExpired ? 880 : 660, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    osc.start(ctx.currentTime);

    if (isExpired) {
      // triple beep for expired
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isExpired ? 0.6 : 0.4));
    osc.stop(ctx.currentTime + (isExpired ? 0.65 : 0.45));
  } catch(e) { /* AudioContext not allowed without interaction */ }
}

// ── DEMO: Trigger a test alert right now ─────────────
// (call testAlert() from console to demo the UI)
function testAlert() {
  parkEndTime   = new Date(Date.now() + 29 * 60 * 1000); // 29 min from now
  alertFired    = false;
  extendCount   = 0;
  const ribbon  = document.getElementById('parkCountdown');
  document.getElementById('pkSlotLabel').textContent = 'TN09AX1234 · B2-14';
  ribbon.style.display = 'flex';
  startCountdown();
  showToast('🔔 Demo alert will fire in ~1 minute (skipping to 30-min mark)…', 'dark-t');
  // Force-fire immediately for demo
  setTimeout(() => fireExpiryAlert(29), 1500);
}
