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
      res.json(rows);
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
