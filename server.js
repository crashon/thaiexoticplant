// server.js (patched for security & reliability)
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const config = require('./config');
const { pool, initializeDatabase, insertSampleData, saveUserToken, getUserToken } = require('./database');

// Initialize payment providers
const stripe = config.stripe.secretKey ? require('stripe')(config.stripe.secretKey) : null;
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
let paypalClient = null;
if (config.paypal.clientId && config.paypal.clientSecret) {
  const environment = config.paypal.mode === 'live'
    ? new paypal.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret)
    : new paypal.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);
  paypalClient = new paypal.core.PayPalHttpClient(environment);
}

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
   Payment API endpoints
   --------------------- */

// Get payment configuration (public keys only)
app.get('/api/payments/config', (req, res) => {
  res.json({
    stripe: {
      publishableKey: config.stripe.publishableKey || null,
      enabled: !!config.stripe.secretKey
    },
    paypal: {
      clientId: config.paypal.clientId || null,
      enabled: !!paypalClient
    }
  });
});

// Create Stripe Payment Intent
app.post('/api/payments/stripe/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ success: false, error: 'Stripe not configured' });
  }

  const { amount, currency = 'thb', orderId, metadata = {} } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId: orderId || '',
        ...metadata
      }
    });

    // Save payment record
    if (orderId) {
      await pool.query(
        `INSERT INTO payments (order_id, payment_method, payment_provider, transaction_id, amount, currency, status, payment_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, 'card', 'stripe', paymentIntent.id, amount, currency.toUpperCase(), 'pending', JSON.stringify({ clientSecret: paymentIntent.client_secret })]
      );
    }

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

// Stripe Webhook handler
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !config.stripe.webhookSecret) {
    return res.status(503).send('Webhook not configured');
  }

  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Update payment status
        await pool.query(
          'UPDATE payments SET status = $1, updated_at = now() WHERE transaction_id = $2',
          ['completed', paymentIntent.id]
        );

        // Update order status if orderId is in metadata
        if (paymentIntent.metadata.orderId) {
          await pool.query(
            'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2',
            ['paid', paymentIntent.metadata.orderId]
          );
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await pool.query(
          'UPDATE payments SET status = $1, updated_at = now() WHERE transaction_id = $2',
          ['failed', failedPayment.id]
        );
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Create PayPal Order
app.post('/api/payments/paypal/create-order', async (req, res) => {
  if (!paypalClient) {
    return res.status(503).json({ success: false, error: 'PayPal not configured' });
  }

  const { amount, currency = 'USD', orderId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2)
        },
        custom_id: orderId || ''
      }]
    });

    const order = await paypalClient.execute(request);

    // Save payment record
    if (orderId) {
      await pool.query(
        `INSERT INTO payments (order_id, payment_method, payment_provider, transaction_id, amount, currency, status, payment_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, 'paypal', 'paypal', order.result.id, amount, currency.toUpperCase(), 'pending', JSON.stringify(order.result)]
      );
    }

    res.json({
      success: true,
      orderId: order.result.id
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create PayPal order' });
  }
});

// Capture PayPal Order
app.post('/api/payments/paypal/capture-order', async (req, res) => {
  if (!paypalClient) {
    return res.status(503).json({ success: false, error: 'PayPal not configured' });
  }

  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ success: false, error: 'OrderID required' });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await paypalClient.execute(request);

    // Update payment status
    await pool.query(
      'UPDATE payments SET status = $1, payment_data = $2, updated_at = now() WHERE transaction_id = $3',
      ['completed', JSON.stringify(capture.result), orderID]
    );

    // Get the order_id from payment record and update order status
    const paymentResult = await pool.query('SELECT order_id FROM payments WHERE transaction_id = $1', [orderID]);
    if (paymentResult.rows.length > 0 && paymentResult.rows[0].order_id) {
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2',
        ['paid', paymentResult.rows[0].order_id]
      );
    }

    res.json({
      success: true,
      captureId: capture.result.id,
      status: capture.result.status
    });
  } catch (error) {
    console.error('PayPal capture order error:', error);
    res.status(500).json({ success: false, error: 'Failed to capture PayPal order' });
  }
});

