const { query } = require('../db');
const PLANS = require('../permissions');
const { v4: uuidv4 } = require('uuid');

/**
 * Get the school's subscription details
 * @param {string} schoolCode - The school code
 * @param {boolean} useDemo - Whether to use the demo database
 * @returns {Promise<Object>} Subscription object
 */
async function getSchoolSubscription(schoolCode, useDemo) {
  const schoolResult = await query(
    'SELECT activePlan, subscriptionStatus, expiryDate FROM schools WHERE school_code = $1',
    [schoolCode],
    useDemo
  );

  let planId = 'FREE';
  let status = 'active';
  let expiry = 'Never';

  if (schoolResult.rowCount > 0) {
    const school = schoolResult.rows[0];
    planId = school.activeplan || 'FREE';
    status = school.subscriptionstatus || 'active';
    expiry = school.expirydate || 'Never';
  } else {
    // If school not found, we might be in a demo context? We'll check the demo flag later
    // For now, we'll use the default
  }

  // Determine if it's a demo session (we would need to pass the is_demo flag from session)
  // We'll handle that in the calling function by checking the session's is_demo flag
  // For now, we'll just return the values

  return {
    status,
    plan_name: planId,
    plan_id: planId,
    max_students: PLANS[planId] ? PLANS[planId].limits.studentLimit : PLANS.FREE.limits.studentLimit,
    max_books: PLANS[planId] ? PLANS[planId].limits.max_books : PLANS.FREE.limits.max_books,
    current_period_end: expiry
  };
}

/**
 * Process the checkout for a subscription plan
 * @param {string} schoolCode - The school code
 * @param {string} planId - The plan ID
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @param {boolean} useDemo - Whether to use the demo database
 * @returns {Promise<Object>} Result object
 */
async function processCheckout(schoolCode, planId, billingCycle, useDemo) {
  // Validate planId
  if (!PLANS[planId]) {
    return { error: 'Invalid plan selected.' };
  }

  const plan = PLANS[planId];
  let amount;
  if (billingCycle === 'annual') {
    amount = plan.price * 12;
  } else {
    amount = plan.price;
  }

  // Simulate payment gateway response (as in the original)
  // In the original, they used a DummyGateway that returned a transaction
  const transactionId = `txn_${uuidv4().substring(0, 10)}`;
  const subscriptionId = `sub_${uuidv4().substring(0, 10)}`;

  // Calculate the period end
  const now = new Date();
  let periodEnd;
  if (billingCycle === 'annual') {
    periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  } else {
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  // Update the school's plan in the database
  await query(
    `
    UPDATE schools
    SET activePlan = $1, subscriptionStatus = $2, expiryDate = $3,
        studentLimit = $4, librarianLimit = $5, adminLimit = $6
    WHERE school_code = $7
    `,
    [
      planId,
      'active',
      periodEnd.toISOString().slice(0, 19).replace('T', ' '), // Format as YYYY-MM-DD HH:MM:SS
      plan.limits.studentLimit,
      plan.limits.librarianLimit,
      plan.limits.adminLimit,
      schoolCode
    ],
    useDemo
  );

  // Generate an invoice
  const invoiceId = `inv_${uuidv4().substring(0, 10)}`;
  const tax = amount * 0.18;
  const total = amount + tax;

  await query(
    `
    INSERT INTO invoices (id, school_code, amount, tax, total, status, due_date, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      invoiceId,
      schoolCode,
      amount,
      tax,
      total,
      'paid',
      periodEnd.toISOString().slice(0, 19).replace('T', ' '),
      new Date().toISOString().slice(0, 19).replace('T', ' ')
    ],
    useDemo
  );

  return { status: 'success', message: `Successfully upgraded to ${planId} Plan!` };
}

exports.getDashboard = async (req, res) => {
  try {
    const schoolCode = req.session.school_code;
    const useDemo = req.session.useDemo || false;

    // Get subscription details
    const sub = await getSchoolSubscription(schoolCode, useDemo);

    // Get invoices, student count, book count
    const invoicesResult = await query(
      'SELECT * FROM invoices WHERE school_code = $1 ORDER BY created_at DESC',
      [schoolCode],
      useDemo
    );

    const studentsCountResult = await query(
      'SELECT COUNT(*) FROM users WHERE role = $1 AND school_code = $2',
      ['student', schoolCode],
      useDemo
    );

    const booksCountResult = await query(
      'SELECT COUNT(*) FROM books WHERE school_code = $1',
      [schoolCode],
      useDemo
    );

    const invoices = invoicesResult.rows;
    const studentsCount = studentsCountResult.rows[0].count;
    const booksCount = booksCountResult.rows[0].count;

    res.render('billing/dashboard', {
      title: 'Billing Dashboard',
      sub,
      plans: PLANS,
      invoices,
      students_count: studentsCount,
      books_count: booksCount
    });
  } catch (err) {
    console.error('Error in billing dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load billing dashboard' });
  }
};

exports.postCheckout = async (req, res) => {
  try {
    const schoolCode = req.session.school_code;
    const useDemo = req.session.useDemo || false;
    const planId = req.body.plan_id;
    const billingCycle = req.body.billing_cycle || 'monthly';

    const result = await processCheckout(schoolCode, planId, billingCycle, useDemo);

    if (result.error) {
      req.flash('error_msg', result.error);
    } else {
      req.flash('success_msg', result.message);
    }

    res.redirect('/billing');
  } catch (err) {
    console.error('Error in billing checkout:', err);
    req.flash('error_msg', 'An error occurred during checkout');
    res.redirect('/billing');
  }
};

exports.postCancel = async (req, res) => {
  try {
    const schoolCode = req.session.school_code;
    const useDemo = req.session.useDemo || false;

    // Update the school to free plan
    await query(
      `
      UPDATE schools
      SET activePlan = 'FREE', subscriptionStatus = 'active', expiryDate = NULL,
          studentLimit = 50, librarianLimit = 1, adminLimit = 1
      WHERE school_code = $1
      `,
      [schoolCode],
      useDemo
    );

    req.flash('success_msg', 'Your plan has been cancelled and downgraded to FREE.');
    res.redirect('/billing');
  } catch (err) {
    console.error('Error in billing cancel:', err);
    req.flash('error_msg', 'An error occurred while cancelling the plan');
    res.redirect('/billing');
  }
};