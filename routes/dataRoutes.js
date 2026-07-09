const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const dataController = require('../controllers/dataController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/temp/' });

// All data routes require authentication
router.use(authMiddleware);

// Export routes
router.get('/export/books',
  permissionMiddleware('canExportCSV'),
  dataController.exportBooks
);

router.get('/export/students',
  permissionMiddleware('canExportCSV'),
  dataController.exportStudents
);

router.get('/export/librarians',
  permissionMiddleware('canExportCSV'),
  dataController.exportLibrarians
);

router.get('/export/schools',
  permissionMiddleware('canExportCSV'),
  dataController.exportSchools
);

router.get('/export/transactions',
  permissionMiddleware('canExportCSV'),
  dataController.exportTransactions
);

// Template download route
router.get('/template/:module',
  // Template download restricted to admin/super_admin
  (req, res, next) => {
    if (req.session && req.session.user_id) {
      const role = req.session.role;
      if (role === 'admin' || role === 'super_admin' || role === 'super_super_admin') {
        return next();
      }
    }
    req.flash('error_msg', 'You do not have permission to access this page.');
    return res.redirect('/');
  },
  dataController.downloadTemplate
);

// Import route
router.post('/import/:module',
  permissionMiddleware('canImportCSV'),
  upload.single('file'),
  (req, res) => {
    const module = req.params.module;
    let handler;
    switch (module) {
      case 'books': handler = dataController.importBooks; break;
      case 'students': handler = dataController.importStudents; break;
      case 'librarians': handler = dataController.importLibrarians; break;
      case 'schools': handler = dataController.importSchools; break;
      case 'transactions': handler = dataController.importTransactions; break;
      default: return res.status(400).json({ error: 'Invalid module' });
    }
    return handler(req, res);
  }
);

module.exports = router;