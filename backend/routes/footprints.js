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
        return res.status(400).json({ error: req.__('errors.needLocation') });
      }

      // 获取地点信息
      const [[site]] = await db.query(
        'SELECT id, lat, lon, name FROM Site WHERE id = ?',
        [siteId]
      );
      
      if (!site) {
        return res.status(404).json({ error: req.__('errors.siteNotFound') });
      }

      // 计算距离
      const distance = calculateDistance(lat, lon, site.lat, site.lon);
      
      // 检查距离（400米内）
      if (distance > 400) {
        return res.status(400).json({ 
          error: req.__('errors.tooFarToCollect'), 
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
        return res.status(400).json({ error: req.__('errors.alreadyCollected') });
      }

      // 添加足迹
      await db.query(
        'INSERT INTO Footprint (user_id, site_id, user_lat, user_lon, distance) VALUES (?, ?, ?, ?, ?)',
        [userId, siteId, lat, lon, distance]
      );

      // 检查成就和里程碑
      const stats = await getStats(db, userId, req);

      res.status(201).json({ 
        message: req.__('messages.collectSuccess'),
        distance,
        stats
      });
    } catch (err) {
      console.error('Collect site error:', err);
      res.status(500).json({ error: req.__('errors.collectFailed') });
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
      console.error('Get footprints error:', err);
      res.status(500).json({ error: req.__('errors.fetchFootprintsFailed') });
    }
  });

  // 获取统计信息
  router.get('/stats', authenticateToken, async (req, res) => {
    try {
      const stats = await getStats(db, req.user.id, req);
      res.json(stats);
    } catch (err) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: req.__('errors.fetchStatsFailed') });
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
      console.error('Check collection status error:', err);
      res.status(500).json({ error: req.__('errors.checkCollectionStatusFailed') });
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
        return res.status(404).json({ error: req.__('errors.footprintNotFound') });
      }

      res.json({ message: req.__('messages.footprintDeleted') });
    } catch (err) {
      console.error('Delete footprint error:', err);
      res.status(500).json({ error: req.__('errors.deleteFootprintFailed') });
    }
  });

  // 获取统计信息的辅助函数
  async function getStats(db, userId, req) {
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
          'Museum': { icon: '🏛️', nameKey: 'achievements.museumLover' },
          'Theatre': { icon: '🎭', nameKey: 'achievements.theaterFan' },
          'Public Art': { icon: '🎨', nameKey: 'achievements.artCollector' },
          'Restaurant': { icon: '🍽️', nameKey: 'achievements.foodExplorer' }
        };
        if (achievementMap[stat.category]) {
          achievements.push({
            icon: achievementMap[stat.category].icon,
            name: req.__(achievementMap[stat.category].nameKey),
            progress: `${stat.count}/5`
          });
        }
      }
    });

    // 特殊成就
    if (total >= 1) {
      achievements.push({ 
        icon: '🌟', 
        name: req.__('achievements.firstExplore'), 
        progress: req.__('achievements.completed') 
      });
    }
    if (total >= 25) {
      achievements.push({ 
        icon: '🚀', 
        name: req.__('achievements.cityWanderer'), 
        progress: req.__('achievements.completed') 
      });
    }
    if (total >= 100) {
      achievements.push({ 
        icon: '👑', 
        name: req.__('achievements.culturalAmbassador'), 
        progress: req.__('achievements.completed') 
      });
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