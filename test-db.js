const { Pool } = require('pg');

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'inpsyq',
};

console.log('Testing connection with config:', config);

const pool = new Pool(config);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection Error:', err);
    } else {
        console.log('Connection Success:', res.rows[0]);
    }
    pool.end();
});
