import { pool } from '../config/db.js';

export interface ProductFilter {
  categorySlug?: string;
  minAge?: number;
  maxBudget?: number;
  isTaxDeductible?: boolean;
  search?: string;
}

export async function getCategories() {
  const [rows] = await pool.query(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `);
  return rows;
}

export async function getProducts(filter: ProductFilter = {}) {
  let query = `
    SELECT 
      p.id, p.code, p.title, p.slug, p.summary, p.highlight_points,
      p.min_entry_age, p.max_entry_age, p.min_premium,
      p.premium_payment_term, p.coverage_term, p.is_tax_deductible,
      p.max_tax_deduction, p.is_featured, p.rating,
      c.name_th as category_name, c.slug as category_slug,
      comp.name as company_name, comp.code as company_code, comp.logo_url as company_logo
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN companies comp ON p.company_id = comp.id
    WHERE p.is_active = TRUE
  `;

  const params: any[] = [];

  if (filter.categorySlug) {
    query += ' AND c.slug = ?';
    params.push(filter.categorySlug);
  }

  if (filter.minAge !== undefined) {
    query += ' AND p.min_entry_age <= ? AND p.max_entry_age >= ?';
    params.push(filter.minAge, filter.minAge);
  }

  if (filter.maxBudget !== undefined) {
    query += ' AND p.min_premium <= ?';
    params.push(filter.maxBudget);
  }

  if (filter.isTaxDeductible !== undefined) {
    query += ' AND p.is_tax_deductible = ?';
    params.push(filter.isTaxDeductible ? 1 : 0);
  }

  if (filter.search) {
    query += ' AND (p.title LIKE ? OR p.summary LIKE ? OR comp.name LIKE ?)';
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY p.is_featured DESC, p.rating DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

export async function getProductBySlug(slug: string) {
  const [products]: any = await pool.query(`
    SELECT 
      p.*,
      c.name_th as category_name, c.slug as category_slug,
      comp.name as company_name, comp.code as company_code, comp.logo_url as company_logo, comp.contact_phone as company_phone
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN companies comp ON p.company_id = comp.id
    WHERE p.slug = ? AND p.is_active = TRUE
    LIMIT 1
  `, [slug]);

  if (products.length === 0) {
    return null;
  }

  const product = products[0];

  // Fetch plans
  const [plans] = await pool.query(`
    SELECT * FROM product_plans WHERE product_id = ? ORDER BY id ASC
  `, [product.id]);

  // Fetch benefits
  const [benefits] = await pool.query(`
    SELECT * FROM product_benefits WHERE product_id = ? ORDER BY sort_order ASC
  `, [product.id]);

  return {
    ...product,
    plans,
    benefits,
  };
}

export async function compareProducts(productIds: number[]) {
  if (!productIds || productIds.length === 0) return [];

  const placeholders = productIds.map(() => '?').join(',');
  const [products]: any = await pool.query(`
    SELECT 
      p.*,
      c.name_th as category_name,
      comp.name as company_name, comp.logo_url as company_logo
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN companies comp ON p.company_id = comp.id
    WHERE p.id IN (${placeholders})
  `, productIds);

  const [plans]: any = await pool.query(`
    SELECT * FROM product_plans WHERE product_id IN (${placeholders})
  `, productIds);

  const [benefits]: any = await pool.query(`
    SELECT * FROM product_benefits WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC
  `, productIds);

  return products.map((p: any) => ({
    ...p,
    plans: plans.filter((plan: any) => plan.product_id === p.id),
    benefits: benefits.filter((b: any) => b.product_id === p.id),
  }));
}

export async function matchQuizRecommendations(quizAnswers: {
  goal: 'HEALTH' | 'RETIREMENT' | 'SAVINGS' | 'TAX_SAVING' | 'FAMILY_PROTECTION';
  age: number;
  monthlyBudget: number;
  hasExistingHealthInsurance: boolean;
}) {
  const annualBudget = quizAnswers.monthlyBudget * 12;

  let targetCategorySlug = 'health-insurance';
  if (quizAnswers.goal === 'HEALTH') targetCategorySlug = 'health-insurance';
  else if (quizAnswers.goal === 'RETIREMENT') targetCategorySlug = 'annuity-pension';
  else if (quizAnswers.goal === 'SAVINGS') targetCategorySlug = 'savings-insurance';
  else if (quizAnswers.goal === 'TAX_SAVING') targetCategorySlug = 'tax-saving-funds';
  else if (quizAnswers.goal === 'FAMILY_PROTECTION') targetCategorySlug = 'life-protection';

  const products = await getProducts({
    categorySlug: targetCategorySlug,
    minAge: quizAnswers.age,
    maxBudget: annualBudget > 0 ? annualBudget : undefined,
  });

  // If no direct matches in budget, fallback to all products in that category
  if ((products as any[]).length === 0) {
    return await getProducts({ categorySlug: targetCategorySlug });
  }

  return products;
}
