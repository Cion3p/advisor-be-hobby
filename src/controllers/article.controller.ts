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

export async function createArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, slug, excerpt, content, author_name, author_license, cover_image_url, reading_time_minutes, category_id } = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO articles (category_id, author_name, author_license, title, slug, excerpt, content, cover_image_url, reading_time_minutes, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        category_id || 1,
        author_name || 'คุณชนุดม รัตนรักษ์ (CFP®)',
        author_license || '',
        title,
        slug || title.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-'),
        excerpt || '',
        content || '',
        cover_image_url || '',
        reading_time_minutes || 5,
      ]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Article created successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, author_name, author_license, cover_image_url, reading_time_minutes, category_id } = req.body;
    await pool.query(
      `UPDATE articles SET
         category_id = COALESCE(?, category_id),
         author_name = COALESCE(?, author_name),
         author_license = COALESCE(?, author_license),
         title = COALESCE(?, title),
         slug = COALESCE(?, slug),
         excerpt = COALESCE(?, excerpt),
         content = COALESCE(?, content),
         cover_image_url = COALESCE(?, cover_image_url),
         reading_time_minutes = COALESCE(?, reading_time_minutes)
       WHERE id = ?`,
      [category_id, author_name, author_license, title, slug, excerpt, content, cover_image_url, reading_time_minutes, id]
    );
    res.json({ success: true, message: 'Article updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM articles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
}
