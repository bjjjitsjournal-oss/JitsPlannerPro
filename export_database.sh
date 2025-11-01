#!/bin/bash

# Database Export Script for Jits Journal
# This exports your current Sydney database to a backup file

echo "🗄️  Exporting Jits Journal database from Sydney..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not found"
    echo "Please set it first:"
    echo "  export DATABASE_URL='your_database_url_here'"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/jits_journal_sydney_${TIMESTAMP}.sql"

echo "📦 Exporting to: $BACKUP_FILE"
echo ""

# Export the database (ignore version mismatch)
pg_dump --no-privileges --no-owner "$DATABASE_URL" > "$BACKUP_FILE"

# Check if export was successful
if [ $? -eq 0 ]; then
    echo "✅ Export successful!"
    echo ""
    echo "Backup file created: $BACKUP_FILE"
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo ""
    echo "Next step: Create new Supabase project in Singapore region"
else
    echo "❌ Export failed!"
    echo "Please check your DATABASE_URL and try again"
    exit 1
fi
