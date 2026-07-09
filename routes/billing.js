const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const Razorpay = require('razorpay');
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}
const PDFDocument = require('pdfkit');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

function loggedIn(req, res, next) {
  if (req.session && req.session.user_id) return next();
  return res.status(401).json({ status: 'error', message: 'Unauthorized' });
}

function adminOrSuperAdmin(req, res, next) {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'super_admin')) return next();
  req.flash('error', 'Access denied. Admin login required.');
  return res.redirect('/login');
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

// ── Dashboard ────────────────────────────────────────────────────────
router.get('/dashboard', loggedIn, async (req, res) => {
  const schoolCode = req.session.school_code;
  try {
    const schoolRes = await pool.query(
      'SELECT * FROM schools WHERE school_code = $1', [schoolCode]
    );
    const school = schoolRes.rows[0] || { activeplan: 'FREE', subscriptionstatus: 'active', expirydate: null };

    const invoicesRes = await pool.query(
      'SELECT * FROM invoices WHERE school_code = $1 ORDER BY created_at DESC', [schoolCode]
    );

    const subsRes = await pool.query(
      'SELECT * FROM subscriptions WHERE school_code = $1 ORDER BY start_date DESC LIMIT 1', [schoolCode]
    );

    res.json({
      status: 'success',
      subscription: {
        plan_name: school.activeplan || 'FREE',
        status: school.subscriptionstatus || 'active',
        expiry: school.expirydate || null,
      },
      invoices: invoicesRes.rows,
      current_subscription: subsRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Billing dashboard error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to load billing dashboard' });
  }
});

// ── Create Razorpay Order ──────────────────────────────────────────
router.post('/create-order', adminOrSuperAdmin, async (req, res) => {
  if (!razorpay) return res.status(503).json({ status: 'error', message: 'Razorpay not configured' });
  const { amount, currency } = req.body;
  if (!amount) return res.status(400).json({ status: 'error', message: 'Amount required' });

  try {
    const options = {
      amount: amount * 100,
      currency: currency || 'INR',
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ status: 'success', order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create order' });
  }
});

// ── Verify Razorpay Payment ────────────────────────────────────────
router.post('/verify-payment', adminOrSuperAdmin, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, billing_cycle, school_code } = req.body;
  const sc = school_code || req.session.school_code;

  try {
    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
    }

    const planId = plan_id || 'BASIC';
    const cycle = billing_cycle || 'monthly';
    const periodEnd = new Date();
    if (cycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subId = `sub_razor_${Date.now()}`;
    const payId = `pay_razor_${Date.now()}`;
    const invId = `inv_razor_${Date.now()}`;

    await pool.query(
      `INSERT INTO subscriptions (id, school_code, plan_id, status, start_date, current_period_end)
       VALUES ($1, $2, $3, 'active', $4, $5) ON CONFLICT (id) DO NOTHING`,
      [subId, sc, planId, nowStr(), periodEnd.toISOString()]
    );

    await pool.query(
      `INSERT INTO payments (id, invoice_id, gateway_txn_id, amount, method, status, created_at)
       VALUES ($1, $2, $3, $4, 'razorpay', 'completed', $5)`,
      [payId, invId, razorpay_payment_id, parseFloat(req.body.amount || 0), nowStr()]
    );

    await pool.query(
      `INSERT INTO invoices (id, school_code, amount, tax, total, status, due_date, created_at)
       VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7)`,
      [invId, sc, parseFloat(req.body.amount || 0), 0, parseFloat(req.body.amount || 0), formatDate(periodEnd), nowStr()]
    );

    await pool.query(
      `UPDATE schools SET activePlan = $1, subscriptionStatus = 'active', expiryDate = $2 WHERE school_code = $3`,
      [planId, periodEnd.toISOString(), sc]
    );

    res.json({ status: 'success', message: 'Payment verified and subscription activated!' });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to verify payment' });
  }
});

// ── Stripe Checkout Session ────────────────────────────────────────
router.post('/stripe-checkout', adminOrSuperAdmin, async (req, res) => {
  if (!stripe) return res.status(503).json({ status: 'error', message: 'Stripe not configured' });
  const { price_id, school_code } = req.body;
  const sc = school_code || req.session.school_code;

  if (!price_id) return res.status(400).json({ status: 'error', message: 'Price ID required' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      client_reference_id: sc,
      metadata: { school_code: sc },
      success_url: `${req.protocol}://${req.get('host')}/billing/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/billing/dashboard`,
    });

    res.json({ status: 'success', session_url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create checkout session' });
  }
});

// ── Stripe Webhook ─────────────────────────────────────────────────
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).send('Stripe not configured');
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const sc = session.metadata.school_code || session.client_reference_id;
        if (sc) {
          const subId = `sub_stripe_${session.subscription || session.id}`;
          const invId = `inv_stripe_${Date.now()}`;
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await pool.query(
            `INSERT INTO subscriptions (id, school_code, plan_id, status, start_date, current_period_end)
             VALUES ($1, $2, $3, 'active', $4, $5) ON CONFLICT (id) DO NOTHING`,
            [subId, sc, 'BASIC', nowStr(), periodEnd.toISOString()]
          );

          await pool.query(
            `INSERT INTO invoices (id, school_code, amount, tax, total, status, due_date, created_at)
             VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7)`,
            [invId, sc, session.amount_total / 100 || 0, 0, session.amount_total / 100 || 0, formatDate(periodEnd), nowStr()]
          );

          await pool.query(
            `UPDATE schools SET activePlan = 'BASIC', subscriptionStatus = 'active', expiryDate = $1 WHERE school_code = $2`,
            [periodEnd.toISOString(), sc]
          );
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log(`[Stripe] Invoice ${invoice.id} paid for ${invoice.subscription}`);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const sc = sub.metadata.school_code;
        if (sc && sub.status === 'canceled') {
          await pool.query(
            `UPDATE schools SET activePlan = 'FREE', subscriptionStatus = 'cancelled' WHERE school_code = $1`, [sc]
          );
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    res.status(500).send('Webhook handler failed');
  }
});

