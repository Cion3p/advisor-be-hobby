export interface LifeValueInput {
  monthlyFamilyExpense: number;  // ค่าใช้จ่ายครอบครัวต่อเดือน
  supportYears: number;          // จำนวนปีที่ต้องดูแล (เช่น จนลูกเรียนจบ หรือ 5-10 ปี)
  outstandingDebts: number;      // หนี้สินคงค้างทั้งหมด (บ้าน, รถ, บัตรเครดิต)
  childrenEducationFund: number; // ทุนการศึกษาบุตรในอนาคต
  funeralAndEmergency: number;   // ค่าจัดการงานศพและเงินสำรองฉุกเฉิน
  existingAssets: number;        // ทรัพย์สินสภาพคล่องที่มีอยู่แล้ว (เงินฝาก, กองทุน)
  existingLifeCoverage: number;  // ทุนประกันชีวิตเดิมที่มีอยู่แล้ว
}

export interface LifeValueOutput {
  totalFamilyNeeds: number;       // ค่าใช้จ่ายครอบครัวตลอดระยะเวลาที่ต้องดูแล
  totalDebts: number;             // หนี้สินรวม
  totalEducationAndEmergency: number; // ทุนการศึกษาและเงินสำรอง
  grossRequiredCapital: number;   // ทุนประกันรวมขั้นต้น
  totalExistingProtection: number; // ทรัพย์สินและประกันเดิม
  netRecommendedSumAssured: number; // ทุนประกันที่ควรทำเพิ่ม
  estimatedAnnualPremium: {
    termInsurance: number;        // เบี้ยประกันแบบชั่วระยะเวลา (ประหยัดสุด)
    wholeLifeInsurance: number;   // เบี้ยประกันแบบตลอดชีพ
  };
}

export function computeLifeValue(input: LifeValueInput): LifeValueOutput {
  const annualExpense = Math.max(0, input.monthlyFamilyExpense) * 12;
  const supportYears = Math.max(1, input.supportYears);
  const totalFamilyNeeds = annualExpense * supportYears;

  const totalDebts = Math.max(0, input.outstandingDebts);
  const totalEducationAndEmergency = Math.max(0, input.childrenEducationFund) + Math.max(0, input.funeralAndEmergency);

  const grossRequiredCapital = totalFamilyNeeds + totalDebts + totalEducationAndEmergency;

  const totalExistingProtection = Math.max(0, input.existingAssets) + Math.max(0, input.existingLifeCoverage);

  const netRecommendedSumAssured = Math.max(0, grossRequiredCapital - totalExistingProtection);

  // ประมาณการเบี้ยประกันต่อปี (เฉลี่ยตามทุนประกัน 1 ล้านบาท)
  // แบบ Term: ประมาณ 3,000 - 5,000 บาท ต่อทุน 1 ล้าน
  // แบบ Whole Life: ประมาณ 18,000 - 25,000 บาท ต่อทุน 1 ล้าน
  const millionUnits = netRecommendedSumAssured / 1000000;
  const termInsurance = Math.round(millionUnits * 4000);
  const wholeLifeInsurance = Math.round(millionUnits * 22000);

  return {
    totalFamilyNeeds: Math.round(totalFamilyNeeds),
    totalDebts: Math.round(totalDebts),
    totalEducationAndEmergency: Math.round(totalEducationAndEmergency),
    grossRequiredCapital: Math.round(grossRequiredCapital),
    totalExistingProtection: Math.round(totalExistingProtection),
    netRecommendedSumAssured: Math.round(netRecommendedSumAssured),
    estimatedAnnualPremium: {
      termInsurance,
      wholeLifeInsurance,
    },
  };
}
