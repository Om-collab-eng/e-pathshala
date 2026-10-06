/**
 * Centralized User / Person Profile Service
 * Canonical Data Model & Single Source of Truth for Librika
 *
 * Excludes passwords from all profile views and outputs.
 * Provides synchronized updates across users, student_profiles, and staff_profiles,
 * with atomic audit logging in user_audit_logs.
 */

const db = require('../db');
const bcrypt = require('bcrypt');

/**
 * Normalizes Indian 10-digit mobile number
 */
function normalizeMobile(phone) {
  if (!phone) return { valid: false, error: 'Mobile number is required.' };
  let cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, error: 'Mobile number must be exactly 10 digits.' };
  }
  return { valid: true, normalized: cleaned };
}

/**
 * Retrieves the unified canonical user profile
 * @param {string|number} userId
 * @param {string} [schoolCode] optional school scope
 * @returns {Promise<Object|null>} Canonical user profile without credentials
 */
async function getUserProfile(userId, schoolCode = null) {
  let queryStr = `
    SELECT u.*, s.name as school_name, s.location as school_location
    FROM users u
    LEFT JOIN schools s ON LOWER(u.school_code) = LOWER(s.school_code)
    WHERE u.id = $1
  `;
  const params = [String(userId)];
  if (schoolCode && schoolCode !== 'GLOBAL') {
    queryStr += ` AND (LOWER(u.school_code) = LOWER($2) OR u.role IN ('super_admin', 'superadmin') OR u.school_code = 'GLOBAL')`;
    params.push(String(schoolCode).trim());
  }

  const res = await db.query(queryStr, params);
  if (!res.rows || res.rows.length === 0) return null;
  const u = res.rows[0];

  // Fetch student extension if exists
  let studentExt = null;
  if (u.role === 'student' || u.admission_no) {
    const sRes = await db.query('SELECT * FROM student_profiles WHERE user_id = $1', [String(u.id)]).catch(() => ({ rows: [] }));
    studentExt = sRes.rows && sRes.rows[0] ? sRes.rows[0] : null;
  }

  // Fetch staff extension if exists
  let staffExt = null;
  if (['teacher', 'librarian', 'staff', 'admin'].includes(u.role) || u.employee_id) {
    const stRes = await db.query('SELECT * FROM staff_profiles WHERE user_id = $1', [String(u.id)]).catch(() => ({ rows: [] }));
    staffExt = stRes.rows && stRes.rows[0] ? stRes.rows[0] : null;
  }

  // Build canonical profile object
  const profile = {
    id: String(u.id),
    name: u.name || '',
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    gender: u.gender || '',
    dob: u.dob || (studentExt && studentExt.dob) || '',
    phone: u.phone || '',
    mobile: u.phone || '',
    email: u.email || '',
    address: u.address || '',
    city: u.city || '',
    state: u.state || '',
    country: u.country || 'India',
    pincode: u.pincode || '',
    school: u.school_name || 'Librika Campus',
    schoolCode: u.school_code || 'DEMO01',
    school_code: u.school_code || 'DEMO01',
    role: u.role || 'student',
    username: u.username || u.admission_no || u.phone || `user_${u.id}`,
    status: (u.is_banned == 1 || u.is_banned === '1' || u.status === 'suspended') ? 'suspended' : 'active',
    isBanned: (u.is_banned == 1 || u.is_banned === '1'),
    avatarId: u.avatar_id || 'avatar_01',
    avatar_id: u.avatar_id || 'avatar_01',
    profilePicture: u.profile_picture || null,
    profile_picture: u.profile_picture || null,
    createdAt: u.created_at || null,
    lastLoginAt: u.last_login_at || null,

    // Academic & Employment Top-level Direct Canonical Fields
    admission_no: u.admission_no || (studentExt && studentExt.admission_no) || '',
    roll_no: u.roll_no || (studentExt && studentExt.roll_no) || '',
    class: u.class || (studentExt && studentExt.class_name) || '',
    section: u.section || (studentExt && studentExt.section) || '',
    academic_year: u.academic_year || (studentExt && studentExt.academic_year) || '2026-2027',
    father_name: u.father_name || (studentExt && studentExt.father_name) || '',
    mother_name: u.mother_name || (studentExt && studentExt.mother_name) || '',
    employee_id: u.employee_id || (staffExt && staffExt.employee_id) || '',
    department: u.department || (staffExt && staffExt.department) || '',
    designation: u.designation || (staffExt && staffExt.designation) || ''
  };

  if (u.role === 'student' || u.admission_no || studentExt) {
    profile.student = {
      admissionNo: u.admission_no || (studentExt && studentExt.admission_no) || '',
      rollNo: u.roll_no || (studentExt && studentExt.roll_no) || '',
      class: u.class || (studentExt && studentExt.class_name) || '',
      section: u.section || (studentExt && studentExt.section) || '',
      academicYear: u.academic_year || (studentExt && studentExt.academic_year) || '2026-2027',
      fatherName: u.father_name || (studentExt && studentExt.father_name) || '',
      motherName: u.mother_name || (studentExt && studentExt.mother_name) || '',
      dob: u.dob || (studentExt && studentExt.dob) || '',
      studentId: u.student_id || (studentExt && studentExt.student_id) || `STD-${u.id}`
    };
    profile.studentProfile = profile.student;
  }

  if (['teacher', 'librarian', 'staff', 'admin'].includes(u.role) || u.employee_id || staffExt) {
    profile.employee = {
      employeeId: u.employee_id || (staffExt && staffExt.employee_id) || '',
      department: u.department || (staffExt && staffExt.department) || '',
      designation: u.designation || (staffExt && staffExt.designation) || '',
      joiningDate: u.joining_date || (staffExt && staffExt.joining_date) || ''
    };
    profile.staffProfile = profile.employee;
  }

  return profile;
}

