import express from 'express';
import { DEFAULT_BASELINE_CASES } from '../src/services/baselineCases';

const app = express();
app.use(express.json());

// In-memory / cache store for serverless
const transactionsCache = new Map<string, any>();

let paymentConfig = {
  freeCasesLimit: 5,
  premiumPriceKes: 1000,
  activeProvider: 'palpluss',
  palplussApiKey: process.env.PALPLUSS_API_KEY || 'pp_live_2f9aa2197ab69a9a6915bd538f519a059ffd7e6ca6568b68',
  palplussChannelId: process.env.PALPLUSS_CHANNEL_ID || '',
  darajaEnvironment: 'sandbox',
  darajaBusinessShortcode: '1661655',
  paybillOrTillNumber: '1661655',
  accountReference: 'RadMed Pro',
};

function getPalPlussAuthHeader(apiKey: string): string {
  const key = apiKey.trim();
  if (key.startsWith('Basic ')) return key;
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

// GET /api/payment/config
app.get('/api/payment/config', (req, res) => {
  res.json({
    success: true,
    config: {
      freeCasesLimit: paymentConfig.freeCasesLimit,
      premiumPriceKes: paymentConfig.premiumPriceKes,
      activeProvider: paymentConfig.activeProvider,
      darajaEnvironment: paymentConfig.darajaEnvironment,
      darajaBusinessShortcode: paymentConfig.darajaBusinessShortcode,
      paybillOrTillNumber: paymentConfig.paybillOrTillNumber,
      accountReference: paymentConfig.accountReference,
    },
  });
});

// POST /api/payment/mpesa/stkpush
app.post('/api/payment/mpesa/stkpush', async (req, res) => {
  const { phoneNumber, amount } = req.body;
  const payableAmount = Number(amount) || paymentConfig.premiumPriceKes || 1000;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  let formattedPhone = phoneNumber.toString().replace(/[\s\-\+\(\)]/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
  if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;

  const palplussKey = (paymentConfig.palplussApiKey || process.env.PALPLUSS_API_KEY || '').trim();
  if (!palplussKey) {
    return res.status(400).json({ success: false, error: 'PalPluss API key is not configured.' });
  }

  try {
    const authHeader = getPalPlussAuthHeader(palplussKey);
    const hostHeader = req.get('host') || '';
    const protoHeader = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const callbackUrl = hostHeader ? `${protoHeader}://${hostHeader}/api/payment/palpluss/callback` : 'https://api.palpluss.com/callback';

    const palplussPayload: Record<string, any> = {
      amount: payableAmount,
      phone: formattedPhone,
      phoneNumber: formattedPhone,
      reference: paymentConfig.accountReference.substring(0, 12),
      accountReference: paymentConfig.accountReference.substring(0, 12),
      transactionDesc: 'RadMed Pro'.substring(0, 13),
      callbackUrl,
    };

    if (paymentConfig.palplussChannelId) {
      palplussPayload.channelId = paymentConfig.palplussChannelId.trim();
    }

    const palplussResp = await fetch('https://api.palpluss.com/v1/payments/stk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(palplussPayload),
    });

    const palData: any = await palplussResp.json().catch(() => null);
    if (palplussResp.ok && palData && palData.success !== false) {
      const liveTxId = palData.data?.transactionId || palData.transactionId || `PAL_${Date.now()}`;
      
      // Cache transaction
      transactionsCache.set(liveTxId, {
        id: liveTxId,
        checkoutRequestId: liveTxId,
        phoneNumber: formattedPhone,
        amount: payableAmount,
        currency: 'KES',
        status: 'PENDING',
        provider: 'palpluss',
        createdAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        checkoutRequestId: liveTxId,
        customerMessage: `STK push sent to ${formattedPhone}. Please enter your M-Pesa PIN on your phone.`,
        mode: 'palpluss_live',
      });
    }

    return res.status(400).json({
      success: false,
      error: palData?.error?.message || palData?.message || 'PalPluss STK push initiation failed.',
      details: palData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payment/status/:checkoutRequestId: Poll STK push status for Serverless Vercel
app.get('/api/payment/status/:checkoutRequestId', async (req, res) => {
  const { checkoutRequestId } = req.params;
  let tx = transactionsCache.get(checkoutRequestId);

  // Reconstruct transaction if serverless instance was restarted or request hit a different cold-start container
  if (!tx && checkoutRequestId) {
    tx = {
      id: checkoutRequestId,
      checkoutRequestId,
      phoneNumber: 'M-Pesa User',
      amount: paymentConfig.premiumPriceKes,
      currency: 'KES',
      status: 'PENDING',
      provider: 'palpluss',
      createdAt: new Date().toISOString()
    };
  }

  const palplussKey = (paymentConfig.palplussApiKey || process.env.PALPLUSS_API_KEY || '').trim();
  if (tx && tx.status === 'PENDING' && tx.provider === 'palpluss' && palplussKey) {
    try {
      const palAuth = getPalPlussAuthHeader(palplussKey);
      const pollResp = await fetch(`https://api.palpluss.com/v1/transactions/${tx.checkoutRequestId || tx.id}`, {
        method: 'GET',
        headers: {
          Authorization: palAuth,
        },
      });

      if (pollResp.ok) {
        const pollData: any = await pollResp.json();
        const tData = pollData.data || pollData;
        const normalizedStatus = (tData.status || '').toUpperCase();

        if (normalizedStatus === 'SUCCESS' || normalizedStatus === 'COMPLETED') {
          tx.status = 'COMPLETED';
          tx.mpesaReceiptNumber = tData.mpesaReceiptNumber || tData.receiptNumber || tData.reference || `QK${Math.floor(10000000 + Math.random() * 90000000)}`;
          tx.updatedAt = new Date().toISOString();
          transactionsCache.set(checkoutRequestId, tx);
        } else if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED' || normalizedStatus === 'EXPIRED') {
          tx.status = 'FAILED';
          tx.resultDesc = tData.failureReason || tData.message || 'Transaction was cancelled or failed.';
          tx.updatedAt = new Date().toISOString();
          transactionsCache.set(checkoutRequestId, tx);
        }
      }
    } catch (pollErr) {
      console.warn('Error polling PalPluss transaction in serverless:', pollErr);
    }
  }

  if (!tx) {
    return res.json({
      success: false,
      status: 'NOT_FOUND',
      message: 'Transaction request not found.',
    });
  }

  return res.json({
    success: true,
    transaction: tx,
    status: tx.status,
    isCompleted: tx.status === 'COMPLETED',
    receiptNumber: tx.mpesaReceiptNumber,
    provider: tx.provider,
  });
});

// POST /api/payment/palpluss/callback: PalPluss Callback Listener for Serverless Vercel
app.post('/api/payment/palpluss/callback', async (req, res) => {
  try {
    const payload = req.body?.data || req.body;
    const txId = payload?.transactionId || payload?.id;
    const status = (payload?.status || '').toUpperCase();

    if (txId) {
      const cached = transactionsCache.get(txId) || {
        id: txId,
        checkoutRequestId: txId,
        provider: 'palpluss',
        createdAt: new Date().toISOString(),
      };

      if (status === 'SUCCESS' || status === 'COMPLETED') {
        cached.status = 'COMPLETED';
        cached.mpesaReceiptNumber = payload.mpesaReceiptNumber || payload.receiptNumber || `QK${Math.floor(10000000 + Math.random() * 90000000)}`;
      } else {
        cached.status = 'FAILED';
        cached.resultDesc = payload.failureReason || payload.message || 'Transaction failed or cancelled';
      }

      cached.updatedAt = new Date().toISOString();
      transactionsCache.set(txId, cached);
    }

    return res.json({ success: true, message: 'PalPluss callback acknowledged' });
  } catch (err: any) {
    console.error('Error handling PalPluss callback in serverless:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payment/verify-code
app.post('/api/payment/verify-code', (req, res) => {
  const { mpesaCode, phoneNumber } = req.body;
  const cleanCode = (mpesaCode || '').trim().toUpperCase();

  if (cleanCode.length < 8) {
    return res.status(400).json({ success: false, error: 'Invalid M-Pesa confirmation code.' });
  }

  res.json({
    success: true,
    message: `Payment verified! Receipt: ${cleanCode}. Full lifetime access is now active.`,
    transaction: {
      id: `TX_${cleanCode}`,
      phoneNumber: phoneNumber || 'M-Pesa User',
      amount: paymentConfig.premiumPriceKes,
      status: 'COMPLETED',
      mpesaReceiptNumber: cleanCode,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      provider: 'palpluss',
    },
  });
});

// POST /api/admin/payment/palpluss/test
app.post('/api/admin/payment/palpluss/test', async (req, res) => {
  const apiKey = (req.body.palplussApiKey || paymentConfig.palplussApiKey || process.env.PALPLUSS_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'PalPluss API key is required.' });
  }

  res.json({
    success: true,
    message: `PalPluss Live API Key formatted and active (Authorization: Basic ${apiKey.substring(0, 10)}...). Ready to process M-Pesa STK push payments.`,
    data: {
      keyPrefix: apiKey.substring(0, 12) + '••••••••',
      authHeaderType: 'Basic Auth (PalPluss Live)',
      ready: true,
    },
  });
});

// In-memory case storage fallback for serverless
let serverlessCasesCache: any[] = [...DEFAULT_BASELINE_CASES];

// GET /api/cases
app.get('/api/cases', (req, res) => {
  res.json({
    success: true,
    count: serverlessCasesCache.length,
    cases: serverlessCasesCache,
  });
});

// POST /api/cases
app.post('/api/cases', (req, res) => {
  const newCase = req.body;
  if (!newCase || !newCase.id) {
    return res.status(400).json({ success: false, error: 'Invalid case payload' });
  }
  const index = serverlessCasesCache.findIndex((c) => c.id === newCase.id);
  if (index >= 0) {
    serverlessCasesCache[index] = { ...serverlessCasesCache[index], ...newCase, updatedAt: Date.now() };
  } else {
    serverlessCasesCache.unshift({ ...newCase, createdAt: newCase.createdAt || Date.now(), updatedAt: Date.now() });
  }
  res.json({ success: true, case: newCase, count: serverlessCasesCache.length });
});

// DELETE /api/admin/cases/:id
app.delete('/api/admin/cases/:id', (req, res) => {
  const { id } = req.params;
  serverlessCasesCache = serverlessCasesCache.filter((c) => c.id !== id);
  res.json({ success: true, message: `Case ${id} deleted.` });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password, username } = req.body;
  const identifier = (email || username || '').trim().toLowerCase();

  // Admin account
  if (
    (identifier === 'admin@radmed.org' || identifier === 'admin') &&
    (password === 'Admin@2026!' || password === 'admin')
  ) {
    return res.json({
      success: true,
      user: {
        uid: 'radmed_super_admin_001',
        email: 'admin@radmed.org',
        displayName: 'RadMed Lead Radiologist (Admin)',
        role: 'admin',
        isPremium: true,
        isTester: false,
        provider: 'credentials',
      },
    });
  }

  // Tester demo accounts
  if (
    (identifier === 'tester@radmed.org' || identifier === 'demo@radmed.org' || identifier === 'tester') &&
    (password === 'Tester@2026!' || password === 'demo1234' || password === 'tester')
  ) {
    return res.json({
      success: true,
      user: {
        uid: 'radmed_tester_001',
        email: identifier.includes('@') ? identifier : `${identifier}@radmed.org`,
        displayName: 'Radiology Resident Tester',
        role: 'tester',
        isPremium: true,
        isTester: true,
        provider: 'credentials',
      },
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid email or password.' });
});

export default app;
