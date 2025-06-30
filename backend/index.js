require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');

async function createApp() {
  const app = express();
  app.use(express.json());

  // 建立数据库连接池
  const db = await mysql.createPool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit:    10,
  });

  // 健康检查
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // 装载路由，并把 db 传进去
  app.use('/api/categories', require('./routes/categories')(db));
  app.use('/api/sites',      require('./routes/sites')(db));

  return app;
}

createApp().then(app => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
