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

// Initialize admin dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
    adminDashboard.initialize();
});