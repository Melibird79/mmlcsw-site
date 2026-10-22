"""Writes the onboarding slide pages into src/ (welcome.html plus one deck per payer type).

Run before build.py:   python make_slides.py && python build.py
Edit the text here, not in src/welcome*.html (those files are overwritten).
No client information is collected or stored by these pages.
"""
from pathlib import Path

SRC = Path(__file__).parent / "src"

# ---------------------------------------------------------------- shared core

WELCOME = ("Welcome", """
<p class="big">I'm glad you're here.</p>
<p>This takes about eight minutes. It covers what to expect, how sessions work, how money and cancelling work, and how to reach me. You can stop and come back any time.</p>
<p>A little about me. I'm a licensed clinical social worker. I work with trauma, burnout and the kind of tired that comes from holding it together for everyone else. I use a lot of metaphors and some humor, and I explain what I'm doing and why. I'm neurodivergent myself, so I know some of this from the inside.</p>
""")

ROADMAP = ("What happens, in order", """
<ol class="steps">
<li><strong>Forms.</strong> You'll finish a short set of forms in your secure client portal. They take about 15 minutes, and you can save and come back.</li>
<li><strong>This slide show.</strong> The part you're in now.</li>
<li><strong>Your first session.</strong> By video, at the time we booked.</li>
<li><strong>After that.</strong> We find a rhythm that works for your life.</li>
</ol>
""")

HOW_I_WORK = ("How I work", """
<p>Talking helps, and some things live in the body where words don't reach. I'm trained in EMDR and the Flash Technique, and I use parts work and body-based practices alongside conversation. The point is to include your nervous system, not only your thoughts.</p>
<ul>
<li>You set the pace. You can say "slower," "skip that" or "not today" at any point.</li>
<li>You won't have to retell your whole story to start.</li>
<li>Most sessions end with one small practice, five minutes or less, to try on your own.</li>
</ul>
<p class="note">I'm trained in these methods, not certified in them. I'll tell you what I'm using and why.</p>
""")

VIDEO = ("Sessions by video", """
<p>All my sessions are by secure video, through your client portal. A few practical things:</p>
<ul>
<li><strong>You must be in California</strong> during every session. I'm licensed in California, and that's where the law lets me work with you. Traveling? Tell me ahead of time.</li>
<li>Find a private spot. Headphones help a lot if anyone might overhear.</li>
<li>Use a device with a camera and microphone, and a steady connection.</li>
<li>If the connection drops, I'll try to reconnect for a few minutes. If that doesn't work, I'll call the number you gave me, so keep your phone nearby.</li>
</ul>
""")

FIRST_SESSION = ("Your first session", """
<p>We start with a few practical questions: where you are, a phone number, and an emergency contact. Then we talk about what brought you here.</p>
<ul>
<li>You decide how much to share. There's no test and no wrong answer.</li>
<li>I'll ask about what you want to be different, and what you've already tried.</li>
<li>At the end, I'll tell you honestly how I'd work with you and what a good next few weeks could look like. If I don't think I'm the right fit, I'll say so and help you find someone who is.</li>
</ul>
""")

PRIVACY = ("Privacy, and where it stops", """
<p>What you tell me stays between us. There are a few exceptions the law requires, and I'll go over them in your forms.</p>
<ul>
<li>If someone is in serious danger, including you.</li>
<li>If a child, an older adult or a dependent adult is being harmed.</li>
<li>If a court orders records.</li>
</ul>
<p>Text and email aren't fully secure, since your phone company or anyone with your phone could see them. They're fine for scheduling and short check-ins. Keep the details of what you're working through for our sessions or the client portal.</p>
""")

SAFETY = ("If things get hard between sessions", """
<p>Hard stretches happen, and they're a normal part of this work. Here's what to do.</p>
<ul>
<li>Use the small practice from our session, and write down what you notice so we can talk about it.</li>
<li>Message me in the portal. I reply within one business day. I'm not an emergency service, and I don't watch messages for emergencies.</li>
<li><strong>If you might hurt yourself, or you're in crisis, call or text 988.</strong> In an emergency, call 911 or go to the nearest emergency room.</li>
</ul>
<p>We'll make a simple safety plan together early on. Everyone gets one. It isn't a sign anything is wrong.</p>
""")

