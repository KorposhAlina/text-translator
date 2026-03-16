const docFromLang = document.getElementById("doc-from-lang");
const docToLang = document.getElementById("doc-to-lang");
const docSwapBtn = document.getElementById("doc-swap-langs");

const docFileInput = document.getElementById("doc-file");
const docFileName = document.getElementById("file-name");

const translateDocBtn = document.getElementById("translate-doc");
const docResult = document.getElementById("doc-result");
const docStatus = document.getElementById("doc-status");
const downloadBtn = document.getElementById("download-doc");

console.log("JS loaded");
console.log("Button:", translateDocBtn);

// ----------------- Заміна мов місцями -----------------
docSwapBtn.addEventListener("click", () => {
  if (docFromLang.value === "auto") return;
  const temp = docFromLang.value;
  docFromLang.value = docToLang.value;
  docToLang.value = temp;
});

// ----------------- Показ назви обраного файла -----------------
docFileInput.addEventListener("change", () => {
  if (docFileInput.files.length > 0) {
    docFileName.textContent = docFileInput.files[0].name;
  } else {
    docFileName.textContent = "No file selected";
  }
});

// ----------------- Завантаження перекладеного файлу -----------------
function downloadTranslated(text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "translated.txt";
  a.click();

  URL.revokeObjectURL(url);
}

// ----------------- Переклад файлу -----------------
translateDocBtn.addEventListener("click", async () => {
  console.log("CLICK WORKS");

  const file = docFileInput.files[0];

  if (!file) {
    docStatus.textContent = "Choose a file first.";
    return;
  }

  docStatus.textContent = "Uploading and translating...";
  docResult.value = "";
  downloadBtn.style.display = "none";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fromLang", docFromLang.value);
  formData.append("toLang", docToLang.value);

  try {
    const res = await fetch("http://127.0.0.1:8080/translate-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.error) {
      docStatus.textContent = data.error;
      return;
    }

    const translated = data.translated;

    docResult.value = translated;
    docStatus.textContent = "Done.";

    downloadBtn.style.display = "inline-block";
    downloadBtn.onclick = () => downloadTranslated(translated);

  } catch (err) {
    console.error(err);
    docStatus.textContent = "Error while translating.";
  }
});