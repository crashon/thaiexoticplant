// database.js (patched)
// - safer connectionString handling
// - timestamptz usage in table creation
// - trigger to auto-update updated_at
// - insertSampleData uses transaction and ON CONFLICT DO NOTHING
// - token storage helpers (saveUserToken/getUserToken)
// - pg_trgm extension + trigram indexes recommendations added

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

// Ensure DATABASE_URL provided in production
const connectionString = process.env.DATABASE_URL || null;
if (!connectionString && process.env.NODE_ENV === 'production') {
  console.error('DATABASE_URL must be set in production');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString || 'postgresql://localhost:5432/thaiexoticplants', // dev fallback only
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  // In production you may want to exit to allow process manager to restart
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Helper: run multiple queries in order (used to create triggers/indexes)
async function execSql(client, sql) {
  await client.query(sql);
}

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create pg_trgm extension for improved search (no-op if exists)
    await execSql(client, `CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Create trigger function to set updated_at
    await execSql(client, `
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // categories
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        name_th VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER categories_set_timestamp
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // products
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        name_th VARCHAR(255),
        description TEXT,
        description_en TEXT,
        description_th TEXT,
        price NUMERIC(12,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        image_url VARCHAR(500),
        stock_quantity INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER products_set_timestamp
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // orders
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        shipping_address TEXT NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER orders_set_timestamp
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // order_items
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // social_posts
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS social_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        platforms TEXT[],
        hashtags TEXT[],
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER social_posts_set_timestamp
      BEFORE UPDATE ON social_posts
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // shops
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        name_th VARCHAR(255),
        description TEXT,
        description_en TEXT,
        description_th TEXT,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER shops_set_timestamp
      BEFORE UPDATE ON shops
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // media_items
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS media_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        size INTEGER,
        alt_text VARCHAR(255),
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER media_items_set_timestamp
      BEFORE UPDATE ON media_items
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // generated_posts
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS generated_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        platforms TEXT[],
        hashtags TEXT[],
        status VARCHAR(50) DEFAULT 'draft',
        product_id INTEGER REFERENCES products(id),
        category_id INTEGER REFERENCES categories(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER generated_posts_set_timestamp
      BEFORE UPDATE ON generated_posts
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // tokens table for storing OAuth tokens (user-specific)
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS user_tokens (
        user_id VARCHAR(255) PRIMARY KEY,
        access_token TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER user_tokens_set_timestamp
      BEFORE UPDATE ON user_tokens
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // users table for customer authentication
    await execSql(client, `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await execSql(client, `
      CREATE TRIGGER users_set_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);

    // Create index on email for faster lookups
    await execSql(client, `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    // Create trigram indexes for product search performance (if needed)
    await execSql(client, `CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);`);
    await execSql(client, `CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin (description gin_trgm_ops);`);

    await client.query('COMMIT');
    console.log('Database tables initialized successfully (with triggers/indexes).');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Insert sample data with transaction and ON CONFLICT handling
async function insertSampleData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const row = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(row.rows[0].count, 10) > 0) {
      console.log('Sample data already exists, skipping...');
      await client.query('ROLLBACK');
      return;
    }

    const categories = [
      { name: '관엽식물', name_en: 'Foliage Plants', name_th: 'พืชใบประดับ', description: '아름다운 잎을 감상하는 식물들' },
      { name: '다육식물', name_en: 'Succulents', name_th: 'พืชอวบน้ำ', description: '물을 적게 주어도 잘 자라는 식물들' },
      { name: '꽃식물', name_en: 'Flowering Plants', name_th: 'พืชดอก', description: '아름다운 꽃을 피우는 식물들' },
      { name: '허브', name_en: 'Herbs', name_th: 'สมุนไพร', description: '요리와 건강에 도움되는 허브들' }
    ];

    for (const c of categories) {
      await client.query(
        `INSERT INTO categories (name, name_en, name_th, description, is_active) 
         VALUES ($1,$2,$3,$4,true)
         ON CONFLICT (id) DO NOTHING`,
        [c.name, c.name_en, c.name_th, c.description]
      );
    }

    const products = [
      {
        name: '몬스테라 델리시오사',
        name_en: 'Monstera Deliciosa',
        name_th: 'มอนสเตอร่า เดลิซิโอซ่า',
        description: '대형 잎이 아름다운 인기 관엽식물',
        price: 25000,
        category_id: 1,
        stock_quantity: 10
      },
      {
        name: '산세베리아',
        name_en: 'Sansevieria',
        name_th: 'ซานเซเวียเรีย',
        description: '공기정화 효과가 뛰어난 다육식물',
        price: 15000,
        category_id: 2,
        stock_quantity: 20
      },
      {
        name: '안스리움',
        name_en: 'Anthurium',
        name_th: 'แอนทูเรียม',
        description: '빨간 하트 모양 꽃이 아름다운 식물',
        price: 18000,
        category_id: 3,
        stock_quantity: 15
      }
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO products (name, name_en, name_th, description, price, category_id, stock_quantity, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)
         ON CONFLICT (id) DO NOTHING`,
        [p.name, p.name_en, p.name_th, p.description, p.price, p.category_id, p.stock_quantity]
      );
    }

    const shops = [
      {
        name: '타이 익조틱 플랜트',
        name_en: 'Thai Exotic Plants',
        name_th: 'ไทย เอ็กโซติก พลานท์',
        description: '태국 최고의 이국적인 식물 전문점',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        email: 'info@thaiexoticplants.com'
      }
    ];

    for (const s of shops) {
      await client.query(
        `INSERT INTO shops (name, name_en, name_th, description, address, phone, email, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)
         ON CONFLICT (id) DO NOTHING`,
        [s.name, s.name_en, s.name_th, s.description, s.address, s.phone, s.email]
      );
    }

    await client.query('COMMIT');
    console.log('Sample data inserted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting sample data:', error);
    throw error;
  } finally {
    client.release();
  }
}

/* ---------------------
   Token Encryption Helpers
   --------------------- */

// Encryption settings
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // Must be 32 bytes for AES-256
const ALGORITHM = 'aes-256-cbc';

// Ensure ENCRYPTION_KEY is a Buffer
const encryptionKey = typeof ENCRYPTION_KEY === 'string'
  ? Buffer.from(ENCRYPTION_KEY, 'hex')
  : ENCRYPTION_KEY;

if (encryptionKey.length !== 32) {
  console.error('ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generating temporary key for development...');
  // In production, this should fail - for development, generate a temporary key
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid ENCRYPTION_KEY in production');
  }
}

/**
 * Encrypt a token using AES-256-CBC
 */
function encryptToken(token) {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return iv + encrypted data (iv is needed for decryption)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a token using AES-256-CBC
 */
function decryptToken(encryptedToken) {
  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Error decrypting token:', err.message);
    return null;
  }
}

/* ---------------------
   Token helpers
   --------------------- */
async function saveUserToken(userId, accessToken) {
  // Encrypt token before storing
  const encryptedToken = encryptToken(accessToken);

  // upsert into user_tokens
  const text = `
    INSERT INTO user_tokens (user_id, access_token)
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET access_token = EXCLUDED.access_token, updated_at = now()
  `;
  await pool.query(text, [String(userId), encryptedToken]);
}

async function getUserToken(userId) {
  const result = await pool.query('SELECT access_token FROM user_tokens WHERE user_id = $1', [String(userId)]);
  if (result.rows.length === 0) return null;

  // Decrypt token before returning
  const encryptedToken = result.rows[0].access_token;
  return decryptToken(encryptedToken);
}

module.exports = {
  pool,
  initializeDatabase,
  insertSampleData,
  saveUserToken,
  getUserToken
};

