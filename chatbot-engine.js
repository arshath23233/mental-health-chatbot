/* ========================================
   MindSpace Chatbot Engine v2
   Deeply human, conversational, empathetic
   ======================================== */

class ChatbotEngine {
    constructor() {
        this.conversationHistory = [];
        this.userName = 'Friend';
        this.detectedMood = 'neutral';
        this.moodScore = 5;
        this.sessionTags = new Set();
        this.turnCount = 0;
        this.lastTopic = null;
        this.prevTopic = null;
        this.emotionTracker = {};
        this.usedResponses = new Set();
        this.userMemory = {            // remembers what user shared
            keyPhrases: [],
            people: [],
            feelings: [],
            events: [],
            positives: []
        };
        this.lastBotIntent = null;     // what the bot last asked/did
        this.consecutiveLowMood = 0;
        this.userWordCount = 0;        // tracks verbosity trend
        this.hasSharedDeep = false;

        this.initializePatterns();
    }

    // ======== PATTERNS & DATA ========

    initializePatterns() {

        this.emotionPatterns = {
            happy:    { keywords: ['happy','joy','great','wonderful','amazing','excited','fantastic','good day','blessed','grateful','smile','laugh','fun','love it','thrilled','delighted','cheerful','optimistic','proud','accomplished','celebrate','awesome','brilliant','perfect day','good mood','stoked','pumped','ecstatic','on top of the world','feeling great','so good'], score: 8, emoji: '😊' },
            sad:      { keywords: ['sad','unhappy','depressed','crying','tears','heartbroken','miss','grief','mourning','empty','hopeless','down','blue','miserable','devastated','numb','broken','shattered','low','gloomy','hurting','aching','heavy','weighed down','feel nothing','dark place','rock bottom'], score: 2, emoji: '😢' },
            anxious:  { keywords: ['anxious','anxiety','worried','nervous','panic','scared','fear','terrified','overthinking','restless','tense','overwhelmed','dread','uneasy','apprehensive','cant sleep','insomnia','racing thoughts','what if','paranoid','phobia','on edge','freaking out','spiraling','knots in my stomach','heart racing','shaking'], score: 3, emoji: '😰' },
            angry:    { keywords: ['angry','furious','mad','rage','frustrated','annoyed','irritated','pissed','hate','unfair','resentful','bitter','hostile','agitated','fed up','sick of','livid','enraged','outraged','disgusted','fuming','boiling','snapped','lost my temper','seeing red'], score: 3, emoji: '😠' },
            stressed: { keywords: ['stressed','pressure','burnout','exhausted','overworked','deadline','too much','cant cope','breaking point','drowning','suffocating','no time','demanding','hectic','chaotic','burden','struggling','swamped','overwhelmed','running on empty','burning out','spread thin','stretched','maxed out'], score: 3, emoji: '😫' },
            grateful: { keywords: ['grateful','thankful','blessed','appreciate','fortunate','lucky','count my blessings','valued','content','at peace','serene','fulfilled'], score: 8, emoji: '🙏' },
            lonely:   { keywords: ['lonely','alone','isolated','no friends','nobody cares','left out','abandoned','rejected','disconnected','invisible','unwanted','forgotten','nobody understands','on my own','no one to talk to','by myself','feel so alone'], score: 2, emoji: '😔' },
            confused: { keywords: ['confused','lost','dont know',"don't know",'uncertain','unsure','mixed feelings','conflicted','torn','indecisive','unclear','stuck','questioning','what should i do','no idea','crossroads','all over the place','cant think straight',"can't figure"], score: 4, emoji: '🤔' },
            hopeful:  { keywords: ['hope','hopeful','looking forward','better days','improving','getting better','optimistic','positive','new start','fresh start','motivated','inspired','determined','turning a corner','light at the end'], score: 7, emoji: '🌟' }
        };

        // Topic detection with sub-patterns
        this.topics = {
            work:          ['work','job','boss','colleague','office','career','workplace','coworker','manager','meeting','project','promotion','fired','salary','resign','corporate','startup','interview','client','overtime'],
            relationships: ['relationship','partner','boyfriend','girlfriend','husband','wife','spouse','dating','marriage','breakup','broke up','divorce','love','fight','argument','cheating','trust','crush','ex','ghosted','situationship'],
            family:        ['family','parents','parent','mother','father','mom','dad','sibling','brother','sister','home','childhood','growing up','relative','in-laws','grandparent'],
            academic:      ['study','exam','college','university','school','grades','assignment','homework','semester','student','fail','passing','education','degree','professor','lecture','class','gpa','thesis','placement','backlog'],
            sleep:         ['sleep','insomnia','cant sleep','nightmare','tired','exhausted','fatigue','resting','awake at night','sleeping too much','oversleeping','restless night'],
            selfWorth:     ['not good enough','worthless','failure','useless','hate myself','ugly','stupid','dumb','loser','pathetic','burden to','dont deserve','not worthy','imposter','fraud','compare myself','comparison','inadequate'],
            health:        ['health','sick','illness','hospital','doctor','pain','medication','therapy','therapist','chronic','headache','weight','eating','appetite','body','diagnosis'],
            social:        ['friends','friendship','social','party','people','crowd','introvert','extrovert','small talk','fitting in','belong','outcast','bullied','bully'],
            finance:       ['money','financial','debt','rent','loan','broke','afford','expensive','savings','bills','salary','income','poor','rich'],
            future:        ['future','career','plan','goal','dream','ambition','purpose','meaning','direction','what next','where am i going','life plan']
        };

        // ======== CONVERSATIONAL RESPONSES (human, warm, imperfect) ========
        // Each array has many variants so the bot rarely repeats

        this.responses = {

            // === GREETINGS — warm, casual, like a friend ===
            greetings: [
                "Hey, {name}! 😊 Honestly, I was hoping you'd show up. How's your day going — like, for real?",
                "Oh hey! Good to see you, {name}. Pull up a chair, get comfy. What's going on in your world?",
                "Hi {name}! 💚 I'm all ears today. How are you feeling? And I mean really, not the 'I'm fine' version.",
                "Hey you! How's things? I've got nowhere to be, so take your time — what's on your mind?",
                "{name}! You're here. 🌿 That makes me happy. So... how are you doing today? Be honest with me.",
                "Hey {name}! Perfect timing actually. I was just sitting here thinking about how I could help someone today. What's up?"
            ],

            // === FAREWELLS — warm send-off ===
            farewells: [
                "Alright {name}, take it easy okay? And hey — be nice to yourself tonight. You deserve it. 💚",
                "I'm glad we got to chat. Go do something that makes you smile, even if it's small. Talk soon? 🌙",
                "Bye {name}! I've saved our conversation in your journal. Remember — you're doing better than you think. ✨",
                "Take care of yourself, okay? I'm literally always here if you wanna talk. No appointment needed 😊",
                "Night {name}! Or... day. Whatever time it is. Just know I'm rooting for you. Always. 💛",
                "Okay, I'll let you go! But before you do — I want you to know this was a really good conversation. I mean it. Take care."
            ],

            // === POSITIVE / FEEL GOOD ===
            positive: [
                "Okay wait, I love hearing that! Tell me more — what's making things feel good right now?",
                "YES. This is the energy I like to see, {name}. What happened? I wanna hear all of it.",
                "Honestly? That really makes me smile. You deserve to feel good. So what's been going right?",
                "I'm genuinely happy to hear that. Sometimes we forget to pause and appreciate the good stuff. What's bringing you this feeling?",
                "That's awesome, {name}. Seriously. Hold onto that feeling — it matters more than you think. What's making the difference?",
                "Aww see, now you've got me smiling too 😊 What's the best thing that happened recently?"
            ],

            // === SAD — sitting with them, not fixing ===
            sad: [
                "Hey... I'm really sorry you're going through that. I'm not going anywhere, okay? Tell me what happened.",
                "That sounds really heavy, {name}. You don't have to sugarcoat anything with me — I can handle it. What's going on?",
                "Ugh, I hate that you're feeling this way. You know what? You don't have to have it all figured out right now. Just... let it out. What's hurting?",
                "I hear you. And I know 'it'll get better' probably sounds hollow right now, so I'm not gonna say that. I'm just gonna sit here with you. Can you tell me more about what's been going on?",
                "My heart kind of hurts hearing this, {name}. You didn't do anything to deserve feeling like this. What's been weighing on you?",
                "I'm sorry. I really am. Sometimes life is just... a lot. And it's okay to not be okay. I'm here to listen, no judgment, no fixing — just listening. What's on your heart?"
            ],

            // === ANXIOUS — grounding, calm, present ===
            anxious: [
                "Okay, first thing — take a breath with me. Seriously, right now. In through the nose... out through the mouth. You're safe here. Now tell me — what's your brain doing to you right now?",
                "I can feel the worry in your words, {name}. That spinning-thoughts thing is the WORST. What's the biggest thing your mind keeps circling back to?",
                "Hey, I know anxiety makes everything feel 10x bigger than it actually is. You're not crazy, you're not overreacting. What's stressing you out the most?",
                "Ugh, anxiety is literally the worst uninvited guest. It just barges in and makes itself at home. What's it telling you right now? Because I bet at least half of it is lies.",
                "I've been there — when your brain just won't shut up and everything feels like a threat. You're safe right now, in this moment. Let's talk through what's going on, one thing at a time.",
                "Okay, we're gonna take this nice and slow. No rush. What's the thing that's making your chest tight right now? Let's start there."
            ],

            // === ANGRY — validate, don't calm down ===
            angry: [
                "Yeah, I'd be pissed too honestly. That sounds really frustrating. Don't hold back — what happened?",
                "Okay no, that's legit infuriating. You have every right to feel angry about that. Want to vent? I'm here for it.",
                "Ugh. You know what, sometimes anger is the most honest emotion we have. It means something crossed a line. What was it?",
                "I'm not gonna tell you to calm down because honestly? It sounds like you have a real reason to be upset. Tell me everything.",
                "That would make anyone angry, {name}. Like, genuinely. What's the part that gets to you the most?",
                "You know what, sometimes we need to be angry. It's our brain's way of saying 'this isn't okay.' So let's talk about it — what's not okay right now?"
            ],

            // === STRESSED — break it down, lighten the load ===
            stressed: [
                "Okay, deep breath. You've got a lot going on, I can tell. Let's not look at the whole mountain — what's the ONE thing that's stressing you out the most right now?",
                "That's... a lot, {name}. Like, genuinely a lot. No wonder you're feeling overwhelmed. Can we break it down a little? What's the most urgent fire to put out?",
                "I hear you. When everything piles up it feels like you're drowning. But you're here, you're talking about it, and that actually means you're fighting. What's the biggest weight on your shoulders right now?",
                "Oof. I can practically feel the stress through the screen. When's the last time you did something just for yourself? Not productive, not useful — just... nice?",
                "You know what nobody tells you? Being stressed doesn't mean you're failing. It usually means you're carrying too much. What can we maybe take off your plate, even just mentally?",
                "Hey, you're not a machine, {name}. You're allowed to feel overwhelmed. Let's figure this out together — what's eating you up the most?"
            ],

            // === LONELY — connection, warmth ===
            lonely: [
                "I'm sorry you're feeling alone, {name}. For what it's worth — you're not alone right now. I'm here, and I genuinely care about what you're going through.",
                "Loneliness is... god, it's one of the worst feelings. It's like being in a crowded room and still feeling invisible. What's been making you feel this way?",
                "Hey, I want you to know something — feeling lonely doesn't mean you're unlikeable or unworthy. It usually means you're craving real connection, and that's actually a beautiful thing. What's been going on?",
                "That ache of loneliness is so real, {name}. And social media doesn't help because everyone else looks like they have this perfect life, right? Tell me what your days have been looking like.",
                "I hear you. And I know me being a chatbot isn't the same as a hug or a phone call from a friend — but I'm genuinely here for you, okay? What's making you feel so disconnected?",
                "You know, some of the most interesting, kindest people I've talked to have felt exactly what you're feeling. Loneliness doesn't define you. But tell me — what would connection look like for you right now?"
            ],

            // === CONFUSED — explore without pressure ===
            confused: [
                "Yeah, I can see how that's confusing. Life doesn't come with a manual, which is honestly the worst design flaw. What's the decision or situation that's got you stuck?",
                "Mixed feelings are the WORST because there's no clear answer, right? Let's try something — without overthinking it, what does your gut tell you?",
                "Okay, let's untangle this a bit. What are the two (or three... or five) things you're torn between? Sometimes just saying them out loud helps.",
                "I get it — when you're confused, even small decisions feel huge. You don't have to figure everything out today though. What's the main thing that's unclear?",
                "It's okay to not have the answers, {name}. Actually, the fact that you're sitting with the confusion instead of making a rash decision? That shows a lot of maturity. What's swirling around in your head?",
                "You know what, sometimes being confused is actually a sign that you're growing. You're questioning things, which means you care about getting it right. What's the heart of the confusion?"
            ],

            // === GRATEFUL / POSITIVE SHARE ===
            grateful: [
                "I love that you're noticing the good stuff, {name}. Seriously, that's not easy to do, especially when life is messy. What are you feeling grateful for?",
                "Okay this just made my day! Gratitude is like a superpower honestly. Tell me more — what's been good?",
                "See, THIS is what I'm talking about. Even small good things matter. What's the thing that's making you feel this way?",
                "You know what's cool? The fact that you can feel grateful even when life isn't perfect — that takes real emotional strength. What's bringing this on?",
                "That genuinely warms my heart to hear, {name}. Sometimes we rush past the good moments. Let's not do that — tell me what you're appreciating right now.",
                "Yes yes yes! I'm here for this energy. What are a couple of things — even tiny ones — that made you feel grateful today?"
            ]
        };

        // === TOPIC-SPECIFIC natural responses ===
        this.topicConversations = {
            work: [
                "Ah, work stuff. That can really get under your skin, huh? What's going on — is it the actual work, the people, or just... all of it?",
                "Work drama is honestly exhausting because you can't just walk away from it, you know? You gotta show up tomorrow and deal with the same stuff. What's happening?",
                "I totally get the work frustration thing. Like, we spend SO much of our lives at work and when it's bad, it bleeds into everything else. What's the situation?",
                "Is it the workload that's getting to you, or more the environment? Because those need really different solutions honestly.",
                "Tell me about it — and don't censor yourself. Sometimes you just need someone to vent to who isn't a coworker, you know?",
                "Work stuff, huh? I feel like this is something a lot of people don't talk about enough — how much it can mess with your mental health. What's been going on?"
            ],
            relationships: [
                "Oh, relationship stuff. Those feelings hit different, don't they? Tell me what's going on — I'm not gonna judge, I promise.",
                "Relationships are so complicated because the people we care about most have the most power to hurt us. What happened?",
                "Okay, I'm listening. And just so you know — there's no 'right' way to feel about this stuff. Whatever you're feeling is valid. What's going on between you two?",
                "Heart stuff is always messy, {name}. Even the best relationships have hard moments. What's been happening?",
                "I can tell this really matters to you. When it comes to relationships, our feelings are rarely simple, right? Walk me through what's going on.",
                "That takes guts to talk about. Relationships can be the most beautiful and most painful part of life, all at the same time. What's on your mind?"
            ],
            family: [
                "Family stuff is... complicated. Because you can't really choose them and there's SO much history there. What's been going on at home?",
                "I think family relationships are some of the hardest to navigate because the expectations are so high on both sides. What's happening with yours?",
                "You know, it's totally okay to love your family and still be frustrated or hurt by them. Those feelings can coexist. What's going on?",
                "Family dynamics run deep, {name}. Sometimes stuff from years ago still affects how we relate today. What's been weighing on you?",
                "Ah, family. The people who know exactly which buttons to push because they installed them. What's happening?",
                "Thank you for trusting me with this — family stuff is really personal. I'm here to listen without judgment. What's going on?"
            ],
            academic: [
                "School pressure is NO joke, {name}. I feel like people underestimate how much it messes with your head. What's stressing you out — exams, assignments, or just the whole thing?",
                "The academic grind can be so brutal. And everyone around you is like 'just study harder' which is... not helpful. What's going on?",
                "Hey, can I tell you something? You are so much more than a grade on a paper. I know it doesn't feel like it when you're in the thick of it, but it's true. What's been happening?",
                "College/school stuff, got it. Is it the work itself that's overwhelming, or is it more about the pressure and expectations?",
                "I get it — the academic world can make you feel like your entire future depends on one exam or one grade. That's such a heavy thing to carry. What's going on?",
                "Academic stress is real, {name}. And it's not 'just school' — it affects your sleep, your confidence, everything. Tell me what's up."
            ],
            sleep: [
                "Not sleeping properly is like a slow torture honestly. Everything feels harder when you're running on empty. How long has this been going on?",
                "Sleep stuff is tricky because the more you worry about not sleeping, the harder it is to sleep. Fun cycle, right? 🙃 What's usually going through your head at night?",
                "Ugh, I'm sorry. Sleep deprivation makes literally everything worse — your mood, your patience, your ability to cope. What do you think is keeping you up?",
                "The 3 AM brain is the WORST brain. It turns every small worry into a catastrophe. What's your brain doing to you at night?",
                "I hear you. When you can't sleep, the world gets this weird heavy quality where everything feels harder than it should. Is there something specific on your mind, or is it more of a general restlessness?",
                "That sounds exhausting — literally and emotionally. Have your sleep issues been connected to anything specific going on in your life, or did they just kind of start?"
            ],
            selfWorth: [
                "Hey, {name}? I need you to hear me on this — that voice in your head telling you those things? It's lying. I know it feels true, but it's not. Can you tell me what triggered this?",
                "Oh, {name}. My heart hurts hearing you talk about yourself that way. You know, we'd never talk to a friend the way we talk to ourselves. What's making you feel like this?",
                "I want to push back on that a little — not because your feelings aren't real, but because I genuinely believe you're being way too hard on yourself. What happened?",
                "Okay, stop. I need to tell you something. The fact that you're HERE, talking about this, trying to work through it — that's not what a {negative_word} does. That's what a brave person does. What's been going on?",
                "Those words are really painful, and I'm sorry you're directing them at yourself. Where do you think they come from? Like, whose voice is that really?",
                "I know I can't just talk you out of feeling this way — feelings don't work like that. But I do want you to know that the person I'm talking to right now? They seem pretty thoughtful and self-aware to me. What's driving these feelings?"
            ],
            health: [
                "Dealing with health stuff on top of everything else is exhausting, {name}. How are you coping with it, honestly?",
                "Health issues have this way of making you feel like your body betrayed you. That's such a frustrating feeling. Tell me more about what's going on.",
                "I'm sorry you're dealing with that. Is it something you've been managing for a while, or is this more recent?",
                "Health stuff can be really isolating because unless someone's been through it, they don't really get it. I want to try to understand though. What's it been like for you?"
            ],
            social: [
                "Social stuff can be so draining, especially when you feel like you're not fitting in. What's been going on with your friend situation?",
                "You know, quality over quantity applies to friendships too. One real friend is worth more than a hundred surface-level ones. What's making you feel this way?",
                "Social dynamics are honestly exhausting sometimes. Whether you're introverted or extroverted, navigating people is just... a lot. What's happening?",
                "I think a lot more people feel this way than admit it. The social thing is hard. What's been your experience lately?"
            ],
            finance: [
                "Money stress is one of those things that affects literally everything — your sleep, your relationships, your mood. What's the financial situation looking like?",
                "I'm sorry you're dealing with money worries, {name}. That kind of stress sits in the back of your mind 24/7. What's going on?",
                "Financial stuff is stressful because it feels so concrete and urgent, you know? Like you can't just 'feel better' about an empty bank account. What's happening?",
                "Money problems are so common and yet people feel so alone in them because nobody talks about it. You're not alone in this. What's the main concern?"
            ],
            future: [
                "The future thing is tricky because everyone expects you to have a plan, but honestly? Most people are winging it more than they let on. What's on your mind about it?",
                "I think the pressure to 'have it all figured out' is one of the biggest lies we're told. You don't need a perfect plan. What's worrying you about the future?",
                "Feeling uncertain about the future is so normal, even though it doesn't feel normal. What's the thing that scares you most about it?",
                "You know, not having a clear path doesn't mean you're lost — sometimes it means you have more options than you realize. What direction are you leaning, even a little?"
            ]
        };

        // ======== FOLLOW-UP / CONTINUING CONVERSATION ========
        this.followUps = {
            askMore: [
                "Tell me more about that.",
                "What happened next?",
                "How did that make you feel?",
                "And then what?",
                "Go on, I'm listening.",
                "What was going through your head when that happened?",
                "How did you react?",
                "What was that like for you?"
            ],
            goDeeper: [
                "That's interesting that you said that. Why do you think that is?",
                "I'm curious — has this been a pattern, or is this a new thing?",
                "What do you think is really at the root of this?",
                "If you could zoom out and look at this from the outside, what would you see?",
                "That seems to touch something deeper. What do you think is underneath that feeling?",
                "I notice you mentioned {memory} — do you think that's connected to this?"
            ],
            validate: [
                "That makes total sense, {name}.",
                "Yeah, anyone would feel that way.",
                "That's a really valid feeling.",
                "Of course you feel that way — who wouldn't?",
                "I think most people in your shoes would feel exactly the same.",
                "Your feelings make complete sense given what you've been through."
            ],
            empathize: [
                "God, that's tough. I'm sorry.",
                "Ugh, I can only imagine how that felt.",
                "That must have been so hard for you.",
                "I hate that you went through that.",
                "That's really unfair, and I'm sorry you had to deal with it.",
                "I wish I could take some of that weight off your shoulders."
            ],
            encourage: [
                "You know what though? The fact that you're here processing this — that says a lot about you.",
                "I really admire that you're willing to look at this honestly. Not everyone can do that.",
                "Hey, give yourself some credit here. You're handling this better than you think.",
                "You've made it through tough stuff before, {name}. I believe you'll make it through this too.",
                "Something I notice about you — you're more resilient than you give yourself credit for.",
                "I just want to point out — you're doing a hard thing right now, and you're doing it. That matters."
            ],
            copingGentle: [
                "Have you been able to do anything nice for yourself lately? Even something small?",
                "What usually helps you feel a little better when things get like this?",
                "Is there someone in your life you trust enough to talk to about this?",
                "Sometimes just stepping outside for five minutes can help shift things a tiny bit. Have you been getting any fresh air?",
                "What's one small thing you could do for yourself today? Doesn't have to be big — even making your favorite tea counts.",
                "I know it might sound basic, but have you eaten today? Drank water? Sometimes the basics fall apart first."
            ]
        };

        // === SHORT MESSAGE HANDLERS ===
        this.shortHandlers = {
            agreement:  { patterns: ['yes','yeah','yep','sure','ok','okay','yea','ya','mhm','uh huh','right','true','exactly','totally','absolutely','definitely','for sure','alright'],
                responses: [
                    "Okay, good. So tell me more — what's the next thing that comes to mind?",
                    "Got it. And how does that sit with you? Like, what's the feeling behind that?",
                    "Alright. I'm glad you're open to exploring this. What else comes up when you think about it?",
                    "Yeah? Okay, keep going. I'm following you.",
                    "Cool. So where does that leave you right now — emotionally, I mean?"
                ]
            },
            disagreement: { patterns: ['no','nah','nope','not really','i guess not','no way','nuh uh','negative'],
                responses: [
                    "That's totally fair. What would feel more accurate then?",
                    "Okay, I hear you. Maybe I read that wrong — how would you describe it?",
                    "No worries, that's okay. Let's try a different angle — what IS on your mind right now?",
                    "Fair enough! Forget what I said then. What feels more true to you?",
                    "That's fine, {name}. We don't have to go there. What do you want to talk about instead?"
                ]
            },
            uncertain:  { patterns: ['idk','i dont know',"i don't know",'dont know','maybe','not sure','i guess','kinda','sort of','hard to say','dunno','no clue','who knows'],
                responses: [
                    "That's okay — you don't need to have it all figured out. Sometimes the 'I don't know' IS the answer, at least for now. What does it feel like, even if you can't name it?",
                    "Yeah, sometimes feelings are just... blurry. Like, you know something's off but you can't put your finger on it. Is that close to what you're experiencing?",
                    "Totally valid. Let me try asking it differently — if you had to pick a color to describe how you're feeling, what would it be? (I know that sounds weird, just go with it)",
                    "You know, 'I don't know' usually means there's too much going on to untangle all at once. Let's start somewhere small — how was your morning?",
                    "That's okay, {name}. We can just hang out here for a bit. No pressure to have answers."
                ]
            },
            minimal:    { patterns: ['ok','fine','good','cool','nice','same','meh','eh','hmm','hm','lol','haha','ha','😂','😊','😢','😔','❤','💚','🥲','👍','sure ig'],
                responses: [
                    "I feel like there might be more behind that one word. Am I reading too much into it, or is there something else going on?",
                    "Hmm, I'm getting a vibe that there's more to the story. Want to talk about it, or do you just wanna chill?",
                    "Okay, short answer — I respect that. But I'm curious about what's behind it. What's your energy like today?",
                    "You know, sometimes when I'm not feeling great, I give one-word answers too. Is that what's happening, or are you genuinely good?",
                    "I hear you. We don't have to go deep if you're not feeling it. What if I ask you something random instead — what's the last thing that made you genuinely smile?"
                ]
            },
            laughing:   { patterns: ['lol','haha','lmao','rofl','😂','🤣','ha ha','hehe','😅'],
                responses: [
                    "Haha, okay but sometimes laughing is how we cope, right? What's actually going on behind the 'haha'?",
                    "😄 I like the laugh! But is it a genuine laugh or more of a 'laugh so I don't cry' situation? No wrong answer.",
                    "Ha! I love that. But real talk — how are you actually doing today?",
                    "Lol okay I see you. But sometimes laughter is the mask, you know? How are you really?",
                    "That made me smile 😊 But let me check in — how are things going underneath the humor?"
                ]
            }
        };

        // === MEMORY-BASED CALLBACK TEMPLATES ===
        this.memoryCallbacks = [
            "You mentioned {memory} earlier — is that still weighing on you?",
            "I keep thinking about what you said about {memory}. How are you feeling about that now?",
            "Going back to what you shared about {memory} — has anything changed since then?",
            "I haven't forgotten about {memory}. Is that connected to what you're feeling right now?",
            "Earlier you talked about {memory}. I'm still thinking about that. Are you?"
        ];

        // Greeting patterns
        this.greetingPatterns = ['hi','hello','hey','good morning','good evening','good afternoon','howdy','sup','whats up',"what's up",'hiya','yo','heyo','wassup','hola'];
        this.farewellPatterns = ['bye','goodbye','good night','goodnight','talk later','see you','gotta go','have to go','leaving','done for now','thats all',"that's all",'thanks bye','gtg','cya','see ya','peace out','im going','signing off'];
        this.positivePatterns = ['feel good','feel better','feeling good','doing well','doing good','doing great','better now','things are good','pretty good','really good','amazing actually','im good',"i'm good",'im great',"i'm great",'im happy',"i'm happy",'helped','that helped','this helps'];
    }

