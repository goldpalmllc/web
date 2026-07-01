let templates = {};
let currentTemplateKey = null;
let pdfDocPreview = null;
let scale = 1.8;
let currentTextValues = {}; // Store live text for preview

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

async function init() {
  const saved = localStorage.getItem("pdfTemplates");
  if (saved) templates = JSON.parse(saved);
  else {
    templates = {
      "invoice": { name: "Invoice", file: "pdf/invoice.pdf", emailTo: "billing@yourcompany.com", subjectPrefix: "Invoice", overlays: [] }
    };
  }
  renderTemplateList();
  if (Object.keys(templates).length) loadTemplate(Object.keys(templates)[0]);
}

function renderTemplateList() {
  const select = document.getElementById("templateSelect");
  select.innerHTML = "";
  Object.keys(templates).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = templates[key].name;
    select.appendChild(opt);
  });
}

async function loadTemplate(key) {
  currentTemplateKey = key;
  currentTextValues = {};
  document.getElementById("templateName").textContent = templates[key].name;
  renderAreasList();
  await renderPDFPreview(templates[key].file);
}

function renderAreasList() {
  const list = document.getElementById("areasList");
  list.innerHTML = "";
  const overlays = templates[currentTemplateKey].overlays;

  overlays.forEach((area, i) => {
    const textId = `text_${i}`;
    const div = document.createElement("div");
    div.className = "area-item";
    div.innerHTML = `
      <strong>${area.label}</strong><br>
      X: <input type="number" value="${area.x}" style="width:70px" onchange="updateArea(${i}, 'x', parseFloat(this.value))">
      Y: <input type="number" value="${area.y}" style="width:70px" onchange="updateArea(${i}, 'y', parseFloat(this.value))">
      Size: <input type="number" value="${area.size}" style="width:60px" onchange="updateArea(${i}, 'size', parseInt(this.value))">
      <br>
      <input type="text" id="${textId}" placeholder="Enter ${area.label}" 
             style="width:280px" oninput="updateLiveText(${i}, this.value)">
      <button onclick="deleteArea(${i})" style="color:red">Delete</button>
    `;
    list.appendChild(div);
  });
}

async function renderPDFPreview(pdfPath) {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    pdfDocPreview = await loadingTask.promise;
    const page = await pdfDocPreview.getPage(1);
    const viewport = page.getViewport({ scale: scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    canvas.onclick = (e) => handleCanvasClick(e, viewport);
  } catch(e) {
    console.error(e);
  }
}

function handleCanvasClick(e, viewport) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const pdfX = Math.round(clickX / scale);
  const pdfY = Math.round((canvas.height / scale) - (clickY / scale));

  const label = prompt("Field label:", "New Field");
  if (!label) return;

  templates[currentTemplateKey].overlays.push({
    field: label.toLowerCase().replace(/\s+/g, ''),
    label: label,
    x: pdfX,
    y: pdfY,
    size: 12,
    page: 0
  });

  renderAreasList();
}

function updateArea(index, key, value) {
  templates[currentTemplateKey].overlays[index][key] = value;
  redrawPreview();
}

function updateLiveText(index, value) {
  currentTextValues[index] = value;
  redrawPreview();
}

async function redrawPreview() {
  if (!pdfDocPreview) return;
  const page = await pdfDocPreview.getPage(1);
  const viewport = page.getViewport({ scale });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Draw live text overlays
  const overlays = templates[currentTemplateKey].overlays;
  ctx.font = "bold 12px Helvetica";
  ctx.fillStyle = "red";

  overlays.forEach((area, i) => {
    const text = currentTextValues[i] || "";
    if (text) {
      ctx.font = `${area.size || 12}px Helvetica`;
      ctx.fillStyle = "#000000";
      ctx.fillText(text, area.x * scale, (canvas.height - area.y * scale));
    }
  });
}

async function previewPDF() { /* same modal preview as before */ 
  // (Use the previewPDF function from previous response)
}

async function generatePDF() { /* same as before */ }
function sendToOutlook() { /* same */ }
function addNewTemplate() { /* same */ }
function saveTemplates() { /* same */ }

window.onload = init;
