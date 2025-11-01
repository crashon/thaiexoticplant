// Admin Dashboard functionality for Thai Exotic Plants

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.products = [];
        this.categories = [];
        this.orders = [];
        this.socialPosts = [];
        this.shops = [];
    }

    async initialize() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.renderDashboard();
        // Facebook connection check is handled by global function
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('a').getAttribute('onclick').match(/'(.*)'/)[1];
                this.showSection(section);
            });
        });

        // Search and filter inputs
        this.setupSearchAndFilters();
        
        // File upload
        this.setupFileUpload();
    }

    setupSearchAndFilters() {
        // Product search
        const productSearch = document.getElementById('product-search-admin');
        if (productSearch) {
            let searchTimeout;
            productSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchProducts(e.target.value);
                }, 500);
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter-admin');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterProductsByCategory(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterProductsByStatus(e.target.value);
            });
        }
    }

    setupFileUpload() {
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        // Drag and drop
        const uploadArea = document.querySelector('.border-dashed');
        if (uploadArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, this.preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.add('border-plant-green', 'bg-green-50');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.remove('border-plant-green', 'bg-green-50');
                }, false);
            });

            uploadArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                this.handleFileUpload(files);
            }, false);
        }
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async loadInitialData() {
        try {
        await Promise.all([
            this.loadProducts(),
            this.loadCategories(),
            this.loadOrders(),
            this.loadSocialPosts(),
            this.loadShops()
        ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('데이터 로딩 중 오류가 발생했습니다.', 'error');
        }
    }

    async loadProducts() {
        try {
            // Try to load from API first
            const response = await fetch('tables/products?limit=1000');
            if (response.ok) {
                const result = await response.json();
                this.products = result.data || [];
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error loading products from API:', error);
            // Fallback to localStorage or default data
            this.loadProductsFromStorage();
        }
    }

    loadProductsFromStorage() {
        try {
            const stored = localStorage.getItem('thaiPlantsProducts');
            if (stored) {
                this.products = JSON.parse(stored);
            } else {
                this.products = this.getDefaultProducts();
                this.saveProductsToStorage();
            }
        } catch (error) {
            console.error('Error loading products from storage:', error);
            this.products = this.getDefaultProducts();
        }
    }

    saveProductsToStorage() {
        try {
            localStorage.setItem('thaiPlantsProducts', JSON.stringify(this.products));
        } catch (error) {
            console.error('Error saving products to storage:', error);
        }
    }

    getDefaultProducts() {
        return [
            {
                id: '1',
                name: 'Monstera Thai Constellation',
                korean_name: '몬스테라 타이 컨스텔레이션',
                thai_name: 'Monstera Thai Constellation',
                scientific_name: 'Monstera deliciosa',
                description: '아름다운 무늬를 자랑하는 희귀 몬스테라로, 태국에서 직접 수집한 특별한 품종입니다.',
                category_id: '1',
                price: 15000,
                price_usd: 450,
                stock_quantity: 5,
                images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
                videos: [],
                difficulty_level: '중급',
                is_rare: true,
                is_featured: true,
                is_active: true,
                origin_location: '태국 북부',
                tags: ['몬스테라', '희귀종', '무늬'],
                created_at: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Philodendron Pink Princess',
                korean_name: '필로덴드론 핑크 프린세스',
                thai_name: 'Philodendron Pink Princess',
                scientific_name: 'Philodendron erubescens',
                description: '핑크색 무늬가 매력적인 필로덴드론으로, 실내에서 키우기 좋은 관엽식물입니다.',
                category_id: '1',
                price: 8500,
                price_usd: 250,
                stock_quantity: 8,
                images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
                videos: [],
                difficulty_level: '중급',
                is_rare: true,
                is_featured: false,
                is_active: true,
                origin_location: '태국 중부',
                tags: ['필로덴드론', '핑크', '무늬'],
                created_at: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Aglaonema Red Valentine',
                korean_name: '아글라오네마 레드 발렌타인',
                thai_name: 'Aglaonema Red Valentine',
                scientific_name: 'Aglaonema commutatum',
                description: '빨간 잎이 아름다운 관엽식물로, 초보자도 쉽게 키울 수 있습니다.',
                category_id: '3',
                price: 2800,
                price_usd: 85,
                stock_quantity: 15,
                images: ['https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400'],
                videos: [],
                difficulty_level: '초보',
                is_rare: false,
                is_featured: true,
                is_active: true,
                origin_location: '태국 남부',
                tags: ['아글라오네마', '빨강', '초보자'],
                created_at: new Date().toISOString()
            },
            {
                id: '4',
                name: 'Haworthia Cooperi',
                korean_name: '하월시아 쿠페리',
                thai_name: 'Haworthia Cooperi',
                scientific_name: 'Haworthia cooperi',
                description: '투명한 잎이 신비로운 다육식물로, 물을 적게 주어도 잘 자랍니다.',
                category_id: '2',
                price: 1200,
                price_usd: 35,
                stock_quantity: 25,
                images: ['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'],
                videos: [],
                difficulty_level: '초보',
                is_rare: false,
                is_featured: false,
                is_active: true,
                origin_location: '태국 동부',
                tags: ['하월시아', '다육식물', '투명'],
                created_at: new Date().toISOString()
            }
        ];
    }

    async loadCategories() {
        try {
            const response = await fetch('tables/categories?limit=100');
            
            // Check if response is HTML (404 page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API endpoint not available, using fallback data');
            }
            
            if (response.ok) {
                const result = await response.json();
                this.categories = result.data || [];
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error loading categories from API:', error);
            this.loadCategoriesFromStorage();
        }
    }

    loadCategoriesFromStorage() {
        try {
            const stored = localStorage.getItem('thaiPlantsCategories');
            if (stored) {
                this.categories = JSON.parse(stored);
            } else {
                this.categories = this.getDefaultCategories();
                this.saveCategoriesToStorage();
            }
        } catch (error) {
            console.error('Error loading categories from storage:', error);
            this.categories = this.getDefaultCategories();
        }
    }

    saveCategoriesToStorage() {
        try {
            localStorage.setItem('thaiPlantsCategories', JSON.stringify(this.categories));
            // Also save to server
            this.syncDataToServer('categories', this.categories);
        } catch (error) {
            console.error('Error saving categories to storage:', error);
        }
    }

    getDefaultCategories() {
        return [
            {
                id: '1',
                name: '희귀 아로이드',
                description: '몬스테라, 필로덴드론 등 희귀한 아로이드 계열',
                image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
                is_active: true,
                sort_order: 1,
                created_at: new Date().toISOString()
            },
            {
                id: '2',
                name: '다육식물',
                description: '태국 자생 다육식물과 선인장류',
                image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
                is_active: true,
                sort_order: 2,
                created_at: new Date().toISOString()
            },
            {
                id: '3',
                name: '관엽식물',
                description: '실내에서 기르기 좋은 열대 관엽식물',
                image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
                is_active: true,
                sort_order: 3,
                created_at: new Date().toISOString()
            },
            {
                id: '4',
                name: '꽃식물',
                description: '아름다운 꽃을 피우는 열대 식물',
                image_url: 'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400',
                is_active: true,
                sort_order: 4,
                created_at: new Date().toISOString()
            }
        ];
    }

    async loadOrders() {
        try {
            const response = await fetch('tables/orders?limit=1000');
            
            // Check if response is HTML (404 page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API endpoint not available, using fallback data');
            }
            
            if (response.ok) {
                const result = await response.json();
                this.orders = result.data || [];
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error loading orders from API:', error);
            this.loadOrdersFromStorage();
        }
    }

    loadOrdersFromStorage() {
        try {
            const stored = localStorage.getItem('thaiPlantsOrders');
            if (stored) {
                this.orders = JSON.parse(stored);
            } else {
                this.orders = this.getDefaultOrders();
                this.saveOrdersToStorage();
            }
        } catch (error) {
            console.error('Error loading orders from storage:', error);
            this.orders = this.getDefaultOrders();
        }
    }

    saveOrdersToStorage() {
        try {
            localStorage.setItem('thaiPlantsOrders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving orders to storage:', error);
        }
    }

    getDefaultOrders() {
        return [
            {
                id: '1',
                order_number: 'TP241201001',
                customer_name: '김식물',
                customer_email: 'kim@example.com',
                customer_phone: '010-1234-5678',
                total_amount: 15000,
                currency: 'THB',
                payment_status: '완료',
                order_status: '배송완료',
                shipping_address: '서울시 강남구 테헤란로 123',
                shipping_method: 'special',
                notes: '문 앞에 놓아주세요',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '2',
                order_number: 'TP241201002',
                customer_name: '이정원',
                customer_email: 'lee@example.com',
                customer_phone: '010-2345-6789',
                total_amount: 8500,
                currency: 'THB',
                payment_status: '완료',
                order_status: '배송중',
                shipping_address: '부산시 해운대구 센텀동로 456',
                shipping_method: 'standard',
                notes: '',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '3',
                order_number: 'TP241201003',
                customer_name: '박화원',
                customer_email: 'park@example.com',
                customer_phone: '010-3456-7890',
                total_amount: 2800,
                currency: 'THB',
                payment_status: '대기',
                order_status: '접수',
                shipping_address: '대구시 수성구 동대구로 789',
                shipping_method: 'standard',
                notes: '오후 2시 이후 배송',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    async loadSocialPosts() {
        try {
            const response = await fetch('tables/social_posts?limit=100');
            
            // Check if response is HTML (404 page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API endpoint not available, using fallback data');
            }
            
            if (response.ok) {
                const result = await response.json();
                this.socialPosts = result.data || [];
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error loading social posts from API:', error);
            this.loadSocialPostsFromStorage();
        }
    }

    loadSocialPostsFromStorage() {
        try {
            const stored = localStorage.getItem('thaiPlantsSocialPosts');
            if (stored) {
                this.socialPosts = JSON.parse(stored);
            } else {
                this.socialPosts = this.getDefaultSocialPosts();
                this.saveSocialPostsToStorage();
            }
        } catch (error) {
            console.error('Error loading social posts from storage:', error);
            this.socialPosts = this.getDefaultSocialPosts();
        }
    }

    saveSocialPostsToStorage() {
        try {
            localStorage.setItem('thaiPlantsSocialPosts', JSON.stringify(this.socialPosts));
            // Also save to server
            this.syncDataToServer('socialPosts', this.socialPosts);
        } catch (error) {
            console.error('Error saving social posts to storage:', error);
        }
    }

    getDefaultSocialPosts() {
        return [
            {
                id: '1',
                title: '새로운 희귀 몬스테라 도착!',
                content: '태국에서 직접 수집한 특별한 몬스테라가 도착했습니다. 한정 수량이니 서둘러 주문하세요! 🌿',
                platforms: ['facebook', 'instagram', 'twitter'],
                hashtags: ['#몬스테라', '#희귀식물', '#태국식물', '#인테리어'],
                status: '예약',
                scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString()
            },
            {
                id: '2',
                title: '식물 관리 팁 - 겨울철 관리법',
                content: '겨울철 식물 관리에 도움이 되는 팁을 공유합니다. 온도와 습도 조절이 중요해요! 🌱',
                platforms: ['facebook', 'instagram'],
                hashtags: ['#식물관리', '#겨울철', '#식물팁', '#관엽식물'],
                status: '게시완료',
                scheduled_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active', 'bg-plant-green', 'text-white');
        });
        
        const activeLink = document.querySelector(`[onclick*="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active', 'bg-plant-green', 'text-white');
        }

        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        this.currentSection = sectionName;
        this.renderSection(sectionName);
    }

    renderSection(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'products':
                this.renderProducts();
                break;
            case 'categories':
                this.renderCategories();
                break;
            case 'orders':
                this.renderOrders();
                break;
            case 'social':
                this.renderSocialPosts();
                break;
            case 'shops':
                this.renderShops();
                break;
            case 'media':
                this.renderMediaGallery();
                break;
            case 'analytics':
                if (window.socialAnalytics) {
                    window.socialAnalytics.createAnalyticsDashboard();
                }
                break;
        }
    }

    renderDashboard() {
        // Update statistics
        document.getElementById('total-products').textContent = this.products.length;
        document.getElementById('total-orders').textContent = this.orders.length;
        document.getElementById('total-posts').textContent = this.socialPosts.length;
        
        const totalRevenue = this.orders
            .filter(order => order.payment_status === '완료')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        document.getElementById('total-revenue').textContent = `${totalRevenue.toLocaleString()} ฿`;

        // Render charts
        this.renderSalesChart();
        this.renderCategoryChart();
    }

    renderSalesChart() {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        // Generate mock data for last 6 months
        const months = [];
        const salesData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('ko-KR', { month: 'short' }));
            salesData.push(Math.floor(Math.random() * 100000) + 50000);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '월별 매출 (฿)',
                    data: salesData,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' ฿';
                            }
                        }
                    }
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        const categoryData = this.categories.map(category => ({
            name: category.name,
            count: this.products.filter(p => p.category_id === category.id).length
        }));

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(c => c.name),
                datasets: [{
                    data: categoryData.map(c => c.count),
                    backgroundColor: [
                        '#4ade80',
                        '#ffd700',
                        '#3b82f6',
                        '#ef4444',
                        '#8b5cf6',
                        '#f59e0b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    renderProducts() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            ${product.images && product.images.length > 0 ?
                                `<img class="h-10 w-10 rounded-full object-cover" src="${product.images[0]}" alt="${product.name}">` :
                                `<div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <i class="fas fa-seedling text-gray-400"></i>
                                </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.korean_name || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">
                        ${this.getCategoryName(product.category_id)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${product.price?.toLocaleString()} ฿</div>
                    <div class="text-sm text-gray-500">$${product.price_usd}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">${product.stock_quantity || 0}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${product.is_active ? '활성' : '비활성'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editProduct('${product.id}')" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct('${product.id}')" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Update pagination info
        document.getElementById('pagination-info').textContent = `총 ${this.products.length}개 상품`;
    }

    renderCategories() {
        const grid = document.getElementById('categories-admin-grid');
        if (!grid) return;

        grid.innerHTML = this.categories.map(category => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="relative h-32">
                    ${category.image_url ?
                        `<img src="${category.image_url}" alt="${category.name}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full bg-gray-200 flex items-center justify-center">
                            <i class="fas fa-folder text-4xl text-gray-400"></i>
                        </div>`
                    }
                    <div class="absolute top-2 right-2">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                            category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${category.is_active ? '활성' : '비활성'}
                        </span>
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${category.name}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${category.description || ''}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">
                            상품 ${this.getProductCountByCategory(category.id)}개
                        </span>
                        <div class="flex space-x-2">
                            <button onclick="editCategory('${category.id}')" 
                                    class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteCategory('${category.id}')" 
                                    class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderOrders() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${order.order_number}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${order.customer_name}</div>
                    <div class="text-sm text-gray-500">${order.customer_email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${order.total_amount?.toLocaleString()} ฿</div>
                    <div class="text-sm text-gray-500">${order.currency}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        this.getPaymentStatusColor(order.payment_status)
                    }">
                        ${order.payment_status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        this.getOrderStatusColor(order.order_status)
                    }">
                        ${order.order_status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(order.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewOrder('${order.id}')" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editOrder('${order.id}')" 
                            class="text-blue-600 hover:text-blue-900">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderSocialPosts() {
        const container = document.getElementById('social-posts-list');
        if (!container) return;

        if (this.socialPosts.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center">
                    <i class="fas fa-share-alt text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">예약된 소셜미디어 포스트가 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.socialPosts.map(post => `
            <div class="p-6">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-lg mb-2">${post.title}</h4>
                        <p class="text-gray-600 mb-3 line-clamp-2">${post.content}</p>
                        <div class="flex items-center space-x-4 mb-3">
                            <div class="flex space-x-2">
                                ${post.platforms?.map(platform => `
                                    <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                        ${platform}
                                    </span>
                                `).join('') || ''}
                            </div>
                            <span class="text-sm text-gray-500">
                                ${new Date(post.scheduled_time).toLocaleString('ko-KR')}
                            </span>
                        </div>
                        ${post.hashtags?.length > 0 ? `
                            <div class="flex flex-wrap gap-1">
                                ${post.hashtags.slice(0, 5).map(tag => `
                                    <span class="text-xs text-blue-600">#${tag}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                            this.getSocialStatusColor(post.status)
                        }">
                            ${post.status}
                        </span>
                        <button onclick="editSocialPost('${post.id}')" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteSocialPost('${post.id}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Shop management methods
    async loadShops() {
        try {
            const response = await fetch('tables/shops?limit=100');
            
            // Check if response is HTML (404 page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API endpoint not available, using fallback data');
            }
            
            if (response.ok) {
                const result = await response.json();
                this.shops = result.data || [];
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error loading shops from API:', error);
            this.loadShopsFromStorage();
        }
    }

    loadShopsFromStorage() {
        try {
            const stored = localStorage.getItem('thaiPlantsShops');
            if (stored) {
                this.shops = JSON.parse(stored);
            } else {
                this.shops = this.getDefaultShops();
                this.saveShopsToStorage();
            }
        } catch (error) {
            console.error('Error loading shops from storage:', error);
            this.shops = this.getDefaultShops();
        }
    }

    saveShopsToStorage() {
        try {
            localStorage.setItem('thaiPlantsShops', JSON.stringify(this.shops));
        } catch (error) {
            console.error('Error saving shops to storage:', error);
        }
    }

    getDefaultShops() {
        return [
            {
                id: 's1',
                name: 'Bangkok Rare Aroids',
                description: '방콕 희귀 아로이드 전문 샵',
                owner_id: 'owner1',
                owner_name: 'Anan',
                contact: 'anan@bangkokaroids.com',
                address: 'Bangkok, Thailand',
                image_url: 'https://images.unsplash.com/photo-1586015555751-63b6062a39fd?w=800',
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 's2',
                name: 'Chiang Mai Succulents',
                description: '치앙마이 다육/선인장 샵',
                owner_id: 'owner2',
                owner_name: 'Nok',
                contact: 'nok@chiangmaisucculents.com',
                address: 'Chiang Mai, Thailand',
                image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 's3',
                name: 'Phuket Tropicals',
                description: '푸켓 열대 관엽 전문',
                owner_id: 'owner3',
                owner_name: 'Mali',
                contact: 'mali@phukettropicals.com',
                address: 'Phuket, Thailand',
                image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
                is_active: false,
                created_at: new Date().toISOString()
            }
        ];
    }

    renderShops() {
        const container = document.getElementById('shops-grid-admin');
        if (!container) return;

        if (this.shops.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-store-slash text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">등록된 샵이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.shops.map(shop => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <div class="h-48 bg-gray-200">
                    <img src="${shop.image_url || 'https://images.unsplash.com/photo-1586015555751-63b6062a39fd?w=800'}" 
                         alt="${shop.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-6">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="text-xl font-semibold text-gray-800">${shop.name}</h3>
                        <span class="px-2 py-1 text-xs rounded ${shop.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}">
                            ${shop.is_active ? '활성' : '비활성'}
                        </span>
                    </div>
                    <p class="text-gray-600 mb-3 line-clamp-2">${shop.description}</p>
                    <div class="space-y-2 text-sm text-gray-500 mb-4">
                        <div class="flex items-center">
                            <i class="fas fa-user w-4 mr-2"></i>
                            <span>${shop.owner_name || '미지정'}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-envelope w-4 mr-2"></i>
                            <span>${shop.contact || '-'}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-map-marker-alt w-4 mr-2"></i>
                            <span>${shop.address || '-'}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editShop('${shop.id}')" 
                                class="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition duration-200">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                        <button onclick="deleteShop('${shop.id}')" 
                                class="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition duration-200">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderMediaGallery() {
        const gallery = document.getElementById('media-gallery');
        if (!gallery) return;

        // Load media from storage
        const media = this.loadMediaFromStorage();
        
        if (media.length === 0) {
            gallery.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-images text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">미디어 파일을 업로드하여 갤러리를 만드세요.</p>
                </div>
            `;
            return;
        }

        gallery.innerHTML = media.map(item => `
            <div class="relative group">
                <div class="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    ${item.type === 'image' ? 
                        `<img src="${item.url}" alt="${item.name}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center bg-gray-800">
                            <i class="fas fa-play text-white text-2xl"></i>
                        </div>`
                    }
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div class="flex space-x-2">
                        <button onclick="viewMedia('${item.id}')" 
                                class="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition duration-200">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteMedia('${item.id}')" 
                                class="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-200">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="text-sm font-medium text-gray-900 truncate">${item.name}</p>
                    <p class="text-xs text-gray-500">${item.type.toUpperCase()} • ${this.formatFileSize(item.size)}</p>
                </div>
            </div>
        `).join('');
    }

    loadMediaFromStorage() {
        try {
            const stored = localStorage.getItem('thaiPlantsMedia');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading media from storage:', error);
            return [];
        }
    }

    saveMediaToStorage(media) {
        try {
            localStorage.setItem('thaiPlantsMedia', JSON.stringify(media));
        } catch (error) {
            console.error('Error saving media to storage:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Helper methods
    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : '미분류';
    }

    getProductCountByCategory(categoryId) {
        return this.products.filter(p => p.category_id === categoryId).length;
    }

    getPaymentStatusColor(status) {
        switch (status) {
            case '완료': return 'bg-green-100 text-green-800';
            case '대기': return 'bg-yellow-100 text-yellow-800';
            case '실패': return 'bg-red-100 text-red-800';
            case '취소': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getOrderStatusColor(status) {
        switch (status) {
            case '배송완료': return 'bg-green-100 text-green-800';
            case '배송중': return 'bg-blue-100 text-blue-800';
            case '준비중': return 'bg-yellow-100 text-yellow-800';
            case '접수': return 'bg-gray-100 text-gray-800';
            case '취소': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getSocialStatusColor(status) {
        switch (status) {
            case '게시완료': return 'bg-green-100 text-green-800';
            case '예약': return 'bg-blue-100 text-blue-800';
            case '실패': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Search and filter methods
    async searchProducts(query) {
        if (!query) {
            await this.loadProducts();
        } else {
            this.products = this.products.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                (product.korean_name && product.korean_name.toLowerCase().includes(query.toLowerCase()))
            );
        }
        this.renderProducts();
    }

    filterProductsByCategory(categoryId) {
        // Implementation would filter products by category
        this.renderProducts();
    }

    filterProductsByStatus(status) {
        // Implementation would filter products by status
        this.renderProducts();
    }

    // File upload handling
    async handleFileUpload(files) {
        const progressBar = document.getElementById('upload-progress');
        const progressFill = document.getElementById('upload-progress-fill');
        const statusText = document.getElementById('upload-status');

        if (files.length === 0) return;

        progressBar.classList.remove('hidden');
        
        const media = this.loadMediaFromStorage();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length) * 100;
            
            progressFill.style.width = progress + '%';
            statusText.textContent = `업로드 중... ${i + 1}/${files.length}`;
            
            try {
                // Convert file to base64 for storage
                const base64 = await this.fileToBase64(file);
                
                const mediaItem = {
                    id: Date.now().toString() + i,
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    url: base64,
                    size: file.size,
                    uploaded_at: new Date().toISOString()
                };
                
                media.push(mediaItem);
                
                // Simulate upload delay
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Error uploading file:', error);
                showNotification(`파일 ${file.name} 업로드 중 오류가 발생했습니다.`, 'error');
            }
        }

        // Save to storage
        this.saveMediaToStorage(media);
        
        progressBar.classList.add('hidden');
        showNotification(`${files.length}개 파일이 성공적으로 업로드되었습니다.`, 'success');
        this.renderMediaGallery();
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}

// Modal functions
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">상품 추가</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="add-product-form" class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">상품명 (영문) *</label>
                        <input type="text" name="name" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">상품명 (한글)</label>
                        <input type="text" name="korean_name" class="form-input">
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">학명</label>
                        <input type="text" name="scientific_name" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">카테고리 *</label>
                        <select name="category_id" class="form-input" required>
                            <option value="">카테고리 선택</option>
                            ${adminDashboard.categories.map(cat => 
                                `<option value="${cat.id}">${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">상품 설명</label>
                    <textarea name="description" class="form-input form-textarea"></textarea>
                </div>
                
                <div class="grid md:grid-cols-3 gap-6">
                    <div>
                        <label class="form-label">가격 (THB) *</label>
                        <input type="number" name="price" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">가격 (USD) *</label>
                        <input type="number" name="price_usd" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">재고 수량 *</label>
                        <input type="number" name="stock_quantity" class="form-input" required>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">재배 난이도</label>
                        <select name="difficulty_level" class="form-input">
                            <option value="초보">초보</option>
                            <option value="중급">중급</option>
                            <option value="전문가">전문가</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">원산지</label>
                        <input type="text" name="origin_location" class="form-input">
                    </div>
                </div>
                
                <div class="flex space-x-6">
                    <label class="flex items-center">
                        <input type="checkbox" name="is_rare" class="mr-2">
                        희귀종
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="is_featured" class="mr-2">
                        추천 상품
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="is_active" class="mr-2" checked>
                        활성화
                    </label>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="submitProduct()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    상품 추가
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function showAddCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">카테고리 추가</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="add-category-form" class="space-y-4">
                <div>
                    <label class="form-label">카테고리명 *</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                
                <div>
                    <label class="form-label">설명</label>
                    <textarea name="description" class="form-input form-textarea"></textarea>
                </div>
                
                <div>
                    <label class="form-label">이미지 URL</label>
                    <input type="url" name="image_url" class="form-input">
                </div>
                
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" name="is_active" class="mr-2" checked>
                        활성화
                    </label>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="submitCategory()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    카테고리 추가
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Submit functions
async function submitProduct() {
    const form = document.getElementById('add-product-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const productData = {
        id: Date.now().toString(), // Generate unique ID
        name: formData.get('name'),
        korean_name: formData.get('korean_name'),
        scientific_name: formData.get('scientific_name'),
        thai_name: formData.get('korean_name'), // Use Korean name as Thai name for now
        description: formData.get('description'),
        category_id: formData.get('category_id'),
        price: parseFloat(formData.get('price')),
        price_usd: parseFloat(formData.get('price_usd')),
        stock_quantity: parseInt(formData.get('stock_quantity')),
        difficulty_level: formData.get('difficulty_level'),
        origin_location: formData.get('origin_location'),
        is_rare: formData.get('is_rare') === 'on',
        is_featured: formData.get('is_featured') === 'on',
        is_active: formData.get('is_active') === 'on',
        images: [],
        videos: [],
        tags: [],
        created_at: new Date().toISOString()
    };
    
    try {
        // Add to memory
        adminDashboard.products.push(productData);
        
        // Save to storage
        adminDashboard.saveProductsToStorage();
        
        closeModal();
        adminDashboard.renderProducts();
        showNotification('상품이 성공적으로 추가되었습니다.', 'success');
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('상품 추가 중 오류가 발생했습니다.', 'error');
    }
}

async function submitCategory() {
    const form = document.getElementById('add-category-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const categoryData = {
        id: Date.now().toString(), // Generate unique ID
        name: formData.get('name'),
        description: formData.get('description'),
        image_url: formData.get('image_url'),
        is_active: formData.get('is_active') === 'on',
        sort_order: adminDashboard.categories.length + 1,
        created_at: new Date().toISOString()
    };
    
    try {
        // Add to memory
        adminDashboard.categories.push(categoryData);
        
        // Save to storage
        adminDashboard.saveCategoriesToStorage();
        
        closeModal();
        adminDashboard.renderCategories();
        showNotification('카테고리가 성공적으로 추가되었습니다.', 'success');
    } catch (error) {
        console.error('Error adding category:', error);
        showNotification('카테고리 추가 중 오류가 발생했습니다.', 'error');
    }
}

// Global functions
function showSection(sectionName) {
    adminDashboard.showSection(sectionName);
}

// Edit and delete functions
function editProduct(productId) {
    const product = adminDashboard.products.find(p => p.id === productId);
    if (!product) {
        showNotification('상품을 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">상품 편집</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="edit-product-form" class="space-y-6">
                <input type="hidden" name="id" value="${product.id}">
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">상품명 (영문) *</label>
                        <input type="text" name="name" class="form-input" value="${product.name}" required>
                    </div>
                    <div>
                        <label class="form-label">상품명 (한글)</label>
                        <input type="text" name="korean_name" class="form-input" value="${product.korean_name || ''}">
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">학명</label>
                        <input type="text" name="scientific_name" class="form-input" value="${product.scientific_name || ''}">
                    </div>
                    <div>
                        <label class="form-label">카테고리 *</label>
                        <select name="category_id" class="form-input" required>
                            <option value="">카테고리 선택</option>
                            ${adminDashboard.categories.map(cat => 
                                `<option value="${cat.id}" ${cat.id === product.category_id ? 'selected' : ''}>${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">상품 설명</label>
                    <textarea name="description" class="form-input form-textarea">${product.description || ''}</textarea>
                </div>
                
                <div class="grid md:grid-cols-3 gap-6">
                    <div>
                        <label class="form-label">가격 (THB) *</label>
                        <input type="number" name="price" class="form-input" value="${product.price}" required>
                    </div>
                    <div>
                        <label class="form-label">가격 (USD) *</label>
                        <input type="number" name="price_usd" class="form-input" value="${product.price_usd}" required>
                    </div>
                    <div>
                        <label class="form-label">재고 수량 *</label>
                        <input type="number" name="stock_quantity" class="form-input" value="${product.stock_quantity}" required>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">재배 난이도</label>
                        <select name="difficulty_level" class="form-input">
                            <option value="초보" ${product.difficulty_level === '초보' ? 'selected' : ''}>초보</option>
                            <option value="중급" ${product.difficulty_level === '중급' ? 'selected' : ''}>중급</option>
                            <option value="전문가" ${product.difficulty_level === '전문가' ? 'selected' : ''}>전문가</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">원산지</label>
                        <input type="text" name="origin_location" class="form-input" value="${product.origin_location || ''}">
                    </div>
                </div>
                
                <div class="flex space-x-6">
                    <label class="flex items-center">
                        <input type="checkbox" name="is_rare" class="mr-2" ${product.is_rare ? 'checked' : ''}>
                        희귀종
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="is_featured" class="mr-2" ${product.is_featured ? 'checked' : ''}>
                        추천 상품
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="is_active" class="mr-2" ${product.is_active ? 'checked' : ''}>
                        활성화
                    </label>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="updateProduct()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    상품 수정
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function updateProduct() {
    const form = document.getElementById('edit-product-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const productId = formData.get('id');
    const productData = {
        name: formData.get('name'),
        korean_name: formData.get('korean_name'),
        scientific_name: formData.get('scientific_name'),
        description: formData.get('description'),
        category_id: formData.get('category_id'),
        price: parseFloat(formData.get('price')),
        price_usd: parseFloat(formData.get('price_usd')),
        stock_quantity: parseInt(formData.get('stock_quantity')),
        difficulty_level: formData.get('difficulty_level'),
        origin_location: formData.get('origin_location'),
        is_rare: formData.get('is_rare') === 'on',
        is_featured: formData.get('is_featured') === 'on',
        is_active: formData.get('is_active') === 'on'
    };
    
    try {
        // Update in memory
        const productIndex = adminDashboard.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            adminDashboard.products[productIndex] = {
                ...adminDashboard.products[productIndex],
                ...productData,
                updated_at: new Date().toISOString()
            };
            
            // Save to storage
            adminDashboard.saveProductsToStorage();
            
            closeModal();
            adminDashboard.renderProducts();
            showNotification('상품이 성공적으로 수정되었습니다.', 'success');
        } else {
            throw new Error('상품을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('상품 수정 중 오류가 발생했습니다.', 'error');
    }
}

function deleteProduct(productId) {
    if (confirm('정말로 이 상품을 삭제하시겠습니까?\n삭제된 상품은 복구할 수 없습니다.')) {
        try {
            // Remove from memory
            adminDashboard.products = adminDashboard.products.filter(p => p.id !== productId);
            
            // Save to storage
            adminDashboard.saveProductsToStorage();
            
            // Re-render products
            adminDashboard.renderProducts();
            
            showNotification('상품이 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('상품 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

function editCategory(categoryId) {
    const category = adminDashboard.categories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('카테고리를 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">카테고리 편집</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="edit-category-form" class="space-y-4">
                <input type="hidden" name="id" value="${category.id}">
                
                <div>
                    <label class="form-label">카테고리명 *</label>
                    <input type="text" name="name" class="form-input" value="${category.name}" required>
                </div>
                
                <div>
                    <label class="form-label">설명</label>
                    <textarea name="description" class="form-input form-textarea">${category.description || ''}</textarea>
                </div>
                
                <div>
                    <label class="form-label">이미지 URL</label>
                    <input type="url" name="image_url" class="form-input" value="${category.image_url || ''}">
                </div>
                
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" name="is_active" class="mr-2" ${category.is_active ? 'checked' : ''}>
                        활성화
                    </label>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="updateCategory()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    카테고리 수정
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function updateCategory() {
    const form = document.getElementById('edit-category-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const categoryId = formData.get('id');
    const categoryData = {
        name: formData.get('name'),
        description: formData.get('description'),
        image_url: formData.get('image_url'),
        is_active: formData.get('is_active') === 'on'
    };
    
    try {
        // Update in memory
        const categoryIndex = adminDashboard.categories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1) {
            adminDashboard.categories[categoryIndex] = {
                ...adminDashboard.categories[categoryIndex],
                ...categoryData,
                updated_at: new Date().toISOString()
            };
            
            // Save to storage
            adminDashboard.saveCategoriesToStorage();
            
            closeModal();
            adminDashboard.renderCategories();
            showNotification('카테고리가 성공적으로 수정되었습니다.', 'success');
        } else {
            throw new Error('카테고리를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        showNotification('카테고리 수정 중 오류가 발생했습니다.', 'error');
    }
}

function deleteCategory(categoryId) {
    if (confirm('정말로 이 카테고리를 삭제하시겠습니까?\n삭제된 카테고리는 복구할 수 없습니다.')) {
        try {
            // Check if any products are using this category
            const productsInCategory = adminDashboard.products.filter(p => p.category_id === categoryId);
            if (productsInCategory.length > 0) {
                showNotification(`이 카테고리를 사용하는 상품이 ${productsInCategory.length}개 있습니다. 먼저 상품의 카테고리를 변경해주세요.`, 'error');
                return;
            }
            
            // Remove from memory
            adminDashboard.categories = adminDashboard.categories.filter(c => c.id !== categoryId);
            
            // Save to storage
            adminDashboard.saveCategoriesToStorage();
            
            // Re-render categories
            adminDashboard.renderCategories();
            
            showNotification('카테고리가 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            showNotification('카테고리 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

function viewOrder(orderId) {
    const order = adminDashboard.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('주문을 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">주문 상세보기</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 class="text-lg font-semibold mb-4">주문 정보</h3>
                    <div class="space-y-3">
                        <div>
                            <span class="font-medium">주문번호:</span>
                            <span class="ml-2">${order.order_number}</span>
                        </div>
                        <div>
                            <span class="font-medium">주문일:</span>
                            <span class="ml-2">${new Date(order.created_at).toLocaleString('ko-KR')}</span>
                        </div>
                        <div>
                            <span class="font-medium">총 금액:</span>
                            <span class="ml-2 font-bold text-plant-green">${order.total_amount?.toLocaleString()} ${order.currency}</span>
                        </div>
                        <div>
                            <span class="font-medium">결제 상태:</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${adminDashboard.getPaymentStatusColor(order.payment_status)}">
                                ${order.payment_status}
                            </span>
                        </div>
                        <div>
                            <span class="font-medium">주문 상태:</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${adminDashboard.getOrderStatusColor(order.order_status)}">
                                ${order.order_status}
                            </span>
                        </div>
                        <div>
                            <span class="font-medium">배송 방법:</span>
                            <span class="ml-2">${order.shipping_method || '일반 배송'}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-4">고객 정보</h3>
                    <div class="space-y-3">
                        <div>
                            <span class="font-medium">고객명:</span>
                            <span class="ml-2">${order.customer_name}</span>
                        </div>
                        <div>
                            <span class="font-medium">이메일:</span>
                            <span class="ml-2">${order.customer_email}</span>
                        </div>
                        <div>
                            <span class="font-medium">전화번호:</span>
                            <span class="ml-2">${order.customer_phone}</span>
                        </div>
                        <div>
                            <span class="font-medium">배송 주소:</span>
                            <div class="ml-2 mt-1 p-2 bg-gray-50 rounded text-sm">
                                ${order.shipping_address}
                            </div>
                        </div>
                        ${order.notes ? `
                            <div>
                                <span class="font-medium">주문 메모:</span>
                                <div class="ml-2 mt-1 p-2 bg-gray-50 rounded text-sm">
                                    ${order.notes}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="mt-6">
                <h3 class="text-lg font-semibold mb-4">주문 상품</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-gray-600">주문 상품 정보는 별도로 관리됩니다.</p>
                </div>
            </div>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    닫기
                </button>
                <button type="button" onclick="editOrder('${order.id}')" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    주문 수정
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function editOrder(orderId) {
    const order = adminDashboard.orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('주문을 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">주문 수정</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="edit-order-form" class="space-y-4">
                <input type="hidden" name="id" value="${order.id}">
                
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">결제 상태</label>
                        <select name="payment_status" class="form-input">
                            <option value="대기" ${order.payment_status === '대기' ? 'selected' : ''}>대기</option>
                            <option value="완료" ${order.payment_status === '완료' ? 'selected' : ''}>완료</option>
                            <option value="실패" ${order.payment_status === '실패' ? 'selected' : ''}>실패</option>
                            <option value="취소" ${order.payment_status === '취소' ? 'selected' : ''}>취소</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">주문 상태</label>
                        <select name="order_status" class="form-input">
                            <option value="접수" ${order.order_status === '접수' ? 'selected' : ''}>접수</option>
                            <option value="준비중" ${order.order_status === '준비중' ? 'selected' : ''}>준비중</option>
                            <option value="배송중" ${order.order_status === '배송중' ? 'selected' : ''}>배송중</option>
                            <option value="배송완료" ${order.order_status === '배송완료' ? 'selected' : ''}>배송완료</option>
                            <option value="취소" ${order.order_status === '취소' ? 'selected' : ''}>취소</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">배송 추적번호</label>
                    <input type="text" name="tracking_number" class="form-input" value="${order.tracking_number || ''}" placeholder="배송 추적번호를 입력하세요">
                </div>
                
                <div>
                    <label class="form-label">관리자 메모</label>
                    <textarea name="admin_notes" class="form-input form-textarea" placeholder="관리자 메모를 입력하세요">${order.admin_notes || ''}</textarea>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="updateOrder()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    주문 수정
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function updateOrder() {
    const form = document.getElementById('edit-order-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const orderId = formData.get('id');
    const orderData = {
        payment_status: formData.get('payment_status'),
        order_status: formData.get('order_status'),
        tracking_number: formData.get('tracking_number'),
        admin_notes: formData.get('admin_notes')
    };
    
    try {
        // Update in memory
        const orderIndex = adminDashboard.orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            adminDashboard.orders[orderIndex] = {
                ...adminDashboard.orders[orderIndex],
                ...orderData,
                updated_at: new Date().toISOString()
            };
            
            // Save to storage
            adminDashboard.saveOrdersToStorage();
            
            closeModal();
            adminDashboard.renderOrders();
            showNotification('주문이 성공적으로 수정되었습니다.', 'success');
        } else {
            throw new Error('주문을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        showNotification('주문 수정 중 오류가 발생했습니다.', 'error');
    }
}

function exportProducts() {
    try {
        const data = {
            products: adminDashboard.products,
            categories: adminDashboard.categories,
            orders: adminDashboard.orders,
            socialPosts: adminDashboard.socialPosts,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thai-plants-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('데이터가 성공적으로 내보내기되었습니다.', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('데이터 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('기존 데이터를 모두 교체하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
                    if (data.products) adminDashboard.products = data.products;
                    if (data.categories) adminDashboard.categories = data.categories;
                    if (data.orders) adminDashboard.orders = data.orders;
                    if (data.socialPosts) adminDashboard.socialPosts = data.socialPosts;
                    
                    // Save to storage
                    adminDashboard.saveProductsToStorage();
                    adminDashboard.saveCategoriesToStorage();
                    adminDashboard.saveOrdersToStorage();
                    adminDashboard.saveSocialPostsToStorage();
                    
                    // Refresh current view
                    adminDashboard.renderSection(adminDashboard.currentSection);
                    
                    showNotification('데이터가 성공적으로 가져오기되었습니다.', 'success');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                showNotification('데이터 가져오기 중 오류가 발생했습니다. 파일 형식을 확인해주세요.', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Social Media Management Functions
function showAddSocialPostModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">소셜미디어 포스트 예약</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="add-social-post-form" class="space-y-4">
                <div>
                    <label class="form-label">포스트 제목 *</label>
                    <input type="text" name="title" class="form-input" required placeholder="포스트 제목을 입력하세요">
                </div>
                
                <div>
                    <label class="form-label">포스트 내용 *</label>
                    <textarea name="content" class="form-input form-textarea" required placeholder="포스트 내용을 입력하세요"></textarea>
                </div>
                
                <div>
                    <label class="form-label">게시 플랫폼 *</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" name="platforms" value="facebook" class="mr-2">
                            <i class="fab fa-facebook text-blue-600 mr-1"></i>Facebook
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="platforms" value="instagram" class="mr-2">
                            <i class="fab fa-instagram text-pink-600 mr-1"></i>Instagram
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="platforms" value="twitter" class="mr-2">
                            <i class="fab fa-twitter text-blue-400 mr-1"></i>Twitter
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">예약 시간</label>
                    <input type="datetime-local" name="scheduled_time" class="form-input">
                </div>
                
                <div>
                    <label class="form-label">해시태그 (쉼표로 구분)</label>
                    <input type="text" name="hashtags" class="form-input" placeholder="#태국식물, #희귀식물, #인테리어">
                </div>
                
                <div>
                    <label class="form-label">이미지 URL (선택사항)</label>
                    <input type="url" name="image_url" class="form-input" placeholder="https://example.com/image.jpg">
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="submitSocialPost()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    포스트 예약
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function submitSocialPost() {
    const form = document.getElementById('add-social-post-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const platforms = formData.getAll('platforms');
    if (platforms.length === 0) {
        showNotification('최소 하나의 플랫폼을 선택해주세요.', 'error');
        return;
    }
    
    const hashtags = formData.get('hashtags').split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const socialPostData = {
        id: Date.now().toString(),
        title: formData.get('title'),
        content: formData.get('content'),
        platforms: platforms,
        hashtags: hashtags,
        image_url: formData.get('image_url'),
        status: '예약',
        scheduled_time: formData.get('scheduled_time') || new Date().toISOString(),
        created_at: new Date().toISOString()
    };
    
    try {
        // Add to memory
        adminDashboard.socialPosts.push(socialPostData);
        
        // Save to storage
        adminDashboard.saveSocialPostsToStorage();
        
        closeModal();
        adminDashboard.renderSocialPosts();
        showNotification('소셜미디어 포스트가 성공적으로 예약되었습니다.', 'success');
    } catch (error) {
        console.error('Error adding social post:', error);
        showNotification('포스트 예약 중 오류가 발생했습니다.', 'error');
    }
}

function editSocialPost(postId) {
    const post = adminDashboard.socialPosts.find(p => p.id === postId);
    if (!post) {
        showNotification('포스트를 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">소셜미디어 포스트 편집</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="edit-social-post-form" class="space-y-4">
                <input type="hidden" name="id" value="${post.id}">
                
                <div>
                    <label class="form-label">포스트 제목 *</label>
                    <input type="text" name="title" class="form-input" value="${post.title}" required>
                </div>
                
                <div>
                    <label class="form-label">포스트 내용 *</label>
                    <textarea name="content" class="form-input form-textarea" required>${post.content}</textarea>
                </div>
                
                <div>
                    <label class="form-label">게시 플랫폼 *</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" name="platforms" value="facebook" class="mr-2" ${post.platforms?.includes('facebook') ? 'checked' : ''}>
                            <i class="fab fa-facebook text-blue-600 mr-1"></i>Facebook
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="platforms" value="instagram" class="mr-2" ${post.platforms?.includes('instagram') ? 'checked' : ''}>
                            <i class="fab fa-instagram text-pink-600 mr-1"></i>Instagram
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="platforms" value="twitter" class="mr-2" ${post.platforms?.includes('twitter') ? 'checked' : ''}>
                            <i class="fab fa-twitter text-blue-400 mr-1"></i>Twitter
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">예약 시간</label>
                    <input type="datetime-local" name="scheduled_time" class="form-input" value="${new Date(post.scheduled_time).toISOString().slice(0, 16)}">
                </div>
                
                <div>
                    <label class="form-label">해시태그 (쉼표로 구분)</label>
                    <input type="text" name="hashtags" class="form-input" value="${post.hashtags?.join(', ') || ''}" placeholder="#태국식물, #희귀식물, #인테리어">
                </div>
                
                <div>
                    <label class="form-label">이미지 URL (선택사항)</label>
                    <input type="url" name="image_url" class="form-input" value="${post.image_url || ''}" placeholder="https://example.com/image.jpg">
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="updateSocialPost()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    포스트 수정
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function updateSocialPost() {
    const form = document.getElementById('edit-social-post-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const platforms = formData.getAll('platforms');
    if (platforms.length === 0) {
        showNotification('최소 하나의 플랫폼을 선택해주세요.', 'error');
        return;
    }
    
    const hashtags = formData.get('hashtags').split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const postId = formData.get('id');
    const postData = {
        title: formData.get('title'),
        content: formData.get('content'),
        platforms: platforms,
        hashtags: hashtags,
        image_url: formData.get('image_url'),
        scheduled_time: formData.get('scheduled_time')
    };
    
    try {
        // Update in memory
        const postIndex = adminDashboard.socialPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
            adminDashboard.socialPosts[postIndex] = {
                ...adminDashboard.socialPosts[postIndex],
                ...postData,
                updated_at: new Date().toISOString()
            };
            
            // Save to storage
            adminDashboard.saveSocialPostsToStorage();
            
            closeModal();
            adminDashboard.renderSocialPosts();
            showNotification('소셜미디어 포스트가 성공적으로 수정되었습니다.', 'success');
        } else {
            throw new Error('포스트를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error updating social post:', error);
        showNotification('포스트 수정 중 오류가 발생했습니다.', 'error');
    }
}

function deleteSocialPost(postId) {
    if (confirm('정말로 이 포스트를 삭제하시겠습니까?\n삭제된 포스트는 복구할 수 없습니다.')) {
        try {
            // Remove from memory
            adminDashboard.socialPosts = adminDashboard.socialPosts.filter(p => p.id !== postId);
            
            // Save to storage
            adminDashboard.saveSocialPostsToStorage();
            
            // Re-render social posts
            adminDashboard.renderSocialPosts();
            
            showNotification('소셜미디어 포스트가 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('Error deleting social post:', error);
            showNotification('포스트 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// Media Management Functions
function viewMedia(mediaId) {
    const media = adminDashboard.loadMediaFromStorage().find(m => m.id === mediaId);
    if (!media) {
        showNotification('미디어를 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">미디어 보기</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="text-center">
                ${media.type === 'image' ? 
                    `<img src="${media.url}" alt="${media.name}" class="max-w-full max-h-96 mx-auto rounded-lg">` :
                    `<video controls class="max-w-full max-h-96 mx-auto rounded-lg">
                        <source src="${media.url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`
                }
                
                <div class="mt-4 text-left">
                    <h3 class="text-lg font-semibold mb-2">${media.name}</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <span class="font-medium">파일 크기:</span>
                            <span class="ml-2">${adminDashboard.formatFileSize(media.size)}</span>
                        </div>
                        <div>
                            <span class="font-medium">파일 타입:</span>
                            <span class="ml-2">${media.type.toUpperCase()}</span>
                        </div>
                        <div>
                            <span class="font-medium">업로드 날짜:</span>
                            <span class="ml-2">${new Date(media.uploaded_at).toLocaleString('ko-KR')}</span>
                        </div>
                        <div>
                            <span class="font-medium">미디어 ID:</span>
                            <span class="ml-2 font-mono text-xs">${media.id}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    닫기
                </button>
                <button type="button" onclick="copyMediaUrl('${media.url}')" 
                        class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300">
                    URL 복사
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function copyMediaUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotification('미디어 URL이 클립보드에 복사되었습니다.', 'success');
    }).catch(() => {
        showNotification('URL 복사에 실패했습니다.', 'error');
    });
}

function deleteMedia(mediaId) {
    if (confirm('정말로 이 미디어를 삭제하시겠습니까?\n삭제된 미디어는 복구할 수 없습니다.')) {
        try {
            const media = adminDashboard.loadMediaFromStorage();
            const updatedMedia = media.filter(m => m.id !== mediaId);
            
            adminDashboard.saveMediaToStorage(updatedMedia);
            adminDashboard.renderMediaGallery();
            
            showNotification('미디어가 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('Error deleting media:', error);
            showNotification('미디어 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// Modal utility functions
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
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

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Event delegation for dynamically created modals
document.addEventListener('click', function(e) {
    // Close button click
    if (e.target.closest('[onclick*="closeModal"]')) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    }
    
    // Cancel button click
    if (e.target.closest('[onclick*="closeModal"]')) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    }
});

// Shop management global functions
function showAddShopModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">샵 추가</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="add-shop-form" class="space-y-4">
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">샵 이름 *</label>
                        <input type="text" name="name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">오너 이름 *</label>
                        <input type="text" name="owner_name" class="form-input" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">샵 설명 *</label>
                    <textarea name="description" class="form-input form-textarea" required></textarea>
                </div>
                
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">연락처 *</label>
                        <input type="email" name="contact" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">주소</label>
                        <input type="text" name="address" class="form-input">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">이미지 URL</label>
                    <input type="url" name="image_url" class="form-input" placeholder="https://example.com/image.jpg">
                </div>
                
                <div class="form-group">
                    <label class="flex items-center">
                        <input type="checkbox" name="is_active" checked class="mr-2">
                        <span>활성 상태</span>
                    </label>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="submitShop()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    샵 추가
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function submitShop() {
    const form = document.getElementById('add-shop-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const shopData = {
        id: Date.now().toString(),
        name: formData.get('name'),
        description: formData.get('description'),
        owner_name: formData.get('owner_name'),
        owner_id: 'owner_' + Date.now(),
        contact: formData.get('contact'),
        address: formData.get('address'),
        image_url: formData.get('image_url'),
        is_active: formData.get('is_active') === 'on',
        created_at: new Date().toISOString()
    };
    
    try {
        // Add to memory
        adminDashboard.shops.push(shopData);
        
        // Save to storage
        adminDashboard.saveShopsToStorage();
        
        closeModal();
        adminDashboard.renderShops();
        showNotification('샵이 성공적으로 추가되었습니다.', 'success');
    } catch (error) {
        console.error('Error adding shop:', error);
        showNotification('샵 추가 중 오류가 발생했습니다.', 'error');
    }
}

function editShop(shopId) {
    const shop = adminDashboard.shops.find(s => s.id === shopId);
    if (!shop) {
        showNotification('샵을 찾을 수 없습니다.', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">샵 수정</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="edit-shop-form" class="space-y-4">
                <input type="hidden" name="id" value="${shop.id}">
                
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">샵 이름 *</label>
                        <input type="text" name="name" class="form-input" value="${shop.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">오너 이름 *</label>
                        <input type="text" name="owner_name" class="form-input" value="${shop.owner_name}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">샵 설명 *</label>
                    <textarea name="description" class="form-input form-textarea" required>${shop.description}</textarea>
                </div>
                
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">연락처 *</label>
                        <input type="email" name="contact" class="form-input" value="${shop.contact}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">주소</label>
                        <input type="text" name="address" class="form-input" value="${shop.address || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">이미지 URL</label>
                    <input type="url" name="image_url" class="form-input" value="${shop.image_url || ''}" placeholder="https://example.com/image.jpg">
                </div>
                
                <div class="form-group">
                    <label class="flex items-center">
                        <input type="checkbox" name="is_active" ${shop.is_active ? 'checked' : ''} class="mr-2">
                        <span>활성 상태</span>
                    </label>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="updateShop()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    샵 수정
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger modal animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

async function updateShop() {
    const form = document.getElementById('edit-shop-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const shopId = formData.get('id');
    const shopData = {
        name: formData.get('name'),
        description: formData.get('description'),
        owner_name: formData.get('owner_name'),
        contact: formData.get('contact'),
        address: formData.get('address'),
        image_url: formData.get('image_url'),
        is_active: formData.get('is_active') === 'on'
    };
    
    try {
        const shopIndex = adminDashboard.shops.findIndex(s => s.id === shopId);
        if (shopIndex !== -1) {
            adminDashboard.shops[shopIndex] = {
                ...adminDashboard.shops[shopIndex],
                ...shopData
            };
            
            // Save to storage
            adminDashboard.saveShopsToStorage();
            
            closeModal();
            adminDashboard.renderShops();
            showNotification('샵이 성공적으로 수정되었습니다.', 'success');
        } else {
            throw new Error('샵을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error updating shop:', error);
        showNotification('샵 수정 중 오류가 발생했습니다.', 'error');
    }
}

function deleteShop(shopId) {
    if (confirm('정말로 이 샵을 삭제하시겠습니까?\n삭제된 샵은 복구할 수 없습니다.')) {
        try {
            // Check if any products are using this shop
            const productsInShop = adminDashboard.products.filter(p => p.shop_id === shopId);
            if (productsInShop.length > 0) {
                showNotification(`이 샵을 사용하는 상품이 ${productsInShop.length}개 있습니다. 먼저 상품의 샵을 변경해주세요.`, 'error');
                return;
            }
            
            // Remove from memory
            adminDashboard.shops = adminDashboard.shops.filter(s => s.id !== shopId);
            
            // Save to storage
            adminDashboard.saveShopsToStorage();
            
            // Re-render shops
            adminDashboard.renderShops();
            
            showNotification('샵이 성공적으로 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('Error deleting shop:', error);
            showNotification('샵 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// Facebook connection functions
async function connectToFacebook() {
    try {
        // Set a demo user ID for testing
        localStorage.setItem('currentUserId', 'demo_user_123');
        
        // Redirect to Facebook OAuth
        window.location.href = '/auth/facebook';
    } catch (error) {
        console.error('Error connecting to Facebook:', error);
        showNotification('Facebook 연결 중 오류가 발생했습니다.', 'error');
    }
}

async function checkFacebookConnection() {
    try {
        const userId = localStorage.getItem('currentUserId') || 'demo_user_123';
        
        // Check localStorage first for cached connection status
        const storedConnection = localStorage.getItem('facebookConnection');
        if (storedConnection) {
            const connectionData = JSON.parse(storedConnection);
            if (connectionData.connected && connectionData.userId === userId) {
                updateFacebookUI(true);
                return;
            }
        }
        
        // If not in localStorage, check server
        const response = await fetch(`/api/facebook/status/${userId}`);
        const status = await response.json();
        
        // Update UI
        updateFacebookUI(status.connected);
        
        // Save connection status to localStorage
        localStorage.setItem('facebookConnection', JSON.stringify({
            connected: status.connected,
            userId: userId,
            timestamp: Date.now()
        }));
        
    } catch (error) {
        console.error('Error checking Facebook connection:', error);
        updateFacebookUI(false);
    }
}

function updateFacebookUI(connected) {
    const statusElement = document.getElementById('facebook-status');
    const connectBtn = document.getElementById('facebook-connect-btn');
    
    if (connected) {
        statusElement.textContent = '연결됨';
        statusElement.className = 'text-2xl font-bold text-green-300';
        connectBtn.textContent = '연결됨';
        connectBtn.disabled = true;
        connectBtn.className = 'mt-2 px-4 py-2 bg-green-300 text-white rounded cursor-not-allowed';
    } else {
        statusElement.textContent = '연결 안됨';
        statusElement.className = 'text-2xl font-bold text-red-300';
        connectBtn.textContent = '연결하기';
        connectBtn.disabled = false;
        connectBtn.className = 'mt-2 px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100 transition duration-200';
    }
}

// Check for Facebook connection success/error in URL parameters
function checkFacebookAuthResult() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('facebook_connected') === 'true') {
        showNotification('Facebook이 성공적으로 연결되었습니다!', 'success');
        checkFacebookConnection();
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('facebook_error') === 'true') {
        showNotification('Facebook 연결에 실패했습니다. 다시 시도해주세요.', 'error');
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Add server sync function to AdminDashboard class
AdminDashboard.prototype.syncDataToServer = async function(type, data) {
    try {
        const response = await fetch('/api/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                data: data
            })
        });
        
        if (response.ok) {
            console.log(`${type} data synced to server successfully`);
        } else {
            console.warn(`Failed to sync ${type} data to server`);
        }
    } catch (error) {
        console.error(`Error syncing ${type} data to server:`, error);
    }
};

// Add renderGeneratedPosts function to AdminDashboard class
AdminDashboard.prototype.renderGeneratedPosts = function() {
    const container = document.getElementById('generated-posts-list');
    if (!container) return;

    if (generatedPosts.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <i class="fas fa-magic text-4xl mb-4"></i>
                <p>생성된 포스트가 없습니다</p>
                <p class="text-sm mt-2">상품 포스팅이나 관리팁을 생성해보세요!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = generatedPosts.map(post => `
        <div class="p-6">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPostTypeBadgeClass(post.type)}">
                            ${getPostTypeIcon(post.type)} ${getPostTypeName(post.type)}
                        </span>
                        <span class="ml-2 text-sm text-gray-500">${formatDate(post.createdAt)}</span>
                    </div>
                    <h4 class="font-semibold text-gray-900 mb-2">${post.title}</h4>
                    <p class="text-gray-700 mb-3 whitespace-pre-line">${post.content}</p>
                    ${post.hashtags && post.hashtags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mb-3">
                            ${post.hashtags.map(tag => `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">#${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="flex items-center text-sm text-gray-500">
                        <span class="mr-4">상태: ${getStatusBadge(post.status)}</span>
                        <span>플랫폼: ${post.platforms ? post.platforms.join(', ') : '미설정'}</span>
                    </div>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button onclick="editGeneratedPost('${post.id}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="publishGeneratedPost('${post.id}')" 
                            class="text-green-600 hover:text-green-800 text-sm">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button onclick="deleteGeneratedPost('${post.id}')" 
                            class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// Generated posts management
let generatedPosts = [];

// Load generated posts from storage
function loadGeneratedPosts() {
    try {
        const stored = localStorage.getItem('thaiPlantsGeneratedPosts');
        if (stored) {
            generatedPosts = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading generated posts:', error);
        generatedPosts = [];
    }
}

// Save generated posts to storage
function saveGeneratedPosts() {
    try {
        localStorage.setItem('thaiPlantsGeneratedPosts', JSON.stringify(generatedPosts));
    } catch (error) {
        console.error('Error saving generated posts:', error);
    }
}

// Generate product post
async function generateProductPost() {
    const productSelect = document.getElementById('product-select');
    const postStyle = document.getElementById('post-style');
    
    if (!productSelect.value) {
        showNotification('상품을 선택해주세요.', 'error');
        return;
    }
    
    const product = adminDashboard.products.find(p => p.id === productSelect.value);
    if (!product) {
        showNotification('선택한 상품을 찾을 수 없습니다.', 'error');
        return;
    }
    
    try {
        const post = await createProductPost(product, postStyle.value);
        generatedPosts.unshift(post);
        saveGeneratedPosts();
        if (adminDashboard) {
            adminDashboard.renderGeneratedPosts();
        }
        showNotification('상품 포스트가 생성되었습니다!', 'success');
    } catch (error) {
        console.error('Error generating product post:', error);
        showNotification('포스트 생성 중 오류가 발생했습니다.', 'error');
    }
}

// Generate care tip
async function generateCareTip() {
    const plantCategory = document.getElementById('plant-category');
    const tipType = document.getElementById('tip-type');
    
    if (!plantCategory.value) {
        showNotification('식물 카테고리를 선택해주세요.', 'error');
        return;
    }
    
    try {
        const post = await createCareTipPost(plantCategory.value, tipType.value);
        generatedPosts.unshift(post);
        saveGeneratedPosts();
        if (adminDashboard) {
            adminDashboard.renderGeneratedPosts();
        }
        showNotification('관리팁이 생성되었습니다!', 'success');
    } catch (error) {
        console.error('Error generating care tip:', error);
        showNotification('팁 생성 중 오류가 발생했습니다.', 'error');
    }
}

// Create product post
async function createProductPost(product, style) {
    const postTemplates = {
        promotional: {
            title: `🌿 ${product.name} 특가 판매!`,
            content: `✨ ${product.name}을 만나보세요!\n\n${product.description}\n\n💰 특가: ${product.price.toLocaleString()}원\n📦 재고: ${product.stock}개\n\n지금 주문하시면 특별 혜택을 드려요!`,
            hashtags: ['식물', '특가', '온라인쇼핑', product.category, '반려식물']
        },
        educational: {
            title: `🌱 ${product.name} 키우기 가이드`,
            content: `안녕하세요! 오늘은 ${product.name} 키우는 방법을 알려드릴게요.\n\n${product.description}\n\n💡 관리 팁:\n• 충분한 햇빛을 받도록 해주세요\n• 적절한 물주기로 건강하게 키워보세요\n• 정기적인 영양 공급이 필요해요\n\n이런 식물을 찾고 계셨다면 지금 만나보세요!`,
            hashtags: ['식물키우기', '가드닝', '반려식물', product.category, '식물관리']
        },
        lifestyle: {
            title: `🏠 ${product.name}로 인테리어 완성하기`,
            content: `집안이 더욱 아름다워지는 ${product.name}!\n\n${product.description}\n\n이 식물은 어떤 공간에 두어도 완벽한 포인트가 되어줄 거예요. 자연스러운 녹색이 주는 편안함을 느껴보세요.\n\n지금 바로 만나보세요!`,
            hashtags: ['인테리어', '홈데코', '식물', '라이프스타일', product.category]
        }
    };
    
    const template = postTemplates[style] || postTemplates.promotional;
    
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'product',
        title: template.title,
        content: template.content,
        hashtags: template.hashtags,
        productId: product.id,
        productName: product.name,
        style: style,
        status: 'draft',
        platforms: [],
        createdAt: Date.now(),
        images: product.images || []
    };
}

// Create care tip post
async function createCareTipPost(category, tipType) {
    const tipTemplates = {
        watering: {
            title: `💧 ${category} 물주기 완벽 가이드`,
            content: `${category} 물주기는 정말 중요해요!\n\n🌱 물주기 시기:\n• 흙이 마르면 충분히 물을 주세요\n• 겉흙이 2-3cm 마를 때가 적당해요\n• 과습보다는 건조가 낫습니다\n\n💡 팁: 손가락으로 흙을 확인해보세요!\n\n건강한 식물을 위한 첫 걸음, 물주기부터 시작해보세요!`,
            hashtags: ['물주기', '식물관리', category, '가드닝', '식물키우기']
        },
        lighting: {
            title: `☀️ ${category} 빛 관리의 모든 것`,
            content: `식물에게 빛은 생명과 같아요!\n\n🌞 빛 관리법:\n• 밝은 간접광이 가장 좋아요\n• 직사광선은 피해주세요\n• 하루 6-8시간 정도 충분한 빛을 주세요\n\n💡 팁: 창가에서 1-2m 떨어진 곳이 적당해요!\n\n올바른 빛 관리로 더욱 건강한 식물을 키워보세요!`,
            hashtags: ['조명', '식물관리', category, '빛관리', '식물키우기']
        },
        fertilizing: {
            title: `🌿 ${category} 비료 주기 완벽 가이드`,
            content: `식물도 영양이 필요해요!\n\n🌱 비료 주기:\n• 성장기(봄-여름)에 주 1회\n• 휴면기(가을-겨울)에는 월 1회\n• 희석해서 주는 것이 좋아요\n\n💡 팁: 과다 시비는 오히려 해로울 수 있어요!\n\n적절한 영양 공급으로 튼튼한 식물을 키워보세요!`,
            hashtags: ['비료', '식물관리', category, '영양', '식물키우기']
        },
        repotting: {
            title: `🪴 ${category} 분갈이 시기와 방법`,
            content: `식물이 자라면 새로운 집이 필요해요!\n\n🪴 분갈이 시기:\n• 뿌리가 화분 밖으로 나올 때\n• 1-2년에 한 번 정도\n• 봄철이 가장 좋아요\n\n💡 팁: 한 번에 한 사이즈만 큰 화분으로 옮기세요!\n\n새로운 화분에서 더욱 잘 자라는 식물을 만나보세요!`,
            hashtags: ['분갈이', '식물관리', category, '화분', '식물키우기']
        },
        pests: {
            title: `🐛 ${category} 해충 예방과 관리법`,
            content: `건강한 식물을 위한 해충 관리!\n\n🛡️ 예방법:\n• 통풍이 잘 되도록 해주세요\n• 과습을 피해주세요\n• 정기적으로 잎을 확인하세요\n\n💡 팁: 초기 발견이 중요해요!\n\n깨끗하고 건강한 식물을 위해 꾸준히 관리해보세요!`,
            hashtags: ['해충관리', '식물관리', category, '예방', '식물키우기']
        }
    };
    
    const template = tipTemplates[tipType] || tipTemplates.watering;
    
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'care_tip',
        title: template.title,
        content: template.content,
        hashtags: template.hashtags,
        category: category,
        tipType: tipType,
        status: 'draft',
        platforms: [],
        createdAt: Date.now(),
        images: []
    };
}

// Render generated posts (wrapper function)
function renderGeneratedPosts() {
    if (adminDashboard) {
        adminDashboard.renderGeneratedPosts();
    }
}

// Helper functions for generated posts
function getPostTypeBadgeClass(type) {
    const classes = {
        'product': 'bg-green-100 text-green-800',
        'care_tip': 'bg-blue-100 text-blue-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
}

function getPostTypeIcon(type) {
    const icons = {
        'product': '🛍️',
        'care_tip': '🌱'
    };
    return icons[type] || '📝';
}

function getPostTypeName(type) {
    const names = {
        'product': '상품 포스트',
        'care_tip': '관리팁'
    };
    return names[type] || '포스트';
}

function getStatusBadge(status) {
    const badges = {
        'draft': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">초안</span>',
        'scheduled': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">예약됨</span>',
        'published': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">게시됨</span>'
    };
    return badges[status] || '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">알 수 없음</span>';
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Edit generated post
function editGeneratedPost(postId) {
    const post = generatedPosts.find(p => p.id === postId);
    if (!post) return;
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-semibold mb-4">포스트 수정</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <input type="text" id="edit-post-title" value="${post.title}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plant-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">내용</label>
                    <textarea id="edit-post-content" rows="8" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plant-green">${post.content}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">해시태그 (쉼표로 구분)</label>
                    <input type="text" id="edit-post-hashtags" value="${post.hashtags.join(', ')}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-plant-green">
                </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
                <button onclick="closeEditModal()" 
                        class="px-4 py-2 text-gray-600 hover:text-gray-800">
                    취소
                </button>
                <button onclick="saveEditedPost('${postId}')" 
                        class="px-4 py-2 bg-plant-green text-white rounded-md hover:bg-green-600">
                    저장
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close edit modal
function closeEditModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

// Save edited post
function saveEditedPost(postId) {
    const post = generatedPosts.find(p => p.id === postId);
    if (!post) return;
    
    const title = document.getElementById('edit-post-title').value;
    const content = document.getElementById('edit-post-content').value;
    const hashtags = document.getElementById('edit-post-hashtags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    post.title = title;
    post.content = content;
    post.hashtags = hashtags;
    
    saveGeneratedPosts();
    if (adminDashboard) {
        adminDashboard.renderGeneratedPosts();
    }
    closeEditModal();
    showNotification('포스트가 수정되었습니다.', 'success');
}

// Publish generated post
function publishGeneratedPost(postId) {
    const post = generatedPosts.find(p => p.id === postId);
    if (!post) return;
    
    // Add to social posts
    const socialPost = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: `${post.title}\n\n${post.content}\n\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`,
        platform: 'facebook',
        scheduledDate: Date.now(),
        status: 'published',
        views: 0,
        likes: 0,
        shares: 0,
        images: post.images || []
    };
    
    adminDashboard.socialPosts.unshift(socialPost);
    adminDashboard.saveSocialPostsToStorage();
    adminDashboard.renderSocialPosts();
    
    post.status = 'published';
    post.platforms = ['facebook'];
    saveGeneratedPosts();
    if (adminDashboard) {
        adminDashboard.renderGeneratedPosts();
    }
    
    showNotification('포스트가 Facebook에 게시되었습니다!', 'success');
}

// Delete generated post
function deleteGeneratedPost(postId) {
    if (confirm('이 포스트를 삭제하시겠습니까?')) {
        generatedPosts = generatedPosts.filter(p => p.id !== postId);
        saveGeneratedPosts();
        if (adminDashboard) {
            adminDashboard.renderGeneratedPosts();
        }
        showNotification('포스트가 삭제되었습니다.', 'success');
    }
}

// Initialize admin dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
    adminDashboard.initialize();
    checkFacebookAuthResult();
    loadGeneratedPosts();
    
    // Load products and categories for dropdowns
    loadProductsForDropdown();
    loadCategoriesForDropdown();
    
    // Render generated posts after everything is loaded
    setTimeout(() => {
        if (adminDashboard) {
            adminDashboard.renderGeneratedPosts();
        }
    }, 100);
});

// Load products for dropdown
function loadProductsForDropdown() {
    const productSelect = document.getElementById('product-select');
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">상품을 선택하세요</option>';
    adminDashboard.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
}

// Load categories for dropdown
function loadCategoriesForDropdown() {
    const plantCategory = document.getElementById('plant-category');
    if (!plantCategory) return;

    plantCategory.innerHTML = '<option value="">카테고리를 선택하세요</option>';
    adminDashboard.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        plantCategory.appendChild(option);
    });
}

/* ===========================================
   REVIEWS MANAGEMENT
   =========================================== */

let reviewsData = [];
let reviewsPage = 1;
let reviewsFilter = 'all';

// Load reviews
async function loadReviews() {
    try {
        const response = await fetch(`/tables/reviews?page=${reviewsPage}&limit=50&approved=false`);
        const result = await response.json();
        reviewsData = result.data || [];
        renderReviews();
        updateReviewsStats();
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNotification('리뷰를 불러오는데 실패했습니다.', 'error');
    }
}

// Render reviews table
function renderReviews() {
    const tbody = document.getElementById('reviews-table-body');
    if (!tbody) return;

    const filteredReviews = filterReviewsByStatus();

    if (filteredReviews.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>리뷰가 없습니다.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredReviews.map(review => {
        const date = new Date(review.created_at).toLocaleDateString('ko-KR');
        const stars = renderStarsForAdmin(review.rating);
        const statusBadge = review.is_approved
            ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">승인됨</span>'
            : '<span class="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">대기중</span>';
        const verifiedBadge = review.is_verified
            ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs ml-1">인증</span>'
            : '';

        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(review.product_name || '알 수 없음')}</div>
                    <div class="text-sm text-gray-500">${escapeHtml(review.product_name_en || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${escapeHtml(review.customer_name)}</div>
                    <div class="text-sm text-gray-500">${escapeHtml(review.customer_email)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${stars}
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate">${escapeHtml(review.comment || '내용 없음')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}${verifiedBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${date}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex gap-2">
                        ${!review.is_approved ? `
                            <button onclick="approveReview(${review.id})"
                                    class="text-green-600 hover:text-green-900"
                                    title="승인">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button onclick="editReview(${review.id})"
                                class="text-blue-600 hover:text-blue-900"
                                title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteReview(${review.id})"
                                class="text-red-600 hover:text-red-900"
                                title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update pagination info
    document.getElementById('reviews-showing').textContent = filteredReviews.length;
    document.getElementById('reviews-total').textContent = reviewsData.length;
}

// Render stars for admin view
function renderStarsForAdmin(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating
            ? '<i class="fas fa-star text-yellow-400 text-sm"></i>'
            : '<i class="far fa-star text-gray-300 text-sm"></i>';
    }
    return stars;
}

// Filter reviews by status
function filterReviewsByStatus() {
    const searchTerm = document.getElementById('review-search')?.value.toLowerCase() || '';

    let filtered = reviewsData;

    // Apply status filter
    switch (reviewsFilter) {
        case 'approved':
            filtered = filtered.filter(r => r.is_approved);
            break;
        case 'pending':
            filtered = filtered.filter(r => !r.is_approved);
            break;
        case 'verified':
            filtered = filtered.filter(r => r.is_verified);
            break;
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(r =>
            (r.product_name && r.product_name.toLowerCase().includes(searchTerm)) ||
            (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm)) ||
            (r.customer_email && r.customer_email.toLowerCase().includes(searchTerm))
        );
    }

    return filtered;
}

// Update reviews statistics
function updateReviewsStats() {
    const totalReviews = reviewsData.length;
    const pendingReviews = reviewsData.filter(r => !r.is_approved).length;
    const verifiedReviews = reviewsData.filter(r => r.is_verified).length;
    const averageRating = totalReviews > 0
        ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : '0.0';

    document.getElementById('total-reviews-count').textContent = totalReviews;
    document.getElementById('pending-reviews-count').textContent = pendingReviews;
    document.getElementById('verified-reviews-count').textContent = verifiedReviews;
    document.getElementById('average-rating').textContent = averageRating;
}

// Approve review
async function approveReview(reviewId) {
    if (!confirm('이 리뷰를 승인하시겠습니까?')) return;

    try {
        const response = await fetch(`/api/reviews/${reviewId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        if (result.success) {
            showNotification('리뷰가 승인되었습니다.', 'success');
            await loadReviews();
        } else {
            showNotification(result.error || '리뷰 승인에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Error approving review:', error);
        showNotification('리뷰 승인 중 오류가 발생했습니다.', 'error');
    }
}

// Delete review
async function deleteReview(reviewId) {
    if (!confirm('이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        if (result.success) {
            showNotification('리뷰가 삭제되었습니다.', 'success');
            await loadReviews();
        } else {
            showNotification(result.error || '리뷰 삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('리뷰 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// Edit review (placeholder - would show modal for editing)
function editReview(reviewId) {
    const review = reviewsData.find(r => r.id === reviewId);
    if (!review) return;

    // TODO: Implement edit modal
    alert('리뷰 수정 기능은 곧 추가됩니다.\n\n' +
          `고객: ${review.customer_name}\n` +
          `평점: ${review.rating}점\n` +
          `내용: ${review.comment}`);
}

// Refresh reviews
function refreshReviews() {
    loadReviews();
}

// Filter reviews
function filterReviews() {
    reviewsFilter = document.getElementById('review-filter')?.value || 'all';
    renderReviews();
}

// Pagination functions
function loadPreviousReviews() {
    if (reviewsPage > 1) {
        reviewsPage--;
        loadReviews();
    }
}

function loadNextReviews() {
    reviewsPage++;
    loadReviews();
}

// HTML escape utility
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize reviews section when shown
const originalShowSection = window.showSection;
window.showSection = function(sectionName) {
    if (originalShowSection) {
        originalShowSection(sectionName);
    }

    if (sectionName === 'reviews') {
        loadReviews();
    } else if (sectionName === 'payments') {
        loadPayments();
    } else if (sectionName === 'shipments') {
        loadCarriers();
        loadShipments();
    } else if (sectionName === 'inventory') {
        loadInventoryAlerts();
    }
};

/* ===========================================
   PAYMENTS MANAGEMENT
   =========================================== */

let paymentsData = [];
let paymentsPage = 1;
let paymentsFilter = {
    status: 'all',
    provider: 'all'
};

// Load payments
async function loadPayments() {
    try {
        const response = await fetch(`/api/payments?page=${paymentsPage}&limit=50`);
        const result = await response.json();
        paymentsData = result.payments || [];
        renderPayments();
        updatePaymentsStats();
    } catch (error) {
        console.error('Error loading payments:', error);
        showNotification('결제 내역을 불러오는데 실패했습니다.', 'error');
    }
}

// Render payments table
function renderPayments() {
    const tbody = document.getElementById('payments-table-body');
    if (!tbody) return;

    const filteredPayments = filterPaymentsByStatus();

    if (filteredPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>결제 내역이 없습니다.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredPayments.map(payment => {
        const date = new Date(payment.created_at).toLocaleDateString('ko-KR');
        const statusBadge = getPaymentStatusBadge(payment.status);
        const providerBadge = getPaymentProviderBadge(payment.payment_provider);

        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">#${payment.id}</div>
                    <div class="text-sm text-gray-500">${payment.transaction_id || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${escapeHtml(payment.customer_name || '알 수 없음')}</div>
                    <div class="text-sm text-gray-500">${escapeHtml(payment.customer_email || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">${payment.amount.toLocaleString()} ${payment.currency}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${providerBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${date}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex gap-2">
                        <button onclick="viewPaymentDetails(${payment.id})"
                                class="text-blue-600 hover:text-blue-900"
                                title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update pagination info
    document.getElementById('payments-showing').textContent = filteredPayments.length;
    document.getElementById('payments-total').textContent = paymentsData.length;
}

// Get payment status badge
function getPaymentStatusBadge(status) {
    const badges = {
        completed: '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">완료</span>',
        pending: '<span class="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">대기중</span>',
        failed: '<span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">실패</span>'
    };
    return badges[status] || `<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">${status}</span>`;
}

// Get payment provider badge
function getPaymentProviderBadge(provider) {
    const badges = {
        stripe: '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"><i class="fab fa-stripe"></i> Stripe</span>',
        paypal: '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"><i class="fab fa-paypal"></i> PayPal</span>'
    };
    return badges[provider] || `<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">${provider}</span>`;
}

// Filter payments by status and provider
function filterPaymentsByStatus() {
    const searchTerm = document.getElementById('payment-search')?.value.toLowerCase() || '';

    let filtered = paymentsData;

    // Apply status filter
    if (paymentsFilter.status !== 'all') {
        filtered = filtered.filter(p => p.status === paymentsFilter.status);
    }

    // Apply provider filter
    if (paymentsFilter.provider !== 'all') {
        filtered = filtered.filter(p => p.payment_provider === paymentsFilter.provider);
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.customer_name && p.customer_name.toLowerCase().includes(searchTerm)) ||
            (p.customer_email && p.customer_email.toLowerCase().includes(searchTerm)) ||
            (p.id && p.id.toString().includes(searchTerm)) ||
            (p.transaction_id && p.transaction_id.toLowerCase().includes(searchTerm))
        );
    }

    return filtered;
}

// Update payments statistics
function updatePaymentsStats() {
    const totalPayments = paymentsData.length;
    const completedPayments = paymentsData.filter(p => p.status === 'completed').length;
    const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
    const totalAmount = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    document.getElementById('total-payments-count').textContent = totalPayments;
    document.getElementById('completed-payments-count').textContent = completedPayments;
    document.getElementById('pending-payments-count').textContent = pendingPayments;
    document.getElementById('total-payment-amount').textContent = totalAmount.toLocaleString() + ' ฿';
}

// View payment details
function viewPaymentDetails(paymentId) {
    const payment = paymentsData.find(p => p.id === paymentId);
    if (!payment) return;

    alert(`결제 상세 정보\n\n` +
          `결제 ID: ${payment.id}\n` +
          `거래 ID: ${payment.transaction_id || 'N/A'}\n` +
          `주문 ID: ${payment.order_id || 'N/A'}\n` +
          `금액: ${payment.amount} ${payment.currency}\n` +
          `결제 방법: ${payment.payment_method}\n` +
          `제공사: ${payment.payment_provider}\n` +
          `상태: ${payment.status}\n` +
          `고객: ${payment.customer_name || 'N/A'}\n` +
          `이메일: ${payment.customer_email || 'N/A'}\n` +
          `생성일: ${new Date(payment.created_at).toLocaleString('ko-KR')}`);
}

// Refresh payments
function refreshPayments() {
    loadPayments();
}

// Filter payments
function filterPayments() {
    paymentsFilter.status = document.getElementById('payment-status-filter')?.value || 'all';
    paymentsFilter.provider = document.getElementById('payment-provider-filter')?.value || 'all';
    renderPayments();
}

// Pagination functions
function loadPreviousPayments() {
    if (paymentsPage > 1) {
        paymentsPage--;
        loadPayments();
    }
}

function loadNextPayments() {
    paymentsPage++;
    loadPayments();
}

/* =====================================
   SHIPMENT MANAGEMENT FUNCTIONS
   ===================================== */

let shipmentsData = [];
let shipmentsPage = 1;
let shipmentsFilter = { status: 'all', carrier: 'all', search: '' };
let carriersData = [];

// Load carriers
async function loadCarriers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/shipping/carriers`);
        const data = await response.json();

        if (data.success) {
            carriersData = data.carriers;

            // Populate carrier filter
            const carrierFilter = document.getElementById('shipmentCarrierFilter');
            if (carrierFilter) {
                carrierFilter.innerHTML = '<option value="all">전체</option>';
                carriersData.forEach(carrier => {
                    const option = document.createElement('option');
                    option.value = carrier.code;
                    option.textContent = carrier.name;
                    carrierFilter.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading carriers:', error);
    }
}

// Load shipments
async function loadShipments() {
    try {
        const params = new URLSearchParams({
            page: shipmentsPage,
            limit: 50,
            status: shipmentsFilter.status,
            carrier: shipmentsFilter.carrier
        });

        const response = await fetch(`${API_BASE_URL}/api/shipments?${params}`);
        const data = await response.json();

        if (data.success) {
            shipmentsData = data.shipments || [];
            renderShipments();
            updateShipmentsStats();
        }
    } catch (error) {
        console.error('Error loading shipments:', error);
        alert('배송 데이터를 불러오는데 실패했습니다.');
    }
}

// Render shipments table
function renderShipments() {
    const tbody = document.getElementById('shipmentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filteredShipments = shipmentsData;

    // Apply search filter
    if (shipmentsFilter.search) {
        const searchLower = shipmentsFilter.search.toLowerCase();
        filteredShipments = filteredShipments.filter(shipment =>
            shipment.tracking_number?.toLowerCase().includes(searchLower) ||
            shipment.customer_name?.toLowerCase().includes(searchLower)
        );
    }

    if (filteredShipments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    배송 내역이 없습니다
                </td>
            </tr>
        `;
        return;
    }

    filteredShipments.forEach(shipment => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        const statusBadge = getShipmentStatusBadge(shipment.shipping_status);
        const shippedDate = shipment.shipped_at
            ? new Date(shipment.shipped_at).toLocaleDateString('ko-KR')
            : '-';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(shipment.tracking_number)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">#${shipment.order_id}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(shipment.customer_name || '-')}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(shipment.carrier_name)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${shippedDate}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="showShipmentDetails(${shipment.id})"
                        class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="showEditShipmentModal(${shipment.id})"
                        class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteShipment(${shipment.id})"
                        class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Update shipments statistics
function updateShipmentsStats() {
    const total = shipmentsData.length;
    const pending = shipmentsData.filter(s => s.shipping_status === 'pending').length;
    const inTransit = shipmentsData.filter(s => s.shipping_status === 'in_transit').length;
    const delivered = shipmentsData.filter(s => s.shipping_status === 'delivered').length;

    document.getElementById('totalShipments').textContent = total;
    document.getElementById('pendingShipments').textContent = pending;
    document.getElementById('inTransitShipments').textContent = inTransit;
    document.getElementById('deliveredShipments').textContent = delivered;
}

// Get shipment status badge HTML
function getShipmentStatusBadge(status) {
    const statusConfig = {
        'pending': { text: '배송 준비', class: 'bg-yellow-100 text-yellow-800' },
        'in_transit': { text: '배송 중', class: 'bg-blue-100 text-blue-800' },
        'out_for_delivery': { text: '배송 출발', class: 'bg-indigo-100 text-indigo-800' },
        'delivered': { text: '배송 완료', class: 'bg-green-100 text-green-800' },
        'failed': { text: '배송 실패', class: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}">${config.text}</span>`;
}

// Filter shipments
function filterShipments() {
    shipmentsFilter.status = document.getElementById('shipmentStatusFilter')?.value || 'all';
    shipmentsFilter.carrier = document.getElementById('shipmentCarrierFilter')?.value || 'all';
    shipmentsFilter.search = document.getElementById('shipmentSearchInput')?.value || '';

    shipmentsPage = 1;
    loadShipments();
}

// Refresh shipments
function refreshShipments() {
    shipmentsPage = 1;
    loadShipments();
}

// Show add shipment modal
function showAddShipmentModal() {
    alert('배송 등록 모달은 추후 구현 예정입니다.\n주문 관리에서 주문을 선택하여 배송 등록을 할 수 있습니다.');
}

// Show edit shipment modal
function showEditShipmentModal(shipmentId) {
    const shipment = shipmentsData.find(s => s.id === shipmentId);
    if (!shipment) {
        alert('배송 정보를 찾을 수 없습니다.');
        return;
    }

    const newStatus = prompt(
        `배송 상태를 변경하세요:\n\n` +
        `현재 상태: ${getStatusText(shipment.shipping_status)}\n\n` +
        `새 상태를 입력하세요:\n` +
        `- pending: 배송 준비\n` +
        `- in_transit: 배송 중\n` +
        `- out_for_delivery: 배송 출발\n` +
        `- delivered: 배송 완료\n` +
        `- failed: 배송 실패`,
        shipment.shipping_status
    );

    if (newStatus && newStatus !== shipment.shipping_status) {
        updateShipmentStatus(shipmentId, newStatus);
    }
}

// Update shipment status
async function updateShipmentStatus(shipmentId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shipping_status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            alert('배송 상태가 업데이트되었습니다.');
            loadShipments();
        } else {
            alert('배송 상태 업데이트에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('Error updating shipment:', error);
        alert('배송 상태 업데이트에 실패했습니다.');
    }
}

// Show shipment details
function showShipmentDetails(shipmentId) {
    const shipment = shipmentsData.find(s => s.id === shipmentId);
    if (!shipment) {
        alert('배송 정보를 찾을 수 없습니다.');
        return;
    }

    const details = `
배송 정보

송장번호: ${shipment.tracking_number}
주문번호: #${shipment.order_id}
고객명: ${shipment.customer_name || '-'}
택배사: ${shipment.carrier_name}
배송 상태: ${getStatusText(shipment.shipping_status)}

발송일: ${shipment.shipped_at ? new Date(shipment.shipped_at).toLocaleString('ko-KR') : '-'}
예상 배송일: ${shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleString('ko-KR') : '-'}
배송 완료일: ${shipment.delivered_at ? new Date(shipment.delivered_at).toLocaleString('ko-KR') : '-'}

메모: ${shipment.shipping_notes || '-'}
    `.trim();

    alert(details);
}

// Delete shipment
async function deleteShipment(shipmentId) {
    if (!confirm('이 배송 정보를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('배송 정보가 삭제되었습니다.');
            loadShipments();
        } else {
            alert('배송 정보 삭제에 실패했습니다: ' + (data.error || '알 수 없는 오류'));
        }
    } catch (error) {
        console.error('Error deleting shipment:', error);
        alert('배송 정보 삭제에 실패했습니다.');
    }
}

// Get status text in Korean
function getStatusText(status) {
    const statusMap = {
        'pending': '배송 준비',
        'in_transit': '배송 중',
        'out_for_delivery': '배송 출발',
        'delivered': '배송 완료',
        'failed': '배송 실패'
    };
    return statusMap[status] || status;
}

/* =====================================
   INVENTORY MANAGEMENT FUNCTIONS
   ===================================== */

let inventoryAlerts = [];
let lowStockProducts = [];
let currentInventoryTab = "alerts";

async function loadInventoryAlerts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/alerts?status=active`);
        const data = await response.json();
        if (data.success) {
            inventoryAlerts = data.alerts || [];
            renderInventoryAlerts();
            updateAlertStats();
        }
    } catch (error) { console.error("Error loading inventory alerts:", error); }
}

async function loadLowStockProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/low-stock`);
        const data = await response.json();
        if (data.success) {
            lowStockProducts = data.products || [];
            renderLowStockProducts();
        }
    } catch (error) { console.error("Error loading low stock products:", error); }
}

function renderInventoryAlerts() {
    const tbody = document.getElementById("alertsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (inventoryAlerts.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"6\" class=\"px-6 py-4 text-center text-gray-500\">활성 알림이 없습니다</td></tr>";
        return;
    }
    inventoryAlerts.forEach(alert => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-50";
        const alertTypeBadge = getAlertTypeBadge(alert.alert_type);
        const createdAt = new Date(alert.created_at).toLocaleDateString("ko-KR");
        row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(alert.product_name)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${alert.current_stock}</td>
            <td class="px-6 py-4 whitespace-nowrap">${alertTypeBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${createdAt}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${alert.notification_count}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="resolveAlert(${alert.id})" class="text-green-600 hover:text-green-900"><i class="fas fa-check"></i> 해결</button>
            </td>`;
        tbody.appendChild(row);
    });
}

function renderLowStockProducts() {
    const tbody = document.getElementById("lowStockTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (lowStockProducts.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"5\" class=\"px-6 py-4 text-center text-gray-500\">재고 부족 상품이 없습니다</td></tr>";
        return;
    }
    lowStockProducts.forEach(product => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-50";
        row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(product.name)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.stock_quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(product.category_name || "-")}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(product.price)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="restockProduct(${product.id})" class="text-green-600 hover:text-green-900"><i class="fas fa-plus"></i> 입고</button>
            </td>`;
        tbody.appendChild(row);
    });
}

function getAlertTypeBadge(alertType) {
    const badges = {
        "out_of_stock": "<span class=\"px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800\">재고 소진</span>",
        "critical_stock": "<span class=\"px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800\">긴급</span>",
        "low_stock": "<span class=\"px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800\">부족</span>"
    };
    return badges[alertType] || alertType;
}

function updateAlertStats() {
    const total = inventoryAlerts.length;
    const outOfStock = inventoryAlerts.filter(a => a.alert_type === "out_of_stock").length;
    const critical = inventoryAlerts.filter(a => a.alert_type === "critical_stock").length;
    const lowStock = inventoryAlerts.filter(a => a.alert_type === "low_stock").length;
    document.getElementById("totalAlerts").textContent = total;
    document.getElementById("outOfStockAlerts").textContent = outOfStock;
    document.getElementById("criticalAlerts").textContent = critical;
    document.getElementById("lowStockAlerts").textContent = lowStock;
}

function switchInventoryTab(tabName) {
    currentInventoryTab = tabName;
    document.querySelectorAll(".inventory-tab").forEach(tab => {
        tab.classList.remove("text-gray-700", "border-thai-green");
        tab.classList.add("text-gray-500", "border-transparent");
    });
    const activeTab = document.getElementById(`${tabName}Tab`) || document.getElementById("alertsTab");
    activeTab.classList.remove("text-gray-500", "border-transparent");
    activeTab.classList.add("text-gray-700", "border-thai-green");
    document.getElementById("alertsTabContent").classList.add("hidden");
    document.getElementById("lowStockTabContent").classList.add("hidden");
    document.getElementById("historyTabContent").classList.add("hidden");
    const contentId = tabName === "low-stock" ? "lowStockTabContent" : `${tabName}TabContent`;
    document.getElementById(contentId).classList.remove("hidden");
    if (tabName === "alerts") loadInventoryAlerts();
    else if (tabName === "low-stock") loadLowStockProducts();
    else if (tabName === "history") loadProductsForHistoryDropdown();
}

async function loadProductsForHistoryDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/tables/products?limit=1000`);
        const data = await response.json();
        const select = document.getElementById("historyProductSelect");
        if (select) {
            select.innerHTML = "<option value=\"\">상품을 선택하세요</option>";
            data.data.forEach(product => {
                const option = document.createElement("option");
                option.value = product.id;
                option.textContent = product.name;
                select.appendChild(option);
            });
        }
    } catch (error) { console.error("Error loading products:", error); }
}

async function loadInventoryHistory() {
    const productId = document.getElementById("historyProductSelect")?.value;
    if (!productId) {
        document.getElementById("historyContent").innerHTML = "<p class=\"text-gray-500 text-center py-8\">상품을 선택하여 재고 이력을 확인하세요</p>";
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/history/${productId}`);
        const data = await response.json();
        if (data.success) renderInventoryHistory(data.history || []);
    } catch (error) { console.error("Error loading inventory history:", error); }
}

function renderInventoryHistory(history) {
    const content = document.getElementById("historyContent");
    if (!content) return;
    if (history.length === 0) {
        content.innerHTML = "<p class=\"text-gray-500 text-center py-8\">재고 이력이 없습니다</p>";
        return;
    }
    let html = "<table class=\"min-w-full divide-y divide-gray-200\"><thead class=\"bg-gray-50\"><tr>";
    html += "<th class=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">일시</th>";
    html += "<th class=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">변경 유형</th>";
    html += "<th class=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">이전 수량</th>";
    html += "<th class=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">변경 수량</th>";
    html += "<th class=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">새 수량</th>";
    html += "<th class=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase\">사유</th>";
    html += "</tr></thead><tbody class=\"bg-white divide-y divide-gray-200\">";
    history.forEach(item => {
        const createdAt = new Date(item.created_at).toLocaleString("ko-KR");
        const changeClass = item.quantity_change > 0 ? "text-green-600" : "text-red-600";
        html += `<tr class=\"hover:bg-gray-50\">`;
        html += `<td class=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">${createdAt}</td>`;
        html += `<td class=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">${item.change_type}</td>`;
        html += `<td class=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">${item.previous_quantity}</td>`;
        html += `<td class=\"px-6 py-4 whitespace-nowrap text-sm font-medium ${changeClass}\">${item.quantity_change > 0 ? "+" : ""}${item.quantity_change}</td>`;
        html += `<td class=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">${item.new_quantity}</td>`;
        html += `<td class=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">${escapeHtml(item.reason || "-")}</td>`;
        html += `</tr>`;
    });
    html += "</tbody></table>";
    content.innerHTML = html;
}

async function resolveAlert(alertId) {
    if (!confirm("이 알림을 해결 처리하시겠습니까?")) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/alerts/${alertId}/resolve`, { method: "PUT" });
        const data = await response.json();
        if (data.success) { alert("알림이 해결되었습니다."); loadInventoryAlerts(); }
        else alert("알림 해결에 실패했습니다: " + (data.error || "알 수 없는 오류"));
    } catch (error) { console.error("Error resolving alert:", error); alert("알림 해결에 실패했습니다."); }
}

async function restockProduct(productId) {
    const quantity = prompt("입고할 수량을 입력하세요:");
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) return;
    const reason = prompt("입고 사유를 입력하세요 (선택사항):", "정기 입고") || "정기 입고";
    try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId, quantity_change: parseInt(quantity), reason: reason, changed_by: "admin" })
        });
        const data = await response.json();
        if (data.success) {
            alert(`재고가 업데이트되었습니다.\n이전: ${data.previous_quantity} → 현재: ${data.new_quantity}`);
            loadLowStockProducts();
            loadInventoryAlerts();
        } else alert("재고 업데이트에 실패했습니다: " + (data.error || "알 수 없는 오류"));
    } catch (error) { console.error("Error restocking product:", error); alert("재고 업데이트에 실패했습니다."); }
}

