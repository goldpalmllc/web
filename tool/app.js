let templates = {};
let currentTemplateKey = null;
let currentPageNum = 0;
let pdfDocPreview = null;
let scale = 1.8;   // Increased for better accuracy

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
      <strong>${area.label}</strong> (x:${area.x}, y:${area.y})
      <br>
      <input type="text" value="${area.label}" onchange="updateArea(${i}, 'label', this.value)" style="width:45%">
      <input type="number" value="${area.size}" style="width:20%" onchange="updateArea(${i}, 'size', parseInt(this.value))">
      <button onclick="deleteArea(${i})" style="color:red; float:right">Delete</button>
    `;
    list.appendChild(div);
  });
}

async function renderPDFPreview(pdfPath) {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    pdfDocPreview = await loadingTask.promise;
    const page = await pdfDocPreview.getPage(1);
    const viewport = page.getViewport({ scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: ctx, viewport }).promise;
    canvas.onclick = (e) => handleCanvasClick(e, viewport);
  } catch(e) {
    console.error(e);
  }
}

function handleCanvasClick(e, viewport) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const pdfX = clickX / scale;
  const pdfY = (viewport.height / scale) - (clickY / scale);

  const label = prompt("Enter field label:", "New Field");
  if (!label) return;

  templates[currentTemplateKey].overlays.push({
    field: label.toLowerCase().replace(/\s+/g, ''),
    label: label,
    x: Math.round(pdfX),
    y: Math.round(pdfY),
    size: 12,
    page: 0
  });

  renderAreasList();
}

function updateArea(index, key, value) {
  templates[currentTemplateKey].overlays[index][key] = value;
}

function deleteArea(index) {
  if (confirm("Delete this area?")) {
    templates[currentTemplateKey].overlays.splice(index, 1);
    renderAreasList();
  }
}

// NEW: Preview function
async function previewPDF() {
  const t = templates[currentTemplateKey];
  if (!t) return alert("No template selected");

  try {
    const existingPdfBytes = await fetch(t.file).then(r => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    for (let overlay of t.overlays) {
      const text = prompt(`Value for "${overlay.label}":`, "") || "";
      if (text) {
        const page = pages[overlay.page] || pages[0];
        page.drawText(text, {
          x: overlay.x,
          y: overlay.y,
          size: overlay.size || 12,
          font: helvetica,
          color: PDFLib.rgb(0, 0, 0),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Show in modal
    showPreviewModal(url);
  } catch (err) {
    console.error(err);
    alert("Preview failed. Check console.");
  }
}

function showPreviewModal(pdfUrl) {
  let modal = document.getElementById("previewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "previewModal";
    modal.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%; 
      background:rgba(0,0,0,0.8); z-index:1000; display:flex;
      align-items:center; justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:white; width:90%; max-width:900px; height:90%; border-radius:8px; overflow:hidden; position:relative;">
        <button onclick="this.parentElement.parentElement.remove()" style="position:absolute; top:10px; right:10px; z-index:10;">Close</button>
        <iframe src="${pdfUrl}" style="width:100%; height:100%; border:none;"></iframe>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector("iframe").src = pdfUrl;
  }
}

// Generate & Download
async function generatePDF() {
  const t = templates[currentTemplateKey];
  if (!t) return alert("No template selected");

  try {
    const existingPdfBytes = await fetch(t.file).then(r => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    for (let overlay of t.overlays) {
      const text = prompt(`Value for "${overlay.label}":`, "") || "";
      if (text) {
        const page = pages[overlay.page] || pages[0];
        page.drawText(text, {
          x: overlay.x,
          y: overlay.y,
          size: overlay.size || 12,
          font: helvetica,
          color: PDFLib.rgb(0, 0, 0),
        });
      }
    }

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
    alert("Error generating PDF.");
  }
}

function sendToOutlook() {
  const t = templates[currentTemplateKey];
  if (!t) return;
  const subject = `${t.subjectPrefix} - ${new Date().toISOString().slice(0,10)}`;
  window.location.href = `mailto:${t.emailTo}?subject=${encodeURIComponent(subject)}`;
}

// ... (keep addNewTemplate and saveTemplates the same)

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
  alert("Templates saved!");
}

window.onload = init;
