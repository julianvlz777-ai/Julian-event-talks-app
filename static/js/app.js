// BigQuery Release Notes Tracker - Client Logic

// Application State
let appState = {
    notes: [],
    lastUpdated: null,
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'newest',
    selectedNote: null
};

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedTime = document.getElementById('last-updated-time');
const notesGrid = document.getElementById('notes-grid');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statIssues = document.getElementById('stat-issues');
const statOthers = document.getElementById('stat-others');

// Search & Filter Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const exportCsvBtn = document.getElementById('export-csv-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalNoteType = document.getElementById('modal-note-type');
const modalNoteDate = document.getElementById('modal-note-date');
const modalNoteContent = document.getElementById('modal-note-content');
const tweetTextarea = document.getElementById('tweet-textarea');
const currentCharCount = document.getElementById('current-char-count');
const charCounter = document.getElementById('char-counter');
const charWarning = document.getElementById('char-warning');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');

// --- Initialization & API Calls ---

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchNotes();
    setupEventListeners();
});

// Fetch notes from Flask API
async function fetchNotes(forceRefresh = false) {
    showLoading();
    try {
        const url = forceRefresh ? '/api/notes?refresh=true' : '/api/notes';
        const response = await fetch(url);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.details || 'Failed to fetch release notes');
        }
        
        const data = await response.json();
        
        appState.notes = data.items || [];
        appState.lastUpdated = data.last_updated;
        
        updateLastUpdatedDisplay();
        updateStats();
        renderNotes();
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showError(error.message);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        if (!refreshIcon.classList.contains('spinning')) {
            fetchNotes(true);
        }
    });

    // Retry button on error screen
    retryBtn.addEventListener('click', () => fetchNotes(true));

    // Reset filters on empty screen
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Search bar input with debounce-like response
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.trim();
        toggleClearSearchButton();
        renderNotes();
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.searchQuery = '';
        toggleClearSearchButton();
        searchInput.focus();
        renderNotes();
    });

    // Category filters
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            triggerCategoryFilter(e.target.dataset.category);
        });
    });

    // Stats cards click handlers
    const totalStatCard = document.querySelector('.total-stat');
    const featureStatCard = document.querySelector('.feature-stat');
    const issueStatCard = document.querySelector('.issue-stat');
    const otherStatCard = document.querySelector('.other-stat');

    if (totalStatCard) totalStatCard.addEventListener('click', () => triggerCategoryFilter('all'));
    if (featureStatCard) featureStatCard.addEventListener('click', () => triggerCategoryFilter('Feature'));
    if (issueStatCard) issueStatCard.addEventListener('click', () => triggerCategoryFilter('Issue'));
    if (otherStatCard) otherStatCard.addEventListener('click', () => triggerCategoryFilter('other'));

    // Sorting dropdown
    sortSelect.addEventListener('change', (e) => {
        appState.sortBy = e.target.value;
        renderNotes();
    });

    // Modal Close
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Tweet editing real-time stats
    tweetTextarea.addEventListener('input', updateTweetCharacterCount);

    // Copy Tweet button
    copyTweetBtn.addEventListener('click', copyTweetToClipboard);

    // Post Tweet button
    postTweetBtn.addEventListener('click', postTweetToTwitter);

    // Export CSV button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Theme toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// --- UI State Management ---

function showLoading() {
    loadingState.style.display = 'flex';
    notesGrid.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
}

function showError(msg) {
    loadingState.style.display = 'none';
    notesGrid.style.display = 'none';
    errorState.style.display = 'flex';
    emptyState.style.display = 'none';
    errorMessage.textContent = msg || 'Failed to load release notes.';
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
}

function showEmpty() {
    loadingState.style.display = 'none';
    notesGrid.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'flex';
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
}

function showContent() {
    loadingState.style.display = 'none';
    notesGrid.style.display = 'grid';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
}

function toggleClearSearchButton() {
    clearSearchBtn.style.display = appState.searchQuery ? 'block' : 'none';
}

function resetFilters() {
    searchInput.value = '';
    appState.searchQuery = '';
    toggleClearSearchButton();
    
    filterButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
    appState.selectedCategory = 'all';
    
    sortSelect.value = 'newest';
    appState.sortBy = 'newest';
    
    renderNotes();
}

