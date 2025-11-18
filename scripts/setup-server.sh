#!/bin/bash

################################################################################
# Server Setup Script for Casa Ignat
# Sets up a fresh Ubuntu 22.04 server for production deployment
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_USER="casa-ignat"
APP_DIR="/var/www/casa-ignat-nodejs"
DOMAIN="casa-ignat.ro"
EMAIL="admin@casa-ignat.ro"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Casa Ignat - Server Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install essential packages
echo -e "${YELLOW}Installing essential packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ufw \
    fail2ban \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    vim \
    unzip

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js and npm (for PM2 if needed)
echo -e "${YELLOW}Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Create application user
echo -e "${YELLOW}Creating application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG docker "$APP_USER"
fi

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo -e "${YELLOW}Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Create backup directory
mkdir -p /var/backups/casa-ignat/mongodb
chown -R "$APP_USER:$APP_USER" /var/backups/casa-ignat

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
systemctl stop nginx
systemctl disable nginx  # We'll use Nginx in Docker

# Set up log rotation
echo -e "${YELLOW}Configuring log rotation...${NC}"
cat > /etc/logrotate.d/casa-ignat <<EOF
/var/www/casa-ignat-nodejs/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ${APP_USER} ${APP_USER}
    sharedscripts
    postrotate
        docker-compose --project-directory /var/www/casa-ignat-nodejs restart app || true
    endscript
}
EOF

# Set up daily backup cron job
echo -e "${YELLOW}Setting up daily backups...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * ${APP_DIR}/scripts/backup-db.sh >> /var/log/casa-ignat-backup.log 2>&1") | crontab -

# Set up swap if not exists (for low-memory servers)
if [ ! -f /swapfile ]; then
    echo -e "${YELLOW}Creating swap file (2GB)...${NC}"
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Install monitoring tools (optional)
echo -e "${YELLOW}Would you like to install monitoring tools? (y/n)${NC}"
read -r INSTALL_MONITORING
if [ "$INSTALL_MONITORING" = "y" ]; then
    # Install netdata for monitoring
    bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait
fi

# Print summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Server setup completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Clone the repository:"
echo -e "   ${YELLOW}sudo -u $APP_USER git clone <repo-url> $APP_DIR${NC}"
echo ""
echo -e "2. Configure environment variables:"
echo -e "   ${YELLOW}sudo -u $APP_USER cp $APP_DIR/.env.example $APP_DIR/.env${NC}"
echo -e "   ${YELLOW}sudo -u $APP_USER nano $APP_DIR/.env${NC}"
echo ""
echo -e "3. Obtain SSL certificate:"
echo -e "   ${YELLOW}certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL${NC}"
echo ""
echo -e "4. Start the application:"
echo -e "   ${YELLOW}cd $APP_DIR${NC}"
echo -e "   ${YELLOW}docker-compose --profile production up -d${NC}"
echo ""
echo -e "5. Check application status:"
echo -e "   ${YELLOW}docker-compose --profile production ps${NC}"
echo -e "   ${YELLOW}docker-compose --profile production logs -f app${NC}"
echo ""
echo -e "${GREEN}Server is ready for deployment!${NC}"