    // ======== MAIN RESPONSE GENERATION ========

    generateResponse(userMessage) {
        this.turnCount++;
        const lowerMsg = userMessage.toLowerCase().trim();
        const wordCount = userMessage.split(/\s+/).length;
        this.userWordCount += wordCount;

        this.conversationHistory.push({ role: 'user', content: userMessage, timestamp: Date.now() });

        // Extract & remember meaningful info
        this.extractMemory(userMessage, lowerMsg);
        this.analyzeMood(lowerMsg);
        this.detectTopics(lowerMsg);

        // Build the response
        let response = this.craftResponse(lowerMsg, userMessage, wordCount);

        // Post-process for naturalness
        response = this.humanize(response);

        this.conversationHistory.push({ role: 'bot', content: response, timestamp: Date.now() });
        this.lastBotIntent = this.getIntent(response);

        return {
            message: response,
            mood: this.detectedMood,
            moodScore: this.moodScore,
            tags: Array.from(this.sessionTags),
            suggestions: this.getSuggestions()
        };
    }

    // ======== RESPONSE CRAFTING (the brain) ========

    craftResponse(lowerMsg, originalMsg, wordCount) {

        // 1) Greetings
        if (this.turnCount <= 2 && this.matchesAny(lowerMsg, this.greetingPatterns)) {
            return this.pick(this.responses.greetings);
        }

        // 2) Farewells
        if (this.matchesAny(lowerMsg, this.farewellPatterns)) {
            return this.pick(this.responses.farewells);
        }

        // 3) Positive sharing
        if (this.matchesAny(lowerMsg, this.positivePatterns)) {
            return this.pick(this.responses.positive);
        }

        // 4) Short / one-word messages (handle specially)
        if (wordCount <= 3 && this.turnCount > 1) {
            return this.handleShort(lowerMsg);
        }

        // 5) Topic + mood based response (most messages fall here)
        return this.buildConversationalResponse(lowerMsg, originalMsg, wordCount);
    }

