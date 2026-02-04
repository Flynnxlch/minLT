// PM2 Ecosystem Configuration untuk MinLT Backend
// Menggunakan Node.js v20.19.6

module.exports = {
  apps: [{
    name: 'minlt-backend',
    
    // Menggunakan Node.js
    script: 'src/server.js',
    
    cwd: '/www/wwwroot/minlt/Backend',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // Logging
    error_file: '/www/wwwroot/minlt/logs/pm2-error.log',
    out_file: '/www/wwwroot/minlt/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto restart
    autorestart: true,
    max_memory_restart: '500M',
    
    // Watch mode (disable di production)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.env',
      '*.log'
    ],
    
    // Advanced options
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Kill timeout
    kill_timeout: 5000
  }]
};

// Catatan:
// 1. Pastikan folder logs sudah dibuat: mkdir -p /www/wwwroot/minlt/logs
// 2. Menggunakan Node.js v20.19.6
// 3. Update cwd path sesuai lokasi deployment Anda
// 4. Setelah edit, restart: pm2 restart minlt-backend