// Get payment by ID (admin only)
app.get('/api/payments/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, payment: result.rows[0] });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// Get payments for an order
app.get('/api/payments/order/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );

    res.json({ success: true, payments: result.rows });
  } catch (error) {
    console.error('Error fetching order payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// Get all payments (admin only)
app.get('/api/payments', requireAdmin, async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 100);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM payments');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT p.*, o.customer_name, o.customer_email
       FROM payments p
       LEFT JOIN orders o ON p.order_id = o.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ success: true, payments: result.rows, total, page, limit });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

/* ---------------------
   Shipping API endpoints
   --------------------- */

// Get all shipping carriers
app.get('/api/shipping/carriers', (req, res) => {
  const carriers = Object.values(config.shipping.carriers).map(carrier => ({
    code: carrier.code,
    name: carrier.name,
    nameEn: carrier.nameEn,
    trackingUrl: carrier.trackingUrl,
  }));

  res.json({ success: true, carriers });
});

// Create a new shipment (admin only)
app.post('/api/shipments', requireAdmin, async (req, res) => {
  const {
    order_id,
    tracking_number,
    carrier_code,
    shipping_notes,
    estimated_delivery
  } = req.body;

  if (!order_id || !tracking_number || !carrier_code) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: order_id, tracking_number, carrier_code'
    });
  }

  const carrier = config.shipping.carriers[carrier_code];
  if (!carrier) {
    return res.status(400).json({
      success: false,
      error: 'Invalid carrier code'
    });
  }

  try {
    // Check if order exists
    const orderResult = await pool.query('SELECT id FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const result = await pool.query(
      `INSERT INTO shipments
       (order_id, tracking_number, carrier_code, carrier_name, shipping_status, shipping_notes, estimated_delivery, shipped_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, now())
       RETURNING *`,
      [order_id, tracking_number, carrier_code, carrier.name, shipping_notes, estimated_delivery]
    );

    // Update order status to 'shipped'
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2',
      ['shipped', order_id]
    );

    res.json({ success: true, shipment: result.rows[0] });
  } catch (error) {
    console.error('Error creating shipment:', error);
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ success: false, error: 'Tracking number already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create shipment' });
  }
});

// Get shipment by tracking number (public)
app.get('/api/shipments/track/:trackingNumber', async (req, res) => {
  const { trackingNumber } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.*, o.customer_name, o.customer_email, o.total_amount, o.status as order_status
       FROM shipments s
       LEFT JOIN orders o ON s.order_id = o.id
       WHERE s.tracking_number = $1`,
      [trackingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    const shipment = result.rows[0];
    const carrier = config.shipping.carriers[shipment.carrier_code];

    res.json({
      success: true,
      shipment: {
        ...shipment,
        carrier_tracking_url: carrier ? carrier.trackingUrl : null,
      }
    });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({ success: false, error: 'Failed to track shipment' });
  }
});

// Get shipments for an order
app.get('/api/shipments/order/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );

    res.json({ success: true, shipments: result.rows });
  } catch (error) {
    console.error('Error fetching order shipments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shipments' });
  }
});

// Get all shipments (admin only)
app.get('/api/shipments', requireAdmin, async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 100);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;
  const status = req.query.status;
  const carrier = req.query.carrier;

  try {
    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      whereClause.push(`s.shipping_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (carrier && carrier !== 'all') {
      whereClause.push(`s.carrier_code = $${paramIndex}`);
      params.push(carrier);
      paramIndex++;
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM shipments s ${whereSQL}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT s.*, o.customer_name, o.customer_email, o.total_amount
       FROM shipments s
       LEFT JOIN orders o ON s.order_id = o.id
       ${whereSQL}
       ORDER BY s.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({ success: true, shipments: result.rows, total, page, limit });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shipments' });
  }
});

