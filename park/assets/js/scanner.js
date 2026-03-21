// QR Scanner Logic for ParkEase Admin
const toast = document.getElementById('toast');
const scanResult = document.getElementById('scanResult');
const resultDetails = document.getElementById('resultDetails');

function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function onScanSuccess(decodedText, decodedResult) {
    try {
        const data = JSON.parse(decodedText);
        displayResult(data);
        showToast("Permit Scanned Successfully!");
        html5QrcodeScanner.clear();
    } catch (e) {
        displayResult({
            "Raw Data": decodedText,
            "Type": "Custom Permit"
        });
        html5QrcodeScanner.clear();
    }
}

function onScanFailure(error) {
    // console.warn(`Code scan error = ${error}`);
}

let html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
    fps: 10, 
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
});

html5QrcodeScanner.render(onScanSuccess, onScanFailure);

function displayResult(data) {
    scanResult.style.display = 'block';
    resultDetails.innerHTML = '';
    
    for (const [key, value] of Object.entries(data)) {
        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `
            <span class="result-k">${key.toUpperCase()}</span>
            <span class="result-v">${value}</span>
        `;
        resultDetails.appendChild(row);
    }
    
    window.currentScannedData = data;
}

async function confirmCheckIn() {
    const data = window.currentScannedData;
    if (!data) return;
    showToast(`Check-in Confirmed: ${data.plate || 'User'}`);
    setTimeout(() => { location.reload(); }, 2000);
}

function proceedToPayment() {
    const data = window.currentScannedData;
    if (!data) return;
    showToast("Opening Payment Gateway...");
    
    // Store scanned data for index.html to read
    localStorage.setItem('parkease_last_scanned', JSON.stringify(data));
    
    setTimeout(() => {
        window.location.href = 'index.html#l-pay-sec';
    }, 1000);
}

const dLbl = document.getElementById('dDateLbl');
if (dLbl) {
    dLbl.textContent = new Date().toLocaleDateString('en-IN', { 
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
    });
}
