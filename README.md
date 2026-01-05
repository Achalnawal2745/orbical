# OrbiCal 🪐

**A Premium Calendar & Usage Tracking Extension for Chrome, Edge, and Brave.**

OrbiCal is a stunning calendar extension designed with a futuristic "Neon Glass" aesthetic. It combines a beautiful orbital calendar interface with powerful usage tracking and smart notifications to help you stay organized.

## ✨ Features

### 🌌 Beautiful UI
- **Deep Space Theme**: Rich dark gradients with glassmorphism effects
- **Neon Accents**: Glowing Cyan (`#00f3ff`) and Purple (`#bc13fe`) highlights
- **Interactive Orbital Week View**: Days float around the active date in a unique circular layout
- **Focus View**: Distraction-free card view for your daily agenda

### 📊 Usage Analytics
- **Website Tracking**: Automatically tracks time spent on each website
- **Category Classification**: Sites are auto-categorized (Work, Social, Entertainment, etc.)
- **Custom Categories**: Manually categorize any site to match your workflow
- **Daily Statistics**: View detailed breakdown of your browsing time
- **Weekly Reports**: Automatic weekly reports with:
  - Total browsing time
  - Work vs. non-work time
  - Work time percentage
  - Top 5 most visited sites
  - "In Progress" card for current week
- **Data Retention**: 
  - Daily stats: Last 7 days
  - Weekly reports: Last 4 weeks (1 month)

### ⚡ Smart Calendar
- **Event Management**: Create, edit, and delete events with ease
- **Event Images**: Add custom images to events for visual context
- **Recurring Events**: Schedule events that repeat:
  - Daily
  - Weekly (select specific days)
  - Monthly
- **Smart Notifications**:
  - "Starting Now" alerts when events begin
  - "You Missed" alerts for past events
  - All-day events notify at midnight and 9 AM
  - All notifications require manual dismissal
- **Past Event Handling**: Duplicate and reschedule past events

### 🎯 Tracking Tools
- **Online Time Tracker**: Tracks active Chrome usage (pauses when you switch apps)
- **7-Day Activity Chart**: Visual representation of your online time
- **Quick Add**: Floating action button for instant event creation
- **Keyboard Shortcut**: Press **Alt+C** to open calendar (customizable in `chrome://extensions/shortcuts`)

### 📅 Multiple Views
- **Month View**: Classic grid with glowing day indicators
- **Week View**: Unique orbital layout with animated bubbles
- **Focus View**: Card-based daily agenda

## 🛠️ Installation

### From Source
1. **Download**: Clone or download this repository
   ```bash
   git clone https://github.com/Achalnawal2745/orbical.git
   ```
2. **Open Chrome Extensions**: Navigate to `chrome://extensions/`
3. **Enable Developer Mode**: Toggle the switch in the top right corner
4. **Load Unpacked**: Click "Load unpacked" and select the `orbical` folder
5. **Pin Extension**: Click the puzzle icon and pin OrbiCal to your toolbar

### First Time Setup
- The extension will automatically start tracking your usage
- Click the OrbiCal icon to open the calendar
- Use the FAB (floating action button) to create your first event
- Click the "Online Stats" badge to view your usage analytics

## 📖 Usage

### Creating Events
1. Click the **+** button (FAB) in the bottom right
2. Fill in event details:
   - Title (required)
   - Date (required)
   - Time (optional - leave empty for all-day events)
   - Description (optional)
   - Color (choose from 6 colors)
   - Image (optional)
3. For recurring events, toggle "Repeat" and configure:
   - Frequency (Daily/Weekly/Monthly)
   - End date
   - Days of week (for weekly events)

### Viewing Analytics
1. Click the **"Online Stats"** badge in the header
2. Navigate between tabs:
   - **Online**: View total Chrome usage time and 7-day chart
   - **Usage**: See daily website breakdown and weekly reports
3. Use **← →** arrows to view previous days (up to 7 days back)
4. Click any site to change its category

### Managing Events
- **View**: Click any day in Month view or event card in Focus view
- **Edit**: Click event → "Edit" button
- **Delete**: Click event → "Delete" button
- **Duplicate Past Events**: Click past event → "Duplicate & Edit"

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Properties, Grid, Flexbox), Vanilla JavaScript (ES6+)
- **Storage**: `chrome.storage.local` for events, stats, and settings
- **Background**: Service Worker (Manifest V3) with `chrome.alarms` API
- **Notifications**: `chrome.notifications` API with `requireInteraction`
- **Permissions**: `storage`, `alarms`, `notifications`, `tabs`, `windows`, `idle`

## 📁 Project Structure

```
orbical/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── styles.css            # All styles (glassmorphism, animations)
├── calendar.js           # Calendar logic & UI
├── datepicker.js         # Custom date picker component
├── timepicker.js         # Custom time picker component
├── background.js         # Service worker (tracking, notifications)
├── images/               # Icons and assets
├── LICENSE               # MIT License
└── README.md            # This file
```

## 🔒 Privacy

- **All data stays local**: OrbiCal stores everything in your browser's local storage
- **No external servers**: No data is sent to any external servers
- **No tracking**: The extension only tracks your browsing for your own analytics
- **Open source**: Full transparency - review the code yourself

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 🙏 Acknowledgments

- Inspired by modern productivity tools and space aesthetics
- Built with love for the Chrome extension community

---

**Made with ❤️** 