function updateLastUpdatedDisplay() {
    if (!appState.lastUpdated) {
        lastUpdatedTime.textContent = 'Never';
        return;
    }
    
    const date = new Date(appState.lastUpdated);
    const options = { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    lastUpdatedTime.textContent = date.toLocaleTimeString(undefined, options);
}

// Calculate stats for the header cards
function updateStats() {
    const total = appState.notes.length;
    const features = appState.notes.filter(n => n.type.toLowerCase() === 'feature').length;
    const issues = appState.notes.filter(n => n.type.toLowerCase() === 'issue').length;
    const others = total - features - issues;
    
    statTotal.textContent = total;
    statFeatures.textContent = features;
    statIssues.textContent = issues;
    statOthers.textContent = others;
}

// --- Feed Rendering & Logic ---

function getFilteredNotes() {
    // Filter
    let filteredNotes = appState.notes.filter(note => {
        // 1. Search Query filter
        const matchesSearch = appState.searchQuery === '' || 
            note.date.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
            note.type.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
            note.content_text.toLowerCase().includes(appState.searchQuery.toLowerCase());
            
        // 2. Category filter
        const matchesCategory = appState.selectedCategory === 'all' || 
            (appState.selectedCategory === 'other' ? 
                (note.type.toLowerCase() !== 'feature' && note.type.toLowerCase() !== 'issue') :
                note.type.toLowerCase() === appState.selectedCategory.toLowerCase());
            
        return matchesSearch && matchesCategory;
    });
    
    // Sort
    filteredNotes.sort((a, b) => {
        // Parsing dates to compare (e.g. "June 15, 2026")
        // Fortunately we have timestamp strings from Google Cloud feed as well, which are ISO format
        const dateA = new Date(a.timestamp || a.date);
        const dateB = new Date(b.timestamp || b.date);
        
        if (appState.sortBy === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    return filteredNotes;
}

function renderNotes() {
    const filteredNotes = getFilteredNotes();
    notesGrid.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        showEmpty();
        return;
    }
    
    filteredNotes.forEach(note => {
        const card = createNoteCard(note);
        notesGrid.appendChild(card);
    });
    
    showContent();
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    
    // Set custom highlight border color based on category
    let typeColor = 'var(--text-muted)';
    let badgeClass = 'badge-general';
    const cleanType = note.type.toLowerCase();
    
    if (cleanType === 'feature') {
        typeColor = 'var(--accent-emerald)';
        badgeClass = 'badge-feature';
    } else if (cleanType === 'issue') {
        typeColor = 'var(--accent-rose)';
        badgeClass = 'badge-issue';
    } else if (cleanType === 'changed') {
        typeColor = 'var(--accent-blue)';
        badgeClass = 'badge-changed';
    } else if (cleanType === 'deprecation') {
        typeColor = 'var(--accent-purple)';
        badgeClass = 'badge-deprecation';
    }
    
    card.style.setProperty('--accent-color', typeColor);
    
    card.innerHTML = `
        <div class="note-card-header">
            <span class="note-date">${note.date}</span>
            <span class="badge ${badgeClass}">${note.type}</span>
        </div>
        <div class="note-card-body">
            ${note.content_html}
        </div>
        <div class="note-card-footer">
            <button class="copy-card-btn" title="Copy update text to clipboard">
                <i class="fa-regular fa-copy"></i>
                <span>Copy</span>
            </button>
            <button class="tweet-card-btn" data-id="${note.id}">
                <i class="fa-brands fa-x-twitter"></i>
                <span>Tweet Update</span>
            </button>
        </div>
    `;
    
    // Bind click to Copy button
    const copyBtn = card.querySelector('.copy-card-btn');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(note.content_text).then(() => {
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
            
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Copy</span>';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy card text: ', err);
            // Fallback for older environments
            try {
                const el = document.createElement('textarea');
                el.value = note.content_text;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Copy</span>';
                }, 2000);
            } catch (e) {
                alert('Copy failed. Please manually select the text.');
            }
        });
    });

    // Bind click to Tweet button
    card.querySelector('.tweet-card-btn').addEventListener('click', () => {
        openTweetModal(note);
    });
    
    return card;
}

// --- Twitter / Tweet Integration ---

function openTweetModal(note) {
    appState.selectedNote = note;
    
    // Populate source preview
    modalNoteType.textContent = note.type;
    // Set class list for preview badge
    modalNoteType.className = 'badge';
    const cleanType = note.type.toLowerCase();
    if (cleanType === 'feature') modalNoteType.classList.add('badge-feature');
    else if (cleanType === 'issue') modalNoteType.classList.add('badge-issue');
    else if (cleanType === 'changed') modalNoteType.classList.add('badge-changed');
    else if (cleanType === 'deprecation') modalNoteType.classList.add('badge-deprecation');
    else modalNoteType.classList.add('badge-general');
    
    modalNoteDate.textContent = note.date;
    modalNoteContent.innerHTML = note.content_html;
    
    // Generate initial tweet draft with smart truncation
    const initialTweet = composeInitialTweetText(note);
    tweetTextarea.value = initialTweet;
    
    // Update character stats
    updateTweetCharacterCount();
    
    // Show Modal with body scroll lock
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reset Copy Button state
    copyTweetBtn.innerHTML = '<i class="fa-solid fa-copy"></i> <span>Copy Text</span>';
    copyTweetBtn.classList.remove('btn-primary');
    copyTweetBtn.classList.add('btn-secondary');
}

function closeTweetModal() {
    tweetModal.style.display = 'none';
    document.body.style.overflow = '';
    appState.selectedNote = null;
}

