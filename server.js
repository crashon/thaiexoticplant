// server.js (patched for security & reliability)
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { pool, initializeDatabase, insertSampleData, saveUserToken, getUserToken } = require('./database');

// JWT secret (should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

const app = express();
const PORT = config.server.port;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (can be configured later)
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // More permissive for API endpoints
  message: 'Too many API requests, please try again later.',
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Validation middleware helper
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

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

// Serve static files from root folder
// NOTE: In production, move all frontend files to a 'public' folder for better security
app.use(express.static(__dirname));

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
 * JWT Authentication middleware
 * - Verifies JWT token from Authorization header
 * - Adds user info to req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided. Please include Authorization header with Bearer token.'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid tokens in optional auth
    }
  }

  next();
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

/* ---------------------
   User Authentication Routes
   --------------------- */

// POST /api/auth/register - User registration
app.post('/api/auth/register',
  authLimiter,
  validate([
    body('email').trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('phone').optional().trim()
      .matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone number format'),
    body('address').optional().trim()
      .isLength({ max: 1000 }).withMessage('Address must not exceed 1000 characters')
  ]),
  async (req, res) => {
    const { email, password, name, phone, address } = req.body;

    try {
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Insert new user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, phone, address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, phone, address, is_active, is_admin, created_at`,
        [email, password_hash, name, phone || null, address || null]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          is_admin: user.is_admin
        },
        token
      });
    } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ success: false, error: 'Failed to register user' });
    }
  }
);

// POST /api/auth/login - User login
app.post('/api/auth/login',
  authLimiter,
  validate([
    body('email').trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      // Find user
      const result = await pool.query(
        'SELECT id, email, password_hash, name, phone, address, is_active, is_admin FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Account is disabled. Please contact support.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Update last login
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          is_admin: user.is_admin
        },
        token
      });
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ success: false, error: 'Failed to log in' });
    }
  }
);

// GET /api/auth/me - Get current user info (requires authentication)
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, address, is_active, is_admin, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user info' });
  }
});

// PUT /api/auth/profile - Update user profile (requires authentication)
app.put('/api/auth/profile',
  requireAuth,
  validate([
    body('name').optional().trim()
      .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('phone').optional().trim()
      .matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone number format'),
    body('address').optional().trim()
      .isLength({ max: 1000 }).withMessage('Address must not exceed 1000 characters')
  ]),
  async (req, res) => {
    const { name, phone, address } = req.body;

    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      if (address !== undefined) {
        updates.push(`address = $${paramCount++}`);
        values.push(address);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      values.push(req.user.id);
      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, name, phone, address, is_admin
      `;

      const result = await pool.query(query, values);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: result.rows[0]
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

/* ---------------------
   Product & Category Routes
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

// POST /api/orders - Create a new order
app.post('/api/orders',
  apiLimiter,
  validate([
    body('customer_name').trim().notEmpty().withMessage('Customer name is required')
      .isLength({ min: 2, max: 255 }).withMessage('Customer name must be between 2 and 255 characters'),
    body('customer_email').trim().notEmpty().withMessage('Customer email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('customer_phone').optional().trim()
      .matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Invalid phone number format'),
    body('shipping_address').trim().notEmpty().withMessage('Shipping address is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Shipping address must be between 10 and 1000 characters'),
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.product_id').isInt({ min: 1 }).withMessage('Each item must have a valid product_id'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Each item price must be non-negative')
  ]),
  async (req, res) => {
  const { customer_name, customer_email, customer_phone, shipping_address, items } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      total_amount += parseFloat(item.price) * parseInt(item.quantity);
    }

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, shipping_address, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, created_at`,
      [customer_name, customer_email, customer_phone || null, shipping_address, total_amount.toFixed(2), 'pending']
    );

    const order = orderResult.rows[0];

    // Insert order items and update stock
    const orderItems = [];
    for (const item of items) {
      // Insert order item
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_id, product_id, quantity, price, created_at`,
        [order.id, item.product_id, item.quantity, item.price]
      );
      orderItems.push(itemResult.rows[0]);

      // Update product stock (optional - check if product exists and has enough stock)
      const productResult = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length > 0) {
        const currentStock = productResult.rows[0].stock_quantity;
        if (currentStock < item.quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for product ${item.product_id}. Available: ${currentStock}, Requested: ${item.quantity}`
          });
        }

        // Decrease stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        ...order,
        items: orderItems
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  } finally {
    client.release();
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
   Static HTML routes
   --------------------- */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/shops.html', (req, res) => res.sendFile(path.join(__dirname, 'shops.html')));
app.get('/shop.html', (req, res) => res.sendFile(path.join(__dirname, 'shop.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/shop-owner.html', (req, res) => res.sendFile(path.join(__dirname, 'shop-owner.html')));

/* ---------------------
   Error Handling Middleware
   --------------------- */

// 404 handler - must be after all routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: err.message
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large'
    });
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      details: err.message
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint violations
    return res.status(400).json({
      success: false,
      error: 'Database constraint violation',
      details: process.env.NODE_ENV === 'production' ? 'Invalid data' : err.message
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

/* ---------------------
   Start server
   --------------------- */
startServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET /tables/categories?limit=100');
    console.log('- GET /tables/products?page=1&limit=20&sort=name');
    console.log('- POST /api/orders (create new order)');
    console.log('- Protected endpoints require x-admin-token header or ADMIN_API_TOKEN in query');
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
