// This mirrors the PLANS object from the Flask app's permissions.py
const PLANS = {
  FREE: {
    price: 0,
    limits: { studentLimit: 50, adminLimit: 1, librarianLimit: 1, max_books: 500, max_digital_books: 20, max_file_size_mb: 27 },
    perms: {
      canImportCSV: false,
      canExportCSV: false,
      canUseAIScanner: true,
      canUseBarcodeScanner: true,
      canUseAdvancedAnalytics: false,
      canUsePublishing: true,
      canUseMultiBranch: false,
      canUseAPI: false,
      canUseAIChat: true
    }
  },
  BASIC: {
    price: 999,
    limits: { studentLimit: 500, adminLimit: 5, librarianLimit: 5, max_books: 10000, max_digital_books: 500, max_file_size_mb: 27 },
    perms: {
      canImportCSV: true,
      canExportCSV: true,
      canUseAIScanner: true,
      canUseBarcodeScanner: true,
      canUseAdvancedAnalytics: false,
      canUsePublishing: true,
      canUseMultiBranch: false,
      canUseAPI: false,
      canUseAIChat: true
    }
  },
  PROFESSIONAL: {
    price: 2999,
    limits: { studentLimit: 999999, adminLimit: 999999, librarianLimit: 999999, max_books: 999999, max_digital_books: 999999, max_file_size_mb: 50 },
    perms: {
      canImportCSV: true,
      canExportCSV: true,
      canUseAIScanner: true,
      canUseBarcodeScanner: true,
      canUseAdvancedAnalytics: true,
      canUsePublishing: true,
      canUseMultiBranch: true,
      canUseAPI: true,
      canUseAIChat: true
    }
  }
};

module.exports = PLANS;