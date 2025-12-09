class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date(); // Defaults to today
        this.events = {}; // { "YYYY-MM-DD": [ { id, title, time, color, description } ] }
        this.currentView = 'month'; // 'month', 'week', 'focus'

        // Load events then render
        this.loadEvents();
        // Assuming initTheme() is a new method or intended to be added elsewhere,
        // as it's not present in the original code. For now, I'll comment it out
        // or assume it's a placeholder for a future addition.
        // If it's meant to replace the dark-theme logic, that needs to be clarified.
        // For now, I'll keep the existing dark-theme logic and add initTheme() as a placeholder.
        this.initTheme(); // Placeholder for new theme initialization

        // Start Clock Immediately
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Orbital positions: [x, y, size] (relative to container center)
        // Shifted UP (more negative y) to align better
        this.orbitalPositions = [
            { x: -140, y: -100, s: 50 }, // Far Left
            { x: -80, y: -140, s: 60 },  // Mid Left
            { x: -50, y: -80, s: 50 },   // Near Left Low
            { x: 0, y: -20, s: 100 },    // CENTER (Active) - Was 30
            { x: 60, y: -130, s: 60 },   // Mid Right
            { x: 130, y: -90, s: 50 },   // Far Right
            { x: 100, y: -40, s: 45 },   // Near Right Low
        ];

        this.init(); // Restore Initialization
    }

    init() {
        this.loadEvents();
        this.setupEventListeners();

        // Force Dark Theme for this specific design
        document.body.classList.add('dark-theme');

        // Start in Month view logic, switch handled by UI
        this.render();
    }

    setupEventListeners() {
        // Navigation (Header arrows)
        document.getElementById('prevBtn').addEventListener('click', () => this.navigate('prev'));
        document.getElementById('nextBtn').addEventListener('click', () => this.navigate('next'));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // View Switching (Bottom Nav)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (!view) return; // Ignore if settings etc
                this.switchView(view);
            });
        });

        // FAB & Modals
        document.getElementById('fabBtn').addEventListener('click', () => this.openAddEventPanel());
        document.getElementById('closePanel').addEventListener('click', () => this.closePanel());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closePanel());
        document.getElementById('eventForm').addEventListener('submit', (e) => this.saveEvent(e));
        document.getElementById('closeDetailsPanel').addEventListener('click', () => this.closeDetailsPanel());
        document.getElementById('backdrop').addEventListener('click', () => { this.closePanel(); this.closeDetailsPanel(); });
    }

    /* ========== NAVIGATION ========== */
    switchView(viewName) {
        this.currentView = viewName;

        // Update Nav UI
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Update View Containers
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        const viewContainer = document.getElementById(`view-${viewName}`);
        if (viewContainer) viewContainer.classList.add('active');

        this.render();
    }

    navigate(direction) {
        const offset = direction === 'next' ? 1 : -1;
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + offset);
        } else if (this.currentView === 'week') {
            // Move by 1 DAY in orbital view to rotate the wheel
            this.selectedDate.setDate(this.selectedDate.getDate() + offset);
            this.currentDate = new Date(this.selectedDate); // Sync
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + offset);
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.render();
    }

    /* ========== RENDERING ========== */
    render() {
        this.updateHeader();
        if (this.currentView === 'month') this.renderMonth();
        else if (this.currentView === 'week') this.renderWeekOrbital();
        else if (this.currentView === 'focus') this.renderFocus();
    }

    updateHeader() {
        const options = { month: 'long', year: 'numeric' };
        document.getElementById('monthYear').textContent = this.currentDate.toLocaleDateString('en-US', options);
    }

    /* ORBITAL WEEK BUBBLE RENDERER (User Design) */
    renderWeekOrbital() {
        const container = document.getElementById('orbitalDatesLayer');
        container.innerHTML = '';

        // Positions based on the screenshot/snippet logic
        // Center is 50, 50 (approx). 
        // We will maintain the "7 days" logic but with the new positions.
        // Center (Index 3)
        // Neighbors: 2 left, 2 right, + 2 outer?

        // Config: [top%, left%, scale]
        // Center: 33% top, 50% left (large)
        const posConfig = [
            { t: 33, l: 25, s: 'small' },   // -3 (Far Left)
            { t: 40, l: 15, s: 'small' },   // -2 (Lower Left)
            { t: 25, l: 30, s: 'medium' },  // -1 (Near Left/Top)
            { t: 33, l: 50, s: 'large' },   //  0 (CENTER)
            { t: 25, l: 70, s: 'medium' },  // +1 (Near Right/Top)
            { t: 33, l: 75, s: 'small' },   // +2 (Far Right)
            { t: 50, l: 50, s: 'small' },   // +3 (Bottom Center - obscured usually) -> Let's move it
        ];

        // Let's stick to the visual interaction: Horizontal scatter
        // Positions (Relative to the .orbital-container)
        // Center is roughly 50% left, 40% top
        const scatter = [
            { t: 45, l: 15, s: 'small' },   // Far Left 
            { t: 30, l: 28, s: 'small' },   // Mid Left
            { t: 40, l: 38, s: 'small' },   // Near Left
            { t: 40, l: 50, s: 'large' },   // Center
            { t: 40, l: 62, s: 'small' },   // Near Right
            { t: 30, l: 72, s: 'small' },   // Mid Right
            { t: 45, l: 85, s: 'small' }    // Far Right
        ];

        const centerDate = new Date(this.selectedDate);

        // If we are NOT animating out, just render. 
        // We will assume render is called fresh.
        // To support "Animate Out", we need to handle it in the Click listener, not here.
        // But here we can add "Pop In" for new elements.

        container.innerHTML = '';

        for (let i = 0; i < 7; i++) {
            const offset = i - 3;
            const d = new Date(centerDate);
            d.setDate(centerDate.getDate() + offset);

            const p = scatter[i];
            const isActive = i === 3;

            // Create Bubble
            const bubble = document.createElement('div');
            bubble.className = `user-bubble ${isActive ? 'active' : 'small'}`;

            // Initial Style
            bubble.style.top = `${p.t}%`;
            bubble.style.left = `${p.l}%`;
            bubble.style.transform = `translate(-50%, -50%)`; // Base transform

            // Add Animation Class with Delay
            bubble.classList.add('pop-in');
            bubble.style.animationDelay = `${i * 0.05} s`;

            bubble.innerHTML = `
    <span class="bubble-day-label">${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        <span class="bubble-date-num">${d.getDate()}</span>
`;

            bubble.addEventListener('click', (e) => {
                // Prevent double clicking
                if (bubble.classList.contains('active')) return;

                // 1. Play Exit Animation on ALL Bubbles
                const all = container.querySelectorAll('.user-bubble');
                all.forEach(b => {
                    b.classList.remove('pop-in');
                    b.classList.add('pop-out');
                });

                // 2. Wait, then Switch & Re-render
                setTimeout(() => {
                    this.selectedDate = d;
                    this.currentDate = d;
                    this.render();
                }, 300); // Matches .pop-out duration
            });

            container.appendChild(bubble);
        }

        this.renderOrbitalEventsUser(centerDate);
    }

    // Configured for the User's "Timeline Sheet"
    renderOrbitalEventsUser(date) {
        const content = document.getElementById('weekSheetContent');
        content.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.innerHTML = `
    <h2 class="sheet-header-title">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
        `;
        content.appendChild(header);

        const dateStr = this.formatDate(date);
        const events = this.getEventsForDay(dateStr);

        if (events.length > 0) {
            header.innerHTML += `<p class="sheet-header-sub">${events.length} events scheduled</p>`;

            const list = document.createElement('div');
            list.className = 'sheet-events-list';

            events.forEach((evt, index) => {
                const row = document.createElement('div');
                row.className = 'timeline-event';

                // Color mapping if needed, or default primary
                const colorVar = evt.color === 'purple' ? 'var(--primary)' :
                    evt.color === 'green' ? '#10b981' :
                        evt.color === 'blue' ? '#3b82f6' :
                            evt.color === 'red' ? '#ef4444' : 'var(--primary)';

                row.innerHTML = `
    <div class="timeline-bar" style="background: ${colorVar}; height: auto; min-height: 50px;"></div>
        <div class="timeline-content">
            <div class="t-title">${evt.title}</div>
            <div class="t-time">${evt.time || 'All Day'}</div>
            <div class="t-loc">${evt.description || 'No details'}</div>
        </div>
`;

                // CLICK TO VIEW DETAILS / DELETE
                row.style.cursor = 'pointer';
                row.addEventListener('click', () => this.openDetailsPanel(evt, dateStr, index));

                list.appendChild(row);
            });
            content.appendChild(list);
        } else {
            header.innerHTML += `<p class="sheet-header-sub">No events scheduled</p>`;
        }
    }

    // New: Open Details with Delete Option
    openDetailsPanel(event, dateStr, index) {
        const panel = document.getElementById('eventDetailsPanel');
        const details = document.getElementById('eventDetails');

        details.innerHTML = `
    <div class="detail-group">
                <label>Event</label>
                <h2>${event.title}</h2>
            </div>
            <div class="detail-group">
                <label>Time</label>
                <p>${event.time || 'All Day'}</p>
            </div>
             <div class="detail-group">
                <label>Description</label>
                <p>${event.description || 'No description provided.'}</p>
            </div>
            <div class="form-actions" style="margin-top: 24px;">
                <button class="btn btn-text" id="closeDetailsBtn">Close</button>
                <button class="btn btn-text" id="editEventBtn" style="color:var(--primary)">Edit</button>
                <button class="btn" id="deleteEventBtn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5);">Delete</button>
            </div>
`;

        panel.classList.add('active');
        document.getElementById('backdrop').classList.add('active');

        // Handlers
        document.getElementById('closeDetailsBtn').onclick = () => this.closeDetailsPanel();
        document.getElementById('editEventBtn').onclick = () => this.editEvent(event, dateStr);
        document.getElementById('deleteEventBtn').onclick = () => this.deleteEvent(dateStr, index);
        document.getElementById('closeDetailsPanel').onclick = () => this.closeDetailsPanel();
    }

    deleteEvent(dateStr, index) {
        if (!confirm('Delete this event?')) return;
        this.events[dateStr].splice(index, 1);
        if (this.events[dateStr].length === 0) delete this.events[dateStr];

        this.saveEvents();
        this.closeDetailsPanel();
        this.render(); // Re-render to update list
    }

    initTheme() {
        // Placeholder for theme logic if needed, prevents crash
    }

    /* MONTH VIEW RENDERER (Classic) */
    renderMonth() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Padding Days
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dateStr = this.formatDate(d);
            const evts = this.getEventsForDay(dateStr);

            const cell = document.createElement('div');
            cell.className = 'day';
            if (this.formatDate(d) === this.formatDate(new Date())) cell.classList.add('today');

            cell.innerHTML = `<div class="day-number">${i}</div>`;
            if (evts.length) {
                const dots = document.createElement('div');
                dots.className = 'day-events';
                evts.slice(0, 3).forEach(e => {
                    dots.innerHTML += `<div class="event-dot ${e.color}"></div>`;
                });
                cell.appendChild(dots);
            }

            cell.addEventListener('click', () => {
                this.selectDay(d, evts);
            });
            grid.appendChild(cell);
        }
    }

    /* FOCUS VIEW RENDERER (Space Carousel) */
    renderFocus(targetDate = null) {
        // Use provided date or default to 'currentDate' (or Today if we want Focus to always be Today initially)
        // Let's use this.selectedDate if available, else new Date()
        const date = targetDate || this.selectedDate || new Date();
        const events = this.getEventsForDay(this.formatDate(date));

        const container = document.getElementById('focusCarousel');
        const headerContainer = document.querySelector('.focus-header'); // Use class selector for flex container

        if (!container) return; // Guard clause

        // 1. Update Header (With Nav Buttons)
        if (headerContainer) {
            headerContainer.innerHTML = `
    <button class="focus-nav-btn" id="prevDayBtn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div style="text-align:center">
                    <h1 id="focusDateTitle" style="margin:0; line-height:1.2">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h1>
                    <p id="focusDateSubtitle" style="margin:0; margin-top:4px">${events.length > 0 ? `${events.length} events` : 'No events'}</p>
                </div>
                <button class="focus-nav-btn" id="nextDayBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
`;

            // Add Nav Listeners
            document.getElementById('prevDayBtn').onclick = () => {
                const prev = new Date(date);
                prev.setDate(date.getDate() - 1);
                this.renderFocus(prev);
            };
            document.getElementById('nextDayBtn').onclick = () => {
                const next = new Date(date);
                next.setDate(date.getDate() + 1);
                this.renderFocus(next);
            };
        }

        // 2. Render Cards
        container.innerHTML = '';

        if (events.length === 0) {
            // Empty State Card
            container.innerHTML = `
    <div class="focus-card empty">
        <div>
            <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
            </div>
            <h3 class="card-title" style="font-size:20px; margin-bottom:8px">Free Day</h3>
            <p class="card-desc">No plans yet. Time to relax or get creative!</p>
        </div>
                </div>
    `;
        } else {
            // Event Cards
            events.forEach(evt => {
                const card = document.createElement('div');
                card.className = `focus-card ${evt.color || 'purple'}`;

                card.innerHTML = `
    <div class="card-time">
        <div class="card-icon"></div>
                        ${evt.time || 'All Day'}
                    </div>
    <div>
        <h3 class="card-title">${evt.title}</h3>
        <p class="card-desc">${evt.description || 'No description provided.'}</p>
    </div>
`;

                // Add Interaction
                card.style.cursor = 'pointer';
                const dateStr = this.formatDate(date);
                // We need the index. events.indexOf(evt) might be unsafe if duplicates, but for now it's fine or we pass index in forEach
                card.onclick = () => this.openDetailsPanel(evt, dateStr, events.indexOf(evt));

                container.appendChild(card);
            });
        }
    }

    /* HELPERS */
    selectDay(date, events) {
        this.selectedDate = date;
        if (events && events.length > 0) {
            // Switch to week view to see details in this new design? 
            // Or use the old panel? 
            // Reference image implies Week View IS the details view.
            this.switchView('week');
        } else {
            this.openAddEventPanel(date);
        }
    }

    openAddEventPanel(date = null) {
        this.currentEditId = null; // Reset edit state
        const targetDate = date || this.selectedDate || new Date();
        document.getElementById('eventDate').value = this.formatDate(targetDate);

        // Clear previous inputs
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventDescription').value = '';

        document.getElementById('eventPanel').classList.add('active');
        document.getElementById('backdrop').classList.add('active');
    }

    // New: Edit Event Mode
    editEvent(evt, dateStr) {
        this.currentEditId = evt.id;
        document.getElementById('eventDate').value = dateStr;
        document.getElementById('eventTitle').value = evt.title;
        document.getElementById('eventTime').value = evt.time;
        document.getElementById('eventDescription').value = evt.description || '';

        // Select Correct Color
        const colorRadio = document.querySelector(`input[name = "color"][value = "${evt.color}"]`);
        if (colorRadio) colorRadio.checked = true;

        document.getElementById('eventPanel').classList.add('active');
        document.getElementById('backdrop').classList.add('active');
        this.closeDetailsPanel();
    }

    closePanel() {
        document.getElementById('eventPanel').classList.remove('active');
        document.getElementById('backdrop').classList.remove('active');
        this.currentEditId = null;
    }

    closeDetailsPanel() {
        document.getElementById('eventDetailsPanel').classList.remove('active');
        document.getElementById('backdrop').classList.remove('active');
    }

    saveEvent(e) {
        e.preventDefault();
        const dateVal = document.getElementById('eventDate').value;
        const [y, m, d] = dateVal.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dateStr = this.formatDate(date);

        const title = document.getElementById('eventTitle').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value;
        const color = document.querySelector('input[name="color"]:checked').value;

        if (!this.events[dateStr]) this.events[dateStr] = [];

        if (this.currentEditId) {
            // UPDATE EXISTING
            const idx = this.events[dateStr].findIndex(ev => ev.id === this.currentEditId);
            if (idx !== -1) {
                this.events[dateStr][idx] = { id: this.currentEditId, title, time, description, color };
            } else {
                this.events[dateStr].push({ id: this.currentEditId, title, time, description, color });
            }
        } else {
            // CREATE NEW
            this.events[dateStr].push({ id: Date.now(), title, time, description, color });
        }

        this.saveEvents();
        this.closePanel();
        this.render();
    }

    // Storage
    saveEvents() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ events: this.events });
        } else {
            localStorage.setItem('events', JSON.stringify(this.events));
        }
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });

        // Focus Clock
        const el = document.getElementById('digitalClock');
        if (el) el.textContent = timeString;

        // Global Header Clock
        const globalEl = document.getElementById('globalClock');
        if (globalEl) globalEl.textContent = timeString;

        // Update Usage Stats (Throttle this if performance issues arise, but 1s is fine for local reads)
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['stats'], (res) => {
                const mins = res.stats?.minutesOnline || 0;
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const text = h > 0 ? `${h}h ${m}m Online` : `${m}m Online`;

                const statsEl = document.getElementById('onlineStats');
                if (statsEl) statsEl.textContent = text;
            });
        }
    }

    loadEvents() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['events'], (res) => {
                if (res.events) { this.events = res.events; this.render(); }
            });
        } else {
            const data = localStorage.getItem('events');
            if (data) { this.events = JSON.parse(data); this.render(); }
        }
    }

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getEventsForDay(dateStr) { return this.events[dateStr] || []; }
}

document.addEventListener('DOMContentLoaded', () => { window.calendar = new Calendar(); });
