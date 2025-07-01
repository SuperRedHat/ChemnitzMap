/**
 * @swagger
 * tags:
 *   - name: 用户管理
 *     description: 用户相关操作
 *   - name: 分类管理
 *     description: 文化地点分类
 *   - name: 地点管理
 *     description: 文化地点信息
 *   - name: 收藏管理
 *     description: 用户收藏功能
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 *         email:
 *           type: string
 *           description: 邮箱
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: 用户角色
 *         current_lat:
 *           type: number
 *           description: 当前纬度
 *         current_lon:
 *           type: number
 *           description: 当前经度
 *         deleted:
 *           type: boolean
 *           description: 是否已删除
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *     
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *         color:
 *           type: string
 *           description: 分类颜色（HEX格式）
 *     
 *     Site:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 地点ID
 *         name:
 *           type: string
 *           description: 地点名称
 *         address:
 *           type: string
 *           description: 地址
 *         lat:
 *           type: number
 *           description: 纬度
 *         lon:
 *           type: number
 *           description: 经度
 *         category_id:
 *           type: integer
 *           description: 分类ID
 *         category:
 *           type: string
 *           description: 分类名称
 *         color:
 *           type: string
 *           description: 分类颜色
 *         description:
 *           type: string
 *           description: 描述信息
 *         osm_id:
 *           type: string
 *           description: OpenStreetMap ID
 *     
 *     Favorite:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 地点ID
 *         name:
 *           type: string
 *           description: 地点名称
 *         address:
 *           type: string
 *           description: 地址
 *         lat:
 *           type: number
 *           description: 纬度
 *         lon:
 *           type: number
 *           description: 经度
 *         category:
 *           type: string
 *           description: 分类名称
 *         color:
 *           type: string
 *           description: 分类颜色
 *         favorited_at:
 *           type: string
 *           format: date-time
 *           description: 收藏时间
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: 用户注册
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名（3-20字符）
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               password:
 *                 type: string
 *                 description: 密码（至少6位）
 *     responses:
 *       201:
 *         description: 注册成功
 *       400:
 *         description: 请求参数错误
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: 用户登录
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 description: 用户名或邮箱
 *               password:
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: 用户名或密码错误
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 未认证
 *   put:
 *     summary: 更新当前用户信息
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               current_lat:
 *                 type: number
 *               current_lon:
 *                 type: number
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 获取所有用户（管理员）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: 需要管理员权限
 */

/**
 * @swagger
 * /users/deleted/list:
 *   get:
 *     summary: 获取已删除用户列表（管理员）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: 删除用户（软删除，管理员）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 不能删除自己
 *       403:
 *         description: 需要管理员权限
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: 获取所有分类
 *     tags: [分类管理]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /sites:
 *   get:
 *     summary: 获取地点列表
 *     tags: [地点管理]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 按分类筛选
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Site'
 */

/**
 * @swagger
 * /sites/{id}:
 *   get:
 *     summary: 获取地点详情
 *     tags: [地点管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 地点ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       404:
 *         description: 地点不存在
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: 获取当前用户的收藏列表
 *     tags: [收藏管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Favorite'
 */

/**
 * @swagger
 * /favorites/{siteId}:
 *   post:
 *     summary: 添加收藏
 *     tags: [收藏管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 地点ID
 *     responses:
 *       201:
 *         description: 收藏成功
 *       400:
 *         description: 已经收藏过
 *       404:
 *         description: 地点不存在
 *   delete:
 *     summary: 取消收藏
 *     tags: [收藏管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 地点ID
 *     responses:
 *       200:
 *         description: 取消收藏成功
 *       404:
 *         description: 未找到收藏记录
 */

/**
 * @swagger
 * /favorites/check/{siteId}:
 *   get:
 *     summary: 检查是否已收藏
 *     tags: [收藏管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 地点ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 */

module.exports = {};