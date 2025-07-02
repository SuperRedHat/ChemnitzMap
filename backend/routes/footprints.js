const express = require('express');
const { authenticateToken } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // 计算两点间距离（米）
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  };

  // 收集地点
  router.post('/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;
      const { lat, lon } = req.body;

      // 验证输入
      if (!lat || !lon) {
        return res.status(400).json({ error: '需要提供当前位置' });
      }

      // 获取地点信息
      const [[site]] = await db.query(
        'SELECT id, lat, lon, name FROM Site WHERE id = ?',
        [siteId]
      );
      
      if (!site) {
        return res.status(404).json({ error: '地点不存在' });
      }

      // 计算距离
      const distance = calculateDistance(lat, lon, site.lat, site.lon);
      
      // 检查距离（400米内）
      if (distance > 400) {
        return res.status(400).json({ 
          error: '距离太远，无法收集', 
          distance,
          maxDistance: 400 
        });
      }

      // 检查是否已收集
      const [existing] = await db.query(
        'SELECT id FROM Footprint WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ error: '已经收集过该地点' });
      }

      // 添加足迹
      await db.query(
        'INSERT INTO Footprint (user_id, site_id, user_lat, user_lon, distance) VALUES (?, ?, ?, ?, ?)',
        [userId, siteId, lat, lon, distance]
      );

      // 检查成就和里程碑
      const stats = await getStats(db, userId);

      res.status(201).json({ 
        message: '收集成功！',
        distance,
        stats
      });
    } catch (err) {
      console.error('收集地点错误:', err);
      res.status(500).json({ error: '收集失败' });
    }
  });

  // 获取用户所有足迹
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const [footprints] = await db.query(`
        SELECT 
          f.id, f.collected_at, f.distance,
          s.id as site_id, s.name, s.address, s.lat, s.lon, s.description,
          c.name AS category, c.color
        FROM Footprint f
        JOIN Site s ON f.site_id = s.id
        JOIN Category c ON s.category_id = c.id
        WHERE f.user_id = ?
        ORDER BY f.collected_at DESC
      `, [req.user.id]);

      res.json(footprints);
    } catch (err) {
      console.error('获取足迹列表错误:', err);
      res.status(500).json({ error: '获取足迹失败' });
    }
  });

  // 获取统计信息
  router.get('/stats', authenticateToken, async (req, res) => {
    try {
      const stats = await getStats(db, req.user.id);
      res.json(stats);
    } catch (err) {
      console.error('获取统计信息错误:', err);
      res.status(500).json({ error: '获取统计失败' });
    }
  });

  // 检查是否已收集
  router.get('/check/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;
      
      const [footprints] = await db.query(
        'SELECT collected_at, distance FROM Footprint WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );

      if (footprints.length > 0) {
        res.json({ 
          isCollected: true,
          collectedAt: footprints[0].collected_at,
          distance: footprints[0].distance
        });
      } else {
        res.json({ isCollected: false });
      }
    } catch (err) {
      console.error('检查收集状态错误:', err);
      res.status(500).json({ error: '检查失败' });
    }
  });

  // 删除足迹（仅用于测试）
  router.delete('/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;

      const [result] = await db.query(
        'DELETE FROM Footprint WHERE user_id = ? AND site_id = ?',
        [userId, siteId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '未找到该足迹记录' });
      }

      res.json({ message: '删除成功' });
    } catch (err) {
      console.error('删除足迹错误:', err);
      res.status(500).json({ error: '删除失败' });
    }
  });

  // 获取统计信息的辅助函数
  async function getStats(db, userId) {
    // 获取总收集数
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM Footprint WHERE user_id = ?',
      [userId]
    );

    // 获取总地点数
    const [[{ totalSites }]] = await db.query(
      'SELECT COUNT(*) as totalSites FROM Site'
    );

    // 按类别统计
    const [categoryStats] = await db.query(`
      SELECT c.name as category, COUNT(f.id) as count
      FROM Category c
      LEFT JOIN Site s ON c.id = s.category_id
      LEFT JOIN Footprint f ON s.id = f.site_id AND f.user_id = ?
      GROUP BY c.id, c.name
    `, [userId]);

    // 计算成就
    const achievements = [];
    
    // 类别成就（收集5个同类地点）
    categoryStats.forEach(stat => {
      if (stat.count >= 5) {
        const achievementMap = {
          'Museum': { icon: '🏛️', name: '博物馆爱好者' },
          'Theatre': { icon: '🎭', name: '戏剧达人' },
          'Public Art': { icon: '🎨', name: '艺术收藏家' },
          'Restaurant': { icon: '🍽️', name: '美食探索者' }
        };
        if (achievementMap[stat.category]) {
          achievements.push({
            ...achievementMap[stat.category],
            progress: `${stat.count}/5`
          });
        }
      }
    });

    // 特殊成就
    if (total >= 1) {
      achievements.push({ icon: '🌟', name: '初次探索', progress: '已完成' });
    }
    if (total >= 25) {
      achievements.push({ icon: '🚀', name: '城市漫游者', progress: '已完成' });
    }
    if (total >= 100) {
      achievements.push({ icon: '👑', name: '文化大使', progress: '已完成' });
    }

    // 计算里程碑（每5个地点一个勋章）
    const medals = Math.floor(total / 5);
    const nextMilestoneProgress = total % 5;

    return {
      total,
      totalSites,
      percentage: totalSites > 0 ? ((total / totalSites) * 100).toFixed(1) : 0,
      medals,
      nextMilestoneProgress,
      categoryStats,
      achievements
    };
  }

  return router;
};