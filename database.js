const { Pool } = require('pg');
require('dotenv').config();

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/thaiexoticplants',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout and retry logic
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20
});

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

// Database initialization
async function initializeDatabase() {
    try {
        // Create tables if they don't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_en VARCHAR(255),
                name_th VARCHAR(255),
                description TEXT,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_en VARCHAR(255),
                name_th VARCHAR(255),
                description TEXT,
                description_en TEXT,
                description_th TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id INTEGER REFERENCES categories(id),
                image_url VARCHAR(500),
                stock_quantity INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50),
                shipping_address TEXT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS social_posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                platforms TEXT[],
                hashtags TEXT[],
                status VARCHAR(50) DEFAULT 'draft',
                scheduled_at TIMESTAMP,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS media_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                size INTEGER,
                alt_text VARCHAR(255),
                tags TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Insert sample data
async function insertSampleData() {
    try {
        // Check if data already exists
        const categoryCount = await pool.query('SELECT COUNT(*) FROM categories');
        if (parseInt(categoryCount.rows[0].count) > 0) {
            console.log('Sample data already exists, skipping...');
            return;
        }

        // Insert categories
        const categories = [
            { name: '관엽식물', name_en: 'Foliage Plants', name_th: 'พืชใบประดับ', description: '아름다운 잎을 감상하는 식물들' },
            { name: '다육식물', name_en: 'Succulents', name_th: 'พืชอวบน้ำ', description: '물을 적게 주어도 잘 자라는 식물들' },
            { name: '꽃식물', name_en: 'Flowering Plants', name_th: 'พืชดอก', description: '아름다운 꽃을 피우는 식물들' },
            { name: '허브', name_en: 'Herbs', name_th: 'สมุนไพร', description: '요리와 건강에 도움되는 허브들' }
        ];

        for (const category of categories) {
            await pool.query(
                'INSERT INTO categories (name, name_en, name_th, description) VALUES ($1, $2, $3, $4)',
                [category.name, category.name_en, category.name_th, category.description]
            );
        }

        // Insert products
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

        for (const product of products) {
            await pool.query(
                'INSERT INTO products (name, name_en, name_th, description, price, category_id, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [product.name, product.name_en, product.name_th, product.description, product.price, product.category_id, product.stock_quantity]
            );
        }

        // Insert shops
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

        for (const shop of shops) {
            await pool.query(
                'INSERT INTO shops (name, name_en, name_th, description, address, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [shop.name, shop.name_en, shop.name_th, shop.description, shop.address, shop.phone, shop.email]
            );
        }

        console.log('Sample data inserted successfully');
    } catch (error) {
        console.error('Error inserting sample data:', error);
        throw error;
    }
}

module.exports = {
    pool,
    initializeDatabase,
    insertSampleData
};
