const swaggerJsdoc = require('swagger-jsdoc');

// 根据环境变量动态设置服务器URL
const servers = process.env.NODE_ENV === 'production' 
  ? [
      {
        url: `${process.env.API_BASE_URL}/api`,
        description: '生产服务器'
      }
    ]
  : [
      {
        url: 'http://localhost:3000/api',
        description: '开发服务器'
      }
    ];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChemnitzMap API',
      version: '1.0.0',
      description: 'Chemnitz文化地图项目的API文档',
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
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './docs/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;