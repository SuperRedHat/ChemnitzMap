require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

async function main() {
 // 调试：先打印出来看看是不是正确读到了环境变量
  console.log('DB_USER=', process.env.DB_USER);
  console.log('DB_PASS=', process.env.DB_PASS ? '***' : '(empty)');
  console.log('DB_HOST=', process.env.DB_HOST);
  console.log('DB_NAME=', process.env.DB_DATABASE);


  const db = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit:    10,
    timezone:           'Z'
  });

    // 测试连接是否生效
  const [test] = await db.query('SELECT USER(), DATABASE() AS db');
  console.log(test);

  // 1. 调用 Overpass API，获取 Chemnitz 区域的节点/way
  const query = `
  [out:json][timeout:60];
  area["name"="Chemnitz"]["boundary"="administrative"]->.a;
  (
    node(area.a)["amenity"="theatre"];
    way(area.a)["amenity"="theatre"];
    node(area.a)["tourism"="museum"];
    way(area.a)["tourism"="museum"];
    node(area.a)["tourism"="artwork"];
    way(area.a)["tourism"="artwork"];
    node(area.a)["amenity"="restaurant"];
    way(area.a)["amenity"="restaurant"];
  );
  out body;
  >;
  out skel qt;
`;
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await axios.post(url, `data=${encodeURIComponent(query)}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const features = res.data.elements;
  // 对于 way 类型，我们需要计算中心点
  const processedFeatures = features.map(el => {
    if (el.type === 'way' && el.nodes) {
      // 计算 way 的中心点
      const nodeCoords = el.nodes.map(nodeId => {
        const node = features.find(f => f.type === 'node' && f.id === nodeId);
        return node ? [node.lat, node.lon] : null;
      }).filter(Boolean);
      
      if (nodeCoords.length > 0) {
        const avgLat = nodeCoords.reduce((sum, coord) => sum + coord[0], 0) / nodeCoords.length;
        const avgLon = nodeCoords.reduce((sum, coord) => sum + coord[1], 0) / nodeCoords.length;
        return { ...el, lat: avgLat, lon: avgLon };
      }
    }
    return el;
  }).filter(el => el.tags); // 只保留有标签的元素
  // 2. 清空 Site 表（可选）
  // 先清空 Favorite
    await db.query('DELETE FROM Favorite');
// 再删除 Site 表所有行
    await db.query('DELETE FROM Site');

  // 3. 遍历插入
let insertCount = 0;
for (const el of processedFeatures) {
  const name = el.tags.name || null;
  const lat = el.lat || el.center?.lat;
  const lon = el.lon || el.center?.lon;
  const categoryTag = el.tags.amenity === 'theatre'
    ? 'Theatre'
    : el.tags.tourism === 'museum'
      ? 'Museum'
      : el.tags.tourism === 'artwork'
        ? 'Public Art'
        : el.tags.amenity === 'restaurant'
          ? 'Restaurant'
          : null;
  if (!name || !lat || !lon || !categoryTag) continue;
  
  // 生成描述信息
  let description = '';
  if (el.tags.description) {
    description = el.tags.description;
  } else if (el.tags['description:de']) {
    description = el.tags['description:de'];
  } else if (el.tags.wikipedia) {
    description = `更多信息请访问维基百科: ${el.tags.wikipedia}`;
  } else if (el.tags.website) {
    description = `官方网站: ${el.tags.website}`;
  }
  
  // 获取更完整的地址信息
  const address = [
    el.tags['addr:street'],
    el.tags['addr:housenumber'],
    el.tags['addr:postcode'],
    el.tags['addr:city']
  ].filter(Boolean).join(' ') || '';
  
  // 查 category_id
  const [[{ id: category_id }]] = await db.query(
    'SELECT id FROM Category WHERE name = ?', [categoryTag]
  );
  await db.query(
    `INSERT INTO Site (name,address,lat,lon,category_id,description,osm_id)
     VALUES (?,?,?,?,?,?,?)`,
    [name, address, lat, lon, category_id, description, el.type+'/'+el.id]
  );
  insertCount++;
}
console.log('✅ 导入完成，共插入', insertCount, '条');

main().catch(err => { console.error(err); process.exit(1); });
