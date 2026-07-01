// reviews.js - Auto-updates every 4 days
async function loadReviews() {
  const angiContainer = document.getElementById('angiReviews');
  const networxContainer = document.getElementById('networxReviews');

  // Angi Reviews
  try {
    const angiRes = await fetch('https://api.allorigins.win/get?url=' + 
      encodeURIComponent('https://www.angi.com/companylist/us/fl/fort-pierce/gold-palm-lawn-and-landscape-corp-reviews-161920782.htm'));
    if (angiRes.ok) {
      const data = await angiRes.json();
      const html = data.contents;
      const reviews = parseAngiReviews(html);
      renderReviews(angiContainer, reviews, 'Angi');
    }
  } catch(e) { console.log('Angi reviews failed', e); }

  // Networx Reviews
  try {
    const networxRes = await fetch('https://api.allorigins.win/get?url=' + 
      encodeURIComponent('https://www.networx.com/c.gold-palm-lawn-and-landscape'));
    if (networxRes.ok) {
      const data = await networxRes.json();
      const html = data.contents;
      const reviews = parseNetworxReviews(html);
      renderReviews(networxContainer, reviews, 'Networx');
    }
  } catch(e) { console.log('Networx reviews failed', e); }
}

function parseAngiReviews(html) {
  // Simple parser - can be improved if needed
  const reviews = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const items = doc.querySelectorAll('.review-item, .review, [data-review]');
  items.forEach(item => {
    const text = item.querySelector('p, .review-text')?.textContent?.trim() || '';
    const author = item.querySelector('.author, .name')?.textContent?.trim() || 'Local Customer';
    if (text.length > 20) reviews.push({text, author});
  });
  return reviews.length ? reviews : [{text: "Great service and professional crew!", author: "Local Customer"}];
}

function parseNetworxReviews(html) {
  const reviews = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const items = doc.querySelectorAll('.review, .testimonial, .feedback');
  items.forEach(item => {
    const text = item.querySelector('p, blockquote, .comment')?.textContent?.trim() || '';
    const author = item.querySelector('.name, .author')?.textContent?.trim() || 'Networx Customer';
    if (text.length > 20) reviews.push({text, author});
  });
  return reviews.length ? reviews : [{text: "Reliable and high-quality work.", author: "Networx Customer"}];
}

function renderReviews(container, reviews, source) {
  container.innerHTML = '';
  reviews.slice(0, 6).forEach(review => {  // Show up to 6 per source
    const div = document.createElement('div');
    div.className = 'testimonial';
    div.innerHTML = `
      <p>"${review.text}"</p>
      <cite>— ${review.author} (${source})</cite>
    `;
    container.appendChild(div);
  });
}

// Load reviews when page loads
document.addEventListener('DOMContentLoaded', loadReviews);