// Smart Tweet drafting with Twitter-compliant length rules
function composeInitialTweetText(note) {
    const titleText = note.type.toLowerCase() === 'feature' ? '🚀 New Feature' : '📢 BigQuery Update';
    const header = `${titleText} (${note.date}):\n\n`;
    
    // Twitter auto-wraps all links to 23 characters
    const tcoUrlLength = 23;
    const footer = `\n\nRead more:\n👉 ${note.link}\n\n#GCP #BigQuery`;
    
    // Fixed length overhead
    const headerLength = header.length;
    // Length of footer excluding the dynamic URL, plus 23 for the URL
    // "\n\nRead more:\n👉 " (16) + URL (23) + "\n\n#GCP #BigQuery" (15) = 54
    const footerLength = 16 + tcoUrlLength + 15;
    
    const availableSpace = 280 - headerLength - footerLength;
    
    let description = note.content_text;
    
    // If the content is too long, we smart truncate it
    if (description.length > availableSpace) {
        // Truncate to availableSpace - 3 (for ellipsis)
        let truncated = description.substring(0, availableSpace - 3);
        // Clean truncation to not break words in half
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > (availableSpace * 0.7)) {
            truncated = truncated.substring(0, lastSpace);
        }
        description = truncated.trim() + '...';
    }
    
    return `${header}${description}${footer}`;
}

// Update character counts and warnings
function updateTweetCharacterCount() {
    const text = tweetTextarea.value;
    
    // Smart character count estimation taking into account link wrapping
    // Find URLs in text and replace their length with 23 for Twitter counting
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    let estimatedLength = text.length;
    
    if (matches) {
        matches.forEach(url => {
            estimatedLength = estimatedLength - url.length + 23;
        });
    }
    
    currentCharCount.textContent = estimatedLength;
    
    // Warn and highlight if length is approaching or exceeding limits
    charCounter.className = 'char-counter';
    if (estimatedLength > 280) {
        charCounter.classList.add('danger');
        charWarning.style.display = 'flex';
        postTweetBtn.disabled = true;
        postTweetBtn.style.opacity = '0.5';
    } else {
        if (estimatedLength > 260) {
            charCounter.classList.add('warning');
        }
        charWarning.style.display = 'none';
        postTweetBtn.disabled = false;
        postTweetBtn.style.opacity = '1';
    }
}

// Copy Tweet textarea to user's clipboard
function copyTweetToClipboard() {
    tweetTextarea.select();
    tweetTextarea.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        navigator.clipboard.writeText(tweetTextarea.value).then(() => {
            // Success state feedback
            copyTweetBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
            copyTweetBtn.classList.remove('btn-secondary');
            copyTweetBtn.classList.add('btn-primary');
            
            // Revert back after 2 seconds
            setTimeout(() => {
                copyTweetBtn.innerHTML = '<i class="fa-solid fa-copy"></i> <span>Copy Text</span>';
                copyTweetBtn.classList.remove('btn-primary');
                copyTweetBtn.classList.add('btn-secondary');
            }, 2000);
        });
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        try {
            document.execCommand('copy');
            copyTweetBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
            setTimeout(() => {
                copyTweetBtn.innerHTML = '<i class="fa-solid fa-copy"></i> <span>Copy Text</span>';
            }, 2000);
        } catch (e) {
            alert('Could not copy automatically. Please select the text and copy manually.');
        }
    }
}

// Redirect to Twitter Web Intent with text prefilled
function postTweetToTwitter() {
    const text = tweetTextarea.value;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    window.open(tweetUrl, '_blank', 'width=550,height=420,referrerpolicy=no-referrer');
    
    closeTweetModal();
}

// Export the currently filtered notes list as a downloadable CSV file
function exportToCSV() {
    const filteredNotes = getFilteredNotes();
    if (filteredNotes.length === 0) {
        alert('No notes to export.');
        return;
    }
    
    // CSV headers
    const headers = ["Date", "Type", "Content Text", "Link"];
    const rows = [headers];
    
    // Add data rows
    filteredNotes.forEach(note => {
        rows.push([
            note.date,
            note.type,
            note.content_text,
            note.link
        ]);
    });
    
    // Convert array to CSV format with escaping
    const csvContent = rows.map(e => e.map(val => {
        const cleaned = (val || "").toString().replace(/"/g, '""');
        return `"${cleaned}"`;
    }).join(",")).join("\n");
    
    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        // Dynamic file naming: bigquery_release_notes_YYYY-MM-DD.csv
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `bigquery_release_notes_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error('Failed to export CSV: ', err);
        alert('Could not generate CSV export. Please try again.');
    }
}

// Initialize theme from localStorage preference
function initTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun';
        }
    } else {
        document.body.classList.remove('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-moon';
        }
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    if (document.body.classList.contains('light-theme')) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-moon';
        }
    } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun';
        }
    }
}

// Trigger a category filter and sync active button state
function triggerCategoryFilter(category) {
    filterButtons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    appState.selectedCategory = category;
    renderNotes();
}
