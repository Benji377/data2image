import "./styles.css";
import { encode, decode, matchesMagic } from "@data2image/core";
import JSZip from "jszip";

// ── DOM Elements ──────────────────────────────────────────
const dropZone = document.getElementById("dropZone")!;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const fileList = document.getElementById("fileList")!;
const fileItems = document.getElementById("fileItems")!;
const clearBtn = document.getElementById("clearBtn")!;
const processBtn = document.getElementById("processBtn")!;
const results = document.getElementById("results")!;
const resultItems = document.getElementById("resultItems")!;
const downloadAllBtn = document.getElementById("downloadAllBtn")!;
const themeToggle = document.getElementById("themeToggle")!;

// ── State ─────────────────────────────────────────────────
interface QueuedFile {
  file: File;
  mode: "encode" | "decode";
}

interface ResultEntry {
  name: string;
  data: Uint8Array;
  previewUrl?: string;
}

let queue: QueuedFile[] = [];
let resultEntries: ResultEntry[] = [];

// ── Theme ─────────────────────────────────────────────────
function initTheme() {
  const stored = localStorage.getItem("d2i-theme");
  if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("d2i-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("d2i-theme", "dark");
  }
}

initTheme();
themeToggle.addEventListener("click", toggleTheme);

// ── Helpers ───────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isD2iPng(file: File): boolean {
  return file.name.endsWith(".d2i.png");
}

function download(name: string, data: Uint8Array) {
  const blob = new Blob([new Uint8Array(data)]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// ── Drop Zone ─────────────────────────────────────────────
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer?.files.length) {
    addFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files?.length) {
    addFiles(fileInput.files);
  }
  fileInput.value = "";
});

// ── File Queue ────────────────────────────────────────────
function addFiles(files: FileList) {
  for (const file of files) {
    queue.push({
      file,
      mode: isD2iPng(file) ? "decode" : "encode",
    });
  }
  renderFileList();
}

function renderFileList() {
  if (queue.length === 0) {
    fileList.hidden = true;
    return;
  }

  fileList.hidden = false;
  fileItems.innerHTML = "";

  for (const { file, mode } of queue) {
    const li = document.createElement("li");
    li.className = "file-item";
    li.innerHTML = `
      <span class="file-item-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
      <span class="file-item-size">${formatSize(file.size)}</span>
      <span class="file-item-badge ${mode === "encode" ? "badge-encode" : "badge-decode"}">${mode.toUpperCase()}</span>
    `;
    fileItems.appendChild(li);
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
}

clearBtn.addEventListener("click", () => {
  queue = [];
  renderFileList();
});

// ── Processing ────────────────────────────────────────────
processBtn.addEventListener("click", processAll);

async function processAll() {
  if (queue.length === 0) return;

  processBtn.setAttribute("disabled", "true");
  processBtn.textContent = "Processing…";
  resultEntries = [];
  resultItems.innerHTML = "";
  results.hidden = false;

  // Add a progress bar
  const progressLi = document.createElement("li");
  progressLi.className = "result-item";
  progressLi.innerHTML = `
    <div style="width:100%">
      <div class="progress-bar"><div class="progress-bar-fill" id="progressFill" style="width:0%"></div></div>
    </div>
  `;
  resultItems.appendChild(progressLi);
  const progressFill = document.getElementById("progressFill")!;

  const total = queue.length;
  for (let i = 0; i < total; i++) {
    const { file, mode } = queue[i];
    progressFill.style.width = `${((i / total) * 100).toFixed(0)}%`;

    try {
      const bytes = await readFileAsUint8Array(file);

      if (mode === "encode") {
        const pngBytes = encode(bytes, file.name);
        const outputName = `${file.name}.d2i.png`;
        const blob = new Blob([new Uint8Array(pngBytes)], { type: "image/png" });
        const previewUrl = URL.createObjectURL(blob);
        resultEntries.push({ name: outputName, data: pngBytes, previewUrl });
        addResultItem(outputName, pngBytes, previewUrl);
      } else {
        const { filename, data } = decode(bytes);
        resultEntries.push({ name: filename, data });
        addResultItem(filename, data);
      }
    } catch (err) {
      const errorName = mode === "encode" ? file.name : file.name;
      addResultError(errorName, err instanceof Error ? err.message : "Unknown error");
    }
  }

  progressFill.style.width = "100%";
  setTimeout(() => progressLi.remove(), 600);

  queue = [];
  renderFileList();
  processBtn.removeAttribute("disabled");
  processBtn.textContent = "Process All";
}

function addResultItem(name: string, data: Uint8Array, previewUrl?: string) {
  const li = document.createElement("li");
  li.className = "result-item";

  const info = document.createElement("div");
  info.className = "result-item-info";

  if (previewUrl) {
    const img = document.createElement("img");
    img.className = "result-item-preview";
    img.src = previewUrl;
    img.alt = "Encoded image preview";
    info.appendChild(img);
  }

  const nameSpan = document.createElement("span");
  nameSpan.className = "result-item-name";
  nameSpan.textContent = name;
  nameSpan.title = name;
  info.appendChild(nameSpan);

  li.appendChild(info);

  const dlBtn = document.createElement("button");
  dlBtn.className = "btn btn-sm btn-primary";
  dlBtn.textContent = "Download";
  dlBtn.addEventListener("click", () => download(name, data));
  li.appendChild(dlBtn);

  resultItems.appendChild(li);
}

function addResultError(name: string, message: string) {
  const li = document.createElement("li");
  li.className = "result-item";
  li.innerHTML = `
    <div class="result-item-info">
      <span class="result-item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
    </div>
    <span class="result-item-error" title="${escapeHtml(message)}">Error</span>
  `;
  resultItems.appendChild(li);
}

// ── Download All (ZIP) ────────────────────────────────────
downloadAllBtn.addEventListener("click", async () => {
  if (resultEntries.length === 0) return;

  downloadAllBtn.setAttribute("disabled", "true");
  downloadAllBtn.textContent = "Zipping…";

  const zip = new JSZip();
  for (const entry of resultEntries) {
    zip.file(entry.name, entry.data);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data2image-results.zip";
  a.click();
  URL.revokeObjectURL(url);

  downloadAllBtn.removeAttribute("disabled");
  downloadAllBtn.textContent = "Download All (ZIP)";
});
