// Renders "What customers say" from reviews.json (kept fresh weekly by
// .github/workflows/update-reviews.yml, which runs scripts/update_reviews.py).

function starString(rating){
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function timeAgoLabel(updatedIso){
  if(!updatedIso) return '';
  const updated = new Date(updatedIso);
  if(isNaN(updated)) return '';
  const days = Math.floor((Date.now() - updated.getTime()) / 86400000);
  if(days <= 0) return 'Updated today';
  if(days === 1) return 'Updated yesterday';
  if(days < 14) return `Updated ${days} days ago`;
  return `Updated ${updated.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

function reviewDateLabel(dateStr){
  const [year, month] = (dateStr || '').split('-');
  if(!year) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = parseInt(month, 10) - 1;
  return months[idx] ? `${months[idx]} ${year}` : year;
}

async function loadReviews(){
  const row = document.getElementById('testimonialRow');
  const summaryEl = document.getElementById('reviewsSummary');
  const updatedEl = document.getElementById('reviewsUpdated');
  const modalSummaryNote = document.getElementById('modalSummaryNote');
  const reviewList = document.getElementById('reviewList');

  let data;
  try{
    const res = await fetch('reviews.json', { cache: 'no-store' });
    if(!res.ok) throw new Error('reviews.json not found');
    data = await res.json();
  }catch(err){
    row.innerHTML = '<p class="testimonial-loading">Reviews are temporarily unavailable. Please check back soon.</p>';
    return;
  }

  const reviews = (data.reviews || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const summary = data.summary || {};

  // --- summary badge ---
  if(summary.rating){
    summaryEl.innerHTML = `
      <span class="score">${summary.rating.toFixed(1)}</span>
      <span>
        <span class="stars">${starString(summary.rating)}</span>
        <span class="count">${summary.count || reviews.length} reviews on
          <a href="${data.source_url || '#'}" target="_blank" rel="noopener">Angi</a>
        </span>
      </span>`;
  } else {
    summaryEl.innerHTML = `<span class="count">${reviews.length} reviews on <a href="${data.source_url || '#'}" target="_blank" rel="noopener">Angi</a></span>`;
  }
  updatedEl.textContent = timeAgoLabel(data.updated);

  // --- top 3 testimonials: prefer recent reviews that have written text ---
  const withText = reviews.filter(r => r.text && r.text.trim().length > 0);
  const featured = (withText.length >= 3 ? withText : reviews).slice(0, 3);

  row.innerHTML = '';
  featured.forEach(r => {
    const card = document.createElement('div');
    card.className = 'testimonial';
    const badge = r.recommend === false ? '<span class="neg-badge">Low rating</span>' : '';
    const text = r.text && r.text.trim() ? r.text.trim() : 'No written comment left with this rating.';
    card.innerHTML = `
      ${badge}
      <span class="stars" aria-hidden="true">${starString(r.rating)}</span>
      <p>${text}</p>
      <cite>— ${r.name}, ${reviewDateLabel(r.date)}</cite>`;
    row.appendChild(card);
  });

  // --- full list for the modal ---
  modalSummaryNote.textContent = summary.rating
    ? `${summary.rating.toFixed(1)} average across ${summary.count || reviews.length} reviews.`
    : `${reviews.length} reviews.`;

  reviewList.innerHTML = '';
  reviews.forEach(r => {
    const item = document.createElement('div');
    item.className = 'review-row';
    const text = r.text && r.text.trim()
      ? `<p>${r.text.trim()}</p>`
      : `<p class="no-text">No written comment left with this rating.</p>`;
    item.innerHTML = `
      <div class="review-row-head">
        <b>${r.name}</b>
        <span class="stars" aria-hidden="true">${starString(r.rating)}</span>
        <span class="date">${reviewDateLabel(r.date)}</span>
      </div>
      ${text}`;
    reviewList.appendChild(item);
  });
}

function setupReviewsModal(){
  const modal = document.getElementById('reviewsModal');
  const openBtn = document.getElementById('viewAllReviewsBtn');
  const closeBtn = document.getElementById('reviewsModalClose');

  function open(){
    modal.hidden = false;
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }
  function close(){
    modal.hidden = true;
    document.body.style.overflow = '';
    openBtn.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if(e.target === modal) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) close(); });
}

loadReviews();
setupReviewsModal();
