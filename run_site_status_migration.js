/**
 * Site Status Migration Script
 * 
 * This script adds the site_status configuration to system_config table.
 * Default value is 'coming_soon' for the launch toggle feature.
 * 
 * Prerequisites:
 * 1. IAP tunnel must be running: 
 *    gcloud compute ssh mra-jumpbox --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap --ssh-flag="-L" --ssh-flag="5432:10.98.17.3:5432" --ssh-flag="-N"
 * 2. .env.local must have correct DATABASE_URL pointing to localhost:5432
 * 
 * Run with: node run_site_status_migration.js
 */

const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    console.log('🚀 Starting site_status migration...\n');
    
    // Create database pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Local tunnel doesn't need SSL
    });

    try {
        // Test connection
        console.log('📡 Testing database connection...');
        const testResult = await pool.query('SELECT NOW()');
        console.log(`✅ Connected to database at ${testResult.rows[0].now}\n`);

        // Check if system_config table exists
        console.log('📋 Checking system_config table...');
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'system_config'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('❌ system_config table does not exist!');
            console.log('Creating system_config table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS system_config (
                    key TEXT PRIMARY KEY,
                    value JSONB
                )
            `);
            console.log('✅ Created system_config table');
        } else {
            console.log('✅ system_config table exists');
        }

        // Insert site_status with default value
        console.log('\n📋 Adding site_status configuration...');
        
        const insertResult = await pool.query(`
            INSERT INTO system_config (key, value) 
            VALUES ('site_status', '"coming_soon"'::jsonb)
            ON CONFLICT (key) DO NOTHING
            RETURNING key, value
        `);
        
        if (insertResult.rows.length > 0) {
            console.log(`✅ Inserted site_status with value: ${insertResult.rows[0].value}`);
        } else {
            console.log('⚠️  site_status already exists, skipping insert');
        }

        // Verify the configuration
        console.log('\n📊 Verifying configuration...');
        const verifyResult = await pool.query(`
            SELECT key, value FROM system_config WHERE key = 'site_status'
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log(`✅ site_status configured: ${verifyResult.rows[0].value}`);
        } else {
            console.log('❌ site_status not found in system_config!');
        }

        // Show all system_config entries
        console.log('\n📋 All system_config entries:');
        const allConfigs = await pool.query(`
            SELECT key, value FROM system_config ORDER BY key
        `);
        allConfigs.rows.forEach(row => {
            console.log(`  - ${row.key}: ${JSON.stringify(row.value)}`);
        });

        console.log('\n🎉 Migration completed successfully!\n');
        console.log('Site Status Options:');
        console.log('  - "live": Public site is accessible');
        console.log('  - "coming_soon": Displays Coming Soon page (default)');
        console.log('  - "maintenance": Displays Maintenance page');
        console.log('\nYou can change the status from the Admin Configuration page.\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
