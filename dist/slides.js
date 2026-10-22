/* Onboarding slides. No data is collected, sent or stored. */
(function () {
  var root = document.documentElement;
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  if (!slides.length) return;

  document.body.classList.add("js");
  root.classList.add("js");

  var total = slides.length;
  var i = 0;
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var count = document.getElementById("count");
  var bar = document.getElementById("bar");
  var progress = document.querySelector(".progress");

  function show(n, focus) {
    i = Math.max(0, Math.min(total - 1, n));
    slides.forEach(function (s, k) {
      s.classList.toggle("on", k === i);
      s.setAttribute("aria-hidden", k === i ? "false" : "true");
    });
    count.textContent = (i + 1) + " of " + total;
    bar.style.width = ((i + 1) / total * 100) + "%";
    if (progress) progress.setAttribute("aria-valuenow", String(i + 1));
    prev.disabled = i === 0;
    next.textContent = i === total - 1 ? "Finish" : "Next";
    if (focus) {
      var h = slides[i].querySelector("h2");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
  }

  prev.addEventListener("click", function () { show(i - 1, true); });
  next.addEventListener("click", function () {
    if (i === total - 1) { window.location.href = "welcome.html"; return; }
    show(i + 1, true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { show(i + 1, true); }
    if (e.key === "ArrowLeft") { show(i - 1, true); }
  });

  var x0 = null;
  document.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 70) show(dx < 0 ? i + 1 : i - 1, true);
  }, { passive: true });

  // cancellation deadline calculator
  var day = document.getElementById("day");
  var out = document.getElementById("calc-out");
  var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function calc() {
    if (!day || !out) return;
    var d = parseInt(day.value, 10);
    var before = names[(d + 6) % 7];
    out.textContent = "Let me know by 3:00 PM on " + before + ".";
  }
  if (day) { day.addEventListener("change", calc); calc(); }

  var start = parseInt((window.location.hash || "").replace("#", ""), 10);
  show(isNaN(start) ? 0 : start - 1, false);
})();
