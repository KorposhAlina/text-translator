const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const fs = require("fs");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------- Статичні файли ----------------
app.use(express.static(__dirname));

// ---------------- Функція очистки перекладу ----------------
function cleanTranslation(chunks, originalText) {
  let text = chunks.join("").trim();

  text = text.replace(/\s+([.,!?…])/g, "$1");

  text = text.replace(/([.!?…])\s*([a-zа-яіїєґ])/giu, (m, p1, p2) => {
    return p1 + " " + p2.toUpperCase();
  });

  text = text.replace(/^[a-zа-яіїєґ]/iu, m => m.toUpperCase());

  const originalPunctuation = originalText.match(/[.!?…]/g) || [];
  const translatedPunctuation = text.match(/[.!?…]/g) || [];

  if (originalPunctuation.length > translatedPunctuation.length) {
    const missing = originalPunctuation.slice(translatedPunctuation.length).join("");
    text = text.trim() + missing;
  }

  return text;
}
// ---------------- GOOGLE TRANSLATE ----------------
function splitIntoSentences(text) {
  return text.match(/[^.!?]+[.!?]?/g) || [];
}

async function translateText(text, source, target) {
  const parts = text.match(/([^.!?…]+)([.!?…])?/g) || [];

  const translatedParts = [];

  for (const part of parts) {
    const sentence = part.trim();

    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx` +
      `&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(sentence)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data[0]) {
      translatedParts.push(sentence);
      continue;
    }

    const chunks = data[0].map(item => item[0]);

    const cleaned = cleanTranslation(chunks, sentence);

    translatedParts.push(cleaned);
  }

  return translatedParts.join(" ");
}

// ---------------- Переклад тексту ----------------
app.post("/translate-text", async (req, res) => {
  const { text, fromLang, toLang } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Empty text" });
  }

  try {
    const translated = await translateText(text, fromLang, toLang);
    res.json({ translated });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

// ---------------- Переклад файлу ----------------
app.post("/translate-file", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { fromLang, toLang } = req.body;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    let text = "";

    if (file.mimetype === "text/plain") {
      text = fs.readFileSync(file.path, "utf8");
    } else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    if (!text.trim()) {
      return res.status(400).json({ error: "File content is empty" });
    }

    const translated = await translateText(text, fromLang, toLang);

    fs.unlinkSync(file.path);

    res.json({ translated });
  } catch (err) {
    console.error("File translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

// ---------------- Маршрут для головної сторінки ----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------- Запуск сервера ----------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
