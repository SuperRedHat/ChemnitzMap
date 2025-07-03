require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();
const { seedAdmin } = require('./scripts/seedAdmin.js');
const mysql = require('mysql2/promise');
const i18n = require('./config/i18n');
const i18nMiddleware = require('./middleware/i18n');
const { checkAndGenerateDocs } = require('./scripts/checkSwaggerCoverage');
app.use(cors()); 
app.use(express.json());
// i18n 中间件
app.use(i18n.init);
app.use(i18nMiddleware);


async function createApp() {
  // 检查 Swagger 文档覆盖率
  console.log('\n🔍 Checking API documentation coverage...\n');
  const coverage = checkAndGenerateDocs();
  
  if (coverage.undocumented > 0) {
    console.log('\n⚠️  Warning: Some APIs are not documented!');
    console.log('   Please check /docs/generated-swagger.js for templates.\n');
  }
  
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

  // 先执行种子脚本
  await seedAdmin();

  // 初始化评论表
  const { initComments } = require('./scripts/initComments');
  await initComments();

  // 初始化足迹表
  const { initFootprints } = require('./scripts/initFootprints');
  await initFootprints();

  // Swagger UI 路由 - 放在 API 路由之前
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 健康检查
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // 装载路由，并把 db 传进去
  app.use('/api/categories', require('./routes/categories')(db));
  app.use('/api/sites',      require('./routes/sites')(db));
  app.use('/api/users',      require('./routes/users')(db));
  app.use('/api/favorites',  require('./routes/favorites')(db));
  app.use('/api/footprints', require('./routes/footprints')(db));
  app.use('/api/comments',   require('./routes/comments')(db));

  return app;
}

createApp().then(app => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`📚 API documentation: http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});