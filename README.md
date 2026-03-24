# 🧠 MindSpace — Mental Health Journal Chatbot

> A safe, empathetic AI-powered journaling companion that helps users reflect, express, and heal through conversation.

**Final Year Project** — Mental Health Journal Chatbot with Crisis Detection & Indian Helplines

---

## 🎯 Project Overview

MindSpace is a web-based mental health journal chatbot that provides a non-judgmental, empathetic conversational space for users. It combines therapeutic conversation techniques with automatic journaling, mood tracking, and real-time crisis detection with Indian helpline integration.

### What Makes This Different

Unlike typical chatbots, MindSpace uses a **custom NLP-inspired empathetic response engine** built from the ground up — no external AI APIs required. It employs:

- **Therapeutic conversation techniques** (validation, reflection, open-ended questioning, coping strategies)
- **Context-aware topic detection** (work, relationships, family, academics, sleep, self-worth)
- **Emotion-weighted keyword analysis** for nuanced mood detection
- **Conversation depth tracking** (surface → medium → deep) for appropriate response depth
- **Human-like conversational touches** (thinking phrases, varied sentence starters, non-repetitive responses)

---

## ✅ Completed Features

### 1. 💬 Empathetic Chatbot Engine (`js/chatbot-engine.js`)
- **Human-like responses** using therapeutic conversation patterns
- **9 emotion categories** with weighted keyword detection: happy, sad, anxious, angry, stressed, grateful, lonely, confused, hopeful
- **7 topic categories**: work, relationships, family, academics, sleep, self-worth, gratitude
- **5 therapeutic techniques**: validation, reflection, open-ended questions, coping strategies, encouragement
- **Conversation depth tracking** — adapts response style based on how deep the conversation goes
- **Anti-repetition system** — tracks recently used responses to avoid repetition
- **Suggestion chips** — contextual quick-reply options based on detected mood
- **Natural typing delay** — variable response time based on message length

### 2. 🚨 Crisis Detection System (`js/crisis-detector.js`)
- **Real-time keyword monitoring** across 5 severity categories:
  - Severe (suicidal ideation)
  - Self-harm
  - Harm to others
  - High distress
  - Abuse/safety concerns
- **Animated crisis modal** with Indian helpline numbers
- **Inline warning banners** in chat messages
- **Cooldown system** to avoid overwhelming the user (2-minute cooldown between modals)

### 3. 📞 Indian Crisis Helplines
| Helpline | Number | Availability |
|----------|--------|-------------|
| Vandrevala Foundation | 9999 666 555 | 24/7, Multilingual |
| iCall (TISS) | 9152 987 821 | Mon–Sat, 8AM–10PM |
| NIMHANS | 080-46110007 | Toll Free |
| Kiran Mental Health (Govt) | 1800-599-0019 | Toll Free, 24/7 |
| AASRA | 9820 466 726 | 24/7 |
| Snehi | 044-24640050 | 24/7 |
| Connecting Trust | 9922 001 122 | 12PM–8PM |
| Roshni Trust | 040-66202000 | 11AM–9PM |

### 4. 📓 Automatic Journal Saving (`js/journal-manager.js`)
- **Auto-saves conversations** as journal entries with REST API
- **LocalStorage backup** if API is unavailable
- **Journal entry includes**: title, mood, mood score, tags, summary, full conversation
- **Search & filter** by mood or keyword
- **Detailed journal view** with full conversation replay
- **Export as text file** (.txt download)
- **Delete entries** with confirmation

### 5. 📊 Mood Analytics Dashboard (`js/dashboard.js`)
- **Mood Over Time** — line chart showing mood score trends (Chart.js)
- **Mood Distribution** — doughnut chart of emotional patterns
- **Stats cards**: total entries, journaling streak, average mood, most frequent mood
- **Color-coded mood indicators** throughout the app

### 6. 🎨 Calming UI/UX Design
- **Therapeutic color palette** — soft teal, lavender, warm earth tones
- **Animated ambient background** with floating orbs
- **Smooth animations** on all interactions
- **Responsive design** — works on desktop, tablet, and mobile
- **Sidebar navigation** with mobile hamburger menu
- **Toast notifications** for user feedback
- **Accessibility considerations** (semantic HTML, ARIA labels)

