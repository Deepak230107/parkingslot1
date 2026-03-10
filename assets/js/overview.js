document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [4200, 5100, 4800, 6300, 5900, 8200, 7500],
                borderColor: '#f5a800',
                backgroundColor: 'rgba(245,168,0,0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#f5a800'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    const activities = [
        { icon: '🚗', class: 'd-act-b', title: 'New Reservation', sub: 'TN 09 AX 1234 booked Zone A-04' },
        { icon: '💵', class: 'd-act-g', title: 'Payment Received', sub: '₹220 paid for Full Day (UPI)' },
        { icon: '🚪', class: 'd-act-b', title: 'Vehicle Exit', sub: 'DL 7C E3456 left Zone C-12' },
        { icon: '🚗', class: 'd-act-b', title: 'New Reservation', sub: 'MH 12 CD 9012 booked Zone B-01' }
    ];

    const list = document.getElementById('activityList');
    activities.forEach(a => {
        const div = document.createElement('div');
        div.className = 'd-activity';
        div.innerHTML = `<div class="d-act-icon ${a.class}">${a.icon}</div>
                         <div class="d-act-info">
                             <div class="d-act-t">${a.title}</div>
                             <div class="d-act-s">${a.sub}</div>
                         </div>`;
        list.appendChild(div);
    });
});
