import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import * as db from '../db.js';

dotenv.config();

const router = express.Router();

router.get('/login', async (req, res) => {
  try {
    const expiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const response = await axios.post(
      `${process.env.UNIPILE_DSN}/api/v1/hosted/accounts/link`,
      {
        type: 'create',
        providers: ['GOOGLE', 'OUTLOOK'],
        api_url: process.env.UNIPILE_DSN,
        expiresOn,
        success_redirect_url: `http://157.230.14.2:3001/auth/success`,  // Backend sets cookie, then redirects to frontend
        failure_redirect_url: `${process.env.FRONTEND_URL}/login`,
      },
      {
        headers: {
          'X-API-KEY': process.env.UNIPILE_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const { url } = response.data;
    if (!url) {
      return res.status(400).json({ error: 'No auth URL from Unipile' });
    }

    res.redirect(url);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

router.get('/success', async (req, res) => {
  const sessions = req.sessions;
  const { account_id, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
  }

  if (!account_id) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_account`);
  }

  try {
    // Get user info from Unipile
    const accountResponse = await axios.get(
      `${process.env.UNIPILE_DSN}/api/v1/accounts/${account_id}`,
      {
        headers: {
          'X-API-KEY': process.env.UNIPILE_API_KEY,
        },
      }
    );
    
    const accountData = accountResponse.data;
    const email = accountData.email || account_id;
    const provider = accountData.provider_name?.toLowerCase() || 'unknown';
    
    // Store/upsert user in database
    const userId = await db.upsertUser(
      account_id,
      email,
      provider,
      accountData.access_token || '',
      accountData.refresh_token || ''
    );
    
    // Create session with both userId (database) and accountId (Unipile)
    const userSessionId = Math.random().toString(36).substring(7);
    sessions[userSessionId] = {
      userId,
      unipileAccountId: account_id,  // Keep Unipile account_id for API calls
      email,
      created: Date.now(),
    };
    
    res.cookie('session', userSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('[Auth] Success callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

router.get('/user', (req, res) => {
  const sessions = req.sessions;
  const sessionId = req.cookies.session;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = sessions[sessionId];
  res.json({
    id: session.accountId,
    email: session.email,
  });
});

router.post('/logout', (req, res) => {
  const sessions = req.sessions;
  const sessionId = req.cookies.session;
  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }
  res.clearCookie('session', {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
});

export default router;
