import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import authRoutes from './routes/auth.js';
import * as db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = '/root/offlo-uploads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory session storage (auth state)
const sessions = {};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://157.230.14.2:3000', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// File upload middleware (save to disk)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
});

// Pass sessions to auth routes
app.use((req, res, next) => {
  req.sessions = sessions;
  next();
});

// TEST MODE: Create test session for internal testing (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.post('/test/create-session', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    const sessionId = 'test_' + Math.random().toString(36).substring(7);
    sessions[sessionId] = {
      userId,
      unipileAccountId: 'test_unipile_' + userId,
      email: 'tester@offlo.dev',
      created: Date.now(),
    };
    
    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    res.json({ sessionId, userId });
  });
}

// Auth Routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get user
app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint - TBD' });
});

// Get audit log
app.get('/api/audit', async (req, res) => {
  const sessionId = req.cookies.session;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userId = sessions[sessionId].userId;
  try {
    const auditLog = await db.getUserAuditLog(userId, 100);
    res.json({ auditLog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Get drafts
app.get('/api/drafts', async (req, res) => {
  const sessionId = req.cookies.session;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userId = sessions[sessionId].userId;
  try {
    const userDrafts = await db.getUserDrafts(userId);
    res.json({ drafts: userDrafts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Create draft (with file attachments)
app.post('/api/drafts', upload.array('attachments', 5), async (req, res) => {
  try {
    const sessionId = req.cookies.session;
    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { to, subject, context } = req.body;
    if (!to || !subject || !context) {
      return res.status(400).json({ error: 'Missing to, subject, or context' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address', email: to });
    }

    const userId = sessions[sessionId].userId;

    // Call OpenAI to draft
    console.log('[Draft] Generating draft for', to, 'subject:', subject);
    const draftText = await generateDraft(to, subject, context);

    // Calculate carbon emissions
    const carbonEmissions = calculateCarbon(draftText);
    console.log('[Carbon] Emissions calculated:', carbonEmissions);

    // Handle attachments first (save to disk)
    const attachments = (req.files || []).map(file => ({
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      filePath: file.path,  // Full path on disk
    }));
    
    console.log('[Upload] Saved', attachments.length, 'files to disk');

    // Store draft in database with attachments
    const draftId = 'draft_' + Date.now();
    await db.saveDraft(draftId, userId, to, subject, context, draftText, carbonEmissions, attachments);
    
    // Log audit event
    await db.logAuditEvent(userId, 'draft_created', draftId, {
      to,
      subject,
      context: context.substring(0, 100),
      attachmentCount: attachments.length,
    });

    // Create transparency badge
    const badge = {
      model: 'gpt-4-turbo',
      timestamp: new Date().toISOString(),
      disclosure: '[This email was AI-drafted with GPT-4. Please review before sending.]',
    };

    const draft = {
      id: draftId,
      accountId: userId,
      to,
      subject,
      context,
      draftText,
      status: 'pending_approval',
      biasFlags: [],
      biasScore: null,
      carbonEmissions,
      attachments,
      badge,
      created: new Date().toISOString(),
    };

    res.json(draft);
  } catch (error) {
    console.error('Draft error:', error.message);
    res.status(500).json({ error: 'Failed to create draft', details: error.message });
  }
});

// Approve & send draft (with file attachments)
app.post('/api/drafts/:id/approve', upload.array('attachments', 5), async (req, res) => {
  try {
    const sessionId = req.cookies.session;
    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const draftId = req.params.id;
    const userId = sessions[sessionId].userId;
    const draft = await db.getDraft(draftId);
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    if (draft.user_id !== userId) {
      return res.status(403).json({ error: 'Not your draft' });
    }
    
    // Check for bias before sending (unless overridden)
    const override = req.query.override === 'true';
    if (!override) {
      console.log('[Bias] Checking draft before send...');
      const biasCheck = await checkBias(draft.draftText);
      draft.biasFlags = biasCheck.flags;
      draft.biasScore = biasCheck.score;
      
      // If high bias score, return warning but allow override
      if (biasCheck.score > 5) {
        console.log('[Bias] High bias score detected:', biasCheck.score);
        return res.status(400).json({
          error: 'High bias detected',
          biasScore: biasCheck.score,
          biasFlags: biasCheck.flags,
          draft,
        });
      }
    } else {
      console.log('[Bias] Bias check skipped - user override');
    }
    
    // Send email via Unipile (POST /api/v1/emails)
    console.log('[Approve] Sending draft:', draftId, 'to:', draft.to, 'from:', userId);
    
    // Use Unipile account_id for email sending, not database userId
    const unipileAccountId = sessions[sessionId].unipileAccountId;
    const emailPayload = {
      account_id: unipileAccountId,
      subject: draft.subject,
      body: draft.draft_text,
      to: [
        {
          display_name: draft.to.split('@')[0],
          identifier: draft.to,
        },
      ],
    };
    
    // Use FormData for multipart upload (required by Unipile for attachments)
    const filesToDelete = [];
    const formData = new FormData();
    formData.append('account_id', unipileAccountId);
    formData.append('subject', draft.subject);
    formData.append('body', draft.draft_text);
    formData.append('to', JSON.stringify([{
      display_name: draft.to.split('@')[0],
      identifier: draft.to,
    }]));
    
    // Attach files from disk
    try {
      const draftAttachments = draft.attachments || [];
      console.log('[Approve] Draft attachments:', JSON.stringify(draftAttachments));
      
      for (const att of draftAttachments) {
        try {
          console.log('[Approve] Reading file:', att.filePath);
          const fileBuffer = fs.readFileSync(att.filePath);
          formData.append('attachments', fileBuffer, att.filename);
          filesToDelete.push(att.filePath);
          console.log('[Approve] Attached file to form:', att.filename);
        } catch (err) {
          console.error('[Approve] File read error:', att.filePath, err.message);
        }
      }
      console.log('[Approve] Total attachments in form:', draftAttachments.length);
    } catch (err) {
      console.warn('[Approve] Attachment processing failed:', err.message);
    }
    
    // Use axios for proper multipart/form-data handling
    let emailData;
    try {
      const response = await axios.post(
        `${process.env.UNIPILE_DSN}/api/v1/emails`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-API-KEY': process.env.UNIPILE_API_KEY,
          },
        }
      );
      emailData = response.data;
    } catch (err) {
      console.error('[Approve] Email send failed:', err.response?.status, err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to send email', details: err.response?.data || err.message });
    }
    
    const messageId = emailData.id || emailData.provider_id;
    const biasScore = draft.bias_score || null;
    const biasFlags = draft.bias_flags || [];
    
    // Update draft in database
    await db.updateDraftStatus(draftId, 'sent', biasScore, biasFlags, messageId);
    
    // Log audit event
    await db.logAuditEvent(userId, 'email_sent', draftId, {
      to: draft.to,
      subject: draft.subject,
      messageId,
      biasScore,
    });
    
    // Update carbon stats
    const carbonStats = await db.updateCarbonStats(userId);
    
    console.log('[Approve] Email sent successfully:', messageId);
    
    // Clean up files from disk
    filesToDelete.forEach(filePath => {
      try {
        fs.unlinkSync(filePath);
        console.log('[Cleanup] Deleted', filePath);
      } catch (err) {
        console.error('[Cleanup] Failed to delete', filePath, err.message);
      }
    });
    
    const sentDraft = {
      id: draftId,
      accountId: userId,
      to: draft.to,
      subject: draft.subject,
      context: draft.context,
      draftText: draft.draft_text,
      status: 'sent',
      biasScore,
      biasFlags,
      carbonEmissions: {
        total: draft.carbon_total,
        inference: draft.carbon_inference,
        transmission: draft.carbon_transmission,
        device: draft.carbon_device,
        offset: draft.carbon_offset,
      },
      messageId,
      sentAt: new Date().toISOString(),
    };
    res.json({ status: 'sent', draft: sentDraft });
  } catch (error) {
    console.error('Approve error:', error.message);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});



// Generate draft via OpenAI
async function generateDraft(to, subject, context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {  // TODO: Switch to Claude
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional email writer. Write clear, concise, friendly emails. Always start with: [This email was AI-drafted]',
        },
        {
          role: 'user',
          content: `Draft an email to ${to} with subject "${subject}". Context: ${context}. Keep it under 150 words.`,
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error.message}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Calculate carbon emissions for email
function calculateCarbon(emailText, tokenCount = null) {
  // Emissions model (grams CO2e per email)
  // Based on:
  // - GPT-4 inference: ~0.4g CO2e per 1k tokens (estimate)
  // - Email transmission: ~0.006g per email (data center + network)
  // - User device: ~0.01g per email
  
  const draftTokens = tokenCount || Math.ceil(emailText.length / 4); // rough estimate
  const inferenceEmissions = (draftTokens / 1000) * 0.4; // g CO2e
  const transmissionEmissions = 0.006; // g CO2e
  const deviceEmissions = 0.01; // g CO2e
  
  const totalEmissions = inferenceEmissions + transmissionEmissions + deviceEmissions;
  const offsetAmount = totalEmissions * 2; // 2x offset model
  
  return {
    inference: parseFloat(inferenceEmissions.toFixed(4)),
    transmission: parseFloat(transmissionEmissions.toFixed(4)),
    device: parseFloat(deviceEmissions.toFixed(4)),
    total: parseFloat(totalEmissions.toFixed(4)),
    offset: parseFloat(offsetAmount.toFixed(4)),
    offsetMultiplier: 2,
  };
}

// Check for biased/offensive language via OpenAI
async function checkBias(emailText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[Bias] OPENAI_API_KEY not set, skipping bias check');
    return { flags: [], score: 0 };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: `Analyze this email for biased, discriminatory, or offensive language. Flag specific phrases or patterns that are problematic. Be thorough but not overly sensitive.

Email text:
${emailText}

Respond in JSON format:
{
  "flags": ["issue1", "issue2"],
  "score": 0-10 (0=no bias, 10=extremely offensive),
  "summary": "brief explanation"
}`,
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('[Bias] OpenAI API error:', response.status);
      return { flags: [], score: 0 };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      console.log('[Bias] Scan complete - Score:', parsed.score, 'Flags:', parsed.flags.length);
      return { flags: parsed.flags || [], score: parsed.score || 0 };
    } catch (parseError) {
      // If JSON parse fails, assume no bias (OpenAI response wasn't JSON)
      console.warn('[Bias] Response not JSON, assuming clean:', content.substring(0, 50));
      return { flags: [], score: 0 };
    }
  } catch (error) {
    console.error('[Bias] Check failed:', error.message);
    return { flags: [], score: 0 };
  }
}

// Error handling
app.use((err, req, res, next) => {
  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'File exceeds 10MB limit',
      limit_mb: 10,
      message: 'Please upload a smaller file'
    });
  }
  
  // Handle other multer errors
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({ 
      error: 'Too many files',
      limit: 5,
      message: 'Maximum 5 files allowed'
    });
  }
  
  // Log and return generic error
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
db.initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Offlo API running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