// Update shipment status (admin only)
app.put('/api/shipments/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    shipping_status,
    shipping_notes,
    estimated_delivery,
    tracking_data
  } = req.body;

  try {
    // Get current shipment
    const current = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (shipping_status !== undefined) {
      updates.push(`shipping_status = $${paramIndex}`);
      values.push(shipping_status);
      paramIndex++;

      // Auto-update delivered_at when status changes to 'delivered'
      if (shipping_status === 'delivered') {
        updates.push(`delivered_at = now()`);
      }
    }

    if (shipping_notes !== undefined) {
      updates.push(`shipping_notes = $${paramIndex}`);
      values.push(shipping_notes);
      paramIndex++;
    }

    if (estimated_delivery !== undefined) {
      updates.push(`estimated_delivery = $${paramIndex}`);
      values.push(estimated_delivery);
      paramIndex++;
    }

    if (tracking_data !== undefined) {
      updates.push(`tracking_data = $${paramIndex}`);
      values.push(JSON.stringify(tracking_data));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE shipments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Update order status if shipment is delivered
    if (shipping_status === 'delivered') {
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2',
        ['delivered', result.rows[0].order_id]
      );
    }

    res.json({ success: true, shipment: result.rows[0] });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ success: false, error: 'Failed to update shipment' });
  }
});

// Delete shipment (admin only)
app.delete('/api/shipments/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM shipments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }

    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete shipment' });
  }
});

/* ---------------------
   Inventory Alert API endpoints
   --------------------- */

// Get all inventory alerts (admin only)
app.get('/api/inventory/alerts', requireAdmin, async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 100);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;
  const status = req.query.status;
  const alertType = req.query.type;

  try {
    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      whereClause.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (alertType && alertType !== 'all') {
      whereClause.push(`a.alert_type = $${paramIndex}`);
      params.push(alertType);
      paramIndex++;
    }

    const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM inventory_alerts a ${whereSQL}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT a.*, p.name as product_name, p.stock_quantity as current_stock
       FROM inventory_alerts a
       LEFT JOIN products p ON a.product_id = p.id
       ${whereSQL}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({ success: true, alerts: result.rows, total, page, limit });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory alerts' });
  }
});

// Get inventory history for a product (admin only)
app.get('/api/inventory/history/:productId', requireAdmin, async (req, res) => {
  const { productId } = req.params;
  const limit = Math.max(1, parseInt(req.query.limit) || 50);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT * FROM inventory_history
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    res.json({ success: true, history: result.rows });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory history' });
  }
});

// Get low stock products (admin only)
app.get('/api/inventory/low-stock', requireAdmin, async (req, res) => {
  const threshold = parseInt(req.query.threshold) || config.inventory.lowStockThreshold;

  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity <= $1 AND p.is_active = true
       ORDER BY p.stock_quantity ASC`,
      [threshold]
    );

    res.json({ success: true, products: result.rows, threshold });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch low stock products' });
  }
});

// Update product inventory (admin only)
app.post('/api/inventory/update', requireAdmin, async (req, res) => {
  const { product_id, quantity_change, reason, changed_by } = req.body;

  if (!product_id || quantity_change === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: product_id, quantity_change'
    });
  }

  try {
    // Get current product quantity
    const productResult = await pool.query(
      'SELECT stock_quantity, name FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const currentQuantity = parseInt(productResult.rows[0].stock_quantity, 10);
    const newQuantity = currentQuantity + parseInt(quantity_change, 10);

    if (newQuantity < 0) {
      return res.status(400).json({ success: false, error: 'Insufficient stock' });
    }

    // Update product quantity
    await pool.query(
      'UPDATE products SET stock_quantity = $1, updated_at = now() WHERE id = $2',
      [newQuantity, product_id]
    );

    // Record inventory history
    const changeType = quantity_change > 0 ? 'restock' : 'sale';
    await pool.query(
      `INSERT INTO inventory_history
       (product_id, change_type, previous_quantity, new_quantity, quantity_change, reason, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [product_id, changeType, currentQuantity, newQuantity, quantity_change, reason, changed_by]
    );

    // Check if we need to create or update alerts
    await checkInventoryAlerts(product_id, newQuantity, productResult.rows[0].name);

    res.json({ success: true, previous_quantity: currentQuantity, new_quantity: newQuantity });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to update inventory' });
  }
});

