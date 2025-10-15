const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors());
// Increase body size limits to support base64 media payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// Store for user access tokens (in production, use a database)
const userTokens = new Map();

// Mock data
const categories = [
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

const products = [
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
        tags: ['몬스테라', '희귀종', '무늬'],
        created_at: '2024-01-01T00:00:00Z'
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
        tags: ['필로덴드론', '핑크', '무늬'],
        created_at: '2024-01-02T00:00:00Z'
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
        tags: ['아글라오네마', '빨강', '초보자'],
        created_at: '2024-01-03T00:00:00Z'
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
        tags: ['하월시아', '다육식물', '투명'],
        created_at: '2024-01-04T00:00:00Z'
    }
];

// Mock data for additional endpoints
const orders = [
    {
        id: '1',
        customer_name: '김철수',
        customer_email: 'kim@example.com',
        total_amount: 15000,
        status: 'pending',
        payment_status: 'unpaid',
        created_at: '2024-01-01T00:00:00Z',
        items: [
            { product_id: '1', quantity: 1, price: 15000 }
        ]
    },
    {
        id: '2',
        customer_name: '이영희',
        customer_email: 'lee@example.com',
        total_amount: 8500,
        status: 'processing',
        payment_status: 'paid',
        created_at: '2024-01-02T00:00:00Z',
        items: [
            { product_id: '2', quantity: 1, price: 8500 }
        ]
    }
];

const socialPosts = [
    {
        id: '1',
        title: '새로운 몬스테라 도착!',
        content: '태국에서 직접 가져온 희귀한 몬스테라를 만나보세요!',
        platforms: ['facebook', 'instagram'],
        status: 'published',
        scheduled_time: '2024-01-01T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: '2',
        title: '식물 관리 팁',
        content: '식물을 건강하게 키우는 방법을 알려드립니다.',
        platforms: ['facebook', 'twitter'],
        status: 'scheduled',
        scheduled_time: '2024-01-15T14:00:00Z',
        created_at: '2024-01-05T00:00:00Z'
    }
];

const shops = [
    {
        id: '1',
        name: '태국 특이식물 샵',
        description: '태국에서 직접 수집한 희귀한 식물들을 판매합니다.',
        owner_name: '김태국',
        contact_email: 'thai@example.com',
        address: '서울시 강남구 테헤란로 123',
        status: 'active',
        product_count: 15,
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: '2',
        name: '정글 플랜트',
        description: '열대 식물 전문 샵입니다.',
        owner_name: '박정글',
        contact_email: 'jungle@example.com',
        address: '부산시 해운대구 센텀로 456',
        status: 'active',
        product_count: 8,
        created_at: '2024-01-02T00:00:00Z'
    }
];

// API Routes
app.get('/tables/categories', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const filteredCategories = categories.slice(0, limit);
    
    res.json({
        data: filteredCategories,
        total: categories.length,
        page: 1,
        limit: limit
    });
});

app.get('/tables/products', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sort = req.query.sort || 'name';
    
    let filteredProducts = [...products];
    
    // Apply search filter
    if (search) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.korean_name.toLowerCase().includes(search.toLowerCase()) ||
            product.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // Apply sorting
    filteredProducts.sort((a, b) => {
        let aVal = a[sort];
        let bVal = b[sort];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
        data: paginatedProducts,
        total: filteredProducts.length,
        page: page,
        limit: limit
    });
});

// Orders endpoint
app.get('/tables/orders', (req, res) => {
    const limit = parseInt(req.query.limit) || 1000;
    const filteredOrders = orders.slice(0, limit);
    
    res.json({
        data: filteredOrders,
        total: orders.length,
        page: 1,
        limit: limit
    });
});

// Social posts endpoint
app.get('/tables/social_posts', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const filteredPosts = socialPosts.slice(0, limit);
    
    res.json({
        data: filteredPosts,
        total: socialPosts.length,
        page: 1,
        limit: limit
    });
});

// Shops endpoint
app.get('/tables/shops', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const filteredShops = shops.slice(0, limit);
    
    res.json({
        data: filteredShops,
        total: shops.length,
        page: 1,
        limit: limit
    });
});

