/* ========================================
   MindSpace — Main Application Controller
   ======================================== */

// Global instances
let chatbot, crisisDetector, journalManager, dashboardManager;
let currentView = 'chat';
let isProcessing = false;
let autoSaveTimer = null;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    chatbot = new ChatbotEngine();
    crisisDetector = new CrisisDetector();
    journalManager = new JournalManager();
    dashboardManager = new DashboardManager();

    initOnboarding();
    initChat();
    initNavigation();
    initJournal();
    initCrisisModal();

    // Check if user has previous session
    const savedName = localStorage.getItem('mindspace_user');
    if (savedName) {
        startApp(savedName);
    }
});

// ========================================
// Onboarding
// ========================================

function initOnboarding() {
    const input = document.getElementById('userName');
    const btn = document.getElementById('startBtn');

    input.addEventListener('input', () => {
        btn.disabled = input.value.trim().length === 0;
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            startApp(input.value.trim());
        }
    });

    btn.addEventListener('click', () => {
        if (input.value.trim()) {
            startApp(input.value.trim());
        }
    });
}

function startApp(name) {
    localStorage.setItem('mindspace_user', name);
    chatbot.userName = name;

    // Update UI
    document.getElementById('displayName').textContent = name;
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();

    // Hide onboarding, show app
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Start new chat session
    startNewChat();

    // Load journal entries
    journalManager.loadEntries().then(() => {
        updateJournalView();
        updateDashboard();
    });
}

// ========================================
// Navigation
// ========================================

function initNavigation() {
    // Sidebar nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchView(item.dataset.view);
            closeSidebar();
        });
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);

    // New chat button
    document.getElementById('newChatBtn').addEventListener('click', () => {
        if (chatbot.conversationHistory.length > 2) {
            saveCurrentChat();
        }
        startNewChat();
        switchView('chat');
        closeSidebar();
    });

    // SOS button
    document.getElementById('sosBtn').addEventListener('click', showCrisisModal);

    // Save journal button
    document.getElementById('saveJournalBtn').addEventListener('click', () => {
        saveCurrentChat(true);
    });

    // Create sidebar overlay for mobile
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    overlay.addEventListener('click', closeSidebar);
    document.getElementById('app').appendChild(overlay);
}

function switchView(viewName) {
    currentView = viewName;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const viewMap = {
        chat: 'chatView',
        journal: 'journalView',
        dashboard: 'dashboardView',
        helpline: 'helplineView',
        about: 'aboutView'
    };

    const panel = document.getElementById(viewMap[viewName]);
    if (panel) panel.classList.add('active');

    // Update top bar title
    const titles = {
        chat: '<i class="fas fa-comments"></i><span>Chat with MindSpace</span>',
        journal: '<i class="fas fa-book-open"></i><span>My Journal</span>',
        dashboard: '<i class="fas fa-chart-area"></i><span>Mood Dashboard</span>',
        helpline: '<i class="fas fa-hands-helping"></i><span>Crisis Helplines</span>',
        about: '<i class="fas fa-info-circle"></i><span>About MindSpace</span>'
    };
    document.getElementById('topBarTitle').innerHTML = titles[viewName] || titles.chat;

    // Refresh data when switching views
    if (viewName === 'journal') updateJournalView();
    if (viewName === 'dashboard') updateDashboard();

    // Show/hide save button
    document.getElementById('saveJournalBtn').style.display = viewName === 'chat' ? '' : 'none';
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ========================================
// Chat System
// ========================================

function initChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        sendBtn.disabled = input.value.trim().length === 0;
    });

    // Send on Enter (Shift+Enter for new line)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Mood chips
    document.querySelectorAll('.mood-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const mood = chip.dataset.mood;
            document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            
            // Send as message
            const moodMessages = {
                happy: "I'm actually feeling pretty happy today!",
                sad: "Honestly, I'm feeling really sad right now",
                anxious: "My anxiety has been really bad lately",
                angry: "I'm so frustrated and angry right now",
                stressed: "I'm so stressed out, everything feels like too much",
                grateful: "I'm feeling grateful for some things in my life",
                lonely: "I've been feeling really lonely lately",
                confused: "I'm so confused, I don't know what to do"
            };
            
            document.getElementById('chatInput').value = moodMessages[mood] || `I'm feeling ${mood}`;
            sendMessage();
        });
    });
}

