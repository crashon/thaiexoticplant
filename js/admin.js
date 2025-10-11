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
                this.loadSocialPosts()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('데이터 로딩 중 오류가 발생했습니다.', 'error');
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('tables/products?limit=1000');
            const result = await response.json();
            this.products = result.data;
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('tables/categories?limit=100');
            const result = await response.json();
            this.categories = result.data;
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadOrders() {
        try {
            const response = await fetch('tables/orders?limit=1000');
            const result = await response.json();
            this.orders = result.data;
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    async loadSocialPosts() {
        try {
            const response = await fetch('tables/social_posts?limit=100');
            const result = await response.json();
            this.socialPosts = result.data;
        } catch (error) {
            console.error('Error loading social posts:', error);
        }
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
            case 'media':
                this.renderMediaGallery();
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

    renderMediaGallery() {
        const gallery = document.getElementById('media-gallery');
        if (!gallery) return;

        // For now, show placeholder
        gallery.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-images text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">미디어 파일을 업로드하여 갤러리를 만드세요.</p>
            </div>
        `;
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
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length) * 100;
            
            progressFill.style.width = progress + '%';
            statusText.textContent = `업로드 중... ${i + 1}/${files.length}`;
            
            // Simulate file upload (replace with actual upload logic)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        progressBar.classList.add('hidden');
        showNotification('파일이 성공적으로 업로드되었습니다.', 'success');
        this.renderMediaGallery();
    }
}

// Modal functions
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
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
}

function showAddCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
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
        is_active: formData.get('is_active') === 'on',
        images: [],
        videos: [],
        tags: []
    };
    
    try {
        const response = await fetch('tables/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            closeModal();
            await adminDashboard.loadProducts();
            adminDashboard.renderProducts();
            showNotification('상품이 성공적으로 추가되었습니다.', 'success');
        } else {
            throw new Error('상품 추가에 실패했습니다.');
        }
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
        name: formData.get('name'),
        description: formData.get('description'),
        image_url: formData.get('image_url'),
        is_active: formData.get('is_active') === 'on',
        sort_order: 0
    };
    
    try {
        const response = await fetch('tables/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            closeModal();
            await adminDashboard.loadCategories();
            adminDashboard.renderCategories();
            showNotification('카테고리가 성공적으로 추가되었습니다.', 'success');
        } else {
            throw new Error('카테고리 추가에 실패했습니다.');
        }
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
    // Implementation for editing products
    showNotification('상품 편집 기능은 준비 중입니다.', 'info');
}

function deleteProduct(productId) {
    if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        // Implementation for deleting products
        showNotification('상품 삭제 기능은 준비 중입니다.', 'info');
    }
}

function editCategory(categoryId) {
    showNotification('카테고리 편집 기능은 준비 중입니다.', 'info');
}

function deleteCategory(categoryId) {
    if (confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
        showNotification('카테고리 삭제 기능은 준비 중입니다.', 'info');
    }
}

function viewOrder(orderId) {
    showNotification('주문 상세보기 기능은 준비 중입니다.', 'info');
}

function editOrder(orderId) {
    showNotification('주문 편집 기능은 준비 중입니다.', 'info');
}

function exportProducts() {
    showNotification('상품 내보내기 기능은 준비 중입니다.', 'info');
}

// Initialize admin dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
    adminDashboard.initialize();
});