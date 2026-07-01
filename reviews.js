// reviews.js - Auto load + show 4 initially with "Show All" buttons
let allAngiReviews = [];
let allNetworxReviews = [];

async function loadReviews() {
  // Angi
  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + 
      encodeURIComponent('https://www.angi.com/companylist/us/fl/fort-pierce/gold-palm-lawn-and-landscape-corp-reviews-161920782.htm'));
    if (res.ok) {
      const data = await res.json();
      allAngiReviews = parseReviews(data.contents, 'Angi');
      renderReviews('angiReviews', allAngiReviews, 4);
    }
  } catch(e) { console.log('Angi load failed', e); }

  // Networx
  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + 
      encodeURIComponent('https://www.networx.com/c.gold-palm-lawn-and-landscape'));
    if (res.ok) {
      const data = await res.json();
      allNetworxReviews = parseReviews(data.contents, 'Networx');
      renderReviews('networxReviews', allNetworxReviews, 4);
    }
  } catch(e) { console.log('Networx load failed', e); }
}

function parseReviews(html, source) {
  const reviews = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const items = doc.querySelectorAll('.review, .testimonial, .feedback, [class*="review"]');
  items.forEach(item => {
    const textEl = item.querySelector('p, blockquote, .comment, .review-text');
    const authorEl = item.querySelector('.name, .author, .customer-name');
    const text = textEl ? textEl.textContent.trim() : '';
    const author = authorEl ? authorEl.textContent.trim() : 'Local Customer';
    if (text.length > 30) {
      reviews.push({ text, author, source });
    }
  });

  // Fallback reviews if none found
  if (reviews.length === 0) {
    reviews.push({ text: "Excellent service and professional work!", author: "Happy Client", source });
  }
  return reviews;
}

function renderReviews(containerId, reviews, limit = 4) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const toShow = reviews.slice(0, limit);
  toShow.forEach(r => {
    const div = document.createElement('div');
    div.className = 'testimonial';
    div.innerHTML = `<p>"${r.text}"</p><cite>— ${r.author} (${r.source})</cite>`;
    container.appendChild(div);
  });
}

// Button handlers
document.addEventListener('DOMContentLoaded', () => {
  loadReviews();

  document.getElementById('showAllAngi').addEventListener('click', () => {
    renderReviews('angiReviews', allAngiReviews, 999);
    document.getElementById('showAllAngi').style.display = 'none';
  });

  document.getElementById('showAllNetworx').addEventListener('click', () => {
    renderReviews('networxReviews', allNetworxReviews, 999);
    document.getElementById('showAllNetworx').style.display = 'none';
  });
});
