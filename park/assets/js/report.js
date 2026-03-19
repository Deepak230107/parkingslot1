document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const ctx = document.getElementById('usageChart').getContext('2d');
    
    // Create Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#06b6d4'); // Vivid Cyan
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.4)'); // Electric Indigo with opacity

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
            datasets: [{
                label: 'Avg Cars Parked',
                data: [12, 5, 20, 85, 95, 75, 60, 25],
                backgroundColor: gradient,
                borderRadius: 12,
                hoverBackgroundColor: '#06b6d4',
                borderWidth: 0,
                barThickness: 32,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Outfit', size: 14 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} cars`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, 
                    ticks: { color: '#64748b', font: { family: 'Outfit', size: 12 }, padding: 10 } 
                },
                x: { 
                    grid: { display: false, drawBorder: false }, 
                    ticks: { color: '#64748b', font: { family: 'Outfit', size: 12 }, padding: 10 } 
                }
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
        { name: 'Consolidated Revenue Audit', span: 'All Time (Live)', by: 'Admin', format: 'PDF', id: 'live-revenue' },
        { name: 'Monthly Financial Audit', span: 'Feb 1 - Feb 28, 2026', by: 'Deepak Y.', format: 'PDF' },
        { name: 'Usage Statistics Q1', span: 'Jan 1 - Feb 28, 2026', by: 'System', format: 'CSV' },
        { name: 'User Management Output', span: 'All Time', by: 'Admin', format: 'Excel' }
    ];
    const tb = document.getElementById('reportTableData');
    reps.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${r.name}</strong></td>
            <td>${r.span}</td>
            <td>${r.by}</td>
            <td style="color:var(--secondary);font-weight:800;letter-spacing:1px;">${r.format}</td>
            <td><a href="#" class="r-dl" ${r.id ? `onclick="downloadAdminRevenueReport(event)"` : ''}>⬇ Download</a></td>
        `;
        tb.appendChild(row);
    });
});

async function downloadAdminRevenueReport(e) {
    if(e) e.preventDefault();
    console.log("Generating Live Revenue Report...");
    
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
        alert("Admin Backend Offline. Please ensure app.py is running on port 5000.");
    }
}
