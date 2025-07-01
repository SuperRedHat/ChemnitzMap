// 根据环境动态配置API地址
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    API_DOCS_URL: 'http://localhost:3000/api-docs'
  },
  production: {
    API_BASE_URL: '/api', // 生产环境使用相对路径
    API_DOCS_URL: '/api-docs'
  }
};

const env = process.env.NODE_ENV || 'development';

export default config[env];