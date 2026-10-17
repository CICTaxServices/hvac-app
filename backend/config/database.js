const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'hvac_user',
  password: process.env.DB_PASSWORD || 'hvac_password',
  database: process.env.DB_NAME || 'hvac_db',
};

// Add SSL for Render PostgreSQL
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
