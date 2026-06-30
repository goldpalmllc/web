# Gold Palm Lawn & Landscape — Website

A simple, static landing page for **Gold Palm Lawn & Landscape**, built to run on **GitHub Pages**. It includes a contact/quote form (via Formspree) and a phone-friendly photo gallery you can update yourself without touching code.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The main landing page |
| `style.css` | All styling |
| `admin.html` | The page you open on your phone to upload gallery photos |
| `upload.js` | The logic that sends a photo from your phone into your GitHub repo |
| `gallery.js` | Loads photos onto the homepage |
| `images.json` | The list of gallery photos (starts empty) |
| `images/` | Folder where uploaded photos are stored |

---

## 1. Put this on GitHub Pages

1. Create a new repository on GitHub (e.g. `goldpalm-site`). Keep it **Public** — GitHub Pages on the free plan requires a public repo (or GitHub Pro for private).
2. Upload all the files in this folder to that repository (drag-and-drop on github.com works fine, or use git).
3. In the repo, go to **Settings → Pages**, set **Branch** to `main` (or `master`) and **Save**.
4. After a minute, your site will be live at `https://YOUR-USERNAME.github.io/goldpalm-site/`.

## 2. Turn on the contact form (Formspree — free)

1. Go to **formspree.io** and create a free account.
2. Create a new form, and copy the **form ID** it gives you (looks like `abcdwxyz`).
3. In `index.html`, find this line:
   ```html
   <form class="quote-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST" id="quoteForm">
   ```
   Replace `YOUR_FORM_ID` with your real ID.
4. Submit the form once from your live site — Formspree will email you to confirm the form before it starts forwarding submissions.

## 3. Turn on phone photo uploads

The gallery uploader works by saving a photo directly into your GitHub repo when you tap "Upload" — no separate server or paid service needed.

1. Open `upload.js` and edit the top three lines:
   ```js
   const GH_OWNER  = "YOUR-GITHUB-USERNAME";
   const GH_REPO   = "YOUR-REPO-NAME";
   const GH_BRANCH = "main";
   ```
2. Create a GitHub **fine-grained personal access token**:
   - GitHub → your profile photo → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
   - Give it a name like "Gold Palm photo upload".
   - Under **Repository access**, choose **Only select repositories** and pick this one.
   - Under **Permissions → Repository permissions**, set **Contents** to **Read and write**.
   - Generate it and copy the token — GitHub only shows it once, so save it somewhere safe (like a notes app) in case you need it on a second phone.
3. On your phone, open `https://YOUR-USERNAME.github.io/goldpalm-site/admin.html`, paste the token in once, and tap **Save & Continue**. Your phone will remember it from then on — uploading a new photo is just: choose photo → (optional caption) → **Upload to Gallery**.
4. Bookmark `admin.html` to your phone's home screen so it feels like an app.

**Note on "login":** GitHub Pages is a static site with no server, so there's no real username/password system. This token-based approach is the simplest equivalent — it acts like a saved login that lets your phone (and only your phone, until you clear it) post photos straight to your gallery. Don't share the token with anyone, and you can revoke/regenerate it anytime from GitHub if needed.

## 4. Add your real logos and photos

- The Facebook icon in the footer is already linked to your page. For **Angie's List** and **Networx**, replace the `href="#"` placeholders in the footer of `index.html` with your real profile URLs.
- The "Crew photo" block in the About section is a placeholder — swap it for a real `<img>` tag once you have a photo you like, or just leave it and let the gallery carry the photos.
- The dashed gallery tiles ("Photo coming soon") automatically disappear and get replaced as you upload real photos.

## 5. Customize content

Open `index.html` in any text editor and update:
- Phone number, hours, and service area (pulled from your public listings — double check they're current)
- Service descriptions
- Testimonials (currently placeholders — swap in real customer quotes when you have them)
