// server.js (patched for security & reliability)
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const config = require('./config');
const { pool, initializeDatabase, insertSampleData, saveUserToken, getUserToken } = require('./database');

const app = express();
const PORT = config.server.port;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
if (allowedOrigins.length === 0) {
  // default to localhost for dev if not provided
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  }
}));

// Increase body size limits to support base64 media payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public folder (do NOT expose repo root)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Admin middleware
 * - expects an admin token in header x-admin-token or ENV ADMIN_API_TOKEN when running locally
 */
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.admin_token || null;
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) {
    // In development, allow if token not configured but log a warning
    if (config.server.environment !== 'production') {
      console.warn('[WARN] ADMIN_API_TOKEN not set — admin-protected routes are permissive in development.');
      return next();
    }
    return res.status(500).json({ error: 'ADMIN API Token not configured' });
  }
  if (token && token === expected) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Helper: safeUpsert
 * Builds an INSERT ... ON CONFLICT (id) DO UPDATE query when data.id exists.
 * columns: array of column names to include (excluding id unless includeId true)
 */
function buildUpsertSQL(table, data, columns, unique = 'id') {
  const keys = [...columns];
  const values = [];
  const placeholders = [];
  let idx = 1;

  // include id if present in data
  if (data.id !== undefined && data.id !== null) {
    keys.unshift('id');
  }

  for (const key of keys) {
    placeholders.push(`$${idx}`);
    values.push(data[key] === undefined ? null : data[key]);
    idx++;
  }

  const colsList = keys.map(k => `"${k}"`).join(', ');
  const placeholdersList = placeholders.join(', ');

  // prepare update set (exclude id)
  const updateSet = columns.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');
  const insertQuery = data.id !== undefined && data.id !== null
    ? `INSERT INTO ${table} (${colsList}) VALUES (${placeholdersList}) ON CONFLICT (${unique}) DO UPDATE SET ${updateSet}, updated_at = CURRENT_TIMESTAMP`
    : `INSERT INTO ${table} (${colsList}) VALUES (${placeholdersList}) ON CONFLICT (${unique}) DO UPDATE SET ${updateSet}, updated_at = CURRENT_TIMESTAMP`;

  return { text: insertQuery, values };
}

// Initialize DB
async function startServer() {
  try {
    await initializeDatabase();
    await insertSampleData();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Server will continue — fallback data will be used where appropriate.');
  }
}

/**
 * FB state store for OAuth CSRF protection (in-memory).
 * For multi-instance production, move to shared store (Redis/DB).
 */
const fbStateStore = new Map();

/* ---------------------
   Fallback mock data
   --------------------- */
const fallbackCategories = [ /* ... same as original fallback ... */ ];
const fallbackProducts = [ /* ... same as original fallback ... */ ];
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

/* ---------------------
   API Routes
   --------------------- */

// GET /tables/categories
app.get('/tables/categories', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json({ data: result.rows, total: result.rows.length, page: 1, limit });
  } catch (error) {
    console.error('Error fetching categories (DB):', error.message || error);
    const filteredCategories = fallbackCategories.slice(0, limit);
    res.json({ data: filteredCategories, total: filteredCategories.length, page: 1, limit });
  }
});

// GET /tables/products (search, sort, pagination)
// safer countQuery construction
app.get('/tables/products', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const search = req.query.search ? String(req.query.search).trim() : '';
    const sort = req.query.sort || 'name';
    const offset = (page - 1) * limit;

    const validSortFields = ['name', 'price', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';

    let whereClauses = ['p.is_active = true'];
    const params = [];
    let pIdx = 1;

    if (search) {
      whereClauses.push(`(p.name ILIKE $${pIdx} OR p.name_en ILIKE $${pIdx} OR p.name_th ILIKE $${pIdx} OR p.description ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // count query
    const countQuery = `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereSQL}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // data query
    params.push(limit);
    params.push(offset);
    const dataQuery = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSQL}
      ORDER BY p.${sortField} ASC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    const result = await pool.query(dataQuery, params);

    res.json({ data: result.rows, total, page, limit });
  } catch (error) {
    console.error('Error fetching products from DB, falling back:', error.message || error);
    // fallback behavior (same as previous, but with safe sort)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const search = req.query.search || '';
    const sort = req.query.sort || 'name';
    let filtered = [...fallbackProducts];

    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.name_en.toLowerCase().includes(search.toLowerCase()) ||
        p.name_th.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    const validSortFields = ['name', 'price', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';

    filtered.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return av > bv ? 1 : av < bv ? -1 : 0;
    });

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    res.json({ data: paginated, total: filtered.length, page, limit });
  }
});

