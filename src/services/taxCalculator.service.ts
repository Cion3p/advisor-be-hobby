export interface OtherDeductionsInput {
  socialSecurity?: number;        // ประกันสังคม: สูงสุด 9,000 บาท
  spouseAllowance?: boolean;      // คู่สมรสไม่มีเงินได้: 60,000 บาท
  childrenCount?: number;         // จำนวนบุตร (คนละ 30,000 บาท)
  parentsCount?: number;          // จำนวนบิดา-มารดาที่ดูแล (คนละ 30,000 บาท สูงสุด 4 คน)
  disabledCareCount?: number;     // จำนวนผู้พิการ/ทุพพลภาพที่ดูแล (คนละ 60,000 บาท)
  mortgageInterest?: number;      // ดอกเบี้ยเงินกู้ยืมเพื่อซื้อที่อยู่อาศัย: สูงสุด 100,000 บาท
  thaiEsg?: number;               // กองทุน ThaiESG: สูงสุด 30% ของเงินได้ แต่ไม่เกิน 300,000 บาท
  rmfPvdSsf?: number;             // กองทุน RMF / PVD / กบข. / SSF: ไม่เกิน 30% และรวมเกษียณไม่เกิน 500,000
  easyEReceipt?: number;          // ค่าซื้อสินค้า Easy E-Receipt (สูงสุด 50,000 บาท)
  educationDonation?: number;     // เงินบริจาคเพื่อการศึกษา/รพ. (ลดหย่อนได้ 2 เท่า)
  generalDonation?: number;       // เงินบริจาคทั่วไป
}

export interface OtherDeductionsBreakdown {
  socialSecurity: number;
  spouse: number;
  children: number;
  parents: number;
  disabledCare: number;
  totalFamily: number;
  mortgageInterest: number;
  thaiEsg: number;
  rmfPvdSsf: number;
  totalInvestments: number;
  easyEReceipt: number;
  donations: number;
  total: number;
}

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
  otherDeductions?: OtherDeductionsInput; // สิทธิลดหย่อนอื่นๆ เพิ่มเติม (optional)
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
  totalOtherDeductions: number;
  otherDeductionsBreakdown?: OtherDeductionsBreakdown;
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
    return {
      combinedTotal: combinedGeneralLife + validPension,
      validPension,
      validGeneralLife: combinedGeneralLife,
    };
  };

  const insBefore = calcInsuranceDeduction(
    input.existingLifeInsurance || 0,
    input.existingHealthInsurance || 0,
    input.existingPension || 0
  );

  const totalLife = (input.existingLifeInsurance || 0) + (input.proposedLifeInsurance || 0);
  const totalHealth = (input.existingHealthInsurance || 0) + (input.proposedHealthInsurance || 0);
  const totalPension = (input.existingPension || 0) + (input.proposedPension || 0);

  const insAfter = calcInsuranceDeduction(totalLife, totalHealth, totalPension);

  // คำนวณค่าลดหย่อนอื่นๆ เพิ่มเติม (ถ้ามี)
  const other = input.otherDeductions;
  let totalOtherBefore = 0;
  let totalOtherAfter = 0;
  let breakdown: OtherDeductionsBreakdown | undefined = undefined;

  if (other) {
    const socialSecurity = Math.min(Math.max(0, other.socialSecurity || 0), 9000);
    const spouse = other.spouseAllowance ? 60000 : 0;
    const children = Math.max(0, other.childrenCount || 0) * 30000;
    const parents = Math.min(4, Math.max(0, other.parentsCount || 0)) * 30000;
    const disabledCare = Math.max(0, other.disabledCareCount || 0) * 60000;
    const totalFamily = spouse + children + parents + disabledCare;
    const mortgageInterest = Math.min(Math.max(0, other.mortgageInterest || 0), 100000);

    // กองทุน ThaiESG (สูงสุด 30% ไม่เกิน 300,000)
    const thaiEsg = Math.min(Math.max(0, other.thaiEsg || 0), Math.min(annualIncome * 0.30, 300000));

    // กลุ่มเกษียณ (RMF + PVD + กบข. + SSF + บำนาญ รวมกันไม่เกิน 500,000)
    const rawRmf = Math.min(Math.max(0, other.rmfPvdSsf || 0), annualIncome * 0.30);
    const rmfPvdBefore = Math.min(rawRmf, Math.max(0, 500000 - insBefore.validPension));
    const rmfPvdAfter = Math.min(rawRmf, Math.max(0, 500000 - insAfter.validPension));

    const easyEReceipt = Math.min(Math.max(0, other.easyEReceipt || 0), 50000);

    const nonDonationOtherBefore = socialSecurity + totalFamily + mortgageInterest + thaiEsg + rmfPvdBefore + easyEReceipt;
    const nonDonationOtherAfter = socialSecurity + totalFamily + mortgageInterest + thaiEsg + rmfPvdAfter + easyEReceipt;

    // คำนวณเงินบริจาค (สูงสุดไม่เกิน 10% ของเงินได้สุทธิก่อนหักบริจาค)
    const rawEdu = Math.max(0, other.educationDonation || 0) * 2;
    const rawGen = Math.max(0, other.generalDonation || 0);

    const remBefore = Math.max(0, annualIncome - standardExpenses - personalAllowance - insBefore.combinedTotal - nonDonationOtherBefore);
    const donationCapBefore = remBefore * 0.10;
    const donationsBefore = Math.min(rawEdu + rawGen, donationCapBefore);

    const remAfter = Math.max(0, annualIncome - standardExpenses - personalAllowance - insAfter.combinedTotal - nonDonationOtherAfter);
    const donationCapAfter = remAfter * 0.10;
    const donationsAfter = Math.min(rawEdu + rawGen, donationCapAfter);

    totalOtherBefore = nonDonationOtherBefore + donationsBefore;
    totalOtherAfter = nonDonationOtherAfter + donationsAfter;

    breakdown = {
      socialSecurity,
      spouse,
      children,
      parents,
      disabledCare,
      totalFamily,
      mortgageInterest,
      thaiEsg,
      rmfPvdSsf: rmfPvdAfter,
      totalInvestments: thaiEsg + rmfPvdAfter,
      easyEReceipt,
      donations: donationsAfter,
      total: totalOtherAfter,
    };
  }

  const deductionBefore = insBefore.combinedTotal;
  const deductionAfter = insAfter.combinedTotal;

  const netTaxableIncomeBefore = Math.max(0, annualIncome - standardExpenses - personalAllowance - deductionBefore - totalOtherBefore);
  const netTaxableIncomeAfter = Math.max(0, annualIncome - standardExpenses - personalAllowance - deductionAfter - totalOtherAfter);

  const resultBefore = calculateProgressiveTax(netTaxableIncomeBefore);
  const resultAfter = calculateProgressiveTax(netTaxableIncomeAfter);

  const taxSaved = Math.max(0, resultBefore.totalTax - resultAfter.totalTax);

  return {
    annualIncome,
    standardExpenseDeduction: Math.round(standardExpenses),
    personalDeduction: personalAllowance,
    totalOtherDeductions: Math.round(totalOtherAfter),
    otherDeductionsBreakdown: breakdown,
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
