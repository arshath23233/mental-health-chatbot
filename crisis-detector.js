/* ========================================
   Crisis Keyword Detection System
   Detects distress keywords and triggers
   Indian helpline information display
   ======================================== */

class CrisisDetector {
    constructor() {
        // Crisis keyword categories with severity levels
        this.crisisPatterns = {
            severe: {
                keywords: [
                    'kill myself', 'suicide', 'suicidal', 'want to die', 'wanna die',
                    'end my life', 'end it all', 'better off dead', 'no reason to live',
                    'take my life', 'hang myself', 'overdose', 'slit my wrist',
                    'jump off', 'not worth living', 'dont want to live', "don't want to live",
                    'planning to die', 'goodbye forever', 'final goodbye', 'ending it',
                    'no way out', 'only option is death', 'wish i was dead', 'wish i were dead'
                ],
                severity: 3
            },
            selfHarm: {
                keywords: [
                    'harm myself', 'hurt myself', 'self harm', 'self-harm', 'cutting myself',
                    'cutting', 'burning myself', 'punish myself', 'hurting myself',
                    'want to hurt', 'feel like hurting', 'harm ourself', 'harm ourselves',
                    'injure myself', 'self injury', 'self-injury', 'hitting myself',
                    'scratching myself', 'pulling my hair', 'starving myself'
                ],
                severity: 3
            },
            harm: {
                keywords: [
                    'kill someone', 'hurt someone', 'harm someone', 'want to hurt',
                    'violent thoughts', 'homicidal', 'murder', 'attack someone'
                ],
                severity: 3
            },
            distress: {
                keywords: [
                    'cant go on', "can't go on", 'cant take it anymore', "can't take it anymore",
                    'giving up', 'hopeless', 'no hope', 'nothing matters',
                    'nobody would miss me', 'burden to everyone', 'everyone hates me',
                    'nobody loves me', 'all alone', 'no point', 'whats the point',
                    "what's the point", 'worthless', 'no future', 'trapped',
                    'desperate', 'cant breathe', "can't breathe", 'panic attack',
                    'losing my mind', 'going crazy', 'breaking down', 'falling apart'
                ],
                severity: 2
            },
            abuse: {
                keywords: [
                    'being abused', 'abuse', 'domestic violence', 'being beaten',
                    'sexual assault', 'raped', 'molested', 'harassed', 'stalked',
                    'threatened', 'unsafe at home', 'afraid of partner', 'hitting me',
                    'forced me', 'trafficked'
                ],
                severity: 2
            }
        };

        // Track crisis detections to avoid showing modal repeatedly
        this.lastCrisisTime = 0;
        this.crisisCooldown = 120000; // 2 minutes cooldown
        this.crisisCount = 0;
    }

    /**
     * Check a message for crisis keywords
     * @returns {Object|null} Crisis detection result
     */
    detect(message) {
        const lowerMsg = message.toLowerCase().trim();
        let highestSeverity = 0;
        let matchedCategory = null;
        let matchedKeywords = [];

        for (const [category, data] of Object.entries(this.crisisPatterns)) {
            for (const keyword of data.keywords) {
                if (lowerMsg.includes(keyword)) {
                    matchedKeywords.push(keyword);
                    if (data.severity > highestSeverity) {
                        highestSeverity = data.severity;
                        matchedCategory = category;
                    }
                }
            }
        }

        if (highestSeverity === 0) return null;

        const now = Date.now();
        const shouldShowModal = (now - this.lastCrisisTime) > this.crisisCooldown;
        
        if (shouldShowModal) {
            this.lastCrisisTime = now;
            this.crisisCount++;
        }

        return {
            severity: highestSeverity,
            category: matchedCategory,
            keywords: matchedKeywords,
            showModal: shouldShowModal,
            crisisResponse: this.getCrisisResponse(matchedCategory, highestSeverity)
        };
    }

    /**
     * Generate an empathetic crisis response
     */
    getCrisisResponse(category, severity) {
        const responses = {
            severe: [
                "I hear you, and I want you to know that your life has value — even when it doesn't feel that way right now. What you're feeling is temporary, even though it feels permanent. Please, please talk to someone who can help.",
                "I care about you, and I'm worried about what you've shared. You deserve support from someone trained to help. Would you consider calling one of these helplines? They're confidential, and the people there truly want to help.",
                "Thank you for trusting me with something so heavy. You don't have to face this alone. There are people right now, waiting to talk to you, who understand exactly what you're going through."
            ],
            selfHarm: [
                "I can sense how much pain you're in right now, and I want you to know that hurting yourself isn't the answer, even though it might feel like the only option. You deserve kindness — especially from yourself.",
                "What you're describing tells me you're in a lot of pain. There are healthier ways to cope with these intense feelings, and someone at these helplines can help you find them.",
                "I hear you, and I'm concerned. The urge to harm yourself is a signal that you need more support than I can offer. Please reach out to one of these helplines — they can help you through this moment."
            ],
            harm: [
                "It sounds like you're experiencing some very intense emotions right now. Having thoughts like these can be really frightening. Please talk to a professional who can help you work through this safely.",
                "I understand you're feeling extremely overwhelmed. These feelings are a sign that you need professional support. Please reach out to one of these helplines right away."
            ],
            distress: [
                "I can feel how overwhelmed you are right now, and I want you to know — this feeling won't last forever. Please be gentle with yourself. If things feel unbearable, these helplines are here for you, 24/7.",
                "You're going through something really tough, and it's okay to not be okay. But please know that help is available. Sometimes hearing another human voice can make all the difference.",
                "I hear the pain in your words, and I wish I could take it away. While I can listen, a trained counselor can offer you the deeper support you deserve right now."
            ],
            abuse: [
                "What you're describing is serious, and you don't deserve to be treated that way. Your safety matters. Please reach out to one of these helplines — they can help you find a safe path forward.",
                "I'm so sorry you're going through this. No one deserves to be in an unsafe situation. There are people trained to help with exactly what you're experiencing. Please consider calling one of these numbers.",
                "Thank you for sharing something so difficult. You are brave for speaking up. These helplines can provide confidential support and help you explore your options safely."
            ]
        };

        const categoryResponses = responses[category] || responses.distress;
        return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
    }

    /**
     * Get inline crisis warning HTML for chat
     */
    getInlineWarning() {
        return `<div class="crisis-inline-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>If you're in immediate danger, please call 112 (Emergency)</strong><br>
                <a href="tel:9999666555">Vandrevala Foundation: 9999 666 555</a> (24/7) &nbsp;|&nbsp; 
                <a href="tel:18005990019">Kiran Helpline: 1800-599-0019</a> (Toll Free)
            </div>
        </div>`;
    }
}