    buildConversationalResponse(lowerMsg, originalMsg, wordCount) {
        let parts = [];

        // --- LAYER 1: Acknowledge what they said (empathy first) ---
        if (this.moodScore <= 3) {
            // Low mood: lead with empathy
            parts.push(this.pick(this.followUps.empathize));
        } else if (this.moodScore <= 4) {
            parts.push(this.pick(this.followUps.validate));
        }

        // --- LAYER 2: Topic-specific response (the main meat) ---
        const topic = this.lastTopic;
        if (topic && this.topicConversations[topic]) {
            parts.push(this.pick(this.topicConversations[topic]));
        }
        // If no topic but we have a mood, use mood-specific response
        else if (this.detectedMood !== 'neutral' && this.responses[this.detectedMood]) {
            parts.push(this.pick(this.responses[this.detectedMood]));
        }
        // Fallback: generic conversational
        else {
            if (wordCount > 20) {
                // They shared a lot — acknowledge that
                const deepAck = [
                    "Wow, okay. That's a lot, {name}. Thank you for sharing all of that with me. Let me sit with this for a second...",
                    "I really appreciate you opening up like that. There's a lot to unpack here. What feels like the most important part of what you just said?",
                    "Thank you for trusting me with all of that, {name}. I can tell you've been carrying this for a while. What part of this is affecting you the most right now?",
                    "Okay, I'm taking all of that in. That's heavy, {name}. If you had to boil it down to one thing that's really eating at you — what would it be?"
                ];
                parts.push(this.pick(deepAck));
            } else {
                parts.push(this.pick(this.followUps.askMore));
            }
        }

        // --- LAYER 3: Occasionally add memory callback (if we have memories) ---
        if (this.turnCount > 3 && this.userMemory.keyPhrases.length > 0 && Math.random() > 0.7) {
            const memoryRef = this.createMemoryCallback();
            if (memoryRef) parts.push(memoryRef);
        }

        // --- LAYER 4: For sustained low mood, gently offer coping ---
        if (this.moodScore <= 3) {
            this.consecutiveLowMood++;
        } else {
            this.consecutiveLowMood = 0;
        }

        if (this.consecutiveLowMood >= 3 && Math.random() > 0.4) {
            parts.push(this.pick(this.followUps.copingGentle));
            this.consecutiveLowMood = 0; // reset so we don't nag
        }

        // --- LAYER 5: Encouragement (deep conversations, occasionally) ---
        if (this.turnCount > 5 && this.hasSharedDeep && Math.random() > 0.65) {
            parts.push(this.pick(this.followUps.encourage));
        }

        // --- COMBINE: Keep it to 1-2 parts max for natural feel ---
        // (real humans don't say 5 things at once)
        if (parts.length > 2) {
            // Always keep the main meat (index 0 or 1), then pick one more
            const main = parts.length > 1 ? parts.slice(0, 2) : parts;
            // Sometimes add a third piece
            if (parts.length > 2 && Math.random() > 0.6) {
                main.push(parts[parts.length - 1]);
            }
            parts = main;
        }

        return parts.join('\n\n');
    }

