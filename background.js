// Background service worker for OrbiCal extension
console.log('OrbiCal background service worker started');

const ALARM_NAME = 'usage_tracker';
const WEEKLY_REPORT_ALARM = 'weekly_report';

// Website categories
const CATEGORIES = {
    social: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com'],
    work: ['gmail.com', 'slack.com', 'notion.so', 'github.com', 'trello.com', 'asana.com'],
    entertainment: ['youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com'],
    shopping: ['amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com'],
    news: ['cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com'],
    productivity: ['docs.google.com', 'sheets.google.com', 'drive.google.com', 'calendar.google.com']
};

let currentTabUrl = null;
let lastTrackTime = Date.now();
let isUserIdle = false;
let chromeLeftTime = null; // Track when Chrome loses focus

chrome.runtime.onInstalled.addListener(() => {
    console.log('OrbiCal Extension installed');
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    chrome.alarms.create(WEEKLY_REPORT_ALARM, { when: getNextSunday(), periodInMinutes: 10080 }); // Weekly

    // Initialize storage
    chrome.storage.local.get(['events', 'stats', 'lastDate', 'dailyUsageStats', 'weeklyReports', 'customCategories'], (result) => {
        if (!result.events) chrome.storage.local.set({ events: {} });
        if (!result.stats) chrome.storage.local.set({ stats: { minutesOnline: 0 } });
        if (!result.lastDate) chrome.storage.local.set({ lastDate: new Date().toLocaleDateString() });
        if (!result.dailyUsageStats) chrome.storage.local.set({ dailyUsageStats: {} });
        if (!result.weeklyReports) chrome.storage.local.set({ weeklyReports: {} });
        if (!result.customCategories) chrome.storage.local.set({ customCategories: {} });
    });
});

// Get next Sunday midnight
function getNextSunday() {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday.getTime();
}

// Categorize domain
function categorizeDomain(domain) {
    for (const [category, domains] of Object.entries(CATEGORIES)) {
        if (domains.some(d => domain.includes(d))) {
            return category;
        }
    }
    return 'other';
}

// Extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return null;
    }
}

// Track active tab - Called every 1 minute by alarm
function trackActiveTab() {
    if (isUserIdle) return;

    // Check if Chrome is focused first
    chrome.windows.getLastFocused({ populate: false }, (window) => {
        if (!window || !window.focused) {
            // Chrome not focused, don't track anything
            return;
        }

        // Chrome IS focused, track the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const url = tabs[0].url;
                const domain = extractDomain(url);

                if (domain && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://')) {
                    const today = new Date().toLocaleDateString();

                    chrome.storage.local.get(['dailyUsageStats', 'customCategories'], (res) => {
                        const dailyStats = res.dailyUsageStats || {};
                        const customCats = res.customCategories || {};

                        // Initialize today's stats if not exists
                        if (!dailyStats[today]) {
                            dailyStats[today] = {};
                        }

                        // Initialize domain for today if not exists
                        if (!dailyStats[today][domain]) {
                            // Check custom category first, fall back to auto-categorization
                            const category = customCats[domain] || categorizeDomain(domain);

                            dailyStats[today][domain] = {
                                totalSeconds: 0,
                                visits: 1,
                                lastVisit: new Date().toISOString(),
                                category: category
                            };
                        } else {
                            // Check if this is a new visit (different from last tracked domain)
                            if (currentTabUrl !== domain) {
                                dailyStats[today][domain].visits += 1;
                            }
                        }

                        // Add 60 seconds (1 minute) since alarm fires every minute
                        dailyStats[today][domain].totalSeconds += 60;
                        dailyStats[today][domain].lastVisit = new Date().toISOString();

                        // Keep only last 7 days
                        const dates = Object.keys(dailyStats).sort().reverse();
                        const last7Days = {};
                        dates.slice(0, 7).forEach(date => {
                            last7Days[date] = dailyStats[date];
                        });

                        chrome.storage.local.set({ dailyUsageStats: last7Days });

                        // Update current tab for next check
                        currentTabUrl = domain;
                    });
                }
            }
        });
    });
}

// Idle detection
chrome.idle.setDetectionInterval(60); // 60 seconds
chrome.idle.onStateChanged.addListener((state) => {
    isUserIdle = (state !== 'active');
    console.log(`User idle state: ${state}`);
});

// Listen for Chrome window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Chrome lost focus (user switched to another app)
        chromeLeftTime = Date.now();
        console.log('Chrome lost focus at:', new Date(chromeLeftTime).toLocaleTimeString());
    } else {
        // Chrome gained focus (user came back)
        if (chromeLeftTime) {
            const timeAway = Math.floor((Date.now() - chromeLeftTime) / 1000);
            console.log(`Chrome regained focus. Was away for ${timeAway} seconds`);
            chromeLeftTime = null;
        }
    }
});

// Track Usage & Check Events
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        // Track current tab
        trackActiveTab();

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
    } else if (alarm.name === WEEKLY_REPORT_ALARM) {
        generateWeeklyReport();
    }
});

// Generate weekly report
function generateWeeklyReport() {
    chrome.storage.local.get(['dailyUsageStats', 'weeklyReports'], (res) => {
        const dailyStats = res.dailyUsageStats || {};
        const weeklyReports = res.weeklyReports || {};

        // Calculate week number
        const now = new Date();
        const weekNum = getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${weekNum}`;

        // Get all unique domains from the week and aggregate their time
        const uniqueDomains = new Set();
        const domainTotalTime = {};
        const domainCategories = {};

        Object.values(dailyStats).forEach(dayStats => {
            Object.entries(dayStats).forEach(([domain, data]) => {
                uniqueDomains.add(domain);
                domainTotalTime[domain] = (domainTotalTime[domain] || 0) + data.totalSeconds;
                domainCategories[domain] = data.category;
            });
        });

        // Get top 5 sites by total time
        const sortedSites = Object.entries(domainTotalTime)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([domain, time]) => ({
                domain,
                time,
                category: domainCategories[domain]
            }));

        // Calculate total time and productive time
        const totalTime = Object.values(domainTotalTime).reduce((sum, time) => sum + time, 0);
        const productiveTime = Object.entries(domainTotalTime)
            .filter(([domain]) => ['work', 'productivity'].includes(domainCategories[domain]))
            .reduce((sum, [_, time]) => sum + time, 0);

        weeklyReports[weekKey] = {
            startDate: getWeekStart(now).toISOString(),
            endDate: now.toISOString(),
            uniqueSitesCount: uniqueDomains.size, // ✅ Unique sites count!
            topSites: sortedSites,
            totalTime,
            productiveTime,
            productivityScore: Math.round((productiveTime / totalTime) * 100) || 0
        };

        // Keep only last 12 weeks
        const reportKeys = Object.keys(weeklyReports).sort().reverse().slice(0, 12);
        const trimmedReports = {};
        reportKeys.forEach(key => trimmedReports[key] = weeklyReports[key]);

        chrome.storage.local.set({ weeklyReports: trimmedReports });
        console.log(`Weekly report generated for ${weekKey}`);
    });
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

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