CONTACT = ("Staying in touch", """
<ul>
<li><strong>Client portal:</strong> the best place for anything about your care, scheduling and forms.</li>
<li><strong>Email:</strong> <a href="mailto:{{EMAIL}}">{{EMAIL}}</a>, for logistics. Keep clinical details for sessions or the portal.</li>
<li><strong>Phone and text:</strong> {{PHONE}}. Text me for scheduling and quick check-ins. I may not answer live, so leave a message or text.</li>
<li><strong>My hours:</strong> I see clients Monday through Thursday. I reply to messages within one business day.</li>
</ul>
""")

AI = ("About AI note-taking", """
<p>I may use an AI tool inside my records system to help write my session notes. It's optional. I'll ask you separately, in writing.</p>
<ul>
<li>If you say yes, the tool turns the conversation into a draft that I read, correct and finish myself.</li>
<li>If you say no, nothing changes about your care. I write my own notes.</li>
<li>You can change your mind later.</li>
</ul>
<p>The consent form explains exactly how it works. Read it before you sign.</p>
""")

CHECKLIST = ("Before your first session", """
<p>Tick these off as you go. This list is only for you; nothing is saved or sent.</p>
<ul class="check">
<li><label><input type="checkbox"> Finish the forms in the client portal</label></li>
<li><label><input type="checkbox"> Read the consent form for AI notes and decide yes or no</label></li>
<li><label><input type="checkbox"> Test the video link on the device you'll use</label></li>
<li><label><input type="checkbox"> Pick a private spot and a time I can count on</label></li>
<li><label><input type="checkbox"> Keep your phone nearby, in case the video drops</label></li>
<li><label><input type="checkbox"> Write down one thing you most want me to know</label></li>
</ul>
<p>Questions about any of this? Message me in the portal. I'd rather answer now than have you wonder.</p>
""")


def cancel_calc(extra=""):
    return f"""
<div class="calc" id="calc">
<label for="day">My session is on a</label>
<select id="day">
<option value="1">Monday</option><option value="2">Tuesday</option><option value="3" selected>Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option>
</select>
<p class="result" id="calc-out" aria-live="polite"></p>
{extra}
</div>
"""


# ---------------------------------------------------------------- payer-specific

CASH_MONEY = ("Fees and payment", """
<p>You pay for sessions directly. There's no insurance in the middle, so I'm clear about the cost up front.</p>
<ul>
<li>Individual session, 50 minutes: <strong>${{RATE}}</strong></li>
<li>Individual session, 60 minutes: <strong>$200</strong></li>
<li>Couples or relationship session, 50 minutes: <strong>${{COUPLES_RATE}}</strong></li>
</ul>
<p>I keep a card on file. It's charged after each session, and you get a receipt. Before we start, I'll send you a written <strong>Good Faith Estimate</strong>. It's the federally required estimate of your costs, so there are no surprises.</p>
<p class="note">If you'd like to ask your insurance about reimbursement, I can give you a statement ("superbill") with the details. I can't promise what a plan will pay.</p>
""")

CASH_CANCEL = ("Cancelling or rescheduling", """
<p>Life gets in the way, and I get that. Please tell me by <strong>3:00 PM the day before</strong> your session if you need to cancel or change it. That gives me time to offer the slot to someone else.</p>
{CALC}
<p>If you cancel after that, or miss the session, the full session fee applies. If something truly out of your control happens, such as an illness, an accident or a family crisis, tell me. I'd rather hear it and talk it through with you.</p>
""")

