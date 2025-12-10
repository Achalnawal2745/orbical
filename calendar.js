class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date(); // Defaults to today
        this.events = {}; // { "YYYY-MM-DD": [ { id, title, time, color, description } ] }
        this.currentView = 'month'; // 'month', 'week', 'focus'

        // Clock Preference
        this.is24Hour = localStorage.getItem('is24Hour') !== 'false'; // Default true

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
        this.initEventFormListeners();

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

        // View Switching        // Nav Listeners
        document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
            btn.onclick = () => this.switchView(btn.dataset.view);
        });

        // Settings Button (Disabled per request - Stats only via Badge)
        /*
        const settingsBtn = document.getElementById('navSettings');
        if(settingsBtn) {
            settingsBtn.onclick = () => this.openSettingsPanel();
        }
        */

        // **NEW: Click "Online Stats" Badge to open Stats**
        const statsBadge = document.getElementById('onlineStats');
        if (statsBadge) {
            statsBadge.style.cursor = 'pointer';
            statsBadge.onclick = () => this.openSettingsPanel();
        }

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
                // Using both classes to support legacy styling if needed, but primary style is orbital-event-card
                row.className = 'orbital-event-card timeline-event';

                // Add Image Background
                if (evt.img) {
                    row.classList.add('has-image');
                    row.style.backgroundImage = `url(${evt.img})`;
                    row.style.backgroundSize = 'cover';
                    row.style.backgroundPosition = 'center';
                }

                // Interaction: View Details (with Edit/Delete options)
                row.onclick = () => this.openDetailsPanel(evt, dateStr, index);

                // Color Pill
                const colorVar = evt.color === 'purple' ? 'var(--primary)' :
                    evt.color === 'red' ? '#ec4899' :
                        evt.color === 'cyan' ? '#06b6d4' :
                            evt.color === 'green' ? '#10b981' : 'var(--primary)';

                row.innerHTML = `
                    <div class="orb-pill" style="background: ${colorVar}"></div>
                    <div style="flex:1; position:relative; z-index:2;">
                        <h4 style="margin:0; font-size:16px; font-weight:600; color:${evt.img ? 'white' : 'var(--text-primary)'}">${evt.title}</h4>
                        <div style="font-size:12px; color:${evt.img ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'}; margin-top:2px; display:flex; align-items:center; gap:6px;">
                            <span>${evt.time || 'All Day'}</span>
                            ${evt.description ? '<span>• ' + evt.description.substring(0, 20) + (evt.description.length > 20 ? '...' : '') + '</span>' : ''}
                        </div>
                    </div>
                `;

                // Entrance Animation
                row.style.animationDelay = `${index * 0.1}s`;
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

        let imgHTML = '';
        if (event.img) {
            imgHTML = `<div style="width:100%; height:150px; background:url(${event.img}) center/cover no-repeat; border-radius:12px; margin-bottom:16px;"></div>`;
        }

        details.innerHTML = `
            ${imgHTML}
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

    openSettingsPanel() {
        const panel = document.getElementById('settingsPanel');
        const backdrop = document.getElementById('backdrop');

        panel.classList.add('active');
        backdrop.classList.add('active');

        // Logic to close
        document.getElementById('closeSettingsPanel').onclick = () => {
            panel.classList.remove('active');
            backdrop.classList.remove('active');
        };

        // Render Stats
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['stats'], (res) => {
                const stats = res.stats || { minutesOnline: 0, history: {} };
                const todayMins = stats.minutesOnline || 0;
                const history = stats.history || {};

                // 1. Calculate Average
                const values = Object.values(history);
                values.push(todayMins);
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = Math.round(sum / values.length);

                document.getElementById('statToday').textContent = this.formatMins(todayMins);
                document.getElementById('statAvg').textContent = this.formatMins(avg);

                // 2. Render Chart (Last 7 Days)
                const chart = document.getElementById('statsChart');
                chart.innerHTML = '';

                const days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toLocaleDateString(); // Matches storage key format? Need to ensure exact match.
                    // Background uses new Date().toLocaleDateString().
                    // This creates format "12/10/2025" or similar based on locale.
                    // Assuming user machine locale is consistent.

                    const val = (i === 0) ? todayMins : (history[dateStr] || 0);
                    const label = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W

                    days.push({ label, val });
                }

                // Find max for scaling (min 60 mins for visual buffer)
                const maxVal = Math.max(60, ...days.map(d => d.val));

                days.forEach(day => {
                    const heightPct = Math.min(100, Math.round((day.val / maxVal) * 100));
                    chart.innerHTML += `
                        <div class="chart-item">
                            <div class="chart-bar-bg" title="${day.val} mins">
                                <div class="chart-bar-fill" style="height: ${heightPct}%"></div>
                            </div>
                            <span class="chart-date">${day.label}</span>
                        </div>
                    `;
                });
            });
        }
    }

    formatMins(m) {
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        const min = m % 60;
        return `${h}h ${min}m`;
    }

    deleteEvent(dateStr, index) {
        if (!confirm('Delete this event?')) return;
        this.events[dateStr].splice(index, 1);
        if (this.events[dateStr].length === 0) delete this.events[dateStr];

        this.saveEvents();
        this.closeDetailsPanel();
        this.render(); // Re-render to update list
    }

    initEventFormListeners() {
        const toggle = document.getElementById('repeatToggle');
        const options = document.getElementById('recurrenceOptions');
        const freq = document.getElementById('repeatFreq');
        const weekGroup = document.getElementById('weekDaysGroup');

        if (toggle) {
            toggle.addEventListener('change', (e) => {
                options.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        if (freq) {
            freq.addEventListener('change', (e) => {
                weekGroup.style.display = e.target.value === 'weekly' ? 'block' : 'none';
            });
        }

        // Image Upload Listeners
        const imgTrigger = document.getElementById('imageUploadTrigger');
        const imgInput = document.getElementById('eventImageInput');
        const imgPreview = document.getElementById('imagePreview');
        const removeImgBtn = document.getElementById('removeImageBtn');
        const placeholder = document.querySelector('.upload-placeholder');

        if (imgTrigger && imgInput) {
            imgTrigger.onclick = (e) => {
                // Prevent triggering if clicking remove button
                if (e.target !== removeImgBtn && !removeImgBtn.contains(e.target)) {
                    imgInput.click();
                }
            };

            imgInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.compressImage(file, (base64) => {
                        imgPreview.src = base64;
                        imgPreview.style.display = 'block';
                        placeholder.style.display = 'none';
                        removeImgBtn.style.display = 'flex';
                    });
                }
            };

            removeImgBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                imgInput.value = '';
                imgPreview.src = '';
                imgPreview.style.display = 'none';
                placeholder.style.display = 'flex';
                removeImgBtn.style.display = 'none';
            };
        }
    }

    compressImage(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const scaleSize = MAX_WIDTH / img.width;
                const width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
                const height = (img.width > MAX_WIDTH) ? img.height * scaleSize : img.height;

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.7 quality
                callback(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
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

                // Add Image Background if exists
                if (evt.img) {
                    card.classList.add('has-image');
                    card.style.backgroundImage = `url(${evt.img})`;
                }

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

        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDescription').value = '';

        // Reset Propagate / Recurrence State
        const repeatToggle = document.getElementById('repeatToggle');
        const recurrenceOptions = document.getElementById('recurrenceOptions');
        const repeatFreq = document.getElementById('repeatFreq');
        const weekGroup = document.getElementById('weekDaysGroup');
        const repeatEnd = document.getElementById('repeatEndDate');
        const weekChecks = document.querySelectorAll('.week-days-selector input[type="checkbox"]');

        if (repeatToggle) {
            repeatToggle.checked = false;
            recurrenceOptions.style.display = 'none';
        }
        if (repeatFreq) repeatFreq.value = 'daily';
        if (weekGroup) weekGroup.style.display = 'none';
        if (repeatEnd) repeatEnd.value = '';
        if (weekChecks) weekChecks.forEach(cb => cb.checked = false);

        // Reset Image Upload State
        const imgPreview = document.getElementById('imagePreview');
        const placeholder = document.querySelector('.upload-placeholder');
        const removeBtn = document.getElementById('removeImageBtn');
        const imgInput = document.getElementById('eventImageInput');

        if (imgPreview) {
            imgPreview.src = '';
            imgPreview.style.display = 'none';
            placeholder.style.display = 'flex';
            removeBtn.style.display = 'none';
            imgInput.value = ''; // Clear file selection
        }

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

        // Handle Image
        const imgPreview = document.getElementById('imagePreview');
        const placeholder = document.querySelector('.upload-placeholder');
        const removeBtn = document.getElementById('removeImageBtn');
        const imgInput = document.getElementById('eventImageInput'); // Clear input value in case

        if (evt.img) {
            imgPreview.src = evt.img;
            imgPreview.style.display = 'block';
            placeholder.style.display = 'none';
            removeBtn.style.display = 'flex';
        } else {
            imgPreview.src = '';
            imgPreview.style.display = 'none';
            placeholder.style.display = 'flex';
            removeBtn.style.display = 'none';
        }

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
        const dateStr = document.getElementById('eventDate').value; // Start Date
        const title = document.getElementById('eventTitle').value;
        const time = document.getElementById('eventTime').value;
        const desc = document.getElementById('eventDescription').value;
        const color = document.querySelector('input[name="color"]:checked').value;

        // Image Data (Base64)
        const imgPreview = document.getElementById('imagePreview');
        const imgDisplay = imgPreview.style.display;
        const eventImg = (imgDisplay !== 'none' && imgPreview.src) ? imgPreview.src : null;

        // Recurrence Inputs
        const isRepeating = document.getElementById('repeatToggle').checked;
        const freq = document.getElementById('repeatFreq').value;
        const untilDate = document.getElementById('repeatEndDate').value;

        // Get Selected Weekdays (0=Sun, 6=Sat)
        const weekDays = Array.from(document.querySelectorAll('.week-days-selector input:checked'))
            .map(cb => parseInt(cb.value));

        // Basic Validation
        if (!title || !dateStr) return;

        // 1. Determine List of Dates to Save
        let datesToSave = [dateStr]; // Default: Just the selected date

        if (isRepeating && untilDate) {
            datesToSave = this.generateRecurringDates(dateStr, untilDate, freq, weekDays);
        }

        // 2. Save Logic (Batch)
        chrome.storage.local.get(['events'], (result) => {
            const events = result.events || {};
            const parentId = isRepeating ? Date.now() : null; // Group ID for future use

            // IF EDITING: Find and Remove the old event first (Handles date changes too)
            if (this.currentEditId) {
                Object.keys(events).forEach(dateKey => {
                    events[dateKey] = events[dateKey].filter(evt => evt.id !== this.currentEditId);
                    if (events[dateKey].length === 0) delete events[dateKey];
                });
            }

            datesToSave.forEach(dKey => {
                if (!events[dKey]) events[dKey] = [];

                // Valid Event Object
                const newEvent = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    title,
                    time,
                    description: desc,
                    color,
                    img: eventImg,
                    parentId: parentId
                };

                // If editing single implementation, we'd replace. 
                // For this Recurrence implementation: Always Add New.
                // (Constraint: "Edit Series" is complex, we just "Create Series" for now)
                events[dKey].push(newEvent);
            });

            // 3. Persist & Refresh
            this.events = events; // Update local cache
            chrome.storage.local.set({ events }, () => {
                this.closePanel();
                // Ensure edit ID is cleared
                this.currentEditId = null;

                this.render(); // Refreshes whatever view is active

                // If on Focus or Week, force refresh them
                if (this.currentView === 'focus') this.renderFocus();
                if (this.currentView === 'week') this.renderWeekOrbital(); // Typo fix: we have renderWeekOrbital
            });
        });
    }

    generateRecurringDates(start, end, freq, weekDays) {
        let dates = [];
        let current = new Date(start);
        // Correct for timezone offset issues by setting time to Noon?
        // Actually YYYY-MM-DD input is clean. Let's force "T12:00:00" to avoid rollover.
        current.setHours(12, 0, 0, 0);

        const endDate = new Date(end);
        endDate.setHours(12, 0, 0, 0);

        const startDayOfMonth = current.getDate(); // For Monthly logic

        // Safety cap: 365 iterations max
        let safety = 0;

        while (current <= endDate && safety < 366) {
            let match = false;

            if (freq === 'daily') {
                match = true;
            } else if (freq === 'weekly') {
                if (weekDays.includes(current.getDay())) match = true;
            } else if (freq === 'monthly') {
                if (current.getDate() === startDayOfMonth) match = true;
            }

            if (match) {
                dates.push(this.formatDate(current));
            }

            // Next Day
            current.setDate(current.getDate() + 1);
            safety++;
        }
        return dates;
    }

    // Storage
    saveEvents() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ events: this.events });
        } else {
            localStorage.setItem('events', JSON.stringify(this.events));
        }
    }

    toggleClockFormat() {
        this.is24Hour = !this.is24Hour;
        localStorage.setItem('is24Hour', this.is24Hour);
        this.updateClock();
    }

    updateClock() {
        const now = new Date();
        const options = {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: !this.is24Hour
        };
        // Explicitly handle 24h/12h with Seconds
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: !this.is24Hour,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Focus Clock
        const el = document.getElementById('digitalClock');
        if (el) {
            el.textContent = timeString;
            el.onclick = () => this.toggleClockFormat();
            el.style.cursor = "pointer";
        }

        // Global Header Clock
        const globalEl = document.getElementById('globalClock');
        if (globalEl) {
            globalEl.textContent = timeString;
            globalEl.onclick = () => this.toggleClockFormat();
            globalEl.style.cursor = "pointer";
        }

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
