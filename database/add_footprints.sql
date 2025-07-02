-- 添加足迹表
-- 用于记录用户的地点收集记录
USE chemnitzmap;

CREATE TABLE IF NOT EXISTS Footprint (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  site_id INT NOT NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_lat DOUBLE,
  user_lon DOUBLE,
  distance INT COMMENT '收集时的距离(米)',
  UNIQUE KEY unique_footprint (user_id, site_id),
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES Site(id) ON DELETE CASCADE,
  INDEX idx_user_collected (user_id, collected_at),
  INDEX idx_user_site (user_id, site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;