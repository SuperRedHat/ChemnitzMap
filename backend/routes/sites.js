// routes/sites.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET /api/sites
  // 支持 ?category=Theatre&q=keyword 两个可选过滤参数
  router.get('/', async (req, res) => {
    try {
      const { category, q } = req.query;
      let sql = `
        SELECT
          s.id, s.name, s.address, s.lat, s.lon,
          s.description, s.osm_id,
          c.id AS category_id, c.name AS category, c.color
        FROM Site s
        JOIN Category c ON s.category_id = c.id
      `;
      const params = [];
      const conditions = [];

      if (category) {
        conditions.push('c.name = ?');
        params.push(category);
      }
      if (q) {
        conditions.push('s.name LIKE ?');
        params.push(`%${q}%`);
      }
      if (conditions.length) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY s.name';  // 按名字排序

      const [rows] = await db.query(sql, params);
      // 为每个地点添加描述信息（这里可以根据类别生成）
      const sitesWithDescription = rows.map(site => {
        let description = site.description || '';
        
        // 如果没有描述，根据类别生成默认描述
        if (!description) {
          switch(site.category) {
            case 'Theatre':
              description = '这是一个表演艺术场所，您可以在这里欣赏戏剧、音乐会和其他精彩演出。';
              break;
            case 'Museum':
              description = '探索丰富的历史文化收藏，了解艺术、科学和人类文明的精彩故事。';
              break;
            case 'Public Art':
              description = '户外艺术作品，展现城市的创意和文化活力。';
              break;
            case 'Restaurant':
              description = '品尝美味佳肴，体验当地和国际美食文化。';
              break;
            default:
              description = '一个值得探索的文化地点。';
          }
        }
        
        return {
          ...site,
          description
        };
      });

      res.json(sitesWithDescription);
    } catch (err) {
      console.error('Error fetching sites:', err);
      res.status(500).json({ error: 'Failed to load sites' });
    }
  });

  // GET /api/sites/:id
  router.get('/:id', async (req, res) => {
    try {
      const siteId = Number(req.params.id);
      const [rows] = await db.query(`
        SELECT
          s.id, s.name, s.address, s.lat, s.lon,
          s.description, s.osm_id,
          c.id AS category_id, c.name AS category, c.color
        FROM Site s
        JOIN Category c ON s.category_id = c.id
        WHERE s.id = ?
      `, [siteId]);

      if (!rows.length) {
        return res.status(404).json({ error: 'Site not found' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('Error fetching site details:', err);
      res.status(500).json({ error: 'Failed to load site details' });
    }
  });

  return router;
};
