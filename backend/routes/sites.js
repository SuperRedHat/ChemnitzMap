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
          const descriptionKeys = {
            'Theatre': 'descriptions.theatre',
            'Museum': 'descriptions.museum',
            'Public Art': 'descriptions.publicArt',
            'Restaurant': 'descriptions.restaurant'
          };
          
          description = req.__(descriptionKeys[site.category] || 'descriptions.defaultSite');
        }
        
        return {
          ...site,
          description
        };
      });

      res.json(sitesWithDescription);
    } catch (err) {
      console.error('Error fetching sites:', err);
      res.status(500).json({ error: req.__('errors.loadSitesFailed') });
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
        return res.status(404).json({ error: req.__('errors.siteNotFound') });
      }
      
      // 处理单个站点的描述
      let site = rows[0];
      if (!site.description) {
        const descriptionKeys = {
          'Theatre': 'descriptions.theatre',
          'Museum': 'descriptions.museum',
          'Public Art': 'descriptions.publicArt',
          'Restaurant': 'descriptions.restaurant'
        };
        
        site.description = req.__(descriptionKeys[site.category] || 'descriptions.defaultSite');
      }
      
      res.json(site);
    } catch (err) {
      console.error('Error fetching site details:', err);
      res.status(500).json({ error: req.__('errors.loadSiteDetailsFailed') });
    }
  });

  return router;
};