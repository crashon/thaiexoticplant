// Products management functionality for Thai Exotic Plants

// Product management functions
class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.searchQuery = '';
        this.selectedCategory = '';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
    }

    // Initialize product manager
    async initialize() {
        await this.loadCategories();
        await this.loadProducts();
        this.setupEventListeners();
    }

    // Load categories
    async loadCategories() {
        try {
            const response = await fetch('tables/categories?limit=100');
            const result = await response.json();
            this.categories = result.data;
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load products with pagination and filters
    async loadProducts(append = false) {
        try {
            let url = `tables/products?page=${this.currentPage}&limit=${this.itemsPerPage}`;
            
            if (this.searchQuery) {
                url += `&search=${encodeURIComponent(this.searchQuery)}`;
            }
            
            if (this.sortBy) {
                url += `&sort=${this.sortBy}`;
            }

            const response = await fetch(url);
            const result = await response.json();
            
            if (append) {
                this.products = [...this.products, ...result.data];
            } else {
                this.products = result.data;
            }
            
            return result;
        } catch (error) {
            console.error('Error loading products:', error);
            return { data: [], total: 0 };
        }
    }

    // Search products
    async searchProducts(query) {
        this.searchQuery = query;
        this.currentPage = 1;
        await this.loadProducts(false);
        return this.products;
    }

    // Filter products by category
    async filterByCategory(categoryId) {
        this.selectedCategory = categoryId;
        this.currentPage = 1;
        
        if (categoryId) {
            this.products = this.products.filter(p => p.category_id === categoryId);
        } else {
            await this.loadProducts(false);
        }
        
        return this.products;
    }

    // Sort products
    sortProducts(field, order = 'asc') {
        this.sortBy = field;
        this.sortOrder = order;
        
        this.products.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle different data types
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (order === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            } else {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
        });
        
        return this.products;
    }

    // Get product by ID
    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    // Get products by category
    getProductsByCategory(categoryId) {
        return this.products.filter(p => p.category_id === categoryId);
    }

    // Get featured products
    getFeaturedProducts() {
        return this.products.filter(p => p.is_featured);
    }

    // Get rare products
    getRareProducts() {
        return this.products.filter(p => p.is_rare);
    }

    // Get products by difficulty level
    getProductsByDifficulty(level) {
        return this.products.filter(p => p.difficulty_level === level);
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchProducts(e.target.value);
                }, 500);
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }

        // Sort options
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [field, order] = e.target.value.split('-');
                this.sortProducts(field, order);
            });
        }
    }
}

// Product utilities
class ProductUtils {
    // Format product price
    static formatPrice(product, currency = 'THB') {
        if (currency === 'THB') {
            return `${product.price?.toLocaleString()} ฿`;
        } else if (currency === 'USD') {
            return `$${product.price_usd}`;
        }
        return product.price?.toString() || '0';
    }

    // Get product main image
    static getProductImage(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0];
        }
        return null;
    }

    // Get product badges
    static getProductBadges(product) {
        const badges = [];
        
        if (product.is_rare) {
            badges.push({ text: '희귀종', class: 'badge-rare' });
        }
        
        if (product.is_featured) {
            badges.push({ text: '추천', class: 'badge-featured' });
        }
        
        if (product.stock_quantity <= 5) {
            badges.push({ text: '품절임박', class: 'badge-new' });
        }
        
        return badges;
    }

    // Check if product is available
    static isAvailable(product) {
        return product.is_active && product.stock_quantity > 0;
    }

    // Get difficulty level color
    static getDifficultyColor(level) {
        switch (level) {
            case '초보':
                return 'bg-green-100 text-green-800';
            case '중급':
                return 'bg-yellow-100 text-yellow-800';
            case '전문가':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    // Truncate text
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Generate product URL slug
    static generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9가-힣]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
}

// Product card renderer
class ProductCardRenderer {
    constructor(container) {
        this.container = container;
    }

