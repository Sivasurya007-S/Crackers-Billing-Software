async function loadTab(page, tabId, title) {
    try {
        const response = await fetch(page);
        const html = await response.text();
        document.getElementById("content").innerHTML = html;

        // Run scripts inside the page dynamically
        const scripts = document.getElementById("content").querySelectorAll("script");
        scripts.forEach(oldScript => {
            const newScript = document.createElement("script");
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
        });

        // Set sidebar nav item active
        const items = document.querySelectorAll('.sidebar-item');
        items.forEach(item => {
            item.classList.remove('active');
        });
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Set top header title
        const titleEl = document.getElementById('current-tab-title');
        if (titleEl) {
            titleEl.innerText = title;
        }

    } catch (err) {
        console.error(err);
        document.getElementById("content").innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #ef4444;">
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️ View Load Failure</h2>
                <p style="color: var(--text-muted);">${err.message}</p>
            </div>
        `;
    }
}

// Global clock handler
function initSystemClock() {
    const timeEl = document.getElementById('system-time');
    const dateEl = document.getElementById('system-date');

    if (!timeEl || !dateEl) return;

    function update() {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        dateEl.innerText = now.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    update();
    setInterval(update, 1000);
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
    initSystemClock();
    loadTab('dashboard-home.html', 'nav-dashboard-home', 'Dashboard');
});