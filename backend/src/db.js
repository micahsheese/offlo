import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Initialize database tables
export async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        oauth_id TEXT UNIQUE NOT NULL,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create drafts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "to" TEXT NOT NULL,
        subject TEXT NOT NULL,
        context TEXT NOT NULL,
        draft_text TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        bias_score FLOAT,
        bias_flags TEXT[],
        carbon_total FLOAT,
        carbon_inference FLOAT,
        carbon_transmission FLOAT,
        carbon_device FLOAT,
        carbon_offset FLOAT,
        attachments JSONB,
        message_id TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add attachments column if it doesn't exist (migration)
    try {
      await client.query(`
        ALTER TABLE drafts ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb
      `);
    } catch (err) {
      // Column likely already exists
    }

    // Create audit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        draft_id TEXT REFERENCES drafts(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create carbon_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS carbon_stats (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_emissions FLOAT DEFAULT 0,
        total_offset FLOAT DEFAULT 0,
        emails_sent INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[DB] Tables initialized');
  } catch (error) {
    console.error('[DB] Initialization error:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// User functions
export async function upsertUser(oauthId, email, provider, accessToken, refreshToken) {
  const userId = `user_${oauthId}`;
  try {
    await pool.query(`
      INSERT INTO users (id, oauth_id, email, provider, access_token, refresh_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (oauth_id) DO UPDATE SET
        access_token = $5,
        refresh_token = $6,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, oauthId, email, provider, accessToken, refreshToken]);
    return userId;
  } catch (error) {
    console.error('[DB] User upsert error:', error.message);
    throw error;
  }
}

// Draft functions
export async function saveDraft(draftId, userId, to, subject, context, draftText, carbonEmissions, attachments = []) {
  try {
    console.log('[DB] Saving draft with', attachments.length, 'attachments');
    await pool.query(`
      INSERT INTO drafts (
        id, user_id, "to", subject, context, draft_text, status,
        carbon_total, carbon_inference, carbon_transmission, carbon_device, carbon_offset,
        attachments
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      draftId,
      userId,
      to,
      subject,
      context,
      draftText,
      'draft',
      carbonEmissions.total,
      carbonEmissions.inference,
      carbonEmissions.transmission,
      carbonEmissions.device,
      carbonEmissions.offset,
      JSON.stringify(attachments),  // Explicitly stringify for JSONB
    ]);
    console.log('[DB] Draft saved with attachments:', attachments);
    return draftId;
  } catch (error) {
    console.error('[DB] Draft save error:', error.message);
    throw error;
  }
}

export async function getDraft(draftId) {
  try {
    const result = await pool.query(
      'SELECT * FROM drafts WHERE id = $1',
      [draftId]
    );
    const row = result.rows[0];
    if (row) {
      // PostgreSQL JSONB returns parsed object/array
      if (typeof row.attachments === 'string') {
        row.attachments = JSON.parse(row.attachments);
      } else if (!Array.isArray(row.attachments)) {
        row.attachments = row.attachments ? Object.values(row.attachments) : [];
      }
    }
    return row || null;
  } catch (error) {
    console.error('[DB] Draft get error:', error.message);
    return null;
  }
}

export async function getUserDrafts(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM drafts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      accountId: row.user_id,
      to: row.to,
      subject: row.subject,
      context: row.context,
      draftText: row.draft_text,
      status: row.status,
      biasScore: row.bias_score,
      biasFlags: row.bias_flags || [],
      carbonEmissions: {
        total: row.carbon_total,
        inference: row.carbon_inference,
        transmission: row.carbon_transmission,
        device: row.carbon_device,
        offset: row.carbon_offset,
      },
      messageId: row.message_id,
      sentAt: row.sent_at,
      created: row.created_at,
    }));
  } catch (error) {
    console.error('[DB] Get user drafts error:', error.message);
    return [];
  }
}

export async function updateDraftStatus(draftId, status, biasScore, biasFlags, messageId) {
  try {
    await pool.query(`
      UPDATE drafts
      SET status = $2, bias_score = $3, bias_flags = $4, message_id = $5, 
          sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [draftId, status, biasScore, biasFlags || [], messageId]);
  } catch (error) {
    console.error('[DB] Draft update error:', error.message);
    throw error;
  }
}

export async function getCarbonStats(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM carbon_stats WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB] Carbon stats get error:', error.message);
    return null;
  }
}

export async function updateCarbonStats(userId) {
  try {
    const drafts = await pool.query(`
      SELECT carbon_total, carbon_offset FROM drafts
      WHERE user_id = $1 AND status = 'sent'
    `, [userId]);

    const totalEmissions = drafts.rows.reduce((sum, row) => sum + (row.carbon_total || 0), 0);
    const totalOffset = drafts.rows.reduce((sum, row) => sum + (row.carbon_offset || 0), 0);
    const emailsSent = drafts.rows.length;

    await pool.query(`
      INSERT INTO carbon_stats (id, user_id, total_emissions, total_offset, emails_sent, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        total_emissions = $3,
        total_offset = $4,
        emails_sent = $5,
        updated_at = CURRENT_TIMESTAMP
    `, [`carbon_${userId}`, userId, totalEmissions, totalOffset, emailsSent]);

    return {
      totalEmissions,
      totalOffset,
      emailsSent,
    };
  } catch (error) {
    console.error('[DB] Carbon stats update error:', error.message);
    throw error;
  }
}

// Audit log functions
export async function logAuditEvent(userId, action, draftId, details) {
  try {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await pool.query(`
      INSERT INTO audit_logs (id, user_id, draft_id, action, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [logId, userId, draftId || null, action, details ? JSON.stringify(details) : null]);
    console.log(`[Audit] Event logged: ${action} by ${userId}`);
  } catch (error) {
    console.error('[DB] Audit log error:', error.message);
  }
}

export async function getUserAuditLog(userId, limit = 50) {
  try {
    const result = await pool.query(`
      SELECT id, action, draft_id, details, created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);
    return result.rows.map(row => ({
      id: row.id,
      action: row.action,
      draftId: row.draft_id,
      details: row.details ? JSON.parse(row.details) : null,
      timestamp: row.created_at,
    }));
  } catch (error) {
    console.error('[DB] Get audit log error:', error.message);
    return [];
  }
}

export default pool;
