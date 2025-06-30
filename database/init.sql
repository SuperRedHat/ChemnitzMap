-- 1. 创建并使用数据库
DROP DATABASE IF EXISTS chemnitzmap;
CREATE DATABASE chemnitzmap
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE chemnitzmap;

-- 2. 创建分类表
CREATE TABLE Category (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL  -- 地图标记颜色 HEX
);

-- 3. 插入基础分类
INSERT INTO Category (name, color) VALUES
  ('Theatre',   '#FF5733'),
  ('Museum',    '#33A1FF'),
  ('Public Art','#33FF57'),
  ('Restaurant','#FF33A1');

-- 4. 创建地标表
CREATE TABLE Site (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  lat DOUBLE NOT NULL,
  lon DOUBLE NOT NULL,
  category_id INT NOT NULL,
  description TEXT,
  osm_id VARCHAR(50),
  FOREIGN KEY (category_id) REFERENCES Category(id)
);
-- 可选：给经纬度建索引
CREATE INDEX idx_site_lat_lon ON Site(lat, lon);

-- 5. 创建用户表
CREATE TABLE User (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. 创建收藏表
CREATE TABLE Favorite (
  user_id INT NOT NULL,
  site_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, site_id),
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (site_id) REFERENCES Site(id)
);
