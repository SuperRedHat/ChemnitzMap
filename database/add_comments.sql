-- 添加评论表
-- 注意：此文件仅用于文档和备份目的
-- 评论表会在后端启动时通过 backend/scripts/initComments.js 自动创建
-- 如需手动创建，可执行：mysql -u chemmap -p chemnitzmap < database/add_comments.sql

USE chemnitzmap;

CREATE TABLE IF NOT EXISTS Comment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES Site(id),
  FOREIGN KEY (user_id) REFERENCES User(id),
  INDEX idx_site_rating (site_id, rating)
);