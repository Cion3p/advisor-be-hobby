import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';

// --- Hero Slides ---
export async function listHeroSlides(req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC');
    const parsed = rows.map((s: any) => ({
      ...s,
      tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags || [],
      is_active: Boolean(s.is_active),
    }));
    res.json({ success: true, data: parsed });
  } catch (error) {
    next(error);
  }
}

export async function createHeroSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;
    const [result]: any = await pool.query(
      `INSERT INTO hero_slides (
        badge_text, badge_icon, title, title_highlight, subtitle, tags,
        primary_btn_label, primary_btn_href, secondary_btn_label, secondary_btn_href,
        card_badge, card_main_title, card_main_metric, card_main_metric_sub,
        stat1_label, stat1_value, stat1_desc, stat2_label, stat2_value, stat2_desc,
        card_footer_note, background_image, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.badge_text || '',
        body.badge_icon || 'Shield',
        body.title || '',
        body.title_highlight || '',
        body.subtitle || '',
        JSON.stringify(body.tags || []),
        body.primary_btn_label || '',
        body.primary_btn_href || '',
        body.secondary_btn_label || '',
        body.secondary_btn_href || '',
        body.card_badge || '',
        body.card_main_title || '',
        body.card_main_metric || '',
        body.card_main_metric_sub || '',
        body.stat1_label || '',
        body.stat1_value || '',
        body.stat1_desc || '',
        body.stat2_label || '',
        body.stat2_value || '',
        body.stat2_desc || '',
        body.card_footer_note || '',
        body.background_image || '',
        body.is_active ?? true,
        body.sort_order || 1,
      ]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Hero slide created successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateHeroSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body = req.body;
    await pool.query(
      `UPDATE hero_slides SET
        badge_text = ?, badge_icon = ?, title = ?, title_highlight = ?, subtitle = ?, tags = ?,
        primary_btn_label = ?, primary_btn_href = ?, secondary_btn_label = ?, secondary_btn_href = ?,
        card_badge = ?, card_main_title = ?, card_main_metric = ?, card_main_metric_sub = ?,
        stat1_label = ?, stat1_value = ?, stat1_desc = ?, stat2_label = ?, stat2_value = ?, stat2_desc = ?,
        card_footer_note = ?, background_image = ?, is_active = ?, sort_order = ?
      WHERE id = ?`,
      [
        body.badge_text || '',
        body.badge_icon || 'Shield',
        body.title || '',
        body.title_highlight || '',
        body.subtitle || '',
        JSON.stringify(body.tags || []),
        body.primary_btn_label || '',
        body.primary_btn_href || '',
        body.secondary_btn_label || '',
        body.secondary_btn_href || '',
        body.card_badge || '',
        body.card_main_title || '',
        body.card_main_metric || '',
        body.card_main_metric_sub || '',
        body.stat1_label || '',
        body.stat1_value || '',
        body.stat1_desc || '',
        body.stat2_label || '',
        body.stat2_value || '',
        body.stat2_desc || '',
        body.card_footer_note || '',
        body.background_image || '',
        body.is_active ?? true,
        body.sort_order || 1,
        id,
      ]
    );
    res.json({ success: true, message: 'Hero slide updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteHeroSlide(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM hero_slides WHERE id = ?', [id]);
    res.json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// --- Announcements ---
export async function getAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await pool.query('SELECT * FROM announcements ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    const a = rows[0];
    res.json({
      success: true,
      data: {
        ...a,
        is_active: Boolean(a.is_active),
        show_countdown: Boolean(a.show_countdown),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;
    const [existing]: any = await pool.query('SELECT id FROM announcements LIMIT 1');
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO announcements (
          badge_text, title, subtitle, image_url,
          primary_btn_label, primary_btn_href, secondary_btn_label, secondary_btn_href,
          show_countdown, countdown_end_date, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.badge_text || '',
          body.title || '',
          body.subtitle || '',
          body.image_url || '',
          body.primary_btn_label || '',
          body.primary_btn_href || '',
          body.secondary_btn_label || '',
          body.secondary_btn_href || '',
          Boolean(body.show_countdown),
          body.countdown_end_date || '',
          body.is_active ?? true,
        ]
      );
    } else {
      await pool.query(
        `UPDATE announcements SET
          badge_text = ?, title = ?, subtitle = ?, image_url = ?,
          primary_btn_label = ?, primary_btn_href = ?, secondary_btn_label = ?, secondary_btn_href = ?,
          show_countdown = ?, countdown_end_date = ?, is_active = ?
        WHERE id = ?`,
        [
          body.badge_text || '',
          body.title || '',
          body.subtitle || '',
          body.image_url || '',
          body.primary_btn_label || '',
          body.primary_btn_href || '',
          body.secondary_btn_label || '',
          body.secondary_btn_href || '',
          Boolean(body.show_countdown),
          body.countdown_end_date || '',
          body.is_active ?? true,
          existing[0].id,
        ]
      );
    }
    res.json({ success: true, message: 'Announcement updated successfully' });
  } catch (error) {
    next(error);
  }
}
