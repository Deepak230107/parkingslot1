document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const pays = [
        { ref: 'TXN891244A', user: 'Arjun S.', amt: '₹140', date: '09 Mar 2026, 14:30', method: 'UPI', status: 'Success' },
        { ref: 'TXN891245B', user: 'Priya M.', amt: '₹220', date: '09 Mar 2026, 12:15', method: 'Card', status: 'Success' },
        { ref: 'TXN891246C', user: 'Guest User', amt: '₹40', date: '09 Mar 2026, 10:05', method: 'Cash', status: 'Pending' },
        { ref: 'TXN891247D', user: 'Arun B.', amt: '₹75', date: '08 Mar 2026, 18:45', method: 'Wallet', status: 'Success' },
    ];

    const tbody = document.getElementById('payTableData');
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
});
