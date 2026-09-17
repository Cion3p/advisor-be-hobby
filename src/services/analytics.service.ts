import { pool } from '../config/db.js';

export interface TrackEventInput {
  sessionId?: string;
  visitorId?: string;
  eventType: string;
  pagePath?: string;
  pageTitle?: string;
  referrer?: string;
  deviceType?: string;
  browser?: string;
  ipAddress?: string | null;
  consentStatus?: string;
  eventData?: any;
}

export async function trackEvent(input: TrackEventInput | string, legacyEventData?: any) {
  try {
    let sessionId: string | null = null;
    let visitorId: string | null = null;
    let eventType: string;
    let pagePath: string | null = null;
    let pageTitle: string | null = null;
    let referrer: string | null = null;
    let deviceType: string = 'desktop';
    let browser: string | null = null;
    let ipAddress: string | null = null;
    let consentStatus: string = 'all';
    let eventData: any = {};

    if (typeof input === 'string') {
      // legacy signature: trackEvent(eventType, eventData)
      eventType = input;
      eventData = legacyEventData || {};
      if (eventType.startsWith('COOKIE_')) {
        consentStatus = eventType === 'COOKIE_ACCEPT_ALL' ? 'all' : eventType === 'COOKIE_ESSENTIAL_ONLY' ? 'essential_only' : 'custom';
      }
    } else {
      sessionId = input.sessionId || null;
      visitorId = input.visitorId || null;
      eventType = input.eventType;
      pagePath = input.pagePath || null;
      pageTitle = input.pageTitle || null;
      referrer = input.referrer || null;
      deviceType = input.deviceType || 'desktop';
      browser = input.browser || null;
      ipAddress = input.ipAddress || null;
      consentStatus = input.consentStatus || 'all';
      eventData = input.eventData || {};
    }

    await pool.query(
      `INSERT INTO analytics_events 
        (session_id, visitor_id, event_type, page_path, page_title, referrer, device_type, browser, ip_address, consent_status, event_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        visitorId,
        eventType,
        pagePath,
        pageTitle,
        referrer,
        deviceType,
        browser,
        ipAddress,
        consentStatus,
        JSON.stringify(eventData || {}),
      ]
    );
    return { success: true };
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return { success: false };
  }
}

export async function getRealAnalytics() {
  // 1. Total Leads and Status Breakdown from MySQL
  const [leadStatusRows]: any = await pool.query(`
    SELECT status, COUNT(*) as count FROM leads GROUP BY status
  `);
  
  const [totalLeadsRow]: any = await pool.query('SELECT COUNT(*) as total FROM leads');
  const totalLeads = Number(totalLeadsRow[0]?.total || 0);

  const statusMap: Record<string, number> = {
    NEW: 0,
    CONTACTED: 0,
    CONSULTING: 0,
    CLOSED_WON: 0,
    CLOSED_LOST: 0,
  };

  leadStatusRows.forEach((r: any) => {
    if (r.status) statusMap[r.status] = Number(r.count || 0);
  });

  const closedWonCount = statusMap.CLOSED_WON || 0;
  const conversionRate = totalLeads > 0 ? Number(((closedWonCount / totalLeads) * 100).toFixed(1)) : 0;

  // 2. Leads by Province from MySQL
  const [provinceRows]: any = await pool.query(`
    SELECT province, COUNT(*) as count 
    FROM leads 
    WHERE province IS NOT NULL AND province != '' 
    GROUP BY province 
    ORDER BY count DESC
  `);

  const provinces = provinceRows.map((r: any) => ({
    province: r.province,
    count: Number(r.count),
    percentage: totalLeads > 0 ? Number(((Number(r.count) / totalLeads) * 100).toFixed(1)) : 0,
  }));

  // 3. Leads by Budget Range from MySQL
  const [budgetRows]: any = await pool.query(`
    SELECT budget_range, COUNT(*) as count 
    FROM leads 
    WHERE budget_range IS NOT NULL AND budget_range != '' 
    GROUP BY budget_range 
    ORDER BY count DESC
  `);

  const budgetRanges = budgetRows.map((r: any) => ({
    range: r.budget_range,
    count: Number(r.count),
    percentage: totalLeads > 0 ? Number(((Number(r.count) / totalLeads) * 100).toFixed(1)) : 0,
  }));

  // 4. Products, Categories, Companies from MySQL
  const [categoryRows]: any = await pool.query(`
    SELECT 
      c.id, c.name_th, c.slug, c.icon,
      COUNT(DISTINCT p.id) as product_count,
      COUNT(DISTINCT l.id) as lead_inquiries
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
    LEFT JOIN leads l ON p.id = l.interested_product_id
    GROUP BY c.id
    ORDER BY product_count DESC, c.sort_order ASC
  `);

  const [companyRows]: any = await pool.query(`
    SELECT 
      cp.id, cp.name, cp.code, cp.logo_url, cp.contact_phone,
      COUNT(DISTINCT p.id) as product_count
    FROM companies cp
    LEFT JOIN products p ON cp.id = p.company_id AND p.is_active = TRUE
    GROUP BY cp.id
    ORDER BY product_count DESC
  `);

  const [articleCountRow]: any = await pool.query('SELECT COUNT(*) as total FROM articles');
  const [productCountRow]: any = await pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = TRUE');
  const [companyCountRow]: any = await pool.query('SELECT COUNT(*) as total FROM companies WHERE is_active = TRUE');

  // 5. Recent 5 Leads from MySQL
  const [recentLeads]: any = await pool.query(`
    SELECT 
      l.id, l.customer_name, l.customer_phone, l.customer_email, 
      l.province, l.budget_range, l.status, l.created_at,
      p.title as product_title
    FROM leads l
    LEFT JOIN products p ON l.interested_product_id = p.id
    ORDER BY l.created_at DESC
    LIMIT 5
  `);

  // 6. Real Events & Traffic Metrics from analytics_events table
  let pageViewsCount = 0;
  let uniqueVisitorsCount = 0;
  let todayPageViews = 0;
  let todayUniqueVisitors = 0;
  let activeVisitors30m = 0;
  let calcRunsCount = 0;

  // Cookie Breakdown
  let acceptAllCookies = 0;
  let essentialOnlyCookies = 0;
  let customCookies = 0;
  let analyticsAllowedCount = 0;
  let marketingAllowedCount = 0;

  // Top Pages Breakdown
  let topPages: any[] = [];
  // Device & Browser Breakdown
  let deviceBreakdown: any[] = [];
  let browserBreakdown: any[] = [];
  // Live Visitor Activity Log
  let recentActivity: any[] = [];

  try {
    // Total Page Views
    const [pageViewRow]: any = await pool.query(`
      SELECT COUNT(*) as total FROM analytics_events WHERE event_type = 'PAGE_VIEW'
    `);
    pageViewsCount = Number(pageViewRow[0]?.total || 0);

    // Total Unique Visitors
    const [uniqueRow]: any = await pool.query(`
      SELECT COUNT(DISTINCT visitor_id) as total 
      FROM analytics_events 
      WHERE visitor_id IS NOT NULL AND visitor_id != ''
    `);
    uniqueVisitorsCount = Number(uniqueRow[0]?.total || 0);

    // Today's traffic
    const [todayRow]: any = await pool.query(`
      SELECT 
        COUNT(CASE WHEN event_type = 'PAGE_VIEW' THEN 1 END) as today_views,
        COUNT(DISTINCT visitor_id) as today_visitors
      FROM analytics_events 
      WHERE DATE(created_at) = CURDATE()
    `);
    todayPageViews = Number(todayRow[0]?.today_views || 0);
    todayUniqueVisitors = Number(todayRow[0]?.today_visitors || 0);

    // Active Visitors in last 30 minutes
    const [activeRow]: any = await pool.query(`
      SELECT COUNT(DISTINCT visitor_id) as active_now
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL 30 MINUTE AND visitor_id IS NOT NULL AND visitor_id != ''
    `);
    activeVisitors30m = Number(activeRow[0]?.active_now || 0);

    // Event Types Count (Calculators, Cookies, etc.)
    const [eventRows]: any = await pool.query(`
      SELECT event_type, COUNT(*) as count 
      FROM analytics_events 
      GROUP BY event_type
    `);
    
    eventRows.forEach((r: any) => {
      if (r.event_type === 'CALCULATOR_RUN') calcRunsCount = Number(r.count);
      if (r.event_type === 'COOKIE_ACCEPT_ALL') acceptAllCookies += Number(r.count);
      if (r.event_type === 'COOKIE_ESSENTIAL_ONLY') essentialOnlyCookies += Number(r.count);
      if (r.event_type === 'COOKIE_CUSTOM') customCookies += Number(r.count);
    });

    // Check specific consent statuses from events table
    const [consentRows]: any = await pool.query(`
      SELECT consent_status, COUNT(*) as count
      FROM analytics_events
      WHERE event_type LIKE 'COOKIE_%'
      GROUP BY consent_status
    `);
    consentRows.forEach((c: any) => {
      if (c.consent_status === 'all' && acceptAllCookies === 0) acceptAllCookies = Number(c.count);
      if (c.consent_status === 'essential_only' && essentialOnlyCookies === 0) essentialOnlyCookies = Number(c.count);
      if (c.consent_status === 'custom' && customCookies === 0) customCookies = Number(c.count);
    });

    // Extract analytics & marketing preferences from cookie events
    const [cookieDetailRows]: any = await pool.query(`
      SELECT event_data, consent_status 
      FROM analytics_events 
      WHERE event_type LIKE 'COOKIE_%'
    `);
    cookieDetailRows.forEach((row: any) => {
      let data = row.event_data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch {}
      }
      if (data) {
        if (data.analytics === true || row.consent_status === 'all') analyticsAllowedCount++;
        if (data.marketing === true || row.consent_status === 'all') marketingAllowedCount++;
      }
    });

    // Top Visited Pages (Where are visitors navigating?)
    const [topPageRows]: any = await pool.query(`
      SELECT 
        page_path, 
        COALESCE(MAX(page_title), page_path) as page_title, 
        COUNT(*) as views, 
        COUNT(DISTINCT visitor_id) as unique_visitors 
      FROM analytics_events 
      WHERE page_path IS NOT NULL AND page_path != '' AND event_type = 'PAGE_VIEW'
      GROUP BY page_path 
      ORDER BY views DESC 
      LIMIT 10
    `);

    const totalTrackedViews = pageViewsCount || 1;
    topPages = topPageRows.map((p: any) => ({
      path: p.page_path,
      title: p.page_title || p.page_path,
      views: Number(p.views),
      uniqueVisitors: Number(p.unique_visitors),
      percentage: Number(((Number(p.views) / totalTrackedViews) * 100).toFixed(1)),
    }));

    // Device Breakdown
    const [deviceRows]: any = await pool.query(`
      SELECT 
        COALESCE(device_type, 'desktop') as device, 
        COUNT(*) as count 
      FROM analytics_events 
      WHERE event_type = 'PAGE_VIEW' 
      GROUP BY device_type 
      ORDER BY count DESC
    `);
    const totalDevices = deviceRows.reduce((acc: number, cur: any) => acc + Number(cur.count), 0) || 1;
    deviceBreakdown = deviceRows.map((d: any) => ({
      device: d.device,
      count: Number(d.count),
      percentage: Number(((Number(d.count) / totalDevices) * 100).toFixed(1)),
    }));

    // Browser Breakdown
    const [browserRows]: any = await pool.query(`
      SELECT 
        COALESCE(browser, 'Other') as browser, 
        COUNT(*) as count 
      FROM analytics_events 
      WHERE event_type = 'PAGE_VIEW' AND browser IS NOT NULL
      GROUP BY browser 
      ORDER BY count DESC 
      LIMIT 5
    `);
    browserBreakdown = browserRows.map((b: any) => ({
      browser: b.browser,
      count: Number(b.count),
    }));

    // Recent Live Visitor Activity Log (last 15 events)
    const [recentEventRows]: any = await pool.query(`
      SELECT 
        id, 
        session_id, 
        visitor_id, 
        event_type, 
        page_path, 
        page_title, 
        device_type, 
        browser, 
        consent_status, 
        created_at 
      FROM analytics_events 
      ORDER BY created_at DESC 
      LIMIT 15
    `);
    recentActivity = recentEventRows.map((ev: any) => ({
      id: ev.id,
      visitorId: ev.visitor_id ? `${String(ev.visitor_id).slice(0, 8)}...` : 'Anonymous',
      eventType: ev.event_type,
      pagePath: ev.page_path || '/',
      pageTitle: ev.page_title || ev.page_path || 'หน้าหลัก',
      deviceType: ev.device_type || 'desktop',
      browser: ev.browser || 'Browser',
      consentStatus: ev.consent_status || 'all',
      createdAt: ev.created_at,
    }));

  } catch (err) {
    console.error('Error fetching analytics events details:', err);
  }

  const totalCookieEvents = acceptAllCookies + essentialOnlyCookies + customCookies;
  const consentRate = totalCookieEvents > 0 
    ? Number(((acceptAllCookies / totalCookieEvents) * 100).toFixed(1)) 
    : 100;

  return {
    databaseConnected: true,
    timestamp: new Date().toISOString(),
    kpis: {
      totalLeads,
      newLeads: statusMap.NEW,
      contactedLeads: statusMap.CONTACTED,
      consultingLeads: statusMap.CONSULTING,
      closedWonLeads: statusMap.CLOSED_WON,
      closedLostLeads: statusMap.CLOSED_LOST,
      conversionRate,
      totalProducts: Number(productCountRow[0]?.total || 0),
      totalCategories: categoryRows.length,
      totalCompanies: Number(companyCountRow[0]?.total || 0),
      totalArticles: Number(articleCountRow[0]?.total || 0),
      pageViews: pageViewsCount,
      uniqueVisitors: uniqueVisitorsCount,
      todayPageViews,
      todayUniqueVisitors,
      activeVisitors30m,
      calculatorRuns: calcRunsCount,
      cookieConsentRate: consentRate,
    },
    traffic: {
      totalPageViews: pageViewsCount,
      uniqueVisitors: uniqueVisitorsCount,
      todayPageViews,
      todayUniqueVisitors,
      activeVisitorsNow: activeVisitors30m,
      topPages,
      deviceBreakdown,
      browserBreakdown,
      recentActivity,
    },
    leads: {
      statusBreakdown: statusMap,
      provinces,
      budgetRanges,
      recentLeads,
    },
    categories: categoryRows.map((c: any) => ({
      id: c.id,
      name: c.name_th,
      slug: c.slug,
      productCount: Number(c.product_count),
      leadInquiries: Number(c.lead_inquiries),
    })),
    companies: companyRows.map((cp: any) => ({
      id: cp.id,
      name: cp.name,
      code: cp.code,
      phone: cp.contact_phone,
      productCount: Number(cp.product_count),
    })),
    cookieStats: {
      totalDecisions: totalCookieEvents,
      acceptAll: acceptAllCookies,
      essentialOnly: essentialOnlyCookies,
      custom: customCookies,
      rate: consentRate,
      analyticsAllowed: analyticsAllowedCount,
      marketingAllowed: marketingAllowedCount,
    },
  };
}
