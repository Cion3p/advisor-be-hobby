import { Router } from 'express';
import * as productController from '../../controllers/product.controller.js';
import * as calculatorController from '../../controllers/calculator.controller.js';
import * as leadController from '../../controllers/lead.controller.js';
import * as articleController from '../../controllers/article.controller.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financial-advisory-api', timestamp: new Date().toISOString() });
});

// Categories & Products
router.get('/categories', productController.listCategories);
router.get('/products', productController.listProducts);
router.get('/products/:slug', productController.getProductDetail);
router.post('/products/compare', productController.compareProducts);
router.post('/recommendations/quiz', productController.quizRecommend);
router.post('/admin/products', productController.createProduct);
router.put('/admin/products/:id', productController.updateProduct);
router.delete('/admin/products/:id', productController.deleteProduct);

// Financial Calculators
router.post('/calculators/tax-deduction', calculatorController.calculateTax);
router.post('/calculators/life-value', calculatorController.calculateLifeValue);

// Leads & Consultations
router.post('/leads', leadController.submitLead);
router.get('/leads', leadController.listLeads);
router.patch('/leads/:id/status', leadController.updateLeadStatus);
router.get('/admin/stats', leadController.getDashboardStats);

// Articles & SEO Blog
router.get('/articles', articleController.listArticles);
router.get('/articles/:slug', articleController.getArticleBySlug);

export default router;
