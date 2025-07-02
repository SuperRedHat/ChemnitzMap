require('dotenv').config();
const mysql = require('mysql2/promise');

async function initFootprints() {
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
    // 创建足迹表
    await db.query(`
      CREATE TABLE IF NOT EXISTS Footprint (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        site_id INT NOT NULL,
        collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_lat DOUBLE,
        user_lon DOUBLE,
        distance INT COMMENT '收集时的距离(米)',
        UNIQUE KEY unique_footprint (user_id, site_id),
        FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES Site(id) ON DELETE CASCADE,
        INDEX idx_user_collected (user_id, collected_at),
        INDEX idx_user_site (user_id, site_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ 足迹表创建成功或已存在');
  } catch (err) {
    console.error('❌ 创建足迹表失败:', err);
  } finally {
    await db.end();
  }
}

// 导出函数
module.exports = { initFootprints };