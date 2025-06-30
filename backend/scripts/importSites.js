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
    [out:json][timeout:25];
    area["name"="Chemnitz"]["boundary"="administrative"]->.a;
    (
      node(area.a)["amenity"="theatre"];
      node(area.a)["tourism"="museum"];
      node(area.a)["tourism"="artwork"];
      node(area.a)["amenity"="restaurant"];
    );
    out center;
  `;
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await axios.post(url, `data=${encodeURIComponent(query)}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const features = res.data.elements;
  // 2. 清空 Site 表（可选）
  // 先清空 Favorite
    await db.query('DELETE FROM Favorite');
// 再删除 Site 表所有行
    await db.query('DELETE FROM Site');

  // 3. 遍历插入
  for (const el of features) {
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
    // 查 category_id
    const [[{ id: category_id }]] = await db.query(
      'SELECT id FROM Category WHERE name = ?', [categoryTag]
    );
    await db.query(
      `INSERT INTO Site (name,address,lat,lon,category_id,osm_id)
       VALUES (?,?,?,?,?,?)`,
      [name, el.tags['addr:street'] || '', lat, lon, category_id, el.type+'/'+el.id]
    );
  }
  console.log('✅ 导入完成，共插入', features.length, '条');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
