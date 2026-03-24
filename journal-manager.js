/* ========================================
   Journal Manager
   Handles saving, loading, and managing
   journal entries via the Table API
   ======================================== */

class JournalManager {
    constructor() {
        this.tableName = 'journal_entries';
        this.entries = [];
        this.isLoaded = false;
    }

    /**
     * Load all journal entries from the API
     */
    async loadEntries() {
        try {
            const response = await fetch(`tables/${this.tableName}?limit=1000&sort=-created_at`);
            if (!response.ok) throw new Error('Failed to load entries');
            const data = await response.json();
            this.entries = data.data || [];
            this.isLoaded = true;
            return this.entries;
        } catch (error) {
            console.error('Error loading journal entries:', error);
            // Fallback to local storage
            this.entries = JSON.parse(localStorage.getItem('mindspace_journals') || '[]');
            this.isLoaded = true;
            return this.entries;
        }
    }

    /**
     * Save a new journal entry
     */
    async saveEntry(chatbot) {
        const conversation = chatbot.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
        }));

        if (conversation.length < 2) return null;

        const entry = {
            session_id: this.generateSessionId(),
            user_name: chatbot.userName,
            title: chatbot.generateTitle(),
            conversation: JSON.stringify(conversation),
            mood: chatbot.detectedMood,
            mood_score: chatbot.moodScore,
            tags: Array.from(chatbot.sessionTags),
            summary: chatbot.generateSummary(),
            date: new Date().toISOString()
        };

        try {
            const response = await fetch(`tables/${this.tableName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            
            if (!response.ok) throw new Error('Failed to save entry');
            
            const savedEntry = await response.json();
            this.entries.unshift(savedEntry);
            
            // Also save to local storage as backup
            this.saveToLocalStorage();
            
            return savedEntry;
        } catch (error) {
            console.error('Error saving journal entry:', error);
            // Fallback: save to localStorage
            entry.id = this.generateSessionId();
            entry.created_at = Date.now();
            this.entries.unshift(entry);
            this.saveToLocalStorage();
            return entry;
        }
    }

    /**
     * Delete a journal entry
     */
    async deleteEntry(entryId) {
        try {
            const response = await fetch(`tables/${this.tableName}/${entryId}`, {
                method: 'DELETE'
            });
            
            this.entries = this.entries.filter(e => e.id !== entryId);
            this.saveToLocalStorage();
            return true;
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.entries = this.entries.filter(e => e.id !== entryId);
            this.saveToLocalStorage();
            return true;
        }
    }

    /**
     * Get entries filtered by mood
     */
    getByMood(mood) {
        if (mood === 'all') return this.entries;
        return this.entries.filter(e => e.mood === mood);
    }

    /**
     * Search entries by keyword
     */
    search(query) {
        if (!query) return this.entries;
        const lower = query.toLowerCase();
        return this.entries.filter(e => {
            return (e.title && e.title.toLowerCase().includes(lower)) ||
                   (e.summary && e.summary.toLowerCase().includes(lower)) ||
                   (e.mood && e.mood.toLowerCase().includes(lower));
        });
    }

    /**
     * Get mood analytics data
     */
    getAnalytics() {
        if (this.entries.length === 0) return null;

        // Mood distribution
        const moodDist = {};
        const moodScores = [];
        const timeline = [];
        const dates = new Set();

        this.entries.forEach(entry => {
            // Mood distribution
            const mood = entry.mood || 'neutral';
            moodDist[mood] = (moodDist[mood] || 0) + 1;

            // Mood scores over time
            const score = entry.mood_score || 5;
            moodScores.push(score);

            // Timeline data
            const date = entry.date ? new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
            timeline.push({ date, score, mood });
            dates.add(entry.date ? new Date(entry.date).toDateString() : '');
        });

        // Average mood
        const avgMood = moodScores.length > 0 
            ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1) 
            : 0;

        // Most frequent mood
        const topMood = Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0];

        // Calculate streak
        const streak = this.calculateStreak();

        return {
            totalEntries: this.entries.length,
            moodDistribution: moodDist,
            averageMood: avgMood,
            topMood: topMood ? topMood[0] : 'neutral',
            timeline: timeline.reverse(),
            streak,
            uniqueDays: dates.size
        };
    }

    /**
     * Calculate journaling streak
     */
    calculateStreak() {
        if (this.entries.length === 0) return 0;

        const dates = this.entries
            .map(e => e.date ? new Date(e.date).toDateString() : null)
            .filter(Boolean);
        
        const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
        
        if (uniqueDates.length === 0) return 0;

        let streak = 1;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        // Check if most recent entry is today or yesterday
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
        
        for (let i = 1; i < uniqueDates.length; i++) {
            const current = new Date(uniqueDates[i - 1]);
            const prev = new Date(uniqueDates[i]);
            const diff = (current - prev) / 86400000;
            
            if (diff <= 1.5) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Export entry as text
     */
    exportAsText(entry) {
        const conversation = typeof entry.conversation === 'string' 
            ? JSON.parse(entry.conversation) 
            : entry.conversation;

        let text = `=================================\n`;
        text += `📓 ${entry.title}\n`;
        text += `=================================\n\n`;
        text += `Date: ${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        text += `Mood: ${entry.mood} (${entry.mood_score}/10)\n`;
        text += `Tags: ${(entry.tags || []).join(', ') || 'None'}\n`;
        text += `Summary: ${entry.summary}\n\n`;
        text += `---------------------------------\n\n`;

        conversation.forEach(msg => {
            const sender = msg.role === 'user' ? '🧑 You' : '🧠 MindSpace';
            const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            text += `[${time}] ${sender}:\n${msg.content}\n\n`;
        });

        text += `=================================\n`;
        text += `Generated by MindSpace — Mental Health Journal Chatbot\n`;

        return text;
    }

    /**
     * Utilities
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('mindspace_journals', JSON.stringify(this.entries.slice(0, 100)));
        } catch (e) {
            console.warn('localStorage save failed:', e);
        }
    }
}