    // ======== SHORT MESSAGE HANDLER ========

    handleShort(msg) {
        // Check each short-handler category
        for (const [category, data] of Object.entries(this.shortHandlers)) {
            if (data.patterns.some(p => msg === p || msg.includes(p))) {
                return this.pick(data.responses);
            }
        }

        // Emoji-only messages
        if (/^[\p{Emoji}\s]+$/u.test(msg)) {
            const emojiResponses = [
                "I see the emoji but I want the words 😊 What's going on in that head of yours?",
                "Emojis are great, but I want to really understand how you're feeling. Can you put it into words for me?",
                "Hmm, I'm trying to read between the emoji lines here. Help me out — how are you doing?",
                "Ha! That emoji is doing a lot of heavy lifting. What's the actual feeling behind it?"
            ];
            return this.pick(emojiResponses);
        }

        // Generic short response
        const genericShort = [
            "Tell me more? I'm genuinely interested.",
            "I feel like there's more to that. What's behind those words?",
            "I'm here, {name}. Take your time — what's going on?",
            "Hmm. What made you think of that?",
            "Go on... I'm all ears."
        ];
        return this.pick(genericShort);
    }

    // ======== MEMORY SYSTEM ========

    extractMemory(original, lower) {
        // Extract names of people
        const peoplePatterns = [
            /my (?:friend|best friend|bf|gf|boyfriend|girlfriend|partner|husband|wife|mom|dad|mother|father|brother|sister|boss|colleague|ex|teacher|professor) (\w+)/i,
            /(\w+) (?:told me|said|thinks|says|wants|asked|called|texted|messaged)/i
        ];
        for (const pat of peoplePatterns) {
            const match = original.match(pat);
            if (match && match[1] && match[1].length > 2 && match[1].length < 15) {
                const name = match[1];
                if (!['the','that','this','who','what','they','them','she','her','his','him','and','but','not','its','was','has'].includes(name.toLowerCase())) {
                    if (!this.userMemory.people.includes(name)) {
                        this.userMemory.people.push(name);
                    }
                }
            }
        }

        // Extract key emotional phrases
        const emotionalPhrases = [
            /(?:i feel|i felt|i'm feeling|feeling|i've been) (.{5,40}?)(?:\.|,|!|\?|$)/i,
            /(?:it makes me|it made me|that makes me) (.{5,30}?)(?:\.|,|!|\?|$)/i,
            /(?:i can't|i cant|i couldn't) (.{5,30}?)(?:\.|,|!|\?|$)/i,
            /(?:i wish|i wanted|i want to|i need) (.{5,30}?)(?:\.|,|!|\?|$)/i
        ];
        for (const pat of emotionalPhrases) {
            const match = original.match(pat);
            if (match && match[1]) {
                const phrase = match[1].trim();
                if (phrase.length > 4 && !this.userMemory.keyPhrases.includes(phrase)) {
                    this.userMemory.keyPhrases.push(phrase);
                    if (this.userMemory.keyPhrases.length > 8) {
                        this.userMemory.keyPhrases.shift(); // keep recent
                    }
                }
            }
        }

        // Track events
        const eventPatterns = [
            /(?:today|yesterday|last night|this morning|this week|recently|earlier) (.{5,50}?)(?:\.|,|!|\?|$)/i
        ];
        for (const pat of eventPatterns) {
            const match = original.match(pat);
            if (match && match[1]) {
                const event = match[1].trim();
                if (event.length > 5 && !this.userMemory.events.includes(event)) {
                    this.userMemory.events.push(event);
                    if (this.userMemory.events.length > 5) this.userMemory.events.shift();
                }
            }
        }

        // Detect deep sharing
        if (original.split(/\s+/).length > 30 || lower.includes('never told') || lower.includes('first time') || lower.includes('hard to say') || lower.includes('hard to talk about')) {
            this.hasSharedDeep = true;
        }
    }

