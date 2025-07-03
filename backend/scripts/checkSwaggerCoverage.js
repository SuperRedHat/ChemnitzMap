const fs = require('fs');
const path = require('path');

// 读取所有路由文件
const routesDir = path.join(__dirname, '../routes');
const docsDir = path.join(__dirname, '../docs');

// 标准化路径（移除末尾的斜杠）
function normalizePath(path) {
  return path.replace(/\/$/, '');
}

// 提取所有路由定义
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
  const fullPath = `${basePath}${route.path}`;
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
      if (file.endsWith('.js')) {
        const docs = extractSwaggerDocs(path.join(docsDir, file));
        docs.forEach(doc => documentedPaths.add(doc));
      }
    });
  }

  // 检查未文档化的路由
  console.log('=== Swagger Documentation Coverage Report ===\n');

  const undocumented = [];
  allRoutes.forEach(route => {
    const hasDoc = Array.from(documentedPaths).some(doc => {
      // 处理参数化路径
      const docPattern = doc.replace(/\{(\w+)\}/g, ':$1');
      return normalizePath(docPattern) === normalizePath(route.fullPath);
    });
    
    if (!hasDoc) {
      undocumented.push(route);
    }
  });

  if (undocumented.length === 0) {
    console.log('✅ All routes are documented!');
  } else {
    console.log(`❌ Found ${undocumented.length} undocumented routes:\n`);
    undocumented.forEach(route => {
      console.log(`   ${route.method} ${route.fullPath} (in ${route.file})`);
    });
    
    // 询问是否生成文档
    console.log('\n📝 Generating documentation templates...\n');
    
    // 生成文档模板
    const templates = undocumented.map(route => ({
      route,
      doc: generateSwaggerDoc(route, route.basePath)
    }));
    
    // 将模板保存到文件
    const outputPath = path.join(__dirname, '../docs/generated-swagger.js');
    let content = '/**\n * Auto-generated Swagger documentation templates\n * Copy these to your apiDocs.js file and customize as needed\n */\n\n';
    
    templates.forEach(({ route, doc }) => {
      content += `// ${route.method} ${route.fullPath}\n${doc}\n`;
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