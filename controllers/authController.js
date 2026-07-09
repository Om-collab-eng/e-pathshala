const { query } = require('../db');

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.postLogin = async (req, res) => {
  const { login, password } = req.body;
  // The login field could be phone, admission_no, or email depending on role
  // We'll search by phone or admission_no or email
  try {
    // First, try to find by phone
    let user = await query(
      'SELECT * FROM users WHERE phone = $1',
      [login]
    );
    if (user.rowCount === 0) {
      // Try by admission_no
      user = await query(
        'SELECT * FROM users WHERE admission_no = $1',
        [login]
      );
    }
    if (user.rowCount === 0) {
      // Try by email
      user = await query(
        'SELECT * FROM users WHERE email = $1',
        [login]
      );
    }

    if (user.rowCount > 0) {
      const u = user.rows[0];
      // Compare passwords (plaintext as in original)
      if (u.password === password) {
        // Set session variables
        req.session.user_id = u.id;
        req.session.user_name = u.name;
        req.session.role = u.role;
        req.session.school_code = u.school_code;
        // Get school name
        const schoolResult = await query(
          'SELECT name FROM schools WHERE school_code = $1',
          [u.school_code]
        );
        req.session.school_name = schoolResult.rowCount > 0 ? schoolResult.rows[0].name : '';
        // Generate a token (simple random string)
        req.session.token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // Get permissions based on school plan
        const permsResult = await query(
          `SELECT perms FROM (
             SELECT jsonb_array_elements_text(permissions::jsonb) AS perm
             FROM users WHERE id = $1
           ) sub`,
          [u.id]
        );
        // For simplicity, we'll store the permissions string as is; we'll need to parse it later.
        // The permissions column is a text array in PostgreSQL? We stored as TEXT.
        // We'll just copy the permissions field.
        req.session.permissions = u.permissions; // This is a string like '["manage_books", ...]'
        // Convert to array for easier checking in middleware
        try {
          req.session.permissions = JSON.parse(u.permissions);
        } catch (e) {
          req.session.permissions = [];
        }

        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).send('Session error');
          }
          // Redirect based on role
          if (u.role === 'admin' || u.role === 'super_admin') {
            return res.redirect('/admin');
          } else if (u.role === 'student') {
            return res.redirect('/student');
          } else if (u.role === 'librarian') {
            return res.redirect('/librarian');
          } else {
            return res.redirect('/dashboard');
          }
        });
      } else {
        req.flash('error_msg', 'Invalid password');
        return res.redirect('/login');
      }
    } else {
      req.flash('error_msg', 'Invalid login credentials');
      return res.redirect('/login');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error_msg', 'An error occurred during login');
    return res.redirect('/login');
  }
};

exports.getLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

exports.postRegister = async (req, res) => {
  // TODO: Implement registration
  // For now, just redirect to login
  req.flash('success_msg', 'Registration not yet implemented. Please contact administrator.');
  res.redirect('/login');
};