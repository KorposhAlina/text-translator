const LANG_NAMES = {
  auto: "Auto",
  uk: "Ukrainian",
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  pl: "Polish",
  cs: "Czech",
  sk: "Slovak",
  ro: "Romanian",
  bg: "Bulgarian",
  sr: "Serbian",
  hr: "Croatian",
  sl: "Slovenian",
  pt: "Portuguese",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  hu: "Hungarian",
  tr: "Turkish",
  el: "Greek",
  he: "Hebrew",
  ar: "Arabic",
  hi: "Hindi",
  bn: "Bengali",
  ur: "Urdu",
  fa: "Persian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay",
  sw: "Swahili",
  af: "Afrikaans",
  is: "Icelandic",
  ga: "Irish",
  mt: "Maltese",
  fil: "Filipino"
};

// ----------------- DOM елкменти-----------------

const fromLang = document.getElementById("from-lang");
const toLang = document.getElementById("to-lang");
const swapBtn = document.getElementById("swap-langs");

const sourceText = document.getElementById("source-text");
const resultText = document.getElementById("result-text");

const translateBtn = document.getElementById("translate-text");
const statusText = document.getElementById("text-status");

const historyEmpty = document.getElementById("history-empty");
const historyList = document.getElementById("history-list");

// ----------------- Автовизначення мови -----------------

async function detectLanguage(text) {
  const res = await fetch(
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" +
      encodeURIComponent(text)
  );
  const data = await res.json();
  return data[2] || "auto";
}

// ----------------- Заміна мов місцями -----------------

swapBtn.addEventListener("click", () => {
  if (fromLang.value === "auto") return;
  const temp = fromLang.value;
  fromLang.value = toLang.value;
  toLang.value = temp;
});

// ----------------- Переклад -----------------

async function translate(text, source, target) {
  const res = await fetch("https://translator-app.onrender.com/translate-text"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      fromLang: source,
      toLang: target
    })
  });

  const data = await res.json();

  if (data.error) throw new Error(data.error);

  return data.translated;
}

// ----------------- Переклад тексту -----------------

translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  let src = fromLang.value;
  const tgt = toLang.value;

  if (!text) {
    statusText.textContent = "Enter text first.";
    return;
  }

  resultText.value = "";
  statusText.textContent = "Processing...";

  // Автовизначення мови
  if (src === "auto") {
    statusText.textContent = "Detecting language...";
    src = await detectLanguage(text);
    fromLang.value = src;
  }

  // Переклад
  try {
    statusText.textContent = "Translating...";
    const translated = await translate(text, src, tgt);

    resultText.value = translated;
    statusText.textContent = "Done.";

    addToHistory({
      fromLang: src,
      toLang: tgt,
      sourceText: text,
      translatedText: translated
    });

  } catch (err) {
    console.error(err);
    statusText.textContent = "Error while translating.";
  }
});

// ----------------- Історія -----------------

const HISTORY_KEY = "translator_history_text";

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function addToHistory(entry) {
  const items = loadHistory();
  items.unshift({
    id: Date.now(),
    ...entry
  });
  saveHistory(items);
  renderHistory();
}

function deleteFromHistory(id) {
  const items = loadHistory().filter(item => item.id !== id);
  saveHistory(items);
  renderHistory();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderHistory() {
  const items = loadHistory();
  historyList.innerHTML = "";

  if (!items.length) {
    historyEmpty.style.display = "block";
    return;
  }

  historyEmpty.style.display = "none";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <div class="history-langs">${LANG_NAMES[item.fromLang]} → ${LANG_NAMES[item.toLang]}</div>
      <div class="history-text"><strong>Source:</strong> ${escapeHtml(item.sourceText)}</div>
      <div class="history-text"><strong>Translation:</strong> ${escapeHtml(item.translatedText)}</div>
      <div class="history-actions">
        <button class="icon-btn" data-id="${item.id}">🗑</button>
      </div>
    `;

    div.querySelector(".icon-btn").addEventListener("click", () => {
      deleteFromHistory(item.id);
    });

    historyList.appendChild(div);
  });
}

renderHistory();

// ----------------- Очистити історію -----------------

const clearHistoryBtn = document.getElementById("clear-history");

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
}
