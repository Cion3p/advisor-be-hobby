import { Request, Response, NextFunction } from 'express';
import { computeTaxDeduction } from '../services/taxCalculator.service.js';
import { computeLifeValue } from '../services/lifeValueCalculator.service.js';

export function calculateTax(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body || {};
    let income = body.annualIncome;
    if ((income === undefined || isNaN(Number(income))) && body.monthlyIncome !== undefined) {
      income = Number(body.monthlyIncome) * 12;
    }

    if (income === undefined || isNaN(Number(income))) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุรายได้พึงประเมินทั้งปี (annualIncome) หรือรายได้ต่อเดือน (monthlyIncome)' 
      });
    }

    const result = computeTaxDeduction({
      annualIncome: Number(income),
      existingLifeInsurance: Number(body.existingLifeInsurance || 0),
      existingHealthInsurance: Number(body.existingHealthInsurance || 0),
      existingPension: Number(body.existingPension || 0),
      proposedLifeInsurance: Number(body.proposedLifeInsurance || 0),
      proposedHealthInsurance: Number(body.proposedHealthInsurance || 0),
      proposedPension: Number(body.proposedPension || 0),
      otherDeductions: body.otherDeductions ? {
        socialSecurity: Number(body.otherDeductions.socialSecurity || 0),
        spouseAllowance: Boolean(body.otherDeductions.spouseAllowance),
        childrenCount: Number(body.otherDeductions.childrenCount || 0),
        parentsCount: Number(body.otherDeductions.parentsCount || 0),
        disabledCareCount: Number(body.otherDeductions.disabledCareCount || 0),
        mortgageInterest: Number(body.otherDeductions.mortgageInterest || 0),
        thaiEsg: Number(body.otherDeductions.thaiEsg || 0),
        rmfPvdSsf: Number(body.otherDeductions.rmfPvdSsf || 0),
        easyEReceipt: Number(body.otherDeductions.easyEReceipt || 0),
        educationDonation: Number(body.otherDeductions.educationDonation || 0),
        generalDonation: Number(body.otherDeductions.generalDonation || 0),
      } : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export function calculateLifeValue(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      monthlyFamilyExpense,
      supportYears,
      outstandingDebts,
      childrenEducationFund,
      funeralAndEmergency,
      existingAssets,
      existingLifeCoverage,
    } = req.body;

    if (monthlyFamilyExpense === undefined || isNaN(Number(monthlyFamilyExpense))) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุค่าใช้จ่ายครอบครัวต่อเดือน' });
    }

    const result = computeLifeValue({
      monthlyFamilyExpense: Number(monthlyFamilyExpense || 0),
      supportYears: Number(supportYears || 5),
      outstandingDebts: Number(outstandingDebts || 0),
      childrenEducationFund: Number(childrenEducationFund || 0),
      funeralAndEmergency: Number(funeralAndEmergency || 200000),
      existingAssets: Number(existingAssets || 0),
      existingLifeCoverage: Number(existingLifeCoverage || 0),
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
