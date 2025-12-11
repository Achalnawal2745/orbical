// ========== DATE PICKER CLASS ==========
class DatePicker {
    constructor(inputId, dropdownId, iconId) {
        this.input = document.getElementById(inputId);
        this.dropdown = document.getElementById(dropdownId);
        this.icon = document.getElementById(iconId);
        this.currentMonth = new Date();
        this.selectedDate = null;

        if (!this.input || !this.dropdown) {
            console.error(`DatePicker: Elements not found for ${inputId}`);
            return;
        }

        this.init();
    }

    init() {
        this.input.placeholder = 'DD:MM:YYYY';

        // Icon click toggles picker
        if (this.icon) {
            this.icon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.dropdown.classList.contains('active')) {
                    this.close();
                } else {
                    this.open();
                }
            });
        }

        // Clicking input closes picker
        this.input.addEventListener('focus', () => {
            if (this.dropdown.classList.contains('active')) {
                this.close();
            }
        });

        // Handle input with validation
        this.input.addEventListener('input', (e) => {
            let value = e.target.value;
            let cursorPos = e.target.selectionStart;

            // Only allow digits and colons
            value = value.replace(/[^\d:]/g, '');

            // Split by colons to get parts
            let parts = value.split(':');

            // Validate and limit each part
            if (parts[0]) {
                // Day: 01-31
                let day = parts[0].replace(/\D/g, '');
                if (day.length > 2) day = day.substring(0, 2);
                if (parseInt(day) > 31) day = '31';
                parts[0] = day;
            }

            if (parts[1]) {
                // Month: 01-12
                let month = parts[1].replace(/\D/g, '');
                if (month.length > 2) month = month.substring(0, 2);
                if (parseInt(month) > 12) month = '12';
                parts[1] = month;
            }

            if (parts[2]) {
                // Year: 4 digits, >= current year
                let year = parts[2].replace(/\D/g, '');
                if (year.length > 4) year = year.substring(0, 4);
                parts[2] = year;
            }

            // Rebuild value
            value = parts.join(':');

            // Limit total length
            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            e.target.value = value;

            // Restore cursor position
            if (cursorPos > value.length) cursorPos = value.length;
            e.target.setSelectionRange(cursorPos, cursorPos);
        });

        // Validate on blur
        this.input.addEventListener('blur', () => {
            const value = this.input.value;
            const errorEl = document.getElementById('dateError');

            if (!value) {
                // Empty is okay
                if (errorEl) errorEl.textContent = '';
                this.input.style.borderColor = '';
                return;
            }

            if (value.length === 10) {
                const parts = value.split(':');
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);

                // Check if date is valid
                const date = new Date(year, month, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month) {
                    // Invalid date
                    this.input.style.borderColor = '#ef4444';
                    this.input.dataset.isoDate = '';
                    this.input.dataset.valid = 'false';
                    if (errorEl) errorEl.textContent = 'Invalid date format';
                } else if (date < today) {
                    // Past date
                    this.input.style.borderColor = '#ef4444';
                    this.input.dataset.isoDate = '';
                    this.input.dataset.valid = 'false';
                    if (errorEl) errorEl.textContent = 'Past dates are not allowed';
                } else {
                    // Valid date
                    this.selectedDate = date;
                    this.currentMonth = new Date(date);
                    this.input.dataset.isoDate = this.formatDateISO(date);
                    this.input.dataset.valid = 'true';
                    this.input.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    if (errorEl) errorEl.textContent = '';
                }
            } else {
                // Incomplete date
                this.input.style.borderColor = '#ef4444';
                this.input.dataset.isoDate = '';
                this.input.dataset.valid = 'false';
                if (errorEl) errorEl.textContent = 'Please enter complete date (DD:MM:YYYY)';
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target) &&
                (!this.icon || !this.icon.contains(e.target))) {
                this.close();
            }
        });

        this.render();
    }

    open() {
        document.querySelectorAll('.date-picker-dropdown.active').forEach(dp => {
            if (dp !== this.dropdown) dp.classList.remove('active');
        });
        document.querySelectorAll('.time-picker-dropdown.active').forEach(tp => {
            tp.classList.remove('active');
        });

        this.dropdown.classList.add('active');
        this.render();
    }

    close() {
        this.dropdown.classList.remove('active');
    }

    render() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        let html = `
            <div class="date-picker-header">
                <button type="button" class="date-picker-nav" data-action="prev">←</button>
                <div class="date-picker-month">${this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <button type="button" class="date-picker-nav" data-action="next">→</button>
            </div>
            <button type="button" class="date-picker-today-btn" data-action="today">Today</button>
            <div class="date-picker-weekdays">
                <div class="date-picker-weekday">S</div>
                <div class="date-picker-weekday">M</div>
                <div class="date-picker-weekday">T</div>
                <div class="date-picker-weekday">W</div>
                <div class="date-picker-weekday">T</div>
                <div class="date-picker-weekday">F</div>
                <div class="date-picker-weekday">S</div>
            </div>
            <div class="date-picker-days">
        `;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Previous month days (disabled)
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="date-picker-day other-month">${prevMonthDays - i}</div>`;
        }

        // Current month days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            const isPast = date < today;

            let classes = 'date-picker-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (isPast) classes += ' disabled';

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (isPast) {
                html += `<div class="${classes}">${day}</div>`;
            } else {
                html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
            }
        }

        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        if (remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                html += `<div class="date-picker-day other-month">${i}</div>`;
            }
        }

        html += `</div>`;
        this.dropdown.innerHTML = html;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.dropdown.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = btn.dataset.action;

                if (action === 'prev') {
                    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
                    this.render();
                } else if (action === 'next') {
                    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
                    this.render();
                } else if (action === 'today') {
                    const today = new Date();
                    this.setDateFromPicker(today);
                }
            });
        });

        this.dropdown.querySelectorAll('[data-date]').forEach(day => {
            day.addEventListener('click', (e) => {
                e.stopPropagation();
                const dateStr = day.dataset.date;
                const date = new Date(dateStr + 'T12:00:00');
                this.setDateFromPicker(date);
            });
        });
    }

    setDateFromPicker(date) {
        this.selectedDate = date;
        this.currentMonth = new Date(date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        this.input.value = `${day}:${month}:${year}`;
        this.input.dataset.isoDate = this.formatDateISO(date);
        this.input.style.borderColor = 'rgba(99, 102, 241, 0.5)';
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.close();
    }

    formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    setValue(dateStr) {
        if (dateStr) {
            const date = new Date(dateStr + 'T12:00:00');
            this.selectedDate = date;
            this.currentMonth = new Date(date);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear());
            this.input.value = `${day}:${month}:${year}`;
            this.input.dataset.isoDate = dateStr;
        } else {
            this.selectedDate = null;
            this.input.value = '';
            this.input.dataset.isoDate = '';
        }
    }

    getValue() {
        return this.input.dataset.isoDate || '';
    }
}

// ========== TIME PICKER CLASS ==========
class TimePicker {
    constructor(inputId, dropdownId, iconId) {
        this.input = document.getElementById(inputId);
        this.dropdown = document.getElementById(dropdownId);
        this.icon = document.getElementById(iconId);
        this.selectedHour = null;
        this.selectedMinute = null;

        if (!this.input || !this.dropdown) {
            console.error(`TimePicker: Elements not found for ${inputId}`);
            return;
        }

        this.init();
    }

    init() {
        this.input.placeholder = 'HH:MM';

        // Icon click toggles picker
        if (this.icon) {
            this.icon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.dropdown.classList.contains('active')) {
                    this.close();
                } else {
                    this.open();
                }
            });
        }

        // Clicking input closes picker
        this.input.addEventListener('focus', () => {
            if (this.dropdown.classList.contains('active')) {
                this.close();
            }
        });

        // Handle input with validation
        this.input.addEventListener('input', (e) => {
            let value = e.target.value;
            let cursorPos = e.target.selectionStart;

            // Only allow digits and colons
            value = value.replace(/[^\d:]/g, '');

            // Split by colons
            let parts = value.split(':');

            // Validate and limit each part
            if (parts[0]) {
                // Hour: 00-23
                let hour = parts[0].replace(/\D/g, '');
                if (hour.length > 2) hour = hour.substring(0, 2);
                if (parseInt(hour) > 23) hour = '23';
                parts[0] = hour;
            }

            if (parts[1]) {
                // Minute: 00-59
                let minute = parts[1].replace(/\D/g, '');
                if (minute.length > 2) minute = minute.substring(0, 2);
                if (parseInt(minute) > 59) minute = '59';
                parts[1] = minute;
            }

            // Rebuild value
            value = parts.join(':');

            // Limit total length
            if (value.length > 5) {
                value = value.substring(0, 5);
            }

            e.target.value = value;

            // Restore cursor position
            if (cursorPos > value.length) cursorPos = value.length;
            e.target.setSelectionRange(cursorPos, cursorPos);
        });

        // Validate on blur
        this.input.addEventListener('blur', () => {
            const value = this.input.value;
            const errorEl = document.getElementById('timeError');

            if (!value) {
                // Empty is okay
                if (errorEl) errorEl.textContent = '';
                this.input.style.borderColor = '';
                return;
            }

            if (value.match(/^\d{2}:\d{2}$/)) {
                const [h, m] = value.split(':');
                const hour = parseInt(h);
                const minute = parseInt(m);

                if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                    this.selectedHour = hour;
                    this.selectedMinute = minute;
                    this.input.dataset.valid = 'true';
                    this.input.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    if (errorEl) errorEl.textContent = '';
                } else {
                    this.input.dataset.valid = 'false';
                    this.input.style.borderColor = '#ef4444';
                    if (errorEl) errorEl.textContent = 'Invalid time (Hour: 00-23, Minute: 00-59)';
                }
            } else {
                this.input.dataset.valid = 'false';
                this.input.style.borderColor = '#ef4444';
                if (errorEl) errorEl.textContent = 'Please enter complete time (HH:MM)';
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target) &&
                (!this.icon || !this.icon.contains(e.target))) {
                this.close();
            }
        });

        this.render();
    }

    open() {
        document.querySelectorAll('.time-picker-dropdown.active').forEach(tp => {
            if (tp !== this.dropdown) tp.classList.remove('active');
        });
        document.querySelectorAll('.date-picker-dropdown.active').forEach(dp => {
            dp.classList.remove('active');
        });

        this.dropdown.classList.add('active');
        this.render();
    }

    close() {
        this.dropdown.classList.remove('active');
    }

    render() {
        let html = `
            <div class="time-picker-header">
                <div class="time-picker-title">Select Time</div>
            </div>
            <div class="time-picker-grid">
                <div class="time-picker-column">
                    <div class="time-picker-column-label">Hour</div>
                    <div class="time-picker-scroll">
        `;

        for (let h = 0; h < 24; h++) {
            const hourStr = String(h).padStart(2, '0');
            const isSelected = this.selectedHour === h;
            html += `<div class="time-picker-item ${isSelected ? 'selected' : ''}" data-hour="${h}">${hourStr}</div>`;
        }

        html += `
                    </div>
                </div>
                <div class="time-picker-separator">:</div>
                <div class="time-picker-column">
                    <div class="time-picker-column-label">Minute</div>
                    <div class="time-picker-scroll">
        `;

        for (let m = 0; m < 60; m++) {
            const minStr = String(m).padStart(2, '0');
            const isSelected = this.selectedMinute === m;
            html += `<div class="time-picker-item ${isSelected ? 'selected' : ''}" data-minute="${m}">${minStr}</div>`;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        this.dropdown.innerHTML = html;
        this.attachEventListeners();

        setTimeout(() => {
            if (this.selectedHour !== null) {
                const hourItem = this.dropdown.querySelector(`[data-hour="${this.selectedHour}"]`);
                if (hourItem) hourItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            if (this.selectedMinute !== null) {
                const minItem = this.dropdown.querySelector(`[data-minute="${this.selectedMinute}"]`);
                if (minItem) minItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }, 100);
    }

    attachEventListeners() {
        this.dropdown.querySelectorAll('[data-hour]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedHour = parseInt(item.dataset.hour);
                if (this.selectedMinute !== null) {
                    this.setTimeFromPicker();
                } else {
                    this.render();
                }
            });
        });

        this.dropdown.querySelectorAll('[data-minute]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedMinute = parseInt(item.dataset.minute);
                if (this.selectedHour !== null) {
                    this.setTimeFromPicker();
                } else {
                    this.render();
                }
            });
        });
    }

    setTimeFromPicker() {
        const hourStr = String(this.selectedHour).padStart(2, '0');
        const minStr = String(this.selectedMinute).padStart(2, '0');
        this.input.value = `${hourStr}:${minStr}`;
        this.input.style.borderColor = 'rgba(99, 102, 241, 0.5)';
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.close();
    }

    setValue(timeStr) {
        if (timeStr && timeStr.match(/^\d{1,2}:\d{2}$/)) {
            const [h, m] = timeStr.split(':');
            this.selectedHour = parseInt(h);
            this.selectedMinute = parseInt(m);
            this.input.value = `${String(this.selectedHour).padStart(2, '0')}:${String(this.selectedMinute).padStart(2, '0')}`;
        } else {
            this.selectedHour = null;
            this.selectedMinute = null;
            this.input.value = '';
        }
    }

    getValue() {
        return this.input.value;
    }
}
