import { pool } from '../config/db.js';

async function migrate() {
  console.log('🔄 Starting analytics_events migration...');
  const cols = [
    { name: 'session_id', type: 'VARCHAR(100) NULL AFTER id' },
    { name: 'visitor_id', type: 'VARCHAR(100) NULL AFTER session_id' },
    { name: 'page_path', type: 'VARCHAR(255) NULL AFTER event_type' },
    { name: 'page_title', type: 'VARCHAR(255) NULL AFTER page_path' },
    { name: 'referrer', type: 'VARCHAR(500) NULL AFTER page_title' },
    { name: 'device_type', type: "VARCHAR(50) DEFAULT 'desktop'" },
    { name: 'browser', type: 'VARCHAR(50) NULL' },
    { name: 'ip_address', type: 'VARCHAR(45) NULL' },
    { name: 'consent_status', type: "VARCHAR(50) DEFAULT 'all'" },
  ];

  for (const c of cols) {
    try {
      await pool.query(`ALTER TABLE analytics_events ADD COLUMN ${c.name} ${c.type};`);
      console.log(`✅ Added column: ${c.name}`);
    } catch (e: any) {
      console.log(`ℹ️ Column ${c.name}: ${e.message}`);
    }
  }

  // Add indexes for fast analytics queries
  const indexes = [
    { name: 'idx_event_type', col: 'event_type' },
    { name: 'idx_visitor_id', col: 'visitor_id' },
    { name: 'idx_page_path', col: 'page_path' },
    { name: 'idx_created_at', col: 'created_at' },
  ];

  for (const idx of indexes) {
    try {
      await pool.query(`CREATE INDEX ${idx.name} ON analytics_events (${idx.col});`);
      console.log(`✅ Added index: ${idx.name}`);
    } catch (e: any) {
      console.log(`ℹ️ Index ${idx.name}: ${e.message}`);
    }
  }

  const [desc]: any = await pool.query('DESCRIBE analytics_events');
  console.log('📊 NEW analytics_events SCHEMA:');
  console.table(desc.map((d: any) => ({ Field: d.Field, Type: d.Type, Null: d.Null })));

  await pool.end();
  console.log('🎉 Migration completed successfully!');
}

migrate().catch(console.error);
