import "./styles.css";
import { encode, decode } from "@data2image/core";
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
const modeAuto = document.getElementById("modeAuto")!;
const modeEncode = document.getElementById("modeEncode")!;
const modeDecode = document.getElementById("modeDecode")!;

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
let defaultMode: "auto" | "encode" | "decode" = "auto";

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

// ── Mode Selector ─────────────────────────────────────────
function setMode(mode: "auto" | "encode" | "decode") {
  defaultMode = mode;
  [modeAuto, modeEncode, modeDecode].forEach(btn => btn.classList.remove("mode-btn-active"));
  const activeBtn = mode === "auto" ? modeAuto : mode === "encode" ? modeEncode : modeDecode;
  activeBtn.classList.add("mode-btn-active");
}

modeAuto.addEventListener("click", () => setMode("auto"));
modeEncode.addEventListener("click", () => setMode("encode"));
modeDecode.addEventListener("click", () => setMode("decode"));

// ── Helpers ───────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "Unknown error";
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
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
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
    let mode: "encode" | "decode";
    if (defaultMode === "auto") {
      mode = isD2iPng(file) ? "decode" : "encode";
    } else {
      mode = defaultMode;
    }
    queue.push({ file, mode });
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

  queue.forEach((queuedFile, index) => {
    const { file, mode } = queuedFile;
    const li = document.createElement("li");
    li.className = "file-item";
    
    const leftGroup = document.createElement("div");
    leftGroup.className = "file-item-left";
    
    const nameSpan = document.createElement("span");
    nameSpan.className = "file-item-name";
    nameSpan.title = file.name;
    nameSpan.textContent = file.name;
    
    const sizeSpan = document.createElement("span");
    sizeSpan.className = "file-item-size";
    sizeSpan.textContent = formatSize(file.size);
    
    leftGroup.appendChild(nameSpan);
    leftGroup.appendChild(sizeSpan);
    
    const rightGroup = document.createElement("div");
    rightGroup.className = "file-item-right";
    
    const badge = document.createElement("button");
    badge.className = `file-item-badge ${mode === "encode" ? "badge-encode" : "badge-decode"}`;
    badge.textContent = mode.toUpperCase();
    badge.title = "Click to toggle mode";
    badge.addEventListener("click", () => {
      queue[index].mode = mode === "encode" ? "decode" : "encode";
      renderFileList();
    });
    
    const processBtn = document.createElement("button");
    processBtn.className = "file-item-process";
    processBtn.title = `Process this file (${mode})`;
    processBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    processBtn.addEventListener("click", () => {
      void processSingle(index);
    });
    
    rightGroup.appendChild(badge);
    rightGroup.appendChild(processBtn);
    
    li.appendChild(leftGroup);
    li.appendChild(rightGroup);
    fileItems.appendChild(li);
  });
}

clearBtn.addEventListener("click", () => {
  queue = [];
  renderFileList();
});

// ── Processing ────────────────────────────────────────────
processBtn.addEventListener("click", () => {
  void processAll();
});

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
      addResultError(errorName, getErrorMessage(err));
    }
  }

  progressFill.style.width = "100%";
  setTimeout(() => progressLi.remove(), 600);

  queue = [];
  renderFileList();
  processBtn.removeAttribute("disabled");
  processBtn.textContent = "Process All";
}

async function processSingle(index: number) {
  if (index < 0 || index >= queue.length) return;

  const { file, mode } = queue[index];
  results.hidden = false;

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

    // Remove processed file from queue
    queue.splice(index, 1);
    renderFileList();
  } catch (err) {
    addResultError(file.name, getErrorMessage(err));
  }
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
  li.className = "result-item result-item-error-container";
  
  const mainRow = document.createElement("div");
  mainRow.className = "result-item-error-row";
  
  const info = document.createElement("div");
  info.className = "result-item-info";
  
  const nameSpan = document.createElement("span");
  nameSpan.className = "result-item-name";
  nameSpan.title = name;
  nameSpan.textContent = name;
  info.appendChild(nameSpan);
  
  const errorBtn = document.createElement("button");
  errorBtn.className = "result-item-error";
  errorBtn.innerHTML = `
    <span>Error</span>
    <svg class="error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;
  errorBtn.title = "Click to show error details";
  
  mainRow.appendChild(info);
  mainRow.appendChild(errorBtn);
  
  const detailsDiv = document.createElement("div");
  detailsDiv.className = "result-item-error-details";
  detailsDiv.style.display = "none";
  
  const detailsContent = document.createElement("div");
  detailsContent.className = "result-item-error-content";
  detailsContent.textContent = message;
  detailsDiv.appendChild(detailsContent);
  
  let isExpanded = false;
  errorBtn.addEventListener("click", () => {
    isExpanded = !isExpanded;
    detailsDiv.style.display = isExpanded ? "block" : "none";
    errorBtn.classList.toggle("expanded", isExpanded);
  });
  
  li.appendChild(mainRow);
  li.appendChild(detailsDiv);
  resultItems.appendChild(li);
}

// ── Download All (ZIP) ────────────────────────────────────
downloadAllBtn.addEventListener("click", () => {
  void (async () => {
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
  })();
});
