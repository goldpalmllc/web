let templates = {};
let currentTemplateKey = null;
let pdfDocPreview = null;
let scale = 1.8;

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

async function init() { /* same as before */ 
  // ... (keep init, renderTemplateList, addNewTemplate, saveTemplates unchanged)
}

async function loadTemplate(key) {
  currentTemplateKey = key;
  const t = templates[key];
  document.getElementById("templateName").textContent = t.name;
  renderAreasList();
  await renderPDFPreview(t.file);
}

function renderAreasList() {
  const list = document.getElementById("areasList");
  list.innerHTML = "";
  const overlays = templates[currentTemplateKey].overlays;

  overlays.forEach((area, i) => {
    const div = document.createElement("div");
    div.className = "area-item";
    div.innerHTML = `
      <strong>${area.label}</strong><br>
      <label>X: </label><input type="number" value="${area.x}" style="width:80px" onchange="updateArea(${i}, 'x', parseFloat(this.value))">
      <label>Y: </label><input type="number" value="${area.y}" style="width:80px" onchange="updateArea(${i}, 'y', parseFloat(this.value))">
      <label>Size: </label><input type="number" value="${area.size}" style="width:60px" onchange="updateArea(${i}, 'size', parseInt(this.value))">
      <input type="text" value="${area.label}" style="width:160px" onchange="updateArea(${i}, 'label', this.value)">
      <button onclick="deleteArea(${i})" style="color:red">Delete</button>
    `;
    list.appendChild(div);
  });
}

// Improved click handler
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const pdfX = Math.round(clickX / scale);
  const pdfY = Math.round((canvas.height / scale) - (clickY / scale));

  const label = prompt("Field label (e.g. Client Name):", "New Field");
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
  alert(`Placed at X:${pdfX}  Y:${pdfY}\n\nYou can fine-tune the numbers below.`);
}

function updateArea(index, key, value) {
  templates[currentTemplateKey].overlays[index][key] = value;
}

function deleteArea(index) {
  if (confirm("Delete?")) {
    templates[currentTemplateKey].overlays.splice(index, 1);
    renderAreasList();
  }
}

// Preview and Generate functions remain the same as last version
async function previewPDF() { /* same as previous message */ }
async function generatePDF() { /* same as previous */ }
function sendToOutlook() { /* same */ }
function addNewTemplate() { /* same */ }
function saveTemplates() { /* same */ }

window.onload = init;
