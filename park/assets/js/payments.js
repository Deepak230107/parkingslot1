document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    // ═══ Load transactions from localStorage (synced from user bookings & backend) ═══
    function getTransactions() {
        // Try to load from user_active_sessions (populated on payment)
        const sessions = JSON.parse(localStorage.getItem('user_active_sessions') || '[]');
        const bookings = JSON.parse(localStorage.getItem('parkease_bookings') || '[]');

        const dynamic = sessions.map((s, i) => ({
            ref: `TXN${900000 + i}${String.fromCharCode(65 + (i % 26))}`,
            user: s.name || 'Guest User',
            amt: '₹1',
            date: s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + (s.time || '00:00') : new Date().toLocaleString('en-IN'),
            method: 'UPI',
            status: 'Success',
            slot: s.slot || '—'
        }));

        // Fallback static data if nothing is in localStorage
        const staticData = [
            { ref: 'TXN891244A', user: 'Arjun S.', amt: '₹1', date: '09 Jun 2026, 14:30', method: 'UPI', status: 'Success', slot: 'B2-A01' },
            { ref: 'TXN891245B', user: 'Priya M.', amt: '₹1', date: '09 Jun 2026, 12:15', method: 'Card', status: 'Success', slot: 'B2-A03' },
            { ref: 'TXN891246C', user: 'Guest User', amt: '₹1', date: '09 Jun 2026, 10:05', method: 'Cash', status: 'Pending', slot: 'B2-A05' },
            { ref: 'TXN891247D', user: 'Arun B.', amt: '₹1', date: '08 Jun 2026, 18:45', method: 'Wallet', status: 'Success', slot: 'B2-A07' },
        ];

        return dynamic.length > 0 ? [...dynamic, ...staticData] : staticData;
    }

    const pays = getTransactions();
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

    // ═══ Export PDF Report Button ═══
    const exportBtn = document.querySelector('.u-btn');
    if (exportBtn) {
        exportBtn.textContent = 'Export PDF Report';
        exportBtn.addEventListener('click', async () => {
            console.log("Opening Consolidated Revenue Report...");
            window.open('export_revenue.html', '_blank');
        });
    }

    // ═══ Try to load live data from backend as well ═══
    fetch('http://127.0.0.1:5000/api/get-transactions')
        .then(r => r.json())
        .then(remoteData => {
            if (remoteData && remoteData.length > 0 && tbody) {
                tbody.innerHTML = ''; // Clear and repopulate with live data
                remoteData.forEach((p, i) => {
                    const tr = document.createElement('tr');
                    const stClass = (p.status || 'SUCCESS').toLowerCase().includes('success') ? 'success' : 'pending';
                    let icon = '💳';
                    if ((p.type || '').toLowerCase().includes('upi')) icon = '📱';
                    else if ((p.type || '').toLowerCase().includes('cash')) icon = '💵';
                    tr.innerHTML = `
                        <td><strong style="color:var(--text);">TXN${900000 + i}${String.fromCharCode(65 + (i % 26))}</strong></td>
                        <td>${p.name || 'Guest'}</td>
                        <td style="color:var(--gold);font-weight:700;">${p.amount || '₹1'}</td>
                        <td style="color:#666;">${p.date || ''} ${p.time || ''}</td>
                        <td><span class="p-method">${icon} ${p.type || 'UPI'}</span></td>
                        <td><span class="u-badge ${stClass}">${p.status || 'SUCCESS'}</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(() => {
            console.log("Backend offline — showing localStorage/static data.");
        });
});
