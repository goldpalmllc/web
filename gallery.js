// Renders the photo gallery on index.html from images.json.
// admin.html adds new entries to images.json each time a photo is uploaded.

const GALLERY_SLOTS = 8; // how many tiles to show (real photos + placeholders)

async function loadGallery(){
  const grid = document.getElementById('galleryGrid');
  let photos = [];

  try{
    const res = await fetch('images.json', { cache: 'no-store' });
    if(res.ok) photos = await res.json();
  }catch(err){
    // images.json missing or unreachable — just show placeholders
  }

  grid.innerHTML = '';

  // newest first
  photos = (photos || []).slice().reverse();

  photos.forEach(photo => {
    const tile = document.createElement('div');
    tile.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = photo.path;
    img.alt = photo.caption || 'Gold Palm Lawn & Landscape job photo';
    img.loading = 'lazy';
    tile.appendChild(img);
    grid.appendChild(tile);
  });

  const remaining = Math.max(0, GALLERY_SLOTS - photos.length);
  for(let i = 0; i < remaining; i++){
    const tile = document.createElement('div');
    tile.className = 'gallery-item';
    tile.innerHTML = `
      <div class="gallery-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 16-5-5-4 4-3-3-6 6"/></svg>
        Photo coming soon
      </div>`;
    grid.appendChild(tile);
  }

  if(photos.length === 0){
    const note = document.createElement('p');
    note.className = 'gallery-empty';
    note.style.gridColumn = '1 / -1';
    note.textContent = "No photos uploaded yet — tap \"Upload Photos\" above to add the first one from your phone.";
    grid.parentElement.insertBefore(note, grid);
  }
}

loadGallery();