// GET /tables/orders
app.get('/tables/orders', async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 1000);
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ data: result.rows, total: result.rows.length, page: 1, limit });
  } catch (error) {
    console.error('Error fetching orders (DB):', error.message || error);
    const filtered = fallbackOrders.slice(0, limit);
    res.json({ data: filtered, total: filtered.length, page: 1, limit });
  }
});

// GET /tables/social_posts
app.get('/tables/social_posts', async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 100);
  try {
    const result = await pool.query('SELECT * FROM social_posts ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ data: result.rows, total: result.rows.length, page: 1, limit });
  } catch (error) {
    console.error('Error fetching social posts (DB):', error.message || error);
    const filtered = fallbackSocialPosts.slice(0, limit);
    res.json({ data: filtered, total: filtered.length, page: 1, limit });
  }
});

// GET /tables/shops
app.get('/tables/shops', async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 100);
  try {
    const result = await pool.query('SELECT * FROM shops WHERE is_active = true ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ data: result.rows, total: result.rows.length, page: 1, limit });
  } catch (error) {
    console.error('Error fetching shops (DB):', error.message || error);
    const filteredShops = fallbackShops.slice(0, limit);
    res.json({ data: filteredShops, total: filteredShops.length, page: 1, limit });
  }
});

// GET /tables/media_items
app.get('/tables/media_items', async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 1000);
  try {
    const result = await pool.query('SELECT * FROM media_items ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ data: result.rows, total: result.rows.length, page: 1, limit });
  } catch (error) {
    console.error('Error fetching media items (DB):', error.message || error);
    res.json({ data: [], total: 0, page: 1, limit });
  }
});

/* ---------------------
   Reviews API Routes
   --------------------- */

// GET /tables/reviews - Get all reviews (admin)
app.get('/tables/reviews', async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 100);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM reviews');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT r.*, p.name as product_name, p.name_en as product_name_en
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ data: result.rows, total, page, limit });
  } catch (error) {
    console.error('Error fetching reviews (DB):', error.message || error);
    res.json({ data: [], total: 0, page, limit });
  }
});

// GET /tables/reviews/product/:productId - Get reviews for a specific product
app.get('/tables/reviews/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const limit = Math.max(1, parseInt(req.query.limit) || 50);
  const onlyApproved = req.query.approved !== 'false'; // default to only approved

  try {
    let query = `
      SELECT r.*, p.name as product_name, p.name_en as product_name_en
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.product_id = $1
    `;

    if (onlyApproved) {
      query += ' AND r.is_approved = true';
    }

    query += ' ORDER BY r.created_at DESC LIMIT $2';

    const result = await pool.query(query, [productId, limit]);
    res.json({ data: result.rows, total: result.rows.length, productId });
  } catch (error) {
    console.error('Error fetching product reviews (DB):', error.message || error);
    res.json({ data: [], total: 0, productId });
  }
});

