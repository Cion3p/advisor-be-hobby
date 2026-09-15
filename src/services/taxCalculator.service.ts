export interface TaxCalculationInput {
  annualIncome: number;              // รายได้พึงประเมินทั้งปี
  standardExpenses?: number;         // หักค่าใช้จ่าย (ตามกฎหมาย 50% สูงสุด 100,000 สำหรับ 40(1))
  personalAllowance?: number;        // ลดหย่อนส่วนตัว (60,000)
  existingLifeInsurance?: number;    // ประกันชีวิตทั่วไปที่มีอยู่เดิม
  existingHealthInsurance?: number;  // ประกันสุขภาพที่มีอยู่เดิม
  existingPension?: number;          // ประกันบำนาญที่มีอยู่เดิม
  proposedLifeInsurance?: number;    // ประกันชีวิตที่จะซื้อเพิ่ม
  proposedHealthInsurance?: number;  // ประกันสุขภาพที่จะซื้อเพิ่ม
  proposedPension?: number;          // ประกันบำนาญที่จะซื้อเพิ่ม
}

export interface TaxBracketResult {
  range: string;
  rate: number;
  taxableAmount: number;
  taxInThisBracket: number;
}

export interface TaxCalculationOutput {
  annualIncome: number;
  standardExpenseDeduction: number;
  personalDeduction: number;
  totalInsuranceDeductionsBefore: number;
  totalInsuranceDeductionsAfter: number;
  netTaxableIncomeBefore: number;
  netTaxableIncomeAfter: number;
  totalTaxBefore: number;
  totalTaxAfter: number;
  taxSaved: number;
  marginalTaxRate: number; // ฐานภาษีสูงสุดของผู้ใช้ (%)
  bracketsBreakdown: TaxBracketResult[];
}

const TAX_BRACKETS = [
  { min: 0, max: 150000, rate: 0.00, label: '0 - 150,000 บาท (ยกเว้นภาษี)' },
  { min: 150000, max: 300000, rate: 0.05, label: '150,001 - 300,000 บาท (5%)' },
  { min: 300000, max: 500000, rate: 0.10, label: '300,001 - 500,000 บาท (10%)' },
  { min: 500000, max: 750000, rate: 0.15, label: '500,001 - 750,000 บาท (15%)' },
  { min: 750000, max: 1000000, rate: 0.20, label: '750,001 - 1,000,000 บาท (20%)' },
  { min: 1000000, max: 2000000, rate: 0.25, label: '1,000,001 - 2,000,000 บาท (25%)' },
  { min: 2000000, max: 5000000, rate: 0.30, label: '2,000,001 - 5,000,000 บาท (30%)' },
  { min: 5000000, max: Infinity, rate: 0.35, label: 'มากกว่า 5,000,000 บาท (35%)' },
];

function calculateProgressiveTax(netTaxableIncome: number): { totalTax: number; brackets: TaxBracketResult[]; marginalRate: number } {
  let totalTax = 0;
  let marginalRate = 0;
  const brackets: TaxBracketResult[] = [];

  if (netTaxableIncome <= 0) {
    return { totalTax: 0, brackets, marginalRate: 0 };
  }

  for (const bracket of TAX_BRACKETS) {
    if (netTaxableIncome > bracket.min) {
      const taxableInBracket = Math.min(netTaxableIncome - bracket.min, bracket.max - bracket.min);
      const tax = taxableInBracket * bracket.rate;
      totalTax += tax;
      if (bracket.rate > 0) {
        marginalRate = bracket.rate * 100;
      }
      brackets.push({
        range: bracket.label,
        rate: bracket.rate * 100,
        taxableAmount: Math.round(taxableInBracket),
        taxInThisBracket: Math.round(tax),
      });
    }
  }

  return { totalTax: Math.round(totalTax), brackets, marginalRate };
}

export function computeTaxDeduction(input: TaxCalculationInput): TaxCalculationOutput {
  const annualIncome = Math.max(0, input.annualIncome);
  // หักค่าใช้จ่าย 50% ของเงินได้ แต่ไม่เกิน 100,000 บาท
  const standardExpenses = Math.min(annualIncome * 0.5, 100000);
  // ค่าลดหย่อนส่วนตัว 60,000 บาท
  const personalAllowance = 60000;

  // คำนวณลดหย่อนประกันชีวิตและสุขภาพ (เกณฑ์สรรพากร: สุขภาพสูงสุด 25,000 และรวมกับชีวิตไม่เกิน 100,000)
  const calcInsuranceDeduction = (life: number = 0, health: number = 0, pension: number = 0) => {
    const validHealth = Math.min(health, 25000);
    const combinedGeneralLife = Math.min(life + validHealth, 100000);
    // ประกันบำนาญ สูงสุด 15% ของรายได้ และไม่เกิน 200,000
    const pensionCap = Math.min(annualIncome * 0.15, 200000);
    const validPension = Math.min(pension, pensionCap);
    return combinedGeneralLife + validPension;
  };

  const deductionBefore = calcInsuranceDeduction(
    input.existingLifeInsurance || 0,
    input.existingHealthInsurance || 0,
    input.existingPension || 0
  );

  const totalLife = (input.existingLifeInsurance || 0) + (input.proposedLifeInsurance || 0);
  const totalHealth = (input.existingHealthInsurance || 0) + (input.proposedHealthInsurance || 0);
  const totalPension = (input.existingPension || 0) + (input.proposedPension || 0);

  const deductionAfter = calcInsuranceDeduction(totalLife, totalHealth, totalPension);

  const netTaxableIncomeBefore = Math.max(0, annualIncome - standardExpenses - personalAllowance - deductionBefore);
  const netTaxableIncomeAfter = Math.max(0, annualIncome - standardExpenses - personalAllowance - deductionAfter);

  const resultBefore = calculateProgressiveTax(netTaxableIncomeBefore);
  const resultAfter = calculateProgressiveTax(netTaxableIncomeAfter);

  const taxSaved = Math.max(0, resultBefore.totalTax - resultAfter.totalTax);

  return {
    annualIncome,
    standardExpenseDeduction: Math.round(standardExpenses),
    personalDeduction: personalAllowance,
    totalInsuranceDeductionsBefore: Math.round(deductionBefore),
    totalInsuranceDeductionsAfter: Math.round(deductionAfter),
    netTaxableIncomeBefore: Math.round(netTaxableIncomeBefore),
    netTaxableIncomeAfter: Math.round(netTaxableIncomeAfter),
    totalTaxBefore: resultBefore.totalTax,
    totalTaxAfter: resultAfter.totalTax,
    taxSaved,
    marginalTaxRate: resultBefore.marginalRate,
    bracketsBreakdown: resultAfter.brackets,
  };
}
