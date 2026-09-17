import { pool } from '../config/db.js';

export interface CreateLeadDto {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  interestedProductId?: number;
  preferredContactTime?: string;
  province?: string;
  ageRange?: string;
  budgetRange?: string;
  userNotes?: string;
  pdpaConsent: boolean;
}

export async function createLead(dto: CreateLeadDto) {
  if (!dto.pdpaConsent) {
    throw new Error('กรุณากดยินยอมข้อตกลงและนโยบายความเป็นส่วนตัว (PDPA Consent) เพื่อรับคำปรึกษา');
  }

  // Find available agent with least leads
  const [availableAgents]: any = await pool.query(`
    SELECT id FROM agents WHERE is_available = TRUE ORDER BY assigned_leads_count ASC LIMIT 1
  `);

  const assignedAgentId = availableAgents.length > 0 ? availableAgents[0].id : null;

  const [result]: any = await pool.query(`
    INSERT INTO leads (
      customer_name, customer_phone, customer_email, interested_product_id,
      assigned_agent_id, preferred_contact_time, province, age_range,
      budget_range, user_notes, pdpa_consent, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
  `, [
    dto.customerName,
    dto.customerPhone,
    dto.customerEmail || null,
    dto.interestedProductId || null,
    assignedAgentId,
    dto.preferredContactTime || 'สะดวกทุกเวลา',
    dto.province || null,
    dto.ageRange || null,
    dto.budgetRange || null,
    dto.userNotes || null,
    dto.pdpaConsent ? 1 : 0,
  ]);

  if (assignedAgentId) {
    await pool.query('UPDATE agents SET assigned_leads_count = assigned_leads_count + 1 WHERE id = ?', [assignedAgentId]);
  }

  return {
    leadId: result.insertId,
    status: 'NEW',
    assignedAgentId,
    message: 'ได้รับข้อมูลคำขอรับคำปรึกษาเรียบร้อยแล้ว ที่ปรึกษาจะติดต่อกลับตามเวลาที่ท่านสะดวก',
  };
}

export async function getLeads(status?: string) {
  let query = `
    SELECT 
      l.*,
      p.title as product_title, p.code as product_code,
      u.first_name as agent_first_name, u.last_name as agent_last_name, a.license_no as agent_license_no
    FROM leads l
    LEFT JOIN products p ON l.interested_product_id = p.id
    LEFT JOIN agents a ON l.assigned_agent_id = a.id
    LEFT JOIN users u ON a.user_id = u.id
  `;

  const params: any[] = [];
  if (status) {
    query += ' WHERE l.status = ?';
    params.push(status);
  }

  query += ' ORDER BY l.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

export async function updateLeadStatus(leadId: number, status: string, notes?: string) {
  await pool.query(
    'UPDATE leads SET status = ?, user_notes = COALESCE(?, user_notes) WHERE id = ?',
    [status, notes || null, leadId]
  );
  return { success: true, leadId, status };
}

export async function deleteLead(leadId: number) {
  await pool.query('DELETE FROM leads WHERE id = ?', [leadId]);
  return { success: true, leadId };
}


export async function getDashboardStats() {
  const [leadCounts]: any = await pool.query(`
    SELECT 
      COUNT(*) as total_leads,
      SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) as new_leads,
      SUM(CASE WHEN status = 'CONTACTED' THEN 1 ELSE 0 END) as contacted_leads,
      SUM(CASE WHEN status = 'CONSULTING' THEN 1 ELSE 0 END) as consulting_leads,
      SUM(CASE WHEN status = 'CLOSED_WON' THEN 1 ELSE 0 END) as closed_leads
    FROM leads
  `);

  const [productCount]: any = await pool.query('SELECT COUNT(*) as total_products FROM products WHERE is_active = TRUE');

  return {
    totalLeads: leadCounts[0]?.total_leads || 0,
    newLeads: leadCounts[0]?.new_leads || 0,
    contactedLeads: leadCounts[0]?.contacted_leads || 0,
    consultingLeads: leadCounts[0]?.consulting_leads || 0,
    closedLeads: leadCounts[0]?.closed_leads || 0,
    totalProducts: productCount[0]?.total_products || 0,
  };
}

