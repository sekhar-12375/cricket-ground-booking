import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Database query interface
export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

let dbInstance: any = null;
let isPool = false;

export async function initDb() {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      // test connection
      await pool.query('SELECT 1');
      dbInstance = pool;
      isPool = true;
      console.log('Connected to PostgreSQL via DATABASE_URL');
    } catch (err) {
      console.warn('Failed to connect to DATABASE_URL, falling back to embedded PGlite PostgreSQL:', err);
    }
  }

  if (!dbInstance) {
    const { PGlite } = await import('@electric-sql/pglite');
    const dataDir = path.resolve(process.cwd(), '.pglite-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbInstance = new PGlite(dataDir);
    isPool = false;
    console.log('Initialized Embedded PostgreSQL (PGlite) engine at:', dataDir);
  }

  await createTablesAndSeed();
  return dbInstance;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (!dbInstance) {
    await initDb();
  }

  if (isPool) {
    const res = await dbInstance.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount };
  } else {
    const res = await dbInstance.query(sql, params);
    return { rows: res.rows, rowCount: res.rows ? res.rows.length : 0 };
  }
}

async function createTablesAndSeed() {
  // Create tables in PostgreSQL
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS grounds (
      id VARCHAR(64) PRIMARY KEY,
      ground_name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      hourly_price NUMERIC(10, 2) NOT NULL,
      opening_time VARCHAR(10) NOT NULL,
      closing_time VARCHAR(10) NOT NULL,
      availability VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      ground_id VARCHAR(64) REFERENCES grounds(id) ON DELETE CASCADE,
      booking_date VARCHAR(20) NOT NULL,
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      number_of_players INT DEFAULT 11,
      special_request TEXT,
      amount NUMERIC(10, 2) NOT NULL,
      booking_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
      payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE CASCADE,
      transaction_id VARCHAR(100) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if admin exists
  const existingAdmin = await query('SELECT id FROM admins WHERE email = $1', ['admin@cricketbook.demo']);
  if (existingAdmin.rows.length === 0) {
    const adminHash = await bcrypt.hash('Admin@12345', 10);
    await query(
      `INSERT INTO admins (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)`,
      ['adm_101', 'System Administrator', 'admin@cricketbook.demo', adminHash]
    );
    console.log('Seeded demo admin: admin@cricketbook.demo / Admin@12345');
  }

  // Check if users exist
  const existingUser1 = await query('SELECT id FROM users WHERE email = $1', ['rahul@cricketbook.demo']);
  if (existingUser1.rows.length === 0) {
    const userHash1 = await bcrypt.hash('User@12345', 10);
    await query(
      `INSERT INTO users (id, name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      ['usr_101', 'Rahul Sharma', '9876543210', 'rahul@cricketbook.demo', userHash1]
    );

    const userHash2 = await bcrypt.hash('User@12345', 10);
    await query(
      `INSERT INTO users (id, name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      ['usr_102', 'Priya Patel', '9876543211', 'priya@cricketbook.demo', userHash2]
    );
    console.log('Seeded demo users: rahul@cricketbook.demo, priya@cricketbook.demo (Password: User@12345)');
  }

  // Check if grounds exist
  const existingGrounds = await query('SELECT count(*) as cnt FROM grounds');
  const count = parseInt(existingGrounds.rows[0]?.cnt || '0', 10);
  if (count === 0) {
    const groundsSeed = [
      {
        id: 'grd_101',
        name: 'Green Valley Cricket Ground',
        location: 'Kadapa',
        description: 'Premium natural turf pitch surrounded by lush green outfield. Features electronic scoreboard, pavilion seating for 500 spectators, floodlights for day-night matches, and dedicated team dressing rooms.',
        price: 1000.00,
        open: '06:00',
        close: '22:00',
        availability: 'AVAILABLE',
        img: 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 'grd_102',
        name: 'City Sports Cricket Arena',
        location: 'Visakhapatnam',
        description: 'Coastal breeze arena with tournament-grade red soil pitch. Equipped with international standard LED floodlights, bowling machine nets for practice, digital scoring console, and shower facilities.',
        price: 1500.00,
        open: '06:00',
        close: '23:00',
        availability: 'AVAILABLE',
        img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 'grd_103',
        name: 'Champions Cricket Ground',
        location: 'Vijayawada',
        description: 'Historic city ground featuring well-maintained all-weather synthetic pitch, practice wickets, shaded dugouts, ample parking, and clean cafeteria refreshments.',
        price: 1200.00,
        open: '06:00',
        close: '22:00',
        availability: 'AVAILABLE',
        img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 'grd_104',
        name: 'Royal Cricket Arena',
        location: 'Hyderabad',
        description: 'Elite cricket sports complex with international dimension boundaries, dual grass pitches, VIP lounge, high-lux floodlight towers, and live streaming camera mounts.',
        price: 1800.00,
        open: '05:00',
        close: '23:00',
        availability: 'AVAILABLE',
        img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'
      }
    ];

    for (const g of groundsSeed) {
      await query(
        `INSERT INTO grounds (id, ground_name, location, description, hourly_price, opening_time, closing_time, availability, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [g.id, g.name, g.location, g.description, g.price, g.open, g.close, g.availability, g.img]
      );
    }
    console.log('Seeded 4 demo cricket grounds');

    // Seed realistic demo bookings & payment records
    // Booking 1: Rahul on Green Valley
    await query(
      `INSERT INTO bookings (id, user_id, ground_id, booking_date, start_time, end_time, number_of_players, special_request, amount, booking_status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['bkg_101', 'usr_101', 'grd_101', '2026-10-15', '07:00', '10:00', 14, 'White cricket balls and match umpires required', 3000.00, 'CONFIRMED', 'SUCCESS']
    );
    await query(
      `INSERT INTO payments (id, booking_id, transaction_id, amount, payment_method, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['pay_101', 'bkg_101', 'TXN_DEMO_99882211', 3000.00, 'DEMO_GATEWAY', 'SUCCESS', new Date().toISOString()]
    );

    // Booking 2: Priya on Royal Cricket Arena
    await query(
      `INSERT INTO bookings (id, user_id, ground_id, booking_date, start_time, end_time, number_of_players, special_request, amount, booking_status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['bkg_102', 'usr_102', 'grd_104', '2026-10-18', '16:00', '19:00', 16, 'Need floodlights turned on from 18:00', 5400.00, 'CONFIRMED', 'SUCCESS']
    );
    await query(
      `INSERT INTO payments (id, booking_id, transaction_id, amount, payment_method, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['pay_102', 'bkg_102', 'TXN_DEMO_44556677', 5400.00, 'DEMO_GATEWAY', 'SUCCESS', new Date().toISOString()]
    );

    // Booking 3: Rahul pending payment on City Sports
    await query(
      `INSERT INTO bookings (id, user_id, ground_id, booking_date, start_time, end_time, number_of_players, special_request, amount, booking_status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['bkg_103', 'usr_101', 'grd_102', '2026-10-22', '09:00', '11:00', 12, 'Practice session before tournament', 3000.00, 'PENDING_PAYMENT', 'PENDING']
    );
    await query(
      `INSERT INTO payments (id, booking_id, transaction_id, amount, payment_method, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['pay_103', 'bkg_103', 'TXN_PENDING_103', 3000.00, 'DEMO_GATEWAY', 'PENDING', null]
    );

    console.log('Seeded demo bookings and payments');
  }
}
