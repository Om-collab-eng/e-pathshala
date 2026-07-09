const { query } = require('../db');

exports.getDashboard = async (req, res) => {
  try {
    const schoolCode = req.session.school_code;
    const useDemo = req.session.useDemo || false;

    // Get some statistics for the dashboard
    const booksCountResult = await query('SELECT COUNT(*) FROM books WHERE school_code = $1', [schoolCode], useDemo);
    const studentsCountResult = await query('SELECT COUNT(*) FROM users WHERE role = $1 AND school_code = $2', ['student', schoolCode], useDemo);
    const teachersCountResult = await query('SELECT COUNT(*) FROM users WHERE role = $1 AND school_code = $2', ['teacher', schoolCode], useDemo); // Note: role might be 'librarian' or 'admin'? We'll adjust.
    const activeLoansResult = await query(`
      SELECT COUNT(*) FROM transactions
      WHERE school_code = $1 AND return_date IS NULL
    `, [schoolCode], useDemo);
    const overdueLoansResult = await query(`
      SELECT COUNT(*) FROM transactions
      WHERE school_code = $1 AND return_date IS NULL AND due_date < DATE('now')
    `, [schoolCode], useDemo);

    const booksCount = booksCountResult.rows[0].count;
    const studentsCount = studentsCountResult.rows[0].count;
    const teachersCount = teachersCountResult.rows[0].count;
    const activeLoans = activeLoansResult.rows[0].count;
    const overdueLoans = overdueLoansResult.rows[0].count;

    res.render('dashboard', {
      title: 'Dashboard',
      booksCount,
      studentsCount,
      teachersCount,
      activeLoans,
      overdueLoans
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
};