    createMemoryCallback() {
        let memory = null;

        if (this.userMemory.keyPhrases.length > 0) {
            memory = this.userMemory.keyPhrases[Math.floor(Math.random() * this.userMemory.keyPhrases.length)];
        } else if (this.userMemory.events.length > 0) {
            memory = this.userMemory.events[Math.floor(Math.random() * this.userMemory.events.length)];
        } else if (this.userMemory.people.length > 0) {
            memory = this.userMemory.people[Math.floor(Math.random() * this.userMemory.people.length)];
        }

        if (!memory) return null;

        const template = this.pick(this.memoryCallbacks);
        return template.replace('{memory}', memory);
    }

    // ======== MOOD ANALYSIS ========

    analyzeMood(message) {
        let bestMood = 'neutral';
        let bestCount = 0;

        for (const [mood, data] of Object.entries(this.emotionPatterns)) {
            let count = 0;
            for (const kw of data.keywords) {
                if (message.includes(kw)) count++;
            }
            if (count > bestCount) {
                bestCount = count;
                bestMood = mood;
                this.moodScore = data.score;
            }
        }

        if (bestCount > 0) {
            this.detectedMood = bestMood;
            this.emotionTracker[bestMood] = (this.emotionTracker[bestMood] || 0) + 1;
            this.userMemory.feelings.push(bestMood);
        }
    }

