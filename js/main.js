// Main JavaScript for Thai Exotic Plants

// Global variables
let currentPage = 1;
let currentFilter = 'all';
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('thaiPlantsCart')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language manager first
    window.languageManager = new LanguageManager();
    
    // Then initialize the rest of the app
    initializeApp();
});

// App initialization
async function initializeApp() {
    try {
        showLoading();
        await loadCategories();
        await loadProducts();
        // Ensure cart UI updater exists (admin.html may not include cart UI)
        if (typeof updateCartUI === 'function') {
            updateCartUI();
        }
        hideLoading();
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoading();
        showNotification('앱 초기화 중 오류가 발생했습니다.', 'error');
    }
}

// Loading functions
function showLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loading-overlay';
    loadingEl.className = 'fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50';
    loadingEl.innerHTML = `
        <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-plant-green mx-auto mb-4"></div>
            <p class="text-gray-600">로딩 중...</p>
        </div>
    `;
    document.body.appendChild(loadingEl);
}

function hideLoading() {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

// Categories functions
async function loadCategories() {
    try {
        const response = await fetch('tables/categories?limit=100');
        
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('API endpoint not available, using fallback data');
        }
        
        const result = await response.json();
        categories = result.data;
        // Save to localStorage for persistence
        localStorage.setItem('thaiPlantsCategories', JSON.stringify(categories));
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        // Load from localStorage first, then default if not found
        loadCategoriesFromStorage();
    }
}

function loadCategoriesFromStorage() {
    try {
        const stored = localStorage.getItem('thaiPlantsCategories');
        if (stored) {
            categories = JSON.parse(stored);
            renderCategories();
        } else {
            loadDefaultCategories();
        }
    } catch (error) {
        console.error('Error loading categories from storage:', error);
        loadDefaultCategories();
    }
}

function loadDefaultCategories() {
    categories = [
        {
            id: '1',
            name: '희귀 아로이드',
            description: '몬스테라, 필로덴드론 등 희귀한 아로이드 계열',
            image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
            is_active: true
        },
        {
            id: '2',
            name: '다육식물',
            description: '태국 자생 다육식물과 선인장류',
            image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
            is_active: true
        },
        {
            id: '3',
            name: '관엽식물',
            description: '실내에서 기르기 좋은 열대 관엽식물',
            image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
            is_active: true
        },
        {
            id: '4',
            name: '꽃식물',
            description: '아름다운 꽃을 피우는 열대 식물',
            image_url: 'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400',
            is_active: true
        }
    ];
    renderCategories();
}

function renderCategories() {
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}')" 
             style="background-image: url('${category.image_url}'); background-size: cover; background-position: center;">
            <div class="category-card-content">
                <h3 class="text-xl font-bold mb-2">${category.name}</h3>
                <p class="text-sm opacity-90">${category.description}</p>
            </div>
        </div>
    `).join('');
}

// Products functions
async function loadProducts(page = 1, filter = 'all') {
    try {
        const response = await fetch(`tables/products?page=${page}&limit=20`);
        
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('API endpoint not available, using fallback data');
        }
        
        const result = await response.json();
        
        if (page === 1) {
            products = result.data;
            // Save to localStorage for persistence
            localStorage.setItem('thaiPlantsProducts', JSON.stringify(products));
        } else {
            products = [...products, ...result.data];
            // Update localStorage with new products
            localStorage.setItem('thaiPlantsProducts', JSON.stringify(products));
        }
        
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        // Load from localStorage first, then default if not found
        if (page === 1) {
            loadProductsFromStorage();
        }
    }
}

function loadProductsFromStorage() {
    try {
        const stored = localStorage.getItem('thaiPlantsProducts');
        if (stored) {
            products = JSON.parse(stored);
            renderProducts();
        } else {
            loadDefaultProducts();
        }
    } catch (error) {
        console.error('Error loading products from storage:', error);
        loadDefaultProducts();
    }
}

function loadDefaultProducts() {
    products = [
        {
            id: '1',
            name: 'Monstera Thai Constellation',
            korean_name: '몬스테라 타이 컨스텔레이션',
            price: 15000,
            price_usd: 450,
            images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
            description: '아름다운 무늬를 자랑하는 희귀 몬스테라',
            category_id: '1',
            is_rare: true,
            is_featured: true,
            is_active: true,
            stock_quantity: 5,
            difficulty_level: '중급',
            tags: ['몬스테라', '희귀종', '무늬']
        },
        {
            id: '2',
            name: 'Philodendron Pink Princess',
            korean_name: '필로덴드론 핑크 프린세스',
            price: 8500,
            price_usd: 250,
            images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
            description: '핑크색 무늬가 매력적인 필로덴드론',
            category_id: '1',
            is_rare: true,
            is_featured: false,
            is_active: true,
            stock_quantity: 8,
            difficulty_level: '중급',
            tags: ['필로덴드론', '핑크', '무늬']
        },
        {
            id: '3',
            name: 'Aglaonema Red Valentine',
            korean_name: '아글라오네마 레드 발렌타인',
            price: 2800,
            price_usd: 85,
            images: ['https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400'],
            description: '빨간 잎이 아름다운 관엽식물',
            category_id: '3',
            is_rare: false,
            is_featured: true,
            is_active: true,
            stock_quantity: 15,
            difficulty_level: '초보',
            tags: ['아글라오네마', '빨강', '초보자']
        },
        {
            id: '4',
            name: 'Haworthia Cooperi',
            korean_name: '하월시아 쿠페리',
            price: 1200,
            price_usd: 35,
            images: ['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'],
            description: '투명한 잎이 신비로운 다육식물',
            category_id: '2',
            is_rare: false,
            is_featured: false,
            is_active: true,
            stock_quantity: 25,
            difficulty_level: '초보',
            tags: ['하월시아', '다육식물', '투명']
        }
    ];
    renderProducts();
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    let filteredProducts = products;
    
    // Apply filters
    if (currentFilter === 'featured') {
        filteredProducts = products.filter(p => p.is_featured);
    } else if (currentFilter === 'rare') {
        filteredProducts = products.filter(p => p.is_rare);
    } else if (currentFilter === 'easy') {
        filteredProducts = products.filter(p => p.difficulty_level === '초보');
    }

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" onclick="showProductDetail('${product.id}')">
            <div class="product-image relative">
                ${product.images && product.images.length > 0 ? 
                    `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-48 object-cover">` :
                    `<div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <i class="fas fa-seedling text-4xl text-gray-400"></i>
                    </div>`
                }
                ${product.is_rare ? '<div class="badge badge-rare">희귀종</div>' : ''}
                ${product.is_featured ? '<div class="badge badge-featured">추천</div>' : ''}
                ${product.stock_quantity <= 5 ? '<div class="badge badge-new">품절임박</div>' : ''}
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2 text-gray-800">${product.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${product.korean_name}</p>
                <p class="text-sm text-gray-500 mb-3 line-clamp-2">${product.description}</p>
                <div class="flex justify-between items-center mb-3">
                    <div>
                        <span class="price">${product.price?.toLocaleString()} ฿</span>
                        <span class="block text-sm text-gray-500">$${product.price_usd}</span>
                    </div>
                    <div class="text-sm">
                        <span class="px-2 py-1 bg-gray-100 rounded text-gray-600">${product.difficulty_level}</span>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">재고: ${product.stock_quantity}개</span>
                    <button onclick="event.stopPropagation(); addToCart('${product.id}')" 
                            class="add-to-cart-btn bg-plant-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                        <i class="fas fa-cart-plus mr-2"></i>담기
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter functions
function filterProducts(filter) {
    currentFilter = filter;
    currentPage = 1;
    
    // Update filter button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('bg-gray-200', 'text-gray-700');
        btn.classList.remove('bg-plant-green', 'text-white');
    });
    
    event.target.classList.add('active');
    event.target.classList.add('bg-plant-green', 'text-white');
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    
    renderProducts();
}

