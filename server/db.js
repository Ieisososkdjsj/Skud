const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Инициализация базы данных
async function initDB() {
  try {
    // ENUM для отделов
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE department_enum AS ENUM ('ГВК','ОГТ','Склад','Офис');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Таблица пользователей
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

    // Таблица логов
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

    // Таблица администраторов
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Ошибка инициализации базы:', err);
  }
}

// Запуск инициализации
initDB();

module.exports = pool;
