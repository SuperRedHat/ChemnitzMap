// routes/categories.js
// 导出一个函数，接收 db 连接池，返回 Router
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET /api/categories
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT id, name, color FROM Category');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to load categories' });
    }
  });

  return router;
};
