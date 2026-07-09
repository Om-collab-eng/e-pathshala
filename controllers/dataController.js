const { query } = require('../db');
const path = require('path');
const fs = require('fs');
const { Workbook } = require('exceljs');
const { format } = require('timeago.js'); // We might not need this, but let's keep for now

// Helper to execute a query and return rows and rowCount
// Our db.js query already returns { rows, rowCount } for both PostgreSQL and SQLite

// Function to generate CSV from rows and headers
const generateCSV = (headers, rows) => {
  // Escape double quotes and wrap fields in quotes if they contain commas, quotes, or newlines
  const escapeCSV = (field) => {
    if (field == null) return '';
    const string = field.toString();
    if (string.includes('"') || string.includes(',') || string.includes('\n')) {
      return `"${string.replace(/"/g, '""')}"`;
    }
    return string;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => {
    return headers.map(header => escapeCSV(row[header])).join(',');
  });
  return [headerLine, ...dataLines].join('\n');
};

// Function to generate XLSX from rows and headers
const generateXLSX = async (headers, rows) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');

  // Add headers
  worksheet.addRow(headers);

  // Add data rows
  rows.forEach(row => {
    const dataRow = headers.map(header => row[header]);
    worksheet.addRow(dataRow);
  });

  // Buffer the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// Export function generator for a given module
const createExportFunction = (moduleConfig) => {
  return async (req, res) => {
    try {
      const format = req.query.format || 'csv';
      const schoolCodeParam = req.query.school; // from query string
      const userSchoolCode = req.session.school_code;
      const useDemo = req.session.useDemo || false;

      // Determine which school code to use for filtering
      let schoolCode = schoolCodeParam || userSchoolCode;

      // Admin restriction: if the user is an admin, they are limited to their own school
      if (req.session.role === 'admin') {
        schoolCode = userSchoolCode;
      }
      // Note: super_admin is not restricted by default in the original code? We'll leave as is.

      // Build query using the moduleConfig
      let { queryText, queryParams } = moduleConfig.buildQuery(schoolCode, useDemo);

      // Execute the query
      const result = await query(queryText, queryParams, useDemo);

      // Prepare data for export
      const headers = moduleConfig.headers;
      const rows = result.rows.map = {};
        return headers.map(header => row[header]) ?? []; // We'll map the row to the header names

      // Actually, the row from the query is an object with keys as per the SELECT aliases.
      // We assume the query returns columns with the exact names as in the headers.
      // If not, we need to map. We'll assume the query uses the same aliases as the headers.

      // For safety, we can map by index if the headers are in the same order as the SELECT.
      // But let's assume the query returns an object with the correct keys.

      // If the query uses aliases that match the headers, we can use the row directly.
      // We'll do: const exportRow = {}; headers.forEach(h => { exportRow[h] = row[h]; });
      // But if the row doesn't have the key, it will be undefined.

      // We'll instead use the row as is and hope the keys match.
      // Alternatively, we can change the buildQuery to return an array of values in the order of headers.

      // Let's change the approach: have the buildQuery return the SQL and the params, and also a function to map a row to an array of values in header order.
      // But to keep it simple, we'll assume the query returns the columns in the same order as the headers and with the same names.

      // We'll do: the buildQuery returns an object with { text, params, rowToArray } where rowToArray is a function that takes a row and returns an array of values in header order.

      // Given time, we'll do a simpler approach: we'll have the buildQuery return the SQL and params, and we'll assume the row is an array (but our query returns objects).

      // Actually, our query function returns rows as an array of objects. We can convert to array of arrays by mapping over the headers.

      const dataArray = result.rows.map(row => {
        return headers.map(header => row[header]);
      });

      // Now generate the file
      let fileBuffer;
      let contentType;
      let fileExtension;

      if (format === 'xlsx') {
        fileBuffer = await generateXLSX(headers, dataArray);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      } else {
        // CSV
        const csv = generateCSV(headers, dataArray);
        fileBuffer = Buffer.from(csv);
        contentType = 'text/csv';
        fileExtension = 'csv';
      }

      // Set response headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${moduleConfig.name}_export_${Date.now()}.${fileExtension}`);

      // Send the file
      res.send(fileBuffer);
    } catch (err) {
      console.error(`Error exporting ${moduleConfig.name}:`, err);
      res.status(500).json({ error: `Failed to export ${moduleConfig.name}` });
    }
  };
};

// Import function generator for a given module
const createImportFunction = (moduleConfig) => {
  return async (req, res) => {
    try {
      const useDemo = req.session.useDemo || false;
      const schoolCode = req.body.school || req.session.school_code;

      // Admin restriction: if the user is an admin, they are limited to their own school
      if (req.session.role === 'admin') {
        schoolCode = req.session.school_code;
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // We only support CSV for now
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(require('csv-parser')())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', async () => {
          // Process the imported data based on the module
          const success = await moduleConfig.processImport(results, schoolCode, useDemo);
          // For now, we just return the counts
          res.json({
            total: results.length,
            success: success.success,
            failed: success.failed,
            duplicates: success.duplicates,
            errors: success.errors
          });
        });
    } catch (err) {
      console.error(`Error importing ${moduleConfig.name}:`, err);
      res.status(500).json({ error: `Failed to import ${moduleConfig.name}` });
    }
  };
};

