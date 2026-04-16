import mysql from 'mysql2/promise';

async function checkDb() {
  const connection = await mysql.createConnection({
    host: '39.97.112.184',
    port: 3306,
    user: 'exam_skill',
    password: 'exam_skill@yhjz',
    database: 'exam_skill',
    connectTimeout: 10000 // 10秒超时
  });

  try {
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

checkDb();