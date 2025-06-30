// backend/scripts/createAdmin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdmin() {
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
    // 管理员信息
    const adminData = {
      username: 'admin',
      email: 'admin@chemnitzmap.com',
      password: 'admin123456',  // 请在生产环境中修改
      role: 'admin'
    };

    // 检查管理员是否已存在
    const [existing] = await db.query(
      'SELECT id FROM User WHERE username = ? OR email = ?',
      [adminData.username, adminData.email]
    );

    if (existing.length > 0) {
      console.log('管理员账号已存在');
      process.exit(0);
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // 创建管理员
    await db.query(
      'INSERT INTO User (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [adminData.username, adminData.email, passwordHash, adminData.role]
    );

    console.log('✅ 管理员账号创建成功！');
    console.log('用户名:', adminData.username);
    console.log('邮箱:', adminData.email);
    console.log('密码:', adminData.password);
    console.log('⚠️  请立即修改默认密码！');
  } catch (err) {
    console.error('创建管理员失败:', err);
  } finally {
    process.exit(0);
  }
}

createAdmin();