// Background service worker for OrbiCal extension
console.log('OrbiCal background service worker started');

const ALARM_NAME = 'usage_tracker';

chrome.runtime.onInstalled.addListener(() => {
    console.log('OrbiCal Extension installed');
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });

    // Initialize storage
    chrome.storage.local.get(['events', 'stats', 'lastDate'], (result) => {
        if (!result.events) chrome.storage.local.set({ events: {} });
        if (!result.stats) chrome.storage.local.set({ stats: { minutesOnline: 0 } });
        if (!result.lastDate) chrome.storage.local.set({ lastDate: new Date().toLocaleDateString() });
    });
});

// Track Usage & Check Events
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        // 1. Usage Tracker (Smart Focus)
        chrome.windows.getLastFocused({ populate: false }, (window) => {
            if (window && window.focused) {
                chrome.storage.local.get(['stats', 'lastDate'], (res) => {
                    const today = new Date().toLocaleDateString();
                    let stats = res.stats || { minutesOnline: 0 };
                    let lastDate = res.lastDate || today;

                    if (lastDate !== today) {
                        // END OF DAY: ARCHIVE STATS
                        if (!stats.history) stats.history = {};
                        stats.history[lastDate] = stats.minutesOnline; // Save yesterday's minutes

                        // Reset for today
                        stats.minutesOnline = 1;
                        lastDate = today;

                        // Also reset notified events for new day
                        chrome.storage.local.set({ notifiedEvents: [] });
                    } else {
                        stats.minutesOnline = (stats.minutesOnline || 0) + 1;
                    }

                    chrome.storage.local.set({ stats, lastDate });
                    console.log(`Online time updated: ${stats.minutesOnline} minutes`);
                });
            }
        });

        // 2. Check for Events (Notifications)
        checkEvents();
    }
});

function checkEvents() {
    chrome.storage.local.get(['events', 'notifiedEvents'], (res) => {
        const events = res.events || {};
        const notified = res.notifiedEvents || [];

        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const todayEvents = events[todayStr] || [];

        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeVal = currentHours * 60 + currentMinutes;

        let newNotified = [...notified];
        let hasUpdates = false;

        todayEvents.forEach(evt => {
            if (newNotified.includes(evt.id)) return;
            if (!evt.time) return;

            const [evtH, evtM] = evt.time.split(':').map(Number);
            const evtTimeVal = evtH * 60 + evtM;
            const diff = currentTimeVal - evtTimeVal;

            // Trigger if time matches or passed within last 60 mins (catch up)
            if (diff >= 0) {
                let title = '';
                let msg = '';

                if (diff <= 2) {
                    title = `🔔 Starting Now: ${evt.title}`;
                    msg = evt.description || "Happening right now!";
                } else {
                    title = `⚠️ You Missed: ${evt.title}`;
                    msg = `Started at ${evt.time}. ${evt.description || ''}`;
                }

                chrome.notifications.create(`evt-${evt.id}`, {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('images/logo.png'),
                    title: title,
                    message: msg,
                    priority: 2,
                    requireInteraction: true // Keeps notification open until user dismisses it
                });

                newNotified.push(evt.id);
                hasUpdates = true;
                console.log(`Notification sent for event: ${evt.title}`);
            }
        });

        if (hasUpdates) {
            chrome.storage.local.set({ notifiedEvents: newNotified });
        }
    });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_EVENTS') {
        chrome.storage.local.get(['events'], (result) => {
            sendResponse({ events: result.events || {} });
        });
        return true;
    }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    // Open the extension popup
    chrome.action.openPopup();
});
