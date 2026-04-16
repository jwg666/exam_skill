import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '39.97.112.184',
  port: 3306,
  user: 'exam_skill',
  password: 'exam_skill@yhjz',
  database: 'exam_skill',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;