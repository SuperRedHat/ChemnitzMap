const swaggerJsdoc = require('swagger-jsdoc');

// Set server URL dynamically based on environment
const servers = process.env.NODE_ENV === 'production' 
  ? [
      {
        url: `${process.env.API_BASE_URL}/api`,
        description: 'Production server'
      }
    ]
  : [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chemnitz Cultural Map API',
      version: '1.0.0',
      description: 'RESTful API documentation for Chemnitz Cultural Map project',
      contact: {
        name: 'API Support',
        email: 'support@chemnitzmap.com'
      }
    },
    servers: servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in format: Bearer {token}'
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User authentication and management'
      },
      {
        name: 'Categories',
        description: 'Site categories'
      },
      {
        name: 'Sites',
        description: 'Cultural sites information'
      },
      {
        name: 'Favorites',
        description: 'User favorites management'
      },
      {
        name: 'Footprints',
        description: 'User collection records'
      },
      {
        name: 'Comments',
        description: 'Site reviews and ratings'
      },
      {
        name: 'Statistics',
        description: 'System statistics and analytics'
      },
      {
        name: 'System',
        description: 'System status and health checks'
      }
    ]
  },
  // 只扫描路由文件和主文档文件，排除生成的模板
  apis: ['./routes/*.js', './docs/apiDocs.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;