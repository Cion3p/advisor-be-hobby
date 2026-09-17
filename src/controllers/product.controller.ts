import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service.js';

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, minAge, maxBudget, isTaxDeductible, search, company } = req.query;

    const filter: productService.ProductFilter = {
      categorySlug: category as string,
      company: company as string,
      minAge: minAge ? parseInt(minAge as string, 10) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget as string) : undefined,
      isTaxDeductible: isTaxDeductible !== undefined ? isTaxDeductible === 'true' : undefined,
      search: search as string,
    };

    const products = await productService.getProducts(filter);
    res.json({ success: true, count: (products as any[]).length, data: products });
  } catch (error) {
    next(error);
  }
}

export async function getProductDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผลิตภัณฑ์ประกันที่ต้องการ' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function compareProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสผลิตภัณฑ์ที่ต้องการเปรียบเทียบอย่างน้อย 1 รายการ' });
    }

    const comparison = await productService.compareProducts(ids.map(Number));
    res.json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
}

export async function quizRecommend(req: Request, res: Response, next: NextFunction) {
  try {
    const { goal, age, monthlyBudget, hasExistingHealthInsurance } = req.body;

    if (!goal || age === undefined) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเป้าหมายทางการเงินและอายุของคุณ' });
    }

    const recommendations = await productService.matchQuizRecommendations({
      goal,
      age: Number(age),
      monthlyBudget: Number(monthlyBudget || 0),
      hasExistingHealthInsurance: Boolean(hasExistingHealthInsurance),
    });

    res.json({ success: true, count: (recommendations as any[]).length, data: recommendations });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      categoryId,
      companyId,
      code,
      title,
      slug,
      summary,
      fullDescription,
      highlightPoints,
      minEntryAge,
      maxEntryAge,
      minPremium,
      premiumPaymentTerm,
      coverageTerm,
      isTaxDeductible,
      maxTaxDeduction,
      isFeatured,
    } = req.body;

    if (!title || !minPremium || !code) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลผลิตภัณฑ์ที่จำเป็นให้ครบถ้วน' });
    }

    const newProduct = await productService.createProduct({
      categoryId: Number(categoryId || 1),
      companyId: Number(companyId || 1),
      code,
      title,
      slug: slug || code.toLowerCase().replace(/\s+/g, '-'),
      summary: summary || title,
      fullDescription,
      highlightPoints,
      minEntryAge: Number(minEntryAge || 0),
      maxEntryAge: Number(maxEntryAge || 70),
      minPremium: Number(minPremium),
      premiumPaymentTerm: premiumPaymentTerm || 'ชำระรายปี',
      coverageTerm: coverageTerm || 'ตลอดชีพ',
      isTaxDeductible: Boolean(isTaxDeductible),
      maxTaxDeduction: Number(maxTaxDeduction || 0),
      isFeatured: Boolean(isFeatured),
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.updateProduct(Number(id), req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(Number(id));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// CATEGORY CONTROLLERS
// ---------------------------------------------------------------------------
export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, nameTh, nameEn, categoryType, description, icon, sortOrder } = req.body;
    if (!slug || !nameTh) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อหมวดหมู่และรหัส slug ให้ครบถ้วน' });
    }
    const result = await productService.createCategory({
      slug,
      nameTh,
      nameEn: nameEn || nameTh,
      categoryType,
      description,
      icon,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.updateCategory(Number(id), req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.deleteCategory(Number(id));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// COMPANY CONTROLLERS
// ---------------------------------------------------------------------------
export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const companies = await productService.getCompanies();
    res.json({ success: true, count: (companies as any[]).length, data: companies });
  } catch (error) {
    next(error);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, logoUrl, contactPhone, isActive } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อบริษัทและรหัสย่อ (Code) ให้ครบถ้วน' });
    }
    const result = await productService.createCompany({
      name,
      code,
      logoUrl,
      contactPhone,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.updateCompany(Number(id), req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.deleteCompany(Number(id));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}


