const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // 获取某个地点的评论
  router.get('/site/:siteId', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const limit = parseInt(req.query.limit) || 5;
      const offset = parseInt(req.query.offset) || 0;

      // 获取评论列表
      const [comments] = await db.query(`
        SELECT 
          c.id, c.rating, c.text, c.created_at,
          u.username, u.id as user_id
        FROM Comment c
        JOIN User u ON c.user_id = u.id
        WHERE c.site_id = ? AND u.deleted = 0
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [siteId, limit, offset]);

      // 获取总评论数
      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) as total FROM Comment WHERE site_id = ?',
        [siteId]
      );

      // 获取平均评分
      const [[avgResult]] = await db.query(
        'SELECT AVG(rating) as avgRating, COUNT(*) as count FROM Comment WHERE site_id = ?',
        [siteId]
      );

      res.json({
        comments,
        total,
        avgRating: avgResult.avgRating || 0,
        ratingCount: avgResult.count || 0
      });
    } catch (err) {
      console.error('Get comments error:', err);
      res.status(500).json({ error: req.__('errors.fetchCommentsFailed') });
    }
  });

  // 添加评论
  router.post('/site/:siteId', authenticateToken, async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const userId = req.user.id;
      const { rating, text } = req.body;

      // 验证输入
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: req.__('errors.invalidRating') });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: req.__('errors.commentRequired') });
      }

      // 检查用户是否已经评论过
      const [existing] = await db.query(
        'SELECT id FROM Comment WHERE site_id = ? AND user_id = ?',
        [siteId, userId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: req.__('errors.alreadyCommented') });
      }

      // 插入评论
      await db.query(
        'INSERT INTO Comment (site_id, user_id, rating, text) VALUES (?, ?, ?, ?)',
        [siteId, userId, rating, text.trim()]
      );

      res.status(201).json({ message: req.__('messages.commentPublished') });
    } catch (err) {
      console.error('Add comment error:', err);
      res.status(500).json({ error: req.__('errors.publishCommentFailed') });
    }
  });

  // 获取用户的评论
  router.get('/user/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      const [comments] = await db.query(`
        SELECT 
          c.id, c.rating, c.text, c.created_at,
          s.name as site_name, s.id as site_id
        FROM Comment c
        JOIN Site s ON c.site_id = s.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `, [userId]);

      res.json(comments);
    } catch (err) {
      console.error('Get user comments error:', err);
      res.status(500).json({ error: req.__('errors.fetchCommentsFailed') });
    }
  });

  // 删除评论
  router.delete('/:commentId', authenticateToken, async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // 先查询评论信息
      const [[comment]] = await db.query(
        'SELECT user_id FROM Comment WHERE id = ?',
        [commentId]
      );

      if (!comment) {
        return res.status(404).json({ error: req.__('errors.commentNotFound') });
      }

      // 检查权限：只能删除自己的评论，管理员可以删除任何评论
      if (comment.user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: req.__('errors.noPermissionToDelete') });
      }

      // 删除评论
      await db.query('DELETE FROM Comment WHERE id = ?', [commentId]);

      res.json({ message: req.__('messages.commentDeleted') });
    } catch (err) {
      console.error('Delete comment error:', err);
      res.status(500).json({ error: req.__('errors.deleteFailed') });
    }
  });

  // 获取所有评论（管理员）
  router.get('/all/list', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const offset = (page - 1) * pageSize;

      // 获取评论列表
      const [comments] = await db.query(`
        SELECT 
          c.id, c.rating, c.text, c.created_at,
          u.username, u.id as user_id,
          s.name as site_name, s.id as site_id
        FROM Comment c
        JOIN User u ON c.user_id = u.id
        JOIN Site s ON c.site_id = s.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [pageSize, offset]);

      // 获取总数
      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) as total FROM Comment'
      );

      res.json({
        comments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    } catch (err) {
      console.error('Get all comments error:', err);
      res.status(500).json({ error: req.__('errors.fetchCommentsFailed') });
    }
  });

  // 批量删除评论（管理员）
  router.post('/batch-delete', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { commentIds } = req.body;
      
      if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
        return res.status(400).json({ error: req.__('errors.selectCommentsToDelete') });
      }

      // 使用参数化查询避免SQL注入
      const placeholders = commentIds.map(() => '?').join(',');
      await db.query(
        `DELETE FROM Comment WHERE id IN (${placeholders})`,
        commentIds
      );

      res.json({ message: req.__('messages.batchDeleteSuccess', commentIds.length) });
    } catch (err) {
      console.error('Batch delete comments error:', err);
      res.status(500).json({ error: req.__('errors.batchDeleteFailed') });
    }
  });

  return router;  // 这行必须在所有路由定义之后
};