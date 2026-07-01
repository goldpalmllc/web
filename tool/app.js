let templates = {};
let currentTemplateKey = null;
let currentPageNum = 0;
let pdfDocPreview = null;
let scale = 1.5;

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
      <strong>${area.label}</strong> (x:${Math.round(area.x)}, y:${Math.round(area.y)})
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

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    await page.render(renderContext).promise;

    canvas.onclick = handleCanvasClick;
    document.getElementById("clickHint").style.display = "block";
  } catch(e) {
    console.error(e);
    alert("Could not load PDF preview. Make sure the file exists in /pdf/ folder.");
  }
}

function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  const x = clickX / scale;
  const y = (canvas.height / scale) - (clickY / scale); // PDF y from bottom

  const label = prompt("Enter field label (e.g. Client Name):", "New Field");
  if (!label) return;

  templates[currentTemplateKey].overlays.push({
    field: label.toLowerCase().replace(/\s+/g, ''),
    label: label,
    x: Math.round(x),
    y: Math.round(y),
    size: 12,
    page: 0
  });

  renderAreasList();
  alert(`Area added at approx x:${Math.round(x)}, y:${Math.round(y)}`);
}

function updateArea(index, key, value) {
  templates[currentTemplateKey].overlays[index][key] = value;
}

function deleteArea(index) {
  if (confirm("Delete this text area?")) {
    templates[currentTemplateKey].overlays.splice(index, 1);
    renderAreasList();
  }
}

async function generatePDF() {
  const t = templates[currentTemplateKey];
  if (!t) return alert("No template selected");

  try {
    const existingPdfBytes = await fetch(t.file).then(r => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    for (let overlay of t.overlays) {
      const text = prompt(`Enter value for "${overlay.label}":`, "") || "";
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

    alert("PDF generated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error generating PDF. Check console (F12).");
  }
}

function sendToOutlook() {
  const t = templates[currentTemplateKey];
  if (!t) return;
  const subject = `${t.subjectPrefix} - ${new Date().toISOString().slice(0,10)}`;
  window.location.href = `mailto:${t.emailTo}?subject=${encodeURIComponent(subject)}`;
  alert("Outlook opened — attach the downloaded PDF.");
}

function addNewTemplate() {
  const key = prompt("Short key (e.g. proposal):");
  if (!key) return;
  const name = prompt("Template name:");
  const file = prompt("PDF path (e.g. pdf/proposal.pdf):", `pdf/${key}.pdf`);
  const email = prompt("Default email address:", "example@company.com");

  templates[key] = { 
    name, 
    file, 
    emailTo: email, 
    subjectPrefix: name, 
    overlays: [] 
  };
  renderTemplateList();
  loadTemplate(key);
}

function saveTemplates() {
  localStorage.setItem("pdfTemplates", JSON.stringify(templates));
  alert("✅ Templates saved to browser storage!");
}

window.onload = init;