INS_MONEY = ("How insurance works with me", """
<p>I'm not in network with any insurance plan. That means you pay me directly, and you can ask your plan to reimburse you. This is called "out of network."</p>
<ul>
<li>You pay my fee: <strong>${{RATE}}</strong> for 50 minutes, <strong>$200</strong> for 60 minutes. Couples sessions are <strong>${{COUPLES_RATE}}</strong>.</li>
<li>I keep a card on file and charge it after each session.</li>
<li>I give you a statement ("superbill") with the codes your plan needs. You submit it to your insurer.</li>
<li>Before we start, I'll send you a written <strong>Good Faith Estimate</strong> of your costs.</li>
</ul>
<p class="note">Whether, and how much, your plan reimburses depends on your plan. I can't promise it will.</p>
""")

INS_ASK = ("Questions to ask your insurance", """
<p>A short call can save you surprises. Ask your plan:</p>
<ul>
<li>Do I have out-of-network mental health benefits?</li>
<li>What is my out-of-network deductible, and how much have I met?</li>
<li>What percent of the cost do you reimburse after that?</li>
<li>Is video therapy covered?</li>
<li>Do I need approval from the plan before I start?</li>
<li>How do I submit a claim, and how long does it take?</li>
</ul>
<p>Tell them the session codes are 90837, 90834 and 90791. Write down the date, who you talked to, and what they said.</p>
""")

INS_CANCEL = ("Cancelling or rescheduling", """
<p>Please tell me by <strong>3:00 PM the day before</strong> your session if you need to cancel or change it. That gives me time to offer the slot to someone else.</p>
{CALC}
<p>If you cancel after that, or miss the session, the full session fee applies. Insurance doesn't reimburse missed sessions. If something truly out of your control happens, tell me. I'd rather hear it and talk it through with you.</p>
""")

MC_MONEY = ("Your Medi-Cal coverage", """
<p>Your Medi-Cal plan covers therapy with me when it's medically needed and I'm part of your plan's network. For covered services, <strong>you won't get a bill from me</strong>, and I can't charge you for them.</p>
<ul>
<li>Before we start, I'll check that your coverage is active.</li>
<li>Bring your Medi-Cal ID and plan information to the portal forms.</li>
<li>If your plan needs approval for more sessions, I'll handle that with them.</li>
</ul>
<p class="note">If your coverage changes or ends, tell me right away so we can plan together.</p>
""")

MC_LEVEL = ("Is this the right level of care?", """
<p>Medi-Cal splits mental health care into two groups. Your health plan covers mild to moderate needs. Your county mental health system covers more serious needs.</p>
<ul>
<li>If you start with me and I think you need more than I can offer in this setting, I'll tell you plainly.</li>
<li>I'll help you connect with the right service and make sure no one is left waiting alone.</li>
<li>If your needs change later, we can talk about where you're best supported.</li>
</ul>
""")

MC_CANCEL = ("Cancelling and missed sessions", """
<p>Missing a session never costs you money. It does cost another person a spot, and it costs you momentum, so please tell me as early as you can.</p>
{CALC}
<p>Here's the deadline I ask for: <strong>3:00 PM the day before</strong>. If you miss a few sessions in a row, I'll check in with you first. We'll talk about what's getting in the way and whether a different day, time or plan would help.</p>
<p class="note">This isn't a punishment system. It's a way to keep your time protected and the schedule fair.</p>
""")

DECKS = {
    "cash": {
        "label": "Paying for sessions yourself",
        "title": "Welcome (self-pay) | Melissa McKenna, LCSW",
        "slides": [WELCOME, ROADMAP, HOW_I_WORK, VIDEO, FIRST_SESSION, PRIVACY, SAFETY, CASH_MONEY, CASH_CANCEL, CONTACT, AI, CHECKLIST],
    },
    "insurance": {
        "label": "Using private insurance",
        "title": "Welcome (insurance) | Melissa McKenna, LCSW",
        "slides": [WELCOME, ROADMAP, HOW_I_WORK, VIDEO, FIRST_SESSION, PRIVACY, SAFETY, INS_MONEY, INS_ASK, INS_CANCEL, CONTACT, AI, CHECKLIST],
    },
    "medi-cal": {
        "label": "Using Medi-Cal",
        "title": "Welcome (Medi-Cal) | Melissa McKenna, LCSW",
        "slides": [WELCOME, ROADMAP, HOW_I_WORK, VIDEO, FIRST_SESSION, PRIVACY, SAFETY, MC_MONEY, MC_LEVEL, MC_CANCEL, CONTACT, AI, CHECKLIST],
    },
}

