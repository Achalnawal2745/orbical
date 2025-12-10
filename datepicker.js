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
        // Set placeholder format
        this.input.placeholder = 'DD:MM:YYYY';

        // ONLY icon click opens picker
        if (this.icon) {
            this.icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.open();
            });
        }

        // Masked input handling
        this.input.addEventListener('input', (e) => {
            this.handleMaskedInput(e);
        });

        // Parse on blur
        this.input.addEventListener('blur', () => {
            this.parseAndValidate();
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

    handleMaskedInput(e) {
        let value = e.target.value;
        const cursorPos = e.target.selectionStart;

        // Remove all non-digits
        let digits = value.replace(/\D/g, '');

        // Limit to 8 digits (DDMMYYYY)
        if (digits.length > 8) {
            digits = digits.substring(0, 8);
        }

        // Format with colons
        let formatted = '';
        if (digits.length > 0) {
            formatted = digits.substring(0, 2); // DD
            if (digits.length > 2) {
                formatted += ':' + digits.substring(2, 4); // MM
                if (digits.length > 4) {
                    formatted += ':' + digits.substring(4, 8); // YYYY
                }
            }
        }

        e.target.value = formatted;

        // Adjust cursor position
        let newCursorPos = cursorPos;
        if (formatted.length >= 3 && cursorPos === 2) {
            newCursorPos = 3; // Jump over first colon
        } else if (formatted.length >= 6 && cursorPos === 5) {
            newCursorPos = 6; // Jump over second colon
        }

        e.target.setSelectionRange(newCursorPos, newCursorPos);
    }

    parseAndValidate() {
        const value = this.input.value;
        if (value && value.length === 10) { // DD:MM:YYYY
            const parts = value.split(':');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                const parsed = new Date(year, month, day);

                if (!isNaN(parsed.getTime()) &&
                    parsed.getDate() === day &&
                    parsed.getMonth() === month) {
                    this.selectedDate = parsed;
                    this.currentMonth = new Date(parsed);
                    this.updateInputDisplay();
                }
            }
        }
    }

    open() {
        // Close other date pickers
        document.querySelectorAll('.date-picker-dropdown.active').forEach(dp => {
            if (dp !== this.dropdown) dp.classList.remove('active');
        });

        // Close time pickers too
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

        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="date-picker-day other-month">${prevMonthDays - i}</div>`;
        }

        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();

            let classes = 'date-picker-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
        }

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
                    this.selectedDate = today;
                    this.currentMonth = new Date(today);
                    this.updateInputDisplay();
                    this.input.dispatchEvent(new Event('change', { bubbles: true }));
                    this.close();
                }
            });
        });

        this.dropdown.querySelectorAll('[data-date]').forEach(day => {
            day.addEventListener('click', (e) => {
                e.stopPropagation();
                const dateStr = day.dataset.date;
                this.selectedDate = new Date(dateStr + 'T12:00:00');
                this.currentMonth = new Date(this.selectedDate);
                this.updateInputDisplay();
                this.input.dispatchEvent(new Event('change', { bubbles: true }));
                this.close();
            });
        });
    }

    updateInputDisplay() {
        if (this.selectedDate) {
            const day = String(this.selectedDate.getDate()).padStart(2, '0');
            const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
            const year = this.selectedDate.getFullYear();
            this.input.value = `${day}:${month}:${year}`;
            this.input.dataset.isoDate = this.formatDateISO(this.selectedDate);
        }
    }

    formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    setValue(dateStr) {
        if (dateStr) {
            this.selectedDate = new Date(dateStr + 'T12:00:00');
            this.currentMonth = new Date(this.selectedDate);
            this.updateInputDisplay();
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
        // Set placeholder
        this.input.placeholder = 'HH:MM';

        // ONLY icon click opens picker
        if (this.icon) {
            this.icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.open();
            });
        }

        // Masked input handling
        this.input.addEventListener('input', (e) => {
            this.handleMaskedInput(e);
        });

        // Parse on blur
        this.input.addEventListener('blur', () => {
            this.parseAndValidate();
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

    handleMaskedInput(e) {
        let value = e.target.value;
        const cursorPos = e.target.selectionStart;

        // Remove all non-digits
        let digits = value.replace(/\D/g, '');

        // Limit to 4 digits (HHMM)
        if (digits.length > 4) {
            digits = digits.substring(0, 4);
        }

        // Format with colon
        let formatted = '';
        if (digits.length > 0) {
            formatted = digits.substring(0, 2); // HH
            if (digits.length > 2) {
                formatted += ':' + digits.substring(2, 4); // MM
            }
        }

        e.target.value = formatted;

        // Adjust cursor position
        let newCursorPos = cursorPos;
        if (formatted.length >= 3 && cursorPos === 2) {
            newCursorPos = 3; // Jump over colon
        }

        e.target.setSelectionRange(newCursorPos, newCursorPos);
    }

    parseAndValidate() {
        const value = this.input.value;
        if (value && value.match(/^\d{2}:\d{2}$/)) {
            const [h, m] = value.split(':');
            const hour = parseInt(h);
            const minute = parseInt(m);

            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
                this.selectedHour = hour;
                this.selectedMinute = minute;
            }
        }
    }

    open() {
        // Close other time pickers
        document.querySelectorAll('.time-picker-dropdown.active').forEach(tp => {
            if (tp !== this.dropdown) tp.classList.remove('active');
        });

        // Close date pickers too
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
                this.updateSelection();
            });
        });

        this.dropdown.querySelectorAll('[data-minute]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedMinute = parseInt(item.dataset.minute);
                this.updateSelection();
            });
        });
    }

    updateSelection() {
        if (this.selectedHour !== null && this.selectedMinute !== null) {
            const hourStr = String(this.selectedHour).padStart(2, '0');
            const minStr = String(this.selectedMinute).padStart(2, '0');
            this.input.value = `${hourStr}:${minStr}`;
            this.input.dispatchEvent(new Event('change', { bubbles: true }));
            this.close();
        } else {
            this.render();
        }
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
