// Social Media Analytics for Thai Exotic Plants
// 소셜미디어 성과 분석 및 인사이트 제공

class SocialMediaAnalytics {
    constructor() {
        this.analyticsData = this.loadAnalyticsData();
        this.charts = {};
    }

    // 분석 데이터 로드
    loadAnalyticsData() {
        try {
            const stored = localStorage.getItem('thaiPlantsSocialAnalytics');
            return stored ? JSON.parse(stored) : this.getDefaultAnalyticsData();
        } catch (error) {
            console.error('분석 데이터 로드 중 오류:', error);
            return this.getDefaultAnalyticsData();
        }
    }

    // 기본 분석 데이터 생성
    getDefaultAnalyticsData() {
        return {
            posts: [],
            engagement: {
                totalLikes: 0,
                totalComments: 0,
                totalShares: 0,
                totalImpressions: 0
            },
            hashtags: {},
            bestPerformingPosts: [],
            platformStats: {
                facebook: { posts: 0, engagement: 0 },
                instagram: { posts: 0, engagement: 0 },
                twitter: { posts: 0, engagement: 0 }
            },
            timeAnalysis: {
                hourly: new Array(24).fill(0),
                daily: new Array(7).fill(0),
                monthly: new Array(12).fill(0)
            }
        };
    }

    // 포스트 성과 기록
    recordPostPerformance(postId, platform, performance) {
        const postData = {
            postId,
            platform,
            timestamp: new Date().toISOString(),
            ...performance
        };

        this.analyticsData.posts.push(postData);
        this.updateEngagementMetrics(performance);
        this.updatePlatformStats(platform, performance);
        this.updateTimeAnalysis();
        this.updateHashtagAnalysis(postData);
        
        this.saveAnalyticsData();
    }

    // 참여도 메트릭 업데이트
    updateEngagementMetrics(performance) {
        this.analyticsData.engagement.totalLikes += performance.likes || 0;
        this.analyticsData.engagement.totalComments += performance.comments || 0;
        this.analyticsData.engagement.totalShares += performance.shares || 0;
        this.analyticsData.engagement.totalImpressions += performance.impressions || 0;
    }

    // 플랫폼별 통계 업데이트
    updatePlatformStats(platform, performance) {
        if (this.analyticsData.platformStats[platform]) {
            this.analyticsData.platformStats[platform].posts += 1;
            this.analyticsData.platformStats[platform].engagement += 
                (performance.likes || 0) + (performance.comments || 0) + (performance.shares || 0);
        }
    }

    // 시간대 분석 업데이트
    updateTimeAnalysis() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        const month = now.getMonth();

