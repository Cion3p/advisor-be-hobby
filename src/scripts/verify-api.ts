import app from '../app.js';
import { pool } from '../config/db.js';

const server = app.listen(5998, async () => {
  try {
    const leadsRes = await fetch('http://localhost:5998/api/v1/leads');
    const leads: any = await leadsRes.json();
    console.log('✅ LEADS FROM DB:', leads.data.length, 'leads');
    console.log('   First Lead Name:', leads.data[0]?.customer_name);

    const articlesRes = await fetch('http://localhost:5998/api/v1/articles');
    const articles: any = await articlesRes.json();
    console.log('✅ ARTICLES FROM DB:', articles.data.length, 'articles');
    console.log('   First Article Title:', articles.data[0]?.title);
    console.log('   First Article Cover:', articles.data[0]?.cover_image_url ? 'Yes' : 'No');

    const slidesRes = await fetch('http://localhost:5998/api/v1/hero-slides');
    const slides: any = await slidesRes.json();
    console.log('✅ HERO SLIDES FROM DB:', slides.data.length, 'slides');
    console.log('   First Slide Title:', slides.data[0]?.title);

    const announceRes = await fetch('http://localhost:5998/api/v1/announcements');
    const announce: any = await announceRes.json();
    console.log('✅ ANNOUNCEMENT FROM DB:', announce.data?.title);
  } catch (err: any) {
    console.error('VERIFY ERROR:', err.message);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
});