// Template function generator for a given module
const createTemplateFunction = (moduleConfig) => {
  return (req, res) => {
    const headers = moduleConfig.headers;
    const csv = generateCSV(headers, [[]]); // Just the header row
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${moduleConfig.name}_template.csv`);
    res.send(csv);
  };
};

// Module configurations

// Books module
const booksModule = {
  name: 'books',
  headers: ['Title', 'Author', 'ISBN', 'Category', 'Quantity', 'Publisher', 'Description', 'Shelf Location', 'School Code'],
  buildQuery: (schoolCode, useDemo) => {
    let queryText = `
      SELECT b.title, b.author, b.barcode_id, b.genre, b.total_copies, b.available_copies,
             b.publisher, b.description, b.shelf_location, b.school_code
      FROM books b
    `;
    const queryParams = [];
    if (schoolCode && schoolCode.toUpperCase() !== 'ALL') {
      queryText += ' WHERE b.school_code = $1';
      queryParams.push(schoolCode);
    }
    return { text: queryText, params: queryParams };
  },
  processImport: async (records, schoolCode, useDemo) => {
    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const title = row.title;
        const author = row.author;
        const isbn = row.isbn;
        const category = row.category || 'General';
        const qty = parseInt(row.quantity, 10) || 0;

        if (!title || !author || !isbn || qty < 1) {
          failed++;
          errors.push(`Row ${i+1}: Missing required book fields`);
          continue;
        }

        const targetSchool = row.school_code || schoolCode;
        if (!targetSchool || targetSchool.toUpperCase() === 'ALL') {
          failed++;
          errors.push(`Row ${i+1}: Missing target school`);
          continue;
        }

        // Check duplicate ISBN for the school
        const exists = await query(
          'SELECT id FROM books WHERE barcode_id = $1 AND school_code = $2',
          [isbn, targetSchool],
          useDemo
        );
        if (exists.rowCount > 0) {
          duplicates++;
          continue;
        }

        await query(
          `INSERT INTO books (title, author, barcode_id, genre, total_copies, available_copies, school_code, description, shelf_location)
           VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8)`,
          [
            title,
            author,
            isbn,
            category,
            qty,
            targetSchool,
            row.description || '',
            row.shelf_location || ''
          ],
          useDemo
        );
        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${i+1}: ${err.message}`);
      }
    }

    return { success, failed, duplicates, errors };
  }
};

// Students module
const studentsModule = {
  name: 'students',
  headers: ['Student ID', 'Name', 'Phone', 'Class', 'School Code', 'Password'],
  buildQuery: (schoolCode, useDemo) => {
    let queryText = `
      SELECT u.admission_no, u.name, u.phone, u.class, u.school_code, u.password
      FROM users u
      WHERE u.role = $1
    `;
    const queryParams = ['student'];
    if (schoolCode && schoolCode.toUpperCase() !== 'ALL') {
      queryText += ' AND u.school_code = $2';
      queryParams.push(schoolCode);
    }
    return { text: queryText, params: queryParams };
  },
  processImport: async (records, schoolCode, useDemo) => {
    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const sid = row['Student ID'] || row.studentid;
        const name = row.Name || row.name;
        const phone = row.Phone || row.phone;
        const cls = row.Class || row.class;
        const password = row.Password || row.password || 'studentpass';

        if (!sid || !name || !phone || !cls) {
          failed++;
          errors.push(`Row ${i+1}: Missing required student fields`);
          continue;
        }

        const targetSchool = row['School Code'] || row.school_code || schoolCode;
        if (!targetSchool || targetSchool.toUpperCase() === 'ALL') {
          failed++;
          errors.push(`Row ${i+1}: Missing target school`);
          continue;
        }

        // Check duplicate phone
        const exists = await query(
          'SELECT id FROM users WHERE phone = $1',
          [phone],
          useDemo
        );
        if (exists.rowCount > 0) {
          duplicates++;
          continue;
        }

        await query(
          `INSERT INTO users (name, admission_no, phone, class, role, password, school_code, status)
           VALUES ($1, $2, $3, $4, 'student', $5, $6, 'active')`,
          [
            name,
            sid,
            phone,
            cls,
            password,
            targetSchool
          ],
          useDemo
        );
        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${i+1}: ${err.message}`);
      }
    }

    return { success, failed, duplicates, errors };
  }
};

// Librarians module (admins)
const librariansModule = {
  name: 'librarians',
  headers: ['Name', 'Phone', 'School Code', 'Password'],
  buildQuery: (schoolCode, useDemo) => {
    let queryText = `
      SELECT name, phone, school_code, password
      FROM users
      WHERE role = $1
    `;
    const queryParams = ['admin'];
    if (schoolCode && schoolCode.toUpperCase() !== 'ALL') {
      queryText += ' AND school_code = $2';
      queryParams.push(schoolCode);
    }
    return { text: queryText, params: queryParams };
  },
  processImport: async (records, schoolCode, useDemo) => {
    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const name = row.Name || row.name;
        const phone = row.Phone || row.phone;
        const password = row.Password || row.password || 'adminpass';

        if (!name || !phone) {
          failed++;
          errors.push(`Row ${i+1}: Missing required librarian fields`);
          continue;
        }

        const targetSchool = row['School Code'] || row.school_code || schoolCode;
        if (!targetSchool || targetSchool.toUpperCase() === 'ALL') {
          failed++;
          errors.push(`Row ${i+1}: Missing target school`);
          continue;
        }

        // Check duplicate phone
        const exists = await query(
          'SELECT id FROM users WHERE phone = $1',
          [phone],
          useDemo
        );
        if (exists.rowCount > 0) {
          duplicates++;
          continue;
        }

        await query(
          `INSERT INTO users (name, phone, role, password, school_code, status)
           VALUES ($1, $2, 'admin', $3, $4, 'active')`,
          [
            name,
            phone,
            password,
            targetSchool
          ],
          useDemo
        );
        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${i+1}: ${err.message}`);
      }
    }

    return { success, failed, duplicates, errors };
  }
};

