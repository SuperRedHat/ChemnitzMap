// backend/routes/users.js
const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, authenticateToken, requireAdmin } = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // 用户注册
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // 验证必填字段
      if (!username || !email || !password) {
        return res.status(400).json({ error: req.__('errors.fillAllFields') });
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: req.__('errors.invalidEmail') });
      }

      // 验证密码强度
      if (password.length < 6) {
        return res.status(400).json({ error: req.__('errors.passwordTooShort') });
      }

      // 检查用户名是否已存在
      const [existingUsername] = await db.query(
        'SELECT id FROM User WHERE username = ?',
        [username]
      );
      if (existingUsername.length > 0) {
        return res.status(400).json({ error: req.__('errors.usernameExists') });
      }

      // 检查邮箱是否已存在
      const [existingEmail] = await db.query(
        'SELECT id FROM User WHERE email = ?',
        [email]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: req.__('errors.emailExists') });
      }

      // 加密密码
      const passwordHash = await bcrypt.hash(password, 10);

      // 插入新用户
      const [result] = await db.query(
        'INSERT INTO User (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );

      // 获取新创建的用户信息
      const [newUser] = await db.query(
        'SELECT id, username, email, role, created_at FROM User WHERE id = ?',
        [result.insertId]
      );

      // 生成 JWT Token
      const token = generateToken(newUser[0]);

      res.status(201).json({
        message: req.__('messages.registerSuccess'),
        user: newUser[0],
        token
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: req.__('errors.registerFailed') });
    }
  });

  // 用户登录
  router.post('/login', async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: req.__('messages.enterUsernameAndPassword') });
      }

      // 查找用户（支持用户名或邮箱登录）
      const [users] = await db.query(
        'SELECT * FROM User WHERE (email = ? OR username = ?) AND deleted = 0',
        [emailOrUsername, emailOrUsername]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: req.__('errors.emailOrPasswordError') });
      }

      const user = users[0];

      // 验证密码
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: req.__('errors.emailOrPasswordError') });
      }

      // 生成 JWT Token
      const token = generateToken(user);

      // 返回用户信息（不包含密码）
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        message: req.__('messages.loginSuccess'),
        user: userWithoutPassword,
        token
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: req.__('errors.loginFailed') });
    }
  });

  // 获取当前用户信息
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const [users] = await db.query(
        'SELECT id, username, email, role, current_lat, current_lon, created_at FROM User WHERE id = ? AND deleted = 0',  
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: req.__('errors.userNotFound') });
      }

      res.json(users[0]);
    } catch (err) {
      console.error('Get user info error:', err);
      res.status(500).json({ error: req.__('errors.getUserFailed') });
    }
  });

  // 更新当前用户信息
  router.put('/me', authenticateToken, async (req, res) => {
    try {
      const { username, email, currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // 构建更新字段
      const updates = [];
      const params = [];

      // 更新位置信息
      if (req.body.current_lat !== undefined && req.body.current_lon !== undefined) {
        updates.push('current_lat = ?, current_lon = ?');
        params.push(req.body.current_lat, req.body.current_lon);
      }

      if (username) {
        // 检查用户名是否已被其他用户使用
        const [existing] = await db.query(
          'SELECT id FROM User WHERE username = ? AND id != ?',
          [username, userId]
        );
        if (existing.length > 0) {
          return res.status(400).json({ error: req.__('errors.usernameExists') });
        }
        updates.push('username = ?');
        params.push(username);
      }

      if (email) {
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: req.__('errors.invalidEmail') });
        }

        // 检查邮箱是否已被其他用户使用
        const [existing] = await db.query(
          'SELECT id FROM User WHERE email = ? AND id != ?',
          [email, userId]
        );
        if (existing.length > 0) {
          return res.status(400).json({ error: req.__('errors.emailExists') });
        }
        updates.push('email = ?');
        params.push(email);
      }

      // 如果要修改密码
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: req.__('messages.enterCurrentPassword') });
        }

        // 验证当前密码
        const [users] = await db.query(
          'SELECT password_hash FROM User WHERE id = ?',
          [userId]
        );
        const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!passwordMatch) {
          return res.status(401).json({ error: req.__('errors.currentPasswordError') });
        }

        // 验证新密码强度
        if (newPassword.length < 6) {
          return res.status(400).json({ error: req.__('messages.newPasswordTooShort') });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        updates.push('password_hash = ?');
        params.push(passwordHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: req.__('errors.noUpdateContent') });
      }

      // 执行更新
      params.push(userId);
      await db.query(
        `UPDATE User SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // 返回更新后的用户信息
      const [updatedUser] = await db.query(
        'SELECT id, username, email, role, current_lat, current_lon, created_at FROM User WHERE id = ?',
        [userId]
      );

      res.json({
        message: req.__('messages.updateSuccess'),
        user: updatedUser[0]
      });
    } catch (err) {
      console.error('Update user info error:', err);
      res.status(500).json({ error: req.__('errors.updateFailed') });
    }
  });

  // 获取所有用户（仅管理员）
  router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [users] = await db.query(
        'SELECT id, username, email, role, deleted, current_lat, current_lon, created_at FROM User ORDER BY created_at DESC'
      );
      res.json(users);
    } catch (err) {
      console.error('Get user list error:', err);
      res.status(500).json({ error: req.__('errors.fetchUserListFailed') });
    }
  });

  // 获取已删除用户列表（仅管理员）
  router.get('/deleted/list', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [deletedUsers] = await db.query(
        'SELECT id, username, email, role, created_at FROM User WHERE deleted = 1 ORDER BY created_at DESC'
      );
      res.json(deletedUsers);
    } catch (err) {
      console.error('Get deleted users error:', err);
      res.status(500).json({ error: req.__('errors.fetchDeletedUsersFailed') });
    }
  });

  // 删除用户（软删除，仅管理员）
  router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;

      // 不能删除自己
      if (userId == req.user.id) {
        return res.status(400).json({ error: req.__('errors.cannotDeleteSelf') });
      }

      // 执行软删除
      await db.query(
        'UPDATE User SET deleted = 1 WHERE id = ?',
        [userId]
      );

      res.json({ message: req.__('messages.userDeleted') });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: req.__('errors.deleteFailed') });
    }
  });

  return router;
};