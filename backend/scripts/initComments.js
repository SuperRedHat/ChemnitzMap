require('dotenv').config();
const mysql = require('mysql2/promise');

async function initComments() {
  const db = await mysql.createPool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit:    10
  });

  try {
    // 创建评论表
    await db.query(`
      CREATE TABLE IF NOT EXISTS Comment (
        id INT PRIMARY KEY AUTO_INCREMENT,
        site_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        text TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES Site(id),
        FOREIGN KEY (user_id) REFERENCES User(id),
        INDEX idx_site_rating (site_id, rating)
      )
    `);
    
    console.log('✅ 评论表创建成功或已存在');
  } catch (err) {
    console.error('❌ 创建评论表失败:', err);
  } finally {
    await db.end();
  }
}

// 导出函数
module.exports = { initComments };