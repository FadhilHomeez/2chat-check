module.exports = {
  apps: [{
    name: '2chat-checker',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Performance
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Watch mode (development)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'exports'],
    
    // Cron jobs
    cron_restart: '0 2 * * *', // Restart daily at 2 AM
    
    // Environment variables
    env_file: '.env',
    
    // Kill timeout
    kill_timeout: 5000,
    
    // Listen timeout
    listen_timeout: 8000,
    
    // Graceful shutdown
    shutdown_with_message: true,
    
    // Source map support
    source_map_support: true,
    
    // Metrics
    pmx: true,
    
    // Merge logs
    merge_logs: true,
    
    // Log format
    log_type: 'json'
  }]
}; 