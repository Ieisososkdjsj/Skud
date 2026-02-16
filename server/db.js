const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'Skud',
  port: process.env.DB_PORT || 5432
});

// Initialize tables
async function initDB() {
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE department_enum AS ENUM ('ГВК','ОГТ','Склад','Офис');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      "ФИО" VARCHAR(150) NOT NULL,
      "UID" VARCHAR(32) UNIQUE NOT NULL,
      "Отдел" department_enum NOT NULL,
      access_point VARCHAR(50) NOT NULL DEFAULT 'КПП',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      "UID" VARCHAR(32) NOT NULL,
      access_point VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized');
}

initDB();

module.exports = pool;