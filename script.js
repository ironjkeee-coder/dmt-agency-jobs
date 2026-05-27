/* =============================================
   DMT Agency — Quiz Logic (Ukrainian)
   ============================================= */

// ── Config ─────────────────────────────────────
const CONFIG = {
  TELEGRAM_BOT_TOKEN: "8915814954:AAE0InI8TQ3cV1-PQgJ_fhOox3hWM91yttM",
  TELEGRAM_CHAT_ID:   "-1003577034542",
  TG_CHANNEL_LINK:    "https://t.me/dmitry_hr_H",
};

// ── Answers store ───────────────────────────────
const answers = {
  age:        "24",
  english:    "",
  pc:         "",
  experience: "",
  name:       "",
  phone:      "",
  telegram:   "",
};

let currentSlide = 1;
let goingBack     = false;
const TOTAL       = 5;        // slides (4 questions + contact form)
const Q_COUNT     = 4;        // questions for the step counter

// ── Start quiz ──────────────────────────────────
function startQuiz() {
  document.getElementById("pageHero").classList.add("hidden");
  document.getElementById("pageQuiz").classList.remove("hidden");
  window.scrollTo(0, 0);
  updateUI(1);
  initSlider();
}

// ── Update progress bar, step counter, nav ──────
function updateUI(step) {
  currentSlide = step;

  // Progress bar: 0% at step 1, 100% at final form
  const pct = ((step - 1) / (TOTAL - 1)) * 100;
  const bar = document.getElementById("topBarFill");
  if (bar) bar.style.width = pct + "%";

  // Step counter label
  const sc = document.getElementById("qzStepCount");
  if (sc) sc.textContent = step < TOTAL ? `${step} з ${Q_COUNT}` : "Контакти";

  // Back button
  const back = document.getElementById("btnBack");
  if (back) back.disabled = step <= 1;

  // Forward button: hidden on contact form slide
  const next = document.getElementById("btnNext");
  if (next) next.style.display = step === TOTAL ? "none" : "flex";
}

// ── Init slider on first show ───────────────────
function initSlider() {
  const s = document.getElementById("ageSlider");
  if (s) updateSlider(s);
}

// ── Slider input handler ────────────────────────
function updateSlider(slider) {
  const val = parseInt(slider.value);
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  const pct = (val - min) / (max - min); // 0–1

  // Update bubble text and position
  const bubble = document.getElementById("sliderBubble");
  if (bubble) {
    bubble.textContent = val;
    // Position: thumb is 26px wide, translateX(-50%) on bubble centres it
    // offset corrects for thumb not travelling full width
    const offsetPx = 13 - pct * 26;
    bubble.style.left = `calc(${pct * 100}% + ${offsetPx.toFixed(1)}px)`;
  }

  // Update track fill colour
  slider.style.background =
    `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(pct * 100).toFixed(1)}%, var(--border-2) ${(pct * 100).toFixed(1)}%)`;

  answers.age = String(val);
}

// ── Pick radio-list option ──────────────────────
function pickOpt(btn, field, value, stepNum) {
  answers[field] = value;

  // Highlight selection inside the same list/grid
  const parent = btn.closest(".radio-list, .chips-grid");
  if (parent) parent.querySelectorAll(".radio-item, .chip-item").forEach(el => el.classList.remove("selected"));
  btn.classList.add("selected");

  // Extract trailing emoji for the burst visual; fall back to ✓
  const emoji = extractEmoji(btn.textContent) || "✓";

  // Short pause so user sees the highlight, then burst + advance
  setTimeout(() => {
    goingBack = false;
    burstThenGo(emoji, stepNum + 1, true);
  }, 150);
}

// ── Validate that current slide has an answer ───
function isSlideAnswered(step) {
  if (step === 2) return answers.english !== "";
  if (step === 3) return answers.pc      !== "";
  if (step === 4) return answers.experience !== "";
  return true; // slide 1 (slider always has value), slide 5 (form handles itself)
}

