import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authenticate } from '../middleware/auth.js';
import { triggerUserEvent } from '../utils/realtime.js';

const router = express.Router();

const paymentsEnabled = () =>
  process.env.PAYMENTS_ENABLED === 'true' &&
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET;

const getRazorpayClient = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

router.post('/razorpay/order', authenticate, async (req, res) => {
  try {
    if (!paymentsEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Payments are not enabled.',
      });
    }

    const { amount, currency = 'INR', receipt, notes, planId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required.',
      });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${req.userId}_${Date.now()}`,
      notes: {
        userId: req.userId.toString(),
        planId: planId || 'unknown',
        ...notes,
      },
    });

    res.json({
      success: true,
      data: {
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order.',
    });
  }
});

router.post('/razorpay/verify', authenticate, async (req, res) => {
  try {
    if (!paymentsEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Payments are not enabled.',
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification payload is incomplete.',
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature.',
      });
    }

    await triggerUserEvent(req.userId, 'payment.verified', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      data: { verified: true },
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment.',
    });
  }
});

router.post('/razorpay/webhook', async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(503).json({
        success: false,
        error: 'Webhook secret not configured.',
      });
    }

    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.rawBody || '')
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature.',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook.',
    });
  }
});

export default router;
