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
    const { eventType, eventData } = req.body || {};
    if (!eventType) {
      return res.status(400).json({ success: false, message: 'Missing eventType' });
    }
    const result = await analyticsService.trackEvent(eventType, eventData);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
}
