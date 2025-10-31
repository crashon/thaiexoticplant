// reviews.js - Customer Review System
const ReviewsManager = {
  apiBaseUrl: 'http://localhost:3000',

  // Render star rating (display only)
  renderStars(rating, size = 'md') {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-lg',
      lg: 'text-2xl'
    };
    const sizeClass = sizeClasses[size] || sizeClasses.md;

    let starsHtml = '<div class="flex items-center gap-1">';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        starsHtml += `<i class="fas fa-star text-yellow-400 ${sizeClass}"></i>`;
      } else {
        starsHtml += `<i class="far fa-star text-gray-300 ${sizeClass}"></i>`;
      }
    }
    starsHtml += '</div>';
    return starsHtml;
  },

  // Render interactive star rating (for forms)
  renderInteractiveStars(containerId, initialRating = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selectedRating = initialRating;

    container.innerHTML = '<div class="flex items-center gap-2" id="star-buttons"></div>';
    const starButtons = container.querySelector('#star-buttons');

    const updateStars = (rating) => {
      starButtons.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'text-2xl transition-colors hover:scale-110 focus:outline-none';
        star.innerHTML = i <= rating
          ? '<i class="fas fa-star text-yellow-400"></i>'
          : '<i class="far fa-star text-gray-300"></i>';

        star.addEventListener('click', () => {
          selectedRating = i;
          updateStars(i);
          // Store rating in hidden input or data attribute
          container.dataset.rating = i;
        });

        starButtons.appendChild(star);
      }
    };

    updateStars(selectedRating);
    container.dataset.rating = selectedRating;
  },

  // Fetch reviews for a product
  async fetchProductReviews(productId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tables/reviews/product/${productId}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  // Fetch review statistics for a product
  async fetchReviewStats(productId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tables/reviews/stats/${productId}`);
      const data = await response.json();
      if (data.success) {
        return data.stats;
      }
      return null;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return null;
    }
  },

  // Submit a new review
  async submitReview(productId, customerName, customerEmail, rating, comment) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          customerName,
          customerEmail,
          rating,
          comment
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      return { success: false, error: 'Failed to submit review' };
    }
  },

  // Render review statistics
  renderReviewStats(stats, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !stats) return;

    const totalReviews = stats.totalReviews || 0;
    const averageRating = parseFloat(stats.averageRating) || 0;
    const distribution = stats.ratingDistribution || {};

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 class="text-xl font-bold mb-4">고객 리뷰</h3>

        <div class="flex items-center gap-6 mb-6">
          <div class="text-center">
            <div class="text-4xl font-bold text-gray-800">${averageRating}</div>
            <div class="my-2">${this.renderStars(Math.round(averageRating), 'lg')}</div>
            <div class="text-sm text-gray-600">${totalReviews}개의 리뷰</div>
          </div>

          <div class="flex-1">
            ${this.renderRatingDistribution(distribution, totalReviews)}
          </div>
        </div>
      </div>
    `;
  },

  // Render rating distribution bars
  renderRatingDistribution(distribution, totalReviews) {
    let html = '<div class="space-y-2">';

    for (let rating = 5; rating >= 1; rating--) {
      const count = distribution[rating] || 0;
      const percentage = totalReviews > 0 ? (count / totalReviews * 100).toFixed(0) : 0;

      html += `
        <div class="flex items-center gap-2 text-sm">
          <span class="w-12">${rating}성</span>
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div class="bg-yellow-400 h-2 rounded-full" style="width: ${percentage}%"></div>
          </div>
          <span class="w-12 text-right text-gray-600">${count}</span>
        </div>
      `;
    }

    html += '</div>';
    return html;
  },

  // Render reviews list
  renderReviewsList(reviews, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-comment-slash text-4xl mb-2"></i>
          <p>아직 리뷰가 없습니다. 첫 리뷰를 작성해주세요!</p>
        </div>
      `;
      return;
    }

    let html = '<div class="space-y-4">';

    reviews.forEach(review => {
      const date = new Date(review.created_at).toLocaleDateString('ko-KR');
      const verified = review.is_verified ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">구매 인증</span>' : '';

      html += `
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold">${this.escapeHtml(review.customer_name)}</span>
              ${verified}
            </div>
            <span class="text-sm text-gray-500">${date}</span>
          </div>

          <div class="mb-2">${this.renderStars(review.rating, 'sm')}</div>

          ${review.comment ? `<p class="text-gray-700">${this.escapeHtml(review.comment)}</p>` : ''}
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  // Render review form
  renderReviewForm(productId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-xl font-bold mb-4">리뷰 작성하기</h3>

        <form id="review-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">평점</label>
            <div id="review-rating-stars"></div>
          </div>

          <div>
            <label for="review-name" class="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input type="text" id="review-name" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
          </div>

          <div>
            <label for="review-email" class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input type="email" id="review-email" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
          </div>

          <div>
            <label for="review-comment" class="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
            <textarea id="review-comment" rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="이 상품에 대한 솔직한 리뷰를 작성해주세요..."></textarea>
          </div>

          <button type="submit"
            class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
            리뷰 제출
          </button>
        </form>

        <div id="review-form-message" class="mt-4"></div>
      </div>
    `;

    // Initialize interactive stars
    this.renderInteractiveStars('review-rating-stars', 0);

    // Handle form submission
    const form = document.getElementById('review-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ratingContainer = document.getElementById('review-rating-stars');
      const rating = parseInt(ratingContainer.dataset.rating) || 0;
      const name = document.getElementById('review-name').value;
      const email = document.getElementById('review-email').value;
      const comment = document.getElementById('review-comment').value;

      if (rating === 0) {
        this.showMessage('review-form-message', '평점을 선택해주세요.', 'error');
        return;
      }

      const result = await this.submitReview(productId, name, email, rating, comment);

      if (result.success) {
        this.showMessage('review-form-message', '리뷰가 성공적으로 제출되었습니다!', 'success');
        form.reset();
        this.renderInteractiveStars('review-rating-stars', 0);

        // Reload reviews after 1 second
        setTimeout(() => {
          this.loadProductReviews(productId);
        }, 1000);
      } else {
        this.showMessage('review-form-message', result.error || '리뷰 제출에 실패했습니다.', 'error');
      }
    });
  },

  // Show message
  showMessage(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    container.innerHTML = `
      <div class="p-4 rounded-lg border ${colors[type]}">
        ${message}
      </div>
    `;

    // Auto hide after 5 seconds
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  },

  // Load and render all review components for a product
  async loadProductReviews(productId) {
    // Load stats
    const stats = await this.fetchReviewStats(productId);
    if (stats) {
      this.renderReviewStats(stats, 'review-stats-container');
    }

    // Load reviews
    const reviews = await this.fetchProductReviews(productId);
    this.renderReviewsList(reviews, 'reviews-list-container');
  },

  // Utility: Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Make it available globally
window.ReviewsManager = ReviewsManager;