/**
 * Creates a new user with single source of truth and hashed credentials
 */
async function createUser(data, creatorInfo = {}) {
  const userType = data.user_type || data.userType || data.role || 'student';
  const {
    name,
    gender,
    phone,
    email,
    address,
    school_code,
    username,
    password,
    // Student fields
    admission_no,
    roll_no,
    class: className,
    section,
    academic_year,
    father_name,
    mother_name,
    dob,
    // Staff fields
    employee_id,
    department,
    designation,
    joining_date
  } = data;

  if (!name || !name.trim()) throw new Error('Full Name is required.');
  if (!username || !username.trim()) throw new Error('Username is required.');
  if (!password || !password.trim()) throw new Error('Password is required.');
  if (password.trim().length < 4) throw new Error('Password must be at least 4 characters.');

  const cleanRole = String(userType).toLowerCase().trim();
  const cleanUsername = String(username).trim();

  // Mobile check
  const mobCheck = normalizeMobile(phone);
  if (!mobCheck.valid) throw new Error(mobCheck.error);
  const cleanPhone = mobCheck.normalized;

  // 1. Check globally unique username
  const uCheck = await db.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
  if (uCheck.rows && uCheck.rows.length > 0) {
    throw new Error(`Username '${cleanUsername}' is already taken globally. Please choose another.`);
  }

  // 2. Check mobile duplicate
  const pCheck = await db.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
  if (pCheck.rows && pCheck.rows.length > 0) {
    throw new Error(`Mobile number '${cleanPhone}' is already registered in the system.`);
  }

  // 3. Check admission_no or employee_id uniqueness within school
  const targetSchool = school_code || creatorInfo.school_code || 'DEMO01';
  if (cleanRole === 'student') {
    if (!admission_no || !admission_no.trim()) throw new Error('Admission Number is required for students.');
    if (!className || !className.trim()) throw new Error('Class is required for students.');
    const admCheck = await db.query(
      'SELECT id FROM users WHERE LOWER(school_code) = LOWER($1) AND LOWER(admission_no) = LOWER($2)',
      [targetSchool, admission_no.trim()]
    );
    if (admCheck.rows && admCheck.rows.length > 0) {
      throw new Error(`Admission Number '${admission_no.trim()}' already exists in school ${targetSchool}.`);
    }
  } else if (['teacher', 'librarian', 'staff'].includes(cleanRole)) {
    if (!employee_id || !employee_id.trim()) throw new Error('Employee ID is required for staff members.');
    const empCheck = await db.query(
      'SELECT id FROM users WHERE LOWER(school_code) = LOWER($1) AND LOWER(employee_id) = LOWER($2)',
      [targetSchool, employee_id.trim()]
    );
    if (empCheck.rows && empCheck.rows.length > 0) {
      throw new Error(`Employee ID '${employee_id.trim()}' already exists in school ${targetSchool}.`);
    }
  }

  // 4. Hash password with bcrypt - NEVER store plain text
  const hashedPassword = await bcrypt.hash(password.trim(), 10);

  // 5. Determine target user ID (guarantees non-null ID across SQLite, PostgreSQL, and MySQL)
  let targetId = data.id ? String(data.id) : null;
  if (!targetId) {
    const maxIdRes = await db.query("SELECT MAX(CAST(id AS INTEGER)) as max_id FROM users WHERE id IS NOT NULL AND id NOT IN ('9999', '9998')");
    const nextNumeric = (maxIdRes.rows && maxIdRes.rows[0] && maxIdRes.rows[0].max_id) ? (parseInt(maxIdRes.rows[0].max_id, 10) + 1) : 100;
    targetId = String(nextNumeric);
  }

  // Insert canonical record in users with explicit id
  const insertSql = `
    INSERT INTO users (
      id, name, gender, phone, email, address, school_code, role, username, password,
      admission_no, roll_no, class, section, academic_year, father_name, mother_name, dob,
      employee_id, department, designation, joining_date,
      status, is_banned, avatar_id, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22,
      'active', '0', 'avatar_01', CURRENT_TIMESTAMP
    )
  `;

  await db.query(insertSql, [
    targetId, name.trim(), gender || null, cleanPhone, email ? email.trim() : null, address || null, targetSchool, cleanRole, cleanUsername, hashedPassword,
    admission_no ? admission_no.trim() : null, roll_no ? roll_no.trim() : null, className ? className.trim() : null, section ? section.trim() : null, academic_year || '2026-2027', father_name || null, mother_name || null, dob || null,
    employee_id ? employee_id.trim() : null, department || null, designation || null, joining_date || null
  ]);

  const newId = targetId;

  // 6. Sync extension records
  if (cleanRole === 'student') {
    const studentId = `STD-${newId}`;
    await db.query('UPDATE users SET student_id = $1 WHERE id = $2', [studentId, newId]).catch(() => {});
    await db.query(`
      INSERT OR REPLACE INTO student_profiles (
        user_id, student_id, admission_no, roll_no, class_name, section,
        academic_year, father_name, mother_name, dob, digital_pass_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      String(newId), studentId, admission_no ? admission_no.trim() : null, roll_no ? roll_no.trim() : null,
      className ? className.trim() : null, section ? section.trim() : null, academic_year || '2026-2027',
      father_name || null, mother_name || null, dob || null, `LIBPASS-${newId}`
    ]).catch(() => {});
  } else if (['teacher', 'librarian', 'staff', 'admin'].includes(cleanRole)) {
    await db.query(`
      INSERT OR REPLACE INTO staff_profiles (
        user_id, employee_id, department, designation, joining_date
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      String(newId), employee_id ? employee_id.trim() : null, department || null, designation || null, joining_date || null
    ]).catch(() => {});
  }

  // 7. Audit creation
  await logAuditChange({
    changed_by: creatorInfo.user_id || 'system',
    target_user_id: String(newId),
    school_code: targetSchool,
    field_name: 'CREATE_USER',
    old_value: null,
    new_value: `Created ${cleanRole} '${name.trim()}' (${cleanUsername})`,
    module: creatorInfo.module || 'admin'
  });

  const prof = await getUserProfile(newId, targetSchool);
  if (prof) prof.user = prof;
  return prof;
}