### 7. 👤 User Onboarding
- Name personalization — bot uses your name throughout conversations
- Session persistence via localStorage
- Welcome screen with feature overview

---

## 📂 Project Structure

```
index.html                 — Main application HTML
css/
  ├── style.css            — Core styles, layout, onboarding, sidebar
  ├── chat.css             — Chat interface styles
  ├── journal.css          — Journal view styles
  ├── crisis.css           — Crisis modal & helpline page styles
  ├── dashboard.css        — Analytics dashboard styles
  └── responsive.css       — Mobile & tablet responsive styles
js/
  ├── chatbot-engine.js    — Core empathetic chatbot engine
  ├── crisis-detector.js   — Crisis keyword detection system
  ├── journal-manager.js   — Journal CRUD operations
  ├── dashboard.js         — Mood analytics & Chart.js rendering
  └── app.js               — Main application controller
```

---

## 🛤️ Functional Entry URIs

| Path | Description |
|------|-------------|
| `index.html` | Main application (all views are single-page) |
| `index.html#chat` | Chat view (default) |
| `index.html#journal` | Journal entries view |
| `index.html#dashboard` | Mood analytics dashboard |
| `index.html#helpline` | Indian crisis helplines directory |
| `index.html#about` | About MindSpace |

---

## 💾 Data Model

### Table: `journal_entries`

| Field | Type | Description |
|-------|------|-------------|
| `id` | text | Unique identifier (UUID) |
| `session_id` | text | Chat session identifier |
| `user_name` | text | User display name |
| `title` | text | Auto-generated journal title |
| `conversation` | rich_text | Full conversation JSON array |
| `mood` | text | Detected mood (enum: happy, sad, anxious, angry, neutral, hopeful, stressed, grateful, lonely, confused) |
| `mood_score` | number | Mood score 1-10 |
| `tags` | array | Topics discussed |
| `summary` | text | Brief entry summary |
| `date` | text | ISO date string |

### API Endpoints Used
- `GET tables/journal_entries` — List all journal entries
- `POST tables/journal_entries` — Save new journal entry
- `DELETE tables/journal_entries/{id}` — Delete journal entry

---

## 🔑 Crisis Keywords That Trigger Helpline Modal

The system monitors for keywords across these categories:
- **Suicidal ideation**: kill myself, suicide, want to die, end my life, etc.
- **Self-harm**: harm myself, hurt myself, self harm, cutting, harm ourself, etc.
- **Harm to others**: kill someone, violent thoughts, etc.
- **High distress**: hopeless, giving up, can't go on, worthless, etc.
- **Abuse**: domestic violence, sexual assault, unsafe at home, etc.

---

## 🛠️ Technologies Used

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, Flexbox, Grid, animations, backdrop-filter
- **JavaScript (ES6+)** — Classes, async/await, Promises
- **Chart.js** — Mood analytics visualization
- **Font Awesome 6** — Icons
- **Google Fonts** — Inter + Playfair Display typography
- **REST API** — Journal data persistence

---

## 🚀 Recommended Next Steps

1. **Add breathing exercise module** — guided 4-7-8 breathing with visual timer
2. **Implement daily check-in reminders** — notification prompts for regular journaling
3. **Add gratitude journaling mode** — structured gratitude prompts
4. **Expand chatbot vocabulary** — add more response templates and topics
5. **Add CBT (Cognitive Behavioral Therapy) tools** — thought challenging worksheets
6. **Multi-language support** — Hindi, Tamil, and other Indian languages
7. **Progressive Web App (PWA)** — offline support and installability
8. **Data export** — export all journal data as CSV/PDF
9. **Therapist referral integration** — connect with mental health professionals
10. **Voice input** — speech-to-text for hands-free journaling

---

## ⚠️ Disclaimer

MindSpace is an **academic project** and is **not a substitute for professional mental health treatment**. It does not provide medical advice, diagnosis, or treatment. If you or someone you know is in crisis, please contact emergency services (112) or one of the helplines listed in the application.

---

*Built with 💚 as a Final Year Project*
