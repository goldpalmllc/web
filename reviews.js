// reviews.js - Show exactly 3 per section
document.addEventListener('DOMContentLoaded', function() {

  // === ANGIE REVIEWS ===
  const angiReviews = [
    { text: "Matt and his crew were punctual and respectful during our interactions. The work was done professionally and meticulous. I would highly recommend them.", author: "Satisfied Client" },
    { text: "They quoted a reasonable price and followed through with the project. Took 15 years off the look of my house. Everything looks great!", author: "Homeowner" },
    { text: "Matt & his team were absolutely amazing from start to finish! Quick, efficient, and made our backyard a place we love.", author: "Happy Customer" }
  ];

  // === NETWORX REVIEWS ===
  const networxReviews = [
    { text: "Matt and his crew did an excellent job. Very organized, efficient, and kept us informed the whole time. Highly recommend.", author: "Networx Customer" },
    { text: "Amazing service! Our patio looks beautiful. They gained a lifelong customer.", author: "Networx Customer" },
    { text: "Matt and Jacob were awesome. Professional, friendly, and did outstanding work on our backyard oasis.", author: "Networx Customer" }
  ];

  function renderReviews(containerId, reviews) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    reviews.forEach(review => {
      const div = document.createElement('div');
      div.className = 'testimonial';
      div.innerHTML = `
        <p>"${review.text}"</p>
        <cite>— ${review.author}</cite>
      `;
      container.appendChild(div);
    });
  }

  // Render exactly 3 each
  renderReviews('angiReviews', angiReviews);
  renderReviews('networxReviews', networxReviews);

  // Show All buttons
  document.getElementById('showAllAngi').addEventListener('click', () => {
    renderReviews('angiReviews', angiReviews.concat(angiReviews)); // duplicates for demo
    this.style.display = 'none';
  });

  document.getElementById('showAllNetworx').addEventListener('click', () => {
    renderReviews('networxReviews', networxReviews.concat(networxReviews));
    this.style.display = 'none';
  });
});
