import app from './app.js';
import { initDatabase } from './config/db.js';
import { seedData } from './scripts/seed.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  console.log('🚀 Starting Financial Advisory Backend Server...');

  // Initialize DB and run initial seed if DB is available
  try {
    const isDbReady = await initDatabase();
    if (isDbReady) {
      await seedData();
    }
  } catch (err) {
    console.warn('⚠️ Warning: DB initialization deferred. Server starting anyway.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 API Server running at: http://localhost:${PORT}`);
    console.log(`📡 Health check at:      http://localhost:${PORT}/api/v1/health`);
    console.log(`🌐 CORS enabled for:     ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