// GET /tables/reviews/stats/:productId - Get review statistics for a product
app.get('/tables/reviews/stats/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_reviews
       FROM reviews
       WHERE product_id = $1 AND is_approved = true`,
      [productId]
    );

    const stats = result.rows[0];
    res.json({
      success: true,
      productId,
      stats: {
        totalReviews: parseInt(stats.total_reviews, 10),
        averageRating: parseFloat(stats.average_rating).toFixed(1),
        ratingDistribution: {
          5: parseInt(stats.rating_5, 10),
          4: parseInt(stats.rating_4, 10),
          3: parseInt(stats.rating_3, 10),
          2: parseInt(stats.rating_2, 10),
          1: parseInt(stats.rating_1, 10)
        },
        verifiedReviews: parseInt(stats.verified_reviews, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching review stats (DB):', error.message || error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review statistics',
      productId
    });
  }
});

// POST /api/reviews - Create a new review (public)
app.post('/api/reviews', async (req, res) => {
  const { productId, customerName, customerEmail, rating, comment } = req.body;

  // Validation
  if (!productId || !customerName || !customerEmail || !rating) {
    return res.status(400).json({
      success: false,
      error: 'productId, customerName, customerEmail, and rating are required'
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Rating must be between 1 and 5'
    });
  }

  try {
    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (product_id, customer_name, customer_email, rating, comment, is_approved)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [productId, customerName, customerEmail, rating, comment || null]
    );

    res.json({
      success: true,
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

// PUT /api/reviews/:id - Update a review (admin only)
app.put('/api/reviews/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { customerName, customerEmail, rating, comment, isVerified, isApproved } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (customerName !== undefined) {
      updates.push(`customer_name = $${paramIndex++}`);
      values.push(customerName);
    }
    if (customerEmail !== undefined) {
      updates.push(`customer_email = $${paramIndex++}`);
      values.push(customerEmail);
    }
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      }
      updates.push(`rating = $${paramIndex++}`);
      values.push(rating);
    }
    if (comment !== undefined) {
      updates.push(`comment = $${paramIndex++}`);
      values.push(comment);
    }
    if (isVerified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      values.push(isVerified);
    }
    if (isApproved !== undefined) {
      updates.push(`is_approved = $${paramIndex++}`);
      values.push(isApproved);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE reviews SET ${updates.join(', ')}, updated_at = now() WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, error: 'Failed to update review' });
  }
});

// PUT /api/reviews/:id/approve - Approve a review (admin only)
app.put('/api/reviews/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE reviews SET is_approved = true, updated_at = now() WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({
      success: true,
      message: 'Review approved successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ success: false, error: 'Failed to approve review' });
  }
});

// DELETE /api/reviews/:id - Delete a review (admin only)
app.delete('/api/reviews/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
});

/* ---------------------
   Facebook OAuth routes
   --------------------- */

// Start OAuth flow
app.get('/auth/facebook', (req, res) => {
  // create secure random state
  const state = crypto.randomBytes(16).toString('hex');
  // store with timestamp (for short TTL)
  fbStateStore.set(state, Date.now());

  const authUrl = `https://www.facebook.com/${config.facebook.version}/dialog/oauth?` +
    `client_id=${encodeURIComponent(config.facebook.appId)}&` +
    `redirect_uri=${encodeURIComponent(config.facebook.redirectUri)}&` +
    `scope=${encodeURIComponent(config.facebook.scope)}&` +
    `response_type=code&` +
    `state=${encodeURIComponent(state)}`;

  res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/facebook/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Authorization code not provided');
  if (!state || !fbStateStore.has(state)) {
    return res.status(400).send('Invalid or missing OAuth state');
  }
  // delete state after validation
  fbStateStore.delete(state);

  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/${config.facebook.version}/oauth/access_token`, {
      params: {
        client_id: config.facebook.appId,
        client_secret: config.facebook.appSecret,
        redirect_uri: config.facebook.redirectUri,
        code: code
      },
      timeout: 5000
    });

    const { access_token } = tokenResponse.data;
    // fetch user info
    const userResponse = await axios.get(`https://graph.facebook.com/${config.facebook.version}/me`, {
      params: { access_token, fields: 'id,name,email' },
      timeout: 5000
    });

    const userId = userResponse.data.id;
    // persist token in DB (saveUserToken handles upsert)
    await saveUserToken(userId, access_token);

    // redirect to admin with success flag
    res.redirect('/admin.html?facebook_connected=true');
  } catch (err) {
    console.error('Facebook OAuth error:', err.response?.data || err.message || err);
    res.redirect('/admin.html?facebook_error=true');
  }
});

/* ---------------------
   Facebook posting endpoints
   --------------------- */

// Require admin to post (production should implement per-user auth)
app.post('/api/facebook/post', requireAdmin, async (req, res) => {
  const { userId, message, imageUrl } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const accessToken = await getUserToken(userId);
    if (!accessToken) return res.status(401).json({ error: 'User not authenticated with Facebook' });

    // Try to get pages for user
    let postTarget = 'me';
    let accessTokenToUse = accessToken;

    try {
      const pagesResponse = await axios.get(`https://graph.facebook.com/${config.facebook.version}/me/accounts`, {
        params: { access_token: accessToken },
        timeout: 5000
      });

      if (Array.isArray(pagesResponse.data.data) && pagesResponse.data.data.length > 0) {
        const page = pagesResponse.data.data[0];
        if (page.id && page.access_token) {
          postTarget = page.id;
          accessTokenToUse = page.access_token;
        }
      }
    } catch (err) {
      console.log('No pages found or error retrieving pages — will attempt to post to personal timeline if permitted.');
    }

    const postData = new URLSearchParams();
    if (message) postData.append('message', message);
    postData.append('access_token', accessTokenToUse);

    // If imageUrl is provided, posting a link; for uploading photo, the /photos endpoint with multipart is required.
    if (imageUrl) {
      postData.append('link', imageUrl);
    }

    const postResponse = await axios.post(`https://graph.facebook.com/${config.facebook.version}/${postTarget}/feed`, postData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 7000
    });

    res.json({ success: true, postId: postResponse.data.id, message: 'Post published successfully' });
  } catch (err) {
    console.error('Facebook posting error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to post to Facebook' });
  }
});

// Get Facebook pages for user
app.get('/api/facebook/pages/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  try {
    const accessToken = await getUserToken(userId);
    if (!accessToken) return res.status(401).json({ error: 'User not authenticated' });

    const pagesResponse = await axios.get(`https://graph.facebook.com/${config.facebook.version}/me/accounts`, {
      params: { access_token: accessToken },
      timeout: 5000
    });

    res.json({ success: true, pages: pagesResponse.data.data || [] });
  } catch (err) {
    console.error('Facebook pages error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to fetch Facebook pages' });
  }
});