// ── Cancel Subscription ────────────────────────────────────────────
router.post('/cancel', adminOrSuperAdmin, async (req, res) => {
  const schoolCode = req.session.school_code;

  try {
    const subRes = await pool.query(
      'SELECT id, school_code FROM subscriptions WHERE school_code = $1 AND status = $2 ORDER BY start_date DESC LIMIT 1',
      [schoolCode, 'active']
    );

    if (subRes.rows.length > 0) {
      const sub = subRes.rows[0];
      if (sub.id && sub.id.startsWith('sub_stripe_') && stripe) {
        const stripeSubId = sub.id.replace('sub_stripe_', '');
        try {
          await stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true });
        } catch (stripeErr) {
          console.error('Stripe cancel error:', stripeErr.message);
        }
      }
      await pool.query(
        "UPDATE subscriptions SET status = 'cancelled' WHERE id = $1", [sub.id]
      );
    }

    await pool.query(
      "UPDATE schools SET activePlan = 'FREE', subscriptionStatus = 'cancelled', expiryDate = NULL WHERE school_code = $1",
      [schoolCode]
    );

    req.flash('success', 'Subscription cancelled. Downgraded to FREE plan.');
    res.redirect('/billing/dashboard');
  } catch (err) {
    console.error('Cancel subscription error:', err);
    req.flash('error', 'Failed to cancel subscription');
    res.redirect('/billing/dashboard');
  }
});

// ── Download Invoice PDF ────────────────────────────────────────────
router.get('/invoice/:id', loggedIn, async (req, res) => {
  const invoiceId = req.params.id;
  try {
    const invRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    if (invRes.rows.length === 0) return res.status(404).send('Invoice not found');

    const invoice = invRes.rows[0];
    const schoolRes = await pool.query('SELECT name FROM schools WHERE school_code = $1', [invoice.school_code]);
    const schoolName = schoolRes.rows[0] ? schoolRes.rows[0].name : invoice.school_code;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Invoice #: ${invoiceId}`, { align: 'center' })
      .text(`Date: ${invoice.created_at || invoice.due_date || ''}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.rect(50, doc.y, 500, 1).fill('#333');
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Bill To:');
    doc.font('Helvetica').fontSize(11).text(schoolName);
    doc.text(`School Code: ${invoice.school_code}`);
    doc.moveDown(1.5);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 20).fill('#f0f0f0');

    doc.fillColor('#000').fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 60, tableTop + 5, { width: 250 });
    doc.text('Amount', 310, tableTop + 5, { width: 100, align: 'right' });
    doc.text('Total', 430, tableTop + 5, { width: 100, align: 'right' });

    doc.rect(50, tableTop + 20, 500, 20).fill('#fff');
    doc.fillColor('#000').font('Helvetica').fontSize(10);
    doc.text('Subscription Plan', 60, tableTop + 25, { width: 250 });
    doc.text(`Rs. ${parseFloat(invoice.amount || 0).toFixed(2)}`, 310, tableTop + 25, { width: 100, align: 'right' });
    doc.text(`Rs. ${parseFloat(invoice.total || invoice.amount || 0).toFixed(2)}`, 430, tableTop + 25, { width: 100, align: 'right' });

    const totalY = tableTop + 50;
    if (parseFloat(invoice.tax || 0) > 0) {
      doc.rect(50, totalY, 500, 20).fill('#f9f9f9');
      doc.fillColor('#000').font('Helvetica').fontSize(10);
      doc.text('Tax (GST)', 60, totalY + 5, { width: 250 });
      doc.text(`Rs. ${parseFloat(invoice.tax).toFixed(2)}`, 310, totalY + 5, { width: 100, align: 'right' });
      doc.text(`Rs. ${parseFloat(invoice.tax).toFixed(2)}`, 430, totalY + 5, { width: 100, align: 'right' });
    }

    const finalY = totalY + (parseFloat(invoice.tax || 0) > 0 ? 25 : 0);
    doc.rect(50, finalY, 500, 25).fill('#333');
    doc.fillColor('#fff').fontSize(11).font('Helvetica-Bold');
    doc.text('Total Due', 60, finalY + 7, { width: 250 });
    doc.text(`Rs. ${parseFloat(invoice.total || invoice.amount || 0).toFixed(2)}`, 430, finalY + 7, { width: 100, align: 'right' });

    doc.moveDown(3);
    doc.rect(50, doc.y, 500, 1).fill('#ddd');
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#999').font('Helvetica')
      .text('librika.in - Library Management System', { align: 'center' })
      .text('Thank you for your business!', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Invoice PDF error:', err);
    res.status(500).send('Failed to generate invoice');
  }
});

module.exports = router;