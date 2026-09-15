import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';

export async function listArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const [articles] = await pool.query(`
      SELECT 
        a.id, a.title, a.slug, a.excerpt, a.author_name, a.author_license,
        a.cover_image_url, a.reading_time_minutes, a.published_at,
        c.name_th as category_name, c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.is_published = TRUE
      ORDER BY a.published_at DESC
    `);

    res.json({ success: true, data: articles });
  } catch (error) {
    next(error);
  }
}

export async function getArticleBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const [articles]: any = await pool.query(`
      SELECT 
        a.*,
        c.name_th as category_name, c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.slug = ? AND a.is_published = TRUE
      LIMIT 1
    `, [slug]);

    if (articles.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบบทความที่ต้องการ' });
    }

    res.json({ success: true, data: articles[0] });
  } catch (error) {
    next(error);
  }
}