        this.analyticsData.timeAnalysis.hourly[hour]++;
        this.analyticsData.timeAnalysis.daily[day]++;
        this.analyticsData.timeAnalysis.monthly[month]++;
    }

    // 해시태그 분석 업데이트
    updateHashtagAnalysis(postData) {
        // 실제 구현에서는 포스트 내용에서 해시태그를 추출
        const mockHashtags = ['#태국식물', '#희귀식물', '#식물', '#인테리어', '#새상품'];
        
        mockHashtags.forEach(hashtag => {
            this.analyticsData.hashtags[hashtag] = (this.analyticsData.hashtags[hashtag] || 0) + 1;
        });
    }

    // 최고 성과 포스트 업데이트
    updateBestPerformingPosts() {
        this.analyticsData.bestPerformingPosts = this.analyticsData.posts
            .sort((a, b) => {
                const aScore = (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
                const bScore = (b.likes || 0) + (b.comments || 0) + (b.shares || 0);
                return bScore - aScore;
            })
            .slice(0, 10);
    }

    // 분석 데이터 저장
    saveAnalyticsData() {
        try {
            localStorage.setItem('thaiPlantsSocialAnalytics', JSON.stringify(this.analyticsData));
        } catch (error) {
            console.error('분석 데이터 저장 중 오류:', error);
        }
    }

    // 대시보드 생성
    createAnalyticsDashboard() {
        const analyticsSection = document.getElementById('analytics-section');
        if (!analyticsSection) return;

        analyticsSection.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-6">소셜미디어 분석</h3>
                
                <!-- 주요 지표 -->
                <div class="grid md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600" id="total-posts">0</div>
                        <div class="text-sm text-gray-600">총 포스트</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600" id="total-likes">0</div>
                        <div class="text-sm text-gray-600">총 좋아요</div>
                    </div>
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                        <div class="text-2xl font-bold text-purple-600" id="total-comments">0</div>
                        <div class="text-sm text-gray-600">총 댓글</div>
                    </div>
                    <div class="text-center p-4 bg-orange-50 rounded-lg">
                        <div class="text-2xl font-bold text-orange-600" id="total-shares">0</div>
                        <div class="text-sm text-gray-600">총 공유</div>
                    </div>
                </div>

                <!-- 차트 영역 -->
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="text-lg font-semibold mb-4">플랫폼별 성과</h4>
                        <canvas id="platform-chart" width="400" height="200"></canvas>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-4">시간대별 게시</h4>
                        <canvas id="hourly-chart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- 해시태그 분석 -->
                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-4">인기 해시태그</h4>
                    <div id="hashtag-analysis" class="flex flex-wrap gap-2">
                        <!-- 해시태그가 여기에 표시됩니다 -->
                    </div>
                </div>

                <!-- 최고 성과 포스트 -->
                <div>
                    <h4 class="text-lg font-semibold mb-4">최고 성과 포스트</h4>
                    <div id="best-posts" class="space-y-2">
                        <!-- 최고 성과 포스트가 여기에 표시됩니다 -->
                    </div>
                </div>
            </div>
        `;

        this.updateDashboard();
        this.createCharts();
    }

    // 대시보드 업데이트
    updateDashboard() {
        this.updateBestPerformingPosts();
        
        // 주요 지표 업데이트
        document.getElementById('total-posts').textContent = this.analyticsData.posts.length;
        document.getElementById('total-likes').textContent = this.analyticsData.engagement.totalLikes.toLocaleString();
        document.getElementById('total-comments').textContent = this.analyticsData.engagement.totalComments.toLocaleString();
        document.getElementById('total-shares').textContent = this.analyticsData.engagement.totalShares.toLocaleString();

        // 해시태그 분석 업데이트
        this.updateHashtagDisplay();
        
        // 최고 성과 포스트 업데이트
        this.updateBestPostsDisplay();
    }

    // 해시태그 표시 업데이트
    updateHashtagDisplay() {
        const hashtagContainer = document.getElementById('hashtag-analysis');
        if (!hashtagContainer) return;

        const sortedHashtags = Object.entries(this.analyticsData.hashtags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        hashtagContainer.innerHTML = sortedHashtags.map(([hashtag, count]) => `
            <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                ${hashtag} (${count})
            </span>
        `).join('');
    }

    // 최고 성과 포스트 표시 업데이트
    updateBestPostsDisplay() {
        const bestPostsContainer = document.getElementById('best-posts');
        if (!bestPostsContainer) return;

        bestPostsContainer.innerHTML = this.analyticsData.bestPerformingPosts.map(post => {
            const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
            return `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <div class="font-medium">${post.platform.toUpperCase()}</div>
                        <div class="text-sm text-gray-600">${new Date(post.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-plant-green">${engagement}</div>
                        <div class="text-sm text-gray-600">참여도</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 차트 생성
    createCharts() {
        this.createPlatformChart();
        this.createHourlyChart();
    }

    // 플랫폼별 성과 차트
    createPlatformChart() {
        const ctx = document.getElementById('platform-chart');
        if (!ctx) return;

        const platforms = Object.keys(this.analyticsData.platformStats);
        const posts = platforms.map(p => this.analyticsData.platformStats[p].posts);
        const engagement = platforms.map(p => this.analyticsData.platformStats[p].engagement);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
                datasets: [{
                    label: '포스트 수',
                    data: posts,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1
                }, {
                    label: '참여도',
                    data: engagement,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 시간대별 게시 차트
    createHourlyChart() {
        const ctx = document.getElementById('hourly-chart');
        if (!ctx) return;

        const hours = Array.from({length: 24}, (_, i) => i);
        const hourlyData = this.analyticsData.timeAnalysis.hourly;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours.map(h => `${h}:00`),
                datasets: [{
                    label: '게시 수',
                    data: hourlyData,
                    borderColor: 'rgba(168, 85, 247, 1)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 인사이트 생성
    generateInsights() {
        const insights = [];
        
        // 최고 성과 시간대
        const bestHour = this.analyticsData.timeAnalysis.hourly.indexOf(
            Math.max(...this.analyticsData.timeAnalysis.hourly)
        );
        insights.push(`최고 성과 시간대: ${bestHour}:00`);

        // 최고 성과 플랫폼
        const bestPlatform = Object.entries(this.analyticsData.platformStats)
            .sort(([,a], [,b]) => b.engagement - a.engagement)[0];
        insights.push(`최고 성과 플랫폼: ${bestPlatform[0]} (참여도: ${bestPlatform[1].engagement})`);

        // 인기 해시태그
        const topHashtag = Object.entries(this.analyticsData.hashtags)
            .sort(([,a], [,b]) => b - a)[0];
        insights.push(`인기 해시태그: ${topHashtag[0]} (${topHashtag[1]}회 사용)`);

        return insights;
    }

    // 데이터 내보내기
    exportAnalyticsData() {
        const dataStr = JSON.stringify(this.analyticsData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `social_analytics_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // 데이터 초기화
    resetAnalyticsData() {
        if (confirm('모든 분석 데이터를 삭제하시겠습니까?')) {
            this.analyticsData = this.getDefaultAnalyticsData();
            this.saveAnalyticsData();
            this.updateDashboard();
            showNotification('분석 데이터가 초기화되었습니다.', 'success');
        }
    }
}

// 전역 인스턴스 생성
window.socialAnalytics = new SocialMediaAnalytics();

// 소셜미디어 자동화에 분석 기능 연동
if (window.socialAutomation) {
    const originalPublishPost = window.socialAutomation.publishPost.bind(window.socialAutomation);
    
    window.socialAutomation.publishPost = async function(post) {
        const result = await originalPublishPost(post);
        
        // 성과 데이터 기록 (시뮬레이션)
        if (result) {
            const performance = {
                likes: Math.floor(Math.random() * 500) + 50,
                comments: Math.floor(Math.random() * 100) + 10,
                shares: Math.floor(Math.random() * 200) + 20,
                impressions: Math.floor(Math.random() * 5000) + 1000
            };
            
            post.platforms.forEach(platform => {
                window.socialAnalytics.recordPostPerformance(post.id, platform, performance);
            });
        }
        
        return result;
    };
}

// 페이지 로드 시 분석 대시보드 생성
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.socialAnalytics) {
            window.socialAnalytics.createAnalyticsDashboard();
        }
    }, 2000);
});
