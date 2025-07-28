#!/bin/bash

# 2Chat Checker Deployment Script
# Usage: ./deploy.sh [production|staging|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="2chat-checker"
DEPLOY_ENV=${1:-production}
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 is not installed. Installing..."
        npm install -g pm2
    fi
    
    # Check environment file
    if [[ ! -f ".env" ]]; then
        log_error ".env file not found. Please create it from env.example"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p exports
    
    log_success "Directories created"
}

# Backup current version
backup_current() {
    if pm2 list | grep -q $APP_NAME; then
        log_info "Backing up current version..."
        
        BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf $BACKUP_FILE --exclude=node_modules --exclude=logs --exclude=backups .
        
        log_success "Backup created: $BACKUP_FILE"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Remove existing node_modules
    if [[ -d "node_modules" ]]; then
        rm -rf node_modules
    fi
    
    # Install dependencies
    npm ci --only=production
    
    log_success "Dependencies installed"
}

# Start application
start_application() {
    log_info "Starting application with PM2..."
    
    # Stop existing process if running
    if pm2 list | grep -q $APP_NAME; then
        pm2 stop $APP_NAME
        pm2 delete $APP_NAME
    fi
    
    # Start with PM2
    pm2 start ecosystem.config.js --env $DEPLOY_ENV
    
    # Save PM2 configuration
    pm2 save
    
    log_success "Application started"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for application to start
    sleep 5
    
    # Check if application is responding
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Health check passed"
        return 0
    else
        log_error "Health check failed"
        return 1
    fi
}

# Show status
show_status() {
    log_info "Application status:"
    pm2 status
    pm2 logs $APP_NAME --lines 10
}

# Main deployment function
deploy() {
    log_info "Starting deployment for environment: $DEPLOY_ENV"
    
    check_root
    check_prerequisites
    create_directories
    backup_current
    install_dependencies
    start_application
    
    if health_check; then
        log_success "Deployment completed successfully!"
        show_status
    else
        log_error "Deployment failed health check"
        exit 1
    fi
}

# Rollback function
rollback() {
    log_info "Rolling back to previous version..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.tar.gz 2>/dev/null | head -1)
    
    if [[ -z $LATEST_BACKUP ]]; then
        log_error "No backup found to rollback to"
        exit 1
    fi
    
    log_info "Rolling back to: $LATEST_BACKUP"
    
    # Stop application
    pm2 stop $APP_NAME 2>/dev/null || true
    
    # Extract backup
    tar -xzf $LATEST_BACKUP
    
    # Restart application
    start_application
    
    if health_check; then
        log_success "Rollback completed successfully!"
    else
        log_error "Rollback failed health check"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [production|staging|development|rollback]"
    echo ""
    echo "Commands:"
    echo "  production   Deploy to production environment"
    echo "  staging      Deploy to staging environment"
    echo "  development  Deploy to development environment"
    echo "  rollback     Rollback to previous version"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 rollback"
}

# Main script logic
case $1 in
    "production"|"staging"|"development")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    *)
        usage
        exit 1
        ;;
esac 