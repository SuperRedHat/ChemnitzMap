const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  /**
   * @swagger
   * /stats/summary:
   *   get:
   *     summary: Get site and user statistics
   *     tags: [Statistics]
   *     responses:
   *       200:
   *         description: Success
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 siteCount:
   *                   type: integer
   *                   description: Total number of cultural sites
   *                   example: 238
   *                 userCount:
   *                   type: integer
   *                   description: Total number of active users
   *                   example: 156
   *                 categoryCount:
   *                   type: integer
   *                   description: Number of categories
   *                   example: 4
   *                 categoryStats:
   *                   type: array
   *                   description: Statistics for each category
   *                   items:
   *                     type: object
   *                     properties:
   *                       category:
   *                         type: string
   *                         description: Category name
   *                         example: Museum
   *                       count:
   *                         type: integer
   *                         description: Number of sites in this category
   *                         example: 45
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/summary', async (req, res) => {
    try {
      // 获取文化地点总数
      const [[{ siteCount }]] = await db.query(
        'SELECT COUNT(*) as siteCount FROM Site'
      );

      // 获取注册用户总数（不包括已删除的）
      const [[{ userCount }]] = await db.query(
        'SELECT COUNT(*) as userCount FROM User WHERE deleted = 0'
      );

      // 获取各类别的地点数量
      const [categoryStats] = await db.query(`
        SELECT c.name as category, COUNT(s.id) as count
        FROM Category c
        LEFT JOIN Site s ON c.id = s.category_id
        GROUP BY c.id, c.name
      `);

      res.json({
        siteCount,
        userCount,
        categoryCount: 4, // 固定4个类别
        categoryStats
      });
    } catch (err) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  return router;
};