const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
    try {
        console.log('Reading schema file...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        console.log('Executing schema...');
        await pool.query(schema);
        
        console.log('✅ Database setup complete!');
        console.log('Demo users:');
        console.log('  Admin: username=admin, password=password');
        console.log('  Customer: username=alice, password=password');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
    }
}

setupDatabase();
