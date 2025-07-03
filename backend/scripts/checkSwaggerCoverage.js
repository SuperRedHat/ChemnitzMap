const fs = require('fs');
const path = require('path');

// 读取所有路由文件
const routesDir = path.join(__dirname, '../routes');
const docsDir = path.join(__dirname, '../docs');
const indexFile = path.join(__dirname, '../index.js');

// 标准化路径（移除末尾的斜杠）
function normalizePath(path) {
  return path.replace(/\/$/, '');
}

// 提取路由文件中的路由定义
function extractRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  
  // 匹配 router.get, router.post, router.put, router.delete 等
  const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      path: normalizePath(match[2]),
      file: path.basename(filePath)
    });
  }
  
  return routes;
}

// 提取index.js中的直接路由定义
function extractIndexRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  
  // 匹配 app.get, app.post 等直接定义在app上的路由
  const appRouteRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = appRouteRegex.exec(content)) !== null) {
    let routePath = match[2];
    // 移除 /api 前缀来匹配其他路由的格式
    if (routePath.startsWith('/api')) {
      routePath = routePath.substring(4);
    }
    
    routes.push({
      method: match[1].toUpperCase(),
      path: normalizePath(routePath),
      file: 'index.js',
      fullPath: normalizePath(match[2]) // 保留完整路径用于文档匹配
    });
  }
  
  return routes;
}

// 提取所有 Swagger 文档
function extractSwaggerDocs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const docs = [];
  
  // 匹配 @swagger 路径定义
  const swaggerRegex = /@swagger\s*\n\s*\*\s*([\/\w\{\}:-]+):/g;
  let match;
  
  while ((match = swaggerRegex.exec(content)) !== null) {
    docs.push(normalizePath(match[1]));
  }
  
  return docs;
}

// 生成基础 Swagger 文档
function generateSwaggerDoc(route, basePath) {
  const fullPath = route.fullPath || `${basePath}${route.path}`;
  const tag = route.file.replace('.js', '').charAt(0).toUpperCase() + route.file.replace('.js', '').slice(1);
  
  let template = `/**
 * @swagger
 * ${fullPath}:
 *   ${route.method.toLowerCase()}:
 *     summary: ${route.method} ${fullPath}
 *     tags: [${tag}]`;

  // 如果路径包含参数
  if (route.path.includes(':')) {
    const params = route.path.match(/:(\w+)/g) || [];
    if (params.length > 0) {
      template += `\n *     parameters:`;
      params.forEach(param => {
        const paramName = param.substring(1);
        template += `\n *       - in: path
 *         name: ${paramName}
 *         required: true
 *         schema:
 *           type: integer
 *         description: ${paramName} ID`;
      });
    }
  }

  // 添加 security（如果不是公开路由）
  if (!['categories', 'sites'].includes(route.file.replace('.js', '')) || route.method !== 'GET' || route.path.includes(':')) {
    template += `\n *     security:
 *       - bearerAuth: []`;
  }

  template += `\n *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */\n`;

  return template;
}

// 主函数
function checkAndGenerateDocs() {
  // 获取所有路由
  const allRoutes = [];
  
  // 1. 扫描routes目录下的路由文件
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  
  routeFiles.forEach(file => {
    const routes = extractRoutes(path.join(routesDir, file));
    routes.forEach(route => {
      // 根据文件名构建基础路径
      const basePath = `/${file.replace('.js', '')}`;
      route.basePath = basePath;
      route.fullPath = normalizePath(`${basePath}${route.path}`);
      allRoutes.push(route);
    });
  });

  // 2. 扫描index.js中的直接路由
  if (fs.existsSync(indexFile)) {
    const indexRoutes = extractIndexRoutes(indexFile);
    allRoutes.push(...indexRoutes);
  }

  // 获取所有文档化的路径
  const documentedPaths = new Set();
  
  // 从路由文件中提取
  routeFiles.forEach(file => {
    const docs = extractSwaggerDocs(path.join(routesDir, file));
    docs.forEach(doc => documentedPaths.add(doc));
  });

  // 从文档文件中提取
  if (fs.existsSync(docsDir)) {
    fs.readdirSync(docsDir).forEach(file => {
      if (file.endsWith('.js') && !file.includes('generated')) {
        const docs = extractSwaggerDocs(path.join(docsDir, file));
        docs.forEach(doc => documentedPaths.add(doc));
      }
    });
  }

  // 从index.js中提取
  if (fs.existsSync(indexFile)) {
    const docs = extractSwaggerDocs(indexFile);
    docs.forEach(doc => documentedPaths.add(doc));
  }

  // 检查未文档化的路由
  console.log('=== Swagger Documentation Coverage Report ===\n');

  const undocumented = [];
  allRoutes.forEach(route => {
    const checkPath = route.fullPath || normalizePath(`${route.basePath}${route.path}`);
    const hasDoc = Array.from(documentedPaths).some(doc => {
      // 处理参数化路径
      const docPattern = doc.replace(/\{(\w+)\}/g, ':$1');
      return normalizePath(docPattern) === normalizePath(checkPath);
    });
    
    if (!hasDoc) {
      undocumented.push(route);
    }
  });

  // 输出详细的路由列表（调试用）
  console.log('📋 Detected Routes:');
  allRoutes.forEach((route, index) => {
    const fullPath = route.fullPath || `${route.basePath}${route.path}`;
    console.log(`   ${index + 1}. ${route.method} ${fullPath} (${route.file})`);
  });
  console.log();

  if (undocumented.length === 0) {
    console.log('✅ All routes are documented!');
  } else {
    console.log(`❌ Found ${undocumented.length} undocumented routes:\n`);
    undocumented.forEach(route => {
      const fullPath = route.fullPath || `${route.basePath}${route.path}`;
      console.log(`   ${route.method} ${fullPath} (in ${route.file})`);
    });
    
    // 生成文档模板
    console.log('\n📝 Generating documentation templates...\n');
    
    const templates = undocumented.map(route => ({
      route,
      doc: generateSwaggerDoc(route, route.basePath)
    }));
    
    // 将模板保存到文件
    const outputPath = path.join(__dirname, '../docs/generated-swagger.js');
    let content = '/**\n * Auto-generated Swagger documentation templates\n * Copy these to your apiDocs.js file and customize as needed\n */\n\n';
    
    templates.forEach(({ route, doc }) => {
      const fullPath = route.fullPath || `${route.basePath}${route.path}`;
      content += `// ${route.method} ${fullPath}\n${doc}\n`;
    });
    
    fs.writeFileSync(outputPath, content);
    console.log(`📄 Generated documentation templates saved to: ${outputPath}`);
  }

  console.log(`\nTotal routes: ${allRoutes.length}`);
  console.log(`Documented: ${allRoutes.length - undocumented.length}`);
  console.log(`Coverage: ${((allRoutes.length - undocumented.length) / allRoutes.length * 100).toFixed(1)}%`);
  
  return {
    total: allRoutes.length,
    documented: allRoutes.length - undocumented.length,
    undocumented: undocumented.length,
    coverage: ((allRoutes.length - undocumented.length) / allRoutes.length * 100).toFixed(1)
  };
}

// 如果直接运行脚本
if (require.main === module) {
  checkAndGenerateDocs();
}

module.exports = { checkAndGenerateDocs };