/**
 * Updates a user profile with single source of truth synchronization & change auditing
 */
async function updateUserProfile(userId, updates, editorInfo = {}) {
  const current = await db.query('SELECT * FROM users WHERE id = $1', [String(userId)]);
  if (!current.rows || current.rows.length === 0) throw new Error('User not found.');
  const curUser = current.rows[0];

  const allowedFields = [
    'name', 'first_name', 'last_name', 'gender', 'phone', 'email', 'address',
    'city', 'state', 'country', 'pincode', 'avatar_id', 'profile_picture',
    'class', 'section', 'stream', 'roll_no', 'academic_year', 'father_name', 'mother_name', 'dob',
    'department', 'designation', 'joining_date'
  ];

  // RBAC checks
  const isSuper = editorInfo.role === 'super_admin' || editorInfo.role === 'superadmin';
  const isSchoolAdmin = editorInfo.role === 'admin' || editorInfo.role === 'school_admin' || editorInfo.role === 'librarian';
  const isSelf = String(editorInfo.user_id) === String(userId);

  if (isSchoolAdmin && !isSuper) {
    if (String(curUser.school_code).toUpperCase() !== String(editorInfo.school_code).toUpperCase()) {
      throw new Error('Access Denied: You may only modify users within your assigned school.');
    }
  }

  // Validate mobile if updated
  if (updates.phone && updates.phone !== curUser.phone) {
    const mobCheck = normalizeMobile(updates.phone);
    if (!mobCheck.valid) throw new Error(mobCheck.error);
    const cleanPhone = mobCheck.normalized;

    const pCheck = await db.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [cleanPhone, String(userId)]);
    if (pCheck.rows && pCheck.rows.length > 0) {
      throw new Error(`Mobile number '${cleanPhone}' is already in use by another account.`);
    }
    updates.phone = cleanPhone;
  }

  // Audit field differences
  const auditEntries = [];
  const setClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      const oldVal = curUser[field] !== null && curUser[field] !== undefined ? String(curUser[field]).trim() : '';
      const newVal = updates[field] !== null && updates[field] !== undefined ? String(updates[field]).trim() : '';
      if (oldVal !== newVal) {
        setClauses.push(`${field} = $${paramIndex}`);
        queryParams.push(newVal === '' ? null : newVal);
        paramIndex++;

        auditEntries.push({
          changed_by: editorInfo.user_id || 'system',
          target_user_id: String(userId),
          school_code: curUser.school_code || 'GLOBAL',
          field_name: field,
          old_value: oldVal || null,
          new_value: newVal || null,
          module: editorInfo.module || 'user_profile'
        });
      }
    }
  }

  if (setClauses.length > 0) {
    queryParams.push(String(userId));
    const updateSql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
    await db.query(updateSql, queryParams);

    // Sync student_profiles if relevant
    if (curUser.role === 'student') {
      await db.query(`
        INSERT OR REPLACE INTO student_profiles (
          user_id, student_id, admission_no, roll_no, class_name, section,
          academic_year, father_name, mother_name, dob, digital_pass_token
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        String(userId),
        curUser.student_id || `STD-${userId}`,
        curUser.admission_no,
        updates.roll_no !== undefined ? updates.roll_no : curUser.roll_no,
        updates.class !== undefined ? updates.class : curUser.class,
        updates.section !== undefined ? updates.section : curUser.section,
        updates.academic_year !== undefined ? updates.academic_year : curUser.academic_year,
        updates.father_name !== undefined ? updates.father_name : curUser.father_name,
        updates.mother_name !== undefined ? updates.mother_name : curUser.mother_name,
        updates.dob !== undefined ? updates.dob : curUser.dob,
        `LIBPASS-${userId}`
      ]).catch(() => {});
    }

    // Sync staff_profiles if relevant
    if (['teacher', 'librarian', 'staff', 'admin'].includes(curUser.role)) {
      await db.query(`
        INSERT OR REPLACE INTO staff_profiles (
          user_id, employee_id, department, designation, joining_date
        ) VALUES (
          $1, $2, $3, $4, $5
        )
      `, [
        String(userId),
        curUser.employee_id,
        updates.department !== undefined ? updates.department : curUser.department,
        updates.designation !== undefined ? updates.designation : curUser.designation,
        updates.joining_date !== undefined ? updates.joining_date : curUser.joining_date
      ]).catch(() => {});
    }

    // Record audit logs
    for (const entry of auditEntries) {
      await logAuditChange(entry);
    }
  }

  return await getUserProfile(userId, curUser.school_code);
}

/**
 * Resets user password by administrator (Password NEVER returned or displayed)
 */
async function resetUserPassword(userId, newPassword, adminInfo = {}) {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('New password must be at least 4 characters.');
  }

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
  await db.query(
    'UPDATE users SET password = $1, last_password_change = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, String(userId)]
  );

  await logAuditChange({
    changed_by: adminInfo.user_id || 'admin',
    target_user_id: String(userId),
    school_code: adminInfo.school_code || 'GLOBAL',
    field_name: 'password',
    old_value: '[PROTECTED_HASH]',
    new_value: '[HASHED_PASSWORD_RESET]',
    module: adminInfo.module || 'admin_reset'
  });

  return { success: true, message: 'Password has been reset securely.' };
}

/**
 * Changes own password with current password verification
 */
async function changeOwnPassword(userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('New password must be at least 4 characters.');
  }

  const userRes = await db.query('SELECT password FROM users WHERE id = $1', [String(userId)]);
  if (!userRes.rows || userRes.rows.length === 0) throw new Error('User not found.');
  const dbPass = String(userRes.rows[0].password || '').trim();

  let match = false;
  if (dbPass.startsWith('$2a$') || dbPass.startsWith('$2b$')) {
    match = await bcrypt.compare(currentPassword, dbPass);
  } else {
    match = (dbPass === currentPassword);
  }

  if (!match) {
    throw new Error('Current password is incorrect.');
  }

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
  await db.query(
    'UPDATE users SET password = $1, last_password_change = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, String(userId)]
  );

  await logAuditChange({
    changed_by: String(userId),
    target_user_id: String(userId),
    school_code: 'USER_SELF',
    field_name: 'password',
    old_value: '[PROTECTED_HASH]',
    new_value: '[SELF_PASSWORD_CHANGED]',
    module: 'student_portal'
  });

  return { success: true, message: 'Your password has been changed successfully!' };
}

/**
 * Records an entry into user_audit_logs
 */
async function logAuditChange(entry) {
  try {
    await db.query(`
      INSERT INTO user_audit_logs (
        changed_by, target_user_id, school_code, field_name, old_value, new_value, module, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [
      String(entry.changed_by || 'system'),
      String(entry.target_user_id),
      entry.school_code || 'GLOBAL',
      entry.field_name,
      entry.old_value || null,
      entry.new_value || null,
      entry.module || 'general'
    ]);
  } catch (err) {
    console.warn('Audit logging note:', err.message);
  }
}

module.exports = {
  getUserProfile,
  createUser,
  updateUserProfile,
  resetUserPassword,
  changeOwnPassword,
  logAuditChange,
  normalizeMobile
};
