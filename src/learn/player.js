/* Melissa McKenna, LCSW · mini-course player.
   Everything a client writes stays in this browser (localStorage). Words are sent to /api/reflect only when the
   client presses "Reflect with me". Nothing is sent to Melissa automatically: sharing is a summary the client
   copies into the secure client portal. */
(function () {
  'use strict';

  var KEY = 'mmlcsw-tracks-v1';
  var PORTAL = 'https://melissa-mckenna.clientsecure.me/contact-widget';
  var CRISIS_RE = /\b(kill(ing)? myself|end(ing)? my life|want(ed)? to die|wanna die|suicid\w*|take my own life|hurt(ing)? myself|harm(ing)? myself|cut(ting)? myself|better off dead|not be alive|don'?t want to be here)\b/i;

  var COOL = { rounds: 6, phases: [
    { label: 'Sip in', sub: 'Across a curled tongue, or pursed lips like a straw. Feel the cool.', secs: 4, scale: 1 },
    { label: 'Out through your nose', sub: 'Slow and long, longer than the sip in.', secs: 7, scale: 0.5 }
  ] };
  var TONE = { rounds: 5, phases: [
    { label: 'In: low belly', sub: 'Through your nose', secs: 2, scale: 0.68 },
    { label: 'In: ribs', sub: 'Keep sipping', secs: 2, scale: 0.84 },
    { label: 'In: upper chest', sub: 'Top of the breath, no strain', secs: 2, scale: 1 },
    { label: 'Hum out', sub: 'Soft "mmm" or "voo". Let it fade to the end.', secs: 8, scale: 0.5 }
  ] };
  var ORIENT = [
    { text: 'Let your eyes move slowly around the room. No hurry.', secs: 10 },
    { text: 'Find something you like the look of. Let your eyes rest on it.', secs: 10 },
    { text: 'Feel your feet on the floor. Press them down a little.', secs: 10 },
    { text: 'Feel what is holding you up: the chair, the bed, the floor.', secs: 10 },
    { text: 'Say, out loud or in your head: "It is today. I am here."', secs: 10 },
    { text: 'Let your breath do whatever it wants. You do not have to manage it.', secs: 10 }
  ];

  var STATES = {
    revved: { t: 'Revved up', d: 'Fast, tight, hot, wired, snappy, racing thoughts.' },
    window: { t: 'In my window', d: 'Workable. I can feel things and still think.' },
    low: { t: 'Powered down', d: 'Flat, foggy, heavy, numb, far away, shut down.' },
    unsure: { t: 'Hard to tell', d: 'Mixed, blank, or I am not sure.' }
  };

  var S = load();
  var track = null, screens = [], i = 0, dir = 1, cleanups = [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var stage = $('#stage');

  function fresh() { return { consent: null, progress: {}, answers: {}, checks: {}, states: [], last: null }; }
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? Object.assign(fresh(), v) : fresh(); } catch (e) { return fresh(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep going in memory */ } }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rich(s) { return esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>'); }
  function mark() { return '<svg viewBox="0 0 80 88" aria-hidden="true"><path d="M8 84 V42 A16 16 0 0 1 40 42 V84 M40 84 V42 A16 16 0 0 1 72 42 V84" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="12" r="5" fill="#E9A63B"/></svg>'; }
  function ak() { return track.id + ':'; }
  function answer(id) { return S.answers[ak() + id]; }

  /* ---------------- modal ---------------- */
  var modal = $('#modal'), modalBody = $('#modalBody'), lastFocus = null;
  function openModal(html, after) {
    lastFocus = document.activeElement;
    modalBody.innerHTML = html;
    modal.hidden = false;
    var f = modalBody.querySelector('h2'); if (f) { f.setAttribute('tabindex', '-1'); f.focus(); }
    if (after) after(modalBody);
  }
  function closeModal() { runCleanups('modal'); modal.hidden = true; modalBody.innerHTML = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $('#modalX').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    if (!modal.hidden || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'ArrowRight' && track) go(i + 1);
    if (e.key === 'ArrowLeft' && track) go(i - 1);
  });
  function addCleanup(fn, scope) { cleanups.push({ fn: fn, scope: scope || 'screen' }); }
  function runCleanups(scope) { cleanups = cleanups.filter(function (c) { if (c.scope === scope) { try { c.fn(); } catch (e) {} return false; } return true; }); }

  /* ---------------- shared pieces ---------------- */
  function careCrisis() {
    return '<div class="care" role="alert"><h3>Let\'s pause the course for a moment</h3><p>What you wrote sounds heavy, and you matter more than finishing this. Your words are saved only on this device.</p><ul class="list"><li><b>If you might hurt yourself, or you are in danger, call or text 988.</b> In an emergency, call 911 or go to the nearest emergency room.</li><li>If it is not an emergency but you want me to know, message me in the <a href="' + PORTAL + '" target="_blank" rel="noopener">secure portal</a>. I reply within one business day. I am not an emergency service, so please do not wait on me if you are in danger.</li></ul></div>';
  }
  function careHuman() {
    return '<div class="care"><h3>You deserve a real person for this</h3><p>Sharing it here was okay, and I am glad you could write it down. When something big comes up, your body can go into <b>flooding</b>: feelings, or shutdown, arrive faster than your thinking can follow. A calmer body and a real human help most then, and a screen cannot be that. It is not that what you wrote is too much or unwelcome. It is about regulation and timing.</p><p>Please bring it to me in session, or send a note in the secure portal. If you can, settle first with the Pause tools.</p><div class="row"><button class="btn small warm" id="needPause" type="button">Open the Pause tools</button><a class="btn small ghost" href="' + PORTAL + '" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">Message Melissa</a></div></div>';
  }
  function consentLabel() {
    var m = S.consent && S.consent.mode;
    return m === 'always' ? 'Share my reflections with Melissa' : m === 'ask' ? 'Ask me each time' : m === 'never' ? 'Keep everything private' : 'Not chosen yet';
  }
  function consentForm(modalMode) {
    var cur = S.consent && S.consent.mode;
    function o(v, t, d) { return '<button type="button" class="opt' + (cur === v ? ' on' : '') + '" data-mode="' + v + '" aria-pressed="' + (cur === v) + '"><b>' + t + '</b><span>' + d + '</span></button>'; }
    return '<p>When you write something in this course, here is what happens.</p>' +
      '<ul class="list"><li>It is saved <b>on this device only</b>. I do not have a copy and I cannot see it.</li>' +
      '<li>To write a reflection back to you, your words are sent over a secure connection to an AI service, only when you press the Reflect button. The reflection is from that AI helper, not from me. <b>Please leave out last names, addresses, and other identifying details.</b></li>' +
      '<li>Nothing is sent to me automatically. If you want me to see what you wrote, the last screen builds a summary that you copy into the secure client portal yourself.</li></ul>' +
      '<p><b>Would you like to share your reflections with me?</b> You can change this any time.</p>' +
      '<div class="opts" id="consentOpts">' +
      o('always', 'Yes, I would like to share my reflections with Melissa', 'I will pick what to send on the last screen. Everything I write starts out selected.') +
      o('ask', 'Ask me each time', 'After each reflection, I choose whether it goes in the summary.') +
      o('never', 'No, keep everything private', 'I will write for myself. The sharing screen stays empty.') +
      '</div>';
  }
  function bindConsent(root, onPick) {
    var box = $('#consentOpts', root); if (!box) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]'); if (!b) return;
      S.consent = { mode: b.getAttribute('data-mode'), at: new Date().toISOString() }; save();
      Array.prototype.forEach.call(box.children, function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      if (onPick) onPick();
    });
  }

  function openPrivacy() {
    openModal('<h2>Your notes, your choice</h2>' + consentForm() +
      '<p class="hint">Current choice: <b id="curChoice">' + esc(consentLabel()) + '</b></p>' +
      '<div class="row"><button class="btn small ghost" id="wipe" type="button">Clear everything from this device</button><button class="btn small" id="done" type="button">Close</button></div>',
      function (r) {
        bindConsent(r, function () { $('#curChoice', r).textContent = consentLabel(); });
        $('#done', r).addEventListener('click', closeModal);
        $('#wipe', r).addEventListener('click', function () {
          if (confirm('This erases every course note, check-in and tick mark saved on this device. It cannot be undone. Continue?')) { S = fresh(); save(); closeModal(); if (track) render(); }
        });
      });
  }

  function openPause() {
    openModal('<h2>Pause</h2><p>You are allowed to stop. Nothing here is a test. Where is your body right now?</p>' +
      '<div class="opts" id="pOpts">' + ['revved', 'low', 'window', 'unsure'].map(function (k) { return '<button type="button" class="opt" data-s="' + k + '"><b>' + STATES[k].t + '</b><span>' + STATES[k].d + '</span></button>'; }).join('') + '</div>' +
      '<div id="pOut"></div>' +
      '<p class="hint">If you might hurt yourself or you are in danger, call or text <b>988</b>, or call 911. Message me in the <a href="' + PORTAL + '" target="_blank" rel="noopener">secure portal</a> for anything else (I reply within one business day and I am not an emergency service).</p>',
      function (r) {
        var out = $('#pOut', r);
        $('#pOpts', r).addEventListener('click', function (e) {
          var b = e.target.closest('[data-s]'); if (!b) return;
          runCleanups('modal');
          var s = b.getAttribute('data-s');
          if (s === 'revved') {
            out.innerHTML = '<div class="reply"><div class="who">For revved up</div><p>Let the heat come down a notch. Put both feet on the floor and let your exhale be longer than your inhale. If the cooling breath is okay for you, try a few rounds here.</p></div><div class="k-teal" style="border-radius:18px;padding:6px 14px">' + pacerHTML('Cooling breath', COOL) + '</div>';
            bindPacer(out, COOL, 'modal');
          } else if (s === 'low') {
            out.innerHTML = '<div class="reply"><div class="who">For powered down</div><p>No cooling breath for this one. Your system needs a little gentle input, not more quiet. Wiggle your toes, press your hands together, stand up if you can, or run cool water over your wrists. Then orient, slowly.</p></div><div class="k-teal" style="border-radius:18px;padding:6px 14px">' + guideHTML('Look around, feel your feet') + '</div>';
            bindGuide(out, ORIENT, 'modal', 'Good. Notice if anything is even a little different.');
          } else if (s === 'window') {
            out.innerHTML = '<div class="reply"><div class="who">In your window</div><p>Lovely. You could use this moment for the three-part toning breath, or just carry on. If you were pausing because something felt hard, stopping is fine too.</p></div>';
          } else {
            out.innerHTML = '<div class="reply"><div class="who">Hard to tell</div><p>That is common, and it is useful to know. Feel your feet. Look around slowly. Say today\'s date out loud. Then check in again.</p></div><div class="k-teal" style="border-radius:18px;padding:6px 14px">' + guideHTML('Look around, feel your feet') + '</div>';
            bindGuide(out, ORIENT, 'modal', 'Good. Notice if anything is even a little different.');
          }
        });
      });
  }
  function sectionsOf() {
    var list = [], cur = null;
    screens.forEach(function (s, k) { var lab = s.section || null; if (lab && lab !== cur) { list.push({ label: lab, at: k }); cur = lab; } });
    if (list.length && list[0].at > 0) list.unshift({ label: 'Start', at: 0 });
    return list;
  }
  function openContents() {
    var list = sectionsOf(); if (list.length < 2) return;
    var resume = Math.min(S.progress[track.id] || 0, screens.length - 1);
    openModal('<h2>Where would you like to be?</h2><div class="opts" id="cts">' + list.map(function (x) { return '<button type="button" class="opt" data-at="' + x.at + '"><b>' + esc(x.label) + '</b></button>'; }).join('') + '</div><div class="row"><button class="btn small ghost" data-at="' + resume + '" type="button">Back to where I was</button></div>',
      function (r) { r.addEventListener('click', function (e) { var b = e.target.closest('[data-at]'); if (!b) return; closeModal(); go(parseInt(b.getAttribute('data-at'), 10)); }); });
  }
  $('#where').addEventListener('click', openContents);
  $('#btnPause').addEventListener('click', openPause);
  $('#btnPrivacy').addEventListener('click', openPrivacy);

  /* ---------------- breath pacer and timed guide ---------------- */
  function pacerHTML(title, cfg) {
    var counts = [3, cfg.rounds, 8].filter(function (n, k, a) { return a.indexOf(n) === k; }).sort(function (a, b) { return a - b; });
    var opts = counts.map(function (n) { return '<option value="' + n + '"' + (n === cfg.rounds ? ' selected' : '') + '>' + n + ' rounds</option>'; }).join('');
    return '<div class="pacer" data-pacer><h3 style="font-family:var(--head);font-weight:500;margin:0 0 6px">' + esc(title) + '</h3><div class="orb-wrap"><div class="orb" aria-hidden="true"></div></div>' +
      '<div class="ph-label" aria-live="polite">Ready when you are</div><div class="ph-sub"></div><div class="rounds"></div>' +
      '<div class="row" style="justify-content:center"><select class="rsel" aria-label="Number of rounds" style="font:inherit;padding:8px 10px;border-radius:10px">' + opts + '</select><button class="btn gold p-start" type="button">Start</button><button class="btn ghost small p-stop" type="button" hidden>Stop</button></div></div>';
  }
  function bindPacer(root, cfg, scope) {
    var p = $('[data-pacer]', root); if (!p) return;
    var orb = $('.orb', p), lab = $('.ph-label', p), sub = $('.ph-sub', p), rd = $('.rounds', p), start = $('.p-start', p), stop = $('.p-stop', p), sel = $('.rsel', p);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null, running = false;
    function setOrb(scale, secs) { orb.style.transitionDuration = (reduce ? 0 : secs) + 's'; orb.style.transform = 'scale(' + scale + ')'; }
    function halt(msg, subMsg) { running = false; clearTimeout(timer); setOrb(0.5, 1); lab.textContent = msg; sub.textContent = subMsg || ''; rd.textContent = ''; start.hidden = false; stop.hidden = true; sel.disabled = false; start.textContent = 'Go again'; }
    function run() {
      var rounds = parseInt(sel.value, 10) || cfg.rounds, round = 0, pi = 0;
      running = true; start.hidden = true; stop.hidden = false; sel.disabled = true;
      lab.textContent = 'Settle in'; sub.textContent = 'Feel your feet. Let your shoulders drop.'; setOrb(0.5, 1);
      timer = setTimeout(step, 3000);
      function step() {
        if (!running) return;
        if (round >= rounds) { halt('Rest', 'Breathe normally. Notice what is here, even if it is small.'); return; }
        var ph = cfg.phases[pi];
        lab.textContent = ph.label; sub.textContent = ph.sub || ''; rd.textContent = 'Round ' + (round + 1) + ' of ' + rounds;
        setOrb(ph.scale, ph.secs);
        timer = setTimeout(function () { pi++; if (pi >= cfg.phases.length) { pi = 0; round++; } step(); }, ph.secs * 1000);
      }
    }
    start.addEventListener('click', run);
    stop.addEventListener('click', function () { halt('Stopped. That is allowed.', 'Breathe normally. Look around the room.'); });
    addCleanup(function () { running = false; clearTimeout(timer); }, scope || 'screen');
  }

  function guideHTML(title) {
    return '<div class="guide-box" data-guide><h3 style="font-family:var(--head);font-weight:500;margin:0 0 8px">' + esc(title) + '</h3><div class="g-text" aria-live="polite">Press start when you are ready.</div><div class="ring"><i></i></div>' +
      '<div class="row" style="justify-content:center"><button class="btn gold g-start" type="button">Start</button><button class="btn ghost small g-stop" type="button" hidden>Stop</button></div></div>';
  }
  function bindGuide(root, steps, scope, endText) {
    var g = $('[data-guide]', root); if (!g) return;
    var txt = $('.g-text', g), bar = $('.ring i', g), start = $('.g-start', g), stop = $('.g-stop', g);
    var timer = null, running = false;
    function end(msg) { running = false; clearTimeout(timer); bar.style.transition = 'none'; bar.style.width = '0'; txt.textContent = msg; start.hidden = false; stop.hidden = true; start.textContent = 'Again'; }
    start.addEventListener('click', function () {
      running = true; start.hidden = true; stop.hidden = false; var k = 0;
      (function step() {
        if (!running) return;
        if (k >= steps.length) { end(endText || 'That is it. Notice what is different, even a little.'); return; }
        txt.textContent = steps[k].text; bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth;
        bar.style.transition = 'width ' + steps[k].secs + 's linear'; bar.style.width = '100%';
        timer = setTimeout(function () { k++; step(); }, steps[k].secs * 1000);
      })();
    });
    stop.addEventListener('click', function () { end('Stopped. That is allowed.'); });
    addCleanup(function () { running = false; clearTimeout(timer); }, scope || 'screen');
  }

  /* ---------------- AI reflection ---------------- */
  // Locally the dev server answers at api/reflect. On the live site the helper runs on Google Cloud Run (project
  // mmlcsw-tracks) so client text only ever goes to Google, under Melissa's BAA.
  var REFLECT_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'api/reflect' : 'https://tracks-api-1051827796687.us-central1.run.app/api/reflect';
  function callReflect(payload) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 45000);
    return fetch(REFLECT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'failed'); return j; }); })
      .finally(function () { clearTimeout(t); });
  }
  function shareUI(s, a) {
    var m = S.consent && S.consent.mode;
    if (m === 'ask') return '<label class="chk"><input type="checkbox" class="shareChk"' + (a && a.shared ? ' checked' : '') + '><span>Include this in the summary I send to Melissa</span></label>';
    if (m === 'always') return '<p class="hint">This is included in your summary for Melissa. You can take it out on the last screen.</p>';
    return '';
  }

  /* ---------------- renderers ---------------- */
  var R = {};

  R.cover = function (s) {
    var started = (S.progress[track.id] || 0) > 0;
    return { cls: 'k-cover', dark: true, html:
      '<div class="lockup">' + mark() + '<div><div class="nm">Melissa McKenna</div><div class="rl">Licensed Clinical Social Worker</div></div></div>' +
      '<p class="eyebrow">' + esc(s.eyebrow) + '</p><h1>' + rich(s.title) + '</h1><p class="sub">' + rich(s.sub) + '</p>' +
      '<div class="row"><button class="btn gold" data-act="begin" type="button">' + (started ? 'Start from the beginning' : 'Begin') + '</button>' +
      (started ? '<button class="btn ghost" data-act="resume" type="button" style="color:var(--cream);border-color:var(--cream)">Pick up where I left off</button>' : '') + '</div>' +
      (s.byline ? '<p class="byline">' + rich(s.byline) + '</p>' : ''),
      after: function (r) {
        $('[data-act=begin]', r).addEventListener('click', function () { go(1); });
        var rb = $('[data-act=resume]', r); if (rb) rb.addEventListener('click', function () { go(Math.min(S.progress[track.id], screens.length - 1)); });
      } };
  };

  R.intro = function (s) {
    return { cls: 'k-light', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Before we begin') + '</p><h2>' + rich(s.title) + '</h2>' + (s.lead ? '<p class="lead">' + rich(s.lead) + '</p>' : '') +
      '<div class="cards">' + s.blocks.map(function (b, k) { return '<div class="card' + (k % 2 ? ' alt' : '') + '"><h3>' + rich(b.h) + '</h3><p>' + rich(b.p) + '</p></div>'; }).join('') + '</div>' +
      (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') };
  };

  R.consent = function (s) {
    return { cls: 'k-light', html: '<p class="eyebrow">Your notes, your choice</p><h2>' + rich(s.title || 'Before you write anything') + '</h2>' + consentForm(), after: function (r) { bindConsent(r); } };
  };

  R.statement = function (s) {
    return { cls: 'k-statement', html: (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') + '<h2>' + rich(s.text) + '</h2>' + (s.sub ? '<p class="sub">' + rich(s.sub) + '</p>' : '') };
  };

  R.cards = function (s) {
    return { cls: 'k-light', html: (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') + '<h2>' + rich(s.title) + '</h2>' + (s.intro ? '<p class="lead">' + rich(s.intro) + '</p>' : '') +
      '<div class="cards">' + s.cards.map(function (c, k) { return '<div class="card' + (k % 2 ? ' alt' : '') + '"><h3>' + rich(c.h) + '</h3><p>' + rich(c.p) + '</p></div>'; }).join('') + '</div>' + (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') };
  };

  R.bullets = function (s) {
    return { cls: 'k-light', html: (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') + '<h2>' + rich(s.title) + '</h2>' + (s.intro ? '<p class="lead">' + rich(s.intro) + '</p>' : '') +
      '<ul class="list">' + s.items.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul>' + (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') };
  };

  R.twocol = function (s) {
    function col(c, alt) { return '<div class="card' + (alt ? ' alt' : '') + '"><h3>' + rich(c.h) + '</h3><ul class="list">' + c.items.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul></div>'; }
    return { cls: 'k-light', html: (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') + '<h2>' + rich(s.title) + '</h2>' + (s.intro ? '<p class="lead">' + rich(s.intro) + '</p>' : '') + '<div class="twocol">' + col(s.left) + col(s.right, true) + '</div>' };
  };

  R.table = function (s) {
    return { cls: 'k-light', html: (s.eyebrow ? '<p class="eyebrow">' + esc(s.eyebrow) + '</p>' : '') + '<h2>' + rich(s.title) + '</h2>' + (s.intro ? '<p class="lead">' + rich(s.intro) + '</p>' : '') +
      '<div style="overflow-x:auto"><table class="t"><thead><tr>' + s.headers.map(function (h) { return '<th>' + rich(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      s.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + rich(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') };
  };

  R.story = function (s) {
    return { cls: 'k-story', html: '<p class="eyebrow">' + esc(s.eyebrow || 'A scene') + '</p><div class="story">' + s.paragraphs.map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('') + '</div>' };
  };

  R.video = function (s) {
    var media = s.src
      ? '<div class="vid"><video controls preload="metadata" playsinline' + (s.poster ? ' poster="' + esc(s.poster) + '"' : '') + '><source src="' + esc(s.src) + '" type="video/mp4">' + (s.captions ? '<track kind="captions" srclang="en" label="English" src="' + esc(s.captions) + '" default>' : '') + 'Your browser cannot play this video.</video></div>'
      : '<div class="vid"><div class="ph"><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="none" stroke="#E9A63B" stroke-width="3"/><path d="M29 22 L52 36 L29 50 Z" fill="#E9A63B"/></svg><div class="t">' + rich(s.title) + '</div><div class="s">A video from Melissa · about ' + esc(s.minutes) + ' min · coming soon</div></div></div>';
    return { cls: 'k-video', html: '<p class="eyebrow">Video · about ' + esc(s.minutes) + ' minutes</p><h2>' + rich(s.title) + '</h2>' + media +
      (s.summary ? '<p class="lead">' + rich(s.summary) + '</p>' : '') +
      (s.bullets && s.bullets.length ? '<ul class="list">' + s.bullets.map(function (b) { return '<li>' + rich(b) + '</li>'; }).join('') + '</ul>' : '') +
      (s.transcript ? '<details class="transcript"><summary>Read instead</summary><p>' + rich(s.transcript) + '</p></details>' : '') };
  };

  R.practice = function (s) {
    var tool = s.pacer === 'toning' ? TONE : s.pacer === 'cooling' ? COOL : null;
    var phases = s.phases ? { rounds: s.rounds || 5, phases: s.phases } : tool;
    return { cls: 'k-teal', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Practice') + '</p><h2>' + rich(s.title) + '</h2>' + (s.lead ? '<p class="sub">' + rich(s.lead) + '</p>' : '') +
      '<ol class="steps">' + s.steps.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ol>' +
      (phases ? pacerHTML(s.pacerTitle || 'Breathe along', phases) : '') + (s.guide ? guideHTML(s.guideTitle || 'Guided minute') : '') +
      (s.cautions && s.cautions.length ? '<div class="cautions"><h3>' + esc(s.cautionTitle || 'Go gently') + '</h3><ul>' + s.cautions.map(function (c) { return '<li>' + rich(c) + '</li>'; }).join('') + '</ul></div>' : '') +
      (s.note ? '<div class="note">' + rich(s.note) + '</div>' : ''),
      after: function (r) { if (phases) bindPacer(r, phases); if (s.guide) bindGuide(r, s.guide, 'screen', s.guideEnd); } };
  };

  R.checkin = function (s) {
    var a = answer(s.id);
    return { cls: 'k-light', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Check in') + '</p><h2>' + rich(s.title) + '</h2><p class="lead">' + rich(s.prompt) + '</p>' +
      '<div class="opts" id="ck">' + ['revved', 'window', 'low', 'unsure'].map(function (k) { return '<button type="button" class="opt' + (a && a.state === k ? ' on' : '') + '" data-s="' + k + '"><b>' + STATES[k].t + '</b><span>' + STATES[k].d + '</span></button>'; }).join('') + '</div><div id="ckOut"></div>',
      after: function (r) {
        var out = $('#ckOut', r);
        function show(k) {
          var rt = (s.routes && s.routes[k]) || {};
          out.innerHTML = '<div class="reply"><div class="who">' + esc(STATES[k].t) + '</div><p>' + rich(rt.text || '') + '</p>' + (rt.goto && indexOf(rt.goto) >= 0 ? '<div class="row"><button class="btn small" data-goto="' + esc(rt.goto) + '" type="button">' + esc(rt.label || 'Go there') + '</button></div>' : '') + '</div>';
          var gb = $('[data-goto]', out); if (gb) gb.addEventListener('click', function () { go(indexOf(gb.getAttribute('data-goto'))); });
        }
        if (a && a.state) show(a.state);
        $('#ck', r).addEventListener('click', function (e) {
          var b = e.target.closest('[data-s]'); if (!b) return;
          var k = b.getAttribute('data-s');
          Array.prototype.forEach.call($('#ck', r).children, function (c) { c.classList.toggle('on', c === b); });
          S.answers[ak() + s.id] = { state: k, at: new Date().toISOString() }; S.last = k; S.states.push({ s: k, t: track.id, at: new Date().toISOString() }); save(); show(k);
        });
      } };
  };

  R.choose = function (s) {
    return { cls: 'k-light', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Try this') + '</p><h2>' + rich(s.title) + '</h2><p class="lead">' + rich(s.prompt) + '</p>' +
      '<div class="opts" id="ch">' + s.options.map(function (o, k) { return '<button type="button" class="opt" data-k="' + k + '"><b>' + rich(o.label) + '</b></button>'; }).join('') + '</div><div id="chOut"></div>',
      after: function (r) { $('#ch', r).addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; Array.prototype.forEach.call($('#ch', r).children, function (c) { c.classList.toggle('on', c === b); }); $('#chOut', r).innerHTML = '<div class="reply"><p>' + rich(s.options[+b.getAttribute('data-k')].response) + '</p></div>'; }); } };
  };

  R.reflect = function (s) {
    var a = answer(s.id) || {};
    return { cls: 'k-light', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Reflect') + '</p><h2>' + rich(s.title) + '</h2><p class="lead">' + rich(s.prompt) + '</p>' +
      (s.helper ? '<p class="hint">' + rich(s.helper) + '</p>' : '') +
      '<label for="rt" class="hint">Your words (optional, 1,200 characters at most)</label><textarea id="rt" maxlength="1200" placeholder="' + esc(s.placeholder || 'A few words is plenty.') + '"></textarea>' +
      '<div class="row"><button class="btn" id="go" type="button">Reflect with me</button>' + (s.optional !== false ? '<button class="btn ghost" id="skip" type="button">Skip this one</button>' : '') + '</div>' +
      '<p class="hint">A reflection is written by an AI helper. It is not Melissa and it is not therapy. Leave out last names and identifying details.</p><div id="rOut" aria-live="polite"></div>',
      after: function (r) {
        var ta = $('#rt', r), out = $('#rOut', r), btn = $('#go', r);
        ta.value = a.text || '';
        function paint(ans) {
          var h = '';
          if (ans.crisis) h += careCrisis();
          else {
            if (ans.ai) h += '<div class="reply"><div class="who">A reflection from the course helper (AI)</div><p>' + esc(ans.ai.content) + '</p>' + (ans.ai.microStep ? '<div class="ms"><b>One small thing:</b> ' + esc(ans.ai.microStep) + '</div>' : '') + '</div>';
            if (ans.ai && (ans.ai.needsSupport || ans.ai.hardStory || ans.ai.flooded)) h += careHuman();
            if (ans.failed) h += '<div class="reply"><p>The reflection helper could not be reached just now. Your words are saved on this device. You can try again in a moment, or bring them to session.</p></div>';
          }
          out.innerHTML = h + (ans.text ? shareUI(s, ans) : '');
          var np = $('#needPause', out); if (np) np.addEventListener('click', openPause);
          var sc = $('.shareChk', out); if (sc) sc.addEventListener('change', function () { var cur = S.answers[ak() + s.id] || {}; cur.shared = sc.checked; S.answers[ak() + s.id] = cur; save(); });
        }
        if (a.text) paint(a);
        $('#skip', r) && $('#skip', r).addEventListener('click', function () { go(i + 1); });
        btn.addEventListener('click', function () {
          var text = ta.value.trim();
          if (!text) { out.innerHTML = '<div class="reply"><p>Nothing written yet. A few words is plenty, or press Skip.</p></div>'; return; }
          var shareDefault = S.consent && S.consent.mode === 'always';
          var ans = { text: text, prompt: s.prompt, title: s.title, shared: shareDefault || (a.shared || false), at: new Date().toISOString() };
          if (CRISIS_RE.test(text)) { ans.crisis = true; S.answers[ak() + s.id] = ans; save(); paint(ans); return; }
          btn.disabled = true; btn.textContent = 'Reflecting...'; out.innerHTML = '';
          callReflect({ trackTitle: track.title, prompt: s.prompt, style: s.style || 'general', focus: s.focus || '', userText: text, state: S.last })
            .then(function (j) { ans.ai = j; if (j.crisisSignal) ans.crisis = true; })
            .catch(function () { ans.failed = true; })
            .then(function () { S.answers[ak() + s.id] = ans; save(); btn.disabled = false; btn.textContent = 'Reflect again'; paint(ans); });
        });
      } };
  };

  R.tracker = function (s) {
    var key = ak() + s.id, cur = S.checks[key] || {};
    var head = '<tr><th></th>' + [1, 2, 3, 4, 5, 6, 7].map(function (d) { return '<th scope="col">Day ' + d + '</th>'; }).join('') + '</tr>';
    var body = s.rows.map(function (row, ri) { return '<tr><th scope="row">' + rich(row) + '</th>' + [0, 1, 2, 3, 4, 5, 6].map(function (d) { var id = 'r' + ri + 'd' + d; return '<td><input type="checkbox" data-id="' + id + '" aria-label="' + esc(row) + ', day ' + (d + 1) + '"' + (cur[id] ? ' checked' : '') + '></td>'; }).join('') + '</tr>'; }).join('');
    return { cls: 'k-light', html: '<p class="eyebrow">' + esc(s.eyebrow || 'This week') + '</p><h2>' + rich(s.title) + '</h2>' + (s.intro ? '<p class="lead">' + rich(s.intro) + '</p>' : '') +
      '<div style="overflow-x:auto"><table class="tracker"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div><p class="hint" id="tcount"></p>',
      after: function (r) {
        function count() { var n = Object.keys(S.checks[key] || {}).filter(function (k) { return S.checks[key][k]; }).length; $('#tcount', r).textContent = n ? 'Times you showed up this week: ' + n + '. Coming back counts as much as streaks do.' : 'Tick a box when you do it. Skipped days are just days.'; }
        count();
        r.addEventListener('change', function (e) { var c = e.target; if (!c.matches || !c.matches('[data-id]')) return; S.checks[key] = S.checks[key] || {}; S.checks[key][c.getAttribute('data-id')] = c.checked; save(); count(); });
      } };
  };

  R.share = function (s) {
    var m = S.consent && S.consent.mode;
    var items = Object.keys(S.answers).filter(function (k) { return k.indexOf(track.id + ':') === 0 && S.answers[k].text && !S.answers[k].crisis; });
    if (m === 'never' || !m) {
      return { cls: 'k-light', html: '<p class="eyebrow">Sharing</p><h2>' + rich(s.title || 'Bringing this to me') + '</h2><p class="lead">You chose to keep your notes private, and that is completely fine. Nothing here is shared.</p><p>If you want to bring something to session, just say it out loud, or message me in the <a href="' + PORTAL + '" target="_blank" rel="noopener">secure portal</a>. If you change your mind, you can switch your choice any time.</p><div class="row"><button class="btn small" id="chg" type="button">Change my choice</button></div>', after: function (r) { $('#chg', r).addEventListener('click', openPrivacy); } };
    }
    var chosen = items.filter(function (k) { return m === 'always' ? S.answers[k].shared !== false : S.answers[k].shared; });
    return { cls: 'k-light', html: '<p class="eyebrow">Sharing</p><h2>' + rich(s.title || 'Bringing this to me') + '</h2><p class="lead">You said you would like to share. Here is what is selected. Uncheck anything you want to keep to yourself.</p>' +
      (items.length ? '<div id="shareList">' + items.map(function (k) { var a = S.answers[k]; return '<label class="chk"><input type="checkbox" data-k="' + esc(k) + '"' + (chosen.indexOf(k) >= 0 ? ' checked' : '') + '><span><b>' + esc(a.title || 'Reflection') + '</b><br><span class="hint">' + esc(a.text.slice(0, 90)) + (a.text.length > 90 ? '...' : '') + '</span></span></label>'; }).join('') + '</div>' : '<p>You have not written any reflections in this course yet, so there is nothing to send.</p>') +
      '<h3>Your summary</h3><div class="sharebox" id="sb"></div>' +
      '<div class="row"><button class="btn" id="cp" type="button">Copy summary</button><a class="btn ghost" id="pt" href="' + PORTAL + '" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">Open the secure portal</a></div>' +
      '<div class="note"><b>Nothing has been sent.</b> Copy the summary, open the secure portal, and paste it into a message to me. That is the safe way for me to receive it. I reply within one business day.</div>',
      after: function (r) {
        function build() {
          var sel = Array.prototype.map.call(r.querySelectorAll('#shareList input:checked'), function (c) { return c.getAttribute('data-k'); });
          items.forEach(function (k) { S.answers[k].shared = sel.indexOf(k) >= 0; }); save();
          var t = 'From my mini-course: ' + track.title + '\nDate: ' + new Date().toLocaleDateString() + '\n\n' + sel.map(function (k) { var a = S.answers[k]; return a.title + '\n' + (a.prompt ? 'Prompt: ' + a.prompt + '\n' : '') + 'My words: ' + a.text; }).join('\n\n---\n\n');
          $('#sb', r).textContent = sel.length ? t : 'Nothing selected.';
          return sel.length ? t : '';
        }
        build();
        r.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('#shareList input')) build(); });
        $('#cp', r).addEventListener('click', function () {
          var t = build(); if (!t) return;
          var done = function () { $('#cp', r).textContent = 'Copied. Now open the portal.'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { selectBox(); });
          else selectBox();
          function selectBox() { var rg = document.createRange(); rg.selectNodeContents($('#sb', r)); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); $('#cp', r).textContent = 'Selected. Press copy on your device.'; }
        });
      } };
  };

  R.closing = function (s) {
    return { cls: 'k-teal', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Where this leaves us') + '</p><h2>' + rich(s.title) + '</h2>' + (s.text ? '<p class="sub">' + rich(s.text) + '</p>' : '') +
      (s.items ? '<ul class="list">' + s.items.map(function (x) { return '<li>' + rich(x) + '</li>'; }).join('') + '</ul>' : '') +
      (s.next ? '<div class="row">' + s.next.map(function (n) { return '<a class="btn gold" href="?t=' + encodeURIComponent(n.id) + '" style="text-decoration:none;display:inline-block">' + esc(n.label) + '</a>'; }).join('') + '</div>' : '') +
      '<p class="hint">With love,<br>Melissa</p>' + (s.note ? '<div class="note">' + rich(s.note) + '</div>' : '') };
  };

  /* ---------------- animated cartoon explainers ---------------- */
  var SCENES = {
    gasbrake: function () {
      return '<svg class="sc sc-gb" viewBox="0 0 640 360" data-f="1" role="img" aria-label="A dial with a needle that swings between powered down, your window, and revved up, with a gas pedal and a brake pedal below it">' +
        '<rect width="640" height="360" rx="22" fill="#E3F0E8"/>' +
        '<path d="M150 230 A170 170 0 0 1 222.5 90.7" fill="none" stroke="#17707B" stroke-width="34"/>' +
        '<path class="band-w" d="M222.5 90.7 A170 170 0 0 1 417.5 90.7" fill="none" stroke="#2F7A52" stroke-width="34"/>' +
        '<path d="M417.5 90.7 A170 170 0 0 1 490 230" fill="none" stroke="#B2461A" stroke-width="34"/>' +
        '<text x="150" y="268" text-anchor="middle" class="sl">Powered down</text><text x="490" y="268" text-anchor="middle" class="sl">Revved up</text><text x="320" y="36" text-anchor="middle" class="sl sw">Your window</text>' +
        '<g class="needle"><line x1="320" y1="230" x2="320" y2="104" stroke="#2B2A26" stroke-width="7" stroke-linecap="round"/></g><circle cx="320" cy="230" r="15" fill="#2B2A26"/><circle cx="320" cy="230" r="5" fill="#E9A63B"/>' +
        '<g class="pedal brake"><rect x="196" y="296" width="96" height="44" rx="12" fill="#17707B"/><text x="244" y="324" text-anchor="middle" class="pt">BRAKE</text></g>' +
        '<g class="pedal gas"><rect x="348" y="288" width="64" height="58" rx="12" fill="#B2461A"/><text x="380" y="323" text-anchor="middle" class="pt">GAS</text></g></svg>';
    },
    flooding: function () {
      return '<svg class="sc sc-fl" viewBox="0 0 640 360" data-f="1" role="img" aria-label="A cartoon head with a thinking brain and a smoke alarm, and a heart in the chest. Water rises in the head when the alarm is loud, then drains away when the body feels safe">' +
        '<defs><clipPath id="hd"><circle cx="200" cy="150" r="105"/></clipPath></defs>' +
        '<rect width="640" height="360" rx="22" fill="#E3F0E8"/>' +
        '<rect x="102" y="262" width="196" height="86" rx="40" fill="#FFFFFF" stroke="#14444B" stroke-width="5"/>' +
        '<circle cx="200" cy="150" r="105" fill="#FFFFFF" stroke="#14444B" stroke-width="5"/>' +
        '<g clip-path="url(#hd)"><rect class="water" x="90" y="60" width="220" height="220"/></g>' +
        '<g class="bulb"><circle cx="200" cy="100" r="25"/><rect x="190" y="122" width="20" height="14" rx="4"/></g>' +
        '<g class="bell"><path d="M178 214 Q178 178 200 178 Q222 178 222 214 Z" fill="#B2461A"/><circle cx="200" cy="220" r="6" fill="#B2461A"/><g class="waves" fill="none" stroke="#B2461A" stroke-width="4" stroke-linecap="round"><path d="M160 190 q-12 22 0 44"/><path d="M240 190 q12 22 0 44"/></g></g>' +
        '<path class="heart" d="M200 330 C170 308 168 288 186 288 C195 288 200 295 200 295 C200 295 205 288 214 288 C232 288 230 308 200 330 Z" fill="#B2461A"/>' +
        '<g class="lbl"><line x1="232" y1="100" x2="352" y2="100"/><line x1="228" y1="196" x2="352" y2="196"/><line x1="222" y1="308" x2="352" y2="308"/></g>' +
        '<text x="362" y="106" class="sl left">Thinking brain</text><text x="362" y="202" class="sl left">Smoke alarm</text><text x="362" y="314" class="sl left">Heart and body</text></svg>';
    }
  };

  R.explainer = function (s) {
    var n = s.frames.length;
    return { cls: 'k-light', html: '<p class="eyebrow">' + esc(s.eyebrow || 'Watch this') + '</p><h2>' + rich(s.title) + '</h2>' +
      '<div class="expl">' + SCENES[s.scene]() + '<p class="cap" id="cap" aria-live="polite"></p><div class="ctl"><button class="btn small ghost" id="ePrev" type="button" aria-label="Previous step">&larr;</button><button class="btn small" id="ePlay" type="button">Pause</button><button class="btn small ghost" id="eNext" type="button" aria-label="Next step">&rarr;</button><span class="dots" id="dots"></span></div></div>' +
      (s.note ? '<div class="note">' + rich(s.note) + '</div>' : ''),
      after: function (r) {
        var svg = $('svg', r), cap = $('#cap', r), play = $('#ePlay', r), dots = $('#dots', r);
        var f = 0, timer = null, playing = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
        dots.innerHTML = s.frames.map(function (_, k) { return '<i data-k="' + k + '"></i>'; }).join('');
        function show(k) { f = (k + n) % n; svg.setAttribute('data-f', String(f + 1)); cap.textContent = s.frames[f]; Array.prototype.forEach.call(dots.children, function (d, j) { d.className = j === f ? 'on' : ''; }); }
        function tick() { clearTimeout(timer); if (!playing) return; timer = setTimeout(function () { if (f < n - 1) { show(f + 1); tick(); } else { playing = false; play.textContent = 'Replay'; } }, 7000); }
        play.textContent = playing ? 'Pause' : 'Play';
        play.addEventListener('click', function () { if (play.textContent === 'Replay') { show(0); playing = true; play.textContent = 'Pause'; tick(); return; } playing = !playing; play.textContent = playing ? 'Pause' : 'Play'; tick(); });
        $('#eNext', r).addEventListener('click', function () { show(Math.min(f + 1, n - 1)); tick(); });
        $('#ePrev', r).addEventListener('click', function () { show(Math.max(f - 1, 0)); tick(); });
        dots.addEventListener('click', function (e) { var d = e.target.closest('[data-k]'); if (d) { show(+d.getAttribute('data-k')); tick(); } });
        show(0); tick();
        addCleanup(function () { clearTimeout(timer); playing = false; });
      } };
  };

  /* ---------------- engine ---------------- */
  function indexOf(id) { for (var k = 0; k < screens.length; k++) if (screens[k].id === id) return k; return -1; }

  function go(n) {
    n = Math.max(0, Math.min(screens.length - 1, n));
    dir = n >= i ? 1 : -1;
    i = n;
    render(true);
  }

  function render(focus) {
    runCleanups('screen');
    var s = screens[i];
    if (s.t === 'consent' && S.consent && s.auto !== false) {
      if (dir >= 0 && i < screens.length - 1) { i++; s = screens[i]; } else if (dir < 0 && i > 0) { i--; s = screens[i]; }
    }
    var fn = R[s.t] || R.bullets;
    var out = fn(s);
    stage.innerHTML = '<section class="screen ' + out.cls + '" aria-label="' + esc(s.title || s.text || track.title) + '"><div class="in">' + out.html + '</div></section>';
    var sec = stage.firstChild;
    document.body.classList.toggle('t-dark', !!out.dark);
    if (out.after) out.after(sec);
    var N = screens.length;
    $('#bar').style.width = ((i + 1) / N * 100) + '%';
    $('.progress').setAttribute('aria-valuenow', String(Math.round((i + 1) / N * 100)));
    $('#count').textContent = (i + 1) + ' of ' + N;
    var wh = $('#where'); wh.textContent = s.section || track.short || '';
    wh.classList.toggle('has-menu', sectionsOf().length > 1); wh.setAttribute('aria-label', 'Sections of this course: ' + wh.textContent);
    $('#prev').disabled = i === 0;
    $('#next').disabled = i === N - 1;
    $('#next').textContent = i === N - 2 ? 'Last screen' : 'Next';
    S.progress[track.id] = i; save();
    document.title = (s.title || s.text || track.title).replace(/<[^>]+>/g, '').slice(0, 60) + ' · Melissa McKenna, LCSW';
    if (focus) { var h = sec.querySelector('h1,h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } window.scrollTo({ top: 0 }); }
    try { history.replaceState(null, '', location.pathname + location.search + '#' + (i + 1)); } catch (e) {}
  }

  $('#prev').addEventListener('click', function () { go(i - 1); });
  $('#next').addEventListener('click', function () { go(i + 1); });
  var x0 = null;
  document.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null || !track || !modal.hidden) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
    if (Math.abs(dx) > 110) go(dx < 0 ? i + 1 : i - 1);
  }, { passive: true });

  function home(list) {
    document.body.classList.remove('t-dark');
    $('#nav').hidden = true; $('#btnPause').hidden = false;
    var links = '';
    if (list) links = '<div class="cards">' + list.map(function (t) { return '<a class="card" href="?t=' + encodeURIComponent(t.id) + '" style="text-decoration:none;color:inherit"><h3>' + esc(t.title) + '</h3><p>' + esc(t.blurb || '') + '</p></a>'; }).join('') + '</div>';
    stage.innerHTML = '<section class="screen k-light"><div class="in home"><p class="eyebrow">Mini-courses</p><h2>Welcome</h2><p class="lead">This is where I keep the short courses I share with my clients, usually a couple of weeks into our work together.</p><p>Open the link I sent you to begin. If you are not sure which one is yours, message me in the <a href="' + PORTAL + '" target="_blank" rel="noopener">secure portal</a>.</p>' + links + '<p class="hint">With love,<br>Melissa</p></div></section>';
  }

  function start() {
    var q = new URLSearchParams(location.search), t = (q.get('t') || '').toLowerCase();
    if (!t) {
      if (q.get('library') === '1') { fetch('tracks/index.json').then(function (r) { return r.json(); }).then(home).catch(function () { home(); }); } else home();
      return;
    }
    if (!/^[a-z0-9-]{1,60}$/.test(t)) { home(); return; }
    fetch('tracks/' + t + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      track = j; screens = j.screens;
      var h = parseInt((location.hash || '').replace('#', ''), 10);
      i = isNaN(h) ? 0 : Math.max(0, Math.min(screens.length - 1, h - 1));
      render(false);
    }).catch(function () { home(); stage.querySelector('.in').insertAdjacentHTML('afterbegin', '<div class="care"><p>I could not find that course. Check the link I sent you, or message me and I will resend it.</p></div>'); });
  }
  start();
})();
