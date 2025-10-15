// Social Media Automation for Thai Exotic Plants

class SocialMediaManager {
    constructor() {
        this.platforms = {
            facebook: {
                name: 'Facebook',
                icon: 'fab fa-facebook',
                color: '#1877f2',
                connected: false,
                maxCharacters: 63206
            },
            instagram: {
                name: 'Instagram',
                icon: 'fab fa-instagram',
                color: '#e4405f',
                connected: false,
                maxCharacters: 2200
            },
            twitter: {
                name: 'Twitter (X)',
                icon: 'fab fa-twitter',
                color: '#000000',
                connected: false,
                maxCharacters: 280
            }
        };
        
        this.scheduledPosts = [];
        this.autoPostSettings = {
            enabled: false,
            frequency: 'daily', // daily, weekly, custom
            time: '10:00',
            platforms: ['facebook', 'instagram', 'twitter']
        };
    }

    // Initialize social media manager
    initialize() {
        this.loadScheduledPosts();
        this.setupEventListeners();
        this.checkAutoPostSchedule();
    }

    // Setup event listeners
    setupEventListeners() {
        // Platform connection buttons
        Object.keys(this.platforms).forEach(platform => {
            const connectBtn = document.getElementById(`connect-${platform}`);
            if (connectBtn) {
                connectBtn.addEventListener('click', () => this.connectPlatform(platform));
            }
        });

        // Auto-post settings
        const autoPostToggle = document.getElementById('auto-post-toggle');
        if (autoPostToggle) {
            autoPostToggle.addEventListener('change', (e) => {
                this.toggleAutoPost(e.target.checked);
            });
        }

        // Schedule post form
        const scheduleForm = document.getElementById('schedule-post-form');
        if (scheduleForm) {
            scheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.schedulePost();
            });
        }
    }

    // Load scheduled posts
    async loadScheduledPosts() {
        try {
            const response = await fetch('tables/social_posts?limit=100');
            
            // Check if response is HTML (404 page) instead of JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API endpoint not available, using fallback data');
            }
            
            const result = await response.json();
            this.scheduledPosts = result.data || [];
        } catch (error) {
            console.error('Error loading scheduled posts:', error);
            this.scheduledPosts = [];
        }
    }

    // Connect to social media platform
    async connectPlatform(platform) {
        // In a real implementation, this would open OAuth flow
        // For demonstration, we'll simulate connection
        
        showNotification(`${this.platforms[platform].name} 연결 중...`, 'info');
        
        // Simulate connection delay
        setTimeout(() => {
            this.platforms[platform].connected = true;
            showNotification(`${this.platforms[platform].name}에 성공적으로 연결되었습니다!`, 'success');
            this.updatePlatformStatus();
        }, 2000);
    }

    // Update platform connection status
    updatePlatformStatus() {
        Object.keys(this.platforms).forEach(platform => {
            const statusElement = document.getElementById(`${platform}-status`);
            if (statusElement) {
                const isConnected = this.platforms[platform].connected;
                statusElement.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="${this.platforms[platform].icon} text-2xl mr-3" 
                               style="color: ${this.platforms[platform].color}"></i>
                            <div>
                                <h4 class="font-semibold">${this.platforms[platform].name}</h4>
                                <p class="text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}">
                                    ${isConnected ? '연결됨' : '연결 안됨'}
                                </p>
                            </div>
                        </div>
                        <button onclick="socialMediaManager.${isConnected ? 'disconnect' : 'connect'}Platform('${platform}')"
                                class="px-4 py-2 rounded-lg text-sm ${isConnected ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}">
                            ${isConnected ? '연결 해제' : '연결하기'}
                        </button>
                    </div>
                `;
            }
        });
    }

    // Disconnect from platform
    disconnectPlatform(platform) {
        if (confirm(`${this.platforms[platform].name} 연결을 해제하시겠습니까?`)) {
            this.platforms[platform].connected = false;
            showNotification(`${this.platforms[platform].name} 연결이 해제되었습니다.`, 'info');
            this.updatePlatformStatus();
        }
    }

    // Toggle auto-posting
    toggleAutoPost(enabled) {
        this.autoPostSettings.enabled = enabled;
        
        if (enabled) {
            this.startAutoPosting();
            showNotification('자동 포스팅이 활성화되었습니다.', 'success');
        } else {
            this.stopAutoPosting();
            showNotification('자동 포스팅이 비활성화되었습니다.', 'info');
        }
        
        this.saveAutoPostSettings();
    }

    // Schedule a new post
    async schedulePost() {
        const form = document.getElementById('schedule-post-form');
        const formData = new FormData(form);
        
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            platforms: formData.getAll('platforms'),
            scheduled_time: new Date(formData.get('scheduled_datetime')).getTime(),
            hashtags: formData.get('hashtags') ? formData.get('hashtags').split(/[,\s]+/).map(tag => tag.replace('#', '')) : [],
            product_id: formData.get('product_id') || null,
            status: '예약',
            is_auto_generated: false,
            images: []
        };

        // Validate required fields
        if (!postData.title || !postData.content || postData.platforms.length === 0) {
            showNotification('필수 항목을 모두 입력해주세요.', 'error');
            return;
        }

        // Validate scheduled time
        if (postData.scheduled_time <= Date.now()) {
            showNotification('예약 시간은 현재 시간보다 나중이어야 합니다.', 'error');
            return;
        }

        // Check platform connections
        const unconnectedPlatforms = postData.platforms.filter(platform => !this.platforms[platform]?.connected);
        if (unconnectedPlatforms.length > 0) {
            showNotification(`다음 플랫폼이 연결되지 않았습니다: ${unconnectedPlatforms.join(', ')}`, 'error');
            return;
        }

        try {
            const response = await fetch('tables/social_posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                showNotification('포스트가 성공적으로 예약되었습니다.', 'success');
                form.reset();
                await this.loadScheduledPosts();
                this.renderScheduledPosts();
                closeModal();
            } else {
                throw new Error('포스트 예약에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error scheduling post:', error);
            showNotification('포스트 예약 중 오류가 발생했습니다.', 'error');
        }
    }

    // Generate automatic post from product
    async generateAutoPost(product) {
        const templates = [
            {
                title: `새로운 특이식물을 만나보세요! ${product.korean_name || product.name}`,
                content: `🌱 ${product.korean_name || product.name}\n\n${product.description}\n\n원산지: ${product.origin_location || '태국'}\n재배 난이도: ${product.difficulty_level || '중급'}\n\n#태국식물 #특이식물 #관엽식물 #식물키우기`,
                hashtags: ['태국식물', '특이식물', '관엽식물', '식물키우기', ...(product.tags || [])]
            },
            {
                title: `희귀한 ${product.korean_name || product.name}을 소개합니다! ✨`,
                content: `이 아름다운 식물을 여러분의 집에 들이세요 🏡\n\n✅ ${product.name}\n✅ ${product.korean_name}\n✅ 가격: ${product.price?.toLocaleString()} ฿\n\n#희귀식물 #인테리어식물 #태국직구`,
                hashtags: ['희귀식물', '인테리어식물', '태국직구', ...(product.tags || [])]
            },
            {
                title: `식물 애호가들을 위한 특별한 선택! 🌿`,
                content: `${product.korean_name || product.name}은 ${product.difficulty_level === '초보' ? '초보자도 쉽게 키울 수 있는' : '경험 있는 식물 부모에게 추천하는'} 식물입니다.\n\n${product.description}\n\n지금 주문하세요! 📞`,
                hashtags: ['식물추천', '식물관리', '그린인테리어', ...(product.tags || [])]
            }
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        
        const autoPost = {
            product_id: product.id,
            title: template.title,
            content: template.content,
            hashtags: template.hashtags,
            platforms: this.autoPostSettings.platforms,
            scheduled_time: this.getNextAutoPostTime(),
            status: '예약',
            is_auto_generated: true,
            images: product.images ? product.images.slice(0, 1) : []
        };

        try {
            const response = await fetch('tables/social_posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(autoPost)
            });

            if (response.ok) {
                console.log('Auto post generated for product:', product.name);
                await this.loadScheduledPosts();
                return true;
            }
        } catch (error) {
            console.error('Error generating auto post:', error);
        }

        return false;
    }

    // Get next auto-post time based on settings
    getNextAutoPostTime() {
        const now = new Date();
        const [hours, minutes] = this.autoPostSettings.time.split(':').map(Number);
        
        let nextPost = new Date();
        nextPost.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (nextPost <= now) {
            nextPost.setDate(nextPost.getDate() + 1);
        }
        
        // Adjust based on frequency
        if (this.autoPostSettings.frequency === 'weekly') {
            // Find next Monday (or stay on Monday if it's Monday)
            const daysUntilMonday = (8 - nextPost.getDay()) % 7;
            if (daysUntilMonday > 0) {
                nextPost.setDate(nextPost.getDate() + daysUntilMonday);
            }
        }
        
        return nextPost.getTime();
    }

    // Start auto-posting service
    startAutoPosting() {
        // Check every hour for posts to publish
        this.autoPostInterval = setInterval(() => {
            this.checkAndPublishPosts();
            this.generateAutoPostsIfNeeded();
        }, 60 * 60 * 1000); // 1 hour
        
        // Also check immediately
        this.checkAndPublishPosts();
    }

    // Stop auto-posting service
    stopAutoPosting() {
        if (this.autoPostInterval) {
            clearInterval(this.autoPostInterval);
            this.autoPostInterval = null;
        }
    }

    // Check for posts to publish
    async checkAndPublishPosts() {
        const now = Date.now();
        const postsToPublish = this.scheduledPosts.filter(
            post => post.status === '예약' && post.scheduled_time <= now
        );

        for (const post of postsToPublish) {
            await this.publishPost(post);
        }
    }

    // Publish a post to social media platforms
    async publishPost(post) {
        console.log('Publishing post:', post.title);
        
        // Simulate publishing to each platform
        for (const platform of post.platforms) {
            if (this.platforms[platform]?.connected) {
                try {
                    await this.publishToPlatform(post, platform);
                } catch (error) {
                    console.error(`Error publishing to ${platform}:`, error);
                }
            }
        }

        // Update post status
        try {
            await fetch(`tables/social_posts/${post.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: '게시완료' })
            });

            showNotification(`포스트가 게시되었습니다: ${post.title}`, 'success');
        } catch (error) {
            console.error('Error updating post status:', error);
        }

        await this.loadScheduledPosts();
    }

    // Publish to specific platform (simulated)
    async publishToPlatform(post, platform) {
        if (platform === 'facebook') {
            return await this.publishToFacebook(post);
        } else {
            // For other platforms, keep simulation for now
            console.log(`Publishing to ${platform}:`, {
                title: post.title,
                content: post.content,
                hashtags: post.hashtags,
                images: post.images
            });

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate random success/failure (90% success rate)
            if (Math.random() < 0.9) {
                return { success: true, postId: `${platform}_${Date.now()}` };
            } else {
                throw new Error(`Failed to publish to ${platform}`);
            }
        }
    }

    // Publish to Facebook using real API
    async publishToFacebook(post) {
        try {
            // Get current user ID (in a real app, this would come from authentication)
            const userId = this.getCurrentUserId();
            
            if (!userId) {
                throw new Error('User not authenticated. Please connect to Facebook first.');
            }

            // Check if user is connected to Facebook
            const statusResponse = await fetch(`/api/facebook/status/${userId}`);
            const status = await statusResponse.json();
            
            if (!status.connected) {
                throw new Error('Facebook not connected. Please connect to Facebook first.');
            }

            // Prepare the message
            let message = post.content;
            if (post.hashtags && post.hashtags.length > 0) {
                message += '\n\n' + post.hashtags.map(tag => `#${tag}`).join(' ');
            }

            // Prepare the request body
            const requestBody = {
                userId: userId,
                message: message
            };

            // Add image if available
            if (post.images && post.images.length > 0) {
                requestBody.imageUrl = post.images[0];
            }

            // Post to Facebook
            const response = await fetch('/api/facebook/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (result.success) {
                return {
                    success: true,
                    platform: 'facebook',
                    postId: result.postId,
                    message: result.message
                };
            } else {
                throw new Error(result.error || 'Failed to post to Facebook');
            }

        } catch (error) {
            console.error('Facebook posting error:', error);
            return {
                success: false,
                platform: 'facebook',
                error: error.message
            };
        }
    }

    // Get current user ID (simplified - in real app, use proper authentication)
    getCurrentUserId() {
        // For demo purposes, use a fixed user ID
        // In a real application, this would come from the authentication system
        return localStorage.getItem('currentUserId') || 'demo_user_123';
    }

    // Generate auto posts if needed
    async generateAutoPostsIfNeeded() {
        if (!this.autoPostSettings.enabled) return;

        // Check if we need to generate new auto posts
        const upcomingAutoPosts = this.scheduledPosts.filter(
            post => post.is_auto_generated && post.status === '예약'
        );

        // Generate posts for the next 7 days if we have less than 3 upcoming auto posts
        if (upcomingAutoPosts.length < 3) {
            try {
                // Get featured or random products
                const response = await fetch('tables/products?limit=10');
                const result = await response.json();
                const products = result.data || [];
                
                if (products.length > 0) {
                    const randomProduct = products[Math.floor(Math.random() * products.length)];
                    await this.generateAutoPost(randomProduct);
                }
            } catch (error) {
                console.error('Error generating auto posts:', error);
            }
        }
    }

    // Render scheduled posts
    renderScheduledPosts() {
        const container = document.getElementById('social-posts-list');
        if (!container) return;

        if (this.scheduledPosts.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center">
                    <i class="fas fa-calendar-alt text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">예약된 포스트가 없습니다.</p>
                    <button onclick="showAddSocialPostModal()" 
                            class="mt-4 bg-plant-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                        첫 번째 포스트 예약하기
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.scheduledPosts
            .sort((a, b) => a.scheduled_time - b.scheduled_time)
            .map(post => this.renderPostCard(post))
            .join('');
    }

    // Render individual post card
    renderPostCard(post) {
        const scheduledDate = new Date(post.scheduled_time);
        const isOverdue = post.status === '예약' && scheduledDate < new Date();
        
        return `
            <div class="p-6 border-b border-gray-200 ${isOverdue ? 'bg-red-50' : ''}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h4 class="font-semibold text-lg">${post.title}</h4>
                            ${post.is_auto_generated ? `
                                <span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    자동생성
                                </span>
                            ` : ''}
                            ${isOverdue ? `
                                <span class="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                    지연됨
                                </span>
                            ` : ''}
                        </div>
                        
                        <p class="text-gray-600 mb-3 line-clamp-3">${post.content}</p>
                        
                        <div class="flex items-center space-x-4 mb-3">
                            <div class="flex space-x-2">
                                ${post.platforms?.map(platform => `
                                    <span class="inline-flex items-center px-2 py-1 text-xs rounded" 
                                          style="background-color: ${this.platforms[platform]?.color}20; color: ${this.platforms[platform]?.color}">
                                        <i class="${this.platforms[platform]?.icon} mr-1"></i>
                                        ${this.platforms[platform]?.name}
                                    </span>
                                `).join('') || ''}
                            </div>
                            
                            <div class="flex items-center text-sm text-gray-500">
                                <i class="fas fa-clock mr-1"></i>
                                ${scheduledDate.toLocaleString('ko-KR')}
                            </div>
                        </div>
                        
                        ${post.hashtags && post.hashtags.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-2">
                                ${post.hashtags.slice(0, 8).map(tag => `
                                    <span class="text-xs text-blue-600">#${tag}</span>
                                `).join('')}
                                ${post.hashtags.length > 8 ? `
                                    <span class="text-xs text-gray-400">+${post.hashtags.length - 8}개</span>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        ${post.images && post.images.length > 0 ? `
                            <div class="flex space-x-2 mt-2">
                                ${post.images.slice(0, 3).map(image => `
                                    <img src="${image}" alt="포스트 이미지" class="w-16 h-16 object-cover rounded">
                                `).join('')}
                                ${post.images.length > 3 ? `
                                    <div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                        +${post.images.length - 3}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex items-center space-x-2 ml-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${this.getSocialStatusColor(post.status)}">
                            ${post.status}
                        </span>
                        
                        <div class="flex space-x-1">
                            ${post.status === '예약' ? `
                                <button onclick="socialMediaManager.publishPostNow('${post.id}')" 
                                        class="text-green-600 hover:text-green-800" title="지금 게시">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            ` : ''}
                            
                            <button onclick="socialMediaManager.editPost('${post.id}')" 
                                    class="text-blue-600 hover:text-blue-800" title="편집">
                                <i class="fas fa-edit"></i>
                            </button>
                            
                            <button onclick="socialMediaManager.deletePost('${post.id}')" 
                                    class="text-red-600 hover:text-red-800" title="삭제">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Get social status color
    getSocialStatusColor(status) {
        switch (status) {
            case '게시완료': return 'bg-green-100 text-green-800';
            case '예약': return 'bg-blue-100 text-blue-800';
            case '실패': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Publish post immediately
    async publishPostNow(postId) {
        const post = this.scheduledPosts.find(p => p.id === postId);
        if (post) {
            await this.publishPost(post);
        }
    }

    // Edit post
    editPost(postId) {
        const post = this.scheduledPosts.find(p => p.id === postId);
        if (post) {
            showEditSocialPostModal(post);
        }
    }

    // Delete post
    async deletePost(postId) {
        if (confirm('이 포스트를 삭제하시겠습니까?')) {
            try {
                await fetch(`tables/social_posts/${postId}`, {
                    method: 'DELETE'
                });
                
                showNotification('포스트가 삭제되었습니다.', 'success');
                await this.loadScheduledPosts();
                this.renderScheduledPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
                showNotification('포스트 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // Check auto-post schedule on initialization
    checkAutoPostSchedule() {
        // Load settings from localStorage
        const settings = localStorage.getItem('autoPostSettings');
        if (settings) {
            this.autoPostSettings = { ...this.autoPostSettings, ...JSON.parse(settings) };
        }

        // Start auto-posting if enabled
        if (this.autoPostSettings.enabled) {
            this.startAutoPosting();
        }
    }

    // Save auto-post settings
    saveAutoPostSettings() {
        localStorage.setItem('autoPostSettings', JSON.stringify(this.autoPostSettings));
    }
}

// Modal functions for social media
function showAddSocialPostModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content max-w-3xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">소셜미디어 포스트 예약</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="schedule-post-form" class="space-y-6">
                <div>
                    <label class="form-label">포스트 제목 *</label>
                    <input type="text" name="title" class="form-input" required 
                           placeholder="매력적인 제목을 작성하세요">
                </div>
                
                <div>
                    <label class="form-label">포스트 내용 *</label>
                    <textarea name="content" class="form-input form-textarea" rows="6" required
                              placeholder="고객들에게 전달하고 싶은 메시지를 작성하세요"></textarea>
                    <div class="text-right text-sm text-gray-500 mt-1">
                        <span id="content-counter">0</span> / 2200 자
                    </div>
                </div>
                
                <div>
                    <label class="form-label">해시태그</label>
                    <input type="text" name="hashtags" class="form-input" 
                           placeholder="태국식물, 특이식물, 관엽식물 (쉼표로 구분)">
                    <div class="text-sm text-gray-500 mt-1">쉼표나 공백으로 구분하여 입력하세요</div>
                </div>
                
                <div>
                    <label class="form-label">게시할 플랫폼 *</label>
                    <div class="grid grid-cols-3 gap-4">
                        ${Object.keys(socialMediaManager.platforms).map(platform => `
                            <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" name="platforms" value="${platform}" class="mr-3">
                                <i class="${socialMediaManager.platforms[platform].icon} text-xl mr-2" 
                                   style="color: ${socialMediaManager.platforms[platform].color}"></i>
                                <span>${socialMediaManager.platforms[platform].name}</span>
                                ${!socialMediaManager.platforms[platform].connected ? 
                                    '<span class="ml-2 text-xs text-red-500">(미연결)</span>' : ''}
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">예약 날짜 및 시간 *</label>
                        <input type="datetime-local" name="scheduled_datetime" class="form-input" required>
                    </div>
                    <div>
                        <label class="form-label">연관 상품 (선택사항)</label>
                        <select name="product_id" class="form-input">
                            <option value="">상품 선택</option>
                            <!-- Products will be loaded here -->
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="form-label">이미지 업로드</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id="post-images" multiple accept="image/*" class="hidden">
                        <i class="fas fa-images text-3xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500 mb-2">이미지를 선택하세요 (최대 4장)</p>
                        <button type="button" onclick="document.getElementById('post-images').click()" 
                                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200">
                            파일 선택
                        </button>
                    </div>
                    <div id="image-preview" class="grid grid-cols-4 gap-2 mt-4 hidden"></div>
                </div>
            </form>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="socialMediaManager.schedulePost()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    포스트 예약
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup character counter
    const contentTextarea = modal.querySelector('textarea[name="content"]');
    const counter = modal.querySelector('#content-counter');
    
    contentTextarea.addEventListener('input', () => {
        counter.textContent = contentTextarea.value.length;
    });
    
    // Set minimum datetime to current time
    const datetimeInput = modal.querySelector('input[type="datetime-local"]');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    datetimeInput.min = now.toISOString().slice(0, 16);
    
    // Setup image preview
    const imageInput = modal.querySelector('#post-images');
    const imagePreview = modal.querySelector('#image-preview');
    
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).slice(0, 4);
        
        if (files.length > 0) {
            imagePreview.classList.remove('hidden');
            imagePreview.innerHTML = files.map((file, index) => `
                <div class="relative">
                    <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}" 
                         class="w-full h-20 object-cover rounded">
                    <button type="button" onclick="this.parentElement.remove()" 
                            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ×
                    </button>
                </div>
            `).join('');
        } else {
            imagePreview.classList.add('hidden');
        }
    });
}

// Global instance
let socialMediaManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    socialMediaManager = new SocialMediaManager();
    socialMediaManager.initialize();
});