import { pool, initDatabase } from '../config/db.js';

export async function seedData() {
  console.log('🌱 Starting database seeding...');
  await initDatabase();

  try {
    // Check if data exists
    const [existingCategories]: any = await pool.query('SELECT COUNT(*) as count FROM categories');
    if (existingCategories[0].count > 0) {
      console.log('ℹ️ Database already contains data. Skipping seed.');
      return;
    }

    // 1. Seed Companies
    await pool.query(`
      INSERT INTO companies (id, name, code, logo_url, contact_phone) VALUES
      (1, 'เอไอเอ ประเทศไทย (AIA)', 'AIA', '/images/companies/aia.png', '1581'),
      (2, 'เมืองไทยประกันชีวิต (Muang Thai Life)', 'MTL', '/images/companies/mtl.png', '1766'),
      (3, 'อลิอันซ์ อยุธยา (Allianz Ayudhya)', 'AZAY', '/images/companies/azay.png', '1373'),
      (4, 'กรุงไทย-แอกซ่า (Krungthai-AXA)', 'KTAXA', '/images/companies/ktaxa.png', '1159'),
      (5, 'เอฟดับบลิวดี ประกันชีวิต (FWD)', 'FWD', '/images/companies/fwd.png', '1351');
    `);

    // 2. Seed Categories
    await pool.query(`
      INSERT INTO categories (id, slug, name_th, name_en, category_type, description, icon, sort_order) VALUES
      (1, 'health-insurance', 'ประกันสุขภาพเหมาจ่าย', 'Health Insurance', 'INSURANCE', 'คุ้มครองค่ารักษาพยาบาล ค่าห้อง ผ่าตัด และโรคร้ายแรง ครอบคลุมทั้ง IPD และ OPD', 'HeartPulse', 1),
      (2, 'life-protection', 'ประกันชีวิตและมรดก', 'Life & Protection', 'INSURANCE', 'สร้างหลักประกันทางการเงินมั่นคงและส่งต่อมรดกให้คนที่คุณรักด้วยทุนประกันสูง', 'ShieldCheck', 2),
      (3, 'savings-insurance', 'ประกันสะสมทรัพย์', 'Endowment / Savings', 'INSURANCE', 'ออมเงินอย่างมีวินัย พร้อมความคุ้มครองชีวิตและการันตีเงินคืนสม่ำเสมอทุกปี', 'PiggyBank', 3),
      (4, 'annuity-pension', 'ประกันบำนาญ', 'Annuity / Pension', 'INSURANCE', 'วางแผนเพื่อวัยเกษียณ รับเงินบำนาญแน่นอนทุกปีจนถึงอายุ 85-99 ปี พร้อมสิทธิลดหย่อนภาษี', 'SunMedium', 4),
      (5, 'tax-saving-funds', 'ผลิตภัณฑ์ลดหย่อนภาษี & การลงทุน', 'Tax & Wealth', 'TAX', 'วางแผนภาษีส่งท้ายปีด้วยประกันชีวิต ประกันสุขภาพ และกองทุนรวม ThaiESG / RMF', 'ReceiptPercent', 5);
    `);

    // 3. Seed Products
    await pool.query(`
      INSERT INTO products (
        id, category_id, company_id, code, title, slug, summary, full_description, highlight_points,
        min_entry_age, max_entry_age, min_premium, premium_payment_term, coverage_term,
        is_tax_deductible, max_tax_deduction, is_featured, rating
      ) VALUES
      (
        1, 1, 2, 'MTL-ELITE-HEALTH',
        'เมืองไทย อีลิท เฮลท์ พลัส (Elite Health Plus)',
        'elite-health-plus-mtl',
        'ประกันสุขภาพเหมาจ่ายระดับพรีเมียม วงเงินคุ้มครองสูง 20 - 100 ล้านบาทต่อปี ครอบคลุมค่าห้องเดี่ยวมาตรฐาน และการรักษามะเร็งแบบ Targeted Therapy',
        'สัญญาเพิ่มเติมการประกันภัยสุขภาพแบบ อีลิท เฮลท์ พลัส คุ้มครองทั้งกรณีเจ็บป่วยจากโรคทั่วไป โรคร้ายแรง โรคระบาด และอุบัติเหตุ พร้อมดูแลสุขภาพตลอด 24 ชม. ทั่วโลกตามพื้นที่ความคุ้มครองที่เลือก',
        JSON_ARRAY('เหมาจ่ายค่ารักษาพยาบาล 20 - 100 ล้านบาท/ปี', 'คุ้มครองค่าห้องเดี่ยวมาตรฐานทุกโรงพยาบาล', 'ครอบคลุมการรักษามะเร็ง Targeted Therapy & Immunotherapy', 'ต่ออายุสัญญาได้ถึงอายุ 99 ปี'),
        11, 75, 24500.00, 'ชำระเบี้ยรายปี', 'คุ้มครองถึงอายุ 99 ปี',
        TRUE, 25000.00, TRUE, 4.9
      ),
      (
        2, 1, 1, 'AIA-HEALTH-HAPPY',
        'เอไอเอ เฮลท์ แฮปปี้ (AIA Health Happy)',
        'aia-health-happy',
        'เหมาเบิ้ลคุ้มครองสูงสุด 4 เท่าเมื่อตรวจพบโรคร้ายแรง แผนเหมาจ่ายเข้าใจง่าย ไม่มีข้อจำกัดค่าห้องจุกจิก',
        'เอไอเอ เฮลท์ แฮปปี้ ให้คุณแฮปปี้กับความคุ้มครองแบบเหมาจ่ายค่ารักษาพยาบาล 1 - 25 ล้านบาทต่อรอบปีกรมธรรม์ เบิ้ลความคุ้มครองเป็น 2 เท่าต่อเนื่อง 4 ปีกรมธรรม์เมื่อตรวจพบ 3 กลุ่มโรคร้ายแรง',
        JSON_ARRAY('เหมาจ่ายค่ารักษาพยาบาล 1 - 25 ล้านบาท/ปี', 'เบิ้ลความคุ้มครอง 2 เท่าเมื่อตรวจพบโรคร้ายแรง รวมสูงสุด 4 ปีกรมธรรม์', 'ไม่จำกัดค่าห้อง (ตามค่าห้องเดี่ยวมาตรฐาน)', 'เบี้ยประกันสามารถนำไปลดหย่อนภาษีได้'),
        6, 75, 18200.00, 'ชำระเบี้ยรายปี', 'คุ้มครองถึงอายุ 99 ปี',
        TRUE, 25000.00, TRUE, 4.8
      ),
      (
        3, 3, 3, 'AZAY-MY-DOUBLE-PLUS',
        'อลิอันซ์ มาย ดับเบิล พลัส 10/5 (My Double Plus 10/5)',
        'allianz-my-double-plus-10-5',
        'ออมสั้นเพียง 5 ปี คุ้มครองนาน 10 ปี รับเงินจ่ายคืนประจำปีสูง พร้อมเงินก้อนคืนเมื่อครบกำหนดสัญญา',
        'แผนประกันสะสมทรัพย์ยอดนิยมสำหรับผู้ที่ต้องการออมเงินระยะสั้น เพื่อเป้าหมายระยะกลาง ได้ผลตอบแทนแน่นอน ชัดเจน ไม่ผันผวนตามตลาดหุ้น',
        JSON_ARRAY('จ่ายเบี้ยสั้นเพียง 5 ปี คุ้มครองยาว 10 ปี', 'รับเงินคืนทุกปี ปีละ 8% ของทุนประกันภัย', 'ครบกำหนดสัญญารับเงินก้อนใหญ่ 500% ของทุนประกัน', 'ลดหย่อนภาษีได้สูงสุด 100,000 บาท/ปี'),
        1, 65, 30000.00, '5 ปี', '10 ปี',
        TRUE, 100000.00, TRUE, 4.7
      ),
      (
        4, 4, 4, 'KTAXA-RETIRE-READY',
        'กรุงไทย-แอกซ่า รีไทร์ เรดดี้ 85/55 (Retire Ready)',
        'ktaxa-retire-ready-pension',
        'วางแผนเกษียณแบบสบายใจ รับเงินบำนาญทุกปีตั้งแต่อายุ 55 ถึง 85 ปี การันตีเงินคืนรวมสูงสุดกว่า 600%',
        'ประกันชีวิตแบบบำนาญที่ช่วยให้คุณมีรายได้ต่อเนื่องหลังเกษียณ สร้างคุณภาพชีวิตที่มั่นคง ไร้กังวลเรื่องเงินหมดก่อนวัยอันควร พร้อมสิทธิลดหย่อนภาษีกลุ่มบำนาญสูงสุด 200,000 บาท',
        JSON_ARRAY('รับเงินบำนาญสม่ำเสมอ 15% ของทุนประกัน ทุกปีตั้งแต่อายุ 55 - 85 ปี', 'การันตีจ่ายเงินบำนาญขั้นต่ำ 15 ปี', 'สิทธิลดหย่อนภาษีส่วนบำนาญสูงสุด 200,000 บาท', 'ไม่ต้องตรวจและตอบคำถามสุขภาพสำหรับบางแผน'),
        20, 50, 35000.00, 'ถึงอายุ 55 หรือ 60 ปี', 'คุ้มครองถึงอายุ 85 ปี',
        TRUE, 200000.00, FALSE, 4.8
      );
    `);

    // 4. Seed Product Plans & Benefits
    await pool.query(`
      INSERT INTO product_plans (id, product_id, plan_name, base_sum_assured, base_premium_male, base_premium_female, details) VALUES
      (1, 1, 'แผน 20 ล้านบาท', 20000000.00, 24500.00, 26800.00, JSON_OBJECT('room_type', 'ห้องเดี่ยวมาตรฐาน', 'opd_coverage', 'ตามวงเงินเหมาจ่ายกรณีต่อเนื่อง', 'deductible', 'ไม่มีความรับผิดส่วนแรก')),
      (2, 1, 'แผน 50 ล้านบาท', 50000000.00, 38200.00, 42100.00, JSON_OBJECT('room_type', 'ห้องเดี่ยวมาตรฐาน หรือ 10,000 บาท/วัน', 'opd_coverage', 'เหมาจ่าย OPD 50,000 บาท/ปี', 'deductible', 'ไม่มีความรับผิดส่วนแรก')),
      (3, 2, 'แผน 5 ล้านบาท', 5000000.00, 18200.00, 20500.00, JSON_OBJECT('room_type', 'ห้องเดี่ยวมาตรฐาน', 'double_critical_illness', 'เพิ่มวงเงินเป็น 10 ล้านบาท เมื่อเป็นโรคร้าย')),
      (4, 3, 'แผนทุนประกัน 100,000', 100000.00, 30000.00, 30000.00, JSON_OBJECT('annual_cashback', '8,000 บาท/ปี', 'maturity_payout', '500,000 บาท'));
    `);

    await pool.query(`
      INSERT INTO product_benefits (product_id, benefit_category, benefit_title, coverage_amount_desc, sort_order) VALUES
      (1, 'IPD_OPD', 'ค่ารักษาพยาบาลกรณีผู้ป่วยใน (IPD)', 'เหมาจ่ายตามจริงสูงสุด 20 - 100 ล้านบาท/ปี', 1),
      (1, 'IPD_OPD', 'ค่าห้อง ค่าอาหาร ค่าบริการพยาบาล', 'ห้องเดี่ยวมาตรฐาน ไม่จำกัดจำนวนวัน', 2),
      (1, 'CRITICAL_ILLNESS', 'การรักษามะเร็งแบบพุ่งเป้า (Targeted Therapy)', 'เหมาจ่ายตามจริงในวงเงินผลประโยชน์', 3),
      (2, 'IPD_OPD', 'ค่ารักษาพยาบาลเหมาจ่ายต่อรอบปีกรมธรรม์', 'สูงสุด 5 - 25 ล้านบาท', 1),
      (2, 'CRITICAL_ILLNESS', 'ผลประโยชน์เพิ่มเป็น 2 เท่าสำหรับโรคร้ายแรง', 'รวมสูงสุด 4 ปีกรมธรรม์', 2),
      (3, 'SAVINGS_RETURN', 'เงินจ่ายคืนประจำปีกรมธรรม์', 'ปีละ 8% ของจำนวนเงินเอาประกันภัย', 1),
      (3, 'SAVINGS_RETURN', 'เงินครบกำหนดสัญญา ณ สิ้นปีกรมธรรม์ที่ 10', '500% ของจำนวนเงินเอาประกันภัย', 2),
      (4, 'TAX_SAVING', 'สิทธิลดหย่อนภาษีเงินได้บุคคลธรรมดา', 'สูงสุด 200,000 บาท ตามเกณฑ์กรมสรรพากร', 1);
    `);

    // 5. Seed Articles for SEO
    await pool.query(`
      INSERT INTO articles (category_id, author_name, author_license, title, slug, excerpt, content, reading_time_minutes) VALUES
      (
        1,
        'กิตติศักดิ์ โภคทรัพย์ (CFP®, ที่ปรึกษาการเงิน)',
        'ใบอนุญาต คปภ. เลขที่ 6401029384',
        'วิธีเลือกประกันสุขภาพเหมาจ่าย 2567 ฉบับเข้าใจง่าย ไม่โดนเท ไม่จ่ายเบี้ยทิ้ง',
        'how-to-choose-health-insurance-2026',
        'เจาะลึก 5 จุดเช็กพอยต์สำคัญก่อนตัดสินใจซื้อประกันสุขภาพเหมาจ่าย ทั้งเงื่อนไขค่าห้อง การรักษา OPD และข้อควรระวังเรื่องระยะเวลารอคอย (Waiting Period)',
        '# วิธีเลือกประกันสุขภาพเหมาจ่าย 2567\n\nการมีประกันสุขภาพเหมาจ่ายกลายเป็นสิ่งจำเป็นในยุคที่ค่ารักษาพยาบาลและค่าห้องพยาบาลปรับตัวสูงขึ้นทุกปี บทความนี้จะสรุปหัวใจสำคัญ 5 ข้อที่ต้องรู้ก่อนทำประกันสุขภาพ...',
        6
      ),
      (
        5,
        'วราภรณ์ วงศ์สวัสดิ์ (ที่ปรึกษาภาษีและประกันชีวิต)',
        'ใบอนุญาต คปภ. เลขที่ 6202081726',
        'สรุปสิทธิลดหย่อนภาษีกลุ่มประกันและกองทุน ลดหย่อนได้สูงสุดเท่าไหร่ ปี 2567',
        'tax-deduction-insurance-summary-2026',
        'คู่มือวางแผนลดหย่อนภาษีส่งท้ายปีด้วยประกันชีวิต 100,000 แรก ประกันสุขภาพ 25,000 ประกันบำนาญ 200,000 และกองทุน ThaiESG รวมลดหย่อนได้สูงสุดหลักแสนบาท',
        '# สรุปสิทธิลดหย่อนภาษีกลุ่มประกันและกองทุน\n\nหลายคนมักสับสนว่าประกันแต่ละประเภทนำมาลดหย่อนภาษีซ้อนกันได้หรือไม่ ในความเป็นจริง กรมสรรพากรได้แบ่งโควตาลดหย่อนภาษีไว้อย่างชัดเจน...',
        7
      );
    `);

    console.log('✅ Database seeded successfully with realistic products and articles!');
  } catch (error) {
    console.error('❌ Error during seeding:', (error as Error).message);
  }
}

// Auto-run if script is executed directly
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  seedData().then(() => {
    pool.end();
  });
}
