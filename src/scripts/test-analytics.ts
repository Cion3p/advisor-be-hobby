import { getRealAnalytics, trackEvent } from '../services/analytics.service.js';

async function test() {
  console.log('🧪 Testing trackEvent...');
  await trackEvent({
    sessionId: 'test_session_123',
    visitorId: 'test_vid_abc',
    eventType: 'PAGE_VIEW',
    pagePath: '/calculators/tax',
    pageTitle: 'โปรแกรมคำนวณภาษีและวางแผนประกัน 2567',
    referrer: 'https://google.com',
    deviceType: 'desktop',
    browser: 'Chrome',
    consentStatus: 'all',
    eventData: { test: true },
  });

  console.log('📊 Fetching getRealAnalytics...');
  const res = await getRealAnalytics();
  console.log('KPIs:', res.kpis);
  console.log('Traffic:', JSON.stringify(res.traffic, null, 2));
  console.log('Cookie Stats:', res.cookieStats);
  process.exit(0);
}

test().catch(console.error);
