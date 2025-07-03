/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User authentication and management
 *   - name: Categories
 *     description: Cultural site categories
 *   - name: Sites
 *     description: Cultural site information
 *   - name: Favorites
 *     description: User favorites management
 *   - name: Footprints
 *     description: User collection records
 *   - name: Comments
 *     description: Site reviews and ratings
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
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           description: Email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *         current_lat:
 *           type: number
 *           description: Current latitude
 *         current_lon:
 *           type: number
 *           description: Current longitude
 *         deleted:
 *           type: boolean
 *           description: Soft deleted status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Registration time
 *     
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Category ID
 *         name:
 *           type: string
 *           description: Category name
 *         color:
 *           type: string
 *           description: Category color (HEX format)
 *     
 *     Site:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Site ID
 *         name:
 *           type: string
 *           description: Site name
 *         address:
 *           type: string
 *           description: Address
 *         lat:
 *           type: number
 *           description: Latitude
 *         lon:
 *           type: number
 *           description: Longitude
 *         category_id:
 *           type: integer
 *           description: Category ID
 *         category:
 *           type: string
 *           description: Category name
 *         color:
 *           type: string
 *           description: Category color
 *         description:
 *           type: string
 *           description: Site description
 *         osm_id:
 *           type: string
 *           description: OpenStreetMap ID
 *     
 *     Favorite:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Site ID
 *         name:
 *           type: string
 *           description: Site name
 *         address:
 *           type: string
 *           description: Address
 *         lat:
 *           type: number
 *           description: Latitude
 *         lon:
 *           type: number
 *           description: Longitude
 *         category:
 *           type: string
 *           description: Category name
 *         color:
 *           type: string
 *           description: Category color
 *         favorited_at:
 *           type: string
 *           format: date-time
 *           description: Favorite time
 *     
 *     Footprint:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Footprint ID
 *         site_id:
 *           type: integer
 *           description: Site ID
 *         name:
 *           type: string
 *           description: Site name
 *         address:
 *           type: string
 *           description: Address
 *         lat:
 *           type: number
 *           description: Site latitude
 *         lon:
 *           type: number
 *           description: Site longitude
 *         category:
 *           type: string
 *           description: Category name
 *         color:
 *           type: string
 *           description: Category color
 *         distance:
 *           type: number
 *           description: Collection distance (meters)
 *         collected_at:
 *           type: string
 *           format: date-time
 *           description: Collection time
 *     
 *     FootprintStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total collected sites
 *         totalSites:
 *           type: integer
 *           description: Total available sites
 *         percentage:
 *           type: string
 *           description: Collection percentage
 *         medals:
 *           type: integer
 *           description: Medals earned (1 per 5 sites)
 *         nextMilestoneProgress:
 *           type: integer
 *           description: Progress to next medal (0-4)
 *         categoryStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               count:
 *                 type: integer
 *         achievements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               icon:
 *                 type: string
 *               name:
 *                 type: string
 *               progress:
 *                 type: string
 *     
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Comment ID
 *         user_id:
 *           type: integer
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         site_id:
 *           type: integer
 *           description: Site ID
 *         site_name:
 *           type: string
 *           description: Site name
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating (1-5 stars)
 *         text:
 *           type: string
 *           description: Comment content
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Comment time
 *     
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *     
 *     Success:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: User registration
 *     tags: [Users]
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
 *                 description: Username (3-20 characters)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               password:
 *                 type: string
 *                 description: Password (minimum 6 characters)
 *     responses:
 *       201:
 *         description: Registration successful
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
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
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
 *                 description: Username or email
 *               password:
 *                 type: string
 *                 description: Password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   description: JWT token
 *       401:
 *         description: Invalid username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update current user information
 *     tags: [Users]
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
 *                 description: Required when changing password
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Current password incorrect
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin permission required
 */

/**
 * @swagger
 * /users/deleted/list:
 *   get:
 *     summary: Get deleted users list (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin permission required
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (soft delete, admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Delete successful
 *       400:
 *         description: Cannot delete own account
 *       403:
 *         description: Admin permission required
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Success
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
 *     summary: Get sites list
 *     tags: [Sites]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Success
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
 *     summary: Get site details
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Site'
 *       404:
 *         description: Site not found
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get current user's favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *     summary: Add favorite
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     responses:
 *       201:
 *         description: Favorite added
 *       400:
 *         description: Already favorited
 *       404:
 *         description: Site not found
 *   delete:
 *     summary: Remove favorite
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Favorite removed
 *       404:
 *         description: Favorite record not found
 */

/**
 * @swagger
 * /favorites/check/{siteId}:
 *   get:
 *     summary: Check if site is favorited
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 */

/**
 * @swagger
 * /footprints/{siteId}:
 *   post:
 *     summary: Collect a site (must be within 400m)
 *     tags: [Footprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lon
 *             properties:
 *               lat:
 *                 type: number
 *                 description: User's current latitude
 *               lon:
 *                 type: number
 *                 description: User's current longitude
 *     responses:
 *       201:
 *         description: Collection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 distance:
 *                   type: number
 *                   description: Collection distance in meters
 *                 stats:
 *                   $ref: '#/components/schemas/FootprintStats'
 *       400:
 *         description: Invalid request (too far, already collected, or missing location)
 *       404:
 *         description: Site not found
 *   delete:
 *     summary: Delete footprint (for testing)
 *     tags: [Footprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Delete successful
 *       404:
 *         description: Footprint not found
 */

/**
 * @swagger
 * /footprints:
 *   get:
 *     summary: Get user's all footprints
 *     tags: [Footprints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Footprint'
 */

/**
 * @swagger
 * /footprints/stats:
 *   get:
 *     summary: Get user's footprint statistics
 *     tags: [Footprints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FootprintStats'
 */

/**
 * @swagger
 * /footprints/check/{siteId}:
 *   get:
 *     summary: Check if site is collected
 *     tags: [Footprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCollected:
 *                   type: boolean
 *                 collectedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Collection time (if collected)
 *                 distance:
 *                   type: number
 *                   description: Collection distance in meters (if collected)
 */

/**
 * @swagger
 * /comments/site/{siteId}:
 *   get:
 *     summary: Get site comments
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of comments per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 total:
 *                   type: integer
 *                   description: Total comments count
 *                 avgRating:
 *                   type: number
 *                   description: Average rating
 *                 ratingCount:
 *                   type: integer
 *                   description: Number of ratings
 *   post:
 *     summary: Add comment to site
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - text
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating (1-5 stars)
 *               text:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment published
 *       400:
 *         description: Invalid input or already commented
 */

/**
 * @swagger
 * /comments/user/{userId}:
 *   get:
 *     summary: Get user's comments
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Delete successful
 *       403:
 *         description: No permission to delete
 *       404:
 *         description: Comment not found
 */

/**
 * @swagger
 * /comments/all/list:
 *   get:
 *     summary: Get all comments (admin only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       403:
 *         description: Admin permission required
 */

/**
 * @swagger
 * /comments/batch-delete:
 *   post:
 *     summary: Batch delete comments (admin only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentIds
 *             properties:
 *               commentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of comment IDs to delete
 *     responses:
 *       200:
 *         description: Batch delete successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin permission required
 */

module.exports = {};