// Resolve inventory alert (admin only)
app.put('/api/inventory/alerts/:id/resolve', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE inventory_alerts
       SET status = 'resolved', resolved_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
});

// Get notification logs (admin only)
app.get('/api/inventory/notifications', requireAdmin, async (req, res) => {
  const limit = Math.max(1, parseInt(req.query.limit) || 50);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT n.*, a.product_id, p.name as product_name
       FROM notification_logs n
       LEFT JOIN inventory_alerts a ON n.alert_id = a.id
       LEFT JOIN products p ON a.product_id = p.id
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
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
app.get('/tracking.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tracking.html')));

/* ---------------------
   Inventory Alert System
   --------------------- */

/**
 * Check inventory levels and create/update alerts
 */
async function checkInventoryAlerts(productId, currentQuantity, productName) {
  try {
    let alertType = null;
    let threshold = 0;

    // Determine alert type based on thresholds
    if (currentQuantity <= config.inventory.outOfStockThreshold) {
      alertType = 'out_of_stock';
      threshold = config.inventory.outOfStockThreshold;
    } else if (currentQuantity <= config.inventory.criticalStockThreshold) {
      alertType = 'critical_stock';
      threshold = config.inventory.criticalStockThreshold;
    } else if (currentQuantity <= config.inventory.lowStockThreshold) {
      alertType = 'low_stock';
      threshold = config.inventory.lowStockThreshold;
    }

    if (alertType) {
      // Check if alert already exists
      const existingAlert = await pool.query(
        `SELECT * FROM inventory_alerts
         WHERE product_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [productId]
      );

      if (existingAlert.rows.length > 0) {
        // Update existing alert
        const alert = existingAlert.rows[0];
        await pool.query(
          `UPDATE inventory_alerts
           SET current_quantity = $1, alert_type = $2, threshold_quantity = $3, updated_at = now()
           WHERE id = $4`,
          [currentQuantity, alertType, threshold, alert.id]
        );

        // Send notification if cooldown period has passed
        if (!alert.last_notified_at ||
            (new Date() - new Date(alert.last_notified_at)) > config.inventory.notificationCooldown) {
          await sendInventoryNotification(alert.id, productId, productName, alertType, currentQuantity, threshold);
        }
      } else {
        // Create new alert
        const result = await pool.query(
          `INSERT INTO inventory_alerts
           (product_id, alert_type, threshold_quantity, current_quantity, status)
           VALUES ($1, $2, $3, $4, 'active')
           RETURNING id`,
          [productId, alertType, threshold, currentQuantity]
        );

        // Send notification for new alert
        await sendInventoryNotification(result.rows[0].id, productId, productName, alertType, currentQuantity, threshold);
      }
    } else {
      // Stock is healthy, resolve any active alerts
      await pool.query(
        `UPDATE inventory_alerts
         SET status = 'resolved', resolved_at = now(), updated_at = now()
         WHERE product_id = $1 AND status = 'active'`,
        [productId]
      );
    }
  } catch (error) {
    console.error('Error checking inventory alerts:', error);
  }
}

/**
 * Send inventory notification (email/SMS)
 */
async function sendInventoryNotification(alertId, productId, productName, alertType, currentQuantity, threshold) {
  try {
    const alertMessages = {
      'out_of_stock': `재고 소진: ${productName}의 재고가 소진되었습니다. 현재 수량: ${currentQuantity}`,
      'critical_stock': `긴급 재고 부족: ${productName}의 재고가 매우 부족합니다. 현재 수량: ${currentQuantity} (임계값: ${threshold})`,
      'low_stock': `재고 부족 경고: ${productName}의 재고가 부족합니다. 현재 수량: ${currentQuantity} (임계값: ${threshold})`
    };

    const message = alertMessages[alertType] || `재고 알림: ${productName}`;
    const subject = `[Thai Exotic Plants] ${alertMessages[alertType]?.split(':')[0]}`;

    // Send email notifications
    if (config.inventory.enableEmailNotifications && config.inventory.adminEmails.length > 0) {
      for (const email of config.inventory.adminEmails) {
        await sendEmailNotification(alertId, email, subject, message);
      }
    }

    // Send SMS notifications
    if (config.inventory.enableSMSNotifications && config.inventory.adminPhones.length > 0) {
      for (const phone of config.inventory.adminPhones) {
        await sendSMSNotification(alertId, phone, message);
      }
    }

    // Update alert notification time and count
    await pool.query(
      `UPDATE inventory_alerts
       SET last_notified_at = now(), notification_count = notification_count + 1, updated_at = now()
       WHERE id = $1`,
      [alertId]
    );
  } catch (error) {
    console.error('Error sending inventory notification:', error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(alertId, recipient, subject, message) {
  try {
    // Log notification attempt
    const logResult = await pool.query(
      `INSERT INTO notification_logs
       (alert_id, notification_type, recipient, subject, message, status)
       VALUES ($1, 'email', $2, $3, $4, 'pending')
       RETURNING id`,
      [alertId, recipient, subject, message]
    );

    const logId = logResult.rows[0].id;

    // TODO: Integrate with actual email service (nodemailer, SendGrid, AWS SES, etc.)
    // For now, just log that we would send the email
    console.log(`[Email Notification] To: ${recipient}, Subject: ${subject}`);
    console.log(`[Email Notification] Message: ${message}`);

    // In production, uncomment and configure:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   service: config.email.service,
    //   auth: {
    //     user: config.email.user,
    //     pass: config.email.password
    //   }
    // });
    //
    // await transporter.sendMail({
    //   from: config.email.from,
    //   to: recipient,
    //   subject: subject,
    //   text: message
    // });

    // Mark as sent
    await pool.query(
      `UPDATE notification_logs
       SET status = 'sent', sent_at = now()
       WHERE id = $1`,
      [logId]
    );
  } catch (error) {
    console.error('Error sending email:', error);
    // Log error
    await pool.query(
      `UPDATE notification_logs
       SET status = 'failed', error_message = $1
       WHERE alert_id = $2 AND recipient = $3 AND notification_type = 'email'`,
      [error.message, alertId, recipient]
    );
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(alertId, recipient, message) {
  try {
    // Log notification attempt
    const logResult = await pool.query(
      `INSERT INTO notification_logs
       (alert_id, notification_type, recipient, message, status)
       VALUES ($1, 'sms', $2, $3, 'pending')
       RETURNING id`,
      [alertId, recipient, message]
    );

    const logId = logResult.rows[0].id;

    // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
    // For now, just log that we would send the SMS
    console.log(`[SMS Notification] To: ${recipient}, Message: ${message}`);

    // In production, uncomment and configure:
    // const twilio = require('twilio');
    // const client = twilio(config.sms.accountSid, config.sms.authToken);
    //
    // await client.messages.create({
    //   body: message,
    //   from: config.sms.fromNumber,
    //   to: recipient
    // });

    // Mark as sent
    await pool.query(
      `UPDATE notification_logs
       SET status = 'sent', sent_at = now()
       WHERE id = $1`,
      [logId]
    );
  } catch (error) {
    console.error('Error sending SMS:', error);
    // Log error
    await pool.query(
      `UPDATE notification_logs
       SET status = 'failed', error_message = $1
       WHERE alert_id = $2 AND recipient = $3 AND notification_type = 'sms'`,
      [error.message, alertId, recipient]
    );
  }
}

/**
 * Automated inventory checking
 */
async function checkAllInventory() {
  try {
    const result = await pool.query(
      `SELECT id, name, stock_quantity
       FROM products
       WHERE is_active = true
       ORDER BY stock_quantity ASC`
    );

    console.log(`Checking inventory for ${result.rows.length} active products...`);

    for (const product of result.rows) {
      await checkInventoryAlerts(product.id, product.stock_quantity, product.name);
    }

    console.log('Inventory check completed.');
  } catch (error) {
    console.error('Error checking inventory:', error);
  }
}

/**
 * Start automated inventory monitoring
 */
function startInventoryMonitoring() {
  const interval = config.inventory.checkInterval;
  console.log(`Starting inventory monitoring system (interval: ${interval}ms)`);

  // Run immediately on startup
  checkAllInventory();

  // Schedule periodic checks
  setInterval(checkAllInventory, interval);
}

/* ---------------------
   Shipping Auto-Update System
   --------------------- */

/**
 * Auto-update shipping status
 * This function periodically checks shipments and updates their status
 *
 * NOTE: In production, this would integrate with actual carrier APIs:
 * - CJ대한통운 API
 * - 한진택배 API
 * - 롯데택배 API
 * etc.
 *
 * Each carrier requires separate API keys and authentication.
 * For now, this is a placeholder for the auto-update system.
 */
async function updateShipmentStatuses() {
  try {
    // Get all non-delivered shipments
    const result = await pool.query(
      `SELECT * FROM shipments
       WHERE shipping_status NOT IN ('delivered', 'failed')
       ORDER BY created_at ASC
       LIMIT 100`
    );

    const shipments = result.rows;
    console.log(`Checking ${shipments.length} active shipments for status updates...`);

    for (const shipment of shipments) {
      // TODO: Integrate with actual carrier APIs
      // Example placeholder logic:
      // const carrierAPI = getCarrierAPI(shipment.carrier_code);
      // const statusUpdate = await carrierAPI.getTrackingInfo(shipment.tracking_number);
      //
      // if (statusUpdate) {
      //   await pool.query(
      //     `UPDATE shipments
      //      SET shipping_status = $1, tracking_data = $2, updated_at = now()
      //      WHERE id = $3`,
      //     [statusUpdate.status, JSON.stringify(statusUpdate.data), shipment.id]
      //   );
      // }

      // For now, log that we would check this shipment
      console.log(`Would check shipment ${shipment.tracking_number} with ${shipment.carrier_name}`);
    }
  } catch (error) {
    console.error('Error updating shipment statuses:', error);
  }
}

// Schedule auto-update based on config interval
function startShipmentAutoUpdate() {
  const interval = config.shipping.autoUpdateInterval;
  console.log(`Starting shipment auto-update system (interval: ${interval}ms)`);

  // Run immediately on startup
  updateShipmentStatuses();

  // Schedule periodic updates
  setInterval(updateShipmentStatuses, interval);
}

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

    // Start inventory monitoring system
    if (process.env.ENABLE_INVENTORY_MONITORING !== 'false') {
      startInventoryMonitoring();
    } else {
      console.log('Inventory monitoring is disabled. Set ENABLE_INVENTORY_MONITORING=true to enable.');
    }

    // Start shipping auto-update system
    if (process.env.ENABLE_SHIPPING_AUTO_UPDATE === 'true') {
      startShipmentAutoUpdate();
    } else {
      console.log('Shipping auto-update is disabled. Set ENABLE_SHIPPING_AUTO_UPDATE=true to enable.');
    }
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
