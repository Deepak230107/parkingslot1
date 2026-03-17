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
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.05)',
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
            }
        }
    });

    const activities = [
        { icon: '🚗', class: 'd-act-b', title: 'New Reservation', sub: 'TN 09 AX 1234 booked Zone A-04' },
        { icon: '💵', class: 'd-act-g', title: 'Payment Received', sub: '₹1 paid for Full Day (UPI)' },
        { icon: '🚪', class: 'd-act-b', title: 'Vehicle Exit', sub: 'DL 7C E3456 left Zone C-12' },
        { icon: '🚗', class: 'd-act-b', title: 'New Reservation', sub: 'MH 12 CD 9012 booked Zone B-01' }
    ];

    const list = document.getElementById('activityList');
    if(list) {
        activities.forEach((a, index) => {
            const div = document.createElement('div');
            div.className = 'd-activity';
            div.style.opacity = '0';
            div.style.transform = 'translateX(20px)';
            div.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
            
            div.innerHTML = `<div class="d-act-icon ${a.class}">${a.icon}</div>
                             <div class="d-act-info">
                                 <div class="d-act-t">${a.title}</div>
                                 <div class="d-act-s">${a.sub}</div>
                             </div>`;
            list.appendChild(div);
            
            setTimeout(() => {
                div.style.opacity = '1';
                div.style.transform = 'translateX(0)';
            }, 100 + (index * 100));
        });
    }
});
