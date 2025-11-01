#!/bin/bash

# Database Export Script using Docker (version-agnostic)
# This exports your current Sydney database to a backup file

echo "🗄️  Exporting Jits Journal database from Sydney using Docker..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not found"
    exit 1
fi

# Parse DATABASE_URL to extract components
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 Database connection info:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Create backup directory
mkdir -p backups

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/jits_journal_sydney_${TIMESTAMP}.sql"

echo "📦 Exporting to: $BACKUP_FILE"
echo "⏳ This may take a minute..."
echo ""

# Export using Docker with PostgreSQL 17
docker run --rm \
  -v "$(pwd)/backups:/backup" \
  -e PGPASSWORD="$DB_PASS" \
  postgres:17 \
  pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    -f "/backup/jits_journal_sydney_${TIMESTAMP}.sql"

# Check if export was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Export successful!"
    echo ""
    echo "Backup file created: $BACKUP_FILE"
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Create new project in Singapore region (ap-southeast-1)"
    echo "3. Run import_database.sh with your new database URL"
else
    echo ""
    echo "❌ Export failed!"
    echo "Please check your DATABASE_URL and Docker installation"
    exit 1
fi
