// backend/routes/favorites.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // 获取当前用户的收藏列表
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const [favorites] = await db.query(`
        SELECT 
          s.id, s.name, s.address, s.lat, s.lon, s.description,
          c.name AS category, c.color,
          f.created_at AS favorited_at
        FROM Favorite f
        JOIN Site s ON f.site_id = s.id
        JOIN Category c ON s.category_id = c.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `, [req.user.id]);

      res.json(favorites);
    } catch (err) {
      console.error('获取收藏列表错误:', err);
      res.status(500).json({ error: '获取收藏列表失败' });
    }
  });

  // 添加收藏
  router.post('/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;

      // 检查地点是否存在
      const [sites] = await db.query(
        'SELECT id FROM Site WHERE id = ?',
        [siteId]
      );
      if (sites.length === 0) {
        return res.status(404).json({ error: '地点不存在' });
      }

      // 检查是否已收藏
      const [existing] = await db.query(
        'SELECT * FROM Favorite WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: '已经收藏过该地点' });
      }

      // 添加收藏
      await db.query(
        'INSERT INTO Favorite (user_id, site_id) VALUES (?, ?)',
        [userId, siteId]
      );

      res.status(201).json({ message: '收藏成功' });
    } catch (err) {
      console.error('添加收藏错误:', err);
      res.status(500).json({ error: '添加收藏失败' });
    }
  });

  // 取消收藏
  router.delete('/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;

      const [result] = await db.query(
        'DELETE FROM Favorite WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '未找到该收藏记录' });
      }

      res.json({ message: '取消收藏成功' });
    } catch (err) {
      console.error('取消收藏错误:', err);
      res.status(500).json({ error: '取消收藏失败' });
    }
  });

  // 检查某个地点是否已被当前用户收藏
  router.get('/check/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;

      const [favorites] = await db.query(
        'SELECT * FROM Favorite WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );

      res.json({ isFavorited: favorites.length > 0 });
    } catch (err) {
      console.error('检查收藏状态错误:', err);
      res.status(500).json({ error: '检查收藏状态失败' });
    }
  });

  return router;
};