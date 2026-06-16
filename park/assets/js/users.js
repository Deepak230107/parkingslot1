document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    // ═══ Merge static users with real booking data from localStorage ═══
    const staticUsers = [
        { name: 'Arjun S.', plate: 'TN 09 AX 1234', date: '21 Feb 2026', status: 'Active' },
        { name: 'Priya M.', plate: 'KA 04 BZ 5678', date: '02 Mar 2026', status: 'Active' },
        { name: 'Ravi K.', plate: 'MH 12 CD 9012', date: '15 Jan 2026', status: 'Blocked' },
        { name: 'Kavya T.', plate: 'DL 7C E3456', date: '28 Feb 2026', status: 'Active' },
        { name: 'Arun B.', plate: 'AP 28 FG 7890', date: '05 Mar 2026', status: 'Active' },
        { name: 'Deepa R.', plate: 'TS 11 HI 2345', date: '01 Feb 2026', status: 'Active' }
    ];

    // Pull real bookings from localStorage (set by confirmReservation in index.html)
    const bookings = JSON.parse(localStorage.getItem('parkease_bookings') || '[]');
    const sessions = JSON.parse(localStorage.getItem('user_active_sessions') || '[]');

    const dynamicUsers = [];
    const seenPlates = new Set(staticUsers.map(u => u.plate.replace(/\s/g, '').toUpperCase()));

    [...bookings, ...sessions].forEach(b => {
        if (!b.plate) return;
        const normPlate = b.plate.replace(/\s/g, '').toUpperCase();
        if (!seenPlates.has(normPlate)) {
            seenPlates.add(normPlate);
            dynamicUsers.push({
                name: b.user || b.name || 'Guest User',
                plate: b.plate,
                date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                status: 'Active'
            });
        }
    });

    const users = [...dynamicUsers, ...staticUsers];

    const tbody = document.getElementById('userTableData');
    if (tbody) {
        users.forEach(u => {
            const tr = document.createElement('tr');
            const stClass = u.status === 'Active' ? 'active' : 'blocked';
            tr.innerHTML = `
                <td><strong>${u.name}</strong></td>
                <td style="color:#666;">${u.plate}</td>
                <td style="color:#888;">${u.date}</td>
                <td><span class="u-badge ${stClass}">${u.status}</span></td>
                <td><button class="u-act">${u.status === 'Active' ? 'Block' : 'Unblock'}</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.u-act').forEach(btn => {
            btn.addEventListener('click', function () {
                if (this.textContent === 'Block') {
                    this.textContent = 'Unblock';
                    this.parentElement.previousElementSibling.innerHTML = '<span class="u-badge blocked">Blocked</span>';
                } else {
                    this.textContent = 'Block';
                    this.parentElement.previousElementSibling.innerHTML = '<span class="u-badge active">Active</span>';
                }
            });
        });
    }

    const exportBtn = document.querySelector('.u-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            console.log("Opening User Engagement Report...");
            window.open('export_users.html', '_blank');
        });
    }
});
