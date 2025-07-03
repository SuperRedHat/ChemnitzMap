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

// 添加定时任务导入
const cron = require('node-cron');
const { updateSites } = require('./scripts/updateSites');

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

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Check if the API service is running
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   */
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // 装载路由，并把 db 传进去
  app.use('/api/categories', require('./routes/categories')(db));
  app.use('/api/sites',      require('./routes/sites')(db));
  app.use('/api/users',      require('./routes/users')(db));
  app.use('/api/favorites',  require('./routes/favorites')(db));
  app.use('/api/footprints', require('./routes/footprints')(db));
  app.use('/api/comments',   require('./routes/comments')(db));
  app.use('/api/stats', require('./routes/stats')(db));
  return app;
}

// 启动定时更新任务的函数
function startScheduledUpdates() {
  // 检查环境变量是否启用定时更新
  const enableScheduledUpdates = process.env.ENABLE_SCHEDULED_UPDATES === 'true';
  const updateCronSchedule = process.env.UPDATE_CRON_SCHEDULE || '0 2 * * 0'; // 默认每周日凌晨2点
  
  if (!enableScheduledUpdates) {
    console.log('⏰ 定时更新功能已禁用');
    return;
  }

  console.log(`⏰ 启动定时更新任务: ${updateCronSchedule}`);
  
  // 验证 cron 表达式
  if (!cron.validate(updateCronSchedule)) {
    console.error('❌ 无效的 cron 表达式:', updateCronSchedule);
    return;
  }

  // 设置定时任务
  cron.schedule(updateCronSchedule, async () => {
    console.log('\n🕐 开始执行定时更新...');
    try {
      await updateSites();
      console.log('✅ 定时更新完成\n');
    } catch (error) {
      console.error('❌ 定时更新失败:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Berlin" // 设置为德国时区
  });

  console.log('✅ 定时更新任务已启动');
  
  // 可选：在服务器启动时执行一次检查更新
  const checkOnStartup = process.env.CHECK_UPDATES_ON_STARTUP === 'true';
  if (checkOnStartup) {
    console.log('🔄 服务器启动时检查数据更新...');
    setTimeout(async () => {
      try {
        await updateSites();
        console.log('✅ 启动时数据检查完成');
      } catch (error) {
        console.error('❌ 启动时数据检查失败:', error.message);
      }
    }, 10000); // 延迟10秒，确保数据库连接稳定
  }
}

createApp().then(app => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`📚 API documentation: http://localhost:${PORT}/api-docs`);
    
    // 启动定时更新任务
    startScheduledUpdates();
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});