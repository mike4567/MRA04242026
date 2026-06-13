/**
 * Migration Runner: Environmental Risk Data Integration
 * 
 * This script adds the risk_map_url and risk_data_details columns to the
 * incidents table for capturing NOAA CoastWatch ERDDAP environmental data.
 * 
 * Prerequisites:
 * 1. Cloud SQL Proxy running: .\cloud-sql-proxy.exe ggn-nmfs-wcrmmrapp-dev-1:us-west2:nmfs-mra-db-west2 --port=5432
 * 2. .env.local file with DATABASE_URL configured
 * 
 * Usage: node run_environmental_risk_migration.js
 * 
 * NIST SP 800-218 Compliance: PW.1.1 - Well-documented migration script
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('ERROR: DATABASE_URL not found in .env.local');
        console.error('Ensure .env.local exists and contains DATABASE_URL');
        process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('Environmental Risk Data Migration');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    const pool = new Pool({ connectionString });

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migration_environmental_risk.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Executing migration...');
        console.log('');

        // Execute the migration
        await client.query(migrationSQL);

        console.log('');
        console.log('Verifying columns exist...');

        // Verify the columns were added
        const verifyQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'incidents'
            AND column_name IN ('risk_map_url', 'risk_data_details')
            ORDER BY column_name;
        `;
        
        const result = await client.query(verifyQuery);
        
        if (result.rows.length === 2) {
            console.log('✓ Migration successful! New columns:');
            result.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });
        } else {
            console.warn('⚠ Warning: Expected 2 columns, found', result.rows.length);
            console.log('Columns found:', result.rows);
        }

        client.release();
        console.log('');
        console.log('='.repeat(60));
        console.log('Migration complete!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