function filterByCategory(categoryId) {
    // This would filter products by category
    const filteredProducts = products.filter(p => p.category_id === categoryId);
    // For now, just scroll to products section
    scrollToProducts();
}

// Load more products
function loadMoreProducts() {
    currentPage++;
    loadProducts(currentPage, currentFilter);
}

// Navigation functions
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function scrollToAbout() {
    document.getElementById('about').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

// Product detail modal
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-4">
                <h2 class="text-2xl font-bold text-thai-green">${product.name}</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <div class="mb-4">
                ${product.images && product.images.length > 0 ?
                    `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-64 object-cover rounded-lg">` :
                    `<div class="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                        <i class="fas fa-seedling text-6xl text-gray-400"></i>
                    </div>`
                }
            </div>

            <div class="mb-4">
                <h3 class="font-semibold text-lg mb-2">${product.korean_name}</h3>
                <p class="text-gray-600 mb-4">${product.description}</p>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span class="block text-sm font-medium text-gray-500">가격</span>
                        <span class="text-2xl font-bold text-plant-green">${product.price?.toLocaleString()} ฿</span>
                        <span class="block text-sm text-gray-500">($${product.price_usd})</span>
                    </div>
                    <div>
                        <span class="block text-sm font-medium text-gray-500">재배 난이도</span>
                        <span class="text-lg">${product.difficulty_level}</span>
                    </div>
                </div>

                <div class="mb-4">
                    <span class="block text-sm font-medium text-gray-500 mb-2">재고</span>
                    <span class="text-lg">${product.stock_quantity}개 남음</span>
                </div>

                ${product.tags ? `
                    <div class="mb-4">
                        <span class="block text-sm font-medium text-gray-500 mb-2">태그</span>
                        <div class="flex flex-wrap gap-2">
                            ${product.tags.map(tag => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">#${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <button onclick="addToCart('${product.id}');"
                    class="w-full bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300 mb-6">
                <i class="fas fa-cart-plus mr-2"></i>장바구니에 추가
            </button>

            <!-- Reviews Section -->
            <div class="border-t pt-6 mt-6">
                <!-- Review Statistics -->
                <div id="review-stats-container"></div>

                <!-- Review Form -->
                <div id="review-form-container" class="mb-6"></div>

                <!-- Reviews List -->
                <div id="reviews-list-container"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Load reviews after modal is rendered
    if (window.ReviewsManager) {
        ReviewsManager.renderReviewForm(productId, 'review-form-container');
        ReviewsManager.loadProductReviews(productId);
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Utility functions
function formatPrice(price, currency = 'THB') {
    if (currency === 'THB') {
        return `${price.toLocaleString()} ฿`;
    } else if (currency === 'USD') {
        return `$${price}`;
    }
    return price.toString();
}