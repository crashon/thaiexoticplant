// Social Media API Simulator for Thai Exotic Plants
// 실제 API 연동을 위한 시뮬레이션 시스템

class SocialMediaAPISimulator {
    constructor() {
        this.apiKeys = {
            facebook: 'fb_simulated_key_12345',
            instagram: 'ig_simulated_key_67890',
            twitter: 'tw_simulated_key_abcde'
        };
        this.rateLimits = {
            facebook: { posts: 25, remaining: 25, resetTime: Date.now() + 3600000 },
            instagram: { posts: 25, remaining: 25, resetTime: Date.now() + 3600000 },
            twitter: { posts: 300, remaining: 300, resetTime: Date.now() + 900000 }
        };
        this.postHistory = [];
    }

    // Facebook API 시뮬레이션
    async postToFacebook(postData) {
        console.log('Facebook API 호출 시뮬레이션:', postData);
        
        // Rate limit 체크
        if (this.rateLimits.facebook.remaining <= 0) {
            throw new Error('Facebook API rate limit exceeded');
        }

        // 시뮬레이션 지연 (1-3초)
        await this.simulateDelay(1000, 3000);

        // 95% 성공률
        const success = Math.random() > 0.05;
        
        if (success) {
            this.rateLimits.facebook.remaining--;
            const postId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.postHistory.push({
                platform: 'facebook',
                postId: postId,
                content: postData.content,
                timestamp: new Date().toISOString(),
                status: 'published'
            });

            return {
                success: true,
                postId: postId,
                message: 'Facebook에 성공적으로 게시되었습니다.',
                url: `https://facebook.com/posts/${postId}`
            };
        } else {
            throw new Error('Facebook API 오류: 게시에 실패했습니다.');
        }
    }

    // Instagram API 시뮬레이션
    async postToInstagram(postData) {
        console.log('Instagram API 호출 시뮬레이션:', postData);
        
        if (this.rateLimits.instagram.remaining <= 0) {
            throw new Error('Instagram API rate limit exceeded');
        }

        await this.simulateDelay(1500, 4000);

        const success = Math.random() > 0.08; // 92% 성공률
        
        if (success) {
            this.rateLimits.instagram.remaining--;
            const postId = `ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.postHistory.push({
                platform: 'instagram',
                postId: postId,
                content: postData.content,
                timestamp: new Date().toISOString(),
                status: 'published'
            });

            return {
                success: true,
                postId: postId,
                message: 'Instagram에 성공적으로 게시되었습니다.',
                url: `https://instagram.com/p/${postId}`
            };
        } else {
            throw new Error('Instagram API 오류: 게시에 실패했습니다.');
        }
    }

    // Twitter API 시뮬레이션
    async postToTwitter(postData) {
        console.log('Twitter API 호출 시뮬레이션:', postData);
        
        if (this.rateLimits.twitter.remaining <= 0) {
            throw new Error('Twitter API rate limit exceeded');
        }

        await this.simulateDelay(800, 2500);

        const success = Math.random() > 0.03; // 97% 성공률
        
        if (success) {
            this.rateLimits.twitter.remaining--;
            const postId = `tw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.postHistory.push({
                platform: 'twitter',
                postId: postId,
                content: postData.content,
                timestamp: new Date().toISOString(),
                status: 'published'
            });

            return {
                success: true,
                postId: postId,
                message: 'Twitter에 성공적으로 게시되었습니다.',
                url: `https://twitter.com/status/${postId}`
            };
        } else {
            throw new Error('Twitter API 오류: 게시에 실패했습니다.');
        }
    }

    // 통합 포스팅 함수
    async publishToAllPlatforms(postData) {
        const results = [];
        const platforms = postData.platforms || ['facebook', 'instagram', 'twitter'];

        for (const platform of platforms) {
            try {
                let result;
                switch (platform) {
                    case 'facebook':
                        result = await this.postToFacebook(postData);
                        break;
                    case 'instagram':
                        result = await this.postToInstagram(postData);
                        break;
                    case 'twitter':
                        result = await this.postToTwitter(postData);
                        break;
                    default:
                        throw new Error(`지원하지 않는 플랫폼: ${platform}`);
                }
                results.push({ platform, ...result });
            } catch (error) {
                results.push({ 
                    platform, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        return results;
    }

    // API 상태 조회
    getAPIStatus() {
        return {
            rateLimits: this.rateLimits,
            totalPosts: this.postHistory.length,
            recentPosts: this.postHistory.slice(-10),
            apiKeys: Object.keys(this.apiKeys).reduce((acc, key) => {
                acc[key] = this.apiKeys[key] ? '설정됨' : '미설정';
                return acc;
            }, {})
        };
    }

    // Rate limit 리셋 (시뮬레이션)
    resetRateLimits() {
        this.rateLimits.facebook = { posts: 25, remaining: 25, resetTime: Date.now() + 3600000 };
        this.rateLimits.instagram = { posts: 25, remaining: 25, resetTime: Date.now() + 3600000 };
        this.rateLimits.twitter = { posts: 300, remaining: 300, resetTime: Date.now() + 900000 };
        
        console.log('API Rate limits가 리셋되었습니다.');
    }

    // 지연 시뮬레이션
    simulateDelay(min, max) {
        const delay = min + Math.random() * (max - min);
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 포스트 통계
    getPostStatistics() {
        const stats = {
            total: this.postHistory.length,
            byPlatform: {},
            byStatus: {},
            recent: this.postHistory.slice(-24) // 최근 24개
        };

        this.postHistory.forEach(post => {
            // 플랫폼별 통계
            stats.byPlatform[post.platform] = (stats.byPlatform[post.platform] || 0) + 1;
            
            // 상태별 통계
            stats.byStatus[post.status] = (stats.byStatus[post.status] || 0) + 1;
        });

        return stats;
    }

    // 해시태그 분석
    analyzeHashtags(posts) {
        const hashtagCount = {};
        
        posts.forEach(post => {
            const hashtags = post.content.match(/#\w+/g) || [];
            hashtags.forEach(tag => {
                hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
            });
        });

        return Object.entries(hashtagCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20); // 상위 20개
    }

    // 최적 게시 시간 분석 (시뮬레이션)
    getOptimalPostingTimes() {
        return {
            facebook: ['09:00', '13:00', '15:00', '19:00'],
            instagram: ['08:00', '12:00', '17:00', '20:00'],
            twitter: ['09:00', '12:00', '15:00', '18:00', '21:00']
        };
    }

    // 포스트 성과 분석 (시뮬레이션)
    getPostPerformance(postId) {
        // 시뮬레이션된 성과 데이터
        return {
            postId: postId,
            impressions: Math.floor(Math.random() * 10000) + 1000,
            likes: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 100) + 10,
            shares: Math.floor(Math.random() * 200) + 20,
            engagementRate: (Math.random() * 5 + 2).toFixed(2) + '%'
        };
    }
}

// 전역 인스턴스 생성
window.socialAPISimulator = new SocialMediaAPISimulator();

// 소셜미디어 자동화에 API 시뮬레이터 연동
if (window.socialAutomation) {
    // 기존 publishToPlatform 메서드를 API 시뮬레이터로 교체
    window.socialAutomation.publishToPlatform = async function(platform, post) {
        try {
            const result = await window.socialAPISimulator.publishToAllPlatforms({
                ...post,
                platforms: [platform]
            });
            
            return result[0]?.success || false;
        } catch (error) {
            console.error(`${platform} 게시 오류:`, error);
            return false;
        }
    };
}
