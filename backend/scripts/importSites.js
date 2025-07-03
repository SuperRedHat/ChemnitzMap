require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

// 根据类别和标签生成描述
function generateCategoryDescription(category, tags) {
  switch (category) {
    case 'Theatre':
      return generateTheatreDescription(tags);
    case 'Museum':
      return generateMuseumDescription(tags);
    case 'Public Art':
      return generateArtworkDescription(tags);
    case 'Restaurant':
      return generateRestaurantDescription(tags);
    default:
      return '';
  }
}

// 生成剧院描述
function generateTheatreDescription(tags) {
  let desc = 'A performing arts venue in Chemnitz';
  
  if (tags['theatre:type']) {
    desc += ` specializing in ${tags['theatre:type']}`;
  }
  
  if (tags.capacity) {
    desc += ` with a capacity of ${tags.capacity} seats`;
  }
  
  desc += '. This theater offers various cultural performances including plays, concerts, and other live entertainment.';
  
  return desc;
}

// 生成博物馆描述
function generateMuseumDescription(tags) {
  let desc = 'A cultural institution in Chemnitz';
  
  if (tags.museum) {
    desc += ` featuring ${tags.museum} exhibitions`;
  }
  
  if (tags.collection) {
    desc += ` with collections focusing on ${tags.collection}`;
  }
  
  desc += '. This museum preserves and displays artifacts, artworks, and objects of cultural, historical, or scientific importance.';
  
  return desc;
}

// 生成艺术作品描述
function generateArtworkDescription(tags) {
  let desc = 'A public art installation in Chemnitz';
  
  if (tags.artwork_type) {
    desc += ` in the form of ${tags.artwork_type}`;
  }
  
  if (tags.artist_name || tags.artist) {
    desc += ` created by ${tags.artist_name || tags.artist}`;
  }
  
  if (tags.material) {
    desc += ` made from ${tags.material}`;
  }
  
  desc += '. This artwork contributes to the city\'s cultural landscape and public space enhancement.';
  
  return desc;
}

// 生成餐厅描述
function generateRestaurantDescription(tags) {
  let desc = 'A dining establishment in Chemnitz';
  
  if (tags.cuisine) {
    desc += ` serving ${tags.cuisine} cuisine`;
  }
  
  if (tags['diet:vegetarian'] === 'yes') {
    desc += ' with vegetarian options';
  }
  
  if (tags['diet:vegan'] === 'yes') {
    desc += ' and vegan-friendly dishes';
  }
  
  desc += '. Experience local and international flavors in this restaurant.';
  
  return desc;
}

// 获取默认描述
function getDefaultDescription(category) {
  const defaultDescriptions = {
    'Theatre': 'A performing arts venue in Chemnitz offering theater performances, concerts, and cultural events. Experience the rich cultural life of the city.',
    'Museum': 'A cultural institution in Chemnitz preserving and displaying collections of historical, artistic, and scientific significance. Discover the heritage and culture of the region.',
    'Public Art': 'A public artwork in Chemnitz contributing to the city\'s cultural landscape. This installation enhances public spaces and showcases local or international artistic expression.',
    'Restaurant': 'A dining establishment in Chemnitz offering culinary experiences. Enjoy local and international cuisine in this restaurant.'
  };
  
  return defaultDescriptions[category] || 'A cultural point of interest in Chemnitz worth exploring.';
}

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
  
  // 2. 清空相关表（按正确的外键依赖顺序）
  console.log('🗑️ 清空现有数据...');

  try {
    // 先删除所有外键引用表
    await db.query('DELETE FROM Comment');
    console.log('   - Comment 表已清空');
    
    await db.query('DELETE FROM Footprint'); 
    console.log('   - Footprint 表已清空');
    
    await db.query('DELETE FROM Favorite');
    console.log('   - Favorite 表已清空');

    // 最后删除主表
    await db.query('DELETE FROM Site');
    console.log('   - Site 表已清空');
    
    console.log('✅ 数据清空完成');
  } catch (error) {
    console.error('❌ 清空数据时出错:', error.message);
    process.exit(1);
  }

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
    
    // 生成描述信息 - 增强版
    let description = '';

    // 1. 首先尝试获取基本描述
    if (el.tags['description:en']) {
      description = el.tags['description:en'];
    } else if (el.tags.description) {
      description = el.tags.description;
    }

    // 2. 如果没有基本描述，根据类别生成描述
    if (!description) {
      description = generateCategoryDescription(categoryTag, el.tags);
    }

    // 3. 添加额外信息
    const additionalInfo = [];

    // 开放时间
    if (el.tags.opening_hours) {
      additionalInfo.push(`Opening hours: ${el.tags.opening_hours}`);
    }

    // 电话
    if (el.tags.phone) {
      additionalInfo.push(`Phone: ${el.tags.phone}`);
    }

    // 网站
    if (el.tags.website) {
      additionalInfo.push(`Website: ${el.tags.website}`);
    }

    // 维基百科
    if (el.tags['wikipedia:en']) {
      additionalInfo.push(`More info: https://en.wikipedia.org/wiki/${el.tags['wikipedia:en'].split(':')[1]}`);
    } else if (el.tags.wikipedia) {
      additionalInfo.push(`Wikipedia: ${el.tags.wikipedia}`);
    }

    // 运营者
    if (el.tags.operator) {
      additionalInfo.push(`Operated by: ${el.tags.operator}`);
    }

    // 历史信息
    if (el.tags.start_date) {
      additionalInfo.push(`Built in: ${el.tags.start_date}`);
    }

    // 建筑师
    if (el.tags.architect) {
      additionalInfo.push(`Architect: ${el.tags.architect}`);
    }

    // 餐厅菜系
    if (categoryTag === 'Restaurant' && el.tags.cuisine) {
      additionalInfo.push(`Cuisine: ${el.tags.cuisine}`);
    }

    // 博物馆特殊信息
    if (categoryTag === 'Museum') {
      if (el.tags.museum) {
        additionalInfo.push(`Museum type: ${el.tags.museum}`);
      }
      if (el.tags.collection) {
        additionalInfo.push(`Collection: ${el.tags.collection}`);
      }
    }

    // 剧院特殊信息
    if (categoryTag === 'Theatre') {
      if (el.tags.capacity) {
        additionalInfo.push(`Capacity: ${el.tags.capacity} seats`);
      }
      if (el.tags['theatre:type']) {
        additionalInfo.push(`Theatre type: ${el.tags['theatre:type']}`);
      }
    }

    // 公共艺术特殊信息
    if (categoryTag === 'Public Art') {
      if (el.tags.artist_name || el.tags.artist) {
        additionalInfo.push(`Artist: ${el.tags.artist_name || el.tags.artist}`);
      }
      if (el.tags.material) {
        additionalInfo.push(`Material: ${el.tags.material}`);
      }
      if (el.tags.artwork_type) {
        additionalInfo.push(`Artwork type: ${el.tags.artwork_type}`);
      }
    }

    // 合并描述和额外信息
    if (additionalInfo.length > 0) {
      if (description) {
        description += '\n\n' + additionalInfo.join('\n');
      } else {
        description = additionalInfo.join('\n');
      }
    }

    // 如果仍然没有描述，使用默认描述
    if (!description) {
      description = getDefaultDescription(categoryTag);
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
}

main().catch(err => { console.error(err); process.exit(1); });