function startNewChat() {
    chatbot.reset();
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    // Show welcome message
    const welcomeMsg = chatbot.getWelcomeMessage();
    addBotMessage(welcomeMsg);

    // Show mood quick select
    document.getElementById('moodQuickSelect').classList.remove('hidden');

    // Clear input
    const input = document.getElementById('chatInput');
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;

    // Reset mood chips
    document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));

    // Set up auto-save timer
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (chatbot.conversationHistory.length > 4) {
            saveCurrentChat(false);
        }
    }, 300000); // Auto-save every 5 minutes
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || isProcessing) return;

    isProcessing = true;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;

    // Hide mood quick select after first message
    document.getElementById('moodQuickSelect').classList.add('hidden');

    // Add user message to chat
    addUserMessage(message);

    // Check for crisis keywords FIRST
    const crisisResult = crisisDetector.detect(message);

    // Show typing indicator
    showTyping();

    // Simulate natural thinking time — humans don't respond instantly
    // Short messages = faster reply, long/emotional = longer "thinking"
    const baseTime = 900;
    const perChar = Math.random() * 12 + 8; // 8-20ms per char, variable
    const emotionalBonus = crisisResult ? 600 : (chatbot.moodScore <= 3 ? 400 : 0);
    const randomJitter = Math.floor(Math.random() * 500) - 200; // ±200ms randomness
    const thinkTime = Math.min(baseTime + message.length * perChar + emotionalBonus + randomJitter, 3200);
    await sleep(Math.max(thinkTime, 700));

    // Generate bot response
    const response = chatbot.generateResponse(message);

    // Hide typing
    hideTyping();

    // If crisis detected, show crisis response first
    if (crisisResult) {
        addBotMessage(crisisResult.crisisResponse, true);
        
        if (crisisResult.showModal) {
            await sleep(500);
            showCrisisModal();
        }
    } else {
        addBotMessage(response.message, false, response.suggestions);
    }

    // Scroll to bottom
    scrollToBottom();

    isProcessing = false;
}

function addUserMessage(text) {
    const container = document.getElementById('chatMessages');
    const initial = (chatbot.userName || 'U').charAt(0).toUpperCase();
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const msgEl = document.createElement('div');
    msgEl.className = 'message user';
    msgEl.innerHTML = `
        <div class="message-avatar">${initial}</div>
        <div class="message-bubble">
            ${escapeHTML(text)}
            <span class="message-time">${time}</span>
        </div>
    `;
    container.appendChild(msgEl);
    scrollToBottom();
}