    detectTopics(message) {
        this.prevTopic = this.lastTopic;
        for (const [topic, patterns] of Object.entries(this.topics)) {
            for (const p of patterns) {
                if (message.includes(p)) {
                    this.sessionTags.add(topic);
                    this.lastTopic = topic;
                    return;
                }
            }
        }
    }

    // ======== HUMANIZATION (post-processing) ========

    humanize(response) {
        // Replace placeholders
        response = response.replace(/\{name\}/g, this.userName);

        // Replace any leftover {memory} placeholders
        if (response.includes('{memory}') && this.userMemory.keyPhrases.length > 0) {
            response = response.replace(/\{memory\}/g, this.userMemory.keyPhrases[0]);
        } else {
            response = response.replace(/\{memory\}/g, 'what you mentioned');
        }

        // Replace {negative_word} in selfWorth responses
        response = response.replace(/\{negative_word\}/g, 'worthless person');

        // Occasionally add a casual filler at the start (10% chance)
        if (Math.random() > 0.9 && !response.match(/^(Hey|Oh|Hi|Ah|Hmm|Yeah|Okay|Ugh|God|Wow|Lol|Ha)/)) {
            const fillers = ['Hmm, ', 'You know, ', 'Honestly, ', 'Look, '];
            const filler = fillers[Math.floor(Math.random() * fillers.length)];
            response = filler + response.charAt(0).toLowerCase() + response.slice(1);
        }

        return response;
    }

