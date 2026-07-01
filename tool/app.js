let templates = {};
let currentTemplateKey = null;
let pdfDocPreview = null;
let scale = 1.8;
let currentTextValues = {};

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

async function init() {
  const saved = localStorage.getItem("pdfTemplates");
  if (saved) templates = JSON.parse(saved);
  else {
    templates = {
      "invoice": {
        name: "Invoice",
        file: "pdf/invoice.pdf",
        emailTo: "billing@yourcompany.com",
        subjectPrefix: "Invoice",
        overlays: []
      }
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
    const div = document.createElement("div");
    div.className = "area-item";
    div.innerHTML = `
      <strong>${area.label}</strong><br>
      X: <input type="number" value="${area.x}" style="width:70px" onchange="updateArea(${i}, 'x', parseFloat(this.value))">
      Y: <input type="number" value="${area.y}" style="width:70px" onchange="updateArea(${i}, 'y', parseFloat(this.value))">
      Size: <input type="number" value="${area.size}" style="width:60px" onchange="updateArea(${i}, 'size', parseInt(this.value))">
      <br>
      <input type="text" placeholder="Enter ${area.label}" style="width:280px" oninput="updateLiveText(${i}, this.value)">
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
    alert("Could not load PDF. Check file path.");
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

  const overlays = templates[currentTemplateKey].overlays;
  overlays.forEach((area, i) => {
    const text = currentTextValues[i] || "";
    if (text) {
      ctx.font = `${area.size || 12}px Helvetica`;
      ctx.fillStyle = "#000000";
      ctx.fillText(text, area.x * scale, canvas.height - area.y * scale);
    }
  });
}

// Preview Modal
async function previewPDF() {
  const t = templates[currentTemplateKey];
  if (!t) return alert("Select a template");

  try {
    const existingPdfBytes = await fetch(t.file).then(r => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    t.overlays.forEach((overlay, i) => {
      const text = currentTextValues[i] || "";
      if (text) {
        const page = pages[overlay.page] || pages[0];
        page.drawText(text, {
          x: overlay.x,
          y: overlay.y,
          size: overlay.size || 12,
          font: helvetica,
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    let modal = document.getElementById("previewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "previewModal";
      modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div style="background:white;width:90%;max-width:1000px;height:90%;border-radius:8px;overflow:hidden;position:relative;">
        <button onclick="document.getElementById('previewModal').remove()" style="position:absolute;top:10px;right:10px;z-index:10;padding:8px 16px;">Close</button>
        <iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>
      </div>
    `;
  } catch (err) {
    console.error(err);
    alert("Preview error - check console");
  }
}

async function generatePDF() {
  const t = templates[currentTemplateKey];
  if (!t) return alert("Select a template");

  try {
    const existingPdfBytes = await fetch(t.file).then(r => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    t.overlays.forEach((overlay, i) => {
      const text = currentTextValues[i] || "";
      if (text) {
        const page = pages[overlay.page] || pages[0];
        page.drawText(text, { x: overlay.x, y: overlay.y, size: overlay.size || 12, font: helvetica });
      }
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Generate failed");
  }
}

function sendToOutlook() {
  const t = templates[currentTemplateKey];
  if (!t) return;
  const subject = `${t.subjectPrefix} - ${new Date().toISOString().slice(0,10)}`;
  window.location.href = `mailto:${t.emailTo}?subject=${encodeURIComponent(subject)}`;
}

function addNewTemplate() {
  const key = prompt("Short key (e.g. proposal):");
  if (!key) return;
  const name = prompt("Template name:");
  const file = prompt("PDF path:", `pdf/${key}.pdf`);
  const email = prompt("Default email:", "example@company.com");

  templates[key] = { name, file, emailTo: email, subjectPrefix: name, overlays: [] };
  renderTemplateList();
  loadTemplate(key);
}

function saveTemplates() {
  localStorage.setItem("pdfTemplates", JSON.stringify(templates));
  alert("Saved!");
}

function deleteArea(index) {
  if (confirm("Delete this area?")) {
    templates[currentTemplateKey].overlays.splice(index, 1);
    renderAreasList();
    redrawPreview();
  }
}

window.onload = init;
