import { Request, Response, NextFunction } from 'express';
import * as leadService from '../services/lead.service.js';

export async function submitLead(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      interestedProductId,
      preferredContactTime,
      province,
      ageRange,
      budgetRange,
      userNotes,
      pdpaConsent,
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อและเบอร์โทรศัพท์สำหรับติดต่อกลับ' });
    }

    if (!pdpaConsent) {
      return res.status(400).json({ success: false, message: 'กรุณายินยอมเงื่อนไข PDPA เพื่อให้เจ้าหน้าที่ติดต่อกลับ' });
    }

    const result = await leadService.createLead({
      customerName,
      customerPhone,
      customerEmail,
      interestedProductId: interestedProductId ? Number(interestedProductId) : undefined,
      preferredContactTime,
      province,
      ageRange,
      budgetRange,
      userNotes,
      pdpaConsent: Boolean(pdpaConsent),
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const leads = await leadService.getLeads(status as string);
    res.json({ success: true, count: (leads as any[]).length, data: leads });
  } catch (error) {
    next(error);
  }
}

export async function updateLeadStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุสถานะที่ต้องการอัปเดต' });
    }
    const result = await leadService.updateLeadStatus(Number(id), status, notes);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await leadService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