// Facebook OAuth endpoints
app.get('/auth/facebook', (req, res) => {
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
        `client_id=${config.facebook.appId}&` +
        `redirect_uri=${encodeURIComponent(config.facebook.redirectUri)}&` +
        `scope=${config.facebook.scope}&` +
        `response_type=code&` +
        `state=${Date.now()}`;
    
    res.redirect(authUrl);
});

app.get('/auth/facebook/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
            params: {
                client_id: config.facebook.appId,
                client_secret: config.facebook.appSecret,
                redirect_uri: config.facebook.redirectUri,
                code: code
            }
        });
        
        const { access_token } = tokenResponse.data;
        
        // Get user info
        const userResponse = await axios.get(`https://graph.facebook.com/v19.0/me`, {
            params: {
                access_token: access_token,
                fields: 'id,name,email'
            }
        });
        
        const userId = userResponse.data.id;
        userTokens.set(userId, access_token);
        
        // Redirect back to admin page with success
        res.redirect('/admin.html?facebook_connected=true');
        
    } catch (error) {
        console.error('Facebook OAuth error:', error.response?.data || error.message);
        res.redirect('/admin.html?facebook_error=true');
    }
});

// Facebook posting endpoints
app.post('/api/facebook/post', async (req, res) => {
    const { userId, message, imageUrl } = req.body;
    
    if (!userId || !userTokens.has(userId)) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const accessToken = userTokens.get(userId);
        
        // Try to get user's pages first
        let postTarget = 'me';
        let accessTokenToUse = accessToken;
        
        try {
            const pagesResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
                params: {
                    access_token: accessToken
                }
            });
            
            if (pagesResponse.data.data.length > 0) {
                // Use the first page for posting
                const page = pagesResponse.data.data[0];
                postTarget = page.id;
                accessTokenToUse = page.access_token;
            }
        } catch (error) {
            console.log('No pages found, posting to personal timeline');
        }
        
        // Prepare post data
        const postData = {
            message: message,
            access_token: accessTokenToUse
        };
        
        // Add image if provided
        if (imageUrl) {
            postData.link = imageUrl;
        }
        
        // Post to Facebook (page or personal timeline)
        const postResponse = await axios.post(`https://graph.facebook.com/v19.0/${postTarget}/feed`, postData);
        
        res.json({
            success: true,
            postId: postResponse.data.id,
            message: 'Post published successfully to Facebook'
        });
        
    } catch (error) {
        console.error('Facebook posting error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to post to Facebook',
            details: error.response?.data || error.message
        });
    }
});

// Get Facebook pages for user
app.get('/api/facebook/pages/:userId', async (req, res) => {
    const { userId } = req.params;
    
    if (!userTokens.has(userId)) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const accessToken = userTokens.get(userId);
        
        const pagesResponse = await axios.get(`https://graph.facebook.com/v19.0/me/accounts`, {
            params: {
                access_token: accessToken
            }
        });
        
        res.json({
            success: true,
            pages: pagesResponse.data.data
        });
        
    } catch (error) {
        console.error('Facebook pages error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch Facebook pages',
            details: error.response?.data || error.message
        });
    }
});

// Check Facebook connection status
app.get('/api/facebook/status/:userId', (req, res) => {
    const { userId } = req.params;
    const isConnected = userTokens.has(userId);
    
    res.json({
        connected: isConnected,
        userId: userId
    });
});

// Data persistence endpoints
app.post('/api/save-data', (req, res) => {
    const { type, data } = req.body;
    
    try {
        // In a real application, this would save to a database
        // For now, we'll just acknowledge the save
        console.log(`Saving ${type} data:`, data);
        
        res.json({
            success: true,
            message: `${type} data saved successfully`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error saving ${type} data:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to save ${type} data`
        });
    }
});

// Get all data for export
app.get('/api/export-data', (req, res) => {
    try {
        const allData = {
            categories: categories,
            products: products,
            orders: orders,
            socialPosts: socialPosts,
            shops: shops,
            exportDate: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: allData
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export data'
        });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/shops.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'shops.html'));
});

app.get('/shop.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'shop.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/shop-owner.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'shop-owner.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`- GET /tables/categories?limit=100`);
    console.log(`- GET /tables/products?page=1&limit=20&sort=name`);
    console.log(`- Static files served from root directory`);
});
