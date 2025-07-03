#!/usr/bin/env node

/**
 * ChemnitzMap One-Click Start Script
 * Location: Project root/start.js
 * 
 * Usage:
 * Run in project root: node start.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
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
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Check requirements
function checkRequirements() {
  // Check .env file
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    log.error('backend/.env file not found');
    log.info('Please run deployment script first: node deploy.js');
    return false;
  }

  // Check node_modules
  const backendModules = path.join(__dirname, 'backend', 'node_modules');
  const frontendModules = path.join(__dirname, 'frontend', 'vueChemnitzMap', 'node_modules');
  
  if (!fs.existsSync(backendModules)) {
    log.error('Backend dependencies not installed');
    log.info('Please run deployment script first: node deploy.js');
    return false;
  }

  if (!fs.existsSync(frontendModules)) {
    log.error('Frontend dependencies not installed');
    log.info('Please run deployment script first: node deploy.js');
    return false;
  }

  return true;
}

// Start process
function startProcess(name, command, args, cwd, color = colors.cyan) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    // Handle output
    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      });
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log(`${colors.red}[${name}]${colors.reset} ${line}`);
      });
    });

    proc.on('error', (error) => {
      log.error(`${name} failed to start: ${error.message}`);
      resolve(false);
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        log.warning(`${name} exited with code: ${code}`);
      }
      resolve(true);
    });

    return proc;
  });
}

// Wait for service to be ready
function waitForService(url, name, maxAttempts = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      fetch(url)
        .then(() => {
          log.success(`${name} is ready`);
          resolve(true);
        })
        .catch(() => {
          if (attempts < maxAttempts) {
            setTimeout(check, 1000);
          } else {
            log.error(`${name} startup timeout`);
            resolve(false);
          }
        });
    };
    
    setTimeout(check, 2000); // Initial delay
  });
}

// Main function
async function start() {
  console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════╗
║     ChemnitzMap One-Click Start Tool 🚀   ║
╚═══════════════════════════════════════════╝
${colors.reset}
`);

  // Check requirements
  if (!checkRequirements()) {
    process.exit(1);
  }

  log.info('Starting ChemnitzMap application...\n');

  // Start backend
  log.info('Starting backend service...');
  const backendPath = path.join(__dirname, 'backend');
  const backendProc = spawn('npm', ['run', 'dev'], {
    cwd: backendPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // Handle backend output
  backendProc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${colors.green}[Backend]${colors.reset} ${line}`);
    });
  });

  backendProc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      // Ignore non-error stderr output
      if (!line.includes('DeprecationWarning') && !line.includes('ExperimentalWarning')) {
        console.log(`${colors.red}[Backend]${colors.reset} ${line}`);
      }
    });
  });

  // Wait for backend to be ready
  log.info('Waiting for backend service to be ready...');
  const backendReady = await waitForService('http://localhost:3000/api/health', 'Backend service');
  
  if (!backendReady) {
    log.error('Backend service failed to start');
    backendProc.kill();
    process.exit(1);
  }

  // Start frontend
  log.info('Starting frontend service...');
  const frontendPath = path.join(__dirname, 'frontend', 'vueChemnitzMap');
  const frontendProc = spawn('npm', ['run', 'dev'], {
    cwd: frontendPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // Handle frontend output
  frontendProc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${colors.blue}[Frontend]${colors.reset} ${line}`);
    });
  });

  frontendProc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (!line.includes('DeprecationWarning') && !line.includes('ExperimentalWarning')) {
        console.log(`${colors.red}[Frontend]${colors.reset} ${line}`);
      }
    });
  });

  // Show access information after delay
  setTimeout(() => {
    console.log(`
${colors.bright}${colors.green}
╔═══════════════════════════════════════════╗
║     🎉 Application Started Successfully!   ║
╚═══════════════════════════════════════════╝
${colors.reset}

${colors.cyan}Access URLs:${colors.reset}
🎨 Frontend App: ${colors.blue}http://localhost:5173${colors.reset}
📡 Backend API: ${colors.blue}http://localhost:3000${colors.reset}
📚 API Docs: ${colors.blue}http://localhost:3000/api-docs${colors.reset}

${colors.yellow}Press Ctrl+C to stop all services${colors.reset}
`);
  }, 5000);

  // Handle exit signals
  const cleanup = () => {
    console.log('\n');
    log.info('Stopping services...');
    
    backendProc.kill();
    frontendProc.kill();
    
    setTimeout(() => {
      log.success('All services stopped');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Monitor process exits
  backendProc.on('close', (code) => {
    if (code !== null) {
      log.error('Backend service unexpectedly exited');
      cleanup();
    }
  });

  frontendProc.on('close', (code) => {
    if (code !== null) {
      log.error('Frontend service unexpectedly exited');
      cleanup();
    }
  });
}

// Run
start().catch((error) => {
  log.error(`Startup failed: ${error.message}`);
  process.exit(1);
});