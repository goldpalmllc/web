// ===========================================================
// CONFIG — edit these three lines for your GitHub repo, then
// you're done. See README.md for full setup steps.
// ===========================================================
const GH_OWNER  = "YOUR-GITHUB-USERNAME";
const GH_REPO   = "YOUR-REPO-NAME";
const GH_BRANCH = "main"; // change to "master" if that's your default branch

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

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    thumbPreview.innerHTML = `<img src="${e.target.result}" alt="Selected photo preview">`;
  };
  reader.readAsDataURL(file);
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
  const file = fileInput.files[0];
  if(!file){ setStatus('Choose a photo first.', 'err'); return; }
  if(GH_OWNER === 'YOUR-GITHUB-USERNAME'){
    setStatus('Setup needed: edit GH_OWNER / GH_REPO at the top of upload.js first. See README.md.', 'err');
    return;
  }

  uploadBtn.disabled = true;
  setStatus('Uploading photo...', 'busy');

  try{
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filePath = `images/${filename}`;
    const base64 = await fileToBase64(file);

    // 1. Upload the image file itself
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
      throw new Error(err.message || `Upload failed (${uploadRes.status})`);
    }

    setStatus('Updating gallery list...', 'busy');

    // 2. Read current images.json (need its sha to update it)
    const listRes = await ghRequest(`contents/images.json?ref=${GH_BRANCH}`);
    let sha = undefined;
    let photos = [];
    if(listRes.ok){
      const data = await listRes.json();
      sha = data.sha;
      const decoded = decodeURIComponent(escape(atob(data.content)));
      photos = JSON.parse(decoded || '[]');
    }

    photos.push({
      path: filePath,
      caption: captionInput.value.trim(),
      uploaded: new Date().toISOString()
    });

    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(photos, null, 2))));

    const updateRes = await ghRequest(`contents/images.json`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Add ${filename} to gallery`,
        content: newContent,
        branch: GH_BRANCH,
        sha
      })
    });
    if(!updateRes.ok){
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.message || `Gallery update failed (${updateRes.status})`);
    }

    setStatus('Uploaded! It will appear on the site in a minute or two.', 'ok');
    fileInput.value = '';
    captionInput.value = '';
    thumbPreview.innerHTML = '<span class="form-note">Photo preview</span>';
    addToRecentList(filePath, photos[photos.length - 1].caption);

  }catch(err){
    setStatus(`Error: ${err.message}. Check your token and repo settings.`, 'err');
  }finally{
    uploadBtn.disabled = false;
  }
}

function addToRecentList(path, caption){
  const item = document.createElement('div');
  item.className = 'photo-list-item';
  item.innerHTML = `<span>&#10003;</span><span>${caption || path.split('/').pop()}</span>`;
  recentList.prepend(item);
}

uploadBtn.addEventListener('click', uploadPhoto);

// auto-login if token already saved on this phone
if(getToken()){ showLoggedIn(); }
