#!/usr/bin/env node

/**
 * ChemnitzMap Automated Deployment Script
 * Location: Project root/deploy.js
 * 
 * Usage:
 * 1. Ensure Node.js 18+ and MySQL 8.0+ are installed
 * 2. Run in project root: node deploy.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Output helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}📦 ${msg}${colors.reset}`)
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline.question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Check if command exists
function commandExists(cmd) {
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Execute command
function runCommand(cmd, cwd = '.') {
  try {
    log.info(`Executing: ${cmd}`);
    execSync(cmd, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    });
    return true;
  } catch (error) {
    log.error(`Command failed: ${cmd}`);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════╗
║     ChemnitzMap Automated Deployment 🚀   ║
╚═══════════════════════════════════════════╝
${colors.reset}
`);

  // 1. Environment check
  log.step('Environment Check');
  
  // Check Node.js
  if (!commandExists('node')) {
    log.error('Node.js not found, please install Node.js 18+');
    process.exit(1);
  }
  
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  if (major < 18) {
    log.error(`Node.js version too low. Current: ${nodeVersion}, Required: 18.0+`);
    process.exit(1);
  }
  log.success(`Node.js: ${nodeVersion}`);

  // Check MySQL
  if (!commandExists('mysql')) {
    log.warning('MySQL command line tool not found');
    const cont = await question('MySQL might not be installed or not in PATH. Continue? (y/n): ');
    if (cont.toLowerCase() !== 'y') {
      process.exit(1);
    }
  } else {
    log.success('MySQL command line tool is installed');
  }

  // 2. Collect configuration
  log.step('Configuration Collection');
  console.log('Please provide the following configuration (press Enter for defaults):\n');

  // Database configuration
  const dbConfig = {
    host: await question('MySQL host [localhost]: ') || 'localhost',
    port: await question('MySQL port [3306]: ') || '3306',
    rootUser: await question('MySQL root username [root]: ') || 'root',
    rootPassword: await question('MySQL root password: '),
    dbName: await question('Database name [chemnitzmap]: ') || 'chemnitzmap',
    dbUser: await question('Application database user [chemmap]: ') || 'chemmap',
    dbPassword: await question('Application database password [chemmap123]: ') || 'chemmap123'
  };

  // Admin configuration
  console.log('\nAdmin account configuration:');
  const adminConfig = {
    username: await question('Admin username [admin]: ') || 'admin',
    email: await question('Admin email [admin@chemnitzmap.com]: ') || 'admin@chemnitzmap.com',
    password: await question('Admin password [admin123456]: ') || 'admin123456'
  };

  // JWT secret
  const jwtSecret = await question('\nJWT secret (leave empty to auto-generate): ') || 
    require('crypto').randomBytes(32).toString('hex');

  // 3. Create database
  log.step('Database Setup');
  
  // Create temporary SQL file
  const setupSql = `
-- Create database
CREATE DATABASE IF NOT EXISTS ${dbConfig.dbName}
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- Create user (if not exists)
CREATE USER IF NOT EXISTS '${dbConfig.dbUser}'@'${dbConfig.host}' 
  IDENTIFIED BY '${dbConfig.dbPassword}';

-- Grant privileges
GRANT ALL PRIVILEGES ON ${dbConfig.dbName}.* 
  TO '${dbConfig.dbUser}'@'${dbConfig.host}';
  
FLUSH PRIVILEGES;

-- Use database
USE ${dbConfig.dbName};
`;

  const tempSqlFile = path.join(__dirname, 'temp_setup.sql');
  fs.writeFileSync(tempSqlFile, setupSql);

  // Execute SQL
  const mysqlCmd = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.rootUser} ${dbConfig.rootPassword ? `-p${dbConfig.rootPassword}` : ''} < ${tempSqlFile}`;
  
  if (!runCommand(mysqlCmd)) {
    fs.unlinkSync(tempSqlFile);
    log.error('Database creation failed');
    process.exit(1);
  }
  fs.unlinkSync(tempSqlFile);
  log.success('Database and user created successfully');

  // Initialize database tables
  const initCmd = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.dbUser} -p${dbConfig.dbPassword} ${dbConfig.dbName} < database/init.sql`;
  if (!runCommand(initCmd)) {
    log.error('Database table initialization failed');
    process.exit(1);
  }
  log.success('Database tables initialized successfully');

  // 4. Create .env file
  log.step('Creating Configuration File');
  
  const envContent = `# Database Configuration
DB_HOST=${dbConfig.host}
DB_PORT=${dbConfig.port}
DB_USER=${dbConfig.dbUser}
DB_PASS=${dbConfig.dbPassword}
DB_DATABASE=${dbConfig.dbName}

# JWT Secret
JWT_SECRET=${jwtSecret}

# Admin Account
ADMIN_USER=${adminConfig.username}
ADMIN_EMAIL=${adminConfig.email}
ADMIN_PASS=${adminConfig.password}

# Service Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Scheduled Updates
ENABLE_SCHEDULED_UPDATES=true
UPDATE_CRON_SCHEDULE=0 2 * * 0
CHECK_UPDATES_ON_STARTUP=false
`;

  const envPath = path.join(__dirname, 'backend', '.env');
  fs.writeFileSync(envPath, envContent);
  log.success('.env file created successfully');

  // 5. Install dependencies
  log.step('Installing Dependencies');
  
  // Install backend dependencies
  log.info('Installing backend dependencies...');
  if (!runCommand('npm install', path.join(__dirname, 'backend'))) {
    log.error('Backend dependencies installation failed');
    process.exit(1);
  }
  log.success('Backend dependencies installed successfully');

  // Install frontend dependencies
  log.info('Installing frontend dependencies...');
  if (!runCommand('npm install', path.join(__dirname, 'frontend', 'vueChemnitzMap'))) {
    log.error('Frontend dependencies installation failed');
    process.exit(1);
  }
  log.success('Frontend dependencies installed successfully');

  // 6. Import initial data
  log.step('Importing Initial Data');
  
  const importCmd = 'node scripts/importSites.js';
  if (!runCommand(importCmd, path.join(__dirname, 'backend'))) {
    log.error('Data import failed');
    process.exit(1);
  }
  log.success('Initial data imported successfully');

  // 7. Complete
  console.log(`
${colors.bright}${colors.green}
╔═══════════════════════════════════════════╗
║        🎉 Deployment Complete!            ║
╚═══════════════════════════════════════════╝
${colors.reset}

${colors.cyan}Next steps:${colors.reset}

1. Start the application:
   ${colors.yellow}node start.js${colors.reset}

2. Or start frontend and backend separately:
   Backend: ${colors.yellow}cd backend && npm run dev${colors.reset}
   Frontend: ${colors.yellow}cd frontend/vueChemnitzMap && npm run dev${colors.reset}

3. Access the application:
   Frontend: ${colors.blue}http://localhost:5173${colors.reset}
   API Docs: ${colors.blue}http://localhost:3000/api-docs${colors.reset}

4. Admin login:
   Username: ${colors.yellow}${adminConfig.username}${colors.reset}
   Password: ${colors.yellow}${adminConfig.password}${colors.reset}

${colors.red}⚠️  Remember to change the default password!${colors.reset}
`);

  rl.close();
}

// Error handling
process.on('unhandledRejection', (error) => {
  log.error(`Error occurred: ${error.message}`);
  process.exit(1);
});

// Run deployment
deploy().catch((error) => {
  log.error(`Deployment failed: ${error.message}`);
  process.exit(1);
});