// ── Shake + hint when no answer selected ────────
function shakeCurrentSlide() {
  const slide = document.getElementById(`slide-${currentSlide}`);
  if (!slide) return;

  const grid = slide.querySelector(".chips-grid, .radio-list");
  if (!grid) return;

  // Remove old hint if any
  const old = slide.querySelector(".select-hint");
  if (old) old.remove();

  // Show hint below the grid
  const hint = document.createElement("p");
  hint.className = "select-hint";
  hint.textContent = "👆 Будь ласка, оберіть один із варіантів";
  grid.after(hint);

  // Shake animation on grid
  grid.classList.add("shake");
  setTimeout(() => grid.classList.remove("shake"), 600);

  // Auto-remove hint after 3 s
  setTimeout(() => { if (hint.parentNode) hint.remove(); }, 3000);
}

// ── Forward button ──────────────────────────────
function goNext() {
  if (currentSlide < TOTAL) {
    if (!isSlideAnswered(currentSlide)) {
      shakeCurrentSlide();
      return;
    }
    goingBack = false;
    // Slide 1 = age slider → burst the chosen number
    if (currentSlide === 1) {
      burstThenGo(answers.age, 2, false);
    } else {
      goToSlide(currentSlide + 1);
    }
  }
}

// ── Back button ─────────────────────────────────
function goBack() {
  if (currentSlide > 1) {
    goingBack = true;
    goToSlide(currentSlide - 1);
  }
}

// ── Slide transition ────────────────────────────
function goToSlide(num) {
  if (num < 1 || num > TOTAL) return;

  const cur  = document.getElementById(`slide-${currentSlide}`);
  const next = document.getElementById(`slide-${num}`);
  if (!cur || !next) return;

  const rev = goingBack ? " rev" : "";

  // Exit current
  cur.className = `slide exit${rev}`;

  setTimeout(() => {
    cur.className = "slide";                        // hide
    next.className = `slide active${rev}`;          // enter
    if (rev) {
      // strip .rev after animation completes so it doesn't affect future transitions
      setTimeout(() => {
        if (next.classList.contains("active")) next.className = "slide active";
      }, 310);
    }
    updateUI(num);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 230);
}

// ── Answer burst transition ─────────────────────
// Shows the selected emoji / age number zooming across the full screen,
// then silently flips to the next slide behind the overlay.
function burstThenGo(text, nextSlide, isEmoji) {
  if (nextSlide < 1 || nextSlide > TOTAL) return;

  const BURST_MS = 520;   // must match @keyframes txBurstZoom duration
  const body     = document.getElementById("qzBody");

  // 1. Build overlay ─────────────────────────────
  const overlay = document.createElement("div");
  overlay.className = "tx-burst";

  const span = document.createElement("div");
  span.className  = "tx-burst-text";
  // Emoji → large fixed px; age number → fluid so it fills screen on any device
  span.style.fontSize = isEmoji ? "96px" : "clamp(72px, 24vw, 120px)";
  span.textContent    = text;

  overlay.appendChild(span);
  document.body.appendChild(overlay);

  // 2. Flip slides instantly (hidden under burst) ─
  const cur  = document.getElementById(`slide-${currentSlide}`);
  const next = document.getElementById(`slide-${nextSlide}`);

  // Suppress the slide-in CSS animation while burst is masking the switch
  if (body) body.classList.add("no-slide-anim");
  if (cur)  cur.className  = "slide";
  if (next) next.className = "slide active";
  updateUI(nextSlide);
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Re-enable animations after one paint (next user action will animate normally)
  setTimeout(() => { if (body) body.classList.remove("no-slide-anim"); }, 80);

  // 3. Remove overlay when animation ends ─────────
  setTimeout(() => overlay.remove(), BURST_MS);
}

// Extract last emoji character from a chip label string
function extractEmoji(str) {
  // Match supplementary-plane emoji (U+1F000..1FFFF) and misc symbols (U+2600..27BF)
  const matches = str.match(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]/gu);
  return matches ? matches[matches.length - 1] : null;
}

// ── Gift popup ──────────────────────────────────
function toggleGift() {
  const existing = document.querySelector(".gift-popup");
  if (existing) { existing.remove(); return; }

  const pop = document.createElement("div");
  pop.className = "gift-popup";
  pop.innerHTML = `🎁 <strong>Остання хвиля набору у цьому кварталі!</strong><br>
    Заповни анкету зараз і отримай пріоритетний розгляд своєї кандидатури.`;
  document.getElementById("pageQuiz").appendChild(pop);

  setTimeout(() => { if (pop.parentNode) pop.remove(); }, 4200);
}

