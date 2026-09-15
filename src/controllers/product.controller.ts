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
    const { category, minAge, maxBudget, isTaxDeductible, search } = req.query;

    const filter: productService.ProductFilter = {
      categorySlug: category as string,
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
