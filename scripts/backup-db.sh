#!/bin/bash

################################################################################
# Database Backup Script for Casa Ignat
# Creates daily MongoDB backups with rotation
################################################################################

set -e

# Configuration
BACKUP_DIR="/var/backups/casa-ignat/mongodb"
RETENTION_DAYS=30
MONGO_USER="admin"
MONGO_PASS="admin123"
MONGO_HOST="mongodb"
MONGO_PORT="27017"
MONGO_DB="casa_ignat"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="casa-ignat-backup-${DATE}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting MongoDB backup: ${BACKUP_NAME}"

# Dump MongoDB database
if command -v mongodump &> /dev/null; then
    # Running on host
    mongodump \
        --host "${MONGO_HOST}" \
        --port "${MONGO_PORT}" \
        --username "${MONGO_USER}" \
        --password "${MONGO_PASS}" \
        --authenticationDatabase admin \
        --db "${MONGO_DB}" \
        --out "${BACKUP_DIR}/${BACKUP_NAME}" \
        --gzip
else
    # Running in Docker
    docker exec casa-ignat-mongodb mongodump \
        --host localhost \
        --port 27017 \
        --username "${MONGO_USER}" \
        --password "${MONGO_PASS}" \
        --authenticationDatabase admin \
        --db "${MONGO_DB}" \
        --out "/backups/${BACKUP_NAME}" \
        --gzip
fi

# Create archive
echo "Creating archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo "Backup completed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Delete old backups
echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "casa-ignat-backup-*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "casa-ignat-backup-*.tar.gz" | wc -l)
echo "Total backups: ${BACKUP_COUNT}"

# Optional: Upload to cloud storage (uncomment and configure)
# if command -v aws &> /dev/null; then
#     echo "Uploading to S3..."
#     aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
#         "s3://your-bucket/backups/mongodb/${BACKUP_NAME}.tar.gz"
# fi

echo "Backup process completed successfully!"
