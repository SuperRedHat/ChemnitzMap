const cron = require('node-cron');
const { updateSites } = require('./updateSites');

// 每周日凌晨2点更新
cron.schedule('0 2 * * 0', async () => {
  console.log('🕐 开始定时更新地点数据...');
  try {
    await updateSites();
    console.log('✅ 定时更新完成');
  } catch (error) {
    console.error('❌ 定时更新失败:', error);
  }
});

console.log('⏰ 定时更新任务已启动（每周日凌晨2点）');