const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Republic_C207', // ✅ <--- This is missing or incorrect
  database: 'c372_ga'
});


module.exports = pool.promise();

