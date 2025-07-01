// backend/scripts/seedAdmin.js

// 1. 加载 .env
require('dotenv').config();

const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  const {
    DB_HOST,
    DB_PORT   = '3306',
    DB_USER,
    DB_PASS,
    DB_DATABASE,
    ADMIN_USER,
    ADMIN_EMAIL,
    ADMIN_PASS
  } = process.env;

  // 基本检查
  if (!DB_DATABASE) {
    console.error('❌ 请在 .env 中设置 DB_DATABASE');
    return;
  }
  if (!ADMIN_USER || !ADMIN_EMAIL || !ADMIN_PASS) {
    console.error('❌ 请在 .env 中设置 ADMIN_USER、ADMIN_EMAIL、ADMIN_PASS');
    return;
  }

  // 2. 建立连接池
  const pool = mysql.createPool({
    host:               DB_HOST,
    port:               Number(DB_PORT),
    user:               DB_USER,
    password:           DB_PASS,
    database:           DB_DATABASE,   // 一定要是 chemnitzmap
    waitForConnections: true,
    connectionLimit:    5,
    queueLimit:         0
  });

  const conn = await pool.getConnection();
  try {
    // 3. 查询是否已有角色为 'admin' 的用户
    const [rows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM `User` WHERE role = ?",
      ['admin']
    );
    const count = rows[0].cnt;

    if (count === 0) {
      // 4. 不存在则插入一个
      const hashed = await bcrypt.hash(ADMIN_PASS, 10);
      await conn.query(
        "INSERT INTO `User` (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
        [ADMIN_USER, ADMIN_EMAIL, hashed]
      );
      console.log('✅ 已创建管理员账号:', ADMIN_USER, '/', ADMIN_EMAIL);
    } else {
      console.log('ℹ️ 管理员账号已存在，跳过创建');
    }
  } catch (err) {
    console.error('❌ seedAdmin 出错:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

// 导出给 index.js 调用
module.exports = { seedAdmin };
