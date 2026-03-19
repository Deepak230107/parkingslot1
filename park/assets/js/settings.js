document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dDateLbl').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const saveBtn = document.getElementById('saveBtn');

    function showToast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'toast show dark-t';
        setTimeout(() => t.className = 'toast dark-t', 2800);
    }

    saveBtn.addEventListener('click', () => {
        saveBtn.textContent = 'Saving...';
        saveBtn.style.opacity = '0.7';

        // Persist Configuration
        const spotCount = document.getElementById('spotCountIn').value;
        localStorage.setItem('parkease_total_slots', spotCount);

        setTimeout(() => {
            saveBtn.textContent = 'Save Changes';
            saveBtn.style.opacity = '1';
            showToast(`✅ Configuration saved! Total slots set to ${spotCount}.`);
        }, 800);
    });

    const inputs = document.querySelectorAll('.form-in, .toggle');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveBtn.style.background = '#f5a800';
            saveBtn.style.color = '#111';
        });
        if (input.classList.contains('toggle')) {
            input.addEventListener('click', () => {
                saveBtn.style.background = '#f5a800';
                saveBtn.style.color = '#111';
            });
        }
    });

});