// Check Facebook connection status
app.get('/api/facebook/status/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const token = await getUserToken(userId);
    res.json({ connected: !!token, userId });
  } catch (err) {
    res.status(500).json({ connected: false, userId, error: 'Failed to check status' });
  }
});

/* ---------------------
   Data persistence endpoints
   --------------------- */

// DELETE media item(s)
app.delete('/api/media-items/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM media_items WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true, message: 'Media item deleted successfully', id });
    } else {
      res.status(404).json({ success: false, error: 'Media item not found' });
    }
  } catch (err) {
    console.error('Error deleting media item:', err);
    res.status(500).json({ success: false, error: 'Failed to delete media item' });
  }
});

// Bulk DELETE media items
app.post('/api/media-items/bulk-delete', requireAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'ids array is required' });
  }

  try {
    const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(', ');
    const result = await pool.query(
      `DELETE FROM media_items WHERE id IN (${placeholders}) RETURNING id`,
      ids
    );
    res.json({
      success: true,
      message: `${result.rowCount} media item(s) deleted successfully`,
      deletedCount: result.rowCount
    });
  } catch (err) {
    console.error('Error bulk deleting media items:', err);
    res.status(500).json({ success: false, error: 'Failed to bulk delete media items' });
  }
});

app.post('/api/save-data', requireAdmin, async (req, res) => {
  const { type, data } = req.body;
  if (!type || !data) return res.status(400).json({ success: false, error: 'type and data are required' });

  try {
    switch (type) {
      case 'categories': {
        const cols = ['name', 'name_en', 'name_th', 'description', 'image_url'];
        const { text, values } = buildUpsertSQL('categories', data, cols, 'id');
        await pool.query(text, values);
        break;
      }
      case 'products': {
        const cols = ['name', 'name_en', 'name_th', 'description', 'price', 'category_id', 'image_url', 'stock_quantity', 'is_active'];
        const { text, values } = buildUpsertSQL('products', data, cols, 'id');
        await pool.query(text, values);
        break;
      }
      case 'socialPosts': {
        const cols = ['title', 'content', 'type', 'platforms', 'hashtags', 'status', 'scheduled_at'];
        const { text, values } = buildUpsertSQL('social_posts', data, cols, 'id');
        await pool.query(text, values);
        break;
      }
      case 'generatedPosts': {
        const cols = ['title', 'content', 'type', 'platforms', 'hashtags', 'status', 'product_id', 'category_id'];
        const { text, values } = buildUpsertSQL('generated_posts', data, cols, 'id');
        await pool.query(text, values);
        break;
      }
      case 'mediaItems': {
        // Handle both single object and array of objects
        const items = Array.isArray(data) ? data : [data];
        const results = [];

        for (const item of items) {
          const cols = ['name', 'url', 'type', 'size', 'alt_text', 'tags'];

          // If id is a string (from localStorage), we need to insert as new record
          // and let DB generate the id
          if (typeof item.id === 'string' || !item.id) {
            // Insert without id, let DB generate it
            const insertCols = cols.join(', ');
            const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
            const insertValues = cols.map(col => item[col] !== undefined ? item[col] : null);

            const insertQuery = `
              INSERT INTO media_items (${insertCols})
              VALUES (${placeholders})
              ON CONFLICT DO NOTHING
              RETURNING id
            `;
            const result = await pool.query(insertQuery, insertValues);
            if (result.rows.length > 0) {
              results.push(result.rows[0].id);
            }
          } else {
            // Update existing record with numeric id
            const { text, values } = buildUpsertSQL('media_items', item, cols, 'id');
            await pool.query(text, values);
            results.push(item.id);
          }
        }

        res.json({
          success: true,
          message: `${items.length} media item(s) saved successfully`,
          ids: results,
          timestamp: new Date().toISOString()
        });
        return; // Early return since we already sent response
      }
      default:
        console.log(`Unknown data type: ${type}`);
        return res.status(400).json({ success: false, error: 'Unknown type' });
    }

    res.json({ success: true, message: `${type} data saved successfully`, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(`Error saving ${type} data:`, err);
    res.status(500).json({ success: false, error: `Failed to save ${type} data` });
  }
});

// Get all data for export (admin-only)
app.get('/api/export-data', requireAdmin, async (req, res) => {
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

    res.json({ success: true, data: allData });
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

/* ---------------------
   Static HTML routes (serve from public/)
   --------------------- */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/shops.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shops.html')));
app.get('/shop.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/shop-owner.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop-owner.html')));

/* ---------------------
   Start server
   --------------------- */
startServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET /tables/categories?limit=100');
    console.log('- GET /tables/products?page=1&limit=20&sort=name');
    console.log('- Protected endpoints require x-admin-token header or ADMIN_API_TOKEN in query');
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