    render(products) {
        if (!this.container) return;

        if (products.length === 0) {
            this.container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-seedling text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">표시할 상품이 없습니다.</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = products.map(product => this.renderCard(product)).join('');
    }

    renderCard(product) {
        const badges = ProductUtils.getProductBadges(product);
        const mainImage = ProductUtils.getProductImage(product);
        const isAvailable = ProductUtils.isAvailable(product);
        const difficultyColor = ProductUtils.getDifficultyColor(product.difficulty_level);

        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden ${!isAvailable ? 'opacity-60' : ''}" 
                 onclick="showProductDetail('${product.id}')">
                <div class="product-image relative">
                    ${mainImage ? 
                        `<img src="${mainImage}" alt="${product.name}" class="w-full h-48 object-cover">` :
                        `<div class="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <i class="fas fa-seedling text-4xl text-gray-400"></i>
                        </div>`
                    }
                    
                    ${badges.map(badge => `
                        <div class="badge ${badge.class}">${badge.text}</div>
                    `).join('')}
                    
                    ${!isAvailable ? `
                        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span class="text-white font-semibold">품절</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2 text-gray-800 line-clamp-1">${product.name}</h3>
                    <p class="text-sm text-gray-600 mb-2">${product.korean_name || ''}</p>
                    <p class="text-sm text-gray-500 mb-3 line-clamp-2">
                        ${ProductUtils.truncateText(product.description, 80)}
                    </p>
                    
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <span class="price">${ProductUtils.formatPrice(product, 'THB')}</span>
                            <span class="block text-sm text-gray-500">${ProductUtils.formatPrice(product, 'USD')}</span>
                        </div>
                        <div class="text-sm">
                            <span class="px-2 py-1 rounded text-xs ${difficultyColor}">
                                ${product.difficulty_level || '미분류'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">재고: ${product.stock_quantity || 0}개</span>
                        ${isAvailable ? `
                            <button onclick="event.stopPropagation(); addToCart('${product.id}')" 
                                    class="add-to-cart-btn bg-plant-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                                <i class="fas fa-cart-plus mr-2"></i>담기
                            </button>
                        ` : `
                            <button disabled 
                                    class="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
                                <i class="fas fa-ban mr-2"></i>품절
                            </button>
                        `}
                    </div>
                </div>
                
                ${product.tags && product.tags.length > 0 ? `
                    <div class="px-4 pb-4">
                        <div class="flex flex-wrap gap-1">
                            ${product.tags.slice(0, 3).map(tag => `
                                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    #${tag}
                                </span>
                            `).join('')}
                            ${product.tags.length > 3 ? `
                                <span class="text-xs text-gray-400">+${product.tags.length - 3}</span>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// Product gallery component
class ProductGallery {
    constructor(container, images, videos = []) {
        this.container = container;
        this.images = images || [];
        this.videos = videos || [];
        this.currentIndex = 0;
        this.render();
    }

    render() {
        if (!this.container || (this.images.length === 0 && this.videos.length === 0)) {
            return;
        }

        const allMedia = [...this.images, ...this.videos];

        this.container.innerHTML = `
            <div class="image-gallery">
                <div class="gallery-main">
                    ${this.renderMainMedia(allMedia[this.currentIndex], 0)}
                </div>
                
                ${allMedia.length > 1 ? `
                    <div class="gallery-thumbs">
                        ${allMedia.map((media, index) => 
                            this.renderThumbnail(media, index)
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.setupEventListeners();
    }

    renderMainMedia(media, index) {
        if (this.isVideo(media)) {
            return `
                <video controls class="w-full h-full object-cover">
                    <source src="${media}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            return `<img src="${media}" alt="상품 이미지" class="w-full h-full object-cover">`;
        }
    }

    renderThumbnail(media, index) {
        const isActive = index === this.currentIndex ? 'active' : '';
        const isVideo = this.isVideo(media);
        
        return `
            <div class="gallery-thumb ${isActive}" onclick="productGallery.setActive(${index})">
                ${isVideo ? 
                    `<div class="w-full h-full bg-gray-800 flex items-center justify-center">
                        <i class="fas fa-play text-white"></i>
                    </div>` :
                    `<img src="${media}" alt="썸네일 ${index + 1}" class="w-full h-full object-cover">`
                }
            </div>
        `;
    }

    setActive(index) {
        this.currentIndex = index;
        this.render();
    }

    isVideo(url) {
        return url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'));
    }

    setupEventListeners() {
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.currentIndex > 0) {
                this.setActive(this.currentIndex - 1);
            } else if (e.key === 'ArrowRight' && this.currentIndex < this.images.length + this.videos.length - 1) {
                this.setActive(this.currentIndex + 1);
            }
        });
    }
}

// Product search and filter component
class ProductSearchFilter {
    constructor(container) {
        this.container = container;
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <div class="grid md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">검색</label>
                        <input type="text" id="product-search" placeholder="상품명, 학명으로 검색..." 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plant-green">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                        <select id="category-filter" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plant-green">
                            <option value="">전체 카테고리</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                        <select id="sort-select" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plant-green">
                            <option value="name-asc">이름 (가-하)</option>
                            <option value="name-desc">이름 (하-가)</option>
                            <option value="price-asc">가격 (낮은순)</option>
                            <option value="price-desc">가격 (높은순)</option>
                            <option value="created_at-desc">최신순</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">필터</label>
                        <div class="flex gap-2">
                            <button onclick="toggleFilter('rare')" 
                                    class="filter-toggle px-3 py-2 text-sm bg-gray-100 hover:bg-plant-green hover:text-white rounded transition duration-200">
                                희귀종
                            </button>
                            <button onclick="toggleFilter('featured')" 
                                    class="filter-toggle px-3 py-2 text-sm bg-gray-100 hover:bg-plant-green hover:text-white rounded transition duration-200">
                                추천
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global product manager instance
let productManager;
let productGallery;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    productManager = new ProductManager();
    
    // Initialize product manager if we're on a product page
    const productsContainer = document.getElementById('products-grid');
    if (productsContainer) {
        productManager.initialize();
    }
});