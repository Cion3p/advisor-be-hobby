import { Router } from 'express';
import * as productController from '../../controllers/product.controller.js';
import * as calculatorController from '../../controllers/calculator.controller.js';
import * as leadController from '../../controllers/lead.controller.js';
import * as articleController from '../../controllers/article.controller.js';
import * as bannerController from '../../controllers/banner.controller.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'financial-advisory-api', timestamp: new Date().toISOString() });
});

// Categories & Products
router.get('/categories', productController.listCategories);
router.post('/admin/categories', productController.createCategory);
router.put('/admin/categories/:id', productController.updateCategory);
router.delete('/admin/categories/:id', productController.deleteCategory);

router.get('/companies', productController.listCompanies);
router.post('/admin/companies', productController.createCompany);
router.put('/admin/companies/:id', productController.updateCompany);
router.delete('/admin/companies/:id', productController.deleteCompany);

router.get('/products', productController.listProducts);
router.get('/products/:slug', productController.getProductDetail);
router.post('/products/compare', productController.compareProducts);
router.post('/recommendations/quiz', productController.quizRecommend);
router.post('/admin/products', productController.createProduct);
router.put('/admin/products/:id', productController.updateProduct);
router.delete('/admin/products/:id', productController.deleteProduct);

// Financial Calculators
router.post('/calculators/tax-deduction', calculatorController.calculateTax);
router.post('/calculators/tax', calculatorController.calculateTax);
router.post('/calculators/life-value', calculatorController.calculateLifeValue);

// Leads & Consultations
router.post('/leads', leadController.submitLead);
router.get('/leads', leadController.listLeads);
router.patch('/leads/:id/status', leadController.updateLeadStatus);
router.delete('/leads/:id', leadController.deleteLead);
router.delete('/admin/leads/:id', leadController.deleteLead);
router.get('/admin/stats', leadController.getDashboardStats);


// Articles & SEO Blog
router.get('/articles', articleController.listArticles);
router.get('/articles/:slug', articleController.getArticleBySlug);
router.post('/admin/articles', articleController.createArticle);
router.put('/admin/articles/:id', articleController.updateArticle);
router.delete('/admin/articles/:id', articleController.deleteArticle);

// Hero Slides & Announcements
router.get('/hero-slides', bannerController.listHeroSlides);
router.post('/admin/hero-slides', bannerController.createHeroSlide);
router.put('/admin/hero-slides/:id', bannerController.updateHeroSlide);
router.delete('/admin/hero-slides/:id', bannerController.deleteHeroSlide);

router.get('/announcements', bannerController.getAnnouncement);
router.put('/admin/announcements', bannerController.updateAnnouncement);

export default router;
