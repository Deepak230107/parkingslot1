document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const ctx = document.getElementById('usageChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
            datasets: [{
                label: 'Avg Cars Parked',
                data: [12, 5, 20, 85, 95, 75, 60, 25],
                backgroundColor: 'rgba(245,168,0,0.8)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    const zones = [
        { name: 'Zone B - Central', count: '482' },
        { name: 'Zone A - East Wing', count: '310' },
        { name: 'Zone C - Roof', count: '295' },
        { name: 'Zone D - Basement', count: '141' }
    ];
    const zl = document.getElementById('zoneList');
    zones.forEach(z => {
        zl.innerHTML += `<li>${z.name} <span class="val">${z.count} visits</span></li>`;
    });

    const reps = [
        { name: 'Monthly Financial Audit', span: 'Feb 1 - Feb 28, 2026', by: 'Deepak Y.', format: 'PDF' },
        { name: 'Usage Statistics Q1', span: 'Jan 1 - Feb 28, 2026', by: 'System', format: 'CSV' },
        { name: 'User Management Output', span: 'All Time', by: 'Admin', format: 'Excel' }
    ];
    const tb = document.getElementById('reportTableData');
    reps.forEach(r => {
        tb.innerHTML += `
            <tr>
                <td><strong>${r.name}</strong></td>
                <td>${r.span}</td>
                <td>${r.by}</td>
                <td style="color:var(--gold);font-weight:700;">${r.format}</td>
                <td><a href="#" class="r-dl">⬇ Download</a></td>
            </tr>
        `;
    });
});
