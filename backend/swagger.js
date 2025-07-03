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
      }
    ]
  },
  apis: ['./routes/*.js', './docs/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;