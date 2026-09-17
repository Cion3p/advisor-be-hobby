import { pool } from '../config/db.js';

async function migrateLeads() {
  console.log('🔄 Checking and adding `tags` column to `leads` table...');
  try {
    await pool.query('ALTER TABLE leads ADD COLUMN tags JSON NULL AFTER user_notes;');
    console.log('✅ Added `tags` column to `leads` table successfully.');
  } catch (e: any) {
    if (e.message.includes('Duplicate column')) {
      console.log('ℹ️ Column `tags` already exists in `leads`.');
    } else {
      console.error('⚠️ Error adding tags column:', e.message);
    }
  }

  const [cols]: any = await pool.query('DESCRIBE leads');
  console.log('📋 Current `leads` columns:');
  console.table(cols.map((c: any) => ({ Field: c.Field, Type: c.Type })));

  await pool.end();
}

migrateLeads().catch(console.error);
