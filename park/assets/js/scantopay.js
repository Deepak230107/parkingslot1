// User-Friendly Scan-to-Pay for ParkEase
const toast = document.getElementById('toast');
const resultsArea = document.getElementById('results');
const dataArea = document.getElementById('dataRows');
const viewport = document.getElementById('viewport');
const scanStatus = document.getElementById('scanStatus');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const pageTitle = document.getElementById('pageTitle');
const pageSub = document.getElementById('pageSub');
const manualEntry = document.getElementById('manualEntry');

function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function onScanSuccess(decodedText, decodedResult) {
    try {
        const data = JSON.parse(decodedText);
        showToast("Success! Data Captured.");
        activateResults(data);
        html5QrcodeScanner.clear();
    } catch (e) {
        // Handle generic QR
        showToast("Permit Recognized");
        activateResults({
            "name": "Permit Holder",
            "plate": decodedText.substring(0, 10).toUpperCase(),
            "amount": "₹1.00",
            "slot": "Auto-Detect"
        });
        html5QrcodeScanner.clear();
    }
}

function onScanFailure(error) {
    // Keep scanning
}

// Config for laptop & mobile support
let html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
    fps: 15, 
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    rememberLastUsedCamera: true,
    supportedScanTypes: [0, 1] // 0: CAMERA, 1: FILE (Supports laptops with screenshots/images)
});

html5QrcodeScanner.render(onScanSuccess, onScanFailure);

function showManualEntry() {
    viewport.style.display = 'none';
    manualEntry.style.display = 'block';
    pageTitle.textContent = "Manual Access";
    pageSub.textContent = "Enter your parking permit details if you can't use the scanner.";
}

function hideManualEntry() {
    manualEntry.style.display = 'none';
    viewport.style.display = 'block';
    pageTitle.textContent = "Point & Pay";
    pageSub.textContent = "Scan your permit's QR code to proceed to checkout.";
}

function submitManualEntry() {
    const plate = document.getElementById('mPlate').value.trim();
    const name = document.getElementById('mName').value.trim();
    
    if (!plate || !name) {
        showToast("Please fill all fields");
        return;
    }
    
    const data = {
        name: name,
        plate: plate.toUpperCase(),
        amount: "₹1.00",
        slot: "P-" + Math.floor(Math.random() * 8 + 1)
    };
    
    showToast("Access Granted");
    manualEntry.style.display = 'none';
    activateResults(data);
}

function restartScanner() {
    resultsArea.style.display = 'none';
    viewport.style.display = 'block';
    step2.classList.remove('active');
    step1.classList.add('active');
    pageTitle.textContent = "Point & Pay";
    pageSub.textContent = "Scan your permit's QR code to proceed to checkout.";
    
    // Re-render scanner
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function activateResults(data) {
    // UI Transitions
    resultsArea.style.display = 'block';
    viewport.style.display = 'none';
    manualEntry.style.display = 'none';
    
    step1.classList.remove('active');
    step2.classList.add('active');
    
    pageTitle.textContent = "Confirm Details";
    pageSub.textContent = "Please verify your parking details before paying.";

    // Populate Data
    dataArea.innerHTML = '';
    const items = {
        "Owner": data.name || "N/A",
        "License": data.plate || "N/A",
        "Slot": data.slot || "N/A",
        "Amount": data.amount || "₹1.00"
    };

    for (const [k, v] of Object.entries(items)) {
        const r = document.createElement('div');
        r.className = 'p-row';
        r.innerHTML = `<span class="p-k">${k}</span><span class="p-v">${v}</span>`;
        dataArea.appendChild(r);
    }

    window.currentScannedData = data;
}

function proceedToPayment() {
    const data = window.currentScannedData;
    if (!data) return;
    
    showToast("Opening Payment Portal...");
    localStorage.setItem('parkease_last_scanned', JSON.stringify(data));
    
    setTimeout(() => {
        window.location.href = 'index.html#l-pay-sec';
    }, 1200);
}
