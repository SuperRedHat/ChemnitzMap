# ChemnitzMap - Chemnitz Cultural Map 🗺️

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

An Interactive Cultural Map Application for Chemnitz

[🚀 Quick Start](#-quick-start) • [✨ Features](#-key-features) • [🛠️ Tech Stack](#️-technology-stack) • [📚 Documentation](#-api-documentation)

</div>

## 📖 Project Overview

ChemnitzMap is an interactive cultural map application developed for the "Database and Web Technologies" course at TU Chemnitz. The project aims to help tourists and residents discover and explore the rich cultural resources of Chemnitz through an innovative "Pokémon-style" collection system that makes city exploration more engaging and fun.

### ✨ Key Features

- 🗺️ **Interactive Map** - Real-time map display based on Leaflet
- 🎯 **Footprint Collection System** - Auto-collect places within 400m, achievement system with medals
- 🚌 **10-Minute City Mode** - Shows all cultural places reachable within 10 minutes by public transport
- 📍 **Nearby Mode** - Search for surrounding places with adjustable radius
- 💬 **Rating & Review System** - Leave reviews for visited places
- 🌍 **Multi-language Support** - Switch between Chinese, English, and German
- 👤 **User System** - Registration, login, profile management, favorites
- 👨‍💼 **Admin Dashboard** - User management, comment moderation, statistics
- 🔄 **Automatic Data Updates** - Scheduled synchronization with OpenStreetMap

## 🚀 Quick Start

### System Requirements

- **Node.js**: 18.0 or higher (LTS recommended)
- **MySQL**: 8.0 or higher
- **Git**: Latest version
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 1GB available space

### ⚡ One-Click Deployment (5 minutes)

We provide an automated deployment script that handles everything for you!

#### 1. Clone the Repository

```bash
git clone https://github.com/SuperRedHat/ChemnitzMap.git
cd ChemnitzMap
```

#### 2. Run Automated Deployment

```bash
# For all platforms (Windows/macOS/Linux)
node deploy.js

# Or for Windows users, simply double-click:
deploy.bat
```

The deployment script will:
- ✅ Check your environment (Node.js, MySQL)
- ✅ Collect database and admin configuration
- ✅ Create database and tables automatically
- ✅ Install all dependencies
- ✅ Import initial data from OpenStreetMap
- ✅ Generate configuration files

#### 3. Start the Application

```bash
# One-click start both frontend and backend
npm start

# Or use the start script directly
node start.js

# Windows users can double-click:
start.bat
```

#### 4. Access the Application

- 🎨 **Frontend**: http://localhost:5173
- 📡 **Backend API**: http://localhost:3000
- 📚 **API Documentation**: http://localhost:3000/api-docs

Default admin credentials (please change after first login):
- Username: `admin`
- Password: `admin123456`

## 🛠️ Technology Stack

### Frontend
- **Framework**: Vue 3 + Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **UI Components**: Element Plus
- **Map**: Leaflet
- **Internationalization**: Vue I18n
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **API Documentation**: Swagger
- **Scheduled Tasks**: node-cron
- **Password Encryption**: bcrypt

### Data Sources
- **OpenStreetMap** - Open geographic data
- **Overpass API** - OSM data query interface

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend App  │────▶│   RESTful API   │────▶│  Backend Server │
│   Vue + Vite    │     │                 │     │    Express.js   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │   MySQL DB      │
                                                  │   (chemnitzmap) │
                                                  └─────────────────┘
                                                          ▲
                                                          │
                                                  ┌─────────────────┐
                                                  │  OpenStreetMap  │
                                                  │  Overpass API   │
                                                  └─────────────────┘
```

## 📦 Manual Installation (Advanced Users)

<details>
<summary>Click to expand manual installation steps</summary>

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/vueChemnitzMap
npm install
```

### 2. Configure Database

```sql
-- Create database
CREATE DATABASE chemnitzmap 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'chemmap'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chemnitzmap.* TO 'chemmap'@'localhost';
FLUSH PRIVILEGES;
```

Initialize tables:
```bash
mysql -u chemmap -p chemnitzmap < database/init.sql
```

### 3. Configure Environment

Create `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=chemmap
DB_PASS=your_password
DB_DATABASE=chemnitzmap

# JWT
JWT_SECRET=your-jwt-secret

# Admin
ADMIN_USER=admin
ADMIN_EMAIL=admin@chemnitzmap.com
ADMIN_PASS=admin123456

# Service
NODE_ENV=development
PORT=3000
```

### 4. Import Data & Start

```bash
# Import initial data
cd backend
node scripts/importSites.js

# Start services
npm start  # from project root
```

</details>

## 📱 User Guide

### Basic Features

1. **Browse Map**
   - Drag map with mouse/touch
   - Zoom with scroll wheel or buttons
   - Click markers for place details

2. **Search & Filter**
   - Filter by category: Theatre, Museum, Public Art, Restaurant
   - Keyword search for places
   - Nearby mode: Show places within specified radius
   - 10-minute city: Show public transport reachable area

3. **User Features**
   - Register/Login account
   - Favorite places you like
   - Collect places within 400m for achievements
   - View personal footprints and statistics

4. **Ratings & Reviews**
   - Rate visited places (1-5 stars)
   - Write reviews to share experiences
   - View community ratings

### Admin Features

Admin users can access:
- User management (view, soft delete)
- Comment management (view, delete, batch operations)
- System statistics and analytics

## 📡 API Documentation

Complete API documentation is available via Swagger UI:
http://localhost:3000/api-docs

Main endpoints:

```
GET    /api/categories          # Get all categories
GET    /api/sites              # Get sites list
GET    /api/sites/:id          # Get site details
POST   /api/users/register     # User registration
POST   /api/users/login        # User login
GET    /api/favorites          # Get favorites list
POST   /api/footprints/:siteId # Collect site
GET    /api/comments/site/:id  # Get site comments
```

## 🔧 Configuration & Maintenance

### Available NPM Scripts

```bash
# Development
npm start              # Start both frontend and backend
npm run backend        # Start backend only
npm run frontend       # Start frontend only

# Data Management
npm run import-data    # Import fresh data (clears existing)
npm run update-data    # Update data (preserves user content)

# Build
npm run build          # Build frontend for production

# Admin
npm run create-admin   # Create new admin account
```

### Scheduled Updates

The system supports automatic data updates from OpenStreetMap:

```env
# In backend/.env
ENABLE_SCHEDULED_UPDATES=true    # Enable scheduled updates
UPDATE_CRON_SCHEDULE=0 2 * * 0   # Every Sunday at 2 AM
CHECK_UPDATES_ON_STARTUP=false   # Check updates on startup
```

### Database Backup

```bash
# Create backup
mysqldump -u chemmap -p chemnitzmap > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u chemmap -p chemnitzmap < backup_20240101.sql
```

## 🐛 Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check MySQL service
sudo service mysql status       # Linux
brew services list             # macOS
net start | findstr MySQL      # Windows

# Restart if needed
sudo service mysql restart
```

**Port already in use**
```bash
# Find process using port
lsof -i :3000                  # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Change ports in configuration files if needed
```

**Dependency installation failed**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Production Deployment

For production deployment:

1. **Security**
   - Change all default passwords in `.env`
   - Use strong JWT secret
   - Enable HTTPS with SSL certificates

2. **Performance**
   - Set `NODE_ENV=production`
   - Build frontend: `npm run build`
   - Use PM2 for process management
   - Configure Nginx as reverse proxy

3. **Example Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit Issues and Pull Requests.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Yihong Zhai
- **Supervisors**: Prof. Dr. Michael Martin & Florian Hahn
- **Course**: Database and Web Technologies
- **University**: TU Chemnitz

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) - Geographic data provider
- [Overpass API](https://overpass-api.de/) - OSM data query service
- [Vue.js Community](https://vuejs.org/) - Excellent frontend framework
- [TU Chemnitz](https://www.tu-chemnitz.de/) - Project support and guidance

---

<div align="center">

Made with ❤️ for TU Chemnitz Database and Web Technologies Course

**[⬆ Back to Top](#chemnitzmap---chemnitz-cultural-map-)**

</div>