HEAD = """<!--title: {title}|desc: A short welcome before your first session.|nav: -->
<!doctype html>
"""


def page(deck_key, deck):
    slides = deck["slides"]
    n = len(slides)
    sections = []
    for i, (title, body) in enumerate(slides, 1):
        body = body.replace("{CALC}", cancel_calc())
        sections.append(
            f'<section class="slide" id="s{i}" data-n="{i}" aria-labelledby="h{i}">\n'
            f'<p class="kicker">{i} of {n}</p>\n<h2 id="h{i}">{title}</h2>\n{body}\n</section>'
        )
    return f"""<!--title: {deck['title']}|desc: A short welcome before your first session.|nav: -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{{{{TITLE}}}}</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Karla:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="slides.css">
</head>
<body class="deck">
<header class="deck-top">
<a class="brand" href="index.html" aria-label="Melissa McKenna, LCSW, home"><svg class="brand-mark" viewBox="0 0 80 88" aria-hidden="true"><path d="M8 84 V42 A16 16 0 0 1 40 42 V84 M40 84 V42 A16 16 0 0 1 72 42 V84" fill="none" stroke="#17707B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="12" r="5" fill="#E9A63B"/></svg><span>Melissa McKenna<small>Welcome to working together</small></span></a>
<p class="deck-for">{deck['label']}</p>
</header>
<div class="progress" role="progressbar" aria-label="Progress" aria-valuemin="1" aria-valuemax="{n}" aria-valuenow="1"><span id="bar"></span></div>
<main id="main" class="deck-main" data-total="{n}">
{chr(10).join(sections)}
</main>
<nav class="deck-nav" aria-label="Slides">
<button type="button" id="prev" class="btn ghost">Back</button>
<span id="count" aria-live="polite">1 of {n}</span>
<button type="button" id="next" class="btn">Next</button>
</nav>
<noscript><p class="wrap narrow">This slide show works best with JavaScript on. Every slide is shown above in order.</p></noscript>
<script src="slides.js"></script>
</body>
</html>
"""


def chooser():
    cards = "".join(
        f'<a class="choice" href="welcome-{k}.html"><strong>{v["label"]}</strong><span>Start</span></a>'
        for k, v in DECKS.items()
    )
    return f"""<!--title: Welcome | Melissa McKenna, LCSW|desc: A short welcome before your first session.|nav: -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{{{{TITLE}}}}</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Karla:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="slides.css">
</head>
<body class="deck">
<header class="deck-top">
<a class="brand" href="index.html" aria-label="Melissa McKenna, LCSW, home"><svg class="brand-mark" viewBox="0 0 80 88" aria-hidden="true"><path d="M8 84 V42 A16 16 0 0 1 40 42 V84 M40 84 V42 A16 16 0 0 1 72 42 V84" fill="none" stroke="#17707B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="12" r="5" fill="#E9A63B"/></svg><span>Melissa McKenna<small>Welcome to working together</small></span></a>
</header>
<main id="main" class="deck-main choose">
<p class="kicker">Before your first session</p>
<h1>Welcome. Which of these sounds like you?</h1>
<p>The money part is a little different for each. Everything else is the same. Pick the closest one. If you're not sure, ask me and I'll point you to the right one.</p>
<div class="choices">{cards}</div>
<p class="note">Nothing on these pages collects or stores any information about you.</p>
</main>
</body>
</html>
"""


for key, deck in DECKS.items():
    (SRC / f"welcome-{key}.html").write_text(page(key, deck), encoding="utf-8")
(SRC / "welcome.html").write_text(chooser(), encoding="utf-8")
print("wrote", len(DECKS) + 1, "pages")