document.addEventListener("click", e => {
  if (!e.target.closest(".qn-gift") && !e.target.closest(".gift-popup")) {
    const p = document.querySelector(".gift-popup");
    if (p) p.remove();
  }
});

// ── Submit form ─────────────────────────────────
async function submitForm() {
  const nameEl  = document.getElementById("inputName");
  const phoneEl = document.getElementById("inputPhone");
  const tgEl    = document.getElementById("inputTelegram");
  const chkEl   = document.getElementById("privacyBox");

  const name  = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const tgRaw = tgEl.value.trim();
  // Якщо юзер ввів без @ — додаємо; якщо вже є @ — залишаємо як є
  const tg    = tgRaw && !tgRaw.startsWith("@") ? "@" + tgRaw : tgRaw;

  // Clear old errors
  [nameEl, phoneEl, tgEl].forEach(el => el.classList.remove("error"));
  document.querySelectorAll(".error-text").forEach(e => e.remove());

  let ok = true;
  if (!name)                        { showErr(nameEl,  "Будь ласка, введи своє ім'я"); ok = false; }
  if (!phone && !tg)                { showErr(phoneEl, "Введи номер телефону або нік у Telegram"); ok = false; }
  if (phone && phone.replace(/\D/g, "").length < 7) { showErr(phoneEl, "Введи коректний номер"); ok = false; }
  if (!chkEl.checked)               { ok = false; }
  if (!ok) return;

  answers.name     = name;
  answers.phone    = phone;
  answers.telegram = tg;

  const btn = document.getElementById("sendBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="loader"></span> Відправляємо...`;

  const sent = await sendToTelegram(answers);

  if (sent) {
    if (window.fbq) fbq("track", "Lead");
    showThankYou();
  } else {
    btn.disabled = false;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Готово!`;
    showErr(phoneEl, "Помилка відправки. Спробуй ще раз.");
  }
}

function showErr(input, msg) {
  input.classList.add("error");
  const p = document.createElement("p");
  p.className = "error-text";
  p.textContent = msg;
  input.parentNode.appendChild(p);
}

// ── Show thank-you screen ───────────────────────
function showThankYou() {
  document.getElementById("pageQuiz").classList.add("hidden");
  const ty = document.getElementById("pageTY");
  ty.classList.remove("hidden");
  const btn = document.getElementById("tgBtn");
  if (btn) btn.href = CONFIG.TG_CHANNEL_LINK;
  window.scrollTo(0, 0);
}

// ── Telegram Bot API ────────────────────────────
async function sendToTelegram(data) {
  const now = new Date().toLocaleString("uk-UA", {
    timeZone: "Europe/Kiev",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const text = `
🔔 <b>Нова заявка — mini site app</b>

👤 <b>Ім'я:</b> ${esc(data.name)}
📞 <b>Телефон:</b> ${data.phone ? "+380" + esc(data.phone) : "—"}
💬 <b>Telegram:</b> ${data.telegram ? esc(data.telegram) : "—"}

🎂 <b>Вік:</b> ${esc(data.age)} р.
🌐 <b>Рівень англійської:</b> ${esc(data.english)}
💻 <b>ПК / ноутбук:</b> ${esc(data.pc)}
💬 <b>Досвід оператора чату:</b> ${esc(data.experience)}

🕐 <b>Час:</b> ${now}
  `.trim();

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CONFIG.TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
      }
    );
    const json = await res.json();
    return json.ok === true;
  } catch (err) {
    console.error("Telegram error:", err);
    return false;
  }
}

function esc(str) {
  return String(str || "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Keyboard shortcuts inside form ─────────────
document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const el = document.activeElement;
  if (!el) return;
  if      (el.id === "inputName")     { e.preventDefault(); document.getElementById("inputPhone").focus(); }
  else if (el.id === "inputPhone")    { e.preventDefault(); document.getElementById("inputTelegram").focus(); }
  else if (el.id === "inputTelegram") { e.preventDefault(); submitForm(); }
});
