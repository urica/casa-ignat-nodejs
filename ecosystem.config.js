/**
 * PM2 Ecosystem Configuration
 * Production process management for Casa Ignat
 */

module.exports = {
  apps: [
    {
      name: 'casa-ignat',
      script: './src/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,

      // Advanced options
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', 'public/uploads', '.git'],
      watch_delay: 1000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Source map support
      source_map_support: true,

      // Merge logs from all instances
      merge_logs: true,

      // Cron restart (restart every day at 3 AM)
      cron_restart: '0 3 * * *',

      // Health monitoring
      max_memory_restart: '500M',

      // Custom metrics
      instance_var: 'INSTANCE_ID',
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'casa-ignat.ro',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/casa-ignat-nodejs.git',
      path: '/var/www/casa-ignat-nodejs',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy': './scripts/backup-db.sh && npm install && pm2 reload ecosystem.config.js --env production && pm2 save',
    },
    staging: {
      user: 'deploy',
      host: 'staging.casa-ignat.ro',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/casa-ignat-nodejs.git',
      path: '/var/www/casa-ignat-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging && pm2 save',
    },
  },
};
