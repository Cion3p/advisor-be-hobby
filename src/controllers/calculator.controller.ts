import { Request, Response, NextFunction } from 'express';
import { computeTaxDeduction } from '../services/taxCalculator.service.js';
import { computeLifeValue } from '../services/lifeValueCalculator.service.js';

export function calculateTax(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      annualIncome,
      existingLifeInsurance,
      existingHealthInsurance,
      existingPension,
      proposedLifeInsurance,
      proposedHealthInsurance,
      proposedPension,
    } = req.body;

    if (annualIncome === undefined || isNaN(Number(annualIncome))) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรายได้พึงประเมินทั้งปี (annualIncome)' });
    }

    const result = computeTaxDeduction({
      annualIncome: Number(annualIncome),
      existingLifeInsurance: Number(existingLifeInsurance || 0),
      existingHealthInsurance: Number(existingHealthInsurance || 0),
      existingPension: Number(existingPension || 0),
      proposedLifeInsurance: Number(proposedLifeInsurance || 0),
      proposedHealthInsurance: Number(proposedHealthInsurance || 0),
      proposedPension: Number(proposedPension || 0),
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