function addBotMessage(text, isCrisis = false, suggestions = []) {
    const container = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Format text with paragraphs
    const formattedText = text.split('\n\n').map(p => `<p>${escapeHTML(p)}</p>`).join('');

    let extra = '';
    
    // Add crisis inline warning
    if (isCrisis) {
        extra += crisisDetector.getInlineWarning();
    }

    // Add suggestion chips
    if (suggestions && suggestions.length > 0 && !isCrisis) {
        extra += '<div class="suggestion-chips">';
        suggestions.forEach(s => {
            extra += `<button class="suggestion-chip" onclick="useSuggestion(this)">${escapeHTML(s)}</button>`;
        });
        extra += '</div>';
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'message bot';
    msgEl.innerHTML = `
        <div class="message-avatar"><i class="fas fa-brain"></i></div>
        <div class="message-bubble">
            ${formattedText}
            ${extra}
            <span class="message-time">${time}</span>
        </div>
    `;
    container.appendChild(msgEl);
    scrollToBottom();
}

function useSuggestion(btn) {
    const text = btn.textContent;
    document.getElementById('chatInput').value = text;
    // Remove all suggestion chips after clicking one
    document.querySelectorAll('.suggestion-chips').forEach(el => el.remove());
    sendMessage();
}

function showTyping() {
    document.getElementById('typingIndicator').classList.remove('hidden');
    scrollToBottom();
}

function hideTyping() {
    document.getElementById('typingIndicator').classList.add('hidden');
}

function scrollToBottom() {
    const container = document.querySelector('.chat-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// ========================================
// Journal Management
// ========================================

function initJournal() {
    // Search
    document.getElementById('journalSearch').addEventListener('input', (e) => {
        renderJournalList(e.target.value, document.getElementById('journalFilter').value);
    });

    // Filter
    document.getElementById('journalFilter').addEventListener('change', (e) => {
        renderJournalList(document.getElementById('journalSearch').value, e.target.value);
    });

    // Back button in detail view
    document.getElementById('journalBackBtn').addEventListener('click', () => {
        document.getElementById('journalDetailOverlay').classList.add('hidden');
    });
}

function updateJournalView() {
    renderJournalList(
        document.getElementById('journalSearch').value,
        document.getElementById('journalFilter').value
    );
}

function renderJournalList(searchQuery = '', moodFilter = 'all') {
    let entries = journalManager.entries;

    // Apply search
    if (searchQuery) {
        entries = journalManager.search(searchQuery);
    }

    // Apply mood filter
    if (moodFilter !== 'all') {
        entries = entries.filter(e => e.mood === moodFilter);
    }

    const container = document.getElementById('journalList');

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="journal-empty">
                <i class="fas fa-feather-alt"></i>
                <h3>${searchQuery || moodFilter !== 'all' ? 'No matching entries' : 'Your journal is empty'}</h3>
                <p>${searchQuery || moodFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Start a conversation with MindSpace and your chats will be saved as journal entries automatically.'}</p>
                ${!searchQuery && moodFilter === 'all' ? '<button class="btn-primary" onclick="switchView(\'chat\')">Start Chatting</button>' : ''}
            </div>
        `;
        return;
    }

    const moodEmojis = { happy: '😊', sad: '😢', anxious: '😰', angry: '😠', stressed: '😫', grateful: '🙏', lonely: '😔', confused: '🤔', neutral: '😐', hopeful: '🌟' };

    container.innerHTML = entries.map(entry => {
        const emoji = moodEmojis[entry.mood] || '📝';
        const date = entry.date ? new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown date';
        const time = entry.date ? new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
        const tags = (entry.tags || []).map(t => `<span class="journal-tag">${t}</span>`).join('');
        const score = entry.mood_score || 5;

        return `
            <div class="journal-card" data-mood="${entry.mood}" onclick="openJournalDetail('${entry.id}')">
                <div class="journal-card-mood">${emoji}</div>
                <div class="journal-card-content">
                    <div class="journal-card-title">${escapeHTML(entry.title || 'Untitled Entry')}</div>
                    <div class="journal-card-summary">${escapeHTML(entry.summary || 'No summary available')}</div>
                    <div class="journal-card-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-clock"></i> ${time}</span>
                        <span><i class="fas fa-heart"></i> ${score}/10</span>
                        <span class="journal-card-tags">${tags}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openJournalDetail(entryId) {
    const entry = journalManager.entries.find(e => e.id === entryId);
    if (!entry) return;

    const moodEmojis = { happy: '😊', sad: '😢', anxious: '😰', angry: '😠', stressed: '😫', grateful: '🙏', lonely: '😔', confused: '🤔', neutral: '😐', hopeful: '🌟' };
    
    const conversation = typeof entry.conversation === 'string' 
        ? JSON.parse(entry.conversation) 
        : (entry.conversation || []);

    const date = entry.date ? new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date';
    const emoji = moodEmojis[entry.mood] || '📝';
    const initial = (entry.user_name || 'U').charAt(0).toUpperCase();

    const conversationHTML = conversation.map(msg => {
        const isBot = msg.role === 'bot';
        const formatted = escapeHTML(msg.content).split('\n\n').map(p => `<p>${p}</p>`).join('');
        return `
            <div class="journal-msg ${isBot ? 'bot-msg' : 'user-msg'}">
                <div class="journal-msg-avatar">
                    ${isBot ? '<i class="fas fa-brain"></i>' : initial}
                </div>
                <div>
                    <div class="journal-msg-sender">${isBot ? 'MindSpace' : (entry.user_name || 'You')}</div>
                    <div class="journal-msg-text">${formatted}</div>
                </div>
            </div>
        `;
    }).join('');

    const content = document.getElementById('journalDetailContent');
    content.innerHTML = `
        <h1 class="journal-detail-title">${escapeHTML(entry.title || 'Untitled Entry')}</h1>
        <div class="journal-detail-meta">
            <span><i class="fas fa-calendar-alt"></i> ${date}</span>
            <span><i class="fas fa-${entry.mood === 'happy' || entry.mood === 'grateful' ? 'smile' : 'heart'}"></i> ${emoji} ${capitalize(entry.mood)} (${entry.mood_score || 5}/10)</span>
            <span><i class="fas fa-tags"></i> ${(entry.tags || []).join(', ') || 'None'}</span>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 20px; font-style: italic;">${escapeHTML(entry.summary || '')}</p>
        <div class="journal-detail-conversation">
            ${conversationHTML || '<p style="color: var(--text-muted); text-align: center;">No conversation data available.</p>'}
        </div>
    `;

    // Set up export button
    document.getElementById('exportJournalBtn').onclick = () => {
        const text = journalManager.exportAsText(entry);
        downloadText(text, `mindspace_journal_${entry.id}.txt`);
        showToast('Journal exported successfully!', 'success');
    };

    // Set up delete button
    document.getElementById('deleteJournalBtn').onclick = async () => {
        if (confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
            await journalManager.deleteEntry(entryId);
            document.getElementById('journalDetailOverlay').classList.add('hidden');
            updateJournalView();
            updateDashboard();
            showToast('Journal entry deleted.', 'info');
        }
    };

    document.getElementById('journalDetailOverlay').classList.remove('hidden');
}

async function saveCurrentChat(showNotification = false) {
    if (chatbot.conversationHistory.length < 2) {
        if (showNotification) showToast('Have a conversation first before saving!', 'info');
        return;
    }

    try {
        const entry = await journalManager.saveEntry(chatbot);
        if (entry && showNotification) {
            showToast('💾 Conversation saved to your journal!', 'success');
        }
    } catch (error) {
        console.error('Save error:', error);
        if (showNotification) showToast('Failed to save. Trying local backup...', 'error');
    }
}

// ========================================
// Dashboard
// ========================================

function updateDashboard() {
    const analytics = journalManager.getAnalytics();
    dashboardManager.update(analytics);
}

// ========================================
// Crisis Modal
// ========================================

function initCrisisModal() {
    document.getElementById('closeCrisisBtn').addEventListener('click', closeCrisisModal);

    // Close on overlay click
    document.getElementById('crisisModal').addEventListener('click', (e) => {
        if (e.target.id === 'crisisModal') closeCrisisModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCrisisModal();
            closeSidebar();
        }
    });
}

function showCrisisModal() {
    document.getElementById('crisisModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCrisisModal() {
    document.getElementById('crisisModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// ========================================
// Utility Functions
// ========================================

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

function downloadText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make switchView globally accessible
window.switchView = switchView;
window.useSuggestion = useSuggestion;
window.openJournalDetail = openJournalDetail;
window.closeCrisisModal = closeCrisisModal;
