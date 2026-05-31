/**
 * Database Migration Script
 * 
 * This script runs the user table migration to add missing columns
 * and creates the default WCRResponder user.
 * 
 * Prerequisites:
 * 1. IAP tunnel must be running: 
 *    gcloud compute ssh jumpbox-west2 --zone=us-west2-a --project=ggn-nmfs-wcrmmrapp-dev-1 --tunnel-through-iap -- -L 5432:10.98.17.3:5432 -N
 * 2. .env.local must have correct DATABASE_URL pointing to localhost:5432
 * 
 * Run with: node run_migration.js
 */

const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    console.log('🚀 Starting user table migration...\n');
    
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

        console.log('📋 Running migration statements...\n');

        // Step 1: Add password_hash column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
            console.log('  ✅ Added column: password_hash');
        } catch (err) {
            console.log(`  ⚠️  password_hash: ${err.message}`);
        }

        // Step 2: Add name column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT');
            console.log('  ✅ Added column: name');
        } catch (err) {
            console.log(`  ⚠️  name: ${err.message}`);
        }

        // Step 3: Add active column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true');
            console.log('  ✅ Added column: active');
        } catch (err) {
            console.log(`  ⚠️  active: ${err.message}`);
        }

        // Step 4: Add updated_at column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');
            console.log('  ✅ Added column: updated_at');
        } catch (err) {
            console.log(`  ⚠️  updated_at: ${err.message}`);
        }

        // Step 5: Insert default WCRResponder user
        // Password: WCRResponder7600! (bcrypt hash with 12 salt rounds)
        const passwordHash = '$2b$12$HeA20cMhBHW1Cu1dwKwYJew/L1a2N5ejCjJHuGpsFKnXb545gA1oy';
        
        try {
            const insertResult = await pool.query(`
                INSERT INTO users (id, email, password_hash, name, role, active, created_at, updated_at)
                VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    active = EXCLUDED.active,
                    updated_at = NOW()
                RETURNING id, email, name, role
            `, ['WCRResponder@noaa.gov', passwordHash, 'WCR Responder', 'ADMIN']);
            
            console.log('  ✅ Inserted/Updated default user: WCRResponder@noaa.gov');
        } catch (err) {
            console.log(`  ⚠️  User insert: ${err.message}`);
        }

        // Verify the migration
        console.log('\n📊 Verifying migration...\n');
        
        // Check table structure
        const columnsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('Users table columns:');
        columnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Check if user was created
        console.log('\n📋 Checking WCRResponder user...');
        const userResult = await pool.query(`
            SELECT id, email, name, role, active, created_at 
            FROM users 
            WHERE email = 'WCRResponder@noaa.gov'
        `);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            console.log(`\n✅ Default user found:`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Active: ${user.active}`);
            console.log(`   Created: ${user.created_at}`);
        } else {
            console.log('❌ Default user NOT found!');
        }

        // Count total users
        const countResult = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`\n📊 Total users in database: ${countResult.rows[0].count}`);

        console.log('\n🎉 Migration completed successfully!\n');
        console.log('You can now log in with:');
        console.log('  Email: WCRResponder@noaa.gov');
        console.log('  Password: WCRResponder7600!');
        console.log('\n⚠️  Remember to change this password after logging in!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
