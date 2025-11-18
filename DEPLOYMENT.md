# 🚀 Casa Ignat - Deployment Guide

Complete deployment guide for Casa Ignat production environment.

## 📋 Table of Contents

- [Requirements](#requirements)
- [Server Setup](#server-setup)
- [Initial Deployment](#initial-deployment)
- [Environment Variables](#environment-variables)
- [SSL Configuration](#ssl-configuration)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## 🔧 Requirements

### Minimum Server Specifications

**Production:**
- Ubuntu 22.04 LTS
- 2 CPU cores
- 4GB RAM
- 50GB SSD storage
- Public IP address

**Recommended:**
- 4 CPU cores
- 8GB RAM
- 100GB SSD storage

### Required Software

- Docker 24.0+
- Docker Compose 2.20+
- Git
- Nginx (in Docker)
- SSL certificate (Let's Encrypt)

---

## 🖥️ Server Setup

### 1. Automated Setup

Run the automated setup script (recommended):

```bash
# Download and run setup script
wget https://raw.githubusercontent.com/your-org/casa-ignat-nodejs/main/scripts/setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh
```

This script will:
- Install Docker, Docker Compose, Node.js
- Configure firewall (UFW)
- Set up fail2ban for security
- Create application user
- Configure log rotation
- Set up daily backups
- Create swap file (if needed)

### 2. Manual Setup

If you prefer manual setup:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y curl wget git build-essential ufw fail2ban

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Create application user
sudo useradd -m -s /bin/bash casa-ignat
sudo usermod -aG docker casa-ignat
```

---

## 📦 Initial Deployment

### 1. Clone Repository

```bash
# Switch to application user
sudo -u casa-ignat -i

# Clone repository
git clone https://github.com/your-org/casa-ignat-nodejs.git /var/www/casa-ignat-nodejs
cd /var/www/casa-ignat-nodejs
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

See [Environment Variables](#environment-variables) section for details.

### 3. Obtain SSL Certificate

```bash
# Using standalone mode (before starting nginx)
sudo certbot certonly --standalone \
    -d casa-ignat.ro \
    -d www.casa-ignat.ro \
    --email admin@casa-ignat.ro \
    --agree-tos \
    --no-eff-email

# Copy certificates to project directory
sudo cp -r /etc/letsencrypt ./certbot/conf/
```

### 4. Start Services

```bash
# Build and start production services
docker-compose --profile production up -d

# Check status
docker-compose --profile production ps

# View logs
docker-compose --profile production logs -f app
```

### 5. Verify Deployment

```bash
# Check application health
curl http://localhost:3000/health

# Check through Nginx
curl https://casa-ignat.ro/health

# Verify SSL
curl -I https://casa-ignat.ro
```

---

## 🔐 Environment Variables

Create `.env` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3000
SITE_URL=https://casa-ignat.ro

# Database
MONGODB_URI=mongodb://admin:CHANGE_ME@mongodb:27017/casa_ignat?authSource=admin
MONGODB_USER=admin
MONGODB_PASSWORD=CHANGE_ME

# Redis
REDIS_URL=redis://:CHANGE_ME@redis:6379
REDIS_PASSWORD=CHANGE_ME

# Session
SESSION_SECRET=GENERATE_RANDOM_64_CHAR_STRING
SESSION_MAX_AGE=2592000000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Casa Ignat <noreply@casa-ignat.ro>

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=GENERATE_RANDOM_32_CHAR_STRING

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf

# API Keys (Optional)
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=UA-XXXXX-X

# Build Info (Auto-populated by CI/CD)
BUILD_DATE=
VCS_REF=
VERSION=1.0.0
```

### Generate Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔒 SSL Configuration

### Using Let's Encrypt

#### Initial Setup

```bash
# Stop Nginx if running
docker-compose stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
    -d casa-ignat.ro \
    -d www.casa-ignat.ro \
    --email admin@casa-ignat.ro

# Start services
docker-compose --profile production up -d
```

#### Auto-Renewal

The Certbot container automatically renews certificates every 12 hours. Check renewal status:

```bash
docker-compose logs certbot
```

Manual renewal:

```bash
docker-compose exec certbot certbot renew
docker-compose restart nginx
```

---

## 📊 Monitoring & Logs

### Application Logs

```bash
# View all logs
docker-compose --profile production logs

# Follow app logs
docker-compose --profile production logs -f app

# View Nginx logs
docker-compose --profile production logs -f nginx

# View MongoDB logs
docker-compose --profile production logs -f mongodb
```

### Log Files Location

- Application: `/var/www/casa-ignat-nodejs/logs/`
- Nginx: Docker volume `nginx_logs`
- MongoDB: Docker volume `mongodb_data`

### PM2 Monitoring (Alternative to Docker)

If using PM2 instead of Docker:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs

# Dashboard
pm2 plus  # Requires PM2 Plus account
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Docker health status
docker-compose ps
docker inspect casa-ignat-app --format='{{.State.Health.Status}}'
```

---

## 💾 Backup & Restore

### Automated Backups

Daily backups are configured via cron:

```bash
# View backup cron job
crontab -l

# Manual backup
./scripts/backup-db.sh
```

### Backup Location

- Local: `/var/backups/casa-ignat/mongodb/`
- Retention: 30 days

### Restore from Backup

```bash
# List available backups
ls -lh /var/backups/casa-ignat/mongodb/

# Restore specific backup
./scripts/restore-db.sh /var/backups/casa-ignat/mongodb/casa-ignat-backup-20250118_020000.tar.gz
```

### Cloud Backup (Optional)

Configure S3 backup in `scripts/backup-db.sh`:

```bash
# Install AWS CLI
sudo apt-get install awscli

# Configure credentials
aws configure

# Uncomment S3 upload section in backup script
```

---

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check container status
docker-compose ps

# View error logs
docker-compose logs app

# Check environment variables
docker-compose config

# Restart services
docker-compose --profile production restart app
```

### Database Connection Issues

```bash
# Check MongoDB status
docker-compose logs mongodb

# Test connection
docker exec -it casa-ignat-mongodb mongosh \
    --username admin \
    --password admin123 \
    --authenticationDatabase admin

# Verify credentials in .env
```

### Nginx Issues

```bash
# Test Nginx configuration
docker-compose exec nginx nginx -t

# Reload Nginx
docker-compose exec nginx nginx -s reload

# Check Nginx logs
docker-compose logs nginx

# Verify port bindings
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Force renewal
docker-compose exec certbot certbot renew --force-renewal
docker-compose restart nginx

# Verify SSL
openssl s_client -connect casa-ignat.ro:443 -servername casa-ignat.ro
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Restart application
docker-compose --profile production restart app

# Adjust PM2 max memory restart
# Edit ecosystem.config.js: max_memory_restart: '500M'
```

---

## 🔄 Maintenance

### Update Application

```bash
cd /var/www/casa-ignat-nodejs

# Backup database first
./scripts/backup-db.sh

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose --profile production up -d --build

# Verify
docker-compose ps
curl https://casa-ignat.ro/health
```

### Update Dependencies

```bash
# Update npm packages
npm update

# Rebuild Docker image
docker-compose --profile production build app
docker-compose --profile production up -d app
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune

# Full cleanup
docker system prune -a --volumes
```

### Database Maintenance

```bash
# Compact database
docker exec casa-ignat-mongodb mongosh \
    --username admin \
    --password admin123 \
    --authenticationDatabase admin \
    --eval "db.runCommand({compact: 'collection_name'})"

# Check database size
docker exec casa-ignat-mongodb mongosh \
    --username admin \
    --password admin123 \
    --authenticationDatabase admin \
    --eval "db.stats()"
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## 🆘 Support

For issues or questions:

- Create an issue on GitHub
- Contact: admin@casa-ignat.ro
- Documentation: `/docs` directory

---

**Last Updated:** 2025-01-18
**Version:** 1.0.0