    getIntent(response) {
        if (response.includes('?')) return 'asked_question';
        if (response.includes('sorry') || response.includes('tough') || response.includes('hurts')) return 'empathized';
        if (response.includes('credit') || response.includes('proud') || response.includes('brave')) return 'encouraged';
        return 'general';
    }

    // ======== SUGGESTIONS ========

    getSuggestions() {
        const sets = {
            happy:    ["What else made you smile?", "Tell me a highlight!", "What are you looking forward to?"],
            sad:      ["I'm here for you", "What happened?", "Can I help?"],
            anxious:  ["Let's breathe together", "What's on your mind?", "One thing at a time"],
            angry:    ["That's frustrating", "Want to vent?", "What would help?"],
            stressed: ["Let's break it down", "Biggest stressor?", "Self-care check?"],
            grateful: ["That's beautiful!", "What else is good?", "Tell me more!"],
            lonely:   ["You're not alone", "Tell me about your day", "What do you enjoy?"],
            confused: ["Let's think together", "What are your options?", "What feels right?"],
            neutral:  ["How's your day?", "What's on your mind?", "How are you really?"],
            hopeful:  ["That's great!", "What's next?", "Keep that energy!"]
        };
        return sets[this.detectedMood] || sets.neutral;
    }

    // ======== UTILITY ========

