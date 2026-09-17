import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isAiven = Boolean(process.env.DB_HOST && (process.env.DB_HOST.includes('aivencloud.com') || process.env.DB_SSL === 'true'));

const dbConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'financial_advisory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: isAiven ? { rejectUnauthorized: false } : undefined,
};

// Main pool with database selected
export const pool = mysql.createPool(dbConfig);

// Initialize Database and Tables if they do not exist
export async function initDatabase(): Promise<boolean> {
  try {
    // 1. Connect without database to ensure database exists
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.end();

    // 2. Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        logo_url VARCHAR(500),
        contact_phone VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name_th VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        category_type ENUM('INSURANCE', 'INVESTMENT', 'TAX') NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        company_id INT NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        full_description LONGTEXT,
        highlight_points JSON,
        min_entry_age INT DEFAULT 0,
        max_entry_age INT DEFAULT 70,
        min_premium DECIMAL(12, 2) DEFAULT 0.00,
        premium_payment_term VARCHAR(100) NOT NULL,
        coverage_term VARCHAR(100) NOT NULL,
        is_tax_deductible BOOLEAN DEFAULT FALSE,
        max_tax_deduction DECIMAL(12, 2) DEFAULT 0.00,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        rating DECIMAL(3, 2) DEFAULT 4.8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_company (company_id),
        INDEX idx_slug (slug),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        plan_name VARCHAR(255) NOT NULL,
        base_sum_assured DECIMAL(14, 2) NOT NULL,
        base_premium_male DECIMAL(12, 2) NOT NULL,
        base_premium_female DECIMAL(12, 2) NOT NULL,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_plans_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_benefits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        benefit_category ENUM('DEATH_BENEFIT', 'ACCIDENT', 'CRITICAL_ILLNESS', 'IPD_OPD', 'SAVINGS_RETURN', 'TAX_SAVING') NOT NULL,
        benefit_title VARCHAR(255) NOT NULL,
        coverage_amount_desc VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        CONSTRAINT fk_benefits_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('USER', 'AGENT', 'ADMIN') DEFAULT 'USER',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        license_no VARCHAR(100) NOT NULL UNIQUE,
        license_type ENUM('LIFE', 'GENERAL', 'INVESTMENT') DEFAULT 'LIFE',
        specialized_areas VARCHAR(255),
        assigned_leads_count INT DEFAULT 0,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        interested_product_id INT NULL,
        assigned_agent_id INT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255),
        preferred_contact_time VARCHAR(100),
        province VARCHAR(100),
        age_range VARCHAR(50),
        budget_range VARCHAR(100),
        user_notes TEXT,
        pdpa_consent BOOLEAN NOT NULL DEFAULT TRUE,
        status ENUM('NEW', 'CONTACTED', 'CONSULTING', 'CLOSED_WON', 'CLOSED_LOST') DEFAULT 'NEW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_lead_status (status),
        CONSTRAINT fk_leads_product FOREIGN KEY (interested_product_id) REFERENCES products(id) ON DELETE SET NULL,
        CONSTRAINT fk_leads_agent FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        author_license VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        content LONGTEXT NOT NULL,
        cover_image_url LONGTEXT,
        reading_time_minutes INT DEFAULT 5,
        is_published BOOLEAN DEFAULT TRUE,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_articles_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge_text VARCHAR(255) NOT NULL,
        badge_icon VARCHAR(100) DEFAULT 'Shield',
        title VARCHAR(255) NOT NULL,
        title_highlight VARCHAR(255),
        subtitle TEXT NOT NULL,
        tags JSON,
        primary_btn_label VARCHAR(100) NOT NULL,
        primary_btn_href VARCHAR(255) NOT NULL,
        secondary_btn_label VARCHAR(100),
        secondary_btn_href VARCHAR(255),
        card_badge VARCHAR(100),
        card_main_title VARCHAR(255),
        card_main_metric VARCHAR(100),
        card_main_metric_sub VARCHAR(255),
        stat1_label VARCHAR(100),
        stat1_value VARCHAR(100),
        stat1_desc VARCHAR(255),
        stat2_label VARCHAR(100),
        stat2_value VARCHAR(100),
        stat2_desc VARCHAR(255),
        card_footer_note VARCHAR(255),
        background_image LONGTEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge_text VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        subtitle TEXT NOT NULL,
        image_url LONGTEXT,
        primary_btn_label VARCHAR(100) NOT NULL,
        primary_btn_href VARCHAR(255) NOT NULL,
        secondary_btn_label VARCHAR(100),
        secondary_btn_href VARCHAR(255),
        show_countdown BOOLEAN DEFAULT FALSE,
        countdown_end_date VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100),
        visitor_id VARCHAR(100),
        event_type VARCHAR(50) NOT NULL,
        page_path VARCHAR(255),
        page_title VARCHAR(255),
        referrer VARCHAR(500),
        device_type VARCHAR(50) DEFAULT 'desktop',
        browser VARCHAR(50),
        ip_address VARCHAR(45),
        consent_status VARCHAR(50) DEFAULT 'all',
        event_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_page_path (page_path),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB;
    `);

    // Ensure all columns exist for existing tables
    const extraColumns = [
      { name: 'session_id', type: 'VARCHAR(100)' },
      { name: 'visitor_id', type: 'VARCHAR(100)' },
      { name: 'page_path', type: 'VARCHAR(255)' },
      { name: 'page_title', type: 'VARCHAR(255)' },
      { name: 'referrer', type: 'VARCHAR(500)' },
      { name: 'device_type', type: "VARCHAR(50) DEFAULT 'desktop'" },
      { name: 'browser', type: 'VARCHAR(50)' },
      { name: 'ip_address', type: 'VARCHAR(45)' },
      { name: 'consent_status', type: "VARCHAR(50) DEFAULT 'all'" },
    ];

    for (const col of extraColumns) {
      try {
        await pool.query(`ALTER TABLE analytics_events ADD COLUMN ${col.name} ${col.type};`);
      } catch {
        // column already exists, safe to ignore
      }
    }

    console.log('✅ Database schema initialized successfully.');
    return true;
  } catch (error) {
    console.error('⚠️ Database connection/initialization error:', (error as Error).message);
    console.log('ℹ️ Server will continue running. Ensure MySQL is running on port ' + dbConfig.port);
    return false;
  }
}