// Schools module
const schoolsModule = {
  name: 'schools',
  headers: ['Name', 'School Code', 'Librarian Name'],
  buildQuery: (schoolCode, useDemo) => {
    let queryText = `
      SELECT name, school_code, librarian_name
      FROM schools
    `;
    const queryParams = [];
    if (schoolCode && schoolCode.toUpperCase() !== 'ALL') {
      queryText += ' WHERE school_code = $1';
      queryParams.push(schoolCode);
    }
    return { text: queryText, params: queryParams };
  },
  processImport: async (records, schoolCode, useDemo) => {
    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const name = row.Name || row.name;
        const school_code = row['School Code'] || row.school_code;
        const librarian_name = row['Librarian Name'] || row.librarian_name || '';

        if (!name || !school_code) {
          failed++;
          errors.push(`Row ${i+1}: Missing required school fields`);
          continue;
        }

        // Check duplicate school_code
        const exists = await query(
          'SELECT id FROM schools WHERE school_code = $1',
          [school_code],
          useDemo
        );
        if (exists.rowCount > 0) {
          duplicates++;
          continue;
        }

        await query(
          `INSERT INTO schools (name, school_code, librarian_name, created_at, status)
           VALUES ($1, $2, $3, $4, 'Active')`,
          [
            name,
            school_code,
            librarian_name,
            new Date().toISOString().slice(0, 19).replace('T', ' ')
          ],
          useDemo
        );
        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${i+1}: ${err.message}`);
      }
    }

    return { success, failed, duplicates, errors };
  }
};

// Transactions module (special because it involves joins)
const transactionsModule = {
  name: 'transactions',
  headers: ['Student Name', 'Book Title', 'School Code', 'Issue Date', 'Due Date', 'Return Date', 'Fine'],
  buildQuery: (schoolCode, useDemo) => {
    let queryText = `
      SELECT u.name as student, b.title as book, t.school_code, t.issue_date, t.due_date, t.return_date, t.fine
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
    `;
    const queryParams = [];
    if (schoolCode && schoolCode.toUpperCase() !== 'ALL') {
      queryText += ' WHERE t.school_code = $1';
      queryParams.push(schoolCode);
    }
    return { text: queryText, params: queryParams };
  },
  // Note: Importing transactions is more complex and might not be needed. We'll leave it unimplemented for now.
  processImport: async (records, schoolCode, useDemo) => {
    // We'll not implement import for transactions for now.
    return { success: 0, failed: records.length, duplicates: 0, errors: ['Import not implemented for transactions'] };
  }
};

// Map of modules
const modules = {
  books: booksModule,
  students: studentsModule,
  librarians: librariansModule,
  schools: schoolsModule,
  transactions: transactionsModule
};

// Export functions
exports.exportBooks = createExportFunction(modules.books);
exports.exportStudents = createExportFunction(modules.students);
exports.exportLibrarians = createExportFunction(modules.librarians);
exports.exportSchools = createExportFunction(modules.schools);
exports.exportTransactions = createExportFunction(modules.transactions);

// Import functions
exports.importBooks = createImportFunction(modules.books);
exports.importStudents = createImportFunction(modules.students);
exports.importLibrarians = createImportFunction(modules.librarians);
exports.importSchools = createImportFunction(modules.schools);
exports.importTransactions = createImportFunction(modules.transactions);

// Template functions
exports.downloadTemplate = (req, res) => {
  const module = req.params.module;
  const moduleConfig = modules[module];
  if (!moduleConfig) {
    return res.status(400).send('Invalid module');
  }
  return createTemplateFunction(moduleConfig)(req, res);
};