// Social Media Automation System for Thai Exotic Plants

class SocialMediaAutomation {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.apiEndpoints = {
            facebook: 'https://graph.facebook.com/v18.0',
            instagram: 'https://graph.facebook.com/v18.0',
            twitter: 'https://api.twitter.com/2'
        };
        this.autoPostTemplates = {
            newProduct: {
                title: "🌱 새로운 희귀식물 도착!",
                content: "태국에서 직접 수집한 특별한 {product_name}이 도착했습니다! {description}",
                hashtags: ["#태국식물", "#희귀식물", "#새상품", "#식물", "#인테리어"]
            },
            rarePlant: {
                title: "✨ 희귀종 한정 판매",
                content: "매우 희귀한 {product_name}이 한정 수량으로 판매됩니다! {description}",
                hashtags: ["#희귀종", "#한정판매", "#태국식물", "#특별한식물"]
            },
            careTip: {
                title: "🌿 식물 관리 팁",
                content: "오늘의 식물 관리 팁: {tip_content}",
                hashtags: ["#식물관리", "#식물팁", "#식물키우기", "#관엽식물"]
            },
            seasonal: {
                title: "🌸 계절별 식물 관리",
                content: "이번 계절에 주의해야 할 식물 관리법을 알려드립니다!",
                hashtags: ["#계절관리", "#식물관리", "#계절별", "#식물팁"]
            }
        };
        this.careTips = [
            "물을 줄 때는 흙이 완전히 마른 후에 충분히 주세요",
            "직사광선을 피하고 밝은 간접광에 두세요",
            "잎에 먼지가 쌓이면 젖은 천으로 닦아주세요",
            "겨울철에는 물주기 횟수를 줄이세요",
            "통풍이 잘 되는 곳에 두세요",
            "잎이 노랗게 변하면 물을 줄여보세요",
            "새싹이 나오면 충분한 수분을 공급하세요",
            "화분 바닥에 배수구가 있는지 확인하세요"
        ];
    }

    // 자동화 시스템 시작
    start() {
        if (this.isRunning) {
            console.log('소셜미디어 자동화가 이미 실행 중입니다.');
            return;
        }

        this.isRunning = true;
        console.log('소셜미디어 자동화 시스템을 시작합니다...');
        
        // 1분마다 예약된 포스트 확인
        this.checkInterval = setInterval(() => {
            this.checkScheduledPosts();
        }, 60000); // 1분

        // 즉시 한 번 실행
        this.checkScheduledPosts();
        
        // 상품 기반 자동 포스트 생성 (매일 오전 9시)
        this.scheduleAutoPosts();
        
        showNotification('소셜미디어 자동화 시스템이 시작되었습니다.', 'success');
    }

    // 자동화 시스템 중지
    stop() {
        if (!this.isRunning) {
            console.log('소셜미디어 자동화가 실행 중이 아닙니다.');
            return;
        }

        this.isRunning = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        console.log('소셜미디어 자동화 시스템이 중지되었습니다.');
        showNotification('소셜미디어 자동화 시스템이 중지되었습니다.', 'info');
    }

    // 예약된 포스트 확인 및 게시
    async checkScheduledPosts() {
        try {
            const socialPosts = this.loadSocialPosts();
            const now = new Date();
            
            for (const post of socialPosts) {
                if (post.status === '예약' && new Date(post.scheduled_time) <= now) {
                    await this.publishPost(post);
                }
            }
        } catch (error) {
            console.error('예약된 포스트 확인 중 오류:', error);
        }
    }

    // 포스트 게시
    async publishPost(post) {
        try {
            console.log(`포스트 게시 시작: ${post.title}`);
            
            for (const platform of post.platforms) {
                const success = await this.publishToPlatform(platform, post);
                
                if (success) {
                    console.log(`${platform}에 성공적으로 게시되었습니다.`);
                } else {
                    console.error(`${platform} 게시에 실패했습니다.`);
                }
            }
            
            // 포스트 상태 업데이트
            this.updatePostStatus(post.id, '게시완료');
            
            showNotification(`포스트 "${post.title}"가 성공적으로 게시되었습니다.`, 'success');
            
        } catch (error) {
            console.error('포스트 게시 중 오류:', error);
            this.updatePostStatus(post.id, '실패');
            showNotification(`포스트 게시 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    // 플랫폼별 게시
    async publishToPlatform(platform, post) {
        // 실제 API 연동 대신 시뮬레이션
        return new Promise((resolve) => {
            setTimeout(() => {
                // 90% 성공률로 시뮬레이션
                const success = Math.random() > 0.1;
                resolve(success);
            }, 1000 + Math.random() * 2000); // 1-3초 지연
        });
    }

    // 상품 기반 자동 포스트 생성
    async generateProductAutoPosts() {
        try {
            const products = this.loadProducts();
            const featuredProducts = products.filter(p => p.is_featured && p.is_active);
            const rareProducts = products.filter(p => p.is_rare && p.is_active);
            
            // 추천 상품 포스트 생성
            if (featuredProducts.length > 0) {
                const randomProduct = featuredProducts[Math.floor(Math.random() * featuredProducts.length)];
                await this.createAutoPost('newProduct', randomProduct);
            }
            
            // 희귀종 포스트 생성
            if (rareProducts.length > 0) {
                const randomRare = rareProducts[Math.floor(Math.random() * rareProducts.length)];
                await this.createAutoPost('rarePlant', randomRare);
            }
            
        } catch (error) {
            console.error('상품 기반 자동 포스트 생성 중 오류:', error);
        }
    }

    // 자동 포스트 생성
    async createAutoPost(templateType, product) {
        const template = this.autoPostTemplates[templateType];
        if (!template) return;

        const content = template.content
            .replace('{product_name}', product.name)
            .replace('{description}', product.description || '')
            .replace('{tip_content}', this.getRandomCareTip());

        const postData = {
            id: Date.now().toString(),
            title: template.title,
            content: content,
            platforms: ['facebook', 'instagram', 'twitter'],
            hashtags: template.hashtags,
            image_url: product.images && product.images.length > 0 ? product.images[0] : null,
            status: '예약',
            scheduled_time: this.getNextPostTime(),
            is_auto_generated: true,
            created_at: new Date().toISOString()
        };

        this.saveSocialPost(postData);
        console.log(`자동 포스트 생성됨: ${postData.title}`);
    }

    // 관리 팁 기반 자동 포스트 생성
    async generateCareTipPost() {
        const tip = this.getRandomCareTip();
        const postData = {
            id: Date.now().toString(),
            title: this.autoPostTemplates.careTip.title,
            content: this.autoPostTemplates.careTip.content.replace('{tip_content}', tip),
            platforms: ['facebook', 'instagram'],
            hashtags: this.autoPostTemplates.careTip.hashtags,
            status: '예약',
            scheduled_time: this.getNextPostTime(),
            is_auto_generated: true,
            created_at: new Date().toISOString()
        };

        this.saveSocialPost(postData);
        console.log(`관리 팁 포스트 생성됨: ${postData.title}`);
    }

    // 계절별 자동 포스트 생성
    async generateSeasonalPost() {
        const currentMonth = new Date().getMonth() + 1;
        let seasonalContent = '';
        
        if (currentMonth >= 3 && currentMonth <= 5) {
            seasonalContent = '봄철 식물들은 새로운 성장을 시작합니다. 충분한 햇빛과 적절한 수분을 공급해주세요.';
        } else if (currentMonth >= 6 && currentMonth <= 8) {
            seasonalContent = '여름철에는 직사광선을 피하고 습도를 높여주세요. 물주기 횟수를 늘려주는 것이 좋습니다.';
        } else if (currentMonth >= 9 && currentMonth <= 11) {
            seasonalContent = '가을철에는 식물들이 휴식기에 들어갑니다. 물주기를 줄이고 실내 온도를 유지해주세요.';
        } else {
            seasonalContent = '겨울철에는 식물들이 성장이 둔화됩니다. 따뜻한 곳에 두고 물주기를 최소화하세요.';
        }

        const postData = {
            id: Date.now().toString(),
            title: this.autoPostTemplates.seasonal.title,
            content: this.autoPostTemplates.seasonal.content + ' ' + seasonalContent,
            platforms: ['facebook', 'instagram', 'twitter'],
            hashtags: this.autoPostTemplates.seasonal.hashtags,
            status: '예약',
            scheduled_time: this.getNextPostTime(),
            is_auto_generated: true,
            created_at: new Date().toISOString()
        };

        this.saveSocialPost(postData);
        console.log(`계절별 포스트 생성됨: ${postData.title}`);
    }

    // 자동 포스트 스케줄링
    scheduleAutoPosts() {
        // 매일 오전 9시에 상품 기반 포스트 생성
        this.scheduleDaily(() => {
            this.generateProductAutoPosts();
        }, 9, 0);

        // 매일 오후 2시에 관리 팁 포스트 생성
        this.scheduleDaily(() => {
            this.generateCareTipPost();
        }, 14, 0);

        // 매주 월요일 오전 10시에 계절별 포스트 생성
        this.scheduleWeekly(() => {
            this.generateSeasonalPost();
        }, 1, 10, 0);
    }

    // 매일 특정 시간에 실행
    scheduleDaily(callback, hour, minute) {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);
        
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilNext = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
            callback();
            // 다음날 같은 시간에 다시 실행
            setInterval(callback, 24 * 60 * 60 * 1000);
        }, timeUntilNext);
    }

    // 매주 특정 요일에 실행
    scheduleWeekly(callback, dayOfWeek, hour, minute) {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);
        
        const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
        scheduledTime.setDate(now.getDate() + daysUntilTarget);
        
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 7);
        }
        
        const timeUntilNext = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
            callback();
            // 매주 같은 시간에 다시 실행
            setInterval(callback, 7 * 24 * 60 * 60 * 1000);
        }, timeUntilNext);
    }

    // 다음 포스트 시간 계산 (1-3시간 후)
    getNextPostTime() {
        const now = new Date();
        const randomHours = 1 + Math.random() * 2; // 1-3시간
        const nextTime = new Date(now.getTime() + randomHours * 60 * 60 * 1000);
        return nextTime.toISOString();
    }

    // 랜덤 관리 팁 선택
    getRandomCareTip() {
        return this.careTips[Math.floor(Math.random() * this.careTips.length)];
    }

    // 포스트 상태 업데이트
    updatePostStatus(postId, status) {
        const socialPosts = this.loadSocialPosts();
        const postIndex = socialPosts.findIndex(p => p.id === postId);
        
        if (postIndex !== -1) {
            socialPosts[postIndex].status = status;
            socialPosts[postIndex].updated_at = new Date().toISOString();
            this.saveSocialPosts(socialPosts);
        }
    }

    // 데이터 로드/저장 메서드들
    loadSocialPosts() {
        try {
            const stored = localStorage.getItem('thaiPlantsSocialPosts');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('소셜 포스트 로드 중 오류:', error);
            return [];
        }
    }

    saveSocialPost(post) {
        const socialPosts = this.loadSocialPosts();
        socialPosts.push(post);
        this.saveSocialPosts(socialPosts);
    }

    saveSocialPosts(posts) {
        try {
            localStorage.setItem('thaiPlantsSocialPosts', JSON.stringify(posts));
        } catch (error) {
            console.error('소셜 포스트 저장 중 오류:', error);
        }
    }

    loadProducts() {
        try {
            const stored = localStorage.getItem('thaiPlantsProducts');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('상품 로드 중 오류:', error);
            return [];
        }
    }

    // 자동화 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextCheck: this.checkInterval ? '실행 중' : '중지됨',
            totalPosts: this.loadSocialPosts().length,
            scheduledPosts: this.loadSocialPosts().filter(p => p.status === '예약').length,
            publishedPosts: this.loadSocialPosts().filter(p => p.status === '게시완료').length
        };
    }

    // 수동으로 자동 포스트 생성
    async createManualAutoPost(type) {
        switch (type) {
            case 'product':
                await this.generateProductAutoPosts();
                break;
            case 'care_tip':
                await this.generateCareTipPost();
                break;
            case 'seasonal':
                await this.generateSeasonalPost();
                break;
            default:
                console.log('알 수 없는 포스트 타입입니다.');
        }
    }
}

// 전역 인스턴스 생성
window.socialAutomation = new SocialMediaAutomation();

// 관리자 대시보드에 자동화 컨트롤 추가
function addAutomationControls() {
    const socialSection = document.getElementById('social-section');
    if (!socialSection) return;

    // 자동화 컨트롤 패널 추가
    const automationPanel = document.createElement('div');
    automationPanel.className = 'bg-white p-6 rounded-lg shadow-md mb-6';
    automationPanel.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">자동화 설정</h3>
            <div class="flex items-center space-x-4">
                <span id="automation-status" class="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                    중지됨
                </span>
                <button id="toggle-automation" onclick="toggleSocialAutomation()" 
                        class="bg-plant-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                    시작
                </button>
            </div>
        </div>
        
        <div class="grid md:grid-cols-3 gap-4 mb-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-plant-green" id="total-posts-count">0</div>
                <div class="text-sm text-gray-600">총 포스트</div>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600" id="scheduled-posts-count">0</div>
                <div class="text-sm text-gray-600">예약된 포스트</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600" id="published-posts-count">0</div>
                <div class="text-sm text-gray-600">게시 완료</div>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
            <button onclick="createAutoPost('product')" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
                상품 포스트 생성
            </button>
            <button onclick="createAutoPost('care_tip')" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300">
                관리 팁 생성
            </button>
            <button onclick="createAutoPost('seasonal')" 
                    class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-300">
                계절별 포스트 생성
            </button>
            <button onclick="refreshAutomationStats()" 
                    class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-300">
                통계 새로고침
            </button>
        </div>
    `;

    // 기존 컨텐츠 앞에 삽입
    socialSection.insertBefore(automationPanel, socialSection.firstChild);
    
    // 통계 업데이트
    refreshAutomationStats();
}

// 자동화 토글 함수
function toggleSocialAutomation() {
    const status = window.socialAutomation.getStatus();
    const button = document.getElementById('toggle-automation');
    const statusSpan = document.getElementById('automation-status');
    
    if (status.isRunning) {
        window.socialAutomation.stop();
        button.textContent = '시작';
        button.className = 'bg-plant-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300';
        statusSpan.textContent = '중지됨';
        statusSpan.className = 'px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700';
    } else {
        window.socialAutomation.start();
        button.textContent = '중지';
        button.className = 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300';
        statusSpan.textContent = '실행 중';
        statusSpan.className = 'px-3 py-1 text-sm rounded-full bg-green-100 text-green-700';
    }
    
    refreshAutomationStats();
}

// 자동 포스트 생성 함수
function createAutoPost(type) {
    window.socialAutomation.createManualAutoPost(type);
    showNotification(`${type} 자동 포스트가 생성되었습니다.`, 'success');
    refreshAutomationStats();
    
    // 소셜 포스트 목록 새로고침
    if (window.adminDashboard) {
        window.adminDashboard.renderSocialPosts();
    }
}

// 통계 새로고침 함수
function refreshAutomationStats() {
    const status = window.socialAutomation.getStatus();
    
    document.getElementById('total-posts-count').textContent = status.totalPosts;
    document.getElementById('scheduled-posts-count').textContent = status.scheduledPosts;
    document.getElementById('published-posts-count').textContent = status.publishedPosts;
}

// 페이지 로드 시 자동화 컨트롤 추가
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addAutomationControls, 1000);
});
