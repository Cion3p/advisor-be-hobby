import { pool } from '../config/db.js';

async function check() {
  try {
    const [tables]: any = await pool.query("SHOW TABLES");
    console.log("TABLES:", tables.map((t: any) => Object.values(t)[0]));

    for (const table of ['companies', 'categories', 'products', 'articles', 'leads', 'users', 'agents', 'hero_slides', 'announcements']) {
      try {
        const [rows]: any = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`);
        console.log(`Table ${table}: ${rows[0].cnt} rows`);
      } catch (e: any) {
        console.log(`Table ${table}: error ${e.message}`);
      }
    }
  } catch (err: any) {
    console.error("DB ERR:", err.message);
  } finally {
    await pool.end();
  }
}

check();