    matchesAny(msg, patterns) {
        return patterns.some(p => {
            if (msg === p) return true;
            try {
                const regex = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                return regex.test(msg);
            } catch {
                return msg.includes(p);
            }
        });
    }

    pick(arr) {
        const available = arr.filter(r => !this.usedResponses.has(r));
        if (available.length === 0) {
            this.usedResponses.clear();
            return arr[Math.floor(Math.random() * arr.length)];
        }
        const choice = available[Math.floor(Math.random() * available.length)];
        this.usedResponses.add(choice);
        if (this.usedResponses.size > 50) {
            this.usedResponses = new Set([...this.usedResponses].slice(-25));
        }
        return choice;
    }

    // ======== WELCOME MESSAGE ========

    getWelcomeMessage() {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) greeting = "Good morning";
        else if (hour < 17) greeting = "Good afternoon";
        else if (hour < 21) greeting = "Good evening";
        else greeting = "Hey, night owl";

        const welcomes = [
            `${greeting}, ${this.userName}! 🌿\n\nI'm really glad you're here. Think of this as your space — no judgment, no expectations, just a conversation between friends.\n\nYou can tell me about your day, vent about something, or just say hi. Whatever you share stays in your journal.\n\nSo... how are you doing? And I mean *actually* doing, not the "I'm fine" version 😊`,
            `${greeting}, ${this.userName}! 💚\n\nHey, welcome in. I'm MindSpace — kind of like a friend who's always free to chat and never judges. Pretty good deal, right?\n\nThere's no right or wrong thing to say here. Talk about your day, share what's bugging you, or tell me something good that happened.\n\nI'm all ears. How are you today?`,
            `${greeting}, ${this.userName}! ✨\n\nOkay, I'm glad you're here. This is your safe space — think of it like writing in a journal, except the journal talks back (in a nice way, I promise).\n\nAnything you share gets saved so you can look back on it later. Pretty cool, right?\n\nSo what's going on in your world today?`
        ];

        return welcomes[Math.floor(Math.random() * welcomes.length)];
    }

    // ======== JOURNAL HELPERS ========

    generateTitle() {
        const date = new Date();
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const emoji = this.emotionPatterns[this.detectedMood]?.emoji || '📝';

        if (this.sessionTags.size > 0) {
            const tag = Array.from(this.sessionTags)[0];
            const titles = {
                work: 'Work Thoughts', relationships: 'Heart Talk', family: 'Family Reflections',
                academic: 'School Stuff', sleep: 'Sleep & Rest', selfWorth: 'Inner Dialogue',
                gratitude: 'Grateful Heart', health: 'Health Check', social: 'Social Life',
                finance: 'Money Matters', future: 'Looking Ahead'
            };
            return `${emoji} ${titles[tag] || 'Journal Entry'} — ${dateStr}`;
        }

        const moodTitles = {
            happy: 'A Good Day', sad: 'Heavy Heart', anxious: 'Restless Mind',
            angry: 'Blowing Off Steam', stressed: 'Under Pressure', grateful: 'Counting Blessings',
            lonely: 'Quiet Moments', confused: 'At a Crossroads', neutral: 'Daily Check-in', hopeful: 'Bright Horizon'
        };
        return `${emoji} ${moodTitles[this.detectedMood] || 'Journal Entry'} — ${dateStr}`;
    }

    generateSummary() {
        const userMsgs = this.conversationHistory.filter(m => m.role === 'user');
        if (userMsgs.length === 0) return 'No conversation recorded.';

        const moodLabel = this.detectedMood.charAt(0).toUpperCase() + this.detectedMood.slice(1);
        const tags = Array.from(this.sessionTags);
        const tagStr = tags.length > 0 ? ` Topics: ${tags.join(', ')}.` : '';
        const people = this.userMemory.people.length > 0 ? ` Mentioned: ${this.userMemory.people.join(', ')}.` : '';

        return `${this.turnCount}-message conversation. Primary mood: ${moodLabel} (${this.moodScore}/10).${tagStr}${people}`;
    }

    reset() {
        this.conversationHistory = [];
        this.detectedMood = 'neutral';
        this.moodScore = 5;
        this.sessionTags = new Set();
        this.turnCount = 0;
        this.lastTopic = null;
        this.prevTopic = null;
        this.emotionTracker = {};
        this.usedResponses = new Set();
        this.userMemory = { keyPhrases: [], people: [], feelings: [], events: [], positives: [] };
        this.lastBotIntent = null;
        this.consecutiveLowMood = 0;
        this.userWordCount = 0;
        this.hasSharedDeep = false;
    }
}
