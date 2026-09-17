import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service.js';

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getRealAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function trackEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      eventType,
      eventData,
      sessionId,
      visitorId,
      pagePath,
      pageTitle,
      referrer,
      deviceType,
      browser,
      consentStatus,
    } = req.body || {};

    if (!eventType) {
      return res.status(400).json({ success: false, message: 'Missing eventType' });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Simple device detection fallback
    let detectedDevice = deviceType;
    if (!detectedDevice) {
      if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
        detectedDevice = 'mobile';
      } else if (/iPad|Tablet/i.test(userAgent)) {
        detectedDevice = 'tablet';
      } else {
        detectedDevice = 'desktop';
      }
    }

    // Simple browser detection fallback
    let detectedBrowser = browser;
    if (!detectedBrowser) {
      if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) detectedBrowser = 'Chrome';
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) detectedBrowser = 'Safari';
      else if (/Edg/i.test(userAgent)) detectedBrowser = 'Edge';
      else if (/Firefox/i.test(userAgent)) detectedBrowser = 'Firefox';
      else detectedBrowser = 'Browser';
    }

    const result = await analyticsService.trackEvent({
      sessionId,
      visitorId,
      eventType,
      pagePath,
      pageTitle,
      referrer,
      deviceType: detectedDevice,
      browser: detectedBrowser,
      ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
      consentStatus: consentStatus || 'all',
      eventData,
    });

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
}
