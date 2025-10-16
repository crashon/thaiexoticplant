const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const config = require('./config');
const { pool, initializeDatabase, insertSampleData } = require('./database');

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

// Initialize database on startup
async function startServer() {
    try {
        await initializeDatabase();
        await insertSampleData();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        console.log('Server will start without database. Please configure DATABASE_URL in .env file');
        console.log('For now, using fallback mock data...');
    }
}

// Fallback mock data
const fallbackCategories = [
    {
        id: 1,
        name: '관엽식물',
        name_en: 'Foliage Plants',
        name_th: 'พืชใบประดับ',
        description: '아름다운 잎을 감상하는 식물들',
        image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: '다육식물',
        name_en: 'Succulents',
        name_th: 'พืชอวบน้ำ',
        description: '물을 적게 주어도 잘 자라는 식물들',
        image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        name: '꽃식물',
        name_en: 'Flowering Plants',
        name_th: 'พืชดอก',
        description: '아름다운 꽃을 피우는 식물들',
        image_url: 'https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400',
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 4,
        name: '허브',
        name_en: 'Herbs',
        name_th: 'สมุนไพร',
        description: '요리와 건강에 도움되는 허브들',
        image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        is_active: true,
        created_at: new Date().toISOString()
    }
];

const fallbackProducts = [
    {
        id: 1,
        name: '몬스테라 델리시오사',
        name_en: 'Monstera Deliciosa',
        name_th: 'มอนสเตอร่า เดลิซิโอซ่า',
        description: '대형 잎이 아름다운 인기 관엽식물',
        price: 25000,
        category_id: 1,
        stock_quantity: 10,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: '산세베리아',
        name_en: 'Sansevieria',
        name_th: 'ซานเซเวียเรีย',
        description: '공기정화 효과가 뛰어난 다육식물',
        price: 15000,
        category_id: 2,
        stock_quantity: 20,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        name: '안스리움',
        name_en: 'Anthurium',
        name_th: 'แอนทูเรียม',
        description: '빨간 하트 모양 꽃이 아름다운 식물',
        price: 18000,
        category_id: 3,
        stock_quantity: 15,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

// API Routes
app.get('/tables/categories', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const result = await pool.query(
            'SELECT * FROM categories WHERE is_active = true ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        
        res.json({
            data: result.rows,
            total: result.rows.length,
            page: 1,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching categories from database, using fallback data:', error.message);
        const limit = parseInt(req.query.limit) || 100;
        const filteredCategories = fallbackCategories.slice(0, limit);
        
        res.json({
            data: filteredCategories,
            total: filteredCategories.length,
            page: 1,
            limit: limit
        });
    }
});

app.get('/tables/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const sort = req.query.sort || 'name';
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = true
        `;
        let params = [];
        let paramCount = 0;
        
        // Apply search filter
        if (search) {
            paramCount++;
            query += ` AND (p.name ILIKE $${paramCount} OR p.name_en ILIKE $${paramCount} OR p.name_th ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }
        
        // Apply sorting
        const validSortFields = ['name', 'price', 'created_at'];
        const sortField = validSortFields.includes(sort) ? sort : 'name';
        query += ` ORDER BY p.${sortField} ASC`;
        
        // Get total count
        const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*)');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Apply pagination
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);
        
        const result = await pool.query(query, params);
        
        res.json({
            data: result.rows,
            total: total,
            page: page,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching products from database, using fallback data:', error.message);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const sort = req.query.sort || 'name';
        
        let filteredProducts = [...fallbackProducts];
        
        // Apply search filter
        if (search) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.name_en.toLowerCase().includes(search.toLowerCase()) ||
                product.name_th.toLowerCase().includes(search.toLowerCase()) ||
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
    }
});

// Fallback data for other endpoints
const fallbackOrders = [];
const fallbackSocialPosts = [];
const fallbackShops = [
    {
        id: 1,
        name: '타이 익조틱 플랜트',
        name_en: 'Thai Exotic Plants',
        name_th: 'ไทย เอ็กโซติก พลานท์',
        description: '태국 최고의 이국적인 식물 전문점',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        email: 'info@thaiexoticplants.com',
        is_active: true,
        created_at: new Date().toISOString()
    }
];

// Orders endpoint
app.get('/tables/orders', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 1000;
        const result = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        
        res.json({
            data: result.rows,
            total: result.rows.length,
            page: 1,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching orders from database, using fallback data:', error.message);
        const limit = parseInt(req.query.limit) || 1000;
        const filteredOrders = fallbackOrders.slice(0, limit);
        
        res.json({
            data: filteredOrders,
            total: filteredOrders.length,
            page: 1,
            limit: limit
        });
    }
});

// Social posts endpoint
app.get('/tables/social_posts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const result = await pool.query(
            'SELECT * FROM social_posts ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        
        res.json({
            data: result.rows,
            total: result.rows.length,
            page: 1,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching social posts from database, using fallback data:', error.message);
        const limit = parseInt(req.query.limit) || 100;
        const filteredPosts = fallbackSocialPosts.slice(0, limit);
        
        res.json({
            data: filteredPosts,
            total: filteredPosts.length,
            page: 1,
            limit: limit
        });
    }
});

// Shops endpoint
app.get('/tables/shops', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const result = await pool.query(
            'SELECT * FROM shops WHERE is_active = true ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        
        res.json({
            data: result.rows,
            total: result.rows.length,
            page: 1,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching shops from database, using fallback data:', error.message);
        const limit = parseInt(req.query.limit) || 100;
        const filteredShops = fallbackShops.slice(0, limit);
        
        res.json({
            data: filteredShops,
            total: filteredShops.length,
            page: 1,
            limit: limit
        });
    }
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
app.post('/api/save-data', async (req, res) => {
    const { type, data } = req.body;
    
    try {
        switch (type) {
            case 'categories':
                await pool.query(
                    'INSERT INTO categories (name, name_en, name_th, description, image_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, name_th = EXCLUDED.name_th, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = CURRENT_TIMESTAMP',
                    [data.name, data.name_en, data.name_th, data.description, data.image_url]
                );
                break;
                
            case 'products':
                await pool.query(
                    'INSERT INTO products (name, name_en, name_th, description, price, category_id, image_url, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, name_th = EXCLUDED.name_th, description = EXCLUDED.description, price = EXCLUDED.price, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url, stock_quantity = EXCLUDED.stock_quantity, updated_at = CURRENT_TIMESTAMP',
                    [data.name, data.name_en, data.name_th, data.description, data.price, data.category_id, data.image_url, data.stock_quantity || 0]
                );
                break;
                
            case 'socialPosts':
                await pool.query(
                    'INSERT INTO social_posts (title, content, type, platforms, hashtags, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, type = EXCLUDED.type, platforms = EXCLUDED.platforms, hashtags = EXCLUDED.hashtags, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP',
                    [data.title, data.content, data.type, data.platforms, data.hashtags, data.status || 'draft']
                );
                break;
                
            case 'generatedPosts':
                await pool.query(
                    'INSERT INTO generated_posts (title, content, type, platforms, hashtags, status, product_id, category_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, type = EXCLUDED.type, platforms = EXCLUDED.platforms, hashtags = EXCLUDED.hashtags, status = EXCLUDED.status, product_id = EXCLUDED.product_id, category_id = EXCLUDED.category_id, updated_at = CURRENT_TIMESTAMP',
                    [data.title, data.content, data.type, data.platforms, data.hashtags, data.status || 'draft', data.product_id, data.category_id]
                );
                break;
                
            case 'mediaItems':
                await pool.query(
                    'INSERT INTO media_items (name, url, type, size, alt_text, tags) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url, type = EXCLUDED.type, size = EXCLUDED.size, alt_text = EXCLUDED.alt_text, tags = EXCLUDED.tags',
                    [data.name, data.url, data.type, data.size, data.alt_text, data.tags]
                );
                break;
                
            default:
                console.log(`Unknown data type: ${type}`);
        }
        
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
app.get('/api/export-data', async (req, res) => {
    try {
        const [categoriesResult, productsResult, ordersResult, socialPostsResult, shopsResult] = await Promise.all([
            pool.query('SELECT * FROM categories'),
            pool.query('SELECT * FROM products'),
            pool.query('SELECT * FROM orders'),
            pool.query('SELECT * FROM social_posts'),
            pool.query('SELECT * FROM shops')
        ]);
        
        const allData = {
            categories: categoriesResult.rows,
            products: productsResult.rows,
            orders: ordersResult.rows,
            socialPosts: socialPostsResult.rows,
            shops: shopsResult.rows,
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
startServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log('Available endpoints:');
        console.log(`- GET /tables/categories?limit=100`);
        console.log(`- GET /tables/products?page=1&limit=20&sort=name`);
        console.log(`- Static files served from root directory`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
