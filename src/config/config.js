require('dotenv').config();

const config = {
  api: {
    key: process.env.API_KEY,
    baseUrl: process.env.API_BASE_URL || 'https://api.p.2chat.io/open'
  },
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  }
};

// Validate required configuration
if (!config.api.key) {
  console.error('Error: API_KEY environment variable is required');
  process.exit(1);
}

module.exports = config; 