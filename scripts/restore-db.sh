#!/bin/bash

################################################################################
# Database Restore Script for Casa Ignat
# Restores MongoDB database from backup
################################################################################

set -e

# Configuration
BACKUP_DIR="/var/backups/casa-ignat/mongodb"
MONGO_USER="admin"
MONGO_PASS="admin123"
MONGO_HOST="mongodb"
MONGO_PORT="27017"
MONGO_DB="casa_ignat"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: This will replace the current database with the backup!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Extract backup
echo "Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"
BACKUP_NAME=$(basename "${BACKUP_FILE}" .tar.gz)

# Restore database
echo "Restoring database from: ${BACKUP_NAME}"

if command -v mongorestore &> /dev/null; then
    # Running on host
    mongorestore \
        --host "${MONGO_HOST}" \
        --port "${MONGO_PORT}" \
        --username "${MONGO_USER}" \
        --password "${MONGO_PASS}" \
        --authenticationDatabase admin \
        --db "${MONGO_DB}" \
        --gzip \
        --drop \
        "${TEMP_DIR}/${BACKUP_NAME}/${MONGO_DB}"
else
    # Running in Docker
    docker cp "${TEMP_DIR}/${BACKUP_NAME}" casa-ignat-mongodb:/tmp/
    docker exec casa-ignat-mongodb mongorestore \
        --host localhost \
        --port 27017 \
        --username "${MONGO_USER}" \
        --password "${MONGO_PASS}" \
        --authenticationDatabase admin \
        --db "${MONGO_DB}" \
        --gzip \
        --drop \
        "/tmp/${BACKUP_NAME}/${MONGO_DB}"
    docker exec casa-ignat-mongodb rm -rf "/tmp/${BACKUP_NAME}"
fi

# Cleanup
rm -rf "${TEMP_DIR}"

echo "Database restored successfully!"
