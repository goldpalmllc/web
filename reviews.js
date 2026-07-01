document.addEventListener('DOMContentLoaded', function() {

  const angiReviews = [
    { text: "Matt and his crew were punctual and respectful... I would highly recommend them.", author: "Satisfied Client" },
    { text: "They quoted a reasonable price... Everything looks great!", author: "Homeowner" },
    { text: "Matt & his team were absolutely amazing from start to finish!", author: "Happy Customer" }
  ];

  const networxReviews = [
    { text: "Matt and his crew did an excellent job... Highly recommend.", author: "Networx Customer" },
    { text: "Amazing service! Our patio looks beautiful.", author: "Networx Customer" },
    { text: "Matt and Jacob were awesome... outstanding work.", author: "Networx Customer" }
  ];

  function renderReviews(containerId, reviews) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    reviews.forEach(review => {
      const div = document.createElement('div');
      div.className = 'testimonial';
      div.innerHTML = `<p>"${review.text}"</p><cite>— ${review.author}</cite>`;
      container.appendChild(div);
    });
  }

  renderReviews('angiReviews', angiReviews);
  renderReviews('networxReviews', networxReviews);
});
