document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const pays = [
        { ref: 'TXN891244A', user: 'Arjun S.', amt: '₹1', date: '09 Mar 2026, 14:30', method: 'UPI', status: 'Success' },
        { ref: 'TXN891245B', user: 'Priya M.', amt: '₹1', date: '09 Mar 2026, 12:15', method: 'Card', status: 'Success' },
        { ref: 'TXN891246C', user: 'Guest User', amt: '₹1', date: '09 Mar 2026, 10:05', method: 'Cash', status: 'Pending' },
        { ref: 'TXN891247D', user: 'Arun B.', amt: '₹1', date: '08 Mar 2026, 18:45', method: 'Wallet', status: 'Success' },
    ];

    const tbody = document.getElementById('payTableData');
    if (tbody) {
        pays.forEach(p => {
            const tr = document.createElement('tr');
            const stClass = p.status === 'Success' ? 'success' : 'pending';

            let icon = '💳';
            if (p.method === 'UPI') icon = '📱';
            else if (p.method === 'Cash') icon = '💵';
            else if (p.method === 'Wallet') icon = '👛';

            tr.innerHTML = `
                <td><strong style="color:var(--text);">${p.ref}</strong></td>
                <td>${p.user}</td>
                <td style="color:var(--gold);font-weight:700;">${p.amt}</td>
                <td style="color:#666;">${p.date}</td>
                <td><span class="p-method">${icon} ${p.method}</span></td>
                <td><span class="u-badge ${stClass}">${p.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    const exportBtn = document.querySelector('.u-btn');
    if (exportBtn) {
        exportBtn.textContent = 'Export PDF Report';
        exportBtn.addEventListener('click', async () => {
            console.log("Generating Consolidated Revenue Report...");
            try {
                const response = await fetch('http://127.0.0.1:5000/api/admin/download-report');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ParkEase_Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    alert("No payment data found in SQL database.");
                }
            } catch (err) {
                console.error(err);
                alert("Backend Offline. Please ensure app.py is running on port 5000.");
            }
        });
    }
});
