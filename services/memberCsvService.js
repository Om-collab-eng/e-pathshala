/**
 * Member CSV Import & Export Service
 * Single Source of Truth, Safe Upsert, Zero Destructive Overwrite
 * School Admin Scope Enforced
 */

const db = require('../db');
const userService = require('./userService');

// In-memory cache for staged imports (TTL: 1 hour)
const stagedImportsCache = new Map();

// Helper to sanitize CSV field values (escaping quotes, commas, newlines)
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert an array of objects to a CSV string
function objectsToCsv(headers, rows) {
  const headerLine = headers.map(h => escapeCsvValue(h.label || h.key || h)).join(',');
  const lines = rows.map(row => {
    return headers.map(h => {
      const key = h.key || h;
      return escapeCsvValue(row[key]);
    }).join(',');
  });
  return [headerLine, ...lines].join('\r\n');
}

// Robust CSV Line Parser (handles quoted commas, escaped quotes, multiline)
function parseCsvContent(csvString) {
  // Strip UTF-8 BOM if present
  let clean = csvString.replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some(f => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push last field & row if pending
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Header mapping dictionary (fuzzy synonym matching)
const HEADER_SYNONYMS = {
  id: ['member id', 'user id', 'id', 'system id'],
  name: ['full name', 'name', 'student name', 'member name', 'employee name'],
  gender: ['gender', 'sex'],
  role: ['role', 'user type', 'type', 'account role', 'member role'],
  admission_no: ['admission number', 'admission no', 'adm no', 'adm_no', 'admission_no', 'student id', 'student adm no'],
  roll_no: ['roll number', 'roll no', 'roll', 'roll_no'],
  employee_id: ['employee id', 'emp id', 'emp_id', 'employee_id', 'staff id'],
  class: ['class', 'grade', 'standard', 'academic class'],
  section: ['section', 'sec'],
  academic_year: ['academic year', 'academic session', 'year', 'session'],
  father_name: ["father name", "father's name", "father", "fathers name"],
  mother_name: ["mother name", "mother's name", "mother", "mothers name"],
  dob: ['date of birth', 'dob', 'birth date', 'birthdate'],
  phone: ['mobile', 'phone', 'mobile number', 'phone number', 'contact number', 'contact'],
  email: ['email', 'email address'],
  address: ['address', 'residential address', 'street address'],
  department: ['department', 'dept'],
  designation: ['designation', 'designation/title', 'title'],
  username: ['username', 'user name', 'login id'],
  school_code: ['school code', 'school_code', 'school']
};

function mapHeaderToField(headerName) {
  const norm = String(headerName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, ' ');
  for (const [canonicalField, synonyms] of Object.entries(HEADER_SYNONYMS)) {
    for (const syn of synonyms) {
      const normSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      if (norm === normSyn || norm.replace(/\s+/g, '') === normSyn.replace(/\s+/g, '')) {
        return canonicalField;
      }
    }
  }
  return null;
}

// Normalize Date string to YYYY-MM-DD
function normalizeDate(rawDate) {
  if (!rawDate) return null;
  const s = String(rawDate).trim();
  if (!s) return null;

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Check DD-MM-YYYY or DD/MM/YYYY
  const parts = s.split(/[\-\/\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD-MM-YYYY -> YYYY-MM-DD
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
    if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  // Attempt Date parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * 1. Generate CSV Template
 */
function getMemberCsvTemplate() {
  const headers = [
    'Member ID',
    'Full Name',
    'Gender',
    'Role',
    'Admission Number',
    'Roll Number',
    'Employee ID',
    'Class',
    'Section',
    'Academic Year',
    'Father Name',
    'Mother Name',
    'DOB',
    'Mobile',
    'Email',
    'Address',
    'Department',
    'Designation',
    'Username'
  ];

  const sampleRows = [
    {
      'Member ID': '',
      'Full Name': 'Ayushman Gupta',
      'Gender': 'Male',
      'Role': 'student',
      'Admission Number': 'STD-2026-001',
      'Roll Number': '10',
      'Employee ID': '',
      'Class': 'Class 9',
      'Section': 'A',
      'Academic Year': '2026-2027',
      'Father Name': 'Ashish Kumar Gupta',
      'Mother Name': 'Pooja Gupta',
      'DOB': '2012-08-16',
      'Mobile': '9876543210',
      'Email': 'ayushman.sample@school.edu',
      'Address': 'Plot 42, Sector 5, Rohini, New Delhi',
      'Department': '',
      'Designation': '',
      'Username': 'ayushman6061'
    },
    {
      'Member ID': '',
      'Full Name': 'Sunita Sharma',
      'Gender': 'Female',
      'Role': 'teacher',
      'Admission Number': '',
      'Roll Number': '',
      'Employee ID': 'EMP-TCH-102',
      'Class': '',
      'Section': '',
      'Academic Year': '',
      'Father Name': '',
      'Mother Name': '',
      'DOB': '1988-04-20',
      'Mobile': '9876543211',
      'Email': 'sunita.teacher@school.edu',
      'Address': 'Flat 204, Riverview Apts, New Delhi',
      'Department': 'Science & Mathematics',
      'Designation': 'Senior Faculty',
      'Username': 'sunita_teacher'
    }
  ];

  const headerLine = headers.map(escapeCsvValue).join(',');
  const rowLines = sampleRows.map(r => headers.map(h => escapeCsvValue(r[h])).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * 2. Export Members to CSV (School Scoped & Filter Respecting)
 */
async function exportMembersCsv({ schoolCode, filters = {} }) {
  if (!schoolCode) throw new Error('Authorized School Code is required for export.');

  let sql = `
    SELECT u.*, 
           s.name as school_name,
           sp.roll_no as sp_roll_no,
           sp.father_name as sp_father_name,
           sp.mother_name as sp_mother_name,
           sp.dob as sp_dob,
           sp.class_name as sp_class,
           sp.section as sp_section,
           stf.department as stf_department,
           stf.designation as stf_designation
    FROM users u
    LEFT JOIN schools s ON LOWER(u.school_code) = LOWER(s.school_code)
    LEFT JOIN student_profiles sp ON sp.user_id = CAST(u.id AS CHAR)
    LEFT JOIN staff_profiles stf ON stf.user_id = CAST(u.id AS CHAR)
    WHERE LOWER(u.school_code) = LOWER($1)
      AND (u.role NOT IN ('super_admin', 'superadmin', 'owner'))
  `;
  const params = [schoolCode];

  // Role filter
  if (filters.role && filters.role !== 'all') {
    params.push(filters.role.toLowerCase());
    sql += ` AND LOWER(u.role) = $${params.length}`;
  }

  // Class filter
  if (filters.class && filters.class !== 'all') {
    params.push(filters.class);
    sql += ` AND (u.class = $${params.length} OR sp.class_name = $${params.length})`;
  }

  // Section filter
  if (filters.section && filters.section !== 'all') {
    params.push(filters.section);
    sql += ` AND (u.section = $${params.length} OR sp.section = $${params.length})`;
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'suspended') {
      sql += ` AND (u.is_banned = '1' OR u.is_banned = 1 OR u.status = 'suspended')`;
    } else if (filters.status === 'active') {
      sql += ` AND (u.is_banned != '1' AND u.is_banned != 1 AND (u.status = 'active' OR u.status IS NULL))`;
    }
  }

  // Search filter
  if (filters.search && filters.search.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    const pIdx = params.length;
    sql += ` AND (
      LOWER(u.name) LIKE $${pIdx} OR 
      LOWER(COALESCE(u.admission_no, '')) LIKE $${pIdx} OR 
      LOWER(COALESCE(u.employee_id, '')) LIKE $${pIdx} OR 
      LOWER(COALESCE(u.phone, '')) LIKE $${pIdx} OR 
      LOWER(COALESCE(u.email, '')) LIKE $${pIdx} OR
      LOWER(COALESCE(u.username, '')) LIKE $${pIdx}
    )`;
  }

  sql += ` ORDER BY u.role ASC, u.name ASC`;

  const res = await db.query(sql, params);
  const rows = res.rows || [];

  const headers = [
    { key: 'id', label: 'Member ID' },
    { key: 'user_id', label: 'User ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'role', label: 'Role' },
    { key: 'admission_no', label: 'Admission Number' },
    { key: 'roll_no', label: 'Roll Number' },
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'class', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'academic_year', label: 'Academic Year' },
    { key: 'father_name', label: 'Father Name' },
    { key: 'mother_name', label: 'Mother Name' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'phone', label: 'Mobile' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'school_code', label: 'School Code' },
    { key: 'school_name', label: 'School Name' },
    { key: 'status', label: 'Account Status' },
    { key: 'username', label: 'Username' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' }
  ];

  const exportData = rows.map(u => {
    const isSuspended = (u.is_banned === 1 || u.is_banned === '1' || u.status === 'suspended');
    return {
      id: u.id,
      user_id: u.id,
      name: u.name || '',
      gender: u.gender || '',
      role: u.role || 'student',
      admission_no: u.admission_no || '',
      roll_no: u.roll_no || u.sp_roll_no || '',
      employee_id: u.employee_id || '',
      class: u.class || u.sp_class || '',
      section: u.section || u.sp_section || '',
      academic_year: u.academic_year || '2026-2027',
      father_name: u.father_name || u.sp_father_name || '',
      mother_name: u.mother_name || u.sp_mother_name || '',
      dob: u.dob || u.sp_dob || '',
      phone: u.phone || '',
      email: u.email || '',
      address: u.address || '',
      department: u.department || u.stf_department || '',
      designation: u.designation || u.stf_designation || '',
      school_code: u.school_code || schoolCode,
      school_name: u.school_name || 'Librika Campus',
      status: isSuspended ? 'Suspended' : 'Active',
      username: u.username || u.admission_no || u.employee_id || u.phone || '',
      created_at: u.created_at || '',
      updated_at: u.last_active_at || u.created_at || ''
    };
  });

  return objectsToCsv(headers, exportData);
}

/**
 * 3. Multi-Stage Import Parsing & Pre-validation (Preview Stage)
 */
async function parseAndValidateMemberCsv({ fileBuffer, fileName, schoolCode, adminUser }) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('CSV file is empty or missing.');
  }
  if (fileBuffer.length > 10 * 1024 * 1024) {
    throw new Error('File exceeds maximum allowed size of 10 MB.');
  }

  const csvString = fileBuffer.toString('utf8');
  const parsedRows = parseCsvContent(csvString);

  if (parsedRows.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  const rawHeaders = parsedRows[0];
  const headerMap = {};
  rawHeaders.forEach((h, idx) => {
    const field = mapHeaderToField(h);
    if (field) headerMap[idx] = field;
  });

  // Verify essential headers
  const mappedFields = Object.values(headerMap);
  if (!mappedFields.includes('name')) {
    throw new Error('Required header "Full Name" (or "Name") was not found in the CSV.');
  }

  // Pre-fetch all existing users in this school for fast matching
  const existingRes = await db.query(`
    SELECT u.*, 
           sp.roll_no as sp_roll_no, sp.father_name as sp_father_name, sp.mother_name as sp_mother_name,
           sp.dob as sp_dob, sp.class_name as sp_class, sp.section as sp_section,
           stf.department as stf_department, stf.designation as stf_designation
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = CAST(u.id AS CHAR)
    LEFT JOIN staff_profiles stf ON stf.user_id = CAST(u.id AS CHAR)
    WHERE LOWER(u.school_code) = LOWER($1)
  `, [schoolCode]);
  const existingUsers = existingRes.rows || [];

  // Index existing users by key identifiers
  const userById = new Map();
  const studentByAdm = new Map();
  const staffByEmp = new Map();
  const userByUsername = new Map();
  const userByPhone = new Map();

  existingUsers.forEach(u => {
    if (u.id) userById.set(String(u.id), u);
    if (u.admission_no) studentByAdm.set(String(u.admission_no).toLowerCase().trim(), u);
    if (u.employee_id) staffByEmp.set(String(u.employee_id).toLowerCase().trim(), u);
    if (u.username) userByUsername.set(String(u.username).toLowerCase().trim(), u);
    if (u.phone) userByPhone.set(String(u.phone).trim(), u);
  });

  // Track duplicates within the CSV file
  const seenAdmissionInFile = new Map();
  const seenEmployeeInFile = new Map();
  const seenPhoneInFile = new Map();
  const seenUsernameInFile = new Map();

  const processedRows = [];
  const errors = [];
  const warnings = [];

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;
  let warningCount = 0;
  let reviewCount = 0;

  // Process data rows (1-indexed starting at row 2)
  for (let rIdx = 1; rIdx < parsedRows.length; rIdx++) {
    const rowNum = rIdx + 1;
    const rowValues = parsedRows[rIdx];
    const rawData = {};
    const normData = {};

    // Map columns
    rowValues.forEach((val, cIdx) => {
      const field = headerMap[cIdx];
      if (field) {
        rawData[field] = val ? String(val).trim() : '';
        normData[field] = val ? String(val).trim() : '';
      }
    });

    // Skip entirely empty row
    if (Object.values(rawData).every(v => v === '')) continue;

    const rowErrors = [];
    const rowWarnings = [];
    let rowStatus = 'pending'; // 'new', 'updated', 'unchanged', 'error', 'review'
    const fieldDiffs = [];

    // 1. Full Name check
    if (!normData.name) {
      rowErrors.push({ field: 'name', value: '', message: 'Full Name is required.' });
    }

    // 2. Role validation & normalization
    let role = (normData.role || 'student').toLowerCase().trim();
    if (['student', 'std', 'pupil'].includes(role)) role = 'student';
    else if (['teacher', 'faculty', 'instructor'].includes(role)) role = 'teacher';
    else if (['librarian', 'lib'].includes(role)) role = 'librarian';
    else if (['staff', 'employee'].includes(role)) role = 'staff';
    else if (['admin', 'school_admin'].includes(role)) role = 'admin';
    else if (['super_admin', 'superadmin', 'owner'].includes(role)) {
      rowErrors.push({
        field: 'role',
        value: normData.role,
        message: 'Security Restriction: School Admin cannot create Super Admin or Owner accounts through CSV.'
      });
    } else {
      rowErrors.push({ field: 'role', value: normData.role, message: `Invalid role '${normData.role}'. Supported roles: Student, Teacher, Librarian, Staff.` });
    }
    normData.role = role;

    // 3. School Code check (School Isolation)
    if (normData.school_code && normData.school_code.toUpperCase() !== schoolCode.toUpperCase()) {
      rowErrors.push({
        field: 'school_code',
        value: normData.school_code,
        message: `School isolation violation: Row specifies school '${normData.school_code}' which does not match your authorized school (${schoolCode}).`
      });
    }
    normData.school_code = schoolCode;

    // 4. Mobile validation & normalization
    let cleanPhone = null;
    if (normData.phone) {
      const mobRes = userService.normalizeMobile(normData.phone);
      if (mobRes.valid) {
        cleanPhone = mobRes.normalized;
        normData.phone = cleanPhone;
      } else {
        rowErrors.push({ field: 'phone', value: normData.phone, message: mobRes.error });
      }
    } else {
      // Phone is required for new users
      normData.phone = '';
    }

    // 5. Email normalization
    if (normData.email) {
      normData.email = normData.email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normData.email)) {
        rowErrors.push({ field: 'email', value: normData.email, message: 'Invalid email address format.' });
      }
    }

    // 6. DOB normalization
    if (normData.dob) {
      const normDob = normalizeDate(normData.dob);
      if (normDob) {
        normData.dob = normDob;
      } else {
        rowWarnings.push({ field: 'dob', value: normData.dob, message: `Could not parse date of birth '${normData.dob}'. Expected format: YYYY-MM-DD or DD-MM-YYYY.` });
        normData.dob = '';
      }
    }

    // 7. Role-specific ID validations
    if (role === 'student') {
      if (!normData.admission_no) {
        // Required for students
        rowErrors.push({ field: 'admission_no', value: '', message: 'Admission Number is required for students.' });
      }
    } else {
      if (!normData.employee_id) {
        rowErrors.push({ field: 'employee_id', value: '', message: `Employee ID is required for ${role}.` });
      }
    }

    // 8. Duplicate detection within the CSV file itself
    if (normData.admission_no) {
      const admKey = normData.admission_no.toLowerCase();
      if (seenAdmissionInFile.has(admKey)) {
        rowErrors.push({
          field: 'admission_no',
          value: normData.admission_no,
          message: `Duplicate Admission Number '${normData.admission_no}' detected within the CSV (already seen in row ${seenAdmissionInFile.get(admKey)}).`
        });
      } else {
        seenAdmissionInFile.set(admKey, rowNum);
      }
    }

    if (normData.employee_id) {
      const empKey = normData.employee_id.toLowerCase();
      if (seenEmployeeInFile.has(empKey)) {
        rowErrors.push({
          field: 'employee_id',
          value: normData.employee_id,
          message: `Duplicate Employee ID '${normData.employee_id}' detected within the CSV (already seen in row ${seenEmployeeInFile.get(empKey)}).`
        });
      } else {
        seenEmployeeInFile.set(empKey, rowNum);
      }
    }

    if (cleanPhone) {
      if (seenPhoneInFile.has(cleanPhone)) {
        rowWarnings.push({
          field: 'phone',
          value: cleanPhone,
          message: `Mobile number '${cleanPhone}' appears multiple times in the CSV (row ${seenPhoneInFile.get(cleanPhone)} and row ${rowNum}).`
        });
      } else {
        seenPhoneInFile.set(cleanPhone, rowNum);
      }
    }

    if (normData.username) {
      const userKey = normData.username.toLowerCase();
      if (seenUsernameInFile.has(userKey)) {
        rowErrors.push({
          field: 'username',
          value: normData.username,
          message: `Duplicate username '${normData.username}' detected within the CSV (already seen in row ${seenUsernameInFile.get(userKey)}).`
        });
      } else {
        seenUsernameInFile.set(userKey, rowNum);
      }
    }

    // 9. Existing Member Matching Priority
    let matchedUser = null;
    let matchType = null;

    if (normData.id && userById.has(String(normData.id))) {
      matchedUser = userById.get(String(normData.id));
      matchType = 'Member ID';
    } else if (normData.admission_no && studentByAdm.has(normData.admission_no.toLowerCase())) {
      matchedUser = studentByAdm.get(normData.admission_no.toLowerCase());
      matchType = 'Admission Number';
    } else if (normData.employee_id && staffByEmp.has(normData.employee_id.toLowerCase())) {
      matchedUser = staffByEmp.get(normData.employee_id.toLowerCase());
      matchType = 'Employee ID';
    } else if (normData.username && userByUsername.has(normData.username.toLowerCase())) {
      matchedUser = userByUsername.get(normData.username.toLowerCase());
      matchType = 'Username';
    }

    // Check for conflict: if matched by admission/emp ID, but mobile belongs to someone else
    if (matchedUser && cleanPhone && userByPhone.has(cleanPhone)) {
      const phoneOwner = userByPhone.get(cleanPhone);
      if (String(phoneOwner.id) !== String(matchedUser.id)) {
        rowWarnings.push({
          field: 'phone',
          value: cleanPhone,
          message: `CONFLICT: Mobile number '${cleanPhone}' currently belongs to existing user '${phoneOwner.name}' (#${phoneOwner.id}). Manual review required.`
        });
        rowStatus = 'review';
      }
    }

    // 10. Process Match vs New
    if (rowErrors.length > 0) {
      rowStatus = 'error';
      errorCount++;
    } else if (matchedUser) {
      // EXISTING MEMBER - Compare fields
      normData.matchedUserId = matchedUser.id;
      normData.matchType = matchType;

      const compareFields = [
        { key: 'name', label: 'Full Name', dbVal: matchedUser.name },
        { key: 'gender', label: 'Gender', dbVal: matchedUser.gender },
        { key: 'phone', label: 'Mobile', dbVal: matchedUser.phone },
        { key: 'email', label: 'Email', dbVal: matchedUser.email },
        { key: 'class', label: 'Class', dbVal: matchedUser.class || matchedUser.sp_class },
        { key: 'section', label: 'Section', dbVal: matchedUser.section || matchedUser.sp_section },
        { key: 'roll_no', label: 'Roll No', dbVal: matchedUser.roll_no || matchedUser.sp_roll_no },
        { key: 'academic_year', label: 'Academic Year', dbVal: matchedUser.academic_year },
        { key: 'father_name', label: 'Father Name', dbVal: matchedUser.father_name || matchedUser.sp_father_name },
        { key: 'mother_name', label: 'Mother Name', dbVal: matchedUser.mother_name || matchedUser.sp_mother_name },
        { key: 'dob', label: 'DOB', dbVal: matchedUser.dob || matchedUser.sp_dob },
        { key: 'address', label: 'Address', dbVal: matchedUser.address },
        { key: 'department', label: 'Department', dbVal: matchedUser.department || matchedUser.stf_department },
        { key: 'designation', label: 'Designation', dbVal: matchedUser.designation || matchedUser.stf_designation },
        { key: 'username', label: 'Username', dbVal: matchedUser.username }
      ];

      compareFields.forEach(f => {
        const csvVal = normData[f.key];
        const dbVal = f.dbVal || '';

        // CRITICAL BLANK VALUE RULE:
        // Blank CSV values must NOT erase existing data!
        if (!csvVal || csvVal.trim() === '') {
          if (dbVal && dbVal.trim() !== '') {
            rowWarnings.push({
              field: f.key,
              value: '',
              message: `${f.label} is blank in CSV. Existing value '${dbVal}' will be preserved.`
            });
          }
          // Do not treat blank as a diff
        } else if (String(csvVal).trim() !== String(dbVal).trim()) {
          fieldDiffs.push({
            field: f.key,
            label: f.label,
            oldValue: dbVal || '(empty)',
            newValue: String(csvVal).trim()
          });
        }
      });

      if (rowStatus !== 'review') {
        if (fieldDiffs.length > 0) {
          rowStatus = 'updated';
          updatedCount++;
        } else {
          rowStatus = 'unchanged';
          unchangedCount++;
        }
      } else {
        reviewCount++;
      }
    } else {
      // NEW MEMBER
      if (!normData.phone) {
        rowErrors.push({ field: 'phone', value: '', message: 'Mobile number is required for new members.' });
        rowStatus = 'error';
        errorCount++;
      } else {
        // Check if phone or username already belongs to a user globally
        if (userByPhone.has(normData.phone)) {
          const owner = userByPhone.get(normData.phone);
          rowWarnings.push({
            field: 'phone',
            value: normData.phone,
            message: `Mobile '${normData.phone}' already exists for member '${owner.name}' (#${owner.id}). Review required.`
          });
          rowStatus = 'review';
          reviewCount++;
        } else {
          rowStatus = 'new';
          newCount++;
        }
      }
    }

    if (rowWarnings.length > 0) {
      warningCount += rowWarnings.length;
    }

    processedRows.push({
      rowNumber: rowNum,
      status: rowStatus,
      action: rowStatus === 'new' ? 'create' : (rowStatus === 'updated' ? 'update' : rowStatus),
      name: normData.name || rawData.name || 'Unnamed',
      role: normData.role || 'student',
      admissionNo: normData.admission_no || '',
      employeeId: normData.employee_id || '',
      phone: normData.phone || '',
      email: normData.email || '',
      class: normData.class || '',
      section: normData.section || '',
      rawData,
      normData,
      fieldDiffs,
      diffs: fieldDiffs,
      errors: rowErrors,
      errorMessages: rowErrors.map(e => e.message || String(e)),
      warnings: rowWarnings,
      warningMessages: rowWarnings.map(w => w.message || String(w)),
      matchedUser: matchedUser ? { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role } : null,
      matchedUserId: matchedUser ? matchedUser.id : null
    });

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map(e => ({ rowNumber: rowNum, name: normData.name, ...e })));
    }
    if (rowWarnings.length > 0) {
      warnings.push(...rowWarnings.map(w => ({ rowNumber: rowNum, name: normData.name, ...w })));
    }
  }

  // Generate unique batch ID
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const batchId = `IMP-${dateStr}-${randomSuffix}`;

  const stagedData = {
    success: true,
    batchId,
    schoolCode,
    adminUserId: adminUser ? (adminUser.user_id || adminUser.id) : null,
    fileName: fileName || 'members.csv',
    createdAt: new Date().toISOString(),
    totalRows: parsedRows.length - 1,
    newCount,
    updatedCount,
    unchangedCount,
    errorCount,
    warningCount,
    reviewCount,
    summary: {
      totalRows: parsedRows.length - 1,
      toCreate: newCount,
      toUpdate: updatedCount,
      unchanged: unchangedCount,
      errors: errorCount,
      warnings: warningCount,
      review: reviewCount
    },
    rows: processedRows,
    processedRows,
    errors,
    warnings
  };

  // Cache in server memory for 1 hour
  stagedImportsCache.set(batchId, stagedData);
  setTimeout(() => stagedImportsCache.delete(batchId), 60 * 60 * 1000);

  return stagedData;
}

/**
 * 4. Transactional Import Execution (Admin Confirmation Stage)
 */
async function commitMemberImport({ batchId, schoolCode, adminUser, options = {} }) {
  const staged = stagedImportsCache.get(batchId);
  if (!staged) {
    throw new Error('Import session expired or batch not found. Please upload the CSV again.');
  }

  if (staged.committed) {
    throw new Error('This import batch has already been committed.');
  }

  if (staged.schoolCode.toUpperCase() !== schoolCode.toUpperCase()) {
    throw new Error('Security Violation: Batch does not belong to your authorized school.');
  }

  const rowsToApply = staged.processedRows.filter(r => r.status === 'new' || r.status === 'updated');
  if (rowsToApply.length === 0 && staged.unchangedCount === 0) {
    throw new Error('No valid new or updated records found in this batch to commit.');
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const executionErrors = [];

  // Begin Atomic Database Transaction
  await db.query('BEGIN TRANSACTION');

  try {
    for (const item of staged.processedRows) {
      if (item.status === 'error') {
        skippedCount++;
        continue;
      }
      if (item.status === 'unchanged') {
        skippedCount++;
        continue;
      }
      if (item.status === 'review' && !options.includeReviewRows) {
        skippedCount++;
        continue;
      }

      const d = item.normData;

      if (item.status === 'new') {
        // Create new member via canonical userService.createUser
        const defaultPassword = `Librika@${String(d.phone || '2026').slice(-4)}`;
        const createPayload = {
          user_type: d.role,
          name: d.name,
          gender: d.gender || 'Other',
          phone: d.phone,
          email: d.email || null,
          address: d.address || null,
          school_code: schoolCode,
          username: d.username || (d.admission_no || d.employee_id || d.phone),
          password: defaultPassword,
          // Student fields
          admission_no: d.admission_no || null,
          roll_no: d.roll_no || null,
          class: d.class || null,
          section: d.section || null,
          academic_year: d.academic_year || '2026-2027',
          father_name: d.father_name || null,
          mother_name: d.mother_name || null,
          dob: d.dob || null,
          // Employee fields
          employee_id: d.employee_id || null,
          department: d.department || null,
          designation: d.designation || null
        };

        const createdResult = await userService.createUser(createPayload, {
          user_id: adminUser ? adminUser.user_id : 'admin',
          school_code: schoolCode,
          role: adminUser ? adminUser.role : 'admin',
          module: 'csv_import'
        });

        // Audit log with batch ID
        await userService.logAuditChange({
          changed_by: adminUser ? adminUser.user_id : 'admin',
          target_user_id: createdResult.id,
          school_code: schoolCode,
          field_name: 'CSV_IMPORT_CREATE',
          old_value: null,
          new_value: `Created via CSV Import [Batch: ${batchId}]`,
          module: 'csv_import'
        });

        createdCount++;
      } else if (item.status === 'updated') {
        // Update existing member via canonical userService.updateUserProfile
        // CRITICAL RULE: only update non-blank fields!
        const updatePayload = {};
        item.fieldDiffs.forEach(diff => {
          updatePayload[diff.field] = diff.newValue;
        });

        const targetUserId = d.matchedUserId;
        await userService.updateUserProfile(targetUserId, updatePayload, {
          user_id: adminUser ? adminUser.user_id : 'admin',
          school_code: schoolCode,
          role: adminUser ? adminUser.role : 'admin',
          module: 'csv_import'
        });

        // Audit log with batch ID
        await userService.logAuditChange({
          changed_by: adminUser ? adminUser.user_id : 'admin',
          target_user_id: targetUserId,
          school_code: schoolCode,
          field_name: 'CSV_IMPORT_UPDATE',
          old_value: JSON.stringify(item.fieldDiffs.map(f => `${f.label}: ${f.oldValue}`)),
          new_value: JSON.stringify(item.fieldDiffs.map(f => `${f.label}: ${f.newValue}`)),
          module: 'csv_import'
        });

        updatedCount++;
      }
    }

    // Commit transaction
    await db.query('COMMIT');

    // Audit summary log
    await userService.logAuditChange({
      changed_by: adminUser ? adminUser.user_id : 'admin',
      target_user_id: 'SYSTEM',
      school_code: schoolCode,
      field_name: 'CSV_IMPORT_BATCH_COMPLETED',
      old_value: null,
      new_value: `Batch ${batchId} committed: Created ${createdCount}, Updated ${updatedCount}, Skipped ${skippedCount}`,
      module: 'csv_import'
    });

  } catch (err) {
    // Transaction failure: ROLLBACK immediately!
    await db.query('ROLLBACK');
    console.error('CSV import transaction rolled back:', err);
    throw new Error(`Import failed during database transaction: ${err.message}. All changes have been safely rolled back.`);
  }

  // Mark committed to prevent replay while keeping data for error reporting
  staged.committed = true;

  return {
    success: true,
    batchId,
    createdCount,
    updatedCount,
    unchangedCount: staged.unchangedCount,
    skippedCount,
    totalRows: staged.totalRows,
    results: {
      created: createdCount,
      updated: updatedCount,
      unchanged: staged.unchangedCount,
      errors: skippedCount,
      total: staged.totalRows
    },
    message: `Import complete. ${createdCount} new members created, ${updatedCount} members updated, ${staged.unchangedCount} unchanged members preserved. Zero existing records deleted.`
  };
}

/**
 * 5. Download Error Report CSV for a Staged Batch
 */
function generateErrorReportCsv(batchId) {
  const staged = stagedImportsCache.get(batchId);
  if (!staged) throw new Error('Staged batch not found or expired.');

  const headers = [
    { key: 'rowNumber', label: 'Row Number' },
    { key: 'name', label: 'Member Name' },
    { key: 'field', label: 'Field' },
    { key: 'value', label: 'Invalid Value' },
    { key: 'message', label: 'Error Description' },
    { key: 'action', label: 'Recommended Action' }
  ];

  const errorRows = [];
  staged.processedRows.forEach(r => {
    if (r.errors && r.errors.length > 0) {
      r.errors.forEach(e => {
        errorRows.push({
          rowNumber: r.rowNumber,
          name: r.name,
          field: e.field || 'General',
          value: e.value !== undefined ? e.value : '',
          message: e.message,
          action: 'Correct this value in the CSV and re-import'
        });
      });
    }
  });

  return objectsToCsv(headers, errorRows);
}

module.exports = {
  getMemberCsvTemplate,
  exportMembersCsv,
  parseAndValidateMemberCsv,
  commitMemberImport,
  generateErrorReportCsv,
  normalizeDate,
  parseCsvContent,
  stagedImportsCache
};

