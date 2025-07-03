# ChemnitzMap - Chemnitz Cultural Map 🗺️

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

An Interactive Cultural Map Application for Chemnitz

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

## 🚀 Quick Start

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 18.0+ (LTS version recommended)
- **MySQL**: 8.0+
- **Git**: Latest version
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 1GB available space

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/SuperRedHat/ChemnitzMap.git
cd ChemnitzMap
```

#### 2. Install Dependencies

**Option A: Manual Installation (Recommended for beginners)**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/vueChemnitzMap
npm install

# Return to root directory
cd ../..
```

**Option B: Create Installation Scripts (Optional for convenience)**

<details>
<summary>📄 Create install-deps.sh (Linux/macOS)</summary>

Create a new file `install-deps.sh` in the root directory:

```bash
#!/bin/bash
set -e

echo "🚀 Starting ChemnitzMap dependencies installation..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first"
    exit 1
fi

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first"
    exit 1
fi

echo "✅ Environment check passed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend/vueChemnitzMap
npm install
echo "✅ Frontend dependencies installed"

cd ../..
echo "🎉 All dependencies installed successfully!"
```

Make it executable and run:
```bash
chmod +x install-deps.sh
./install-deps.sh
```
</details>

<details>
<summary>📄 Create install-deps.bat (Windows)</summary>

Create a new file `install-deps.bat` in the root directory:

```batch
@echo off
echo 🚀 Starting ChemnitzMap dependencies installation...

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first
    pause
    exit /b 1
)

:: Check MySQL
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL is not installed. Please install MySQL first
    pause
    exit /b 1
)

echo ✅ Environment check passed

:: Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
if errorlevel 1 (
    echo ❌ Backend dependencies installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

:: Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend\vueChemnitzMap
npm install
if errorlevel 1 (
    echo ❌ Frontend dependencies installation failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

cd ..\..
echo 🎉 All dependencies installed successfully!
pause
```

Run it:
```batch
install-deps.bat
```
</details>

#### 3. Configure Database

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE chemnitzmap 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'chemmap'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chemnitzmap.* TO 'chemmap'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

Initialize database tables:
```bash
mysql -u chemmap -p chemnitzmap < database/init.sql
```

#### 4. Configure Environment Variables

Create `backend/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=chemmap
DB_PASS=your_password
DB_DATABASE=chemnitzmap

# JWT Secret
JWT_SECRET=your-very-secure-jwt-secret-key-here

# Admin Account
ADMIN_USER=admin
ADMIN_EMAIL=admin@chemnitzmap.com
ADMIN_PASS=admin123456

# Service Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Scheduled Updates
ENABLE_SCHEDULED_UPDATES=true
UPDATE_CRON_SCHEDULE=0 2 * * 0
CHECK_UPDATES_ON_STARTUP=false
```

#### 5. Import Initial Data

```bash
cd backend
node scripts/importSites.js
```

#### 6. Start the Application

**Development Mode:**

**Option A: Manual Start**
```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend/vueChemnitzMap
npm run dev
```

**Option B: Create Start Scripts (Optional)**

<details>
<summary>📄 Create start-dev.sh (Linux/macOS)</summary>

Create a new file `start-dev.sh` in the root directory:

```bash
#!/bin/bash
set -e

echo "🚀 Starting ChemnitzMap development environment..."

# Start backend (background)
echo "📡 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend/vueChemnitzMap
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo "🎉 Application started!"
echo "📡 Backend API: http://localhost:3000"
echo "🎨 Frontend: http://localhost:5173"
echo "📚 API Docs: http://localhost:3000/api-docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
```

Make it executable and run:
```bash
chmod +x start-dev.sh
./start-dev.sh
```
</details>

<details>
<summary>📄 Create start-dev.bat (Windows)</summary>

Create a new file `start-dev.bat` in the root directory:

```batch
@echo off
echo 🚀 Starting ChemnitzMap development environment...

echo 📡 Starting backend server...
start "Backend Server" cmd /k "cd /d backend && npm run dev"

timeout /t 5 /nobreak >nul

echo 🎨 Starting frontend development server...
start "Frontend Server" cmd /k "cd /d frontend\vueChemnitzMap && npm run dev"

echo 🎉 Application started!
echo 📡 Backend API: http://localhost:3000
echo 🎨 Frontend: http://localhost:5173
echo 📚 API Docs: http://localhost:3000/api-docs
pause
```

Run it:
```batch
start-dev.bat
```
</details>

**Production Mode:**
```bash
# Build frontend
cd frontend/vueChemnitzMap
npm run build

# Start backend
cd ../../backend
npm start
```

#### 7. Access the Application

- 🎨 **Frontend Application**: http://localhost:5173
- 📡 **Backend API**: http://localhost:3000
- 📚 **API Documentation**: http://localhost:3000/api-docs
- 🏥 **Health Check**: http://localhost:3000/api/health

## 📱 User Guide

### Basic Features

1. **Browse Map**
   - Drag map with mouse
   - Zoom with scroll wheel
   - Click markers for details

2. **Search & Filter**
   - Filter by category: Theatre, Museum, Public Art, Restaurant
   - Keyword search
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

### Admin Features

Login with configured admin account to access:
- User management (view, soft delete)
- Comment management (view, delete, batch operations)
- System statistics

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

## 🔧 Configuration

### Scheduled Updates Configuration

The system supports automatic data updates from OpenStreetMap:

```env
ENABLE_SCHEDULED_UPDATES=true    # Enable scheduled updates
UPDATE_CRON_SCHEDULE=0 2 * * 0   # Cron expression (Every Sunday at 2 AM)
CHECK_UPDATES_ON_STARTUP=false   # Check updates on startup
```

Manual update:
```bash
cd backend
node scripts/updateSites.js  # Smart update (preserves user data)
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

**Q: Database connection failed**
```bash
# Check MySQL service status
sudo service mysql status  # Linux
brew services list         # macOS

# Restart service
sudo service mysql restart
```

**Q: Port already in use**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>
```

**Q: npm install failed**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
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

- [OpenStreetMap](https://www.openstreetmap.org/) - Open geographic data provider
- [Overpass API](https://overpass-api.de/) - OSM data query service
- [Vue.js Community](https://vuejs.org/) - Excellent frontend framework
- TU Chemnitz - Project support

---

<div align="center">
Made with ❤️ for TU Chemnitz Database and Web Technologies Course
</div>