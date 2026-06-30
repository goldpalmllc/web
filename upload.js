// ===========================================================
// CONFIG — edit these three lines for your GitHub repo
// ===========================================================
const GH_OWNER  = "goldpalmllc";  // ← CHANGE THIS
const GH_REPO   = "web";        // ← CHANGE THIS (probably the repo name for goldpalmlandscape.llc)
const GH_BRANCH = "main";

// ===========================================================
const TOKEN_KEY = "goldpalm_gh_token";

const loginCard   = document.getElementById('loginCard');
const uploadCard  = document.getElementById('uploadCard');
const recentCard  = document.getElementById('recentCard');
const logoutCard  = document.getElementById('logoutCard');
const tokenInput  = document.getElementById('tokenInput');
const loginBtn    = document.getElementById('loginBtn');
const howToToken  = document.getElementById('howToToken');
const tokenHelp   = document.getElementById('tokenHelp');
const fileInput   = document.getElementById('fileInput');
const captionInput= document.getElementById('captionInput');
const uploadBtn   = document.getElementById('uploadBtn');
const uploadStatus= document.getElementById('uploadStatus');
const thumbPreview= document.getElementById('thumbPreview');
const recentList  = document.getElementById('recentList');
const logoutBtn   = document.getElementById('logoutBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

function getToken(){ return localStorage.getItem(TOKEN_KEY); }

function showLoggedIn(){
  loginCard.style.display = 'none';
  uploadCard.style.display = 'block';
  recentCard.style.display = 'block';
  logoutCard.style.display = 'block';
}

howToToken.addEventListener('click', () => {
  tokenHelp.style.display = tokenHelp.style.display === 'none' ? 'block' : 'none';
});

loginBtn.addEventListener('click', () => {
  const t = tokenInput.value.trim();
  if(!t){ alert('Paste your access token first.'); return; }
  localStorage.setItem(TOKEN_KEY, t);
  showLoggedIn();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
});

// Preview multiple files
fileInput.addEventListener('change', () => {
  thumbPreview.innerHTML = '';
  const files = fileInput.files;
  if (files.length === 0) return;

  thumbPreview.classList.add('multi');
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      thumbPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function ghRequest(path, options = {}){
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/${path}`, {
    ...options,
    headers: {
      'Authorization': `token ${getToken()}`,
      'Accept': 'application/vnd.github+json',
      ...(options.headers || {})
    }
  });
  return res;
}

function setStatus(msg, type){
  uploadStatus.textContent = msg;
  uploadStatus.className = `upload-status ${type || ''}`;
}

async function uploadPhoto(){
  const files = Array.from(fileInput.files);
  if(files.length === 0){ setStatus('Choose at least one photo first.', 'err'); return; }
  if(GH_OWNER === 'YOUR-GITHUB-USERNAME'){
    setStatus('Setup needed: edit GH_OWNER / GH_REPO at the top of upload.js first.', 'err');
    return;
  }

  uploadBtn.disabled = true;
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  setStatus(`Uploading ${files.length} photo(s)...`, 'busy');

  try{
    const commonCaption = captionInput.value.trim();
    let photosAdded = [];

    // Read current images.json once
    const listRes = await ghRequest(`contents/images.json?ref=${GH_BRANCH}`);
    let sha = undefined;
    let photos = [];
    if(listRes.ok){
      const data = await listRes.json();
      sha = data.sha;
      const decoded = decodeURIComponent(escape(atob(data.content)));
      photos = JSON.parse(decoded || '[]');
    }

    for(let i = 0; i < files.length; i++){
      const file = files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filename = `${Date.now()}-${i}-${safeName}`;
      const filePath = `images/${filename}`;
      const base64 = await fileToBase64(file);

      // Upload image
      const uploadRes = await ghRequest(`contents/${filePath}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Add gallery photo ${filename}`,
          content: base64,
          branch: GH_BRANCH
        })
      });

      if(!uploadRes.ok){
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(`Failed to upload ${file.name}: ${err.message || uploadRes.status}`);
      }

      photos.push({
        path: filePath,
        caption: commonCaption,
        uploaded: new Date().toISOString()
      });
      photosAdded.push({path: filePath, caption: commonCaption});

      // Update progress
      const progress = Math.round(((i + 1) / files.length) * 100);
      progressBar.style.width = `${progress}%`;
      setStatus(`Uploaded ${i+1}/${files.length}...`, 'busy');
    }

    // Final update to images.json
    setStatus('Updating gallery list...', 'busy');
    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(photos, null, 2))));

    const updateRes = await ghRequest(`contents/images.json`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Batch add ${files.length} photos to gallery`,
        content: newContent,
        branch: GH_BRANCH,
        sha: sha
      })
    });

    if(!updateRes.ok){
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.message || `Gallery update failed`);
    }

    setStatus(`Success! ${files.length} photo(s) uploaded. They will appear on the site soon.`, 'ok');

    // Clear form
    fileInput.value = '';
    captionInput.value = '';
    thumbPreview.innerHTML = '<span class="form-note">Photo previews will appear here</span>';
    thumbPreview.classList.remove('multi');

    // Add to recent
    photosAdded.forEach(p => addToRecentList(p.path, p.caption));

  }catch(err){
    setStatus(`Error: ${err.message}. Check token/repo settings.`, 'err');
  }finally{
    uploadBtn.disabled = false;
    progressContainer.style.display = 'none';
  }
}

function addToRecentList(path, caption){
  const item = document.createElement('div');
  item.className = 'photo-list-item';
  item.innerHTML = `<span>&#10003;</span><span>${caption || path.split('/').pop()}</span>`;
  recentList.prepend(item);
}

uploadBtn.addEventListener('click', uploadPhoto);

// Auto-login
if(getToken()){ showLoggedIn(); }
