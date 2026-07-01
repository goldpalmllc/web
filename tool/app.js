// ... (keep the top part the same) ...

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

    // Improved click handler
    canvas.onclick = (e) => handleCanvasClick(e, viewport);
    document.getElementById("clickHint").style.display = "block";
  } catch(e) {
    console.error(e);
    alert("Could not load PDF preview.");
  }
}

function handleCanvasClick(e, viewport) {
  const rect = canvas.getBoundingClientRect();
  
  // Get click position relative to canvas
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Convert to PDF coordinates (PDF y is bottom-up)
  const pdfX = clickX / scale;
  const pdfY = viewport.height / scale - (clickY / scale);

  const label = prompt("Enter field label (e.g. Client Name, Date, Total):", "New Field");
  if (!label) return;

  const newArea = {
    field: label.toLowerCase().replace(/\s+/g, ''),
    label: label,
    x: Math.round(pdfX),
    y: Math.round(pdfY),
    size: 12,
    page: 0
  };

  templates[currentTemplateKey].overlays.push(newArea);
  renderAreasList();

  alert(`✅ Text area placed at:\nX: ${newArea.x}   Y: ${newArea.y}\n\nYou can fine-tune below if needed.`);
}

// Rest of the file remains the same...
