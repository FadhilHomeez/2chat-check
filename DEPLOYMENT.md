# Deployment Guide

This guide covers deploying the 2Chat Chat Checker application to various platforms and environments.

## 📋 Prerequisites

- Node.js 14+ installed
- 2Chat API key
- Git (for version control)
- Basic knowledge of your deployment platform

## 🚀 Local Development Deployment

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd 2chat-chat-checker

# Install dependencies
npm install

# Create environment file
cp env.example .env
```

### 2. Configure Environment
Edit `.env` file:
```env
# 2Chat API Configuration
API_KEY=your_2chat_api_key_here
API_BASE_URL=https://api.p.2chat.io/open

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Start Development Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### 4. Access Application
- **Web UI**: http://localhost:3000
- **API Docs**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🌐 Production Deployment

### Option 1: Traditional VPS/Server

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <your-repo-url>
cd 2chat-chat-checker

# Install dependencies
npm install

# Create production environment file
cp env.example .env.production
```

#### 3. Production Configuration
Edit `.env.production`:
```env
# 2Chat API Configuration
API_KEY=your_production_api_key
API_BASE_URL=https://api.p.2chat.io/open

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Add domain
DOMAIN=your-domain.com
```

#### 4. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: '2chat-checker',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### 5. Start with PM2
```bash
# Create logs directory
mkdir logs

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 6. Nginx Configuration (Optional)
Create `/etc/nginx/sites-available/2chat-checker`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/2chat-checker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create exports directory
RUN mkdir -p exports

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### 2. Create Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_KEY=${API_KEY}
      - API_BASE_URL=${API_BASE_URL:-https://api.p.2chat.io/open}
    volumes:
      - ./exports:/usr/src/app/exports
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### 3. Create Nginx Configuration
Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 4. Deploy with Docker
```bash
# Create .env file for Docker
echo "API_KEY=your_api_key_here" > .env

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

1. **Create Heroku App**
```bash
# Install Heroku CLI
# Create app
heroku create your-2chat-app

# Add environment variables
heroku config:set API_KEY=your_api_key_here
heroku config:set NODE_ENV=production
```

2. **Deploy**
```bash
# Add Heroku remote
heroku git:remote -a your-2chat-app

# Deploy
git push heroku main
```

3. **Open App**
```bash
heroku open
```

#### Railway Deployment

1. **Connect Repository**
- Go to [Railway](https://railway.app)
- Connect your GitHub repository
- Add environment variables in Railway dashboard

2. **Deploy**
- Railway automatically deploys on push to main branch
- Access your app via Railway-provided URL

#### Render Deployment

1. **Create Service**
- Go to [Render](https://render.com)
- Create new Web Service
- Connect your GitHub repository

2. **Configure**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Add `API_KEY`

3. **Deploy**
- Render automatically deploys on push to main branch

#### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

3. **Configure Environment**
- Add environment variables in Vercel dashboard
- Set `API_KEY` and other required variables

## 🔒 Security Considerations

### 1. Environment Variables
- **Never commit API keys** to version control
- Use `.env` files for local development
- Use platform-specific secret management for production

### 2. API Key Security
```bash
# Generate a strong API key
openssl rand -hex 32

# Store securely
echo "API_KEY=your_generated_key" >> .env
```

### 3. HTTPS Configuration
```nginx
# Nginx SSL configuration
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }
}
```

### 4. Rate Limiting
Add rate limiting to your application:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📊 Monitoring and Logging

### 1. PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs 2chat-checker

# Restart application
pm2 restart 2chat-checker
```

### 2. Health Checks
```bash
# Check application health
curl http://your-domain.com/health

# Expected response
{
  "success": true,
  "message": "2Chat Chat Checker API is running",
  "timestamp": "2025-01-03T14:30:00.000Z",
  "version": "1.0.0"
}
```

### 3. Log Management
```bash
# View application logs
tail -f logs/combined.log

# Monitor errors
tail -f logs/err.log
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to server
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

2. **Permission Denied**
```bash
# Fix file permissions
chmod +x index.js
chown -R node:node /path/to/app
```

3. **Memory Issues**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 index.js
```

4. **API Key Issues**
```bash
# Test API key
curl -H "X-User-API-Key: your_key" \
  https://api.p.2chat.io/open/whatsapp/groups/+1234567890
```

### Debug Commands
```bash
# Check application status
pm2 status

# View detailed logs
pm2 logs 2chat-checker --lines 100

# Restart application
pm2 restart 2chat-checker

# Check environment variables
pm2 env 2chat-checker
```

## 📈 Performance Optimization

### 1. Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Caching Headers
```javascript
app.use(express.static('public', {
  maxAge: '1h',
  etag: true
}));
```

### 3. Database Optimization (if added later)
- Use connection pooling
- Implement query caching
- Add database indexes

## 🔧 Maintenance

### Regular Tasks
1. **Update dependencies** monthly
2. **Monitor logs** for errors
3. **Backup exports** directory
4. **Check API key** validity
5. **Update SSL certificates**

### Update Process
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart 2chat-checker

# Check status
pm2 status
```

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test API connectivity
4. Review platform-specific documentation
5. Contact platform support if needed

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure automated backups
3. Implement user authentication (if needed)
4. Add analytics and usage tracking
5. Set up staging environment for testing 